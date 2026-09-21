// Parsing helpers for IEP service minutes and delivered session time.
//
// `students.service_minutes` is a free-text field filled in from IEPs, so it
// arrives in many shapes: "60 MPW", "SI- 30 MPW, LI- 30 MPW", "30 mins weekly",
// "120 MPM", "Consult", "450 per quarter. Approx 1-2xs/week". We only track
// WEEKLY requirements here — monthly (MPM), quarterly and consult-only entries
// return null, meaning "not tracked" rather than "zero minutes owed".
//
// When the text can't be read confidently, `students.required_minutes_per_week`
// can be set by hand and always wins.

export interface WeeklyRequirement {
  /** Required minutes per week, or null when we can't determine one. */
  minutes: number | null;
  /** Which input was consulted — drives whether we show a "set this" hint. */
  source: "override" | "iep" | "student" | "none";
  /**
   * Why nothing was parsed. Lets the UI explain itself instead of silently
   * dropping a student out of the report.
   */
  reason?: "consult" | "monthly" | "unrecognized" | "empty";
  /** The text the answer was read from, for display alongside the number. */
  text?: string;
}

export interface WeeklyRequirementInput {
  /** `service_minutes` on the student's CURRENT IEP record — authoritative. */
  iepText?: string | null;
  /** `students.service_minutes` — the older import field, used as a fallback. */
  studentText?: string | null;
  /** `students.required_minutes_per_week` — a hand-set value that beats both. */
  override?: number | null;
}

/** Matches "30 MPW", "30 mins weekly", "30 min/week", "30 minutes per week". */
const WEEKLY_PATTERNS: RegExp[] = [
  /(\d{1,3})\s*(?:mpw|m\.p\.w\.?)/gi,
  /(\d{1,3})\s*(?:mins?|minutes?)?\s*(?:\/|per\s+|a\s+)?\s*(?:week|weekly|wk)/gi,
];

/** Matches monthly forms so we can distinguish "monthly" from "unreadable". */
const MONTHLY_PATTERN = /(\d{1,3})\s*(?:mpm|m\.p\.m\.?|mins?\s*\/\s*mo|minutes?\s*\/\s*mo|\/\s*mo\b|per\s+month|monthly)/i;

const CONSULT_PATTERN = /consult/i;

/**
 * Find weekly minute figures with their positions, de-duplicating overlapping
 * matches from the two patterns (e.g. "30 MPW" would otherwise be read twice).
 *
 * Every figure found gets summed by the caller, which matters for split
 * services: "SI- 30 MPW, LI- 30 MPW" is a student owed 30 minutes of speech
 * AND 30 of language — 60 minutes of contact time a week in total. The two
 * services aren't tracked separately yet; the total is what the report checks.
 */
function collectWeeklyMatches(text: string): { value: number; start: number; end: number }[] {
  const matches: { value: number; start: number; end: number }[] = [];
  for (const pattern of WEEKLY_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const n = parseInt(m[1], 10);
      if (!Number.isFinite(n) || n <= 0 || n > 600) continue;
      matches.push({ value: n, start: m.index, end: m.index + m[0].length });
    }
  }
  // Drop any match whose number position is already covered by an earlier one,
  // so the same figure isn't counted twice by two patterns.
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: { value: number; start: number; end: number }[] = [];
  for (const m of matches) {
    if (kept.some((k) => m.start < k.end && m.end > k.start)) continue;
    kept.push(m);
  }
  return kept;
}

/** Read one service-minutes string. Does not decide which string to read. */
function readText(text: string): { minutes: number | null; reason?: WeeklyRequirement["reason"] } {
  const weekly = collectWeeklyMatches(text);
  if (weekly.length > 0) {
    return { minutes: weekly.reduce((sum, m) => sum + m.value, 0) };
  }
  if (MONTHLY_PATTERN.test(text)) return { minutes: null, reason: "monthly" };
  if (CONSULT_PATTERN.test(text)) return { minutes: null, reason: "consult" };
  return { minutes: null, reason: "unrecognized" };
}

/**
 * Work out a student's weekly required minutes.
 *
 * Precedence is deliberate:
 *   1. A hand-set `required_minutes_per_week` always wins.
 *   2. Otherwise the CURRENT IEP's service minutes, which is the field kept up
 *      to date as IEPs are revised.
 *   3. Only if that is blank, `students.service_minutes` — the original import
 *      field, which goes stale once an IEP is edited.
 *
 * Note that a current IEP saying "Consult" is an ANSWER, not a blank: it means
 * no weekly direct service, and we must not fall through to a stale student
 * record still claiming "30 MPW". Falling through there would flag a
 * consult-only student as short every week.
 *
 * Anything we can't read weekly minutes out of returns null, and the caller
 * leaves that student out of the shortfall report rather than inventing one.
 */
export function getWeeklyRequirement(input: WeeklyRequirementInput): WeeklyRequirement {
  const { iepText, studentText, override } = input;

  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return { minutes: Math.round(override), source: "override" };
  }

  const iep = (iepText || "").trim();
  if (iep) return { ...readText(iep), source: "iep", text: iep };

  const student = (studentText || "").trim();
  if (student) return { ...readText(student), source: "student", text: student };

  return { minutes: null, source: "none", reason: "empty" };
}

/** Sessions logged before we captured per-session time are assumed standard 30s. */
const DEFAULT_SESSION_MINUTES = 30;

/**
 * Length of a single session in minutes, read from the free-text `service_time`.
 *
 * Handles "9:00-9:30", "9:00 AM – 9:45 AM", "9-9:30 am", plus bare durations
 * like "30 min" or "45m". Work hours are 8am–3pm, so a bare hour of 1–3 with no
 * AM/PM is read as afternoon (matching the Schedule grid's own rule).
 *
 * Returns DEFAULT_SESSION_MINUTES when there's no readable time, because a
 * session with a missing time is nearly always a standard 30 — counting it as
 * zero would raise a shortfall that isn't real.
 */
export function getSessionMinutes(serviceTime: string | null | undefined): number {
  const raw = (serviceTime || "").trim().toLowerCase().replace(/[–—]/g, "-");
  if (!raw) return DEFAULT_SESSION_MINUTES;

  const timeToken = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/;
  const rangeRe = new RegExp(`${timeToken.source}\\s*-\\s*${timeToken.source}`, "i");
  const m = raw.match(rangeRe);
  if (m) {
    const toMinutes = (h: string, mm: string | undefined, ap: string | undefined, otherAp: string | undefined) => {
      let hr = parseInt(h, 10);
      const min = mm ? parseInt(mm, 10) : 0;
      const ampm = (ap || otherAp || "").replace(/\./g, "").toLowerCase();
      if (ampm.startsWith("p") && hr < 12) hr += 12;
      else if (ampm.startsWith("a") && hr === 12) hr = 0;
      else if (!ampm && hr >= 1 && hr <= 3) hr += 12;
      return hr * 60 + min;
    };
    const start = toMinutes(m[1], m[2], m[3], m[6]);
    let end = toMinutes(m[4], m[5], m[6], m[3]);
    if (end <= start) end += 12 * 60;
    const diff = end - start;
    if (diff > 0 && diff <= 8 * 60) return diff;
  }

  const bare = raw.match(/^(\d{1,3})\s*(?:m|min|mins|minute|minutes)?$/);
  if (bare) {
    const n = parseInt(bare[1], 10);
    if (n > 0 && n <= 8 * 60) return n;
  }

  return DEFAULT_SESSION_MINUTES;
}

/**
 * Shared report model for the quarterly export.
 *
 * Both the Excel and the Word exporters render from `buildStudentReport`,
 * so the two files always say the same thing. When the duration parser was
 * duplicated across two screens they drifted and a real absence stopped
 * counting its minutes -- the same mistake is easy to make with a report
 * that exists in two formats, so the data lives in one place here and the
 * exporters only do layout.
 */

export interface ReportGoal {
  id: string;
  goal_number: number;
  description: string;
  iep_year: string | null;
}

/** A session's attendance, already resolved to display text. */
export interface ReportAttendance {
  /** "Attended", "Student absent", ... */
  label: string;
  /** Free text Rachel entered (the activity name, "sick", ...), if any. */
  reason: string | null;
  /** False for a no-show of any kind. Drives the shaded row in Word. */
  occurred: boolean;
}

export type ReportRow =
  | {
      kind: "session";
      /** Locale-formatted date. */
      date: string;
      attendance: ReportAttendance;
      /**
       * One entry per goal in `StudentReport.goals`, in the same order.
       * Each is the list of lines for that cell -- a session can hold
       * several data points for one goal. `[]` means nothing was recorded.
       */
      goalCells: string[][];
      /**
       * Where the session happened: "Push-in -- Ms. Rivera, Room 214", or
       * "Pull-out -- Room 134". Empty for a session that did not happen.
       * Only rendered when the student has push-in sessions in the period.
       */
      setting: string;
      notes: string;
    }
  | {
      kind: "iep-separator";
      /** e.g. "New IEP starts: 2026-2027" */
      label: string;
    };

export interface StudentReport {
  goals: ReportGoal[];
  rows: ReportRow[];
  /** Student / IEP facts for the block above the table. */
  headerFields: { label: string; value: string }[];
  /** e.g. "22 attended (2 make-up), 3 student absent" */
  attendanceSummary: string;
  /**
   * True when at least one session in the period was push-in. Most students
   * are pull-out throughout, and a column repeating "Pull-out" on every row
   * would cost width that the goal columns need, so the exporters add the
   * Setting column only for the students it tells you something about.
   */
  hasPushIn: boolean;
}

/** Minimal shape the builder needs; the real rows carry more columns. */
export interface ReportSessionGoalInput {
  goal?: { id: string; goal_number: number; description: string; iep_year: string | null } | null;
  correct_count?: number | null;
  total_count?: number | null;
  percentage?: number | null;
  target?: string | null;
  performance_level?: string | null;
  notes?: string | null;
}

export interface ReportSessionInput {
  date: string;
  occurred?: boolean | null;
  no_show_type?: string | null;
  no_show_reason?: string | null;
  is_makeup?: boolean | null;
  iep_year?: string | null;
  notes?: string | null;
  service_type?: string | null;
  /** The session form calls this "Teacher name / room number". */
  push_in_notes?: string | null;
  session_goals?: ReportSessionGoalInput[] | null;
}

export interface ReportStudentInput {
  name: string;
  student_number?: string | null;
  date_of_birth?: string | null;
  grade?: string | null;
  teacher?: string | null;
  eligibility?: string | null;
  service_minutes?: string | null;
  iep_date?: string | null;
  iep_re_eval_date?: string | null;
  school?: { name?: string | null } | null;
}

/** Shown when a session recorded no data for a goal. */
export const NO_DATA = "—";

const NO_SHOW_LABELS: Record<string, string> = {
  student_absent: "Student absent",
  school_activity: "School activity",
  school_closure: "School closure",
};

function localDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString();
}

function attendanceFor(session: ReportSessionInput): ReportAttendance {
  const reason = (session.no_show_reason || "").trim() || null;
  if (session.occurred === false) {
    const label = (session.no_show_type && NO_SHOW_LABELS[session.no_show_type]) || "Did not occur";
    return { label, reason, occurred: false };
  }
  return {
    label: session.is_makeup ? "Attended (make-up)" : "Attended",
    reason,
    occurred: true,
  };
}

function settingFor(session: ReportSessionInput): string {
  // A session that did not happen has no setting worth printing; whatever
  // service_type it carries is just the form default.
  if (session.occurred === false) return "";
  const where = (session.push_in_notes || "").trim();
  const label = session.service_type === "push_in" ? "Push-in" : "Pull-out";
  return where ? `${label} \u2014 ${where}` : label;
}

/**
 * Format one data point as:
 *   [target:] correct/total (%) [-- performance level] [-- notes]
 * An entry with nothing but a trial count still reads correctly; one with
 * nothing at all falls back to a dash rather than an empty line.
 */
function dataPointText(sg: ReportSessionGoalInput): string {
  const target = (sg.target || "").trim();
  const perf = (sg.performance_level || "").trim();
  const notes = (sg.notes || "").trim();
  const total = Number(sg.total_count) || 0;
  const parts: string[] = [];
  if (target) parts.push(`${target}:`);
  if (total > 0) {
    parts.push(`${sg.correct_count}/${sg.total_count} (${sg.percentage}%)`);
  } else if (!target && !notes && !perf) {
    parts.push(NO_DATA);
  }
  if (perf) parts.push(`— ${perf}`);
  if (notes) parts.push(`— ${notes}`);
  return parts.join(" ");
}

/** Age in years and months at `asOf`, for the report header. */
function ageLabel(dobIso: string, asOfIso: string): string {
  const dob = new Date(dobIso + "T00:00:00");
  const ref = new Date(asOfIso + "T00:00:00");
  let years = ref.getFullYear() - dob.getFullYear();
  let months = ref.getMonth() - dob.getMonth();
  if (ref.getDate() < dob.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return `${dob.toLocaleDateString()} (Age ${years} yr ${months} mo)`;
}

export function buildStudentReport(
  student: ReportStudentInput,
  sessions: ReportSessionInput[],
  dateFrom: string,
  dateTo: string
): StudentReport {
  // Every distinct goal actually worked on during the period. Matched by
  // goal.id, not goal_number -- a student can have goals across several IEP
  // years that share numbers.
  const goalMap = new Map<string, ReportGoal>();
  for (const session of sessions) {
    for (const sg of session.session_goals || []) {
      const g = sg.goal;
      if (g && g.id && !goalMap.has(g.id)) goalMap.set(g.id, g);
    }
  }
  // Older IEP year first, then goal number. Goals with no year sort last.
  const goals = Array.from(goalMap.values()).sort((a, b) => {
    const ay = a.iep_year ?? "";
    const by = b.iep_year ?? "";
    if (ay !== by) {
      if (!ay) return 1;
      if (!by) return -1;
      return ay.localeCompare(by);
    }
    return (a.goal_number ?? 0) - (b.goal_number ?? 0);
  });

  // Rows in date order, with a separator wherever the IEP year changes so
  // the reader can see exactly where the new IEP took effect.
  const rows: ReportRow[] = [];
  let prevIepYear: string | null | undefined = undefined;
  for (const session of sessions) {
    const iepYear = session.iep_year ?? null;
    if (prevIepYear !== undefined && prevIepYear !== iepYear) {
      rows.push({
        kind: "iep-separator",
        label: iepYear ? `New IEP starts: ${iepYear}` : "Current IEP",
      });
    }
    prevIepYear = iepYear;

    rows.push({
      kind: "session",
      date: localDate(session.date),
      attendance: attendanceFor(session),
      goalCells: goals.map((g) =>
        (session.session_goals || [])
          .filter((sg) => sg.goal?.id === g.id)
          .map(dataPointText)
      ),
      setting: settingFor(session),
      notes: (session.notes || "").trim(),
    });
  }

  const tally = {
    attended: 0,
    makeup: 0,
    student_absent: 0,
    school_activity: 0,
    school_closure: 0,
    other: 0,
  };
  for (const session of sessions) {
    if (session.occurred === false) {
      if (session.no_show_type === "student_absent") tally.student_absent += 1;
      else if (session.no_show_type === "school_activity") tally.school_activity += 1;
      else if (session.no_show_type === "school_closure") tally.school_closure += 1;
      else tally.other += 1;
    } else {
      tally.attended += 1;
      if (session.is_makeup) tally.makeup += 1;
    }
  }
  const summaryParts = [
    `${tally.attended} attended${tally.makeup > 0 ? ` (${tally.makeup} make-up)` : ""}`,
  ];
  if (tally.student_absent > 0) summaryParts.push(`${tally.student_absent} student absent`);
  if (tally.school_activity > 0) summaryParts.push(`${tally.school_activity} school activity`);
  if (tally.school_closure > 0) summaryParts.push(`${tally.school_closure} school closure`);
  if (tally.other > 0) summaryParts.push(`${tally.other} did not occur`);
  const attendanceSummary = summaryParts.join(", ");

  const fmt = (iso: string | null | undefined) => (iso ? localDate(iso) : "");

  const headerFields = [
    { label: "Student", value: student.name },
    { label: "Student #", value: student.student_number || "" },
    {
      label: "Date of Birth",
      value: student.date_of_birth ? ageLabel(student.date_of_birth, dateTo) : "",
    },
    { label: "Grade", value: student.grade || "" },
    { label: "Teacher", value: student.teacher || "" },
    { label: "School", value: student.school?.name || "" },
    { label: "Eligibility", value: student.eligibility || "" },
    { label: "Service Minutes", value: student.service_minutes || "" },
    { label: "IEP Date", value: fmt(student.iep_date) },
    { label: "IEP Re-Eval Date", value: fmt(student.iep_re_eval_date) },
    { label: "Report Period", value: `${localDate(dateFrom)} — ${localDate(dateTo)}` },
    { label: "Attendance", value: attendanceSummary },
  ];

  const hasPushIn = sessions.some(
    (s) => s.occurred !== false && s.service_type === "push_in"
  );

  return { goals, rows, headerFields, attendanceSummary, hasPushIn };
}

/** Column heading for a goal, e.g. "Goal 2 [IEP 2025-2026]: Produce /s/...". */
export function goalColumnLabel(goal: ReportGoal): string {
  const yearLabel = goal.iep_year ? ` [IEP ${goal.iep_year}]` : "";
  return `Goal ${goal.goal_number}${yearLabel}: ${goal.description}`;
}

/** The attendance cell as a single string, for formats without rich cells. */
export function attendanceText(a: ReportAttendance): string {
  return a.reason ? `${a.label}\n${a.reason}` : a.label;
}

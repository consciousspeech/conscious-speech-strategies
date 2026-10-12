/**
 * Spotting a session that has already been logged.
 *
 * Nothing stopped the same session being entered twice: in five cases across
 * the database the same student, date and time was logged in two separate
 * sittings hours or days apart, each time with a different goal's data, which
 * quietly doubled that day's delivered minutes. The form can't refuse the
 * second entry -- a student genuinely can be seen twice in a day, and a
 * make-up often sits beside the session it replaces -- so it warns instead,
 * and asks for confirmation only when the time matches too.
 */

/**
 * Reduce a free-text service time to something two entries can be compared on.
 * The field is typed by hand, so "8:45-9:15", "8:45 – 9:15" and
 * "8:45-9:15 AM" all have to come out the same.
 */
export function normalizeServiceTime(raw: string | null | undefined): string {
  return (raw || "")
    .toLowerCase()
    // en dash, em dash, minus sign and friends all mean "to" here
    .replace(/[‐-―−]/g, "-")
    .replace(/(\d)\s*([ap])\.?\s*m\.?(?![a-z])/g, "$1")
    .replace(/[\s.]/g, "");
}

/**
 * Whether two sessions are for the same slot. Two entries that both left the
 * time blank count as the same slot: that is unusual enough on one day to be
 * worth a confirmation.
 */
export function sameServiceTime(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeServiceTime(a) === normalizeServiceTime(b);
}

export interface ExistingSession {
  id: string;
  service_time: string | null;
  occurred: boolean;
  no_show_type: string | null;
  created_at: string;
  enteredByName?: string | null;
  goalCount: number;
}

/** The already-logged sessions that occupy the same time slot. */
export function matchingSlot(existing: ExistingSession[], serviceTime: string): ExistingSession[] {
  return existing.filter((s) => sameServiceTime(s.service_time, serviceTime));
}

/** How a logged session reads in the warning: "9:15-9:45, student absent". */
export function describeExisting(session: ExistingSession): string {
  const parts: string[] = [];
  parts.push(session.service_time?.trim() || "no time recorded");
  if (!session.occurred) {
    parts.push(
      session.no_show_type === "student_absent" ? "student absent"
        : session.no_show_type === "school_activity" ? "school activity"
        : session.no_show_type === "school_closure" ? "school closure"
        : "did not occur"
    );
  } else {
    parts.push(
      session.goalCount === 0
        ? "no goal data"
        : `${session.goalCount} goal ${session.goalCount === 1 ? "entry" : "entries"}`
    );
  }
  return parts.join(", ");
}

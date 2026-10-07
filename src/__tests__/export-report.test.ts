import { describe, it, expect } from "vitest";
import {
  NO_DATA,
  attendanceText,
  buildStudentReport,
  goalColumnLabel,
  type ReportSessionInput,
  type ReportStudentInput,
} from "@/lib/export-report";

const student: ReportStudentInput = {
  name: "Jane Doe",
  student_number: "12345",
  date_of_birth: "2018-03-10",
  grade: "2",
  teacher: "Ms. Smith",
  eligibility: "SI",
  service_minutes: "60 MPW",
  iep_date: "2026-03-04",
  iep_re_eval_date: "2029-03-04",
  school: { name: "Gulfport Elementary" },
};

const goalA = { id: "a", goal_number: 1, description: "Produce /s/ in sentences", iep_year: null };
const goalB = { id: "b", goal_number: 2, description: "Follow 2-step directions", iep_year: null };

function session(over: Partial<ReportSessionInput> & { date: string }): ReportSessionInput {
  return { occurred: true, session_goals: [], ...over };
}

function sessionRows(sessions: ReportSessionInput[]) {
  return buildStudentReport(student, sessions, "2026-09-01", "2026-09-30").rows;
}

describe("attendance labels", () => {
  it("labels an attended session", () => {
    const [row] = sessionRows([session({ date: "2026-09-01" })]);
    expect(row.kind === "session" && row.attendance).toEqual({
      label: "Attended",
      reason: null,
      occurred: true,
    });
  });

  it("marks a make-up session", () => {
    const [row] = sessionRows([session({ date: "2026-09-01", is_makeup: true })]);
    expect(row.kind === "session" && row.attendance.label).toBe("Attended (make-up)");
  });

  it("labels each kind of no-show", () => {
    const rows = sessionRows([
      session({ date: "2026-09-01", occurred: false, no_show_type: "student_absent" }),
      session({ date: "2026-09-02", occurred: false, no_show_type: "school_activity" }),
      session({ date: "2026-09-03", occurred: false, no_show_type: "school_closure" }),
    ]);
    expect(rows.map((r) => (r.kind === "session" ? r.attendance.label : ""))).toEqual([
      "Student absent",
      "School activity",
      "School closure",
    ]);
  });

  it("falls back when a no-show has no recorded type", () => {
    const [row] = sessionRows([session({ date: "2026-09-01", occurred: false, no_show_type: null })]);
    expect(row.kind === "session" && row.attendance).toMatchObject({
      label: "Did not occur",
      occurred: false,
    });
  });

  it("carries the reason text and ignores whitespace-only reasons", () => {
    const rows = sessionRows([
      session({ date: "2026-09-01", occurred: false, no_show_type: "school_activity", no_show_reason: "Field trip" }),
      session({ date: "2026-09-02", occurred: false, no_show_type: "student_absent", no_show_reason: "   " }),
    ]);
    expect(rows[0].kind === "session" && rows[0].attendance.reason).toBe("Field trip");
    expect(rows[1].kind === "session" && rows[1].attendance.reason).toBeNull();
  });

  it("renders the reason on a second line for flat formats", () => {
    expect(attendanceText({ label: "Student absent", reason: "Sick", occurred: false })).toBe(
      "Student absent\nSick"
    );
    expect(attendanceText({ label: "Attended", reason: null, occurred: true })).toBe("Attended");
  });
});

describe("attendance summary", () => {
  it("totals every category, listing only non-zero ones", () => {
    const report = buildStudentReport(
      student,
      [
        session({ date: "2026-09-01" }),
        session({ date: "2026-09-02", is_makeup: true }),
        session({ date: "2026-09-03", occurred: false, no_show_type: "student_absent" }),
        session({ date: "2026-09-04", occurred: false, no_show_type: "student_absent" }),
        session({ date: "2026-09-05", occurred: false, no_show_type: "school_activity" }),
      ],
      "2026-09-01",
      "2026-09-30"
    );
    expect(report.attendanceSummary).toBe(
      "2 attended (1 make-up), 2 student absent, 1 school activity"
    );
  });

  it("omits the make-up count when there are none", () => {
    const report = buildStudentReport(student, [session({ date: "2026-09-01" })], "2026-09-01", "2026-09-30");
    expect(report.attendanceSummary).toBe("1 attended");
  });

  it("reports zero attended for a period of nothing but absences", () => {
    const report = buildStudentReport(
      student,
      [session({ date: "2026-09-01", occurred: false, no_show_type: "school_closure" })],
      "2026-09-01",
      "2026-09-30"
    );
    expect(report.attendanceSummary).toBe("0 attended, 1 school closure");
  });

  it("appears in the header fields", () => {
    const report = buildStudentReport(student, [session({ date: "2026-09-01" })], "2026-09-01", "2026-09-30");
    const field = report.headerFields.find((f) => f.label === "Attendance");
    expect(field?.value).toBe("1 attended");
  });
});

describe("goals", () => {
  it("collects only goals actually worked on, in order", () => {
    const report = buildStudentReport(
      student,
      [
        session({ date: "2026-09-02", session_goals: [{ goal: goalB, total_count: 5, correct_count: 4, percentage: 80 }] }),
        session({ date: "2026-09-01", session_goals: [{ goal: goalA, total_count: 10, correct_count: 8, percentage: 80 }] }),
      ],
      "2026-09-01",
      "2026-09-30"
    );
    expect(report.goals.map((g) => g.goal_number)).toEqual([1, 2]);
  });

  it("keeps goals from different IEP years apart even when numbers collide", () => {
    const oldGoal = { id: "old", goal_number: 1, description: "Old wording", iep_year: "2025-2026" };
    const report = buildStudentReport(
      student,
      [
        session({ date: "2026-09-01", iep_year: "2025-2026", session_goals: [{ goal: oldGoal, total_count: 4, correct_count: 2, percentage: 50 }] }),
        session({ date: "2026-09-10", session_goals: [{ goal: goalA, total_count: 10, correct_count: 9, percentage: 90 }] }),
      ],
      "2026-09-01",
      "2026-09-30"
    );
    expect(report.goals).toHaveLength(2);
    // Older IEP year sorts first; the current (null) year sorts last.
    expect(report.goals.map((g) => g.iep_year)).toEqual(["2025-2026", null]);
    expect(goalColumnLabel(report.goals[0])).toBe("Goal 1 [IEP 2025-2026]: Old wording");
    expect(goalColumnLabel(report.goals[1])).toBe("Goal 1: Produce /s/ in sentences");
  });

  it("gives an empty cell list for a goal with no data that session", () => {
    const report = buildStudentReport(
      student,
      [
        session({ date: "2026-09-01", session_goals: [{ goal: goalA, total_count: 10, correct_count: 8, percentage: 80 }] }),
        session({ date: "2026-09-02", session_goals: [{ goal: goalB, total_count: 5, correct_count: 4, percentage: 80 }] }),
      ],
      "2026-09-01",
      "2026-09-30"
    );
    const rows = report.rows.filter((r) => r.kind === "session");
    expect(rows[0].kind === "session" && rows[0].goalCells).toEqual([["8/10 (80%)"], []]);
    expect(rows[1].kind === "session" && rows[1].goalCells).toEqual([[], ["4/5 (80%)"]]);
  });

  it("stacks multiple data points for one goal in one session", () => {
    const report = buildStudentReport(
      student,
      [
        session({
          date: "2026-09-01",
          session_goals: [
            { goal: goalA, target: "initial /s/", total_count: 10, correct_count: 8, percentage: 80 },
            { goal: goalA, target: "final /s/", total_count: 10, correct_count: 6, percentage: 60 },
          ],
        }),
      ],
      "2026-09-01",
      "2026-09-30"
    );
    const [row] = report.rows;
    expect(row.kind === "session" && row.goalCells[0]).toEqual([
      "initial /s/: 8/10 (80%)",
      "final /s/: 6/10 (60%)",
    ]);
  });

  it("includes performance level and goal notes", () => {
    const report = buildStudentReport(
      student,
      [
        session({
          date: "2026-09-01",
          session_goals: [
            {
              goal: goalA,
              target: "initial /s/",
              total_count: 10,
              correct_count: 8,
              percentage: 80,
              performance_level: "minimal cues",
              notes: "improving",
            },
          ],
        }),
      ],
      "2026-09-01",
      "2026-09-30"
    );
    const [row] = report.rows;
    expect(row.kind === "session" && row.goalCells[0][0]).toBe(
      "initial /s/: 8/10 (80%) — minimal cues — improving"
    );
  });

  it("falls back to a dash for a data point holding nothing", () => {
    const report = buildStudentReport(
      student,
      [session({ date: "2026-09-01", session_goals: [{ goal: goalA, total_count: 0, correct_count: 0 }] })],
      "2026-09-01",
      "2026-09-30"
    );
    const [row] = report.rows;
    expect(row.kind === "session" && row.goalCells[0]).toEqual([NO_DATA]);
  });
});

describe("IEP separators", () => {
  it("marks the transition into the current IEP", () => {
    const rows = sessionRows([
      session({ date: "2026-09-01", iep_year: "2025-2026" }),
      session({ date: "2026-09-10", iep_year: null }),
    ]);
    expect(rows.map((r) => r.kind)).toEqual(["session", "iep-separator", "session"]);
    expect(rows[1].kind === "iep-separator" && rows[1].label).toBe("Current IEP");
  });

  it("names the incoming IEP year", () => {
    const rows = sessionRows([
      session({ date: "2026-09-01", iep_year: null }),
      session({ date: "2026-09-10", iep_year: "2026-2027" }),
    ]);
    expect(rows[1].kind === "iep-separator" && rows[1].label).toBe("New IEP starts: 2026-2027");
  });

  it("adds no separator when the IEP year never changes", () => {
    const rows = sessionRows([
      session({ date: "2026-09-01" }),
      session({ date: "2026-09-08" }),
      session({ date: "2026-09-15" }),
    ]);
    expect(rows.every((r) => r.kind === "session")).toBe(true);
  });
});

describe("header fields", () => {
  it("computes age in years and months as of the period end", () => {
    const report = buildStudentReport(student, [], "2026-09-01", "2026-09-30");
    const dob = report.headerFields.find((f) => f.label === "Date of Birth");
    expect(dob?.value).toContain("Age 8 yr 6 mo");
  });

  it("leaves the DOB field blank rather than inventing an age", () => {
    const report = buildStudentReport({ ...student, date_of_birth: null }, [], "2026-09-01", "2026-09-30");
    expect(report.headerFields.find((f) => f.label === "Date of Birth")?.value).toBe("");
  });

  it("covers every field the report header shows", () => {
    const report = buildStudentReport(student, [], "2026-09-01", "2026-09-30");
    expect(report.headerFields.map((f) => f.label)).toEqual([
      "Student",
      "Student #",
      "Date of Birth",
      "Grade",
      "Teacher",
      "School",
      "Eligibility",
      "Service Minutes",
      "IEP Date",
      "IEP Re-Eval Date",
      "Report Period",
      "Attendance",
    ]);
  });
});

describe("push-in setting", () => {
  it("flags a period containing a push-in session", () => {
    const report = buildStudentReport(
      student,
      [
        session({ date: "2026-09-01", service_type: "pull_out" }),
        session({ date: "2026-09-08", service_type: "push_in", push_in_notes: "McNeff rm. 231" }),
      ],
      "2026-09-01",
      "2026-09-30"
    );
    expect(report.hasPushIn).toBe(true);
  });

  it("leaves a pull-out-only period unflagged, so no column is added", () => {
    const report = buildStudentReport(
      student,
      [session({ date: "2026-09-01", service_type: "pull_out", push_in_notes: "Room 134" })],
      "2026-09-01",
      "2026-09-30"
    );
    expect(report.hasPushIn).toBe(false);
  });

  it("does not count a push-in session the student missed", () => {
    const report = buildStudentReport(
      student,
      [session({ date: "2026-09-01", service_type: "push_in", occurred: false, no_show_type: "student_absent" })],
      "2026-09-01",
      "2026-09-30"
    );
    expect(report.hasPushIn).toBe(false);
  });

  it("prints the teacher and room beside the service type", () => {
    const rows = sessionRows([
      session({ date: "2026-09-01", service_type: "push_in", push_in_notes: "Ms. Rivera \u2014 Room 214" }),
      session({ date: "2026-09-08", service_type: "pull_out", push_in_notes: "Room 134" }),
    ]);
    expect(rows.map((r) => (r.kind === "session" ? r.setting : ""))).toEqual([
      "Push-in \u2014 Ms. Rivera \u2014 Room 214",
      "Pull-out \u2014 Room 134",
    ]);
  });

  it("still names the service type when no room was recorded", () => {
    const rows = sessionRows([
      session({ date: "2026-09-01", service_type: "push_in" }),
      session({ date: "2026-09-08", service_type: "pull_out", push_in_notes: "   " }),
    ]);
    expect(rows.map((r) => (r.kind === "session" ? r.setting : ""))).toEqual(["Push-in", "Pull-out"]);
  });

  it("leaves the setting blank for a session that did not happen", () => {
    const [row] = sessionRows([
      session({ date: "2026-09-01", service_type: "push_in", push_in_notes: "Room 214", occurred: false, no_show_type: "school_closure" }),
    ]);
    expect(row.kind === "session" && row.setting).toBe("");
  });

  it("treats a session with no recorded service type as pull-out", () => {
    const [row] = sessionRows([session({ date: "2026-09-01", push_in_notes: "Room 134" })]);
    expect(row.kind === "session" && row.setting).toBe("Pull-out \u2014 Room 134");
  });
});

describe("empty period", () => {
  it("produces no rows and no goals when nothing was logged", () => {
    const report = buildStudentReport(student, [], "2026-09-01", "2026-09-30");
    expect(report.rows).toEqual([]);
    expect(report.goals).toEqual([]);
    expect(report.attendanceSummary).toBe("0 attended");
  });
});

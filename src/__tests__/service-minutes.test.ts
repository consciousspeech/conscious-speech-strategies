import { describe, it, expect } from "vitest";
import { getWeeklyRequirement, getSessionMinutes } from "@/lib/service-minutes";

// Every string below is a real `service_minutes` value from the production
// students table, so this suite doubles as a record of what the field
// actually contains.

describe("getWeeklyRequirement — plain weekly entries", () => {
  it("reads the common MPW forms", () => {
    expect(getWeeklyRequirement({ studentText: "60 MPW" }).minutes).toBe(60);
    expect(getWeeklyRequirement({ studentText: "30 MPW" }).minutes).toBe(30);
    expect(getWeeklyRequirement({ studentText: "45 MPW" }).minutes).toBe(45);
  });

  it("is case and spacing tolerant", () => {
    expect(getWeeklyRequirement({ studentText: "60mpw" }).minutes).toBe(60);
    expect(getWeeklyRequirement({ studentText: "  60   MPW  " }).minutes).toBe(60);
  });

  it("reads prose forms", () => {
    expect(getWeeklyRequirement({ studentText: "30 mins weekly" }).minutes).toBe(30);
    expect(getWeeklyRequirement({ studentText: "60 mins weekly" }).minutes).toBe(60);
  });

  it("reads a service-type prefix or suffix", () => {
    expect(getWeeklyRequirement({ studentText: "SI 30 MPW" }).minutes).toBe(30);
    expect(getWeeklyRequirement({ studentText: "30 MPW LI" }).minutes).toBe(30);
  });

  it("marks parsed values as parsed", () => {
    expect(getWeeklyRequirement({ studentText: "60 MPW" }).source).toBe("student");
  });
});

describe("getWeeklyRequirement — split services sum to a weekly total", () => {
  it("sums two weekly services", () => {
    expect(getWeeklyRequirement({ studentText: "SI- 30 MPW, LI- 30 MPW" }).minutes).toBe(60);
    expect(getWeeklyRequirement({ studentText: "ST: 30 MPW, LT: 30 MPW" }).minutes).toBe(60);
    expect(getWeeklyRequirement({ studentText: "30 MPW SI, LI 30 MPW" }).minutes).toBe(60);
  });

  it("counts only the weekly half of a mixed weekly/monthly entry", () => {
    expect(getWeeklyRequirement({ studentText: "45 MPW/180 MPM" }).minutes).toBe(45);
    expect(getWeeklyRequirement({ studentText: "45 MPW/ 180 MPM" }).minutes).toBe(45);
  });

  it("ignores a consult paired with a weekly service", () => {
    expect(getWeeklyRequirement({ studentText: "LI: 30 MPW SI: Consult" }).minutes).toBe(30);
  });

  it("does not double-count a single figure", () => {
    // "30 mins weekly" could match both patterns; it must still be 30.
    expect(getWeeklyRequirement({ studentText: "30 mins weekly" }).minutes).toBe(30);
  });
});

describe("getWeeklyRequirement — entries we deliberately do not track", () => {
  it("returns null for monthly-only entries", () => {
    for (const v of ["60 MPM", "120 MPM", "90 MPM", "180 MPM", "80 MPM", "30 MPM", "240 MPM", "SI: 120 MPM", "LI- 120 MPM", "SI- 60 MPM", "60 MPM, 60 MPM"]) {
      const r = getWeeklyRequirement({ studentText: v });
      expect(r.minutes, `${v} should not be tracked weekly`).toBeNull();
      expect(r.reason, `${v} should be flagged monthly`).toBe("monthly");
    }
  });

  it("returns null for other monthly phrasings", () => {
    expect(getWeeklyRequirement({ studentText: "ST: 120 min/mo" }).minutes).toBeNull();
    expect(getWeeklyRequirement({ studentText: "SI: 120/mo" }).minutes).toBeNull();
  });

  it("returns null for consult-only entries", () => {
    for (const v of ["Consult", "consult", "CONSULT", "Consult LI", "LI Consult", "SI Consult", "ST: consult"]) {
      const r = getWeeklyRequirement({ studentText: v });
      expect(r.minutes, `${v} should not be tracked`).toBeNull();
      expect(r.reason, `${v} should be flagged consult`).toBe("consult");
    }
  });

  it("returns null for empty or missing values", () => {
    expect(getWeeklyRequirement({ studentText: null }).reason).toBe("empty");
    expect(getWeeklyRequirement({ studentText: "" }).reason).toBe("empty");
    expect(getWeeklyRequirement({ studentText: "   " }).reason).toBe("empty");
  });

  it("flags genuinely unreadable text rather than guessing", () => {
    const r = getWeeklyRequirement({ studentText: "450 per quarter. Approx 1-2xs/week" });
    expect(r.minutes).toBeNull();
  });

  it("will not assume a period that the text never states", () => {
    // "30 mins SI" gives an amount but no weekly/monthly marker. Reading it as
    // weekly would invent a requirement, so it needs a manual override instead.
    expect(getWeeklyRequirement({ studentText: "30 mins SI" }).minutes).toBeNull();
  });
});

describe("getWeeklyRequirement — manual override", () => {
  it("wins over the parsed text", () => {
    const r = getWeeklyRequirement({ studentText: "60 MPW", override: 90 });
    expect(r.minutes).toBe(90);
    expect(r.source).toBe("override");
  });

  it("rescues an entry the parser cannot read", () => {
    const r = getWeeklyRequirement({ studentText: "450 per quarter. Approx 1-2xs/week", override: 35 });
    expect(r.minutes).toBe(35);
    expect(r.source).toBe("override");
  });

  it("is ignored when zero, negative or absent", () => {
    expect(getWeeklyRequirement({ studentText: "60 MPW", override: 0 }).source).toBe("student");
    expect(getWeeklyRequirement({ studentText: "60 MPW", override: -5 }).source).toBe("student");
    expect(getWeeklyRequirement({ studentText: "60 MPW" }).source).toBe("student");
  });
});

describe("getWeeklyRequirement — which record wins", () => {
  // These pairs are real conflicts between students.service_minutes and the
  // student's current IEP record. The IEP is the one kept current as IEPs are
  // revised, so it must win — reading the student record instead produced
  // wrong answers for live students.

  it("prefers the current IEP over a stale student record", () => {
    // Student record said monthly; the April IEP says 30 min weekly.
    const r = getWeeklyRequirement({ iepText: "30 MPW", studentText: "180 MPM" });
    expect(r.minutes).toBe(30);
    expect(r.source).toBe("iep");
  });

  it("does not over-report when the IEP reduced the minutes", () => {
    // Student record said 60; the May IEP says 30. Reading 60 would flag this
    // student as short every week despite being fully served.
    expect(getWeeklyRequirement({ iepText: "30 MPW", studentText: "60 MPW" }).minutes).toBe(30);
  });

  it("treats a consult-only IEP as an answer, not a blank", () => {
    // The critical case: falling back to the stale "30 MPW" here would flag a
    // consult-only student as owing 30 minutes a week, forever.
    const r = getWeeklyRequirement({ iepText: "Consult", studentText: "30 MPW" });
    expect(r.minutes).toBeNull();
    expect(r.reason).toBe("consult");
    expect(r.source).toBe("iep");
  });

  it("falls back to the student record when the IEP has no minutes recorded", () => {
    const r = getWeeklyRequirement({ iepText: "", studentText: "30 MPW SI, LI 30 MPW" });
    expect(r.minutes).toBe(60);
    expect(r.source).toBe("student");
  });

  it("falls back when the student has no IEP record at all", () => {
    const r = getWeeklyRequirement({ iepText: null, studentText: "60 MPW" });
    expect(r.minutes).toBe(60);
    expect(r.source).toBe("student");
  });

  it("lets a manual override beat both", () => {
    const r = getWeeklyRequirement({ iepText: "Consult", studentText: "30 MPW", override: 45 });
    expect(r.minutes).toBe(45);
    expect(r.source).toBe("override");
  });

  it("reports nothing when neither record has anything", () => {
    const r = getWeeklyRequirement({ iepText: null, studentText: null });
    expect(r.minutes).toBeNull();
    expect(r.source).toBe("none");
    expect(r.reason).toBe("empty");
  });

  it("returns the text it read, for display", () => {
    expect(getWeeklyRequirement({ iepText: "60 mpw", studentText: "60 MPW" }).text).toBe("60 mpw");
    expect(getWeeklyRequirement({ iepText: null, studentText: "60 MPW" }).text).toBe("60 MPW");
  });
});

describe("getSessionMinutes", () => {
  it("measures explicit time ranges", () => {
    expect(getSessionMinutes("9:00-9:30")).toBe(30);
    expect(getSessionMinutes("9:00 AM - 9:45 AM")).toBe(45);
    expect(getSessionMinutes("9:00–10:00 AM")).toBe(60);
    expect(getSessionMinutes("10:15-10:45 am")).toBe(30);
  });

  it("reads bare durations", () => {
    expect(getSessionMinutes("30 min")).toBe(30);
    expect(getSessionMinutes("45m")).toBe(45);
    expect(getSessionMinutes("60")).toBe(60);
  });

  it("treats an early bare hour as afternoon, matching the schedule grid", () => {
    // 1:00–1:30 PM, not 1:00–1:30 AM
    expect(getSessionMinutes("1:00-1:30")).toBe(30);
    expect(getSessionMinutes("2-2:30")).toBe(30);
  });

  it("falls back to a standard 30 when there is no readable time", () => {
    expect(getSessionMinutes(null)).toBe(30);
    expect(getSessionMinutes("")).toBe(30);
    expect(getSessionMinutes("morning")).toBe(30);
  });
});

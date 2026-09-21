import { describe, it, expect } from "vitest";
import { getWeeklyRequirement, getSessionMinutes } from "@/lib/service-minutes";

// Every string below is a real `service_minutes` value from the production
// students table, so this suite doubles as a record of what the field
// actually contains.

describe("getWeeklyRequirement — plain weekly entries", () => {
  it("reads the common MPW forms", () => {
    expect(getWeeklyRequirement("60 MPW", null).minutes).toBe(60);
    expect(getWeeklyRequirement("30 MPW", null).minutes).toBe(30);
    expect(getWeeklyRequirement("45 MPW", null).minutes).toBe(45);
  });

  it("is case and spacing tolerant", () => {
    expect(getWeeklyRequirement("60mpw", null).minutes).toBe(60);
    expect(getWeeklyRequirement("  60   MPW  ", null).minutes).toBe(60);
  });

  it("reads prose forms", () => {
    expect(getWeeklyRequirement("30 mins weekly", null).minutes).toBe(30);
    expect(getWeeklyRequirement("60 mins weekly", null).minutes).toBe(60);
  });

  it("reads a service-type prefix or suffix", () => {
    expect(getWeeklyRequirement("SI 30 MPW", null).minutes).toBe(30);
    expect(getWeeklyRequirement("30 MPW LI", null).minutes).toBe(30);
  });

  it("marks parsed values as parsed", () => {
    expect(getWeeklyRequirement("60 MPW", null).source).toBe("parsed");
  });
});

describe("getWeeklyRequirement — split services sum to a weekly total", () => {
  it("sums two weekly services", () => {
    expect(getWeeklyRequirement("SI- 30 MPW, LI- 30 MPW", null).minutes).toBe(60);
    expect(getWeeklyRequirement("ST: 30 MPW, LT: 30 MPW", null).minutes).toBe(60);
    expect(getWeeklyRequirement("30 MPW SI, LI 30 MPW", null).minutes).toBe(60);
  });

  it("counts only the weekly half of a mixed weekly/monthly entry", () => {
    expect(getWeeklyRequirement("45 MPW/180 MPM", null).minutes).toBe(45);
    expect(getWeeklyRequirement("45 MPW/ 180 MPM", null).minutes).toBe(45);
  });

  it("ignores a consult paired with a weekly service", () => {
    expect(getWeeklyRequirement("LI: 30 MPW SI: Consult", null).minutes).toBe(30);
  });

  it("does not double-count a single figure", () => {
    // "30 mins weekly" could match both patterns; it must still be 30.
    expect(getWeeklyRequirement("30 mins weekly", null).minutes).toBe(30);
  });
});

describe("getWeeklyRequirement — entries we deliberately do not track", () => {
  it("returns null for monthly-only entries", () => {
    for (const v of ["60 MPM", "120 MPM", "90 MPM", "180 MPM", "80 MPM", "30 MPM", "240 MPM", "SI: 120 MPM", "LI- 120 MPM", "SI- 60 MPM", "60 MPM, 60 MPM"]) {
      const r = getWeeklyRequirement(v, null);
      expect(r.minutes, `${v} should not be tracked weekly`).toBeNull();
      expect(r.reason, `${v} should be flagged monthly`).toBe("monthly");
    }
  });

  it("returns null for other monthly phrasings", () => {
    expect(getWeeklyRequirement("ST: 120 min/mo", null).minutes).toBeNull();
    expect(getWeeklyRequirement("SI: 120/mo", null).minutes).toBeNull();
  });

  it("returns null for consult-only entries", () => {
    for (const v of ["Consult", "consult", "CONSULT", "Consult LI", "LI Consult", "SI Consult", "ST: consult"]) {
      const r = getWeeklyRequirement(v, null);
      expect(r.minutes, `${v} should not be tracked`).toBeNull();
      expect(r.reason, `${v} should be flagged consult`).toBe("consult");
    }
  });

  it("returns null for empty or missing values", () => {
    expect(getWeeklyRequirement(null, null).reason).toBe("empty");
    expect(getWeeklyRequirement("", null).reason).toBe("empty");
    expect(getWeeklyRequirement("   ", null).reason).toBe("empty");
  });

  it("flags genuinely unreadable text rather than guessing", () => {
    const r = getWeeklyRequirement("450 per quarter. Approx 1-2xs/week", null);
    expect(r.minutes).toBeNull();
  });

  it("will not assume a period that the text never states", () => {
    // "30 mins SI" gives an amount but no weekly/monthly marker. Reading it as
    // weekly would invent a requirement, so it needs a manual override instead.
    expect(getWeeklyRequirement("30 mins SI", null).minutes).toBeNull();
  });
});

describe("getWeeklyRequirement — manual override", () => {
  it("wins over the parsed text", () => {
    const r = getWeeklyRequirement("60 MPW", 90);
    expect(r.minutes).toBe(90);
    expect(r.source).toBe("override");
  });

  it("rescues an entry the parser cannot read", () => {
    const r = getWeeklyRequirement("450 per quarter. Approx 1-2xs/week", 35);
    expect(r.minutes).toBe(35);
    expect(r.source).toBe("override");
  });

  it("is ignored when zero, negative or absent", () => {
    expect(getWeeklyRequirement("60 MPW", 0).source).toBe("parsed");
    expect(getWeeklyRequirement("60 MPW", -5).source).toBe("parsed");
    expect(getWeeklyRequirement("60 MPW", null).source).toBe("parsed");
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

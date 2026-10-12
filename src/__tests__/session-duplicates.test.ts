import { describe, it, expect } from "vitest";
import {
  describeExisting,
  matchingSlot,
  normalizeServiceTime,
  sameServiceTime,
  type ExistingSession,
} from "@/lib/session-duplicates";

function logged(over: Partial<ExistingSession> = {}): ExistingSession {
  return {
    id: "s1",
    service_time: "8:45-9:15",
    occurred: true,
    no_show_type: null,
    created_at: "2026-09-11T14:38:02Z",
    enteredByName: "Marisol Garcia",
    goalCount: 2,
    ...over,
  };
}

describe("normalizeServiceTime", () => {
  it("treats the different dashes people type as the same", () => {
    const forms = ["8:45-9:15", "8:45–9:15", "8:45—9:15", "8:45 − 9:15", "8:45 - 9:15"];
    const normalized = new Set(forms.map(normalizeServiceTime));
    expect(normalized.size).toBe(1);
  });

  it("ignores spacing, case and am/pm markers", () => {
    const forms = ["9:00-9:30", "9:00 – 9:30 AM", "9:00-9:30am", "9:00 - 9:30 a.m.", "  9:00-9:30  "];
    const normalized = new Set(forms.map(normalizeServiceTime));
    expect(normalized.size).toBe(1);
  });

  it("keeps genuinely different slots apart", () => {
    expect(normalizeServiceTime("11:15-11:45")).not.toBe(normalizeServiceTime("11:45-12:15"));
    expect(normalizeServiceTime("9:00-9:30")).not.toBe(normalizeServiceTime("9:00-9:45"));
  });

  it("maps every empty form to the same blank", () => {
    for (const v of [null, undefined, "", "   "]) {
      expect(normalizeServiceTime(v)).toBe("");
    }
  });
});

describe("sameServiceTime", () => {
  it("matches the real repeated entry from the Sep 11 pair", () => {
    expect(sameServiceTime("8:45-9:15", "8:45-9:15")).toBe(true);
  });

  it("matches across typing variations", () => {
    expect(sameServiceTime("10:45-11:15", "10:45 – 11:15 AM")).toBe(true);
  });

  it("does not match adjacent slots", () => {
    expect(sameServiceTime("11:15-11:45", "11:45-12:15")).toBe(false);
  });

  it("counts two untimed entries as the same slot", () => {
    expect(sameServiceTime(null, "")).toBe(true);
  });

  it("does not match a timed entry against an untimed one", () => {
    expect(sameServiceTime("8:45-9:15", "")).toBe(false);
  });
});

describe("matchingSlot", () => {
  const existing = [
    logged({ id: "a", service_time: "8:45-9:15" }),
    logged({ id: "b", service_time: "11:15-11:45" }),
  ];

  it("picks out only the clashing slot", () => {
    expect(matchingSlot(existing, "11:15-11:45").map((s) => s.id)).toEqual(["b"]);
  });

  it("returns nothing for a genuinely new slot, so a second session that day is not blocked", () => {
    expect(matchingSlot(existing, "1:00-1:30")).toEqual([]);
  });

  it("finds a clash despite different dash and casing", () => {
    expect(matchingSlot(existing, " 8:45 – 9:15 am ").map((s) => s.id)).toEqual(["a"]);
  });

  it("returns every entry already in that slot", () => {
    const twice = [...existing, logged({ id: "c", service_time: "8:45 - 9:15" })];
    expect(matchingSlot(twice, "8:45-9:15").map((s) => s.id)).toEqual(["a", "c"]);
  });
});

describe("describeExisting", () => {
  it("reports the time and how much data is on it", () => {
    expect(describeExisting(logged({ goalCount: 2 }))).toBe("8:45-9:15, 2 goal entries");
    expect(describeExisting(logged({ goalCount: 1 }))).toBe("8:45-9:15, 1 goal entry");
  });

  it("calls out a session carrying no data at all", () => {
    expect(describeExisting(logged({ goalCount: 0 }))).toBe("8:45-9:15, no goal data");
  });

  it("names the reason instead for a session that did not happen", () => {
    expect(describeExisting(logged({ occurred: false, no_show_type: "student_absent" })))
      .toBe("8:45-9:15, student absent");
    expect(describeExisting(logged({ occurred: false, no_show_type: "school_activity" })))
      .toBe("8:45-9:15, school activity");
    expect(describeExisting(logged({ occurred: false, no_show_type: null })))
      .toBe("8:45-9:15, did not occur");
  });

  it("says so when no time was recorded", () => {
    expect(describeExisting(logged({ service_time: null }))).toBe("no time recorded, 2 goal entries");
  });
});

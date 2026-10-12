import { describe, it, expect } from "vitest";
import { matchesStudentSearch, searchKey } from "@/lib/student-search";

const penelope = { name: "Penelope Crowne", student_number: "100245" };
const salvador = { name: "Salvador Galvan", student_number: "100987" };
const oBrien = { name: "Mary-Kate O'Brien", student_number: null };

describe("searchKey", () => {
  it("keeps only letters and digits, lower-cased", () => {
    expect(searchKey("Mary-Kate O'Brien")).toBe("marykateobrien");
    expect(searchKey("  100-245  ")).toBe("100245");
  });

  it("treats every empty form as empty", () => {
    for (const v of [null, undefined, "", "   ", "-- '' --"]) {
      expect(searchKey(v)).toBe("");
    }
  });
});

describe("matchesStudentSearch", () => {
  it("matches on any part of the name, in any case", () => {
    expect(matchesStudentSearch(penelope, "pen")).toBe(true);
    expect(matchesStudentSearch(penelope, "CROWNE")).toBe(true);
    expect(matchesStudentSearch(penelope, "lope cro")).toBe(true);
  });

  it("matches on the student number, whole or partial", () => {
    expect(matchesStudentSearch(penelope, "100245")).toBe(true);
    expect(matchesStudentSearch(penelope, "0245")).toBe(true);
    expect(matchesStudentSearch(penelope, "100-245")).toBe(true);
  });

  it("ignores apostrophes and hyphens on both sides", () => {
    expect(matchesStudentSearch(oBrien, "obrien")).toBe(true);
    expect(matchesStudentSearch(oBrien, "O'Brien")).toBe(true);
    expect(matchesStudentSearch(oBrien, "marykate")).toBe(true);
    expect(matchesStudentSearch(oBrien, "mary kate")).toBe(true);
  });

  it("does not match a different student", () => {
    expect(matchesStudentSearch(salvador, "penelope")).toBe(false);
    expect(matchesStudentSearch(salvador, "100245")).toBe(false);
  });

  it("matches everything on an empty or punctuation-only query", () => {
    for (const q of ["", "   ", "--"]) {
      expect(matchesStudentSearch(penelope, q)).toBe(true);
      expect(matchesStudentSearch(salvador, q)).toBe(true);
    }
  });

  it("copes with a student who has no number recorded", () => {
    expect(matchesStudentSearch(oBrien, "brien")).toBe(true);
    expect(matchesStudentSearch(oBrien, "100245")).toBe(false);
  });
});

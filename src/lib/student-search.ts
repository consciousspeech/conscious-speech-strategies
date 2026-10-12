/**
 * Matching students by what Rachel types into a search box.
 *
 * Names in the records carry apostrophes, hyphens and inconsistent spacing
 * ("O'Brien", "OBrien", "Mary-Kate"), so both sides are reduced to letters
 * and digits before comparing. That also lets a student number be typed with
 * or without its separators.
 */

/** Letters and digits only, lower-cased. */
export function searchKey(raw: string | null | undefined): string {
  return (raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Whether a student matches the query. An empty query matches everything. */
export function matchesStudentSearch(
  student: { name: string; student_number?: string | null },
  query: string
): boolean {
  const key = searchKey(query);
  if (!key) return true;
  return searchKey(`${student.name} ${student.student_number || ""}`).includes(key);
}

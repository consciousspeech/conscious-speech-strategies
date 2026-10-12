-- student_ieps row level security
--
-- The HIPAA RLS migration enabled row level security across the schema but
-- never mentioned student_ieps, and the table has RLS switched on with no
-- policies at all. Postgres denies everything in that state, so for the app
-- the table was effectively invisible AND unwritable:
--
--   * every SELECT came back empty, which is why edited IEP details never
--     appeared on the student page and the export fell back to the older
--     service-minutes figure on the student record;
--   * every INSERT or UPDATE failed with "new row violates row-level
--     security policy for table student_ieps".
--
-- Rows already in the table were written through the SQL editor, which runs
-- as the owner and bypasses RLS, so the table looked fine from there.
--
-- These policies mirror the ones on `goals`, which holds the same kind of
-- IEP content: staff may read the records for students in their own schools,
-- and only admins may change them.
--
-- The names are unquoted identifiers rather than the quoted, spaced style
-- used elsewhere purely so this file can be piped straight to the CLI from a
-- shell without the embedded quotes being mangled.

CREATE POLICY student_ieps_read_in_my_schools ON public.student_ieps FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id AND public.staff_can_access_school(s.school_id)
  )
);

CREATE POLICY student_ieps_admin_insert ON public.student_ieps FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY student_ieps_admin_update ON public.student_ieps FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY student_ieps_admin_delete ON public.student_ieps FOR DELETE TO authenticated
  USING (public.is_admin());

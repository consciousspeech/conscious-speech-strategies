-- HIPAA RLS lockdown (Phase B).
-- BEFORE RUNNING: assign every staff member to their schools via the
-- staff edit page. Otherwise they'll see no students, sessions, or hours.
--
-- This migration:
--   * drops all the "authenticated has full access" policies from every
--     PHI-carrying table
--   * replaces them with role- and school-scoped policies
--   * removes the anonymous-read policies on SMS tables (webhook uses
--     the service-role key and bypasses RLS)
--
-- Rollback plan is at the very bottom of this file.

-- ─── 1. Helper functions ────────────────────────────────────────────────
-- SECURITY DEFINER so the RLS policies can call them without recursion
-- against the profiles table's own policies.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.staff_can_access_school(target_school_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_schools
    WHERE profile_id = auth.uid() AND school_id = target_school_id
  );
$$;

-- ─── 2. Drop every permissive policy created by earlier migrations ──────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname LIKE 'Authenticated %' OR
        policyname LIKE 'Auth %' OR
        policyname LIKE 'Anon %'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ─── 3. profiles ────────────────────────────────────────────────────────
-- Names/roles are needed across the app for "entered_by" labels, so all
-- authenticated users can read. Only admins update anyone else's row.
CREATE POLICY "Read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Update own or admin profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin insert profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin delete profile" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── 4. schools ─────────────────────────────────────────────────────────
CREATE POLICY "Read schools" ON public.schools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert schools" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admin update schools" ON public.schools FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin delete schools" ON public.schools FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── 5. students ───────────────────────────────────────────────────────
CREATE POLICY "Read students in my schools" ON public.students FOR SELECT TO authenticated
  USING (public.is_admin() OR public.staff_can_access_school(school_id));
CREATE POLICY "Admin insert students" ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admin update students" ON public.students FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin delete students" ON public.students FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── 6. goals ──────────────────────────────────────────────────────────
CREATE POLICY "Read goals in my schools" ON public.goals FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id AND public.staff_can_access_school(s.school_id)
  )
);
CREATE POLICY "Admin insert goals" ON public.goals FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admin update goals" ON public.goals FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin delete goals" ON public.goals FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── 7. sessions ───────────────────────────────────────────────────────
CREATE POLICY "Read sessions in my schools" ON public.sessions FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id AND public.staff_can_access_school(s.school_id)
  )
);
CREATE POLICY "Insert sessions in my schools" ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR (
      entered_by = auth.uid() AND EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = student_id AND public.staff_can_access_school(s.school_id)
      )
    )
  );
CREATE POLICY "Update own sessions" ON public.sessions FOR UPDATE TO authenticated
  USING (public.is_admin() OR entered_by = auth.uid());
CREATE POLICY "Delete own sessions" ON public.sessions FOR DELETE TO authenticated
  USING (public.is_admin() OR entered_by = auth.uid());

-- ─── 8. session_goals ──────────────────────────────────────────────────
CREATE POLICY "Read session_goals in my schools" ON public.session_goals FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.sessions se
    JOIN public.students st ON st.id = se.student_id
    WHERE se.id = session_id AND public.staff_can_access_school(st.school_id)
  )
);
CREATE POLICY "Write session_goals for own sessions" ON public.session_goals FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.sessions WHERE id = session_id AND entered_by = auth.uid()
    )
  );
CREATE POLICY "Update session_goals for own sessions" ON public.session_goals FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.sessions WHERE id = session_id AND entered_by = auth.uid()
    )
  );
CREATE POLICY "Delete session_goals for own sessions" ON public.session_goals FOR DELETE TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.sessions WHERE id = session_id AND entered_by = auth.uid()
    )
  );

-- ─── 9. hours ──────────────────────────────────────────────────────────
CREATE POLICY "Read own hours" ON public.hours FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Insert own hours" ON public.hours FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR (user_id = auth.uid() AND public.staff_can_access_school(school_id))
  );
CREATE POLICY "Update own hours" ON public.hours FOR UPDATE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Delete own hours" ON public.hours FOR DELETE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

-- ─── 10. invoices + invoice_lines (admin only) ─────────────────────────
CREATE POLICY "Admin all invoices" ON public.invoices FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin all invoice_lines" ON public.invoice_lines FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── 11. timesheets + timesheet_hours ──────────────────────────────────
CREATE POLICY "Read own timesheets" ON public.timesheets FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Insert own timesheets" ON public.timesheets FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Update own timesheets" ON public.timesheets FOR UPDATE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Delete own timesheets" ON public.timesheets FOR DELETE TO authenticated
  USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Read timesheet_hours for own timesheets" ON public.timesheet_hours FOR SELECT TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.timesheets WHERE id = timesheet_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Insert timesheet_hours for own timesheets" ON public.timesheet_hours FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.timesheets WHERE id = timesheet_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Delete timesheet_hours for own timesheets" ON public.timesheet_hours FOR DELETE TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.timesheets WHERE id = timesheet_id AND user_id = auth.uid()
    )
  );

-- ─── 12. staff_schools + profile_school_rates (admin manage) ───────────
CREATE POLICY "Read staff_schools" ON public.staff_schools FOR SELECT TO authenticated
  USING (public.is_admin() OR profile_id = auth.uid());
CREATE POLICY "Admin insert staff_schools" ON public.staff_schools FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admin update staff_schools" ON public.staff_schools FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin delete staff_schools" ON public.staff_schools FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Read profile_school_rates" ON public.profile_school_rates FOR SELECT TO authenticated
  USING (public.is_admin() OR profile_id = auth.uid());
CREATE POLICY "Admin insert profile_school_rates" ON public.profile_school_rates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Admin update profile_school_rates" ON public.profile_school_rates FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin delete profile_school_rates" ON public.profile_school_rates FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── 13. SMS tables — admin only; webhook uses service role ────────────
CREATE POLICY "Admin all sms_conversations" ON public.sms_conversations FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin all sms_messages" ON public.sms_messages FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── 14. questionnaire_submissions ─────────────────────────────────────
-- Public form still needs to insert; only admins can read/modify.
CREATE POLICY "Public insert questionnaire" ON public.questionnaire_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admin read questionnaire" ON public.questionnaire_submissions FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin update questionnaire" ON public.questionnaire_submissions FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "Admin delete questionnaire" ON public.questionnaire_submissions FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── Rollback (paste and run if the app breaks) ────────────────────────
-- DO $$
-- DECLARE r record;
-- BEGIN
--   FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
--   LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename); END LOOP;
-- END $$;
-- DO $$
-- DECLARE tbl text;
-- BEGIN
--   FOR tbl IN SELECT unnest(ARRAY[
--     'profiles','schools','students','goals','sessions','session_goals',
--     'hours','invoices','invoice_lines','timesheets','timesheet_hours',
--     'staff_schools','profile_school_rates','sms_conversations','sms_messages',
--     'questionnaire_submissions'
--   ]) LOOP
--     EXECUTE format('CREATE POLICY "Authenticated read %I" ON public.%I FOR SELECT TO authenticated USING (true)', tbl, tbl);
--     EXECUTE format('CREATE POLICY "Authenticated insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);
--     EXECUTE format('CREATE POLICY "Authenticated update %I" ON public.%I FOR UPDATE TO authenticated USING (true)', tbl, tbl);
--     EXECUTE format('CREATE POLICY "Authenticated delete %I" ON public.%I FOR DELETE TO authenticated USING (true)', tbl, tbl);
--   END LOOP;
-- END $$;

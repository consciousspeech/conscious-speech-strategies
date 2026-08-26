-- Categorize why a session didn't occur so we can distinguish student
-- absences from school activities and school closures.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS no_show_type text
    CHECK (no_show_type IS NULL OR no_show_type IN ('student_absent', 'school_activity', 'school_closure'));

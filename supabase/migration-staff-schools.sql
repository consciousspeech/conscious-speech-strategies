-- Staff-to-school assignments. Used by the upcoming RLS lockdown so
-- staff members can only read/write records for schools they're assigned to.
-- Admins bypass this table entirely.
CREATE TABLE IF NOT EXISTS public.staff_schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, school_id)
);

ALTER TABLE public.staff_schools ENABLE ROW LEVEL SECURITY;

-- Temporarily permissive; will be replaced by the RLS lockdown migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'staff_schools' AND policyname = 'Auth read staff_schools') THEN
    CREATE POLICY "Auth read staff_schools" ON public.staff_schools FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Auth insert staff_schools" ON public.staff_schools FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Auth update staff_schools" ON public.staff_schools FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "Auth delete staff_schools" ON public.staff_schools FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

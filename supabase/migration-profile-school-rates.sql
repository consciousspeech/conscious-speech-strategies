-- Per-school external/internal rates for staff. When a rate is set here,
-- invoice line generation uses it instead of the profile-level default.
CREATE TABLE IF NOT EXISTS public.profile_school_rates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  external_rate numeric(10,2),
  internal_rate numeric(10,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, school_id)
);

ALTER TABLE public.profile_school_rates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profile_school_rates' AND policyname = 'Auth read profile_school_rates') THEN
    CREATE POLICY "Auth read profile_school_rates" ON public.profile_school_rates FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Auth insert profile_school_rates" ON public.profile_school_rates FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "Auth update profile_school_rates" ON public.profile_school_rates FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "Auth delete profile_school_rates" ON public.profile_school_rates FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Archive flag for staff so we can retire someone without deleting history.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

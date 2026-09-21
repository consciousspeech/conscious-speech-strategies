-- Manual override for a student's weekly required service minutes.
--
-- `service_minutes` is free text straight off the IEP and comes in many shapes
-- ("60 MPW", "SI- 30 MPW, LI- 30 MPW", "450 per quarter"). The weekly schedule
-- report parses that text where it can; this column is for the entries it
-- can't read, and always takes precedence when set.
--
-- NULL means "fall back to parsing service_minutes" — not "zero minutes owed".
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS required_minutes_per_week integer
    CHECK (required_minutes_per_week IS NULL OR required_minutes_per_week > 0);

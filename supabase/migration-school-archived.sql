-- Archive flag for schools so closed campuses can be retired without
-- deleting their students, sessions, invoices, or hours history.
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

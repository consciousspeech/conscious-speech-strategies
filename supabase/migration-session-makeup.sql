-- Flag a session as a make-up session (rescheduled from a missed session)
-- so it can be distinguished from regularly scheduled sessions.
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS is_makeup boolean NOT NULL DEFAULT false;

-- Track whether a session actually occurred. When a clinician logs a
-- non-occurring session, no_show_reason is required.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS occurred boolean NOT NULL DEFAULT true;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS no_show_reason text;

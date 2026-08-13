-- Track session time, service delivery model, and push-in classroom notes.
-- Default service_type to 'pull_out' since that's the most common delivery.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS service_time text;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'pull_out';

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS push_in_notes text;

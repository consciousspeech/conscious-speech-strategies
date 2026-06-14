-- Track category on each invoice line so SLAM Tampa invoices can show
-- "Category" (Speech Lang TX, IEP Meeting Prep, etc.) instead of staff name.

ALTER TABLE public.invoice_lines
  ADD COLUMN IF NOT EXISTS category text;

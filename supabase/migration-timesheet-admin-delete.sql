-- Allow admins to delete any timesheet / timesheet_hours row.
-- Staff can still delete their own timesheets (user_id = self).
-- Run this in the Supabase SQL editor.

drop policy if exists "Authenticated delete timesheets" on public.timesheets;
drop policy if exists "Authenticated delete timesheet_hours" on public.timesheet_hours;

create policy "Delete timesheets as self or admin"
  on public.timesheets
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Delete timesheet_hours as self or admin"
  on public.timesheet_hours
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.timesheets t
      where t.id = timesheet_id
        and (
          t.user_id = auth.uid()
          or exists (
            select 1 from public.profiles
            where id = auth.uid() and role = 'admin'
          )
        )
    )
  );

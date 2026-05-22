-- Allow admins to create timesheets and timesheet_hours rows on behalf of any
-- staff member. Staff can still create their own timesheets (user_id = self).
-- Run this in the Supabase SQL editor.

drop policy if exists "Authenticated insert timesheets" on public.timesheets;
drop policy if exists "Authenticated insert timesheet_hours" on public.timesheet_hours;

create policy "Insert timesheets as self or admin"
  on public.timesheets
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Insert timesheet_hours as self or admin"
  on public.timesheet_hours
  for insert
  to authenticated
  with check (
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

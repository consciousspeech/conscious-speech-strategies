// One-off: apply admin-insert RLS policies for timesheets / timesheet_hours.
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.production.
// Uses Supabase's pg-meta query endpoint with the service role JWT.

import { readFileSync } from "node:fs";

function loadEnv(file) {
  const env = {};
  const raw = readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const env = loadEnv(".env.production");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sql = `
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
`;

// Try the pg-meta query endpoint first (used by Supabase Studio).
const endpoints = [
  `${url}/pg-meta/default/query`,
  `${url}/rest/v1/rpc/exec_sql`,
];

for (const endpoint of endpoints) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    console.log(`[${endpoint}] status=${res.status}`);
    console.log(text.slice(0, 500));
    if (res.ok) {
      console.log("SUCCESS");
      process.exit(0);
    }
  } catch (err) {
    console.log(`[${endpoint}] error: ${err.message}`);
  }
}

console.error("\nAll endpoints failed. You will need to paste the SQL into the Supabase SQL editor manually.");
process.exit(1);

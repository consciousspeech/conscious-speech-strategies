import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Vercel cron pings this once a day to keep the Supabase free-tier project
 * from auto-pausing after 7 days of inactivity. Any successful query against
 * the database counts as activity, so we just do a tiny lightweight read.
 *
 * Configured in vercel.json under "crons".
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, reason: "missing_env" },
      { status: 503 }
    );
  }

  const supabase = createClient(url, key);

  // Cheap read — count of schools is small and always present.
  const { error } = await supabase
    .from("schools")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("keepalive: supabase query failed", error.message);
    return NextResponse.json(
      { ok: false, reason: "query_failed", message: error.message },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    pingedAt: new Date().toISOString(),
  });
}

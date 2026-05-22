import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PrintableTimesheet from "./PrintableTimesheet";

export default async function TimesheetPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ school?: string }>;
}) {
  const { id } = await params;
  const { school: schoolFilter } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: timesheet } = await supabase
    .from("timesheets")
    .select(
      "*, profile:profiles!user_id(name, rate_per_hour, internal_rate)"
    )
    .eq("id", id)
    .single();

  if (!timesheet) notFound();

  const { data: timesheetHours } = await supabase
    .from("timesheet_hours")
    .select(
      "hours:hours!hours_id(id, date, hours, description, category, time_in, time_out, school:schools(id, name))"
    )
    .eq("timesheet_id", id);

  let hours = (timesheetHours || [])
    .map((th: { hours: unknown }) => th.hours)
    .filter(Boolean) as {
    id: string;
    date: string;
    hours: number;
    description: string | null;
    category: string | null;
    time_in: string | null;
    time_out: string | null;
    school: { id: string; name: string } | null;
  }[];

  if (schoolFilter) {
    hours = hours.filter((h) => h.school?.id === schoolFilter);
  }

  hours.sort((a, b) => a.date.localeCompare(b.date));

  return <PrintableTimesheet timesheet={timesheet} hours={hours} filteredBySchool={!!schoolFilter} />;
}

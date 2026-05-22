"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface HourEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  category: string | null;
  time_in: string | null;
  time_out: string | null;
  school: { id: string; name: string } | null;
}

interface TimesheetRow {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  profile: { name: string; rate_per_hour: number | null; internal_rate: number | null } | null;
  timesheet_hours: { hours: HourEntry }[];
}

export default function PaymentsPage() {
  const supabase = createClient();
  const [timesheets, setTimesheets] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [printMenuOpen, setPrintMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: ts } = await supabase
      .from("timesheets")
      .select(
        "*, profile:profiles!user_id(name, rate_per_hour, internal_rate), timesheet_hours(hours:hours!hours_id(id, date, hours, description, category, time_in, time_out, school:schools(id, name)))"
      )
      .order("created_at", { ascending: false });
    if (ts) setTimesheets(ts as unknown as TimesheetRow[]);
    setLoading(false);
  }

  async function deleteTimesheet(id: string) {
    if (!confirm("Delete this timesheet? Logged hours are kept; only the timesheet record is removed.")) return;
    const { error: linkError } = await supabase.from("timesheet_hours").delete().eq("timesheet_id", id);
    if (linkError) {
      alert("Error unlinking hours: " + linkError.message);
      return;
    }
    // Use .select() so we can see whether a row was actually deleted.
    // RLS may silently return 0 rows when the policy denies the delete.
    const { data: deleted, error } = await supabase
      .from("timesheets")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      alert("Error deleting timesheet: " + error.message);
      return;
    }
    if (!deleted || deleted.length === 0) {
      alert(
        "Couldn't delete the timesheet — the database refused it (row-level security). " +
          "Run the migration in supabase/migration-timesheet-admin-delete.sql in the Supabase SQL editor, then try again."
      );
      return;
    }
    loadData();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDate(key: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("timesheets").update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq("id", id);
    if (error) {
      alert("Error updating timesheet: " + error.message);
      return;
    }
    loadData();
  }

  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-600",
  };

  if (loading) return null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Payments &amp; Timesheets</h1>

      <div className="space-y-4">
        {timesheets.length > 0 ? (
          timesheets.map((ts) => {
            const isOpen = expanded.has(ts.id);
            const internalRate = ts.profile?.internal_rate ?? ts.profile?.rate_per_hour ?? 0;
            const totalPay = ts.total_hours * internalRate;
            const hourEntries = (ts.timesheet_hours || [])
              .map((th) => th.hours)
              .filter(Boolean)
              .sort((a, b) => a.date.localeCompare(b.date));
            const schoolMap = new Map<string, string>();
            for (const h of hourEntries) {
              if (h.school?.id && h.school?.name) schoolMap.set(h.school.id, h.school.name);
            }
            const schoolOptions = Array.from(schoolMap, ([id, name]) => ({ id, name }));
            const schoolLabel =
              schoolOptions.length === 0
                ? null
                : schoolOptions.length === 1
                ? schoolOptions[0].name
                : "Multiple schools";
            const printMenuId = `print-${ts.id}`;
            const isPrintOpen = printMenuOpen === printMenuId;

            return (
              <div key={ts.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Header row — clickable to expand */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(ts.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(ts.id); } }}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <svg
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>

                  <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
                    <span className="text-slate-900 font-semibold">{ts.profile?.name || "Unknown"}</span>
                    {schoolLabel && (
                      <span className="text-slate-600">{schoolLabel}</span>
                    )}
                    <span className="text-slate-500 tabular-nums">
                      {new Date(ts.period_start + "T00:00:00").toLocaleDateString()} &mdash; {new Date(ts.period_end + "T00:00:00").toLocaleDateString()}
                    </span>
                    <span className="text-slate-900 font-semibold tabular-nums">{ts.total_hours.toFixed(2)} hrs</span>
                    {internalRate > 0 && (
                      <span className="text-teal-700 font-semibold tabular-nums">${totalPay.toFixed(2)}</span>
                    )}
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${statusColors[ts.status] || ""}`}>
                      {ts.status}
                    </span>
                  </div>

                  <div className="flex gap-2 shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
                    {schoolOptions.length > 1 ? (
                      <div className="relative">
                        <button
                          onClick={() => setPrintMenuOpen(isPrintOpen ? null : printMenuId)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Print ▾
                        </button>
                        {isPrintOpen && (
                          <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                            <Link
                              href={`/admin/payments/${ts.id}`}
                              target="_blank"
                              onClick={() => setPrintMenuOpen(null)}
                              className="block px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50"
                            >
                              All schools
                            </Link>
                            <div className="border-t border-slate-100 my-1" />
                            {schoolOptions.map((s) => (
                              <Link
                                key={s.id}
                                href={`/admin/payments/${ts.id}?school=${s.id}`}
                                target="_blank"
                                onClick={() => setPrintMenuOpen(null)}
                                className="block px-3 py-1.5 text-[12px] text-slate-700 hover:bg-slate-50"
                              >
                                {s.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={`/admin/payments/${ts.id}`}
                        target="_blank"
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Print
                      </Link>
                    )}
                    {ts.status === "submitted" && (
                      <>
                        <button onClick={() => updateStatus(ts.id, "approved")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition-colors cursor-pointer">
                          Approve
                        </button>
                        <button onClick={() => updateStatus(ts.id, "rejected")}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded text-[11px] font-medium transition-colors cursor-pointer">
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteTimesheet(ts.id)}
                      title="Delete timesheet"
                      className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Expanded detail \u2014 grouped by date */}
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {hourEntries.length > 0 ? (
                      <>
                        <div className="divide-y divide-slate-100">
                          {Array.from(
                            hourEntries.reduce((map, h) => {
                              if (!map.has(h.date)) map.set(h.date, []);
                              map.get(h.date)!.push(h);
                              return map;
                            }, new Map<string, HourEntry[]>())
                          ).map(([date, entries]) => {
                            const dateKey = `${ts.id}|${date}`;
                            const dateOpen = expandedDates.has(dateKey);
                            const dayHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
                            const categories = Array.from(
                              new Set(entries.map((e) => e.category).filter(Boolean) as string[])
                            );

                            return (
                              <div key={dateKey}>
                                <button
                                  onClick={() => toggleDate(dateKey)}
                                  className="w-full text-left px-5 py-2.5 pl-14 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer text-[13px]"
                                >
                                  <svg
                                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${dateOpen ? "rotate-90" : ""}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                  <span className="text-slate-700 tabular-nums w-28">
                                    {new Date(date + "T00:00:00").toLocaleDateString()}
                                  </span>
                                  <span className="text-slate-900 font-semibold tabular-nums w-20">
                                    {dayHours.toFixed(2)} hrs
                                  </span>
                                  <span className="text-slate-400 text-[12px]">
                                    {entries.length} {entries.length === 1 ? "entry" : "entries"}
                                  </span>
                                  {categories.length > 0 && (
                                    <span className="text-slate-400 text-[12px] truncate">
                                      &middot; {categories.join(", ")}
                                    </span>
                                  )}
                                </button>

                                {dateOpen && (
                                  <table className="w-full text-[13px] bg-slate-50/30">
                                    <thead>
                                      <tr className="border-y border-slate-100 text-left">
                                        <th className="px-5 py-2 pl-[5.5rem] text-slate-400 font-medium text-[11px] uppercase tracking-wide">School</th>
                                        <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Time</th>
                                        <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Hours</th>
                                        <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Category</th>
                                        <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {entries.map((h) => (
                                        <tr key={h.id} className="hover:bg-white transition-colors">
                                          <td className="px-5 py-2 pl-[5.5rem] text-slate-500">{h.school?.name || "\u2014"}</td>
                                          <td className="px-5 py-2 text-slate-500 tabular-nums">
                                            {h.time_in && h.time_out ? `${h.time_in} \u2013 ${h.time_out}` : "\u2014"}
                                          </td>
                                          <td className="px-5 py-2 text-slate-900 font-semibold tabular-nums">{Number(h.hours).toFixed(2)}</td>
                                          <td className="px-5 py-2 text-slate-600">{h.category || "\u2014"}</td>
                                          <td className="px-5 py-2 text-slate-500 max-w-xs truncate">{h.description || "\u2014"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-3 pl-14 flex items-center gap-4 text-[13px]">
                          <span className="text-slate-500 font-medium text-[12px] uppercase tracking-wide">Total</span>
                          <span className="text-slate-900 font-bold tabular-nums">{ts.total_hours.toFixed(2)} hrs</span>
                          {internalRate > 0 && (
                            <span className="text-teal-700 font-bold tabular-nums ml-auto">
                              ${totalPay.toFixed(2)}
                              <span className="text-slate-400 font-normal ml-1 text-[11px]">@ ${internalRate}/hr</span>
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="px-5 py-6 pl-14 text-slate-400 text-sm">No individual hours linked to this timesheet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
            <p className="px-5 py-10 text-center text-slate-400 text-sm">
              No timesheets submitted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

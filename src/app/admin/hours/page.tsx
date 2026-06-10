"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Profile, School } from "@/lib/supabase/types";

export default function HoursPage() {
  const supabase = createClient();

  const [hours, setHours] = useState<Record<string, unknown>[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filters, setFilters] = useState({ staff_id: "", school_id: "", date_from: "", date_to: "" });
  const [totalHours, setTotalHours] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [showTimesheetForm, setShowTimesheetForm] = useState(false);
  const [tsDateFrom, setTsDateFrom] = useState("");
  const [tsDateTo, setTsDateTo] = useState("");
  const [tsSchoolId, setTsSchoolId] = useState("");
  const [tsStaffId, setTsStaffId] = useState("");
  const [submittingTs, setSubmittingTs] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  function toggleDate(date: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const admin = profile?.role === "admin";
      setIsAdmin(admin);

      if (admin) {
        const { data } = await supabase.from("profiles").select("*").order("name");
        if (data) setStaff(data);
      }

      const { data: sc } = await supabase.from("schools").select("*").order("name");
      if (sc) setSchools(sc);

      setReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (ready) loadHours();
  }, [filters, ready]);

  async function loadHours() {
    let query = supabase
      .from("hours")
      .select("*, profile:profiles!user_id(name), school:schools(name)")
      .order("date", { ascending: false })
      .limit(100);

    if (filters.staff_id) query = query.eq("user_id", filters.staff_id);
    if (filters.school_id) query = query.eq("school_id", filters.school_id);
    if (filters.date_from) query = query.gte("date", filters.date_from);
    if (filters.date_to) query = query.lte("date", filters.date_to);

    const { data } = await query;
    if (data) {
      setHours(data);
      setTotalHours(data.reduce((sum, h) => sum + Number(h.hours), 0));
    }
  }

  const filterClass = "px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all cursor-pointer";

  if (!ready) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Hours</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowTimesheetForm(!showTimesheetForm)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer">
            {showTimesheetForm ? "Cancel" : "Submit Timesheet"}
          </button>
          <Link href="/admin/hours/new"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer">
            Log Hours
          </Link>
        </div>
      </div>

      {showTimesheetForm && (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-[15px]">Submit Timesheet</h2>
          <p className="text-[13px] text-slate-400">Select a date range to bundle your logged hours into a timesheet for review.</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[12px] font-medium text-slate-500 mb-1">From</label>
              <input type="date" value={tsDateFrom} onChange={(e) => setTsDateFrom(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-500 mb-1">To</label>
              <input type="date" value={tsDateTo} onChange={(e) => setTsDateTo(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-slate-500 mb-1">School</label>
              <select value={tsSchoolId} onChange={(e) => setTsSchoolId(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all cursor-pointer">
                <option value="">All Schools</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="block text-[12px] font-medium text-slate-500 mb-1">Staff</label>
                <select value={tsStaffId} onChange={(e) => setTsStaffId(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all cursor-pointer">
                  <option value="">Myself</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <button disabled={!tsDateFrom || !tsDateTo || submittingTs} onClick={async () => {
              setSubmittingTs(true);
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) { setSubmittingTs(false); return; }

              // Admin can submit on behalf of any staff member; otherwise self
              const targetUserId = (isAdmin && tsStaffId) ? tsStaffId : user.id;
              const targetStaffName = (isAdmin && tsStaffId)
                ? (staff.find(s => s.id === tsStaffId)?.name || "selected staff")
                : "";

              let hoursQuery = supabase.from("hours")
                .select("id, hours")
                .eq("user_id", targetUserId)
                .gte("date", tsDateFrom)
                .lte("date", tsDateTo);
              if (tsSchoolId) hoursQuery = hoursQuery.eq("school_id", tsSchoolId);
              const { data: rangeHours } = await hoursQuery;

              if (!rangeHours || rangeHours.length === 0) {
                const who = targetStaffName ? ` for ${targetStaffName}` : "";
                alert(tsSchoolId
                  ? `No hours found in this date range${who} for the selected school.`
                  : `No hours found in this date range${who}.`);
                setSubmittingTs(false);
                return;
              }

              const total = rangeHours.reduce((sum, h) => sum + Number(h.hours), 0);

              const { data: ts, error } = await supabase.from("timesheets").insert({
                user_id: targetUserId,
                period_start: tsDateFrom,
                period_end: tsDateTo,
                status: "submitted",
                total_hours: total,
                submitted_at: new Date().toISOString(),
              }).select().single();

              if (error || !ts) {
                alert("Error submitting timesheet: " + (error?.message || "Unknown"));
                setSubmittingTs(false);
                return;
              }

              const { error: linkError } = await supabase.from("timesheet_hours").insert(
                rangeHours.map((h) => ({ timesheet_id: ts.id, hours_id: h.id }))
              );

              if (linkError) {
                alert("Timesheet created but failed to link hours: " + linkError.message);
                setSubmittingTs(false);
                return;
              }

              alert(`Timesheet submitted! ${rangeHours.length} entries, ${total.toFixed(2)} total hours.`);
              setShowTimesheetForm(false);
              setSubmittingTs(false);
              setTsDateFrom("");
              setTsDateTo("");
              setTsSchoolId("");
              setTsStaffId("");
            }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer">
              {submittingTs ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {isAdmin && (
          <select value={filters.staff_id} onChange={(e) => setFilters({ ...filters, staff_id: e.target.value })} className={filterClass}>
            <option value="">All Staff</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select value={filters.school_id} onChange={(e) => setFilters({ ...filters, school_id: e.target.value })} className={filterClass}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
        <div className="ml-auto bg-teal-50 px-4 py-2.5 rounded-lg border border-teal-100">
          <span className="text-[13px] text-teal-700 font-semibold tabular-nums">Total: {totalHours.toFixed(2)} hrs</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {hours.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {Array.from(
              hours.reduce((map, h) => {
                const date = h.date as string;
                if (!map.has(date)) map.set(date, []);
                map.get(date)!.push(h);
                return map;
              }, new Map<string, Record<string, unknown>[]>())
            ).map(([date, entries]) => {
              const dayTotal = entries.reduce((sum, e) => sum + Number(e.hours), 0);
              const schoolTotals = new Map<string, number>();
              for (const e of entries) {
                const name = (e.school as Record<string, unknown> | null)?.name as string | undefined;
                const key = name || "Unassigned";
                schoolTotals.set(key, (schoolTotals.get(key) ?? 0) + Number(e.hours));
              }
              const isOpen = expandedDates.has(date);
              const dateObj = new Date(date + "T00:00:00");
              const dayName = dateObj.toLocaleDateString(undefined, { weekday: "short" });
              return (
                <div key={date}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleDate(date)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDate(date); } }}
                    className="w-full px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-1 hover:bg-slate-50/50 transition-colors cursor-pointer text-[13px]"
                  >
                    <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-slate-900 font-semibold tabular-nums w-28">{dateObj.toLocaleDateString()}</span>
                    <span className="text-slate-400 w-12">{dayName}</span>
                    <span className="text-slate-900 font-semibold tabular-nums w-24">{dayTotal.toFixed(2)} hrs</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(schoolTotals).map(([name, h]) => (
                        <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sage/10 text-sage-dark rounded-full text-[11px] font-medium">
                          {name} <span className="tabular-nums">{h.toFixed(2)}</span>
                        </span>
                      ))}
                    </div>
                    <span className="ml-auto text-slate-400 text-[12px]">
                      {entries.length} {entries.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                  {isOpen && (
                    <div className="bg-slate-50/30 border-t border-slate-100">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-left">
                            {isAdmin && <th className="px-5 py-2 pl-14 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Staff</th>}
                            <th className={`px-5 py-2 ${isAdmin ? "" : "pl-14"} text-slate-400 font-medium text-[11px] uppercase tracking-wide`}>School</th>
                            <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Time</th>
                            <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Hours</th>
                            <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Category</th>
                            <th className="px-5 py-2 text-slate-400 font-medium text-[11px] uppercase tracking-wide">Description</th>
                            <th className="px-5 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {entries.map((h) => (
                            <tr key={h.id as string} className="hover:bg-white transition-colors">
                              {isAdmin && <td className="px-5 py-2 pl-14 text-slate-600">{(h.profile as Record<string, unknown>)?.name as string}</td>}
                              <td className={`px-5 py-2 ${isAdmin ? "" : "pl-14"} text-slate-600`}>{(h.school as Record<string, unknown>)?.name as string || "\u2014"}</td>
                              <td className="px-5 py-2 text-slate-500 tabular-nums">
                                {h.time_in && h.time_out ? `${(h.time_in as string).slice(0,5)} \u2013 ${(h.time_out as string).slice(0,5)}` : "\u2014"}
                              </td>
                              <td className="px-5 py-2 text-slate-900 font-semibold tabular-nums">{Number(h.hours).toFixed(2)}</td>
                              <td className="px-5 py-2 text-slate-400">{(h.category as string) || "\u2014"}</td>
                              <td className="px-5 py-2 text-slate-400 max-w-xs truncate">{(h.description as string) || "\u2014"}</td>
                              <td className="px-5 py-2">
                                <Link href={`/admin/hours/${h.id}/edit`} className="text-teal-600 hover:text-teal-700 font-medium transition-colors">Edit</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">No hours logged yet.</p>
        )}
      </div>
    </div>
  );
}

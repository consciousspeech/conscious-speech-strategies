"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, School } from "@/lib/supabase/types";

export default function SessionsPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filters, setFilters] = useState({ staff_id: "", school_id: "", date_from: "", date_to: "" });

  useEffect(() => {
    loadFilters();
    loadSessions();
  }, []);

  async function loadFilters() {
    const [{ data: s }, { data: sc }] = await Promise.all([
      supabase.from("profiles").select("*").eq("archived", false).order("name"),
      supabase.from("schools").select("*").order("name"),
    ]);
    if (s) setStaff(s);
    if (sc) setSchools(sc);
  }

  async function loadSessions() {
    let query = supabase
      .from("sessions")
      .select("*, student:students(name, school_id, school:schools(name)), entered_by_profile:profiles!entered_by(name), session_goals(correct_count, total_count, target, performance_level, goal:goals(goal_number))")
      .order("date", { ascending: false })
      .limit(50);

    if (filters.date_from) query = query.gte("date", filters.date_from);
    if (filters.date_to) query = query.lte("date", filters.date_to);
    if (filters.staff_id) query = query.eq("entered_by", filters.staff_id);

    const { data } = await query;
    let filtered = data || [];
    if (filters.school_id) {
      filtered = filtered.filter((s: Record<string, unknown>) =>
        (s.student as Record<string, unknown>)?.school_id === filters.school_id
      );
    }
    setSessions(filtered);
  }

  useEffect(() => {
    loadSessions();
  }, [filters]);

  const filterClass = "px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all cursor-pointer";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">All Sessions</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filters.staff_id} onChange={(e) => setFilters({ ...filters, staff_id: e.target.value })} className={filterClass}>
          <option value="">All Staff</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.school_id} onChange={(e) => setFilters({ ...filters, school_id: e.target.value })} className={filterClass}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {sessions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <div key={session.id as string} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <a href={`/admin/students/${session.student_id}`} className="flex-1 cursor-pointer">
                  <p className="font-medium text-slate-900 text-[14px]">{(session.student as Record<string, unknown>)?.name as string}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {((session.student as Record<string, unknown>)?.school as Record<string, unknown>)?.name as string}
                    {" · by "}
                    {(session.entered_by_profile as Record<string, unknown>)?.name as string}
                  </p>
                  {(session.session_goals as Record<string, unknown>[])?.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1 tabular-nums">
                      {(session.session_goals as Record<string, unknown>[]).map((sg) => {
                        const parts = [`G${(sg.goal as Record<string, unknown>)?.goal_number}`];
                        if (sg.target) parts.push(sg.target as string);
                        if ((sg.total_count as number) > 0) parts.push(`${sg.correct_count}/${sg.total_count}`);
                        if (sg.performance_level) parts.push(sg.performance_level as string);
                        return parts.join(": ");
                      }).join(" · ")}
                    </p>
                  )}
                </a>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[13px] text-slate-400 tabular-nums">
                    {new Date((session.date as string) + "T00:00:00").toLocaleDateString()}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!confirm("Delete this session?")) return;
                      await supabase.from("sessions").delete().eq("id", session.id as string);
                      loadSessions();
                    }}
                    className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">No sessions found.</p>
        )}
      </div>
    </div>
  );
}

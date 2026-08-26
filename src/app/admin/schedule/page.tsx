"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatLocalDate } from "@/lib/utils";

interface ScheduleSession {
  id: string;
  date: string;
  service_time: string | null;
  service_type: "pull_out" | "push_in" | null;
  push_in_notes: string | null;
  occurred: boolean | null;
  student: { id: string; name: string; school: { id: string; name: string } | null } | null;
}

// Parse "9:00-9:30 AM", "9:00 AM - 9:45 AM", "9-9:30 am" → { start, end } in minutes.
// Returns null if unparseable.
function parseTimeRange(raw: string | null): { start: number; end: number } | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase().replace(/[–—]/g, "-");
  const timeToken = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/;
  const rangeRe = new RegExp(`${timeToken.source}\\s*-\\s*${timeToken.source}`, "i");
  const m = s.match(rangeRe);
  if (!m) return null;
  const parseTime = (h: string, mm: string | undefined, ap: string | undefined, otherAp: string | undefined) => {
    let hr = parseInt(h);
    const min = mm ? parseInt(mm) : 0;
    const ampm = (ap || otherAp || "").replace(/\./g, "").toLowerCase();
    if (ampm.startsWith("p") && hr < 12) hr += 12;
    if (ampm.startsWith("a") && hr === 12) hr = 0;
    return hr * 60 + min;
  };
  const start = parseTime(m[1], m[2], m[3], m[6]);
  let end = parseTime(m[4], m[5], m[6], m[3]);
  if (end <= start) end += 12 * 60;
  if (end - start > 8 * 60 || end - start <= 0) return null;
  return { start, end };
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Distinct pastel colors per school, keyed off school id hash so
// the same school gets the same color across renders.
const SCHOOL_PALETTES = [
  { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-200" },
  { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-200" },
  { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200" },
  { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200" },
  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
];

function schoolPalette(schoolId: string | undefined): typeof SCHOOL_PALETTES[number] {
  if (!schoolId) return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
  let hash = 0;
  for (let i = 0; i < schoolId.length; i++) hash = (hash * 31 + schoolId.charCodeAt(i)) & 0xffffffff;
  return SCHOOL_PALETTES[Math.abs(hash) % SCHOOL_PALETTES.length];
}

const SLOT_MINUTES = 15;
const PIXELS_PER_SLOT = 18;

export default function SchedulePage() {
  const supabase = createClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeWeekend, setIncludeWeekend] = useState(false);

  const weekEnd = useMemo(() => addDays(weekStart, includeWeekend ? 6 : 4), [weekStart, includeWeekend]);
  const dayCount = includeWeekend ? 7 : 5;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("sessions")
        .select("id, date, service_time, service_type, push_in_notes, occurred, student:students(id, name, school:schools(id, name))")
        .gte("date", isoDate(weekStart))
        .lte("date", isoDate(weekEnd))
        .order("date");
      if (!cancelled) {
        setSessions((data || []) as unknown as ScheduleSession[]);
        // If any weekend sessions exist, auto-expand to show them.
        if (!includeWeekend && (data || []).some((s: { date: string }) => {
          const d = new Date(s.date + "T00:00:00");
          const dayIdx = (d.getDay() + 6) % 7; // Mon=0..Sun=6
          return dayIdx >= 5;
        })) {
          setIncludeWeekend(true);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [weekStart, weekEnd, includeWeekend, supabase]);

  // Build per-day columns with placed sessions and an "unscheduled" bucket.
  const dayColumns = useMemo(() => {
    const cols: { date: Date; scheduled: (ScheduleSession & { start: number; end: number })[]; unscheduled: ScheduleSession[] }[] = [];
    for (let i = 0; i < dayCount; i++) cols.push({ date: addDays(weekStart, i), scheduled: [], unscheduled: [] });
    for (const s of sessions) {
      const sDate = new Date(s.date + "T00:00:00");
      const idx = Math.round((sDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
      if (idx < 0 || idx >= dayCount) continue;
      const range = parseTimeRange(s.service_time);
      if (range) cols[idx].scheduled.push({ ...s, start: range.start, end: range.end });
      else cols[idx].unscheduled.push(s);
    }
    // Sort scheduled by start time
    for (const c of cols) c.scheduled.sort((a, b) => a.start - b.start);
    return cols;
  }, [sessions, weekStart, dayCount]);

  // Determine visible time range from scheduled sessions (fallback 8am-3pm)
  const { minMinute, maxMinute } = useMemo(() => {
    let min = 8 * 60;
    let max = 15 * 60;
    for (const c of dayColumns) {
      for (const s of c.scheduled) {
        if (s.start < min) min = s.start;
        if (s.end > max) max = s.end;
      }
    }
    // Snap to 15-min boundaries and pad
    min = Math.floor(min / SLOT_MINUTES) * SLOT_MINUTES;
    max = Math.ceil(max / SLOT_MINUTES) * SLOT_MINUTES;
    return { minMinute: min, maxMinute: max };
  }, [dayColumns]);

  const totalSlots = Math.max(1, (maxMinute - minMinute) / SLOT_MINUTES);
  const gridHeight = totalSlots * PIXELS_PER_SLOT;

  // Hour lines for the time axis (every 60 min within range)
  const hourLines: number[] = [];
  const firstHour = Math.ceil(minMinute / 60) * 60;
  for (let m = firstHour; m <= maxMinute; m += 60) hourLines.push(m);

  const totalScheduled = dayColumns.reduce((n, c) => n + c.scheduled.length + c.unscheduled.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Weekly Schedule</h1>
          <p className="text-slate-400 text-sm mt-1">
            {formatLocalDate(isoDate(weekStart), { month: "long", day: "numeric" })} – {formatLocalDate(isoDate(weekEnd), { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Previous week"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
            className="px-3 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Next week"
          >
            Next →
          </button>
          <label className="ml-3 inline-flex items-center gap-2 text-[13px] text-slate-500 cursor-pointer">
            <input type="checkbox" checked={includeWeekend}
              onChange={(e) => setIncludeWeekend(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/20 cursor-pointer" />
            Weekend
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm py-10 text-center">Loading schedule...</p>
      ) : totalScheduled === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No sessions logged for this week.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            {/* Day header row */}
            <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: `56px repeat(${dayCount}, 1fr)` }}>
              <div />
              {dayColumns.map((c, i) => {
                const isToday = isoDate(c.date) === isoDate(new Date());
                return (
                  <div key={i} className={`px-3 py-3 text-center border-l border-slate-100 ${isToday ? "bg-teal-50/60" : ""}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {c.date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p className={`text-[15px] font-semibold mt-0.5 tabular-nums ${isToday ? "text-teal-700" : "text-slate-900"}`}>
                      {c.date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Grid body */}
            <div className="grid" style={{ gridTemplateColumns: `56px repeat(${dayCount}, 1fr)` }}>
              {/* Time axis */}
              <div className="relative border-r border-slate-100" style={{ height: gridHeight }}>
                {hourLines.map((m) => (
                  <div key={m} className="absolute right-2 text-[11px] text-slate-400 tabular-nums"
                    style={{ top: ((m - minMinute) / SLOT_MINUTES) * PIXELS_PER_SLOT - 6 }}>
                    {formatMinutes(m).replace(":00 ", " ")}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {dayColumns.map((col, colIdx) => {
                const isToday = isoDate(col.date) === isoDate(new Date());
                return (
                  <div key={colIdx} className={`relative border-l border-slate-100 ${isToday ? "bg-teal-50/40" : ""}`}
                    style={{ height: gridHeight }}>
                    {/* Hour grid lines */}
                    {hourLines.map((m) => (
                      <div key={m} className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ top: ((m - minMinute) / SLOT_MINUTES) * PIXELS_PER_SLOT }} />
                    ))}
                    {/* Session blocks */}
                    {col.scheduled.map((s) => {
                      const top = ((s.start - minMinute) / SLOT_MINUTES) * PIXELS_PER_SLOT;
                      const height = Math.max(PIXELS_PER_SLOT * 1.5, ((s.end - s.start) / SLOT_MINUTES) * PIXELS_PER_SLOT);
                      const pal = schoolPalette(s.student?.school?.id);
                      const didNotOccur = s.occurred === false;
                      return (
                        <Link
                          key={s.id}
                          href={`/admin/students/${s.student?.id}`}
                          className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${pal.bg} ${pal.text} ${pal.border} ${didNotOccur ? "opacity-60 line-through decoration-1" : ""}`}
                          style={{ top, height }}
                          title={`${s.student?.name} · ${formatMinutes(s.start)}–${formatMinutes(s.end)}${s.push_in_notes ? " · " + s.push_in_notes : ""}`}
                        >
                          <p className="text-[11px] font-semibold leading-tight truncate">
                            {s.student?.name}
                          </p>
                          <p className="text-[10px] leading-tight opacity-75 truncate">
                            {formatMinutes(s.start).replace(" ", "").toLowerCase()}–{formatMinutes(s.end).replace(" ", "").toLowerCase()}
                            {s.service_type === "push_in" ? " · push-in" : ""}
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unscheduled sessions (no parseable time) */}
          {dayColumns.some((c) => c.unscheduled.length > 0) && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900 text-[15px]">Sessions without a time</h2>
                <p className="text-[11px] text-slate-400">Add a time (e.g. &quot;9:00–9:30 AM&quot;) in the session note to place them on the grid.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {dayColumns.map((c, i) =>
                  c.unscheduled.length === 0 ? null : (
                    <div key={i} className="space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {c.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      {c.unscheduled.map((s) => {
                        const pal = schoolPalette(s.student?.school?.id);
                        return (
                          <Link key={s.id} href={`/admin/students/${s.student?.id}`}
                            className={`block rounded-md border px-2 py-1.5 ${pal.bg} ${pal.text} ${pal.border} hover:shadow-sm transition-shadow cursor-pointer`}>
                            <p className="text-[12px] font-semibold leading-tight truncate">{s.student?.name}</p>
                            <p className="text-[10px] leading-tight opacity-70 truncate">
                              {s.student?.school?.name}
                              {s.occurred === false ? " · did not occur" : ""}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

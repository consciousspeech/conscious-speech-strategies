"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

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

interface Timesheet {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  profile: {
    name: string;
    rate_per_hour: number | null;
    internal_rate: number | null;
  } | null;
}

interface Props {
  timesheet: Timesheet;
  hours: HourEntry[];
  filteredBySchool?: boolean;
}

interface DayRow {
  iso: string;
  label: string;
  dayName: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: number;
  tasks: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function fmtTime(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5).replace(/^0/, "");
}

export default function PrintableTimesheet({
  timesheet,
  hours,
  filteredBySchool = false,
}: Props) {
  const profileName = timesheet.profile?.name || "";

  // When filtered by school, totals must be derived from the filtered hours,
  // not the stored total_hours which covers the whole timesheet.
  const totalHours = filteredBySchool
    ? hours.reduce((sum, h) => sum + Number(h.hours), 0)
    : Number(timesheet.total_hours) || 0;

  const schoolNames = Array.from(
    new Set(hours.map((h) => h.school?.name).filter(Boolean) as string[])
  );
  const schoolLabel =
    schoolNames.length === 0
      ? ""
      : schoolNames.length === 1
      ? schoolNames[0]
      : "Multiple schools";

  const [position, setPosition] = useState("");

  // Build a row per weekday (Mon–Fri) in the period. Saturdays and Sundays
  // are skipped — UNLESS hours were actually logged that weekend day, in
  // which case the row is included so the work shows up.
  const dayRows: DayRow[] = useMemo(() => {
    const start = new Date(timesheet.period_start + "T00:00:00Z");
    const end = new Date(timesheet.period_end + "T00:00:00Z");
    const rows: DayRow[] = [];
    const byDate = new Map<string, HourEntry[]>();
    for (const h of hours) {
      if (!byDate.has(h.date)) byDate.set(h.date, []);
      byDate.get(h.date)!.push(h);
    }
    for (
      let d = new Date(start);
      d.getTime() <= end.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const dow = d.getUTCDay(); // 0 = Sun, 6 = Sat
      const iso = d.toISOString().slice(0, 10);
      const entries = byDate.get(iso) || [];
      if ((dow === 0 || dow === 6) && entries.length === 0) continue;
      const sortedIn = entries.map((e) => e.time_in).filter(Boolean) as string[];
      const sortedOut = entries.map((e) => e.time_out).filter(Boolean) as string[];
      sortedIn.sort();
      sortedOut.sort();
      const dayTotal = entries.reduce((sum, e) => sum + Number(e.hours), 0);
      const tasks = Array.from(
        new Set(
          entries
            .flatMap((e) => [e.description, e.category])
            .filter(Boolean) as string[]
        )
      ).join(", ");
      rows.push({
        iso,
        label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`,
        dayName: DAY_NAMES[dow],
        timeIn: sortedIn[0] || null,
        timeOut: sortedOut[sortedOut.length - 1] || null,
        totalHours: dayTotal,
        tasks,
      });
    }
    return rows;
  }, [timesheet.period_start, timesheet.period_end, hours]);

  return (
    <div className="max-w-4xl">
      {/* Admin controls — hidden on print */}
      <div className="no-print mb-6 flex items-center justify-between gap-4">
        <Link
          href="/admin/payments"
          className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Back to payments
        </Link>
        <div className="flex items-center gap-3">
          <label className="text-[13px] text-slate-500">Position:</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. SLPA"
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all"
          />
          <button
            onClick={() => window.print()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            Print
          </button>
        </div>
      </div>

      {/* Printable timesheet */}
      <div className="bg-white border border-slate-300 print:border-0 text-[12px] text-charcoal">
        {/* Header: logo + brand name + meta */}
        <div className="flex items-stretch border-b border-slate-300">
          <div className="flex items-center gap-3 px-5 py-4 border-r border-slate-300 bg-sage/5 print:bg-sage/10">
            <Image
              src="/Logo.png"
              alt="Conscious Speech Strategies"
              width={64}
              height={64}
              className="object-contain"
            />
            <div>
              <p
                className="text-[15px] font-semibold text-charcoal leading-tight"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Conscious Speech
              </p>
              <p
                className="text-[15px] font-semibold text-charcoal leading-tight"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Strategies
              </p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-sage-dark mt-1">
                Center · Communicate · Connect
              </p>
            </div>
          </div>
          <table className="flex-1 border-collapse">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="px-3 py-1.5 font-bold w-32 border-r border-slate-300">School:</td>
                <td className="px-3 py-1.5">{schoolLabel}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-3 py-1.5 font-bold border-r border-slate-300">Name:</td>
                <td className="px-3 py-1.5">{profileName}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-bold border-r border-slate-300">Position</td>
                <td className="px-3 py-1.5">{position}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Weekday grid */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="px-3 py-1.5 text-left font-bold border-r border-slate-300 w-24">Date</th>
              <th className="px-3 py-1.5 text-left font-bold border-r border-slate-300 w-28"></th>
              <th className="px-3 py-1.5 text-left font-bold border-r border-slate-300 w-24">Clock-in</th>
              <th className="px-3 py-1.5 text-left font-bold border-r border-slate-300 w-24">Clock-out</th>
              <th className="px-3 py-1.5 text-left font-bold border-r border-slate-300 w-24">Total Hours</th>
              <th className="px-3 py-1.5 text-left font-bold">Tasks Completed</th>
            </tr>
          </thead>
          <tbody>
            {dayRows.map((d) => (
              <tr key={d.iso} className="border-b border-slate-300">
                <td className="px-3 py-1.5 text-right tabular-nums border-r border-slate-300">{d.label}</td>
                <td className="px-3 py-1.5 border-r border-slate-300">{d.dayName}</td>
                <td className="px-3 py-1.5 text-right tabular-nums border-r border-slate-300">{fmtTime(d.timeIn)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums border-r border-slate-300">{fmtTime(d.timeOut)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums border-r border-slate-300">
                  {d.totalHours > 0 ? d.totalHours.toFixed(2) : ""}
                </td>
                <td className="px-3 py-1.5">{d.tasks}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + signatures */}
        <div className="mt-6 px-3">
          <table className="border-collapse">
            <tbody>
              <tr className="border border-slate-300">
                <td className="px-3 py-2 font-bold border-r border-slate-300 w-64">Total Hours</td>
                <td className="px-3 py-2 tabular-nums w-32 text-right">{totalHours.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="h-3"></td>
              </tr>
              <tr className="border border-slate-300">
                <td className="px-3 py-3 font-bold border-r border-slate-300">Operations Admin Signature</td>
                <td className="px-3 py-3 border-r border-slate-300 w-40"></td>
                <td className="px-3 py-3 font-bold border-r border-slate-300 w-20">Date</td>
                <td className="px-3 py-3 w-32"></td>
              </tr>
              <tr>
                <td className="h-3"></td>
              </tr>
              <tr className="border border-slate-300">
                <td className="px-3 py-3 font-bold border-r border-slate-300">Principal Signature</td>
                <td className="px-3 py-3 border-r border-slate-300 w-40"></td>
                <td className="px-3 py-3 font-bold border-r border-slate-300 w-20">Date</td>
                <td className="px-3 py-3 w-32"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

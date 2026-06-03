"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, School } from "@/lib/supabase/types";
import * as XLSX from "xlsx";

export default function ExportPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("students").select("*, school:schools(name)").eq("archived", false).order("name"),
      supabase.from("schools").select("*").order("name"),
    ]).then(([{ data: s }, { data: sc }]) => {
      if (s) setStudents(s as Student[]);
      if (sc) setSchools(sc);
    });
  }, []);

  const filteredStudents = students.filter((s) => !schoolFilter || s.school_id === schoolFilter);

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function selectAll() {
    const ids = filteredStudents.map((s) => s.id);
    setSelectedStudents((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      return allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])];
    });
  }

  async function handleExport() {
    if (selectedStudents.length === 0) return alert("Select at least one student.");
    if (!dateFrom || !dateTo) return alert("Select a date range.");
    setExporting(true);

    const wb = XLSX.utils.book_new();

    for (const studentId of selectedStudents) {
      const student = students.find((s) => s.id === studentId);
      if (!student) continue;

      // Fetch sessions in date range, with their linked goals fully expanded
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*, session_goals(*, goal:goals(id, goal_number, description, iep_year))")
        .eq("student_id", studentId)
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date");

      // Collect every distinct goal that was actually worked on during this
      // period. Match by goal.id (UUID), not by goal_number \u2014 students can have
      // goals across multiple IEP years that share numbers.
      type ExportGoal = {
        id: string;
        goal_number: number;
        description: string;
        iep_year: string | null;
      };
      const goalMap = new Map<string, ExportGoal>();
      for (const session of (sessions || []) as Record<string, unknown>[]) {
        for (const sg of (session.session_goals as Record<string, unknown>[]) || []) {
          const g = sg.goal as ExportGoal | null;
          if (g && g.id && !goalMap.has(g.id)) goalMap.set(g.id, g);
        }
      }
      // Sort: older IEP year first, then by goal_number. Goals without an
      // iep_year sort last.
      const goals = Array.from(goalMap.values()).sort((a, b) => {
        const ay = a.iep_year ?? "";
        const by = b.iep_year ?? "";
        if (ay !== by) {
          if (!ay) return 1;
          if (!by) return -1;
          return ay.localeCompare(by);
        }
        return (a.goal_number ?? 0) - (b.goal_number ?? 0);
      });

      // Build rows: header row with goal descriptions, then data rows
      const headerRow = ["Date"];
      goals.forEach((g) => {
        const yearLabel = g.iep_year ? ` [IEP ${g.iep_year}]` : "";
        headerRow.push(`Goal ${g.goal_number}${yearLabel}: ${g.description}`);
      });
      headerRow.push("Notes");

      const dataRows = (sessions || []).map((session: Record<string, unknown>) => {
        const row: (string | number)[] = [
          new Date((session.date as string) + "T00:00:00").toLocaleDateString(),
        ];
        goals.forEach((g) => {
          const sg = (session.session_goals as Record<string, unknown>[])?.find(
            (sg) => (sg.goal as Record<string, unknown> | null)?.id === g.id
          );
          if (sg) {
            row.push(`${sg.correct_count}/${sg.total_count} (${sg.percentage}%)`);
          } else {
            row.push("\u2014");
          }
        });
        row.push((session.notes as string) || "");
        return row;
      });

      const wsData = [
        [`Student: ${student.name}`],
        [`School: ${student.school?.name || ""}`],
        [`IEP Date: ${student.iep_date ? new Date(student.iep_date + "T00:00:00").toLocaleDateString() : "N/A"}`],
        [`Report Period: ${new Date(dateFrom + "T00:00:00").toLocaleDateString()} \u2014 ${new Date(dateTo + "T00:00:00").toLocaleDateString()}`],
        [],
        headerRow,
        ...dataRows,
      ];

      // Truncate sheet name to 31 chars (Excel limit)
      const sheetName = student.name.slice(0, 31);
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Auto-width columns
      ws["!cols"] = headerRow.map((_, i) => ({ wch: i === 0 ? 12 : 40 }));

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }

    // Download
    const filename = `Quarterly_Report_${dateFrom}_to_${dateTo}.xlsx`;
    XLSX.writeFile(wb, filename);
    setExporting(false);
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Export Quarterly Report</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 text-[15px]">Date Range</h2>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className={inputClass} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 text-[15px] mb-3">Filter by School</h2>
            <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}
              className={`${inputClass} cursor-pointer`}>
              <option value="">All Schools</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <button onClick={handleExport} disabled={exporting || selectedStudents.length === 0}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {exporting ? "Generating..." : `Export ${selectedStudents.length} Student${selectedStudents.length !== 1 ? "s" : ""}`}
          </button>
        </div>

        {/* Student Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 text-[15px]">Select Students</h2>
              <button onClick={selectAll} className="text-[13px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer">
                {filteredStudents.every((s) => selectedStudents.includes(s.id)) ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredStudents.map((student) => (
                <label key={student.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500/20 cursor-pointer"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.school?.name}</p>
                  </div>
                </label>
              ))}
              {filteredStudents.length === 0 && (
                <p className="px-5 py-10 text-center text-slate-400 text-sm">No students found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

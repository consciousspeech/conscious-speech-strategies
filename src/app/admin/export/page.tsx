"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Student, School } from "@/lib/supabase/types";
import {
  NO_DATA,
  attendanceText,
  buildStudentReport,
  goalColumnLabel,
  type ReportSessionInput,
  type ReportStudentInput,
  type StudentReport,
} from "@/lib/export-report";
import { matchesStudentSearch, searchKey } from "@/lib/student-search";
import * as XLSX from "xlsx";

export default function ExportPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState<"xlsx" | "docx" | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("students").select("*, school:schools(name)").eq("archived", false).order("name"),
      supabase.from("schools").select("*").eq("archived", false).order("name"),
    ]).then(([{ data: s }, { data: sc }]) => {
      if (s) setStudents(s as Student[]);
      if (sc) setSchools(sc);
    });
  }, []);

  const hasSearch = searchKey(search).length > 0;
  const filteredStudents = students.filter(
    (s) => (!schoolFilter || s.school_id === schoolFilter) && matchesStudentSearch(s, search)
  );

  // Students picked earlier stay picked when the search narrows past them, so
  // the count has to be reported separately from what is on screen.
  const hiddenSelectedCount = selectedStudents.filter(
    (id) => !filteredStudents.some((s) => s.id === id)
  ).length;

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

  /** Pull every selected student's sessions and turn them into report models. */
  async function loadReports(): Promise<{ student: Student; report: StudentReport }[]> {
    const out: { student: Student; report: StudentReport }[] = [];

    // Current-IEP service minutes for everyone in one query. The report header
    // has to show the same value the rest of the app reads, not the older
    // figure on the student record.
    const { data: iepRows } = await supabase
      .from("student_ieps")
      .select("student_id, service_minutes")
      .in("student_id", selectedStudents)
      .is("iep_year", null);
    const iepMinutes = new Map(
      ((iepRows || []) as { student_id: string; service_minutes: string | null }[]).map(
        (r) => [r.student_id, r.service_minutes]
      )
    );

    for (const studentId of selectedStudents) {
      const student = students.find((s) => s.id === studentId);
      if (!student) continue;

      // Sessions in the date range, with their linked goals fully expanded.
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*, session_goals(*, goal:goals(id, goal_number, description, iep_year))")
        .eq("student_id", studentId)
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date");

      out.push({
        student,
        report: buildStudentReport(
          student as ReportStudentInput,
          (sessions || []) as ReportSessionInput[],
          dateFrom,
          dateTo,
          { iepServiceMinutes: iepMinutes.get(studentId) ?? null }
        ),
      });
    }
    return out;
  }

  function validate(): boolean {
    if (selectedStudents.length === 0) {
      alert("Select at least one student.");
      return false;
    }
    if (!dateFrom || !dateTo) {
      alert("Select a date range.");
      return false;
    }
    return true;
  }

  async function handleExportExcel() {
    if (!validate()) return;
    setExporting("xlsx");
    try {
      const reports = await loadReports();
      const wb = XLSX.utils.book_new();

      for (const { student, report } of reports) {
        // One block per IEP: its own heading, its own goal columns, then its
        // sessions. A student whose IEP did not change has a single block.
        const blocks: string[][] = [];
        for (const segment of report.segments) {
          const span =
            segment.firstDate === segment.lastDate
              ? segment.firstDate
              : `${segment.firstDate} \u2014 ${segment.lastDate}`;
          blocks.push([`\u2500\u2500 ${segment.label} (${span}) \u2500\u2500`]);
          blocks.push([
            "Date",
            "Attendance",
            ...(report.hasPushIn ? ["Setting"] : []),
            ...segment.goals.map(goalColumnLabel),
            "Notes",
          ]);
          for (const row of segment.rows) {
            blocks.push([
              row.date,
              attendanceText(row.attendance),
              ...(report.hasPushIn ? [row.setting] : []),
              ...row.goalCells.map((lines) => (lines.length > 0 ? lines.join("\n") : NO_DATA)),
              row.notes,
            ]);
          }
          blocks.push([]);
        }

        const wsData = [
          ...report.headerFields.map((f) => [`${f.label}: ${f.value}`]),
          [],
          ...blocks,
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        // Widths follow the widest block, so the goal columns stay readable
        // whichever IEP has the most goals.
        const widestGoals = Math.max(0, ...report.segments.map((seg) => seg.goals.length));
        const settingCol = report.hasPushIn ? 2 : -1;
        const columnCount = widestGoals + (report.hasPushIn ? 4 : 3);
        ws["!cols"] = Array.from({ length: columnCount }, (_, i) => ({
          wch: i === 0 ? 12 : i === 1 ? 22 : i === settingCol ? 28 : 40,
        }));

        // Sheet names are capped at 31 characters by Excel.
        XLSX.utils.book_append_sheet(wb, ws, student.name.slice(0, 31));
      }

      XLSX.writeFile(wb, `Quarterly_Report_${dateFrom}_to_${dateTo}.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportWord() {
    if (!validate()) return;
    setExporting("docx");
    try {
      const reports = await loadReports();
      // docx and its zip writer are only needed on this click, so they stay
      // out of the initial page bundle.
      const [{ Packer }, { buildReportDocument }] = await Promise.all([
        import("docx"),
        import("@/lib/export-docx"),
      ]);
      const blob = await Packer.toBlob(buildReportDocument(reports.map((r) => r.report)));

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quarterly_Report_${dateFrom}_to_${dateTo}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
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

          <div className="space-y-2">
            <p className="text-[13px] text-slate-500 px-0.5">
              {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
            </p>
            <button onClick={handleExportWord} disabled={exporting !== null || selectedStudents.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {exporting === "docx" ? "Generating..." : "Export to Word"}
            </button>
            <button onClick={handleExportExcel} disabled={exporting !== null || selectedStudents.length === 0}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {exporting === "xlsx" ? "Generating..." : "Export to Excel"}
            </button>
          </div>
        </div>

        {/* Student Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 text-[15px]">Select Students</h2>
                <button
                  onClick={selectAll}
                  disabled={filteredStudents.length === 0}
                  className="text-[13px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer disabled:opacity-40"
                >
                  {filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.includes(s.id))
                    ? hasSearch || schoolFilter ? "Deselect these" : "Deselect All"
                    : hasSearch || schoolFilter ? "Select these" : "Select All"}
                </button>
              </div>
              <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or student number"
                  className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {hiddenSelectedCount > 0 && (
                <p className="text-[12px] text-slate-500">
                  {hiddenSelectedCount} selected student{hiddenSelectedCount === 1 ? " is" : "s are"} hidden by
                  the current filter, and will still be exported.
                </p>
              )}
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
                    <p className="text-xs text-slate-400">
                      {[student.school?.name, student.student_number].filter(Boolean).join(" \u00b7 ")}
                    </p>
                  </div>
                </label>
              ))}
              {filteredStudents.length === 0 && (
                <p className="px-5 py-10 text-center text-slate-400 text-sm">
                  {search ? `No students match \u201C${search}\u201D.` : "No students found."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Student, School } from "@/lib/supabase/types";

export default function StudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [archivedStudents, setArchivedStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ data: studentsData }, { data: archived }, { data: schoolsData }] = await Promise.all([
      supabase
        .from("students")
        .select("*, school:schools(name)")
        .eq("archived", false)
        .order("name"),
      supabase
        .from("students")
        .select("*, school:schools(name)")
        .eq("archived", true)
        .order("name"),
      supabase.from("schools").select("*").eq("archived", false).order("name"),
    ]);
    if (studentsData) setStudents(studentsData as Student[]);
    if (archived) setArchivedStudents(archived as Student[]);
    if (schoolsData) setSchools(schoolsData);
  }

  async function unarchiveStudent(id: string) {
    await supabase.from("students").update({ archived: false }).eq("id", id);
    loadData();
  }

  const list = tab === "active" ? students : archivedStudents;
  const filtered = list.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesSchool = !schoolFilter || s.school_id === schoolFilter;
    return matchesSearch && matchesSchool;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Students</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/students/import"
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Import
          </Link>
          <Link
            href="/admin/students/new"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            Add Student
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
              tab === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Active ({students.length})
          </button>
          <button
            onClick={() => setTab("archived")}
            className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
              tab === "archived" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Archived ({archivedStudents.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <select
          value={schoolFilter}
          onChange={(e) => setSchoolFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 cursor-pointer"
        >
          <option value="">All Schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((student) => (
              <div key={student.id} className="flex items-center">
                <Link
                  href={`/admin/students/${student.id}`}
                  className="px-5 py-4 flex-1 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-[14px]">{student.name}</p>
                    <p className="text-[13px] text-slate-400 mt-0.5">
                      {student.school?.name}
                      {student.grade && ` · Grade ${student.grade}`}
                      {student.eligibility && ` · ${student.eligibility}`}
                      {student.iep_date && ` · IEP: ${new Date(student.iep_date + "T00:00:00").toLocaleDateString()}`}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
                {tab === "archived" && (
                  <button
                    onClick={() => unarchiveStudent(student.id)}
                    className="mr-4 px-3 py-1.5 text-[12px] font-medium text-teal-600 hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Unarchive
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">
            {tab === "archived"
              ? "No archived students."
              : search || schoolFilter
                ? "No students match your filters."
                : "No students yet. Add your first student to get started."}
          </p>
        )}
      </div>
    </div>
  );
}

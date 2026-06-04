"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { computeHours } from "@/lib/utils";
import type { School } from "@/lib/supabase/types";

const SLAM_TAMPA_NAMES = ["SLAM Tampa Elem", "SLAM Tampa Middle/High"];

const SLAM_TAMPA_CATEGORIES = [
  "Speech Lang TX",
  "Therapy Prep",
  "Caseload Scheduling/Management",
  "IEP/Eval Meeting Prep/Paperwork",
  "IEP/Eval/Conference Meeting",
  "ESE Team Consult",
  "Teacher/Parent Consult",
  "Evals or Screenings",
  "Training",
  "Data Recording",
];

export default function LogHoursPage() {
  const supabase = createClient();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    school_id: "",
    date: new Date().toISOString().split("T")[0],
    time_in: "",
    time_out: "",
    description: "",
  });
  const [categoryRows, setCategoryRows] = useState<Array<{ category: string; hours: string }>>([
    { category: "", hours: "" },
  ]);

  const selectedSchool = schools.find((s) => s.id === form.school_id);
  const isSlamTampa = selectedSchool ? SLAM_TAMPA_NAMES.includes(selectedSchool.name) : false;

  const totalHours = computeHours(form.time_in, form.time_out);
  const timeError = form.time_in && form.time_out && totalHours === null ? "Time out must be after time in." : null;

  const categoryTotal = categoryRows.reduce((sum, row) => {
    const h = parseFloat(row.hours);
    return sum + (isNaN(h) ? 0 : h);
  }, 0);

  const validCategoryRows = categoryRows.filter((row) => {
    const h = parseFloat(row.hours);
    return row.category && !isNaN(h) && h > 0;
  });

  const categoryMismatch =
    isSlamTampa &&
    totalHours !== null &&
    categoryTotal > 0 &&
    Math.abs(categoryTotal - totalHours) > 0.001;

  useEffect(() => {
    supabase.from("schools").select("*").order("name").then(({ data }) => {
      if (data) setSchools(data);
    });
  }, []);

  function handleSchoolChange(newId: string) {
    setForm({ ...form, school_id: newId });
    setCategoryRows([{ category: "", hours: "" }]);
  }

  function addCategoryRow() {
    setCategoryRows([...categoryRows, { category: "", hours: "" }]);
  }

  function removeCategoryRow(index: number) {
    if (categoryRows.length === 1) return;
    setCategoryRows(categoryRows.filter((_, i) => i !== index));
  }

  function updateCategoryRow(index: number, field: "category" | "hours", value: string) {
    const updated = categoryRows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    setCategoryRows(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (isSlamTampa) {
      if (validCategoryRows.length === 0) {
        alert("Please add at least one category with hours greater than 0.");
        setSaving(false);
        return;
      }

      const inserts = validCategoryRows.map((row) => ({
        user_id: user?.id,
        school_id: form.school_id,
        date: form.date,
        hours: parseFloat(row.hours),
        time_in: form.time_in || null,
        time_out: form.time_out || null,
        description: form.description || null,
        category: row.category,
      }));

      const { error } = await supabase.from("hours").insert(inserts);

      if (error) {
        alert("Error logging hours: " + error.message);
        setSaving(false);
        return;
      }
    } else {
      if (totalHours === null) {
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("hours").insert({
        user_id: user?.id,
        school_id: form.school_id,
        date: form.date,
        hours: totalHours,
        time_in: form.time_in,
        time_out: form.time_out,
        description: form.description || null,
        category: null,
      });

      if (error) {
        alert("Error logging hours: " + error.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/hours");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  const isSubmitDisabled =
    saving ||
    totalHours === null ||
    (isSlamTampa && validCategoryRows.length === 0) ||
    (isSlamTampa && categoryMismatch);

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Log Hours</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
          <select required value={form.school_id} onChange={(e) => handleSchoolChange(e.target.value)}
            className={`${inputClass} cursor-pointer`}>
            <option value="">Select a school...</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Date *</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Time In *</label>
            <input type="time" required value={form.time_in}
              onChange={(e) => setForm({ ...form, time_in: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Time Out *</label>
            <input type="time" required value={form.time_out}
              onChange={(e) => setForm({ ...form, time_out: e.target.value })}
              className={inputClass} />
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-teal-700 uppercase tracking-wide">Total Hours</span>
          <span className="text-teal-700 font-semibold tabular-nums text-[15px]">
            {totalHours !== null
              ? totalHours.toFixed(2)
              : timeError
              ? <span className="text-red-600 text-[12px] font-medium normal-case tracking-normal">{timeError}</span>
              : "\u2014"}
          </span>
        </div>

        {isSlamTampa && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1">Category Breakdown *</label>
              <p className="text-[12px] text-slate-500">Split your total hours across categories below.</p>
            </div>

            {categoryRows.map((row, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={row.category}
                  onChange={(e) => updateCategoryRow(index, "category", e.target.value)}
                  className={`${inputClass} cursor-pointer flex-1`}
                >
                  <option value="">Select category...</option>
                  {SLAM_TAMPA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="Hours"
                  value={row.hours}
                  onChange={(e) => updateCategoryRow(index, "hours", e.target.value)}
                  className={`${inputClass} w-24 flex-none`}
                />
                <button
                  type="button"
                  onClick={() => removeCategoryRow(index)}
                  disabled={categoryRows.length === 1}
                  className="flex-none w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Remove row"
                >
                  &#x2715;
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addCategoryRow}
              className="text-[13px] font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
            >
              + Add Category
            </button>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-slate-600 uppercase tracking-wide">Category Total</span>
              <span className="text-slate-700 font-semibold tabular-nums text-[15px]">
                {categoryTotal > 0 ? categoryTotal.toFixed(2) : "\u2014"}
              </span>
            </div>

            {categoryMismatch && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5">
                <svg className="w-4 h-4 text-amber-500 flex-none mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div className="text-[12px] text-amber-700">
                  <p className="font-semibold">Category total ({categoryTotal.toFixed(2)}) must equal Total Hours ({totalHours!.toFixed(2)}).</p>
                  <p className="mt-0.5">Adjust the category breakdown so it adds up to {totalHours!.toFixed(2)}, or change the time range. Save is disabled until they match.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..." className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitDisabled}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Log Hours"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
        </div>
      </form>
    </div>
  );
}

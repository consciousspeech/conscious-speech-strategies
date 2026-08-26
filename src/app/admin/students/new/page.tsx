"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { School } from "@/lib/supabase/types";

export default function NewStudentPage() {
  const supabase = createClient();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", school_id: "", student_number: "", date_of_birth: "", grade: "",
    teacher: "", eligibility: "", service_minutes: "", iep_date: "", iep_re_eval_date: "",
    parent_phone: "", parent_phone_2: "", parent_email: "", notes: "",
  });
  const [goals, setGoals] = useState([{ description: "" }]);

  useEffect(() => {
    supabase.from("schools").select("*").eq("archived", false).order("name").then(({ data }) => {
      if (data) setSchools(data);
    });
  }, []);

  function addGoal() {
    setGoals([...goals, { description: "" }]);
  }

  function updateGoal(index: number, value: string) {
    const updated = [...goals];
    updated[index].description = value;
    setGoals(updated);
  }

  function removeGoal(index: number) {
    if (goals.length <= 1) return;
    setGoals(goals.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: student, error } = await supabase
      .from("students")
      .insert({
        name: form.name,
        school_id: form.school_id,
        student_number: form.student_number || null,
        date_of_birth: form.date_of_birth || null,
        grade: form.grade || null,
        teacher: form.teacher || null,
        eligibility: form.eligibility || null,
        service_minutes: form.service_minutes || null,
        iep_date: form.iep_date || null,
        iep_re_eval_date: form.iep_re_eval_date || null,
        parent_phone: form.parent_phone || null,
        parent_phone_2: form.parent_phone_2 || null,
        parent_email: form.parent_email || null,
        notes: form.notes || null,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error || !student) {
      alert("Error creating student: " + (error?.message || "Unknown error"));
      setSaving(false);
      return;
    }

    // Insert goals
    const validGoals = goals.filter((g) => g.description.trim());
    if (validGoals.length > 0) {
      await supabase.from("goals").insert(
        validGoals.map((g, i) => ({
          student_id: student.id,
          goal_number: i + 1,
          description: g.description.trim(),
        }))
      );
    }

    router.push(`/admin/students/${student.id}`);
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Add New Student</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-[15px]">Student Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
              <select required value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })}
                className={`${inputClass} cursor-pointer`}>
                <option value="">Select a school...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Student Number</label>
              <input value={form.student_number} onChange={(e) => setForm({ ...form, student_number: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Grade</label>
              <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={inputClass} placeholder="K, 1, 2..." />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Teacher</label>
              <input value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Eligibility</label>
              <input value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} className={inputClass} placeholder="SI, LI, DD..." />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Service Minutes</label>
              <input value={form.service_minutes} onChange={(e) => setForm({ ...form, service_minutes: e.target.value })} className={inputClass} placeholder="30 SI, 60 LI..." />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">IEP Date</label>
              <input type="date" value={form.iep_date} onChange={(e) => setForm({ ...form, iep_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Re-Eval Date</label>
              <input type="date" value={form.iep_re_eval_date} onChange={(e) => setForm({ ...form, iep_re_eval_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Parent Phone</label>
              <input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Parent Phone 2</label>
              <input value={form.parent_phone_2} onChange={(e) => setForm({ ...form, parent_phone_2: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Parent Email</label>
              <input type="email" value={form.parent_email} onChange={(e) => setForm({ ...form, parent_email: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputClass} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-[15px]">IEP Goals</h2>
            <button type="button" onClick={addGoal} className="text-[13px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer">
              + Add Goal
            </button>
          </div>

          {goals.map((goal, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[13px] text-slate-400 mt-3 w-6 shrink-0 tabular-nums">#{i + 1}</span>
              <textarea
                value={goal.description}
                onChange={(e) => updateGoal(i, e.target.value)}
                placeholder="Describe the goal..."
                rows={2}
                className={`flex-1 ${inputClass}`}
              />
              {goals.length > 1 && (
                <button type="button" onClick={() => removeGoal(i)}
                  className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer px-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Create Student"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

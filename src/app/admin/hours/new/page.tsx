"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { computeHours } from "@/lib/utils";
import type { School } from "@/lib/supabase/types";

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

  const totalHours = computeHours(form.time_in, form.time_out);
  const timeError = form.time_in && form.time_out && totalHours === null ? "Time out must be after time in." : null;

  useEffect(() => {
    supabase.from("schools").select("*").order("name").then(({ data }) => {
      if (data) setSchools(data);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (totalHours === null) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

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

    router.push("/admin/hours");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  const isSubmitDisabled = saving || totalHours === null;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Log Hours</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
          <select required value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })}
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
              : "—"}
          </span>
        </div>

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

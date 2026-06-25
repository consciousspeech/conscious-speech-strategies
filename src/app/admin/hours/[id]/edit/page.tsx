"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { computeHours } from "@/lib/utils";
import type { Profile, School } from "@/lib/supabase/types";

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

export default function EditHoursPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [schools, setSchools] = useState<School[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    user_id: "",
    school_id: "",
    date: "",
    time_in: "",
    time_out: "",
    description: "",
    category: "",
    hours: "",
  });

  const selectedSchool = schools.find((s) => s.id === form.school_id);
  const isSlamTampa = selectedSchool ? SLAM_TAMPA_NAMES.includes(selectedSchool.name) : false;
  const totalHours = computeHours(form.time_in, form.time_out);
  const timeError = form.time_in && form.time_out && totalHours === null ? "Time out must be after time in." : null;

  const slamHours = parseFloat(form.hours);
  const submitDisabled = isSlamTampa
    ? !(slamHours > 0) || !form.category
    : totalHours === null;

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      let adminFlag = false;
      if (user) {
        const { data: me } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        adminFlag = me?.role === "admin";
      }
      setIsAdmin(adminFlag);

      const [{ data: entry }, { data: sc }, { data: profiles }] = await Promise.all([
        supabase.from("hours").select("*").eq("id", id).single(),
        supabase.from("schools").select("*").order("name"),
        adminFlag
          ? supabase.from("profiles").select("*").order("name")
          : Promise.resolve({ data: null as Profile[] | null }),
      ]);

      if (sc) setSchools(sc);
      if (profiles) setStaff(profiles);
      if (entry) {
        setForm({
          user_id: entry.user_id || "",
          school_id: entry.school_id || "",
          date: entry.date || "",
          time_in: entry.time_in || "",
          time_out: entry.time_out || "",
          description: entry.description || "",
          category: entry.category || "",
          hours: entry.hours != null ? String(entry.hours) : "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitDisabled) return;
    setSaving(true);

    const hoursValue = isSlamTampa ? parseFloat(form.hours) : totalHours!;

    const { error } = await supabase.from("hours").update({
      ...(isAdmin && form.user_id ? { user_id: form.user_id } : {}),
      school_id: form.school_id,
      date: form.date,
      hours: hoursValue,
      time_in: form.time_in,
      time_out: form.time_out,
      description: form.description || null,
      category: form.category || null,
    }).eq("id", id);

    if (error) {
      alert("Error updating hours: " + error.message);
      setSaving(false);
      return;
    }

    router.push("/admin/hours");
  }

  async function handleDelete() {
    if (!confirm("Delete this hours entry?")) return;
    setDeleting(true);

    const { error } = await supabase.from("hours").delete().eq("id", id);
    if (error) {
      alert("Error deleting: " + error.message);
      setDeleting(false);
      return;
    }

    router.push("/admin/hours");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  if (loading) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Edit Hours</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
        {isAdmin && (
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Staff *</label>
            <select
              required
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Select staff...</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School *</label>
          <select required value={form.school_id} onChange={(e) => {
              const newId = e.target.value;
              const newSchool = schools.find((s) => s.id === newId);
              const newIsSlamTampa = newSchool ? SLAM_TAMPA_NAMES.includes(newSchool.name) : false;
              setForm({ ...form, school_id: newId, category: newIsSlamTampa ? form.category : "" });
            }}
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

        {isSlamTampa ? (
          <>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Category *</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={`${inputClass} cursor-pointer`}>
                <option value="">Select category...</option>
                {SLAM_TAMPA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Hours *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                placeholder="e.g. 1.5"
                className={inputClass}
              />
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-teal-700 uppercase tracking-wide">Total Hours</span>
              <span className="text-teal-700 font-semibold tabular-nums text-[15px]">
                {slamHours > 0 ? slamHours.toFixed(2) : "\u2014"}
              </span>
            </div>
          </>
        ) : (
          <div className="bg-teal-50 border border-teal-100 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-[12px] font-medium text-teal-700 uppercase tracking-wide">Total Hours</span>
            <span className="text-teal-700 font-semibold tabular-nums text-[15px]">
              {totalHours !== null ? totalHours.toFixed(2) : timeError ? <span className="text-red-600 text-[12px] font-medium normal-case tracking-normal">{timeError}</span> : "\u2014"}
            </span>
          </div>
        )}

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Description</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..." className={inputClass} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving || submitDisabled}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Update Hours"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto px-4 py-2.5 rounded-lg font-medium text-[13px] text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer">
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { School } from "@/lib/supabase/types";

export default function SchoolsPage() {
  const supabase = createClient();
  const [schools, setSchools] = useState<School[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", address: "", contact_name: "", contact_email: "", district_number: "" });

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    const { data } = await supabase.from("schools").select("*").order("name");
    if (data) setSchools(data);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await supabase.from("schools").update(form).eq("id", editingId);
    } else {
      await supabase.from("schools").insert(form);
    }
    setForm({ name: "", address: "", contact_name: "", contact_email: "", district_number: "" });
    setShowForm(false);
    setEditingId(null);
    loadSchools();
  }

  async function seedSchools() {
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    alert(data.message || data.error);
    loadSchools();
  }

  function startEdit(school: School) {
    setForm({
      name: school.name,
      address: school.address || "",
      contact_name: school.contact_name || "",
      contact_email: school.contact_email || "",
      district_number: school.district_number || "",
    });
    setEditingId(school.id);
    setShowForm(true);
  }

  async function toggleArchive(school: School) {
    const nowArchived = !school.archived;
    const label = nowArchived ? "archive" : "restore";
    if (!confirm(`${nowArchived ? "Archive" : "Restore"} "${school.name}"? ${nowArchived ? "It will be hidden from every school selector, but the students, sessions, and invoice history stay intact." : ""}`)) return;
    const { error } = await supabase.from("schools").update({ archived: nowArchived }).eq("id", school.id);
    if (error) return alert(`Error trying to ${label}: ${error.message}`);
    loadSchools();
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  const visibleSchools = schools.filter((s) => showArchived || !s.archived);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Schools</h1>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-500 cursor-pointer">
            <input type="checkbox" checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/20 cursor-pointer" />
            Show archived
          </label>
          {schools.length === 0 && (
            <button
              onClick={seedSchools}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
            >
              Seed Sample Schools
            </button>
          )}
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", address: "", contact_name: "", contact_email: "", district_number: "" }); }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            {showForm ? "Cancel" : "Add School"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Contact Name</label>
              <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Contact Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">District Number</label>
              <input value={form.district_number} onChange={(e) => setForm({ ...form, district_number: e.target.value })} className={inputClass} placeholder="e.g. 29" />
            </div>
          </div>
          <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer">
            {editingId ? "Update School" : "Add School"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
        {visibleSchools.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {visibleSchools.map((school) => (
              <div key={school.id} className={`px-5 py-4 flex items-center justify-between ${school.archived ? "opacity-60" : ""}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-[14px]">{school.name}</p>
                    {school.archived && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                        Archived
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    {[school.district_number && `District ${school.district_number}`, school.address, school.contact_name, school.contact_email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => startEdit(school)}
                    className="text-[13px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleArchive(school)}
                    className={`text-[13px] font-medium cursor-pointer ${school.archived ? "text-teal-600 hover:text-teal-700" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    {school.archived ? "Restore" : "Archive"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">
            {schools.length === 0
              ? "No schools added yet. Add your first school to get started."
              : "No active schools. Toggle “Show archived” to see closed campuses."}
          </p>
        )}
      </div>
    </div>
  );
}

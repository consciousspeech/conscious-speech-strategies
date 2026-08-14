"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import type { Role, School } from "@/lib/supabase/types";

interface SchoolRateRow {
  school_id: string;
  external_rate: string;
  internal_rate: string;
}

export default function EditStaffPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [internalRate, setInternalRate] = useState("");
  const [externalRate, setExternalRate] = useState("");
  const [archived, setArchived] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolRates, setSchoolRates] = useState<Record<string, SchoolRateRow>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: profile }, { data: schoolList }, { data: rates }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("schools").select("*").order("name"),
        supabase.from("profile_school_rates").select("*").eq("profile_id", id),
      ]);

      if (profile) {
        setName(profile.name);
        setPhone(profile.phone || "");
        setRole(profile.role);
        setInternalRate(profile.internal_rate != null ? String(profile.internal_rate) : "");
        setExternalRate(profile.external_rate != null ? String(profile.external_rate) : "");
        setArchived(!!profile.archived);
      }

      setSchools(schoolList || []);

      const map: Record<string, SchoolRateRow> = {};
      (rates || []).forEach((r: { school_id: string; external_rate: number | null; internal_rate: number | null }) => {
        map[r.school_id] = {
          school_id: r.school_id,
          external_rate: r.external_rate != null ? String(r.external_rate) : "",
          internal_rate: r.internal_rate != null ? String(r.internal_rate) : "",
        };
      });
      setSchoolRates(map);

      setLoading(false);
    }
    load();
  }, [id]);

  function updateSchoolRate(schoolId: string, field: "external_rate" | "internal_rate", value: string) {
    setSchoolRates((prev) => ({
      ...prev,
      [schoolId]: {
        school_id: schoolId,
        external_rate: prev[schoolId]?.external_rate ?? "",
        internal_rate: prev[schoolId]?.internal_rate ?? "",
        [field]: value,
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        phone: phone || null,
        role,
        internal_rate: internalRate ? parseFloat(internalRate) : null,
        external_rate: externalRate ? parseFloat(externalRate) : null,
      })
      .eq("id", id);

    if (error) {
      alert("Error saving profile: " + error.message);
      setSaving(false);
      return;
    }

    // Reconcile per-school rates: upsert rows that have any value, delete rows cleared to blank.
    const toUpsert: { profile_id: string; school_id: string; external_rate: number | null; internal_rate: number | null }[] = [];
    const toDelete: string[] = [];

    Object.values(schoolRates).forEach((row) => {
      const ext = row.external_rate.trim();
      const int = row.internal_rate.trim();
      if (ext === "" && int === "") {
        toDelete.push(row.school_id);
      } else {
        toUpsert.push({
          profile_id: id,
          school_id: row.school_id,
          external_rate: ext ? parseFloat(ext) : null,
          internal_rate: int ? parseFloat(int) : null,
        });
      }
    });

    if (toUpsert.length > 0) {
      const { error: upErr } = await supabase
        .from("profile_school_rates")
        .upsert(toUpsert, { onConflict: "profile_id,school_id" });
      if (upErr) {
        alert("Error saving school rates: " + upErr.message);
        setSaving(false);
        return;
      }
    }

    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("profile_school_rates")
        .delete()
        .eq("profile_id", id)
        .in("school_id", toDelete);
      if (delErr) {
        alert("Error clearing school rates: " + delErr.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/staff");
  }

  async function toggleArchive() {
    const nowArchived = !archived;
    const label = nowArchived ? "archive" : "restore";
    if (!confirm(`Are you sure you want to ${label} ${name}? ${nowArchived ? "They will be hidden from all staff selectors, but their history will be preserved." : ""}`)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ archived: nowArchived })
      .eq("id", id);

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    setArchived(nowArchived);
    if (nowArchived) router.push("/admin/staff");
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";
  const smallInput = "w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-[13px] text-slate-900 placeholder:text-slate-400 tabular-nums";

  if (loading) {
    return <p className="text-slate-400 text-sm py-10 text-center">Loading...</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-[13px] text-slate-400">
          <a href="/admin/staff" className="hover:text-slate-600 transition-colors cursor-pointer">Staff</a>
          {" / Edit"}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Edit Staff Member</h1>
          {archived && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
              Archived
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className={inputClass} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${inputClass} cursor-pointer`}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div>
            <p className="text-[13px] font-medium text-slate-700">Default Rates</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Used when no per-school override is set below.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Internal Rate ($/hr)</label>
              <input type="number" step="0.01" min="0" value={internalRate}
                onChange={(e) => setInternalRate(e.target.value)}
                placeholder="0.00" className={inputClass} />
              <p className="text-[11px] text-slate-400 mt-1">Used for timesheets</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">External Rate ($/hr)</label>
              <input type="number" step="0.01" min="0" value={externalRate}
                onChange={(e) => setExternalRate(e.target.value)}
                placeholder="0.00" className={inputClass} />
              <p className="text-[11px] text-slate-400 mt-1">Used for school invoices</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div>
            <p className="text-[13px] font-medium text-slate-700">Per-School Rate Overrides</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Leave blank to use the default rates above. Overrides apply to invoices and timesheets for that school.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 text-xs font-medium text-slate-500">School</th>
                  <th className="pb-2 text-xs font-medium text-slate-500 w-32">External ($/hr)</th>
                  <th className="pb-2 text-xs font-medium text-slate-500 w-32">Internal ($/hr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-4 text-slate-700">{s.name}</td>
                    <td className="py-2 pr-2">
                      <input type="number" step="0.01" min="0"
                        value={schoolRates[s.id]?.external_rate ?? ""}
                        onChange={(e) => updateSchoolRate(s.id, "external_rate", e.target.value)}
                        placeholder="—" className={smallInput} />
                    </td>
                    <td className="py-2">
                      <input type="number" step="0.01" min="0"
                        value={schoolRates[s.id]?.internal_rate ?? ""}
                        onChange={(e) => updateSchoolRate(s.id, "internal_rate", e.target.value)}
                        placeholder="—" className={smallInput} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button type="submit" disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
            Cancel
          </button>
          <div className="ml-auto">
            <button type="button" onClick={toggleArchive}
              className={`px-4 py-2.5 rounded-lg font-medium text-[13px] transition-colors cursor-pointer border ${
                archived
                  ? "border-teal-200 text-teal-700 hover:bg-teal-50"
                  : "border-red-200 text-red-600 hover:bg-red-50"
              }`}>
              {archived ? "Restore Staff" : "Archive Staff"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

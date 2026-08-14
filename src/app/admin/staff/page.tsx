"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";

export default function StaffPage() {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rate, setRate] = useState("");

  const supabase = createClient();

  async function loadStaff() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name");

    if (error) {
      console.error("Failed to load staff:", error.message);
      return;
    }

    setStaff(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/create-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone: phone || undefined,
          rate_per_hour: rate ? parseFloat(rate) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create staff member");
        return;
      }

      setSuccess(`${name} has been invited! They'll receive an email to set their password.`);
      setEmail("");
      setName("");
      setPhone("");
      setRate("");
      setShowForm(false);
      loadStaff();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Staff</h1>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[13px] text-slate-500 cursor-pointer">
            <input type="checkbox" checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500/20 cursor-pointer" />
            Show archived
          </label>
          <button
            onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            {showForm ? "Cancel" : "+ Add Staff"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          {success}
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
          <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Add New Staff Member</h2>
          <p className="text-xs text-slate-400 mb-4">
            They&apos;ll receive an email invitation to set their password and log in.
          </p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+12125551234"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">For SMS texting — use +1 format</p>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Hourly Rate</label>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="75.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Sending Invite..." : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">Loading staff...</p>
        ) : staff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left bg-slate-50/50">
                  <th className="px-5 py-3 text-slate-500 font-medium">Name</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Role</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Phone</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">Internal Rate</th>
                  <th className="px-5 py-3 text-slate-500 font-medium">External Rate</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff
                  .filter((s) => showArchived || !s.archived)
                  .map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${s.archived ? "opacity-60" : ""}`}>
                    <td className="px-5 py-3 text-slate-900 font-medium">
                      <div className="flex items-center gap-2">
                        {s.name}
                        {s.archived && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            Archived
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        s.role === "admin" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.phone || "\u2014"}</td>
                    <td className="px-5 py-3 text-slate-900 tabular-nums">{s.internal_rate != null ? `$${Number(s.internal_rate).toFixed(2)}` : "\u2014"}</td>
                    <td className="px-5 py-3 text-slate-900 tabular-nums">{s.external_rate != null ? `$${Number(s.external_rate).toFixed(2)}` : "\u2014"}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/staff/${s.id}`}
                        className="text-teal-600 hover:text-teal-700 font-medium text-[12px] cursor-pointer">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-slate-400 text-sm">No staff members found.</p>
        )}
      </div>
    </div>
  );
}

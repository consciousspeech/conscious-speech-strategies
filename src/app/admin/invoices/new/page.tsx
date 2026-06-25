"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { School } from "@/lib/supabase/types";

interface HourEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  category: string | null;
  profile: { name: string } | null;
  rate: number;
}

export default function NewInvoicePage() {
  const supabase = createClient();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hourEntries, setHourEntries] = useState<HourEntry[]>([]);
  const [fees, setFees] = useState<{ description: string; amount: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  function addFee() {
    setFees((prev) => [...prev, { description: "", amount: "" }]);
  }
  function updateFee(idx: number, field: "description" | "amount", value: string) {
    setFees((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  }
  function removeFee(idx: number) {
    setFees((prev) => prev.filter((_, i) => i !== idx));
  }

  useEffect(() => {
    supabase.from("schools").select("*").order("name").then(({ data }) => {
      if (data) setSchools(data);
    });
    supabase.from("profiles").select("id, name").order("name").then(({ data }) => {
      if (data) setStaff(data.filter((p) => p.name));
    });
  }, []);

  async function pullHours() {
    if (!schoolId || !dateFrom || !dateTo) return alert("Select a school and date range.");
    setLoading(true);

    let query = supabase
      .from("hours")
      .select("*, profile:profiles!user_id(name, rate_per_hour, external_rate)")
      .eq("school_id", schoolId)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date");

    if (staffId) {
      query = query.eq("user_id", staffId);
    }

    const { data } = await query;

    if (data) {
      setHourEntries(
        data.map((h: Record<string, unknown>) => ({
          id: h.id as string,
          date: h.date as string,
          hours: Number(h.hours),
          description: h.description as string | null,
          category: h.category as string | null,
          profile: h.profile as { name: string } | null,
          rate: Number((h.profile as Record<string, unknown>)?.external_rate) || Number((h.profile as Record<string, unknown>)?.rate_per_hour) || 75,
        }))
      );
    }
    setLoading(false);
  }

  function updateRate(id: string, rate: number) {
    setHourEntries((prev) => prev.map((h) => (h.id === id ? { ...h, rate } : h)));
  }

  const hoursAmount = hourEntries.reduce((sum, h) => sum + h.hours * h.rate, 0);
  const feesAmount = fees.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
  const totalAmount = hoursAmount + feesAmount;

  async function handleSave() {
    if (hourEntries.length === 0) return;
    setSaving(true);

    // Get next invoice number (starting at 119)
    const { data: maxRow } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("invoice_number", { ascending: false })
      .limit(1)
      .single();
    const nextNumber = Math.max((maxRow?.invoice_number as number) || 118, 118) + 1;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        school_id: schoolId,
        period_start: dateFrom,
        period_end: dateTo,
        total_amount: totalAmount,
        status: "draft",
        invoice_number: nextNumber,
      })
      .select()
      .single();

    if (error || !invoice) {
      alert("Error creating invoice: " + (error?.message || "Unknown error"));
      setSaving(false);
      return;
    }

    // Fetch user_ids for the hours to create invoice_lines
    const { data: hoursWithUsers } = await supabase
      .from("hours")
      .select("id, user_id, date, hours")
      .in("id", hourEntries.map((h) => h.id));

    if (hoursWithUsers) {
      const lines = hoursWithUsers.map((h: Record<string, unknown>) => {
        const entry = hourEntries.find((e) => e.id === h.id);
        return {
          invoice_id: invoice.id,
          user_id: h.user_id,
          date: h.date,
          hours: Number(h.hours),
          rate: entry?.rate || 75,
          amount: Number(h.hours) * (entry?.rate || 75),
          description: entry?.description,
          category: entry?.category,
        };
      });

      await supabase.from("invoice_lines").insert(lines);
    }

    // Insert any late fees / adjustments as additional zero-hour lines.
    // Negative amounts are allowed for overpayment credits or refunds.
    const feeLines = fees
      .filter((f) => {
        const amt = parseFloat(f.amount);
        return f.description.trim() && !isNaN(amt) && amt !== 0;
      })
      .map((f) => ({
        invoice_id: invoice.id,
        user_id: null,
        date: dateTo,
        hours: 0,
        rate: 0,
        amount: parseFloat(f.amount),
        description: f.description.trim(),
      }));
    if (feeLines.length > 0) {
      await supabase.from("invoice_lines").insert(feeLines);
    }

    router.push(`/admin/invoices/${invoice.id}`);
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-6">Generate Invoice</h1>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">School</label>
            <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}
              className={`${inputClass} cursor-pointer`}>
              <option value="">Select...</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Staff</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}
              className={`${inputClass} cursor-pointer`}>
              <option value="">All</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
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
          <div className="flex items-end">
            <button onClick={pullHours} disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? "Loading..." : "Pull Hours"}
            </button>
          </div>
        </div>
      </div>

      {hourEntries.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-left bg-slate-50/50">
                    <th className="px-5 py-3 text-slate-500 font-medium">Date</th>
                    <th className="px-5 py-3 text-slate-500 font-medium">Staff</th>
                    <th className="px-5 py-3 text-slate-500 font-medium">Hours</th>
                    <th className="px-5 py-3 text-slate-500 font-medium">Rate</th>
                    <th className="px-5 py-3 text-slate-500 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hourEntries.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-slate-900 tabular-nums">{new Date(h.date).toLocaleDateString("en-US", { timeZone: "UTC" })}</td>
                      <td className="px-5 py-3 text-slate-600">{h.profile?.name || "\u2014"}</td>
                      <td className="px-5 py-3 text-slate-900 tabular-nums">{h.hours.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <input type="number" step="0.01" value={h.rate}
                          onChange={(e) => updateRate(h.id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all tabular-nums" />
                      </td>
                      <td className="px-5 py-3 text-slate-900 font-semibold tabular-nums">${(h.hours * h.rate).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/30">
                    <td colSpan={2} className="px-5 py-3.5 text-right font-semibold text-slate-900">Hours subtotal:</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">{hourEntries.reduce((sum, h) => sum + h.hours, 0).toFixed(2)}</td>
                    <td></td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-base tabular-nums">${hoursAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Late Fees & Adjustments */}
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900 text-[15px]">Late Fees &amp; Adjustments</h2>
                <p className="text-[13px] text-slate-400 mt-0.5">Add late fees from previous invoices or other one-time charges.</p>
              </div>
              <button type="button" onClick={addFee}
                className="text-[13px] font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer">
                + Add Fee
              </button>
            </div>
            {fees.length === 0 ? (
              <p className="text-[13px] text-slate-400 italic">No additional fees.</p>
            ) : (
              <div className="space-y-3">
                {fees.map((fee, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <input
                      type="text"
                      placeholder="Description (e.g. Late fee — Invoice #119)"
                      value={fee.description}
                      onChange={(e) => updateFee(idx, "description", e.target.value)}
                      className={`${inputClass} flex-1`}
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={fee.amount}
                        onChange={(e) => updateFee(idx, "amount", e.target.value)}
                        className={`${inputClass} w-32 pl-7 tabular-nums`}
                      />
                    </div>
                    <button type="button" onClick={() => removeFee(idx)}
                      aria-label="Remove fee"
                      className="flex-none w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                      &#x2715;
                    </button>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-3 mt-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-700">Fees subtotal</span>
                  <span className="text-[15px] font-bold text-slate-900 tabular-nums">${feesAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Grand total */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
            <span className="text-[14px] font-semibold text-teal-700 uppercase tracking-wide">Invoice total</span>
            <span className="text-[20px] font-bold text-teal-700 tabular-nums">${totalAmount.toFixed(2)}</span>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? "Saving..." : "Save Invoice"}
            </button>
            <button type="button" onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg font-medium text-[13px] text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

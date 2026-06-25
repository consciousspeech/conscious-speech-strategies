"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

// Schools where the invoice line column should show the work category
// (e.g. "Speech Lang TX", "IEP Meeting Prep") instead of the staff name.
const SLAM_TAMPA_NAMES = ["SLAM Tampa Elem", "SLAM Tampa Middle/High"];

interface Props {
  invoice: Record<string, unknown>;
  lines: Record<string, unknown>[];
}

export default function InvoiceEditor({ invoice, lines }: Props) {
  const schoolName =
    ((invoice.school as Record<string, unknown>)?.name as string) || "";
  const useCategoryColumn = SLAM_TAMPA_NAMES.includes(schoolName);
  const supabase = createClient();
  const router = useRouter();

  const [invoiceNumber, setInvoiceNumber] = useState<number>(
    (invoice.invoice_number as number) || 119
  );
  const [notes, setNotes] = useState<string>(
    (invoice.notes as string) || ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Local state so an optimistic update lets the printed view see the new
  // submitted_date immediately, before router.refresh() has re-rendered.
  const [submittedDate, setSubmittedDate] = useState<string | null>(
    (invoice.submitted_date as string | null) || null
  );

  const totalHours = lines.reduce(
    (sum, l) => sum + Number(l.hours),
    0
  );

  const periodStart = new Date(
    invoice.period_start as string
  ).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const periodEnd = new Date(
    invoice.period_end as string
  ).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function getSubmittedDisplay() {
    if (!submittedDate) return null;
    return new Date(submittedDate).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function getDueDisplay() {
    if (!submittedDate) return null;
    const due = new Date(submittedDate + "T00:00:00Z");
    due.setUTCDate(due.getUTCDate() + 30);
    return due.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("invoices")
      .update({
        invoice_number: invoiceNumber,
        notes: notes || null,
      })
      .eq("id", invoice.id as string);
    setSaving(false);
    router.refresh();
  }

  async function handleSubmitAndPrint() {
    const today = new Date().toISOString().split("T")[0];
    // Optimistically update local state so the Due Date renders before print
    setSubmittedDate(today);
    await supabase
      .from("invoices")
      .update({
        invoice_number: invoiceNumber,
        notes: notes || null,
        submitted_date: today,
        status: "sent",
      })
      .eq("id", invoice.id as string);
    router.refresh();
    setTimeout(() => window.print(), 300);
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this invoice? This cannot be undone."
      )
    )
      return;
    setDeleting(true);
    await supabase
      .from("invoice_lines")
      .delete()
      .eq("invoice_id", invoice.id as string);
    await supabase
      .from("invoices")
      .delete()
      .eq("id", invoice.id as string);
    router.push("/admin/invoices");
  }

  const inputClass =
    "px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900";

  return (
    <div className="max-w-3xl">
      {/* Admin controls - hidden on print */}
      <div className="no-print mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Invoice #{invoiceNumber}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleSubmitAndPrint}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
            >
              Submit & Print
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-white border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Invoice Number
              </label>
              <input
                type="number"
                value={invoiceNumber}
                onChange={(e) =>
                  setInvoiceNumber(parseInt(e.target.value) || 0)
                }
                className={`${inputClass} w-32`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes to include on the invoice..."
                className={`${inputClass} w-full resize-none`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable invoice */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm print:shadow-none print:border-0 print:rounded-none">
        {/* Invoice Header with Logo */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100 print:border-sage/30">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/Logo.png"
                alt="Conscious Speech Strategies"
                width={64}
                height={64}
                className="rounded-lg"
              />
              <div>
                <h2
                  className="text-xl font-semibold text-charcoal tracking-tight"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  Conscious Speech Strategies
                </h2>
                <p className="text-sm text-charcoal-light/70 mt-0.5">
                  Rachel Degani, M.S., CCC-SLP
                </p>
                <p className="text-xs text-charcoal-light/60 mt-0.5">
                  4500 25th Ave S, St. Petersburg, FL 33711
                </p>
                <p className="text-xs text-charcoal-light/60">
                  (561) 866-5109
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className="text-2xl font-semibold text-charcoal tracking-tight"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Invoice
              </p>
              <p className="text-sm text-charcoal font-medium mt-1 tabular-nums">
                #{invoiceNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Period, Bill To, Dates */}
        <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-slate-100 print:border-sage/30">
          <div>
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-2">
              Bill To
            </p>
            <p className="font-semibold text-charcoal text-[15px]">
              {(invoice.school as Record<string, unknown>)?.name as string}
              {(invoice.school as Record<string, unknown>)?.district_number ? (
                <span className="ml-2 font-normal text-charcoal-light/70">
                  #{(invoice.school as Record<string, unknown>).district_number as string}
                </span>
              ) : null}
            </p>
            {String(
              (invoice.school as Record<string, unknown>)
                ?.contact_name || ""
            ) && (
              <p className="text-sm text-charcoal-light/70 mt-0.5">
                {String(
                  (invoice.school as Record<string, unknown>)
                    ?.contact_name || ""
                )}
              </p>
            )}
            {String(
              (invoice.school as Record<string, unknown>)?.address ||
                ""
            ) && (
              <p className="text-sm text-charcoal-light/70 mt-0.5">
                {String(
                  (invoice.school as Record<string, unknown>)
                    ?.address || ""
                )}
              </p>
            )}
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-1">
                Service Period
              </p>
              <p className="text-sm text-charcoal tabular-nums">
                {periodStart}
              </p>
              <p className="text-sm text-charcoal tabular-nums">
                through {periodEnd}
              </p>
            </div>
            {getSubmittedDisplay() && (
              <div>
                <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-1">
                  Submitted
                </p>
                <p className="text-sm text-charcoal tabular-nums">
                  {getSubmittedDisplay()}
                </p>
              </div>
            )}
            {getDueDisplay() && (
              <div>
                <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-1">
                  Due Date
                </p>
                <p className="text-sm text-charcoal font-semibold tabular-nums">
                  {getDueDisplay()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="px-8 py-6">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b-2 border-sage/30 text-left">
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                  Date
                </th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                  {useCategoryColumn ? "Category" : "Staff"}
                </th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                  Hours
                </th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                  Rate
                </th>
                <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map(
                (line: Record<string, unknown>, i: number) => {
                  // Lines with 0 hours are fees / adjustments \u2014 render the
                  // description across the middle columns instead of the
                  // staff/category + hours + rate cells.
                  const isFee = Number(line.hours) === 0;
                  const rowClass =
                    i % 2 === 0 ? "bg-cream/30 print:bg-cream/40" : "";
                  if (isFee) {
                    return (
                      <tr key={line.id as string} className={rowClass}>
                        <td className="px-0 py-2.5 text-charcoal tabular-nums">
                          {new Date(line.date as string).toLocaleDateString(
                            "en-US",
                            { timeZone: "UTC", month: "short", day: "numeric" }
                          )}
                        </td>
                        <td
                          colSpan={3}
                          className="px-0 py-2.5 text-charcoal italic"
                        >
                          {(line.description as string) || "Fee"}
                        </td>
                        <td className="px-0 py-2.5 text-charcoal font-medium text-right tabular-nums">
                          ${Number(line.amount).toFixed(2)}
                        </td>
                      </tr>
                    );
                  }
                  return (
                  <tr
                    key={line.id as string}
                    className={rowClass}
                  >
                    <td className="px-0 py-2.5 text-charcoal tabular-nums">
                      {new Date(
                        line.date as string
                      ).toLocaleDateString("en-US", {
                        timeZone: "UTC",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-0 py-2.5 text-charcoal-light">
                      {useCategoryColumn
                        ? ((line.category as string) ||
                            ((line.profile as Record<string, unknown>)
                              ?.name as string) ||
                            "\u2014")
                        : ((line.profile as Record<string, unknown>)
                            ?.name as string) || "\u2014"}
                    </td>
                    <td className="px-0 py-2.5 text-charcoal tabular-nums">
                      {Number(line.hours).toFixed(2)}
                    </td>
                    <td className="px-0 py-2.5 text-charcoal-light tabular-nums">
                      ${Number(line.rate).toFixed(2)}/hr
                    </td>
                    <td className="px-0 py-2.5 text-charcoal font-medium text-right tabular-nums">
                      ${Number(line.amount).toFixed(2)}
                    </td>
                  </tr>
                  );
                }
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-sage/30">
                <td
                  colSpan={2}
                  className="pt-3 pb-1 text-right text-sm font-semibold text-charcoal"
                >
                  Total Hours:
                </td>
                <td className="pt-3 pb-1 text-sm font-bold text-charcoal tabular-nums">
                  {totalHours.toFixed(2)}
                </td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td
                  colSpan={4}
                  className="pb-3 text-right text-sm font-semibold text-charcoal"
                >
                  Total Due:
                </td>
                <td className="pb-3 text-right">
                  <span className="text-xl font-bold text-charcoal tabular-nums">
                    ${Number(invoice.total_amount).toFixed(2)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payable to */}
        <div className="px-8 pb-6 avoid-page-break">
          <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-1">
            Make Checks Payable To
          </p>
          <p className="text-sm font-semibold text-charcoal">
            Conscious Speech Strategies LLC
          </p>
        </div>

        {/* Notes */}
        {notes && (
          <div className="px-8 pb-6 avoid-page-break">
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-2">
              Notes
            </p>
            <p className="text-sm text-charcoal-light whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-5 border-t border-sage/20 bg-cream/30 print:bg-cream/40 rounded-b-xl print:rounded-none avoid-page-break">
          <p className="text-center text-xs text-charcoal-light/60">
            Thank you for your partnership in supporting our students.
          </p>
        </div>
      </div>
    </div>
  );
}

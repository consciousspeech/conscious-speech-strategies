"use client";

import Image from "next/image";
import Link from "next/link";

interface HourEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  category: string | null;
  time_in: string | null;
  time_out: string | null;
  school: { name: string } | null;
}

interface Timesheet {
  id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  notes: string | null;
  profile: {
    name: string;
    rate_per_hour: number | null;
    internal_rate: number | null;
  } | null;
}

interface Props {
  timesheet: Timesheet;
  hours: HourEntry[];
}

export default function PrintableTimesheet({ timesheet, hours }: Props) {
  const profileName = timesheet.profile?.name || "Unknown";
  const rate =
    timesheet.profile?.internal_rate ??
    timesheet.profile?.rate_per_hour ??
    0;
  const totalHours = Number(timesheet.total_hours) || 0;
  const totalPay = totalHours * rate;

  const fmtDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const fmtShortDate = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    });

  const submittedDisplay = timesheet.submitted_at
    ? new Date(timesheet.submitted_at).toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-3xl">
      {/* Admin controls — hidden on print */}
      <div className="no-print mb-6 flex items-center justify-between gap-4">
        <Link
          href="/admin/payments"
          className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Back to payments
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
        >
          Print
        </button>
      </div>

      {/* Printable timesheet */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm print:shadow-none print:border-0 print:rounded-none">
        {/* Header with logo */}
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
                  Rachel Dee, M.S., CCC-SLP
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
                Timesheet
              </p>
              <p className="text-xs text-charcoal-light/60 uppercase tracking-widest mt-1">
                {timesheet.status}
              </p>
            </div>
          </div>
        </div>

        {/* Staff, period, dates */}
        <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-slate-100 print:border-sage/30">
          <div>
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-2">
              Staff
            </p>
            <p className="font-semibold text-charcoal text-[15px]">
              {profileName}
            </p>
            {rate > 0 && (
              <p className="text-sm text-charcoal-light/70 mt-0.5 tabular-nums">
                ${rate.toFixed(2)}/hr
              </p>
            )}
          </div>
          <div className="text-right space-y-3">
            <div>
              <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-1">
                Period
              </p>
              <p className="text-sm text-charcoal tabular-nums">
                {fmtDate(timesheet.period_start)}
              </p>
              <p className="text-sm text-charcoal tabular-nums">
                through {fmtDate(timesheet.period_end)}
              </p>
            </div>
            {submittedDisplay && (
              <div>
                <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-1">
                  Submitted
                </p>
                <p className="text-sm text-charcoal tabular-nums">
                  {submittedDisplay}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hours table */}
        <div className="px-8 py-6">
          {hours.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b-2 border-sage/30 text-left">
                  <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                    Date
                  </th>
                  <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                    School
                  </th>
                  <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                    Time
                  </th>
                  <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold">
                    Category
                  </th>
                  <th className="pb-3 text-[10px] text-sage-dark uppercase tracking-widest font-semibold text-right">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h, i) => (
                  <tr
                    key={h.id}
                    className={
                      i % 2 === 0 ? "bg-cream/30 print:bg-cream/40" : ""
                    }
                  >
                    <td className="px-2 py-2.5 text-charcoal tabular-nums">
                      {fmtShortDate(h.date)}
                    </td>
                    <td className="px-2 py-2.5 text-charcoal-light">
                      {h.school?.name || "—"}
                    </td>
                    <td className="px-2 py-2.5 text-charcoal-light tabular-nums">
                      {h.time_in && h.time_out
                        ? `${h.time_in} – ${h.time_out}`
                        : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-charcoal-light">
                      {h.category || "—"}
                    </td>
                    <td className="px-2 py-2.5 text-charcoal font-medium text-right tabular-nums">
                      {Number(h.hours).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sage/30">
                  <td
                    colSpan={4}
                    className="pt-3 pb-1 text-right text-sm font-semibold text-charcoal"
                  >
                    Total Hours:
                  </td>
                  <td className="pt-3 pb-1 text-right text-sm font-bold text-charcoal tabular-nums">
                    {totalHours.toFixed(2)}
                  </td>
                </tr>
                {rate > 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="pb-3 text-right text-sm font-semibold text-charcoal"
                    >
                      Total Pay (@ ${rate.toFixed(2)}/hr):
                    </td>
                    <td className="pb-3 text-right">
                      <span className="text-xl font-bold text-charcoal tabular-nums">
                        ${totalPay.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-charcoal-light/60 italic">
              No hours linked to this timesheet.
            </p>
          )}
        </div>

        {/* Notes */}
        {timesheet.notes && (
          <div className="px-8 pb-6">
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mb-2">
              Notes
            </p>
            <p className="text-sm text-charcoal-light whitespace-pre-wrap">
              {timesheet.notes}
            </p>
          </div>
        )}

        {/* Signature block */}
        <div className="px-8 pb-8 pt-2 grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-charcoal/40 h-10" />
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mt-2">
              Staff Signature &amp; Date
            </p>
          </div>
          <div>
            <div className="border-b border-charcoal/40 h-10" />
            <p className="text-[10px] text-sage-dark uppercase tracking-widest font-semibold mt-2">
              Approver Signature &amp; Date
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-sage/20 bg-cream/30 print:bg-cream/40 rounded-b-xl print:rounded-none">
          <p className="text-center text-xs text-charcoal-light/60">
            Conscious Speech Strategies &middot; Internal timesheet record
          </p>
        </div>
      </div>
    </div>
  );
}

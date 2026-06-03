"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import type { Goal } from "@/lib/supabase/types";

export default function NewSessionPage() {
  const supabase = createClient();
  const router = useRouter();
  const { id: studentId } = useParams<{ id: string }>();
  const [studentName, setStudentName] = useState("");
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [goalData, setGoalData] = useState<Record<string, Array<{ correct: string; total: string; notes: string; target: string }>>>({});
  const [saving, setSaving] = useState(false);
  const [occurred, setOccurred] = useState(true);
  const [noShowReason, setNoShowReason] = useState("");

  useEffect(() => {
    loadData();
  }, [studentId]);

  async function loadData() {
    const [{ data: student }, { data: goalsData }] = await Promise.all([
      supabase.from("students").select("name, school:schools(name)").eq("id", studentId).single(),
      supabase.from("goals").select("*").eq("student_id", studentId).eq("archived", false).order("goal_number"),
    ]);
    if (student) {
      setStudentName(student.name);
      const sc = (student as unknown as { school?: { name?: string } }).school;
      setSchoolName(sc?.name ?? null);
    }
    if (goalsData) {
      setGoals(goalsData);
      const initial: Record<string, Array<{ correct: string; total: string; notes: string; target: string }>> = {};
      goalsData.forEach((g) => {
        initial[g.id] = [{ correct: "", total: "", notes: "", target: "" }];
      });
      setGoalData(initial);
    }
  }

  function updateGoalEntry(goalId: string, index: number, field: "correct" | "total" | "notes" | "target", value: string) {
    setGoalData((prev) => {
      const entries = [...(prev[goalId] || [])];
      entries[index] = { ...entries[index], [field]: value };
      return { ...prev, [goalId]: entries };
    });
  }

  function addVariant(goalId: string) {
    setGoalData((prev) => ({
      ...prev,
      [goalId]: [...(prev[goalId] || []), { correct: "", total: "", notes: "", target: "" }],
    }));
  }

  function removeVariant(goalId: string, index: number) {
    setGoalData((prev) => {
      const entries = (prev[goalId] || []).filter((_, i) => i !== index);
      return { ...prev, [goalId]: entries };
    });
  }

  function getEntryPercentage(entry: { correct: string; total: string }): string {
    const correct = parseInt(entry.correct) || 0;
    const total = parseInt(entry.total) || 0;
    if (total === 0) return "\u2014";
    return `${Math.round((correct / total) * 100)}%`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // No-show requires a reason — enforce client-side too as a safety net
    if (!occurred && !noShowReason.trim()) {
      alert("Please enter the reason the session did not occur.");
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        student_id: studentId,
        date,
        entered_by: user?.id,
        notes: notes || null,
        occurred,
        no_show_reason: occurred ? null : noShowReason.trim(),
      })
      .select()
      .single();

    if (error || !session) {
      alert("Error creating session: " + (error?.message || "Unknown error"));
      setSaving(false);
      return;
    }

    if (occurred) {
      // Insert session goals — flatten all variant entries
      const sessionGoals = goals
        .flatMap((g) => {
          const entries = goalData[g.id] || [];
          return entries.map((d) => {
            const correct = parseInt(d.correct) || 0;
            const total = parseInt(d.total) || 0;
            if (total === 0 && correct === 0) return null;
            return {
              session_id: session.id,
              goal_id: g.id,
              correct_count: correct,
              total_count: total,
              notes: d.notes || null,
              target: d.target || null,
            };
          });
        })
        .filter(Boolean);

      if (sessionGoals.length > 0) {
        await supabase.from("session_goals").insert(sessionGoals);
      }
    } else {
      // Fire-and-forget email notification to Rachel
      const { data: enteredByProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user?.id ?? "")
        .single();
      fetch("/api/session-no-show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          schoolName,
          sessionDate: date,
          reason: noShowReason.trim(),
          enteredByName: enteredByProfile?.name || "Unknown",
        }),
      }).catch((err) => console.error("No-show email notify failed:", err));
    }

    router.push(`/admin/students/${studentId}`);
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-[13px] text-slate-400">
          <a href={`/admin/students/${studentId}`} className="hover:text-slate-600 transition-colors cursor-pointer">
            {studentName}
          </a>{" "}
          / New Session
        </p>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">Log Session</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Session Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={occurred}
              onChange={(e) => setOccurred(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer accent-teal-600"
            />
            <div>
              <p className="text-[13px] font-medium text-slate-700">Session occurred</p>
              <p className="text-[12px] text-slate-400">Uncheck if the session did not happen (no-show, cancellation, etc.)</p>
            </div>
          </label>
          {!occurred && (
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Reason session did not occur <span className="text-red-500">*</span>
              </label>
              <textarea
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value)}
                rows={3}
                required
                placeholder="e.g. Student absent, scheduling conflict, sick, etc."
                className={inputClass}
              />
              <p className="text-[12px] text-amber-700 mt-1.5">
                Rachel will be emailed when you save this entry.
              </p>
            </div>
          )}
          {occurred && (
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Session Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Optional notes about this session..." className={inputClass} />
            </div>
          )}
        </div>

        {/* Goal Data Entry — only show when the session occurred */}
        {occurred && (
        <>
        <div className="space-y-4">
          {goals.map((goal) => {
            const entries = goalData[goal.id] || [];
            const hasMultiple = entries.length > 1;
            return (
              <div key={goal.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6">
                <div className="mb-4">
                  <p className="font-medium text-slate-900 text-[14px]">Goal {goal.goal_number}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{goal.description}</p>
                </div>

                <div className="space-y-4">
                  {entries.map((entry, idx) => (
                    <div key={idx} className={hasMultiple ? "bg-slate-50 rounded-lg p-4 border border-slate-100" : ""}>
                      <div className="flex items-center justify-between mb-3">
                        {hasMultiple ? (
                          <input
                            value={entry.target}
                            onChange={(e) => updateGoalEntry(goal.id, idx, "target", e.target.value)}
                            placeholder="Variant name (e.g., /R, /R blend)"
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-xs text-slate-900 placeholder:text-slate-400 w-56"
                          />
                        ) : (
                          <span />
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold tabular-nums ${getEntryPercentage(entry) !== "\u2014" ? "text-teal-600" : "text-slate-300"}`}>
                            {getEntryPercentage(entry)}
                          </span>
                          {hasMultiple && (
                            <button type="button" onClick={() => removeVariant(goal.id, idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors ml-1 cursor-pointer" title="Remove variant">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Correct (+)</label>
                          <input type="number" min="0" value={entry.correct}
                            onChange={(e) => updateGoalEntry(goal.id, idx, "correct", e.target.value)}
                            placeholder="0" className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Total Trials</label>
                          <input type="number" min="0" value={entry.total}
                            onChange={(e) => updateGoalEntry(goal.id, idx, "total", e.target.value)}
                            placeholder="0" className={inputClass} />
                        </div>
                      </div>

                      <div className="mt-3">
                        <input value={entry.notes}
                          onChange={(e) => updateGoalEntry(goal.id, idx, "notes", e.target.value)}
                          placeholder="Notes for this goal..."
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-xs text-slate-900 placeholder:text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addVariant(goal.id)}
                  className="mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors cursor-pointer">
                  + Add Variant
                </button>
              </div>
            );
          })}
        </div>

        {goals.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">
            No goals defined for this student.{" "}
            <a href={`/admin/students/${studentId}/edit`} className="text-teal-600 hover:text-teal-700 cursor-pointer">
              Add goals first.
            </a>
          </p>
        )}
        </>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium text-[13px] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? "Saving..." : "Save Session"}
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

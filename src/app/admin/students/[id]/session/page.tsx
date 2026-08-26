"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import type { Goal } from "@/lib/supabase/types";

// Default pull-out room per school. Matched case-insensitively by substring so
// name variations (e.g. "SLAM Tampa Elem" vs "SLAM Tampa Elementary") still hit.
function getDefaultPullOutRoom(schoolName: string | null | undefined): string | null {
  if (!schoolName) return null;
  const s = schoolName.toLowerCase();
  if (s.includes("slam") && s.includes("tampa")) return "Room 217";
  if (s.includes("waterset")) return "Room 134";
  return null;
}

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
  // "occurred" is derived: the "attendance" radio drives both `occurred` and
  // `no_show_type`. `no_show_reason` holds the activity name for
  // school_activity, or optional extra context for the other reasons.
  type Attendance = "occurred" | "student_absent" | "school_activity" | "school_closure";
  const [attendance, setAttendance] = useState<Attendance>("occurred");
  const [noShowReason, setNoShowReason] = useState("");
  const occurred = attendance === "occurred";
  const [serviceTime, setServiceTime] = useState("");
  const [serviceType, setServiceType] = useState<"pull_out" | "push_in">("pull_out");
  const [pushInNotes, setPushInNotes] = useState("");

  // Hydrate last-used service time / type from localStorage so re-entry is fast
  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastSessionServiceInfo");
      if (raw) {
        const parsed = JSON.parse(raw) as { time?: string; type?: "pull_out" | "push_in" };
        if (parsed.time) setServiceTime(parsed.time);
        if (parsed.type === "pull_out" || parsed.type === "push_in") setServiceType(parsed.type);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

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

    // For school activity, the activity name is required. Other no-show
    // types don't require additional text.
    if (attendance === "school_activity" && !noShowReason.trim()) {
      alert("Please enter what kind of school activity (field trip, assembly, etc.).");
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    // For push-in, capture the teacher/room the user typed. For pull-out,
    // auto-fill the default room based on school (if we have one mapped).
    const effectivePushInNotes =
      serviceType === "push_in"
        ? pushInNotes.trim() || null
        : getDefaultPullOutRoom(schoolName);

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        student_id: studentId,
        date,
        entered_by: user?.id,
        notes: notes || null,
        occurred,
        no_show_type: occurred ? null : attendance,
        no_show_reason: occurred ? null : (noShowReason.trim() || null),
        service_time: serviceTime.trim() || null,
        service_type: serviceType,
        push_in_notes: effectivePushInNotes,
      })
      .select()
      .single();

    if (error || !session) {
      alert("Error creating session: " + (error?.message || "Unknown error"));
      setSaving(false);
      return;
    }

    // Remember service time + type for the next session entry
    try {
      localStorage.setItem(
        "lastSessionServiceInfo",
        JSON.stringify({ time: serviceTime.trim(), type: serviceType })
      );
    } catch {
      // ignore storage errors
    }

    if (occurred) {
      // Insert session goals — flatten all variant entries. Keep entries
      // that have anecdotal notes or a named target even when no trials
      // were counted (sometimes a goal is worked on qualitatively).
      const sessionGoals = goals
        .flatMap((g) => {
          const entries = goalData[g.id] || [];
          return entries.map((d) => {
            const correct = parseInt(d.correct) || 0;
            const total = parseInt(d.total) || 0;
            const hasNotes = d.notes.trim().length > 0;
            const hasTarget = d.target.trim().length > 0;
            if (total === 0 && correct === 0 && !hasNotes && !hasTarget) return null;
            return {
              session_id: session.id,
              goal_id: g.id,
              correct_count: correct,
              total_count: total,
              notes: d.notes.trim() || null,
              target: d.target.trim() || null,
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
      const typeLabel =
        attendance === "student_absent" ? "Student absent" :
        attendance === "school_activity" ? "School activity" :
        attendance === "school_closure" ? "School closure" : "No-show";
      fetch("/api/session-no-show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          schoolName,
          sessionDate: date,
          reason: noShowReason.trim() ? `${typeLabel} — ${noShowReason.trim()}` : typeLabel,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Session Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Time</label>
              <input
                type="text"
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
                placeholder="e.g. 9:00–9:30 AM"
                className={inputClass}
              />
              <p className="text-[11px] text-slate-400 mt-1">Saved for your next entry so you don&apos;t have to retype the same time.</p>
            </div>
          </div>
          {occurred && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Service Type</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as "pull_out" | "push_in")}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="pull_out">Pull-out</option>
                    <option value="push_in">Push-in</option>
                  </select>
                </div>
                {serviceType === "push_in" && (
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                      Teacher name / room number
                    </label>
                    <input
                      type="text"
                      value={pushInNotes}
                      onChange={(e) => setPushInNotes(e.target.value)}
                      placeholder="e.g. Ms. Rivera — Room 214"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
              {serviceType === "pull_out" && getDefaultPullOutRoom(schoolName) && (
                <p className="text-[12px] text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
                  📍 <span className="font-medium">{getDefaultPullOutRoom(schoolName)}</span> will be recorded for this pull-out session at {schoolName}.
                </p>
              )}
            </>
          )}
          <div>
            <p className="text-[13px] font-medium text-slate-700 mb-2">Attendance</p>
            <div className="space-y-1.5">
              {([
                { value: "occurred", label: "Session occurred" },
                { value: "student_absent", label: "Student absent" },
                { value: "school_activity", label: "School activity" },
                { value: "school_closure", label: "School closure" },
              ] as { value: Attendance; label: string }[]).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="attendance"
                    value={opt.value}
                    checked={attendance === opt.value}
                    onChange={() => setAttendance(opt.value)}
                    className="w-4 h-4 cursor-pointer accent-teal-600"
                  />
                  <span className="text-[13px] text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          {attendance === "school_activity" && (
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                What kind of school activity? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value)}
                required
                placeholder="e.g. Field trip, assembly, testing"
                className={inputClass}
              />
              <p className="text-[12px] text-amber-700 mt-1.5">
                Rachel will be emailed when you save this entry.
              </p>
            </div>
          )}
          {(attendance === "student_absent" || attendance === "school_closure") && (
            <p className="text-[12px] text-amber-700">
              Rachel will be emailed when you save this entry.
            </p>
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

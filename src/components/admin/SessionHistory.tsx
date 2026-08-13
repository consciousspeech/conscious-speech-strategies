"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatLocalDate } from "@/lib/utils";
import type { Goal } from "@/lib/supabase/types";

interface SessionGoalData {
  id: string;
  goal_id: string;
  correct_count: number;
  total_count: number;
  percentage: number;
  target: string | null;
  performance_level: string | null;
  notes: string | null;
  goal: { goal_number: number; description: string; iep_year: string | null } | null;
}

interface SessionData {
  id: string;
  student_id: string;
  date: string;
  notes: string | null;
  iep_year: string | null;
  occurred?: boolean;
  no_show_reason?: string | null;
  service_time?: string | null;
  service_type?: "pull_out" | "push_in" | null;
  push_in_notes?: string | null;
  entered_by_profile: { name: string } | null;
  session_goals: SessionGoalData[];
}

interface Props {
  sessions: SessionData[];
  studentId: string;
  currentGoals: Goal[];
  archivedGoals: Goal[];
  filterIepYear?: string | null;
}

// Edit-mode goal entry. `id` is present if it maps to an existing
// session_goal row (so save issues UPDATE); absent means it's a brand-new
// variant added in the edit form (INSERT).
type EditGoalEntry = {
  id?: string;
  correct: string;
  total: string;
  target: string;
  notes: string;
};

export default function SessionHistory({ sessions: initialSessions, currentGoals, archivedGoals, filterIepYear }: Props) {
  const supabase = createClient();
  const [sessions, setSessions] = useState(initialSessions);
  useEffect(() => { setSessions(initialSessions); }, [initialSessions]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    date: string;
    notes: string;
    service_time: string;
    service_type: "pull_out" | "push_in";
    push_in_notes: string;
    occurred: boolean;
    no_show_reason: string;
    // goal_id → variant entries (existing session_goals + any newly added)
    goalEntries: Record<string, EditGoalEntry[]>;
    // Original session_goal ids at edit start (for detecting deletions on save)
    originalSessionGoalIds: string[];
  }>({
    date: "",
    notes: "",
    service_time: "",
    service_type: "pull_out",
    push_in_notes: "",
    occurred: true,
    no_show_reason: "",
    goalEntries: {},
    originalSessionGoalIds: [],
  });

  // Filter sessions based on the active IEP tab
  const iepYear = filterIepYear ?? null;
  const visibleSessions = useMemo(() => {
    if (iepYear === null) return sessions.filter((s) => !s.iep_year);
    return sessions.filter((s) => s.iep_year === iepYear);
  }, [sessions, iepYear]);

  function goalsForIepYear(iepYear: string | null): Goal[] {
    if (!iepYear) return currentGoals;
    return archivedGoals.filter((g) => g.iep_year === iepYear);
  }

  async function handleDelete(sessionId: string) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await supabase.from("sessions").delete().eq("id", sessionId);
    setSessions(sessions.filter((s) => s.id !== sessionId));
  }

  function startEdit(session: SessionData) {
    setEditingId(session.id);
    // Group existing session_goals by goal_id, then make sure every goal
    // available in this session's IEP year has at least one blank entry
    // (so the user can add data to a goal that wasn't originally logged).
    const goalEntries: Record<string, EditGoalEntry[]> = {};
    session.session_goals?.forEach((sg) => {
      if (!goalEntries[sg.goal_id]) goalEntries[sg.goal_id] = [];
      goalEntries[sg.goal_id].push({
        id: sg.id,
        correct: String(sg.correct_count),
        total: String(sg.total_count),
        target: sg.target || "",
        notes: sg.notes || "",
      });
    });
    // For every goal available to this session (current-IEP goals if the
    // session has no iep_year, otherwise the archived goals for that year),
    // seed an empty entry when none exist so the user can add one.
    const availableGoals = goalsForIepYear(session.iep_year);
    availableGoals.forEach((g) => {
      if (!goalEntries[g.id]) {
        goalEntries[g.id] = [{ correct: "", total: "", target: "", notes: "" }];
      }
    });

    const originalSessionGoalIds = (session.session_goals || []).map((sg) => sg.id);

    setEditForm({
      date: session.date,
      notes: session.notes || "",
      service_time: session.service_time || "",
      service_type: session.service_type || "pull_out",
      push_in_notes: session.push_in_notes || "",
      occurred: session.occurred !== false,
      no_show_reason: session.no_show_reason || "",
      goalEntries,
      originalSessionGoalIds,
    });
  }

  function updateEntry(goalId: string, idx: number, field: keyof EditGoalEntry, value: string) {
    setEditForm((prev) => {
      const entries = [...(prev.goalEntries[goalId] || [])];
      entries[idx] = { ...entries[idx], [field]: value };
      return { ...prev, goalEntries: { ...prev.goalEntries, [goalId]: entries } };
    });
  }

  function addVariant(goalId: string) {
    setEditForm((prev) => ({
      ...prev,
      goalEntries: {
        ...prev.goalEntries,
        [goalId]: [...(prev.goalEntries[goalId] || []), { correct: "", total: "", target: "", notes: "" }],
      },
    }));
  }

  function removeVariant(goalId: string, idx: number) {
    setEditForm((prev) => {
      const entries = (prev.goalEntries[goalId] || []).filter((_, i) => i !== idx);
      // Keep at least one row so the goal card always has an input
      const kept = entries.length > 0 ? entries : [{ correct: "", total: "", target: "", notes: "" }];
      return { ...prev, goalEntries: { ...prev.goalEntries, [goalId]: kept } };
    });
  }

  async function saveEdit(sessionId: string) {
    // 1. Save top-level session fields
    await supabase.from("sessions").update({
      date: editForm.date,
      notes: editForm.notes || null,
      service_time: editForm.service_time.trim() || null,
      service_type: editForm.service_type,
      push_in_notes: editForm.push_in_notes.trim() || null,
      occurred: editForm.occurred,
      no_show_reason: editForm.occurred ? null : editForm.no_show_reason.trim() || null,
    }).eq("id", sessionId);

    // 2. Reconcile session_goals: UPDATE existing, INSERT new, DELETE removed
    const keptIds = new Set<string>();
    const inserts: {
      session_id: string;
      goal_id: string;
      correct_count: number;
      total_count: number;
      target: string | null;
      notes: string | null;
    }[] = [];

    for (const [goalId, entries] of Object.entries(editForm.goalEntries)) {
      for (const entry of entries) {
        const correct = parseInt(entry.correct) || 0;
        const total = parseInt(entry.total) || 0;
        const target = entry.target.trim();
        const notes = entry.notes.trim();
        const hasData = correct > 0 || total > 0 || target.length > 0 || notes.length > 0;

        if (entry.id) {
          // Existing session_goal — UPDATE if it still has data, else DELETE
          if (hasData) {
            keptIds.add(entry.id);
            const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
            await supabase.from("session_goals").update({
              goal_id: goalId,
              correct_count: correct,
              total_count: total,
              percentage,
              target: target || null,
              notes: notes || null,
            }).eq("id", entry.id);
          }
          // If hasData is false and it was an existing row, we drop it via the delete pass below
        } else if (hasData) {
          // Brand-new variant — queue INSERT
          inserts.push({
            session_id: sessionId,
            goal_id: goalId,
            correct_count: correct,
            total_count: total,
            target: target || null,
            notes: notes || null,
          });
        }
      }
    }

    // Delete any original session_goals that were emptied or removed
    const toDelete = editForm.originalSessionGoalIds.filter((id) => !keptIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("session_goals").delete().in("id", toDelete);
    }

    // Insert new ones
    let insertedRows: SessionGoalData[] = [];
    if (inserts.length > 0) {
      const { data: inserted } = await supabase
        .from("session_goals")
        .insert(inserts)
        .select("*, goal:goals(goal_number, description, iep_year)");
      if (inserted) insertedRows = inserted as unknown as SessionGoalData[];
    }

    // 3. Rebuild local session state so the UI reflects the changes
    const allGoals = [...currentGoals, ...archivedGoals];
    setSessions(sessions.map((s) => {
      if (s.id !== sessionId) return s;

      const rebuilt: SessionGoalData[] = [];

      // Existing ones that were updated
      for (const sg of s.session_goals) {
        if (!keptIds.has(sg.id)) continue;
        // find the corresponding form entry to grab updated values
        let found: EditGoalEntry | undefined;
        let foundGoalId: string | undefined;
        for (const [gid, entries] of Object.entries(editForm.goalEntries)) {
          const match = entries.find((e) => e.id === sg.id);
          if (match) {
            found = match;
            foundGoalId = gid;
            break;
          }
        }
        if (!found || !foundGoalId) continue;
        const correct = parseInt(found.correct) || 0;
        const total = parseInt(found.total) || 0;
        const goalRef = allGoals.find((g) => g.id === foundGoalId);
        rebuilt.push({
          ...sg,
          goal_id: foundGoalId,
          correct_count: correct,
          total_count: total,
          percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
          target: found.target.trim() || null,
          notes: found.notes.trim() || null,
          goal: goalRef
            ? { goal_number: goalRef.goal_number, description: goalRef.description, iep_year: goalRef.iep_year }
            : sg.goal,
        });
      }

      // New inserts
      for (const row of insertedRows) rebuilt.push(row);

      return {
        ...s,
        date: editForm.date,
        notes: editForm.notes || null,
        service_time: editForm.service_time.trim() || null,
        service_type: editForm.service_type,
        push_in_notes: editForm.push_in_notes.trim() || null,
        occurred: editForm.occurred,
        no_show_reason: editForm.occurred ? null : editForm.no_show_reason.trim() || null,
        session_goals: rebuilt,
      };
    }));
    setEditingId(null);
  }

  const inputClass = "px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900";

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900 text-[15px]">Session History</h2>
      </div>
      {visibleSessions.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {visibleSessions.map((session) => {
            const goalOptions = goalsForIepYear(session.iep_year);
            return (
            <div key={session.id} className="px-5 py-4">
              {editingId === session.id ? (
                <div className="space-y-3">
                  <div className="flex gap-3 items-end">
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Date</label>
                      <input type="date" value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Notes</label>
                      <input value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        className={`w-full ${inputClass}`}
                        placeholder="Session notes..." />
                    </div>
                    <button onClick={() => saveEdit(session.id)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                      Save
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-[12px] font-medium transition-colors cursor-pointer">
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Time</label>
                      <input
                        value={editForm.service_time}
                        onChange={(e) => setEditForm({ ...editForm, service_time: e.target.value })}
                        placeholder="e.g. 9:00–9:30 AM"
                        className={`w-full ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Service Type</label>
                      <select
                        value={editForm.service_type}
                        onChange={(e) => setEditForm({ ...editForm, service_type: e.target.value as "pull_out" | "push_in" })}
                        className={`w-full ${inputClass} cursor-pointer`}
                      >
                        <option value="pull_out">Pull-out</option>
                        <option value="push_in">Push-in</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">
                        {editForm.service_type === "push_in" ? "Teacher / room" : "Room"}
                      </label>
                      <input
                        value={editForm.push_in_notes}
                        onChange={(e) => setEditForm({ ...editForm, push_in_notes: e.target.value })}
                        placeholder={editForm.service_type === "push_in" ? "e.g. Ms. Rivera — Room 214" : "e.g. Room 217"}
                        className={`w-full ${inputClass}`}
                      />
                    </div>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={editForm.occurred}
                      onChange={(e) => setEditForm({ ...editForm, occurred: e.target.checked })}
                      className="mt-0.5 w-4 h-4 cursor-pointer accent-teal-600"
                    />
                    <div>
                      <p className="text-[13px] font-medium text-slate-700">Session occurred</p>
                      <p className="text-[12px] text-slate-400">Uncheck if the session did not happen.</p>
                    </div>
                  </label>
                  {!editForm.occurred && (
                    <div>
                      <label className="block text-[12px] font-medium text-slate-500 mb-1">Reason session did not occur</label>
                      <textarea
                        value={editForm.no_show_reason}
                        onChange={(e) => setEditForm({ ...editForm, no_show_reason: e.target.value })}
                        rows={2}
                        className={`w-full ${inputClass}`}
                        placeholder="e.g. Student absent, sick, scheduling conflict"
                      />
                    </div>
                  )}
                  {editForm.occurred && (
                    <div className="space-y-2 mt-2">
                      <p className="text-[12px] font-medium text-slate-500">Goal data</p>
                      {(() => {
                        // Show every goal available for this session's IEP,
                        // plus any goal referenced by an entry but missing
                        // from that list (rare fallback).
                        const availableGoals = goalOptions;
                        const extraGoalIds = Object.keys(editForm.goalEntries).filter(
                          (gid) => !availableGoals.find((g) => g.id === gid)
                        );
                        const extraGoals: Goal[] = extraGoalIds
                          .map((gid) => [...currentGoals, ...archivedGoals].find((g) => g.id === gid))
                          .filter((g): g is Goal => Boolean(g));
                        const displayGoals = [...availableGoals, ...extraGoals];
                        if (displayGoals.length === 0) {
                          return (
                            <p className="text-[12px] text-slate-400 italic">
                              No goals available for this IEP.
                            </p>
                          );
                        }
                        return displayGoals.map((goal) => {
                          const entries = editForm.goalEntries[goal.id] || [
                            { correct: "", total: "", target: "", notes: "" },
                          ];
                          const hasMultiple = entries.length > 1;
                          return (
                            <div key={goal.id} className="bg-slate-50 rounded-lg px-3 py-3">
                              <p className="font-medium text-slate-800 text-[13px]">
                                Goal {goal.goal_number}
                              </p>
                              <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                                {goal.description}
                              </p>
                              <div className="space-y-2">
                                {entries.map((entry, idx) => {
                                  const correct = parseInt(entry.correct) || 0;
                                  const total = parseInt(entry.total) || 0;
                                  const pct = total > 0 ? Math.round((correct / total) * 100) : null;
                                  return (
                                    <div key={idx} className="bg-white rounded-md p-2 space-y-1.5">
                                      {hasMultiple && (
                                        <div className="flex items-center justify-between">
                                          <input
                                            value={entry.target}
                                            onChange={(e) => updateEntry(goal.id, idx, "target", e.target.value)}
                                            placeholder="Variant (e.g. /R blend)"
                                            className={`${inputClass} text-xs flex-1`}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeVariant(goal.id, idx)}
                                            className="ml-2 text-slate-400 hover:text-red-500 text-xs"
                                            title="Remove variant"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                          <label className="block text-[10px] text-slate-400">Correct</label>
                                          <input
                                            type="number"
                                            min="0"
                                            value={entry.correct}
                                            onChange={(e) => updateEntry(goal.id, idx, "correct", e.target.value)}
                                            className={`w-full ${inputClass} text-xs`}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-400">Total</label>
                                          <input
                                            type="number"
                                            min="0"
                                            value={entry.total}
                                            onChange={(e) => updateEntry(goal.id, idx, "total", e.target.value)}
                                            className={`w-full ${inputClass} text-xs`}
                                          />
                                        </div>
                                      </div>
                                      {!hasMultiple && (
                                        <div>
                                          <label className="block text-[10px] text-slate-400">Target</label>
                                          <input
                                            value={entry.target}
                                            onChange={(e) => updateEntry(goal.id, idx, "target", e.target.value)}
                                            placeholder="e.g. /R blend"
                                            className={`w-full ${inputClass} text-xs`}
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <label className="block text-[10px] text-slate-400">Notes</label>
                                        <input
                                          value={entry.notes}
                                          onChange={(e) => updateEntry(goal.id, idx, "notes", e.target.value)}
                                          placeholder="Anecdotal notes..."
                                          className={`w-full ${inputClass} text-xs`}
                                        />
                                      </div>
                                      {pct !== null && (
                                        <p className="text-[11px] font-semibold text-teal-600 text-right">
                                          {pct}%
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => addVariant(goal.id)}
                                className="mt-2 text-[11px] font-medium text-teal-600 hover:text-teal-700 cursor-pointer"
                              >
                                + Add Variant
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-slate-900">
                        {formatLocalDate(session.date, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      {session.service_time && (
                        <span className="text-[12px] text-slate-500 tabular-nums">
                          {session.service_time}
                        </span>
                      )}
                      {session.service_type === "push_in" && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-teal-100 text-teal-700">
                          Push-in
                        </span>
                      )}
                      {session.occurred === false && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                          Did not occur
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">
                        {session.entered_by_profile?.name && `by ${session.entered_by_profile.name}`}
                      </p>
                      <button onClick={() => startEdit(session)}
                        className="text-slate-300 hover:text-teal-600 transition-colors cursor-pointer p-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(session.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {session.session_goals?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {session.session_goals.map((sg) => (
                        <div key={sg.id} className="bg-slate-50 rounded-lg px-3 py-2 text-[13px]">
                          <p className="text-slate-600">
                            Goal {sg.goal?.goal_number}
                            {sg.target && <span className="text-slate-400"> — {sg.target}</span>}
                            {sg.total_count > 0 && (
                              <span className="font-semibold text-slate-900">
                                {" "}{sg.correct_count}/{sg.total_count} ({sg.percentage}%)
                              </span>
                            )}
                          </p>
                          {sg.performance_level && (
                            <p className="text-xs text-teal-600 mt-0.5">{sg.performance_level}</p>
                          )}
                          {sg.notes && (
                            <p className="text-xs text-slate-400 mt-0.5">{sg.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {session.push_in_notes && (
                    <p className="text-xs text-teal-700 mt-2">
                      <span className="font-medium">
                        {session.service_type === "push_in" ? "Classroom" : "Room"}:
                      </span>{" "}
                      {session.push_in_notes}
                    </p>
                  )}
                  {session.no_show_reason && (
                    <p className="text-xs text-amber-700 mt-2">
                      <span className="font-medium">Reason:</span> {session.no_show_reason}
                    </p>
                  )}
                  {session.notes && (
                    <p className="text-xs text-slate-400 mt-2">{session.notes}</p>
                  )}
                </>
              )}
            </div>
          );})}
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-slate-400 text-sm">
          {iepYear === null ? "No sessions recorded yet. Log the first session above." : "No sessions in this IEP."}
        </p>
      )}
    </div>
  );
}

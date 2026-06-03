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

type EditGoalData = {
  goal_id: string;
  correct_count: string;
  total_count: string;
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
    goals: Record<string, EditGoalData>;
  }>({ date: "", notes: "", goals: {} });

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
    const goals: Record<string, EditGoalData> = {};
    session.session_goals?.forEach((sg) => {
      goals[sg.id] = {
        goal_id: sg.goal_id,
        correct_count: String(sg.correct_count),
        total_count: String(sg.total_count),
        target: sg.target || "",
        notes: sg.notes || "",
      };
    });
    setEditForm({ date: session.date, notes: session.notes || "", goals });
  }

  async function saveEdit(sessionId: string) {
    await supabase.from("sessions").update({
      date: editForm.date,
      notes: editForm.notes || null,
    }).eq("id", sessionId);

    for (const [sgId, data] of Object.entries(editForm.goals)) {
      const correct = parseInt(data.correct_count) || 0;
      const total = parseInt(data.total_count) || 0;
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
      await supabase.from("session_goals").update({
        goal_id: data.goal_id,
        correct_count: correct,
        total_count: total,
        percentage,
        target: data.target || null,
        notes: data.notes || null,
      }).eq("id", sgId);
    }

    const allGoals = [...currentGoals, ...archivedGoals];
    setSessions(sessions.map((s) => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        date: editForm.date,
        notes: editForm.notes || null,
        session_goals: s.session_goals.map((sg) => {
          const data = editForm.goals[sg.id];
          if (!data) return sg;
          const correct = parseInt(data.correct_count) || 0;
          const total = parseInt(data.total_count) || 0;
          const newGoalRef = allGoals.find((g) => g.id === data.goal_id);
          return {
            ...sg,
            goal_id: data.goal_id,
            correct_count: correct,
            total_count: total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
            target: data.target || null,
            notes: data.notes || null,
            goal: newGoalRef
              ? { goal_number: newGoalRef.goal_number, description: newGoalRef.description, iep_year: newGoalRef.iep_year }
              : sg.goal,
          };
        }),
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
                  {session.session_goals?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {session.session_goals.map((sg) => {
                        const gData = editForm.goals[sg.id];
                        if (!gData) return null;
                        return (
                          <div key={sg.id} className="bg-slate-50 rounded-lg px-3 py-2 space-y-1.5">
                            <div>
                              <label className="block text-[10px] text-slate-400">Goal</label>
                              <select value={gData.goal_id}
                                onChange={(e) => setEditForm({
                                  ...editForm,
                                  goals: { ...editForm.goals, [sg.id]: { ...gData, goal_id: e.target.value } }
                                })}
                                className={`w-full ${inputClass} text-xs cursor-pointer`}>
                                {goalOptions.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    Goal {g.goal_number}{g.description ? ` — ${g.description.slice(0, 60)}${g.description.length > 60 ? "…" : ""}` : ""}
                                  </option>
                                ))}
                                {/* Fallback option if current goal_id isn't in the list (e.g. stale data) */}
                                {!goalOptions.find((g) => g.id === gData.goal_id) && sg.goal && (
                                  <option value={gData.goal_id}>Goal {sg.goal.goal_number} (unlinked)</option>
                                )}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <div>
                                <label className="block text-[10px] text-slate-400">Correct</label>
                                <input type="number" min="0" value={gData.correct_count}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    goals: { ...editForm.goals, [sg.id]: { ...gData, correct_count: e.target.value } }
                                  })}
                                  className={`w-full ${inputClass} text-xs`} />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400">Total</label>
                                <input type="number" min="0" value={gData.total_count}
                                  onChange={(e) => setEditForm({
                                    ...editForm,
                                    goals: { ...editForm.goals, [sg.id]: { ...gData, total_count: e.target.value } }
                                  })}
                                  className={`w-full ${inputClass} text-xs`} />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400">Target</label>
                              <input value={gData.target}
                                onChange={(e) => setEditForm({
                                  ...editForm,
                                  goals: { ...editForm.goals, [sg.id]: { ...gData, target: e.target.value } }
                                })}
                                className={`w-full ${inputClass} text-xs`} placeholder="e.g. /R blend" />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400">Notes</label>
                              <input value={gData.notes}
                                onChange={(e) => setEditForm({
                                  ...editForm,
                                  goals: { ...editForm.goals, [sg.id]: { ...gData, notes: e.target.value } }
                                })}
                                className={`w-full ${inputClass} text-xs`} placeholder="Goal notes..." />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-slate-900">
                        {formatLocalDate(session.date, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
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

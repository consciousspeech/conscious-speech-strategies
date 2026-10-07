"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Goal, StudentIep } from "@/lib/supabase/types";

interface Props {
  studentId: string;
  currentGoals: Goal[];
  archivedGoals: Goal[];
  iepMeta: StudentIep[];
  onTabChange?: (iepYear: string | null) => void;
}

export default function IepTabs({ studentId, currentGoals: initialCurrentGoals, archivedGoals: initialArchivedGoals, iepMeta: initialMeta, onTabChange }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<string>("current");
  const [busy, setBusy] = useState(false);

  const [currentGoals, setCurrentGoals] = useState(initialCurrentGoals);
  const [archivedGoals, setArchivedGoals] = useState(initialArchivedGoals);
  const [iepMeta, setIepMeta] = useState(initialMeta);

  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newGoalText, setNewGoalText] = useState("");

  const [editingMeta, setEditingMeta] = useState<string | null>(null);
  const [metaForm, setMetaForm] = useState({ display_name: "", iep_date: "", service_minutes: "" });

  function getMeta(iepYear: string | null) {
    return iepMeta.find((m) => m.iep_year === iepYear) || null;
  }

  const currentMeta = getMeta(null);
  const currentIepName = currentMeta?.display_name || "Current IEP";

  const archivedByYear: Record<string, Goal[]> = {};
  archivedGoals.forEach((g) => {
    const year = g.iep_year || "Unknown";
    if (!archivedByYear[year]) archivedByYear[year] = [];
    archivedByYear[year].push(g);
  });

  // --- Goal CRUD ---

  async function startEditGoal(goal: Goal) {
    setEditingGoal(goal.id);
    setEditText(goal.description);
  }

  async function saveEditGoal(goalId: string) {
    if (!editText.trim()) return;
    setBusy(true);
    await supabase.from("goals").update({ description: editText.trim() }).eq("id", goalId);
    setCurrentGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, description: editText.trim() } : g));
    setArchivedGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, description: editText.trim() } : g));
    setEditingGoal(null);
    setBusy(false);
    router.refresh();
  }

  async function deleteGoal(goalId: string, isCurrent: boolean) {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    setBusy(true);
    await supabase.from("session_goals").delete().eq("goal_id", goalId);
    await supabase.from("goals").delete().eq("id", goalId);

    if (isCurrent) {
      const remaining = currentGoals.filter((g) => g.id !== goalId);
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].goal_number !== i + 1) {
          await supabase.from("goals").update({ goal_number: i + 1 }).eq("id", remaining[i].id);
          remaining[i] = { ...remaining[i], goal_number: i + 1 };
        }
      }
      setCurrentGoals(remaining);
    } else {
      setArchivedGoals((prev) => prev.filter((g) => g.id !== goalId));
    }
    setBusy(false);
    router.refresh();
  }

  async function addGoal(iepYear: string | null, archived: boolean) {
    if (!newGoalText.trim()) return;
    setBusy(true);

    const goals = iepYear === null ? currentGoals : archivedGoals.filter((g) => g.iep_year === iepYear);
    const nextNum = goals.length > 0 ? Math.max(...goals.map((g) => g.goal_number)) + 1 : 1;

    const { data } = await supabase.from("goals").insert({
      student_id: studentId,
      goal_number: nextNum,
      description: newGoalText.trim(),
      iep_year: iepYear,
      archived,
    }).select().single();

    if (data) {
      if (iepYear === null) {
        setCurrentGoals([...currentGoals, data]);
      } else {
        setArchivedGoals([...archivedGoals, data]);
      }
    }

    setNewGoalText("");
    setAddingTo(null);
    setBusy(false);
    router.refresh();
  }

  // --- IEP Metadata ---

  function startEditMeta(meta: StudentIep | null, iepYear: string | null) {
    const id = meta?.id || `new-${iepYear}`;
    setEditingMeta(id);
    setMetaForm({
      display_name: meta?.display_name || "",
      iep_date: meta?.iep_date || "",
      service_minutes: meta?.service_minutes || "",
    });
  }

  async function saveMetaEdit(metaId: string, iepYear: string | null) {
    setBusy(true);
    const payload = {
      display_name: metaForm.display_name || null,
      iep_date: metaForm.iep_date || null,
      service_minutes: metaForm.service_minutes || null,
    };
    if (metaId && !metaId.startsWith("new-")) {
      const { error } = await supabase.from("student_ieps").update(payload).eq("id", metaId);
      if (error) {
        setBusy(false);
        alert("Could not save the IEP details: " + error.message);
        return;
      }
      setIepMeta((prev) => prev.map((m) => m.id === metaId ? { ...m, ...payload } : m));
    } else {
      const { data, error } = await supabase.from("student_ieps").insert({
        student_id: studentId,
        iep_year: iepYear,
        ...payload,
      }).select().single();
      // A failed insert used to leave the form looking saved while nothing had
      // changed, which reads as "I edited it and it didn't stick".
      if (error || !data) {
        setBusy(false);
        alert("Could not save the IEP details: " + (error?.message ?? "no record was created."));
        return;
      }
      setIepMeta([...iepMeta, data]);
    }
    setEditingMeta(null);
    setBusy(false);
    // The student page is server-rendered, so without this the saved value
    // disappears again as soon as the page is revisited.
    router.refresh();
  }

  // --- IEP Operations ---

  async function deleteIep(year: string) {
    if (!confirm(`Permanently delete all goals and sessions from the "${year}" IEP? This cannot be undone.`)) return;
    setBusy(true);
    await supabase.from("sessions").delete().eq("student_id", studentId).eq("iep_year", year);
    await supabase.from("goals").delete().eq("student_id", studentId).eq("iep_year", year);
    await supabase.from("student_ieps").delete().eq("student_id", studentId).eq("iep_year", year);
    setArchivedGoals((prev) => prev.filter((g) => g.iep_year !== year));
    setIepMeta((prev) => prev.filter((m) => m.iep_year !== year));
    setBusy(false);
    router.refresh();
  }

  async function makeCurrent(year: string) {
    let archiveLabel: string | null = null;
    if (currentGoals.length > 0) {
      archiveLabel = prompt(
        `You have a current IEP (${currentIepName}) with ${currentGoals.length} goal(s). Enter a label to archive it under (e.g., 2024-2025):`
      );
      if (!archiveLabel?.trim()) return;
      archiveLabel = archiveLabel.trim();
      if (archiveLabel === year) {
        alert("Label conflicts with the IEP you're promoting. Pick a different label.");
        return;
      }
    } else if (!confirm(`Make the "${year}" IEP the current IEP?`)) {
      return;
    }

    setBusy(true);

    if (archiveLabel) {
      await supabase.from("goals").update({ archived: true, iep_year: archiveLabel })
        .eq("student_id", studentId).eq("archived", false).is("iep_year", null);
      await supabase.from("sessions").update({ iep_year: archiveLabel })
        .eq("student_id", studentId).is("iep_year", null);
      if (currentMeta) {
        await supabase.from("student_ieps").update({ iep_year: archiveLabel }).eq("id", currentMeta.id);
      }
    }

    await supabase.from("goals").update({ archived: false, iep_year: null })
      .eq("student_id", studentId).eq("iep_year", year);
    await supabase.from("sessions").update({ iep_year: null })
      .eq("student_id", studentId).eq("iep_year", year);
    const promotedMeta = iepMeta.find((m) => m.iep_year === year);
    if (promotedMeta) {
      await supabase.from("student_ieps").update({ iep_year: null }).eq("id", promotedMeta.id);
    }

    setBusy(false);
    router.refresh();
  }

  async function handleNewIep() {
    // Step 1: Label the outgoing (current) IEP for archival
    const archiveLabel = prompt(`Enter a label for the current IEP being archived (e.g., 2024-2025):`);
    if (!archiveLabel?.trim()) return;

    // Step 2: Name the new IEP
    const newName = prompt(`Enter a name for the new IEP (e.g., 2025-2026):`);
    if (!newName?.trim()) return;

    setBusy(true);

    const label = archiveLabel.trim();

    // Archive current goals under the old label (bulk update)
    const goalIds = currentGoals.map((g) => g.id);
    if (goalIds.length > 0) {
      await supabase.from("goals").update({ archived: true, iep_year: label }).in("id", goalIds);
    }

    // Stamp current sessions with the archive label
    await supabase.from("sessions")
      .update({ iep_year: label })
      .eq("student_id", studentId)
      .is("iep_year", null);

    // Move current IEP metadata to archived
    if (currentMeta) {
      await supabase.from("student_ieps").update({ iep_year: label }).eq("id", currentMeta.id);
    }

    // Create new current IEP metadata
    const today = new Date().toISOString().split("T")[0];
    const { data: newMeta } = await supabase.from("student_ieps").insert({
      student_id: studentId,
      iep_year: null,
      iep_date: today,
      display_name: newName.trim(),
    }).select().single();

    // Update local state so UI reflects the change immediately
    const archivedCopy = currentGoals.map((g) => ({ ...g, archived: true, iep_year: label }));
    setArchivedGoals((prev) => [...prev, ...archivedCopy]);
    setCurrentGoals([]);
    setIepMeta((prev) => {
      const updated = prev.map((m) =>
        m.iep_year === null ? { ...m, iep_year: label } : m
      );
      if (newMeta) updated.push(newMeta);
      return updated;
    });
    setTab("current");

    setBusy(false);
    router.refresh();
  }

  const inputClass = "px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900";

  // --- Render helpers ---

  function renderMetaSection(iepYear: string | null) {
    const meta = getMeta(iepYear);
    const metaId = meta?.id || `new-${iepYear}`;
    const isEditing = editingMeta === metaId;

    if (isEditing) {
      return (
        <div className="px-5 py-3 bg-slate-50/80 flex flex-wrap items-end gap-3 border-b border-slate-100">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">IEP Name</label>
            <input value={metaForm.display_name} onChange={(e) => setMetaForm({ ...metaForm, display_name: e.target.value })}
              placeholder="e.g., 2025-2026" className={`${inputClass} text-[12px] py-1.5`} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">IEP Date</label>
            <input type="date" value={metaForm.iep_date} onChange={(e) => setMetaForm({ ...metaForm, iep_date: e.target.value })}
              className={`${inputClass} text-[12px] py-1.5`} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Service Minutes</label>
            <input value={metaForm.service_minutes} onChange={(e) => setMetaForm({ ...metaForm, service_minutes: e.target.value })}
              placeholder="30 SI, 60 LI..." className={`${inputClass} text-[12px] py-1.5`} />
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => saveMetaEdit(metaId, iepYear)} disabled={busy}
              className="px-2.5 py-1.5 bg-teal-600 text-white rounded text-[11px] font-medium cursor-pointer disabled:opacity-50">Save</button>
            <button onClick={() => setEditingMeta(null)}
              className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded text-[11px] font-medium cursor-pointer">Cancel</button>
          </div>
        </div>
      );
    }

    const hasData = meta?.iep_date || meta?.service_minutes || meta?.display_name;
    return (
      <div className="px-5 py-2.5 bg-slate-50/40 flex items-center gap-4 text-[12px] border-b border-slate-100">
        {meta?.display_name && iepYear === null && (
          <span className="text-slate-600 font-semibold">{meta.display_name}</span>
        )}
        {meta?.iep_date && (
          <span className="text-slate-500">
            <span className="text-slate-400">IEP Date:</span>{" "}
            <span className="font-medium">{new Date(meta.iep_date + "T00:00:00").toLocaleDateString()}</span>
          </span>
        )}
        {meta?.service_minutes && (
          <span className="text-slate-500">
            <span className="text-slate-400">Service:</span>{" "}
            <span className="font-medium">{meta.service_minutes}</span>
          </span>
        )}
        <button
          onClick={() => startEditMeta(meta, iepYear)}
          className="text-[11px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer ml-auto"
        >
          {hasData ? "Edit" : "+ Add IEP Details"}
        </button>
      </div>
    );
  }

  function renderGoalRow(goal: Goal, isCurrent: boolean) {
    const isEditing = editingGoal === goal.id;

    return (
      <div key={goal.id} className="px-5 py-3 group flex items-start gap-2">
        <span className={`text-[13px] font-medium mt-0.5 w-6 shrink-0 tabular-nums ${isCurrent ? "text-slate-700" : "text-slate-500"}`}>
          {goal.goal_number}.
        </span>
        {isEditing ? (
          <div className="flex-1 flex flex-col gap-2">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
              className={`flex-1 ${inputClass}`} />
            <div className="flex gap-1.5">
              <button onClick={() => saveEditGoal(goal.id)} disabled={busy}
                className="px-2.5 py-1 bg-teal-600 text-white rounded text-[11px] font-medium cursor-pointer disabled:opacity-50">Save</button>
              <button onClick={() => setEditingGoal(null)}
                className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded text-[11px] font-medium cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p className={`flex-1 text-[13px] ${isCurrent ? "text-slate-500" : "text-slate-400"}`}>{goal.description}</p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => startEditGoal(goal)} title="Edit"
                className="p-1 text-slate-300 hover:text-teal-600 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
              </button>
              <button onClick={() => deleteGoal(goal.id, isCurrent)} title="Delete"
                className="p-1 text-slate-300 hover:text-red-500 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderAddGoalRow(iepYear: string | null, archived: boolean) {
    const key = iepYear ?? "__current__";
    if (addingTo === key) {
      return (
        <div className="px-5 py-3 flex items-start gap-2">
          <span className="text-[13px] text-emerald-500 mt-0.5 w-6 shrink-0">+</span>
          <div className="flex-1 flex flex-col gap-2">
            <textarea value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="New goal description..." rows={2} autoFocus
              className="flex-1 px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400" />
            <div className="flex gap-1.5">
              <button onClick={() => addGoal(iepYear, archived)} disabled={busy || !newGoalText.trim()}
                className="px-2.5 py-1 bg-teal-600 text-white rounded text-[11px] font-medium cursor-pointer disabled:opacity-50">Add Goal</button>
              <button onClick={() => { setAddingTo(null); setNewGoalText(""); }}
                className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded text-[11px] font-medium cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="px-5 py-2.5">
        <button onClick={() => { setAddingTo(key); setNewGoalText(""); }}
          className="text-[12px] text-teal-600 hover:text-teal-700 font-medium cursor-pointer">+ Add Goal</button>
      </div>
    );
  }

  // Get display name for an archived IEP year
  function getArchivedIepName(year: string) {
    const meta = iepMeta.find((m) => m.iep_year === year);
    return meta?.display_name || year;
  }

  const archivedYears = Object.keys(archivedByYear).sort().reverse();

  // The active IEP year for display: null = current, string = archived year
  const activeYear = tab === "current" ? null : tab;
  const activeGoals = activeYear === null ? currentGoals : (archivedByYear[activeYear] || []);
  const isCurrentTab = tab === "current";

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm mb-6">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-slate-900 text-[15px]">IEP Goals</h2>
          <div className="flex flex-wrap bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => { setTab("current"); onTabChange?.(null); }}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                tab === "current" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {currentIepName}
            </button>
            {archivedYears.map((year) => (
              <button
                key={year}
                onClick={() => { setTab(year); onTabChange?.(year); }}
                className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  tab === year ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {getArchivedIepName(year)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleNewIep}
          disabled={busy || currentGoals.length === 0}
          className="text-[12px] font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {busy ? "Working..." : "New IEP"}
        </button>
      </div>

      {/* IEP actions for archived tabs */}
      {!isCurrentTab && activeYear && (
        <div className="px-5 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={() => makeCurrent(activeYear)}
            disabled={busy}
            className="text-[11px] font-medium text-teal-600 hover:text-teal-700 border border-teal-200 hover:bg-teal-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            Make Current
          </button>
          <button
            onClick={() => { deleteIep(activeYear); setTab("current"); onTabChange?.(null); }}
            disabled={busy}
            className="text-[11px] font-medium text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}

      {renderMetaSection(activeYear)}

      {activeGoals.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {activeGoals.map((goal) => renderGoalRow(goal, isCurrentTab))}
        </div>
      ) : (
        <p className="px-5 py-6 text-center text-slate-400 text-sm">No goals defined yet.</p>
      )}
      {renderAddGoalRow(activeYear, !isCurrentTab)}
    </div>
  );
}

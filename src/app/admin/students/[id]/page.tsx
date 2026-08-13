import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import StudentIepView from "@/components/admin/StudentIepView";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: student } = await supabase
    .from("students")
    .select("*, school:schools(name)")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const [{ data: goals }, { data: archivedGoals }, { data: sessions }, { data: iepMeta }] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("student_id", id)
      .eq("archived", false)
      .is("iep_year", null)
      .order("goal_number"),
    supabase
      .from("goals")
      .select("*")
      .eq("student_id", id)
      .eq("archived", true)
      .order("iep_year", { ascending: false })
      .order("goal_number"),
    supabase
      .from("sessions")
      .select("*, entered_by_profile:profiles!entered_by(name), session_goals(*, goal:goals(goal_number, description, iep_year))")
      .eq("student_id", id)
      .order("date", { ascending: false })
      .limit(50),
    supabase
      .from("student_ieps")
      .select("*")
      .eq("student_id", id),
  ]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/students" className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              Students
            </Link>
            <span className="text-slate-300">/</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{student.name}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {(student.school as Record<string, unknown>)?.name as string}
            {student.grade && ` · Grade ${student.grade}`}
            {student.eligibility && ` · ${student.eligibility}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/admin/students/${id}/session`}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            Log Session
          </Link>
          <Link
            href={`/admin/students/${id}/edit`}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Student Details */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm mb-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-[15px]">Student Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 px-5 py-4 text-[13px]">
          {(() => {
            const fmt = (iso: string | null | undefined) =>
              iso ? new Date(iso + "T00:00:00").toLocaleDateString() : null;
            // IEP Due = one year after the current IEP date
            let iepDueLabel: string | null = null;
            if (student.iep_date) {
              const d = new Date(student.iep_date + "T00:00:00");
              d.setFullYear(d.getFullYear() + 1);
              iepDueLabel = d.toLocaleDateString();
            }
            const rows: [string, string | null][] = [
              ["Student #", student.student_number],
              ["Grade", student.grade],
              ["Teacher", student.teacher],
              ["Eligibility", student.eligibility],
              ["DOB", fmt(student.date_of_birth)],
              ["IEP Date", fmt(student.iep_date)],
              ["IEP Due", iepDueLabel],
              ["Re-Eval Date", fmt(student.iep_re_eval_date)],
              ["Parent Phone", student.parent_phone],
              ["Parent Phone 2", student.parent_phone_2],
              ["Parent Email", student.parent_email],
              ["Notes", student.notes],
            ];
            return rows.filter(([, val]) => val).map(([label, val]) => (
              <div key={label}>
                <span className="text-slate-400">{label}: </span>
                <span className="text-slate-700 font-medium">{val}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* IEP Goals + Session History (synced by active IEP tab) */}
      <StudentIepView
        studentId={id}
        currentGoals={(goals || []) as any}
        archivedGoals={(archivedGoals || []) as any}
        iepMeta={(iepMeta || []) as any}
        sessions={(sessions || []) as any}
      />
    </div>
  );
}

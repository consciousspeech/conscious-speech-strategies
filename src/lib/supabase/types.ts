export type Role = "admin" | "staff";
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  phone: string | null;
  rate_per_hour: number | null;
  internal_rate: number | null;
  external_rate: number | null;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  district_number: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  school_id: string;
  student_number: string | null;
  date_of_birth: string | null;
  grade: string | null;
  teacher: string | null;
  eligibility: string | null;
  service_minutes: string | null;
  iep_date: string | null;
  iep_re_eval_date: string | null;
  parent_phone: string | null;
  parent_phone_2: string | null;
  parent_email: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  archived: boolean;
  // joined
  school?: School;
  goals?: Goal[];
}

export interface StudentIep {
  id: string;
  student_id: string;
  iep_year: string | null;
  iep_date: string | null;
  service_minutes: string | null;
  display_name: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  student_id: string;
  goal_number: number;
  description: string;
  iep_year: string | null;
  created_at: string;
  archived: boolean;
}

export interface Session {
  id: string;
  student_id: string;
  date: string;
  entered_by: string;
  notes: string | null;
  iep_year: string | null;
  occurred: boolean;
  no_show_reason: string | null;
  created_at: string;
  // joined
  student?: Student;
  entered_by_profile?: Profile;
  session_goals?: SessionGoal[];
}

export interface SessionGoal {
  id: string;
  session_id: string;
  goal_id: string;
  correct_count: number;
  total_count: number;
  percentage: number;
  target: string | null;
  performance_level: string | null;
  notes: string | null;
  // joined
  goal?: Goal;
}

export interface Hours {
  id: string;
  user_id: string;
  school_id: string;
  date: string;
  hours: number;
  time_in: string | null;
  time_out: string | null;
  description: string | null;
  category: string | null;
  created_at: string;
  // joined
  profile?: Profile;
  school?: School;
}

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected";

export interface Timesheet {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  status: TimesheetStatus;
  total_hours: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
  // joined
  profile?: Profile;
  reviewed_by_profile?: Profile;
  timesheet_hours?: TimesheetHour[];
}

export interface TimesheetHour {
  id: string;
  timesheet_id: string;
  hours_id: string;
  // joined
  hours?: Hours;
}

export interface Inquiry {
  id: string;
  parent_name: string;
  email: string | null;
  phone: string | null;
  child_name: string | null;
  child_age: string | null;
  message: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  school_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: InvoiceStatus;
  invoice_number: number | null;
  notes: string | null;
  submitted_date: string | null;
  created_at: string;
  // joined
  school?: School;
  invoice_lines?: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  user_id: string;
  date: string;
  hours: number;
  rate: number;
  amount: number;
  description: string | null;
  // joined
  profile?: Profile;
}

export interface QuestionnaireSubmission {
  id: string;
  child_name: string;
  date_of_birth: string | null;
  parent_name: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  service_type: "evaluation" | "therapy" | "both" | null;
  eval_type: string | null;
  therapy_type: "individualized" | "group" | null;
  session_preference: "in_person" | "virtual" | null;
  has_iep: boolean;
  wants_evaluation: boolean;
  pregnancy_birth: Record<string, unknown>;
  medical_health: Record<string, unknown>;
  developmental_milestones: Record<string, unknown>;
  speech_language: Record<string, unknown>;
  social_behavioral: Record<string, unknown>;
  education: Record<string, unknown>;
  family_history: Record<string, unknown>;
  parent_input: Record<string, unknown>;
  date_completed: string;
  created_at: string;
}

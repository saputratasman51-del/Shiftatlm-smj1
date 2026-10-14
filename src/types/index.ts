export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  full_name: string;
  nip_str?: string;
  role: UserRole;
  position: string;
  phone?: string;
  avatar_url?: string;
  password?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss
  color_code: string;
  description?: string;
  is_active: boolean;
}

export type ShiftAssignmentStatus = 'scheduled' | 'present' | 'swapped' | 'cancelled';

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  profile_id: string;
  shift_date: string; // YYYY-MM-DD
  status: ShiftAssignmentStatus;
  notes?: string;
  created_by?: string;
  created_at?: string;
  shift?: Shift;
  profile?: UserProfile;
}

export interface HandoverCategory {
  id: string;
  code: string;
  name: string;
  order_index: number;
  is_active: boolean;
}

export type HandoverStatus = 'draft' | 'pending' | 'received' | 'revision_needed';

export interface HandoverCategoryData {
  id?: string;
  handover_id?: string;
  category_id: string;
  patient_count: number;
  ongoing_tests?: string;
  pending_samples?: string;
  unverified_results?: string;
  issues_notes?: string;
  work_status: 'selesai' | 'proses' | 'tindak_lanjut';
}

export type LabConditionCategory = 'alat' | 'reagen' | 'kendala_sistem' | 'ruang_kerja' | 'k3' | 'catatan_khusus';
export type LabConditionStatus = 'baik' | 'normal' | 'peringatan' | 'rusak' | 'kritis';

export interface LabCondition {
  id: string;
  handover_id?: string;
  category: LabConditionCategory;
  item_name: string;
  status: LabConditionStatus;
  description: string;
  recorded_by?: string;
  created_at?: string;
}

export type TaskPriority = 'rendah' | 'sedang' | 'tinggi_cito';
export type TaskStatus = 'belum_dikerjakan' | 'dalam_proses' | 'selesai' | 'dibatalkan';

export interface PendingTask {
  id: string;
  handover_id?: string;
  task_type: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  followup_notes?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  assigned_profile?: UserProfile;
}

export interface HandoverStatusLog {
  id: string;
  handover_id: string;
  previous_status?: string;
  new_status: string;
  changed_by: string;
  changer_name?: string;
  notes?: string;
  created_at: string;
}

export interface Handover {
  id: string;
  shift_date: string; // YYYY-MM-DD
  shift_from_id: string;
  shift_to_id: string;
  giver_profile_id: string;
  receiver_profile_id?: string;
  status: HandoverStatus;
  given_at?: string;
  received_at?: string;
  total_patients: number;
  revision_notes?: string;
  created_at?: string;
  updated_at?: string;
  // Joins
  shift_from?: Shift;
  shift_to?: Shift;
  giver?: UserProfile;
  receiver?: UserProfile;
  categories_data?: Record<string, HandoverCategoryData>; // key: category_id
  lab_conditions?: LabCondition[];
  pending_tasks?: PendingTask[];
  status_logs?: HandoverStatusLog[];
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  target_table: string;
  target_id?: string;
  changes?: Record<string, any>;
  created_at: string;
}

export type ShiftSwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ShiftSwap {
  id: string;
  requester_id: string;
  target_profile_id: string;
  shift_date: string;
  shift_id: string;
  target_date?: string;
  target_shift_id?: string;
  reason: string;
  status: ShiftSwapStatus;
  approved_by?: string;
  approved_at?: string;
  whatsapp_sent: boolean;
  created_at: string;
  prior_requester_assignment?: ShiftAssignment | null;
  prior_target_assignment?: ShiftAssignment | null;
  // Joins
  requester?: UserProfile;
  target_profile?: UserProfile;
  shift?: Shift;
  target_shift?: Shift;
}

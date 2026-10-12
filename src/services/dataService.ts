import { supabase } from '../lib/supabase';
import {
  UserProfile,
  Shift,
  ShiftAssignment,
  HandoverCategory,
  Handover,
  HandoverCategoryData,
  LabCondition,
  PendingTask,
  AuditLog,
  HandoverStatus,
  ShiftSwap,
  ShiftSwapStatus,
} from '../types';

// Default 17 categories according to requirement F.2
export const INITIAL_CATEGORIES: HandoverCategory[] = [
  { id: 'cat-1', code: 'RANAP', name: 'Rawat Inap', order_index: 1, is_active: true },
  { id: 'cat-2', code: 'VK', name: 'Verloskamer', order_index: 2, is_active: true },
  { id: 'cat-3', code: 'NIFAS', name: 'Nifas', order_index: 3, is_active: true },
  { id: 'cat-4', code: 'PONEK', name: 'Ponek', order_index: 4, is_active: true },
  { id: 'cat-5', code: 'POLI_UMUM', name: 'Poli Umum', order_index: 5, is_active: true },
  { id: 'cat-6', code: 'IGD', name: 'IGD', order_index: 6, is_active: true },
  { id: 'cat-7', code: 'RAJAL', name: 'Rawat Jalan', order_index: 7, is_active: true },
  { id: 'cat-8', code: 'PERINATOLOGI', name: 'Perinatologi', order_index: 8, is_active: true },
  { id: 'cat-9', code: 'TRANSFUSI', name: 'Transfusi', order_index: 9, is_active: true },
  { id: 'cat-10', code: 'DONOR_LOLOS', name: 'Pendonor Lolos', order_index: 10, is_active: true },
  { id: 'cat-11', code: 'DONOR_BESOK', name: 'Pendonor Lanjut Besok', order_index: 11, is_active: true },
  { id: 'cat-12', code: 'DONOR_GAGAL', name: 'Pendonor Tidak Lolos', order_index: 12, is_active: true },
  { id: 'cat-13', code: 'CROSSMATCH', name: 'Crossmatch', order_index: 13, is_active: true },
  { id: 'cat-14', code: 'INSIDEN', name: 'Laporan Insiden', order_index: 14, is_active: true },
  { id: 'cat-15', code: 'NILAI_KRITIS', name: 'Nilai Kritis', order_index: 15, is_active: true },
  { id: 'cat-16', code: 'TB', name: 'TB', order_index: 16, is_active: true },
  { id: 'cat-17', code: 'MCU', name: 'MCU', order_index: 17, is_active: true },
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'shift-pagi',
    name: 'Shift Pagi',
    code: 'PAGI',
    start_time: '07:00:00',
    end_time: '14:00:00',
    color_code: '#0284c7', // Sky / Navy tone
    description: 'Pelayanan rutin laboratorium rawat jalan, rawat inap, dan MCU',
    is_active: true,
  },
  {
    id: 'shift-siang',
    name: 'Shift Siang',
    code: 'SIANG',
    start_time: '14:00:00',
    end_time: '21:00:00',
    color_code: '#d97706', // Amber
    description: 'Pelayanan laboratorium sore IGD, cito, rawat inap, dan donor darah',
    is_active: true,
  },
  {
    id: 'shift-malam',
    name: 'Shift Malam',
    code: 'MALAM',
    start_time: '21:00:00',
    end_time: '07:00:00',
    color_code: '#4f46e5', // Indigo
    description: 'Pelayanan siaga malam IGD, cito, PONEK, dan bank darah',
    is_active: true,
  },
  {
    id: 'shift-khusus',
    name: 'Shift Khusus / On-Call',
    code: 'KHUSUS',
    start_time: '08:00:00',
    end_time: '16:00:00',
    color_code: '#0d9488', // Teal
    description: 'Shift bantuan penjaminan mutu, validasi reagen, atau pemantauan akreditasi',
    is_active: true,
  },
];

export const AVATAR_PRESETS = [
  { id: 'av-1', name: 'Tasman (Admin/Ka. Lab)', url: '/src/assets/images/avatar_tasman_1791739900476.jpg' },
  { id: 'av-2', name: 'Siti (PJ Shift / Hijab)', url: '/src/assets/images/avatar_siti_1791739920784.jpg' },
  { id: 'av-3', name: 'Budi (ATLM Pelaksana)', url: '/src/assets/images/avatar_budi_1791739937453.jpg' },
  { id: 'av-4', name: 'Nurul (Bank Darah / Hijab)', url: '/src/assets/images/avatar_nurul_1791739951376.jpg' },
  { id: 'av-5', name: 'Ahmad (ATLM Flebotomi)', url: '/src/assets/images/avatar_ahmad_1791739968784.jpg' },
];

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user-admin-1',
    full_name: 'Tasman Saputra, S.Tr.Kes',
    nip_str: '19890412 201402 1 003',
    role: 'admin',
    position: 'Kepala Instalasi Laboratorium',
    phone: '081256789012',
    avatar_url: '/src/assets/images/avatar_tasman_1791739900476.jpg',
    password: '123',
    is_active: true,
  },
  {
    id: 'user-staff-1',
    full_name: 'Siti Rahmawati, A.Md.AK',
    nip_str: '19920815 201704 2 004',
    role: 'staff',
    position: 'PJ Shift / ATLM Senior',
    phone: '082154321987',
    avatar_url: '/src/assets/images/avatar_siti_1791739920784.jpg',
    password: '123',
    is_active: true,
  },
  {
    id: 'user-staff-2',
    full_name: 'Budi Santoso, A.Md.Kes',
    nip_str: '19941120 202001 1 006',
    role: 'staff',
    position: 'ATLM Pelaksana',
    phone: '085245678123',
    avatar_url: '/src/assets/images/avatar_budi_1791739937453.jpg',
    password: '123',
    is_active: true,
  },
  {
    id: 'user-staff-3',
    full_name: 'Nurul Hidayah, A.Md.AK',
    nip_str: '19960205 202203 2 008',
    role: 'staff',
    position: 'ATLM Pelaksana / Bank Darah',
    phone: '081398765432',
    avatar_url: '/src/assets/images/avatar_nurul_1791739951376.jpg',
    password: '123',
    is_active: true,
  },
  {
    id: 'user-staff-4',
    full_name: 'Ahmad Fauzi, S.Si',
    nip_str: '19950710 202102 1 007',
    role: 'staff',
    position: 'ATLM Pelaksana / Flebotomi',
    phone: '085750123456',
    avatar_url: '/src/assets/images/avatar_ahmad_1791739968784.jpg',
    password: '123',
    is_active: true,
  },
];

// Local storage key constants
const STORAGE_KEYS = {
  PROFILES: 'shift_atlm_profiles',
  SHIFTS: 'shift_atlm_shifts',
  ASSIGNMENTS: 'shift_atlm_assignments',
  CATEGORIES: 'shift_atlm_categories',
  HANDOVERS: 'shift_atlm_handovers',
  PENDING_TASKS: 'shift_atlm_pending_tasks',
  AUDIT_LOGS: 'shift_atlm_audit_logs',
  ACTIVE_USER_ID: 'shift_atlm_active_user_id',
  SHIFT_SWAPS: 'shift_atlm_shift_swaps',
};

// Helper to get today's date formatted in Asia/Pontianak
export function getPontianakDateString(date = new Date()): string {
  // Format YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPontianakTimeString(date = new Date()): string {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Pontianak',
  });
}

class DataService {
  private isSupabaseAvailable(): boolean {
    return !!supabase;
  }

  private safeLocalStorageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      console.warn('LocalStorage quota exceeded for key:', key, e);
      try {
        // Step 1: Evict temporary / non-critical history
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
        localStorage.removeItem(STORAGE_KEYS.PENDING_TASKS);
        localStorage.removeItem(STORAGE_KEYS.SHIFT_SWAPS);

        // If storing profiles, check if we need to trim heavy data (like long base64 avatars)
        if (key === STORAGE_KEYS.PROFILES) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              const stripped = parsed.map((p: any) => ({
                ...p,
                // If avatar is an oversized base64, remove it in fallback storage to prevent blocking profile saves
                avatar_url: p.avatar_url && p.avatar_url.length > 2000 ? undefined : p.avatar_url,
              }));
              localStorage.setItem(key, JSON.stringify(stripped));
              return;
            }
          } catch (stripErr) {
            // continue
          }
        }

        // Retry saving original
        localStorage.setItem(key, value);
      } catch (e2) {
        console.warn('Could not store full item in localStorage after cleanup (Supabase remains authoritative):', e2);
        // Do not throw so caller async operations (like saving profiles, handovers) continue smoothly
      }
    }
  }

  // --- INITIALIZATION ---
  public initLocalData() {
    // Purge legacy demo data if present
    try {
      const assignments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]');
      if (assignments.some((a: any) => a.id === 'assign-1')) {
        localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
      }
      const handovers = JSON.parse(localStorage.getItem(STORAGE_KEYS.HANDOVERS) || '[]');
      if (handovers.some((h: any) => h.id === 'ho-sample-1')) {
        localStorage.removeItem(STORAGE_KEYS.HANDOVERS);
      }
      const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_TASKS) || '[]');
      if (tasks.some((t: any) => t.id === 'task-1')) {
        localStorage.removeItem(STORAGE_KEYS.PENDING_TASKS);
      }
      const audit = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
      if (audit.some((a: any) => a.id === 'audit-1')) {
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
      }
    } catch (e) {
      // ignore
    }

    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    } else {
      try {
        // Clean up any oversized base64 avatars that might have bloated localStorage in past sessions
        const stored: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
        let updated = false;
        const patched = stored.map((p) => {
          let av = p.avatar_url;
          // If avatar is an enormous data URL (> 20KB), remove or replace
          if (av && av.startsWith('data:') && av.length > 25000) {
            av = undefined;
            updated = true;
          }
          if (!av) {
            const match = INITIAL_PROFILES.find((init) => init.id === p.id);
            if (match?.avatar_url) {
              updated = true;
              return { ...p, avatar_url: match.avatar_url };
            }
          }
          return { ...p, avatar_url: av };
        });
        if (updated) {
          this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(patched));
        }
      } catch (e) {
        console.warn('Error patching profile avatars:', e);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID)) {
      this.safeLocalStorageSet(STORAGE_KEYS.ACTIVE_USER_ID, INITIAL_PROFILES[0].id);
    }

    const today = getPontianakDateString();

    // Seed assignments as empty array (no demo data)
    if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify([]));
    }

    // Seed pending tasks as empty array (no demo data)
    if (!localStorage.getItem(STORAGE_KEYS.PENDING_TASKS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify([]));
    }

    // Seed handovers as empty array (no demo data)
    if (!localStorage.getItem(STORAGE_KEYS.HANDOVERS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify([]));
    }

    // Seed audit logs as empty array (no demo data)
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }

    // Seed shift swaps as empty array
    if (!localStorage.getItem(STORAGE_KEYS.SHIFT_SWAPS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.SHIFT_SWAPS, JSON.stringify([]));
    }
  }

  // --- CURRENT USER HANDLING ---
  public getActiveUserId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || INITIAL_PROFILES[0].id;
  }

  public setActiveUserId(userId: string) {
    this.safeLocalStorageSet(STORAGE_KEYS.ACTIVE_USER_ID, userId);
    this.logAudit(userId, 'SWITCH_USER', 'profiles', userId, { note: `Beralih profil pengguna` });
  }

  public async getActiveUser(): Promise<UserProfile> {
    const id = this.getActiveUserId();
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) || profiles[0] || INITIAL_PROFILES[0];
  }

  // --- PROFILES ---
  public async getProfiles(): Promise<UserProfile[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('full_name');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Fallback to local profiles:', e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.PROFILES);
    return local ? JSON.parse(local) : INITIAL_PROFILES;
  }

  public async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const profiles = await this.getProfiles();
    const existingIndex = profiles.findIndex((p) => p.id === profile.id);
    let updated: UserProfile[];

    if (existingIndex >= 0) {
      updated = [...profiles];
      updated[existingIndex] = profile;
    } else {
      updated = [...profiles, profile];
    }

    this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('profiles').upsert(profile);
      } catch (err) {
        console.warn('Supabase upsert failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), existingIndex >= 0 ? 'UPDATE_PROFILE' : 'CREATE_PROFILE', 'profiles', profile.id, {
      name: profile.full_name,
      role: profile.role,
    });

    return profile;
  }

  public async deleteProfile(id: string): Promise<boolean> {
    const profiles = await this.getProfiles();
    const updated = profiles.filter((p) => p.id !== id);
    this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete profile failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), 'DELETE_PROFILE', 'profiles', id, {});
    return true;
  }

  public async authenticate(identifier: string, pass: string): Promise<UserProfile | null> {
    const profiles = await this.getProfiles();
    const cleanId = identifier.trim().toLowerCase();
    const found = profiles.find((p) => {
      const matchNip = p.nip_str && p.nip_str.toLowerCase().replace(/\s+/g, '') === cleanId.replace(/\s+/g, '');
      const matchName = p.full_name.toLowerCase().includes(cleanId);
      return matchNip || matchName;
    });
    if (!found) return null;
    const password = found.password || '123';
    if (password === pass) {
      return found;
    }
    return null;
  }

  public async resetPassword(identifier: string, newPass: string): Promise<boolean> {
    const profiles = await this.getProfiles();
    const cleanId = identifier.trim().toLowerCase();
    const index = profiles.findIndex((p) => {
      const matchNip = p.nip_str && p.nip_str.toLowerCase().replace(/\s+/g, '') === cleanId.replace(/\s+/g, '');
      const matchName = p.full_name.toLowerCase().includes(cleanId);
      return matchNip || matchName;
    });
    if (index === -1) return false;
    profiles[index].password = newPass;
    this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    return true;
  }

  // --- SHIFTS ---
  public async getShifts(): Promise<Shift[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('shifts').select('*').order('start_time');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Fallback to local shifts:', e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return local ? JSON.parse(local) : INITIAL_SHIFTS;
  }

  public async saveShift(shift: Shift): Promise<Shift> {
    const shifts = await this.getShifts();
    const idx = shifts.findIndex((s) => s.id === shift.id);
    const updated = idx >= 0 ? shifts.map((s) => (s.id === shift.id ? shift : s)) : [...shifts, shift];
    this.safeLocalStorageSet(STORAGE_KEYS.SHIFTS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('shifts').upsert(shift);
      } catch (err) {
        console.warn('Supabase upsert shift failed:', err);
      }
    }
    return shift;
  }

  // --- SHIFT ASSIGNMENTS (JADWAL) ---
  public async getAssignments(filters?: {
    date?: string;
    month?: string; // YYYY-MM
    profileId?: string;
  }): Promise<ShiftAssignment[]> {
    let assignments: ShiftAssignment[] = [];

    if (this.isSupabaseAvailable()) {
      try {
        let query = supabase.from('shift_assignments').select('*, shift:shifts(*), profile:profiles(*)');
        if (filters?.date) query = query.eq('shift_date', filters.date);
        if (filters?.profileId) query = query.eq('profile_id', filters.profileId);
        const { data, error } = await query;
        if (!error && data) {
          assignments = data;
        }
      } catch (e) {
        console.warn('Fallback to local assignments:', e);
      }
    }

    if (assignments.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      assignments = local ? JSON.parse(local) : [];
    }

    // Attach shift & profile details if missing
    const [allShifts, allProfiles] = await Promise.all([this.getShifts(), this.getProfiles()]);
    assignments = assignments.map((a) => ({
      ...a,
      shift: a.shift || allShifts.find((s) => s.id === a.shift_id),
      profile: a.profile || allProfiles.find((p) => p.id === a.profile_id),
    }));

    // Apply filters
    if (filters?.date) {
      assignments = assignments.filter((a) => a.shift_date === filters.date);
    }
    if (filters?.month) {
      assignments = assignments.filter((a) => a.shift_date.startsWith(filters.month!));
    }
    if (filters?.profileId) {
      assignments = assignments.filter((a) => a.profile_id === filters.profileId);
    }

    return assignments;
  }

  public async saveAssignment(assignment: ShiftAssignment): Promise<{ success: boolean; conflict?: string }> {
    const all = await this.getAssignments();

    // Check for schedule conflict: same staff on the same date with conflicting or same shift
    const conflict = all.find(
      (a) =>
        a.id !== assignment.id &&
        a.profile_id === assignment.profile_id &&
        a.shift_date === assignment.shift_date &&
        a.shift_id === assignment.shift_id &&
        a.status !== 'cancelled'
    );

    if (conflict) {
      return {
        success: false,
        conflict: `Petugas sudah dijadwalkan pada shift tersebut di tanggal ${assignment.shift_date}!`,
      };
    }

    const idx = all.findIndex((a) => a.id === assignment.id);
    const updated = idx >= 0 ? all.map((a) => (a.id === assignment.id ? assignment : a)) : [...all, assignment];
    this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('shift_assignments').upsert({
          id: assignment.id,
          shift_id: assignment.shift_id,
          profile_id: assignment.profile_id,
          shift_date: assignment.shift_date,
          status: assignment.status,
          notes: assignment.notes,
          created_by: assignment.created_by,
        });
      } catch (err) {
        console.warn('Supabase upsert assignment failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), idx >= 0 ? 'UPDATE_JADWAL' : 'CREATE_JADWAL', 'shift_assignments', assignment.id, {
      date: assignment.shift_date,
      shift: assignment.shift_id,
      profile: assignment.profile_id,
    });

    return { success: true };
  }

  public async deleteAssignment(id: string): Promise<boolean> {
    const all = await this.getAssignments();
    const updated = all.filter((a) => a.id !== id);
    this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('shift_assignments').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete assignment failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), 'DELETE_JADWAL', 'shift_assignments', id, {});
    return true;
  }

  // --- CATEGORIES ---
  public async getCategories(): Promise<HandoverCategory[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('handover_categories').select('*').order('order_index');
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Fallback to local categories:', e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return local ? JSON.parse(local) : INITIAL_CATEGORIES;
  }

  public async saveCategory(category: HandoverCategory): Promise<HandoverCategory> {
    const categories = await this.getCategories();
    const idx = categories.findIndex((c) => c.id === category.id);
    const updated = idx >= 0 ? categories.map((c) => (c.id === category.id ? category : c)) : [...categories, category];
    this.safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('handover_categories').upsert(category);
      } catch (err) {
        console.warn('Supabase upsert category failed:', err);
      }
    }
    return category;
  }

  // --- HANDOVERS (SERAH TERIMA JAGA) ---
  public async getHandovers(filters?: {
    date?: string;
    status?: HandoverStatus;
    giverId?: string;
    receiverId?: string;
  }): Promise<Handover[]> {
    let handovers: Handover[] = [];

    if (this.isSupabaseAvailable()) {
      try {
        let query = supabase.from('handovers').select('*').order('created_at', { ascending: false });
        if (filters?.date) query = query.eq('shift_date', filters.date);
        if (filters?.status) query = query.eq('status', filters.status);
        const { data, error } = await query;
        if (!error && data) {
          handovers = data;
        }
      } catch (e) {
        console.warn('Fallback to local handovers:', e);
      }
    }

    if (handovers.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
      handovers = local ? JSON.parse(local) : [];
    }

    // Attach shift & profile details
    const [allShifts, allProfiles] = await Promise.all([this.getShifts(), this.getProfiles()]);
    handovers = handovers.map((h) => ({
      ...h,
      shift_from: h.shift_from || allShifts.find((s) => s.id === h.shift_from_id),
      shift_to: h.shift_to || allShifts.find((s) => s.id === h.shift_to_id),
      giver: h.giver || allProfiles.find((p) => p.id === h.giver_profile_id),
      receiver: h.receiver || allProfiles.find((p) => p.id === h.receiver_profile_id),
    }));

    if (filters?.date) {
      handovers = handovers.filter((h) => h.shift_date === filters.date);
    }
    if (filters?.status) {
      handovers = handovers.filter((h) => h.status === filters.status);
    }

    return handovers;
  }

  public async getHandoverById(id: string): Promise<Handover | null> {
    const all = await this.getHandovers();
    return all.find((h) => h.id === id) || null;
  }

  public async saveHandover(handover: Handover, logNote?: string): Promise<Handover> {
    const all = await this.getHandovers();
    const activeUser = await this.getActiveUser();

    // Auto calculate total patient count from categories
    let calculatedTotal = 0;
    if (handover.categories_data) {
      Object.values(handover.categories_data).forEach((c) => {
        calculatedTotal += Number(c.patient_count) || 0;
      });
    }
    handover.total_patients = calculatedTotal;
    handover.updated_at = new Date().toISOString();

    const idx = all.findIndex((h) => h.id === handover.id);
    const prevStatus = idx >= 0 ? all[idx].status : undefined;

    // Track status change log
    if (!handover.status_logs) handover.status_logs = [];
    if (prevStatus !== handover.status || logNote) {
      handover.status_logs.push({
        id: `log-${Date.now()}`,
        handover_id: handover.id,
        previous_status: prevStatus,
        new_status: handover.status,
        changed_by: activeUser.id,
        changer_name: activeUser.full_name,
        notes: logNote || `Status berubah menjadi ${handover.status}`,
        created_at: new Date().toISOString(),
      });
    }

    const updated = idx >= 0 ? all.map((h) => (h.id === handover.id ? handover : h)) : [handover, ...all];
    this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('handovers').upsert({
          id: handover.id,
          shift_date: handover.shift_date,
          shift_from_id: handover.shift_from_id,
          shift_to_id: handover.shift_to_id,
          giver_profile_id: handover.giver_profile_id,
          receiver_profile_id: handover.receiver_profile_id,
          status: handover.status,
          given_at: handover.given_at,
          received_at: handover.received_at,
          total_patients: handover.total_patients,
          revision_notes: handover.revision_notes,
        });
      } catch (err) {
        console.warn('Supabase save handover failed:', err);
      }
    }

    this.logAudit(activeUser.id, idx >= 0 ? 'UPDATE_SERAH_TERIMA' : 'CREATE_SERAH_TERIMA', 'handovers', handover.id, {
      status: handover.status,
      shift_date: handover.shift_date,
      total_patients: handover.total_patients,
    });

    return handover;
  }

  // --- PENDING TASKS ---
  public async getPendingTasks(statusFilter?: string): Promise<PendingTask[]> {
    let tasks: PendingTask[] = [];

    if (this.isSupabaseAvailable()) {
      try {
        let query = supabase.from('pending_tasks').select('*').order('created_at', { ascending: false });
        if (statusFilter) query = query.eq('status', statusFilter);
        const { data, error } = await query;
        if (!error && data) tasks = data;
      } catch (e) {
        console.warn('Fallback to local tasks:', e);
      }
    }

    if (tasks.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.PENDING_TASKS);
      tasks = local ? JSON.parse(local) : [];
    }

    const profiles = await this.getProfiles();
    tasks = tasks.map((t) => ({
      ...t,
      assigned_profile: profiles.find((p) => p.id === t.assigned_to),
    }));

    if (statusFilter) {
      tasks = tasks.filter((t) => t.status === statusFilter);
    }

    return tasks;
  }

  public async savePendingTask(task: PendingTask): Promise<PendingTask> {
    const tasks = await this.getPendingTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    const updated = idx >= 0 ? tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...tasks];
    this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('pending_tasks').upsert({
          id: task.id,
          handover_id: task.handover_id,
          task_type: task.task_type,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assigned_to: task.assigned_to,
          followup_notes: task.followup_notes,
          created_by: task.created_by,
        });
      } catch (err) {
        console.warn('Supabase upsert task failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), idx >= 0 ? 'UPDATE_TUGAS' : 'CREATE_TUGAS', 'pending_tasks', task.id, {
      task_type: task.task_type,
      status: task.status,
    });

    return task;
  }

  // --- AUDIT LOGS ---
  public async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (!error && data) return data;
      } catch (e) {
        console.warn('Fallback to local audit logs:', e);
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return local ? JSON.parse(local) : [];
  }

  public logAudit(userId: string, action: string, targetTable: string, targetId: string, changes: Record<string, any>) {
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
      const newLog: AuditLog = {
        id: `audit-${Date.now()}`,
        user_id: userId,
        action,
        target_table: targetTable,
        target_id: targetId,
        changes,
        created_at: new Date().toISOString(),
      };
      logs.unshift(newLog);
      this.safeLocalStorageSet(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));

      if (this.isSupabaseAvailable()) {
        supabase.from('audit_logs').insert([newLog]).then();
      }
    } catch (e) {
      console.warn('Log audit error:', e);
    }
  }

  // --- SHIFT SWAPS (TUKAR SHIFT) ---
  public async getShiftSwaps(): Promise<ShiftSwap[]> {
    let swaps: ShiftSwap[] = [];
    const local = localStorage.getItem(STORAGE_KEYS.SHIFT_SWAPS);
    if (local) {
      swaps = JSON.parse(local);
    }
    const [allProfiles, allShifts] = await Promise.all([this.getProfiles(), this.getShifts()]);
    return swaps.map((s) => ({
      ...s,
      requester: allProfiles.find((p) => p.id === s.requester_id),
      target_profile: allProfiles.find((p) => p.id === s.target_profile_id),
      shift: allShifts.find((sh) => sh.id === s.shift_id),
      target_shift: s.target_shift_id ? allShifts.find((sh) => sh.id === s.target_shift_id) : undefined,
    }));
  }

  public async saveShiftSwap(swap: ShiftSwap): Promise<ShiftSwap> {
    const all = await this.getShiftSwaps();
    const idx = all.findIndex((s) => s.id === swap.id);
    const updated = idx >= 0 ? all.map((s) => (s.id === swap.id ? swap : s)) : [swap, ...all];
    this.safeLocalStorageSet(STORAGE_KEYS.SHIFT_SWAPS, JSON.stringify(updated));

    this.logAudit(this.getActiveUserId(), idx >= 0 ? 'UPDATE_TUKAR_SHIFT' : 'CREATE_TUKAR_SHIFT', 'shift_swaps', swap.id, {
      date: swap.shift_date,
      requester: swap.requester_id,
      target: swap.target_profile_id,
    });

    return swap;
  }

  public async updateShiftSwapStatus(id: string, status: ShiftSwapStatus, approverId: string): Promise<boolean> {
    const all = await this.getShiftSwaps();
    const swap = all.find((s) => s.id === id);
    if (!swap) return false;

    swap.status = status;
    swap.approved_by = approverId;
    swap.approved_at = new Date().toISOString();

    await this.saveShiftSwap(swap);

    // If approved, automatically update shift assignment on that date!
    if (status === 'approved') {
      const assignments = await this.getAssignments({ date: swap.shift_date });
      const existingAssign = assignments.find(
        (a) => a.profile_id === swap.requester_id && a.shift_id === swap.shift_id
      );

      if (existingAssign) {
        existingAssign.profile_id = swap.target_profile_id;
        existingAssign.status = 'swapped';
        existingAssign.notes = `Tukar shift disetujui dengan ${swap.requester?.full_name || 'Rekan'}. Alasan: ${swap.reason}`;
        await this.saveAssignment(existingAssign);
      }
    }

    return true;
  }

  // Clear or reset local data to defaults
  public resetToDefaultSeed() {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.SHIFTS);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.HANDOVERS);
    localStorage.removeItem(STORAGE_KEYS.PENDING_TASKS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SHIFT_SWAPS);
    this.initLocalData();
  }
}

export const dataService = new DataService();
// Run initial seed check immediately
dataService.initLocalData();

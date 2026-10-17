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
  ChatRoom,
  ChatMessage,
  MessageType,
  Announcement,
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
  { id: 'av-3', name: 'Budi (Admin / ATLM)', url: '/src/assets/images/avatar_budi_1791739937453.jpg' },
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
    role: 'admin',
    position: 'Administrator Laboratorium / ATLM',
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
  {
    id: 'user-1791788423659',
    full_name: 'Andi Saputra, S.Tr.Kes',
    nip_str: '199502152020121005',
    role: 'admin',
    position: 'Administrator Laboratorium / ATLM',
    phone: '081234567890',
    avatar_url: '/src/assets/images/avatar_tasman_1791739900476.jpg',
    password: '123',
    is_active: true,
  },
];

export const INITIAL_ASSIGNMENTS: ShiftAssignment[] = [
  {
    id: 'assign-init-1',
    profile_id: 'user-staff-1', // Siti Rahmawati
    shift_id: 'shift-pagi',
    shift_date: '2026-10-15',
    status: 'scheduled',
    notes: 'Dinas Reguler Laboratorium',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-2',
    profile_id: 'user-staff-2', // Budi Santoso
    shift_id: 'shift-siang',
    shift_date: '2026-10-15',
    status: 'scheduled',
    notes: 'Jaga Siang Validasi Hasil & Bank Darah',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-3',
    profile_id: 'user-staff-3', // Nurul Hidayah
    shift_id: 'shift-malam',
    shift_date: '2026-10-15',
    status: 'scheduled',
    notes: 'Jaga Malam IGD, Cito & Bank Darah',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-4',
    profile_id: 'user-staff-4', // Ahmad Fauzi
    shift_id: 'shift-pagi',
    shift_date: '2026-10-16',
    status: 'scheduled',
    notes: 'Dinas Pagi Flebotomi Rawat Jalan',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-5',
    profile_id: 'user-admin-1', // Tasman Saputra
    shift_id: 'shift-khusus',
    shift_date: '2026-10-15',
    status: 'scheduled',
    notes: 'Supervisi Mutu dan On-Call Laboratorium',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-6',
    profile_id: 'user-staff-1', // Siti Rahmawati
    shift_id: 'shift-siang',
    shift_date: '2026-10-20',
    status: 'scheduled',
    notes: 'Pelayanan Hematologi & Kimia Klinik',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-7',
    profile_id: 'user-staff-2', // Budi Santoso
    shift_id: 'shift-pagi',
    shift_date: '2026-10-20',
    status: 'scheduled',
    notes: 'Dinas Pagi Laboratorium Sentral',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-8',
    profile_id: 'user-staff-3', // Nurul Hidayah
    shift_id: 'shift-siang',
    shift_date: '2026-11-05',
    status: 'scheduled',
    notes: 'Dinas Siang Bank Darah & PONEK',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-9',
    profile_id: 'user-staff-4', // Ahmad Fauzi
    shift_id: 'shift-siang',
    shift_date: '2026-10-22',
    status: 'scheduled',
    notes: 'Dinas Siang Pelayanan Mikrobiologi',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
  {
    id: 'assign-init-10',
    profile_id: 'user-admin-1', // Tasman Saputra
    shift_id: 'shift-pagi',
    shift_date: '2026-10-19',
    status: 'scheduled',
    notes: 'Verifikasi & Validasi Reagen Laboratorium',
    created_by: 'user-admin-1',
    created_at: '2026-10-01T08:00:00Z',
  },
];

export const INITIAL_HANDOVERS: Handover[] = [
  {
    id: 'ho-init-1',
    shift_date: '2026-10-14',
    shift_from_id: 'shift-pagi',
    shift_to_id: 'shift-siang',
    giver_profile_id: 'user-staff-1', // Siti Rahmawati
    receiver_profile_id: 'user-staff-2', // Budi Santoso
    status: 'received',
    given_at: '2026-10-14 14:00:00',
    received_at: '2026-10-14 14:08:00',
    total_patients: 16,
    revision_notes: '',
    categories_data: {
      'cat-1': { category_id: 'cat-1', patient_count: 6, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Pelayanan lancar, reagen terkalibrasi', work_status: 'selesai' },
      'cat-2': { category_id: 'cat-2', patient_count: 4, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Sampel terambil dan teranalisis lengkap', work_status: 'selesai' },
      'cat-3': { category_id: 'cat-3', patient_count: 3, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Pemeriksaan cito terlayani tepat waktu', work_status: 'selesai' },
      'cat-4': { category_id: 'cat-4', patient_count: 3, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Pemeriksaan elektrolit terlaporkan', work_status: 'selesai' },
    },
    lab_conditions: [
      { id: 'cond-1-1', category: 'alat', item_name: 'Sysmex XP-100 Hematology', status: 'baik', description: 'Background check normal, running kontrol OK' },
      { id: 'cond-1-2', category: 'alat', item_name: 'Mindray BS-120 Chemistry', status: 'baik', description: 'Suhu inkubasi stabil 37°C, kalibrasi harian OK' },
      { id: 'cond-1-3', category: 'reagen', item_name: 'Reagen Cellpack & Stromatolyser', status: 'normal', description: 'Stok mencukupi untuk 3 hari' },
      { id: 'cond-1-4', category: 'ruang_kerja', item_name: 'Suhu Ruangan & Kulkas Reagen (2-8°C)', status: 'normal', description: 'Suhu kulkas 3.8°C terpantau di termometer digital' }
    ],
    pending_tasks: [
      { id: 'task-1-1', handover_id: 'ho-init-1', task_type: 'Validasi Hasil Kimia Darah Ruang Melati', description: 'Hasil fungsi ginjal pasien Ny. Warsini sudah dikirim ke ruangan', priority: 'sedang', status: 'selesai', assigned_to: 'user-staff-2', created_by: 'user-staff-1', created_at: '2026-10-14T14:02:00Z' }
    ],
    status_logs: [
      { id: 'log-ho-1-1', handover_id: 'ho-init-1', previous_status: 'draft', new_status: 'pending', changed_by: 'user-staff-1', changer_name: 'Siti Rahmawati, A.Md.AK', notes: 'Dokumen serah terima shift pagi dikirimkan', created_at: '2026-10-14T14:00:00Z' },
      { id: 'log-ho-1-2', handover_id: 'ho-init-1', previous_status: 'pending', new_status: 'received', changed_by: 'user-staff-2', changer_name: 'Budi Santoso, A.Md.Kes', notes: 'Diterima resmi oleh petugas shift siang', created_at: '2026-10-14T14:08:00Z' }
    ],
    created_at: '2026-10-14T07:00:00Z',
    updated_at: '2026-10-14T07:08:00Z',
  },
  {
    id: 'ho-init-2',
    shift_date: '2026-10-15',
    shift_from_id: 'shift-pagi',
    shift_to_id: 'shift-siang',
    giver_profile_id: 'user-staff-1', // Siti Rahmawati
    receiver_profile_id: 'user-staff-2', // Budi Santoso (Admin / ATLM)
    status: 'pending', // Menunggu Penerimaan!
    given_at: '2026-10-15 14:00:00',
    total_patients: 15,
    revision_notes: '',
    categories_data: {
      'cat-1': { category_id: 'cat-1', patient_count: 5, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Rawat jalan selesai tertangani', work_status: 'selesai' },
      'cat-2': { category_id: 'cat-2', patient_count: 4, ongoing_tests: 'Crossmatch PRC 1 kolf pasien Bedah', pending_samples: '', unverified_results: '', issues_notes: 'Inkubasi fase 2 selesai pkl 14:30 WIB', work_status: 'proses' },
      'cat-3': { category_id: 'cat-3', patient_count: 3, ongoing_tests: '', pending_samples: '1 tabung EDTA IGD lisis', unverified_results: '', issues_notes: 'Menunggu kiriman resample dari perawat IGD', work_status: 'tindak_lanjut' },
      'cat-15': { category_id: 'cat-15', patient_count: 2, ongoing_tests: '', pending_samples: '', unverified_results: 'Kalium kritis 6.5 mEq/L (Tn. Bambang/ICU)', issues_notes: 'Nilai kritis sudah dilaporkan per telepon ke dr. Jaga ICU', work_status: 'selesai' },
      'cat-13': { category_id: 'cat-13', patient_count: 1, ongoing_tests: 'Uji silang serasi darah elektif', pending_samples: '', unverified_results: '', issues_notes: 'Kantung darah sudah disiapkan di kulkas bank darah', work_status: 'proses' },
    },
    lab_conditions: [
      { id: 'cond-2-1', category: 'alat', item_name: 'Sysmex XP-100 Hematology', status: 'baik', description: 'Lolos background check harian, tidak ada kendala clot' },
      { id: 'cond-2-2', category: 'alat', item_name: 'Mindray BS-120 Chemistry', status: 'baik', description: 'Reagen stabil, lampu fotometer normal' },
      { id: 'cond-2-3', category: 'reagen', item_name: 'Reagen Gel Crossmatch & Bovine Albumin', status: 'normal', description: 'Stok mencukupi, expired date masih panjang (2027)' },
      { id: 'cond-2-4', category: 'ruang_kerja', item_name: 'Suhu Ruangan AC Lab & Cold Chain', status: 'normal', description: 'Suhu ruangan 20°C, kulkas darah 4.0°C stabil' }
    ],
    pending_tasks: [
      { id: 'task-2-1', handover_id: 'ho-init-2', task_type: 'Cito Tindak Lanjut Crossmatch Ruang Bedah', description: 'Pasien Tn. Hasanuddin (Bedah) membutuhkan darah PRC 1 kolf sebelum jam 16:00', priority: 'tinggi_cito', status: 'belum_dikerjakan', assigned_to: 'user-staff-2', created_by: 'user-staff-1', created_at: '2026-10-15T14:00:00Z' },
      { id: 'task-2-2', handover_id: 'ho-init-2', task_type: 'Konfirmasi Resample EDTA Pasien IGD', description: 'Sampel ulang darah lengkap Ny. Mariana ditunggu dari perawat IGD', priority: 'sedang', status: 'belum_dikerjakan', assigned_to: 'user-staff-2', created_by: 'user-staff-1', created_at: '2026-10-15T14:00:00Z' }
    ],
    status_logs: [
      { id: 'log-ho-2-1', handover_id: 'ho-init-2', previous_status: 'draft', new_status: 'pending', changed_by: 'user-staff-1', changer_name: 'Siti Rahmawati, A.Md.AK', notes: 'Dokumen serah terima shift pagi dikirimkan, menunggu konfirmasi petugas shift siang', created_at: '2026-10-15T14:00:00Z' }
    ],
    created_at: '2026-10-15T07:00:00Z',
    updated_at: '2026-10-15T07:00:00Z',
  },
  {
    id: 'ho-init-3',
    shift_date: '2026-09-28',
    shift_from_id: 'shift-siang',
    shift_to_id: 'shift-malam',
    giver_profile_id: 'user-staff-2', // Budi Santoso
    receiver_profile_id: 'user-staff-3', // Nurul Hidayah
    status: 'received',
    given_at: '2026-09-28 21:00:00',
    received_at: '2026-09-28 21:07:00',
    total_patients: 19,
    revision_notes: '',
    categories_data: {
      'cat-1': { category_id: 'cat-1', patient_count: 7, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Lancar', work_status: 'selesai' },
      'cat-2': { category_id: 'cat-2', patient_count: 6, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Selesai dianalisis', work_status: 'selesai' },
      'cat-3': { category_id: 'cat-3', patient_count: 4, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Cito IGD tertangani', work_status: 'selesai' },
      'cat-13': { category_id: 'cat-13', patient_count: 2, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Crossmatch 2 kolf siap', work_status: 'selesai' },
    },
    lab_conditions: [
      { id: 'cond-3-1', category: 'alat', item_name: 'Sysmex XP-100', status: 'baik', description: 'Normal' },
      { id: 'cond-3-2', category: 'alat', item_name: 'Mindray BS-120', status: 'baik', description: 'Normal' },
    ],
    pending_tasks: [],
    status_logs: [
      { id: 'log-ho-3-1', handover_id: 'ho-init-3', previous_status: 'draft', new_status: 'received', changed_by: 'user-staff-3', changer_name: 'Nurul Hidayah', notes: 'Diterima resmi shift malam', created_at: '2026-09-28T21:07:00Z' }
    ],
    created_at: '2026-09-28T14:00:00Z',
    updated_at: '2026-09-28T14:07:00Z',
  },
  {
    id: 'ho-init-4',
    shift_date: '2026-09-12',
    shift_from_id: 'shift-pagi',
    shift_to_id: 'shift-siang',
    giver_profile_id: 'user-staff-1', // Siti
    receiver_profile_id: 'user-staff-4', // Ahmad
    status: 'received',
    given_at: '2026-09-12 14:00:00',
    received_at: '2026-09-12 14:05:00',
    total_patients: 22,
    revision_notes: '',
    categories_data: {
      'cat-1': { category_id: 'cat-1', patient_count: 10, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Pemeriksaan rutin lengkap', work_status: 'selesai' },
      'cat-2': { category_id: 'cat-2', patient_count: 8, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
      'cat-4': { category_id: 'cat-4', patient_count: 4, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
    },
    lab_conditions: [
      { id: 'cond-4-1', category: 'alat', item_name: 'Sysmex XP-100', status: 'baik', description: 'Kondisi prima' }
    ],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-09-12T07:00:00Z',
    updated_at: '2026-09-12T07:05:00Z',
  },
  {
    id: 'ho-init-5',
    shift_date: '2026-08-25',
    shift_from_id: 'shift-malam',
    shift_to_id: 'shift-pagi',
    giver_profile_id: 'user-staff-3', // Nurul
    receiver_profile_id: 'user-staff-1', // Siti
    status: 'received',
    given_at: '2026-08-25 07:00:00',
    received_at: '2026-08-25 07:08:00',
    total_patients: 17,
    revision_notes: '',
    categories_data: {
      'cat-3': { category_id: 'cat-3', patient_count: 6, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
      'cat-2': { category_id: 'cat-2', patient_count: 8, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
      'cat-15': { category_id: 'cat-15', patient_count: 3, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: 'Nilai kritis terlaporkan', work_status: 'selesai' },
    },
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:08:00Z',
  },
  {
    id: 'ho-init-6',
    shift_date: '2026-08-10',
    shift_from_id: 'shift-pagi',
    shift_to_id: 'shift-siang',
    giver_profile_id: 'user-staff-4', // Ahmad
    receiver_profile_id: 'user-staff-2', // Budi
    status: 'received',
    given_at: '2026-08-10 14:00:00',
    received_at: '2026-08-10 14:06:00',
    total_patients: 24,
    revision_notes: '',
    categories_data: {
      'cat-1': { category_id: 'cat-1', patient_count: 12, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
      'cat-2': { category_id: 'cat-2', patient_count: 8, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
      'cat-4': { category_id: 'cat-4', patient_count: 4, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
    },
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-08-10T07:00:00Z',
    updated_at: '2026-08-10T07:06:00Z',
  },
  {
    id: 'ho-init-7',
    shift_date: '2026-07-20',
    shift_from_id: 'shift-siang',
    shift_to_id: 'shift-malam',
    giver_profile_id: 'user-staff-2',
    receiver_profile_id: 'user-staff-3',
    status: 'received',
    given_at: '2026-07-20 21:00:00',
    received_at: '2026-07-20 21:05:00',
    total_patients: 20,
    revision_notes: '',
    categories_data: {
      'cat-1': { category_id: 'cat-1', patient_count: 8, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
      'cat-2': { category_id: 'cat-2', patient_count: 8, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
      'cat-3': { category_id: 'cat-3', patient_count: 4, ongoing_tests: '', pending_samples: '', unverified_results: '', issues_notes: '', work_status: 'selesai' },
    },
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-07-20T14:00:00Z',
    updated_at: '2026-07-20T14:05:00Z',
  },
  {
    id: 'ho-init-8',
    shift_date: '2026-06-15',
    shift_from_id: 'shift-pagi',
    shift_to_id: 'shift-siang',
    giver_profile_id: 'user-staff-1',
    receiver_profile_id: 'user-staff-2',
    status: 'received',
    given_at: '2026-06-15 14:00:00',
    received_at: '2026-06-15 14:05:00',
    total_patients: 18,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-06-15T07:00:00Z',
    updated_at: '2026-06-15T07:05:00Z',
  },
  {
    id: 'ho-init-9',
    shift_date: '2026-05-18',
    shift_from_id: 'shift-siang',
    shift_to_id: 'shift-malam',
    giver_profile_id: 'user-staff-2',
    receiver_profile_id: 'user-staff-3',
    status: 'received',
    given_at: '2026-05-18 21:00:00',
    received_at: '2026-05-18 21:06:00',
    total_patients: 21,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-05-18T14:00:00Z',
    updated_at: '2026-05-18T14:06:00Z',
  },
  {
    id: 'ho-init-10',
    shift_date: '2026-04-22',
    shift_from_id: 'shift-malam',
    shift_to_id: 'shift-pagi',
    giver_profile_id: 'user-staff-3',
    receiver_profile_id: 'user-staff-1',
    status: 'received',
    given_at: '2026-04-22 07:00:00',
    received_at: '2026-04-22 07:05:00',
    total_patients: 16,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-04-22T00:00:00Z',
    updated_at: '2026-04-22T00:05:00Z',
  },
  {
    id: 'ho-init-11',
    shift_date: '2026-03-10',
    shift_from_id: 'shift-pagi',
    shift_to_id: 'shift-siang',
    giver_profile_id: 'user-staff-1',
    receiver_profile_id: 'user-staff-2',
    status: 'received',
    given_at: '2026-03-10 14:00:00',
    received_at: '2026-03-10 14:07:00',
    total_patients: 25,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-03-10T07:00:00Z',
    updated_at: '2026-03-10T07:07:00Z',
  },
  {
    id: 'ho-init-12',
    shift_date: '2026-02-14',
    shift_from_id: 'shift-siang',
    shift_to_id: 'shift-malam',
    giver_profile_id: 'user-staff-2',
    receiver_profile_id: 'user-staff-3',
    status: 'received',
    given_at: '2026-02-14 21:00:00',
    received_at: '2026-02-14 21:05:00',
    total_patients: 19,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-02-14T14:00:00Z',
    updated_at: '2026-02-14T14:05:00Z',
  },
  {
    id: 'ho-init-13',
    shift_date: '2026-01-20',
    shift_from_id: 'shift-pagi',
    shift_to_id: 'shift-siang',
    giver_profile_id: 'user-staff-4',
    receiver_profile_id: 'user-staff-1',
    status: 'received',
    given_at: '2026-01-20 14:00:00',
    received_at: '2026-01-20 14:08:00',
    total_patients: 23,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-01-20T07:00:00Z',
    updated_at: '2026-01-20T07:08:00Z',
  },
  {
    id: 'ho-init-14',
    shift_date: '2026-10-08',
    shift_from_id: 'shift-siang',
    shift_to_id: 'shift-malam',
    giver_profile_id: 'user-staff-2',
    receiver_profile_id: 'user-staff-3',
    status: 'received',
    given_at: '2026-10-08 21:00:00',
    received_at: '2026-10-08 21:04:00',
    total_patients: 18,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-10-08T14:00:00Z',
    updated_at: '2026-10-08T14:04:00Z',
  },
  {
    id: 'ho-init-15',
    shift_date: '2026-10-01',
    shift_from_id: 'shift-malam',
    shift_to_id: 'shift-pagi',
    giver_profile_id: 'user-staff-3',
    receiver_profile_id: 'user-staff-1',
    status: 'received',
    given_at: '2026-10-01 07:00:00',
    received_at: '2026-10-01 07:05:00',
    total_patients: 14,
    revision_notes: '',
    categories_data: {},
    lab_conditions: [],
    pending_tasks: [],
    status_logs: [],
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:05:00Z',
  }
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
export function getPontianakDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Pontianak',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export function getPontianakTimeString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Pontianak',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export interface ActiveDutyInfo {
  activeShift: Shift | null;
  dutyDate: string; // The date of the shift assignment
  isNightShiftPostMidnight: boolean; // True if 00:00-06:59 during overnight night shift
  timeRangeDisplay: string;
  descriptionText: string;
}

/**
 * Calculates current active shift and exact duty date.
 * For night shift (21:00-07:00):
 * If the day has changed (00:00 - 06:59), the currently working duty staff is the staff
 * assigned to the 21:00 shift yesterday, NOT today's upcoming 21:00 shift.
 */
export function getCurrentDutyShiftInfo(shifts: Shift[] = []): ActiveDutyInfo {
  const todayStr = getPontianakDateString();
  const timeStr = getPontianakTimeString();
  const [curH, curM] = timeStr.split(':').map(Number);
  const curMinutes = (isNaN(curH) ? 0 : curH) * 60 + (isNaN(curM) ? 0 : curM);

  // Yesterday date string
  const todayDate = new Date(todayStr);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const pagiShift =
    shifts.find((s) => s.code === 'PAGI') ||
    shifts.find((s) => s.name?.toLowerCase().includes('pagi')) ||
    shifts[0] ||
    null;
  const siangShift =
    shifts.find((s) => s.code === 'SIANG') ||
    shifts.find((s) => s.name?.toLowerCase().includes('siang')) ||
    shifts[1] ||
    null;
  const malamShift =
    shifts.find((s) => s.code === 'MALAM') ||
    shifts.find((s) => s.name?.toLowerCase().includes('malam')) ||
    shifts[2] ||
    null;

  // Shift Pagi: 07:00 - 14:00 (420 - 840 min)
  if (curMinutes >= 7 * 60 && curMinutes < 14 * 60) {
    return {
      activeShift: pagiShift,
      dutyDate: todayStr,
      isNightShiftPostMidnight: false,
      timeRangeDisplay: '07:00 - 14:00 WIB',
      descriptionText: 'Shift Pagi sedang berlangsung',
    };
  }

  // Shift Siang: 14:00 - 21:00 (840 - 1260 min)
  if (curMinutes >= 14 * 60 && curMinutes < 21 * 60) {
    return {
      activeShift: siangShift,
      dutyDate: todayStr,
      isNightShiftPostMidnight: false,
      timeRangeDisplay: '14:00 - 21:00 WIB',
      descriptionText: 'Shift Siang sedang berlangsung',
    };
  }

  // Shift Malam: 21:00 - 07:00 (1260 min to 420 min next day)
  // Rentang 21:00 - 23:59 (Hari ini sebelum berganti hari)
  if (curMinutes >= 21 * 60) {
    return {
      activeShift: malamShift,
      dutyDate: todayStr,
      isNightShiftPostMidnight: false,
      timeRangeDisplay: '21:00 - 07:00 WIB',
      descriptionText: 'Shift Malam sedang berlangsung (Mulai 21:00 Malam Ini)',
    };
  }

  // Rentang 00:00 - 06:59 (Sudah berganti hari selama rentang 21.00-07.00)
  // Yang terbaca tetap petugas yang shift 21.00 hari kemarin, bukan petugas shift malam besoknya
  return {
    activeShift: malamShift,
    dutyDate: yesterdayStr,
    isNightShiftPostMidnight: true,
    timeRangeDisplay: '21:00 - 07:00 WIB',
    descriptionText: 'Shift Malam sedang berlangsung (Mulai 21:00 Kemarin s/d 07:00 Pagi Ini)',
  };
}

export type RealtimeEventCallback = (event: {
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC';
  data?: any;
}) => void;

export type SyncStatus = {
  connected: boolean;
  channelStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'CONNECTING';
  lastSynced: Date | null;
  error: string | null;
  isSupabaseConfigured: boolean;
};

class DataService {
  private realtimeChannel: any = null;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private listeners: Set<RealtimeEventCallback> = new Set();
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private syncStatus: SyncStatus = {
    connected: false,
    channelStatus: 'CONNECTING',
    lastSynced: null,
    error: null,
    isSupabaseConfigured: false,
  };

  constructor() {
    this.syncStatus.isSupabaseConfigured = this.isSupabaseAvailable();
    this.setupRealtimeSync();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Browser online, reconnecting realtime & syncing data...');
        this.reconnectAndSync();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          const now = Date.now();
          const last = this.syncStatus.lastSynced ? new Date(this.syncStatus.lastSynced).getTime() : 0;
          // Only re-sync if tab was inactive for more than 60 seconds
          if (now - last > 60000) {
            console.log('Tab visible after idle, checking sync & realtime...');
            this.reconnectAndSync();
          }
        }
      });
    }
  }

  public isSupabaseAvailable(): boolean {
    return !!supabase;
  }

  /**
   * Safe setItem to localStorage to prevent QuotaExceededError
   */
  private safeLocalStorageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      console.warn('LocalStorage quota exceeded for key:', key, e);
      try {
        localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
        localStorage.setItem(key, value);
      } catch (innerErr) {
        console.warn('Failed to save to localStorage after audit log eviction:', innerErr);
      }
    }
  }

  // --- FAST SYNCHRONOUS CACHE GETTERS (ZERO MS RENDER ON REFRESH) ---
  public getCachedProfiles(): UserProfile[] {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.PROFILES);
      const result: UserProfile[] = local ? JSON.parse(local) : INITIAL_PROFILES;
      return result.map((p) => {
        if (
          p.id === 'user-staff-2' ||
          p.full_name?.toLowerCase().includes('budi santoso') ||
          p.id === 'user-1791788423659' ||
          p.full_name?.toLowerCase().includes('andi saputra')
        ) {
          return { ...p, role: 'admin' as const, position: p.position || 'Administrator Laboratorium / ATLM' };
        }
        return p;
      });
    } catch (e) {
      return INITIAL_PROFILES;
    }
  }

  public getCachedShifts(): Shift[] {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      return local ? JSON.parse(local) : INITIAL_SHIFTS;
    } catch (e) {
      return INITIAL_SHIFTS;
    }
  }

  public getCachedCategories(): HandoverCategory[] {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return local ? JSON.parse(local) : INITIAL_CATEGORIES;
    } catch (e) {
      return INITIAL_CATEGORIES;
    }
  }

  public getCachedAssignments(filters?: { date?: string; month?: string; profileId?: string }): ShiftAssignment[] {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      let assignments: ShiftAssignment[] = local ? JSON.parse(local) : INITIAL_ASSIGNMENTS;
      if (!assignments || assignments.length === 0) {
        assignments = INITIAL_ASSIGNMENTS;
      }
      const allShifts = this.getCachedShifts();
      const allProfiles = this.getCachedProfiles();
      assignments = assignments.map((a) => ({
        ...a,
        shift: a.shift || allShifts.find((s) => s.id === a.shift_id),
        profile: a.profile || allProfiles.find((p) => p.id === a.profile_id),
      }));

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
    } catch (e) {
      return INITIAL_ASSIGNMENTS;
    }
  }

  public getCachedHandovers(filters?: { date?: string; status?: string }): Handover[] {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
      let handovers: Handover[] = local ? JSON.parse(local) : INITIAL_HANDOVERS;
      if (!handovers || handovers.length === 0) {
        handovers = INITIAL_HANDOVERS;
      }

      // Filter out permanently deleted handover IDs
      try {
        const deletedIds = JSON.parse(localStorage.getItem('shift_atlm_deleted_handovers') || '[]');
        if (deletedIds.length > 0) {
          handovers = handovers.filter((h) => !deletedIds.includes(h.id));
        }
      } catch (e) {}

      const allShifts = this.getCachedShifts();
      const allProfiles = this.getCachedProfiles();
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
    } catch (e) {
      return INITIAL_HANDOVERS;
    }
  }

  public getCachedShiftSwaps(): ShiftSwap[] {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.SHIFT_SWAPS);
      let swaps: ShiftSwap[] = local ? JSON.parse(local) : [];
      const allShifts = this.getCachedShifts();
      const allProfiles = this.getCachedProfiles();
      return swaps.map((s) => ({
        ...s,
        shift: s.shift || allShifts.find((sh) => sh.id === s.shift_id),
        requester: s.requester || allProfiles.find((p) => p.id === s.requester_id),
        target_profile: s.target_profile || allProfiles.find((p) => p.id === s.target_profile_id),
      }));
    } catch (e) {
      return [];
    }
  }

  public getCachedPendingTasks(): PendingTask[] {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.PENDING_TASKS);
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  }

  // --- REALTIME SUBSCRIPTIONS & BROADCAST ---
  public setupRealtimeSync() {
    if (!this.isSupabaseAvailable()) {
      this.updateStatus({
        connected: false,
        channelStatus: 'CLOSED',
        error: 'Supabase credentials not configured',
      });
      return;
    }

    if (this.realtimeChannel) {
      try {
        supabase.removeChannel(this.realtimeChannel);
      } catch (e) {}
      this.realtimeChannel = null;
    }

    try {
      // Connect to global realtime hospital sync channel
      this.realtimeChannel = supabase.channel('hospital_realtime_sync', {
        config: {
          broadcast: { self: false },
        },
      });

      // 1. Listen for Postgres changes on all database tables
      const tables = [
        'profiles',
        'shifts',
        'shift_assignments',
        'handovers',
        'pending_tasks',
        'shift_swaps',
        'audit_logs',
      ];

      tables.forEach((table) => {
        this.realtimeChannel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload: any) => {
            console.log(`[Supabase Realtime DB] ${table}:`, payload.eventType, payload.new || payload.old);
            this.handleRemoteChange(table, payload.eventType, payload.new || payload.old);
          }
        );
      });

      // 2. Listen for Broadcast messages across all staff devices
      this.realtimeChannel.on(
        'broadcast',
        { event: 'REALTIME_CHANGE' },
        (payload: any) => {
          if (payload?.payload) {
            const { table, action, data } = payload.payload;
            console.log(`[Supabase Realtime Broadcast] ${table}:`, action, data);
            this.handleRemoteChange(table, action, data);
          }
        }
      );

      // 3. Subscribe to the channel with auto-reconnection
      this.realtimeChannel.subscribe((status: string, err: any) => {
        console.log('[Supabase Realtime Channel Status]:', status, err || '');
        if (status === 'SUBSCRIBED') {
          this.updateStatus({
            connected: true,
            channelStatus: 'SUBSCRIBED',
            lastSynced: new Date(),
            error: null,
          });
          // Resync all data whenever channel subscribes
          this.syncAllFromRemote();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.updateStatus({
            connected: false,
            channelStatus: status as any,
            error: err?.message || `Koneksi realtime ${status.toLowerCase()}`,
          });
          this.scheduleReconnect();
        } else {
          this.updateStatus({
            channelStatus: status as any,
          });
        }
      });
    } catch (e: any) {
      console.warn('Error setting up Supabase Realtime:', e);
      this.updateStatus({
        connected: false,
        channelStatus: 'CHANNEL_ERROR',
        error: e.message || 'Gagal menginisialisasi realtime',
      });
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('Attempting to reconnect Supabase Realtime...');
      this.setupRealtimeSync();
    }, 3500);
  }

  public reconnectAndSync() {
    this.setupRealtimeSync();
    this.syncAllFromRemote();
  }

  /**
   * Sync all tables from Supabase into localStorage in the background
   */
  public async syncAllFromRemote(): Promise<void> {
    if (!this.isSupabaseAvailable()) return;

    try {
      const [
        profsRes,
        shiftsRes,
        assignsRes,
        hoRes,
        swapsRes,
        tasksRes,
        catsRes,
      ] = await Promise.allSettled([
        supabase.from('profiles').select('*').order('full_name'),
        supabase.from('shifts').select('*').order('start_time'),
        supabase.from('shift_assignments').select('*'),
        supabase.from('handovers').select('*').order('created_at', { ascending: false }),
        supabase.from('shift_swaps').select('*').order('created_at', { ascending: false }),
        supabase.from('pending_tasks').select('*'),
        supabase.from('handover_categories').select('*').order('sort_order'),
      ]);

      let hasChanges = false;

      if (profsRes.status === 'fulfilled' && !profsRes.value.error && profsRes.value.data && profsRes.value.data.length > 0) {
        const enforced = profsRes.value.data.map((p: UserProfile) => {
          if (
            p.id === 'user-staff-2' ||
            p.full_name?.toLowerCase().includes('budi santoso') ||
            p.id === 'user-1791788423659' ||
            p.full_name?.toLowerCase().includes('andi saputra')
          ) {
            return { ...p, role: 'admin' as const, position: p.position || 'Administrator Laboratorium / ATLM' };
          }
          return p;
        });
        this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(enforced));
        hasChanges = true;
      }

      if (shiftsRes.status === 'fulfilled' && !shiftsRes.value.error && shiftsRes.value.data && shiftsRes.value.data.length > 0) {
        this.safeLocalStorageSet(STORAGE_KEYS.SHIFTS, JSON.stringify(shiftsRes.value.data));
        hasChanges = true;
      }

      if (assignsRes.status === 'fulfilled' && !assignsRes.value.error && assignsRes.value.data) {
        if (assignsRes.value.data.length > 0) {
          this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignsRes.value.data));
          hasChanges = true;
        }
      }

      if (hoRes.status === 'fulfilled' && !hoRes.value.error && hoRes.value.data) {
        let freshHo = hoRes.value.data;
        try {
          const deletedIds = JSON.parse(localStorage.getItem('shift_atlm_deleted_handovers') || '[]');
          if (deletedIds.length > 0) {
            freshHo = freshHo.filter((h: any) => !deletedIds.includes(h.id));
          }
        } catch (e) {}
        this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(freshHo));
        hasChanges = true;
      }

      if (swapsRes.status === 'fulfilled' && !swapsRes.value.error && swapsRes.value.data) {
        this.safeLocalStorageSet(STORAGE_KEYS.SHIFT_SWAPS, JSON.stringify(swapsRes.value.data));
        hasChanges = true;
      }

      if (tasksRes.status === 'fulfilled' && !tasksRes.value.error && tasksRes.value.data) {
        this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(tasksRes.value.data));
        hasChanges = true;
      }

      if (catsRes.status === 'fulfilled' && !catsRes.value.error && catsRes.value.data && catsRes.value.data.length > 0) {
        this.safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(catsRes.value.data));
        hasChanges = true;
      }

      if (hasChanges) {
        this.updateStatus({ connected: true, lastSynced: new Date() });
        this.notifyListeners({ table: 'ALL', action: 'SYNC' });
      }
    } catch (e) {
      console.warn('Error in syncAllFromRemote:', e);
    }
  }

  private updateStatus(partial: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...partial };
    this.statusListeners.forEach((fn) => fn(this.syncStatus));
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  public onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.syncStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Broadcast change to all other active staff sessions
   */
  public broadcastChange(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC', data?: any) {
    if (this.realtimeChannel && this.syncStatus.connected) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'REALTIME_CHANGE',
          payload: { table, action, data },
        });
      } catch (err) {
        console.warn('Broadcast send failed:', err);
      }
    }
    // Also notify local components immediately
    this.notifyListeners({ table, action, data });
  }

  /**
   * Register a component to receive realtime data changes
   */
  public subscribe(callback: RealtimeEventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: { table: string; action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC'; data?: any }) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in realtime listener callback:', err);
      }
    });
  }

  private updateLocalCacheIncremental(storageKey: string, action: string, item: any): boolean {
    if (!item?.id) return false;
    try {
      const local = localStorage.getItem(storageKey);
      const list: any[] = local ? JSON.parse(local) : [];
      let updated = false;

      if (action === 'DELETE') {
        const filtered = list.filter((x) => x.id !== item.id);
        if (filtered.length !== list.length) {
          this.safeLocalStorageSet(storageKey, JSON.stringify(filtered));
          updated = true;
        }
      } else if (action === 'INSERT') {
        const existingIdx = list.findIndex((x) => x.id === item.id);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...item };
        } else {
          list.unshift(item);
        }
        this.safeLocalStorageSet(storageKey, JSON.stringify(list));
        updated = true;
      } else if (action === 'UPDATE') {
        const existingIdx = list.findIndex((x) => x.id === item.id);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...item };
        } else {
          list.push(item);
        }
        this.safeLocalStorageSet(storageKey, JSON.stringify(list));
        updated = true;
      }
      return updated;
    } catch (e) {
      console.warn('Error in updateLocalCacheIncremental:', e);
      return false;
    }
  }

  private async handleRemoteChange(table: string, action: any, data: any) {
    this.updateStatus({ lastSynced: new Date() });

    const normalizedAction = ((action || 'SYNC') as string).toUpperCase();

    // Map table name to localStorage cache key
    const tableKeyMap: Record<string, string> = {
      profiles: STORAGE_KEYS.PROFILES,
      shift_assignments: STORAGE_KEYS.ASSIGNMENTS,
      handovers: STORAGE_KEYS.HANDOVERS,
      pending_tasks: STORAGE_KEYS.PENDING_TASKS,
      shift_swaps: STORAGE_KEYS.SHIFT_SWAPS,
      shifts: STORAGE_KEYS.SHIFTS,
      handover_categories: STORAGE_KEYS.CATEGORIES,
    };

    const storageKey = tableKeyMap[table];

    // Incremental cache update: if event is a single row change, avoid full table re-fetch!
    if (
      storageKey &&
      data &&
      data.id &&
      (normalizedAction === 'INSERT' || normalizedAction === 'UPDATE' || normalizedAction === 'DELETE')
    ) {
      this.updateLocalCacheIncremental(storageKey, normalizedAction, data);
    } else if (normalizedAction === 'SYNC') {
      try {
        if (table === 'profiles') {
          await this.getProfiles(true);
        } else if (table === 'shift_assignments') {
          await this.getAssignments(undefined, true);
        } else if (table === 'handovers') {
          await this.getHandovers(undefined, true);
        } else if (table === 'pending_tasks') {
          await this.getPendingTasks(undefined, true);
        } else if (table === 'shift_swaps') {
          await this.getShiftSwaps(true);
        } else if (table === 'shifts') {
          await this.getShifts(true);
        }
      } catch (e) {
        console.warn('Error in handleRemoteChange background sync:', e);
      }
    }

    // Unified notification to listeners with event details
    this.notifyListeners({ table, action: normalizedAction as any, data });
  }

  /**
   * Initialize local cache and ensure default initial seeds exist
   */
  public initLocalData() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
      this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    } else {
      try {
        const stored: UserProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
        let updated = false;
        const patched = stored.map((p) => {
          let role = p.role;
          let position = p.position;
          if (p.id === 'user-staff-2' || p.full_name.includes('Budi Santoso')) {
            if (role !== 'admin') {
              role = 'admin';
              position = 'Administrator Laboratorium / ATLM';
              updated = true;
            }
          }
          if (
            p.id === 'user-1791788423659' ||
            p.full_name.toLowerCase().includes('andi saputra')
          ) {
            if (role !== 'admin') {
              role = 'admin';
              position = 'Administrator Laboratorium / ATLM';
              updated = true;
            }
          }
          let av = p.avatar_url;
          if (av && av.startsWith('data:') && av.length > 25000) {
            av = undefined;
            updated = true;
          }
          if (!av) {
            const match = INITIAL_PROFILES.find((init) => init.id === p.id);
            if (match?.avatar_url) {
              updated = true;
              return { ...p, role, position, avatar_url: match.avatar_url };
            }
          }
          return { ...p, role, position, avatar_url: av };
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
    if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]').length === 0) {
      this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
    }
    const storedHandoversStr = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
    if (!storedHandoversStr || JSON.parse(storedHandoversStr || '[]').length === 0) {
      this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(INITIAL_HANDOVERS));
    } else {
      try {
        const storedHandovers: Handover[] = JSON.parse(storedHandoversStr);
        const missing = INITIAL_HANDOVERS.filter((init) => !storedHandovers.some((s) => s.id === init.id));
        if (missing.length > 0) {
          const merged = [...storedHandovers, ...missing];
          this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(merged));
        }
      } catch (e) {
        this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(INITIAL_HANDOVERS));
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.PENDING_TASKS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_TASKS) || '[]').length === 0) {
      const initTasks = INITIAL_HANDOVERS.flatMap((h) => h.pending_tasks || []);
      this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(initTasks));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHIFT_SWAPS)) {
      this.safeLocalStorageSet(STORAGE_KEYS.SHIFT_SWAPS, JSON.stringify([]));
    }

    // Trigger initial background sync with Supabase
    this.seedSupabaseIfEmpty().then(() => {
      this.syncAllFromRemote();
    });
  }

  /**
   * Seed initial data to Supabase if tables are newly created and empty
   */
  public async seedSupabaseIfEmpty() {
    if (!this.isSupabaseAvailable()) return;

    try {
      // 1. Check profiles
      const { data: profs, error: profErr } = await supabase.from('profiles').select('id').limit(1);
      if (!profErr && profs && profs.length === 0) {
        console.log('Seeding initial profiles to Supabase...');
        const cleanProfiles = INITIAL_PROFILES.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          nip_str: p.nip_str,
          role: p.role,
          position: p.position,
          phone: p.phone,
          avatar_url: p.avatar_url,
          password: p.password || '123',
          is_active: p.is_active,
        }));
        await supabase.from('profiles').upsert(cleanProfiles);
      }

      // 2. Check shifts
      const { data: shiftData, error: shiftErr } = await supabase.from('shifts').select('id').limit(1);
      if (!shiftErr && shiftData && shiftData.length === 0) {
        console.log('Seeding initial shifts to Supabase...');
        await supabase.from('shifts').upsert(INITIAL_SHIFTS);
      }

      // 3. Check categories
      const { data: catData, error: catErr } = await supabase.from('handover_categories').select('id').limit(1);
      if (!catErr && catData && catData.length === 0) {
        console.log('Seeding initial categories to Supabase...');
        await supabase.from('handover_categories').upsert(INITIAL_CATEGORIES);
      }

      // 4. Check shift_assignments
      const { data: assignData, error: assignErr } = await supabase.from('shift_assignments').select('id').limit(1);
      if (!assignErr && assignData && assignData.length === 0) {
        console.log('Seeding initial shift_assignments to Supabase...');
        const local = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
        const toSeed = local ? JSON.parse(local) : INITIAL_ASSIGNMENTS;
        if (toSeed && toSeed.length > 0) {
          const cleanAssignments = toSeed.map((a: any) => ({
            id: a.id,
            profile_id: a.profile_id,
            shift_id: a.shift_id,
            shift_date: a.shift_date,
            notes: a.notes || null,
            status: a.status || 'scheduled',
          }));
          await supabase.from('shift_assignments').upsert(cleanAssignments);
        }
      }

      // 5. Check handovers
      const { data: hoData, error: hoErr } = await supabase.from('handovers').select('id').limit(1);
      if (!hoErr && hoData && hoData.length === 0) {
        console.log('Seeding initial handovers to Supabase...');
        const local = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
        const toSeedHo = local ? JSON.parse(local) : INITIAL_HANDOVERS;
        if (toSeedHo && toSeedHo.length > 0) {
          const cleanHo = toSeedHo.map((h: any) => ({
            id: h.id,
            shift_date: h.shift_date,
            shift_from_id: h.shift_from_id,
            shift_to_id: h.shift_to_id,
            giver_profile_id: h.giver_profile_id,
            receiver_profile_id: h.receiver_profile_id,
            general_notes: h.general_notes || '',
            urgent_notes: h.urgent_notes || '',
            equipment_notes: h.equipment_notes || '',
            status: h.status || 'pending',
            created_at: h.created_at || new Date().toISOString(),
            categories_data: h.categories_data || {},
          }));
          await supabase.from('handovers').upsert(cleanHo);
        }
      }

      // Ensure Budi and Andi Saputra are updated to admin role in Supabase profiles
      try {
        await supabase
          .from('profiles')
          .update({ role: 'admin', position: 'Administrator Laboratorium / ATLM' })
          .eq('id', 'user-staff-2');

        await supabase
          .from('profiles')
          .update({ role: 'admin', position: 'Administrator' })
          .or('id.eq.user-1791788423659,full_name.ilike.%Andi Saputra%');
      } catch (err) {
        // ignore if not yet migrated
      }
    } catch (e) {
      console.warn('Initial Supabase seeding check:', e);
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
  public async getProfiles(forceRefresh = false): Promise<UserProfile[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('full_name');
        if (!error && data && data.length > 0) {
          const enforced = data.map((p: UserProfile) => {
            if (
              p.id === 'user-staff-2' ||
              p.full_name?.toLowerCase().includes('budi santoso') ||
              p.id === 'user-1791788423659' ||
              p.full_name?.toLowerCase().includes('andi saputra')
            ) {
              if (p.role !== 'admin') {
                supabase
                  .from('profiles')
                  .update({ role: 'admin', position: 'Administrator Laboratorium / ATLM' })
                  .eq('id', p.id)
                  .then();
              }
              return { ...p, role: 'admin' as const, position: p.position || 'Administrator Laboratorium / ATLM' };
            }
            return p;
          });
          this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(enforced));
          this.updateStatus({ connected: true, lastSynced: new Date() });
          return enforced;
        }
      } catch (e: any) {
        console.warn('Fallback to local profiles:', e);
        this.updateStatus({ error: e.message });
      }
    }
    const local = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const result: UserProfile[] = local ? JSON.parse(local) : INITIAL_PROFILES;
    return result.map((p) => {
      if (
        p.id === 'user-staff-2' ||
        p.full_name?.toLowerCase().includes('budi santoso') ||
        p.id === 'user-1791788423659' ||
        p.full_name?.toLowerCase().includes('andi saputra')
      ) {
        return { ...p, role: 'admin' as const, position: p.position || 'Administrator Laboratorium / ATLM' };
      }
      return p;
    });
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
        const cleanPayload = {
          id: profile.id,
          full_name: profile.full_name,
          nip_str: profile.nip_str,
          role: profile.role,
          position: profile.position,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          password: profile.password || '123',
          is_active: profile.is_active,
        };
        const { error } = await supabase.from('profiles').upsert(cleanPayload);
        if (error) {
          console.warn('Supabase upsert profile warning:', error.message);
        } else {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        }
      } catch (err: any) {
        console.warn('Supabase save profile failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), existingIndex >= 0 ? 'UPDATE_PROFILE' : 'CREATE_PROFILE', 'profiles', profile.id, {
      name: profile.full_name,
      role: profile.role,
    });

    this.broadcastChange('profiles', existingIndex >= 0 ? 'UPDATE' : 'INSERT', profile);
    return profile;
  }

  public async deleteProfile(id: string): Promise<boolean> {
    const profiles = await this.getProfiles();
    const updated = profiles.filter((p) => p.id !== id);
    this.safeLocalStorageSet(STORAGE_KEYS.PROFILES, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (!error) {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        }
      } catch (err) {
        console.warn('Supabase delete profile failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), 'DELETE_PROFILE', 'profiles', id, {});
    this.broadcastChange('profiles', 'DELETE', { id });
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
    await this.saveProfile(profiles[index]);
    return true;
  }

  // --- SHIFTS ---
  public async getShifts(forceRefresh = false): Promise<Shift[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('shifts').select('*').order('start_time');
        if (!error && data && data.length > 0) {
          this.safeLocalStorageSet(STORAGE_KEYS.SHIFTS, JSON.stringify(data));
          return data;
        }
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
        await supabase.from('shifts').upsert({
          id: shift.id,
          name: shift.name,
          code: shift.code,
          start_time: shift.start_time,
          end_time: shift.end_time,
          color_code: shift.color_code,
          description: shift.description,
          is_active: shift.is_active,
        });
      } catch (err) {
        console.warn('Supabase upsert shift failed:', err);
      }
    }

    this.broadcastChange('shifts', idx >= 0 ? 'UPDATE' : 'INSERT', shift);
    return shift;
  }

  // --- SHIFT ASSIGNMENTS (JADWAL) ---
  public async getAssignments(
    filters?: {
      date?: string;
      month?: string; // YYYY-MM
      profileId?: string;
    },
    forceRefresh = false
  ): Promise<ShiftAssignment[]> {
    // 1. Instant return from local cache if available and not forced
    const cached = this.getCachedAssignments(filters);

    if (this.isSupabaseAvailable()) {
      try {
        let query = supabase.from('shift_assignments').select('*');
        if (filters?.date) {
          query = query.eq('shift_date', filters.date);
        } else if (filters?.month) {
          query = query.gte('shift_date', `${filters.month}-01`).lte('shift_date', `${filters.month}-31`);
        }
        if (filters?.profileId) {
          query = query.eq('profile_id', filters.profileId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          try {
            const local = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
            const currentAll: ShiftAssignment[] = local ? JSON.parse(local) : [];
            const merged = [...currentAll];
            data.forEach((item: ShiftAssignment) => {
              const idx = merged.findIndex((m) => m.id === item.id);
              if (idx >= 0) merged[idx] = item;
              else merged.push(item);
            });
            this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(merged));
          } catch (e) {}
          return this.getCachedAssignments(filters);
        }
      } catch (e) {
        console.warn('Fallback to local assignments:', e);
      }
    }

    if (cached.length > 0) {
      return cached;
    }

    // Default fallback to initial assignments
    return this.getCachedAssignments(filters);
  }

  public async saveAssignment(assignment: ShiftAssignment): Promise<{ success: boolean; conflict?: string }> {
    // Targeted conflict check only on the specific date and staff:
    const onDate = await this.getAssignments({ date: assignment.shift_date, profileId: assignment.profile_id });
    const conflict = onDate.find(
      (a) =>
        a.id !== assignment.id &&
        a.shift_id === assignment.shift_id &&
        a.status !== 'cancelled'
    );

    if (conflict) {
      return {
        success: false,
        conflict: `Petugas sudah dijadwalkan pada shift yang sama di tanggal ${assignment.shift_date}! (Double shift diperbolehkan untuk shift yang berbeda)`,
      };
    }

    const cachedList = this.getCachedAssignments();
    const idx = cachedList.findIndex((a) => a.id === assignment.id);
    const updated = idx >= 0 ? cachedList.map((a) => (a.id === assignment.id ? assignment : a)) : [...cachedList, assignment];
    this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        const cleanPayload = {
          id: assignment.id,
          shift_id: assignment.shift_id,
          profile_id: assignment.profile_id,
          shift_date: assignment.shift_date,
          status: assignment.status,
          notes: assignment.notes || '',
          created_by: assignment.created_by,
        };
        const { error } = await supabase.from('shift_assignments').upsert(cleanPayload);
        if (error) {
          console.warn('Supabase upsert assignment warning:', error.message);
        } else {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        }
      } catch (err) {
        console.warn('Supabase upsert assignment failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), idx >= 0 ? 'UPDATE_JADWAL' : 'CREATE_JADWAL', 'shift_assignments', assignment.id, {
      date: assignment.shift_date,
      shift: assignment.shift_id,
      profile: assignment.profile_id,
    });

    this.broadcastChange('shift_assignments', idx >= 0 ? 'UPDATE' : 'INSERT', assignment);
    return { success: true };
  }

  public async deleteAssignment(id: string): Promise<boolean> {
    const all = await this.getAssignments();
    const updated = all.filter((a) => a.id !== id);
    this.safeLocalStorageSet(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        const { error } = await supabase.from('shift_assignments').delete().eq('id', id);
        if (!error) {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        }
      } catch (err) {
        console.warn('Supabase delete assignment failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), 'DELETE_JADWAL', 'shift_assignments', id, {});
    this.broadcastChange('shift_assignments', 'DELETE', { id });
    return true;
  }

  // --- CATEGORIES ---
  public async getCategories(): Promise<HandoverCategory[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('handover_categories').select('*').order('order_index');
        if (!error && data && data.length > 0) {
          this.safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(data));
          return data;
        }
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
        await supabase.from('handover_categories').upsert({
          id: category.id,
          code: category.code,
          name: category.name,
          order_index: category.order_index,
          is_active: category.is_active,
        });
      } catch (err) {
        console.warn('Supabase upsert category failed:', err);
      }
    }
    return category;
  }

  // --- HANDOVERS (SERAH TERIMA JAGA) ---
  public async getHandovers(
    filters?: {
      date?: string;
      status?: HandoverStatus;
      giverId?: string;
      receiverId?: string;
      limit?: number;
    },
    forceRefresh = false
  ): Promise<Handover[]> {
    let handovers: Handover[] = [];

    if (this.isSupabaseAvailable()) {
      try {
        let query = supabase.from('handovers').select('*').order('created_at', { ascending: false });
        if (filters?.date) query = query.eq('shift_date', filters.date);
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.limit) query = query.limit(filters.limit);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          handovers = data;
          let filtered = data;
          try {
            const deletedIds = JSON.parse(localStorage.getItem('shift_atlm_deleted_handovers') || '[]');
            if (deletedIds.length > 0) {
              filtered = filtered.filter((h: any) => !deletedIds.includes(h.id));
            }
          } catch (e) {}
          if (!filters?.date && !filters?.status && !filters?.limit) {
            this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(filtered));
          } else {
            try {
              const local = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
              const currentAll: Handover[] = local ? JSON.parse(local) : [];
              const merged = [...currentAll];
              filtered.forEach((item: Handover) => {
                const idx = merged.findIndex((m) => m.id === item.id);
                if (idx >= 0) merged[idx] = item;
                else merged.push(item);
              });
              this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(merged));
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Fallback to local handovers:', e);
      }
    }

    if (handovers.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
      if (local !== null) {
        try {
          handovers = JSON.parse(local) || [];
        } catch (e) {
          handovers = INITIAL_HANDOVERS;
        }
      } else {
        handovers = INITIAL_HANDOVERS;
        this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(INITIAL_HANDOVERS));
      }
    }

    // Filter out permanently deleted handover IDs
    try {
      const deletedIds = JSON.parse(localStorage.getItem('shift_atlm_deleted_handovers') || '[]');
      if (deletedIds.length > 0) {
        handovers = handovers.filter((h) => !deletedIds.includes(h.id));
      }
    } catch (e) {}

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
    if (!id) return null;
    // Fast path: find in cache first
    const cached = this.getCachedHandovers().find((h) => h.id === id);
    if (cached) return cached;

    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('handovers')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const [allShifts, allProfiles] = await Promise.all([this.getShifts(), this.getProfiles()]);
          return {
            ...data,
            shift_from: allShifts.find((s) => s.id === data.shift_from_id),
            shift_to: allShifts.find((s) => s.id === data.shift_to_id),
            giver: allProfiles.find((p) => p.id === data.giver_profile_id),
            receiver: allProfiles.find((p) => p.id === data.receiver_profile_id),
          };
        }
      } catch (e) {
        console.warn('Error fetching handover by id from Supabase:', e);
      }
    }
    return null;
  }

  public async saveHandover(handover: Handover, logNote?: string): Promise<Handover> {
    const all = this.getCachedHandovers();
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
    if (!handover.created_at) {
      handover.created_at = new Date().toISOString();
    }

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

    // Also sync pending tasks to tasks storage
    if (handover.pending_tasks && handover.pending_tasks.length > 0) {
      try {
        const existingTasks = await this.getPendingTasks();
        let tasksUpdated = false;
        const mergedTasks = [...existingTasks];
        handover.pending_tasks.forEach((pt) => {
          const pIdx = mergedTasks.findIndex((t) => t.id === pt.id);
          if (pIdx >= 0) {
            mergedTasks[pIdx] = { ...mergedTasks[pIdx], ...pt, handover_id: handover.id };
            tasksUpdated = true;
          } else {
            mergedTasks.unshift({ ...pt, handover_id: handover.id });
            tasksUpdated = true;
          }
        });
        if (tasksUpdated) {
          this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(mergedTasks));
          this.broadcastChange('pending_tasks', 'INSERT', mergedTasks);
        }
      } catch (e) {
        console.warn('Error syncing pending tasks from handover:', e);
      }
    }

    if (this.isSupabaseAvailable()) {
      try {
        const cleanPayload = {
          id: handover.id,
          shift_date: handover.shift_date,
          shift_from_id: handover.shift_from_id,
          shift_to_id: handover.shift_to_id,
          giver_profile_id: handover.giver_profile_id,
          receiver_profile_id: handover.receiver_profile_id || null,
          status: handover.status,
          given_at: handover.given_at || null,
          received_at: handover.received_at || null,
          total_patients: handover.total_patients || 0,
          revision_notes: handover.revision_notes || '',
          categories_data: handover.categories_data || {},
          lab_conditions: handover.lab_conditions || [],
          pending_tasks: handover.pending_tasks || [],
          status_logs: handover.status_logs || [],
          created_at: handover.created_at || new Date().toISOString(),
          updated_at: handover.updated_at || new Date().toISOString(),
        };
        const { error } = await supabase.from('handovers').upsert(cleanPayload);
        if (error) {
          console.warn('Supabase save handover warning:', error.message);
        } else {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        }
      } catch (err) {
        console.warn('Supabase save handover failed:', err);
      }
    }

    this.logAudit(activeUser.id, idx >= 0 ? 'UPDATE_SERAH_TERIMA' : 'CREATE_SERAH_TERIMA', 'handovers', handover.id, {
      status: handover.status,
      shift_date: handover.shift_date,
      total_patients: handover.total_patients,
    });

    this.broadcastChange('handovers', idx >= 0 ? 'UPDATE' : 'INSERT', handover);
    return handover;
  }

  public async deleteHandover(id: string): Promise<boolean> {
    const all = await this.getHandovers();
    const updated = all.filter((h) => h.id !== id);
    this.safeLocalStorageSet(STORAGE_KEYS.HANDOVERS, JSON.stringify(updated));

    try {
      const deletedIds = JSON.parse(localStorage.getItem('shift_atlm_deleted_handovers') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('shift_atlm_deleted_handovers', JSON.stringify(deletedIds));
      }
    } catch (e) {}

    // Clean up any pending tasks associated with this deleted handover
    try {
      const allTasks = await this.getPendingTasks();
      const updatedTasks = allTasks.filter((t) => t.handover_id !== id);
      if (allTasks.length !== updatedTasks.length) {
        this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(updatedTasks));
        this.broadcastChange('pending_tasks', 'DELETE', { handover_id: id });
      }
    } catch (e) {}

    if (this.isSupabaseAvailable()) {
      try {
        const { error } = await supabase.from('handovers').delete().eq('id', id);
        if (!error) {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        } else {
          console.warn('Supabase delete handover error:', error.message);
        }
        await supabase.from('pending_tasks').delete().eq('handover_id', id);
      } catch (err) {
        console.warn('Supabase delete handover failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), 'DELETE_SERAH_TERIMA', 'handovers', id, {});
    this.broadcastChange('handovers', 'DELETE', { id });
    return true;
  }

  // --- PENDING TASKS ---
  public async getPendingTasks(
    filters?: { status?: string; limit?: number; activeOnly?: boolean } | string,
    forceRefresh = false
  ): Promise<PendingTask[]> {
    let tasks: PendingTask[] = [];
    const statusFilter = typeof filters === 'string' ? filters : filters?.status;
    const limit = typeof filters === 'object' ? filters?.limit : undefined;
    const activeOnly = typeof filters === 'object' ? filters?.activeOnly : false;

    if (this.isSupabaseAvailable()) {
      try {
        let query = supabase.from('pending_tasks').select('*').order('created_at', { ascending: false });
        if (statusFilter) {
          query = query.eq('status', statusFilter);
        } else if (activeOnly) {
          query = query.in('status', ['belum_dikerjakan', 'dalam_proses']);
        }
        if (limit) {
          query = query.limit(limit);
        }
        const { data, error } = await query;
        if (!error && data) {
          tasks = data;
          if (!statusFilter && !limit && !activeOnly) {
            this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(data));
          }
        }
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
    } else if (activeOnly) {
      tasks = tasks.filter((t) => t.status === 'belum_dikerjakan' || t.status === 'dalam_proses');
    }

    return tasks;
  }

  public async savePendingTask(task: PendingTask): Promise<PendingTask> {
    const tasks = this.getCachedPendingTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    const updated = idx >= 0 ? tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...tasks];
    this.safeLocalStorageSet(STORAGE_KEYS.PENDING_TASKS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        const cleanPayload = {
          id: task.id,
          handover_id: task.handover_id || null,
          task_type: task.task_type,
          description: task.description,
          priority: task.priority,
          status: task.status,
          assigned_to: task.assigned_to || null,
          followup_notes: task.followup_notes || '',
          created_by: task.created_by,
        };
        const { error } = await supabase.from('pending_tasks').upsert(cleanPayload);
        if (error) {
          console.warn('Supabase upsert task warning:', error.message);
        } else {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        }
      } catch (err) {
        console.warn('Supabase upsert task failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), idx >= 0 ? 'UPDATE_TUGAS' : 'CREATE_TUGAS', 'pending_tasks', task.id, {
      task_type: task.task_type,
      status: task.status,
    });

    this.broadcastChange('pending_tasks', idx >= 0 ? 'UPDATE' : 'INSERT', task);
    return task;
  }

  // --- AUDIT LOGS ---
  public async getAuditLogs(): Promise<AuditLog[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
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
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
        supabase
          .from('audit_logs')
          .insert([
            {
              id: newLog.id,
              user_id: newLog.user_id,
              action: newLog.action,
              target_table: newLog.target_table,
              target_id: newLog.target_id,
              changes: newLog.changes,
            },
          ])
          .then();
      }
    } catch (e) {
      console.warn('Log audit error:', e);
    }
  }

  // --- SHIFT SWAPS (TUKAR SHIFT) ---
  public async getShiftSwaps(forceRefresh = false): Promise<ShiftSwap[]> {
    let swaps: ShiftSwap[] = [];

    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase.from('shift_swaps').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          swaps = data;
          this.safeLocalStorageSet(STORAGE_KEYS.SHIFT_SWAPS, JSON.stringify(data));
        }
      } catch (e) {
        console.warn('Fallback to local shift swaps:', e);
      }
    }

    if (swaps.length === 0) {
      const local = localStorage.getItem(STORAGE_KEYS.SHIFT_SWAPS);
      if (local) {
        swaps = JSON.parse(local);
      }
    }

    const today = getPontianakDateString();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);
    const futureDate = getPontianakDateString(nextDate);

    let needSave = false;

    if (swaps.length === 0) {
      swaps = [
        {
          id: 'swap-demo-hari-h',
          requester_id: 'user-staff-4',
          target_profile_id: 'user-staff-3',
          shift_date: today,
          shift_id: 'shift-pagi',
          reason: 'Keperluan dinas pelatihan mutu akreditasi laboratorium',
          status: 'approved',
          approved_by: 'user-1791788423659',
          approved_at: new Date().toISOString(),
          whatsapp_sent: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'swap-demo-future',
          requester_id: 'user-staff-3',
          target_profile_id: 'user-1791788423659',
          shift_date: futureDate,
          shift_id: 'shift-siang',
          reason: 'Urusan keluarga mendesak di luar kota',
          status: 'approved',
          approved_by: 'user-1791788423659',
          approved_at: new Date().toISOString(),
          whatsapp_sent: true,
          created_at: new Date().toISOString(),
        },
      ];
      needSave = true;
    } else {
      const demoHariH = swaps.find((s) => s.id === 'swap-demo-hari-h');
      if (demoHariH && demoHariH.shift_date !== today) {
        demoHariH.shift_date = today;
        needSave = true;
      }
      const demoFuture = swaps.find((s) => s.id === 'swap-demo-future');
      if (demoFuture && demoFuture.shift_date !== futureDate) {
        demoFuture.shift_date = futureDate;
        needSave = true;
      }
    }

    if (needSave) {
      this.safeLocalStorageSet(STORAGE_KEYS.SHIFT_SWAPS, JSON.stringify(swaps));
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

    if (this.isSupabaseAvailable()) {
      try {
        const cleanPayload = {
          id: swap.id,
          requester_id: swap.requester_id,
          target_profile_id: swap.target_profile_id,
          shift_date: swap.shift_date,
          shift_id: swap.shift_id,
          target_date: swap.target_date || null,
          target_shift_id: swap.target_shift_id || null,
          reason: swap.reason,
          status: swap.status,
          approved_by: swap.approved_by || null,
          approved_at: swap.approved_at || null,
          whatsapp_sent: !!swap.whatsapp_sent,
        };
        const { error } = await supabase.from('shift_swaps').upsert(cleanPayload);
        if (error) {
          console.warn('Supabase upsert swap warning:', error.message);
        } else {
          this.updateStatus({ connected: true, lastSynced: new Date() });
        }
      } catch (err) {
        console.warn('Supabase upsert swap failed:', err);
      }
    }

    this.logAudit(this.getActiveUserId(), idx >= 0 ? 'UPDATE_TUKAR_SHIFT' : 'CREATE_TUKAR_SHIFT', 'shift_swaps', swap.id, {
      date: swap.shift_date,
      requester: swap.requester_id,
      target: swap.target_profile_id,
    });

    this.broadcastChange('shift_swaps', idx >= 0 ? 'UPDATE' : 'INSERT', swap);
    return swap;
  }

  public async updateShiftSwapStatus(id: string, status: ShiftSwapStatus, approverId: string): Promise<boolean> {
    const all = await this.getShiftSwaps();
    const swap = all.find((s) => s.id === id);
    if (!swap) return false;

    swap.status = status;
    swap.approved_by = approverId;
    swap.approved_at = new Date().toISOString();

    // If approved, automatically update and swap shift assignments on that date in real-time
    if (status === 'approved') {
      const assignments = await this.getAssignments({ date: swap.shift_date });
      
      const reqAssign = assignments.find(
        (a) => a.profile_id === swap.requester_id && a.shift_date === swap.shift_date && a.status !== 'cancelled'
      );
      const targetAssign = assignments.find(
        (a) => a.profile_id === swap.target_profile_id && a.shift_date === swap.shift_date && a.status !== 'cancelled'
      );

      // Save backups before modifying
      swap.prior_requester_assignment = reqAssign ? JSON.parse(JSON.stringify(reqAssign)) : null;
      swap.prior_target_assignment = targetAssign ? JSON.parse(JSON.stringify(targetAssign)) : null;

      if (reqAssign && targetAssign) {
        // Swap their shift assignments
        const tempShiftId = reqAssign.shift_id;
        reqAssign.shift_id = targetAssign.shift_id;
        targetAssign.shift_id = tempShiftId;
        reqAssign.status = 'swapped';
        targetAssign.status = 'swapped';
        reqAssign.notes = `Tukar shift disetujui dengan ${swap.target_profile?.full_name || 'Rekan'}`;
        targetAssign.notes = `Tukar shift disetujui dengan ${swap.requester?.full_name || 'Pemohon'}`;
        await this.saveAssignment(reqAssign);
        await this.saveAssignment(targetAssign);
      } else if (reqAssign) {
        // Transfer requester assignment to target profile
        reqAssign.profile_id = swap.target_profile_id;
        reqAssign.status = 'swapped';
        reqAssign.notes = `Tukar shift disetujui`;
        await this.saveAssignment(reqAssign);
      } else {
        // If requester had no assignment record, create new assignment for target on that shift & date
        const newAssign: ShiftAssignment = {
          id: `assign-swap-${Date.now()}`,
          profile_id: swap.target_profile_id,
          shift_id: swap.shift_id,
          shift_date: swap.shift_date,
          status: 'swapped',
          notes: 'Hasil pertukaran shift disetujui',
          created_by: approverId,
          created_at: new Date().toISOString(),
        };
        await this.saveAssignment(newAssign);
      }

      this.broadcastChange('shift_assignments', 'UPDATE');
      this.notifyListeners({ table: 'shift_assignments', action: 'UPDATE' });
      this.notifyListeners({ table: 'ALL', action: 'SYNC' });
    }

    await this.saveShiftSwap(swap);
    return true;
  }

  private async revertSwapAssignments(swap: ShiftSwap) {
    if (swap.status !== 'approved') return;

    if (swap.prior_requester_assignment) {
      await this.saveAssignment(swap.prior_requester_assignment);
    } else {
      const assignments = await this.getAssignments({ date: swap.shift_date });
      const createdOrMoved = assignments.find(
        (a) => a.shift_date === swap.shift_date && (a.profile_id === swap.target_profile_id || a.profile_id === swap.requester_id) && a.status === 'swapped'
      );
      if (createdOrMoved && !swap.prior_target_assignment) {
        await this.deleteAssignment(createdOrMoved.id);
      }
    }

    if (swap.prior_target_assignment) {
      await this.saveAssignment(swap.prior_target_assignment);
    }

    this.broadcastChange('shift_assignments', 'UPDATE');
    this.notifyListeners({ table: 'shift_assignments', action: 'UPDATE' });
  }

  public async cancelShiftSwap(id: string, adminId: string): Promise<boolean> {
    const all = await this.getShiftSwaps();
    const swap = all.find((s) => s.id === id);
    if (!swap) return false;

    await this.revertSwapAssignments(swap);

    swap.status = 'cancelled';
    swap.approved_by = adminId;
    await this.saveShiftSwap(swap);

    this.logAudit(adminId, 'CANCEL_TUKAR_SHIFT', 'shift_swaps', id, { status: 'cancelled' });
    this.broadcastChange('shift_swaps', 'UPDATE', swap);
    return true;
  }

  public async deleteShiftSwap(id: string): Promise<boolean> {
    const all = await this.getShiftSwaps();
    const swap = all.find((s) => s.id === id);
    if (swap) {
      await this.revertSwapAssignments(swap);
    }

    const updated = all.filter((s) => s.id !== id);
    this.safeLocalStorageSet(STORAGE_KEYS.SHIFT_SWAPS, JSON.stringify(updated));

    if (this.isSupabaseAvailable()) {
      try {
        await supabase.from('shift_swaps').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete shift swap failed:', e);
      }
    }

    this.logAudit(this.getActiveUserId(), 'DELETE_TUKAR_SHIFT', 'shift_swaps', id, {});
    this.broadcastChange('shift_swaps', 'DELETE', { id });
    return true;
  }

  /**
   * Force full bidirectional sync across all collections
   */
  public async syncAll(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupabaseAvailable()) {
      return { success: false, message: 'Koneksi Supabase belum terkonfigurasi' };
    }

    try {
      this.updateStatus({ channelStatus: 'CONNECTING' });
      await Promise.all([
        this.getProfiles(true),
        this.getShifts(true),
        this.getAssignments(undefined, true),
        this.getHandovers(undefined, true),
        this.getPendingTasks(undefined, true),
        this.getShiftSwaps(true),
      ]);

      this.updateStatus({
        connected: true,
        channelStatus: 'SUBSCRIBED',
        lastSynced: new Date(),
        error: null,
      });

      this.notifyListeners({ table: 'ALL', action: 'SYNC' });
      return { success: true, message: 'Semua data berhasil disinkronkan secara realtime dengan Supabase' };
    } catch (err: any) {
      this.updateStatus({ connected: false, error: err.message });
      return { success: false, message: err.message || 'Gagal menyinkronkan data' };
    }
  }

  // Hero Image Settings for Login Page
  public getHeroImage(): string {
    return localStorage.getItem('shift_atlm_hero_image') || 
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80';
  }

  public setHeroImage(url: string): void {
    this.safeLocalStorageSet('shift_atlm_hero_image', url);
  }

  public async uploadHeroImageToSupabase(file: File): Promise<string | null> {
    if (!supabase) return null;
    try {
      const fileName = `hero_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage
        .from('shift-atlm-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('shift-atlm-assets')
        .getPublicUrl(fileName);

      return publicUrlData?.publicUrl || null;
    } catch (e) {
      console.error('Error uploading hero image to Supabase:', e);
      return null;
    }
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
    localStorage.removeItem('shift_atlm_hero_image');
    this.initLocalData();
  }

  // --- CHAT LAB SERVICE METHODS ---
  public async getChatRooms(): Promise<ChatRoom[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .order('order_index', { ascending: true });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Fallback to local chat rooms:', e);
      }
    }

    return [
      { id: 'room-pelayanan', name: 'Pelayanan Lab & Cito', topic: 'Pelayanan', description: 'Koordinasi harian pelayanan spesimen rutin & cito', icon: 'Activity', color_code: '#0d9488', order_index: 1 },
      { id: 'room-hematologi', name: 'Hematologi', topic: 'Unit Lab', description: 'Diskusi pemeriksaan darah rutin, hemostasis, dan apusan', icon: 'Droplet', color_code: '#e11d48', order_index: 2 },
      { id: 'room-kimia', name: 'Kimia Klinik', topic: 'Unit Lab', description: 'Diskusi fotometri, elektrolit, fungsi hati & ginjal', icon: 'FlaskConical', color_code: '#2563eb', order_index: 3 },
      { id: 'room-mikro', name: 'Mikrobiologi & TB', topic: 'Unit Lab', description: 'Diskusi mikroskopis BTA, kultur, dan resistensi kuman', icon: 'Eye', color_code: '#7c3aed', order_index: 4 },
      { id: 'room-bank-darah', name: 'Bank Darah / BDRS', topic: 'Bank Darah', description: 'Koordinasi stok darah, donor, crossmatch, dan transfusi cito', icon: 'HeartPulse', color_code: '#dc2626', order_index: 5 },
      { id: 'room-alat', name: 'Alat & Maintenance', topic: 'Teknis', description: 'Laporan troubleshooting alat analiser, kalibrasi, dan maintenance', icon: 'Wrench', color_code: '#d97706', order_index: 6 },
      { id: 'room-reagen', name: 'Reagen & Logistik', topic: 'Logistik', description: 'Stok reagen menipis, expired date, dan permintaan barang farmasi', icon: 'Package', color_code: '#059669', order_index: 7 },
      { id: 'room-umum', name: 'Ruang Umum & Diskusi', topic: 'Umum', description: 'Diskusi santai, pengumuman kepegawaian, dan jadwal dinas', icon: 'MessageSquare', color_code: '#475569', order_index: 8 },
    ];
  }

  public async getChatMessages(roomId: string, limit = 30): Promise<ChatMessage[]> {
    if (!roomId) return [];
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          const profiles = await this.getProfiles();
          const messages = data.reverse().map((m: any) => ({
            ...m,
            sender: profiles.find((p) => p.id === m.sender_id),
          }));
          return messages;
        }
      } catch (e) {
        console.warn('Error fetching chat messages:', e);
      }
    }
    return [];
  }

  public async sendChatMessage(payload: {
    room_id: string;
    sender_id: string;
    content: string;
    message_type?: MessageType;
    parent_message_id?: string;
    mentions?: string[];
  }): Promise<ChatMessage | null> {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      room_id: payload.room_id,
      sender_id: payload.sender_id,
      content: payload.content,
      message_type: payload.message_type || 'text',
      parent_message_id: payload.parent_message_id,
      mentions: payload.mentions || [],
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .insert([newMessage])
          .select()
          .single();

        if (!error && data) {
          this.broadcastChange('chat_messages', 'INSERT', data);
          const profiles = await this.getProfiles();
          return {
            ...data,
            sender: profiles.find((p) => p.id === data.sender_id),
          };
        }
      } catch (e) {
        console.warn('Supabase send chat message error:', e);
      }
    }
    return newMessage;
  }

  public async addChatReaction(messageId: string, profileId: string, emoji: string): Promise<boolean> {
    if (!messageId || !profileId || !emoji) return false;
    const reaction = {
      id: `react_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      message_id: messageId,
      profile_id: profileId,
      emoji,
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseAvailable()) {
      try {
        const { error } = await supabase.from('chat_reactions').upsert([reaction], {
          onConflict: 'message_id,profile_id,emoji',
        });
        if (!error) {
          this.broadcastChange('chat_reactions', 'INSERT', reaction);
          return true;
        }
      } catch (e) {
        console.warn('Error adding chat reaction:', e);
      }
    }
    return false;
  }

  public async getAnnouncements(): Promise<Announcement[]> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const profiles = await this.getProfiles();
          return data.map((ann: any) => ({
            ...ann,
            creator: profiles.find((p) => p.id === ann.created_by),
          }));
        }
      } catch (e) {
        console.warn('Error fetching announcements:', e);
      }
    }
    return [];
  }

  public async saveAnnouncement(announcement: Partial<Announcement>): Promise<Announcement | null> {
    const payload = {
      id: announcement.id || `ann_${Date.now()}`,
      title: announcement.title || 'Pengumuman Laboratorium',
      content: announcement.content || '',
      priority: announcement.priority || 'normal',
      target_role: announcement.target_role || 'all',
      created_by: announcement.created_by || 'user-admin-1',
      requires_read: announcement.requires_read ?? true,
      created_at: announcement.created_at || new Date().toISOString(),
    };

    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .upsert([payload])
          .select()
          .single();

        if (!error && data) {
          this.broadcastChange('announcements', 'INSERT', data);
          const profiles = await this.getProfiles();
          return {
            ...data,
            creator: profiles.find((p) => p.id === data.created_by),
          };
        }
      } catch (e) {
        console.warn('Error saving announcement:', e);
      }
    }
    return payload as Announcement;
  }
}

export const dataService = new DataService();
// Run initial seed check immediately
dataService.initLocalData();

-- ==============================================================================
-- SKEMA LENGKAP DATABASE SUPABASE: SHIFT ATLM RSUD SULTAN MUHAMMAD JAMALUDIN I
-- KABUPATEN KAYONG UTARA, KALIMANTAN BARAT (ZONA WAKTU: ASIA/PONTIANAK / WIB)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES (Petugas ATLM & Admin)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    nip_str TEXT,
    role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
    position TEXT DEFAULT 'ATLM Pelaksana',
    phone TEXT,
    avatar_url TEXT,
    password TEXT DEFAULT '123',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 3. TABEL SHIFTS (Master Shift Kerja)
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    color_code TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 4. TABEL SHIFT_ASSIGNMENTS (Jadwal Kerja Petugas)
CREATE TABLE IF NOT EXISTS shift_assignments (
    id TEXT PRIMARY KEY,
    shift_id TEXT NOT NULL,
    profile_id TEXT NOT NULL,
    shift_date DATE NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'present', 'swapped', 'cancelled')) DEFAULT 'scheduled',
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    CONSTRAINT unique_staff_shift_date UNIQUE (profile_id, shift_date, shift_id)
);

-- 5. TABEL HANDOVER_CATEGORIES (Master Kategori Pemeriksaan Pasien - 17 Unit Laboratorium)
CREATE TABLE IF NOT EXISTS handover_categories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 6. TABEL HANDOVERS (Header Dokumen Serah Terima Jaga Digital)
CREATE TABLE IF NOT EXISTS handovers (
    id TEXT PRIMARY KEY,
    shift_date DATE NOT NULL,
    shift_from_id TEXT NOT NULL,
    shift_to_id TEXT NOT NULL,
    giver_profile_id TEXT NOT NULL,
    receiver_profile_id TEXT,
    status TEXT CHECK (status IN ('draft', 'pending', 'received', 'revision_needed')) DEFAULT 'draft',
    given_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    total_patients INTEGER DEFAULT 0,
    revision_notes TEXT,
    categories_data JSONB,
    lab_conditions JSONB,
    pending_tasks JSONB,
    status_logs JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 7. TABEL HANDOVER_CATEGORY_DATA (Detail 17 Kategori Pemeriksaan Pasien)
CREATE TABLE IF NOT EXISTS handover_category_data (
    id TEXT PRIMARY KEY,
    handover_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    patient_count INTEGER DEFAULT 0,
    ongoing_tests TEXT,
    pending_samples TEXT,
    unverified_results TEXT,
    issues_notes TEXT,
    work_status TEXT CHECK (work_status IN ('selesai', 'proses', 'tindak_lanjut')) DEFAULT 'selesai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 8. TABEL LAB_CONDITIONS (Kondisi Laboratorium & Alat)
CREATE TABLE IF NOT EXISTS lab_conditions (
    id TEXT PRIMARY KEY,
    handover_id TEXT,
    category TEXT CHECK (category IN ('alat', 'reagen', 'kendala_sistem', 'ruang_kerja', 'k3', 'catatan_khusus')) NOT NULL,
    item_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('baik', 'normal', 'peringatan', 'rusak', 'kritis')) NOT NULL DEFAULT 'baik',
    description TEXT NOT NULL,
    recorded_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 9. TABEL PENDING_TASKS (Pekerjaan Tertunda & Tindak Lanjut)
CREATE TABLE IF NOT EXISTS pending_tasks (
    id TEXT PRIMARY KEY,
    handover_id TEXT,
    task_type TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('rendah', 'sedang', 'tinggi_cito')) DEFAULT 'sedang',
    status TEXT CHECK (status IN ('belum_dikerjakan', 'dalam_proses', 'selesai', 'dibatalkan')) DEFAULT 'belum_dikerjakan',
    assigned_to TEXT,
    followup_notes TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 10. TABEL SHIFT_SWAPS (Permohonan & Persetujuan Tukar Shift Petugas)
CREATE TABLE IF NOT EXISTS shift_swaps (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    target_profile_id TEXT NOT NULL,
    shift_date DATE NOT NULL,
    shift_id TEXT NOT NULL,
    target_date DATE,
    target_shift_id TEXT,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 11. TABEL AUDIT_LOGS (Audit Trail Aktivitas Sistem)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id TEXT,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 12. ROW LEVEL SECURITY (RLS) - DINONAKTIFKAN UNTUK AKSES PENUH APLIKASI WEB
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE handover_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE handovers DISABLE ROW LEVEL SECURITY;
ALTER TABLE handover_category_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE shift_swaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 13. PUBLIKASI REALTIME SUPABASE
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE profiles; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE shifts; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE shift_assignments; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE handovers; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE pending_tasks; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE shift_swaps; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 14. DATA MASTER AWAL (SHIFTS & KATEGORI PEMERIKSAAN)
INSERT INTO shifts (id, name, code, start_time, end_time, color_code, description) VALUES
('shift-pagi', 'Shift Pagi', 'PAGI', '07:00:00', '14:00:00', '#0284c7', 'Shift dinas pagi reguler dan pelayanan rawat jalan/inap'),
('shift-siang', 'Shift Siang', 'SIANG', '14:00:00', '21:00:00', '#d97706', 'Shift dinas siang IGD, cito, dan rawat inap'),
('shift-malam', 'Shift Malam', 'MALAM', '21:00:00', '07:00:00', '#4f46e5', 'Shift dinas malam IGD, cito, dan bank darah'),
('shift-khusus', 'Shift Khusus / On-Call', 'KHUSUS', '08:00:00', '16:00:00', '#0d9488', 'Shift tambahan, supervisi mutu, atau MCU luar gedung')
ON CONFLICT (id) DO NOTHING;

INSERT INTO handover_categories (id, code, name, order_index) VALUES
('cat-1', 'RANAP', 'Rawat Inap', 1),
('cat-2', 'VK', 'Verloskamer', 2),
('cat-3', 'NIFAS', 'Nifas', 3),
('cat-4', 'PONEK', 'Ponek', 4),
('cat-5', 'POLI_UMUM', 'Poli Umum', 5),
('cat-6', 'IGD', 'IGD', 6),
('cat-7', 'RAJAL', 'Rawat Jalan', 7),
('cat-8', 'PERINATOLOGI', 'Perinatologi', 8),
('cat-9', 'TRANSFUSI', 'Transfusi', 9),
('cat-10', 'DONOR_LOLOS', 'Pendonor Lolos', 10),
('cat-11', 'DONOR_BESOK', 'Pendonor Lanjut Besok', 11),
('cat-12', 'DONOR_GAGAL', 'Pendonor Tidak Lolos', 12),
('cat-13', 'CROSSMATCH', 'Crossmatch', 13),
('cat-14', 'INSIDEN', 'Laporan Insiden', 14),
('cat-15', 'NILAI_KRITIS', 'Nilai Kritis', 15),
('cat-16', 'TB', 'TB', 16),
('cat-17', 'MCU', 'MCU', 17)
ON CONFLICT (id) DO NOTHING;

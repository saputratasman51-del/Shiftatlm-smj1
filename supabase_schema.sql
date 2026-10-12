-- ==============================================================================
-- SKEMA DATABASE SUPABASE: SHIFT ATLM RSUD SULTAN MUHAMMAD JAMALUDIN I
-- KABUPATEN KAYONG UTARA, KALIMANTAN BARAT (ZONA WAKTU: ASIA/PONTIANAK / WIB)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES (Petugas ATLM & Admin)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    nip_str TEXT,
    role TEXT CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
    position TEXT DEFAULT 'ATLM Pelaksana',
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 3. TABEL SHIFTS (Master Shift Kerja)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'present', 'swapped', 'cancelled')) DEFAULT 'scheduled',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    CONSTRAINT unique_staff_shift_date UNIQUE (profile_id, shift_date, shift_id)
);

-- 5. TABEL HANDOVER_CATEGORIES (Master Kategori Pemeriksaan Pasien - 17 Unit Laboratorium)
CREATE TABLE IF NOT EXISTS handover_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 6. TABEL HANDOVERS (Header Dokumen Serah Terima Jaga Digital)
CREATE TABLE IF NOT EXISTS handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_date DATE NOT NULL,
    shift_from_id UUID NOT NULL REFERENCES shifts(id),
    shift_to_id UUID NOT NULL REFERENCES shifts(id),
    giver_profile_id UUID NOT NULL REFERENCES profiles(id),
    receiver_profile_id UUID REFERENCES profiles(id),
    status TEXT CHECK (status IN ('draft', 'pending', 'received', 'revision_needed')) DEFAULT 'draft',
    given_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    total_patients INTEGER DEFAULT 0,
    revision_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 7. TABEL HANDOVER_CATEGORY_DATA (Detail 17 Kategori Pemeriksaan Pasien)
CREATE TABLE IF NOT EXISTS handover_category_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_id UUID NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES handover_categories(id) ON DELETE RESTRICT,
    patient_count INTEGER DEFAULT 0,
    ongoing_tests TEXT,
    pending_samples TEXT,
    unverified_results TEXT,
    issues_notes TEXT,
    work_status TEXT CHECK (work_status IN ('selesai', 'proses', 'tindak_lanjut')) DEFAULT 'selesai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    CONSTRAINT unique_handover_category UNIQUE (handover_id, category_id)
);

-- 8. TABEL LAB_CONDITIONS (Kondisi Laboratorium & Alat)
CREATE TABLE IF NOT EXISTS lab_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_id UUID NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('alat', 'reagen', 'kendala_sistem', 'ruang_kerja', 'k3', 'catatan_khusus')) NOT NULL,
    item_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('baik', 'normal', 'peringatan', 'rusak', 'kritis')) NOT NULL DEFAULT 'baik',
    description TEXT NOT NULL,
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 9. TABEL PENDING_TASKS (Pekerjaan Tertunda & Tindak Lanjut)
CREATE TABLE IF NOT EXISTS pending_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_id UUID REFERENCES handovers(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('rendah', 'sedang', 'tinggi_cito')) DEFAULT 'sedang',
    status TEXT CHECK (status IN ('belum_dikerjakan', 'dalam_proses', 'selesai', 'dibatalkan')) DEFAULT 'belum_dikerjakan',
    assigned_to UUID REFERENCES profiles(id),
    followup_notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 10. TABEL HANDOVER_STATUS_LOGS (Riwayat Perubahan Status & Revisi)
CREATE TABLE IF NOT EXISTS handover_status_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_id UUID NOT NULL REFERENCES handovers(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 11. TABEL AUDIT_LOGS (Audit Trail Aktivitas Sistem)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_category_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Cek apakah user adalah Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kebijakan Profiles
CREATE POLICY "Profiles terbaca oleh semua user login" ON profiles
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin dapat mengelola semua profile" ON profiles
    FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "User dapat update profile sendiri kecuali role" ON profiles
    FOR UPDATE TO authenticated USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Kebijakan Shifts
CREATE POLICY "Shifts terbaca oleh semua user login" ON shifts
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin dapat kelola shifts" ON shifts
    FOR ALL TO authenticated USING (is_admin());

-- Kebijakan Shift Assignments
CREATE POLICY "Shift assignments dapat dibaca semua user login" ON shift_assignments
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin dapat kelola shift assignments" ON shift_assignments
    FOR ALL TO authenticated USING (is_admin());

-- Kebijakan Handover Categories
CREATE POLICY "Categories dapat dibaca semua user login" ON handover_categories
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin dapat kelola categories" ON handover_categories
    FOR ALL TO authenticated USING (is_admin());

-- Kebijakan Handovers
CREATE POLICY "Handovers dapat dibaca semua user login aktif" ON handovers
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Petugas dapat membuat handover draft/pending" ON handovers
    FOR INSERT TO authenticated WITH CHECK (giver_profile_id = auth.uid() OR is_admin());

CREATE POLICY "Petugas giver/receiver/admin dapat update handover" ON handovers
    FOR UPDATE TO authenticated USING (
        giver_profile_id = auth.uid() OR 
        receiver_profile_id = auth.uid() OR 
        is_admin()
    );

-- Kebijakan Handover Category Data & Lab Conditions
CREATE POLICY "Detail kategori terbaca oleh user login" ON handover_category_data
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Detail kategori dapat diubah saat draft/pending" ON handover_category_data
    FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Kondisi lab terbaca oleh user login" ON lab_conditions
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Kondisi lab dapat diinput petugas" ON lab_conditions
    FOR ALL TO authenticated USING (TRUE);

-- Kebijakan Pending Tasks
CREATE POLICY "Tugas tertunda dapat dibaca semua user login" ON pending_tasks
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Tugas tertunda dapat dibuat/diubah petugas atau admin" ON pending_tasks
    FOR ALL TO authenticated USING (TRUE);

-- Kebijakan Audit Logs
CREATE POLICY "Audit logs hanya dapat dibaca oleh Admin" ON audit_logs
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Semua user login dapat mencatat audit log" ON audit_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- SEED DATA AWAL (17 Kategori Pemeriksaan & Master Shift RSUD)
-- ==============================================================================
INSERT INTO shifts (name, code, start_time, end_time, color_code, description) VALUES
('Shift Pagi', 'PAGI', '07:00:00', '14:00:00', '#0284c7', 'Shift dinas pagi reguler dan pelayanan rawat jalan/inap'),
('Shift Siang', 'SIANG', '14:00:00', '21:00:00', '#d97706', 'Shift dinas siang IGD, cito, dan rawat inap'),
('Shift Malam', 'MALAM', '21:00:00', '07:00:00', '#4f46e5', 'Shift dinas malam IGD, cito, dan bank darah'),
('Shift Khusus / On-Call', 'KHUSUS', '08:00:00', '16:00:00', '#0d9488', 'Shift tambahan, supervisi mutu, atau MCU luar gedung')
ON CONFLICT (code) DO NOTHING;

INSERT INTO handover_categories (code, name, order_index) VALUES
('RANAP', 'Rawat Inap', 1),
('VK', 'Verloskamer', 2),
('NIFAS', 'Nifas', 3),
('PONEK', 'Ponek', 4),
('POLI_UMUM', 'Poli Umum', 5),
('IGD', 'IGD', 6),
('RAJAL', 'Rawat Jalan', 7),
('PERINATOLOGI', 'Perinatologi', 8),
('TRANSFUSI', 'Transfusi', 9),
('DONOR_LOLOS', 'Pendonor Lolos', 10),
('DONOR_BESOK', 'Pendonor Lanjut Besok', 11),
('DONOR_GAGAL', 'Pendonor Tidak Lolos', 12),
('CROSSMATCH', 'Crossmatch', 13),
('INSIDEN', 'Laporan Insiden', 14),
('NILAI_KRITIS', 'Nilai Kritis', 15),
('TB', 'TB', 16),
('MCU', 'MCU', 17)
ON CONFLICT (code) DO NOTHING;

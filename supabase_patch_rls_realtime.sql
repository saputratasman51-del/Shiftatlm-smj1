-- ==============================================================================
-- SKRIP PERBAIKAN RLS & REALTIME SUPABASE (BERSIH & AMAN DARI ERROR POLICY)
-- SHIFT ATLM RSUD SULTAN MUHAMMAD JAMALUDIN I - KABUPATEN KAYONG UTARA
-- Jalankan skrip ini di SQL Editor Supabase:
-- https://supabase.com/dashboard/project/qvuvovbyoajvgrzvqpta/sql
-- ==============================================================================

-- LANGKAH 1: HAPUS SEMUA RLS POLICIES AGAR TIDAK MENGUNCI PERUBAHAN KOLOM
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Drop manual kebijakan umum (fail-safe)
DROP POLICY IF EXISTS "User dapat update profile sendiri kecuali role" ON profiles;
DROP POLICY IF EXISTS "Profiles terbaca oleh semua user login" ON profiles;
DROP POLICY IF EXISTS "Admin dapat mengelola semua profile" ON profiles;
DROP POLICY IF EXISTS "Shifts terbaca oleh semua user login" ON shifts;
DROP POLICY IF EXISTS "Admin dapat kelola shifts" ON shifts;
DROP POLICY IF EXISTS "Shift assignments dapat dibaca semua user login" ON shift_assignments;
DROP POLICY IF EXISTS "Admin dapat kelola shift assignments" ON shift_assignments;
DROP POLICY IF EXISTS "Categories dapat dibaca semua user login" ON handover_categories;
DROP POLICY IF EXISTS "Admin dapat kelola categories" ON handover_categories;
DROP POLICY IF EXISTS "Handovers dapat dibaca semua user login aktif" ON handovers;
DROP POLICY IF EXISTS "Petugas dapat membuat handover draft/pending" ON handovers;
DROP POLICY IF EXISTS "Petugas giver/receiver/admin dapat update handover" ON handovers;
DROP POLICY IF EXISTS "Detail kategori terbaca oleh user login" ON handover_category_data;
DROP POLICY IF EXISTS "Detail kategori dapat diubah saat draft/pending" ON handover_category_data;
DROP POLICY IF EXISTS "Kondisi lab terbaca oleh user login" ON lab_conditions;
DROP POLICY IF EXISTS "Kondisi lab dapat diinput petugas" ON lab_conditions;
DROP POLICY IF EXISTS "Tugas tertunda dapat dibaca semua user login" ON pending_tasks;
DROP POLICY IF EXISTS "Tugas tertunda dapat dibuat/diubah petugas atau admin" ON pending_tasks;
DROP POLICY IF EXISTS "Audit logs hanya dapat dibaca oleh Admin" ON audit_logs;
DROP POLICY IF EXISTS "Semua user login dapat mencatat audit log" ON audit_logs;

-- LANGKAH 2: HAPUS FOREIGN KEY CONSTRAINTS AGAR PERUBAHAN TIPE TIKAD TERHALANG
DO $$
DECLARE
    fk RECORD;
BEGIN
    FOR fk IN
        SELECT conname, conrelid::regclass::text AS tablename
        FROM pg_constraint
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', fk.tablename, fk.conname);
    END LOOP;
END $$;

-- LANGKAH 3: NONAKTIFKAN ROW LEVEL SECURITY (RLS) AGAR ANON KEY BEBAS BACA & TULIS
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS handover_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS handovers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS handover_category_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lab_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pending_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS handover_status_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- LANGKAH 4: SESUAIKAN TIPE KOLOM MENJADI TEXT (FLEKSIBEL UNTUK SEMUA ID) & TAMBAH KOLOM
ALTER TABLE IF EXISTS profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '123';

ALTER TABLE IF EXISTS shift_assignments ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS shift_assignments ALTER COLUMN shift_id TYPE TEXT;
ALTER TABLE IF EXISTS shift_assignments ALTER COLUMN profile_id TYPE TEXT;
ALTER TABLE IF EXISTS shift_assignments ALTER COLUMN created_by TYPE TEXT;

ALTER TABLE IF EXISTS shifts ALTER COLUMN id TYPE TEXT;

ALTER TABLE IF EXISTS handovers ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS handovers ALTER COLUMN shift_from_id TYPE TEXT;
ALTER TABLE IF EXISTS handovers ALTER COLUMN shift_to_id TYPE TEXT;
ALTER TABLE IF EXISTS handovers ALTER COLUMN giver_profile_id TYPE TEXT;
ALTER TABLE IF EXISTS handovers ALTER COLUMN receiver_profile_id TYPE TEXT;
ALTER TABLE IF EXISTS handovers ADD COLUMN IF NOT EXISTS categories_data JSONB;
ALTER TABLE IF EXISTS handovers ADD COLUMN IF NOT EXISTS lab_conditions JSONB;
ALTER TABLE IF EXISTS handovers ADD COLUMN IF NOT EXISTS pending_tasks JSONB;
ALTER TABLE IF EXISTS handovers ADD COLUMN IF NOT EXISTS status_logs JSONB;

ALTER TABLE IF EXISTS pending_tasks ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS pending_tasks ALTER COLUMN assigned_to TYPE TEXT;
ALTER TABLE IF EXISTS pending_tasks ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE IF EXISTS pending_tasks ALTER COLUMN handover_id TYPE TEXT;

ALTER TABLE IF EXISTS audit_logs ALTER COLUMN id TYPE TEXT;
ALTER TABLE IF EXISTS audit_logs ALTER COLUMN user_id TYPE TEXT;

-- LANGKAH 5: BUAT TABEL SHIFT_SWAPS (TUKAR SHIFT) JIKA BELUM ADA
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
ALTER TABLE IF EXISTS shift_swaps DISABLE ROW LEVEL SECURITY;

-- LANGKAH 6: AKTIFKAN REPLICA IDENTITY FULL AGAR EVENT REALTIME MENGIRIM DATA LENGKAP
ALTER TABLE IF EXISTS profiles REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS shifts REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS shift_assignments REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS handovers REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS pending_tasks REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS shift_swaps REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS audit_logs REPLICA IDENTITY FULL;

-- LANGKAH 7: DAFTARKAN SEMUA TABEL KE SUPABASE REALTIME PUBLICATION
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

-- ==============================================================================
-- SKRIP OPTIMASI PERFORMA DATABASE (POSTGRESQL INDEXES) & SCHEMA CHAT LAB
-- APLIKASI SHIFT ATLM RSUD SULTAN MUHAMMAD JAMALUDIN I - KAYONG UTARA
--
-- CARA PENGGUNAAN:
-- Buka Supabase Dashboard -> SQL Editor -> Tempelkan & Jalankan (Run) skrip ini.
-- Skrip ini bersifat NON-DESTRUKTIF (aman, tidak menghapus data apapun).
-- ==============================================================================

-- ==============================================================================
-- 1. INDEX PERFORMA UNTUK TABEL EXISTING (MENGHILANGKAN FULL TABLE SCAN)
-- ==============================================================================

-- Index untuk Jadwal Shift (shift_assignments)
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_date 
  ON shift_assignments (shift_date);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_profile_date 
  ON shift_assignments (profile_id, shift_date);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_status 
  ON shift_assignments (status);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_id 
  ON shift_assignments (shift_id);

-- Index untuk Dokumen Serah Terima Jaga (handovers)
CREATE INDEX IF NOT EXISTS idx_handovers_shift_date 
  ON handovers (shift_date);

CREATE INDEX IF NOT EXISTS idx_handovers_status 
  ON handovers (status);

CREATE INDEX IF NOT EXISTS idx_handovers_created_at_desc 
  ON handovers (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_handovers_giver_receiver 
  ON handovers (giver_profile_id, receiver_profile_id);

CREATE INDEX IF NOT EXISTS idx_handovers_shifts 
  ON handovers (shift_from_id, shift_to_id);

-- Index untuk Pekerjaan Tertunda / Pending Tasks (pending_tasks)
CREATE INDEX IF NOT EXISTS idx_pending_tasks_status 
  ON pending_tasks (status);

CREATE INDEX IF NOT EXISTS idx_pending_tasks_handover_id 
  ON pending_tasks (handover_id);

CREATE INDEX IF NOT EXISTS idx_pending_tasks_assigned_to 
  ON pending_tasks (assigned_to);

CREATE INDEX IF NOT EXISTS idx_pending_tasks_created_at_desc 
  ON pending_tasks (created_at DESC);

-- Index untuk Pertukaran Shift (shift_swaps)
CREATE INDEX IF NOT EXISTS idx_shift_swaps_status 
  ON shift_swaps (status);

CREATE INDEX IF NOT EXISTS idx_shift_swaps_shift_date 
  ON shift_swaps (shift_date);

CREATE INDEX IF NOT EXISTS idx_shift_swaps_requester 
  ON shift_swaps (requester_id);

CREATE INDEX IF NOT EXISTS idx_shift_swaps_target 
  ON shift_swaps (target_profile_id);

-- Index untuk Audit Trail (audit_logs)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc 
  ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action 
  ON audit_logs (user_id, action);


-- ==============================================================================
-- 2. FONDASI TABEL MODUL CHAT LAB TERSTRUKTUR (ROOM-BASED)
-- ==============================================================================

-- A. Tabel Ruang Diskusi / Room Lab Berdasarkan Topik
CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'MessageSquare',
    color_code TEXT DEFAULT '#0d9488',
    is_private BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- B. Tabel Anggota Room (untuk unread tracking & notifikasi per-room)
CREATE TABLE IF NOT EXISTS chat_members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    CONSTRAINT unique_room_member UNIQUE (room_id, profile_id)
);

-- C. Tabel Pesan Chat (Cursor Paginated, Dukungan Mention & Prioritas)
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'announcement', 'urgent', 'handover_ref', 'image')) DEFAULT 'text',
    parent_message_id TEXT, -- Dukungan Thread / Reply
    mentions TEXT[], -- Array profile_id yang di-mention
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- D. Tabel Reaksi Pesan (Emoji Reaction)
CREATE TABLE IF NOT EXISTS chat_reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    CONSTRAINT unique_message_profile_emoji UNIQUE (message_id, profile_id, emoji)
);

-- E. Tabel Lampiran Pesan (File / Gambar)
CREATE TABLE IF NOT EXISTS chat_attachments (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- Indexes Khusus Chat Lab (Query Responsif < 10ms)
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
  ON chat_messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender 
  ON chat_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_members_profile 
  ON chat_members (profile_id);

-- Publikasi Realtime untuk Chat Messages (Hanya broadcast room yang aktif)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Data Awal Room Chat Lab RSUD Sultan Muhammad Jamaludin I
INSERT INTO chat_rooms (id, name, topic, description, icon, color_code, order_index) VALUES
('room-pelayanan', 'Pelayanan Lab & Cito', 'Pelayanan', 'Koordinasi harian pelayanan spesimen rutin & cito', 'Activity', '#0d9488', 1),
('room-hematologi', 'Hematologi', 'Unit Lab', 'Diskusi pemeriksaan darah rutin, hemostasis, dan apusan', 'Droplet', '#e11d48', 2),
('room-kimia', 'Kimia Klinik', 'Unit Lab', 'Diskusi fotometri, elektrolit, fungsi hati & ginjal', 'FlaskConical', '#2563eb', 3),
('room-mikro', 'Mikrobiologi & TB', 'Unit Lab', 'Diskusi mikroskopis BTA, kultur, dan resistensi kuman', 'Eye', '#7c3aed', 4),
('room-bank-darah', 'Bank Darah / BDRS', 'Bank Darah', 'Koordinasi stok darah, donor, crossmatch, dan transfusi cito', 'HeartPulse', '#dc2626', 5),
('room-alat', 'Alat & Maintenance', 'Teknis', 'Laporan troubleshooting alat analiser, kalibrasi, dan maintenance', 'Wrench', '#d97706', 6),
('room-reagen', 'Reagen & Logistik', 'Logistik', 'Stok reagen menipis, expired date, dan permintaan barang farmasi', 'Package', '#059669', 7),
('room-umum', 'Ruang Umum & Diskusi', 'Umum', 'Diskusi santai, pengumuman kepegawaian, dan jadwal dinas', 'MessageSquare', '#475569', 8)
ON CONFLICT (id) DO NOTHING;

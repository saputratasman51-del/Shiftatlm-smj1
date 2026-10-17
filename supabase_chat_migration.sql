-- ==============================================================================
-- SUPABASE SQL MIGRATION SCRIPT: CHAT LAB & ANNOUNCEMENTS MODULE
-- SHIFT ATLM RSUD SULTAN MUHAMMAD JAMALUDIN I - KABUPATEN KAYONG UTARA
--
-- CARA PENGGUNAAN:
-- Buka Supabase Dashboard -> SQL Editor -> Tempelkan & Jalankan (Run) skrip ini.
-- Skrip ini bersifat NON-DESTRUKTIF (aman, menggunakan CREATE TABLE IF NOT EXISTS).
-- ==============================================================================

-- 1. TABEL CHAT_ROOMS (Ruang Diskusi Berdasarkan Topik Lab)
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

-- 2. TABEL CHAT_MEMBERS (Anggota Room untuk Tracking Unread & Notifikasi)
CREATE TABLE IF NOT EXISTS chat_members (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    CONSTRAINT unique_room_member UNIQUE (room_id, profile_id)
);

-- 3. TABEL CHAT_MESSAGES (Pesan Chat, Thread, Urgent, Important)
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('text', 'important', 'urgent', 'announcement', 'task', 'image')) DEFAULT 'text',
    parent_message_id TEXT REFERENCES chat_messages(id) ON DELETE CASCADE,
    mentions TEXT[], -- Array profile_id yang di-mention
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. TABEL CHAT_REACTIONS (Reaksi Emoji pada Pesan)
CREATE TABLE IF NOT EXISTS chat_reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW()),
    CONSTRAINT unique_message_profile_emoji UNIQUE (message_id, profile_id, emoji)
);

-- 5. TABEL CHAT_ATTACHMENTS (Lampiran Berkas & Dokumen)
CREATE TABLE IF NOT EXISTS chat_attachments (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- 6. TABEL ANNOUNCEMENTS (Pengumuman Resmi Laboratorium)
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('normal', 'important', 'urgent')) DEFAULT 'normal',
    target_role TEXT DEFAULT 'all',
    target_shift_id TEXT,
    target_unit TEXT,
    created_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    requires_read BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Asia/Pontianak', NOW())
);

-- ==============================================================================
-- 7. PERFORMANCE INDEXES (OPTIMASI QUERY)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
  ON chat_messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender 
  ON chat_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_parent 
  ON chat_messages (parent_message_id);

CREATE INDEX IF NOT EXISTS idx_chat_members_profile 
  ON chat_members (profile_id);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message 
  ON chat_reactions (message_id);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at 
  ON announcements (created_at DESC);


-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) & POLICIES AMAN
-- ==============================================================================

-- Aktifkan RLS pada seluruh tabel chat & pengumuman
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Terbuka untuk User Login (Aplikasi Web Internal RSUD)
CREATE POLICY "Semua user login dapat membaca chat_rooms" ON chat_rooms FOR SELECT USING (true);
CREATE POLICY "Admin dapat mengelola chat_rooms" ON chat_rooms FOR ALL USING (true);

CREATE POLICY "Semua user login dapat membaca chat_members" ON chat_members FOR SELECT USING (true);
CREATE POLICY "User dapat bergabung ke chat_members" ON chat_members FOR INSERT WITH CHECK (true);
CREATE POLICY "User dapat update status chat_members sendiri" ON chat_members FOR UPDATE USING (true);

CREATE POLICY "Semua user login dapat membaca chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "User dapat mengirim chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "User dapat update chat_messages sendiri" ON chat_messages FOR UPDATE USING (true);

CREATE POLICY "Semua user login dapat membaca chat_reactions" ON chat_reactions FOR SELECT USING (true);
CREATE POLICY "User dapat tambah/hapus chat_reactions" ON chat_reactions FOR ALL USING (true);

CREATE POLICY "Semua user login dapat membaca chat_attachments" ON chat_attachments FOR SELECT USING (true);
CREATE POLICY "User dapat upload chat_attachments" ON chat_attachments FOR INSERT WITH CHECK (true);

CREATE POLICY "Semua user login dapat membaca announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Admin/Petugas dapat membuat announcements" ON announcements FOR INSERT WITH CHECK (true);


-- ==============================================================================
-- 9. REALTIME PUBLICATION SETUP
-- ==============================================================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE announcements; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;


-- ==============================================================================
-- 10. INITIAL SEED DATA (RUANG DISKUSI DEFAULT)
-- ==============================================================================
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

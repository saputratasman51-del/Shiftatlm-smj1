import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Phone,
  Building,
  CheckCircle2,
  Clock,
  KeyRound,
  FileText,
  UserCheck,
  Award,
  Upload,
  Camera,
  LogOut,
  BellRing,
  Send,
  Settings,
  RefreshCw,
  CalendarDays,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, AVATAR_PRESETS } from '../services/dataService';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';
import { pushNotificationService } from '../services/pushNotificationService';

export default function Profil() {
  const { activeProfile, isAdmin, allProfiles, switchProfile, refreshProfiles, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(activeProfile.full_name);
  const [nipStr, setNipStr] = useState(activeProfile.nip_str || '');
  const [position, setPosition] = useState(activeProfile.position);
  const [phone, setPhone] = useState(activeProfile.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(activeProfile.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifPermission, setNotifPermission] = useState(pushNotificationService.getPermissionStatus());

  const handleEnableNotifications = async () => {
    const granted = await pushNotificationService.requestPermission();
    setNotifPermission(pushNotificationService.getPermissionStatus());
    if (granted) {
      showToast('Notifikasi Aktif', 'Izin notifikasi push shift berhasil diaktifkan');
      await pushNotificationService.checkAndTriggerShiftAlert(activeProfile.id);
    } else {
      showToast('Izin Ditolak', 'Aktifkan izin notifikasi pada pengaturan browser Anda', 'error');
    }
  };

  const handleTestNotification = async () => {
    await pushNotificationService.showShiftNotification(
      '⏰ Uji Peringatan Shift ATLM',
      `Halo ${activeProfile.full_name}, notifikasi push service worker berfungsi dengan baik untuk mengingatkan jadwal shift Anda.`
    );
    showToast('Notifikasi Terkirim', 'Periksa perangkat Anda untuk melihat preview peringatan shift');
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result as string);
          showToast('Foto Diunggah', 'Foto profil berhasil dimuat');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      showToast('Password Tidak Cocok', 'Konfirmasi password baru tidak sesuai', 'error');
      return;
    }
    const updated = {
      ...activeProfile,
      full_name: fullName,
      nip_str: nipStr,
      position,
      phone,
      avatar_url: avatarUrl || undefined,
      ...(newPassword ? { password: newPassword } : {}),
    };
    await dataService.saveProfile(updated);
    await refreshProfiles();
    setEditMode(false);
    setNewPassword('');
    setConfirmPassword('');
    showToast('Profil Diperbarui', 'Data akun, username, dan password berhasil disimpan');
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto">
      {/* =========================================================================
          PROFILE HEADER CARD
      ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
        <Avatar profile={activeProfile} size="xl" className="ring-4 ring-teal-400/40" />

        <div className="text-center sm:text-left min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{activeProfile.full_name}</h1>
            <span
              className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                isAdmin
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}
            >
              {isAdmin ? 'Administrator' : 'Petugas ATLM'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-1">{activeProfile.position}</p>
          <p className="text-xs text-teal-400 font-medium mt-0.5">
            RSUD Sultan Muhammad Jamaludin I Kabupaten Kayong Utara
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditMode(!editMode)}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 px-4 rounded-xl border border-slate-700 transition-colors min-h-[40px]"
          >
            {editMode ? 'Batal Ubah' : 'Ubah Data Profil'}
          </button>
          <button
            onClick={logout}
            className="bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold py-2 px-3 rounded-xl border border-rose-500 transition-colors flex items-center gap-1.5 min-h-[40px]"
            title="Keluar / Logout Aplikasi"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          PINTASAN MENU CEPAT (MUDAH DIAKSES DARI HANDPHONE)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pintasan Tukar Shift */}
        <button
          onClick={() => navigate('/tukar-shift')}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-teal-500/50 hover:shadow-md transition text-left group active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-teal-600 group-hover:rotate-180 transition-transform duration-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700">Tukar Shift Jaga</h4>
              <p className="text-xs text-slate-500 mt-0.5">Ajukan &amp; pantau pertukaran dinas antar petugas</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
        </button>

        {/* Pintasan Pengaturan Admin (Jika Admin) / Jadwal (Jika Staff) */}
        {isAdmin ? (
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-300 shadow-sm hover:border-amber-400 hover:shadow-md transition text-left group active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 border border-amber-300 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-amber-700 group-hover:rotate-90 transition-transform duration-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-amber-950 group-hover:text-amber-800">Pengaturan Admin</h4>
                  <span className="text-[9px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded uppercase">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-amber-800/80 mt-0.5">Master shift, 17 unit lab, Supabase DB &amp; audit</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 group-hover:text-amber-800" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/jadwal')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-teal-500/50 hover:shadow-md transition text-left group active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700">Jadwal Shift Anda</h4>
                <p className="text-xs text-slate-500 mt-0.5">Lihat jadwal rotasi dinas dan kalender jaga</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
          </button>
        )}
      </div>

      {/* =========================================================================
          PROFILE DETAILS FORM / VIEW
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            Informasi Personal & Ketenagaan
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">ID: {activeProfile.id}</span>
        </div>

        {editMode ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Foto Profil Selector */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <label className="block font-bold text-slate-800">Foto Profil Akun Saya</label>
              <div className="flex items-center gap-3">
                <Avatar src={avatarUrl} name={fullName} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-[11px]">Unggah atau Ganti Foto Profil</p>
                  <label className="mt-1.5 inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3 h-3 text-teal-600" />
                    <span>Pilih Foto dari HP / Komputer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preset Thumbnails */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilihan Foto Preset:
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`p-1 rounded-xl border transition-all shrink-0 ${
                        avatarUrl === preset.url
                          ? 'border-teal-500 ring-2 ring-teal-500/30 bg-teal-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-9 h-9 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="url"
                  placeholder="Atau tautan URL foto online (opsional)..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NIP / No. STR</label>
                <input
                  type="text"
                  value={nipStr}
                  onChange={(e) => setNipStr(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan / Penempatan</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password Baru (Opsional)</label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  placeholder="Ulangi password baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-colors"
              >
                Simpan Perubahan
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Nama Lengkap</p>
              <p className="font-bold text-slate-900 mt-0.5 text-sm">{activeProfile.full_name}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">NIP / Nomor STR</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">{activeProfile.nip_str || '-'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Jabatan & Penugasan</p>
              <p className="font-semibold text-slate-900 mt-0.5">{activeProfile.position}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Kontak WhatsApp</p>
              <p className="font-mono font-semibold text-teal-800 mt-0.5">{activeProfile.phone || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          HAK AKSES & OTORISASI PERAN (RBAC)
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" />
            Matriks Hak Akses & Kewenangan ({activeProfile.role.toUpperCase()})
          </h2>
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
            Row Level Security (RLS)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Melihat & Mengakses Jadwal Shift</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dapat melihat jadwal dinas diri sendiri dan seluruh petugas laboratorium.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Membuat & Mengisi Serah Terima Jaga</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mengisi 17 unit pemeriksaan laboratorium dan mencatat kendala instrumen.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Konfirmasi Penerimaan Jaga</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Memberikan persetujuan penerimaan tugas dari shift dinas sebelumnya.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-2.5">
            {isAdmin ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-slate-900">
                Kelola Master Jadwal & Petugas {isAdmin ? '(Diizinkan)' : '(Khusus Admin)'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Akses penuh menambah jadwal, mengatur kategori, dan melihat audit log.'
                  : 'Hanya administrator yang memiliki wewenang untuk mengatur master data.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PUSH NOTIFICATION SERVICE WORKER SETTINGS
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pengingat Push Notification (Service Worker)</h3>
              <p className="text-slate-500 text-[11px]">
                Dapatkan peringatan otomatis saat jadwal shift dinas Anda akan dimulai meskipun aplikasi diminimalkan.
              </p>
            </div>
          </div>
          <span
            className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
              notifPermission === 'granted'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : notifPermission === 'denied'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {notifPermission === 'granted' ? 'Aktif' : notifPermission === 'denied' ? 'Ditolak' : 'Belum Aktif'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {notifPermission !== 'granted' ? (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <BellRing className="w-4 h-4" />
              <span>Aktifkan Notifikasi Push Shift</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTestNotification}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Uji Kirim Notifikasi Shift Sekarang</span>
            </button>
          )}
          <p className="text-[11px] text-slate-400">
            {notifPermission === 'granted'
              ? 'Pemberitahuan push aktif di perangkat ini.'
              : 'Klik untuk mengizinkan browser mengirimkan alarm shift.'}
          </p>
        </div>
      </div>

      {/* =========================================================================
          PENGALIHAN CEPAT PERAN / SIMULASI PENGUJIAN
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-teal-600" />
          Uji Peran & Simulasi Akun Petugas
        </h3>
        <p className="text-slate-500">
          Pilih salah satu akun di bawah untuk menguji tampilan aplikasi sebagai Administrator atau Petugas ATLM:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
          {allProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => switchProfile(p.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                p.id === activeProfile.id
                  ? 'border-teal-500 bg-teal-50/30 ring-1 ring-teal-500 font-bold'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-100/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Avatar profile={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">{p.full_name}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                        p.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {p.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{p.position}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

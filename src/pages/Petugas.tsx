import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  X,
  UserCheck,
  Building,
  Camera,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, AVATAR_PRESETS } from '../services/dataService';
import { UserProfile } from '../types';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';
import { compressImage } from '../utils/compressImage';

export default function Petugas() {
  const { activeProfile, isAdmin, switchProfile, refreshProfiles } = useAuth();
  const { showToast } = useToast();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal create / edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    nip_str: '',
    role: 'staff' as 'admin' | 'staff',
    position: 'ATLM Pelaksana',
    phone: '',
    avatar_url: '',
    is_active: true,
  });

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const data = await dataService.getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error('Error loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();

    // Subscribe to realtime updates for registered staff
    const unsubscribe = dataService.subscribe((event) => {
      if (event.table === 'profiles' || event.table === 'ALL') {
        loadProfiles();
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredProfiles = profiles.filter((p) => {
    const matchSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nip_str && p.nip_str.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active);
    return matchSearch && matchStatus;
  });

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormData({
      full_name: '',
      nip_str: '',
      role: 'staff',
      position: 'ATLM Pelaksana',
      phone: '',
      avatar_url: AVATAR_PRESETS[0].url,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: UserProfile) => {
    setEditingProfile(p);
    setFormData({
      full_name: p.full_name,
      nip_str: p.nip_str || '',
      role: p.role,
      position: p.position,
      phone: p.phone || '',
      avatar_url: p.avatar_url || '',
      is_active: p.is_active,
    });
    setModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 160, 160, 0.75);
        if (compressed) {
          setFormData((prev) => ({ ...prev, avatar_url: compressed }));
          showToast('Foto Diunggah', 'Foto profil berhasil dimuat dan dioptimalkan');
        }
      } catch (err) {
        console.error('Error optimizing image:', err);
        showToast('Gagal Mengunggah', 'Tidak dapat memproses gambar');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) return;

    const payload: UserProfile = {
      id: editingProfile ? editingProfile.id : `user-${Date.now()}`,
      full_name: formData.full_name,
      nip_str: formData.nip_str,
      role: formData.role,
      position: formData.position,
      phone: formData.phone,
      avatar_url: formData.avatar_url || undefined,
      is_active: formData.is_active,
      created_at: editingProfile?.created_at || new Date().toISOString(),
    };

    await dataService.saveProfile(payload);
    await refreshProfiles();
    showToast(
      editingProfile ? 'Data Diperbarui' : 'Petugas Ditambahkan',
      `Profil ${payload.full_name} berhasil disimpan`
    );
    setModalOpen(false);
    loadProfiles();
  };

  const handleToggleStatus = async (p: UserProfile) => {
    const updated: UserProfile = { ...p, is_active: !p.is_active };
    await dataService.saveProfile(updated);
    await refreshProfiles();
    showToast('Status Diubah', `Status ${p.full_name} kini ${updated.is_active ? 'Aktif' : 'Nonaktif'}`);
    loadProfiles();
  };

  const handleDeleteProfile = async (p: UserProfile) => {
    if (p.id === activeProfile.id) {
      showToast('Gagal Menghapus', 'Anda tidak dapat menghapus akun yang sedang Anda gunakan saat ini.');
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus data petugas ${p.full_name}?`)) {
      await dataService.deleteProfile(p.id);
      await refreshProfiles();
      showToast('Petugas Dihapus', `Data petugas ${p.full_name} berhasil dihapus`);
      loadProfiles();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* =========================================================================
          HEADER
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Data Petugas Laboratorium (ATLM)
            </h1>
            <span className="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              {profiles.length} Petugas Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar tenaga Ahli Teknologi Laboratorium Medik RSUD Sultan Muhammad Jamaludin I
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all self-start md:self-auto min-h-[44px]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Petugas Baru</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          SEARCH & FILTER BAR
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama petugas, NIP, STR, atau jabatan..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
          >
            <option value="all">Semua Status ({profiles.length})</option>
            <option value="active">Hanya Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          STAFF LIST (Mobile cards & Desktop grid)
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredProfiles.map((p) => {
          const isCurrentUser = p.id === activeProfile.id;
          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-4 border transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrentUser
                  ? 'border-teal-500 ring-1 ring-teal-500/30 shadow-md'
                  : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* Active user badge */}
              {isCurrentUser && (
                <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">
                  Akun Anda
                </div>
              )}

              <div>
                <div className="flex items-start gap-3">
                  <Avatar profile={p} size="lg" showStatus />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{p.full_name}</h3>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          p.role === 'admin'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {p.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.position}</p>
                    {p.nip_str && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIP/STR: {p.nip_str}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  {p.phone && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3" /> WhatsApp:
                      </span>
                      <a
                        href={`https://wa.me/${p.phone.replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-teal-700 hover:underline font-semibold"
                      >
                        {p.phone}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Status Akun:</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{p.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => switchProfile(p.id)}
                  className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors flex items-center gap-1 ${
                    isCurrentUser
                      ? 'bg-teal-50 text-teal-700 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isCurrentUser ? 'Sedang Digunakan' : 'Ganti ke Akun Ini'}</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Ubah Data"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        p.is_active
                          ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {p.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus Petugas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          MODAL: TAMBAH / UBAH PETUGAS
      ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                {editingProfile ? 'Ubah Data Petugas ATLM' : 'Tambah Petugas ATLM Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              {/* Foto Profil Selector */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2.5">
                <label className="block font-bold text-slate-800">Foto Profil Petugas</label>
                <div className="flex items-center gap-3">
                  <Avatar src={formData.avatar_url} name={formData.full_name || 'Preview'} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-[11px]">Unggah atau Pilih Foto</p>
                    <p className="text-[10px] text-slate-500">Pilih dari pustaka foto ATLM atau unggah dari perangkat.</p>
                    <label className="mt-1.5 inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3 h-3 text-teal-600" />
                      <span>Unggah Foto dari HP/Laptop</span>
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
                    Pilihan Foto Profil Siap Pakai:
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setFormData({ ...formData, avatar_url: preset.url })}
                        className={`p-1 rounded-xl border transition-all shrink-0 ${
                          formData.avatar_url === preset.url
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
                    placeholder="Atau tempel URL gambar eksternal (opsional)..."
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Siti Rahmawati, A.Md.AK"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Pegawai / NIP / STR</label>
                <input
                  type="text"
                  placeholder="Misal: 19941120 202001 1 006"
                  value={formData.nip_str}
                  onChange={(e) => setFormData({ ...formData, nip_str: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hak Akses (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
                  >
                    <option value="staff">Petugas ATLM</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Keaktifan</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan / Unit</label>
                <input
                  type="text"
                  placeholder="Misal: ATLM Pelaksana / Bank Darah"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="Misal: 081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Simpan Petugas
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

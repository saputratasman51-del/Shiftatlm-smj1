import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Layers,
  Clock,
  Database,
  History,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  X,
  Code2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Shift, HandoverCategory, AuditLog } from '../types';
import { useToast } from '../components/Toast';
import { supabase } from '../lib/supabase';
import { SUPABASE_PATCH_SQL } from '../lib/supabaseSqlScripts';

export default function AdminSettings() {
  const { isAdmin, activeProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'shifts' | 'categories' | 'database' | 'audit'>('shifts');

  // Master Shifts
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Master Categories
  const [categories, setCategories] = useState<HandoverCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<HandoverCategory | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Supabase status
  const supabaseConnected = !!supabase;

  const loadData = async () => {
    try {
      const [allShifts, allCats, allLogs] = await Promise.all([
        dataService.getShifts(),
        dataService.getCategories(),
        dataService.getAuditLogs(),
      ]);
      setShifts(allShifts);
      setCategories(allCats);
      setAuditLogs(allLogs);
    } catch (e) {
      console.error('Error loading admin settings:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-md mx-auto my-12 animate-fade-in">
        <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Akses Terbatas: Administrator Only</h2>
        <p className="text-xs text-slate-500 mt-1">
          Halaman Pengaturan Admin hanya dapat diakses oleh Administrator Laboratorium RSUD Sultan Muhammad Jamaludin I.
        </p>
      </div>
    );
  }

  // Save Shift
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    await dataService.saveShift(editingShift);
    showToast('Shift Diperbarui', `Shift ${editingShift.name} berhasil disimpan`);
    setEditingShift(null);
    loadData();
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatCode) return;
    const newCat: HandoverCategory = {
      id: `cat-${Date.now()}`,
      code: newCatCode.toUpperCase().replace(/\s+/g, '_'),
      name: newCatName,
      order_index: categories.length + 1,
      is_active: true,
    };
    await dataService.saveCategory(newCat);
    showToast('Kategori Ditambahkan', `Unit ${newCat.name} berhasil ditambahkan`);
    setNewCatName('');
    setNewCatCode('');
    loadData();
  };

  // Copy SQL script
  const handleCopySQL = () => {
    try {
      navigator.clipboard.writeText(SUPABASE_PATCH_SQL);
      showToast('Skrip SQL Disalin', 'Skrip perbaikan RLS & Realtime Supabase berhasil disalin ke clipboard');
    } catch {
      showToast('Info', 'Buka file /supabase_patch_rls_realtime.sql di direktori proyek', 'info');
    }
  };

  // Reset to seed
  const handleResetData = () => {
    if (window.confirm('Reset seluruh data lokal ke konfigurasi awal RSUD SMJ I?')) {
      dataService.resetToDefaultSeed();
      showToast('Data Direset', 'Data berhasil dikembalikan ke pengaturan awal');
      loadData();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* =========================================================================
          HEADER & TABS
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Pengaturan & Konfigurasi Administrator
            </h1>
            <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen master shift, 17 unit pemeriksaan, status Supabase, dan audit log
          </p>
        </div>

        {/* Tab navigation */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'shifts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Master Shift
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unit Pemeriksaan
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'database' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supabase DB
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MASTER SHIFTS
      ========================================================================= */}
      {activeTab === 'shifts' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Master Jam Dinas & Shift Kerja
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi jam mulai, jam selesai, dan penanda warna setiap shift dinas laboratorium
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: s.color_code }} />
                      <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500">({s.code})</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      Aktif
                    </span>
                  </div>

                  <p className="font-mono text-slate-700 font-bold mt-2">
                    {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)} WIB
                  </p>
                  <p className="text-slate-500 mt-1 text-[11px]">{s.description || 'Pelayanan rutin laboratorium'}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex justify-end">
                  <button
                    onClick={() => setEditingShift(s)}
                    className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Konfigurasi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MASTER UNIT / KATEGORI PEMERIKSAAN
      ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Master Kategori Pemeriksaan Pasien ({categories.length} Unit)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kategori formulir serah terima jaga yang dapat dikembangkan oleh administrator
              </p>
            </div>
          </div>

          {/* Add new category form */}
          <form
            onSubmit={handleAddCategory}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs"
          >
            <input
              type="text"
              required
              placeholder="Kode Unit (misal: PA, MIKROBIOLOGI)"
              value={newCatCode}
              onChange={(e) => setNewCatCode(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono uppercase"
            />
            <input
              type="text"
              required
              placeholder="Nama Kategori (misal: Patologi Anatomi)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Unit Baru</span>
            </button>
          </form>

          {/* Category list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {categories.map((c, idx) => (
              <div
                key={c.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{c.code}</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SUPABASE INTEGRATION & DATABASE
      ========================================================================= */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                Integrasi Database Supabase & Sinkronisasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pusat kontrol penyimpanan data PostgreSQL, autentikasi, dan Row Level Security (RLS)
              </p>
            </div>

            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                supabaseConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {supabaseConnected ? 'Supabase Terkoneksi' : 'Mode Offline / Local Storage Aktif'}
            </span>
          </div>

          {/* Connection summary */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">Status Konfigurasi Environment:</h3>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-600">VITE_SUPABASE_URL</span>
                <span className="font-bold text-slate-900">
                  {import.meta.env.VITE_SUPABASE_URL ? 'TERPASANG (OK)' : 'Belum diisi (Menggunakan Fallback)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-600">VITE_SUPABASE_ANON_KEY</span>
                <span className="font-bold text-slate-900">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'TERPASANG (OK)' : 'Belum diisi (Menggunakan Fallback)'}
                </span>
              </div>
            </div>

            <p className="text-slate-600 text-[11px]">
              Aplikasi ini dilengkapi <strong>Zero-Downtime Fallback</strong>: jika URL dan Anon Key belum dikonfigurasi di AI Studio secrets, seluruh sistem tetap 100% berfungsi normal dengan penyimpanan lokal yang aman dan dapat diekspor.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCopySQL}
              className="p-3.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100/70 text-teal-800 font-bold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-teal-700" />
                <div className="text-left">
                  <p className="text-xs font-bold">Salin Skrip SQL Migrasi</p>
                  <p className="text-[10px] text-teal-600 font-normal">Termasuk 10 tabel & Kebijakan RLS</p>
                </div>
              </div>
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetData}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="text-xs font-bold">Reset Data Simulasi RSUD</p>
                  <p className="text-[10px] text-slate-500 font-normal">Kembalikan ke data awal bawaan</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AUDIT LOGS
      ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Audit Trail & Log Aktivitas Sistem
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekaman seluruh pembuatan jadwal, pengiriman serah terima, dan revisi
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{auditLogs.length} Entri</span>
          </div>

          <div className="space-y-2 text-xs">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 font-mono text-[11px] uppercase bg-slate-200 px-1.5 py-0.5 rounded mr-1.5">
                        {log.action}
                      </span>
                      <span className="text-slate-700 font-semibold">{log.target_table}</span>
                      {log.changes?.note && (
                        <p className="text-slate-500 text-[11px] mt-0.5">{log.changes.note}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {log.created_at?.slice(0, 19).replace('T', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas yang tercatat.</p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT SHIFT
      ========================================================================= */}
      {editingShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-scale-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Ubah Master Shift</h3>
              <button onClick={() => setEditingShift(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="mt-3 space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Shift</label>
                <input
                  type="text"
                  required
                  value={editingShift.name}
                  onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={editingShift.start_time.slice(0, 5)}
                    onChange={(e) =>
                      setEditingShift({ ...editingShift, start_time: `${e.target.value}:00` })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={editingShift.end_time.slice(0, 5)}
                    onChange={(e) =>
                      setEditingShift({ ...editingShift, end_time: `${e.target.value}:00` })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Warna Penanda</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingShift.color_code}
                    onChange={(e) => setEditingShift({ ...editingShift, color_code: e.target.value })}
                    className="w-10 h-9 p-0.5 border border-slate-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingShift.color_code}
                    onChange={(e) => setEditingShift({ ...editingShift, color_code: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan Shift</label>
                <input
                  type="text"
                  value={editingShift.description || ''}
                  onChange={(e) => setEditingShift({ ...editingShift, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingShift(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
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

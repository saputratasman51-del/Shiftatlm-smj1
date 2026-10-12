/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Send,
  ShieldAlert,
  X,
  Phone,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakDateString } from '../services/dataService';
import { ShiftSwap, UserProfile, Shift } from '../types';
import { useToast } from '../components/Toast';

export default function TukarShift() {
  const { activeProfile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    shift_date: getPontianakDateString(),
    shift_id: '',
    target_profile_id: '',
    reason: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSwaps, allProfiles, allShifts] = await Promise.all([
        dataService.getShiftSwaps(),
        dataService.getProfiles(),
        dataService.getShifts(),
      ]);
      setSwaps(allSwaps);
      setProfiles(allProfiles);
      setShifts(allShifts);
      if (allShifts.length > 0 && !formData.shift_id) {
        setFormData((prev) => ({ ...prev, shift_id: allShifts[0].id }));
      }
      const otherProfiles = allProfiles.filter((p) => p.id !== activeProfile.id);
      if (otherProfiles.length > 0 && !formData.target_profile_id) {
        setFormData((prev) => ({ ...prev, target_profile_id: otherProfiles[0].id }));
      }
    } catch (err) {
      console.error('Error loading shift swaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates for shift swaps and schedules
    const unsubscribe = dataService.subscribe((event) => {
      if (
        event.table === 'shift_swaps' ||
        event.table === 'shift_assignments' ||
        event.table === 'profiles' ||
        event.table === 'ALL'
      ) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [activeProfile]);

  const handleOpenModal = () => {
    const otherProfiles = profiles.filter((p) => p.id !== activeProfile.id);
    setFormData({
      shift_date: getPontianakDateString(),
      shift_id: shifts[0]?.id || '',
      target_profile_id: otherProfiles[0]?.id || '',
      reason: '',
    });
    setModalOpen(true);
  };

  const handleCreateSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.target_profile_id || !formData.shift_id) {
      showToast('Data Belum Lengkap', 'Pilih rekan pengganti dan jenis shift', 'error');
      return;
    }

    const newSwap: ShiftSwap = {
      id: `swap-${Date.now()}`,
      requester_id: activeProfile.id,
      target_profile_id: formData.target_profile_id,
      shift_date: formData.shift_date,
      shift_id: formData.shift_id,
      reason: formData.reason,
      status: 'pending',
      whatsapp_sent: false,
      created_at: new Date().toISOString(),
    };

    await dataService.saveShiftSwap(newSwap);
    showToast('Pengajuan Terkirim', 'Pengajuan tukar shift berhasil dibuat.');
    setModalOpen(false);
    loadData();
  };

  const handleApprove = async (id: string) => {
    await dataService.updateShiftSwapStatus(id, 'approved', activeProfile.id);
    showToast('Disetujui', 'Pengajuan tukar shift disetujui dan jadwal otomatis diperbarui!');
    loadData();
  };

  const handleReject = async (id: string) => {
    await dataService.updateShiftSwapStatus(id, 'rejected', activeProfile.id);
    showToast('Ditolak', 'Pengajuan tukar shift ditolak', 'error');
    loadData();
  };

  const handleSendWhatsApp = (swap: ShiftSwap) => {
    const targetPhone = swap.target_profile?.phone || '081234567890';
    // Format phone for WhatsApp (+62)
    let formattedPhone = targetPhone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    const shiftName = swap.shift?.name || 'Shift Jaga';
    const requesterName = swap.requester?.full_name || activeProfile.full_name;
    const targetName = swap.target_profile?.full_name || 'Rekan ATLM';

    const message = `Halo Rekan *${targetName}*,\n\nSaya *${requesterName}* ingin mengajukan permohonan *Tukar Shift Jaga Laboratorium*:\n\n📅 Tanggal: ${swap.shift_date}\n⏰ Shift: ${shiftName}\n📝 Alasan: ${swap.reason || 'Keperluan mendesak'}\n\nMohon konfirmasi kesediaannya. Terima kasih banyak! (via SHIFT ATLM RSUD Sultan Muhammad Jamaludin I)`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${formattedPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');

    // Mark whatsapp_sent true
    swap.whatsapp_sent = true;
    dataService.saveShiftSwap(swap);
    showToast('WhatsApp Dibuka', 'Pesan konfirmasi tukar shift telah disiapkan untuk WhatsApp.');
    loadData();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Tukar Shift &amp; Integrasi WhatsApp</h1>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajukan pertukaran jadwal jaga antar petugas ATLM dengan konfirmasi langsung via WhatsApp dan pembaruan riwayat shift otomatis.
          </p>

          {/* Quick jump for mobile */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 md:hidden">
            <button
              onClick={() => navigate('/profil')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Profil Saya</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition active:scale-95"
              >
                <Settings className="w-3.5 h-3.5 text-amber-600" />
                <span>Pengaturan Admin</span>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all min-h-[42px] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Tukar Shift</span>
        </button>
      </div>

      {/* List of Swaps */}
      <div className="space-y-3">
        {swaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {swaps.map((s) => {
              const isMyRequest = s.requester_id === activeProfile.id;
              const isTargetMe = s.target_profile_id === activeProfile.id;

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-2xs space-y-3 relative overflow-hidden ${
                    s.status === 'approved'
                      ? 'border-emerald-300 bg-emerald-50/10'
                      : s.status === 'rejected'
                      ? 'border-rose-200 bg-rose-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: s.shift?.color_code || '#0284c7' }}
                      />
                      <span className="font-bold text-sm text-slate-900">{s.shift?.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {s.shift_date}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        s.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : s.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {s.status === 'approved'
                        ? 'Disetujui (Riwayat Shift Diperbarui)'
                        : s.status === 'rejected'
                        ? 'Ditolak'
                        : 'Menunggu Konfirmasi'}
                    </span>
                  </div>

                  {/* Requester & Target */}
                  <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Pemohon:</p>
                      <p className="font-bold text-slate-800 truncate">{s.requester?.full_name}</p>
                      <p className="text-[10px] text-slate-500">{s.requester?.position}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Diminta Kepada:</p>
                      <p className="font-bold text-slate-800 truncate">{s.target_profile?.full_name}</p>
                      <p className="text-[10px] text-slate-500">{s.target_profile?.position}</p>
                    </div>
                  </div>

                  {s.reason && (
                    <div className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50">
                      <span className="font-semibold text-amber-800">Alasan: </span>
                      {s.reason}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleSendWhatsApp(s)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl transition-colors shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{s.whatsapp_sent ? 'Kirim Ulang WA' : 'Hubungi via WhatsApp'}</span>
                    </button>

                    {(isAdmin || isTargetMe) && s.status === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(s.id)}
                          className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-xl transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => handleReject(s.id)}
                          className="flex items-center gap-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-2 px-3 rounded-xl transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-spin-slow" />
            <p className="text-sm font-semibold text-slate-700">Belum Ada Riwayat Tukar Shift</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik tombol "Ajukan Tukar Shift" di atas untuk mengajukan pertukaran jadwal dengan rekan ATLM.
            </p>
          </div>
        )}
      </div>

      {/* Modal Ajukan Tukar Shift */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-teal-600" />
                Ajukan Tukar Shift Petugas
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSwap} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Shift Yang Ditukar</label>
                <input
                  type="date"
                  required
                  value={formData.shift_date}
                  onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Shift Asli</label>
                <select
                  required
                  value={formData.shift_id}
                  onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)} WIB)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Rekan Pengganti (Target)</label>
                <select
                  required
                  value={formData.target_profile_id}
                  onChange={(e) => setFormData({ ...formData, target_profile_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {profiles
                    .filter((p) => p.id !== activeProfile.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.position})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alasan Pertukaran Shift</label>
                <textarea
                  rows={3}
                  placeholder="Misal: Keperluan keluarga mendadak / Acara penting"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Pengajuan</span>
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

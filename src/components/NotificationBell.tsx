/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Volume2,
  MessageSquare,
  Calendar,
  Flame,
  X,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakDateString } from '../services/dataService';
import { ShiftSwap } from '../types';
import { playAlarmSound } from '../utils/alarmSound';

export function NotificationBell() {
  const { activeProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'reminders' | 'approved' | 'pending'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todayStr = getPontianakDateString();

  const fetchSwaps = async () => {
    try {
      const all = await dataService.getShiftSwaps();
      setSwaps(all);
    } catch (e) {
      console.warn('Failed to fetch notification swaps:', e);
    }
  };

  useEffect(() => {
    fetchSwaps();
    // Poll every 10s for live notification updates & subscribe
    const interval = setInterval(fetchSwaps, 10000);
    const unsubscribe = dataService.subscribe((event) => {
      if (event.table === 'shift_swaps' || event.table === 'ALL') {
        fetchSwaps();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeProfile]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Pending swaps requiring action
  const pendingSwaps = swaps.filter((s) => {
    if (s.status !== 'pending') return false;
    if (isAdmin) return true;
    return s.target_profile_id === activeProfile?.id || s.requester_id === activeProfile?.id;
  });

  // 2. Active Reminders until Hari H (ALL staff get this notification!)
  const upcomingReminders = swaps.filter((s) => {
    if (s.status !== 'approved') return false;
    return s.shift_date >= todayStr;
  }).sort((a, b) => a.shift_date.localeCompare(b.shift_date));

  // 3. Approved swaps broadcast to all staff
  const approvedBroadcasts = swaps.filter((s) => s.status === 'approved');

  // Check if today has Hari H pertukaran
  const hasHariHToday = upcomingReminders.some((s) => s.shift_date === todayStr);

  // Total notification count
  const count = pendingSwaps.length + upcomingReminders.length;

  const getDaysDiff = (dateStr: string) => {
    const today = new Date(todayStr);
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handlePlayReminderSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAlarmSound('swap_reminder');
  };

  const handleShareWhatsApp = (swap: ShiftSwap, e: React.MouseEvent) => {
    e.stopPropagation();
    const reqName = swap.requester?.full_name || 'Petugas ATLM';
    const targetName = swap.target_profile?.full_name || 'Rekan ATLM';
    const shiftName = swap.shift?.name || 'Shift Jaga';
    const shiftTime = swap.shift ? `${swap.shift.start_time.slice(0, 5)} - ${swap.shift.end_time.slice(0, 5)} WIB` : '';

    const diffDays = getDaysDiff(swap.shift_date);
    const countdown = diffDays === 0 ? 'HARI H (HARI INI)' : diffDays === 1 ? 'H-1 (BESOK)' : `H-${diffDays} (${diffDays} hari lagi)`;

    const text = `📢 *PENGINGAT RESMI PERTUKARAN SHIFT ATLM*\n` +
      `RSUD Sultan Muhammad Jamaludin I\n\n` +
      `Status: *${countdown}*\n` +
      `📅 Tanggal: *${swap.shift_date}*\n` +
      `⏰ Shift: *${shiftName}* (${shiftTime})\n` +
      `🔄 *${targetName}* bertugas menggantikan *${reqName}*\n` +
      `📝 Keterangan: ${swap.reason || 'Telah disetujui resmi'}\n\n` +
      `Harap seluruh rekan ATLM mencatat jadwal ini. Terima kasih!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all border flex items-center justify-center shadow-xs ${
          hasHariHToday
            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30 ring-1 ring-amber-400/50'
            : count > 0
            ? 'bg-slate-800/90 hover:bg-slate-700 text-teal-300 border-teal-500/40'
            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
        }`}
        title="Notifikasi & Pengingat Tukar Shift"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span
            className={`absolute -top-1 -right-1 text-white text-[10px] font-bold px-1.5 h-4 min-w-4 rounded-full flex items-center justify-center shadow-md pointer-events-none ${
              hasHariHToday ? 'bg-gradient-to-r from-amber-500 to-rose-600 animate-pulse' : 'bg-rose-500'
            }`}
          >
            {hasHariHToday ? '🔥' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay for all devices to prevent clipping and dismiss easily */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered and compact notification popover for mobile, tablet, and PC */}
          <div className="fixed inset-x-4 top-16 max-h-[80vh] max-w-sm mx-auto sm:absolute sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-full sm:mt-2.5 sm:w-[400px] sm:max-h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-scale-up text-slate-800 flex flex-col">
            {/* Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <h4 className="font-bold text-sm text-white">
                        Notifikasi Tukar Shift
                      </h4>
                      {hasHariHToday && (
                        <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Hari H Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-tight">
                      Pemberitahuan disetujui &amp; pengingat pertukaran shift
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handlePlayReminderSound}
                    title="Uji nada lonceng pengingat"
                    className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-xs flex items-center gap-1 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs font-semibold">Uji Nada</span>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    title="Tutup Notifikasi"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80 text-xs font-semibold overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === 'all'
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Semua ({upcomingReminders.length + pendingSwaps.length})
                </button>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                    activeTab === 'reminders'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Hari H ({upcomingReminders.length})</span>
                  {hasHariHToday && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === 'approved'
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Disetujui ({approvedBroadcasts.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Pending ({pendingSwaps.length})
                </button>
              </div>
            </div>

            {/* List Content with proportional text */}
            <div className="overflow-y-auto divide-y divide-slate-100 flex-1 p-2 sm:p-2.5 space-y-2.5">
              {/* 1. UPCOMING REMINDERS UNTIL HARI H (FOR ALL STAFF) */}
              {(activeTab === 'all' || activeTab === 'reminders') && upcomingReminders.length > 0 && (
                <div className="space-y-2">
                  <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-50 rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Pengingat Pertukaran Sampai Hari H
                    </span>
                    <span className="text-xs bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-mono font-semibold">
                      {upcomingReminders.length} Jadwal
                    </span>
                  </div>

                  {upcomingReminders.map((s) => {
                    const diffDays = getDaysDiff(s.shift_date);
                    const isHariH = diffDays === 0;
                    const isHMinus1 = diffDays === 1;

                    return (
                      <div
                        key={`remind-${s.id}`}
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all text-xs space-y-2.5 ${
                          isHariH
                            ? 'bg-gradient-to-r from-amber-50 via-rose-50/50 to-amber-50/30 border-amber-300 ring-1 ring-amber-400/50'
                            : isHMinus1
                            ? 'bg-teal-50/60 border-teal-200'
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        {/* Countdown Badge & Date Header */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs ${
                              isHariH
                                ? 'bg-rose-600 text-white animate-pulse'
                                : isHMinus1
                                ? 'bg-teal-700 text-white'
                                : 'bg-slate-800 text-white'
                            }`}
                          >
                            {isHariH
                              ? '🔥 HARI H (HARI INI)!'
                              : isHMinus1
                              ? '⏰ H-1 (BESOK)'
                              : `📅 H-${diffDays} (${diffDays} HARI LAGI)`}
                          </span>

                          <span className="font-mono font-bold text-xs text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {s.shift_date}
                          </span>
                        </div>

                        {/* Proportional description: Who replaces whom and shift details */}
                        <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/70 space-y-1.5">
                          <div className="text-[11px] sm:text-xs text-slate-800 leading-relaxed break-words">
                            <span className="font-bold text-teal-900 bg-teal-100/80 px-1.5 py-0.5 rounded border border-teal-200">
                              {s.target_profile?.full_name || 'Rekan ATLM'}
                            </span>{' '}
                            <span className="font-medium text-slate-600">menggantikan dinas</span>{' '}
                            <span className="font-bold text-slate-900 bg-slate-200/80 px-1.5 py-0.5 rounded border border-slate-300">
                              {s.requester?.full_name || 'Petugas'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                            <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-900">
                              ⏰ {s.shift?.name || 'Shift Jaga'} ({s.shift?.start_time.slice(0, 5)} - {s.shift?.end_time.slice(0, 5)} WIB)
                            </span>
                          </div>
                        </div>

                        {s.reason && (
                          <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200/60 break-words leading-relaxed">
                            &ldquo;{s.reason}&rdquo;
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                          <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Disetujui resmi
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleShareWhatsApp(s, e)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95"
                              title="Bagikan pengingat ke WhatsApp rekan / grup"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Kirim WA</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/jadwal');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs active:scale-95"
                            >
                              Lihat Jadwal
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. BROADCAST NOTIFICATIONS FOR ALL APPROVED SWAPS */}
              {(activeTab === 'all' || activeTab === 'approved') && (
                <div className="space-y-2">
                  <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Pemberitahuan Tukar Shift Disetujui
                    </span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono font-semibold">
                      {approvedBroadcasts.length}
                    </span>
                  </div>

                  {approvedBroadcasts.length > 0 ? (
                    approvedBroadcasts.slice(0, 10).map((s) => (
                      <div
                        key={`appr-${s.id}`}
                        className="p-3 bg-white hover:bg-slate-50/90 rounded-xl border border-slate-200 transition-colors space-y-2 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {s.shift?.name || 'Shift Laboratorium'}
                          </span>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Disetujui
                          </span>
                        </div>

                        <div className="text-[11px] sm:text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100 break-words">
                          <p>
                            <strong className="text-teal-900 font-semibold">{s.target_profile?.full_name || 'Rekan ATLM'}</strong>{' '}
                            resmi bertukar dengan{' '}
                            <strong className="text-slate-900 font-semibold">{s.requester?.full_name || 'Petugas'}</strong>{' '}
                            pada tanggal <span className="font-mono font-bold text-teal-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{s.shift_date}</span>.
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>Jadwal dinas telah diperbarui</span>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/jadwal');
                            }}
                            className="font-bold text-teal-700 hover:text-teal-800 hover:underline"
                          >
                            Cek di Jadwal &rarr;
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-3">Belum ada riwayat tukar shift disetujui</p>
                  )}
                </div>
              )}

              {/* 3. PENDING SWAPS REQUIRING ACTION */}
              {(activeTab === 'all' || activeTab === 'pending') && (
                <div className="space-y-2">
                  <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 rounded-lg flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Menunggu Konfirmasi
                    </span>
                    <span className="text-xs bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-md font-mono font-semibold">
                      {pendingSwaps.length}
                    </span>
                  </div>

                  {pendingSwaps.length > 0 ? (
                    pendingSwaps.map((s) => {
                      const isTarget = s.target_profile_id === activeProfile?.id;
                      return (
                        <div
                          key={`pend-${s.id}`}
                          onClick={() => {
                            setIsOpen(false);
                            navigate('/tukar-shift');
                          }}
                          className="p-3 bg-amber-50/50 hover:bg-amber-100/50 border border-amber-200 rounded-xl transition-colors cursor-pointer space-y-2 shadow-2xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                              {s.shift?.name}
                            </span>
                            <span className="text-xs font-bold text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                              {isTarget ? 'Perlu Respon Anda' : 'Menunggu Persetujuan'}
                            </span>
                          </div>

                          <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed break-words">
                            <strong className="text-slate-900">{s.requester?.full_name}</strong> mengajukan pertukaran dinas tanggal{' '}
                            <span className="font-mono font-bold text-teal-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">{s.shift_date}</span>.
                          </p>

                          <div className="text-right pt-1">
                            <span className="text-xs font-bold text-amber-900 hover:underline inline-flex items-center gap-1">
                              Buka &amp; Tanggapi &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-3">Tidak ada pengajuan pending</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer with balanced proportional action buttons */}
            <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/tukar-shift');
                }}
                className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center justify-center gap-1.5 py-2 px-3 bg-teal-100/70 hover:bg-teal-200/70 border border-teal-200 rounded-xl transition-colors flex-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kelola Tukar Shift</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/jadwal');
                }}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex-1 shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lihat Jadwal Jaga</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

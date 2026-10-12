/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Bell,
  Calendar,
  Clock,
  UserCheck,
  ChevronRight,
  Volume2,
  Share2,
  Sparkles,
  AlertCircle,
  X,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakDateString } from '../services/dataService';
import { ShiftSwap } from '../types';
import { playAlarmSound } from '../utils/alarmSound';
import { useToast } from './Toast';

interface SwapReminderBannerProps {
  compact?: boolean;
}

export function SwapReminderBanner({ compact = false }: SwapReminderBannerProps) {
  const { activeProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeReminders, setActiveReminders] = useState<ShiftSwap[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [soundPlayed, setSoundPlayed] = useState(false);

  const todayStr = getPontianakDateString();

  const loadSwaps = async () => {
    try {
      const all = await dataService.getShiftSwaps();
      // Filter approved swaps that are either today or upcoming (sampai hari H pertukaran)
      const approvedUpcoming = all.filter((s) => {
        if (s.status !== 'approved') return false;
        return s.shift_date >= todayStr;
      });

      // Sort by shift_date ascending (closest to today first)
      approvedUpcoming.sort((a, b) => a.shift_date.localeCompare(b.shift_date));
      setActiveReminders(approvedUpcoming);
    } catch (e) {
      console.warn('Failed to load swap reminders:', e);
    }
  };

  useEffect(() => {
    loadSwaps();

    // Subscribe to realtime updates
    const unsubscribe = dataService.subscribe((event) => {
      if (event.table === 'shift_swaps' || event.table === 'ALL') {
        loadSwaps();
      }
    });

    return () => unsubscribe();
  }, [todayStr]);

  // Check if today is Hari H for any swap, play audio reminder once per session
  useEffect(() => {
    if (activeReminders.length > 0 && !soundPlayed) {
      const hasHariH = activeReminders.some((s) => s.shift_date === todayStr);
      const sessionKey = `hari_h_sound_played_${todayStr}`;
      if (hasHariH && !sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, 'true');
        setSoundPlayed(true);
        // Play gentle reminder sound
        setTimeout(() => {
          playAlarmSound('swap_reminder');
        }, 800);
      }
    }
  }, [activeReminders, soundPlayed, todayStr]);

  const visibleReminders = activeReminders.filter((s) => !dismissedIds.includes(s.id));

  if (visibleReminders.length === 0) {
    return null;
  }

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handlePlaySound = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAlarmSound('swap_reminder');
    showToast('Pengingat Berbunyi', 'Nada pengingat pertukaran shift telah dibunyikan.');
  };

  const handleShareWhatsAppReminder = (swap: ShiftSwap, e: React.MouseEvent) => {
    e.stopPropagation();
    const reqName = swap.requester?.full_name || 'Petugas ATLM';
    const targetName = swap.target_profile?.full_name || 'Rekan ATLM';
    const shiftName = swap.shift?.name || 'Shift Laboratorium';
    const shiftTime = swap.shift ? `${swap.shift.start_time.slice(0, 5)} - ${swap.shift.end_time.slice(0, 5)} WIB` : '';

    const today = new Date(todayStr);
    const swapDate = new Date(swap.shift_date);
    const diffDays = Math.ceil((swapDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const countdownText = diffDays === 0 ? 'HARI H (HARI INI)' : diffDays === 1 ? 'H-1 (BESOK)' : `H-${diffDays} (${diffDays} hari lagi)`;

    const text = `📢 *PENGINGAT RESMI TUKAR SHIFT JAGA (SELURUH PETUGAS ATLM)*\n` +
      `RSUD Sultan Muhammad Jamaludin I\n\n` +
      `Status: *${countdownText}*\n` +
      `📅 Tanggal: *${swap.shift_date}*\n` +
      `⏰ Shift: *${shiftName}* (${shiftTime})\n` +
      `🔄 *${targetName}* menggantikan *${reqName}*\n` +
      `📝 Keterangan: ${swap.reason || 'Pertukaran telah disetujui'}\n\n` +
      `Mohon seluruh rekan ATLM dan penanggung jawab shift mencatat pergantian jaga ini. Terima kasih!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-3">
      {visibleReminders.map((swap) => {
        const today = new Date(todayStr);
        const swapDate = new Date(swap.shift_date);
        const diffDays = Math.ceil((swapDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isHariH = diffDays === 0;
        const isHMinus1 = diffDays === 1;

        const reqName = swap.requester?.full_name || 'Petugas ATLM';
        const targetName = swap.target_profile?.full_name || 'Rekan ATLM';
        const shiftName = swap.shift?.name || 'Shift Jaga';
        const shiftTime = swap.shift ? `${swap.shift.start_time.slice(0, 5)} - ${swap.shift.end_time.slice(0, 5)}` : '';

        const isMeInvolved =
          swap.requester_id === activeProfile?.id || swap.target_profile_id === activeProfile?.id;

        return (
          <div
            key={swap.id}
            className={`rounded-2xl border transition-all overflow-hidden shadow-sm relative ${
              isHariH
                ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-teal-500/15 border-amber-400/80 ring-2 ring-amber-400/40'
                : isHMinus1
                ? 'bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-emerald-500/10 border-teal-300'
                : 'bg-gradient-to-r from-slate-50 to-teal-50/50 border-slate-200'
            }`}
          >
            {/* Top countdown banner stripe */}
            <div
              className={`px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-white ${
                isHariH
                  ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 animate-pulse'
                  : isHMinus1
                  ? 'bg-gradient-to-r from-teal-700 to-blue-700'
                  : 'bg-gradient-to-r from-slate-800 to-teal-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span className="uppercase tracking-wider text-[11px]">
                  {isHariH
                    ? '🔥 HARI H PERTUKARAN SHIFT (HARI INI)!'
                    : isHMinus1
                    ? '⏰ PENGINGAT H-1 PERTUKARAN SHIFT (BESOK)!'
                    : `📅 PENGINGAT H-${diffDays} PERTUKARAN SHIFT (${diffDays} HARI LAGI)`}
                </span>
                {isMeInvolved && (
                  <span className="bg-white/20 text-white text-[10px] px-2 py-0.2 rounded-full border border-white/30">
                    Shift Anda
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePlaySound}
                  title="Bunyikan nada pengingat"
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDismiss(swap.id, e)}
                  title="Tutup banner ini"
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Banner Main Content */}
            <div className="p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-teal-600" />
                      Tukar Shift Disetujui
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      📅 {swap.shift_date}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      ⏰ {shiftName} {shiftTime && `(${shiftTime} WIB)`}
                    </span>
                  </div>

                  {/* Clarification of who is replacing whom */}
                  <div className="text-xs sm:text-sm text-slate-800 leading-snug">
                    <span className="font-bold text-teal-900 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {targetName}
                    </span>{' '}
                    <span className="text-slate-600 font-medium">resmi menggantikan tugas jaga</span>{' '}
                    <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {reqName}
                    </span>
                    .
                  </div>

                  {swap.reason && (
                    <p className="text-[11px] text-slate-500 italic">
                      Alasan: &ldquo;{swap.reason}&rdquo;
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <button
                    onClick={(e) => handleShareWhatsAppReminder(swap, e)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
                    title="Kirim pengingat ke WhatsApp grup / rekan"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </button>

                  <button
                    onClick={() => navigate('/jadwal')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs active:scale-95"
                  >
                    <span>Lihat Jadwal</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

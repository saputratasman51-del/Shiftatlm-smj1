/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, UserCheck, ShieldAlert, X, Sparkles, AlertCircle, BellRing, Users, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakDateString } from '../services/dataService';
import { ShiftAssignment, Shift } from '../types';
import { Avatar } from './Avatar';

export function TodayShiftAlarmModal() {
  const { activeProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [todayAssignment, setTodayAssignment] = useState<ShiftAssignment | null>(null);
  const [shiftPartners, setShiftPartners] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = getPontianakDateString();

  const playAlarmSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0.4, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      // Alarm sound pattern: 3 quick beeps + 2 chime tones
      playTone(880, 0, 0.15);
      playTone(880, 0.2, 0.15);
      playTone(880, 0.4, 0.15);
      playTone(1320, 0.65, 0.4);
      playTone(1046, 1.05, 0.5);
    } catch (e) {
      console.warn('Audio play error (user interaction might be required):', e);
    }
  };

  useEffect(() => {
    const checkTodayShift = async () => {
      try {
        const assignments = await dataService.getAssignments({ date: todayStr });
        const mine = assignments.find(
          (a) => a.profile_id === activeProfile.id && a.status !== 'cancelled'
        );
        setTodayAssignment(mine || null);

        if (mine) {
          const partners = assignments.filter(
            (a) => a.shift_id === mine.shift_id && a.profile_id !== activeProfile.id && a.status !== 'cancelled'
          );
          setShiftPartners(partners);
        } else {
          setShiftPartners([]);
        }

        const storageKey = `shift_alarm_shown_${activeProfile.id}_${todayStr}`;
        const alreadyShown = sessionStorage.getItem(storageKey);

        if (!alreadyShown) {
          setIsOpen(true);
          sessionStorage.setItem(storageKey, 'true');
          playAlarmSound();
        }
      } catch (e) {
        console.warn('Error checking today shift alarm:', e);
      } finally {
        setLoading(false);
      }
    };

    if (activeProfile?.id) {
      checkTodayShift();
    }
  }, [activeProfile.id, todayStr]);

  const handleOpenModal = () => {
    setIsOpen(true);
    playAlarmSound();
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpenModal}
        className="fixed bottom-5 right-5 z-45 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 group border-2 border-white/30 animate-pulse"
        title="Alarm / Pengingat Shift Hari Ini"
      >
        <BellRing className="w-5 h-5 text-amber-300 animate-bounce" />
        <span className="text-xs font-bold pr-1 hidden sm:inline">Alarm Shift Hari Ini</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden animate-scale-up">
        {/* Top header banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-blue-600 to-teal-500" />

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-500/30 shrink-0">
              <BellRing className="w-6 h-6 animate-ping text-teal-600 absolute opacity-75" />
              <BellRing className="w-6 h-6 text-teal-600 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  Alarm Shift Berbunyi
                </span>
                <button
                  onClick={playAlarmSound}
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 transition-colors"
                  title="Putar Ulang Alarm"
                >
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Putar
                </button>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                {todayAssignment ? todayAssignment.shift?.name : 'Jadwal Hari Ini'}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          {/* Date & Time info */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar className="w-4 h-4 text-teal-600" />
                Tanggal Dinas:
              </span>
              <span className="font-mono font-bold text-slate-900">{todayStr}</span>
            </div>

            {todayAssignment && todayAssignment.shift ? (
              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Jam Dinas:
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {todayAssignment.shift.start_time.slice(0, 5)} - {todayAssignment.shift.end_time.slice(0, 5)} WIB
                </span>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/60 text-xs text-amber-700 font-medium">
                Anda tidak memiliki jadwal dinas shift pada hari ini (Libur / Lepas Dinas).
              </div>
            )}
          </div>

          {/* Shift Partners Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" />
              Rekan Kerja Satu Shift ({shiftPartners.length} Petugas)
            </h4>

            {shiftPartners.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {shiftPartners.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100"
                  >
                    <Avatar profile={p.profile} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{p.profile?.full_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{p.profile?.position || 'ATLM Pelaksana'}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      Dinas
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                {todayAssignment ? 'Tidak ada rekan lain tercatat pada shift ini.' : 'Belum ada rekan shift hari ini.'}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-teal-900/30 transition-all text-center"
          >
            Mengerti &amp; Mulai Bertugas
          </button>
        </div>
      </div>
    </div>
  );
}

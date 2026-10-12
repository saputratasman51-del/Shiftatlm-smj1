/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  ShieldAlert,
  X,
  Sparkles,
  AlertCircle,
  BellRing,
  Users,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Phone,
  MessageCircle,
  Heart,
  Sun,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakDateString, getPontianakTimeString } from '../services/dataService';
import { ShiftAssignment, Shift, UserProfile } from '../types';
import { Avatar } from './Avatar';
import { playAlarmSound } from '../utils/alarmSound';

export function TodayShiftAlarmModal() {
  const { activeProfile } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [todayAssignment, setTodayAssignment] = useState<ShiftAssignment | null>(null);
  const [shiftPartners, setShiftPartners] = useState<ShiftAssignment[]>([]);
  const [currentActiveShift, setCurrentActiveShift] = useState<Shift | null>(null);
  const [currentDutyStaff, setCurrentDutyStaff] = useState<ShiftAssignment[]>([]);
  const [isShiftFinished, setIsShiftFinished] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active view tab in modal: 'finished_or_current' | 'my_shift' | 'holiday'
  const [activeTab, setActiveTab] = useState<'current_duty' | 'my_shift' | 'holiday'>('current_duty');

  const todayStr = getPontianakDateString();
  const timeStr = getPontianakTimeString();

  // Helper to determine if a shift has finished given current Pontianak minutes
  const checkHasShiftEnded = (shift: Shift, curMin: number): boolean => {
    const [sh, sm] = shift.start_time.split(':').map(Number);
    const [eh, em] = shift.end_time.split(':').map(Number);
    const startMin = sh * 60 + (sm || 0);
    const endMin = eh * 60 + (em || 0);

    if (endMin > startMin) {
      // Day shift (e.g. 07:00 to 14:00, or 14:00 to 21:00)
      return curMin >= endMin;
    } else {
      // Overnight shift (e.g. 21:00 to 07:00)
      return curMin >= endMin && curMin < startMin;
    }
  };

  // Helper to find which shift is currently operating right now
  const findCurrentOperatingShift = (shifts: Shift[], curMin: number): Shift | null => {
    for (const s of shifts) {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      const startMin = sh * 60 + (sm || 0);
      const endMin = eh * 60 + (em || 0);

      if (endMin > startMin) {
        if (curMin >= startMin && curMin < endMin) return s;
      } else {
        if (curMin >= startMin || curMin < endMin) return s;
      }
    }
    return shifts[0] || null;
  };

  const checkTodayStatus = async () => {
    try {
      setLoading(true);
      const [assignments, shifts] = await Promise.all([
        dataService.getAssignments({ date: todayStr }),
        dataService.getShifts(),
      ]);

      const [curH, curM] = getPontianakTimeString().split(':').map(Number);
      const curMinutes = curH * 60 + (curM || 0);

      // Determine the shift running right now
      const operatingShift = findCurrentOperatingShift(shifts, curMinutes);
      setCurrentActiveShift(operatingShift);

      // Staff currently on duty for the active shift
      if (operatingShift) {
        const onDuty = assignments.filter(
          (a) => a.shift_id === operatingShift.id && a.status !== 'cancelled'
        );
        setCurrentDutyStaff(onDuty);
      }

      // Check current user's assignment today
      const mine = assignments.find(
        (a) => a.profile_id === activeProfile.id && a.status !== 'cancelled'
      );
      setTodayAssignment(mine || null);

      if (mine && mine.shift) {
        const finished = checkHasShiftEnded(mine.shift, curMinutes);
        setIsShiftFinished(finished);
        setIsHoliday(false);

        const partners = assignments.filter(
          (a) => a.shift_id === mine.shift_id && a.profile_id !== activeProfile.id && a.status !== 'cancelled'
        );
        setShiftPartners(partners);

        if (finished) {
          setActiveTab('current_duty');
          const finishedStorageKey = `alarm_finished_shown_${activeProfile.id}_${todayStr}`;
          if (!sessionStorage.getItem(finishedStorageKey)) {
            setIsOpen(true);
            sessionStorage.setItem(finishedStorageKey, 'true');
            playAlarmSound('shift_ended');
          }
        } else {
          setActiveTab('my_shift');
          const activeStorageKey = `alarm_active_shown_${activeProfile.id}_${todayStr}`;
          if (!sessionStorage.getItem(activeStorageKey)) {
            setIsOpen(true);
            sessionStorage.setItem(activeStorageKey, 'true');
            playAlarmSound('shift_active');
          }
        }
      } else {
        // User has no assignment today -> Libur (Lepas Dinas)
        setIsShiftFinished(false);
        setIsHoliday(true);
        setActiveTab('holiday');
      }
    } catch (e) {
      console.warn('Error checking today shift status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProfile?.id) {
      checkTodayStatus();
    }
  }, [activeProfile.id, todayStr]);

  const handleOpenModal = () => {
    setIsOpen(true);
    if (isShiftFinished) {
      setActiveTab('current_duty');
      playAlarmSound('shift_ended');
    } else if (isHoliday) {
      setActiveTab('holiday');
      playAlarmSound('holiday');
    } else {
      setActiveTab('my_shift');
      playAlarmSound('shift_active');
    }
  };

  const handleReplayCurrentSound = () => {
    if (activeTab === 'current_duty' || isShiftFinished) {
      playAlarmSound('shift_ended');
    } else if (activeTab === 'holiday' || isHoliday) {
      playAlarmSound('holiday');
    } else {
      playAlarmSound('shift_active');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpenModal}
        className={`no-print fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 text-white p-3 sm:p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 group border-2 border-white/40 cursor-pointer ${
          isShiftFinished
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-amber-900/40 animate-bounce'
            : isHoliday
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-teal-900/40'
            : 'bg-gradient-to-r from-teal-600 to-blue-600 shadow-teal-900/40 animate-pulse'
        }`}
        title={
          isShiftFinished
            ? 'Shift Selesai - Lihat Petugas Yang Jaga Sekarang'
            : isHoliday
            ? 'Status Libur Hari Ini'
            : 'Alarm Shift Hari Ini'
        }
      >
        <BellRing className="w-5 h-5 text-amber-300 animate-spin-slow" />
        <span className="text-xs font-bold pr-1 hidden md:inline">
          {isShiftFinished
            ? 'Shift Selesai • Jaga Sekarang'
            : isHoliday
            ? 'Hari Ini Libur'
            : 'Alarm Shift Hari Ini'}
        </span>
      </button>
    );
  }

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden animate-scale-up my-auto">
        {/* Top Decorative Gradient Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-2.5 ${
            isShiftFinished
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
              : isHoliday
              ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
              : 'bg-gradient-to-r from-teal-500 via-blue-600 to-teal-500'
          }`}
        />

        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pt-1">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-md ${
                isShiftFinished
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : isHoliday
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-teal-100 text-teal-700 border border-teal-300'
              }`}
            >
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isShiftFinished
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isHoliday
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-teal-100 text-teal-900 border border-teal-300'
                  }`}
                >
                  {isShiftFinished
                    ? 'Shift Selesai • Alarm Berbunyi'
                    : isHoliday
                    ? 'Status: Libur'
                    : 'Alarm Shift Hari Ini'}
                </span>

                <button
                  onClick={handleReplayCurrentSound}
                  className="text-[11px] text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300 transition-colors cursor-pointer"
                  title="Bunyikan Ulang Alarm"
                >
                  <Volume2 className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  <span>Putar Alarm</span>
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 leading-tight">
                {isShiftFinished
                  ? 'Shift Anda Hari Ini Telah Selesai'
                  : isHoliday
                  ? 'Selamat Berlibur Bersama Keluarga Tercinta'
                  : todayAssignment?.shift?.name || 'Jadwal Dinas Hari Ini'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('current_duty');
              playAlarmSound('shift_ended');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
              activeTab === 'current_duty'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jaga Shift Sekarang
          </button>

          {todayAssignment && (
            <button
              onClick={() => {
                setActiveTab('my_shift');
                playAlarmSound('shift_active');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
                activeTab === 'my_shift'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shift Saya ({todayAssignment.shift?.name?.replace('Shift ', '') || 'Saya'})
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('holiday');
              playAlarmSound('holiday');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center ${
              activeTab === 'holiday'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Info Libur
          </button>
        </div>

        {/* TAB 1: CURRENT DUTY (PETUGAS YANG JAGA SHIFT SEKARANG) */}
        {activeTab === 'current_duty' && (
          <div className="space-y-4 animate-fade-in">
            {/* Completion Banner */}
            {isShiftFinished && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Shift Anda Telah Selesai!</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Terima kasih banyak atas dedikasi dan kerja keras Anda hari ini. Berikut adalah daftar rekan
                    petugas yang bertugas pada shift saat ini:
                  </p>
                </div>
              </div>
            )}

            {/* Current Active Shift Information */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                    Shift Sedang Berjalan (Saat Ini)
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {currentActiveShift ? currentActiveShift.name : 'Shift Sedang Berlangsung'}
                  </h4>
                </div>
                {currentActiveShift && (
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                      {currentActiveShift.start_time.slice(0, 5)} - {currentActiveShift.end_time.slice(0, 5)} WIB
                    </span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {currentActiveShift?.description || 'Pelayanan operasional Laboratorium RSUD SMJ I'}
              </p>
            </div>

            {/* List of On-Duty Personnel Right Now */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-600" />
                  Petugas Yang Jaga Shift Sekarang ({currentDutyStaff.length} Petugas)
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">WIB: {timeStr}</span>
              </div>

              {currentDutyStaff.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {currentDutyStaff.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar profile={item.profile} size="sm" showStatus />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.profile?.full_name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.profile?.position || 'ATLM Pelaksana'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.profile?.phone && (
                          <a
                            href={`https://wa.me/${item.profile.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                            title={`Hubungi WhatsApp ${item.profile.full_name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                          Jaga
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200">
                  <AlertCircle className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  Belum ada penugasan terdaftar pada shift ini untuk hari ini.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY SHIFT TODAY */}
        {activeTab === 'my_shift' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Tanggal Dinas:
                </span>
                <span className="font-mono font-bold text-slate-900">{todayStr}</span>
              </div>

              {todayAssignment && todayAssignment.shift ? (
                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Jam Dinas Anda:
                  </span>
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {todayAssignment.shift.start_time.slice(0, 5)} - {todayAssignment.shift.end_time.slice(0, 5)} WIB
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 text-xs text-amber-700 font-medium">
                  Anda tidak memiliki jadwal dinas shift pada hari ini (Libur / Lepas Dinas).
                </div>
              )}
            </div>

            {/* Shift Partners */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                Rekan Satu Shift Anda ({shiftPartners.length} Petugas)
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
        )}

        {/* TAB 3: HOLIDAY GREETING (SELAMAT BERLIBUR BERSAMA KELUARGA TERCINTA) */}
        {activeTab === 'holiday' && (
          <div className="space-y-4 animate-fade-in text-center py-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Sun className="w-8 h-8 text-amber-200 animate-spin-slow" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Status Hari Ini: Libur / Lepas Dinas
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                Selamat berlibur bersama keluarga tercinta
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed pt-1">
                Halo <span className="font-bold text-slate-800">{activeProfile.full_name}</span>, hari ini Anda tidak
                memiliki jadwal jaga dinas di Laboratorium RSUD Sultan Muhammad Jamaludin I.
              </p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 text-left space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                <span>Pesan Dari Rekan &amp; Manajemen ATLM:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Gunakan waktu hari ini untuk beristirahat, menjaga kesehatan, dan menikmati momen hangat penuh
                kebahagiaan bersama keluarga tercinta di rumah.
              </p>
            </div>
          </div>
        )}

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={() => {
              navigate('/serah-terima');
              setIsOpen(false);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition text-center"
          >
            Lihat Serah Terima (Operan)
          </button>

          <button
            onClick={() => {
              navigate('/jadwal');
              setIsOpen(false);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-teal-900/20 transition text-center"
          >
            Lihat Jadwal Lengkap
          </button>
        </div>
      </div>
    </div>
  );
}

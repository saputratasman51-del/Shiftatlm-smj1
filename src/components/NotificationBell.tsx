/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, RefreshCw, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { ShiftSwap } from '../types';

export function NotificationBell() {
  const { activeProfile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    // Poll every 10s for live notification updates
    const interval = setInterval(fetchSwaps, 10000);
    return () => clearInterval(interval);
  }, [activeProfile]);

  // Filter pending swaps relevant to user or admin
  const pendingSwaps = swaps.filter((s) => {
    if (s.status !== 'pending') return false;
    if (isAdmin) return true;
    return s.target_profile_id === activeProfile.id || s.requester_id === activeProfile.id;
  });

  const count = pendingSwaps.length;

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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/80 flex items-center justify-center shadow-sm"
        title="Notifikasi Tukar Shift"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-md">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-scale-up text-slate-800">
          <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight text-white">Notifikasi Tukar Shift</h4>
                <p className="text-[10px] text-slate-300">Pengajuan shift yang memerlukan tindakan</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full">
              {count} Pending
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {pendingSwaps.length > 0 ? (
              pendingSwaps.map((s) => {
                const isTarget = s.target_profile_id === activeProfile.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/tukar-shift');
                    }}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 group-hover:text-teal-700 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        {s.shift?.name || 'Shift Laboratorium'}
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                        {isTarget ? 'Perlu Respon Anda' : 'Menunggu Konfirmasi'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <p>
                        <strong className="text-slate-900 font-semibold">{s.requester?.full_name || 'Petugas'}</strong>{' '}
                        mengajukan pertukaran dengan{' '}
                        <strong className="text-slate-900 font-semibold">{s.target_profile?.full_name || 'Rekan'}</strong>{' '}
                        pada tanggal <span className="font-mono font-bold text-teal-700">{s.shift_date}</span>.
                      </p>
                      {s.reason && (
                        <p className="text-[11px] text-slate-500 italic border-l-2 border-teal-400 pl-2 mt-1">
                          &ldquo;{s.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">Tidak Ada Notifikasi Pending</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Semua pengajuan tukar shift telah diproses dan disetujui.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200/80 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/tukar-shift');
              }}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center justify-center gap-1.5 w-full py-1.5 bg-teal-50 hover:bg-teal-100/70 rounded-xl transition-colors"
            >
              <span>Kelola Semua Tukar Shift</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

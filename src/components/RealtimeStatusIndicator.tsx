import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  X,
  Server,
  Zap,
} from 'lucide-react';
import { dataService, SyncStatus } from '../services/dataService';
import { useToast } from './Toast';
import { SUPABASE_PATCH_SQL } from '../lib/supabaseSqlScripts';

export const RealtimeStatusIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { showToast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(dataService.getSyncStatus());
  const [modalOpen, setModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = dataService.onStatusChange((newStatus) => {
      setSyncStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await dataService.syncAll();
    setIsSyncing(false);
    if (res.success) {
      showToast('Sinkronisasi Sukses', res.message);
    } else {
      showToast('Info Sinkronisasi', res.message, 'info');
    }
  };

  const handleCopySQLPatch = () => {
    try {
      navigator.clipboard.writeText(SUPABASE_PATCH_SQL);
      setCopied(true);
      showToast('SQL Disalin', 'Skrip perbaikan RLS & Realtime disalin ke clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast('Info', 'Buka file /supabase_patch_rls_realtime.sql', 'info');
    }
  };

  const isConnected = syncStatus.connected && syncStatus.channelStatus === 'SUBSCRIBED';

  if (compact) {
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-colors text-xs"
        title="Status Realtime Database Supabase"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
              : 'bg-amber-400'
          }`}
        />
        <Zap className="w-3 h-3 text-teal-400" />
        <span className="text-[10px] font-bold text-slate-200">Realtime</span>
      </button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModalOpen(true)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
            isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>

          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px] font-bold tracking-tight">
              {isConnected ? 'Supabase Realtime Aktif' : 'Supabase Realtime'}
            </span>
          </div>
        </button>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Sinkronkan data sekarang"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-400' : ''}`} />
        </button>
      </div>

      {/* Modal Detail Status Database & Realtime */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scale-up text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Status Database Supabase</h3>
                  <p className="text-[11px] text-slate-500">Integrasi Realtime Semua Petugas RSUD</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection Info */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Koneksi Realtime:</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                  {syncStatus.channelStatus}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Project URL:</span>
                <span className="text-slate-800 truncate max-w-[200px]">
                  {import.meta.env.VITE_SUPABASE_URL || 'Terkonfigurasi di .env'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Terakhir Sinkron:</span>
                <span className="text-slate-800">
                  {syncStatus.lastSynced
                    ? syncStatus.lastSynced.toLocaleTimeString('id-ID', { timeZone: 'Asia/Pontianak' }) + ' WIB'
                    : 'Baru saja'}
                </span>
              </div>
            </div>

            {/* Realtime Tables Status */}
            <div>
              <p className="font-bold text-slate-800 mb-1.5 text-[11px]">Tabel Terintegrasi Realtime:</p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  'profiles (Petugas)',
                  'shifts (Master Shift)',
                  'shift_assignments (Jadwal)',
                  'handovers (Serah Terima)',
                  'pending_tasks (Tugas)',
                  'shift_swaps (Tukar Shift)',
                  'audit_logs (Audit Trail)',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-teal-50/60 text-teal-900 border border-teal-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Menyinkronkan Data...' : 'Sinkronkan Sekarang'}
              </button>

              <button
                onClick={handleCopySQLPatch}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-300"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                {copied ? 'Berhasil Disalin!' : 'Salin Skrip SQL Patch RLS & Realtime'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

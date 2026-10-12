/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, User, Lock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { Avatar } from '../components/Avatar';

const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Lambang_Daerah_Kab._Kayong_Utara.png';

export default function Login() {
  const { login, resetPassword } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Masukkan NIP atau Nama Lengkap serta Password Anda.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(identifier, password);
      if (!ok) {
        setError('NIP/Nama atau Password salah. Periksa kembali atau gunakan fitur Lupa Password.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (profile: any) => {
    setIdentifier(profile.nip_str || profile.full_name);
    setPassword('123');
    setLoading(true);
    try {
      const ok = await login(profile.nip_str || profile.full_name, '123');
      if (!ok) {
        setError('Gagal login cepat.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetIdentifier.trim()) {
      setResetError('Masukkan NIP atau Nama Terdaftar.');
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setResetError('Password baru minimal 3 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Konfirmasi password tidak cocok.');
      return;
    }

    const success = await resetPassword(resetIdentifier, newPassword);
    if (success) {
      setResetSuccess('Password berhasil direset! Silakan login dengan password baru.');
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess('');
        setResetIdentifier('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2000);
    } else {
      setResetError('Petugas dengan NIP/Nama tersebut tidak ditemukan dalam database.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative glowing circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative z-10 animate-scale-up">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center p-2">
            <img src={LOGO_URL} alt="Logo Kayong Utara" className="w-full h-full object-contain" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
            RSUD Sultan Muhammad Jamaludin I
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-2">SHIFT ATLM LABORATORIUM</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kabupaten Kayong Utara</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              NIP atau Nama Lengkap Petugas
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Contoh: 19890412 / Tasman"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password Login
              </label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Lupa / Reset Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password (default: 123)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Masuk Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Reset Password Petugas</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan NIP atau Nama terdaftar untuk memperbarui password Anda.
            </p>

            {resetError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NIP atau Nama Terdaftar
                </label>
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="Contoh: 19890412 / Siti"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 3 karakter"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  User,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Award,
  Database,
  Download,
  Smartphone,
  Check,
} from 'lucide-react';
import { dataService } from '../services/dataService';

const HOSPITAL_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Lambang_Daerah_Kab._Kayong_Utara.png';

export default function Login() {
  const { login, resetPassword } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Hero Image State
  const [heroImg, setHeroImg] = useState(() => dataService.getHeroImage());

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showPwaGuideModal, setShowPwaGuideModal] = useState(false);

  // Reset Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    // Listen for PWA beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowPwaGuideModal(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim() || !password) {
      setError('Masukkan NIP atau Nama Lengkap serta Password Anda.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(identifier, password);
      if (ok) {
        setSuccessMsg('Login berhasil! Mengalihkan ke aplikasi...');
      } else {
        setError('NIP/Nama atau Password salah. Periksa kembali atau gunakan fitur Lupa Password.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghubungkan ke server.');
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
      setResetError('Petugas dengan NIP/Nama tersebut tidak ditemukan.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden font-sans">
      {/* =========================================================================
          LEFT PANEL: HERO ILLUSTRATION & HOSPITAL INFO (DESKTOP & TABLET)
      ========================================================================= */}
      <div className="lg:col-span-7 xl:col-span-8 relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Laboratorium RSUD SMJ I"
            className="w-full h-full object-cover object-center transform scale-105 animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/85 to-teal-950/80 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent" />
        </div>

        {/* Top Header branding inside Hero */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-xl">
            <div className="w-10 h-10 bg-white rounded-xl shadow-md p-1 flex items-center justify-center shrink-0">
              <img src={HOSPITAL_LOGO} alt="Logo Kab Kayong Utara" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-widest text-teal-300 uppercase block">
                RSUD Sultan Muhammad Jamaludin I
              </span>
              <span className="text-xs font-bold text-white tracking-wide">Kabupaten Kayong Utara</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-teal-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>Sistem Informasi Shift ATLM v2.5</span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto max-w-2xl py-8 space-y-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/30 to-blue-500/30 border border-teal-400/30 px-4 py-1.5 rounded-full text-xs font-bold text-teal-200">
            <Award className="w-4 h-4 text-teal-400" />
            <span>Portal Resmi Manajemen Jadwal &amp; Serah Terima Jaga Laboratorium</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight">
            SHIFT <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">ATLM</span>
          </h1>

          <p className="text-sm xl:text-base text-slate-300 leading-relaxed font-normal">
            &ldquo;Bersama Menjaga Mutu, untuk Pelayanan Laboratorium yang Lebih Baik&rdquo;. Solusi terpadu penjadwalan dinas shift, pertukaran tugas, dan pelaporan serah terima spesimen secara real-time.
          </p>

          {/* 4 Key Advantages Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-start gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Jadwal Shift</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Lebih Teratur &amp; Transparan</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-start gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Koordinasi Tim</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Lebih Mudah &amp; Cepat</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-start gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Kualitas Layanan</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Lebih Baik &amp; Akurat</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex items-start gap-3 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Data Terintegrasi</h3>
                <p className="text-[11px] text-slate-300 mt-0.5">Cloud Supabase Aman</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer in Hero */}
        <div className="relative z-0 text-xs text-slate-400 flex items-center justify-between pt-4 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} Instalasi Laboratorium RSUD SMJ I</span>
          <span className="font-mono text-[11px]">Kabupaten Kayong Utara, Kalimantan Barat</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: LOGIN FORM (MOBILE, TABLET & DESKTOP)
      ========================================================================= */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative shadow-2xl overflow-y-auto">
        {/* Mobile Header branding */}
        <div className="lg:hidden text-center mb-6 pt-2">
          <div className="w-14 h-14 mx-auto mb-2 bg-slate-50 rounded-2xl shadow-md border border-slate-200 p-2 flex items-center justify-center">
            <img src={HOSPITAL_LOGO} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
            RSUD Sultan Muhammad Jamaludin I
          </span>
          <h1 className="text-lg font-black text-slate-900 mt-2">SHIFT ATLM</h1>
          <p className="text-xs text-slate-500">Kabupaten Kayong Utara</p>
        </div>

        {/* Top Right PWA Ready Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="hidden lg:block">
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              RSUD SMJ I Kayong Utara
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700">
            <Smartphone className="w-3.5 h-3.5 text-teal-600" />
            <span>PWA Ready</span>
          </div>
        </div>

        {/* Login Card Body */}
        <div className="my-auto max-w-sm w-full mx-auto space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Silakan login untuk melanjutkan ke aplikasi Shift ATLM.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{successMsg}</span>
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
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-2xs"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password (default: 123)"
                  className="w-full pl-10 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-2xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Ingat sesi saya</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-4 rounded-xl shadow-lg shadow-teal-900/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 min-h-[48px]"
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

          {/* PWA Install Button Box */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleInstallPwa}
              disabled={isPwaInstalled}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-3 px-4 rounded-xl border border-slate-200 flex items-center justify-between transition active:scale-95 min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  {isPwaInstalled ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-900">
                    {isPwaInstalled ? 'Aplikasi Terpasang (PWA)' : 'Instal Aplikasi (PWA)'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {isPwaInstalled ? 'Akses standalone aktif' : 'Akses lebih cepat seperti aplikasi'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {isPwaInstalled ? 'Aktif' : 'Instal'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="pt-6 border-t border-slate-100 text-center mt-6">
          <p className="text-[11px] font-semibold text-slate-500">
            RSUD Sultan Muhammad Jamaludin I Kabupaten Kayong Utara
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Sistem Informasi Shift Petugas ATLM</p>
        </div>
      </div>

      {/* =========================================================================
          RESET PASSWORD MODAL
      ========================================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Reset Password Petugas</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan NIP atau Nama terdaftar untuk memperbarui password Anda.
            </p>

            {resetError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
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
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition"
                >
                  Perbarui Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PWA Installation Guide Modal (replaces browser alert) */}
      {showPwaGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-scale-up space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Panduan Instalasi PWA</h3>
                <p className="text-[11px] text-slate-500">SHIFT ATLM RSUD SMJ I</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700 shrink-0">1.</span>
                <p>
                  <strong>Chrome (Android / PC):</strong> Klik ikon titik tiga (<span className="font-mono">⋮</span>) di pojok kanan atas browser, lalu pilih <strong>&quot;Instal aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-teal-700 shrink-0">2.</span>
                <p>
                  <strong>Safari (iPhone / iPad):</strong> Ketuk tombol Bagikan (ikon kotak panah ke atas), lalu pilih <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPwaGuideModal(false)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition active:scale-95 cursor-pointer"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

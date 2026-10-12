import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Users,
  History,
  User,
  Settings,
  Shield,
  Clock,
  Menu,
  X,
  ChevronDown,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPontianakTimeString } from '../services/dataService';
import { Avatar } from './Avatar';
import { NotificationBell } from './NotificationBell';
import { TodayShiftAlarmModal } from './TodayShiftAlarmModal';
import { OfflineIndicator } from './OfflineIndicator';
import { pushNotificationService } from '../services/pushNotificationService';

const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Lambang_Daerah_Kab._Kayong_Utara.png';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeProfile, isAdmin, allProfiles, switchProfile } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(getPontianakTimeString());
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Live clock in Asia/Pontianak & push notification check
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(getPontianakTimeString(now));
      setCurrentDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Pontianak',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    if (activeProfile?.id) {
      pushNotificationService.checkAndTriggerShiftAlert(activeProfile.id);
    }

    return () => clearInterval(interval);
  }, [activeProfile?.id]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jadwal', label: 'Jadwal Shift', icon: CalendarDays },
    { to: '/tukar-shift', label: 'Tukar Shift', icon: RefreshCw },
    { to: '/serah-terima', label: 'Serah Terima', icon: FileSpreadsheet, highlight: true },
    { to: '/petugas', label: 'Petugas', icon: Users },
    { to: '/riwayat', label: 'Riwayat', icon: History },
    { to: '/profil', label: 'Profil', icon: User },
    ...(isAdmin ? [{ to: '/admin', label: 'Pengaturan Admin', icon: Settings, adminOnly: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased">
      {/* =========================================================================
          DESKTOP SIDEBAR
      ========================================================================= */}
      <aside className="no-print hidden md:flex md:w-64 lg:w-72 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white flex-col shrink-0 border-r border-slate-800 z-30 sticky top-0 h-screen">
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="Lambang Kabupaten Kayong Utara"
            className="w-11 h-12 object-contain drop-shadow"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">SHIFT ATLM</h1>
              <span className="text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded">
                RSUD
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
              RSUD Sultan Muhammad Jamaludin I
            </p>
            <p className="text-[10px] text-teal-400 font-medium">Kab. Kayong Utara</p>
          </div>
        </div>

        {/* Live time indicator */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono tabular-nums font-semibold text-white">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-900/40 font-bold'
                    : item.highlight
                    ? 'bg-slate-800/60 text-teal-300 hover:bg-slate-800 hover:text-white border border-teal-500/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : item.highlight ? 'text-teal-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[9px] uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 py-0.2 rounded font-mono">
                    Admin
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Active user badge & quick role switch */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-left"
            >
              <Avatar profile={activeProfile} size="sm" showStatus />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{activeProfile.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isAdmin ? 'bg-amber-400' : 'bg-teal-400'
                    }`}
                  />
                  <p className="text-[10px] text-slate-300 capitalize truncate">
                    {isAdmin ? 'Administrator Lab' : 'Petugas ATLM'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Profile switcher dropdown */}
            {profileDropdownOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Simulasi Akun Petugas:
                </p>
                {allProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProfile(p.id);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                      p.id === activeProfile.id
                        ? 'bg-teal-600/30 text-teal-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Avatar profile={p} size="xs" />
                    <span className="truncate flex-1">{p.full_name}</span>
                    <span className="text-[9px] text-slate-400 uppercase">{p.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP HEADER
      ========================================================================= */}
      <header className="no-print md:hidden bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={LOGO_URL}
            alt="Lambang Kayong Utara"
            className="w-8 h-9 object-contain drop-shadow"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-extrabold text-white tracking-tight leading-tight">SHIFT ATLM</span>
              <span className="text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-1 rounded">
                RSUD
              </span>
            </div>
            <p className="text-[10px] text-slate-300 truncate">RSUD SMJ I Kayong Utara</p>
          </div>
        </div>

        {/* Right side: NotificationBell & Profile switch toggle */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <div className="text-right hidden xs:block">
            <span className="font-mono text-xs font-bold text-teal-300 tabular-nums">{currentTime}</span>
            <p className="text-[9px] text-slate-400">Asia/Pontianak</p>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 p-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            <Avatar profile={activeProfile} size="xs" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </header>

      {/* Mobile Profile Switcher Modal */}
      {mobileDrawerOpen && (
        <div className="no-print md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-4 text-white shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-sm">Ganti Peran / Petugas</h3>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-1.5 max-h-64 overflow-y-auto">
              {allProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    switchProfile(p.id);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                    p.id === activeProfile.id
                      ? 'bg-teal-600/30 border border-teal-500/40 text-teal-200 font-semibold'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <Avatar profile={p} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{p.full_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.position}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      p.role === 'admin'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}
                  >
                    {p.role}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
              <span>Waktu Server:</span>
              <span className="font-mono text-white font-semibold">{currentTime} WIB</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN APPLICATION VIEWPORT
      ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col pb-24 md:pb-6 overflow-x-hidden">
        {/* Printable Letterhead (Only visible when printing or exporting to PDF) */}
        <div className="hidden print:block p-4 border-b-2 border-black text-center mb-6">
          <div className="flex items-center justify-center gap-4">
            <img
              src={LOGO_URL}
              alt="Logo RSUD"
              className="w-16 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider">Pemerintah Kabupaten Kayong Utara</h2>
              <h1 className="text-lg font-extrabold uppercase">RSUD Sultan Muhammad Jamaludin I</h1>
              <p className="text-xs">Instalasi Laboratorium Klinik & Bank Darah</p>
              <p className="text-[10px] text-gray-600">
                Jl. Provinsi Sukadana, Kabupaten Kayong Utara, Kalimantan Barat
              </p>
            </div>
          </div>
        </div>

        {/* Render child pages */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 lg:p-6">{children}</div>
      </main>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (Touch-friendly Android style)
      ========================================================================= */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          {/* 1. Dashboard */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Beranda</span>
          </NavLink>

          {/* 2. Jadwal */}
          <NavLink
            to="/jadwal"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <CalendarDays className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Jadwal</span>
          </NavLink>

          {/* 3. Serah Terima (Prominent Center Button) */}
          <NavLink
            to="/serah-terima"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all min-h-[48px] relative -top-2 ${
                isActive
                  ? 'text-teal-700 font-bold'
                  : 'text-slate-600'
              }`
            }
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-blue-900 text-white flex items-center justify-center shadow-lg shadow-teal-900/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5">Operan</span>
          </NavLink>

          {/* 4. Petugas */}
          <NavLink
            to="/petugas"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Petugas</span>
          </NavLink>

          {/* 5. Riwayat */}
          <NavLink
            to="/riwayat"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Riwayat</span>
          </NavLink>
        </div>
      </nav>
      <TodayShiftAlarmModal />
      <OfflineIndicator />
    </div>
  );
};

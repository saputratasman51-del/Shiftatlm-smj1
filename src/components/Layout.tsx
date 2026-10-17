import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronRight,
  ArrowRight,
  Building2,
  RefreshCw,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakTimeString } from '../services/dataService';
import { Avatar } from './Avatar';
import { NotificationBell } from './NotificationBell';
import { TodayShiftAlarmModal } from './TodayShiftAlarmModal';
import { OfflineIndicator } from './OfflineIndicator';
import { RealtimeStatusIndicator } from './RealtimeStatusIndicator';
import { PWAInstallButton } from './PWAInstallButton';
import { pushNotificationService } from '../services/pushNotificationService';

const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Lambang_Daerah_Kab._Kayong_Utara.png';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    activeProfile,
    authenticatedProfile,
    isAdmin,
    isRealAdmin,
    canSimulate,
    isSimulating,
    allProfiles,
    switchProfile,
    stopSimulation,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(getPontianakTimeString());
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showSimulateList, setShowSimulateList] = useState(false);
  const [pendingHandoversCount, setPendingHandoversCount] = useState(0);

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

  // Live monitor pending handovers for the current user or admin
  useEffect(() => {
    const fetchPendingHandovers = async () => {
      try {
        const hoList = await dataService.getHandovers();
        const pending = hoList.filter(
          (h) => h.status === 'pending' && (isAdmin || h.receiver_profile_id === activeProfile?.id)
        );
        setPendingHandoversCount(pending.length);
      } catch (e) {
        console.warn('Error fetching pending handovers for layout:', e);
      }
    };
    fetchPendingHandovers();
    const interval = setInterval(fetchPendingHandovers, 8000);
    const unsub = dataService.subscribe((ev) => {
      if (ev.table === 'handovers' || ev.table === 'ALL') {
        fetchPendingHandovers();
      }
    });
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [activeProfile?.id, isAdmin]);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jadwal', label: 'Jadwal Shift', icon: CalendarDays },
    { to: '/tukar-shift', label: 'Tukar Shift', icon: RefreshCw },
    { to: '/serah-terima', label: 'Serah Terima', icon: FileSpreadsheet, highlight: true },
    { to: '/chat', label: 'Chat Lab', icon: MessageSquare, badge: 'Baru' },
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

        {/* Realtime Supabase Connection Status */}
        <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/20 flex items-center justify-between">
          <RealtimeStatusIndicator />
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
                {item.to === '/serah-terima' && pendingHandoversCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                    {pendingHandoversCount}
                  </span>
                )}
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
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-3">
          {/* In-app PWA install action banner */}
          <PWAInstallButton />

          {/* Active Profile Info / Quick Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                if (canSimulate) {
                  setProfileDropdownOpen(!profileDropdownOpen);
                } else {
                  navigate('/profil');
                }
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              title={canSimulate ? 'Simulasi Akun Petugas (Khusus Admin)' : 'Akun Saya - Buka Profil'}
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
              {canSimulate ? (
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              ) : (
                <span title="Akun Mandiri" className="inline-flex">
                  <Shield className="w-3.5 h-3.5 text-teal-400/80 shrink-0" />
                </span>
              )}
            </button>

            {/* Profile switcher dropdown (Hanya untuk Admin) */}
            {canSimulate && profileDropdownOpen && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Simulasi Akun:</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                    Admin
                  </span>
                </div>
                {allProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProfile(p.id);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
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

        {/* Right side: PWA install, Realtime status, Chat Lab, NotificationBell & Menu toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton compact />
          <RealtimeStatusIndicator compact />
          <button
            onClick={() => navigate('/chat')}
            aria-label="Buka Chat Lab"
            className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-sm transition flex items-center justify-center relative"
            title="Chat Lab & Koordinasi"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
          </button>
          <NotificationBell />

          <button
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Buka Menu & Profil Petugas"
            className={`flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 p-1.5 rounded-xl border transition-colors ${
              isAdmin
                ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400'
                : 'border-slate-700'
            }`}
            title={isAdmin ? 'Menu Petugas & Pengaturan Admin' : 'Menu & Profil Petugas'}
          >
            <Avatar profile={activeProfile} size="xs" />
            <Menu className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-300' : 'text-slate-300'}`} />
          </button>
        </div>
      </header>

      {/* Mobile Navigation, Profile & Quick-Access Drawer */}
      {mobileDrawerOpen && (
        <div className="no-print md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col text-white shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Drawer Header & Active Profile Info */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 border-b border-slate-800">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    Pusat Akses Petugas
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Profile Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <Avatar profile={activeProfile} size="md" showStatus />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{activeProfile.full_name}</p>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        isAdmin
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}
                    >
                      {activeProfile.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">{activeProfile.position}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    NIP/STR: {activeProfile.nip_str || '199502152020121005'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profil');
                    setMobileDrawerOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow transition shrink-0"
                >
                  Profil
                </button>
              </div>
            </div>

            {/* Scrollable Menu Items */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {/* Highlighted Primary Menus Requested by User */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                  Menu Utama &amp; Pengaturan:
                </p>

                {/* 1. Tukar Shift */}
                <button
                  onClick={() => {
                    navigate('/tukar-shift');
                    setMobileDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-teal-950/60 to-slate-800/90 border border-teal-500/30 hover:border-teal-400 text-left transition group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                      <RefreshCw className="w-5 h-5 text-teal-400 group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-teal-200">Tukar Shift Jaga</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Ajukan, setujui, &amp; koordinasikan jadwal tukar dinas
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </button>

                {/* 2. Profil Petugas */}
                <button
                  onClick={() => {
                    navigate('/profil');
                    setMobileDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-teal-500/40 text-left transition group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-teal-200">Profil Saya</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Ubah foto profil, NIP/STR, no telp, &amp; kata sandi
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                </button>

                {/* 3. Pengaturan Admin (Highlighted prominently for Admins) */}
                {isAdmin ? (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setMobileDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-800 to-amber-950/40 border border-amber-500/40 hover:border-amber-400 text-left transition group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 ring-1 ring-amber-500/30">
                        <Settings className="w-5 h-5 text-amber-400 group-hover:rotate-90 transition-transform duration-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-200">Pengaturan Admin</h4>
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded uppercase">
                            Admin Only
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Master shift, 17 unit lab, Supabase DB &amp; audit log
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Pengaturan Admin hanya dapat diakses akun berstatus Administrator.</span>
                  </div>
                )}
              </div>

              {/* Other Navigation Shortcuts */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                  Menu Operasional Lainnya:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigate('/jadwal');
                      setMobileDrawerOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition"
                  >
                    <CalendarDays className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="font-semibold text-slate-200 text-xs">Jadwal Shift</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/serah-terima');
                      setMobileDrawerOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-slate-200 text-xs">Serah Terima</span>
                    </div>
                    {pendingHandoversCount > 0 && (
                      <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                        {pendingHandoversCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      navigate('/petugas');
                      setMobileDrawerOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition"
                  >
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-slate-200 text-xs">Daftar Petugas</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/riwayat');
                      setMobileDrawerOpen(false);
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition"
                  >
                    <History className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="font-semibold text-slate-200 text-xs">Riwayat Operan</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Switch Profile (Simulasi) - KHUSUS ADMIN */}
              {canSimulate && (
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setShowSimulateList(!showSimulateList)}
                    className="w-full flex items-center justify-between py-1.5 px-1 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <span className="text-[11px] font-semibold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      Simulasi Akun Petugas ({allProfiles.length} terdaftar)
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSimulateList ? 'rotate-180' : ''}`} />
                  </button>

                  {showSimulateList && (
                    <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {allProfiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchProfile(p.id);
                            setMobileDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                            p.id === activeProfile.id
                              ? 'bg-teal-600/30 border border-teal-500/40 text-teal-200 font-semibold'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Avatar profile={p} size="xs" />
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
                  )}
                </div>
              )}

              {/* In-app PWA install action banner */}
              <div className="pt-2">
                <PWAInstallButton />
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Waktu Server (Pontianak):</span>
              <span className="font-mono text-teal-300 font-semibold">{currentTime} WIB</span>
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
        <div className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 lg:p-6">
          {/* Active Simulation Indicator Banner for Admin */}
          {isSimulating && (
            <div className="mb-4 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/40 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm text-amber-950 animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-amber-900">Mode Simulasi Pengujian: </span>
                  <span className="text-slate-700">
                    Anda sedang menguji tampilan sebagai <strong>{activeProfile.full_name}</strong> ({activeProfile.role === 'admin' ? 'Administrator' : 'Petugas ATLM'}).
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={stopSimulation}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Kembali ke Akun Admin Saya</span>
              </button>
            </div>
          )}
          {children}
        </div>
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

          {/* 4. Tukar Shift */}
          <NavLink
            to="/tukar-shift"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <RefreshCw className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Tukar</span>
          </NavLink>

          {/* 5. Profil / Admin */}
          <NavLink
            to="/profil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[48px] relative ${
                isActive || location.pathname === '/admin' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <div className="relative">
              <User className="w-5 h-5 mb-0.5" />
              {isAdmin && (
                <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">
              {isAdmin ? 'Profil/Admin' : 'Profil'}
            </span>
          </NavLink>
        </div>
      </nav>
      <TodayShiftAlarmModal />
      <OfflineIndicator />
    </div>
  );
};

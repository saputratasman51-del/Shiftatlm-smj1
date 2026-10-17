import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  UserCheck,
  FileCheck2,
  AlertTriangle,
  ListTodo,
  ArrowRight,
  PlusCircle,
  History,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Building,
  CheckCircle,
  Activity,
  Layers,
  Users,
  RefreshCw,
  User,
  Settings,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import {
  dataService,
  getPontianakDateString,
  getPontianakTimeString,
  getCurrentDutyShiftInfo,
  ActiveDutyInfo,
} from '../services/dataService';
import { ShiftAssignment, Handover, PendingTask, Shift, HandoverCategory, UserProfile } from '../types';
import { Avatar } from '../components/Avatar';
import { SwapReminderBanner } from '../components/SwapReminderBanner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  Line,
  ComposedChart,
} from 'recharts';

export default function Dashboard() {
  const { activeProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [todayAssignments, setTodayAssignments] = useState<ShiftAssignment[]>(() =>
    dataService.getCachedAssignments({ date: getPontianakDateString() })
  );
  const [allShifts, setAllShifts] = useState<Shift[]>(() => dataService.getCachedShifts());
  const [allHandovers, setAllHandovers] = useState<Handover[]>(() => dataService.getCachedHandovers());
  const [allCategories, setAllCategories] = useState<HandoverCategory[]>(() => dataService.getCachedCategories());
  const [recentHandovers, setRecentHandovers] = useState<Handover[]>(() =>
    dataService.getCachedHandovers().slice(0, 5)
  );
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>(() =>
    dataService.getCachedPendingTasks().filter((t) => t.status !== 'selesai' && t.status !== 'dibatalkan')
  );
  const [myShiftToday, setMyShiftToday] = useState<ShiftAssignment | null>(() => {
    const cachedToday = dataService.getCachedAssignments({ date: getPontianakDateString() });
    return cachedToday.find((a) => a.profile_id === activeProfile.id && a.status !== 'cancelled') || null;
  });
  const [shiftPartners, setShiftPartners] = useState<ShiftAssignment[]>(() => {
    const cachedToday = dataService.getCachedAssignments({ date: getPontianakDateString() });
    const mine = cachedToday.find((a) => a.profile_id === activeProfile.id && a.status !== 'cancelled');
    if (!mine) return [];
    return cachedToday.filter((a) => a.shift_id === mine.shift_id && a.profile_id !== activeProfile.id && a.status !== 'cancelled');
  });
  const [currentDutyInfo, setCurrentDutyInfo] = useState<ActiveDutyInfo | null>(() => {
    return getCurrentDutyShiftInfo(dataService.getCachedShifts());
  });
  const [currentActiveShift, setCurrentActiveShift] = useState<Shift | null>(() => {
    const cachedShifts = dataService.getCachedShifts();
    const dutyInfo = getCurrentDutyShiftInfo(cachedShifts);
    return dutyInfo.activeShift || cachedShifts[0] || null;
  });
  const [onDutyStaffNow, setOnDutyStaffNow] = useState<ShiftAssignment[]>(() => {
    const cachedShifts = dataService.getCachedShifts();
    const dutyInfo = getCurrentDutyShiftInfo(cachedShifts);
    const cachedAssignments = dataService.getCachedAssignments({ date: dutyInfo.dutyDate });
    if (!dutyInfo.activeShift) return [];
    return cachedAssignments.filter(
      (a) => a.shift_id === dutyInfo.activeShift!.id && a.shift_date === dutyInfo.dutyDate && a.status !== 'cancelled'
    );
  });
  const [loading, setLoading] = useState(false);
  const [unreadHandoverWarning, setUnreadHandoverWarning] = useState<Handover | null>(() => {
    return dataService.getCachedHandovers().find((h) => h.status === 'pending') || null;
  });
  const [contactAdminModal, setContactAdminModal] = useState(false);

  // Chart configuration state
  const [chartYearFilter, setChartYearFilter] = useState<'all' | '2026' | '2025'>('2026');
  const [chartMetricView, setChartMetricView] = useState<'composed' | 'status' | 'shifts' | 'patients'>('composed');

  const categoryChartData = React.useMemo(() => {
    const completedHandovers = allHandovers.filter((h) => h.status === 'received');
    const map: Record<string, { name: string; totalPatients: number; count: number }> = {};

    allCategories.forEach((cat) => {
      map[cat.id] = { name: cat.name, totalPatients: 0, count: 0 };
    });

    completedHandovers.forEach((ho) => {
      if (ho.categories_data) {
        Object.entries(ho.categories_data).forEach(([catId, data]) => {
          if (!map[catId]) {
            const catObj = allCategories.find((c) => c.id === catId);
            map[catId] = { name: catObj?.name || catId, totalPatients: 0, count: 0 };
          }
          map[catId].totalPatients += Number(data.patient_count) || 0;
          map[catId].count += 1;
        });
      }
    });

    return Object.values(map).filter((item) => item.totalPatients > 0 || item.count > 0);
  }, [allHandovers, allCategories]);

  // Comprehensive monthly handover statistics
  const monthlyChartData = React.useMemo(() => {
    const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const shortMonthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    const filtered = allHandovers.filter((ho) => {
      const dateStr = ho.shift_date || ho.created_at?.slice(0, 10) || '2026-01-01';
      if (chartYearFilter === 'all') return true;
      return dateStr.startsWith(chartYearFilter);
    });

    const map: Record<
      string,
      {
        monthKey: string;
        month: string;
        monthFull: string;
        totalHandovers: number;
        receivedCount: number;
        pendingCount: number;
        pagiCount: number;
        siangCount: number;
        malamCount: number;
        totalPatients: number;
        avgPatients: number;
        completionRate: number;
      }
    > = {};

    filtered.forEach((ho) => {
      const dateStr = ho.shift_date || ho.created_at?.slice(0, 10) || '2026-01-01';
      const monthKey = dateStr.slice(0, 7); // YYYY-MM
      if (!map[monthKey]) {
        const [y, m] = monthKey.split('-');
        const mNum = parseInt(m, 10);
        const shortName = shortMonthNames[mNum] || m;
        const fullName = monthNames[mNum] || m;
        map[monthKey] = {
          monthKey,
          month: `${shortName} '${y.slice(2)}`,
          monthFull: `${fullName} ${y}`,
          totalHandovers: 0,
          receivedCount: 0,
          pendingCount: 0,
          pagiCount: 0,
          siangCount: 0,
          malamCount: 0,
          totalPatients: 0,
          avgPatients: 0,
          completionRate: 0,
        };
      }

      map[monthKey].totalHandovers += 1;
      if (ho.status === 'received') {
        map[monthKey].receivedCount += 1;
      } else {
        map[monthKey].pendingCount += 1;
      }

      const shiftFromCode = ho.shift_from?.code || (ho.shift_from_id === 'shift-pagi' ? 'PAGI' : ho.shift_from_id === 'shift-siang' ? 'SIANG' : 'MALAM');
      if (shiftFromCode === 'PAGI') map[monthKey].pagiCount += 1;
      else if (shiftFromCode === 'SIANG') map[monthKey].siangCount += 1;
      else map[monthKey].malamCount += 1;

      map[monthKey].totalPatients += Number(ho.total_patients) || 0;
    });

    const result = Object.keys(map)
      .sort()
      .map((key) => {
        const item = map[key];
        item.avgPatients = item.totalHandovers > 0 ? Math.round(item.totalPatients / item.totalHandovers) : 0;
        item.completionRate = item.totalHandovers > 0 ? Math.round((item.receivedCount / item.totalHandovers) * 100) : 0;
        return item;
      });

    return result;
  }, [allHandovers, chartYearFilter]);

  // Overall KPI statistics from monthly handovers
  const overallMonthlyStats = React.useMemo(() => {
    const totalHo = monthlyChartData.reduce((acc, m) => acc + m.totalHandovers, 0);
    const totalRec = monthlyChartData.reduce((acc, m) => acc + m.receivedCount, 0);
    const totalPen = monthlyChartData.reduce((acc, m) => acc + m.pendingCount, 0);
    const totalPat = monthlyChartData.reduce((acc, m) => acc + m.totalPatients, 0);
    const avgPat = totalHo > 0 ? (totalPat / totalHo).toFixed(1) : '0';
    const completionPercent = totalHo > 0 ? Math.round((totalRec / totalHo) * 100) : 0;

    return {
      totalHo,
      totalRec,
      totalPen,
      totalPat,
      avgPat,
      completionPercent,
      activeMonthsCount: monthlyChartData.length,
    };
  }, [monthlyChartData]);

  const [selectedMonthForStaff, setSelectedMonthForStaff] = useState(getPontianakDateString().slice(0, 7));
  const [monthlyAssignments, setMonthlyAssignments] = useState<ShiftAssignment[]>([]);
  const [allProfilesList, setAllProfilesList] = useState<UserProfile[]>([]);

  useEffect(() => {
    dataService.getProfiles().then(setAllProfilesList);
    dataService.getAssignments({ month: selectedMonthForStaff }).then(setMonthlyAssignments);
  }, [selectedMonthForStaff]);

  const staffShiftChartData = React.useMemo(() => {
    const map: Record<string, { name: string; pagi: number; siang: number; malam: number; khusus: number; total: number }> = {};

    allProfilesList.forEach((p) => {
      const parts = p.full_name.split(',');
      const cleanName = parts[0].trim();
      map[p.id] = { name: cleanName, pagi: 0, siang: 0, malam: 0, khusus: 0, total: 0 };
    });

    monthlyAssignments.forEach((a) => {
      if (a.status === 'cancelled') return;
      const pid = a.profile_id;
      if (!pid) return;
      if (!map[pid]) {
        const prof = a.profile;
        const pName = prof ? prof.full_name.split(',')[0].trim() : 'Petugas';
        map[pid] = { name: pName, pagi: 0, siang: 0, malam: 0, khusus: 0, total: 0 };
      }
      if (map[pid]) {
        map[pid].total += 1;
        const sCode = a.shift?.code || '';
        if (sCode === 'PAGI') map[pid].pagi += 1;
        else if (sCode === 'SIANG') map[pid].siang += 1;
        else if (sCode === 'MALAM') map[pid].malam += 1;
        else if (sCode === 'KHUSUS') map[pid].khusus += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [monthlyAssignments, allProfilesList]);

  const todayStr = getPontianakDateString();
  const currentTime = getPontianakTimeString();

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Pontianak',
  });

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboardData', todayStr, activeProfile.id],
    queryFn: async () => {
      const [assignments, shifts, handovers, tasks, categories] = await Promise.all([
        dataService.getAssignments({ date: todayStr }),
        dataService.getShifts(),
        dataService.getHandovers({ limit: 100 }),
        dataService.getPendingTasks({ activeOnly: true }),
        dataService.getCategories(),
      ]);

      const dutyInfo = getCurrentDutyShiftInfo(shifts);
      let onDutyAssignments = assignments;
      if (dutyInfo.isNightShiftPostMidnight) {
        const yesterdayAssignments = await dataService.getAssignments({ date: dutyInfo.dutyDate });
        onDutyAssignments = yesterdayAssignments;
      }

      const onDuty = dutyInfo.activeShift
        ? onDutyAssignments.filter(
            (a) => a.shift_id === dutyInfo.activeShift!.id && a.shift_date === dutyInfo.dutyDate && a.status !== 'cancelled'
          )
        : [];

      const myOngoingNight = dutyInfo.isNightShiftPostMidnight
        ? onDutyAssignments.find(
            (a) =>
              a.profile_id === activeProfile.id &&
              a.shift_date === dutyInfo.dutyDate &&
              a.shift_id === dutyInfo.activeShift?.id &&
              a.status !== 'cancelled'
          )
        : null;
      const myTodayScheduled = assignments.find((a) => a.profile_id === activeProfile.id && a.status !== 'cancelled');
      const mine = myOngoingNight || myTodayScheduled || null;

      const partners = mine
        ? (myOngoingNight ? onDutyAssignments : assignments).filter(
            (a) =>
              a.shift_id === mine.shift_id &&
              a.shift_date === mine.shift_date &&
              a.profile_id !== activeProfile.id &&
              a.status !== 'cancelled'
          )
        : [];

      const warningHo = handovers.find((h) => h.status === 'pending');

      return {
        assignments,
        shifts,
        handovers,
        tasks,
        categories,
        dutyInfo,
        activeShift: dutyInfo.activeShift || shifts[0],
        onDuty,
        mine,
        partners,
        warningHo,
      };
    },
    initialData: () => {
      const cachedAssignments = dataService.getCachedAssignments({ date: todayStr });
      const cachedShifts = dataService.getCachedShifts();
      const cachedHandovers = dataService.getCachedHandovers();
      const cachedTasks = dataService.getCachedPendingTasks();
      const cachedCategories = dataService.getCachedCategories();
      const dutyInfo = getCurrentDutyShiftInfo(cachedShifts);
      const mine = cachedAssignments.find((a) => a.profile_id === activeProfile.id && a.status !== 'cancelled') || null;
      const partners = mine
        ? cachedAssignments.filter(
            (a) => a.shift_id === mine.shift_id && a.profile_id !== activeProfile.id && a.status !== 'cancelled'
          )
        : [];
      return {
        assignments: cachedAssignments,
        shifts: cachedShifts,
        handovers: cachedHandovers,
        tasks: cachedTasks,
        categories: cachedCategories,
        dutyInfo,
        activeShift: dutyInfo.activeShift || cachedShifts[0],
        onDuty: [],
        mine,
        partners,
        warningHo: cachedHandovers.find((h) => h.status === 'pending') || undefined,
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  React.useEffect(() => {
    if (dashboardData) {
      setTodayAssignments(dashboardData.assignments);
      setAllShifts(dashboardData.shifts);
      setAllHandovers(dashboardData.handovers);
      setAllCategories(dashboardData.categories);
      setRecentHandovers(dashboardData.handovers.slice(0, 5));
      setPendingTasks(dashboardData.tasks.filter((t) => t.status !== 'selesai' && t.status !== 'dibatalkan'));
      setCurrentDutyInfo(dashboardData.dutyInfo);
      setCurrentActiveShift(dashboardData.activeShift);
      setOnDutyStaffNow(dashboardData.onDuty);
      setMyShiftToday(dashboardData.mine);
      setShiftPartners(dashboardData.partners);
      setUnreadHandoverWarning(dashboardData.warningHo || null);
      setLoading(false);
    }
  }, [dashboardData]);

  useEffect(() => {
    let debounceTimer: any = null;
    const unsubscribe = dataService.subscribe((event) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refetch();
        if (event?.table === 'profiles' || event?.table === 'ALL') {
          dataService.getProfiles().then(setAllProfilesList);
        }
        if (event?.table === 'shift_assignments' || event?.table === 'ALL') {
          dataService.getAssignments({ month: selectedMonthForStaff }).then(setMonthlyAssignments);
        }
      }, 350);
    });

    return () => {
      clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [selectedMonthForStaff, refetch]);

  // Ringkasan Jadwal Harian Hari Ini (Pagi, Siang, Malam)
  const dailyShiftSummary = React.useMemo(() => {
    const map: Record<string, { shiftId: string; shiftName: string; colorCode: string; timeRange: string; staffList: ShiftAssignment[] }> = {};

    allShifts.forEach((s) => {
      map[s.id] = {
        shiftId: s.id,
        shiftName: s.name,
        colorCode: s.color_code || '#0d9488',
        timeRange: s.start_time && s.end_time ? `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)} WIB` : '',
        staffList: [],
      };
    });

    todayAssignments.forEach((a) => {
      if (a.status === 'cancelled') return;
      const sId = a.shift_id;
      if (!map[sId] && a.shift) {
        map[sId] = {
          shiftId: sId,
          shiftName: a.shift.name,
          colorCode: a.shift.color_code || '#0d9488',
          timeRange: a.shift.start_time && a.shift.end_time ? `${a.shift.start_time.slice(0, 5)} - ${a.shift.end_time.slice(0, 5)} WIB` : '',
          staffList: [],
        };
      }
      if (map[sId]) {
        map[sId].staffList.push(a);
      }
    });

    return Object.values(map);
  }, [todayAssignments, allShifts]);

  if (isLoading && todayAssignments.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* =========================================================================
          HERO BANNER & GREETING
      ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <Avatar profile={activeProfile} size="lg" className="ring-2 ring-teal-400/40" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Sistem Operasional Laboratorium
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">· {formattedDate}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Selamat Bertugas, {activeProfile.full_name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-xl">
                Instalasi Laboratorium Medik & Bank Darah RSUD Sultan Muhammad Jamaludin I Kabupaten Kayong Utara.
              </p>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">
                {currentDutyInfo?.isNightShiftPostMidnight ? 'Shift Malam Berjalan' : 'Shift Aktif Rumah Sakit'}
              </p>
              <p className="text-sm font-bold text-teal-300">
                {currentActiveShift ? currentActiveShift.name : 'Shift Pagi'}
              </p>
              {onDutyStaffNow.length > 0 && (
                <p className="text-[10px] text-emerald-300 font-medium truncate max-w-[180px]">
                  Jaga Sekarang: {onDutyStaffNow.map((o) => o.profile?.full_name?.split(' ')[0] || 'Petugas').join(', ')}
                </p>
              )}
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-mono font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Quick action buttons row (Fast Access on Mobile & Desktop) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              Akses Cepat Menu Mobile &amp; Operasional:
            </span>
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2">
            {/* Tukar Shift */}
            <button
              onClick={() => navigate('/tukar-shift')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-900/80 to-slate-800 hover:bg-slate-700 text-teal-200 text-xs font-bold py-2.5 px-2.5 rounded-xl border border-teal-500/40 transition-all min-h-[44px] shadow-sm active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Tukar Shift</span>
            </button>

            {/* Profil Petugas */}
            <button
              onClick={() => navigate('/profil')}
              className="flex items-center justify-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-2.5 rounded-xl border border-slate-700/80 transition-colors min-h-[44px] active:scale-95 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Profil Saya</span>
            </button>

            {/* Pengaturan Admin (Highlighted if Admin) */}
            {isAdmin ? (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-950/80 to-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold py-2.5 px-2.5 rounded-xl border border-amber-500/50 transition-all min-h-[44px] shadow-sm ring-1 ring-amber-500/30 active:scale-95 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Admin Mode</span>
              </button>
            ) : (
              <button
                onClick={() => setContactAdminModal(true)}
                className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-2.5 rounded-xl border border-slate-700/60 transition-colors min-h-[44px] active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Hubungi Admin</span>
              </button>
            )}

            {/* Jadwal */}
            <button
              onClick={() => navigate('/jadwal')}
              className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-2.5 rounded-xl border border-slate-700/60 transition-colors min-h-[44px] active:scale-95 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="truncate">Jadwal</span>
            </button>

            {/* Serah Terima (Operan) */}
            <button
              onClick={() => navigate('/serah-terima')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-2.5 rounded-xl shadow-md shadow-teal-950/50 transition-all min-h-[44px] active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Operan</span>
            </button>

            {/* Riwayat */}
            <button
              onClick={() => navigate('/riwayat')}
              className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-2.5 rounded-xl border border-slate-700/60 transition-colors min-h-[44px] active:scale-95 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Riwayat</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PENGINGAT PERTUKARAN SHIFT AKTIF (UNTUK SELURUH PETUGAS SAMPAI HARI H)
      ========================================================================= */}
      <SwapReminderBanner />

      {/* =========================================================================
          WARNING ALERT: PENDING HANDOVER
      ========================================================================= */}
      {unreadHandoverWarning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-pulse-slow">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-amber-950">
              Perhatian: Serah Terima Menunggu Konfirmasi Penerimaan!
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Terdapat dokumen serah terima jaga dari <strong>{unreadHandoverWarning.giver?.full_name || 'Petugas'}</strong>{' '}
              pada tanggal {unreadHandoverWarning.shift_date} yang belum dikonfirmasi oleh petugas shift berikutnya.
            </p>
          </div>
          <button
            onClick={() => navigate(`/serah-terima?id=${unreadHandoverWarning.id}`)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0 transition-colors"
          >
            Buka & Konfirmasi
          </button>
        </div>
      )}

      {/* =========================================================================
          GRID: TODAY'S SHIFT & REKAN KERJA
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Status Shift Saya Hari Ini */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                Shift Saya Hari Ini
              </span>
              <span className="text-xs text-slate-400 font-mono">{todayStr}</span>
            </div>

            <div className="my-4">
              {myShiftToday && myShiftToday.shift ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: myShiftToday.shift.color_code }}
                    />
                    <h3 className="text-lg font-extrabold text-slate-900">{myShiftToday.shift.name}</h3>
                  </div>
                  <div className="inline-block bg-slate-100 text-slate-700 font-mono text-xs px-2.5 py-1 rounded-lg">
                    Jam Dinas: {myShiftToday.shift.start_time.slice(0, 5)} - {myShiftToday.shift.end_time.slice(0, 5)} WIB
                  </div>
                  {myShiftToday.notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      Catatan: {myShiftToday.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Tidak Ada Jadwal Shift Hari Ini</p>
                  <p className="text-xs text-slate-500 mt-0.5">Anda sedang libur atau dinas fleksibel.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/jadwal')}
            className="w-full mt-2 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Buka Kalender Shift</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Rekan Satu Shift Hari Ini */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Rekan Satu Shift
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {shiftPartners.length} Petugas
              </span>
            </div>

            <div className="my-3 space-y-2">
              {shiftPartners.length > 0 ? (
                shiftPartners.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                  >
                    <Avatar profile={p.profile} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.profile?.full_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{p.profile?.position || 'ATLM Pelaksana'}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Aktif
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-slate-500">
                    {myShiftToday ? 'Belum ada rekan shift lain yang terdaftar.' : 'Pilih shift Anda untuk melihat rekan.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/petugas')}
            className="w-full mt-2 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/80 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Daftar Seluruh Petugas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Ringkasan Tugas Cito & Tertunda */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-amber-600" />
                Pekerjaan Tertunda
              </span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                {pendingTasks.length} Pending
              </span>
            </div>

            <div className="my-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {pendingTasks.length > 0 ? (
                pendingTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">{task.task_type}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          task.priority === 'tinggi_cito'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : task.priority === 'sedang'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {task.priority === 'tinggi_cito' ? 'CITO' : task.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">{task.description}</p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">Semua Tugas Berjalan Lancar</p>
                  <p className="text-[11px] text-slate-400">Tidak ada pekerjaan tertunda atau kendala.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/serah-terima#tasks')}
            className="w-full mt-2 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Kelola Pekerjaan Tertunda</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          RINGKASAN JADWAL HARIAN HARI INI (PAGI, SIANG, MALAM)
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Ringkasan Jadwal Harian Hari Ini
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar petugas yang sedang bertugas di shift Pagi, Siang, dan Malam tanggal <span className="font-mono font-semibold text-slate-700">{todayStr}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/jadwal')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>Kelola Jadwal Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dailyShiftSummary.length > 0 ? (
            dailyShiftSummary.map((shiftGroup) => (
              <div
                key={shiftGroup.shiftId}
                className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: shiftGroup.colorCode }}
                      />
                      <span className="text-xs font-extrabold text-slate-900">{shiftGroup.shiftName}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {shiftGroup.staffList.length} Petugas
                    </span>
                  </div>

                  {shiftGroup.timeRange && (
                    <p className="text-[10px] font-mono text-slate-500 mb-2.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {shiftGroup.timeRange}
                    </p>
                  )}

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {shiftGroup.staffList.length > 0 ? (
                      shiftGroup.staffList.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200/60 shadow-2xs"
                        >
                          <Avatar profile={assignment.profile} size="xs" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {assignment.profile?.full_name || 'Petugas'}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {assignment.profile?.position || 'ATLM'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-slate-400 text-xs italic">
                        Belum ada petugas terjadwal
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-slate-400 text-xs">
              Belum ada data shift yang dikonfigurasi untuk hari ini.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RECENT HANDOVERS & ACTIVITIES
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-teal-600" />
              Aktivitas Serah Terima Jaga Terbaru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dokumen operan shift digital laboratorium RSUD Sultan Muhammad Jamaludin I
            </p>
          </div>
          <button
            onClick={() => navigate('/riwayat')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            <span>Semua Riwayat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {recentHandovers.length > 0 ? (
            recentHandovers.map((ho) => (
              <div
                key={ho.id}
                onClick={() => navigate(`/serah-terima?id=${ho.id}`)}
                className="py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    {ho.shift_from?.name?.slice(6, 7) || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {ho.shift_from?.name || 'Shift Asal'} &rarr; {ho.shift_to?.name || 'Shift Tujuan'}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ho.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ho.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ho.status === 'received'
                          ? 'Diterima'
                          : ho.status === 'pending'
                          ? 'Menunggu Penerimaan'
                          : 'Draft'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Penyerah: <span className="font-semibold text-slate-700">{ho.giver?.full_name || 'Petugas'}</span> ·{' '}
                      Tanggal: <span className="font-mono text-slate-700">{ho.shift_date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Total: <strong className="text-slate-900 font-mono">{ho.total_patients}</strong> Pasien
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada arsip serah terima jaga. Klik tombol &ldquo;Serah Terima&rdquo; untuk memulai.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          DASHBOARD VISUAL: STATISTIK JUMLAH SERAH TERIMA SHIFT PER BULAN (RECHARTS)
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-6">
        {/* Header & Interactive Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Statistik Jumlah Serah Terima Shift per Bulan
                </h3>
                <span className="text-[10px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">
                  Recharts Visual
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dashboard visual pemantauan frekuensi operan shift jaga, status verifikasi, beban pasien, dan tren bulanan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setChartMetricView('composed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetricView === 'composed'
                    ? 'bg-white text-teal-800 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Gabungan &amp; Pasien
              </button>
              <button
                type="button"
                onClick={() => setChartMetricView('status')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetricView === 'status'
                    ? 'bg-white text-teal-800 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Status Penerimaan
              </button>
              <button
                type="button"
                onClick={() => setChartMetricView('shifts')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetricView === 'shifts'
                    ? 'bg-white text-teal-800 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Distribusi Shift
              </button>
              <button
                type="button"
                onClick={() => setChartMetricView('patients')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartMetricView === 'patients'
                    ? 'bg-white text-teal-800 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Tren Pasien
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={chartYearFilter}
                onChange={(e) => setChartYearFilter(e.target.value as any)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
                <option value="all">Semua Tahun</option>
              </select>
            </div>

            <button
              onClick={() => navigate('/serah-terima')}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Operan</span>
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 p-4 rounded-xl border border-teal-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-teal-800">Total Serah Terima</span>
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{overallMonthlyStats.totalHo}</span>
              <span className="text-xs text-teal-700 font-medium">dokumen</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Tercatat di {overallMonthlyStats.activeMonthsCount} periode bulan
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800">Diterima Resmi</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 font-mono">{overallMonthlyStats.totalRec}</span>
              <span className="text-xs text-emerald-600 font-medium font-mono">({overallMonthlyStats.completionPercent}%)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Tervalidasi &amp; disetujui petugas jaga
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 rounded-xl border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800">Menunggu Penerimaan</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700 font-mono">{overallMonthlyStats.totalPen}</span>
              <span className="text-xs text-amber-600 font-medium">pending</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {overallMonthlyStats.totalPen > 0 ? 'Perlu konfirmasi di menu operan' : 'Semua serah terima telah diterima'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-800">Total Pasien Terlayani</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-900 font-mono">{overallMonthlyStats.totalPat}</span>
              <span className="text-xs text-indigo-600 font-medium">pasien</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Rata-rata ~{overallMonthlyStats.avgPat} pasien per serah terima
            </p>
          </div>
        </div>

        {/* Recharts Chart Canvas with Active Mode */}
        <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-800">
                {chartMetricView === 'composed' && 'Grafik Batang Jumlah Serah Terima (Diterima vs Pending) & Garis Tren Pasien per Bulan'}
                {chartMetricView === 'status' && 'Grafik Batang Bertingkat Status Serah Terima per Bulan (Diterima vs Menunggu)'}
                {chartMetricView === 'shifts' && 'Distribusi Jumlah Serah Terima per Bulan Berdasarkan Shift Asal (Pagi / Siang / Malam)'}
                {chartMetricView === 'patients' && 'Grafik Area Tren Akumulasi Beban Pasien Pemeriksaan Laboratorium per Bulan'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              {chartMetricView === 'composed' && (
                <>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-teal-600 inline-block" /> Diterima
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> Menunggu
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-1.5 rounded-full bg-indigo-600 inline-block" /> Pasien
                  </span>
                </>
              )}
              {chartMetricView === 'status' && (
                <>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-teal-600 inline-block" /> Diterima Resmi
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> Menunggu Konfirmasi
                  </span>
                </>
              )}
              {chartMetricView === 'shifts' && (
                <>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-sky-600 inline-block" /> Shift Pagi
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-amber-600 inline-block" /> Shift Siang
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" /> Shift Malam
                  </span>
                </>
              )}
              {chartMetricView === 'patients' && (
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" /> Beban Pasien Terlayani
                </span>
              )}
            </div>
          </div>

          <div className="h-80 w-full">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartMetricView === 'composed' ? (
                  <ComposedChart data={monthlyChartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#6366f1' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[210px]">
                              <p className="font-bold text-slate-100 border-b border-slate-800 pb-1 flex items-center justify-between">
                                <span>{d.monthFull}</span>
                                <span className="font-mono text-teal-400 font-bold">{d.totalHandovers} Serah Terima</span>
                              </p>
                              <div className="space-y-1 pt-0.5 text-[11px]">
                                <div className="flex justify-between items-center text-emerald-400">
                                  <span>Diterima Resmi:</span>
                                  <span className="font-mono font-bold">{d.receivedCount} ({d.completionRate}%)</span>
                                </div>
                                <div className="flex justify-between items-center text-amber-400">
                                  <span>Menunggu Penerimaan:</span>
                                  <span className="font-mono font-bold">{d.pendingCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sky-300">
                                  <span>Shift (Pagi/Siang/Malam):</span>
                                  <span className="font-mono">{d.pagiCount} / {d.siangCount} / {d.malamCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-indigo-300 pt-1 border-t border-slate-800 font-semibold">
                                  <span>Total Pasien:</span>
                                  <span className="font-mono font-bold">{d.totalPatients} pasien (~{d.avgPatients}/shift)</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="receivedCount" name="Diterima Resmi" stackId="ho" fill="#0d9488" radius={[0, 0, 0, 0]} />
                    <Bar yAxisId="left" dataKey="pendingCount" name="Menunggu Konfirmasi" stackId="ho" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="totalPatients" name="Total Pasien" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                ) : chartMetricView === 'status' ? (
                  <BarChart data={monthlyChartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="receivedCount" name="Diterima Resmi" stackId="status" fill="#0d9488" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pendingCount" name="Menunggu Konfirmasi" stackId="status" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : chartMetricView === 'shifts' ? (
                  <BarChart data={monthlyChartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="pagiCount" name="Shift Pagi" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="siangCount" name="Shift Siang" fill="#d97706" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="malamCount" name="Shift Malam" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyChartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="totalPatients" name="Total Pasien Terlayani" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPatients)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <p>Belum ada data serah terima shift pada periode {chartYearFilter === 'all' ? 'ini' : chartYearFilter}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Monthly Breakdown Table */}
        <div className="border border-slate-200/90 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              Tabel Rekapitulasi Serah Terima Shift per Bulan ({chartYearFilter === 'all' ? 'Semua Periode' : chartYearFilter})
            </h4>
            <span className="text-[11px] text-slate-500">
              Total <strong className="text-slate-800">{monthlyChartData.length}</strong> bulan aktif tercatat
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Bulan</th>
                  <th className="py-2.5 px-3 text-center">Jumlah Operan</th>
                  <th className="py-2.5 px-3 text-center">Diterima Resmi</th>
                  <th className="py-2.5 px-3 text-center">Menunggu</th>
                  <th className="py-2.5 px-3 text-center">Shift (P / S / M)</th>
                  <th className="py-2.5 px-3 text-center">Beban Pasien</th>
                  <th className="py-2.5 px-3 text-center">Rata-rata/Shift</th>
                  <th className="py-2.5 px-3 text-center">Tingkat Sukses</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {monthlyChartData.length > 0 ? (
                  monthlyChartData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{row.monthFull}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-teal-700 bg-teal-50/40">
                        {row.totalHandovers}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-700">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                          {row.receivedCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-700">
                        {row.pendingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                            {row.pendingCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 text-[11px]">
                        <span className="text-sky-700">{row.pagiCount}</span> /{' '}
                        <span className="text-amber-700">{row.siangCount}</span> /{' '}
                        <span className="text-indigo-700">{row.malamCount}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {row.totalPatients} <span className="font-sans text-[10px] text-slate-500 font-normal">org</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 text-[11px]">
                        ~{row.avgPatients} <span className="font-sans text-[10px] text-slate-400">pasien</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${row.completionRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-700">{row.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => navigate('/riwayat')}
                          className="text-[11px] font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5 hover:underline"
                        >
                          <span>Arsip</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400 text-xs font-sans">
                      Tidak ada data serah terima shift pada filter tahun ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STATISTIK KATEGORI PEMERIKSAAN PASIEN
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                Serah Terima Selesai per Kategori Pemeriksaan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total jumlah pasien &amp; laporan per kategori laboratorium
              </p>
            </div>
            <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
              {categoryChartData.length} Kategori Aktif
            </span>
          </div>

          <div className="h-72 w-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="totalPatients" name="Total Pasien" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Activity className="w-8 h-8 text-slate-300 mb-2" />
                <p>Belum ada data serah terima kategori yang selesai.</p>
              </div>
            )}
          </div>
        </div>

      {/* =========================================================================
          STATISTIK TOTAL SHIFT PER PETUGAS (BULANAN)
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Statistik Total Shift Petugas dalam Satu Bulan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi jumlah shift (Pagi, Siang, Malam, Khusus) yang dijalankan oleh setiap petugas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Bulan:</span>
            <input
              type="month"
              value={selectedMonthForStaff}
              onChange={(e) => setSelectedMonthForStaff(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="h-80 w-full">
          {staffShiftChartData.length > 0 && staffShiftChartData.some((item) => item.total > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffShiftChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  height={55}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="pagi" name="Shift Pagi" stackId="shifts" fill="#0284c7" />
                <Bar dataKey="siang" name="Shift Siang" stackId="shifts" fill="#d97706" />
                <Bar dataKey="malam" name="Shift Malam" stackId="shifts" fill="#4f46e5" />
                <Bar dataKey="khusus" name="Shift Khusus" stackId="shifts" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <Users className="w-8 h-8 text-slate-300 mb-2" />
              <p>Belum ada data penugasan shift pada bulan {selectedMonthForStaff}.</p>
            </div>
          )}
        </div>

        {/* Legend / Summary Table */}
        <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-2">Nama Petugas</th>
                <th className="pb-2 text-center">Pagi</th>
                <th className="pb-2 text-center">Siang</th>
                <th className="pb-2 text-center">Malam</th>
                <th className="pb-2 text-center">Khusus</th>
                <th className="pb-2 text-right">Total Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {staffShiftChartData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 font-sans font-medium text-slate-800">{item.name}</td>
                  <td className="py-2 text-center text-sky-700">{item.pagi}</td>
                  <td className="py-2 text-center text-amber-700">{item.siang}</td>
                  <td className="py-2 text-center text-indigo-700">{item.malam}</td>
                  <td className="py-2 text-center text-teal-700">{item.khusus}</td>
                  <td className="py-2 text-right font-bold text-slate-900">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: HUBUNGI ADMIN
      ========================================================================= */}
      {contactAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-600" />
              Kontak Administrator Laboratorium
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hubungi Kepala Ruangan atau Penanggung Jawab LIS Laboratorium RSUD Sultan Muhammad Jamaludin I.
            </p>

            <div className="my-4 space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Kepala Instalasi Laboratorium</p>
                <p className="text-xs font-bold text-slate-900">Tasman Saputra, S.Tr.Kes</p>
                <p className="text-xs text-teal-700 font-mono mt-0.5">WhatsApp: 0812-5678-9012</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Telepon Ekstensi Lab RSUD</p>
                <p className="text-xs font-bold text-slate-900">Ext: 114 (Laboratorium Sentral / Bank Darah)</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href="https://wa.me/6281256789012?text=Halo%20Admin%20Laboratorium%20RSUD%20SMJ%20I,%20saya%20petugas%20ATLM%20ingin%20berkoordinasi."
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 rounded-xl text-center transition-colors"
              >
                Chat WhatsApp
              </a>
              <button
                onClick={() => setContactAdminModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

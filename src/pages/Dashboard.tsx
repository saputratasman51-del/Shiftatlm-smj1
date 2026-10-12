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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakDateString, getPontianakTimeString } from '../services/dataService';
import { ShiftAssignment, Handover, PendingTask, Shift, HandoverCategory, UserProfile } from '../types';
import { Avatar } from '../components/Avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const { activeProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [todayAssignments, setTodayAssignments] = useState<ShiftAssignment[]>([]);
  const [myShiftToday, setMyShiftToday] = useState<ShiftAssignment | null>(null);
  const [shiftPartners, setShiftPartners] = useState<ShiftAssignment[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [currentActiveShift, setCurrentActiveShift] = useState<Shift | null>(null);
  const [recentHandovers, setRecentHandovers] = useState<Handover[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [unreadHandoverWarning, setUnreadHandoverWarning] = useState<Handover | null>(null);
  const [contactAdminModal, setContactAdminModal] = useState(false);
  const [allHandovers, setAllHandovers] = useState<Handover[]>([]);
  const [allCategories, setAllCategories] = useState<HandoverCategory[]>([]);

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

  const monthlyChartData = React.useMemo(() => {
    const completedHandovers = allHandovers.filter((h) => h.status === 'received');
    const map: Record<string, { month: string; totalHandovers: number; totalPatients: number }> = {};

    completedHandovers.forEach((ho) => {
      const dateStr = ho.shift_date || ho.created_at?.slice(0, 10) || '2026-01-01';
      const monthKey = dateStr.slice(0, 7); // YYYY-MM
      if (!map[monthKey]) {
        const [y, m] = monthKey.split('-');
        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthName = monthNames[parseInt(m, 10)] || m;
        map[monthKey] = { month: `${monthName} ${y}`, totalHandovers: 0, totalPatients: 0 };
      }
      map[monthKey].totalHandovers += 1;
      map[monthKey].totalPatients += Number(ho.total_patients) || 0;
    });

    return Object.keys(map)
      .sort()
      .map((key) => map[key]);
  }, [allHandovers]);

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

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [assignments, shifts, handovers, tasks, categories] = await Promise.all([
        dataService.getAssignments({ date: todayStr }),
        dataService.getShifts(),
        dataService.getHandovers(),
        dataService.getPendingTasks(),
        dataService.getCategories(),
      ]);

      setTodayAssignments(assignments);
      setAllShifts(shifts);
      setAllHandovers(handovers);
      setAllCategories(categories);
      setRecentHandovers(handovers.slice(0, 5));
      setPendingTasks(tasks.filter((t) => t.status !== 'selesai' && t.status !== 'dibatalkan'));

      // Determine current active shift by current hour
      const currentHour = new Date().getHours();
      let active: Shift | null = null;
      if (currentHour >= 7 && currentHour < 14) {
        active = shifts.find((s) => s.code === 'PAGI') || shifts[0];
      } else if (currentHour >= 14 && currentHour < 21) {
        active = shifts.find((s) => s.code === 'SIANG') || shifts[1];
      } else {
        active = shifts.find((s) => s.code === 'MALAM') || shifts[2];
      }
      setCurrentActiveShift(active || shifts[0]);

      // Check current user's assignment today
      const mine = assignments.find((a) => a.profile_id === activeProfile.id && a.status !== 'cancelled');
      setMyShiftToday(mine || null);

      // Check partners on the same shift
      if (mine) {
        const partners = assignments.filter(
          (a) => a.shift_id === mine.shift_id && a.profile_id !== activeProfile.id && a.status !== 'cancelled'
        );
        setShiftPartners(partners);
      } else {
        setShiftPartners([]);
      }

      // Check for unreceived / pending handovers requiring attention
      const warningHo = handovers.find((h) => h.status === 'pending');
      setUnreadHandoverWarning(warningHo || null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeProfile.id]);

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
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Shift Aktif Rumah Sakit</p>
              <p className="text-sm font-bold text-teal-300">
                {currentActiveShift ? currentActiveShift.name : 'Shift Pagi'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-mono font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Quick action buttons row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => navigate('/jadwal')}
            className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700/60 transition-colors min-h-[44px]"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span>Lihat Jadwal</span>
          </button>

          <button
            onClick={() => navigate('/serah-terima')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-md shadow-teal-950/50 transition-all min-h-[44px]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Serah Terima</span>
          </button>

          <button
            onClick={() => navigate('/riwayat')}
            className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700/60 transition-colors min-h-[44px]"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Riwayat Operan</span>
          </button>

          <button
            onClick={() => setContactAdminModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700/60 transition-colors min-h-[44px]"
          >
            <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Hubungi Admin</span>
          </button>
        </div>
      </div>

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
          DATA VISUALIZATION CHARTS (RECHARTS)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Completed Handovers per Category */}
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

        {/* Chart 2: Completed Handovers per Month */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Ringkasan Serah Terima Selesai per Bulan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Frekuensi serah terima jaga terselesaikan setiap bulannya
              </p>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              {monthlyChartData.length} Bulan Aktif
            </span>
          </div>

          <div className="h-72 w-full">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="totalHandovers" name="Jumlah Serah Terima" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                <p>Belum ada arsip bulanan serah terima jaga.</p>
              </div>
            )}
          </div>
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

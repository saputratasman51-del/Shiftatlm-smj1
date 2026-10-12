import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Filter,
  Search,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Table,
  Sun,
  Heart,
  Volume2,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataService, getPontianakDateString } from '../services/dataService';
import { Shift, ShiftAssignment, UserProfile } from '../types';
import { useToast } from '../components/Toast';
import { playAlarmSound } from '../utils/alarmSound';
import { SwapReminderBanner } from '../components/SwapReminderBanner';

export default function JadwalShift() {
  const { activeProfile, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'list' | 'calendar' | 'matrix'
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'matrix'>('list');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('all');

  // Modal create/edit schedule
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | null>(null);
  const [formData, setFormData] = useState({
    profile_id: '',
    shift_id: '',
    shift_date: getPontianakDateString(),
    status: 'scheduled' as ShiftAssignment['status'],
    notes: '',
  });
  const [formConflictWarning, setFormConflictWarning] = useState<string | null>(null);

  // Detail Modal
  const [detailModalItem, setDetailModalItem] = useState<ShiftAssignment | null>(null);

  // Delete confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Matrix view popup state for one-click shift assignment
  const [matrixCellPopup, setMatrixCellPopup] = useState<{ profileId: string; dateStr: string } | null>(null);

  const handleQuickAssign = async (profileId: string, dateStr: string, shiftId: string | null) => {
    if (!isAdmin) {
      showToast('Akses Dibatasi', 'Hanya administrator yang dapat mengubah jadwal', 'error');
      return;
    }
    const existing = assignments.find((a) => a.profile_id === profileId && a.shift_date === dateStr);

    if (!shiftId) {
      if (existing) {
        await dataService.deleteAssignment(existing.id);
        showToast('Jadwal Dihapus', `Jadwal tanggal ${dateStr} dikosongkan`);
        loadData();
      }
      setMatrixCellPopup(null);
      return;
    }

    const payload: ShiftAssignment = {
      id: existing ? existing.id : `assign-${Date.now()}-${Math.random()}`,
      profile_id: profileId,
      shift_id: shiftId,
      shift_date: dateStr,
      status: 'scheduled',
      created_by: activeProfile.id,
      created_at: existing?.created_at || new Date().toISOString(),
    };

    const res = await dataService.saveAssignment(payload);
    if (!res.success) {
      showToast('Bentrok Jadwal', res.conflict || 'Gagal menyimpan', 'error');
      return;
    }

    showToast('Jadwal Disimpan', `Shift berhasil diperbarui untuk tanggal ${dateStr}`);
    setMatrixCellPopup(null);
    loadData();
  };

  const getDaysInSelectedMonth = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
      const dayName = new Date(year, month, d).toLocaleDateString('id-ID', { weekday: 'short' });
      days.push({ dayNumber: d, dateStr, dayName });
    }
    return days;
  };

  // Holiday Alarm Modal state (for off-duty staff opening schedule)
  const [isHolidayToday, setIsHolidayToday] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [hasTriggeredHolidayAlarm, setHasTriggeredHolidayAlarm] = useState(false);

  const todayDateStr = getPontianakDateString();

  const handleOpenHolidayModal = () => {
    setShowHolidayModal(true);
    playAlarmSound('holiday');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAssignments, allShifts, allProfiles] = await Promise.all([
        dataService.getAssignments({ month: selectedMonth }),
        dataService.getShifts(),
        dataService.getProfiles(),
      ]);
      setAssignments(allAssignments);
      setShifts(allShifts);
      setProfiles(allProfiles);

      // Check if logged in staff is off duty today
      const myTodayShift = allAssignments.find(
        (a) => a.profile_id === activeProfile.id && a.shift_date === todayDateStr && a.status !== 'cancelled'
      );
      const isOffDuty = !myTodayShift;
      setIsHolidayToday(isOffDuty);

      if (isOffDuty && !hasTriggeredHolidayAlarm) {
        setHasTriggeredHolidayAlarm(true);
        const storageKey = `holiday_schedule_alarm_${activeProfile.id}_${todayDateStr}`;
        if (!sessionStorage.getItem(storageKey)) {
          setShowHolidayModal(true);
          sessionStorage.setItem(storageKey, 'true');
          playAlarmSound('holiday');
        }
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates across all devices
    const unsubscribe = dataService.subscribe((event) => {
      if (
        event.table === 'shift_assignments' ||
        event.table === 'shifts' ||
        event.table === 'profiles' ||
        event.table === 'shift_swaps' ||
        event.table === 'ALL'
      ) {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [selectedMonth]);

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchSearch =
      !searchQuery ||
      a.profile?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStaff = selectedStaffFilter === 'all' || a.profile_id === selectedStaffFilter;
    const matchShift = selectedShiftFilter === 'all' || a.shift_id === selectedShiftFilter;
    return matchSearch && matchStaff && matchShift;
  });

  // Open modal for creating new assignment
  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    setFormData({
      profile_id: profiles[0]?.id || '',
      shift_id: shifts[0]?.id || '',
      shift_date: getPontianakDateString(),
      status: 'scheduled',
      notes: '',
    });
    setFormConflictWarning(null);
    setModalOpen(true);
  };

  // Open modal for editing assignment
  const handleOpenEditModal = (assignment: ShiftAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      profile_id: assignment.profile_id,
      shift_id: assignment.shift_id,
      shift_date: assignment.shift_date,
      status: assignment.status,
      notes: assignment.notes || '',
    });
    setFormConflictWarning(null);
    setModalOpen(true);
  };

  // Save assignment
  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormConflictWarning(null);

    const payload: ShiftAssignment = {
      id: editingAssignment ? editingAssignment.id : `assign-${Date.now()}`,
      profile_id: formData.profile_id,
      shift_id: formData.shift_id,
      shift_date: formData.shift_date,
      status: formData.status,
      notes: formData.notes,
      created_by: activeProfile.id,
      created_at: editingAssignment?.created_at || new Date().toISOString(),
    };

    const res = await dataService.saveAssignment(payload);
    if (!res.success) {
      setFormConflictWarning(res.conflict || 'Terjadi bentrok jadwal!');
      return;
    }

    showToast(
      editingAssignment ? 'Jadwal Diperbarui' : 'Jadwal Dibuat',
      `Jadwal shift berhasil disimpan untuk tanggal ${payload.shift_date}`
    );
    setModalOpen(false);
    loadData();
  };

  // Cancel / Delete assignment
  const handleDeleteAssignment = async (id: string) => {
    await dataService.deleteAssignment(id);
    showToast('Jadwal Dihapus', 'Jadwal shift berhasil dihapus dari sistem');
    setDeleteConfirmId(null);
    loadData();
  };

  // Calendar matrix calculation
  const getCalendarDays = () => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Adjust so Monday is 0
    const startOffset = (firstDay + 6) % 7;
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr: dayDateStr });
    }
    return days;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* =========================================================================
          PAGE HEADER & CONTROLS
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Jadwal Shift Petugas ATLM</h1>
            <span className="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              WIB (Asia/Pontianak)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen pembagian jadwal dinas jaga laboratorium RSUD Sultan Muhammad Jamaludin I
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* View toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matriks</span>
            </button>
          </div>

          {/* Add schedule button (Admin only or all with override) */}
          {isAdmin && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2 px-3.5 rounded-xl shadow-sm transition-all min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          BANNER PENGINGAT PERTUKARAN SHIFT AKTIF (UNTUK SELURUH PETUGAS SAMPAI HARI H)
      ========================================================================= */}
      <SwapReminderBanner />

      {/* =========================================================================
          BANNER LIBUR PETUGAS (JIKA PETUGAS LIBUR HARI INI)
      ========================================================================= */}
      {isHolidayToday && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-300 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
              <Sun className="w-6 h-6 animate-spin-slow text-amber-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                  Status Anda Hari Ini: Libur
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {todayDateStr}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-emerald-950 mt-0.5 truncate">
                Selamat berlibur bersama keluarga tercinta
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5 line-clamp-1">
                Halo {activeProfile.full_name}, Anda tidak memiliki jadwal dinas jaga hari ini. Nikmati waktu istirahat bersama keluarga!
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenHolidayModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition shrink-0 active:scale-95 cursor-pointer"
            title="Buka Popup & Bunyikan Alarm Libur"
          >
            <BellRing className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>Bunyikan Alarm Libur</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          FILTERS & SEARCH BAR
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama petugas atau catatan..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Month Picker */}
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
          />
        </div>

        {/* Staff Filter */}
        <div>
          <select
            value={selectedStaffFilter}
            onChange={(e) => setSelectedStaffFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">Semua Petugas ({profiles.length})</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Shift Type Filter */}
        <div>
          <select
            value={selectedShiftFilter}
            onChange={(e) => setSelectedShiftFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="all">Semua Jenis Shift</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Legend of Shifts */}
      <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-slate-600">
        <span className="font-semibold text-slate-400 text-[11px] uppercase">Penanda Shift:</span>
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color_code }} />
            <span className="font-semibold text-slate-800">{s.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ({s.start_time.slice(0, 5)}-{s.end_time.slice(0, 5)})
            </span>
          </div>
        ))}
      </div>

      {/* =========================================================================
          VIEW MODE 1: LIST VIEW (Mobile cards & Desktop rows)
      ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredAssignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAssignments.map((a) => {
                const isMe = a.profile_id === activeProfile.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setDetailModalItem(a)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer hover:shadow-md relative overflow-hidden ${
                      isMe
                        ? 'border-teal-500 shadow-sm ring-1 ring-teal-500/30'
                        : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    {/* Highlight label for active user */}
                    {isMe && (
                      <div className="absolute top-0 right-0 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg tracking-wider uppercase">
                        Jadwal Saya
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: a.shift?.color_code || '#0284c7' }}
                        />
                        <span className="font-bold text-sm text-slate-900">{a.shift?.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {a.shift_date}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {a.profile?.full_name.charAt(0) || 'P'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{a.profile?.full_name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{a.profile?.position}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {a.shift?.start_time.slice(0, 5)} - {a.shift?.end_time.slice(0, 5)} WIB
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          a.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.status === 'swapped'
                            ? 'bg-blue-100 text-blue-800'
                            : a.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.status === 'scheduled'
                          ? 'Terjadwal'
                          : a.status === 'present'
                          ? 'Hadir'
                          : a.status === 'swapped'
                          ? 'Tukar Jaga'
                          : 'Dibatalkan'}
                      </span>
                    </div>

                    {/* Admin actions */}
                    {isAdmin && (
                      <div
                        className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenEditModal(a)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors"
                          title="Ubah Jadwal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(a.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak Ada Jadwal Ditemukan</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Silakan sesuaikan filter bulan atau tambah jadwal baru.
              </p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: CALENDAR VIEW
      ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm overflow-x-auto">
          <div className="min-w-[650px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 pb-2 border-b border-slate-200 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Senin</span>
              <span>Selasa</span>
              <span>Rabu</span>
              <span>Kamis</span>
              <span>Jumat</span>
              <span>Sabtu</span>
              <span className="text-rose-600">Minggu</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {getCalendarDays().map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-28 bg-slate-50/50 rounded-xl" />;
                }

                const dayAssignments = assignments.filter((a) => a.shift_date === day.dateStr);
                const isToday = day.dateStr === getPontianakDateString();

                return (
                  <div
                    key={day.dateStr}
                    className={`min-h-28 p-1.5 rounded-xl border flex flex-col justify-between transition-colors ${
                      isToday
                        ? 'border-teal-500 bg-teal-50/20 ring-1 ring-teal-500'
                        : 'border-slate-100 hover:border-slate-300 bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-full ${
                          isToday ? 'bg-teal-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {dayAssignments.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {dayAssignments.length} Jaga
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                      {dayAssignments.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => setDetailModalItem(a)}
                          className="p-1 rounded text-[10px] font-semibold text-white truncate cursor-pointer hover:opacity-90 shadow-2xs"
                          style={{ backgroundColor: a.shift?.color_code || '#0284c7' }}
                          title={`${a.shift?.name}: ${a.profile?.full_name}`}
                        >
                          {a.shift?.code}: {a.profile?.full_name?.split(' ')[0]}
                        </div>
                      ))}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditingAssignment(null);
                          setFormData({
                            profile_id: profiles[0]?.id || '',
                            shift_id: shifts[0]?.id || '',
                            shift_date: day.dateStr,
                            status: 'scheduled',
                            notes: '',
                          });
                          setModalOpen(true);
                        }}
                        className="mt-1 w-full text-[10px] text-slate-400 hover:text-teal-700 hover:bg-teal-50 py-0.5 rounded flex items-center justify-center gap-0.5 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Shift</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: MATRIX VIEW (Staff x Days 1-31 with 1-click assignment)
      ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm overflow-hidden space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-900">Matriks Jadwal Bulanan & Penginputan Sekali Klik</p>
              <p className="text-slate-500 text-[11px]">Klik pada sel kotak petugas & tanggal untuk menetapkan atau mengubah shift secara instan.</p>
            </div>
            <span className="bg-teal-50 text-teal-800 font-mono px-2.5 py-1 rounded-lg border border-teal-200 font-bold">
              Bulan: {selectedMonth}
            </span>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-2.5 text-left border border-slate-200 sticky left-0 bg-slate-100 z-10 min-w-[160px]">
                    Nama Petugas ATLM
                  </th>
                  {getDaysInSelectedMonth().map((day) => {
                    const isToday = day.dateStr === getPontianakDateString();
                    return (
                      <th
                        key={day.dateStr}
                        className={`p-1.5 border border-slate-200 text-center min-w-[36px] font-mono ${
                          isToday ? 'bg-teal-600 text-white font-bold' : ''
                        }`}
                        title={day.dateStr}
                      >
                        <div>{day.dayNumber}</div>
                        <div className="text-[9px] opacity-75">{day.dayName}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 border border-slate-200 sticky left-0 bg-white z-10 font-medium text-slate-900 truncate">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {p.full_name.charAt(0)}
                        </div>
                        <span className="truncate max-w-[120px]">{p.full_name}</span>
                      </div>
                    </td>
                    {getDaysInSelectedMonth().map((day) => {
                      const assignment = assignments.find(
                        (a) => a.profile_id === p.id && a.shift_date === day.dateStr
                      );
                      const shiftObj = assignment?.shift;
                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => {
                            if (isAdmin) {
                              setMatrixCellPopup({ profileId: p.id, dateStr: day.dateStr });
                            }
                          }}
                          className={`p-1 border border-slate-200 text-center cursor-pointer transition-transform active:scale-95 ${
                            isAdmin ? 'hover:bg-teal-50' : 'cursor-default'
                          }`}
                          title={`${p.full_name} - ${day.dateStr}${shiftObj ? ': ' + shiftObj.name : ': Kosong'}`}
                        >
                          {shiftObj ? (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs"
                              style={{ backgroundColor: shiftObj.color_code }}
                            >
                              {shiftObj.code}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px]">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrix Cell Quick Popup Modal */}
          {matrixCellPopup && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-2xl border border-slate-200 animate-scale-up space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Pilih Shift Sekali Klik</h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {matrixCellPopup.dateStr} • {profiles.find((p) => p.id === matrixCellPopup.profileId)?.full_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setMatrixCellPopup(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {shifts.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleQuickAssign(matrixCellPopup.profileId, matrixCellPopup.dateStr, s.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color_code }} />
                        <span className="text-slate-800">{s.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {s.start_time.slice(0, 5)}-{s.end_time.slice(0, 5)}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => handleQuickAssign(matrixCellPopup.profileId, matrixCellPopup.dateStr, null)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan / Hapus Jadwal</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH / UBAH JADWAL
      ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-600" />
                {editingAssignment ? 'Ubah Jadwal Shift' : 'Tambah Jadwal Shift Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conflict alert */}
            {formConflictWarning && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Peringatan Bentrok Jadwal!</p>
                  <p className="mt-0.5 text-rose-800">{formConflictWarning}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveAssignment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Petugas ATLM</label>
                <select
                  required
                  value={formData.profile_id}
                  onChange={(e) => setFormData({ ...formData, profile_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                >
                  <option value="" disabled>
                    -- Pilih Petugas --
                  </option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Shift</label>
                <select
                  required
                  value={formData.shift_id}
                  onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                >
                  <option value="" disabled>
                    -- Pilih Shift --
                  </option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)} WIB)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Dinas</label>
                <input
                  type="date"
                  required
                  value={formData.shift_date}
                  onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Kehadiran</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                >
                  <option value="scheduled">Terjadwal (Scheduled)</option>
                  <option value="present">Hadir (Present)</option>
                  <option value="swapped">Tukar Jaga (Swapped)</option>
                  <option value="cancelled">Dibatalkan (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Bertugas di Bank Darah / PJ Cito"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Simpan Jadwal
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DETAIL JADWAL SHIFT
      ========================================================================= */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span
                className="text-[10px] font-bold text-white px-2 py-0.5 rounded"
                style={{ backgroundColor: detailModalItem.shift?.color_code || '#0284c7' }}
              >
                {detailModalItem.shift?.name}
              </span>
              <button
                onClick={() => setDetailModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Petugas Yang Bertugas</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{detailModalItem.profile?.full_name}</p>
                <p className="text-slate-500 text-[11px]">{detailModalItem.profile?.position}</p>
                {detailModalItem.profile?.nip_str && (
                  <p className="text-slate-400 font-mono text-[10px]">NIP/STR: {detailModalItem.profile.nip_str}</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Tanggal:</span>
                  <span className="font-bold text-slate-800">{detailModalItem.shift_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Jam Dinas:</span>
                  <span className="font-bold text-slate-800">
                    {detailModalItem.shift?.start_time.slice(0, 5)} - {detailModalItem.shift?.end_time.slice(0, 5)} WIB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Status:</span>
                  <span className="font-bold text-teal-700 capitalize">{detailModalItem.status}</span>
                </div>
              </div>

              {detailModalItem.notes && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Catatan Khusus</p>
                  <p className="text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 text-[11px] mt-0.5">
                    {detailModalItem.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    const item = detailModalItem;
                    setDetailModalItem(null);
                    handleOpenEditModal(item);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Ubah Jadwal
                </button>
              )}
              <button
                onClick={() => setDetailModalItem(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL KONFIRMASI HAPUS
      ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-center animate-scale-up">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">Hapus Jadwal Shift Ini?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Jadwal yang dihapus tidak dapat dipulihkan. Apakah Anda yakin?
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleDeleteAssignment(deleteConfirmId)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL UCAPAN ALARM LIBUR: "Selamat berlibur bersama keluarga tercinta"
      ========================================================================= */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 relative overflow-hidden animate-scale-up text-center">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-amber-400" />

            <div className="flex justify-end -mt-1 -mr-1">
              <button
                onClick={() => setShowHolidayModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Festive Holiday Graphic */}
            <div className="relative w-20 h-20 mx-auto my-2">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Sun className="w-10 h-10 text-amber-200 animate-spin-slow" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-pulse">
                <Heart className="w-4 h-4 fill-white" />
              </div>
            </div>

            {/* Badge */}
            <div className="mt-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full">
                Status Hari Ini: Libur / Lepas Dinas
              </span>
            </div>

            {/* Main Required Sentence */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-2 leading-snug">
              Selamat berlibur bersama keluarga tercinta
            </h2>

            {/* Personalized Subtext */}
            <p className="text-xs text-slate-600 mt-2 leading-relaxed px-2">
              Halo <span className="font-bold text-slate-900">{activeProfile.full_name}</span>, hari ini Anda tidak memiliki jadwal dinas jaga di Laboratorium RSUD Sultan Muhammad Jamaludin I.
            </p>

            {/* Warm Box */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 text-left my-4 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Pesan Pengingat Khusus:</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Manfaatkan waktu istirahat hari ini untuk memulihkan kebugaran, menjaga kesehatan fisik &amp; mental, serta menikmati kebersamaan berharga bersama keluarga tercinta di rumah.
              </p>
            </div>

            {/* Audio Replay Button & Close Action */}
            <div className="space-y-2">
              <button
                onClick={() => playAlarmSound('holiday')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />
                <span>Putar Ulang Nada Alarm Libur</span>
              </button>

              <button
                onClick={() => setShowHolidayModal(false)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-teal-900/25 transition cursor-pointer"
              >
                Mengerti &amp; Lihat Jadwal Dinas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

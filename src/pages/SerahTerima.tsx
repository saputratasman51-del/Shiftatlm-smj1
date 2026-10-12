import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  User,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Save,
  Check,
  RotateCcw,
  Printer,
  History,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  Wrench,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  dataService,
  getPontianakDateString,
  getPontianakTimeString,
} from '../services/dataService';
import {
  Handover,
  HandoverCategory,
  HandoverCategoryData,
  LabCondition,
  PendingTask,
  Shift,
  UserProfile,
  HandoverStatus,
} from '../types';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';

export default function SerahTerima() {
  const { activeProfile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handoverIdParam = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<HandoverCategory[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Active Handover State
  const [currentHandoverId, setCurrentHandoverId] = useState<string>(() => {
    return handoverIdParam || `ho-${Date.now()}`;
  });

  // 1. Identitas Serah Terima
  const [shiftDate, setShiftDate] = useState(getPontianakDateString());
  const [shiftFromId, setShiftFromId] = useState('');
  const [shiftToId, setShiftToId] = useState('');
  const [giverProfileId, setGiverProfileId] = useState(activeProfile.id);
  const [receiverProfileId, setReceiverProfileId] = useState('');
  const [givenAtTime, setGivenAtTime] = useState(getPontianakTimeString());
  const [receivedAtTime, setReceivedAtTime] = useState('');
  const [handoverStatus, setHandoverStatus] = useState<HandoverStatus>('draft');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [statusLogs, setStatusLogs] = useState<Handover['status_logs']>([]);

  // 2. Kategori Pemeriksaan Pasien (17 Kategori)
  const [categoryDataMap, setCategoryDataMap] = useState<Record<string, HandoverCategoryData>>({});
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('cat-1');

  // 3. Kondisi Laboratorium & Alat
  const [labConditions, setLabConditions] = useState<LabCondition[]>([
    {
      id: 'cond-1',
      category: 'alat',
      item_name: 'Hematology Analyzer Sysmex XP-100',
      status: 'baik',
      description: 'Running kontrol normal, lolos background check',
    },
    {
      id: 'cond-2',
      category: 'alat',
      item_name: 'Chemistry Analyzer Mindray BS-120',
      status: 'baik',
      description: 'Lampu halogen stabil, kalibrasi harian selesai',
    },
    {
      id: 'cond-3',
      category: 'reagen',
      item_name: 'Reagen Golongan Darah & Diluent Sysmex',
      status: 'normal',
      description: 'Stok cukup untuk shift berikutnya',
    },
    {
      id: 'cond-4',
      category: 'ruang_kerja',
      item_name: 'Suhu Ruangan & Kulkas Reagen 2-8°C',
      status: 'normal',
      description: 'Suhu terpantau normal sesuai termometer kalibrasi',
    },
  ]);

  // 4. Pekerjaan Tertunda
  const [pendingTasksList, setPendingTasksList] = useState<PendingTask[]>([]);
  const [newTaskInput, setNewTaskInput] = useState({
    task_type: '',
    description: '',
    priority: 'sedang' as PendingTask['priority'],
    assigned_to: '',
  });

  // Receiver Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Auto-calculated total patient count
  const totalPatientCount = useMemo(() => {
    return Object.values(categoryDataMap).reduce((sum, item) => {
      const count = Number(item.patient_count) || 0;
      return sum + count;
    }, 0);
  }, [categoryDataMap]);

  // Load initial references & handover data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [cats, sList, pList] = await Promise.all([
          dataService.getCategories(),
          dataService.getShifts(),
          dataService.getProfiles(),
        ]);
        setCategories(cats);
        setShifts(sList);
        setProfiles(pList);

        // Default shifts
        if (sList.length >= 2) {
          setShiftFromId(sList[0].id);
          setShiftToId(sList[1].id);
        }

        // Default receiver
        const otherStaff = pList.find((p) => p.id !== activeProfile.id);
        if (otherStaff) setReceiverProfileId(otherStaff.id);

        // Check if loading existing handover
        if (handoverIdParam) {
          const ho = await dataService.getHandoverById(handoverIdParam);
          if (ho) {
            setCurrentHandoverId(ho.id);
            setShiftDate(ho.shift_date);
            setShiftFromId(ho.shift_from_id);
            setShiftToId(ho.shift_to_id);
            setGiverProfileId(ho.giver_profile_id);
            setReceiverProfileId(ho.receiver_profile_id || '');
            setHandoverStatus(ho.status);
            setGivenAtTime(ho.given_at ? ho.given_at.slice(11, 16) : getPontianakTimeString());
            setReceivedAtTime(ho.received_at ? ho.received_at.slice(11, 16) : '');
            setRevisionNotes(ho.revision_notes || '');
            setStatusLogs(ho.status_logs || []);
            if (ho.categories_data) setCategoryDataMap(ho.categories_data);
            if (ho.lab_conditions) setLabConditions(ho.lab_conditions);
            if (ho.pending_tasks) setPendingTasksList(ho.pending_tasks);
          }
        } else {
          // Initialize empty categories map
          const initialMap: Record<string, HandoverCategoryData> = {};
          cats.forEach((c) => {
            initialMap[c.id] = {
              category_id: c.id,
              patient_count: 0,
              ongoing_tests: '',
              pending_samples: '',
              unverified_results: '',
              issues_notes: '',
              work_status: 'selesai',
            };
          });
          setCategoryDataMap(initialMap);
        }
      } catch (err) {
        console.error('Error initializing handover:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [handoverIdParam]);

  // Update category field
  const handleCategoryFieldChange = (
    categoryId: string,
    field: keyof HandoverCategoryData,
    value: any
  ) => {
    setCategoryDataMap((prev) => {
      const current = prev[categoryId] || {
        category_id: categoryId,
        patient_count: 0,
        ongoing_tests: '',
        pending_samples: '',
        unverified_results: '',
        issues_notes: '',
        work_status: 'selesai',
      };
      return {
        ...prev,
        [categoryId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Add lab condition item
  const handleAddLabCondition = () => {
    const newItem: LabCondition = {
      id: `cond-${Date.now()}`,
      category: 'alat',
      item_name: 'Peralatan / Instrumen Baru',
      status: 'baik',
      description: 'Kondisi instrumen normal tanpa kendala',
    };
    setLabConditions([...labConditions, newItem]);
  };

  const handleRemoveLabCondition = (id: string) => {
    setLabConditions(labConditions.filter((c) => c.id !== id));
  };

  // Add pending task
  const handleAddPendingTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.task_type || !newTaskInput.description) {
      showToast('Form Belum Lengkap', 'Isi jenis pekerjaan dan keterangan tugas', 'error');
      return;
    }
    const task: PendingTask = {
      id: `task-${Date.now()}`,
      task_type: newTaskInput.task_type,
      description: newTaskInput.description,
      priority: newTaskInput.priority,
      status: 'belum_dikerjakan',
      assigned_to: newTaskInput.assigned_to || receiverProfileId,
      created_by: activeProfile.id,
      created_at: new Date().toISOString(),
    };
    setPendingTasksList([...pendingTasksList, task]);
    setNewTaskInput({
      task_type: '',
      description: '',
      priority: 'sedang',
      assigned_to: '',
    });
    showToast('Tugas Ditambahkan', 'Pekerjaan tertunda berhasil dimasukkan ke daftar');
  };

  const handleRemovePendingTask = (id: string) => {
    setPendingTasksList(pendingTasksList.filter((t) => t.id !== id));
  };

  // Save Handover (Draft or Submit)
  const handleSaveHandover = async (targetStatus: HandoverStatus, note?: string) => {
    const payload: Handover = {
      id: currentHandoverId,
      shift_date: shiftDate,
      shift_from_id: shiftFromId,
      shift_to_id: shiftToId,
      giver_profile_id: giverProfileId,
      receiver_profile_id: receiverProfileId || undefined,
      status: targetStatus,
      given_at: `${shiftDate} ${givenAtTime}:00`,
      received_at: targetStatus === 'received' ? `${shiftDate} ${getPontianakTimeString()}:00` : undefined,
      total_patients: totalPatientCount,
      revision_notes: targetStatus === 'revision_needed' ? note : revisionNotes,
      categories_data: categoryDataMap,
      lab_conditions: labConditions,
      pending_tasks: pendingTasksList,
      status_logs: statusLogs,
    };

    try {
      const saved = await dataService.saveHandover(payload, note);
      setHandoverStatus(saved.status);
      setStatusLogs(saved.status_logs);

      if (targetStatus === 'draft') {
        showToast('Draft Tersimpan', 'Dokumen serah terima tersimpan sebagai draf');
      } else if (targetStatus === 'pending') {
        showToast('Serah Terima Dikirim', 'Menunggu konfirmasi penerimaan oleh petugas shift berikutnya');
      } else if (targetStatus === 'received') {
        showToast('Serah Terima Diterima', 'Dokumen serah terima resmi dikonfirmasi & disetujui');
      } else if (targetStatus === 'revision_needed') {
        showToast('Permintaan Revisi Terkirim', 'Status diubah ke Perlu Perbaikan');
      }
    } catch (err) {
      console.error('Error saving handover:', err);
      showToast('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan serah terima', 'error');
    }
  };

  // Receiver confirmation action
  const handleConfirmReceived = async () => {
    setConfirmModalOpen(false);
    await handleSaveHandover('received', `Diterima dan dikonfirmasi oleh ${activeProfile.full_name}`);
  };

  // Rejection / Revision action
  const handleRequestRevision = async () => {
    if (!rejectionReason) {
      showToast('Catatan Diperlukan', 'Harap isi alasan revisi', 'error');
      return;
    }
    setRejectModalOpen(false);
    await handleSaveHandover('revision_needed', `Permintaan revisi: ${rejectionReason}`);
  };

  const isLocked = handoverStatus === 'received';
  const isReceiver = activeProfile.id === receiverProfileId || isAdmin;

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* =========================================================================
          TOP ACTION BAR & STATUS BADGE
      ========================================================================= */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Formulir Serah Terima Jaga</h1>
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                handoverStatus === 'received'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : handoverStatus === 'pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : handoverStatus === 'revision_needed'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              {handoverStatus === 'received'
                ? 'Status: Diterima'
                : handoverStatus === 'pending'
                ? 'Status: Menunggu Penerimaan'
                : handoverStatus === 'revision_needed'
                ? 'Status: Perlu Revisi'
                : 'Status: Draft'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Digitalisasi operan shift jaga laboratorium RSUD Sultan Muhammad Jamaludin I Kayong Utara
          </p>
        </div>

        {/* Buttons Action Group */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Print / Export PDF button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors min-h-[44px]"
            title="Cetak atau Simpan PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>

          {!isLocked && (
            <>
              {/* Save Draft */}
              <button
                onClick={() => handleSaveHandover('draft')}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3.5 rounded-xl transition-colors min-h-[44px]"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Simpan Draft</span>
              </button>

              {/* Submit to receiver */}
              <button
                onClick={() => handleSaveHandover('pending')}
                className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Serah Terima</span>
              </button>
            </>
          )}

          {/* Receiver Confirmation Buttons */}
          {handoverStatus === 'pending' && isReceiver && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi Diterima</span>
              </button>
              <button
                onClick={() => setRejectModalOpen(true)}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Perlu Revisi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Revision note banner */}
      {handoverStatus === 'revision_needed' && revisionNotes && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">Catatan Perbaikan / Revisi</h4>
            <p className="text-xs text-rose-950 mt-0.5">{revisionNotes}</p>
          </div>
        </div>
      )}

      {/* Locked notice */}
      {isLocked && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Dokumen serah terima ini telah <strong>dikonfirmasi & diterima</strong>. Data terkunci dari perubahan langsung untuk menjamin audit trail.
            </span>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleSaveHandover('draft', 'Admin membuka kunci status untuk revisi resmi')}
              className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-900 ml-2"
            >
              Buka Revisi (Admin)
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          BAGIAN 1: IDENTITAS SERAH TERIMA JAGA
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            1. Identitas Serah Terima Jaga
          </h2>
          <span className="text-xs font-mono text-slate-400">RSUD Sultan Muhammad Jamaludin I</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tanggal */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Serah Terima</label>
            <input
              type="date"
              disabled={isLocked}
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono font-semibold"
            />
          </div>

          {/* Shift Asal */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Shift Asal (Yang Menyerahkan)</label>
            <select
              disabled={isLocked}
              value={shiftFromId}
              onChange={(e) => setShiftFromId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>

          {/* Shift Tujuan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Shift Tujuan (Yang Menerima)</label>
            <select
              disabled={isLocked}
              value={shiftToId}
              onChange={(e) => setShiftToId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>

          {/* Waktu Penyerahan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Waktu Penyerahan (WIB)</label>
            <input
              type="text"
              disabled={isLocked}
              value={givenAtTime}
              onChange={(e) => setGivenAtTime(e.target.value)}
              placeholder="07:00"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono font-semibold"
            />
          </div>

          {/* Petugas Yang Menyerahkan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Petugas Yang Menyerahkan</label>
            <select
              disabled={isLocked}
              value={giverProfileId}
              onChange={(e) => setGiverProfileId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.position})
                </option>
              ))}
            </select>
          </div>

          {/* Petugas Yang Menerima */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Petugas Yang Menerima</label>
            <select
              disabled={isLocked}
              value={receiverProfileId}
              onChange={(e) => setReceiverProfileId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
            >
              <option value="">-- Pilih Petugas Penerima --</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.position})
                </option>
              ))}
            </select>
          </div>

          {/* Waktu Penerimaan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Waktu Penerimaan (WIB)</label>
            <input
              type="text"
              disabled={isLocked}
              value={receivedAtTime}
              onChange={(e) => setReceivedAtTime(e.target.value)}
              placeholder="14:05"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono font-semibold"
            />
          </div>

          {/* Total Pasien Otomatis */}
          <div className="bg-teal-50/70 border border-teal-200/80 p-2.5 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-teal-800">Total Pasien (Otomatis)</p>
              <p className="text-[11px] text-teal-700">Akumulasi 17 Kategori</p>
            </div>
            <span className="text-xl font-extrabold font-mono text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-200 shadow-2xs">
              {totalPatientCount}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BAGIAN 2: 17 KATEGORI PEMERIKSAAN PASIEN
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              2. Kategori Pemeriksaan Pasien ({categories.length} Unit / Ruangan)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Buka setiap kategori untuk mencatat sampel tertunda, hasil belum terverifikasi, dan kendala.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
              Total Seluruh Pasien: <strong className="font-mono text-teal-800 text-sm">{totalPatientCount}</strong>
            </span>
          </div>
        </div>

        {/* 17 Categories Accordion List */}
        <div className="space-y-2">
          {categories.map((cat, idx) => {
            const isExpanded = expandedCategoryId === cat.id;
            const itemData = categoryDataMap[cat.id] || {
              category_id: cat.id,
              patient_count: 0,
              ongoing_tests: '',
              pending_samples: '',
              unverified_results: '',
              issues_notes: '',
              work_status: 'selesai',
            };

            const hasActiveWork =
              itemData.patient_count > 0 ||
              itemData.ongoing_tests ||
              itemData.pending_samples ||
              itemData.unverified_results ||
              itemData.issues_notes;

            return (
              <div
                key={cat.id}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-teal-500 bg-teal-50/10 shadow-sm'
                    : hasActiveWork
                    ? 'border-slate-300 bg-white'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-3 text-left min-h-[48px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{cat.name}</span>
                    {hasActiveWork && (
                      <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.2 rounded-full hidden sm:inline">
                        Ada Catatan
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 hidden xs:inline">Jumlah Pasien:</span>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {itemData.patient_count || 0}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        itemData.work_status === 'selesai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : itemData.work_status === 'proses'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {itemData.work_status}
                    </span>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-teal-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Accordion expanded content */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fade-in">
                    {/* Jumlah Pasien */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jumlah Pasien / Spesimen ({cat.name})
                      </label>
                      <input
                        type="number"
                        min="0"
                        disabled={isLocked}
                        value={itemData.patient_count}
                        onChange={(e) =>
                          handleCategoryFieldChange(cat.id, 'patient_count', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono font-bold"
                      />
                    </div>

                    {/* Status Pekerjaan */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status Pekerjaan Unit Ini</label>
                      <select
                        disabled={isLocked}
                        value={itemData.work_status}
                        onChange={(e) => handleCategoryFieldChange(cat.id, 'work_status', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
                      >
                        <option value="selesai">Selesai (Semua Tertangani)</option>
                        <option value="proses">Dalam Proses (Sedang Running / Inkubasi)</option>
                        <option value="tindak_lanjut">Perlu Tindak Lanjut (Ada Masalah / Resample)</option>
                      </select>
                    </div>

                    {/* Pemeriksaan Masih Berjalan */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Pemeriksaan Yang Masih Berjalan</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="Contoh: Crossmatch fase 2 sedang inkubasi / Kultur urine"
                        value={itemData.ongoing_tests || ''}
                        onChange={(e) => handleCategoryFieldChange(cat.id, 'ongoing_tests', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    {/* Sampel Belum Selesai */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sampel Belum Selesai Diperiksa</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="Contoh: Darah EDTA 1 tabung lisis (menunggu resample)"
                        value={itemData.pending_samples || ''}
                        onChange={(e) => handleCategoryFieldChange(cat.id, 'pending_samples', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    {/* Hasil Belum Diverifikasi */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Hasil Belum Diverifikasi / Disampaikan</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="Contoh: Nilai kritis glukosa 42 mg/dL belum tersampaikan ke perawat"
                        value={itemData.unverified_results || ''}
                        onChange={(e) => handleCategoryFieldChange(cat.id, 'unverified_results', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    {/* Kendala & Catatan Khusus */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kendala & Catatan Khusus</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="Catatan spesifik untuk shift berikutnya..."
                        value={itemData.issues_notes || ''}
                        onChange={(e) => handleCategoryFieldChange(cat.id, 'issues_notes', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          BAGIAN 3: KONDISI LABORATORIUM & ALAT
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-600" />
              3. Kondisi Laboratorium & Alat
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan kondisi alat analizer, reagen, suhu ruangan, LIS/SIMRS, dan keselamatan kerja (K3).
            </p>
          </div>

          {!isLocked && (
            <button
              type="button"
              onClick={handleAddLabCondition}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-xl transition-colors min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Item</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {labConditions.map((item, idx) => (
            <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  disabled={isLocked}
                  value={item.item_name}
                  onChange={(e) => {
                    const copy = [...labConditions];
                    copy[idx].item_name = e.target.value;
                    setLabConditions(copy);
                  }}
                  className="font-bold text-slate-900 bg-white px-2 py-1 border border-slate-200 rounded-lg flex-1"
                />
                <select
                  disabled={isLocked}
                  value={item.status}
                  onChange={(e) => {
                    const copy = [...labConditions];
                    copy[idx].status = e.target.value as any;
                    setLabConditions(copy);
                  }}
                  className={`font-semibold px-2 py-1 rounded-lg border text-xs capitalize ${
                    item.status === 'baik' || item.status === 'normal'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : item.status === 'peringatan'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <option value="baik">Baik</option>
                  <option value="normal">Normal</option>
                  <option value="peringatan">Peringatan</option>
                  <option value="rusak">Rusak</option>
                  <option value="kritis">Kritis</option>
                </select>

                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLabCondition(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <input
                type="text"
                disabled={isLocked}
                value={item.description}
                placeholder="Keterangan kondisi..."
                onChange={(e) => {
                  const copy = [...labConditions];
                  copy[idx].description = e.target.value;
                  setLabConditions(copy);
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700"
              />
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          BAGIAN 4: PEKERJAAN TERTUNDA & TINDAK LANJUT
      ========================================================================= */}
      <div id="tasks" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              4. Pekerjaan Tertunda & Tindak Lanjut
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar pekerjaan prioritas yang harus dituntaskan oleh petugas shift penerima.
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
            {pendingTasksList.length} Tugas
          </span>
        </div>

        {/* Existing pending tasks */}
        <div className="space-y-2.5">
          {pendingTasksList.length > 0 ? (
            pendingTasksList.map((task) => (
              <div
                key={task.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{task.task_type}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                        task.priority === 'tinggi_cito'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'sedang'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {task.priority === 'tinggi_cito' ? 'Cito / Tinggi' : task.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">· {task.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-slate-700">{task.description}</p>
                </div>

                {!isLocked && (
                  <button
                    onClick={() => handleRemovePendingTask(task.id)}
                    className="self-end sm:self-auto p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">
              Tidak ada pekerjaan tertunda saat ini. Semua pekerjaan shift tuntas.
            </p>
          )}
        </div>

        {/* Add new task form */}
        {!isLocked && (
          <form
            onSubmit={handleAddPendingTask}
            className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs"
          >
            <input
              type="text"
              placeholder="Jenis Pekerjaan (misal: Cito Troponin)"
              value={newTaskInput.task_type}
              onChange={(e) => setNewTaskInput({ ...newTaskInput, task_type: e.target.value })}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
            />
            <input
              type="text"
              placeholder="Keterangan tindak lanjut..."
              value={newTaskInput.description}
              onChange={(e) => setNewTaskInput({ ...newTaskInput, description: e.target.value })}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2"
            />
            <div className="flex gap-2">
              <select
                value={newTaskInput.priority}
                onChange={(e) => setNewTaskInput({ ...newTaskInput, priority: e.target.value as any })}
                className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="sedang">Prioritas Sedang</option>
                <option value="tinggi_cito">Prioritas Cito / Tinggi</option>
                <option value="rendah">Prioritas Rendah</option>
              </select>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-xl shrink-0"
              >
                Tambah
              </button>
            </div>
          </form>
        )}
      </div>

      {/* =========================================================================
          BAGIAN 5: RIWAYAT STATUS & LOG PERUBAHAN
      ========================================================================= */}
      {statusLogs && statusLogs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Riwayat Perubahan & Audit Status Serah Terima
          </h3>
          <div className="space-y-2 text-xs">
            {statusLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {log.changer_name || 'Petugas'} &mdash;{' '}
                    <span className="font-bold text-teal-700 uppercase">{log.new_status}</span>
                  </p>
                  {log.notes && <p className="text-slate-600 text-[11px] mt-0.5">{log.notes}</p>}
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {log.created_at?.slice(0, 16).replace('T', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI PENERIMAAN
      ========================================================================= */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-scale-up text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 text-base">Konfirmasi Serah Terima Jaga</h3>
            <p className="text-xs text-slate-600 mt-1">
              Saya, <strong>{activeProfile.full_name}</strong>, menyatakan telah memeriksa kondisi laboratorium,
              pekerjaan tertunda, dan menerima tanggung jawab jaga shift ini.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleConfirmReceived}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Ya, Konfirmasi & Terima
              </button>
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: MINTA REVISI / PERBAIKAN
      ========================================================================= */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-scale-up">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              Kembalikan Untuk Revisi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Jelaskan alasan pengembalian dokumen serah terima kepada petugas shift sebelumnya:
            </p>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Jumlah pasien rawat inap belum sesuai / ada sampel belum tercatat..."
              className="mt-3 w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleRequestRevision}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Kirim Revisi
              </button>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

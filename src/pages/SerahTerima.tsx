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
  Search,
  Filter,
  Eye,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { SerahTerimaSkeleton } from '../components/SkeletonLoader';
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
  ShiftAssignment,
} from '../types';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Avatar';

export default function SerahTerima() {
  const { activeProfile, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const handoverIdParam = searchParams.get('id');

  const [categories, setCategories] = useState<HandoverCategory[]>(() => dataService.getCachedCategories());
  const [shifts, setShifts] = useState<Shift[]>(() => dataService.getCachedShifts());
  const [profiles, setProfiles] = useState<UserProfile[]>(() => dataService.getCachedProfiles());
  const [allHandovers, setAllHandovers] = useState<Handover[]>(() => dataService.getCachedHandovers());
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() => dataService.getCachedAssignments());


  // Navigation tab: 'masuk' (Operan Masuk) | 'form' (Formulir Serah Terima) | 'riwayat' (Data & Riwayat)
  const [activeTab, setActiveTab] = useState<'masuk' | 'form' | 'riwayat'>(() => {
    if (handoverIdParam) return 'form';
    const cachedHo = dataService.getCachedHandovers();
    const pendingForMe = cachedHo.filter(
      (h) => h.status === 'pending' && (isAdmin || h.receiver_profile_id === activeProfile.id)
    );
    return pendingForMe.length > 0 ? 'masuk' : 'form';
  });

  // Active Handover State
  const [currentHandoverId, setCurrentHandoverId] = useState<string>(() => {
    return handoverIdParam || `ho-${Date.now()}`;
  });

  // 1. Identitas Serah Terima
  const [shiftDate, setShiftDate] = useState(getPontianakDateString());
  const [shiftFromId, setShiftFromId] = useState(() => dataService.getCachedShifts()[0]?.id || '');
  const [shiftToId, setShiftToId] = useState(() => dataService.getCachedShifts()[1]?.id || '');
  const [giverProfileId, setGiverProfileId] = useState(activeProfile.id);
  const [receiverProfileId, setReceiverProfileId] = useState(() => {
    const others = dataService.getCachedProfiles().filter((p) => p.id !== activeProfile.id);
    return others[0]?.id || '';
  });
  const [givenAtTime, setGivenAtTime] = useState(getPontianakTimeString());
  const [receivedAtTime, setReceivedAtTime] = useState('');
  const [handoverStatus, setHandoverStatus] = useState<HandoverStatus>('draft');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [statusLogs, setStatusLogs] = useState<Handover['status_logs']>([]);

  // Staff assigned to shiftFromId on shiftDate (Otomatis terbaca dari jadwal)
  const giverProfilesOnDuty = useMemo(() => {
    if (!shiftDate || !shiftFromId) return profiles;
    const matched = assignments.filter(
      (a) => a.shift_date === shiftDate && a.shift_id === shiftFromId
    );
    const matchedProfiles = matched
      .map((a) => a.profile || profiles.find((p) => p.id === a.profile_id))
      .filter(Boolean) as UserProfile[];
    if (matchedProfiles.length > 0) return matchedProfiles;
    return profiles;
  }, [assignments, shiftDate, shiftFromId, profiles]);

  // Staff assigned to shiftToId on shiftDate (Otomatis terbaca dari jadwal)
  const receiverProfilesOnDuty = useMemo(() => {
    if (!shiftDate || !shiftToId) return profiles;
    const matched = assignments.filter(
      (a) => a.shift_date === shiftDate && a.shift_id === shiftToId
    );
    const matchedProfiles = matched
      .map((a) => a.profile || profiles.find((p) => p.id === a.profile_id))
      .filter(Boolean) as UserProfile[];
    if (matchedProfiles.length > 0) return matchedProfiles;
    return profiles;
  }, [assignments, shiftDate, shiftToId, profiles]);

  // 2. Kategori Pemeriksaan Pasien (17 Kategori)
  const [categoryDataMap, setCategoryDataMap] = useState<Record<string, HandoverCategoryData>>(() => {
    const cachedCats = dataService.getCachedCategories();
    const initialMap: Record<string, HandoverCategoryData> = {};
    cachedCats.forEach((c) => {
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
    return initialMap;
  });
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

  // Modals & Action States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittedSuccessModal, setSubmittedSuccessModal] = useState<Handover | null>(null);
  const [targetConfirmHandover, setTargetConfirmHandover] = useState<Handover | null>(null);
  const [targetRejectHandover, setTargetRejectHandover] = useState<Handover | null>(null);
  const [selectedDetailModal, setSelectedDetailModal] = useState<Handover | null>(null);
  const [deleteTargetHandover, setDeleteTargetHandover] = useState<Handover | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // History tab filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  // Auto-calculated total patient count
  const totalPatientCount = useMemo(() => {
    return Object.values(categoryDataMap).reduce((sum, item) => {
      const count = Number(item.patient_count) || 0;
      return sum + count;
    }, 0);
  }, [categoryDataMap]);

  // Load all references and handovers list
  const refreshHandoversList = async () => {
    try {
      const allHo = await dataService.getHandovers();
      setAllHandovers(allHo);
      return allHo;
    } catch (e) {
      console.warn('Error refreshing handovers list:', e);
      return [];
    }
  };

  // Populate form with a handover instance
  const populateFormWithHandover = (ho: Handover) => {
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
  };

  // Reset form to blank new handover
  const handleCreateNewHandover = (showNotice = true) => {
    const newId = `ho-${Date.now()}`;
    setCurrentHandoverId(newId);
    setShiftDate(getPontianakDateString());
    setGiverProfileId(activeProfile.id);
    const otherStaff = profiles.find((p) => p.id !== activeProfile.id);
    if (otherStaff) setReceiverProfileId(otherStaff.id);
    if (shifts.length >= 2) {
      setShiftFromId(shifts[0].id);
      setShiftToId(shifts[1].id);
    }
    setGivenAtTime(getPontianakTimeString());
    setReceivedAtTime('');
    setHandoverStatus('draft');
    setRevisionNotes('');
    setStatusLogs([]);

    const initialMap: Record<string, HandoverCategoryData> = {};
    categories.forEach((c) => {
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

    setLabConditions([
      {
        id: `cond-${Date.now()}-1`,
        category: 'alat',
        item_name: 'Hematology Analyzer Sysmex XP-100',
        status: 'baik',
        description: 'Running kontrol normal, lolos background check',
      },
      {
        id: `cond-${Date.now()}-2`,
        category: 'alat',
        item_name: 'Chemistry Analyzer Mindray BS-120',
        status: 'baik',
        description: 'Lampu halogen stabil, kalibrasi harian selesai',
      },
      {
        id: `cond-${Date.now()}-3`,
        category: 'reagen',
        item_name: 'Reagen Golongan Darah & Diluent Sysmex',
        status: 'normal',
        description: 'Stok cukup untuk shift berikutnya',
      },
      {
        id: `cond-${Date.now()}-4`,
        category: 'ruang_kerja',
        item_name: 'Suhu Ruangan & Kulkas Reagen 2-8°C',
        status: 'normal',
        description: 'Suhu terpantau normal sesuai termometer kalibrasi',
      },
    ]);
    setPendingTasksList([]);
    setActiveTab('form');
    setSearchParams({});
    if (showNotice) {
      showToast('Form Baru Dibuka', 'Silakan lengkapi data serah terima shift jaga');
    }
  };

  // Switch to viewing/editing an existing handover
  const handleSelectHandoverToReview = (ho: Handover) => {
    populateFormWithHandover(ho);
    setActiveTab('form');
    setSearchParams({ id: ho.id });
  };

  const { data: serahTerimaData, isLoading, refetch } = useQuery({
    queryKey: ['serahTerimaData'],
    queryFn: async () => {
      const [cats, sList, pList, allHo, allAsg] = await Promise.all([
        dataService.getCategories(),
        dataService.getShifts(),
        dataService.getProfiles(),
        dataService.getHandovers(),
        dataService.getAssignments(),
      ]);
      return { cats, sList, pList, allHo, allAsg };
    },
    initialData: () => ({
      cats: dataService.getCachedCategories(),
      sList: dataService.getCachedShifts(),
      pList: dataService.getCachedProfiles(),
      allHo: dataService.getCachedHandovers(),
      allAsg: dataService.getCachedAssignments(),
    }),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (serahTerimaData) {
      setCategories(serahTerimaData.cats);
      setShifts(serahTerimaData.sList);
      setProfiles(serahTerimaData.pList);
      setAllHandovers(serahTerimaData.allHo);
      setAssignments(serahTerimaData.allAsg);

      if (serahTerimaData.sList.length >= 2) {
        setShiftFromId((prev) => prev || serahTerimaData.sList[0].id);
        setShiftToId((prev) => prev || serahTerimaData.sList[1].id);
      }

      const otherStaff = serahTerimaData.pList.find((p) => p.id !== activeProfile.id);
      if (otherStaff) {
        setReceiverProfileId((prev) => prev || otherStaff.id);
      }

      if (handoverIdParam) {
        const ho = serahTerimaData.allHo.find((h) => h.id === handoverIdParam);
        if (ho) {
          populateFormWithHandover(ho);
          setActiveTab('form');
        }
      } else {
        setCategoryDataMap((prev) => {
          const initialMap: Record<string, HandoverCategoryData> = { ...prev };
          serahTerimaData.cats.forEach((c) => {
            if (!initialMap[c.id]) {
              initialMap[c.id] = {
                category_id: c.id,
                patient_count: 0,
                ongoing_tests: '',
                pending_samples: '',
                unverified_results: '',
                issues_notes: '',
                work_status: 'selesai',
              };
            }
          });
          return initialMap;
        });
      }

    }
  }, [serahTerimaData, handoverIdParam, activeProfile.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribe((event) => {
      if (event.table === 'handovers' || event.table === 'ALL') {
        refetch();
      }
    });

    return () => unsubscribe();
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
      handover_id: currentHandoverId,
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
    if (!shiftFromId || !shiftToId) {
      showToast('Shift Belum Dipilih', 'Pilih shift asal dan shift tujuan', 'error');
      return;
    }
    if (!receiverProfileId && targetStatus === 'pending') {
      showToast('Penerima Belum Dipilih', 'Pilih petugas penerima sebelum mengirim operan', 'error');
      return;
    }

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
      setCurrentHandoverId(saved.id);
      setSearchParams({ id: saved.id });
      await refreshHandoversList();

      if (targetStatus === 'draft') {
        showToast('Draft Tersimpan', 'Dokumen serah terima tersimpan sebagai draf');
      } else if (targetStatus === 'pending') {
        setSubmittedSuccessModal(saved);
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

  // Direct Receiver confirmation action (from tab or modal)
  const handleConfirmDirect = async (ho: Handover) => {
    try {
      const updated: Handover = {
        ...ho,
        status: 'received',
        receiver_profile_id: activeProfile.id,
        received_at: `${ho.shift_date} ${getPontianakTimeString()}:00`,
      };
      await dataService.saveHandover(updated, `Diterima dan dikonfirmasi resmi oleh ${activeProfile.full_name}`);
      showToast('Serah Terima Diterima', `Dokumen serah terima telah dikonfirmasi resmi oleh ${activeProfile.full_name}`);
      await refreshHandoversList();
      setTargetConfirmHandover(null);
      if (currentHandoverId === ho.id) {
        setHandoverStatus('received');
        setReceivedAtTime(getPontianakTimeString());
      }
    } catch (e) {
      console.error('Error confirming handover:', e);
      showToast('Gagal Konfirmasi', 'Terjadi kesalahan sistem', 'error');
    }
  };

  // Direct Rejection / Revision action
  const handleRejectDirect = async (ho: Handover, reason: string) => {
    if (!reason.trim()) {
      showToast('Catatan Diperlukan', 'Harap isi alasan revisi', 'error');
      return;
    }
    try {
      const updated: Handover = {
        ...ho,
        status: 'revision_needed',
        revision_notes: reason,
      };
      await dataService.saveHandover(updated, `Permintaan revisi oleh ${activeProfile.full_name}: ${reason}`);
      showToast('Revisi Terkirim', 'Dokumen dikembalikan ke petugas penyerah untuk diperbaiki');
      await refreshHandoversList();
      setTargetRejectHandover(null);
      setRejectionReason('');
      if (currentHandoverId === ho.id) {
        setHandoverStatus('revision_needed');
        setRevisionNotes(reason);
      }
    } catch (e) {
      console.error('Error rejecting handover:', e);
      showToast('Gagal Mengirim Revisi', 'Terjadi kesalahan sistem', 'error');
    }
  };

  const promptDeleteHandover = (ho?: Handover | null) => {
    if (ho) {
      setDeleteTargetHandover(ho);
    } else {
      const existing = allHandovers.find((h) => h.id === currentHandoverId);
      if (existing) {
        setDeleteTargetHandover(existing);
      } else {
        setDeleteTargetHandover({
          id: currentHandoverId,
          shift_date: shiftDate,
          shift_from_id: shiftFromId,
          shift_to_id: shiftToId,
          giver_profile_id: giverProfileId,
          receiver_profile_id: receiverProfileId || undefined,
          status: handoverStatus,
          total_patients: totalPatientCount,
          shift_from: shifts.find((s) => s.id === shiftFromId),
          shift_to: shifts.find((s) => s.id === shiftToId),
          giver: profiles.find((p) => p.id === giverProfileId),
          receiver: profiles.find((p) => p.id === receiverProfileId),
        });
      }
    }
  };

  const handleDeleteHandover = (ho: Handover) => {
    promptDeleteHandover(ho);
  };

  const executeDeleteHandover = async () => {
    if (!deleteTargetHandover) return;
    setIsDeleting(true);
    const targetId = deleteTargetHandover.id;
    const isTargetDraft = deleteTargetHandover.status === 'draft';

    try {
      await dataService.deleteHandover(targetId);
      await refreshHandoversList();

      if (currentHandoverId === targetId) {
        handleCreateNewHandover(false);
      }

      setDeleteTargetHandover(null);
      showToast(
        isTargetDraft ? 'Draf Berhasil Dihapus' : 'Dokumen Berhasil Dihapus',
        isTargetDraft
          ? 'Formulir draf serah terima jaga telah dihapus dan direset bersih.'
          : 'Dokumen serah terima telah dihapus permanen dari sistem.',
        'success'
      );
    } catch (err) {
      console.error('Error deleting handover:', err);
      showToast('Gagal Menghapus', 'Terjadi kesalahan saat menghapus data serah terima', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isLocked = handoverStatus === 'received';
  const isReceiver = activeProfile.id === receiverProfileId || isAdmin;

  // Filtered lists for Tab 1 & Tab 3
  const pendingHandoversForMe = useMemo(() => {
    return allHandovers.filter(
      (h) => h.status === 'pending' && (isAdmin || h.receiver_profile_id === activeProfile.id)
    );
  }, [allHandovers, activeProfile.id, isAdmin]);

  const allPendingHandovers = useMemo(() => {
    return allHandovers.filter((h) => h.status === 'pending');
  }, [allHandovers]);

  const filteredHistory = useMemo(() => {
    return allHandovers.filter((h) => {
      const q = historySearch.toLowerCase();
      const matchSearch =
        !q ||
        h.giver?.full_name.toLowerCase().includes(q) ||
        h.receiver?.full_name.toLowerCase().includes(q) ||
        h.shift_from?.name.toLowerCase().includes(q) ||
        h.shift_to?.name.toLowerCase().includes(q) ||
        h.shift_date.includes(q);

      const matchStatus = historyStatusFilter === 'all' || h.status === historyStatusFilter;
      const matchDate = !historyDateFilter || h.shift_date === historyDateFilter;

      return matchSearch && matchStatus && matchDate;
    });
  }, [allHandovers, historySearch, historyStatusFilter, historyDateFilter]);

  if (isLoading && allHandovers.length === 0) {
    return <SerahTerimaSkeleton />;
  }

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* =========================================================================
          BANNER PENGINGAT OPERAN MASUK (JIKA ADA OPERAN MENUNGGU PENERIMAAN)
      ========================================================================= */}
      {pendingHandoversForMe.length > 0 && activeTab !== 'masuk' && (
        <div className="no-print bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-4 sm:p-4.5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in border border-amber-400/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Inbox className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Operan Shift Menunggu Konfirmasi Anda!
                </h3>
                <span className="text-[10px] font-black bg-white text-amber-900 px-2 py-0.5 rounded-full uppercase">
                  {pendingHandoversForMe.length} Operan
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Terdapat serah terima jaga dari rekan ATLM yang belum Anda konfirmasi penerimaannya.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('masuk')}
            className="flex items-center justify-center gap-2 bg-white hover:bg-amber-50 text-amber-900 font-bold text-xs py-2.5 px-4 rounded-xl shadow transition shrink-0"
          >
            <span>Buka Operan Masuk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          HEADER & NAVIGATION TABS
      ========================================================================= */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Serah Terima Jaga Shift (Operan ATLM)
            </h1>
            <span className="text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              RSUD SMJ I Kayong Utara
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Digitalisasi pencatatan operan shift 17 unit laboratorium, kondisi analizer &amp; konfirmasi penerima
          </p>
        </div>

        {/* Action button: Buat Baru */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => handleCreateNewHandover()}
            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Operan Baru</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors min-h-[44px]"
            title="Cetak atau Simpan PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          3 UTAMA TABS: OPERAN MASUK, FORMULIR, RIWAYAT
      ========================================================================= */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
        {/* Tab 1: Operan Masuk */}
        <button
          onClick={() => setActiveTab('masuk')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[46px] ${
            activeTab === 'masuk'
              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-900/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Operan Masuk</span>
          {pendingHandoversForMe.length > 0 ? (
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                activeTab === 'masuk' ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-amber-500 text-white animate-pulse'
              }`}
            >
              {pendingHandoversForMe.length} Menunggu
            </span>
          ) : allPendingHandovers.length > 0 ? (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === 'masuk' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {allPendingHandovers.length} Total
            </span>
          ) : null}
        </button>

        {/* Tab 2: Formulir Serah Terima */}
        <button
          onClick={() => setActiveTab('form')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[46px] ${
            activeTab === 'form'
              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-900/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Formulir Serah Terima</span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
              handoverStatus === 'received'
                ? activeTab === 'form'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
                : handoverStatus === 'pending'
                ? activeTab === 'form'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-amber-100 text-amber-800'
                : activeTab === 'form'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {handoverStatus === 'received'
              ? 'Diterima'
              : handoverStatus === 'pending'
              ? 'Menunggu'
              : handoverStatus === 'revision_needed'
              ? 'Revisi'
              : 'Draf'}
          </span>
        </button>

        {/* Tab 3: Data & Riwayat Operan */}
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[46px] ${
            activeTab === 'riwayat'
              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-900/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Data &amp; Riwayat Operan</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'riwayat' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {allHandovers.length} Arsip
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OPERAN MASUK (MENUNGGU KONFIRMASI PENERIMAAN)
      ========================================================================= */}
      {activeTab === 'masuk' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-teal-600" />
                Daftar Operan Shift Masuk
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dokumen serah terima shift yang dikirim oleh rekan ATLM jaga sebelumnya dan menunggu verifikasi &amp; konfirmasi penerimaan.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              {pendingHandoversForMe.length} Menunggu Konfirmasi Anda
            </span>
          </div>

          {allPendingHandovers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {allPendingHandovers.map((ho) => {
                const isTargetForMe = ho.receiver_profile_id === activeProfile.id || isAdmin;
                const activeCatKeys = Object.entries(ho.categories_data || {}).filter(([_, data]) => {
                  return (
                    Number(data.patient_count) > 0 ||
                    data.ongoing_tests ||
                    data.pending_samples ||
                    data.unverified_results ||
                    data.issues_notes
                  );
                });

                const citoTasks = (ho.pending_tasks || []).filter((t) => t.priority === 'tinggi_cito');

                return (
                  <div
                    key={ho.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-sm space-y-4 ${
                      isTargetForMe
                        ? 'border-amber-300 bg-gradient-to-b from-amber-50/30 to-white ring-1 ring-amber-300/60'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Row: Shift, Date, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                          📅 {ho.shift_date}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {ho.shift_from?.name || 'Shift Asal'} &rarr; {ho.shift_to?.name || 'Shift Tujuan'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTargetForMe && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full animate-pulse shadow-xs">
                            Perlu Konfirmasi Anda
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full">
                          Menunggu Penerimaan
                        </span>
                      </div>
                    </div>

                    {/* Middle Grid: Giver, Receiver, Total Pasien, Waktu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Giver */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <Avatar profile={ho.giver} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Petugas Penyerah</p>
                          <p className="font-bold text-slate-800 truncate mt-0.5">{ho.giver?.full_name || 'Petugas'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Pukul {ho.given_at?.slice(11, 16)} WIB</p>
                        </div>
                      </div>

                      {/* Receiver */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <Avatar profile={ho.receiver} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Petugas Penerima (Tujuan)</p>
                          <p className="font-bold text-slate-800 truncate mt-0.5">
                            {ho.receiver?.full_name || 'Belum Dipilih'}
                          </p>
                          <p className="text-[10px] text-amber-700 font-semibold">Menunggu konfirmasi</p>
                        </div>
                      </div>

                      {/* Total Pasien */}
                      <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-teal-800">Total Pasien Shift</p>
                          <p className="text-[11px] text-teal-600">Akumulasi 17 Unit</p>
                        </div>
                        <span className="text-xl font-extrabold font-mono text-teal-900 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200">
                          {ho.total_patients}
                        </span>
                      </div>

                      {/* Tugas Tertunda */}
                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-rose-800">Tugas Prioritas / Cito</p>
                          <p className="text-[11px] text-rose-600">Perlu Tindak Lanjut</p>
                        </div>
                        <span className="text-xl font-extrabold font-mono text-rose-900 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200">
                          {ho.pending_tasks?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Pending Tasks Quick List if any */}
                    {ho.pending_tasks && ho.pending_tasks.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5 text-xs">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-amber-700" />
                          Pekerjaan Tertunda Yang Harus Ditindaklanjuti ({ho.pending_tasks.length} Tugas):
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {ho.pending_tasks.map((t) => (
                            <div
                              key={t.id}
                              className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] flex items-start gap-2"
                            >
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                  t.priority === 'tinggi_cito'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {t.priority === 'tinggi_cito' ? 'CITO' : t.priority}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800">{t.task_type}</p>
                                <p className="text-slate-600 mt-0.5">{t.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Categories Highlights */}
                    {activeCatKeys.length > 0 && (
                      <div className="text-xs space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Catatan Penting Unit / Ruangan ({activeCatKeys.length} Unit):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeCatKeys.slice(0, 5).map(([catId, catData]) => {
                            const cat = categories.find((c) => c.id === catId);
                            return (
                              <span
                                key={catId}
                                className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[11px]"
                              >
                                <span className="font-bold">{cat?.name || catId}:</span>
                                <span>{catData.patient_count} pasien</span>
                                {catData.ongoing_tests && <span className="text-amber-700 font-semibold">&bull; ongoing</span>}
                                {catData.pending_samples && <span className="text-rose-700 font-semibold">&bull; sample</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action buttons on Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectHandoverToReview(ho)}
                          className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-colors"
                        >
                          <Eye className="w-4 h-4 text-teal-600" />
                          <span>Buka &amp; Periksa Formulir</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedDetailModal(ho);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                          <span>Cetak PDF</span>
                        </button>
                      </div>

                      {/* Receiver Actions / Admin Delete */}
                      <div className="flex items-center gap-2">
                        {(isAdmin || ho.giver_profile_id === activeProfile.id) && (
                          <button
                            onClick={() => handleDeleteHandover(ho)}
                            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-colors"
                            title="Hapus Operan Masuk"
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        )}
                        {isTargetForMe && (
                          <>
                            <button
                              onClick={() => setTargetRejectHandover(ho)}
                              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-colors"
                            >
                              <RotateCcw className="w-4 h-4 text-rose-600" />
                              <span>Minta Revisi</span>
                            </button>

                            <button
                              onClick={() => setTargetConfirmHandover(ho)}
                              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all"
                            >
                              <Check className="w-4 h-4" />
                              <span>Konfirmasi Diterima</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-sm text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">Semua Operan Telah Diterima</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ada dokumen serah terima jaga yang sedang berstatus menunggu penerimaan saat ini. Seluruh shift telah resmi dikonfirmasi.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  onClick={() => handleCreateNewHandover()}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition"
                >
                  Buat Serah Terima Baru
                </button>
                <button
                  onClick={() => setActiveTab('riwayat')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl transition"
                >
                  Lihat Riwayat &amp; Arsip
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: FORMULIR SERAH TERIMA JAGA
      ========================================================================= */}
      {activeTab === 'form' && (
        <div className="space-y-5 animate-fade-in">
          {/* Top Form Status & Control Bar */}
          <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {handoverStatus === 'draft' ? 'Formulir Serah Terima Jaga (Draf)' : 'Dokumen Serah Terima Jaga'}
                </h2>
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
                    ? 'Status: Diterima Resmi'
                    : handoverStatus === 'pending'
                    ? 'Status: Menunggu Penerimaan'
                    : handoverStatus === 'revision_needed'
                    ? 'Status: Perlu Revisi'
                    : 'Status: Draf (Belum Terkirim)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ID Dokumen: <strong className="font-mono text-slate-700">{currentHandoverId}</strong>
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {(isAdmin || handoverStatus === 'draft' || giverProfileId === activeProfile.id) && (
                <button
                  type="button"
                  onClick={() => promptDeleteHandover()}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-colors min-h-[44px]"
                  title={handoverStatus === 'draft' ? 'Hapus / Bersihkan Formulir Draf' : 'Hapus Dokumen Serah Terima'}
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>{handoverStatus === 'draft' ? 'Hapus Draf' : 'Hapus Formulir'}</span>
                </button>
              )}
              {!isLocked && (
                <>
                  <button
                    onClick={() => handleSaveHandover('draft')}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3.5 rounded-xl transition-colors min-h-[44px]"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                    <span>Simpan Draf</span>
                  </button>

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
                  Dokumen serah terima ini telah <strong>dikonfirmasi &amp; diterima</strong>. Data terkunci dari perubahan langsung untuk menjamin audit trail.
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

          {/* BAGIAN 1: IDENTITAS SERAH TERIMA JAGA */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Petugas Yang Menyerahkan</label>
                  <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    {giverProfilesOnDuty.length > 0 && assignments.some(a => a.shift_date === shiftDate && a.shift_id === shiftFromId)
                      ? `✨ ${giverProfilesOnDuty.length} Petugas Dinas Aktif`
                      : 'Semua Petugas'}
                  </span>
                </div>
                <select
                  disabled={isLocked}
                  value={giverProfileId}
                  onChange={(e) => setGiverProfileId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold text-slate-900 text-xs sm:text-sm"
                >
                  {giverProfilesOnDuty.map((p) => {
                    const isAssigned = assignments.some(
                      (a) => a.shift_date === shiftDate && a.shift_id === shiftFromId && a.profile_id === p.id
                    );
                    return (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.position || 'ATLM'}) {isAssigned ? '✓ [Jadwal Shift Asal]' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Otomatis terbaca dari petugas yang terjadwal jaga pada tanggal dan shift asal terpilih.
                </p>
              </div>

              {/* Petugas Yang Menerima */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Petugas Yang Menerima</label>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {receiverProfilesOnDuty.length > 0 && assignments.some(a => a.shift_date === shiftDate && a.shift_id === shiftToId)
                      ? `✨ ${receiverProfilesOnDuty.length} Petugas Pengganti Aktif`
                      : 'Semua Petugas'}
                  </span>
                </div>
                <select
                  disabled={isLocked}
                  value={receiverProfileId}
                  onChange={(e) => setReceiverProfileId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold text-slate-900 text-xs sm:text-sm"
                >
                  <option value="">-- Pilih Petugas Penerima --</option>
                  {receiverProfilesOnDuty.map((p) => {
                    const isAssigned = assignments.some(
                      (a) => a.shift_date === shiftDate && a.shift_id === shiftToId && a.profile_id === p.id
                    );
                    return (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.position || 'ATLM'}) {isAssigned ? '✓ [Jadwal Shift Tujuan]' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Otomatis terbaca dari petugas yang terjadwal jaga pada tanggal dan shift tujuan berikutnya.
                </p>
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

          {/* BAGIAN 2: 17 KATEGORI PEMERIKSAAN PASIEN */}
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
                          <label className="block font-semibold text-slate-700 mb-1">Kendala &amp; Catatan Khusus</label>
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

          {/* BAGIAN 3: KONDISI LABORATORIUM & ALAT */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-teal-600" />
                  3. Kondisi Laboratorium &amp; Alat
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

          {/* BAGIAN 4: PEKERJAAN TERTUNDA & TINDAK LANJUT */}
          <div id="tasks" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  4. Pekerjaan Tertunda &amp; Tindak Lanjut
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
                        <span className="text-[10px] text-slate-400 capitalize">&bull; {task.status.replace('_', ' ')}</span>
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

          {/* BAGIAN 5: RIWAYAT STATUS & LOG PERUBAHAN */}
          {statusLogs && statusLogs.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Riwayat Perubahan &amp; Audit Status Serah Terima
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

          {/* Bottom Save / Submit Bar */}
          {!isLocked && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Pastikan data 17 unit pemeriksaan, kondisi alat, dan tugas tertunda telah terisi akurat.
              </p>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSaveHandover('draft')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition"
                >
                  Simpan Draf
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveHandover('pending')}
                  className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow transition"
                >
                  Kirim Serah Terima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: DATA & RIWAYAT OPERAN (ARSIP LENGKAP)
      ========================================================================= */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari nama petugas, shift, tanggal..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
              >
                <option value="all">Semua Status Operan</option>
                <option value="received">Diterima Resmi</option>
                <option value="pending">Menunggu Penerimaan</option>
                <option value="draft">Draf</option>
                <option value="revision_needed">Perlu Revisi</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={historyDateFilter}
                onChange={(e) => setHistoryDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
            </div>
          </div>

          {/* List of Archived Handovers */}
          {filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredHistory.map((ho) => (
                <div
                  key={ho.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Date & Status */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {ho.shift_date}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          ho.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ho.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            : ho.status === 'revision_needed'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {ho.status === 'received'
                          ? 'Diterima'
                          : ho.status === 'pending'
                          ? 'Menunggu Penerimaan'
                          : ho.status === 'revision_needed'
                          ? 'Perlu Revisi'
                          : 'Draf'}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                        {ho.shift_from?.name || 'Shift Asal'} &rarr; {ho.shift_to?.name || 'Shift Tujuan'}
                      </h4>

                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Penyerah</p>
                          <p className="font-bold text-slate-800 truncate mt-0.5">{ho.giver?.full_name || 'Petugas'}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{ho.given_at?.slice(11, 16)} WIB</p>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] text-slate-400 uppercase font-semibold">Penerima</p>
                          <p className="font-bold text-slate-800 truncate mt-0.5">
                            {ho.receiver?.full_name || 'Menunggu'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {ho.received_at ? `${ho.received_at.slice(11, 16)} WIB` : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 bg-teal-50/50 p-2 rounded-xl border border-teal-100">
                        <span>Total Pemeriksaan:</span>
                        <span className="font-bold font-mono text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                          {ho.total_patients} Pasien
                        </span>
                      </div>

                      {ho.revision_notes && (
                        <div className="mt-2 text-[11px] text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          <strong>Catatan Revisi:</strong> {ho.revision_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2.5 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => setSelectedDetailModal(ho)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian</span>
                    </button>

                    <button
                      onClick={() => handleSelectHandoverToReview(ho)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors min-h-[40px]"
                    >
                      <span>Buka Form</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedDetailModal(ho);
                        setTimeout(() => window.print(), 200);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center transition-colors min-h-[40px]"
                      title="Cetak PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {(isAdmin || ho.giver_profile_id === activeProfile.id) && (
                      <button
                        onClick={() => handleDeleteHandover(ho)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center transition-colors min-h-[40px]"
                        title="Hapus Data & Riwayat Operan"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <History className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Tidak Ada Riwayat Operan</h4>
              <p className="text-xs text-slate-500">Tidak ada data serah terima yang cocok dengan filter pencarian.</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: SUKSES PENGIRIMAN SERAH TERIMA
      ========================================================================= */}
      {submittedSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Terkirim ke Petugas Penerima
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg mt-2">
                Serah Terima Berhasil Terkirim!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Dokumen operan shift telah disimpan ke basis data dan diteruskan kepada rekan shift berikutnya.
              </p>
            </div>

            {/* Summary card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span className="font-mono font-bold text-slate-800">{submittedSuccessModal.shift_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift:</span>
                <span className="font-bold text-slate-800">
                  {submittedSuccessModal.shift_from?.name || 'Shift Asal'} &rarr;{' '}
                  {submittedSuccessModal.shift_to?.name || 'Shift Tujuan'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penerima:</span>
                <span className="font-bold text-teal-800">
                  {submittedSuccessModal.receiver?.full_name || 'Petugas Shift Berikutnya'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Pasien:</span>
                <span className="font-mono font-bold text-slate-800">{submittedSuccessModal.total_patients} Pasien</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSubmittedSuccessModal(null);
                  setActiveTab('riwayat');
                }}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <History className="w-4 h-4" />
                <span>Lihat di Data &amp; Riwayat Operan</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSubmittedSuccessModal(null);
                    window.print();
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  onClick={() => {
                    setSubmittedSuccessModal(null);
                    handleCreateNewHandover();
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Baru</span>
                </button>
              </div>

              <button
                onClick={() => setSubmittedSuccessModal(null)}
                className="text-xs text-slate-400 hover:text-slate-600 py-1"
              >
                Tetap di Formulir Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI PENERIMAAN LANGSUNG
      ========================================================================= */}
      {(confirmModalOpen || targetConfirmHandover) && (
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
                onClick={() => {
                  if (targetConfirmHandover) {
                    handleConfirmDirect(targetConfirmHandover);
                  } else {
                    setConfirmModalOpen(false);
                    handleSaveHandover('received', `Diterima dan dikonfirmasi resmi oleh ${activeProfile.full_name}`);
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Ya, Konfirmasi &amp; Terima
              </button>
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setTargetConfirmHandover(null);
                }}
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
      {(rejectModalOpen || targetRejectHandover) && (
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
                onClick={() => {
                  if (targetRejectHandover) {
                    handleRejectDirect(targetRejectHandover, rejectionReason);
                  } else {
                    if (!rejectionReason) {
                      showToast('Catatan Diperlukan', 'Harap isi alasan revisi', 'error');
                      return;
                    }
                    setRejectModalOpen(false);
                    handleSaveHandover('revision_needed', `Permintaan revisi: ${rejectionReason}`);
                  }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Kirim Revisi
              </button>
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setTargetRejectHandover(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS */}
      {deleteTargetHandover && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg text-slate-900">Konfirmasi Hapus</h3>
            <p className="text-sm text-slate-600 mt-2">
              Apakah Anda yakin ingin menghapus {deleteTargetHandover.status === 'draft' ? 'draf ini' : 'data operan ini'}?
              {deleteTargetHandover.status !== 'draft' && ' Data yang dihapus tidak dapat dikembalikan.'}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteTargetHandover(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                onClick={executeDeleteHandover}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DETAIL LENGKAP ARSIP OPERAN
      ========================================================================= */}
      {selectedDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-xs animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Rincian Dokumen Serah Terima Jaga</h3>
                <p className="text-slate-400 font-mono text-[11px]">ID: {selectedDetailModal.id}</p>
              </div>
              <button
                onClick={() => setSelectedDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                Tutup &times;
              </button>
            </div>

            {/* Identitas Ringkas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tanggal</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedDetailModal.shift_date}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Shift</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedDetailModal.shift_from?.name} &rarr; {selectedDetailModal.shift_to?.name}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Penyerah</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedDetailModal.giver?.full_name}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Penerima</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedDetailModal.receiver?.full_name || '-'}</p>
              </div>
            </div>

            {/* Total Pasien */}
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between">
              <span className="font-bold text-teal-900">Total Pasien / Sampel Tercatat:</span>
              <span className="font-mono font-extrabold text-base text-teal-900">{selectedDetailModal.total_patients} Pasien</span>
            </div>

            {/* Unit/Kategori Ringkasan */}
            {selectedDetailModal.categories_data && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Rincian 17 Unit Pemeriksaan:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(selectedDetailModal.categories_data)
                    .filter(([_, d]) => Number(d.patient_count) > 0 || d.ongoing_tests || d.pending_samples || d.issues_notes)
                    .map(([catId, d]) => {
                      const cat = categories.find((c) => c.id === catId);
                      return (
                        <div key={catId} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{cat?.name || catId}</span>
                            <span className="font-mono text-teal-700">{d.patient_count} psn</span>
                          </div>
                          {d.ongoing_tests && <p className="text-slate-600 mt-0.5">Sedang berjalan: {d.ongoing_tests}</p>}
                          {d.pending_samples && <p className="text-rose-700 mt-0.5">Sampel tertunda: {d.pending_samples}</p>}
                          {d.issues_notes && <p className="text-amber-800 mt-0.5">Kendala: {d.issues_notes}</p>}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Tugas Tertunda */}
            {selectedDetailModal.pending_tasks && selectedDetailModal.pending_tasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Tugas Tertunda / Cito:</h4>
                <div className="space-y-1.5">
                  {selectedDetailModal.pending_tasks.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{t.task_type}</span>
                        <span className="text-[9px] font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{t.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setSelectedDetailModal(null);
                  handleSelectHandoverToReview(selectedDetailModal);
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition"
              >
                Buka &amp; Edit di Formulir
              </button>
              <button
                onClick={() => {
                  setSelectedDetailModal(null);
                  window.print();
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition"
              >
                Cetak PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

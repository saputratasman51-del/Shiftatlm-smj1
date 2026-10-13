/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  RotateCcw,
  Square,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  Smartphone,
  Radio,
  Loader2,
  Terminal,
  Copy,
  Check,
  X,
  Activity,
  ChevronDown,
  ChevronUp,
  Settings,
  Crown,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { ShiftAssignment, Shift, UserProfile } from '../types';
import { dataService, getPontianakDateString } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import {
  useVoiceAssistant,
  TEST_VOICE_PHRASE,
  primeAudio,
  playMelodicChime,
  VoiceDiagnosticLog,
  FailureStage,
} from '../hooks/useVoiceAssistant';

interface VoiceAssistantProps {
  activeProfileId: string;
  activeProfileName: string;
  isAdmin?: boolean;
  profiles?: UserProfile[];
  assignments: ShiftAssignment[];
  shifts: Shift[];
  onNavigateDate: (dateStr: string) => void;
  onSelectMonth: (yearMonth: string) => void;
  onFilterStaff: (profileId: string) => void;
  onSelectAssignment?: (assignment: ShiftAssignment) => void;
}

const INDONESIAN_MONTHS: Record<string, { num: string; name: string }> = {
  januari: { num: '01', name: 'Januari' },
  februari: { num: '02', name: 'Februari' },
  pebruari: { num: '02', name: 'Februari' },
  maret: { num: '03', name: 'Maret' },
  april: { num: '04', name: 'April' },
  mei: { num: '05', name: 'Mei' },
  juni: { num: '06', name: 'Juni' },
  juli: { num: '07', name: 'Juli' },
  agustus: { num: '08', name: 'Agustus' },
  september: { num: '09', name: 'September' },
  oktober: { num: '10', name: 'Oktober' },
  november: { num: '11', name: 'November' },
  nopember: { num: '11', name: 'November' },
  desember: { num: '12', name: 'Desember' },
  jan: { num: '01', name: 'Januari' },
  feb: { num: '02', name: 'Februari' },
  mar: { num: '03', name: 'Maret' },
  apr: { num: '04', name: 'April' },
  jun: { num: '06', name: 'Juni' },
  jul: { num: '07', name: 'Juli' },
  agu: { num: '08', name: 'Agustus' },
  ags: { num: '08', name: 'Agustus' },
  sep: { num: '09', name: 'September' },
  okt: { num: '10', name: 'Oktober' },
  nov: { num: '11', name: 'November' },
  des: { num: '12', name: 'Desember' },
};

const INDONESIAN_NUMBER_WORDS: Record<string, number> = {
  'tiga puluh satu': 31,
  'tiga puluh': 30,
  'dua puluh sembilan': 29,
  'dua puluh delapan': 28,
  'dua puluh tujuh': 27,
  'dua puluh enam': 26,
  'dua puluh lima': 25,
  'dua puluh empat': 24,
  'dua puluh tiga': 23,
  'dua puluh dua': 22,
  'dua puluh satu': 21,
  'dua puluh': 20,
  'sembilan belas': 19,
  'delapan belas': 18,
  'tujuh belas': 17,
  'enam belas': 16,
  'lima belas': 15,
  'empat belas': 14,
  'tiga belas': 13,
  'dua belas': 12,
  'sebelas': 11,
  'sepuluh': 10,
  'sembilan': 9,
  'delapan': 8,
  'tujuh': 7,
  'enam': 6,
  'lima': 5,
  'empat': 4,
  'tiga': 3,
  'dua': 2,
  'satu': 1,
};

/**
 * Normalizes staff name by removing professional credentials / academic degrees.
 */
export function cleanTitleFromStaffName(fullName: string): string {
  if (!fullName) return '';
  return fullName
    .replace(/,\s*(s\.tr\.kes|a\.md\.ak|a\.md\.kes|s\.si|s\.kep|m\.kes|s\.ked|skm|dr|apt|ns|sp\.[a-z]+)\b/gi, '')
    .replace(/\b(dr\.|drg\.|ns\.|apt\.|prof\.|h\.|hj\.)\s*/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Robust Indonesian staff matcher from spoken transcript.
 */
export function matchStaffFromSpokenText(
  spokenText: string,
  allStaffProfiles: UserProfile[],
  currentUserId: string
): {
  matchedProfile: UserProfile | null;
  isSelfExplicit: boolean;
  score: number;
} {
  const text = spokenText.toLowerCase().trim();

  // 1. Explicit self keywords
  const isSelfWord =
    text.includes('saya') ||
    text.includes('jadwal saya') ||
    text.includes('shift saya') ||
    text.includes('dinas saya') ||
    text.includes('jadwalku') ||
    text.includes('shiftku') ||
    text.includes('akun saya') ||
    text.includes('diri saya');

  if (isSelfWord) {
    const selfProfile = allStaffProfiles.find((p) => p.id === currentUserId) || null;
    return { matchedProfile: selfProfile, isSelfExplicit: true, score: 100 };
  }

  // 2. Score each registered staff profile against spoken text
  let bestProfile: UserProfile | null = null;
  let highestScore = 0;

  for (const profile of allStaffProfiles) {
    const cleanFull = cleanTitleFromStaffName(profile.full_name).toLowerCase();
    const nameParts = cleanFull.split(' ').filter((p) => p.length >= 3);

    let score = 0;

    // Full name match (e.g. "siti rahmawati", "budi santoso", "ahmad fauzi")
    if (text.includes(cleanFull)) {
      score = 100 + cleanFull.length;
    } else {
      let matchedPartsCount = 0;
      for (const part of nameParts) {
        const regex = new RegExp(`\\b${part}\\b`, 'i');
        if (regex.test(text)) {
          matchedPartsCount++;
        }
      }

      if (matchedPartsCount === nameParts.length && nameParts.length > 0) {
        score = 85;
      } else if (matchedPartsCount > 0) {
        score = 50 + (matchedPartsCount * 10);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestProfile = profile;
    }
  }

  if (highestScore >= 50 && bestProfile) {
    return {
      matchedProfile: bestProfile,
      isSelfExplicit: bestProfile.id === currentUserId,
      score: highestScore,
    };
  }

  return { matchedProfile: null, isSelfExplicit: false, score: 0 };
}

/**
 * Extracts date, month, and year from natural Indonesian speech.
 */
export function extractDateAndMonth(text: string, todayDateStr: string): {
  targetDateStr: string;
  matchedDay: string | null;
  matchedMonthName: string | null;
  matchedYear: string | null;
} {
  const [currYearStr, currMonthStr, currDayStr] = todayDateStr.split('-');
  const todayObj = new Date(parseInt(currYearStr), parseInt(currMonthStr) - 1, parseInt(currDayStr));

  // Check relative dates
  if (text.includes('hari ini') || text.includes('sekarang')) {
    return {
      targetDateStr: todayDateStr,
      matchedDay: currDayStr,
      matchedMonthName: null,
      matchedYear: currYearStr,
    };
  }
  if (text.includes('besok')) {
    const tomorrow = new Date(todayObj);
    tomorrow.setDate(todayObj.getDate() + 1);
    const dateStr = getPontianakDateString(tomorrow);
    return { targetDateStr: dateStr, matchedDay: dateStr.slice(8, 10), matchedMonthName: null, matchedYear: dateStr.slice(0, 4) };
  }
  if (text.includes('lusa')) {
    const lusa = new Date(todayObj);
    lusa.setDate(todayObj.getDate() + 2);
    const dateStr = getPontianakDateString(lusa);
    return { targetDateStr: dateStr, matchedDay: dateStr.slice(8, 10), matchedMonthName: null, matchedYear: dateStr.slice(0, 4) };
  }
  if (text.includes('kemarin')) {
    const yesterday = new Date(todayObj);
    yesterday.setDate(todayObj.getDate() - 1);
    const dateStr = getPontianakDateString(yesterday);
    return { targetDateStr: dateStr, matchedDay: dateStr.slice(8, 10), matchedMonthName: null, matchedYear: dateStr.slice(0, 4) };
  }

  // Pre-process text to convert Indonesian number words if present
  let processedText = text;
  for (const [word, num] of Object.entries(INDONESIAN_NUMBER_WORDS)) {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    if (reg.test(processedText)) {
      processedText = processedText.replace(reg, num.toString());
      break;
    }
  }

  // Extract day number
  let extractedDay: string | null = null;
  const dayWithPrefixRegex = /(?:tanggal|tgl\.?)\s*(\b[0-9]{1,2}\b)/i;
  const dayWithPrefixMatch = processedText.match(dayWithPrefixRegex);
  if (dayWithPrefixMatch) {
    const d = parseInt(dayWithPrefixMatch[1], 10);
    if (d >= 1 && d <= 31) extractedDay = String(d).padStart(2, '0');
  }

  if (!extractedDay) {
    // Look for standalone 1-31 number
    const standaloneDayRegex = /\b([1-9]|[12][0-9]|3[01])\b/;
    const standaloneMatch = processedText.match(standaloneDayRegex);
    if (standaloneMatch) {
      extractedDay = String(parseInt(standaloneMatch[1], 10)).padStart(2, '0');
    }
  }

  // Extract month
  let extractedMonthNum: string | null = null;
  let extractedMonthName: string | null = null;
  for (const [key, meta] of Object.entries(INDONESIAN_MONTHS)) {
    const reg = new RegExp(`\\b${key}\\b`, 'i');
    if (reg.test(processedText)) {
      extractedMonthNum = meta.num;
      extractedMonthName = meta.name;
      break;
    }
  }

  // Extract year
  let extractedYear: string | null = null;
  const yearMatch = processedText.match(/\b(202[4-9])\b/);
  if (yearMatch) {
    extractedYear = yearMatch[1];
  }

  if (extractedDay) {
    const finalYear = extractedYear || currYearStr;
    const finalMonth = extractedMonthNum || currMonthStr;
    return {
      targetDateStr: `${finalYear}-${finalMonth}-${extractedDay}`,
      matchedDay: extractedDay,
      matchedMonthName: extractedMonthName,
      matchedYear: finalYear,
    };
  }

  return {
    targetDateStr: todayDateStr,
    matchedDay: null,
    matchedMonthName: extractedMonthName,
    matchedYear: extractedYear || currYearStr,
  };
}

export function VoiceAssistant({
  activeProfileId,
  activeProfileName,
  isAdmin,
  profiles = [],
  assignments,
  shifts,
  onNavigateDate,
  onSelectMonth,
  onFilterStaff,
  onSelectAssignment,
}: VoiceAssistantProps) {
  const auth = useAuth();
  const effectiveIsAdmin = isAdmin !== undefined ? isAdmin : auth?.isAdmin ?? false;
  const effectiveProfiles = profiles.length > 0 ? profiles : auth?.allProfiles ?? [];

  const [textInputFallback, setTextInputFallback] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [matchedAssignmentResult, setMatchedAssignmentResult] = useState<ShiftAssignment | null>(null);
  const [matchedTargetProfile, setMatchedTargetProfile] = useState<UserProfile | null>(null);
  const [isStaffSearchMatched, setIsStaffSearchMatched] = useState<boolean>(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showAndroidTtsGuideModal, setShowAndroidTtsGuideModal] = useState(false);
  const [showInlineMobileDiag, setShowInlineMobileDiag] = useState(false);
  const [copiedLogStatus, setCopiedLogStatus] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    status,
    transcript,
    responseMessage,
    speechEnabled,
    isPwa,
    isRecognitionSupported,
    isSynthesisSupported,
    errorMessage,
    availableVoices,
    voiceLanguages,
    hasIndonesianVoice,
    selectedVoice,
    testAudioStatus,
    testAudioMessage,
    autoplayBlocked,
    diagnosticLogs,
    lastErrorCode,
    lastFailureStage,
    processStatus,
    setAutoplayBlocked,
    setSpeechEnabled,
    setTranscript,
    setResponseMessage,
    setStatus,
    setErrorMessage,
    clearDiagnosticLogs,
    startListening,
    stopListening,
    speakResponse,
    stopSpeaking,
    repeatResponse,
    runAudioTest,
  } = useVoiceAssistant({
    defaultSpeechEnabled: true,
    onCommandRecognized: (recognizedText) => {
      handleProcessCommand(recognizedText);
    },
  });

  /**
   * Main command processing logic:
   * 1. Supports Admin voice searching ANY registered staff schedule by name + date + month
   * 2. Protects staff privacy (non-admin can only access own schedule)
   * 3. Syncs calendar view and active staff filter
   * 4. Synthesizes and speaks Indonesian verbal reply
   */
  const handleProcessCommand = async (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    setStatus('searching');
    setErrorMessage(null);
    setMatchedAssignmentResult(null);
    setMatchedTargetProfile(null);
    setIsStaffSearchMatched(false);
    setAutoplayBlocked(false);

    const text = rawText.toLowerCase().trim();

    try {
      // 1. Month-only navigation intent (e.g., "buka kalender bulan november 2026")
      const isMonthOnlyQuery =
        (text.includes('buka') || text.includes('lihat') || text.includes('tampilkan') || text.startsWith('bulan')) &&
        text.includes('bulan') &&
        !text.includes('tanggal') &&
        !text.includes('tgl') &&
        !text.match(/\b([1-9]|[12][0-9]|3[01])\b/);

      if (isMonthOnlyQuery) {
        for (const [key, meta] of Object.entries(INDONESIAN_MONTHS)) {
          if (text.includes(key)) {
            const yearMatch = text.match(/\b(202[4-9])\b/);
            const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
            const targetYM = `${year}-${meta.num}`;

            onSelectMonth(targetYM);

            const reply = `Baik, kalender telah diarahkan ke bulan ${meta.name} ${year}.`;
            setResponseMessage(reply);
            await speakResponse(reply);
            return;
          }
        }
      }

      // 2. Identify target staff from spoken transcript
      let registeredProfiles = effectiveProfiles;
      if (!registeredProfiles || registeredProfiles.length === 0) {
        try {
          registeredProfiles = await dataService.getProfiles();
        } catch (e) {
          registeredProfiles = [];
        }
      }

      const staffMatch = matchStaffFromSpokenText(text, registeredProfiles, activeProfileId);
      let targetProfile = staffMatch.matchedProfile;
      let isOtherStaffSearch = false;

      // Handle staff matching and role-based access control
      if (targetProfile && targetProfile.id !== activeProfileId) {
        if (!effectiveIsAdmin) {
          // Petugas selain admin HANYA bisa akses akunnya sendiri
          const callerCleanName = cleanTitleFromStaffName(activeProfileName);
          const deniedReply = `Mohon maaf, Anda masuk sebagai petugas ${callerCleanName}. Akses pencarian jadwal petugas lain hanya dapat dilakukan oleh Administrator. Sistem menampilkan jadwal dinas Anda sendiri.`;
          targetProfile = registeredProfiles.find((p) => p.id === activeProfileId) || null;
          isOtherStaffSearch = false;
          setResponseMessage(deniedReply);
        } else {
          // ADMIN DISETUJUI: Melakukan pencarian jadwal petugas terdaftar
          isOtherStaffSearch = true;
        }
      } else if (!targetProfile) {
        // If query mentions keyword petugas/staf but not matched to any registered profile
        const mentionsStaffKeywords = text.includes('petugas') || text.includes('staf') || text.includes('pegawai');
        if (mentionsStaffKeywords && effectiveIsAdmin) {
          const notFoundStaffReply = `Petugas dengan nama tersebut tidak ditemukan di daftar petugas terdaftar aplikasi. Silakan sebutkan nama petugas yang terdaftar seperti Siti Rahmawati, Budi Santoso, Nurul Hidayah, atau Ahmad Fauzi, disertai tanggal dan bulan shift.`;
          setResponseMessage(notFoundStaffReply);
          await speakResponse(notFoundStaffReply);
          return;
        }

        // Default to active profile
        targetProfile = registeredProfiles.find((p) => p.id === activeProfileId) || null;
      }

      // Ensure fallback targetProfile
      if (!targetProfile) {
        targetProfile = {
          id: activeProfileId,
          full_name: activeProfileName,
          nip_str: '',
          role: 'staff',
          position: 'Petugas ATLM',
          phone: '',
          is_active: true,
        };
      }

      setMatchedTargetProfile(targetProfile);
      setIsStaffSearchMatched(isOtherStaffSearch);

      // 3. Date, Month, and Year determination
      const todayDateStr = getPontianakDateString();
      const { targetDateStr } = extractDateAndMonth(text, todayDateStr);

      // 4. Search database for the schedule on targetDateStr
      let foundAssignment: ShiftAssignment | null = null;

      try {
        const freshAssignments = await dataService.getAssignments({
          date: targetDateStr,
          profileId: targetProfile.id,
        });

        if (freshAssignments && freshAssignments.length > 0) {
          foundAssignment = freshAssignments[0];
        }
      } catch (dbErr) {
        console.warn('Direct database fetch error, falling back to local assignments:', dbErr);
      }

      // Fallback to in-memory assignments prop
      if (!foundAssignment) {
        foundAssignment =
          assignments.find(
            (a) => a.profile_id === targetProfile?.id && a.shift_date === targetDateStr
          ) || null;
      }

      // 5. Navigate calendar to date and apply staff filter
      onNavigateDate(targetDateStr);
      onSelectMonth(targetDateStr.slice(0, 7));
      onFilterStaff(targetProfile.id);

      if (foundAssignment) {
        setMatchedAssignmentResult(foundAssignment);
        if (onSelectAssignment) {
          onSelectAssignment(foundAssignment);
        }
      } else {
        setMatchedAssignmentResult(null);
      }

      // 6. Build human-friendly Indonesian spoken response
      const [y, m, d] = targetDateStr.split('-');
      const targetDateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      const formattedDate = targetDateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const spokenStaffName = cleanTitleFromStaffName(targetProfile.full_name);
      let reply = '';

      if (isOtherStaffSearch) {
        // Voice response for Admin searching registered staff
        if (foundAssignment) {
          const resolvedShift =
            foundAssignment.shift || shifts.find((s) => s.id === foundAssignment?.shift_id);
          const shiftName = resolvedShift?.name || 'Shift Jaga';
          const startTime = resolvedShift?.start_time ? resolvedShift.start_time.slice(0, 5) : '';
          const endTime = resolvedShift?.end_time ? resolvedShift.end_time.slice(0, 5) : '';
          const timeDetail =
            startTime && endTime ? `pukul ${startTime} sampai ${endTime} W I B` : '';

          reply = `Jadwal shift ${spokenStaffName} pada hari ${formattedDate} adalah ${shiftName}${
            timeDetail ? ` ${timeDetail}` : ''
          }. Kalender dan filter petugas telah diarahkan ke ${spokenStaffName}.`;
        } else {
          reply = `Jadwal shift ${spokenStaffName} pada hari ${formattedDate} tidak ditemukan dalam sistem. Kemungkinan yang bersangkutan libur dinas jaga pada hari tersebut. Kalender telah diarahkan ke tanggal tersebut.`;
        }
      } else {
        // Voice response for searching own schedule
        if (foundAssignment) {
          const resolvedShift =
            foundAssignment.shift || shifts.find((s) => s.id === foundAssignment?.shift_id);
          const shiftName = resolvedShift?.name || 'Shift Jaga';
          const startTime = resolvedShift?.start_time ? resolvedShift.start_time.slice(0, 5) : '';
          const endTime = resolvedShift?.end_time ? resolvedShift.end_time.slice(0, 5) : '';
          const timeDetail =
            startTime && endTime ? `pukul ${startTime} sampai ${endTime} W I B` : '';

          reply = `Jadwal shift Anda pada hari ${formattedDate} adalah ${shiftName}${
            timeDetail ? ` ${timeDetail}` : ''
          }. Kalender sudah saya arahkan ke tanggal tersebut.`;
        } else {
          reply = `Maaf ${cleanTitleFromStaffName(activeProfileName)}, jadwal shift Anda pada hari ${formattedDate} tidak ditemukan. Kemungkinan Anda libur dinas jaga pada hari tersebut.`;
        }
      }

      setResponseMessage(reply);

      // 7. Speak the response aloud via Web Speech API
      await speakResponse(reply);
    } catch (err: any) {
      console.error('Error handling voice command:', err);
      const fallbackReply = 'Maaf, jadwal belum dapat diperiksa saat ini. Silakan coba kembali.';
      setResponseMessage(fallbackReply);
      setErrorMessage('Terjadi kesalahan saat memproses data jadwal.');
      await speakResponse(fallbackReply);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInputFallback.trim()) return;
    primeAudio();
    const submitted = textInputFallback.trim();
    setTranscript(submitted);
    setTextInputFallback('');
    handleProcessCommand(submitted);
  };

  const handleTestSampleCommand = (sample: string) => {
    primeAudio();
    setTranscript(sample);
    handleProcessCommand(sample);
  };

  // Status Badge for Assistant
  const renderStatusBadge = () => {
    switch (status) {
      case 'listening':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            Mendengarkan...
          </span>
        );
      case 'searching':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Search className="w-3 h-3 animate-spin text-amber-300" />
            Mencari jadwal...
          </span>
        );
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
            <Volume2 className="w-3 h-3 text-cyan-300 animate-bounce" />
            Membacakan jadwal...
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Selesai
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            <AlertCircle className="w-3 h-3 text-red-400" />
            Perlu Perhatian
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Tekan untuk berbicara
          </span>
        );
    }
  };

  // Status Badge for Test Audio Button
  const renderTestAudioBadge = () => {
    switch (testAudioStatus) {
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Memeriksa dukungan suara...
          </span>
        );
      case 'speaking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse shadow-sm shadow-cyan-500/20">
            <Volume2 className="w-3.5 h-3.5 animate-bounce text-cyan-300" />
            Sedang berbicara...
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Suara selesai.
          </span>
        );
      case 'failed':
        return (
          <div className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Gagal memutar suara{lastErrorCode ? ` [${lastErrorCode}]` : '.'}
            </span>
            {lastFailureStage && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-rose-950/80 text-rose-200 border border-rose-800/40">
                {lastFailureStage === 'failed-before-start'
                  ? 'Gagal sebelum mulai'
                  : lastFailureStage === 'failed-after-start'
                  ? 'Gagal setelah mulai'
                  : lastFailureStage === 'timeout-unresponsive'
                  ? 'Waktu habis'
                  : 'API tidak didukung'}
              </span>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-teal-500/30 relative overflow-hidden transition-all duration-300"
    >
      {/* Decorative ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Bar: Mic button + Title + Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          {/* Glowing Microphone Button */}
          <div className="relative shrink-0">
            {status === 'listening' && (
              <span className="absolute -inset-2 rounded-2xl bg-rose-500 opacity-60 animate-ping" />
            )}
            {status === 'speaking' && (
              <span className="absolute -inset-2 rounded-2xl bg-cyan-400 opacity-50 animate-pulse" />
            )}

            <button
              onClick={() => {
                if (status === 'listening') {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 cursor-pointer ${
                status === 'listening'
                  ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-400/30'
                  : status === 'speaking'
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/40 ring-4 ring-cyan-400/30'
                  : 'bg-gradient-to-tr from-teal-500 via-teal-400 to-cyan-300 text-slate-950 hover:from-teal-400 hover:to-cyan-200 shadow-teal-500/30'
              }`}
              title={
                status === 'listening'
                  ? 'Klik untuk berhenti merekam'
                  : 'Klik untuk bicara mencari jadwal shift'
              }
            >
              {status === 'listening' ? (
                <MicOff className="w-7 h-7 text-white animate-pulse" />
              ) : status === 'speaking' ? (
                <Volume2 className="w-7 h-7 text-slate-950 animate-bounce" />
              ) : (
                <Mic className="w-7 h-7 text-slate-950" />
              )}
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-300" />
                Asisten Suara Pintar (id-ID)
              </span>

              {effectiveIsAdmin ? (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 shadow-xs">
                  <Crown className="w-3 h-3 text-amber-300" />
                  Mode Admin: Cari Petugas
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" />
                  Mode Petugas (Akun Pribadi)
                </span>
              )}

              {isPwa && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-indigo-300" />
                  Mode PWA Aktif
                </span>
              )}

              {renderStatusBadge()}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mt-1 tracking-tight flex items-center gap-2">
              <span>Pencarian Jadwal Shift Berbasis Suara</span>
              {effectiveIsAdmin && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden xs:inline">
                  Akses Admin
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              {effectiveIsAdmin ? (
                <span>
                  👑 <span className="text-amber-300 font-semibold">Admin dapat mencari jadwal seluruh petugas terdaftar</span> dengan menyebut Nama Petugas + Tanggal + Bulan shift.
                </span>
              ) : (
                <span>
                  Petugas: <span className="font-semibold text-teal-300">{activeProfileName}</span> &bull; RSUD Sultan Muhammad Jamaludin I
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons: Audio toggle, Stop sound, Replay, Test audio, Manual text */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap relative z-10">
          {/* Stop Speaking button if active */}
          {status === 'speaking' && (
            <button
              onClick={stopSpeaking}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm animate-pulse cursor-pointer"
              title="Hentikan pembacaan suara"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Hentikan Suara</span>
            </button>
          )}

          {/* Repeat response button if previous response exists */}
          {responseMessage && status !== 'speaking' && (
            <button
              onClick={repeatResponse}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-teal-300 hover:text-white border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Putar ulang pembacaan jadwal terakhir"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Ulangi Suara</span>
            </button>
          )}

          {/* Dedicated TES SUARA Button */}
          <button
            onClick={() => runAudioTest()}
            disabled={testAudioStatus === 'checking' || testAudioStatus === 'speaking'}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 border border-cyan-400/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Uji speaker pembaca suara bahasa Indonesia (Independen)"
          >
            <Play className="w-3.5 h-3.5 text-white fill-white" />
            <span>TES SUARA</span>
          </button>

          {/* Audio toggle button */}
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              speechEnabled
                ? 'bg-teal-950/80 text-teal-300 border-teal-500/40 hover:bg-teal-900/80'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={speechEnabled ? 'Suara pembaca aktif (klik untuk membisukan)' : 'Suara pembaca mati (klik untuk aktifkan)'}
          >
            {speechEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">Suara: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Suara: OFF</span>
              </>
            )}
          </button>

          {/* Toggle manual text input */}
          <button
            onClick={() => setShowTextFallback(!showTextFallback)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              showTextFallback
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {showTextFallback ? 'Tutup Teks' : 'Ketik Manual'}
          </button>

          {/* Diagnostic Log viewer button */}
          <button
            onClick={() => setShowDiagnosticsModal(true)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer relative ${
              lastErrorCode
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900/80'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border-slate-700'
            }`}
            title="Buka panel log diagnostik Web Speech API & PWA"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Log Diagnostik</span>
            {diagnosticLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {diagnosticLogs.length}
              </span>
            )}
            {lastErrorCode && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
            )}
          </button>
        </div>
      </div>

      {/* Independent TES SUARA Execution & Status Panel */}
      {testAudioStatus !== 'idle' && (
        <div className="mt-3.5 p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 flex flex-col gap-3 animate-fade-in relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-cyan-200">
                    Uji Coba Pembacaan Suara:
                  </span>
                  {renderTestAudioBadge()}
                  {lastErrorCode && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                      Kode: {lastErrorCode}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 italic">
                  &ldquo;{TEST_VOICE_PHRASE}&rdquo;
                </p>
                {testAudioMessage && (
                  <p className="text-[10px] text-cyan-300/90 font-mono mt-0.5">
                    Status: {testAudioMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {testAudioStatus === 'speaking' ? (
                <button
                  onClick={stopSpeaking}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Hentikan</span>
                </button>
              ) : (
                <button
                  onClick={() => runAudioTest('indonesian-preferred')}
                  className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-200" />
                  <span>Uji Ulang</span>
                </button>
              )}

              {/* Toggle Inline Mobile Diagnostic */}
              <button
                onClick={() => setShowInlineMobileDiag(!showInlineMobileDiag)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  showInlineMobileDiag
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                }`}
                title="Tampilkan panel diagnostik teknis langsung di layar HP"
              >
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xs:inline">Diagnostik HP</span>
                {showInlineMobileDiag ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Actionable fallbacks & Troubleshooting buttons if failed */}
          {testAudioStatus === 'failed' && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold block w-full">
                Opsi Pemulihan Suara:
              </span>
              <button
                onClick={() => runAudioTest('system-id')}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                title="Coba tanpa mengikat objek suara (menggunakan synthesizer bawaan OS id-ID)"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Uji Suara Bawaan Sistem (id-ID)</span>
              </button>
              <button
                onClick={() => runAudioTest('neutral')}
                className="px-2.5 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-[11px] font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                title="Coba menggunakan suara netral perangkat"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Uji Suara Netral OS</span>
              </button>
              <button
                onClick={() => playMelodicChime()}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold rounded-lg border border-cyan-500/30 transition cursor-pointer flex items-center gap-1"
                title="Uji apakah speaker perangkat aktif menggunakan gelombang audio"
              >
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span>Tes Speaker (Melodi)</span>
              </button>
              <button
                onClick={() => setShowAndroidTtsGuideModal(true)}
                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 text-[11px] font-semibold rounded-lg border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
                title="Cara mengaktifkan dan mengunduh suara bahasa Indonesia di Android"
              >
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>Panduan TTS Android</span>
              </button>
              <button
                onClick={() => setShowDiagnosticsModal(true)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-mono rounded-lg border border-cyan-500/40 transition cursor-pointer flex items-center gap-1"
                title="Buka detail log diagnostik error lengkap"
              >
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Detail Log Error</span>
              </button>
            </div>
          )}

          {/* Quick Mobile Inline Diagnostic Card (directly visible on phone screen) */}
          {(showInlineMobileDiag || testAudioStatus === 'failed') && (
            <div className="mt-1 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-[11px] space-y-2 animate-fade-in font-sans">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  Diagnostik Cepat HP & PWA
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isPwa ? 'Mode: PWA Standalone' : 'Mode: Web Browser'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">API SpeechSynthesis</span>
                  <span className={isSynthesisSupported ? 'text-teal-300 font-bold' : 'text-rose-400 font-bold'}>
                    {isSynthesisSupported ? 'Didukung' : 'Tidak Didukung'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Jumlah Suara</span>
                  <span className="text-cyan-300 font-bold">
                    {availableVoices.length > 0 ? `${availableVoices.length} suara` : '0 (belum dimuat OS)'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Suara Indonesia</span>
                  <span className={hasIndonesianVoice ? 'text-emerald-300 font-bold' : 'text-amber-300 font-medium'}>
                    {hasIndonesianVoice ? (selectedVoice?.name || 'Tersedia') : 'Bawaan Sistem OS (id-ID)'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Kode Error Asli</span>
                  <span className={lastErrorCode ? 'text-rose-400 font-mono font-bold' : 'text-slate-400 font-mono'}>
                    {lastErrorCode || 'Nihil'}
                  </span>
                </div>
              </div>

              {voiceLanguages.length > 0 && (
                <div className="pt-1 border-t border-slate-900 text-[10px]">
                  <span className="text-slate-400 font-medium">Bahasa terdaftar pada perangkat: </span>
                  <span className="text-slate-300 font-mono">
                    {voiceLanguages.slice(0, 8).join(', ')}
                    {voiceLanguages.length > 8 ? ` (+${voiceLanguages.length - 8} lainnya)` : ''}
                  </span>
                </div>
              )}

              <div className="pt-1 border-t border-slate-900 text-[10px] flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-slate-400">Status Alur: </span>
                  <span className="text-slate-200 font-medium">{processStatus}</span>
                </div>
                {lastFailureStage && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50">
                    Tahap: {lastFailureStage}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spoken Equalizer / Audio Wave animation during 'speaking' */}
      {status === 'speaking' && (
        <div className="mt-3 py-2 px-3 bg-cyan-950/50 rounded-xl border border-cyan-500/40 flex items-center justify-between text-xs text-cyan-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="font-medium">Sedang membacakan respons:</span>
            {selectedVoice && (
              <span className="text-[10px] bg-cyan-900/60 px-2 py-0.5 rounded text-cyan-300 font-mono hidden md:inline">
                Suara: {selectedVoice.name}
              </span>
            )}
          </div>
          {/* Animated Wave Bars */}
          <div className="flex items-center gap-1">
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-4" style={{ animationDelay: '0ms' }} />
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-6" style={{ animationDelay: '150ms' }} />
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-3" style={{ animationDelay: '300ms' }} />
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-5" style={{ animationDelay: '450ms' }} />
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-4" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      )}

      {/* PWA Autoplay Restriction Banner (Shows friendly 1-tap "Dengarkan Jawaban" button if browser suppressed automatic playback) */}
      {autoplayBlocked && responseMessage && status !== 'speaking' && (
        <div className="mt-3.5 p-3.5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 rounded-xl border border-amber-500/50 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in relative z-10 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-100">
                Jawaban Siap Didengarkan (Kebijakan Audio PWA / Browser)
              </p>
              <p className="text-[11px] text-amber-300/90 mt-0.5">
                Perangkat atau PWA Anda membatasi suara otomatis setelah pencarian database. Tekan tombol untuk mendengarkan.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setAutoplayBlocked(false);
              repeatResponse();
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Dengarkan Jawaban</span>
          </button>
        </div>
      )}

      {/* Transcript & Response Area */}
      {(transcript || responseMessage || errorMessage) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs space-y-2.5 animate-fade-in relative z-10">
          {/* User's recognized transcript */}
          {transcript && (
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-slate-200 flex items-start gap-2.5">
              <Mic className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Perintah Anda:
                </span>
                <p className="text-slate-100 font-medium italic">&ldquo;{transcript}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Assistant's verbal answer */}
          {responseMessage && (
            <div className="bg-teal-950/60 rounded-xl p-3.5 border border-teal-500/40 text-teal-100 flex items-start justify-between gap-3 shadow-md">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-300 block mb-0.5">
                    Jawaban Asisten ATLM (Bahasa Indonesia):
                  </span>
                  <p className="leading-relaxed font-medium text-slate-100 text-xs sm:text-sm">
                    {responseMessage}
                  </p>

                  {/* Matched Staff & Shift Detailed Card */}
                  {matchedTargetProfile && (
                    <div className="mt-2.5 pt-2.5 border-t border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-teal-500/30">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={matchedTargetProfile.avatar_url || '/src/assets/images/avatar_tasman_1791739900476.jpg'}
                          alt={matchedTargetProfile.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-teal-400 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs">
                              {matchedTargetProfile.full_name}
                            </span>
                            {isStaffSearchMatched ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5 text-amber-300" />
                                Hasil Pencarian Admin
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                Jadwal Dinas Anda
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {matchedTargetProfile.position || 'Petugas Laboratorium'}
                            {matchedTargetProfile.nip_str ? ` &bull; NIP ${matchedTargetProfile.nip_str}` : ''}
                          </p>

                          {/* Shift detail pill */}
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px]">
                            {matchedAssignmentResult ? (
                              <>
                                <span
                                  className="px-2.5 py-0.5 rounded-full text-white font-bold text-[11px] shadow-xs"
                                  style={{
                                    backgroundColor:
                                      matchedAssignmentResult.shift?.color_code || '#0d9488',
                                  }}
                                >
                                  {matchedAssignmentResult.shift?.name || 'Shift Jaga'}
                                </span>
                                <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-700">
                                  {matchedAssignmentResult.shift?.start_time?.slice(0, 5)} -{' '}
                                  {matchedAssignmentResult.shift?.end_time?.slice(0, 5)} WIB
                                </span>
                                <span className="bg-teal-950 text-teal-300 px-2 py-0.5 rounded font-mono text-[10px] border border-teal-600/30">
                                  Tgl: {matchedAssignmentResult.shift_date}
                                </span>
                              </>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30 font-medium text-[11px]">
                                Libur Dinas Jaga (Tidak Terjadwal)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on matched card */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {matchedAssignmentResult && onSelectAssignment && (
                          <button
                            onClick={() => onSelectAssignment(matchedAssignmentResult)}
                            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold rounded-lg transition shadow-xs cursor-pointer active:scale-95"
                          >
                            Buka Detail Shift
                          </button>
                        )}
                        <button
                          onClick={() => onFilterStaff('all')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium rounded-lg border border-slate-700 transition cursor-pointer"
                          title="Tampilkan jadwal semua petugas di kalender"
                        >
                          Tampilkan Semua
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons for answer */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                {status === 'speaking' ? (
                  <button
                    onClick={stopSpeaking}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm animate-pulse cursor-pointer"
                    title="Hentikan pembacaan suara sekarang"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>HENTIKAN SUARA</span>
                  </button>
                ) : (
                  <button
                    onClick={repeatResponse}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition shadow-md shadow-teal-500/20 active:scale-95 cursor-pointer"
                    title="Bacakan kembali jadwal shift ini"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                    <span>BACA JAWABAN</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error notice if any */}
          {errorMessage && (
            <div className="bg-rose-950/60 rounded-xl p-3 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  startListening();
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Text Input Fallback */}
      {showTextFallback && (
        <form
          onSubmit={handleTextSubmit}
          className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 animate-fade-in relative z-10"
        >
          <input
            type="text"
            value={textInputFallback}
            onChange={(e) => setTextInputFallback(e.target.value)}
            placeholder={
              effectiveIsAdmin
                ? "Ketik perintah (contoh: Jadwal shift Siti Rahmawati tanggal 15 Oktober 2026)"
                : "Ketik perintah (contoh: Cek jadwal shift saya tanggal 15 Oktober 2026)"
            }
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim & Bacakan</span>
          </button>
        </form>
      )}

      {/* Admin Quick Petugas Selection Pills */}
      {effectiveIsAdmin && effectiveProfiles.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1.5 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-1 text-[11px]">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Pencarian Cepat Jadwal Petugas Terdaftar (Uji Suara Admin):</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Klik nama petugas di bawah untuk mencari jadwalnya secara otomatis
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {effectiveProfiles.map((p) => {
              const clean = cleanTitleFromStaffName(p.full_name);
              return (
                <button
                  key={p.id}
                  onClick={() => handleTestSampleCommand(`Jadwal shift ${clean} tanggal 15 Oktober 2026`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-teal-950 text-slate-300 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title={`Cari jadwal ${p.full_name} tanggal 15 Oktober 2026`}
                >
                  <UserCheck className="w-3 h-3 text-teal-400" />
                  <span>{clean} (15 Okt)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Test Prompt Chips for fast testing by the user */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 relative z-10">
        <span className="font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <HelpCircle className="w-3 h-3 text-teal-400" />
          {effectiveIsAdmin ? 'Contoh Perintah Admin:' : 'Contoh Perintah:'}
        </span>
        {effectiveIsAdmin ? (
          <>
            <button
              onClick={() => handleTestSampleCommand('Jadwal shift Siti Rahmawati tanggal 15 Oktober 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Jadwal Siti Rahmawati 15 Oktober 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Cari shift Budi Santoso tanggal 15 Oktober 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Cari shift Budi Santoso 15 Oktober 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Jadwal Nurul Hidayah tanggal 15 Oktober 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Jadwal Nurul Hidayah 15 Oktober 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Shift Ahmad Fauzi tanggal 16 Oktober 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Shift Ahmad Fauzi 16 Oktober 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Jadwal Tasman Saputra tanggal 15 Oktober 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Jadwal Tasman Saputra 15 Oktober 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Cek jadwal shift saya hari ini')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Shift saya hari ini&rdquo;
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleTestSampleCommand('Cek jadwal shift saya tanggal 20 Oktober 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Cek jadwal 20 Oktober 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Saya shift apa besok?')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Saya shift apa besok?&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Tampilkan jadwal saya tanggal 25 Oktober 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Jadwal 25 Oktober 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Buka kalender bulan November 2026')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Bulan November 2026&rdquo;
            </button>
            <button
              onClick={() => handleTestSampleCommand('Cek jadwal shift saya hari ini')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-teal-900/50 hover:text-teal-200 border border-slate-800 hover:border-teal-500/40 transition text-slate-300 cursor-pointer"
            >
              &ldquo;Shift hari ini&rdquo;
            </button>
          </>
        )}
      </div>

      {/* =========================================================================
          DIAGNOSTIC LOG & PWA TROUBLESHOOTING MODAL
      ========================================================================= */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Log Diagnostik Suara & Status PWA</span>
                    {lastErrorCode && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50">
                        Error: {lastErrorCode}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Inspeksi Web Speech API, pelacakan &apos;voiceschanged&apos;, dan mitigasi kebijakan Autoplay PWA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Environment Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Mode PWA</span>
                  <span
                    className={`font-bold text-xs mt-0.5 block ${
                      isPwa ? 'text-indigo-300' : 'text-slate-300'
                    }`}
                  >
                    {isPwa ? 'Aktif (Standalone)' : 'Web Browser'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Speech Synthesis</span>
                  <span
                    className={`font-bold text-xs mt-0.5 block ${
                      isSynthesisSupported ? 'text-teal-300' : 'text-rose-400'
                    }`}
                  >
                    {isSynthesisSupported ? 'Didukung' : 'Tidak Didukung'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Suara Terdeteksi</span>
                  <span className="font-bold text-xs mt-0.5 block text-cyan-300">
                    {availableVoices.length} suara
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Error Terakhir</span>
                  <span
                    className={`font-mono text-xs mt-0.5 block truncate ${
                      lastErrorCode ? 'text-rose-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {lastErrorCode || 'Nihil'}
                  </span>
                </div>
              </div>

              {/* Active Voice Info & Failure Stage */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 flex items-start gap-2 text-[11px] text-teal-200">
                  <Volume2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <span className="font-bold text-teal-100">Suara Bahasa Indonesia Terpilih:</span>{' '}
                    {selectedVoice ? (
                      <span className="font-mono text-cyan-200">
                        {selectedVoice.name} ({selectedVoice.lang}) &bull;{' '}
                        {selectedVoice.localService ? 'Suara Lokal (Offline)' : 'Suara Jaringan (Remote)'}
                      </span>
                    ) : (
                      <span className="text-amber-300 font-medium">
                        Menggunakan Suara Bawaan Sistem OS (id-ID otomatis)
                      </span>
                    )}

                    <div className="mt-1 pt-1 border-t border-teal-500/20 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                      <span className="text-slate-300">
                        Status Alur Terakhir: <strong className="text-white">{processStatus}</strong>
                      </span>
                      {lastFailureStage && (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                          Tahap Gagal: {lastFailureStage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Voice Languages List */}
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Daftar Bahasa Suara Terpasang di Perangkat ({voiceLanguages.length}):
                  </span>
                  {voiceLanguages.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {voiceLanguages.map((l) => (
                        <span
                          key={l}
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                            l.toLowerCase().includes('id')
                              ? 'bg-teal-950 text-teal-300 border border-teal-500/40 font-bold'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic text-[10px]">
                      Belum ada suara terdaftar dari OS (pada beberapa HP Android, daftar suara baru dimuat saat sintesis pertama dijalankan).
                    </p>
                  )}
                </div>
              </div>

              {/* Diagnostic Logs Header & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs">
                    Riwayat Kejadian Suara ({diagnosticLogs.length}):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try {
                        const payload = {
                          timestamp: new Date().toISOString(),
                          isPwa,
                          isRecognitionSupported,
                          isSynthesisSupported,
                          voicesCount: availableVoices.length,
                          selectedVoice: selectedVoice
                            ? { name: selectedVoice.name, lang: selectedVoice.lang, localService: selectedVoice.localService }
                            : null,
                          lastErrorCode,
                          logs: diagnosticLogs,
                        };
                        navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
                          setCopiedLogStatus(true);
                          setTimeout(() => setCopiedLogStatus(false), 2000);
                        });
                      } catch (e) {}
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedLogStatus ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Log</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearDiagnosticLogs}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-slate-700 text-[11px] transition cursor-pointer"
                  >
                    Bersihkan
                  </button>
                </div>
              </div>

              {/* Logs List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                {diagnosticLogs.length === 0 ? (
                  <p className="text-slate-500 italic text-center py-4 font-sans">
                    Belum ada riwayat aktivitas suara tercatat.
                  </p>
                ) : (
                  diagnosticLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded-lg border flex flex-col gap-1 ${
                        log.type === 'error'
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                          : log.type === 'warn'
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">{log.timestamp}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-bold uppercase">
                            {log.source}
                          </span>
                          {log.errorCode && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-300 font-bold">
                              [{log.errorCode}]
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-sans text-xs text-slate-100">{log.message}</p>
                      {log.details && (
                        <pre className="text-[10px] text-slate-400 overflow-x-auto bg-slate-950/70 p-1.5 rounded mt-0.5 border border-slate-800/60">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* PWA & Speech Knowledge Reference */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <p className="font-bold text-slate-300 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  Panduan Perilaku Suara di PWA & Browser Ponsel:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[10px] text-slate-400 leading-relaxed">
                  <li>
                    <strong className="text-slate-300">Autoplay Policy:</strong> Browser ponsel membatasi suara otomatis jika waktu pemrosesan asinkron melebihi batas gestur. Gunakan tombol <span className="text-teal-300 font-bold">&quot;BACA JAWABAN&quot;</span> untuk memutar langsung dengan gestur sentuhan.
                  </li>
                  <li>
                    <strong className="text-slate-300">voiceschanged:</strong> Di lingkungan PWA, suara dimuat secara asinkron. Aplikasi menunggu event secara aktif dengan interval polling 40ms dan timeout aman.
                  </li>
                  <li>
                    <strong className="text-slate-300">synthesis-failed:</strong> Terjadi jika koneksi suara online terputus. Sistem secara otomatis beralih ke synthesizer lokal perangkat tanpa menghentikan aplikasi.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  runAudioTest();
                }}
                className="px-3.5 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Uji Audio Sekarang</span>
              </button>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PANDUAN OUTPUT TEXT-TO-SPEECH ANDROID MODAL
      ========================================================================= */}
      {showAndroidTtsGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden text-white animate-scale-in">
            {/* Header */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Panduan Suara Bahasa Indonesia di HP Android
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Solusi jika tombol suara menampilkan &quot;synthesis-failed&quot;
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidTtsGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3.5 text-xs text-slate-300 overflow-y-auto max-h-[75vh]">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                Pesan error <strong className="font-mono text-amber-100">synthesis-failed</strong> di HP Android terjadi saat mesin Text-to-Speech bawaan perangkat belum memiliki atau belum mengunduh paket data suara <strong>Bahasa Indonesia</strong>.
              </div>

              <div className="space-y-2">
                <p className="font-bold text-white text-xs">
                  Langkah Mengaktifkan Suara Indonesia di Android:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1 text-[11px] leading-relaxed">
                  <li>
                    Buka menu <strong className="text-white">Pengaturan (Settings)</strong> pada ponsel Android Anda.
                  </li>
                  <li>
                    Pilih menu <strong className="text-white">Aksesibilitas</strong> atau <strong className="text-white">Sistem / Manajemen Umum</strong> &gt; <strong className="text-white">Keluaran Teks-ke-ucapan (Text-to-speech output)</strong>.
                  </li>
                  <li>
                    Di bagian <strong className="text-white">Mesin Pilihan (Preferred engine)</strong>, pilih <strong className="text-teal-300">Layanan Suara oleh Google (Speech Services by Google)</strong> atau <strong className="text-teal-300">Samsung Text-to-speech</strong>.
                  </li>
                  <li>
                    Ketuk ikon <strong className="text-white">Gerigi (Pengaturan)</strong> di sebelah kanan Mesin Pilihan.
                  </li>
                  <li>
                    Pilih <strong className="text-white">Instal data suara (Install voice data)</strong> &gt; cari <strong className="text-white">Bahasa Indonesia</strong> &gt; ketuk ikon Unduh.
                  </li>
                  <li>
                    Setelah unduhan selesai, kembali ke aplikasi Shift ATLM lalu tekan <strong className="text-cyan-300">TES SUARA</strong> lagi. Suara akan langsung terdengar jernih!
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px]">
                <span className="font-bold text-teal-300 block mb-1">Tips Tambahan:</span>
                Pastikan volume <strong>Media</strong> di ponsel dinaikkan (bukan hanya nada dering panggilan).
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowAndroidTtsGuideModal(false);
                  runAudioTest('system-id');
                }}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Coba Tes Suara Bawaan</span>
              </button>
              <button
                onClick={() => setShowAndroidTtsGuideModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

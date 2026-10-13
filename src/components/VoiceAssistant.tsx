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
} from 'lucide-react';
import { ShiftAssignment, Shift } from '../types';
import { dataService, getPontianakDateString } from '../services/dataService';
import {
  useVoiceAssistant,
  TEST_VOICE_PHRASE,
  primeAudio,
  playMelodicChime,
  VoiceDiagnosticLog,
} from '../hooks/useVoiceAssistant';

interface VoiceAssistantProps {
  activeProfileId: string;
  activeProfileName: string;
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

export function VoiceAssistant({
  activeProfileId,
  activeProfileName,
  assignments,
  shifts,
  onNavigateDate,
  onSelectMonth,
  onFilterStaff,
  onSelectAssignment,
}: VoiceAssistantProps) {
  const [textInputFallback, setTextInputFallback] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [matchedAssignmentResult, setMatchedAssignmentResult] = useState<ShiftAssignment | null>(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
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
    selectedVoice,
    testAudioStatus,
    testAudioMessage,
    autoplayBlocked,
    diagnosticLogs,
    lastErrorCode,
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
   * 1. Parses Indonesian natural language dates & intents
   * 2. Queries live database for assignments on that date
   * 3. Syncs calendar view
   * 4. Synthesizes and speaks Indonesian verbal reply
   */
  const handleProcessCommand = async (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    setStatus('searching');
    setErrorMessage(null);
    setMatchedAssignmentResult(null);
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

      // 2. Date determination
      const todayDateStr = getPontianakDateString();
      const [currYearStr, currMonthStr, currDayStr] = todayDateStr.split('-');
      const todayObj = new Date(parseInt(currYearStr), parseInt(currMonthStr) - 1, parseInt(currDayStr));

      let targetDateStr = '';

      if (text.includes('hari ini') || text.includes('sekarang')) {
        targetDateStr = todayDateStr;
      } else if (text.includes('besok')) {
        const tomorrow = new Date(todayObj);
        tomorrow.setDate(todayObj.getDate() + 1);
        targetDateStr = getPontianakDateString(tomorrow);
      } else if (text.includes('lusa')) {
        const lusa = new Date(todayObj);
        lusa.setDate(todayObj.getDate() + 2);
        targetDateStr = getPontianakDateString(lusa);
      } else if (text.includes('kemarin')) {
        const yesterday = new Date(todayObj);
        yesterday.setDate(todayObj.getDate() - 1);
        targetDateStr = getPontianakDateString(yesterday);
      } else {
        // Parse day, month, and year from speech
        let extractedDay: string | null = null;
        let extractedMonthNum: string | null = null;
        let extractedYear: string | null = null;

        // Try to match "tanggal XX" or standalone day numbers
        const dayRegex = /(?:tanggal|tgl)?\s*(\b[0-9]{1,2}\b)/;
        const dayMatch = text.match(dayRegex);
        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1], 10);
          if (dayNum >= 1 && dayNum <= 31) {
            extractedDay = String(dayNum).padStart(2, '0');
          }
        }

        // Try to match Indonesian month name
        for (const [key, meta] of Object.entries(INDONESIAN_MONTHS)) {
          if (text.includes(key)) {
            extractedMonthNum = meta.num;
            break;
          }
        }

        // Try to match 4-digit year (e.g., 2025, 2026, 2027)
        const yearMatch = text.match(/\b(202[4-9])\b/);
        if (yearMatch) {
          extractedYear = yearMatch[1];
        }

        if (extractedDay) {
          const finalYear = extractedYear || currYearStr;
          const finalMonth = extractedMonthNum || currMonthStr;
          targetDateStr = `${finalYear}-${finalMonth}-${extractedDay}`;
        } else {
          // If no specific date found, default to today
          targetDateStr = todayDateStr;
        }
      }

      // 3. Search database for the schedule on targetDateStr
      let foundAssignment: ShiftAssignment | null = null;

      try {
        const freshAssignments = await dataService.getAssignments({
          date: targetDateStr,
          profileId: activeProfileId,
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
            (a) => a.profile_id === activeProfileId && a.shift_date === targetDateStr
          ) || null;
      }

      // 4. Navigate calendar to date and apply filter
      onNavigateDate(targetDateStr);
      onFilterStaff(activeProfileId);

      if (foundAssignment) {
        setMatchedAssignmentResult(foundAssignment);
        if (onSelectAssignment) {
          onSelectAssignment(foundAssignment);
        }
      }

      // 5. Build human-friendly Indonesian spoken response
      const [y, m, d] = targetDateStr.split('-');
      const targetDateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      const formattedDate = targetDateObj.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      let reply = '';
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
        reply = `Maaf ${activeProfileName}, jadwal shift Anda pada hari ${formattedDate} tidak ditemukan. Kemungkinan Anda libur dinas jaga pada hari tersebut.`;
      }

      setResponseMessage(reply);

      // 6. Speak the response aloud via Web Speech API
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Gagal memutar suara{lastErrorCode ? ` [${lastErrorCode}]` : '.'}
          </span>
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

              {isPwa && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-indigo-300" />
                  Mode PWA Aktif
                </span>
              )}

              {renderStatusBadge()}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mt-1 tracking-tight">
              Pencarian Jadwal Shift Berbasis Suara
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              Petugas: <span className="font-semibold text-teal-300">{activeProfileName}</span> &bull; RSUD Sultan Muhammad Jamaludin I
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
        <div className="mt-3.5 p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in relative z-10">
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

              {/* Actionable fallbacks if failed */}
              {testAudioStatus === 'failed' && (
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => runAudioTest(true)}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                    title="Coba menggunakan synthesizer bawaan perangkat"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Uji Suara Bawaan Sistem</span>
                  </button>
                  <button
                    onClick={() => playMelodicChime()}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold rounded-lg border border-cyan-500/30 transition cursor-pointer flex items-center gap-1"
                    title="Uji apakah speaker perangkat aktif"
                  >
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                    <span>Tes Speaker (Melodi)</span>
                  </button>
                  <button
                    onClick={() => setShowDiagnosticsModal(true)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-mono rounded-lg border border-cyan-500/40 transition cursor-pointer flex items-center gap-1"
                    title="Buka detail log diagnostik error"
                  >
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>Detail Error & Log</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {testAudioStatus === 'speaking' ? (
              <button
                onClick={stopSpeaking}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Hentikan</span>
              </button>
            ) : (
              <button
                onClick={() => runAudioTest()}
                className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg transition cursor-pointer active:scale-95"
              >
                Uji Lagi
              </button>
            )}
          </div>
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

                  {matchedAssignmentResult && (
                    <div className="mt-2 pt-2 border-t border-teal-500/20 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="bg-teal-900/70 text-teal-200 px-2 py-0.5 rounded font-mono">
                        Tanggal: {matchedAssignmentResult.shift_date}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-white font-bold"
                        style={{
                          backgroundColor:
                            matchedAssignmentResult.shift?.color_code || '#0d9488',
                        }}
                      >
                        {matchedAssignmentResult.shift?.name || 'Shift Jaga'}
                      </span>
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
            placeholder="Ketik perintah (contoh: Cek jadwal shift saya tanggal 20 Oktober 2026)"
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

      {/* Quick Test Prompt Chips for fast testing by the user */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 relative z-10">
        <span className="font-semibold text-slate-400 flex items-center gap-1 mr-1">
          <HelpCircle className="w-3 h-3 text-teal-400" />
          Contoh Perintah:
        </span>
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

              {/* Active Voice Info */}
              <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 flex items-start gap-2 text-[11px] text-teal-200">
                <Volume2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
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
    </div>
  );
}

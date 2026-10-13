import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ShiftAssignment, Shift } from '../types';
import { getPontianakDateString } from '../services/dataService';

interface VoiceAssistantProps {
  activeProfileId: string;
  activeProfileName: string;
  assignments: ShiftAssignment[];
  shifts: Shift[];
  onNavigateDate: (dateStr: string) => void;
  onSelectMonth: (yearMonth: string) => void;
  onFilterStaff: (profileId: string) => void;
}

export function VoiceAssistant({
  activeProfileId,
  activeProfileName,
  assignments,
  shifts,
  onNavigateDate,
  onSelectMonth,
  onFilterStaff,
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('Tekan ikon mikrofon untuk mulai berbicara');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [textInputFallback, setTextInputFallback] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatusText('Pengenalan suara tidak didukung browser ini. Gunakan kotak teks.');
    }
  }, []);

  const speak = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const parseAndExecuteCommand = (rawText: string) => {
    const text = rawText.toLowerCase();
    setStatusText('Menganalisis perintah suara...');

    // 1. Check for month navigation e.g. "bulan november 2026"
    const monthNames: Record<string, string> = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', okt: '10', nov: '11', des: '12'
    };

    if (text.includes('bulan')) {
      for (const [name, num] of Object.entries(monthNames)) {
        if (text.includes(name)) {
          // extract year or assume current year
          const yearMatch = text.match(/\b(202[5-9])\b/);
          const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
          const targetYM = `${year}-${num}`;
          onSelectMonth(targetYM);
          const reply = `Baik, kalender telah diarahkan ke bulan ${name} ${year}.`;
          setAssistantResponse(reply);
          speak(reply);
          setStatusText('Selesai');
          return;
        }
      }
    }

    // 2. Determine target date (specific date, today, tomorrow, etc.)
    let targetDateStr = '';
    const today = new Date();

    if (text.includes('hari ini')) {
      targetDateStr = getPontianakDateString(today);
    } else if (text.includes('besok')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      targetDateStr = getPontianakDateString(tomorrow);
    } else if (text.includes('lusa')) {
      const lusa = new Date(today);
      lusa.setDate(today.getDate() + 2);
      targetDateStr = getPontianakDateString(lusa);
    } else {
      // Try to parse day and month e.g. "20 Oktober 2026" or "25 okt"
      const dayMatch = text.match(/\b([0-9]{1,2})\b/);
      let foundMonthNum = '';
      for (const [name, num] of Object.entries(monthNames)) {
        if (text.includes(name)) {
          foundMonthNum = num;
          break;
        }
      }

      if (dayMatch && foundMonthNum) {
        const day = dayMatch[1].padStart(2, '0');
        const yearMatch = text.match(/\b(202[5-9])\b/);
        const year = yearMatch ? yearMatch[1] : today.getFullYear().toString();
        targetDateStr = `${year}-${foundMonthNum}-${day}`;
      } else {
        // Default to today if no date recognized
        targetDateStr = getPontianakDateString(today);
      }
    }

    // 3. Search database assignments for active user on targetDateStr
    onNavigateDate(targetDateStr);
    onFilterStaff(activeProfileId);

    const matchingAssignment = assignments.find(
      (a) => a.profile_id === activeProfileId && a.shift_date === targetDateStr
    );

    let reply = '';
    const formattedDateFormatted = new Date(targetDateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (matchingAssignment) {
      const shiftName = matchingAssignment.shift?.name || 'Shift Jaga';
      const startTime = matchingAssignment.shift?.start_time?.slice(0, 5) || '';
      const endTime = matchingAssignment.shift?.end_time?.slice(0, 5) || '';
      reply = `Jadwal Anda pada tanggal ${formattedDateFormatted} adalah ${shiftName} pukul ${startTime} sampai ${endTime} W I B. Kalender sudah diarahkan ke tanggal tersebut.`;
    } else {
      reply = `Maaf ${activeProfileName}, tidak ditemukan jadwal dinas shift untuk Anda pada tanggal ${formattedDateFormatted}.`;
    }

    setAssistantResponse(reply);
    speak(reply);
    setStatusText('Selesai');
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowTextFallback(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusText('Mendengarkan suara Anda...');
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        setStatusText('Mencari jadwal dari database...');
        parseAndExecuteCommand(speechResult);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setStatusText('Gagal mengenali suara. Silakan coba lagi atau gunakan kotak teks.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Speech recognition exception:', e);
      setIsListening(false);
      setShowTextFallback(true);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInputFallback.trim()) return;
    setTranscript(textInputFallback);
    parseAndExecuteCommand(textInputFallback);
    setTextInputFallback('');
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-teal-500/30 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="relative">
            {/* Glowing pulse ring when listening */}
            {isListening && (
              <span className="absolute -inset-1.5 rounded-full bg-teal-400 opacity-75 animate-ping" />
            )}
            <button
              onClick={startListening}
              className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 hover:from-teal-400 hover:to-cyan-300'
              }`}
              title="Tekan untuk bicara pencarian jadwal"
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-300" />
                Asisten Suara Pintar
              </span>
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title={speechEnabled ? 'Matikan suara pembaca' : 'Nyalakan suara pembaca'}
              >
                {speechEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">Cari Jadwal dengan Perintah Suara</h3>
            <p className="text-xs text-slate-300 italic mt-0.5">&ldquo;Cek jadwal shift saya tanggal 20 Oktober 2026&rdquo; atau &ldquo;Saya shift apa besok?&rdquo;</p>
          </div>
        </div>

        {/* Status & Toggle Text Input */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowTextFallback(!showTextFallback)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
          >
            {showTextFallback ? 'Tutup Input Teks' : 'Ketik Perintah Manual'}
          </button>
        </div>
      </div>

      {/* Transcript & Response Area */}
      {(transcript || assistantResponse || statusText) && (
        <div className="mt-4 pt-3 border-t border-slate-800 text-xs space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-teal-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Status: {statusText}
            </span>
          </div>

          {transcript && (
            <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 text-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Perintah Anda:</span>
              &ldquo;{transcript}&rdquo;
            </div>
          )}

          {assistantResponse && (
            <div className="bg-teal-950/60 rounded-xl p-3 border border-teal-500/30 text-teal-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-300 block mb-0.5">Jawaban Asisten ATLM:</span>
                <p className="leading-relaxed font-medium">{assistantResponse}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Input Fallback Modal/Box */}
      {showTextFallback && (
        <form onSubmit={handleTextSubmit} className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 animate-fade-in">
          <input
            type="text"
            value={textInputFallback}
            onChange={(e) => setTextInputFallback(e.target.value)}
            placeholder="Ketik perintah (contoh: Cek jadwal shift saya tanggal 20 Oktober 2026)"
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </form>
      )}
    </div>
  );
}

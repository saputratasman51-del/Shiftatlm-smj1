/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceAssistantStatus = 'idle' | 'listening' | 'searching' | 'speaking' | 'done' | 'error';
export type TestAudioStatus = 'idle' | 'checking' | 'speaking' | 'completed' | 'failed';

export interface VoiceDiagnosticLog {
  id: string;
  timestamp: string;
  source: 'init' | 'voices' | 'test-audio' | 'speak-response' | 'recognition' | 'watchdog' | 'autoplay-check';
  type: 'info' | 'warn' | 'error';
  errorCode?: string;
  message: string;
  details?: Record<string, any>;
}

interface UseVoiceAssistantOptions {
  onCommandRecognized?: (transcript: string) => void;
  defaultSpeechEnabled?: boolean;
}

export const TEST_VOICE_PHRASE =
  'Halo, ini tes suara aplikasi Shift ATLM. Jika Anda mendengar suara ini, fitur pembacaan suara berfungsi.';

/**
 * Module-level cache for SpeechSynthesisVoice array.
 * Populated on boot or when voiceschanged event triggers.
 */
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Robust check for SpeechSynthesis and SpeechSynthesisUtterance availability.
 * Safely guards against restricted iframes, SSR, and throwing property getters.
 */
export function isSpeechSynthesisAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (!('speechSynthesis' in window)) return false;
    const synth = window.speechSynthesis;
    if (!synth) return false;
    if (typeof synth.speak !== 'function' || typeof synth.getVoices !== 'function') {
      return false;
    }
    if (typeof window.SpeechSynthesisUtterance === 'undefined') {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Robust check for SpeechRecognition availability.
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return Boolean(SpeechRecognition);
  } catch (e) {
    return false;
  }
}

/**
 * Detects whether the app is currently running in Progressive Web App (PWA) standalone mode.
 */
export function isPwaMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isAndroidApp = document.referrer.includes('android-app://');
    return Boolean(isStandaloneMedia || isIosStandalone || isAndroidApp);
  } catch (e) {
    return false;
  }
}

/**
 * Global reference array to prevent Chromium / Safari garbage collection bug
 * where active utterances are destroyed prematurely before onstart or onend fires.
 */
function holdUtteranceRef(utterance: SpeechSynthesisUtterance) {
  if (typeof window === 'undefined') return;
  (window as any).__ttsQueue = (window as any).__ttsQueue || [];
  (window as any).__ttsQueue.push(utterance);
}

function releaseUtteranceRef(utterance: SpeechSynthesisUtterance) {
  if (typeof window === 'undefined') return;
  if (Array.isArray((window as any).__ttsQueue)) {
    (window as any).__ttsQueue = (window as any).__ttsQueue.filter(
      (u: any) => u !== utterance
    );
  }
}

/**
 * Plays an audible acoustic chime via Web Audio API.
 * Ensures the user receives instant auditory feedback even if TTS is muted,
 * missing on device, or blocked by the operating system.
 */
export function playChime(frequency = 784, duration = 0.25) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.25, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch (e) {
    // ignore
  }
}

/**
 * Plays a pleasant three-tone melodic confirmation chime.
 */
export function playMelodicChime() {
  playChime(523.25, 0.15); // C5
  setTimeout(() => playChime(659.25, 0.18), 90); // E5
  setTimeout(() => playChime(783.99, 0.25), 180); // G5
}

/**
 * Primes and unlocks the browser's speech synthesis and audio context
 * during synchronous user gestures (click / tap).
 * Prevents mobile and PWA browser autoplay policies from blocking subsequent speech playback.
 */
export function primeAudio() {
  if (typeof window === 'undefined') return;
  try {
    if (isSpeechSynthesisAvailable()) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }
  } catch (e) {}

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    }
  } catch (e) {}
}

/**
 * Sanitizes Indonesian text for optimal speech synthesis across all engines.
 * Removes markdown formatting, parentheticals, and expands abbreviations.
 */
export function sanitizeSpeechText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[*_#`~]/g, '') // remove markdown symbols
    .replace(/[()[\]{}]/g, ', ') // convert brackets to natural pauses
    .replace(/W\s*I\s*B/gi, 'WIB')
    .replace(/\bRSUD\b/gi, 'Rumah Sakit')
    .replace(/\bATLM\b/gi, 'A T L M')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Explicitly waits for the SpeechSynthesis 'voiceschanged' event with active polling fallback.
 * Especially critical in PWA standalone and mobile Chromium/WebKit environments where:
 * 1. Voices list is asynchronously populated after launch.
 * 2. 'voiceschanged' event may or may not trigger depending on OS background initialization.
 * 3. Polling checks every 40ms ensure fast discovery without indefinite hanging.
 */
export async function waitForVoices(timeoutMs: number = 1000): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisAvailable()) return [];

  // Check immediate voices or cache
  try {
    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      cachedVoices = immediate;
      return immediate;
    }
  } catch (e) {}

  if (cachedVoices.length > 0) {
    return cachedVoices;
  }

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let isSettled = false;
    let timer: any = null;
    let pollInterval: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (pollInterval) clearInterval(pollInterval);
      try {
        if (isSpeechSynthesisAvailable()) {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        }
      } catch (e) {}
    };

    const finalize = (voices: SpeechSynthesisVoice[]) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      if (voices && voices.length > 0) {
        cachedVoices = voices;
      }
      resolve(voices || []);
    };

    const onVoicesChanged = () => {
      try {
        const fresh = window.speechSynthesis.getVoices();
        if (fresh && fresh.length > 0) {
          finalize(fresh);
        }
      } catch (e) {
        finalize([]);
      }
    };

    try {
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    } catch (e) {}

    // Polling interval every 40ms: essential for PWA engines where the array updates silently
    pollInterval = setInterval(() => {
      try {
        const pollVoices = window.speechSynthesis.getVoices();
        if (pollVoices && pollVoices.length > 0) {
          finalize(pollVoices);
        }
      } catch (e) {}
    }, 40);

    // Bounded timeout fallback
    timer = setTimeout(() => {
      try {
        const finalVoices = window.speechSynthesis.getVoices();
        finalize(finalVoices && finalVoices.length > 0 ? finalVoices : cachedVoices);
      } catch (e) {
        finalize(cachedVoices);
      }
    }, timeoutMs);
  });
}

/**
 * Finds the best Indonesian voice available in the browser's speechSynthesis engine.
 * Prioritizes local/offline Indonesian voices to prevent network 'synthesis-failed' errors.
 */
export function findIndonesianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Local/offline Indonesian voice (highest reliability)
  const localId = voices.find(
    (v) =>
      Boolean(v.localService || (v as any).local) &&
      (v.lang.toLowerCase().replace('_', '-').startsWith('id') ||
        v.name.toLowerCase().includes('indonesia'))
  );
  if (localId) return localId;

  // 2. Exact 'id-ID' or starts with 'id'
  const exactId = voices.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'id-id' || l.startsWith('id');
  });
  if (exactId) return exactId;

  // 3. Known Indonesian voice names across platforms (Google Bahasa Indonesia, Damayanti, Gadis, etc.)
  const nameMatch = voices.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('indonesia') ||
      name.includes('bahasa') ||
      name.includes('damayanti') ||
      name.includes('gadis') ||
      name.includes('id_id')
    );
  });
  if (nameMatch) return nameMatch;

  return null;
}

export function useVoiceAssistant({
  onCommandRecognized,
  defaultSpeechEnabled = true,
}: UseVoiceAssistantOptions = {}) {
  const [status, setStatus] = useState<VoiceAssistantStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [speechEnabled, setSpeechEnabled] = useState(defaultSpeechEnabled);
  const [isSupported, setIsSupported] = useState(true);
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(true);
  const [isSynthesisSupported, setIsSynthesisSupported] = useState(true);
  const [isPwa, setIsPwa] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(cachedVoices);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Dedicated Test Audio states
  const [testAudioStatus, setTestAudioStatus] = useState<TestAudioStatus>('idle');
  const [testAudioMessage, setTestAudioMessage] = useState<string | null>(null);

  // Autoplay restriction state (for PWA / mobile browser fallback prompt)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Diagnostic Logs state for tracking specific SpeechSynthesis errors & PWA events
  const [diagnosticLogs, setDiagnosticLogs] = useState<VoiceDiagnosticLog[]>([]);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveIntervalRef = useRef<any>(null);
  const testWatchdogRef = useRef<any>(null);
  const testTickIntervalRef = useRef<any>(null);
  const autoplayWatchdogRef = useRef<any>(null);

  /**
   * Helper to append a structured diagnostic log entry
   */
  const addDiagnosticLog = useCallback(
    (
      type: 'info' | 'warn' | 'error',
      source: VoiceDiagnosticLog['source'],
      errorCode: string | undefined,
      message: string,
      details?: Record<string, any>
    ) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const entry: VoiceDiagnosticLog = {
        id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: timeStr,
        source,
        type,
        errorCode,
        message,
        details,
      };

      if (errorCode) {
        setLastErrorCode(errorCode);
      }

      // Output to developer console
      if (type === 'error') {
        console.error(`[VoiceAssistant Diag ${source}] ${errorCode ? `[${errorCode}] ` : ''}${message}`, details || '');
      } else if (type === 'warn') {
        console.warn(`[VoiceAssistant Diag ${source}] ${errorCode ? `[${errorCode}] ` : ''}${message}`, details || '');
      } else {
        console.log(`[VoiceAssistant Diag ${source}] ${message}`, details || '');
      }

      setDiagnosticLogs((prev) => [entry, ...prev].slice(0, 40));
    },
    []
  );

  const clearDiagnosticLogs = useCallback(() => {
    setDiagnosticLogs([]);
    setLastErrorCode(null);
  }, []);

  // Initialize voice lists, PWA status, and support detection
  useEffect(() => {
    const hasRecognition = isSpeechRecognitionAvailable();
    const hasSynthesis = isSpeechSynthesisAvailable();
    const pwaActive = isPwaMode();

    setIsRecognitionSupported(hasRecognition);
    setIsSynthesisSupported(hasSynthesis);
    setIsSupported(hasRecognition || hasSynthesis);
    setIsPwa(pwaActive);

    addDiagnosticLog('info', 'init', undefined, 'Inisialisasi VoiceAssistant', {
      isPwa: pwaActive,
      hasRecognition,
      hasSynthesis,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });

    // Global one-time touch listener to unlock audio synthesis on mobile / PWA
    const handleFirstUserInteraction = () => {
      primeAudio();
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      addDiagnosticLog('info', 'init', undefined, 'Interaksi pengguna pertama terdeteksi (Audio context dipersiapkan)');
    };
    window.addEventListener('click', handleFirstUserInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true, passive: true });

    let isMounted = true;

    const handleVoiceUpdate = (voices: SpeechSynthesisVoice[]) => {
      if (!isMounted) return;
      cachedVoices = voices;
      setAvailableVoices(voices);
      const best = findIndonesianVoice(voices);
      setSelectedVoice(best);
      addDiagnosticLog('info', 'voices', undefined, `Daftar suara dimuat: ${voices.length} suara terdeteksi`, {
        voicesCount: voices.length,
        selectedVoice: best ? `${best.name} (${best.lang})` : 'none',
      });
    };

    if (hasSynthesis) {
      // Immediate synchronous grab
      try {
        const imm = window.speechSynthesis.getVoices();
        if (imm && imm.length > 0) {
          handleVoiceUpdate(imm);
        }
      } catch (e) {}

      // Robust wait for 'voiceschanged' event and polling
      waitForVoices(1200).then((voices) => {
        handleVoiceUpdate(voices);
      });

      const onVoicesChangedListener = () => {
        try {
          const freshVoices = window.speechSynthesis.getVoices();
          handleVoiceUpdate(freshVoices);
        } catch (e) {}
      };

      try {
        window.speechSynthesis.addEventListener('voiceschanged', onVoicesChangedListener);
      } catch (e) {}

      return () => {
        isMounted = false;
        window.removeEventListener('click', handleFirstUserInteraction);
        window.removeEventListener('touchstart', handleFirstUserInteraction);
        try {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChangedListener);
        } catch (e) {}
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
        if (testWatchdogRef.current) {
          clearTimeout(testWatchdogRef.current);
          testWatchdogRef.current = null;
        }
        if (testTickIntervalRef.current) {
          clearInterval(testTickIntervalRef.current);
          testTickIntervalRef.current = null;
        }
        if (autoplayWatchdogRef.current) {
          clearTimeout(autoplayWatchdogRef.current);
          autoplayWatchdogRef.current = null;
        }
        try {
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
          }
        } catch (e) {}
      };
    }

    return () => {
      isMounted = false;
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
      if (testTickIntervalRef.current) {
        clearInterval(testTickIntervalRef.current);
        testTickIntervalRef.current = null;
      }
    };
  }, [addDiagnosticLog]);

  /**
   * Completely stops active speech playback immediately.
   */
  const stopSpeaking = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    if (testTickIntervalRef.current) {
      clearInterval(testTickIntervalRef.current);
      testTickIntervalRef.current = null;
    }
    if (autoplayWatchdogRef.current) {
      clearTimeout(autoplayWatchdogRef.current);
      autoplayWatchdogRef.current = null;
    }
    if (testWatchdogRef.current) {
      clearTimeout(testWatchdogRef.current);
      testWatchdogRef.current = null;
    }

    if (isSpeechSynthesisAvailable()) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    }
    if (activeUtteranceRef.current) {
      releaseUtteranceRef(activeUtteranceRef.current);
      activeUtteranceRef.current = null;
    }
    if (status === 'speaking') {
      setStatus('done');
    }
    if (testAudioStatus === 'speaking' || testAudioStatus === 'checking') {
      setTestAudioStatus('idle');
      setTestAudioMessage(null);
    }
    addDiagnosticLog('info', 'speak-response', undefined, 'Pemutaran suara dihentikan secara manual');
  }, [status, testAudioStatus, addDiagnosticLog]);

  /**
   * Independent "TES SUARA" function directly triggered by user click.
   * Tests speech synthesis immediately with progressive multi-stage fallback:
   * 1. Try selected Indonesian voice (preferably local)
   * 2. Try default system voice with lang = 'id-ID' (avoids remote Google TTS network 'synthesis-failed')
   * 3. Try standard system utterance (lang = '', voice = null)
   * 4. Acoustic harmonic chime fallback if device lacks TTS engines entirely
   *
   * Captures specific error codes (e.g. synthesis-failed, not-allowed, audio-busy) in diagnostic logs.
   */
  const runAudioTest = useCallback(
    async (forceDefaultVoice: boolean = false): Promise<boolean> => {
      // 1. Synchronously trigger prime audio on user click to establish user activation
      primeAudio();

      // Clear any prior test watchdog and interval
      if (testWatchdogRef.current) {
        clearTimeout(testWatchdogRef.current);
        testWatchdogRef.current = null;
      }
      if (testTickIntervalRef.current) {
        clearInterval(testTickIntervalRef.current);
        testTickIntervalRef.current = null;
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }

      // Set checking state immediately
      setTestAudioStatus('checking');
      setTestAudioMessage('Memeriksa dukungan suara...');

      // 2. Validate availability
      if (!isSpeechSynthesisAvailable()) {
        const err = 'speech-synthesis-unavailable';
        setTestAudioStatus('failed');
        setTestAudioMessage('SpeechSynthesis tidak didukung pada browser atau perangkat ini.');
        setLastErrorCode(err);
        addDiagnosticLog('error', 'test-audio', err, 'SpeechSynthesis API tidak didukung browser ini', {
          isPwa: isPwaMode(),
        });
        playChime(440, 0.3);
        return false;
      }

      // 3. Stop active recognition to prevent microphone audio session lock
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      // 4. Safely handle prior speech: only cancel if actively speaking/pending
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}

      // Grab voices (wait with bounded timeout if unpopulated)
      let currentVoices: SpeechSynthesisVoice[] = [];
      try {
        currentVoices = window.speechSynthesis.getVoices() || [];
      } catch (e) {}
      if (currentVoices.length === 0 && availableVoices.length > 0) {
        currentVoices = availableVoices;
      }
      if (currentVoices.length === 0 && cachedVoices.length > 0) {
        currentVoices = cachedVoices;
      }
      if (currentVoices.length === 0) {
        currentVoices = await waitForVoices(500);
      }

      const verifiedIndonesianVoice = forceDefaultVoice
        ? null
        : findIndonesianVoice(currentVoices) || selectedVoice;

      addDiagnosticLog('info', 'test-audio', undefined, 'Memulai pengujian audio (TES SUARA)', {
        isPwa: isPwaMode(),
        voicesAvailable: currentVoices.length,
        selectedVoice: verifiedIndonesianVoice ? `${verifiedIndonesianVoice.name} (${verifiedIndonesianVoice.lang})` : 'default',
        forceDefaultVoice,
      });

      return new Promise<boolean>((resolve) => {
        let currentAttempt = forceDefaultVoice ? 2 : 1;
        const maxAttempts = 3;
        let speechHasStarted = false;

        const executeAttempt = (attempt: number) => {
          try {
            if (typeof window.SpeechSynthesisUtterance === 'undefined') {
              throw new Error('SpeechSynthesisUtterance unavailable');
            }

            const utterance = new SpeechSynthesisUtterance(TEST_VOICE_PHRASE);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            if (attempt === 1) {
              utterance.lang = 'id-ID';
              if (verifiedIndonesianVoice) {
                utterance.voice = verifiedIndonesianVoice;
              }
            } else if (attempt === 2) {
              // Attempt 2: id-ID without setting voice object.
              // Allows native OS synthesizer to speak without failing on remote Google TTS network errors
              utterance.lang = 'id-ID';
              utterance.voice = null;
            } else {
              // Attempt 3: Standard system fallback
              utterance.lang = '';
              utterance.voice = null;
            }

            utterance.onstart = () => {
              speechHasStarted = true;
              if (testWatchdogRef.current) {
                clearTimeout(testWatchdogRef.current);
                testWatchdogRef.current = null;
              }
              setTestAudioStatus('speaking');
              setStatus('speaking');
              setTestAudioMessage('Sedang berbicara...');
              setLastErrorCode(null);

              addDiagnosticLog('info', 'test-audio', undefined, `Tes audio mulai diputar (percobaan ${attempt})`, {
                attempt,
                voice: utterance.voice?.name || 'system-default',
                lang: utterance.lang,
              });

              // Periodic engine keepalive (prevents Chrome Android 15s freeze bug)
              if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
              keepAliveIntervalRef.current = setInterval(() => {
                try {
                  if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                  }
                } catch (e) {}
              }, 2000);
            };

            utterance.onend = () => {
              if (testWatchdogRef.current) {
                clearTimeout(testWatchdogRef.current);
                testWatchdogRef.current = null;
              }
              if (testTickIntervalRef.current) {
                clearInterval(testTickIntervalRef.current);
                testTickIntervalRef.current = null;
              }
              if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
              }
              releaseUtteranceRef(utterance);
              activeUtteranceRef.current = null;

              setTestAudioStatus('completed');
              setStatus('done');
              setTestAudioMessage('Suara selesai.');
              addDiagnosticLog('info', 'test-audio', undefined, 'Tes audio selesai diputar dengan sukses.');
              resolve(true);
            };

            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
              const specificCode = e.error || 'unknown-error';
              setLastErrorCode(specificCode);

              if (e.error === 'canceled' || e.error === 'interrupted') {
                releaseUtteranceRef(utterance);
                if (testWatchdogRef.current) {
                  clearTimeout(testWatchdogRef.current);
                  testWatchdogRef.current = null;
                }
                setTestAudioStatus('idle');
                setTestAudioMessage(null);
                addDiagnosticLog('info', 'test-audio', specificCode, `Tes suara dihentikan atau digantikan (${specificCode})`);
                resolve(true);
                return;
              }

              addDiagnosticLog('error', 'test-audio', specificCode, `Tes audio gagal pada percobaan ${attempt}: [${specificCode}]`, {
                attempt,
                specificCode,
                voice: utterance.voice?.name || 'none',
                lang: utterance.lang,
                isPwa: isPwaMode(),
              });

              releaseUtteranceRef(utterance);

              // Auto-fallback: If attempt 1 or 2 failed with synthesis-failed, language-unavailable, voice-unavailable, or not-allowed
              if (
                attempt < maxAttempts &&
                (e.error === 'synthesis-failed' ||
                  e.error === 'voice-unavailable' ||
                  e.error === 'language-unavailable' ||
                  e.error === 'not-allowed' ||
                  e.error === 'audio-busy')
              ) {
                setTimeout(() => {
                  try {
                    if (window.speechSynthesis.paused) {
                      window.speechSynthesis.resume();
                    }
                  } catch (err) {}
                  executeAttempt(attempt + 1);
                }, 40);
                return;
              }

              // All attempts exhausted
              if (testWatchdogRef.current) {
                clearTimeout(testWatchdogRef.current);
                testWatchdogRef.current = null;
              }
              if (testTickIntervalRef.current) {
                clearInterval(testTickIntervalRef.current);
                testTickIntervalRef.current = null;
              }
              activeUtteranceRef.current = null;

              setTestAudioStatus('failed');
              setTestAudioMessage(
                e.error === 'synthesis-failed'
                  ? 'Gagal memutar suara (synthesis-failed: mesin TTS tidak merespons).'
                  : e.error === 'not-allowed'
                  ? 'Gagal memutar suara (not-allowed: izin audio dibatasi kebijakan browser).'
                  : `Gagal memutar suara (${e.error || 'error'}).`
              );
              playChime(523, 0.25);
              resolve(false);
            };

            activeUtteranceRef.current = utterance;
            holdUtteranceRef(utterance);

            // Execute speech
            window.speechSynthesis.speak(utterance);

            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }

            // Periodic tick to wake up background synthesizer queue
            if (testTickIntervalRef.current) clearInterval(testTickIntervalRef.current);
            testTickIntervalRef.current = setInterval(() => {
              try {
                if (window.speechSynthesis.paused) {
                  window.speechSynthesis.resume();
                }
              } catch (e) {}
            }, 800);

            // Resilient Watchdog: 7 seconds timeout (allows mobile TTS engines time to load voice models)
            if (testWatchdogRef.current) clearTimeout(testWatchdogRef.current);
            testWatchdogRef.current = setTimeout(() => {
              if (testTickIntervalRef.current) {
                clearInterval(testTickIntervalRef.current);
                testTickIntervalRef.current = null;
              }

              if (!speechHasStarted) {
                const timeoutCode = 'timeout-engine-unresponsive';
                setLastErrorCode(timeoutCode);

                addDiagnosticLog('warn', 'watchdog', timeoutCode, `Watchdog timeout setelah 7 detik pada percobaan ${attempt}`, {
                  attempt,
                  isPwa: isPwaMode(),
                  speaking: window.speechSynthesis.speaking,
                  paused: window.speechSynthesis.paused,
                });

                if (attempt < maxAttempts) {
                  try {
                    window.speechSynthesis.cancel();
                  } catch (e) {}
                  executeAttempt(attempt + 1);
                  return;
                }

                setTestAudioStatus('failed');
                setTestAudioMessage('Gagal memutar suara (mesin suara perangkat membutuhkan waktu terlalu lama).');
                playChime(523, 0.25);
                resolve(false);
              }
            }, 7000);
          } catch (initErr: any) {
            const errCode = 'invocation-exception';
            setLastErrorCode(errCode);
            addDiagnosticLog('error', 'test-audio', errCode, `Pengecualian inisialisasi pada percobaan ${attempt}: ${initErr?.message || initErr}`);

            if (attempt < maxAttempts) {
              executeAttempt(attempt + 1);
            } else {
              setTestAudioStatus('failed');
              setTestAudioMessage('Gagal memutar suara.');
              playChime(523, 0.25);
              resolve(false);
            }
          }
        };

        // Start execution
        executeAttempt(currentAttempt);
      });
    },
    [availableVoices, selectedVoice, addDiagnosticLog]
  );

  /**
   * Spoken response function connected to the assistant schedule query results.
   * Handles autoplay restrictions, multi-tier fallback, Indonesian voice selection,
   * and captures specific error codes in diagnostic logs.
   */
  const speakResponse = useCallback(
    async (text: string): Promise<boolean> => {
      // 1. Check if speech is enabled by user
      if (!speechEnabled) {
        addDiagnosticLog('info', 'speak-response', undefined, 'Pembacaan suara dilewati karena dinonaktifkan oleh pengguna');
        return false;
      }

      // 2. Pre-flight check: Availability
      if (!isSpeechSynthesisAvailable()) {
        const err = 'speech-synthesis-unavailable';
        setLastErrorCode(err);
        addDiagnosticLog('warn', 'speak-response', err, 'SpeechSynthesis tidak didukung di lingkungan ini. Membunyikan melodi akustik.');
        playMelodicChime();
        return false;
      }

      // 3. Pre-flight check: Text sanitization and validation
      const cleanText = sanitizeSpeechText(text);
      if (!cleanText) {
        addDiagnosticLog('warn', 'speak-response', 'empty-text', 'Teks jawaban kosong setelah sanitasi.');
        return false;
      }

      // 4. Pre-flight initialization: Stop active microphone to release audio session
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (e) {}

      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
      if (autoplayWatchdogRef.current) {
        clearTimeout(autoplayWatchdogRef.current);
        autoplayWatchdogRef.current = null;
      }

      // 5. Pre-flight initialization: Safely reset active speech queue
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}

      // Play soft chime for immediate sensory confirmation
      playChime(659, 0.15);

      // 6. Inspect voices (robust wait for 'voiceschanged' if unpopulated)
      let voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        if (availableVoices.length > 0) {
          voices = availableVoices;
        } else if (cachedVoices.length > 0) {
          voices = cachedVoices;
        } else {
          voices = await waitForVoices(600);
        }
      }

      const verifiedIndonesianVoice = findIndonesianVoice(voices) || selectedVoice;

      addDiagnosticLog('info', 'speak-response', undefined, `Memulai sintesis ucapan (${cleanText.length} karakter)`, {
        isPwa: isPwaMode(),
        voicesCount: voices.length,
        selectedVoice: verifiedIndonesianVoice ? `${verifiedIndonesianVoice.name} (${verifiedIndonesianVoice.lang})` : 'default',
        textPreview: cleanText.slice(0, 60),
      });

      // 7. Trigger playback with robust multi-tier execution and autoplay watchdog
      return new Promise<boolean>((resolve) => {
        let attempt = 0;
        const maxAttempts = 3;
        let startedSpeaking = false;

        const executeSpeech = () => {
          attempt++;

          try {
            if (typeof window.SpeechSynthesisUtterance === 'undefined') {
              throw new Error('SpeechSynthesisUtterance constructor unavailable');
            }

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            if (attempt === 1) {
              utterance.lang = 'id-ID';
              if (verifiedIndonesianVoice) {
                utterance.voice = verifiedIndonesianVoice;
              }
            } else if (attempt === 2) {
              // Fallback without binding voice object: relies on OS local Indonesian TTS
              utterance.lang = 'id-ID';
              utterance.voice = null;
            } else {
              // Final system fallback
              utterance.lang = '';
              utterance.voice = null;
            }

            utterance.onstart = () => {
              startedSpeaking = true;
              if (autoplayWatchdogRef.current) {
                clearTimeout(autoplayWatchdogRef.current);
                autoplayWatchdogRef.current = null;
              }
              setAutoplayBlocked(false);
              setStatus('speaking');
              setErrorMessage(null);
              setLastErrorCode(null);

              addDiagnosticLog('info', 'speak-response', undefined, `Sintesis ucapan mulai diputar (percobaan ${attempt})`, {
                attempt,
                voice: utterance.voice?.name || 'system-default',
              });

              // Periodic keepalive to fix Chrome 15s freeze bug
              if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
              keepAliveIntervalRef.current = setInterval(() => {
                try {
                  if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                  }
                } catch (e) {}
              }, 2500);
            };

            utterance.onend = () => {
              if (autoplayWatchdogRef.current) {
                clearTimeout(autoplayWatchdogRef.current);
                autoplayWatchdogRef.current = null;
              }
              if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
              }
              releaseUtteranceRef(utterance);
              activeUtteranceRef.current = null;
              setAutoplayBlocked(false);
              setStatus('done');
              addDiagnosticLog('info', 'speak-response', undefined, 'Sintesis ucapan selesai diputar.');
              resolve(true);
            };

            utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
              if (autoplayWatchdogRef.current) {
                clearTimeout(autoplayWatchdogRef.current);
                autoplayWatchdogRef.current = null;
              }
              if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
              }
              releaseUtteranceRef(utterance);
              activeUtteranceRef.current = null;

              const errorCode = event.error || 'unknown-error';
              setLastErrorCode(errorCode);

              if (event.error === 'canceled' || event.error === 'interrupted') {
                setStatus('done');
                addDiagnosticLog('info', 'speak-response', errorCode, `Sintesis ucapan dibatalkan/diinterupsi (${errorCode})`);
                resolve(true);
                return;
              }

              addDiagnosticLog('error', 'speak-response', errorCode, `Kesalahan sintesis suara pada percobaan ${attempt}: [${errorCode}]`, {
                attempt,
                errorCode,
                isPwa: isPwaMode(),
                voice: utterance.voice?.name || 'none',
              });

              // Check if browser blocked due to autoplay policy
              if (event.error === 'not-allowed') {
                setAutoplayBlocked(true);
                addDiagnosticLog('warn', 'autoplay-check', 'not-allowed', 'Pemutaran diblokir oleh kebijakan Autoplay browser/PWA. Pengguna dapat menekan tombol BACA JAWABAN.');
              }

              // Retry next fallback tier for common speech synthesis failure codes
              if (
                attempt < maxAttempts &&
                (event.error === 'synthesis-failed' ||
                  event.error === 'voice-unavailable' ||
                  event.error === 'language-unavailable' ||
                  event.error === 'not-allowed' ||
                  event.error === 'audio-busy')
              ) {
                setTimeout(executeSpeech, 40);
                return;
              }

              // All speech attempts exhausted: play pleasant harmonic melody
              playMelodicChime();
              setAutoplayBlocked(true); // Offer 1-tap "BACA JAWABAN" button
              setStatus('done');
              resolve(false);
            };

            activeUtteranceRef.current = utterance;
            holdUtteranceRef(utterance);

            window.speechSynthesis.speak(utterance);

            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }

            // Autoplay restriction watchdog: If browser suppresses playback
            // (e.g. in PWA standalone or mobile where user gesture expired during async database search)
            if (attempt === 1) {
              autoplayWatchdogRef.current = setTimeout(() => {
                try {
                  if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                  }
                } catch (e) {}

                // Check after another brief tick if it actually started
                setTimeout(() => {
                  if (!startedSpeaking && !window.speechSynthesis.speaking) {
                    const blockCode = 'autoplay-watchdog-suppressed';
                    setLastErrorCode(blockCode);
                    addDiagnosticLog('warn', 'watchdog', blockCode, 'Pemutaran audio tidak dimulai dalam batas waktu. Browser kemungkinan menahan pemutaran otomatis (PWA Autoplay Policy).', {
                      isPwa: isPwaMode(),
                      paused: window.speechSynthesis.paused,
                      speaking: window.speechSynthesis.speaking,
                    });
                    setAutoplayBlocked(true);
                    setStatus('done');
                  }
                }, 400);
              }, 1400);
            }
          } catch (initErr: any) {
            const errCode = 'speak-invocation-error';
            setLastErrorCode(errCode);
            addDiagnosticLog('error', 'speak-response', errCode, `Gagal memanggil speechSynthesis.speak pada percobaan ${attempt}: ${initErr?.message || initErr}`);

            if (attempt < maxAttempts) {
              setTimeout(executeSpeech, 40);
            } else {
              playMelodicChime();
              setAutoplayBlocked(true);
              setStatus('done');
              resolve(false);
            }
          }
        };

        setTimeout(executeSpeech, 30);
      });
    },
    [speechEnabled, selectedVoice, availableVoices, addDiagnosticLog]
  );

  /**
   * Repeats the last spoken response with explicit user gesture priming.
   */
  const repeatResponse = useCallback(() => {
    if (responseMessage) {
      primeAudio();
      setAutoplayBlocked(false);
      addDiagnosticLog('info', 'speak-response', undefined, 'Mengulang pembacaan jawaban (Repeat Response)');
      speakResponse(responseMessage);
    }
  }, [responseMessage, speakResponse, addDiagnosticLog]);

  /**
   * Starts listening to user speech via Web Speech API.
   * Primes speech synthesis synchronously on the user gesture.
   */
  const startListening = useCallback(() => {
    primeAudio();
    setAutoplayBlocked(false);

    if (!isSpeechRecognitionAvailable()) {
      setIsRecognitionSupported(false);
      setStatus('error');
      const err = 'speech-recognition-unsupported';
      setLastErrorCode(err);
      setErrorMessage('Browser Anda tidak mendukung Web Speech Recognition. Gunakan tombol Ketik Manual.');
      addDiagnosticLog('error', 'recognition', err, 'SpeechRecognition tidak didukung browser ini');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Stop speaking if currently speaking
    stopSpeaking();

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setStatus('listening');
        setTranscript('');
        setErrorMessage(null);
        playChime(880, 0.1);
        addDiagnosticLog('info', 'recognition', undefined, 'Mendengarkan suara pengguna...');
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results?.[0]?.[0]?.transcript;
        if (speechResult) {
          // Immediately stop recognition to release microphone audio hardware
          try {
            recognition.stop();
          } catch (e) {}

          setTranscript(speechResult);
          setStatus('searching');
          addDiagnosticLog('info', 'recognition', undefined, `Perintah suara dikenali: "${speechResult}"`);
          if (onCommandRecognized) {
            onCommandRecognized(speechResult);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const recogErr = event.error || 'recognition-error';
        setLastErrorCode(recogErr);
        addDiagnosticLog('warn', 'recognition', recogErr, `Kesalahan SpeechRecognition: [${recogErr}]`);

        if (event.error === 'not-allowed') {
          setErrorMessage('Izin mikrofon ditolak. Silakan izinkan akses mikrofon di pengaturan browser Anda.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('Tidak ada suara yang terdeteksi. Silakan coba kembali.');
        } else if (event.error === 'network') {
          setErrorMessage('Gangguan koneksi internet untuk pengenalan suara.');
        } else {
          setErrorMessage('Gagal mengenali suara. Silakan coba lagi atau gunakan teks.');
        }
        setStatus('error');
      };

      recognition.onend = () => {
        setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      const err = 'mic-access-exception';
      setLastErrorCode(err);
      addDiagnosticLog('error', 'recognition', err, `Gagal memulai mikrofon: ${e?.message || e}`);
      setStatus('error');
      setErrorMessage('Tidak dapat mengakses mikrofon. Periksa izin perangkat.');
    }
  }, [onCommandRecognized, stopSpeaking, addDiagnosticLog]);

  /**
   * Aborts listening.
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    stopSpeaking();
    setStatus('idle');
    addDiagnosticLog('info', 'recognition', undefined, 'Mendengarkan dihentikan oleh pengguna');
  }, [stopSpeaking, addDiagnosticLog]);

  return {
    status,
    transcript,
    responseMessage,
    speechEnabled,
    isSupported,
    isRecognitionSupported,
    isSynthesisSupported,
    isPwa,
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
    addDiagnosticLog,
    clearDiagnosticLogs,
    startListening,
    stopListening,
    speakResponse,
    stopSpeaking,
    repeatResponse,
    runAudioTest,
  };
}

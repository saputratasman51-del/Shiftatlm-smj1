/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceAssistantStatus = 'idle' | 'listening' | 'searching' | 'speaking' | 'done' | 'error';
export type TestAudioStatus = 'idle' | 'checking' | 'speaking' | 'completed' | 'failed';

interface UseVoiceAssistantOptions {
  onCommandRecognized?: (transcript: string) => void;
  defaultSpeechEnabled?: boolean;
}

export const TEST_VOICE_PHRASE =
  'Halo, ini tes suara aplikasi Shift ATLM. Jika Anda mendengar suara ini, fitur pembacaan suara berfungsi.';

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
 * Plays a pleasant web audio chime as immediate auditory feedback
 * and seamless fallback when device TTS is unavailable or muted.
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
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
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
 * Primes and unlocks the browser's speech synthesis and audio context
 * during synchronous user gestures (click / tap).
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
 * Explicitly waits for the SpeechSynthesis 'voiceschanged' event or returns immediately
 * if voices are already loaded, with a bounded timeout to prevent hanging.
 */
export async function waitForVoices(timeoutMs: number = 600): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisAvailable()) return [];

  try {
    const immediateVoices = window.speechSynthesis.getVoices();
    if (immediateVoices && immediateVoices.length > 0) {
      return immediateVoices;
    }
  } catch (e) {
    // ignore
  }

  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    let isResolved = false;
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        if (isSpeechSynthesisAvailable()) {
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        }
      } catch (e) {
        // ignore
      }
    };

    const handleVoicesChanged = () => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      try {
        const loadedVoices = window.speechSynthesis.getVoices();
        resolve(loadedVoices || []);
      } catch (e) {
        resolve([]);
      }
    };

    try {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    } catch (e) {
      // ignore
    }

    timer = setTimeout(() => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      try {
        const finalVoices = window.speechSynthesis.getVoices();
        resolve(finalVoices || []);
      } catch (e) {
        resolve([]);
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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Dedicated Test Audio states
  const [testAudioStatus, setTestAudioStatus] = useState<TestAudioStatus>('idle');
  const [testAudioMessage, setTestAudioMessage] = useState<string | null>(null);

  // Autoplay restriction state (for PWA / mobile browser fallback prompt)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const recognitionRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveIntervalRef = useRef<any>(null);
  const testWatchdogRef = useRef<any>(null);
  const autoplayWatchdogRef = useRef<any>(null);

  // Initialize voice lists, PWA status, and support detection
  useEffect(() => {
    const hasRecognition = isSpeechRecognitionAvailable();
    const hasSynthesis = isSpeechSynthesisAvailable();
    const pwaActive = isPwaMode();

    setIsRecognitionSupported(hasRecognition);
    setIsSynthesisSupported(hasSynthesis);
    setIsSupported(hasRecognition || hasSynthesis);
    setIsPwa(pwaActive);

    // Global one-time touch listener to unlock audio synthesis on mobile / PWA
    const handleFirstUserInteraction = () => {
      primeAudio();
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
    };
    window.addEventListener('click', handleFirstUserInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true, passive: true });

    let isMounted = true;

    const handleVoiceUpdate = (voices: SpeechSynthesisVoice[]) => {
      if (!isMounted) return;
      setAvailableVoices(voices);
      const best = findIndonesianVoice(voices);
      setSelectedVoice(best);
    };

    if (hasSynthesis) {
      waitForVoices(800).then((voices) => {
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
        if (autoplayWatchdogRef.current) {
          clearTimeout(autoplayWatchdogRef.current);
          autoplayWatchdogRef.current = null;
        }
        try {
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
          }
        } catch (e) {}
        (window as any).__activeUtterance = null;
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
    };
  }, []);

  /**
   * Completely stops active speech playback immediately.
   */
  const stopSpeaking = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
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
    activeUtteranceRef.current = null;
    (window as any).__activeUtterance = null;
    if (status === 'speaking') {
      setStatus('done');
    }
    if (testAudioStatus === 'speaking' || testAudioStatus === 'checking') {
      setTestAudioStatus('idle');
      setTestAudioMessage(null);
    }
  }, [status, testAudioStatus]);

  /**
   * Independent "TES SUARA" function directly triggered by user click without async delays.
   * Tests speech synthesis immediately and tracks states:
   * - 'checking': Memeriksa dukungan suara
   * - 'speaking': Sedang berbicara
   * - 'completed': Suara selesai
   * - 'failed': Gagal memutar suara
   */
  const runAudioTest = useCallback(async (): Promise<boolean> => {
    // 1. Synchronously trigger prime audio on user click
    primeAudio();

    // Reset previous watchdog
    if (testWatchdogRef.current) {
      clearTimeout(testWatchdogRef.current);
      testWatchdogRef.current = null;
    }

    // Set checking state immediately
    setTestAudioStatus('checking');
    setTestAudioMessage('Memeriksa dukungan suara...');

    // 2. Validate availability
    if (!isSpeechSynthesisAvailable()) {
      setTestAudioStatus('failed');
      setTestAudioMessage('SpeechSynthesis tidak didukung pada browser atau lingkungan ini.');
      playChime(440, 0.3);
      return false;
    }

    // 3. Stop active recognition to prevent microphone audio session lock
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    // 4. Cancel prior speech and resume paused engine
    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    // 5. Look for Indonesian voice
    let voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      voices = await waitForVoices(300);
    }
    const voiceToUse = findIndonesianVoice(voices) || selectedVoice;

    return new Promise<boolean>((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(TEST_VOICE_PHRASE);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        if (voiceToUse) {
          utterance.voice = voiceToUse;
        }

        utterance.onstart = () => {
          if (testWatchdogRef.current) {
            clearTimeout(testWatchdogRef.current);
            testWatchdogRef.current = null;
          }
          setTestAudioStatus('speaking');
          setStatus('speaking');
          setTestAudioMessage('Sedang berbicara...');
        };

        utterance.onend = () => {
          if (testWatchdogRef.current) {
            clearTimeout(testWatchdogRef.current);
            testWatchdogRef.current = null;
          }
          activeUtteranceRef.current = null;
          (window as any).__activeUtterance = null;
          setTestAudioStatus('completed');
          setStatus('done');
          setTestAudioMessage('Suara selesai.');
          resolve(true);
        };

        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
          if (testWatchdogRef.current) {
            clearTimeout(testWatchdogRef.current);
            testWatchdogRef.current = null;
          }
          activeUtteranceRef.current = null;
          (window as any).__activeUtterance = null;

          if (e.error === 'canceled' || e.error === 'interrupted') {
            setTestAudioStatus('idle');
            setTestAudioMessage(null);
            resolve(true);
            return;
          }

          console.warn('Test audio error:', e.error);
          setTestAudioStatus('failed');
          setTestAudioMessage(`Gagal memutar suara (${e.error || 'error'}).`);
          playChime(523, 0.25);
          resolve(false);
        };

        activeUtteranceRef.current = utterance;
        (window as any).__activeUtterance = utterance;

        // Speak utterance
        window.speechSynthesis.speak(utterance);

        // Resume engine if paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        // Safety watchdog: If onstart doesn't fire within 2.5s, check engine state
        testWatchdogRef.current = setTimeout(() => {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          } catch (e) {}

          // If still checking after 3s, flag error
          setTimeout(() => {
            setTestAudioStatus((prev) => {
              if (prev === 'checking') {
                playChime(523, 0.25);
                setTestAudioMessage('Gagal memutar suara (audio engine timeout).');
                return 'failed';
              }
              return prev;
            });
          }, 800);
        }, 1500);
      } catch (err: any) {
        console.error('Run audio test error:', err);
        setTestAudioStatus('failed');
        setTestAudioMessage('Gagal memutar suara.');
        playChime(523, 0.25);
        resolve(false);
      }
    });
  }, [selectedVoice]);

  /**
   * Spoken response function connected to the assistant schedule query results.
   * Handles autoplay restrictions, multi-tier fallback, and Indonesian voice selection.
   */
  const speakResponse = useCallback(
    async (text: string): Promise<boolean> => {
      // 1. Check if speech is enabled by user
      if (!speechEnabled) {
        return false;
      }

      // 2. Pre-flight check: Availability
      if (!isSpeechSynthesisAvailable()) {
        console.warn('SpeechSynthesis is not available in this environment. Falling back to chime.');
        playChime(660, 0.2);
        return false;
      }

      // 3. Pre-flight check: Text sanitization and validation
      const cleanText = sanitizeSpeechText(text);
      if (!cleanText) {
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

      // 6. Ensure voices are loaded before choosing Indonesian 'id-ID' voice
      let voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        voices = await waitForVoices(500);
      }

      const verifiedIndonesianVoice = findIndonesianVoice(voices) || selectedVoice;

      // 7. Trigger playback with robust multi-attempt execution and autoplay watchdog
      return new Promise<boolean>((resolve) => {
        let attempt = 0;
        const maxAttempts = 3;

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
              utterance.lang = 'id-ID';
              utterance.voice = null;
            } else {
              utterance.lang = '';
              utterance.voice = null;
            }

            utterance.onstart = () => {
              if (autoplayWatchdogRef.current) {
                clearTimeout(autoplayWatchdogRef.current);
                autoplayWatchdogRef.current = null;
              }
              setAutoplayBlocked(false);
              setStatus('speaking');
              setErrorMessage(null);

              // Periodic keepalive to fix Chrome 15s freeze bug
              if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
              keepAliveIntervalRef.current = setInterval(() => {
                try {
                  if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                  }
                } catch (e) {}
              }, 3000);
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
              activeUtteranceRef.current = null;
              (window as any).__activeUtterance = null;
              setAutoplayBlocked(false);
              setStatus('done');
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
              activeUtteranceRef.current = null;
              (window as any).__activeUtterance = null;

              if (event.error === 'canceled' || event.error === 'interrupted') {
                setStatus('done');
                resolve(true);
                return;
              }

              console.warn(`Speech synthesis error on attempt ${attempt}:`, event.error);

              // Retry next fallback tier for common speech synthesis failure codes
              if (
                attempt < maxAttempts &&
                (event.error === 'synthesis-failed' ||
                  event.error === 'voice-unavailable' ||
                  event.error === 'language-unavailable')
              ) {
                setTimeout(executeSpeech, 50);
                return;
              }

              // Exhausted speech attempts
              playChime(523, 0.25);
              setErrorMessage(null);
              setStatus('done');
              resolve(false);
            };

            activeUtteranceRef.current = utterance;
            (window as any).__activeUtterance = utterance;

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
                  if (status !== 'speaking' && !window.speechSynthesis.speaking) {
                    // Autoplay was suppressed by mobile/PWA policy
                    setAutoplayBlocked(true);
                    setStatus('done');
                  }
                }, 300);
              }, 900);
            }
          } catch (initErr: any) {
            console.warn('Speech synthesis initialization exception on attempt', attempt, initErr);
            if (attempt < maxAttempts) {
              setTimeout(executeSpeech, 50);
            } else {
              playChime(523, 0.25);
              setErrorMessage(null);
              setStatus('done');
              resolve(false);
            }
          }
        };

        setTimeout(executeSpeech, 40);
      });
    },
    [speechEnabled, selectedVoice, status]
  );

  /**
   * Repeats the last spoken response with explicit user gesture priming.
   */
  const repeatResponse = useCallback(() => {
    if (responseMessage) {
      primeAudio();
      setAutoplayBlocked(false);
      speakResponse(responseMessage);
    }
  }, [responseMessage, speakResponse]);

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
      setErrorMessage('Browser Anda tidak mendukung Web Speech Recognition. Gunakan tombol Ketik Manual.');
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
          if (onCommandRecognized) {
            onCommandRecognized(speechResult);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
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
    } catch (e) {
      console.error('Speech recognition exception:', e);
      setStatus('error');
      setErrorMessage('Tidak dapat mengakses mikrofon. Periksa izin perangkat.');
    }
  }, [onCommandRecognized, stopSpeaking]);

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
  }, [stopSpeaking]);

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
    setAutoplayBlocked,
    setSpeechEnabled,
    setTranscript,
    setResponseMessage,
    setStatus,
    setErrorMessage,
    startListening,
    stopListening,
    speakResponse,
    stopSpeaking,
    repeatResponse,
    runAudioTest,
  };
}

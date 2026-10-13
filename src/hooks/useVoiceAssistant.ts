/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceAssistantStatus = 'idle' | 'listening' | 'searching' | 'speaking' | 'done' | 'error';

interface UseVoiceAssistantOptions {
  onCommandRecognized?: (transcript: string) => void;
  defaultSpeechEnabled?: boolean;
}

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
  if (!isSpeechSynthesisAvailable()) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
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
 * CRITICAL: Never returns a foreign/English voice fallback, as assigning a foreign voice
 * with lang='id-ID' triggers 'synthesis-failed' in Chromium.
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

  // DO NOT return foreign/English voice! Returning null allows the browser's
  // native synthesizer to handle it gracefully without crashing.
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const recognitionRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveIntervalRef = useRef<any>(null);

  // Initialize voice lists and support detection with robust checks
  useEffect(() => {
    const hasRecognition = isSpeechRecognitionAvailable();
    const hasSynthesis = isSpeechSynthesisAvailable();

    setIsRecognitionSupported(hasRecognition);
    setIsSynthesisSupported(hasSynthesis);
    setIsSupported(hasRecognition || hasSynthesis);

    let isMounted = true;

    const handleVoiceUpdate = (voices: SpeechSynthesisVoice[]) => {
      if (!isMounted) return;
      setAvailableVoices(voices);
      const best = findIndonesianVoice(voices);
      setSelectedVoice(best);
    };

    if (hasSynthesis) {
      // Explicitly wait for voiceschanged or read immediately available voices
      waitForVoices(800).then((voices) => {
        handleVoiceUpdate(voices);
      });

      // Keep listening for any later voice profile updates
      const onVoicesChangedListener = () => {
        try {
          const freshVoices = window.speechSynthesis.getVoices();
          handleVoiceUpdate(freshVoices);
        } catch (e) {
          // ignore
        }
      };

      try {
        window.speechSynthesis.addEventListener('voiceschanged', onVoicesChangedListener);
      } catch (e) {
        // ignore
      }

      return () => {
        isMounted = false;
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
   * Refactored speakResponse function that handles potential initialization failures
   * before triggering playback, explicitly waiting for voices and guarding every phase.
   */
  const speakResponse = useCallback(
    async (text: string): Promise<boolean> => {
      // 1. Check if speech is globally enabled by user
      if (!speechEnabled) {
        return false;
      }

      // 2. Pre-flight check: Robust availability check
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

      // 4. Pre-flight initialization: Cleanup active microphones & timers
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (e) {
        // ignore
      }

      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }

      // 5. Pre-flight initialization: Safely reset active speech queue
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        console.warn('Cancel speech warning:', e);
      }

      // 6. Pre-flight initialization: Resume paused engine state
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        // ignore
      }

      // Play soft introductory chime for immediate sensory confirmation
      playChime(659, 0.15);

      // 7. Explicitly ensure voices are loaded before choosing Indonesian 'id-ID' voice
      let voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        voices = await waitForVoices(500);
      }

      const verifiedIndonesianVoice = findIndonesianVoice(voices) || selectedVoice;

      // 8. Trigger playback with robust multi-attempt execution and failure protection
      return new Promise<boolean>((resolve) => {
        let attempt = 0;
        const maxAttempts = 3;

        const executeSpeech = () => {
          attempt++;

          try {
            // Validate utterance constructor before initialization
            if (typeof window.SpeechSynthesisUtterance === 'undefined') {
              throw new Error('SpeechSynthesisUtterance constructor unavailable');
            }

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            if (attempt === 1) {
              // Attempt 1: Target id-ID with verified Indonesian voice if present
              utterance.lang = 'id-ID';
              if (verifiedIndonesianVoice) {
                utterance.voice = verifiedIndonesianVoice;
              }
            } else if (attempt === 2) {
              // Attempt 2: Target id-ID with native system engine (null voice)
              utterance.lang = 'id-ID';
              utterance.voice = null;
            } else {
              // Attempt 3: General fallback without forcing language constraints
              utterance.lang = '';
              utterance.voice = null;
            }

            utterance.onstart = () => {
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
              if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
              }
              activeUtteranceRef.current = null;
              (window as any).__activeUtterance = null;
              setStatus('done');
              resolve(true);
            };

            utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
              if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
                keepAliveIntervalRef.current = null;
              }
              activeUtteranceRef.current = null;
              (window as any).__activeUtterance = null;

              // If canceled or interrupted by new interaction, finish cleanly
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

              // All speech engine attempts gracefully exhausted: play fallback chime
              playChime(523, 0.25);
              setErrorMessage(null);
              setStatus('done');
              resolve(false);
            };

            // Retain reference on window to prevent Blink V8 garbage collection mid-speech
            activeUtteranceRef.current = utterance;
            (window as any).__activeUtterance = utterance;

            // Trigger playback safely
            window.speechSynthesis.speak(utterance);

            // Double check resume in case browser queued it in paused state
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
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

        // Small 30ms delay allows any prior cancellation to completely clear from browser audio queue
        setTimeout(executeSpeech, 30);
      });
    },
    [speechEnabled, selectedVoice]
  );

  /**
   * Stops active speech playback immediately.
   */
  const stopSpeaking = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    if (isSpeechSynthesisAvailable()) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        // ignore
      }
    }
    activeUtteranceRef.current = null;
    (window as any).__activeUtterance = null;
    if (status === 'speaking') {
      setStatus('done');
    }
  }, [status]);

  /**
   * Repeats the last spoken response.
   */
  const repeatResponse = useCallback(() => {
    if (responseMessage) {
      primeAudio();
      speakResponse(responseMessage);
    }
  }, [responseMessage, speakResponse]);

  /**
   * Starts listening to user speech via Web Speech API.
   * Primes speech synthesis on the user gesture.
   */
  const startListening = useCallback(() => {
    primeAudio();

    if (!isSpeechRecognitionAvailable()) {
      setIsRecognitionSupported(false);
      setStatus('error');
      setErrorMessage('Browser Anda tidak mendukung Web Speech Recognition. Gunakan kolom input teks.');
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
      } catch (e) {
        // ignore
      }
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
    errorMessage,
    availableVoices,
    selectedVoice,
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
  };
}

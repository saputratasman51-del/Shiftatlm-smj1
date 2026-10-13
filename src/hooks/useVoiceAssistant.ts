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
 * Finds the best Indonesian voice available in the browser's speechSynthesis engine.
 */
function findIndonesianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Exact id-ID match
  const exactId = voices.find((v) => v.lang.toLowerCase() === 'id-id');
  if (exactId) return exactId;

  // 2. Starts with 'id'
  const prefixId = voices.find((v) => v.lang.toLowerCase().startsWith('id'));
  if (prefixId) return prefixId;

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

  // 4. Fallback to default voice or first available
  return voices.find((v) => v.default) || voices[0] || null;
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

  // Initialize voice lists and support detection
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasRecognition = !!SpeechRecognition;
    const hasSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

    setIsRecognitionSupported(hasRecognition);
    setIsSynthesisSupported(hasSynthesis);
    setIsSupported(hasRecognition || hasSynthesis);

    if (hasSynthesis) {
      const updateVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices);
          const best = findIndonesianVoice(voices);
          setSelectedVoice(best);
        } catch (e) {
          console.warn('Error reading speechSynthesis voices:', e);
        }
      };

      updateVoices();

      // Many browsers load voices asynchronously
      if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.onvoiceschanged = null;
        } catch (e) {
          // ignore
        }
      }
      (window as any).__activeUtterance = null;
    };
  }, []);

  /**
   * Centralized, production-grade text-to-speech function.
   * Handles Chromium garbage collection bug, cancel queue race conditions,
   * voice selection, rate, natural pitch, and keepalive timer.
   */
  const speakResponse = useCallback(
    (text: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!speechEnabled) {
          resolve(false);
          return;
        }

        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          setErrorMessage('Browser tidak mendukung Speech Synthesis.');
          resolve(false);
          return;
        }

        if (!text || !text.trim()) {
          resolve(false);
          return;
        }

        // 1. Ensure microphone is stopped before speaking to avoid audio feedback
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {
            // ignore
          }
        }

        // 2. Clear any lingering keepalive intervals
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }

        // 3. Cancel existing speech if any
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          console.warn('Cancel speech error:', e);
        }

        // 4. Delay slightly before speaking to allow cancel queue to flush
        // (prevents Chrome & Safari from killing the newly queued utterance)
        setTimeout(() => {
          try {
            // Unpause if stuck
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }

            const cleanText = text.trim();
            const utterance = new SpeechSynthesisUtterance(cleanText);

            // Configure Indonesian language and natural pacing
            utterance.lang = 'id-ID';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Select Indonesian voice if available
            const voices = window.speechSynthesis.getVoices();
            const voiceToUse = findIndonesianVoice(voices) || selectedVoice;
            if (voiceToUse) {
              utterance.voice = voiceToUse;
            }

            utterance.onstart = () => {
              setStatus('speaking');
              setErrorMessage(null);

              // Chrome bug fix: utterances longer than 15s freeze without periodic resume
              keepAliveIntervalRef.current = setInterval(() => {
                if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                  window.speechSynthesis.resume();
                }
              }, 4000);
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

              // Only set error if not canceled intentionally by the user or new speech
              if (event.error !== 'canceled' && event.error !== 'interrupted') {
                console.warn('Speech synthesis error:', event.error);
                setErrorMessage(`Suara gagal diputar (${event.error || 'kesalahan perangkat'}).`);
              }
              setStatus('done');
              resolve(false);
            };

            // Prevent Garbage Collection in Blink/V8
            activeUtteranceRef.current = utterance;
            (window as any).__activeUtterance = utterance;

            window.speechSynthesis.speak(utterance);

            // Double check resume after speak
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          } catch (err: any) {
            console.error('Speech synthesis exception:', err);
            setErrorMessage('Terjadi kesalahan saat memutar respons suara.');
            setStatus('error');
            resolve(false);
          }
        }, 50);
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
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
      speakResponse(responseMessage);
    }
  }, [responseMessage, speakResponse]);

  /**
   * Starts listening to user speech via Web Speech API.
   * Primes speech synthesis on the user gesture.
   */
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsRecognitionSupported(false);
      setStatus('error');
      setErrorMessage('Browser Anda tidak mendukung Web Speech Recognition. Gunakan kolom input teks.');
      return;
    }

    // Prime speech synthesis inside this click gesture to bypass mobile autoplay policies
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {
        // ignore
      }
    }

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
        // Only reset to idle if not already transitioning to searching, speaking, or error
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

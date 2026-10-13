/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceAssistantStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error';

interface UseVoiceAssistantOptions {
  onCommandRecognized?: (transcript: string) => void;
  defaultSpeechEnabled?: boolean;
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

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatus('error');
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
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
    },
    [speechEnabled]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatus('error');
      setResponseMessage('Pengenalan suara tidak didukung oleh browser Anda.');
      return;
    }

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
        setResponseMessage('');
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        setStatus('processing');
        if (onCommandRecognized) {
          onCommandRecognized(speechResult);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setStatus('error');
        setResponseMessage('Gagal mengenali suara. Silakan coba lagi atau gunakan input teks.');
      };

      recognition.onend = () => {
        if (status === 'listening') {
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition exception:', e);
      setStatus('error');
      setResponseMessage('Izin mikrofon ditolak atau terjadi kesalahan sistem.');
    }
  }, [onCommandRecognized, status]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }
    setStatus('idle');
  }, []);

  const setResponseAndSpeak = useCallback(
    (message: string) => {
      setResponseMessage(message);
      setStatus('done');
      speak(message);
    },
    [speak]
  );

  return {
    status,
    transcript,
    responseMessage,
    speechEnabled,
    isSupported,
    setSpeechEnabled,
    startListening,
    stopListening,
    setResponseAndSpeak,
    setStatus,
    setTranscript,
  };
}

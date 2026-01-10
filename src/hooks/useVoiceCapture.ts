import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * HOOK DE CAPTURA DE VOZ
 *
 * Utiliza Web Speech API para reconhecimento de voz
 * Idioma: Português do Brasil (pt-BR)
 * Palavra-gatilho: "Pendência"
 *
 * REGRA CRÍTICA:
 * - Transcrição LITERAL da fala após o gatilho
 * - SEM correções gramaticais
 * - SEM interpretações
 * - SEM padronizações
 */

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface VoiceCaptureResult {
  texto: string;
  isPendencia: boolean;
  timestamp: string;
}

export function useVoiceCapture() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onPendenciaCallback = useRef<((texto: string) => void) | null>(null);

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const last = event.results[event.results.length - 1];
        const transcript = last[0].transcript.trim();

        console.log('🎤 Transcrição recebida:', transcript);
        setLastTranscript(transcript);

        // Detectar palavra-gatilho "Pendência"
        const regex = /pendência\s+(.+)/i;
        const match = transcript.match(regex);

        if (match && match[1]) {
          const textoPendencia = match[1].trim();
          console.log('✅ Pendência detectada:', textoPendencia);

          // Chamar callback com transcrição LITERAL
          if (onPendenciaCallback.current) {
            onPendenciaCallback.current(textoPendencia);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('❌ Erro no reconhecimento de voz:', event.error);
        setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('🛑 Reconhecimento de voz encerrado');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Web Speech API não suportada neste navegador');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  /**
   * Inicia escuta contínua
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Reconhecimento de voz não inicializado');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
      console.log('🎤 Escuta iniciada - aguardando "Pendência"...');
    } catch (err) {
      console.error('Erro ao iniciar reconhecimento:', err);
      setError('Erro ao iniciar reconhecimento de voz');
    }
  }, []);

  /**
   * Para escuta
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('🛑 Escuta parada');
    }
  }, []);

  /**
   * Registra callback para quando pendência for detectada
   */
  const onPendenciaDetected = useCallback((callback: (texto: string) => void) => {
    onPendenciaCallback.current = callback;
  }, []);

  return {
    isSupported,
    isListening,
    lastTranscript,
    error,
    startListening,
    stopListening,
    onPendenciaDetected,
  };
}

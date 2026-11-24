import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Minimal typings for the Web Speech API recognition interface (not in TypeScript's DOM lib).
 * Supported in Chromium browsers and Safari; not in Firefox. Requires HTTPS (or localhost) and
 * microphone permission. Chrome sends the audio to a cloud service for recognition.
 */
interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: RecognitionResult };
}
interface RecognitionErrorEvent {
  readonly error: string;
}
export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognition(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type RecognitionErrorKind = 'not-allowed' | 'no-speech' | 'network' | 'audio-capture' | 'other';

const ERROR_MESSAGES: Record<RecognitionErrorKind, string> = {
  'not-allowed': 'Trình duyệt chưa được cấp quyền dùng micro. Hãy cho phép micro trong cài đặt trang, hoặc trả lời bằng cách gõ.',
  'no-speech': 'Không nghe thấy giọng nói. Hãy thử lại và nói gần micro hơn.',
  network: 'Không kết nối được dịch vụ nhận dạng giọng nói. Hãy kiểm tra mạng hoặc trả lời bằng cách gõ.',
  'audio-capture': 'Không tìm thấy micro trên thiết bị này. Bạn có thể trả lời bằng cách gõ.',
  other: 'Nhận dạng giọng nói gặp lỗi. Hãy thử lại hoặc trả lời bằng cách gõ.',
};

export const recognitionErrorMessage = (kind: RecognitionErrorKind) => ERROR_MESSAGES[kind];

function toKind(error: string): RecognitionErrorKind {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'not-allowed';
  if (error === 'no-speech' || error === 'network' || error === 'audio-capture') return error;
  return 'other';
}

/** Speech recognition with capability detection; `supported` is false where the API is missing. */
export function useSpeechRecognition(lang = 'en-US') {
  const [Recognition] = useState(getSpeechRecognition);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<RecognitionErrorKind | null>(null);
  const instance = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => () => instance.current?.abort(), []);

  const start = useCallback(() => {
    if (!Recognition) return;
    instance.current?.abort();
    const rec = new Recognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]!;
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText) setTranscript(finalText.trim());
      setInterim(interimText.trim());
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError(toKind(e.error));
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
    };
    instance.current = rec;
    setError(null);
    setTranscript('');
    setInterim('');
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setError('other');
    }
  }, [Recognition, lang]);

  const stop = useCallback(() => instance.current?.stop(), []);
  const reset = useCallback(() => {
    instance.current?.abort();
    setTranscript('');
    setInterim('');
    setError(null);
  }, []);

  return { supported: Recognition !== null, listening, transcript, interim, error, start, stop, reset };
}

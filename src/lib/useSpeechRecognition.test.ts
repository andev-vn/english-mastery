import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSpeechRecognition, type SpeechRecognitionLike } from './useSpeechRecognition';

type W = { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };

/** A controllable fake of the browser API. */
class FakeRecognition implements SpeechRecognitionLike {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = false;
  continuous = false;
  maxAlternatives = 1;
  onresult: SpeechRecognitionLike['onresult'] = null;
  onerror: SpeechRecognitionLike['onerror'] = null;
  onend: SpeechRecognitionLike['onend'] = null;
  started = false;
  constructor() {
    FakeRecognition.last = this;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.onend?.();
  }
  say(text: string, isFinal: boolean) {
    const result = Object.assign([{ transcript: text, confidence: 0.9 }], { isFinal });
    this.onresult?.({ resultIndex: 0, results: Object.assign([result], { length: 1 }) });
  }
}

afterEach(() => {
  delete (window as unknown as W).SpeechRecognition;
  delete (window as unknown as W).webkitSpeechRecognition;
});

describe('useSpeechRecognition', () => {
  it('reports unsupported browsers (fallback to typing)', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.supported).toBe(false);
    act(() => result.current.start());
    expect(result.current.listening).toBe(false);
  });

  it('captures interim and final transcripts (webkit prefix)', () => {
    (window as unknown as W).webkitSpeechRecognition = FakeRecognition;
    const { result } = renderHook(() => useSpeechRecognition('en-US'));
    expect(result.current.supported).toBe(true);
    act(() => result.current.start());
    const rec = FakeRecognition.last!;
    expect(rec.started && rec.lang).toBe('en-US');
    expect(result.current.listening).toBe(true);
    act(() => rec.say('yesterday I', false));
    expect(result.current.interim).toBe('yesterday I');
    act(() => rec.say('Yesterday I fixed the bug', true));
    act(() => rec.stop());
    expect(result.current.transcript).toBe('Yesterday I fixed the bug');
    expect(result.current.listening).toBe(false);
  });

  it('maps permission errors to a clear kind', () => {
    (window as unknown as W).SpeechRecognition = FakeRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => result.current.start());
    act(() => FakeRecognition.last!.onerror?.({ error: 'not-allowed' }));
    expect(result.current.error).toBe('not-allowed');
  });
});

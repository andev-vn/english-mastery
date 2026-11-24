/** Thin wrapper over the browser Speech Synthesis API (free, on-device where supported). */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function englishVoices(): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  // Prefer US/UK local voices first.
  return voices.sort(
    (a, b) =>
      Number(b.lang === 'en-US') - Number(a.lang === 'en-US') ||
      Number(b.lang === 'en-GB') - Number(a.lang === 'en-GB') ||
      Number(b.localService) - Number(a.localService),
  );
}

function utter(text: string, rate: number, voiceIndex = 0): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  const voices = englishVoices();
  const voice = voices[voiceIndex % Math.max(1, voices.length)];
  if (voice) u.voice = voice;
  // With a single available voice, vary the pitch so two speakers still sound different.
  if (voices.length < 2 && voiceIndex === 1) u.pitch = 0.8;
  return u;
}

export function speak(text: string, rate = 0.95): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter(text, rate));
  return true;
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

/**
 * Plays several lines in order. `voiceFor` picks a voice per line (e.g. speaker A/B).
 * Calls onLine(index) as each line starts and onEnd() after the last one (or when stopped).
 */
export function speakLines(
  lines: string[],
  options: { rate?: number; voiceFor?: (index: number) => number; onLine?: (index: number) => void; onEnd?: () => void } = {},
): boolean {
  if (!isSpeechSynthesisSupported() || lines.length === 0) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  lines.forEach((text, i) => {
    const u = utter(text, options.rate ?? 0.95, options.voiceFor?.(i) ?? 0);
    u.onstart = () => options.onLine?.(i);
    if (i === lines.length - 1) {
      u.onend = () => options.onEnd?.();
      u.onerror = () => options.onEnd?.();
    }
    synth.speak(u);
  });
  return true;
}

/**
 * Thin wrapper around the browser's SpeechSynthesis API. Isolated here (not
 * in `domain/`) because it's an I/O side effect, not business logic - it has
 * no return value to unit-test and simply does nothing in environments
 * without speech support (older browsers, jsdom in tests).
 */

let voices: SpeechSynthesisVoice[] = [];

const loadVoices = () => {
  voices = window.speechSynthesis.getVoices();
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// Matches CJK characters and common full-width punctuation. This range
// intentionally includes the full-width space (U+3000).
// eslint-disable-next-line no-irregular-whitespace
const ZH_REGEX = /[一-龥　-〿＀-￯]/;
const isChinese = (text: string) => ZH_REGEX.test(text);

const pickVoice = (text: string): SpeechSynthesisVoice | undefined => {
  if (isChinese(text)) {
    return (
      voices.find((v) => v.lang === 'zh-TW') ||
      voices.find((v) => v.lang.startsWith('zh')) ||
      voices.find((v) => v.localService && v.lang.startsWith('zh')) ||
      voices.find((v) => v.default) ||
      voices[0]
    );
  }
  return (
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices.find((v) => v.default) ||
    voices[0]
  );
};

/** Speaks each segment as its own utterance, in order, cancelling anything already queued. */
export const speak = (segments: string[]): void => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  segments.forEach((text) => {
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(text);
    if (voice) utterance.voice = voice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  });
};

export const cancelSpeech = (): void => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

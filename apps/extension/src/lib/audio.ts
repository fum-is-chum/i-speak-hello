import type { TargetLanguage } from '@i-speak-hello/shared';
import { TTS_LANG_MAP } from '@i-speak-hello/shared';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, language: TargetLanguage): void {
  // Cancel any ongoing speech
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = TTS_LANG_MAP[language];
  utterance.rate = 0.8; // Slightly slower for learning
  utterance.pitch = 1;
  utterance.volume = 1;

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking;
}

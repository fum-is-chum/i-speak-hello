import { useEffect } from 'react';
import type { TargetLanguage } from '@i-speak-hello/shared';
import { speak } from '../lib/audio';

/**
 * Auto-speak the given text on mount when enabled.
 * Shared across all quiz components.
 */
export function useAutoSpeak(text: string, language: TargetLanguage, enabled?: boolean): void {
  useEffect(() => {
    if (enabled) {
      speak(text, language);
    }
  }, [enabled, text, language]);
}

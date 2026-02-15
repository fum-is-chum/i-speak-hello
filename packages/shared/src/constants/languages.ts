import type { TargetLanguage, NativeLanguage } from '../types';

export const LANGUAGES: Record<TargetLanguage | NativeLanguage, { name: string; nativeName: string; flag: string }> = {
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  zh: { name: 'Mandarin Chinese', nativeName: '中文', flag: '🇨🇳' },
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
};

export const TTS_LANG_MAP: Record<TargetLanguage, string> = {
  zh: 'zh-CN',
  en: 'en-US',
};

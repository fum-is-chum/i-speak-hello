/**
 * Get the tone number from a pinyin syllable.
 * Handles both numbered pinyin (ni3) and tone-marked pinyin (nǐ).
 */
export function getToneNumber(syllable: string): number {
  // Check for numbered pinyin (e.g., "ni3")
  const lastChar = syllable[syllable.length - 1];
  if (lastChar >= '1' && lastChar <= '5') {
    return parseInt(lastChar);
  }

  // Check for tone marks
  const toneMarks: Record<string, number> = {
    'ā': 1, 'á': 2, 'ǎ': 3, 'à': 4,
    'ē': 1, 'é': 2, 'ě': 3, 'è': 4,
    'ī': 1, 'í': 2, 'ǐ': 3, 'ì': 4,
    'ō': 1, 'ó': 2, 'ǒ': 3, 'ò': 4,
    'ū': 1, 'ú': 2, 'ǔ': 3, 'ù': 4,
    'ǖ': 1, 'ǘ': 2, 'ǚ': 3, 'ǜ': 4,
  };

  for (const char of syllable) {
    if (toneMarks[char]) return toneMarks[char];
  }

  return 5; // Neutral tone
}

/**
 * Split a pinyin string into individual syllables.
 * e.g., "nǐ hǎo" -> ["nǐ", "hǎo"]
 */
export function splitPinyin(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/);
}

/**
 * Get the CSS class for a tone color.
 */
export function getToneColorClass(tone: number): string {
  switch (tone) {
    case 1: return 'text-tone-1';
    case 2: return 'text-tone-2';
    case 3: return 'text-tone-3';
    case 4: return 'text-tone-4';
    default: return 'text-tone-5';
  }
}

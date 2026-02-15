import type { QuizType } from '../types';

export const XP_PER_QUIZ: Record<QuizType, number> = {
  flashcard: 5,
  mcq: 10,
  typing: 15,
  sentence: 20,
};

export const LEVEL_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  300,  // Level 3
  600,  // Level 4
  1000, // Level 5
  1500, // Level 6
  2100, // Level 7
  2800, // Level 8
  3600, // Level 9
  4500, // Level 10
];

export function getLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXpForNextLevel(totalXp: number): { current: number; needed: number; progress: number } {
  const level = getLevel(totalXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 1000;
  const current = totalXp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return {
    current,
    needed,
    progress: Math.min(current / needed, 1),
  };
}

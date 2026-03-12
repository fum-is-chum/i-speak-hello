import type { Word, QuizType } from '@i-speak-hello/shared';
import { calculateSM2, XP_PER_QUIZ } from '@i-speak-hello/shared';
import { updateWord, recordReviewActivity, addReview } from './storage';

/**
 * Shared quiz answer handler used by both:
 * - QuizContainer (new tab quiz) via Zustand stores
 * - SiteBlockerOverlay (content script) via direct Chrome storage
 *
 * Performs: SM-2 calculation → update word → log review → update streak.
 * Returns the XP earned so callers can update their own UI state.
 */
export async function recordQuizAnswer(
  word: Word,
  quality: number,
  quizType: QuizType,
  responseTimeMs?: number,
): Promise<{ xp: number; wasCorrect: boolean }> {
  const wasCorrect = quality >= 3;
  const xp = wasCorrect ? XP_PER_QUIZ[quizType] : 0;

  // 1. Calculate new SRS values
  const srsResult = calculateSM2({
    quality,
    repetitions: word.repetitions,
    easeFactor: word.easeFactor,
    intervalDays: word.intervalDays,
  });

  // 2. Update word in storage
  await updateWord(word.id, {
    easeFactor: srsResult.easeFactor,
    intervalDays: srsResult.intervalDays,
    repetitions: srsResult.repetitions,
    nextReviewAt: srsResult.nextReviewAt,
    lastReviewedAt: Date.now(),
  });

  // 3. Log review
  await addReview({
    wordId: word.id,
    quizType,
    quality,
    responseTimeMs: responseTimeMs ?? 0,
    wasCorrect,
    userAnswer: undefined,
  });

  // 4. Update streak (XP + daily count)
  if (wasCorrect) {
    await recordReviewActivity(xp);
  }

  return { xp, wasCorrect };
}

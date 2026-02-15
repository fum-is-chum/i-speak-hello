export interface SM2Input {
  quality: number; // 0-5
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
}

export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: number; // timestamp
}

/**
 * SM-2 spaced repetition algorithm.
 *
 * Quality scale:
 * 5 - perfect response
 * 4 - correct after hesitation
 * 3 - correct with serious difficulty
 * 2 - incorrect but close
 * 1 - incorrect, remembered upon seeing answer
 * 0 - complete blackout
 */
export function calculateSM2(input: SM2Input): SM2Output {
  const { quality, repetitions, easeFactor, intervalDays } = input;

  let newRepetitions: number;
  let newInterval: number;
  let newEaseFactor: number;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect — reset
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor
  newEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  const nextReviewAt = Date.now() + newInterval * 24 * 60 * 60 * 1000;

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    intervalDays: newInterval,
    nextReviewAt,
  };
}

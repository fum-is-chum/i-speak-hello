import type { Word, QuizQuestion, QuizType } from '@i-speak-hello/shared';

/**
 * Build a quiz session from available words.
 * @param newWordRatio 0-100 percentage of new words (default 20)
 * @param difficultyBias 0-100, 0=easy (flashcard/MCQ), 100=hard (typing/sentence)
 */
export function buildQuizSession(
  allWords: Word[],
  enabledQuizTypes: QuizType[],
  wordsPerSession: number,
  newWordRatio: number = 20,
  difficultyBias: number = 50,
): QuizQuestion[] {
  if (allWords.length === 0) return [];

  const now = Date.now();

  // Split into due and new words
  const dueWords = allWords.filter(w => w.nextReviewAt <= now && w.repetitions > 0);
  const newWords = allWords.filter(w => w.repetitions === 0);

  // Select words: use configurable ratio instead of hardcoded 80/20
  const newRatio = Math.max(0, Math.min(100, newWordRatio)) / 100;
  const newCount = Math.min(Math.ceil(wordsPerSession * newRatio), newWords.length);
  const dueCount = Math.min(wordsPerSession - newCount, dueWords.length);

  const selectedDue = shuffle(dueWords).slice(0, dueCount);
  const selectedNew = shuffle(newWords).slice(0, newCount);
  let selected = shuffle([...selectedDue, ...selectedNew]);

  // If we still don't have enough, fill with any words
  if (selected.length < wordsPerSession) {
    const remaining = allWords.filter(w => !selected.find(s => s.id === w.id));
    selected = [...selected, ...shuffle(remaining).slice(0, wordsPerSession - selected.length)];
  }

  // Build questions
  return selected.map(word => {
    const quizType = pickQuizType(word, enabledQuizTypes, difficultyBias);
    return buildQuestion(word, quizType, allWords);
  });
}

/**
 * Pick quiz type based on word mastery level and difficulty bias.
 * difficultyBias: 0=easy (prefer flashcard/MCQ), 100=hard (prefer typing/sentence)
 */
function pickQuizType(word: Word, enabled: QuizType[], difficultyBias: number = 50): QuizType {
  if (enabled.length === 0) return 'flashcard';

  // New words → always flashcard regardless of bias
  if (word.repetitions === 0) {
    if (enabled.includes('flashcard')) return 'flashcard';
    return enabled[0];
  }

  // Define easy and hard quiz types
  const easyTypes: QuizType[] = ['flashcard', 'mcq'];
  const hardTypes: QuizType[] = ['typing', 'sentence'];

  // Determine available easy and hard types
  const availableEasy = easyTypes.filter(t => enabled.includes(t));
  const availableHard = hardTypes.filter(t => enabled.includes(t));

  // Use bias to determine probability of picking hard type
  // Also factor in word mastery: more mastered words lean harder
  const masteryFactor = Math.min(word.intervalDays / 21, 1); // 0-1 based on mastery
  const biasNormalized = difficultyBias / 100; // 0-1
  const hardProbability = (biasNormalized * 0.6 + masteryFactor * 0.4);

  const useHard = Math.random() < hardProbability;

  let chosen: QuizType;
  if (useHard && availableHard.length > 0) {
    chosen = availableHard[Math.floor(Math.random() * availableHard.length)];
  } else if (availableEasy.length > 0) {
    chosen = availableEasy[Math.floor(Math.random() * availableEasy.length)];
  } else {
    chosen = enabled[Math.floor(Math.random() * enabled.length)];
  }

  // If sentence is selected but word has no sentences, fallback
  if (chosen === 'sentence' && word.sentences.length === 0) {
    const fallback = enabled.filter(t => t !== 'sentence');
    return fallback.length > 0 ? fallback[Math.floor(Math.random() * fallback.length)] : 'flashcard';
  }

  return chosen;
}

function buildQuestion(word: Word, quizType: QuizType, allWords: Word[]): QuizQuestion {
  const question: QuizQuestion = { word, quizType };

  if (quizType === 'mcq') {
    let wrongOptions: string[];

    // Use AI-generated distractors if available (more challenging)
    if (word.distractors && word.distractors.length >= 3) {
      wrongOptions = word.distractors.slice(0, 3);
    } else {
      // Fallback: pick random translations from same-language words
      const sameLanguageWords = allWords.filter(
        w => w.id !== word.id && w.targetLanguage === word.targetLanguage
      );
      wrongOptions = shuffle(sameLanguageWords)
        .slice(0, 3)
        .map(w => w.translation);
    }

    // Fill remaining slots if needed
    while (wrongOptions.length < 3) {
      wrongOptions.push('???');
    }

    // Insert correct answer at random position
    const options = shuffle([word.translation, ...wrongOptions]);
    question.options = options;

    // Add sentence hint for context
    if (word.sentences.length > 0) {
      const sentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
      question.hint = sentence.translation;
      if (sentence.pinyin) {
        question.sentencePinyin = sentence.pinyin;
      }
    }
  }

  // For typing quiz, add sentence hint for context
  if (quizType === 'typing' && word.sentences.length > 0) {
    const sentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
    question.hint = sentence.translation;
    if (sentence.pinyin) {
      question.sentencePinyin = sentence.pinyin;
    }
  }

  if (quizType === 'sentence' && word.sentences.length > 0) {
    const sentence = word.sentences[Math.floor(Math.random() * word.sentences.length)];
    // Create blank in the sentence where the word appears
    const template = sentence.sentence.replace(
      new RegExp(escapeRegex(word.original), 'gi'),
      '______'
    );
    question.sentenceTemplate = template;
    question.sentenceAnswer = word.original;
    question.hint = sentence.translation;
    // Store sentence pinyin for display after answer (zh words)
    if (sentence.pinyin) {
      question.sentencePinyin = sentence.pinyin;
    }
  } else if (quizType === 'sentence') {
    // Fallback to typing if no sentences
    question.quizType = 'typing';
  }

  return question;
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a typed answer is close enough (fuzzy match).
 * Now also checks against accepted synonyms from AI.
 */
export function isAnswerClose(
  userAnswer: string,
  correctAnswer: string,
  acceptedAnswers?: string[],
): boolean {
  const a = userAnswer.trim().toLowerCase();
  const b = correctAnswer.trim().toLowerCase();
  if (a === b) return true;

  // Allow 1 character difference for short words, 2 for longer
  const maxDistance = b.length <= 4 ? 1 : 2;
  if (levenshtein(a, b) <= maxDistance) return true;

  // Check against AI-generated synonyms
  if (acceptedAnswers && acceptedAnswers.length > 0) {
    for (const synonym of acceptedAnswers) {
      const s = synonym.trim().toLowerCase();
      if (a === s) return true;
      const synMaxDist = s.length <= 4 ? 1 : 2;
      if (levenshtein(a, s) <= synMaxDist) return true;
    }
  }

  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }

  return dp[m][n];
}

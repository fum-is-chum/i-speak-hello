export type TargetLanguage = 'zh' | 'en';
export type NativeLanguage = 'id';
export type WordSource = 'manual' | 'telegram' | 'import' | 'seed';
export type QuizType = 'flashcard' | 'mcq' | 'typing' | 'sentence';
export type SRSStatus = 'new' | 'learning' | 'mastered';

export interface Word {
  id: string;
  targetLanguage: TargetLanguage;
  original: string;
  translation: string;
  pinyin?: string;
  toneNumbers?: number[];
  notes?: string;
  categoryId?: string;
  difficulty: number;
  source: WordSource;
  sentences: Sentence[];
  distractors?: string[];        // AI-generated similar-looking wrong options for MCQ
  acceptedAnswers?: string[];    // AI-generated correct synonyms for typing quiz
  // SRS fields
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: number; // timestamp
  lastReviewedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface WordCreateInput {
  targetLanguage: TargetLanguage;
  original: string;
  translation?: string; // optional when AI generates it
  pinyin?: string;
  toneNumbers?: number[];
  notes?: string;
  categoryId?: string;
  source?: WordSource;
}

export interface Sentence {
  id: string;
  sentence: string;
  translation: string;
  pinyin?: string;
}

export interface ReviewLog {
  id: string;
  wordId: string;
  quizType: QuizType;
  quality: number;
  responseTimeMs: number;
  wasCorrect: boolean;
  userAnswer?: string;
  reviewedAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: number;
}

export interface QuizQuestion {
  word: Word;
  quizType: QuizType;
  options?: string[];
  sentenceTemplate?: string;
  sentenceAnswer?: string;
  sentencePinyin?: string; // for displaying pinyin after sentence quiz answer
  hint?: string;
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentIndex: number;
  results: ReviewLog[];
  startedAt: number;
  totalXpEarned: number;
}

export interface SiteBlockerSettings {
  enabled: boolean;
  blockedSites: string[];        // e.g. ["youtube.com", "twitter.com"]
  questionsToUnlock: number;     // 1-5 questions before unlock
  skipCooldownSeconds: number;   // seconds to wait if skipping (0 = no skip)
  unlockDurationMinutes: number; // how long the site stays unlocked after quiz
}

export interface UserSettings {
  nativeLanguage: NativeLanguage;
  learningLanguages: TargetLanguage[];
  quizTypes: QuizType[];
  wordsPerSession: number;
  dailyGoal: number;
  showPinyin: boolean;
  autoPlayAudio: boolean;
  autoSpeakOnQuiz: boolean;      // auto-play TTS when quiz question appears
  theme: 'light' | 'dark' | 'system';
  openRouterApiKey?: string;
  siteBlocker: SiteBlockerSettings;
  difficultyBias: number;       // 0-100, 0=easy (flashcard/MCQ), 100=hard (typing/sentence)
  newWordRatio: number;          // 0-100 percentage of new words in session
  reminderEnabled: boolean;
  reminderTime: string;          // HH:MM format
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  todayReviewed: number;
  todayXp: number;
  totalXp: number;
  level: number;
}

export function getSRSStatus(word: Word): SRSStatus {
  if (word.repetitions === 0) return 'new';
  if (word.intervalDays >= 21) return 'mastered';
  return 'learning';
}

export function getDefaultSettings(): UserSettings {
  return {
    nativeLanguage: 'id',
    learningLanguages: ['zh', 'en'],
    quizTypes: ['flashcard', 'mcq', 'typing', 'sentence'],
    wordsPerSession: 10,
    dailyGoal: 10,
    showPinyin: true,
    autoPlayAudio: false,
    autoSpeakOnQuiz: false,
    theme: 'system',
    difficultyBias: 50,
    newWordRatio: 20,
    reminderEnabled: false,
    reminderTime: '09:00',
    siteBlocker: {
      enabled: false,
      blockedSites: [],
      questionsToUnlock: 2,
      skipCooldownSeconds: 10,
      unlockDurationMinutes: 30,
    },
  };
}

export function getDefaultStreak(): StreakData {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    todayReviewed: 0,
    todayXp: 0,
    totalXp: 0,
    level: 1,
  };
}

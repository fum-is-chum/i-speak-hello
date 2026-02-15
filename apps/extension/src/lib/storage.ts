import type { Word, WordCreateInput, ReviewLog, UserSettings, StreakData, Sentence } from '@i-speak-hello/shared';
import { getDefaultSettings, getDefaultStreak } from '@i-speak-hello/shared';

function generateId(): string {
  return crypto.randomUUID();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Words ──────────────────────────────────────────────

export async function getWords(): Promise<Word[]> {
  const { words = [] } = await chrome.storage.local.get('words');
  return words;
}

export async function getWordById(id: string): Promise<Word | undefined> {
  const words = await getWords();
  return words.find(w => w.id === id);
}

export async function addWord(input: WordCreateInput): Promise<Word> {
  const words = await getWords();
  const now = Date.now();
  const word: Word = {
    id: generateId(),
    ...input,
    translation: input.translation ?? '', // default empty — AI fills it in later
    source: input.source ?? 'manual',
    difficulty: 0,
    sentences: [],
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: now,
    createdAt: now,
    updatedAt: now,
  };
  words.push(word);
  await chrome.storage.local.set({ words });
  return word;
}

export async function updateWord(id: string, updates: Partial<Word>): Promise<Word | undefined> {
  const words = await getWords();
  const idx = words.findIndex(w => w.id === id);
  if (idx === -1) return undefined;
  words[idx] = { ...words[idx], ...updates, updatedAt: Date.now() };
  await chrome.storage.local.set({ words });
  return words[idx];
}

export async function deleteWord(id: string): Promise<boolean> {
  const words = await getWords();
  const filtered = words.filter(w => w.id !== id);
  if (filtered.length === words.length) return false;
  await chrome.storage.local.set({ words: filtered });
  return true;
}

export async function addSentencesToWord(wordId: string, sentences: Sentence[]): Promise<void> {
  const words = await getWords();
  const idx = words.findIndex(w => w.id === wordId);
  if (idx === -1) return;
  words[idx].sentences = [...words[idx].sentences, ...sentences];
  words[idx].updatedAt = Date.now();
  await chrome.storage.local.set({ words });
}

export async function getDueWords(): Promise<Word[]> {
  const words = await getWords();
  const now = Date.now();
  return words.filter(w => w.nextReviewAt <= now);
}

export async function getWordsByLanguage(lang: string): Promise<Word[]> {
  const words = await getWords();
  return words.filter(w => w.targetLanguage === lang);
}

// ── Reviews ────────────────────────────────────────────

export async function getReviews(): Promise<ReviewLog[]> {
  const { reviews = [] } = await chrome.storage.local.get('reviews');
  return reviews;
}

export async function addReview(review: Omit<ReviewLog, 'id' | 'reviewedAt'>): Promise<ReviewLog> {
  const reviews = await getReviews();
  const log: ReviewLog = {
    ...review,
    id: generateId(),
    reviewedAt: Date.now(),
  };
  reviews.push(log);
  await chrome.storage.local.set({ reviews });
  return log;
}

// ── Settings ───────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const { settings } = await chrome.storage.local.get('settings');
  return settings ?? getDefaultSettings();
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
}

// ── Streaks ────────────────────────────────────────────

export async function getStreak(): Promise<StreakData> {
  const { streak } = await chrome.storage.local.get('streak');
  return streak ?? getDefaultStreak();
}

export async function saveStreak(streak: StreakData): Promise<void> {
  await chrome.storage.local.set({ streak });
}

export async function recordReviewActivity(xpEarned: number): Promise<StreakData> {
  const streak = await getStreak();
  const todayStr = today();

  if (streak.lastActiveDate === todayStr) {
    // Same day — just increment
    streak.todayReviewed += 1;
    streak.todayXp += xpEarned;
    streak.totalXp += xpEarned;
  } else {
    // Check if yesterday was active
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastActiveDate === yesterdayStr) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActiveDate = todayStr;
    streak.todayReviewed = 1;
    streak.todayXp = xpEarned;
    streak.totalXp += xpEarned;
  }

  await saveStreak(streak);
  return streak;
}

// ── Seed check ─────────────────────────────────────────

export async function hasBeenSeeded(): Promise<boolean> {
  const { seeded } = await chrome.storage.local.get('seeded');
  return !!seeded;
}

export async function markSeeded(): Promise<void> {
  await chrome.storage.local.set({ seeded: true });
}

import { create } from 'zustand';
import type { Word, WordCreateInput, Sentence } from '@i-speak-hello/shared';
import * as storage from '../lib/storage';

interface WordState {
  words: Word[];
  loading: boolean;
  loadWords: () => Promise<void>;
  addWord: (input: WordCreateInput) => Promise<Word>;
  updateWord: (id: string, updates: Partial<Word>) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  addSentences: (wordId: string, sentences: Sentence[]) => Promise<void>;
  getDueWords: () => Word[];
  getWordsByLanguage: (lang: string) => Word[];
  searchWords: (query: string) => Word[];
}

export const useWordStore = create<WordState>((set, get) => ({
  words: [],
  loading: false,

  loadWords: async () => {
    set({ loading: true });
    const words = await storage.getWords();
    set({ words, loading: false });
  },

  addWord: async (input) => {
    const word = await storage.addWord(input);
    set(state => ({ words: [...state.words, word] }));
    return word;
  },

  updateWord: async (id, updates) => {
    await storage.updateWord(id, updates);
    set(state => ({
      words: state.words.map(w => (w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w)),
    }));
  },

  deleteWord: async (id) => {
    // Optimistic: remove from state first for instant UI feedback
    const previous = get().words;
    set(state => ({ words: state.words.filter(w => w.id !== id) }));
    try {
      await storage.deleteWord(id);
    } catch {
      // Rollback on failure
      set({ words: previous });
    }
  },

  addSentences: async (wordId, sentences) => {
    await storage.addSentencesToWord(wordId, sentences);
    set(state => ({
      words: state.words.map(w =>
        w.id === wordId ? { ...w, sentences: [...w.sentences, ...sentences] } : w
      ),
    }));
  },

  getDueWords: () => {
    const now = Date.now();
    return get().words.filter(w => w.nextReviewAt <= now);
  },

  getWordsByLanguage: (lang) => {
    return get().words.filter(w => w.targetLanguage === lang);
  },

  searchWords: (query) => {
    const q = query.toLowerCase();
    return get().words.filter(
      w =>
        w.original.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q) ||
        (w.pinyin && w.pinyin.toLowerCase().includes(q))
    );
  },
}));

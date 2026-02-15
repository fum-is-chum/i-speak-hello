import { create } from 'zustand';
import type { StreakData } from '@i-speak-hello/shared';
import { getDefaultStreak, getLevel } from '@i-speak-hello/shared';
import * as storage from '../lib/storage';

interface StreakState {
  streak: number;
  longestStreak: number;
  todayReviewed: number;
  todayXp: number;
  totalXp: number;
  level: number;
  loading: boolean;
  loadStreak: () => Promise<void>;
  recordReview: (xpEarned: number) => Promise<void>;
}

export const useStreakStore = create<StreakState>((set) => ({
  streak: 0,
  longestStreak: 0,
  todayReviewed: 0,
  todayXp: 0,
  totalXp: 0,
  level: 1,
  loading: false,

  loadStreak: async () => {
    set({ loading: true });
    const data = await storage.getStreak();
    // Check if streak is still valid (last active was today or yesterday)
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = data.currentStreak;
    let todayReviewed = data.todayReviewed;
    let todayXp = data.todayXp;

    if (data.lastActiveDate !== todayStr) {
      // Reset today's counts
      todayReviewed = 0;
      todayXp = 0;
      if (data.lastActiveDate !== yesterdayStr) {
        // Streak broken
        currentStreak = 0;
      }
    }

    set({
      streak: currentStreak,
      longestStreak: data.longestStreak,
      todayReviewed,
      todayXp,
      totalXp: data.totalXp,
      level: getLevel(data.totalXp),
      loading: false,
    });
  },

  recordReview: async (xpEarned) => {
    const data = await storage.recordReviewActivity(xpEarned);
    set({
      streak: data.currentStreak,
      longestStreak: data.longestStreak,
      todayReviewed: data.todayReviewed,
      todayXp: data.todayXp,
      totalXp: data.totalXp,
      level: getLevel(data.totalXp),
    });
  },
}));

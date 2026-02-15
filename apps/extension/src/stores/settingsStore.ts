import { create } from 'zustand';
import type { UserSettings } from '@i-speak-hello/shared';
import { getDefaultSettings } from '@i-speak-hello/shared';
import * as storage from '../lib/storage';

interface SettingsState {
  settings: UserSettings;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: getDefaultSettings(),
  loading: false,

  loadSettings: async () => {
    set({ loading: true });
    const settings = await storage.getSettings();
    set({ settings, loading: false });
  },

  updateSettings: async (updates) => {
    const newSettings = { ...get().settings, ...updates };
    await storage.saveSettings(newSettings);
    set({ settings: newSettings });
  },
}));

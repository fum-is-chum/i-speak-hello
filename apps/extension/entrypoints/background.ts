import { SEED_WORDS } from '../src/lib/seed-data';
import type { Word } from '@i-speak-hello/shared';
import { getDefaultSettings, getDefaultStreak } from '@i-speak-hello/shared';

export default defineBackground(() => {
  // ── Seed data on first install ─────────────────────
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      const { seeded } = await chrome.storage.local.get('seeded');
      if (seeded) return;

      const now = Date.now();
      const words: Word[] = SEED_WORDS.map((input, i) => ({
        id: crypto.randomUUID(),
        ...input,
        translation: input.translation ?? '',
        source: input.source ?? 'seed',
        difficulty: 0,
        sentences: [],
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
        nextReviewAt: now,
        createdAt: now - i, // slight offset so they have a stable order
        updatedAt: now,
      }));

      await chrome.storage.local.set({
        words,
        settings: getDefaultSettings(),
        streak: getDefaultStreak(),
        seeded: true,
      });

      console.log(`[I Speak Hello] Seeded ${words.length} words`);
    }
  });

  // ── Badge: show due word count ─────────────────────
  async function updateBadge() {
    try {
      const { words = [] } = await chrome.storage.local.get('words');
      const now = Date.now();
      const dueCount = words.filter((w: any) => w.nextReviewAt <= now).length;

      if (dueCount > 0) {
        await chrome.action.setBadgeText({ text: String(dueCount) });
        await chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
      } else {
        await chrome.action.setBadgeText({ text: '' });
      }
    } catch (err) {
      console.error('Badge update failed:', err);
    }
  }

  // ── Alarms ─────────────────────────────────────────
  chrome.alarms.create('update-badge', { periodInMinutes: 5 });
  chrome.alarms.create('auto-backup', { periodInMinutes: 30 });

  // Set up study reminder alarm based on settings
  async function setupReminderAlarm() {
    // Clear existing reminder alarm
    await chrome.alarms.clear('study-reminder');

    const { settings } = await chrome.storage.local.get('settings');
    const config = settings ?? getDefaultSettings();

    if (config.reminderEnabled && config.reminderTime) {
      const [hours, minutes] = config.reminderTime.split(':').map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // If time has passed today, schedule for tomorrow
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const delayMs = target.getTime() - now.getTime();
      chrome.alarms.create('study-reminder', {
        when: Date.now() + delayMs,
        periodInMinutes: 24 * 60, // daily
      });
    }
  }

  // Initial setup
  setupReminderAlarm();

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'update-badge') {
      updateBadge();
    }

    if (alarm.name === 'auto-backup') {
      try {
        // Dynamic import to avoid loading backup logic at startup
        const { autoBackup } = await import('../src/lib/backup');
        await autoBackup();
        console.log('[I Speak Hello] Auto-backup completed');
      } catch (err) {
        console.warn('[I Speak Hello] Auto-backup failed:', err);
      }
    }

    if (alarm.name === 'study-reminder') {
      try {
        const { words = [] } = await chrome.storage.local.get('words');
        const now = Date.now();
        const dueCount = words.filter((w: any) => w.nextReviewAt <= now).length;

        if (dueCount > 0) {
          chrome.notifications.create('study-reminder', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icon/128.png'),
            title: 'Waktunya belajar! 📚',
            message: `Ada ${dueCount} kata menunggu review. Ayo buka quiz sekarang!`,
          });
        }
      } catch (err) {
        console.warn('[I Speak Hello] Reminder failed:', err);
      }
    }
  });

  // Handle notification clicks
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'study-reminder') {
      chrome.tabs.create({ url: chrome.runtime.getURL('/newtab.html') });
      chrome.notifications.clear(notificationId);
    }
  });

  // Re-setup reminder when settings change
  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes.settings) {
      setupReminderAlarm();
    }
    updateBadge();
  });

  // Initial badge update
  updateBadge();
});

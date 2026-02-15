import { useState, useEffect } from 'react';
import { WordForm } from '../../src/components/words/WordForm';
import { useWordStore } from '../../src/stores/wordStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { cn } from '../../src/lib/cn';
import { useTheme } from '../../src/hooks/useTheme';

type View = 'home' | 'add';

export default function App() {
  const [view, setView] = useState<View>('home');
  const { words, loadWords, getDueWords } = useWordStore();
  const { streak, todayReviewed, loadStreak } = useStreakStore();
  const { settings, loadSettings } = useSettingsStore();

  useTheme(settings.theme);

  useEffect(() => {
    loadWords();
    loadStreak();
    loadSettings();
  }, [loadWords, loadStreak, loadSettings]);

  const dueCount = getDueWords().length;

  if (view === 'add') {
    return (
      <div className="p-4 pb-5 dark:bg-gray-900">
        <button
          onClick={() => setView('home')}
          className="mb-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Kembali
        </button>
        <WordForm onSaved={() => setView('home')} />
      </div>
    );
  }

  return (
    <div className="p-4 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">🌏 I Speak Hello</h1>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-3 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">🔥 {streak}</p>
          <p className="text-xs text-orange-500 dark:text-orange-400">Streak</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-3 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todayReviewed}</p>
          <p className="text-xs text-blue-500 dark:text-blue-400">Hari Ini</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-3 text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dueCount}</p>
          <p className="text-xs text-purple-500 dark:text-purple-400">Perlu Review</p>
        </div>
      </div>

      {/* Total words */}
      <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {words.length} kata tersimpan
      </p>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => setView('add')}
          className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary-dark transition-colors"
        >
          + Tambah Kata Baru
        </button>
        <button
          onClick={() => {
            chrome.tabs.create({ url: chrome.runtime.getURL('/newtab.html') });
          }}
          className={cn(
            'w-full rounded-lg py-3 font-medium transition-colors',
            dueCount > 0
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
          )}
          disabled={dueCount === 0}
        >
          {dueCount > 0 ? `Mulai Quiz (${dueCount} kata)` : 'Tidak ada kata untuk review'}
        </button>
        <button
          onClick={() => {
            chrome.tabs.create({ url: chrome.runtime.getURL('/options.html') });
          }}
          className="w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          ⚙️ Pengaturan
        </button>
      </div>
    </div>
  );
}

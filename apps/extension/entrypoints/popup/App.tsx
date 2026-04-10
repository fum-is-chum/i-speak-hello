import { useState, useEffect } from 'react';
import { WordForm } from '../../src/components/words/WordForm';
import { useWordStore } from '../../src/stores/wordStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useTheme } from '../../src/hooks/useTheme';

type View = 'home' | 'add';

export default function App() {
  const [view, setView] = useState<View>('home');
  const { words, loadWords, getDueWords, getWordsByLanguage } = useWordStore();
  const { streak, todayReviewed, totalXp, level, loadStreak } = useStreakStore();
  const { settings, loadSettings } = useSettingsStore();

  useTheme(settings.theme);

  useEffect(() => {
    loadWords();
    loadStreak();
    loadSettings();
  }, [loadWords, loadStreak, loadSettings]);

  const dueCount = getDueWords().length;
  const zhWords = getWordsByLanguage('zh');
  const enWords = getWordsByLanguage('en');
  const zhDue = zhWords.filter(w => w.nextReviewAt <= Date.now() && w.repetitions > 0).length;
  const enDue = enWords.filter(w => w.nextReviewAt <= Date.now() && w.repetitions > 0).length;

  if (view === 'add') {
    return (
      <div className="p-4 pb-5 w-full bg-surface-0 min-h-full">
        <button
          onClick={() => setView('home')}
          className="mb-3 text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
        >
          ← Kembali
        </button>
        <WordForm onSaved={() => setView('home')} />
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-0 min-h-full">
      {/* Mini Gradient Header */}
      <div className="relative px-5 pt-4 pb-4 text-white bg-gradient-to-r from-teal-700 to-teal-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌏</span>
            <span className="text-base font-bold">I Speak Hello</span>
          </div>
          <button
            onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('/options.html') })}
            className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Stats row inside header */}
        <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5">
          <div className="text-center">
            <p className="text-lg font-bold">🔥 {streak}</p>
            <p className="text-[10px] text-teal-100">Streak</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold">{todayReviewed}/{settings.dailyGoal}</p>
            <p className="text-[10px] text-teal-100">Target</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <div className="flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 mx-auto">
              <span className="text-xs">⭐</span>
              <span className="text-sm font-bold">Lv.{level}</span>
            </div>
            <p className="text-[10px] text-teal-100">{totalXp} XP</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Primary CTA: Start Quiz */}
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('/newtab.html') })}
          disabled={dueCount === 0}
          className={`w-full rounded-2xl py-4 px-5 mb-3 font-semibold text-base shadow-lg transition-all flex items-center justify-between ${
            dueCount > 0
              ? 'text-white bg-gradient-to-r from-teal-700 to-teal-600 hover:shadow-xl'
              : 'text-stone-400 bg-stone-100 dark:bg-stone-700 dark:text-stone-500 cursor-not-allowed shadow-none'
          }`}
          style={dueCount > 0 ? { boxShadow: '0 4px 12px rgba(15,118,110,0.3)' } : undefined}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            <div className="text-left">
              <p>{dueCount > 0 ? 'Mulai Quiz' : 'Tidak ada kata untuk review'}</p>
              {dueCount > 0 && (
                <p className="text-xs text-teal-200 font-normal">{dueCount} kata perlu review</p>
              )}
            </div>
          </div>
          {dueCount > 0 && (
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Language Breakdown */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {settings.learningLanguages.includes('zh') && (
            <div className="rounded-xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 px-3 py-2.5 flex items-center gap-2.5">
              <span className="text-lg">🇨🇳</span>
              <div>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{zhWords.length} kata</p>
                {zhDue > 0 && <p className="text-[10px] text-red-500 font-medium">{zhDue} perlu review</p>}
              </div>
            </div>
          )}
          {settings.learningLanguages.includes('en') && (
            <div className="rounded-xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 px-3 py-2.5 flex items-center gap-2.5">
              <span className="text-lg">🇬🇧</span>
              <div>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">{enWords.length} kata</p>
                {enDue > 0 && <p className="text-[10px] text-red-500 font-medium">{enDue} perlu review</p>}
              </div>
            </div>
          )}
        </div>

        {/* Add Word */}
        <button
          onClick={() => setView('add')}
          className="w-full rounded-xl border-2 border-stone-200 dark:border-stone-600 bg-surface-1 py-3 px-4 text-sm font-medium text-stone-700 dark:text-stone-200 hover:border-teal-400 dark:hover:border-teal-600 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-teal-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          Tambah Kata Baru
        </button>
      </div>
    </div>
  );
}

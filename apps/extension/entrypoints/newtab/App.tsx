import { useState, useEffect } from 'react';
import { QuizContainer } from '../../src/components/quiz/QuizContainer';
import { WordList } from '../../src/components/words/WordList';
import { WordForm } from '../../src/components/words/WordForm';
import { useWordStore } from '../../src/stores/wordStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { StatusBar } from '../../src/components/gamification/StatusBar';
import { cn } from '../../src/lib/cn';
import { useTheme } from '../../src/hooks/useTheme';

type Tab = 'quiz' | 'words' | 'add';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('quiz');
  const { words, loadWords, getDueWords } = useWordStore();
  const { settings, loadSettings } = useSettingsStore();
  const { streak, todayReviewed, totalXp, level, loadStreak } = useStreakStore();
  const [loading, setLoading] = useState(true);
  const [seedingStatus, setSeedingStatus] = useState<string | null>(null);

  useTheme(settings.theme);

  useEffect(() => {
    Promise.all([loadWords(), loadSettings(), loadStreak()]).then(() => {
      setLoading(false);
    });
  }, [loadWords, loadSettings, loadStreak]);

  const hasWords = words.length > 0;
  const dueCount = getDueWords().length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-4xl animate-bounce">🌏</p>
          <p className="mt-2 text-stone-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-stone-950/80 border-b border-stone-200/50 dark:border-stone-700/50">
        <div className="mx-auto max-w-2xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌏</span>
            <span className="text-lg font-bold text-stone-900 dark:text-white">I Speak Hello</span>
          </div>
          <StatusBar
            streak={streak}
            reviewed={todayReviewed}
            goal={settings.dailyGoal}
            level={level}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        'flex-1 px-4 sm:px-6 pb-24',
        activeTab === 'quiz' ? 'flex items-start justify-center pt-6 sm:pt-10' : 'pt-6',
      )}>
        <div className={cn(
          'w-full',
          activeTab === 'quiz' ? 'max-w-md' : 'max-w-2xl mx-auto',
        )}>
          {activeTab === 'quiz' && (
            hasWords ? (
              <QuizContainer onGoToWords={() => setActiveTab('words')} />
            ) : (
              /* Welcome / Empty State */
              <div className="text-center">
                <div className="text-7xl mb-6 animate-scale-in">🌏</div>
                <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white mb-3 animate-slide-up">
                  Mulai Perjalanan<br/>Bahasamu
                </h1>
                <p className="text-stone-500 dark:text-stone-400 mb-10 animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
                  Belajar kata-kata baru setiap hari dengan metode spaced repetition
                </p>

                {/* Fanned Preview Cards */}
                <div className="relative h-32 mb-10 flex justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
                  <div className="absolute w-40 h-24 rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 shadow-lg flex flex-col items-center justify-center -rotate-6 -translate-x-12 opacity-60">
                    <p className="text-2xl font-bold text-stone-900 dark:text-white">你好</p>
                    <p className="text-xs text-stone-400 mt-1">Halo</p>
                  </div>
                  <div className="absolute w-40 h-24 rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 shadow-xl flex flex-col items-center justify-center z-10">
                    <p className="text-2xl font-bold text-stone-900 dark:text-white">Hello</p>
                    <p className="text-xs text-stone-400 mt-1">Halo</p>
                  </div>
                  <div className="absolute w-40 h-24 rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 shadow-lg flex flex-col items-center justify-center rotate-6 translate-x-12 opacity-60">
                    <p className="text-2xl font-bold text-stone-900 dark:text-white">谢谢</p>
                    <p className="text-xs text-stone-400 mt-1">Terima kasih</p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                  <button
                    onClick={() => setActiveTab('add')}
                    disabled={!!seedingStatus}
                    className="w-full rounded-2xl bg-primary hover:bg-primary-dark py-4 text-lg font-semibold text-white shadow-lg shadow-teal-600/25 hover:shadow-xl transition-all"
                  >
                    Tambah Kata Sendiri
                  </button>

                  <div className="flex items-center gap-3 text-stone-400">
                    <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                    <span className="text-xs">atau</span>
                    <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
                  </div>

                  <button
                    onClick={async () => {
                      setSeedingStatus('Memuat kata...');
                      const { SEED_WORDS } = await import('../../src/lib/seed-data');
                      const { addWord, updateWord, addSentences } = useWordStore.getState();
                      const { settings: currentSettings } = useSettingsStore.getState();

                      const addedWords = [];
                      for (const input of SEED_WORDS) {
                        const w = await addWord(input);
                        addedWords.push(w);
                      }
                      await chrome.storage.local.set({ seeded: true });

                      if (currentSettings.openRouterApiKey) {
                        setSeedingStatus('AI sedang generate pinyin + kalimat + opsi quiz...');
                        try {
                          const { enrichWordsBatch } = await import('../../src/lib/openrouter');
                          const results = await enrichWordsBatch(
                            currentSettings.openRouterApiKey,
                            addedWords.map(w => ({
                              id: w.id,
                              original: w.original,
                              translation: w.translation,
                              targetLanguage: w.targetLanguage,
                            })),
                          );

                          for (const [wordId, result] of results) {
                            const updates: Record<string, unknown> = {};
                            if (result.pinyin) updates.pinyin = result.pinyin;
                            if (result.distractors.length > 0) updates.distractors = result.distractors;
                            if (result.acceptedAnswers.length > 0) updates.acceptedAnswers = result.acceptedAnswers;
                            if (Object.keys(updates).length > 0) {
                              await updateWord(wordId, updates);
                            }
                            if (result.sentences.length > 0) {
                              await addSentences(wordId, result.sentences);
                            }
                          }
                        } catch (err) {
                          console.warn('Batch enrich failed:', err);
                        }
                      }

                      setSeedingStatus(null);
                    }}
                    disabled={!!seedingStatus}
                    className={cn(
                      'w-full rounded-2xl border-2 py-4 text-lg font-semibold transition-all',
                      seedingStatus
                        ? 'border-stone-300 text-stone-400 cursor-wait dark:border-stone-600'
                        : 'border-stone-200 dark:border-stone-600 bg-surface-1 text-stone-700 dark:text-stone-200 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md'
                    )}
                  >
                    {seedingStatus || '📦 Muat 50 Kata Bawaan'}
                  </button>

                  <p className="text-xs text-stone-400 mt-2">
                    25 kata Mandarin + 25 kata English dengan terjemahan Indonesia
                  </p>
                </div>
              </div>
            )
          )}
          {activeTab === 'words' && <WordList />}
          {activeTab === 'add' && <WordForm onSaved={() => setActiveTab('words')} />}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-stone-950/90 border-t border-stone-200/50 dark:border-stone-700/50">
        <div className="mx-auto max-w-md flex justify-around py-2 pb-3">
          {([
            { key: 'quiz' as Tab, label: `Quiz${dueCount > 0 ? ` (${dueCount})` : ''}`, icon: '🧠' },
            { key: 'words' as Tab, label: `Kata Saya (${words.length})`, icon: '📚' },
            { key: 'add' as Tab, label: 'Tambah', icon: '➕' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1 transition-colors relative',
                activeTab === tab.key
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
              )}
            >
              {activeTab === tab.key && (
                <div className="absolute -top-0.5 w-5 h-0.5 rounded-full bg-teal-500" />
              )}
              <span className="text-lg">{tab.icon}</span>
              <span className={cn('text-[10px]', activeTab === tab.key ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

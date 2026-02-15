import { useState, useEffect } from 'react';
import { QuizContainer } from '../../src/components/quiz/QuizContainer';
import { WordList } from '../../src/components/words/WordList';
import { WordForm } from '../../src/components/words/WordForm';
import { useWordStore } from '../../src/stores/wordStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { StreakCounter } from '../../src/components/gamification/StreakCounter';
import { XPBar } from '../../src/components/gamification/XPBar';
import { DailyGoal } from '../../src/components/gamification/DailyGoal';
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <p className="text-4xl animate-bounce">🌏</p>
          <p className="mt-2 text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header with stats */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🌏 I Speak Hello
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Belajar kata baru setiap hari
              </p>
            </div>
            <div className="flex items-center gap-4">
              <StreakCounter streak={streak} />
              <DailyGoal reviewed={todayReviewed} goal={settings.dailyGoal} />
            </div>
          </div>
          <div className="mt-3">
            <XPBar totalXp={totalXp} level={level} />
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="mb-6 flex justify-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
          {([
            { key: 'quiz' as Tab, label: `Quiz${dueCount > 0 ? ` (${dueCount})` : ''}`, icon: '🧠' },
            { key: 'words' as Tab, label: `Kata Saya (${words.length})`, icon: '📚' },
            { key: 'add' as Tab, label: 'Tambah', icon: '➕' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'rounded-lg px-5 py-2 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white text-primary shadow-sm dark:bg-gray-600 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
              )}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main>
          {activeTab === 'quiz' && (
            hasWords ? (
              <QuizContainer />
            ) : (
              <div className="py-16 text-center">
                <p className="text-6xl">🎓</p>
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Selamat datang di I Speak Hello!
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Aplikasi ini membantu kamu menghafal kata-kata baru dalam bahasa yang sedang kamu pelajari.
                  Tambahkan kata pertamamu atau muat kata bawaan untuk mulai!
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('add')}
                    className="rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark transition-colors"
                    disabled={!!seedingStatus}
                  >
                    ➕ Tambah Kata Sendiri
                  </button>
                  <button
                    onClick={async () => {
                      setSeedingStatus('Memuat kata...');
                      const { SEED_WORDS } = await import('../../src/lib/seed-data');
                      const { addWord, updateWord, addSentences } = useWordStore.getState();
                      const { settings: currentSettings } = useSettingsStore.getState();

                      // Add all seed words first
                      const addedWords = [];
                      for (const input of SEED_WORDS) {
                        const w = await addWord(input);
                        addedWords.push(w);
                      }
                      await chrome.storage.local.set({ seeded: true });

                      // AI enrichment if API key is configured
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
                      'rounded-lg border-2 border-primary px-6 py-3 font-medium transition-colors',
                      seedingStatus
                        ? 'border-gray-300 text-gray-400 cursor-wait'
                        : 'text-primary hover:bg-indigo-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {seedingStatus || '📦 Muat 50 Kata Bawaan'}
                  </button>
                </div>
                <p className="mt-4 text-xs text-gray-400">
                  25 kata Mandarin + 25 kata English dengan terjemahan Indonesia
                </p>
              </div>
            )
          )}
          {activeTab === 'words' && <WordList />}
          {activeTab === 'add' && (
            <>
              <WordForm onSaved={() => setActiveTab('words')} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

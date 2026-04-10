import { useState } from 'react';
import type { Word } from '@i-speak-hello/shared';
import { useStreakStore } from '../../stores/streakStore';
import { getXpForNextLevel } from '@i-speak-hello/shared';
import { Confetti } from './Confetti';

export interface QuizResultEntry {
  wordId: string;
  quizType: string;
  wasCorrect: boolean;
}

interface QuizResultProps {
  results: QuizResultEntry[];
  totalXp: number;
  words: Word[];
  onRestart: () => void;
}

export function QuizResult({ results, totalXp, words, onRestart }: QuizResultProps) {
  const { streak, level, totalXp: allTimeXp } = useStreakStore();
  const [showMistakes, setShowMistakes] = useState(false);

  const correctCount = results.filter(r => r.wasCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const xpProgress = getXpForNextLevel(allTimeXp);

  const mistakes = results.filter(r => !r.wasCorrect);
  const mistakeWords = mistakes
    .map(m => words.find(w => w.id === m.wordId))
    .filter((w): w is Word => !!w);

  // Color based on score
  const ringColor = accuracy >= 80 ? 'stroke-green-500' : accuracy >= 50 ? 'stroke-yellow-500' : 'stroke-red-500';
  const ringOffset = 440 - (440 * accuracy / 100);

  return (
    <div className="flex flex-col items-center gap-6 py-8 relative overflow-hidden w-full">
      {/* Confetti for high scores */}
      {accuracy >= 80 && <Confetti />}

      {/* Score Ring */}
      <div className="flex justify-center mb-2 animate-scale-in">
        <div className="relative">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" strokeWidth="8"
              className="stroke-stone-200 dark:stroke-stone-700" />
            <circle cx="80" cy="80" r="70" fill="none" strokeWidth="8"
              className={ringColor}
              strokeDasharray="440"
              strokeDashoffset={ringOffset}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-extrabold text-stone-900 dark:text-white">{accuracy}%</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">Akurasi</p>
          </div>
        </div>
      </div>

      {/* Reaction text */}
      <p className="text-center text-lg font-semibold animate-slide-up" style={{
        color: accuracy >= 80 ? '#16a34a' : accuracy >= 50 ? '#ca8a04' : '#dc2626',
      }}>
        {accuracy >= 80 ? 'Hebat! Terus pertahankan! 🎉' : accuracy >= 50 ? 'Bagus! Terus berlatih!' : 'Jangan menyerah! 💪'}
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        <div className="rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-4 text-center shadow-sm border-l-4 border-green-500 animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <p className="text-2xl font-bold text-green-500">{correctCount}</p>
          <p className="text-xs text-stone-400">Benar</p>
        </div>
        <div className="rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-4 text-center shadow-sm border-l-4 border-red-500 animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <p className="text-2xl font-bold text-red-500">{results.length - correctCount}</p>
          <p className="text-xs text-stone-400">Salah</p>
        </div>
        <div className="rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-4 text-center shadow-sm border-l-4 border-yellow-600 animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">+{totalXp}</p>
          <p className="text-xs text-stone-400">XP</p>
        </div>
      </div>

      {/* Streak Milestone Banner */}
      {streak > 0 && [3, 7, 14, 30, 60, 100].includes(streak) && (
        <div className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-yellow-600 to-yellow-500 p-5 text-white shadow-lg shadow-yellow-600/20 animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-lg font-bold">{streak} Hari Berturut-turut!</p>
              <p className="text-sm text-yellow-100">Streak terpanjangmu. Terus semangat!</p>
            </div>
          </div>
        </div>
      )}

      {/* View Mistakes */}
      {mistakeWords.length > 0 && (
        <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
          <button
            onClick={() => setShowMistakes(prev => !prev)}
            className="flex w-full items-center justify-between rounded-2xl bg-red-50 dark:bg-red-950/20 ring-1 ring-red-200 dark:ring-red-800 px-5 py-3.5 text-sm font-medium text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-950/30"
          >
            <span>Lihat kesalahan ({mistakeWords.length})</span>
            <svg className={`w-4 h-4 transition-transform ${showMistakes ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showMistakes && (
            <div className="mt-2 space-y-2">
              {mistakeWords.map(word => (
                <div
                  key={word.id}
                  className="flex items-center justify-between rounded-xl border-l-4 border-red-400 bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white">{word.original}</p>
                    {word.pinyin && (
                      <p className="text-xs text-stone-400">{word.pinyin}</p>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 dark:text-stone-400">{word.translation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Streak & Level */}
      <div className="flex gap-8 text-center">
        <div>
          <p className="text-3xl mb-1">🔥</p>
          <p className="text-xl font-bold text-orange-500">{streak} hari</p>
          <p className="text-xs text-stone-400">Streak</p>
        </div>
        <div>
          <p className="text-3xl mb-1">⭐</p>
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">Level {level}</p>
          <p className="text-xs text-stone-400">{Math.round(xpProgress.progress * 100)}%</p>
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all"
            style={{ width: `${xpProgress.progress * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-xs text-stone-400">
          {xpProgress.current} / {xpProgress.needed} XP ke level berikutnya
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm">
        <button
          onClick={onRestart}
          className="flex-1 rounded-2xl bg-primary hover:bg-primary-dark py-4 text-lg font-semibold text-white shadow-lg shadow-teal-600/25 hover:shadow-xl transition-all"
        >
          Quiz Lagi
        </button>
        <button className="rounded-2xl border-2 border-stone-200 dark:border-stone-600 px-6 py-4 text-lg font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
          Selesai
        </button>
      </div>
    </div>
  );
}

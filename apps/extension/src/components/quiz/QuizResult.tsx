import type { ReviewLog, Word } from '@i-speak-hello/shared';
import { useStreakStore } from '../../stores/streakStore';
import { getXpForNextLevel } from '@i-speak-hello/shared';

interface QuizResultProps {
  results: ReviewLog[];
  totalXp: number;
  words: Word[];
  onRestart: () => void;
}

export function QuizResult({ results, totalXp, words, onRestart }: QuizResultProps) {
  const { streak, level, totalXp: allTimeXp } = useStreakStore();
  const correctCount = results.filter(r => r.wasCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const xpProgress = getXpForNextLevel(allTimeXp);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Score circle */}
      <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
        <div className="text-center text-white">
          <p className="text-4xl font-bold">{accuracy}%</p>
          <p className="text-sm opacity-80">Akurasi</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <p className="text-2xl font-bold text-green-500">{correctCount}</p>
          <p className="text-xs text-gray-500">Benar</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <p className="text-2xl font-bold text-red-500">{results.length - correctCount}</p>
          <p className="text-xs text-gray-500">Salah</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <p className="text-2xl font-bold text-primary">+{totalXp}</p>
          <p className="text-xs text-gray-500">XP</p>
        </div>
      </div>

      {/* Streak & Level */}
      <div className="flex gap-6 text-center">
        <div>
          <p className="text-3xl">🔥</p>
          <p className="text-lg font-bold text-orange-500">{streak} hari</p>
          <p className="text-xs text-gray-500">Streak</p>
        </div>
        <div>
          <p className="text-3xl">⭐</p>
          <p className="text-lg font-bold text-purple-500">Level {level}</p>
          <p className="text-xs text-gray-500">{Math.round(xpProgress.progress * 100)}%</p>
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
            style={{ width: `${xpProgress.progress * 100}%` }}
          />
        </div>
        <p className="mt-1 text-center text-xs text-gray-400">
          {xpProgress.current} / {xpProgress.needed} XP ke level berikutnya
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark transition-colors"
        >
          Quiz Lagi
        </button>
      </div>
    </div>
  );
}

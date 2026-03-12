import { useState } from 'react';
import type { Word } from '@i-speak-hello/shared';
import { useStreakStore } from '../../stores/streakStore';
import { getXpForNextLevel } from '@i-speak-hello/shared';

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

      {/* View Mistakes */}
      {mistakeWords.length > 0 && (
        <div className="w-full max-w-sm">
          <button
            onClick={() => setShowMistakes(prev => !prev)}
            className="flex w-full items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            <span>📝 Lihat kesalahan ({mistakeWords.length})</span>
            <span className="text-lg">{showMistakes ? '▲' : '▼'}</span>
          </button>
          {showMistakes && (
            <div className="mt-2 space-y-2">
              {mistakeWords.map(word => (
                <div
                  key={word.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-white px-4 py-3 dark:border-red-800 dark:bg-gray-800"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{word.original}</p>
                    {word.pinyin && (
                      <p className="text-xs text-gray-400">{word.pinyin}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{word.translation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

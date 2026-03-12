import { useState } from 'react';
import type { Word } from '@i-speak-hello/shared';
import { LANGUAGES, getSRSStatus } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { SpeakButton } from '../quiz/SpeakButton';
import { cn } from '../../lib/cn';

interface WordCardProps {
  word: Word;
  onDelete?: (id: string) => void;
  onRefresh?: (word: Word) => Promise<void>;
  isConfirming?: boolean;
  isDeleting?: boolean;
}

const STATUS_STYLES = {
  new: { label: 'Baru', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  learning: { label: 'Belajar', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  mastered: { label: 'Lancar', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

export function WordCard({ word, onDelete, onRefresh, isConfirming, isDeleting }: WordCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const status = getSRSStatus(word);
  const statusStyle = STATUS_STYLES[status];
  const langInfo = LANGUAGES[word.targetLanguage];
  const nextReview = new Date(word.nextReviewAt);
  const isDue = word.nextReviewAt <= Date.now();

  return (
    <div className={cn(
      'rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
      isDeleting && 'opacity-40 pointer-events-none scale-95'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Language flag & status */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm">{langInfo.flag}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusStyle.color)}>
              {statusStyle.label}
            </span>
            {isDue && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                Perlu review
              </span>
            )}
          </div>

          {/* Word */}
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{word.original}</p>
            <SpeakButton text={word.original} language={word.targetLanguage} />
          </div>

          {/* Pinyin */}
          {word.pinyin && (
            <PinyinDisplay pinyin={word.pinyin} className="text-sm" />
          )}

          {/* Translation */}
          <p className="mt-1 text-gray-600 dark:text-gray-300">
            🇮🇩 {word.translation}
          </p>

          {/* Sentences */}
          {word.sentences.length > 0 && (
            <div className="mt-2 space-y-1">
              {word.sentences.slice(0, 2).map(s => (
                <div key={s.id} className="rounded bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-700">
                  <p className="text-gray-700 dark:text-gray-200">{s.sentence}</p>
                  {/* Show sentence pinyin for zh */}
                  {s.pinyin && (
                    <p className="text-xs text-indigo-500 dark:text-indigo-300">{s.pinyin}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">{s.translation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {word.notes && (
            <p className="mt-2 text-xs italic text-gray-400 dark:text-gray-500">📝 {word.notes}</p>
          )}

          {/* Next review */}
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {isDue
              ? 'Siap untuk review'
              : `Review berikutnya: ${nextReview.toLocaleDateString('id-ID')}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="ml-2 flex flex-col gap-1">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={async () => {
                setRefreshing(true);
                try {
                  await onRefresh(word);
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className={cn(
                'rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors',
                refreshing && 'animate-spin'
              )}
              title="Refresh kalimat AI"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            isConfirming ? (
              <button
                onClick={() => onDelete(word.id)}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors animate-pulse"
                title="Klik lagi untuk hapus"
              >
                Hapus?
              </button>
            ) : (
              <button
                onClick={() => onDelete(word.id)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                title="Hapus kata"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

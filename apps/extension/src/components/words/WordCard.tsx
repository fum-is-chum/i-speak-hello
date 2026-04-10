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

const BORDER_COLORS = {
  new: 'border-l-teal-600',
  learning: 'border-l-amber-500',
  mastered: 'border-l-green-500',
};

const RING_COLORS = {
  new: 'stroke-teal-600',
  learning: 'stroke-amber-500',
  mastered: 'stroke-green-500',
};

export function WordCard({ word, onDelete, onRefresh, isConfirming, isDeleting }: WordCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [showSentences, setShowSentences] = useState(false);
  const status = getSRSStatus(word);
  const langInfo = LANGUAGES[word.targetLanguage];
  const isDue = word.nextReviewAt <= Date.now() && word.repetitions > 0;

  // SRS ring progress
  const circumference = 100.5; // 2 * PI * 16
  let ringProgress = 0;
  if (status === 'learning') ringProgress = Math.min(word.repetitions / 5, 1);
  else if (status === 'mastered') ringProgress = 1;
  const ringOffset = circumference * (1 - ringProgress);

  // Format interval to fit inside the 40px ring
  let intervalLabel = 'new';
  if (status !== 'new') {
    const days = word.intervalDays;
    if (days >= 365) intervalLabel = `✓`;
    else if (days >= 30) intervalLabel = `${Math.round(days / 30)}mo`;
    else intervalLabel = `${days}d`;
  }

  return (
    <div className={cn(
      'group rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 shadow-sm border-l-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md relative',
      BORDER_COLORS[status],
      isDeleting && 'opacity-40 pointer-events-none scale-95',
    )}>
      {/* Due indicator */}
      {isDue && (
        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
      )}

      <div className="flex items-start gap-4">
        {/* SRS Progress Ring */}
        <div className="shrink-0 relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" strokeWidth="3"
              className="stroke-stone-200 dark:stroke-stone-700" />
            <circle cx="20" cy="20" r="16" fill="none" strokeWidth="3"
              className={RING_COLORS[status]}
              strokeDasharray={circumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round" />
          </svg>
          <span className={cn(
            'absolute inset-0 flex items-center justify-center text-[9px] font-bold',
            status === 'mastered' ? 'text-green-600 dark:text-green-400' : 'text-stone-500 dark:text-stone-400',
          )}>
            {intervalLabel}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xl font-bold text-stone-900 dark:text-white">{word.original}</p>
            <span className="text-xs text-stone-400">{langInfo.flag}</span>
            <SpeakButton
              text={word.original}
              language={word.targetLanguage}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Pinyin */}
          {word.pinyin && (
            <PinyinDisplay pinyin={word.pinyin} className="text-sm mb-1" />
          )}

          {/* Translation */}
          <p className="text-base text-stone-500 dark:text-stone-400">{word.translation}</p>

          {/* Collapsible sentences */}
          {word.sentences.length > 0 && (
            <>
              <button
                onClick={() => setShowSentences(prev => !prev)}
                className="mt-2 text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                {showSentences ? 'Sembunyikan contoh' : `Lihat contoh (${word.sentences.length})`}
              </button>
              {showSentences && (
                <div className="mt-2 space-y-1.5">
                  {word.sentences.map(s => (
                    <div key={s.id} className="rounded-lg bg-surface-2 px-3 py-2 text-sm">
                      <p className="text-stone-700 dark:text-stone-200">{s.sentence}</p>
                      {s.pinyin && (
                        <p className="text-xs text-teal-500 dark:text-teal-400">{s.pinyin}</p>
                      )}
                      <p className="text-xs text-stone-400">{s.translation}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Notes */}
          {word.notes && (
            <p className="mt-2 text-xs italic text-stone-400">📝 {word.notes}</p>
          )}
        </div>

        {/* Action buttons (hover-visible) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRefresh && (
            <button
              onClick={async () => {
                setRefreshing(true);
                try { await onRefresh(word); } finally { setRefreshing(false); }
              }}
              disabled={refreshing}
              className={cn(
                'rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors',
                refreshing && 'animate-spin',
              )}
              title="Refresh kalimat AI"
            >
              <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          {onDelete && (
            isConfirming ? (
              <button
                onClick={() => onDelete(word.id)}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors animate-pulse"
              >
                Hapus?
              </button>
            ) : (
              <button
                onClick={() => onDelete(word.id)}
                className="rounded-lg p-2 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Hapus kata"
              >
                <svg className="w-4 h-4 text-stone-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

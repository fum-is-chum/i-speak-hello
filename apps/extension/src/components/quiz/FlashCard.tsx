import { useState } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { SpeakButton } from './SpeakButton';
import { useAutoSpeak } from '../../hooks/useAutoSpeak';
import { cn } from '../../lib/cn';

interface FlashCardProps {
  question: QuizQuestion;
  onAnswer: (quality: number) => void;
  autoSpeak?: boolean;
}

export function FlashCard({ question, onAnswer, autoSpeak }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const { word } = question;
  const langInfo = LANGUAGES[word.targetLanguage];

  useAutoSpeak(word.original, word.targetLanguage, autoSpeak);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        className="w-full max-w-md cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        <div
          className={cn(
            'relative h-56 w-full transition-transform duration-500 sm:h-64',
            flipped && '[transform:rotateY(180deg)]'
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-8 shadow-xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="mb-2 text-sm text-stone-400">{langInfo.flag} {langInfo.nativeName}</span>
            <p className="text-4xl font-bold text-stone-900 dark:text-white">{word.original}</p>
            {word.pinyin && (
              <PinyinDisplay pinyin={word.pinyin} className="mt-2 text-lg" hidden forceReveal={flipped} />
            )}
            <SpeakButton text={word.original} language={word.targetLanguage} className="mt-4" />
            <p className="mt-4 text-sm text-stone-400">Klik untuk membuka jawaban</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 p-8 text-white shadow-xl shadow-teal-500/20 [transform:rotateY(180deg)]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="mb-2 text-sm text-teal-200">🇮🇩 Bahasa Indonesia</span>
            <p className="text-3xl font-bold">{word.translation}</p>
            {word.sentences.length > 0 && (
              <div className="mt-4 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-3 text-center">
                <p className="text-sm italic">"{word.sentences[0].sentence}"</p>
                {word.sentences[0].pinyin && (
                  <p className="mt-0.5 text-xs text-teal-200 italic">{word.sentences[0].pinyin}</p>
                )}
                <p className="mt-1 text-xs text-teal-200">{word.sentences[0].translation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons (only show when flipped) */}
      {flipped && (
        <div className="w-full max-w-md rounded-2xl bg-surface-1 backdrop-blur-md p-5 shadow-lg ring-1 ring-stone-900/5 dark:ring-white/5 animate-slide-up">
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center mb-4">Seberapa mudah kamu mengingat?</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { quality: 1, label: 'Lupa', emoji: '😵', border: 'border-red-600', bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-300' },
              { quality: 3, label: 'Sulit', emoji: '😅', border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-300' },
              { quality: 4, label: 'Ragu', emoji: '🤔', border: 'border-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-300' },
              { quality: 5, label: 'Mudah', emoji: '😎', border: 'border-green-600', bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-300' },
            ].map(btn => (
              <button
                key={btn.quality}
                onClick={(e) => { e.stopPropagation(); onAnswer(btn.quality); }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-l-4 px-5 py-3.5 text-sm font-semibold transition-colors',
                  btn.border, btn.bg, btn.text,
                )}
              >
                <span>{btn.emoji}</span> {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

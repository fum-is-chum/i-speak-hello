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
        className="perspective-1000 w-full max-w-sm cursor-pointer"
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
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="mb-2 text-sm text-gray-400">{langInfo.flag} {langInfo.nativeName}</span>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{word.original}</p>
            {word.pinyin && (
              <PinyinDisplay pinyin={word.pinyin} className="mt-2 text-lg" hidden forceReveal={flipped} />
            )}
            <SpeakButton text={word.original} language={word.targetLanguage} className="mt-4" />
            <p className="mt-4 text-sm text-gray-400">Klik untuk membuka jawaban</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-lg [transform:rotateY(180deg)]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="mb-2 text-sm text-indigo-200">🇮🇩 Bahasa Indonesia</span>
            <p className="text-3xl font-bold">{word.translation}</p>
            {word.sentences.length > 0 && (
              <div className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-center">
                <p className="text-sm italic">"{word.sentences[0].sentence}"</p>
                {/* Show sentence pinyin for Mandarin */}
                {word.sentences[0].pinyin && (
                  <p className="mt-0.5 text-xs text-indigo-200 italic">{word.sentences[0].pinyin}</p>
                )}
                <p className="mt-1 text-xs text-indigo-200">{word.sentences[0].translation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons (only show when flipped) */}
      {flipped && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Seberapa mudah kamu mengingat?</p>
          <div className="flex gap-2">
            {[
              { quality: 1, label: 'Lupa 😵', color: 'bg-red-500 hover:bg-red-600' },
              { quality: 3, label: 'Sulit 😅', color: 'bg-orange-500 hover:bg-orange-600' },
              { quality: 4, label: 'Ragu 🤔', color: 'bg-yellow-500 hover:bg-yellow-600' },
              { quality: 5, label: 'Mudah 😎', color: 'bg-green-500 hover:bg-green-600' },
            ].map(btn => (
              <button
                key={btn.quality}
                onClick={(e) => { e.stopPropagation(); onAnswer(btn.quality); }}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                  btn.color
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

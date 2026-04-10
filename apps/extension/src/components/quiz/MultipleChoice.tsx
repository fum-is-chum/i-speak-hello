import { useState } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { SpeakButton } from './SpeakButton';
import { HintReveal } from './HintReveal';
import { useAutoSpeak } from '../../hooks/useAutoSpeak';
import { cn } from '../../lib/cn';

interface MultipleChoiceProps {
  question: QuizQuestion;
  onAnswer: (quality: number) => void;
  autoSpeak?: boolean;
}

export function MultipleChoice({ question, onAnswer, autoSpeak }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const { word, options = [], hint, sentencePinyin } = question;
  const langInfo = LANGUAGES[word.targetLanguage];

  useAutoSpeak(word.original, word.targetLanguage, autoSpeak);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(option);
    setAnswered(true);

    const isCorrect = option === word.translation;
    setTimeout(() => {
      onAnswer(isCorrect ? 4 : 1);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Question Card */}
      <div className="w-full rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-6 sm:p-8 text-center shadow-xl animate-scale-in">
        <span className="text-xs text-stone-400">{langInfo.flag} Apa arti kata ini?</span>
        <p className="mt-2 text-4xl font-bold tracking-tight text-stone-900 dark:text-white">{word.original}</p>
        {word.pinyin && (
          <PinyinDisplay pinyin={word.pinyin} className="mt-2 text-lg" hidden forceReveal={answered} />
        )}
        <SpeakButton text={word.original} language={word.targetLanguage} className="mt-4" />

        {(sentencePinyin || hint) && (
          <HintReveal forceReveal={answered} className="mt-3">
            {sentencePinyin && word.targetLanguage === 'zh' && (
              <PinyinDisplay pinyin={sentencePinyin} className="text-sm mb-1" />
            )}
            {hint && (
              <p className="text-sm text-stone-400">
                💡 Petunjuk: {hint}
              </p>
            )}
          </HintReveal>
        )}
      </div>

      {/* Options */}
      <div className="w-full space-y-3">
        {options.map((option, i) => {
          const isCorrect = option === word.translation;
          const isSelected = option === selected;
          const letter = String.fromCharCode(65 + i);

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border-2 px-5 py-3.5 text-left transition-all',
                // Default
                !answered && 'border-stone-200 dark:border-stone-600 hover:border-teal-400 dark:hover:border-teal-500',
                // Correct
                answered && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg shadow-green-500/10 scale-[1.02]',
                // Wrong selected
                answered && isSelected && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-950/20 animate-shake',
                // Other (not selected, not correct)
                answered && !isCorrect && !isSelected && 'border-stone-200 dark:border-stone-700 opacity-50',
              )}
            >
              <span className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                answered && isCorrect
                  ? 'bg-green-600 text-white'
                  : answered && isSelected && !isCorrect
                    ? 'bg-red-500 text-white'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400',
              )}>
                {letter}
              </span>
              <span className={cn(
                'text-base',
                answered && isCorrect && 'font-medium text-green-700 dark:text-green-300',
                answered && isSelected && !isCorrect && 'font-medium text-red-700 dark:text-red-300',
                !answered && 'text-stone-700 dark:text-stone-200',
                answered && !isCorrect && !isSelected && 'text-stone-500 dark:text-stone-400',
              )}>
                {option}
              </span>
              {answered && isCorrect && (
                <svg className="w-5 h-5 ml-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {answered && isSelected && !isCorrect && (
                <svg className="w-5 h-5 ml-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

    // Auto-proceed after delay
    setTimeout(() => {
      onAnswer(isCorrect ? 4 : 1);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Question */}
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <span className="text-sm text-gray-400">{langInfo.flag} Apa arti kata ini?</span>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">{word.original}</p>
        {word.pinyin && (
          <PinyinDisplay pinyin={word.pinyin} className="mt-2 text-lg" hidden forceReveal={answered} />
        )}
        <SpeakButton text={word.original} language={word.targetLanguage} className="mt-3" />

        {/* Sentence pinyin + Indonesian hint — blurred by default */}
        {(sentencePinyin || hint) && (
          <HintReveal forceReveal={answered} className="mt-3">
            {sentencePinyin && word.targetLanguage === 'zh' && (
              <PinyinDisplay pinyin={sentencePinyin} className="text-sm mb-1" />
            )}
            {hint && (
              <p className="text-sm text-gray-400">
                💡 Petunjuk: {hint}
              </p>
            )}
          </HintReveal>
        )}
      </div>

      {/* Options */}
      <div className="grid w-full max-w-md grid-cols-1 gap-3">
        {options.map((option, i) => {
          const isCorrect = option === word.translation;
          const isSelected = option === selected;

          let style = 'border-gray-200 bg-white hover:border-primary hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-indigo-900/30 dark:hover:border-indigo-500';
          if (answered) {
            if (isCorrect) {
              style = 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500';
            } else if (isSelected && !isCorrect) {
              style = 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500';
            } else {
              style = 'border-gray-200 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-800';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={cn(
                'rounded-xl border-2 px-6 py-4 text-left text-lg font-medium transition-all dark:text-gray-200',
                style
              )}
            >
              <span className="mr-3 text-gray-400">{String.fromCharCode(65 + i)}.</span>
              {option}
              {answered && isCorrect && <span className="ml-2">✓</span>}
              {answered && isSelected && !isCorrect && <span className="ml-2">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

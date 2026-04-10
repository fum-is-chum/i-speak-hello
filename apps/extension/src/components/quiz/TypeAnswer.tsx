import { useState } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { SpeakButton } from './SpeakButton';
import { HintReveal } from './HintReveal';
import { QuizInput } from './QuizInput';
import { ResultFeedback } from './ResultFeedback';
import { isAnswerClose } from '../../lib/quiz-engine';
import { useAutoSpeak } from '../../hooks/useAutoSpeak';
import { cn } from '../../lib/cn';

interface TypeAnswerProps {
  question: QuizQuestion;
  onAnswer: (quality: number) => void;
  autoSpeak?: boolean;
}

export function TypeAnswer({ question, onAnswer, autoSpeak }: TypeAnswerProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { word, hint, sentencePinyin } = question;
  const langInfo = LANGUAGES[word.targetLanguage];

  useAutoSpeak(word.original, word.targetLanguage, autoSpeak);

  const handleSubmit = () => {
    const correct = isAnswerClose(input, word.translation, word.acceptedAnswers);
    setIsCorrect(correct);
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(correct ? 4 : 1);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Question Card */}
      <div className={cn(
        'w-full rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-6 sm:p-8 shadow-xl',
        submitted && !isCorrect && 'animate-shake',
      )}>
        <div className="text-center mb-3">
          <p className="text-xs text-stone-400 mb-2">{langInfo.flag} Tulis artinya dalam Bahasa Indonesia</p>
          <p className="text-4xl font-bold tracking-tight text-stone-900 dark:text-white mb-3">{word.original}</p>
          {word.pinyin && (
            <PinyinDisplay pinyin={word.pinyin} className="text-sm" hidden forceReveal={submitted} />
          )}
        </div>

        <div className="flex justify-center my-5">
          <SpeakButton text={word.original} language={word.targetLanguage} />
        </div>

        {/* Hint sentence */}
        {(sentencePinyin || hint) && (
          <HintReveal forceReveal={submitted} className="mb-6">
            <div className="rounded-xl bg-surface-2 px-4 py-3 text-center">
              {sentencePinyin && word.targetLanguage === 'zh' && (
                <PinyinDisplay pinyin={sentencePinyin} className="text-sm mb-1" />
              )}
              {hint && (
                <p className="text-sm text-stone-500 dark:text-stone-400 italic">
                  💡 {hint}
                </p>
              )}
            </div>
          </HintReveal>
        )}

        {/* Input */}
        <QuizInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          submitted={submitted}
          isCorrect={isCorrect}
          placeholder="Ketik terjemahan dalam Bahasa Indonesia..."
        />

        {submitted && (
          <ResultFeedback
            isCorrect={isCorrect}
            correctAnswer={word.translation}
            acceptedAnswers={word.acceptedAnswers}
            userAnswer={!isCorrect ? input : undefined}
          />
        )}
      </div>

      {/* XP Float */}
      {submitted && isCorrect && (
        <div className="relative flex justify-center">
          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400 animate-float-up">+15 XP</span>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { HintReveal } from './HintReveal';
import { QuizInput } from './QuizInput';
import { ResultFeedback } from './ResultFeedback';
import { isAnswerClose } from '../../lib/quiz-engine';
import { useAutoSpeak } from '../../hooks/useAutoSpeak';
import { cn } from '../../lib/cn';

interface SentenceCompletionProps {
  question: QuizQuestion;
  onAnswer: (quality: number) => void;
  autoSpeak?: boolean;
}

export function SentenceCompletion({ question, onAnswer, autoSpeak }: SentenceCompletionProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const { word, sentenceTemplate, sentenceAnswer, sentencePinyin, hint } = question;
  const langInfo = LANGUAGES[word.targetLanguage];

  useAutoSpeak(word.original, word.targetLanguage, autoSpeak);

  const answer = sentenceAnswer ?? word.original;

  const handleSubmit = () => {
    const correct = isAnswerClose(input, answer);
    setIsCorrect(correct);
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(correct ? 5 : 1);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Question Card */}
      <div className={cn(
        'w-full rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-6 sm:p-8 shadow-xl',
        submitted && !isCorrect && 'animate-shake',
      )}>
        <div className="text-center mb-6">
          <span className="text-xs text-stone-400">{langInfo.flag} Lengkapi kalimat berikut</span>

          {/* Sentence with blank */}
          <p className="mt-4 text-2xl font-bold leading-relaxed text-stone-900 dark:text-white">
            {sentenceTemplate?.split('______').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  submitted ? (
                    <span className={cn(
                      'inline-block mx-1 px-4 py-1 rounded-lg border-2 font-bold',
                      isCorrect
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-500 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-700 dark:text-red-300'
                    )}>
                      {answer}
                    </span>
                  ) : (
                    <span className="inline-block mx-1 px-4 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/40 border-2 border-dashed border-teal-400 dark:border-teal-500 text-teal-500 animate-pulse-blank min-w-[80px]">
                      ______
                    </span>
                  )
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Sentence pinyin (Mandarin only) */}
        {sentencePinyin && word.targetLanguage === 'zh' && (
          <PinyinDisplay pinyin={sentencePinyin} className="text-center text-sm mb-4" hidden forceReveal={submitted} />
        )}

        {/* Hint (Indonesian translation) */}
        {hint && (
          <HintReveal forceReveal={submitted} className="mb-6">
            <div className="rounded-xl bg-surface-2 px-4 py-3 text-center">
              <p className="text-xs text-stone-400 mb-1">🇮🇩 Terjemahan:</p>
              <p className="text-sm text-stone-500 dark:text-stone-400 italic">"{hint}"</p>
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
          placeholder="Ketik kata yang hilang..."
          center
        />

        {submitted && (
          <ResultFeedback
            isCorrect={isCorrect}
            correctAnswer={answer}
            incorrectLabel="Kurang tepat"
            correctAnswerLabel="Jawaban"
            userAnswer={!isCorrect ? input : undefined}
          />
        )}
      </div>

      {/* XP Float */}
      {submitted && isCorrect && (
        <div className="relative flex justify-center">
          <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400 animate-float-up">+20 XP</span>
        </div>
      )}
    </div>
  );
}

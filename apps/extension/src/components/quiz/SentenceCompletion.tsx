import { useState } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { HintReveal } from './HintReveal';
import { QuizInput } from './QuizInput';
import { ResultFeedback } from './ResultFeedback';
import { isAnswerClose } from '../../lib/quiz-engine';
import { useAutoSpeak } from '../../hooks/useAutoSpeak';

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
      {/* Question */}
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <span className="text-sm text-gray-400">{langInfo.flag} Lengkapi kalimat berikut</span>

        {/* Sentence with blank */}
        <p className="mt-4 text-2xl font-medium text-gray-900 dark:text-white">
          {sentenceTemplate?.split('______').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="mx-1 inline-block min-w-[80px] border-b-2 border-dashed border-primary px-2 text-primary">
                  {submitted ? answer : '?'}
                </span>
              )}
            </span>
          ))}
        </p>

        {/* Sentence pinyin (Mandarin only) — blurred by default, auto-reveals after submission */}
        {sentencePinyin && word.targetLanguage === 'zh' && (
          <PinyinDisplay pinyin={sentencePinyin} className="mt-2 text-base" hidden forceReveal={submitted} />
        )}

        {/* Hint (Indonesian translation) — blurred by default */}
        {hint && (
          <HintReveal forceReveal={submitted} className="mt-3">
            <p className="text-sm text-gray-400">
              💡 Petunjuk: {hint}
            </p>
          </HintReveal>
        )}
      </div>

      {/* Input */}
      <QuizInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        submitted={submitted}
        isCorrect={isCorrect}
        placeholder="Ketik kata yang hilang..."
      />

      {submitted && (
        <ResultFeedback
          isCorrect={isCorrect}
          correctAnswer={answer}
          incorrectLabel="Kurang tepat"
          correctAnswerLabel="Jawaban"
        />
      )}
    </div>
  );
}

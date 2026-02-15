import { useState, useRef, useEffect } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { isAnswerClose } from '../../lib/quiz-engine';
import { speak } from '../../lib/audio';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { word, sentenceTemplate, sentenceAnswer, sentencePinyin, hint } = question;
  const langInfo = LANGUAGES[word.targetLanguage];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-speak on mount
  useEffect(() => {
    if (autoSpeak) {
      speak(word.original, word.targetLanguage);
    }
  }, [autoSpeak, word.original, word.targetLanguage]);

  const answer = sentenceAnswer ?? word.original;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitted) return;

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

        {/* Show sentence pinyin after submission (for zh words) */}
        {submitted && sentencePinyin && word.targetLanguage === 'zh' && (
          <PinyinDisplay pinyin={sentencePinyin} className="mt-2 text-base" />
        )}

        {/* Hint (Indonesian translation) */}
        {hint && (
          <p className="mt-3 text-sm text-gray-400">
            💡 Petunjuk: {hint}
          </p>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={submitted}
            placeholder="Ketik kata yang hilang..."
            className={cn(
              'w-full rounded-xl border-2 px-6 py-4 text-lg outline-none transition-colors',
              !submitted && 'border-gray-200 focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white',
              submitted && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:text-green-300',
              submitted && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-900/30 dark:text-red-300'
            )}
          />
          {!submitted && (
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
            >
              Cek
            </button>
          )}
        </div>

        {submitted && (
          <div className={cn(
            'mt-3 rounded-lg p-4 text-center',
            isCorrect
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          )}>
            {isCorrect ? (
              <p className="font-medium">✓ Benar! 🎉</p>
            ) : (
              <div>
                <p className="font-medium">✗ Kurang tepat</p>
                <p className="mt-1">
                  Jawaban: <strong>{answer}</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

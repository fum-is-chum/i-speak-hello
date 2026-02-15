import { useState, useRef, useEffect } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { LANGUAGES } from '@i-speak-hello/shared';
import { PinyinDisplay } from '../mandarin/PinyinDisplay';
import { SpeakButton } from './SpeakButton';
import { isAnswerClose } from '../../lib/quiz-engine';
import { speak } from '../../lib/audio';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const { word } = question;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitted) return;

    const correct = isAnswerClose(input, word.translation, word.acceptedAnswers);
    setIsCorrect(correct);
    setSubmitted(true);

    setTimeout(() => {
      onAnswer(correct ? 4 : 1);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Question */}
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <span className="text-sm text-gray-400">{langInfo.flag} Tulis artinya dalam Bahasa Indonesia</span>
        <p className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">{word.original}</p>
        {word.pinyin && (
          <PinyinDisplay pinyin={word.pinyin} className="mt-2 text-lg" />
        )}
        <SpeakButton text={word.original} language={word.targetLanguage} className="mt-3" />
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
            placeholder="Ketik jawaban di sini..."
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
                <p className="font-medium">✗ Salah</p>
                <p className="mt-1">
                  Jawaban yang benar: <strong>{word.translation}</strong>
                </p>
                {word.acceptedAnswers && word.acceptedAnswers.length > 0 && (
                  <p className="mt-1 text-sm opacity-80">
                    (juga diterima: {word.acceptedAnswers.join(', ')})
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion } from '@i-speak-hello/shared';
import { buildQuizSession } from '../../lib/quiz-engine';
import { recordQuizAnswer } from '../../lib/quiz-helpers';
import { useWordStore } from '../../stores/wordStore';
import { useStreakStore } from '../../stores/streakStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { FlashCard } from './FlashCard';
import { MultipleChoice } from './MultipleChoice';
import { TypeAnswer } from './TypeAnswer';
import { SentenceCompletion } from './SentenceCompletion';
import { QuizResult } from './QuizResult';
import { cn } from '../../lib/cn';

interface QuizContainerProps {
  onGoToWords?: () => void;
  onFinish?: () => void;
}

export function QuizContainer({ onGoToWords, onFinish }: QuizContainerProps = {}) {
  const { words, loadWords } = useWordStore();
  const { loadStreak } = useStreakStore();
  const { settings } = useSettingsStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ wordId: string; quizType: string; wasCorrect: boolean }[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const autoSpeak = settings.autoSpeakOnQuiz;

  useEffect(() => {
    const session = buildQuizSession(
      words,
      settings.quizTypes,
      settings.wordsPerSession,
      settings.newWordRatio,
      settings.difficultyBias,
    );
    setQuestions(session);
    setStartTime(Date.now());
  }, [words, settings.quizTypes, settings.wordsPerSession, settings.newWordRatio, settings.difficultyBias]);

  const handleAnswer = useCallback(async (quality: number) => {
    const question = questions[currentIndex];
    if (!question) return;

    const { word, quizType } = question;
    const responseTimeMs = Date.now() - startTime;

    const { xp, wasCorrect } = await recordQuizAnswer(word, quality, quizType, responseTimeMs);

    await loadWords();
    await loadStreak();

    setResults(prev => [...prev, { wordId: word.id, quizType, wasCorrect }]);
    setTotalXp(prev => prev + xp);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setStartTime(Date.now());
    } else {
      setFinished(true);
    }
  }, [questions, currentIndex, startTime, loadWords, loadStreak]);

  if (questions.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-4 text-xl font-semibold text-stone-700 dark:text-stone-200">
          Semua kata sudah di-review!
        </h2>
        <p className="mt-2 text-stone-500 dark:text-stone-400">
          Kembali lagi nanti untuk review selanjutnya.
        </p>
        {onGoToWords && (
          <button
            onClick={onGoToWords}
            className="mt-6 rounded-2xl border-2 border-stone-200 dark:border-stone-600 px-6 py-3 font-medium text-stone-700 dark:text-stone-200 hover:border-teal-400 dark:hover:border-teal-500 transition-colors"
          >
            📚 Lihat Kata Saya
          </button>
        )}
      </div>
    );
  }

  if (finished) {
    return (
      <QuizResult
        results={results}
        totalXp={totalXp}
        words={words}
        onFinish={onFinish}
        onRestart={() => {
          const session = buildQuizSession(
            words,
            settings.quizTypes,
            settings.wordsPerSession,
            settings.newWordRatio,
            settings.difficultyBias,
          );
          setQuestions(session);
          setCurrentIndex(0);
          setResults([]);
          setTotalXp(0);
          setFinished(false);
          setStartTime(Date.now());
        }}
      />
    );
  }

  const question = questions[currentIndex];

  return (
    <div className="w-full">
      {/* Step Dots Progress */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {questions.map((_, i) => {
          const result = results[i];
          const isCurrent = i === currentIndex;
          return (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all',
                isCurrent
                  ? 'w-3 h-3 bg-teal-600 ring-4 ring-teal-500/20 animate-pulse-glow'
                  : 'w-2.5 h-2.5',
                !isCurrent && result?.wasCorrect === true && 'bg-green-500',
                !isCurrent && result?.wasCorrect === false && 'bg-red-500',
                !isCurrent && result === undefined && 'bg-stone-300 dark:bg-stone-600',
              )}
            />
          );
        })}
      </div>
      <p className="text-center text-xs text-stone-400 mb-4">
        {currentIndex + 1} / {questions.length}
      </p>

      {/* Quiz type badge */}
      <div className="mb-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-950/30 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-400">
          {question.quizType === 'flashcard' && '🃏 Flashcard'}
          {question.quizType === 'mcq' && '📝 Pilihan Ganda'}
          {question.quizType === 'typing' && '⌨️ Ketik Jawaban'}
          {question.quizType === 'sentence' && '📖 Lengkapi Kalimat'}
        </span>
      </div>

      {/* Render quiz type */}
      {question.quizType === 'flashcard' && (
        <FlashCard key={question.word.id} question={question} onAnswer={handleAnswer} autoSpeak={autoSpeak} />
      )}
      {question.quizType === 'mcq' && (
        <MultipleChoice key={question.word.id} question={question} onAnswer={handleAnswer} autoSpeak={autoSpeak} />
      )}
      {question.quizType === 'typing' && (
        <TypeAnswer key={question.word.id} question={question} onAnswer={handleAnswer} autoSpeak={autoSpeak} />
      )}
      {question.quizType === 'sentence' && (
        <SentenceCompletion key={question.word.id} question={question} onAnswer={handleAnswer} autoSpeak={autoSpeak} />
      )}
    </div>
  );
}

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

interface QuizContainerProps {
  onGoToWords?: () => void;
}

export function QuizContainer({ onGoToWords }: QuizContainerProps = {}) {
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

    // Use shared helper: SRS update + review log + streak
    const { xp, wasCorrect } = await recordQuizAnswer(word, quality, quizType, responseTimeMs);

    // Refresh Zustand stores so UI reflects updated data
    await loadWords();
    await loadStreak();

    setResults(prev => [...prev, { wordId: word.id, quizType, wasCorrect }]);
    setTotalXp(prev => prev + xp);

    // Next question or finish
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
        <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
          Semua kata sudah di-review!
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Kembali lagi nanti untuk review selanjutnya.
        </p>
        {onGoToWords && (
          <button
            onClick={onGoToWords}
            className="mt-6 rounded-lg border-2 border-primary px-6 py-3 font-medium text-primary hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
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
    <div>
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Quiz type badge */}
      <div className="mb-4 flex justify-center">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
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

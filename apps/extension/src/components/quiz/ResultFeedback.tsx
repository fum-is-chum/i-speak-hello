import { cn } from '../../lib/cn';

interface ResultFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  /** Label for incorrect result. Default: "Kurang tepat" */
  incorrectLabel?: string;
  /** Label for the correct answer line. Default: "Jawaban yang benar" */
  correctAnswerLabel?: string;
  acceptedAnswers?: string[];
  /** User's incorrect input */
  userAnswer?: string;
}

/**
 * Shared result feedback box shown after answering a typing/sentence quiz.
 * Shows green correct or red with correct answer.
 */
export function ResultFeedback({
  isCorrect,
  correctAnswer,
  incorrectLabel = 'Kurang tepat',
  correctAnswerLabel = 'Jawaban yang benar',
  acceptedAnswers,
  userAnswer,
}: ResultFeedbackProps) {
  if (isCorrect) {
    return (
      <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 flex items-center gap-3 animate-slide-up">
        <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-green-700 dark:text-green-300">Benar!</p>
          {acceptedAnswers && acceptedAnswers.length > 0 && (
            <p className="text-sm text-green-600/70 dark:text-green-400/70">
              Jawaban diterima: {[correctAnswer, ...acceptedAnswers].join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-red-700 dark:text-red-300">{incorrectLabel}</p>
          {userAnswer && (
            <p className="text-sm text-red-600/70 dark:text-red-400/70">
              Jawabanmu: <span className="line-through">{userAnswer}</span>
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-surface-1 p-3 border border-red-100 dark:border-red-900">
        <p className="text-xs text-stone-400 mb-1">{correctAnswerLabel}:</p>
        <p className="text-base font-semibold text-stone-900 dark:text-white">{correctAnswer}</p>
        {acceptedAnswers && acceptedAnswers.length > 0 && (
          <p className="mt-1 text-sm text-stone-400">
            (juga diterima: {acceptedAnswers.join(', ')})
          </p>
        )}
      </div>
    </div>
  );
}

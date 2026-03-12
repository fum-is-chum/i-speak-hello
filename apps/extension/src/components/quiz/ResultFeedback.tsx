import { cn } from '../../lib/cn';

interface ResultFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  /** Label for incorrect result. Default: "Salah" */
  incorrectLabel?: string;
  /** Label for the correct answer line. Default: "Jawaban yang benar" */
  correctAnswerLabel?: string;
  acceptedAnswers?: string[];
}

/**
 * Shared result feedback box shown after answering a typing/sentence quiz.
 * Shows green "Benar!" or red with correct answer.
 */
export function ResultFeedback({
  isCorrect,
  correctAnswer,
  incorrectLabel = 'Salah',
  correctAnswerLabel = 'Jawaban yang benar',
  acceptedAnswers,
}: ResultFeedbackProps) {
  return (
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
          <p className="font-medium">✗ {incorrectLabel}</p>
          <p className="mt-1">
            {correctAnswerLabel}: <strong>{correctAnswer}</strong>
          </p>
          {acceptedAnswers && acceptedAnswers.length > 0 && (
            <p className="mt-1 text-sm opacity-80">
              (juga diterima: {acceptedAnswers.join(', ')})
            </p>
          )}
        </div>
      )}
    </div>
  );
}

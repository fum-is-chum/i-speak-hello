import { useRef, useEffect } from 'react';
import { cn } from '../../lib/cn';

interface QuizInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitted: boolean;
  isCorrect: boolean;
  placeholder?: string;
  submitLabel?: string;
}

/**
 * Shared quiz text input with submit button.
 * Used by TypeAnswer and SentenceCompletion.
 */
export function QuizInput({
  value,
  onChange,
  onSubmit,
  submitted,
  isCorrect,
  placeholder = 'Ketik jawaban di sini...',
  submitLabel = 'Cek',
}: QuizInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || submitted) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={submitted}
          placeholder={placeholder}
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
            {submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}

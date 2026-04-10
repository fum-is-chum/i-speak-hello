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
  center?: boolean;
}

/**
 * Shared quiz text input with full-width submit button below.
 * Used by TypeAnswer and SentenceCompletion.
 */
export function QuizInput({
  value,
  onChange,
  onSubmit,
  submitted,
  isCorrect,
  placeholder = 'Ketik jawaban di sini...',
  submitLabel = 'Periksa',
  center = false,
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
    <form onSubmit={handleSubmit} className="w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={submitted}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border-2 px-5 py-3.5 text-base outline-none transition-all',
          center && 'text-center font-medium',
          !submitted && 'border-stone-200 dark:border-stone-600 bg-surface-1 text-stone-900 dark:text-white placeholder-stone-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10',
          submitted && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 font-medium',
          submitted && !isCorrect && 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 font-medium line-through'
        )}
      />
      {!submitted && (
        <button
          type="submit"
          className="w-full mt-3 rounded-xl bg-primary hover:bg-primary-dark py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-600/25 hover:shadow-xl transition-all"
        >
          {submitLabel}
        </button>
      )}
    </form>
  );
}

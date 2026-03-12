import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface HintRevealProps {
  children: ReactNode;
  /** When true, force-reveals content regardless of user interaction (e.g. after answering) */
  forceReveal?: boolean;
  className?: string;
}

/**
 * Wraps content with a blur-to-reveal interaction.
 * Content is blurred by default; click to peek, or auto-revealed via forceReveal.
 */
export function HintReveal({ children, forceReveal = false, className }: HintRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const isBlurred = !revealed && !forceReveal;

  return (
    <div
      className={cn(
        'cursor-pointer select-none transition-all duration-200',
        isBlurred && 'blur-sm hover:blur-[3px]',
        className
      )}
      onClick={() => !revealed && setRevealed(true)}
      title={isBlurred ? 'Klik untuk melihat petunjuk' : undefined}
    >
      {children}
    </div>
  );
}

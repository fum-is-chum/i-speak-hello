import { useState } from 'react';
import type { TargetLanguage } from '@i-speak-hello/shared';
import { speak } from '../../lib/audio';
import { cn } from '../../lib/cn';

interface SpeakButtonProps {
  text: string;
  language: TargetLanguage;
  className?: string;
}

export function SpeakButton({ text, language, className }: SpeakButtonProps) {
  const [playing, setPlaying] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaying(true);
    speak(text, language);
    // Estimate duration and reset
    setTimeout(() => setPlaying(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700',
        playing && 'text-primary animate-pulse',
        className
      )}
      title="Dengarkan pengucapan"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {playing ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        )}
      </svg>
    </button>
  );
}

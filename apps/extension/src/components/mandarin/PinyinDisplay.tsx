import { useState } from 'react';
import { splitPinyin, getToneNumber, getToneColorClass } from '@i-speak-hello/shared';
import { cn } from '../../lib/cn';

interface PinyinDisplayProps {
  pinyin: string;
  className?: string;
  /** When true, pinyin is blurred and requires a click to reveal */
  hidden?: boolean;
}

export function PinyinDisplay({ pinyin, className, hidden = false }: PinyinDisplayProps) {
  const [revealed, setRevealed] = useState(false);
  const syllables = splitPinyin(pinyin);
  const isBlurred = hidden && !revealed;

  return (
    <span
      className={cn(
        'inline-flex gap-0.5 cursor-pointer select-none transition-all duration-200',
        isBlurred && 'blur-sm hover:blur-[3px]',
        className
      )}
      onClick={(e) => {
        if (hidden && !revealed) {
          e.stopPropagation();
          setRevealed(true);
        }
      }}
      title={isBlurred ? 'Klik untuk melihat pinyin' : undefined}
    >
      {syllables.map((syl, i) => {
        const tone = getToneNumber(syl);
        return (
          <span key={i} className={getToneColorClass(tone)}>
            {syl}
          </span>
        );
      })}
    </span>
  );
}

import { splitPinyin, getToneNumber, getToneColorClass } from '@i-speak-hello/shared';
import { cn } from '../../lib/cn';

interface PinyinDisplayProps {
  pinyin: string;
  className?: string;
}

export function PinyinDisplay({ pinyin, className }: PinyinDisplayProps) {
  const syllables = splitPinyin(pinyin);

  return (
    <span className={cn('inline-flex gap-0.5', className)}>
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

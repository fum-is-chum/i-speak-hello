import { getXpForNextLevel } from '@i-speak-hello/shared';
import { cn } from '../../lib/cn';

interface XPBarProps {
  totalXp: number;
  level: number;
  className?: string;
}

export function XPBar({ totalXp, level, className }: XPBarProps) {
  const { current, needed, progress } = getXpForNextLevel(totalXp);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-yellow-700 dark:text-yellow-400">⭐ Level {level}</span>
        <span className="text-stone-400">{current}/{needed} XP</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

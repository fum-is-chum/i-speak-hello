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
        <span className="font-medium text-purple-600 dark:text-purple-400">⭐ Level {level}</span>
        <span className="text-gray-400">{current}/{needed} XP</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

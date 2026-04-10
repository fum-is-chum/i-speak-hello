import { cn } from '../../lib/cn';

interface StatusBarProps {
  streak: number;
  reviewed: number;
  goal: number;
  level: number;
  className?: string;
}

/**
 * Combined compact status bar for the top header.
 * Shows streak, daily goal ring, and level badge in one row.
 */
export function StatusBar({ streak, reviewed, goal, level, className }: StatusBarProps) {
  const progress = Math.min(reviewed / goal, 1);
  const completed = reviewed >= goal;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <span className="text-base">🔥</span>
        <span className={cn('text-sm font-bold', streak > 0 ? 'text-orange-500' : 'text-stone-300 dark:text-stone-600')}>
          {streak}
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-stone-200 dark:bg-stone-700" />

      {/* Daily Goal Mini Ring */}
      <div className="relative w-7 h-7">
        <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" fill="none" strokeWidth="2.5"
            className="stroke-stone-200 dark:stroke-stone-700" />
          <circle cx="14" cy="14" r="11" fill="none" strokeWidth="2.5"
            className={completed ? 'stroke-green-500' : 'stroke-teal-500'}
            strokeDasharray="69.1"
            strokeDashoffset={69.1 * (1 - progress)}
            strokeLinecap="round" />
        </svg>
        <span className={cn(
          'absolute inset-0 flex items-center justify-center text-[9px] font-bold',
          completed ? 'text-green-600 dark:text-green-400' : 'text-stone-600 dark:text-stone-400'
        )}>
          {completed ? '✓' : reviewed}
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-stone-200 dark:bg-stone-700" />

      {/* Level Badge */}
      <div className="flex items-center gap-1 rounded-full bg-yellow-50 dark:bg-yellow-950/30 px-2.5 py-1">
        <span className="text-xs">⭐</span>
        <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Lv.{level}</span>
      </div>
    </div>
  );
}

import { cn } from '../../lib/cn';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export function StreakCounter({ streak, className }: StreakCounterProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className={cn('text-xl', streak > 0 ? 'animate-bounce' : '')}>🔥</span>
      <span className={cn('font-bold', streak > 0 ? 'text-orange-500' : 'text-stone-300 dark:text-stone-600')}>
        {streak}
      </span>
    </div>
  );
}

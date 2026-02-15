import { cn } from '../../lib/cn';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export function StreakCounter({ streak, className }: StreakCounterProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className={cn('text-xl', streak > 0 ? 'animate-bounce' : '')}>🔥</span>
      <span className="font-bold text-orange-500">{streak}</span>
    </div>
  );
}

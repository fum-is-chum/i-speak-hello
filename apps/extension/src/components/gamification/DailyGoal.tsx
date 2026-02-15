import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';

interface DailyGoalProps {
  reviewed: number;
  goal: number;
  className?: string;
}

export function DailyGoal({ reviewed, goal, className }: DailyGoalProps) {
  const progress = Math.min(reviewed / goal, 1);
  const completed = reviewed >= goal;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('text-center', className)}>
      {/* Circular progress */}
      <div className="relative mx-auto h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={isDark ? '#374151' : '#e5e7eb'}
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={completed ? '#22c55e' : '#6366f1'}
            strokeWidth="3"
            strokeDasharray={`${progress * 100}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {reviewed}/{goal}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {completed ? '🎉 Target tercapai!' : 'Target harian'}
      </p>
    </div>
  );
}

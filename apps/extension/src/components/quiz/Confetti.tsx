const COLORS = [
  'bg-teal-500', 'bg-cyan-500', 'bg-yellow-400', 'bg-green-500',
  'bg-orange-400', 'bg-red-400', 'bg-teal-400', 'bg-yellow-500',
  'bg-green-400', 'bg-cyan-400', 'bg-teal-300', 'bg-yellow-300',
];

/**
 * Pure CSS confetti effect. Renders 12 falling particles
 * with random positions, delays, and durations.
 */
export function Confetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {COLORS.map((color, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-sm animate-confetti-fall ${color}`}
          style={{
            left: `${8 + (i * 7.5)}%`,
            animationDelay: `${(i * 0.04).toFixed(2)}s`,
            animationDuration: `${2 + (i % 5) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

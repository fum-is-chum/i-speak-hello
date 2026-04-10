import { useState, useEffect, useRef } from 'react';
import { getReviews } from '../../lib/storage';
import { cn } from '../../lib/cn';

const CELL = 10;  // px per cell
const GAP = 3;    // px gap between cells
const DAY_W = 26; // px for day labels column
const PAD = 20;   // px card padding each side (p-5)

const COLORS = [
  'bg-stone-200 dark:bg-stone-700',
  'bg-teal-200 dark:bg-teal-900',
  'bg-teal-400 dark:bg-teal-700',
  'bg-teal-600 dark:bg-teal-500',
  'bg-teal-800 dark:bg-teal-300',
];

function getColor(count: number) {
  if (count === 0) return COLORS[0];
  if (count <= 2) return COLORS[1];
  if (count <= 5) return COLORS[2];
  if (count <= 8) return COLORS[3];
  return COLORS[4];
}

interface DayData {
  date: Date;
  count: number;
}

export function StudyHeatmap() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [weeks, setWeeks] = useState(0);
  const [data, setData] = useState<DayData[]>([]);
  const [monthLabels, setMonthLabels] = useState<{ text: string; left: number }[]>([]);

  useEffect(() => {
    async function load() {
      const reviews = await getReviews();

      // Count reviews per day
      const countsByDate: Record<string, number> = {};
      for (const r of reviews) {
        const d = new Date(r.reviewedAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        countsByDate[key] = (countsByDate[key] || 0) + 1;
      }

      // Measure: card width minus padding minus day label column
      const el = outerRef.current;
      if (!el) return;
      const gridWidth = el.clientWidth - (PAD * 2) - DAY_W - GAP;
      const numWeeks = Math.max(8, Math.floor(gridWidth / (CELL + GAP)));
      setWeeks(numWeeks);

      // Build day data
      const today = new Date();
      const days: DayData[] = [];
      for (let w = 0; w < numWeeks; w++) {
        for (let d = 0; d < 7; d++) {
          const daysAgo = (numWeeks - 1 - w) * 7 + (6 - d);
          const date = new Date(today);
          date.setDate(date.getDate() - daysAgo);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          days.push({ date, count: countsByDate[key] || 0 });
        }
      }
      setData(days);

      // Month labels
      const labels: { text: string; left: number }[] = [];
      let lastMonth = -1;
      for (let w = 0; w < numWeeks; w++) {
        const daysAgo = (numWeeks - 1 - w) * 7;
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        if (d.getMonth() !== lastMonth) {
          labels.push({
            text: d.toLocaleDateString('id-ID', { month: 'short' }),
            left: w * (CELL + GAP),
          });
          lastMonth = d.getMonth();
        }
      }
      setMonthLabels(labels);
    }

    load();
  }, []);

  if (weeks === 0) {
    return <div ref={outerRef} className="rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-5 shadow-sm h-32" />;
  }

  const cellPx = `${CELL}px`;
  const gapPx = `${GAP}px`;

  return (
    <div ref={outerRef} className="rounded-2xl bg-surface-1 ring-1 ring-stone-900/5 dark:ring-white/5 p-5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">Kalender Belajar</h3>
        <span className="text-xs text-stone-400">{weeks} minggu terakhir</span>
      </div>

      {/* Month labels */}
      <div className="relative h-3 mb-1" style={{ marginLeft: DAY_W + GAP }}>
        {monthLabels.map((label, i) => (
          <span key={i} className="absolute text-[9px] text-stone-400" style={{ left: label.left }}>
            {label.text}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: gapPx }}>
        {/* Day labels */}
        <div style={{ width: DAY_W, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: gapPx, paddingTop: 1 }}>
          {['Sen', '', 'Rab', '', 'Jum', '', 'Min'].map((label, i) => (
            <span key={i} className="text-[9px] text-stone-400" style={{ height: cellPx, lineHeight: cellPx }}>
              {label}
            </span>
          ))}
        </div>

        {/* Grid - fixed size cells, no flex stretch */}
        <div style={{ display: 'flex', gap: gapPx, overflow: 'hidden' }}>
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: gapPx }}>
              {Array.from({ length: 7 }).map((_, d) => {
                const item = data[w * 7 + d];
                if (!item) return <div key={d} style={{ width: cellPx, height: cellPx }} />;
                const dateStr = item.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                return (
                  <div
                    key={d}
                    className={cn('rounded-sm', getColor(item.count))}
                    style={{ width: cellPx, height: cellPx, flexShrink: 0 }}
                    title={item.count > 0 ? `${item.count} review — ${dateStr}` : `Tidak belajar — ${dateStr}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3">
        <span className="text-[9px] text-stone-400">Sedikit</span>
        {COLORS.map((color, i) => (
          <div key={i} className={cn('rounded-sm', color)} style={{ width: cellPx, height: cellPx }} />
        ))}
        <span className="text-[9px] text-stone-400">Banyak</span>
      </div>
    </div>
  );
}

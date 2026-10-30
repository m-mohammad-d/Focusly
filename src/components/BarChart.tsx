import React, { useState } from 'react';
import { formatDuration, formatDisplayDate } from '../utils/time';

export interface BarChartDataPoint {
  date: string;
  seconds: number;
  isToday?: boolean;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 180 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl"
      >
        No activity recorded for this period
      </div>
    );
  }

  const maxSeconds = Math.max(1, ...data.map((d) => d.seconds));
  // Round max scale up to nearest 30 mins or 1 hour
  const scaleMax = Math.ceil(maxSeconds / 1800) * 1800;

  return (
    <div className="w-full relative select-none">
      <div
        className="flex items-end gap-2 pt-6 pb-2 px-1 border-b border-gray-800/80"
        style={{ height }}
      >
        {data.map((point, index) => {
          const barHeightPercent = Math.max(
            4,
            Math.min(100, Math.round((point.seconds / scaleMax) * 100))
          );
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 px-2.5 py-1 bg-gray-950 border border-gray-700/80 text-gray-200 text-xs rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95">
                  <span className="font-semibold">{formatDisplayDate(point.date)}: </span>
                  <span className="text-indigo-400 font-bold">{formatDuration(point.seconds)}</span>
                </div>
              )}

              {/* Bar */}
              <div
                style={{ height: `${barHeightPercent}%` }}
                className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 ${
                  point.isToday
                    ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-500/20'
                    : isHovered
                    ? 'bg-indigo-500/80'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis labels */}
      <div className="flex gap-2 px-1 pt-2">
        {data.map((point) => (
          <div
            key={`label-${point.date}`}
            className="flex-1 text-center text-[10px] text-gray-400 font-medium truncate"
          >
            {point.isToday ? (
              <span className="text-indigo-400 font-bold">Today</span>
            ) : (
              formatDisplayDate(point.date).split(',')[0]
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

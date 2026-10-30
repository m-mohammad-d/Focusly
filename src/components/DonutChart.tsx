import React, { useState } from 'react';
import { DomainStatItem } from '../utils/stats';
import { getDomainInfo } from '../utils/domain';
import { formatDuration } from '../utils/time';

interface DonutChartProps {
  domains: DomainStatItem[];
  totalSeconds: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  domains,
  totalSeconds,
  size = 160,
}) => {
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  if (!domains || domains.length === 0 || totalSeconds === 0) {
    return (
      <div
        style={{ height: size }}
        className="flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-xl"
      >
        No domain usage recorded yet
      </div>
    );
  }

  // Top 5 domains + Other
  const topList = domains.slice(0, 5);
  const otherSeconds = domains.slice(5).reduce((acc, d) => acc + d.seconds, 0);

  const items = topList.map((d) => {
    const info = getDomainInfo(d.domain);
    return {
      domain: d.domain,
      name: info.name,
      color: info.color,
      seconds: d.seconds,
      percentage: Math.round((d.seconds / totalSeconds) * 100),
    };
  });

  if (otherSeconds > 0) {
    items.push({
      domain: '__other__',
      name: 'Other websites',
      color: '#64748b',
      seconds: otherSeconds,
      percentage: Math.round((otherSeconds / totalSeconds) * 100),
    });
  }

  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const slices = items.map((item) => {
    const sliceLen = (item.seconds / totalSeconds) * circumference;
    const offset = currentOffset;
    currentOffset += sliceLen;

    return {
      ...item,
      strokeDasharray: `${sliceLen} ${circumference - sliceLen}`,
      strokeDashoffset: -offset,
    };
  });

  const activeItem = hoveredDomain
    ? items.find((i) => i.domain === hoveredDomain)
    : items[0];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 select-none"
        >
          {slices.map((slice) => {
            const isHovered = hoveredDomain === slice.domain;
            return (
              <circle
                key={slice.domain}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                fill="transparent"
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredDomain(slice.domain)}
                onMouseLeave={() => setHoveredDomain(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
          {activeItem && (
            <>
              <span className="text-xs font-semibold text-gray-200 truncate max-w-[90px]">
                {activeItem.name}
              </span>
              <span className="text-sm font-bold text-indigo-400">
                {activeItem.percentage}%
              </span>
              <span className="text-[10px] text-gray-400">
                {formatDuration(activeItem.seconds)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-1 gap-2 w-full">
        {items.map((item) => (
          <div
            key={item.domain}
            className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              hoveredDomain === item.domain ? 'bg-gray-800/80' : 'hover:bg-gray-800/40'
            }`}
            onMouseEnter={() => setHoveredDomain(item.domain)}
            onMouseLeave={() => setHoveredDomain(null)}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-300 font-medium truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 text-right shrink-0">
              <span className="text-gray-400">{formatDuration(item.seconds)}</span>
              <span className="font-semibold text-gray-200 w-8">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

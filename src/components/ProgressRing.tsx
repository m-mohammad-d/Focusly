import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100+
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  subText?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 10,
  centerText,
  subText,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  let strokeColor = '#10B981'; // Emerald
  if (progress >= 100) {
    strokeColor = '#EF4444'; // Rose / Limit reached
  } else if (progress >= 80) {
    strokeColor = '#F59E0B'; // Amber / Warning
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {centerText && (
          <span className="text-base font-bold tracking-tight text-gray-100">
            {centerText}
          </span>
        )}
        {subText && (
          <span className="text-[10px] text-gray-400 font-medium">
            {subText}
          </span>
        )}
      </div>
    </div>
  );
};

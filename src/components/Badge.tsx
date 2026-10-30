import React from 'react';

export type BadgeVariant = 'indigo' | 'emerald' | 'amber' | 'rose' | 'gray' | 'sky';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  className = '',
  dot = false,
  pulse = false,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    indigo: {
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      text: 'text-indigo-400',
      dot: 'bg-indigo-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
    },
    sky: {
      bg: 'bg-sky-500/10 border-sky-500/30',
      text: 'text-sky-400',
      dot: 'bg-sky-400',
    },
    gray: {
      bg: 'bg-gray-800/60 border-gray-700/50',
      text: 'text-gray-300',
      dot: 'bg-gray-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${style.dot} ${pulse ? 'pulse-dot' : ''}`}
        />
      )}
      {children}
    </span>
  );
};

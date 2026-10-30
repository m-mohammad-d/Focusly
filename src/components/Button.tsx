import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2 py-1 text-xs rounded-md',
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-base rounded-xl',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 border border-indigo-500/40 active:translate-y-0.5',
    secondary:
      'bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 border border-gray-700/60 active:translate-y-0.5',
    outline:
      'bg-transparent hover:bg-gray-800/40 text-gray-300 border border-gray-700 active:translate-y-0.5',
    danger:
      'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 active:translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 active:translate-y-0.5',
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none gap-2 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
};

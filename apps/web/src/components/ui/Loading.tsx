import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
}

export interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColors = {
  primary: 'text-primary-600',
  white: 'text-white',
  gray: 'text-gray-600',
};

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size = 'md', color = 'primary', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <svg
          className={cn(
            'animate-spin',
            spinnerSizes[size],
            spinnerColors[color]
          )}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }
);
LoadingSpinner.displayName = 'LoadingSpinner';

export const LoadingSkeleton = forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ className, width, height, variant = 'rectangular', style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse bg-gray-200 dark:bg-gray-700',
          variant === 'text' && 'h-4 rounded',
          variant === 'circular' && 'rounded-full',
          variant === 'rectangular' && 'rounded-lg',
          className
        )}
        style={{
          width,
          height,
          ...style,
        }}
        {...props}
      />
    );
  }
);
LoadingSkeleton.displayName = 'LoadingSkeleton';

// Componente de Loading de página completa
export function LoadingPage({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// Componente de Loading para cards/seções
export function LoadingCard() {
  return (
    <div className="p-6 space-y-4">
      <LoadingSkeleton height="24px" width="60%" />
      <LoadingSkeleton height="16px" width="100%" />
      <LoadingSkeleton height="16px" width="80%" />
      <LoadingSkeleton height="16px" width="90%" />
    </div>
  );
}

// Componente de Loading para tabelas
export function LoadingTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <LoadingSkeleton
              key={j}
              height="40px"
              width={j === 0 ? '25%' : j === 1 ? '30%' : j === 2 ? '20%' : '25%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
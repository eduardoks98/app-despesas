import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 sm:text-sm">{leftIcon}</span>
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-400 sm:text-sm">{rightIcon}</span>
            </div>
          )}
        </div>
        
        {helperText && (
          <p className={cn(
            'mt-1 text-sm',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
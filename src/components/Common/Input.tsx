import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      startIcon,
      endIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      px-4 py-3 rounded-xl border text-slate-900 placeholder-slate-400
      transition-all duration-200 outline-none
      ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
      ${error ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-100' : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'}
      ${startIcon ? 'pl-11' : ''}
      ${endIcon ? 'pr-11' : ''}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            className={baseClasses}
            disabled={disabled}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {endIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

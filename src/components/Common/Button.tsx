import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const variantStyles = {
  primary: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 disabled:bg-emerald-300',
  secondary: 'bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white shadow-lg disabled:bg-slate-400',
  danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-500/20 disabled:bg-red-400',
  ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 disabled:text-slate-400',
  success: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 disabled:bg-emerald-300',
  outline: 'bg-transparent border-2 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 disabled:border-slate-200 disabled:text-slate-400',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-base rounded-xl',
  lg: 'px-6 py-3.5 text-lg rounded-xl',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed active:scale-95';
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};

export default Button;

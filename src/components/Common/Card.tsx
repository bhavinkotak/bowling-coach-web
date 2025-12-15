import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
}: CardProps) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverStyle = hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-200' : '';
  
  return (
    <div
      className={`bg-slate-800 rounded-lg shadow-lg ${paddingStyles[padding]} ${hoverStyle} ${className}`}
    >
      {children}
    </div>
  );
}

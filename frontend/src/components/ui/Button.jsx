import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  isLoading, 
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-900 text-white shadow-soft hover:bg-brand-800 hover:-translate-y-0.5 focus:ring-brand-500/30 rounded-xl',
    accent: 'bg-accent-600 text-white shadow-md shadow-accent-600/20 hover:bg-accent-700 hover:shadow-lg hover:shadow-accent-600/30 hover:-translate-y-0.5 focus:ring-accent-500/30 rounded-xl',
    secondary: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-500/20 rounded-xl',
    danger: 'bg-red-600 text-white shadow-md shadow-red-500/20 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5 focus:ring-red-500/30 rounded-xl',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}

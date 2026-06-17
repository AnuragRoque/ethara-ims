import React, { forwardRef } from 'react';
import { cn } from './Button';
import { AlertCircle } from 'lucide-react';

export const Select = forwardRef(({ className, label, error, helperText, options, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "input-field appearance-none cursor-pointer",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/20 pr-10",
            className
          )}
          {...props}
        >
          <option value="" disabled>Select an option</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-red-600 animate-fade-in flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';

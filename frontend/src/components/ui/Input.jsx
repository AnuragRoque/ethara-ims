import React, { forwardRef } from 'react';
import { cn } from './Button';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(({ className, label, error, helperText, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={cn(
            "input-field",
            error && "border-red-400 focus:border-red-500 focus:ring-red-500/20 pr-10",
            className
          )}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500 animate-fade-in" />
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-red-600 animate-fade-in">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

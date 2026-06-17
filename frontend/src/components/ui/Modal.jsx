import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden animate-scale-in border border-slate-100 flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <Button variant="ghost" size="sm" className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

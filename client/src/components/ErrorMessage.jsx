import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorMessage({ title = 'Error', message, onRetry = null, className = '' }) {
  if (!message) return null;

  return (
    <div className={`p-5 rounded-2xl bg-red-50/70 border border-red-200 text-red-950 ${className}`}>
      <div className="flex items-start space-x-3.5">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#10183D]">{title}</h4>
          <p className="mt-1 text-xs text-slate-700 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center space-x-1.5 text-xs font-bold text-[#2764D9] hover:underline transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Operation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

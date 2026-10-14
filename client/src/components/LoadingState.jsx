import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...', subtitle = null }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-[#EAF7FC] flex items-center justify-center mb-4">
        <Loader2 className="w-6 h-6 text-[#2764D9] animate-spin" />
      </div>
      <h3 className="text-base font-extrabold text-[#10183D] tracking-tight">{message}</h3>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

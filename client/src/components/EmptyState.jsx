import React from 'react';
import { PackageOpen, ArrowRight } from 'lucide-react';

export default function EmptyState({
  title = 'No Results Found',
  description = 'No matching options were found for your search criteria.',
  actionLabel = null,
  onAction = null,
  icon: Icon = PackageOpen,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-[#EAF7FC] flex items-center justify-center mb-4 text-[#2764D9]">
        <Icon className="w-7 h-7 text-[#2764D9]" />
      </div>
      <h3 className="text-base font-extrabold text-[#10183D] tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-600 max-w-md leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#10183D] hover:bg-[#2764D9] rounded-xl shadow-sm transition-all cursor-pointer active:scale-[0.98]"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-28 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-[#EAF7FC] text-[#2764D9] flex items-center justify-center mx-auto">
        <Truck className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[#10183D] tracking-tight">404 - Page Not Found</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          The requested dispatch route or record does not exist on the TruckLayBay terminal.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#10183D] hover:bg-[#2764D9] text-white text-xs font-bold transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Freight Terminal</span>
      </Link>
    </div>
  );
}

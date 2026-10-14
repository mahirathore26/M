import React, { useState } from 'react';
import { formatINR } from '../utils/formatters.js';
import { ChevronDown, ChevronUp, Receipt } from 'lucide-react';

export default function PriceBreakdown({
  baseRate,
  fuelSurcharge,
  accessorialCharges = 0,
  totalAmount,
  calculationSnapshot = null,
  compact = false,
}) {
  const [showDetails, setShowDetails] = useState(!compact);

  const baseNum = Number(baseRate) || 0;
  const fuelNum = Number(fuelSurcharge) || 0;
  const accNum = Number(accessorialCharges) || 0;
  const totalNum = Number(totalAmount) || 0;

  return (
    <div className="rounded-xl bg-[#FBFAF7] border border-slate-200 overflow-hidden text-xs">
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer select-none bg-slate-50 hover:bg-slate-100/70 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-[#2764D9]" />
          <span className="font-bold text-[#10183D]">Itemized Fare Breakdown</span>
        </div>
        <div className="flex items-center space-x-2.5">
          <span className="font-extrabold text-[#10183D] text-sm">{formatINR(totalNum)}</span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      {showDetails && (
        <div className="p-4 space-y-2.5 border-t border-slate-200/80 bg-white">
          <div className="flex items-center justify-between text-slate-600">
            <span>Contractual Base Freight</span>
            <span className="font-semibold text-[#10183D]">{formatINR(baseNum)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Fuel surcharge (10% configured rate)</span>
            <span className="font-semibold text-[#10183D]">{formatINR(fuelNum)}</span>
          </div>

          {accNum > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span>Accessorial & Equipment Handling</span>
              <span className="font-semibold text-[#10183D]">{formatINR(accNum)}</span>
            </div>
          )}

          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between font-black text-[#10183D] text-sm">
            <span>Quoted total</span>
            <span className="text-[#2764D9] text-base">{formatINR(totalNum)}</span>
          </div>

          {calculationSnapshot?.formula && (
            <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-400">Formula: {calculationSnapshot.formula}</span>
              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium">
                Paise-Precision
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

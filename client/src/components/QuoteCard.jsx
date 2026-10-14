import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatINR } from '../utils/formatters.js';
import PriceBreakdown from './PriceBreakdown.jsx';
import { Truck, Clock, CheckCircle2, ArrowRight, AlertTriangle, Building2, ShieldCheck } from 'lucide-react';

export default function QuoteCard({
  quote,
  onBook,
  isBooking = false,
  isBooked = false,
  disabled = false,
}) {
  const navigate = useNavigate();
  const expiryTimeStr = quote.quote_valid_until || quote.valid_until;
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryTimeStr) return;

    const expiryDate = new Date(expiryTimeStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = expiryDate - now;

      if (diffMs <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
      } else {
        const totalSec = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setTimeLeft(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiryTimeStr]);

  const total = Number(quote.total_amount) || 0;
  const carrierName = quote.carrier_name || `Carrier #${quote.carrier_id || '—'}`;
  const truckReg = quote.registration_number || `Truck #${quote.truck_id || '—'}`;

  return (
    <div
      className={`rounded-2xl bg-white border transition-all ${
        isBooked
          ? 'border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
          : isExpired
            ? 'border-slate-200 opacity-70 shadow-none'
            : 'border-slate-200 hover:border-[#2764D9]/40 hover:shadow-lg'
      }`}
    >
      {/* Top Bar / Status */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#10183D] text-white">
            <Truck className="w-3 h-3 text-[#2764D9]" />
            <span>Quote #{quote.quote_id}</span>
          </span>
          {isBooked ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              <span>Booked</span>
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3" />
              <span>Expired</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7FC] text-[#2764D9] border border-[#2764D9]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2764D9]" />
              <span>Available</span>
            </span>
          )}
        </div>

        {/* 15m Expiration Countdown */}
        {expiryTimeStr && !isBooked && (
          <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold">
            <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-[#2764D9]'}`} />
            <span className={isExpired ? 'text-red-600 font-bold' : 'text-slate-700'}>
              {isExpired ? 'Validity Expired' : `${timeLeft} remaining`}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Carrier & Vehicle Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#2764D9]" />
              <h3 className="text-base font-extrabold text-[#10183D] tracking-tight">{carrierName}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-[#10183D]">
                {truckReg}
              </span>
              {quote.truck_id && <span>Vehicle #{quote.truck_id}</span>}
              {quote.rate_card_id && <span>• Rate Card #{quote.rate_card_id}</span>}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="block text-xs font-medium text-slate-500">Quoted Total</span>
            <span className="text-2xl font-black text-[#10183D] tracking-tight font-sans">
              {formatINR(total)}
            </span>
          </div>
        </div>

        {/* Pricing Breakdown Component */}
        <PriceBreakdown
          baseRate={quote.base_rate}
          fuelSurcharge={quote.fuel_surcharge}
          accessorialCharges={quote.accessorial_charges}
          totalAmount={quote.total_amount}
          calculationSnapshot={quote.calculation_snapshot}
          compact={true}
        />

        {/* Dispatch assurance note */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center space-x-1.5 text-[#2764D9] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Confirmed Truck Allocation for Requested Dates</span>
          </span>
          <span className="text-slate-400 font-mono text-[10px]">15m Valid Window</span>
        </div>

        {/* Action Button */}
        <div>
          {isBooked ? (
            <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs text-center flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Booking Confirmed for this Quote</span>
            </div>
          ) : (
            <button
              type="button"
              disabled={isExpired || isBooking || disabled}
              onClick={() => {
                if (isExpired || isBooked || disabled) return;
                navigate(`/checkout/${quote.quote_id}`);
              }}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm ${
                isExpired
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-[#2764D9] hover:bg-[#1E52B7] active:scale-[0.99] text-white hover:shadow-md'
              }`}
            >
              {isExpired ? (
                <span>Quote Expired (Re-calculate Rates)</span>
              ) : (
                <>
                  <span>Continue to checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

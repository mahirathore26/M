import React from 'react';
import { Link } from 'react-router-dom';
import { formatINR, formatDate, formatWeight } from '../utils/formatters.js';
import { CheckCircle2, Truck, Calendar, MapPin, Building2, ArrowRight, ShieldCheck, Scale, FileText } from 'lucide-react';

export default function BookingConfirmation({ booking, onNewSearch }) {
  if (!booking) return null;

  const bookingId = booking.booking_id;
  const status = booking.booking_status || booking.status || 'CONFIRMED';
  const totalAmount = booking.total_amount || 0;
  const carrierName = booking.carrier_name || 'Assigned Carrier';
  const truckReg = booking.registration_number || 'Confirmed Fleet Vehicle';
  const origin = booking.origin_city || 'Origin';
  const dest = booking.destination_city || 'Destination';
  const pickup = booking.pickup_date;
  const delivery = booking.delivery_date;
  const weight = booking.weight_kg;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
      {/* Editorial Header */}
      <div className="bg-[#10183D] text-white p-8 sm:p-10 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#2764D9]/20 border border-[#2764D9]/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-8 h-8 text-[#2764D9]" />
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-[#2764D9] font-bold">
                Booking Confirmation
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
                Freight Reference #{bookingId}
              </h2>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-4 sm:pt-0">
            <span className="text-xs text-slate-400 font-medium">Contractual Settled Fare</span>
            <span className="text-3xl font-black text-white">{formatINR(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Booking Details Grid */}
      <div className="p-8 sm:p-10 space-y-8 bg-[#FBFAF7]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Corridor & Dates */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-[#2764D9]" />
              <span>Route & Schedule</span>
            </div>
            <div className="space-y-2">
              <div className="text-base font-extrabold text-[#10183D] flex items-center space-x-2">
                <span>{origin}</span>
                <span className="text-[#2764D9]">→</span>
                <span>{dest}</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pickup Date:</span>
                  <strong className="text-[#10183D]">{formatDate(pickup)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Delivery Date:</span>
                  <strong className="text-[#10183D]">{formatDate(delivery)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Carrier & Truck */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
              <Truck className="w-4 h-4 text-[#2764D9]" />
              <span>Allocated Fleet Vehicle</span>
            </div>
            <div className="space-y-2">
              <div className="text-base font-extrabold text-[#10183D] truncate">
                {carrierName}
              </div>
              <div className="pt-1 flex items-center space-x-2">
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-bold text-[#10183D]">
                  {truckReg}
                </span>
                <span className="text-[11px] text-[#2764D9] bg-[#EAF7FC] px-2.5 py-0.5 rounded font-bold border border-[#2764D9]/20">
                  Allocated
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Assurance */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#2764D9]" />
              <span>Confirmed Allocation</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Booking checks designed to prevent conflicts have confirmed this vehicle for your shipment window.
            </p>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              Status: <span className="text-emerald-700 font-bold">{status}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onNewSearch}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-xs font-bold text-[#10183D] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          >
            ← Search Another Corridor
          </button>

          <Link
            to={`/bookings/${bookingId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3 rounded-xl bg-[#10183D] hover:bg-[#2764D9] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>View Full Booking Record & Bill of Lading</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

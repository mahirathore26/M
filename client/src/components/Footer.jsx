import React from 'react';
import { Truck, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#10183D] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#2764D9] flex items-center justify-center text-white">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-sans">
                Truck<span className="text-[#2764D9]">LayBay</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's full-truckload freight dispatch terminal. Contractual rate cards, equipment capability matching, and confirmed truck allocations across primary industrial corridors.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Carrier options for your route</span>
            </div>
          </div>

          {/* Active Corridors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Primary Corridors
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#2764D9]" />
                <span>Indore ⇄ Mumbai (589 km)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#2764D9]" />
                <span>Indore ⇄ Delhi (793 km)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#2764D9]" />
                <span>Bhopal ⇄ Mumbai (780 km)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#2764D9]" />
                <span>Mumbai ⇄ Pune (150 km)</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#2764D9]" />
                <span>Indore ⇄ Pune (640 km)</span>
              </li>
            </ul>
          </div>

          {/* Equipment Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Fleet Standards
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>20FT & 32FT Multi-Axle Containers</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Temperature-Controlled Cold Chain</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Weatherproof Sealed Bodies</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Heavy-Duty Open Body Flatbeds</span>
              </li>
            </ul>
          </div>

          {/* Booking Assurance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Booking Assurance
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-[#18B6D9]" />
                <span>Confirmed Truck Allocation</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Booking checks designed to prevent conflicts for your scheduled pickup and delivery dates. Firm 15-minute quote validity window.
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              TruckLayBay Commercial Freight • All rights reserved © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

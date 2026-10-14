import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Search, ArrowRight, X } from 'lucide-react';

export default function Navbar() {
  const [lookupId, setLookupId] = useState('');
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const navigate = useNavigate();

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    const id = lookupId.trim();
    if (id && !isNaN(Number(id))) {
      setIsLookupOpen(false);
      setLookupId('');
      navigate(`/bookings/${id}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-[#10183D] flex items-center justify-center text-white shadow-sm group-hover:bg-[#2764D9] transition-colors relative">
              <Truck className="w-6 h-6 text-[#2764D9] group-hover:text-white transition-colors" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#18B6D9]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-[#10183D] font-sans">
                Truck<span className="text-[#2764D9]">LayBay</span>
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 font-semibold tracking-wider uppercase">
                Full-Truckload Freight Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
            <Link to="/" className="hover:text-[#2764D9] transition-colors">
              Book Freight
            </Link>
            <a href="#how-it-works" className="hover:text-[#2764D9] transition-colors">
              How It Works
            </a>
            <a href="#pricing-schedule" className="hover:text-[#2764D9] transition-colors">
              Pricing Schedule
            </a>
            <a href="#corridors" className="hover:text-[#2764D9] transition-colors">
              Corridors
            </a>
          </nav>

          {/* Action / Booking Lookup */}
          <div className="flex items-center space-x-3">
            {isLookupOpen ? (
              <form onSubmit={handleLookupSubmit} className="flex items-center">
                <input
                  type="text"
                  placeholder="Enter Booking ID..."
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  className="w-36 sm:w-44 px-3 py-2 text-xs rounded-l-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-bold bg-[#10183D] text-white rounded-r-lg hover:bg-[#2764D9] transition-colors cursor-pointer"
                >
                  Find
                </button>
                <button
                  type="button"
                  onClick={() => setIsLookupOpen(false)}
                  className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsLookupOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                title="Search existing booking by ID"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Track Booking</span>
              </button>
            )}

            <a
              href="#search-section"
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2764D9] hover:bg-[#1E52B7] rounded-lg shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Instant Quotes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

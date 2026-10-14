import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchBookingById, extractErrorMessage } from '../services/api.js';
import { formatINR, formatDate, formatWeight } from '../utils/formatters.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  Truck,
  CheckCircle2,
  Calendar,
  MapPin,
  Building2,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Printer,
  Scale,
} from 'lucide-react';

export default function BookingDetailsPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchId, setSearchId] = useState('');

  const loadBooking = async (id) => {
    setIsLoading(true);
    setError(null);
    setBooking(null);

    const num = Number(id);
    if (!id || isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      setError('Invalid booking ID. Booking ID must be a positive integer.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchBookingById(num);
      setBooking(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      loadBooking(bookingId);
    }
  }, [bookingId]);

  const handleLookup = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/bookings/${searchId.trim()}`);
      setSearchId('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-[#10183D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Freight Terminal</span>
        </Link>

        {/* Quick lookup form */}
        <form onSubmit={handleLookup} className="flex items-center">
          <input
            type="text"
            placeholder="Search booking ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-48 px-3.5 py-2 text-xs rounded-l-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9]"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold bg-[#10183D] text-white rounded-r-lg hover:bg-[#2764D9] transition-colors cursor-pointer"
          >
            Find
          </button>
        </form>
      </div>

      {/* Loading state */}
      {isLoading && (
        <LoadingState
          message={`Retrieving Booking #${bookingId}...`}
          subtitle="Loading carrier, vehicle allocation, and confirmed rate breakdown."
        />
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="space-y-4">
          <ErrorMessage
            title={`Booking #${bookingId || '—'} Not Available`}
            message={error}
            onRetry={() => loadBooking(bookingId)}
          />
          <div className="text-center pt-4">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#2764D9] hover:underline"
            >
              <span>Create a new load & get instant rates</span>
            </Link>
          </div>
        </div>
      )}

      {/* Booking Record Found */}
      {booking && !isLoading && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
          {/* Main Record Header */}
          <div className="bg-[#10183D] text-white p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2764D9] flex items-center justify-center shrink-0">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                    Freight Allocation Record
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{booking.booking_status || 'CONFIRMED'}</span>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
                  Booking #{booking.booking_id}
                </h1>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
              <span className="text-xs text-slate-400 font-medium">Total Contractual Fare</span>
              <span className="text-3xl font-black text-white">{formatINR(booking.total_amount)}</span>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-8 bg-[#FBFAF7]">
            {/* 3-Column Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Route & Schedule */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-[#2764D9]" />
                  <span>Freight Corridor</span>
                </div>
                <div className="text-base font-extrabold text-[#10183D] flex items-center space-x-2">
                  <span>{booking.origin_city}</span>
                  <span className="text-[#2764D9]">→</span>
                  <span>{booking.destination_city}</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pickup Date:</span>
                    <strong className="text-[#10183D]">{formatDate(booking.pickup_date)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Delivery Date:</span>
                    <strong className="text-[#10183D]">{formatDate(booking.delivery_date)}</strong>
                  </div>
                </div>
              </div>

              {/* Carrier & Fleet Vehicle */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-[#2764D9]" />
                  <span>Assigned Carrier</span>
                </div>
                <div className="text-base font-extrabold text-[#10183D] truncate">
                  {booking.carrier_name}
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Vehicle Reg:</span>
                    <strong className="text-[#10183D]">{booking.registration_number}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Truck ID:</span>
                    <span className="text-slate-700 font-bold">#{booking.truck_id}</span>
                  </div>
                </div>
              </div>

              {/* Cargo & Reference Links */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-[#2764D9]" />
                  <span>Cargo Specification</span>
                </div>
                <div className="text-base font-extrabold text-[#10183D]">
                  {formatWeight(booking.weight_kg)}
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Load Reference:</span>
                    <span className="text-slate-700 font-bold">#{booking.load_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Quote Reference:</span>
                    <span className="text-slate-700 font-bold">#{booking.quote_id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Fare Statement */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#2764D9]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#10183D]">
                    Official Fare Breakdown & Surcharge Schedule
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-semibold">
                  Rate Card #{booking.rate_card_id}
                </span>
              </div>

              <div className="p-6 space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Contractual Base Freight</span>
                  <span className="font-bold text-[#10183D] font-mono text-sm">
                    {formatINR(booking.quote_base_rate)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Fuel surcharge (10% configured rate)</span>
                  <span className="font-bold text-[#10183D] font-mono text-sm">
                    {formatINR(booking.fuel_surcharge)}
                  </span>
                </div>

                {Number(booking.accessorial_charges) > 0 && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Accessorial & Equipment Handling</span>
                    <span className="font-bold text-[#10183D] font-mono text-sm">
                      {formatINR(booking.accessorial_charges)}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-black text-[#10183D] text-base">
                  <span>Total Settled Amount</span>
                  <span className="text-[#2764D9] text-lg font-mono">
                    {formatINR(booking.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmed Vehicle Allocation Pill */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Confirmed Vehicle Allocation:</strong> Truck <code>{booking.registration_number}</code> is reserved for this booking.
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Booked at: {booking.booking_created_at ? new Date(booking.booking_created_at).toLocaleString('en-IN') : 'Confirmed'}
              </div>
            </div>

            {/* Print / Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-[#10183D] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Bill of Lading Record</span>
              </button>

              <Link
                to="/"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#10183D] hover:bg-[#2764D9] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Book Another Shipment</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import LoadSearchForm from '../components/LoadSearchForm.jsx';
import QuoteCard from '../components/QuoteCard.jsx';
import BookingConfirmation from '../components/BookingConfirmation.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import IsometricFreightScene from '../components/IsometricFreightScene.jsx';
import {
  fetchLanes,
  fetchCapabilities,
  createLoad,
  generateQuotesForLoad,
  fetchQuotesForLoad,
  bookQuote,
  extractErrorMessage,
} from '../services/api.js';
import {
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Building2,
  ChevronRight,
  MapPin,
  Receipt,
  Scale,
} from 'lucide-react';

export default function HomePage() {
  const [lanes, setLanes] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState(null);

  // Search and quote state
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [currentLoad, setCurrentLoad] = useState(null);
  const [createdLoadId, setCreatedLoadId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Booking state
  const [bookingQuoteId, setBookingQuoteId] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const resultsRef = useRef(null);

  // Load initial reference data: lanes and capabilities
  const loadInitialData = async () => {
    setIsInitialLoading(true);
    setInitialError(null);
    try {
      const [lanesData, capsData] = await Promise.all([
        fetchLanes(),
        fetchCapabilities(),
      ]);
      setLanes(lanesData || []);
      setCapabilities(capsData || []);
    } catch (err) {
      setInitialError(extractErrorMessage(err));
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle Load Creation and Quote Generation
  const handleSearchSubmit = async (formData) => {
    setIsSearching(true);
    setSearchError(null);
    setBookingError(null);
    setConfirmedBooking(null);
    setQuotes([]);
    setHasSearched(true);
    setCurrentLoad(formData);

    let loadId = null;

    try {
      // Step 1: Create load record
      const loadRes = await createLoad(formData);
      loadId = loadRes.load_id;
      setCreatedLoadId(loadId);

      // Step 2: Generate Quotes
      await generateQuotesForLoad(loadId);

      // Step 3: Fetch fully joined quotes
      const quotesList = await fetchQuotesForLoad(loadId);
      setQuotes(quotesList || []);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setSearchError({
        message: extractErrorMessage(err),
        canRetryQuotes: !!loadId,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Retry generating quotes for an existing load without creating duplicate loads
  const handleRetryQuotes = async () => {
    if (!createdLoadId) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      await generateQuotesForLoad(createdLoadId);
      const quotesList = await fetchQuotesForLoad(createdLoadId);
      setQuotes(quotesList || []);
    } catch (err) {
      setSearchError({
        message: extractErrorMessage(err),
        canRetryQuotes: true,
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Quote Booking
  const handleBookQuote = async (quote) => {
    const quoteId = quote.quote_id;
    setBookingQuoteId(quoteId);
    setBookingError(null);

    try {
      const booking = await bookQuote(quoteId);
      setConfirmedBooking(booking);

      // Mark this quote as booked in local state
      setQuotes((prev) =>
        prev.map((q) => (q.quote_id === quoteId ? { ...q, status: 'ACCEPTED' } : q))
      );

      // Scroll to confirmation
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setBookingError(extractErrorMessage(err));
    } finally {
      setBookingQuoteId(null);
    }
  };

  const handleResetSearch = () => {
    setConfirmedBooking(null);
    setQuotes([]);
    setHasSearched(false);
    setSearchError(null);
    setBookingError(null);
    setCreatedLoadId(null);
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. EXPANSIVE ICE-BLUE HERO SECTION WITH ISOMETRIC FREIGHT SCENE */}
      <section className="relative overflow-hidden bg-[#EAF7FC] border-b border-[#D3EBF5] pt-12 sm:pt-16 pb-16 lg:pb-24">
        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(#2764D9 0.75px, transparent 0.75px), radial-gradient(#2764D9 0.75px, #EAF7FC 0.75px)',
            backgroundSize: '32px 32px',
            backgroundPosition: '0 0, 16px 16px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Oversized Editorial Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white border border-[#2764D9]/20 text-[#10183D] text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#18B6D9]" />
                <span className="tracking-wide">Indian Commercial Corridors • Full-Truckload</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#10183D] tracking-tight leading-[1.08] font-sans">
                Your freight. <br />
                The right truck. <br />
                <span className="text-[#2764D9]">One clear quote.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl font-medium">
                Enter your corridor and cargo specifications. TruckLayBay matches vehicle capabilities with active contractual rate cards and lets you book confirmed commercial freight in minutes.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-700 font-bold">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#2764D9]" />
                  <span>Confirmed Truck Allocation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#2764D9]" />
                  <span>15-Minute Valid Rates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-[#10183D]" />
                  <span>Direct Contractual Tariffs</span>
                </div>
              </div>
            </div>

            {/* Right Column: Custom Isometric Freight Illustration */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="w-full max-w-lg lg:max-w-none transform hover:scale-[1.01] transition-transform duration-500">
                <IsometricFreightScene className="drop-shadow-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTEGRATED LOAD-SEARCH FORM TERMINAL CARD */}
      <section id="search-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-20">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 sm:px-8 py-4 bg-[#10183D] text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#2764D9] flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-sm font-extrabold tracking-wide uppercase text-white font-sans">
                Freight Dispatch Terminal
              </h2>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-300 font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Active Corridors: {lanes.length}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span>Available Capabilities: {capabilities.length}</span>
            </div>
          </div>

          {/* Reference Data Loading or Error */}
          {isInitialLoading ? (
            <div className="p-14">
              <LoadingState
                message="Connecting to Dispatch Terminal..."
                subtitle="Loading active corridors and vehicle capability catalog."
              />
            </div>
          ) : initialError ? (
            <div className="p-8">
              <ErrorMessage
                title="Failed to Load Reference Data"
                message={initialError}
                onRetry={loadInitialData}
              />
            </div>
          ) : (
            <LoadSearchForm
              lanes={lanes}
              capabilities={capabilities}
              onSubmit={handleSearchSubmit}
              isLoading={isSearching}
            />
          )}
        </div>
      </section>

      {/* 3. RESULTS & BOOKING CONFIRMATION SECTION */}
      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Booking Confirmation View */}
        {confirmedBooking && (
          <div className="animate-fade-in">
            <BookingConfirmation
              booking={confirmedBooking}
              onNewSearch={handleResetSearch}
            />
          </div>
        )}

        {/* Booking Error Banner */}
        {bookingError && (
          <ErrorMessage
            title="Booking Reservation Failed"
            message={bookingError}
          />
        )}

        {/* Search Error Banner */}
        {searchError && (
          <ErrorMessage
            title="Quote Generation Interrupted"
            message={searchError.message}
            onRetry={searchError.canRetryQuotes ? handleRetryQuotes : null}
          />
        )}

        {/* Searching Progress */}
        {isSearching && (
          <LoadingState
            message="Evaluating Carrier Rate Cards & Fleet Vehicles..."
            subtitle="Matching vehicle capabilities, payload capacity, and active contractual tariffs."
          />
        )}

        {/* Quote Comparison Results */}
        {!isSearching && hasSearched && !confirmedBooking && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <span className="text-xs font-bold text-[#2764D9] uppercase tracking-wider">
                  Available Dispatch Options
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#10183D] tracking-tight">
                  Contractual Carrier Quotes ({quotes.length})
                </h3>
                {createdLoadId && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Load Reference: #{createdLoadId} • Status: QUOTED
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleRetryQuotes}
                  className="px-4 py-2 text-xs font-bold text-[#10183D] bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  Refresh Rates
                </button>
              </div>
            </div>

            {quotes.length === 0 ? (
              <EmptyState
                title="No Eligible Trucks Found"
                description="No active fleet vehicles currently meet all requested equipment specifications for this corridor and date."
                actionLabel="Adjust Corridor or Capabilities"
                onAction={() => {
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {quotes.map((quote) => (
                  <QuoteCard
                    key={quote.quote_id}
                    quote={quote}
                    onBook={handleBookQuote}
                    isBooking={bookingQuoteId === quote.quote_id}
                    isBooked={quote.status === 'ACCEPTED'}
                    disabled={bookingQuoteId !== null && bookingQuoteId !== quote.quote_id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. ASYMMETRICAL EDITORIAL FEATURE: HOW IT OPERATES */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: 3 Structured Dispatch Steps */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-extrabold text-[#2764D9] uppercase tracking-widest">
                Operating Model
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#10183D] tracking-tight font-sans">
                How TruckLayBay Operates
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                A structured booking workflow designed to connect cargo demand with confirmed commercial truck capacity.
              </p>
            </div>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex items-start space-x-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#EAF7FC] text-[#2764D9] font-black flex items-center justify-center shrink-0 text-sm">
                  01
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#10183D]">Specify Corridor & Cargo Requirements</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select origin and destination from active industrial highways. Define cargo weight and required equipment (20FT, 32FT, container, flatbed, or cold-chain reefer).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#EAF7FC] text-[#2764D9] font-black flex items-center justify-center shrink-0 text-sm">
                  02
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#10183D]">Receive Contractual Quotes</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Rates resolve deterministically from carrier rate cards. Transparent fuel surcharges (10% configured rate) and upfront accessorials are calculated with paise precision.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#EAF7FC] text-[#2764D9] font-black flex items-center justify-center shrink-0 text-sm">
                  03
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#10183D]">Confirm Vehicle Booking</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Confirm your chosen quote to allocate the specific truck registration and driver. Booking checks ensure the vehicle is reserved for your exact schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Transparency Card */}
          <div className="lg:col-span-5">
            <div id="pricing-schedule" className="p-8 rounded-3xl bg-[#10183D] text-white shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-[#18B6D9] font-bold uppercase">Pricing Schedule</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono font-medium">
                  Paise Precision
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-xl font-bold text-white tracking-tight">
                  Transparent Tariff Structure
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every quote is calculated strictly from established carrier rate cards with no dynamic surge pricing.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Total Amount Formula</span>
                  <p className="text-[#2764D9] font-extrabold text-sm">
                    totalAmount = baseRate + fuelSurcharge + accessorials
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Fuel Surcharge Rule</span>
                  <p className="text-[#18B6D9] font-extrabold text-sm">
                    fuelSurcharge = Math.round(baseRate × 0.10)
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px] block">Rate Validity Window</span>
                  <p className="text-slate-200 font-mono text-xs">
                    valid_from &le; pickup_date &lt; valid_until
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-normal border-t border-slate-800 pt-4">
                Quotes hold a strictly enforced 15-minute validity window from calculation time to ensure dispatch capacity.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACTIVE CORRIDORS HIGHWAY STRIP */}
      <section id="corridors" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-[#2764D9] uppercase tracking-widest">
              Highway Network
            </span>
            <h2 className="text-3xl font-black text-[#10183D] tracking-tight font-sans">
              Primary Industrial Corridors
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Direct full-truckload routes connecting manufacturing hubs with commercial terminals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lanes.map((lane) => (
            <div
              key={lane.lane_id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#2764D9] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#10183D]">
                  {lane.origin_city} <span className="text-[#2764D9]">→</span> {lane.destination_city}
                </span>
                <span className="text-xs text-[#2764D9] bg-[#EAF7FC] font-bold px-2.5 py-0.5 rounded-full border border-[#2764D9]/20 font-mono">
                  {lane.distance_km} km
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Direct Linehaul</span>
                <span className="text-emerald-700 font-bold font-mono">Corridor Active</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchQuoteById, bookQuote, extractErrorMessage } from '../services/api.js';
import { processDemoPayment, PAYMENT_METHODS, DEMO_UPI_ACCOUNTS, DEMO_NET_BANKS } from '../services/paymentSimulator.js';
import { formatINR, formatDate, formatWeight } from '../utils/formatters.js';
import LoadingState from '../components/LoadingState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  Truck,
  Building2,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  QrCode,
  Landmark,
  FileText,
  Info,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function CheckoutPage() {
  const { quoteId } = useParams();
  const navigate = useNavigate();

  // Quote loading state
  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState(null);

  // Workflow steps: 'review' | 'payment' | 'confirmation'
  const [currentStep, setCurrentStep] = useState('review');

  // Expiration timer
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.UPI);
  const [upiVpa, setUpiVpa] = useState('logistics.fleet@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardHolder, setCardHolder] = useState('TRUCKLAYBAY LOGISTICS ENTERPRISE');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('•••');
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Simulation controls
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Load quote on mount
  useEffect(() => {
    let isMounted = true;

    async function loadQuote() {
      setIsLoadingQuote(true);
      setQuoteError(null);
      try {
        const data = await fetchQuoteById(quoteId);
        if (isMounted) {
          setQuote(data);
        }
      } catch (err) {
        if (isMounted) {
          setQuoteError(extractErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoadingQuote(false);
        }
      }
    }

    if (quoteId) {
      loadQuote();
    }

    return () => {
      isMounted = false;
    };
  }, [quoteId]);

  // Quote Expiration Timer
  useEffect(() => {
    if (!quote) return;
    const expiryTimeStr = quote.quote_valid_until || quote.valid_until;
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
  }, [quote]);

  // Handle Demo Payment & Conditional Booking
  const handleSimulatePayment = async () => {
    if (!quote || isExpired) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Run Demo Payment Simulation
      const simResult = await processDemoPayment({
        quoteId: quote.quote_id,
        amount: Number(quote.total_amount),
        method: paymentMethod,
        details: {
          upiVpa: paymentMethod === PAYMENT_METHODS.UPI ? upiVpa : undefined,
          bank: paymentMethod === PAYMENT_METHODS.NET_BANKING ? selectedBank : undefined,
        },
        simulateFailure,
        latencyMs: 1000,
      });

      if (!simResult.success) {
        // Payment declined in demo mode — DO NOT call backend booking API
        setPaymentError(
          simResult.errorMessage ||
            'Simulated payment was declined. No reservation was created and no charge occurred.'
        );
        setIsProcessing(false);
        return;
      }

      setPaymentResult(simResult);

      // 2. Only after simulated payment succeeds, execute transactional booking
      const booking = await bookQuote(quote.quote_id);
      setConfirmedBooking(booking);
      setCurrentStep('confirmation');
    } catch (err) {
      setPaymentError(extractErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingQuote) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingState
          message="Retrieving Quotation & Carrier Tariffs..."
          subtitle="Verifying rate card guarantees and equipment availability."
        />
      </div>
    );
  }

  if (quoteError || !quote) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-6">
        <ErrorMessage
          title="Quotation Not Found"
          message={quoteError || `Quote #${quoteId} does not exist or could not be loaded.`}
        />
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#10183D] hover:bg-[#2764D9] text-white text-xs font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Corridor Search</span>
          </Link>
        </div>
      </div>
    );
  }

  const carrierName = quote.carrier_name || `Carrier #${quote.carrier_id || '—'}`;
  const truckReg = quote.registration_number || `Truck #${quote.truck_id || '—'}`;
  const totalAmount = Number(quote.total_amount) || 0;
  const baseRate = Number(quote.base_rate) || 0;
  const fuelSurcharge = Number(quote.fuel_surcharge) || 0;
  const accessorials = Number(quote.accessorial_charges) || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-[#2764D9] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Corridor Search</span>
        </button>

        <div className="flex items-center space-x-2 font-mono text-xs text-slate-500">
          <span>Quote Ref:</span>
          <span className="font-bold text-[#10183D] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
            #{quote.quote_id}
          </span>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto text-xs font-bold">
          {/* Step 1 */}
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                currentStep === 'review'
                  ? 'bg-[#2764D9] text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {currentStep !== 'review' ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </span>
            <span className={currentStep === 'review' ? 'text-[#10183D]' : 'text-slate-500'}>
              Review Shipment
            </span>
          </div>

          <div className="flex-1 mx-4 h-0.5 bg-slate-200" />

          {/* Step 2 */}
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                currentStep === 'payment'
                  ? 'bg-[#2764D9] text-white'
                  : currentStep === 'confirmation'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {currentStep === 'confirmation' ? <CheckCircle2 className="w-4 h-4" /> : '2'}
            </span>
            <span className={currentStep === 'payment' ? 'text-[#10183D]' : 'text-slate-500'}>
              Demo Payment
            </span>
          </div>

          <div className="flex-1 mx-4 h-0.5 bg-slate-200" />

          {/* Step 3 */}
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                currentStep === 'confirmation'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </span>
            <span className={currentStep === 'confirmation' ? 'text-[#10183D]' : 'text-slate-500'}>
              Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Demo Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#EAF7FC] border border-[#2764D9]/25 flex items-start space-x-3 text-xs text-slate-700">
        <Info className="w-5 h-5 text-[#2764D9] mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <p className="font-bold text-[#10183D]">
            Demo checkout — no real payment is processed and no money is charged.
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            This sandbox environment simulates payment processing to demonstrate transactional booking safety, double-booking exclusion, and quote expiry validation.
          </p>
        </div>
      </div>

      {/* Quote Expiration Warning */}
      {isExpired && currentStep !== 'confirmation' && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-3">
          <div className="flex items-center space-x-2.5 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Quotation Validity Expired (15-Minute Window Elapsed)</span>
          </div>
          <p className="text-xs text-red-700 leading-relaxed">
            The contractual validity window for Quote #{quote.quote_id} has expired. Rate cards must be re-evaluated to guarantee commercial capacity.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recalculate Current Rates</span>
          </button>
        </div>
      )}

      {/* STEP 1: REVIEW SHIPMENT */}
      {currentStep === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Shipment & Route Review */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#2764D9] uppercase tracking-wider">
                    Step 1 of 3
                  </span>
                  <h2 className="text-2xl font-black text-[#10183D] tracking-tight">
                    Shipment Review
                  </h2>
                </div>

                {/* Expiration Timer Badge */}
                {timeLeft && (
                  <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-[#2764D9]'}`} />
                    <span className={isExpired ? 'text-red-600 font-bold' : 'text-slate-700'}>
                      {isExpired ? 'Expired' : `${timeLeft} remaining`}
                    </span>
                  </div>
                )}
              </div>

              {/* Corridor & Dates */}
              <div className="p-5 rounded-2xl bg-[#FBFAF7] border border-slate-200/90 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-[#2764D9]" />
                  <span>Freight Corridor</span>
                </div>

                <div className="text-lg font-black text-[#10183D] flex items-center space-x-2">
                  <span>{quote.origin_city}</span>
                  <span className="text-[#2764D9]">→</span>
                  <span>{quote.destination_city}</span>
                  {quote.distance_km && (
                    <span className="text-xs text-slate-500 font-normal font-mono">
                      ({quote.distance_km} km)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Pickup Date:</span>
                    <strong className="text-[#10183D] font-bold">
                      {formatDate(quote.pickup_date)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Delivery Date:</span>
                    <strong className="text-[#10183D] font-bold">
                      {formatDate(quote.delivery_date)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Carrier & Equipment Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-[#2764D9]" />
                    <span>Contracted Carrier</span>
                  </div>
                  <p className="font-extrabold text-sm text-[#10183D]">{carrierName}</p>
                  <p className="text-[11px] text-slate-500">Verified Fleet Operator</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <Truck className="w-3.5 h-3.5 text-[#2764D9]" />
                    <span>Allocated Vehicle</span>
                  </div>
                  <p className="font-mono font-bold text-sm text-[#10183D]">{truckReg}</p>
                  <p className="text-[11px] text-slate-500">
                    Capacity: {formatWeight(quote.capacity_kg)} • Load: {formatWeight(quote.weight_kg)}
                  </p>
                </div>
              </div>

              {/* Assurance note */}
              <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Capacity verified. Proceed to payment simulation to finalize vehicle reservation.
                </span>
              </div>

              {/* Continue button */}
              <button
                type="button"
                disabled={isExpired}
                onClick={() => setCurrentStep('payment')}
                className={`w-full py-4 rounded-xl font-black text-sm text-white flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md ${
                  isExpired
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#2764D9] hover:bg-[#1E52B7] active:scale-[0.99] hover:shadow-lg'
                }`}
              >
                <span>Proceed to Demo Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Fare Breakdown Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 sm:p-7 rounded-3xl bg-[#10183D] text-white shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-[#18B6D9] font-bold uppercase tracking-wider">
                  Fare Breakdown
                </span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded font-mono">
                  Paise-Precision
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Contractual Base Freight</span>
                  <span className="font-semibold text-white">{formatINR(baseRate)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex flex-col">
                    <span>Fuel Surcharge</span>
                    <span className="text-[10px] text-slate-400 font-mono">10% configured rate</span>
                  </div>
                  <span className="font-semibold text-white">{formatINR(fuelSurcharge)}</span>
                </div>

                {accessorials > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Accessorial & Equipment Handling</span>
                    <span className="font-semibold text-white">{formatINR(accessorials)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">Total Quoted Fare</span>
                    <span className="text-[10px] text-slate-400">All statutory rates inclusive</span>
                  </div>
                  <span className="text-3xl font-black text-[#18B6D9]">{formatINR(totalAmount)}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-normal border-t border-slate-800 pt-3">
                Commercial rates resolved from Carrier #{quote.carrier_id} rate schedule. Valid for scheduled pickup window.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: DEMO PAYMENT SIMULATION */}
      {currentStep === 'payment' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Demo Payment Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#2764D9] uppercase tracking-wider">
                    Step 2 of 3
                  </span>
                  <h2 className="text-2xl font-black text-[#10183D] tracking-tight">
                    Demo Payment Simulation
                  </h2>
                </div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF7FC] text-[#2764D9] border border-[#2764D9]/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test Mode</span>
                </span>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Demo Payment Rail:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PAYMENT_METHODS.UPI)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      paymentMethod === PAYMENT_METHODS.UPI
                        ? 'border-[#2764D9] bg-[#EAF7FC]/50 text-[#10183D] ring-2 ring-[#2764D9]/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-[#2764D9]" />
                    <div>
                      <span className="text-xs font-extrabold block">UPI Demo</span>
                      <span className="text-[10px] text-slate-500">Virtual Address</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      paymentMethod === PAYMENT_METHODS.CARD
                        ? 'border-[#2764D9] bg-[#EAF7FC]/50 text-[#10183D] ring-2 ring-[#2764D9]/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-[#2764D9]" />
                    <div>
                      <span className="text-xs font-extrabold block">Corporate Card</span>
                      <span className="text-[10px] text-slate-500">Debit / Credit</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod(PAYMENT_METHODS.NET_BANKING)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      paymentMethod === PAYMENT_METHODS.NET_BANKING
                        ? 'border-[#2764D9] bg-[#EAF7FC]/50 text-[#10183D] ring-2 ring-[#2764D9]/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Landmark className="w-5 h-5 text-[#2764D9]" />
                    <div>
                      <span className="text-xs font-extrabold block">Net Banking</span>
                      <span className="text-[10px] text-slate-500">Commercial INB</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Dynamic Payment Method Details Form */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                {paymentMethod === PAYMENT_METHODS.UPI && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Demo UPI ID (VPA):</label>
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-[#10183D] focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9]"
                        placeholder="your-company@okhdfcbank"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-[11px] text-slate-500">Quick Demo Handles:</span>
                      {DEMO_UPI_ACCOUNTS.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setUpiVpa(acc.label)}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:border-[#2764D9] hover:text-[#2764D9] cursor-pointer"
                        >
                          {acc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === PAYMENT_METHODS.CARD && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Commercial Card Number:</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-[#10183D] focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Expiry (MM/YY):</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-[#10183D]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">CVV:</label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-mono text-[#10183D]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === PAYMENT_METHODS.NET_BANKING && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Select Corporate Bank:</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-[#10183D] focus:outline-none focus:ring-2 focus:ring-[#2764D9]/20 focus:border-[#2764D9]"
                    >
                      {DEMO_NET_BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Demo Mode Outcome Selector (Success vs Simulated Failure) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                    <span>Simulation Outcome Sandbox</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-800 uppercase font-bold bg-amber-100 px-2 py-0.5 rounded">
                    Verification Tool
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSimulateFailure(false)}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      !simulateFailure
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Simulate Success
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateFailure(true)}
                    className={`py-2 px-3 rounded-lg border font-bold text-center transition-all cursor-pointer ${
                      simulateFailure
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Simulate Failure
                  </button>
                </div>
                <p className="text-[11px] text-amber-900 leading-normal">
                  {simulateFailure
                    ? 'Failure Mode active: The demo simulator will return a simulated decline. The booking API will NOT be invoked, testing failure recovery.'
                    : 'Success Mode active: The demo simulator will approve mock settlement, and the system will proceed to lock capacity and book the vehicle.'}
                </p>
              </div>

              {/* Payment Error Banner */}
              {paymentError && (
                <ErrorMessage
                  title="Demo Payment Verification Failed"
                  message={paymentError}
                />
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('review')}
                  disabled={isProcessing}
                  className="px-5 py-3.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ← Back to Review
                </button>

                <button
                  type="button"
                  disabled={isProcessing || isExpired}
                  onClick={handleSimulatePayment}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md ${
                    isProcessing
                      ? 'bg-[#2764D9]/80 text-white cursor-wait'
                      : isExpired
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-[#2764D9] hover:bg-[#1E52B7] active:scale-[0.99] text-white hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Simulating Payment & Reserving Fleet...</span>
                    </>
                  ) : (
                    <>
                      <span>Simulate Payment & Confirm Booking ({formatINR(totalAmount)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#10183D] border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Corridor:</span>
                  <span className="font-bold text-[#10183D]">
                    {quote.origin_city} → {quote.destination_city}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Carrier:</span>
                  <span className="font-semibold text-[#10183D]">{carrierName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Vehicle:</span>
                  <span className="font-mono font-semibold text-[#10183D]">{truckReg}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Scheduled Pickup:</span>
                  <span className="font-semibold text-[#10183D]">
                    {formatDate(quote.pickup_date)}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-black text-sm text-[#10183D]">
                  <span>Total Amount Due:</span>
                  <span className="text-[#2764D9] text-base">{formatINR(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: BOOKING CONFIRMATION */}
      {currentStep === 'confirmation' && confirmedBooking && (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#10183D] text-white p-8 sm:p-10 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-[#2764D9]/20 border border-[#2764D9]/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-[#2764D9]" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-[#18B6D9] font-bold">
                    Booking Confirmed
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
                    Freight Reference #{confirmedBooking.booking_id}
                  </h2>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-4 sm:pt-0">
                <span className="text-xs text-slate-400 font-medium">Contractual Settled Fare</span>
                <span className="text-3xl font-black text-white">
                  {formatINR(confirmedBooking.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Two Prominent Demo Distinctions */}
          <div className="p-6 bg-[#EAF7FC] border-b border-[#2764D9]/20 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2.5 text-xs text-slate-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Booking confirmed in TruckLayBay demo environment</span>
            </div>
            <div className="flex items-center space-x-2.5 text-xs text-slate-800 font-bold">
              <Info className="w-4 h-4 text-[#2764D9] shrink-0" />
              <span>Demo payment simulation successful — no real payment processed</span>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-8 sm:p-10 space-y-8 bg-[#FBFAF7]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Corridor & Schedule */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-[#2764D9]" />
                  <span>Route & Schedule</span>
                </div>
                <div className="text-base font-extrabold text-[#10183D] flex items-center space-x-2">
                  <span>{confirmedBooking.origin_city}</span>
                  <span className="text-[#2764D9]">→</span>
                  <span>{confirmedBooking.destination_city}</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pickup Date:</span>
                    <strong className="text-[#10183D]">
                      {formatDate(confirmedBooking.pickup_date)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Delivery Date:</span>
                    <strong className="text-[#10183D]">
                      {formatDate(confirmedBooking.delivery_date)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Carrier & Truck */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-[#2764D9]" />
                  <span>Allocated Fleet Vehicle</span>
                </div>
                <div className="space-y-1">
                  <div className="text-base font-extrabold text-[#10183D] truncate">
                    {confirmedBooking.carrier_name}
                  </div>
                  <div className="pt-1 flex items-center space-x-2">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-bold text-[#10183D]">
                      {confirmedBooking.registration_number}
                    </span>
                    <span className="text-[11px] text-[#2764D9] bg-[#EAF7FC] px-2.5 py-0.5 rounded font-bold border border-[#2764D9]/20">
                      Allocated
                    </span>
                  </div>
                </div>
              </div>

              {/* Demo Payment Metadata */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#10183D] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#2764D9]" />
                  <span>Simulated Settlement</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Demo Ref:</span>
                    <span className="font-mono text-[11px] font-bold text-[#10183D]">
                      {paymentResult?.demoReference || 'DEMO-TXN-SIMULATED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-bold text-[#2764D9]">{paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-emerald-700">
                      {confirmedBooking.booking_status || 'CONFIRMED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-xs font-bold text-[#10183D] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ← Book Another Shipment
              </button>

              <Link
                to={`/bookings/${confirmedBooking.booking_id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3 rounded-xl bg-[#10183D] hover:bg-[#2764D9] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Booking Record & Bill of Lading</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

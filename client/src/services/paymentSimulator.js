/**
 * Demo Payment Simulator Service
 *
 * Simulates commercial freight payment settlement for demonstration and testing.
 * IMPORTANT: Demo environment only — no real payment is processed and no money is charged.
 */

export const PAYMENT_METHODS = {
  UPI: 'UPI',
  CARD: 'CARD',
  NET_BANKING: 'NET_BANKING',
};

export const DEMO_UPI_ACCOUNTS = [
  { id: 'hdfc', label: 'logistics.fleet@okhdfcbank', handle: 'HDFC Bank Corporate UPI' },
  { id: 'icici', label: 'freight.dispatch@icici', handle: 'ICICI Commercial UPI' },
  { id: 'sbi', label: 'transporter@sbi', handle: 'State Bank Corporate UPI' },
];

export const DEMO_NET_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank Commercial Corporate' },
  { id: 'ICICI', name: 'ICICI Bank Corporate Banking' },
  { id: 'SBI', name: 'State Bank of India (INB Commercial)' },
  { id: 'AXIS', name: 'Axis Bank Corporate Direct' },
  { id: 'KOTAK', name: 'Kotak Mahindra Commercial' },
];

/**
 * Simulates payment processing with deterministic delay and demo reference generation.
 *
 * @param {Object} options
 * @param {number|string} options.quoteId - Associated quote identifier
 * @param {number} options.amount - Total fare to simulate
 * @param {string} options.method - 'UPI' | 'CARD' | 'NET_BANKING'
 * @param {Object} [options.details] - Method-specific simulated details
 * @param {boolean} [options.simulateFailure=false] - When true, triggers a simulated gateway decline
 * @param {number} [options.latencyMs=900] - Simulated gateway latency
 * @returns {Promise<Object>} Simulation result
 */
export async function processDemoPayment({
  quoteId,
  amount,
  method = PAYMENT_METHODS.UPI,
  details = {},
  simulateFailure = false,
  latencyMs = 900,
}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      const randHex = Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
      const demoReference = `DEMO-PAY-${Date.now().toString(36).toUpperCase()}-${randHex}`;

      if (simulateFailure) {
        resolve({
          success: false,
          quoteId,
          amount,
          method,
          errorCode: 'DEMO_DECLINE_SIMULATED',
          errorMessage:
            'Demo payment simulation declined: Simulated insufficient funds or mock gateway timeout.',
          demoReference,
          timestamp: now,
          isSimulated: true,
        });
      } else {
        resolve({
          success: true,
          quoteId,
          amount,
          method,
          demoReference,
          timestamp: now,
          isSimulated: true,
          message: 'Demo payment simulation successful — no real payment processed',
        });
      }
    }, latencyMs);
  });
}

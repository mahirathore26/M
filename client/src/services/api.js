import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Standardize error messages from Express backend (AppError format: { error: string })
 */
export function extractErrorMessage(error) {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message === 'Network Error') {
    return 'Unable to reach the server. Please verify backend connection.';
  }
  return error.message || 'An unexpected error occurred.';
}

export async function fetchHealth() {
  const { data } = await api.get('/api/health');
  return data;
}

export async function fetchLanes() {
  const { data } = await api.get('/api/lanes');
  return data;
}

export async function fetchCapabilities() {
  const { data } = await api.get('/api/capabilities');
  return data;
}

export async function createLoad({ laneId, pickupDate, deliveryDate, weightKg, capabilityIds }) {
  const payload = {
    laneId: Number(laneId),
    pickupDate,
    deliveryDate,
    weightKg: Number(weightKg),
    ...(capabilityIds && capabilityIds.length > 0 ? { capabilityIds: capabilityIds.map(Number) } : {}),
  };
  const { data } = await api.post('/api/loads', payload);
  return data;
}

export async function fetchLoadById(loadId) {
  const { data } = await api.get(`/api/loads/${loadId}`);
  return data;
}

export async function generateQuotesForLoad(loadId) {
  const { data } = await api.post(`/api/loads/${loadId}/quotes`);
  return data;
}

export async function fetchQuotesForLoad(loadId) {
  const { data } = await api.get(`/api/loads/${loadId}/quotes`);
  return data;
}

export async function fetchQuoteById(quoteId) {
  const { data } = await api.get(`/api/quotes/${quoteId}`);
  return data;
}

export async function bookQuote(quoteId) {
  const { data } = await api.post(`/api/quotes/${quoteId}/book`);
  return data;
}

export async function fetchBookingById(bookingId) {
  const { data } = await api.get(`/api/bookings/${bookingId}`);
  return data;
}

export default api;

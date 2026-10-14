/**
 * Format currency in Indian Rupees (INR)
 */
export function formatINR(amount) {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric) || numeric === null || numeric === undefined) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Format date nicely e.g. "15 Oct 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Format weight with thousands separator
 */
export function formatWeight(kg) {
  const num = Number(kg);
  if (isNaN(num)) return `${kg} kg`;
  return `${num.toLocaleString('en-IN')} kg`;
}

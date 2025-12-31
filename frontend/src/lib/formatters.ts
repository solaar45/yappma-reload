// Utility functions for formatting API data

/**
 * Format backend decimal string (e.g. "5000.50") to currency display
 */
export function formatCurrency(value: string | number, currency: string = 'EUR'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
  }).format(numValue);
}

/**
 * Format ISO date string to locale date
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculate percentage change
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
/**
 * Format a number in Indian numbering system (e.g. 1,23,456.78)
 */
export function formatIndianNumber(value: number, decimals = 2): string {
  if (isNaN(value)) return '0';
  const [intPart, decPart] = Math.abs(value).toFixed(decimals).split('.');
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const formatted =
    rest.length > 0
      ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;
  const prefix = value < 0 ? '-' : '';
  return `${prefix}${formatted}${decimals > 0 ? '.' + decPart : ''}`;
}

/**
 * Format as ₹ + Indian number (e.g. ₹1,23,456.78)
 */
export function formatCurrency(value: number, decimals = 2): string {
  return '₹' + formatIndianNumber(value, decimals);
}

/**
 * Compact currency (₹12.5L / ₹1.2Cr) — full value as tooltip hint
 */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_00_00_000) {
    return '₹' + (value / 1_00_00_000).toFixed(2) + 'Cr';
  }
  if (Math.abs(value) >= 1_00_000) {
    return '₹' + (value / 1_00_000).toFixed(2) + 'L';
  }
  if (Math.abs(value) >= 1_000) {
    return '₹' + (value / 1_000).toFixed(1) + 'K';
  }
  return formatCurrency(value, 0);
}

/**
 * Format date as DD/MM/YYYY
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const regionToLocaleMap: Record<string, string> = {
  'US_EAST_NY': 'en-US',
  'EU_WEST_LDN': 'en-GB',
  'AF_WEST_LOS': 'en-NG',
};

export function formatCurrency(value: number, currency: string = 'USD', region: string = 'US_EAST_NY') {
  const locale = regionToLocaleMap[region] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(date: string | Date, region: string = 'US_EAST_NY') {
  const locale = regionToLocaleMap[region] || 'en-US';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

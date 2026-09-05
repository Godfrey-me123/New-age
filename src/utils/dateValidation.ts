/**
 * Strict Date of Birth (DOB) Validation and Normalization
 * Standard format: DD MMM YYYY (e.g. 01 MAR 1998)
 *
 * Rules:
 * - Day = 2 digits (01-31)
 * - Month = 3-letter uppercase abbreviation (JAN, FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC)
 * - Year = 4 digits (1900 to current year)
 * - Exactly one space between DD, MMM, and YYYY
 * - No slashes, no hyphens, no numeric months, no full month names
 */

export const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

export type MonthAbbr = (typeof MONTH_ABBREVIATIONS)[number];

const MONTH_INDEX_MAP: Record<string, number> = {
  JAN: 0,
  FEB: 1,
  MAR: 2,
  APR: 3,
  MAY: 4,
  JUN: 5,
  JUL: 6,
  AUG: 7,
  SEP: 8,
  OCT: 9,
  NOV: 10,
  DEC: 11,
};

/**
 * Validates strictly: DD MMM YYYY
 * e.g., 01 MAR 1998
 */
export function validateDdMmmYyyy(input: string): { isValid: boolean; error?: string } {
  if (!input || input.trim() === '') {
    return { isValid: false, error: 'Date of birth is required.' };
  }

  const trimmed = input.trim().toUpperCase();
  const parts = trimmed.split(' ');

  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'Date must follow strict format: DD MMM YYYY (e.g., 01 MAR 1998)',
    };
  }

  const [dayStr, monthStr, yearStr] = parts;

  // Day check
  if (!/^\d{2}$/.test(dayStr)) {
    return { isValid: false, error: 'Day must be exactly 2 digits (e.g., 01, 15).' };
  }
  const day = parseInt(dayStr, 10);

  // Month check
  if (!MONTH_ABBREVIATIONS.includes(monthStr as MonthAbbr)) {
    return {
      isValid: false,
      error: `Month must be 3-letter uppercase code (${MONTH_ABBREVIATIONS.join(', ')}).`,
    };
  }
  const monthIndex = MONTH_INDEX_MAP[monthStr];

  // Year check
  if (!/^\d{4}$/.test(yearStr)) {
    return { isValid: false, error: 'Year must be exactly 4 digits (e.g., 1998).' };
  }
  const year = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear) {
    return { isValid: false, error: `Year must be between 1900 and ${currentYear}.` };
  }

  // Days in month validation (including leap years)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return {
      isValid: false,
      error: `${monthStr} ${year} only has ${daysInMonth} days.`,
    };
  }

  return { isValid: true };
}

/**
 * Converts YYYYMMDD block (from NIDA) directly to DD MMM YYYY
 * e.g. "19980301" -> "01 MAR 1998"
 */
export function convertNidaDobBlockToDdMmmYyyy(dobBlock: string): string | null {
  if (!dobBlock || dobBlock.length !== 8 || !/^\d{8}$/.test(dobBlock)) {
    return null;
  }

  const year = parseInt(dobBlock.slice(0, 4), 10);
  const month = parseInt(dobBlock.slice(4, 6), 10);
  const day = parseInt(dobBlock.slice(6, 8), 10);

  if (month < 1 || month > 12) return null;
  const monthAbbr = MONTH_ABBREVIATIONS[month - 1];
  const dayStr = day.toString().padStart(2, '0');

  return `${dayStr} ${monthAbbr} ${year}`;
}

/**
 * Converts ISO date (YYYY-MM-DD) to DD MMM YYYY
 * e.g. "1998-03-01" -> "01 MAR 1998"
 */
export function convertIsoToDdMmmYyyy(isoDate: string): string | null {
  if (!isoDate) return null;
  const parts = isoDate.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12) return null;

  const monthAbbr = MONTH_ABBREVIATIONS[month - 1];
  const dayStr = day.toString().padStart(2, '0');

  return `${dayStr} ${monthAbbr} ${year}`;
}

/**
 * Normalizes user input into DD MMM YYYY if possible
 */
export function normalizeDateInput(val: string): string {
  if (!val) return '';
  // If already strict DD MMM YYYY:
  const upper = val.trim().toUpperCase();
  if (/^\d{2}\s[A-Z]{3}\s\d{4}$/.test(upper)) {
    return upper;
  }

  // If ISO YYYY-MM-DD:
  if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const converted = convertIsoToDdMmmYyyy(val.trim());
    if (converted) return converted;
  }

  return upper;
}

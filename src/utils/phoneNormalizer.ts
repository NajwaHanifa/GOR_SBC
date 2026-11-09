/**
 * Normalizes Indonesian telephone numbers to international +62 format.
 * Examples:
 * - 081234567890 -> +6281234567890
 * - 6281234567890 -> +6281234567890
 * - +6281234567890 -> +6281234567890
 * - 0812-3456-7890 -> +6281234567890
 */
export function normalizeIndonesianPhone(input: string): string {
  if (!input) return '';
  // Strip non-digit characters except leading +
  let cleaned = input.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Indonesian mobile numbers usually start with 8
  return `+62${cleaned}`;
}

export function isValidIndonesianPhone(input: string): boolean {
  if (!input) return false;
  const normalized = normalizeIndonesianPhone(input);
  // Must start with +628 and have 10-15 characters total (+62 + 9 to 13 digits)
  const regex = /^\+628[1-9][0-9]{7,11}$/;
  return regex.test(normalized);
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '-';
  const norm = normalizeIndonesianPhone(phone);
  // +6281234567890 -> 0812-3456-7890 for friendly display
  if (norm.startsWith('+62')) {
    const local = '0' + norm.substring(3);
    if (local.length >= 10) {
      return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
    }
    return local;
  }
  return phone;
}

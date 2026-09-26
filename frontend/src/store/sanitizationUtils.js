/**
 * Data Sanitization, Export Protection, and Phone Formatting Utilities
 * Protects against CSV formula injection, normalizes phone numbers, formats filesizes, and slugifies strings.
 */

export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);

  // Guard against CSV / Spreadsheet formula injection (=, +, -, @, \t, \r)
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some(prefix => str.startsWith(prefix))) {
    return `'${str}`;
  }

  // Wrap in quotes if it contains commas, double quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function normalizeEthiopianPhone(phone) {
  if (!phone) return '';
  // Strip all non-numeric characters except leading '+'
  const cleaned = String(phone).trim().replace(/[^\d+]/g, '');

  // Standard format: +251 9XX XXX XXX or +251 7XX XXX XXX
  if (cleaned.startsWith('+251')) {
    const local = cleaned.slice(4);
    if (local.length === 9) {
      return `+251 ${local.slice(0, 1)} ${local.slice(1, 4)} ${local.slice(4)}`;
    }
    return cleaned;
  }

  if (cleaned.startsWith('09') || cleaned.startsWith('07')) {
    const local = cleaned.slice(1); // 9XXXXXXXX
    return `+251 ${local.slice(0, 1)} ${local.slice(1, 4)} ${local.slice(4)}`;
  }

  if (cleaned.startsWith('251') && cleaned.length === 12) {
    const local = cleaned.slice(3);
    return `+251 ${local.slice(0, 1)} ${local.slice(1, 4)} ${local.slice(4)}`;
  }

  return cleaned;
}

export function slugifyTitle(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text) return '';
  const str = String(text).trim();
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function formatFileSize(bytes) {
  const b = Number(bytes);
  if (isNaN(b) || b <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  const size = Math.round((b / Math.pow(1024, i)) * 100) / 100;
  return `${size} ${units[i]}`;
}

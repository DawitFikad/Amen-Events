import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeCsvCell,
  normalizeEthiopianPhone,
  slugifyTitle,
  truncateText,
  formatFileSize
} from '../frontend/src/store/sanitizationUtils.js';

describe('Data Sanitization & Export Security Suite', () => {
  describe('sanitizeCsvCell', () => {
    it('escapes Excel formula injection characters with leading single quote', () => {
      assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
      assert.equal(sanitizeCsvCell('+cmd|"/C calc"!A0'), "'+cmd|\"/C calc\"!A0");
      assert.equal(sanitizeCsvCell('-123'), "'-123");
      assert.equal(sanitizeCsvCell('@special'), "'@special");
    });

    it('wraps strings containing commas in quotes', () => {
      assert.equal(sanitizeCsvCell('Addis Ababa, Ethiopia'), '"Addis Ababa, Ethiopia"');
    });

    it('escapes embedded double quotes by doubling them', () => {
      assert.equal(sanitizeCsvCell('Amen "Premium" Gala'), '"Amen ""Premium"" Gala"');
    });

    it('returns empty string for null or undefined', () => {
      assert.equal(sanitizeCsvCell(null), '');
      assert.equal(sanitizeCsvCell(undefined), '');
    });

    it('leaves standard alphanumeric text untouched', () => {
      assert.equal(sanitizeCsvCell('Conference Room A'), 'Conference Room A');
    });
  });

  describe('normalizeEthiopianPhone', () => {
    it('normalizes 09 local number to formatted international', () => {
      assert.equal(normalizeEthiopianPhone('0911223344'), '+251 9 112 23344');
    });

    it('normalizes 07 Safaricom local number to formatted international', () => {
      assert.equal(normalizeEthiopianPhone('0712345678'), '+251 7 123 45678');
    });

    it('normalizes unformatted +251 international string', () => {
      assert.equal(normalizeEthiopianPhone('+251911223344'), '+251 9 112 23344');
    });

    it('handles number with spaces and dashes cleanly', () => {
      assert.equal(normalizeEthiopianPhone('0911-22-33-44'), '+251 9 112 23344');
    });

    it('returns empty string when given empty input', () => {
      assert.equal(normalizeEthiopianPhone(''), '');
    });
  });

  describe('slugifyTitle', () => {
    it('converts event title into a clean URL and filename slug', () => {
      assert.equal(slugifyTitle('Annual Tech Summit & Expo 2026!'), 'annual-tech-summit-expo-2026');
    });

    it('removes repeated hyphens and trims edges', () => {
      assert.equal(slugifyTitle('---Amen   Gala ---'), 'amen-gala');
    });
  });

  describe('truncateText', () => {
    it('truncates long strings with ellipsis', () => {
      const long = 'This is an extensive description of a major corporate festival in Addis Ababa';
      const truncated = truncateText(long, 25);
      assert.equal(truncated.length, 25);
      assert.ok(truncated.endsWith('...'));
    });

    it('leaves short strings untouched', () => {
      assert.equal(truncateText('Short text', 50), 'Short text');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes into KB and MB cleanly', () => {
      assert.equal(formatFileSize(1024), '1 KB');
      assert.equal(formatFileSize(1048576), '1 MB');
      assert.equal(formatFileSize(5242880), '5 MB');
    });

    it('handles 0 bytes safely', () => {
      assert.equal(formatFileSize(0), '0 B');
    });
  });
});

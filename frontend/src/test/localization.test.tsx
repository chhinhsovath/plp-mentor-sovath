import { describe, it, expect } from 'vitest';
import { 
  formatKhmerDate, 
  formatNumber, 
  toKhmerNumerals, 
  fromKhmerNumerals, 
  validateKhmerText, 
  isPrimarilyKhmer, 
  formatBuddhistYear,
  formatKhmerTime,
  formatKhmerDateRange,
  formatKhmerRelativeTime,
  parseKhmerDate,
  getCurrentKhmerDate,
  getCurrentBuddhistYear
} from '../utils/localization';

describe('Localization Utilities', () => {
  describe('Khmer Numerals', () => {
    it('should convert Arabic numerals to Khmer numerals', () => {
      expect(toKhmerNumerals(123)).toBe('១២៣');
      expect(toKhmerNumerals('456')).toBe('៤៥៦');
      expect(toKhmerNumerals('0123456789')).toBe('០១២៣៤៥៦៧៨៩');
    });

    it('should convert Khmer numerals to Arabic numerals', () => {
      expect(fromKhmerNumerals('១២៣')).toBe('123');
      expect(fromKhmerNumerals('៤៥៦')).toBe('456');
      expect(fromKhmerNumerals('០១២៣៤៥៦៧៨៩')).toBe('0123456789');
    });

    it('should handle mixed text correctly', () => {
      expect(toKhmerNumerals('Year 2023')).toBe('Year ២០២៣');
      expect(fromKhmerNumerals('Year ២០២៣')).toBe('Year 2023');
    });
  });

  describe('Number Formatting', () => {
    it('should format numbers with Khmer locale', () => {
      const formatted = formatNumber(1234.56, true);
      expect(formatted).toContain('១'); // Should contain at least one Khmer numeral
    });
  });

  describe('Date Formatting', () => {
    it('should format dates with Khmer locale', () => {
      const date = new Date(2023, 0, 15); // January 15, 2023
      const formatted = formatKhmerDate(date);
      expect(formatted).toContain('១៥'); // Should contain day in Khmer numerals
    });

    it('should calculate Buddhist Era year correctly', () => {
      const date = new Date(2023, 0, 1);
      const buddhistYear = formatBuddhistYear(date, true);
      expect(buddhistYear).toBe('២៥៦៦'); // 2023 + 543 = 2566 in Khmer numerals
    });
    
    it('should format time in Khmer', () => {
      const date = new Date(2023, 0, 15, 14, 30); // January 15, 2023, 2:30 PM
      const formatted = formatKhmerTime(date);
      expect(formatted).toContain('១៤:៣០'); // Should contain time in Khmer numerals
    });
    
    it('should format date range in Khmer', () => {
      const startDate = new Date(2023, 0, 15);
      const endDate = new Date(2023, 0, 20);
      const formatted = formatKhmerDateRange(startDate, endDate);
      expect(formatted).toContain('១៥'); // Should contain start day in Khmer numerals
      expect(formatted).toContain('២០'); // Should contain end day in Khmer numerals
    });
    
    it('should format relative time in Khmer', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const formatted = formatKhmerRelativeTime(oneHourAgo);
      expect(formatted).toContain('១'); // Should contain "1" in Khmer numerals
      expect(formatted).toContain('ម៉ោង'); // Should contain "hour" in Khmer
    });
    
    it('should parse Khmer date string', () => {
      const dateStr = '១៥ មករា ២០២៣'; // January 15, 2023 in Khmer
      const parsed = parseKhmerDate(dateStr);
      expect(parsed?.getFullYear()).toBe(2023);
      expect(parsed?.getMonth()).toBe(0); // January is 0
      expect(parsed?.getDate()).toBe(15);
    });
    
    it('should get current date in Khmer format', () => {
      const currentDate = getCurrentKhmerDate();
      expect(currentDate).toBeTruthy();
      // This is hard to test precisely since it depends on the current date
    });
    
    it('should get current Buddhist year', () => {
      const currentYear = new Date().getFullYear();
      const expectedBuddhistYear = currentYear + 543;
      const buddhistYear = getCurrentBuddhistYear(false);
      expect(buddhistYear).toBe(expectedBuddhistYear.toString());
    });
  });

  describe('Khmer Text Validation', () => {
    it('should detect Khmer script', () => {
      expect(validateKhmerText('ខ្មែរ')).toBe(true);
      expect(validateKhmerText('English')).toBe(false);
      expect(validateKhmerText('ខ្មែរ English')).toBe(true); // Mixed text should return true if any Khmer
    });

    it('should determine if text is primarily Khmer', () => {
      expect(isPrimarilyKhmer('ខ្មែរ')).toBe(true);
      expect(isPrimarilyKhmer('English')).toBe(false);
      expect(isPrimarilyKhmer('ខ្មែរខ្មែរខ្មែរ English')).toBe(true);
    });
  });
});
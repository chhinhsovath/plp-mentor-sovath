import { format as formatDate, parse, isValid } from 'date-fns';
import { km } from 'date-fns/locale';

// Khmer numerals mapping
const khmerNumerals: Record<string, string> = {
  '0': '០',
  '1': '១',
  '2': '២',
  '3': '៣',
  '4': '៤',
  '5': '៥',
  '6': '៦',
  '7': '៧',
  '8': '៨',
  '9': '៩'
};

// Khmer month names
export const khmerMonthNames = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

// Khmer day names
export const khmerDayNames = [
  'អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'
];

// Convert Arabic numerals to Khmer numerals
export const toKhmerNumerals = (num: number | string): string => {
  return String(num).replace(/[0-9]/g, match => khmerNumerals[match] || match);
};

// Convert Khmer numerals to Arabic numerals
export const fromKhmerNumerals = (str: string): string => {
  const reverseMap: Record<string, string> = {};
  Object.entries(khmerNumerals).forEach(([key, value]) => {
    reverseMap[value] = key;
  });
  
  return str.replace(/[០១២៣៤៥៦៧៨៩]/g, match => reverseMap[match] || match);
};

// Format number with Khmer locale
export const formatNumber = (num: number, useKhmerNumerals = true): string => {
  // Format with thousand separators
  const formatted = new Intl.NumberFormat('km-KH').format(num);
  
  // Convert to Khmer numerals if requested
  return useKhmerNumerals ? toKhmerNumerals(formatted) : formatted;
};

// Format currency in Cambodian Riel
export const formatCurrency = (amount: number, useKhmerNumerals = true): string => {
  const formatted = new Intl.NumberFormat('km-KH', {
    style: 'currency',
    currency: 'KHR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  return useKhmerNumerals ? toKhmerNumerals(formatted) : formatted;
};

// Format date with Khmer locale
export const formatKhmerDate = (date: Date | string | number, formatStr: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to formatKhmerDate:', date);
    return '';
  }
  
  // Format date using date-fns with Khmer locale
  const formatted = formatDate(dateObj, formatStr, { locale: km });
  
  // Convert any remaining numerals to Khmer
  return toKhmerNumerals(formatted);
};

// Format Buddhist Era year (BE = CE + 543)
export const formatBuddhistYear = (date: Date | string | number, useKhmerNumerals = true): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to formatBuddhistYear:', date);
    return '';
  }
  
  const gregorianYear = dateObj.getFullYear();
  const buddhistYear = gregorianYear + 543;
  
  return useKhmerNumerals ? toKhmerNumerals(buddhistYear) : buddhistYear.toString();
};

// Format date in Buddhist Era calendar (e.g., "15 មករា ២៥៦៧")
export const formatBuddhistDate = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to formatBuddhistDate:', date);
    return '';
  }
  
  // Format day and month in Khmer
  const dayMonth = formatDate(dateObj, 'd MMMM', { locale: km });
  
  // Get Buddhist year
  const buddhistYear = formatBuddhistYear(dateObj);
  
  // Combine and ensure all numerals are in Khmer
  return toKhmerNumerals(`${dayMonth} ${buddhistYear}`);
};

// Format time in Khmer
export const formatKhmerTime = (date: Date | string | number, formatStr: string = 'HH:mm'): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to formatKhmerTime:', date);
    return '';
  }
  
  // Format time using date-fns with Khmer locale
  const formatted = formatDate(dateObj, formatStr, { locale: km });
  
  // Convert any remaining numerals to Khmer
  return toKhmerNumerals(formatted);
};

// Format date range in Khmer
export const formatKhmerDateRange = (
  startDate: Date | string | number,
  endDate: Date | string | number,
  formatStr: string = 'PPP'
): string => {
  const start = formatKhmerDate(startDate, formatStr);
  const end = formatKhmerDate(endDate, formatStr);
  
  return `${start} - ${end}`;
};

// Validate Khmer text input
export const validateKhmerText = (text: string): boolean => {
  // Check if the text contains Khmer Unicode characters
  // Khmer Unicode range: \u1780-\u17FF
  const khmerPattern = /[\u1780-\u17FF]/;
  return khmerPattern.test(text);
};

// Helper to determine if text is primarily Khmer
export const isPrimarilyKhmer = (text: string): boolean => {
  const khmerChars = (text.match(/[\u1780-\u17FF]/g) || []).length;
  return khmerChars > text.length / 2;
};

// Parse Khmer date string to Date object
export const parseKhmerDate = (dateString: string, formatStr: string = 'PPP'): Date | null => {
  try {
    // Convert Khmer numerals to Arabic numerals
    const normalizedDateString = fromKhmerNumerals(dateString);
    
    // Parse the date using date-fns
    const parsedDate = parse(normalizedDateString, formatStr, new Date(), { locale: km });
    
    // Check if the date is valid
    if (!isValid(parsedDate)) {
      return null;
    }
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing Khmer date:', error);
    return null;
  }
};

// Get current date in Khmer format
export const getCurrentKhmerDate = (formatStr: string = 'PPP'): string => {
  return formatKhmerDate(new Date(), formatStr);
};

// Get current Buddhist year
export const getCurrentBuddhistYear = (useKhmerNumerals = true): string => {
  return formatBuddhistYear(new Date(), useKhmerNumerals);
};

// Format relative time in Khmer (e.g., "2 ថ្ងៃមុន")
export const formatKhmerRelativeTime = (date: Date | string | number): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  
  // Check if date is valid
  if (!isValid(dateObj)) {
    console.error('Invalid date provided to formatKhmerRelativeTime:', date);
    return '';
  }
  
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return 'ទើបតែឥឡូវនេះ';
  } else if (diffMin < 60) {
    return `${toKhmerNumerals(diffMin)} នាទីមុន`;
  } else if (diffHour < 24) {
    return `${toKhmerNumerals(diffHour)} ម៉ោងមុន`;
  } else if (diffDay < 30) {
    return `${toKhmerNumerals(diffDay)} ថ្ងៃមុន`;
  } else if (diffMonth < 12) {
    return `${toKhmerNumerals(diffMonth)} ខែមុន`;
  } else {
    return `${toKhmerNumerals(diffYear)} ឆ្នាំមុន`;
  }
};
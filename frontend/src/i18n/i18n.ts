import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { 
  formatKhmerDate, 
  formatNumber, 
  toKhmerNumerals, 
  formatBuddhistDate,
  formatKhmerTime,
  formatCurrency,
  formatKhmerRelativeTime,
  formatKhmerDateRange,
  getCurrentKhmerDate
} from '../utils/localization'

import khmerTranslations from './locales/km.json'

const resources = {
  km: {
    translation: khmerTranslations,
  },
}

// Custom formatter for Khmer dates and numbers
i18n.services = i18n.services || {};
i18n.services.formatter = {
  add: (lng, ns, key, formatter) => {
    // This space intentionally left empty as we're using the format function below
  },
  format: (value, format, lng, options) => {
    if (!format) return value;
    
    // Handle date formatting with Khmer locale
    if (format.includes('date')) {
      const dateFormat = format.replace('date:', '');
      return formatKhmerDate(value, dateFormat || 'PPP');
    }
    
    // Handle Buddhist date formatting
    if (format === 'buddhistDate') {
      return formatBuddhistDate(value);
    }
    
    // Handle time formatting with Khmer locale
    if (format.includes('time')) {
      const timeFormat = format.replace('time:', '');
      return formatKhmerTime(value, timeFormat || 'HH:mm');
    }
    
    // Handle date range formatting
    if (format === 'dateRange' && Array.isArray(value) && value.length === 2) {
      return formatKhmerDateRange(value[0], value[1]);
    }
    
    // Handle relative time formatting
    if (format === 'relativeTime') {
      return formatKhmerRelativeTime(value);
    }
    
    // Handle number formatting with Khmer numerals
    if (format === 'number') {
      return formatNumber(value);
    }
    
    // Handle currency formatting
    if (format === 'currency') {
      return formatCurrency(value);
    }
    
    // Handle Khmer numerals conversion
    if (format === 'khmerNumerals') {
      return toKhmerNumerals(value);
    }
    
    return value;
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'km', // Always use Khmer
    
    interpolation: {
      escapeValue: false, // React already does escaping
      format: (value, format, lng, options) => {
        return i18n.services.formatter.format(value, format, lng, options);
      }
    },
    
    // React i18next special options
    react: {
      useSuspense: false, // Disable suspense to ensure translations load
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      nsMode: 'default'
    },
    
    // Additional options for better Khmer support
    keySeparator: '.',
    nsSeparator: ':',
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Debug mode disabled to avoid console clutter
    debug: false,
    
    // Fallback language
    fallbackLng: 'km',
    
    // Load translations synchronously
    initImmediate: true
  })

// Export language utilities (simplified for monolingual)
export const getCurrentLanguage = () => 'km';
export const isKhmerLanguage = () => true;

// Add missing translations to Khmer
export const addTranslations = (namespace: string, translations: Record<string, any>) => {
  i18n.addResourceBundle('km', namespace, translations, true, true);
};

// Check if a translation key exists
export const hasTranslation = (key: string) => i18n.exists(key);

// Get current date in Khmer format for the UI
export const getCurrentDateFormatted = () => getCurrentKhmerDate();

export default i18n
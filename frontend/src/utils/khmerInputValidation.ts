import { isPrimarilyKhmer, validateKhmerText } from './localization';

// Khmer text input validation rules
export interface KhmerTextValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  requireKhmerScript?: boolean;
  allowMixedScript?: boolean;
  allowNumbers?: boolean;
  allowSpecialChars?: boolean;
  customPattern?: RegExp;
}

// Validate Khmer text input with various options
export const validateKhmerTextInput = (
  text: string,
  options: KhmerTextValidationOptions = {}
): { isValid: boolean; errorMessage?: string; context?: Record<string, any> } => {
  const {
    required = false,
    minLength,
    maxLength,
    requireKhmerScript = false,
    allowMixedScript = true,
    allowNumbers = true,
    allowSpecialChars = true,
    customPattern,
  } = options;

  // Check if required
  if (required && (!text || text.trim() === '')) {
    return { isValid: false, errorMessage: 'errors.validation.required' };
  }

  // Skip other validations if empty and not required
  if (!text || text.trim() === '') {
    return { isValid: true };
  }

  // Check minimum length
  if (minLength !== undefined && text.length < minLength) {
    return {
      isValid: false,
      errorMessage: 'errors.validation.minLength',
      // Additional context for translation
      context: { min: minLength },
    };
  }

  // Check maximum length
  if (maxLength !== undefined && text.length > maxLength) {
    return {
      isValid: false,
      errorMessage: 'errors.validation.maxLength',
      context: { max: maxLength },
    };
  }

  // Check if text contains Khmer script when required
  if (requireKhmerScript && !validateKhmerText(text)) {
    return {
      isValid: false,
      errorMessage: 'errors.validation.requiresKhmerScript',
    };
  }

  // Check if text is primarily in Khmer script when mixed script is not allowed
  if (!allowMixedScript && !isPrimarilyKhmer(text) && validateKhmerText(text)) {
    return {
      isValid: false,
      errorMessage: 'errors.validation.noMixedScript',
    };
  }

  // Check for numbers if not allowed
  if (!allowNumbers && /[0-9០១២៣៤៥៦៧៨៩]/.test(text)) {
    return {
      isValid: false,
      errorMessage: 'errors.validation.noNumbers',
    };
  }

  // Check for special characters if not allowed
  if (!allowSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(text)) {
    return {
      isValid: false,
      errorMessage: 'errors.validation.noSpecialChars',
    };
  }

  // Check against custom pattern if provided
  if (customPattern && !customPattern.test(text)) {
    return {
      isValid: false,
      errorMessage: 'errors.validation.patternMismatch',
    };
  }

  return { isValid: true };
};

// Custom hook for Khmer text input validation
export const useKhmerTextValidation = (
  options: KhmerTextValidationOptions = {}
) => {
  return (text: string) => validateKhmerTextInput(text, options);
};

// Khmer keyboard layout detection
export const isKhmerKeyboardActive = (): boolean => {
  // This is a simplified check that might not work in all browsers
  // A more robust solution would involve checking the actual keyboard layout
  try {
    const testInput = document.createElement('input');
    testInput.style.position = 'absolute';
    testInput.style.opacity = '0';
    document.body.appendChild(testInput);
    testInput.focus();
    
    // Try to detect Khmer keyboard by checking if a Khmer character can be typed
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      keyCode: 65,
      which: 65,
      bubbles: true
    });
    testInput.dispatchEvent(event);
    
    // Check if the input value contains Khmer characters
    const result = validateKhmerText(testInput.value);
    
    // Clean up
    document.body.removeChild(testInput);
    
    return result;
  } catch (error) {
    console.error('Error detecting Khmer keyboard:', error);
    return false;
  }
};

// Helper to suggest enabling Khmer keyboard
export const suggestKhmerKeyboard = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('windows')) {
    return 'To enable Khmer keyboard on Windows, go to Settings > Time & Language > Language > Add a language > Khmer';
  } else if (userAgent.includes('mac')) {
    return 'To enable Khmer keyboard on macOS, go to System Preferences > Keyboard > Input Sources > + > Khmer';
  } else if (userAgent.includes('android')) {
    return 'To enable Khmer keyboard on Android, go to Settings > System > Languages & input > Virtual keyboard > Gboard > Languages > Khmer';
  } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'To enable Khmer keyboard on iOS, go to Settings > General > Keyboard > Keyboards > Add New Keyboard > Khmer';
  }
  
  return 'Please enable Khmer keyboard in your device settings to type in Khmer';
};

// Khmer text input component props
export interface KhmerTextInputProps {
  value: string;
  onChange: (value: string) => void;
  options?: KhmerTextValidationOptions;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

// Helper to check if text has valid Khmer vowel combinations
export const hasValidKhmerVowelCombinations = (text: string): boolean => {
  // This is a simplified check for some common invalid Khmer vowel combinations
  // A more comprehensive check would require a full Khmer language parser
  
  // Check for some invalid vowel combinations
  const invalidCombinations = [
    'ាិ', 'ាី', 'ាឹ', 'ាឺ', 'ាុ', 'ាូ', 'ាួ', 'ាើ', 'ាឿ', 'ាៀ', 'ាេ', 'ាែ', 'ាៃ', 'ាោ', 'ាៅ',
    'ិា', 'ិី', 'ិឹ', 'ិឺ', 'ិុ', 'ិូ', 'ិួ', 'ិើ', 'ិឿ', 'ិៀ', 'ិេ', 'ិែ', 'ិៃ', 'ិោ', 'ិៅ',
    'ីា', 'ីិ', 'ីឹ', 'ីឺ', 'ីុ', 'ីូ', 'ីួ', 'ីើ', 'ីឿ', 'ីៀ', 'ីេ', 'ីែ', 'ីៃ', 'ីោ', 'ីៅ'
  ];
  
  for (const combo of invalidCombinations) {
    if (text.includes(combo)) {
      return false;
    }
  }
  
  return true;
};

// Helper to check if text has valid Khmer consonant stacks
export const hasValidKhmerConsonantStacks = (text: string): boolean => {
  // This is a simplified check for some common invalid Khmer consonant stacks
  // A more comprehensive check would require a full Khmer language parser
  
  // Check for some invalid consonant stacks (more than 2 consonants)
  const consonantPattern = /[\u1780-\u17A2]{3,}/g;
  return !consonantPattern.test(text);
};
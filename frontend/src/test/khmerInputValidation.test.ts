import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateKhmerTextInput, 
  hasValidKhmerVowelCombinations,
  hasValidKhmerConsonantStacks
} from '../utils/khmerInputValidation';

// Mock the localization utilities
vi.mock('../utils/localization', () => ({
  validateKhmerText: (text: string) => /[\u1780-\u17FF]/.test(text),
  isPrimarilyKhmer: (text: string) => {
    const khmerChars = (text.match(/[\u1780-\u17FF]/g) || []).length;
    return khmerChars > text.length / 2;
  },
}));

describe('Khmer Input Validation', () => {
  describe('validateKhmerTextInput', () => {
    it('should validate required fields', () => {
      expect(validateKhmerTextInput('', { required: true }).isValid).toBe(false);
      expect(validateKhmerTextInput('ខ្មែរ', { required: true }).isValid).toBe(true);
    });

    it('should validate minimum length', () => {
      expect(validateKhmerTextInput('ខ្មែរ', { minLength: 5 }).isValid).toBe(false);
      expect(validateKhmerTextInput('ខ្មែរខ្មែរ', { minLength: 5 }).isValid).toBe(true);
    });

    it('should validate maximum length', () => {
      expect(validateKhmerTextInput('ខ្មែរខ្មែរ', { maxLength: 3 }).isValid).toBe(false);
      expect(validateKhmerTextInput('ខ្មែរ', { maxLength: 5 }).isValid).toBe(true);
    });

    it('should validate Khmer script requirement', () => {
      expect(validateKhmerTextInput('English', { requireKhmerScript: true }).isValid).toBe(false);
      expect(validateKhmerTextInput('ខ្មែរ', { requireKhmerScript: true }).isValid).toBe(true);
    });

    it('should validate mixed script restriction', () => {
      // Mock isPrimarilyKhmer for this test
      vi.mocked('../utils/localization').isPrimarilyKhmer = vi.fn().mockReturnValue(false);
      
      expect(validateKhmerTextInput('ខ្មែរ English', { allowMixedScript: false }).isValid).toBe(false);
      
      // Reset mock
      vi.mocked('../utils/localization').isPrimarilyKhmer = vi.fn().mockReturnValue(true);
      
      expect(validateKhmerTextInput('ខ្មែរ', { allowMixedScript: false }).isValid).toBe(true);
    });
    
    it('should validate number restriction', () => {
      expect(validateKhmerTextInput('ខ្មែរ123', { allowNumbers: false }).isValid).toBe(false);
      expect(validateKhmerTextInput('ខ្មែរ១២៣', { allowNumbers: false }).isValid).toBe(false);
      expect(validateKhmerTextInput('ខ្មែរ', { allowNumbers: false }).isValid).toBe(true);
    });
    
    it('should validate special characters restriction', () => {
      expect(validateKhmerTextInput('ខ្មែរ!@#', { allowSpecialChars: false }).isValid).toBe(false);
      expect(validateKhmerTextInput('ខ្មែរ', { allowSpecialChars: false }).isValid).toBe(true);
    });
    
    it('should validate against custom pattern', () => {
      const pattern = /^[ក-អ]+$/; // Only Khmer consonants
      expect(validateKhmerTextInput('កខគ', { customPattern: pattern }).isValid).toBe(true);
      expect(validateKhmerTextInput('ក១២៣', { customPattern: pattern }).isValid).toBe(false);
    });
  });
  
  describe('hasValidKhmerVowelCombinations', () => {
    it('should validate Khmer vowel combinations', () => {
      // Valid combinations
      expect(hasValidKhmerVowelCombinations('ក')).toBe(true);
      expect(hasValidKhmerVowelCombinations('កា')).toBe(true);
      expect(hasValidKhmerVowelCombinations('កិ')).toBe(true);
      
      // Invalid combinations (these are simplified examples)
      expect(hasValidKhmerVowelCombinations('កាិ')).toBe(false);
      expect(hasValidKhmerVowelCombinations('កិា')).toBe(false);
    });
  });
  
  describe('hasValidKhmerConsonantStacks', () => {
    it('should validate Khmer consonant stacks', () => {
      // Valid stacks (single consonant or two consonants)
      expect(hasValidKhmerConsonantStacks('ក')).toBe(true);
      expect(hasValidKhmerConsonantStacks('ក្ខ')).toBe(true);
      
      // Invalid stacks (more than 2 consonants)
      expect(hasValidKhmerConsonantStacks('កខគ')).toBe(false);
    });
  });
});
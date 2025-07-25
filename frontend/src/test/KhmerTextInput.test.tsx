import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KhmerTextInput from '../components/KhmerTextInput';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';

// Mock the i18n instance
vi.mock('../i18n/i18n', () => ({
  default: {
    t: (key: string) => key,
    language: 'km',
    changeLanguage: vi.fn(),
  },
  getCurrentLanguage: () => 'km',
  isKhmerLanguage: () => true,
}));

// Mock the localization utilities
vi.mock('../utils/localization', () => ({
  validateKhmerText: (text: string) => /[\u1780-\u17FF]/.test(text),
  isPrimarilyKhmer: (text: string) => true,
}));

// Mock the khmerInputValidation utilities
vi.mock('../utils/khmerInputValidation', () => ({
  validateKhmerTextInput: () => ({ isValid: true }),
  suggestKhmerKeyboard: () => 'Mock keyboard suggestion',
}));

describe('KhmerTextInput Component', () => {
  const mockOnChange = vi.fn();
  
  beforeEach(() => {
    mockOnChange.mockClear();
  });
  
  it('renders correctly', () => {
    render(
      <KhmerTextInput 
        value="" 
        onChange={mockOnChange} 
        label="Test Label" 
      />
    );
    
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });
  
  it('calls onChange when text is entered', () => {
    render(
      <KhmerTextInput 
        value="" 
        onChange={mockOnChange} 
        label="Test Label" 
      />
    );
    
    const input = screen.getByLabelText('Test Label');
    fireEvent.change(input, { target: { value: 'ខ្មែរ' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('ខ្មែរ');
  });
  
  it('shows error when required field is empty', () => {
    render(
      <KhmerTextInput 
        value="" 
        onChange={mockOnChange} 
        label="Test Label"
        required={true}
        error={true}
        helperText="errors.validation.required"
      />
    );
    
    expect(screen.getByText('errors.validation.required')).toBeInTheDocument();
  });
  
  it('shows keyboard hint for non-Khmer text when Khmer is required', () => {
    // Override the mock for this test
    const validateKhmerTextMock = vi.fn().mockReturnValue(false);
    (vi.mocked('../utils/localization') as any).validateKhmerText = validateKhmerTextMock;
    
    render(
      <KhmerTextInput 
        value="English text" 
        onChange={mockOnChange} 
        label="Test Label"
        options={{ requireKhmerScript: true }}
      />
    );
    
    // Since we're mocking the i18n.t function to return the key itself
    expect(screen.getByText('inputs.khmerKeyboardRequired')).toBeInTheDocument();
  });
});
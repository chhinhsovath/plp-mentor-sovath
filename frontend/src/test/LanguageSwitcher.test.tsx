import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { I18nextProvider } from 'react-i18next';

// Mock the i18n instance
vi.mock('../i18n/i18n', () => ({
  default: {
    t: (key: string) => key,
    language: 'km',
    changeLanguage: vi.fn(),
  },
  getCurrentLanguage: vi.fn().mockReturnValue('km'),
  isKhmerLanguage: vi.fn().mockReturnValue(true),
  changeLanguage: vi.fn(),
}));

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly in full variant', () => {
    render(<LanguageSwitcher variant="full" />);
    
    // Should show the current language
    expect(screen.getByText('ភាសាខ្មែរ')).toBeInTheDocument();
  });
  
  it('renders correctly in icon variant', () => {
    render(<LanguageSwitcher variant="icon" />);
    
    // Should show the language icon button
    expect(screen.getByLabelText('pages.settings.language.select')).toBeInTheDocument();
  });
  
  it('renders correctly in text variant', () => {
    render(<LanguageSwitcher variant="text" />);
    
    // Should show the current language
    expect(screen.getByText('ភាសាខ្មែរ')).toBeInTheDocument();
  });
  
  it('opens language menu when clicked', () => {
    render(<LanguageSwitcher />);
    
    // Click the language button
    fireEvent.click(screen.getByText('ភាសាខ្មែរ'));
    
    // Menu should be open with language options
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('ភាសាខ្មែរ')).toBeInTheDocument();
  });
  
  it('changes language when a language option is clicked', () => {
    const { changeLanguage } = require('../i18n/i18n');
    
    render(<LanguageSwitcher />);
    
    // Click the language button to open the menu
    fireEvent.click(screen.getByText('ភាសាខ្មែរ'));
    
    // Click the English option
    fireEvent.click(screen.getByText('English'));
    
    // Should call changeLanguage with 'en'
    expect(changeLanguage).toHaveBeenCalledWith('en');
  });
  
  it('adapts to mobile view', () => {
    // Mock useMediaQuery to simulate mobile view
    vi.mock('@mui/material', async () => {
      const actual = await vi.importActual('@mui/material');
      return {
        ...actual,
        useMediaQuery: () => true, // Simulate mobile view
      };
    });
    
    render(<LanguageSwitcher variant="full" />);
    
    // Should show the icon button on mobile regardless of variant
    expect(screen.getByLabelText('pages.settings.language.select')).toBeInTheDocument();
  });
});
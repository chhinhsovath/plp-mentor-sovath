import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileDeviceManager from '../MobileDeviceManager';
import * as deviceDetection from '../../../utils/deviceDetection';

// Mock the deviceDetection module
jest.mock('../../../utils/deviceDetection', () => ({
  isTouchDevice: jest.fn(),
  isPortraitOrientation: jest.fn(),
  isSmallScreen: jest.fn(),
  isTabletDevice: jest.fn(),
  hasLimitedResources: jest.fn(),
  deviceFeatures: {
    hasCamera: jest.fn(),
    hasVibration: jest.fn(),
  },
}));

describe('MobileDeviceManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock values
    (deviceDetection.isTouchDevice as jest.Mock).mockReturnValue(true);
    (deviceDetection.isPortraitOrientation as jest.Mock).mockReturnValue(true);
    (deviceDetection.isSmallScreen as jest.Mock).mockReturnValue(true);
    (deviceDetection.isTabletDevice as jest.Mock).mockReturnValue(false);
    (deviceDetection.hasLimitedResources as jest.Mock).mockReturnValue(false);
    (deviceDetection.deviceFeatures.hasCamera as jest.Mock).mockReturnValue(true);
    (deviceDetection.deviceFeatures.hasVibration as jest.Mock).mockReturnValue(true);
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    
    // Mock add/remove event listener
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });

  it('renders children correctly', () => {
    render(
      <MobileDeviceManager>
        <div data-testid="test-child">Test Child</div>
      </MobileDeviceManager>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('shows device info when showDeviceInfo is true', () => {
    render(
      <MobileDeviceManager showDeviceInfo>
        <div>Test</div>
      </MobileDeviceManager>
    );
    
    expect(screen.getByText('Device: mobile')).toBeInTheDocument();
    expect(screen.getByText('Orientation: portrait')).toBeInTheDocument();
    expect(screen.getByText('Touch: Yes')).toBeInTheDocument();
    expect(screen.getByText('Online: Yes')).toBeInTheDocument();
  });

  it('does not show device info when showDeviceInfo is false', () => {
    render(
      <MobileDeviceManager showDeviceInfo={false}>
        <div>Test</div>
      </MobileDeviceManager>
    );
    
    expect(screen.queryByText('Device: mobile')).not.toBeInTheDocument();
  });

  it('registers event listeners on mount', () => {
    render(
      <MobileDeviceManager>
        <div>Test</div>
      </MobileDeviceManager>
    );
    
    expect(window.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = render(
      <MobileDeviceManager>
        <div>Test</div>
      </MobileDeviceManager>
    );
    
    unmount();
    
    expect(window.removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('applies optimizations for limited resources when needed', () => {
    (deviceDetection.hasLimitedResources as jest.Mock).mockReturnValue(true);
    
    // Mock document methods
    document.body.classList.add = jest.fn();
    document.body.classList.remove = jest.fn();
    document.head.appendChild = jest.fn();
    document.head.removeChild = jest.fn();
    document.createElement = jest.fn().mockReturnValue({
      innerHTML: '',
    });
    
    const { unmount } = render(
      <MobileDeviceManager enableOptimizations>
        <div>Test</div>
      </MobileDeviceManager>
    );
    
    expect(document.body.classList.add).toHaveBeenCalledWith('limited-resources');
    
    unmount();
    
    expect(document.body.classList.remove).toHaveBeenCalledWith('limited-resources');
  });
});
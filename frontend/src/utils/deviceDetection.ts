/**
 * Utility functions for device detection and feature adaptation
 */

/**
 * Detects if the current device is a touch device
 * @returns boolean indicating if the device supports touch
 */
export const isTouchDevice = (): boolean => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Detects if the device is in portrait orientation
 * @returns boolean indicating if the device is in portrait orientation
 */
export const isPortraitOrientation = (): boolean => {
  return window.matchMedia('(orientation: portrait)').matches;
};

/**
 * Detects if the device has a small screen (mobile)
 * @returns boolean indicating if the device has a small screen
 */
export const isSmallScreen = (): boolean => {
  return window.matchMedia('(max-width: 600px)').matches;
};

/**
 * Detects if the device is a tablet
 * @returns boolean indicating if the device is a tablet
 */
export const isTabletDevice = (): boolean => {
  return window.matchMedia('(min-width: 601px) and (max-width: 960px)').matches;
};

/**
 * Detects if the device has a high-resolution display (Retina or similar)
 * @returns boolean indicating if the device has a high-resolution display
 */
export const isHighResolutionDisplay = (): boolean => {
  return window.devicePixelRatio > 1;
};

/**
 * Detects if the device has limited memory or processing power
 * This is a heuristic based on available memory and hardware concurrency
 * @returns boolean indicating if the device likely has limited resources
 */
export const hasLimitedResources = (): boolean => {
  // Check if the device has limited memory (less than 4GB)
  // or limited CPU cores (less than 4)
  if ('deviceMemory' in navigator) {
    return (
      (navigator as any).deviceMemory < 4 ||
      (navigator.hardwareConcurrency || 4) < 4
    );
  }
  
  // Fallback to checking if it's a mobile device
  return isSmallScreen();
};

/**
 * Gets the appropriate touch target size based on device
 * @returns number representing the minimum touch target size in pixels
 */
export const getTouchTargetSize = (): number => {
  if (isSmallScreen()) {
    return 48; // 48px is the recommended minimum for mobile
  } else if (isTabletDevice()) {
    return 44; // 44px for tablets
  } else {
    return 40; // 40px for desktop with touch
  }
};

/**
 * Detects if the device supports specific features
 */
export const deviceFeatures = {
  // Check if the device supports the Vibration API
  hasVibration: (): boolean => 'vibrate' in navigator,
  
  // Check if the device has a camera
  hasCamera: (): boolean => 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
  
  // Check if the device supports geolocation
  hasGeolocation: (): boolean => 'geolocation' in navigator,
  
  // Check if the device supports offline storage
  hasIndexedDB: (): boolean => 'indexedDB' in window,
  
  // Check if the device supports the Notification API
  hasNotifications: (): boolean => 'Notification' in window,
  
  // Check if the device supports the Battery API
  hasBattery: (): boolean => 'getBattery' in (navigator as any),
  
  // Check if the device supports the Network Information API
  hasNetworkInfo: (): boolean => 'connection' in navigator,
};

/**
 * Hook to add touch-specific event listeners
 * @param element The element to attach listeners to
 * @param handlers Object containing touch event handlers
 */
export const addTouchListeners = (
  element: HTMLElement,
  handlers: {
    onTouchStart?: (e: TouchEvent) => void;
    onTouchMove?: (e: TouchEvent) => void;
    onTouchEnd?: (e: TouchEvent) => void;
  }
): (() => void) => {
  if (handlers.onTouchStart) {
    element.addEventListener('touchstart', handlers.onTouchStart, { passive: true });
  }
  
  if (handlers.onTouchMove) {
    element.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
  }
  
  if (handlers.onTouchEnd) {
    element.addEventListener('touchend', handlers.onTouchEnd);
  }
  
  // Return cleanup function
  return () => {
    if (handlers.onTouchStart) {
      element.removeEventListener('touchstart', handlers.onTouchStart);
    }
    
    if (handlers.onTouchMove) {
      element.removeEventListener('touchmove', handlers.onTouchMove);
    }
    
    if (handlers.onTouchEnd) {
      element.removeEventListener('touchend', handlers.onTouchEnd);
    }
  };
};

/**
 * Provides feedback for touch interactions if supported
 */
export const provideTouchFeedback = (): void => {
  if (deviceFeatures.hasVibration()) {
    navigator.vibrate(10); // Short 10ms vibration
  }
};
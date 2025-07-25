import { useState, useEffect, useRef } from 'react';
import { isTouchDevice, provideTouchFeedback } from '../utils/deviceDetection';

interface TouchPosition {
  x: number;
  y: number;
}

interface SwipeDirection {
  horizontal: 'left' | 'right' | null;
  vertical: 'up' | 'down' | null;
}

interface UseTouchOptions {
  swipeThreshold?: number;
  enableHapticFeedback?: boolean;
  preventDefaultOnSwipe?: boolean;
}

/**
 * Custom hook for handling touch interactions
 * @param options Configuration options for touch behavior
 * @returns Object containing touch state and handlers
 */
export const useTouch = (options: UseTouchOptions = {}) => {
  const {
    swipeThreshold = 50,
    enableHapticFeedback = true,
    preventDefaultOnSwipe = false,
  } = options;

  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>({
    horizontal: null,
    vertical: null,
  });
  
  const elementRef = useRef<HTMLElement | null>(null);
  const isTouch = isTouchDevice();

  // Reset touch state when component unmounts
  useEffect(() => {
    return () => {
      setIsTouching(false);
      setTouchStart(null);
      setTouchEnd(null);
      setSwipeDirection({ horizontal: null, vertical: null });
    };
  }, []);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent | TouchEvent) => {
    if (!isTouch) return;
    
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
    });
    setTouchEnd(null);
    setIsTouching(true);
    setSwipeDirection({ horizontal: null, vertical: null });
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent | TouchEvent) => {
    if (!isTouch || !touchStart) return;
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
    });
    
    // Calculate swipe direction
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = touchStart.y - touch.clientY;
    
    // Determine if this is a horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      // Horizontal swipe
      const direction = deltaX > 0 ? 'left' : 'right';
      setSwipeDirection({
        horizontal: direction,
        vertical: null,
      });
      
      if (preventDefaultOnSwipe) {
        e.preventDefault();
      }
    } else if (Math.abs(deltaY) > swipeThreshold) {
      // Vertical swipe
      const direction = deltaY > 0 ? 'up' : 'down';
      setSwipeDirection({
        horizontal: null,
        vertical: direction,
      });
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isTouch) return;
    
    setIsTouching(false);
    
    // Provide haptic feedback on swipe if enabled
    if (enableHapticFeedback && 
        (swipeDirection.horizontal !== null || swipeDirection.vertical !== null)) {
      provideTouchFeedback();
    }
  };

  // Attach touch handlers to an element
  const attachTouchHandlers = (element: HTMLElement) => {
    if (!isTouch || !element) return;
    
    elementRef.current = element;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultOnSwipe });
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  };

  // Provide haptic feedback
  const triggerHapticFeedback = () => {
    if (enableHapticFeedback && isTouch) {
      provideTouchFeedback();
    }
  };

  return {
    isTouching,
    touchStart,
    touchEnd,
    swipeDirection,
    isTouch,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    attachTouchHandlers,
    triggerHapticFeedback,
  };
};

export default useTouch;
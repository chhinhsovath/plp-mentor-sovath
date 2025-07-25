import { renderHook, act } from '@testing-library/react';
import { useTouch } from '../useTouch';
import * as deviceDetection from '../../utils/deviceDetection';

// Mock the deviceDetection module
jest.mock('../../utils/deviceDetection', () => ({
  isTouchDevice: jest.fn(),
  provideTouchFeedback: jest.fn(),
}));

describe('useTouch hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to touch device
    (deviceDetection.isTouchDevice as jest.Mock).mockReturnValue(true);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTouch());
    
    expect(result.current.isTouching).toBe(false);
    expect(result.current.touchStart).toBeNull();
    expect(result.current.touchEnd).toBeNull();
    expect(result.current.swipeDirection).toEqual({
      horizontal: null,
      vertical: null,
    });
    expect(result.current.isTouch).toBe(true);
  });

  it('should handle touch start event', () => {
    const { result } = renderHook(() => useTouch());
    
    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as TouchEvent);
    });
    
    expect(result.current.isTouching).toBe(true);
    expect(result.current.touchStart).toEqual({ x: 100, y: 200 });
    expect(result.current.touchEnd).toBeNull();
  });

  it('should handle touch move event and detect horizontal swipe', () => {
    const { result } = renderHook(() => useTouch({ swipeThreshold: 10 }));
    
    // Start touch
    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as TouchEvent);
    });
    
    // Move touch to the left
    act(() => {
      result.current.handleTouchMove({
        touches: [{ clientX: 80, clientY: 200 }],
        preventDefault: jest.fn(),
      } as unknown as TouchEvent);
    });
    
    expect(result.current.touchEnd).toEqual({ x: 80, y: 200 });
    expect(result.current.swipeDirection).toEqual({
      horizontal: 'left',
      vertical: null,
    });
  });

  it('should handle touch move event and detect vertical swipe', () => {
    const { result } = renderHook(() => useTouch({ swipeThreshold: 10 }));
    
    // Start touch
    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as TouchEvent);
    });
    
    // Move touch upward
    act(() => {
      result.current.handleTouchMove({
        touches: [{ clientX: 100, clientY: 180 }],
        preventDefault: jest.fn(),
      } as unknown as TouchEvent);
    });
    
    expect(result.current.touchEnd).toEqual({ x: 100, y: 180 });
    expect(result.current.swipeDirection).toEqual({
      horizontal: null,
      vertical: 'up',
    });
  });

  it('should handle touch end event', () => {
    const { result } = renderHook(() => useTouch());
    
    // Start touch
    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as TouchEvent);
    });
    
    // End touch
    act(() => {
      result.current.handleTouchEnd();
    });
    
    expect(result.current.isTouching).toBe(false);
  });

  it('should trigger haptic feedback', () => {
    const { result } = renderHook(() => useTouch({ enableHapticFeedback: true }));
    
    act(() => {
      result.current.triggerHapticFeedback();
    });
    
    expect(deviceDetection.provideTouchFeedback).toHaveBeenCalled();
  });

  it('should not trigger haptic feedback when disabled', () => {
    const { result } = renderHook(() => useTouch({ enableHapticFeedback: false }));
    
    act(() => {
      result.current.triggerHapticFeedback();
    });
    
    expect(deviceDetection.provideTouchFeedback).not.toHaveBeenCalled();
  });

  it('should not process touch events on non-touch devices', () => {
    (deviceDetection.isTouchDevice as jest.Mock).mockReturnValue(false);
    
    const { result } = renderHook(() => useTouch());
    
    act(() => {
      result.current.handleTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as TouchEvent);
    });
    
    expect(result.current.isTouching).toBe(false);
    expect(result.current.touchStart).toBeNull();
  });
});
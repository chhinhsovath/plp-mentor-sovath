import React, { useEffect, useState } from 'react';
import { Typography, Alert, notification, Grid, theme } from 'antd';
import { 
  isTouchDevice, 
  isPortraitOrientation, 
  isSmallScreen, 
  isTabletDevice,
  hasLimitedResources,
  deviceFeatures
} from '../../utils/deviceDetection';

const { Text } = Typography;
const { useToken } = theme;

interface MobileDeviceManagerProps {
  children: React.ReactNode;
  enableOptimizations?: boolean;
  showDeviceInfo?: boolean;
}

/**
 * Component that manages device-specific features and optimizations
 * Wraps content and provides device-specific adaptations
 */
const MobileDeviceManager: React.FC<MobileDeviceManagerProps> = ({
  children,
  enableOptimizations = true,
  showDeviceInfo = false,
}) => {
  const { token } = useToken();
  const [screenSize, setScreenSize] = useState('large');
  
  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 576) {
        setScreenSize('mobile');
      } else if (width < 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    isPortraitOrientation() ? 'portrait' : 'landscape'
  );
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [deviceType, setDeviceType] = useState<string>('unknown');
  
  // Detect device type on mount
  useEffect(() => {
    if (isSmallScreen()) {
      setDeviceType('mobile');
    } else if (isTabletDevice()) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setOrientation(isPortraitOrientation() ? 'portrait' : 'landscape');
    };
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      notification.success({
        message: 'Connection Restored',
        description: 'You are back online.',
        duration: 3,
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      notification.warning({
        message: 'Connection Lost',
        description: 'You are currently offline. Some features may be limited.',
        duration: 6,
      });
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Apply device-specific optimizations
  useEffect(() => {
    if (!enableOptimizations) return;
    
    // Apply optimizations for limited resources
    if (hasLimitedResources()) {
      // Disable animations
      document.body.classList.add('limited-resources');
      
      // Reduce image quality
      const style = document.createElement('style');
      style.innerHTML = `
        img {
          image-rendering: auto;
          max-resolution: 1dppx;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.body.classList.remove('limited-resources');
        document.head.removeChild(style);
      };
    }
  }, [enableOptimizations]);
  
  return (
    <>
      {children}
      
      {/* Device info panel (only shown when showDeviceInfo is true) */}
      {showDeviceInfo && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: token.padding,
            borderTopLeftRadius: token.borderRadius,
            fontSize: '10px',
            zIndex: 9999,
            maxWidth: '200px',
          }}
        >
          <Text style={{ color: 'white', display: 'block', fontSize: '10px' }}>
            Device: {deviceType}
          </Text>
          <Text style={{ color: 'white', display: 'block', fontSize: '10px' }}>
            Orientation: {orientation}
          </Text>
          <Text style={{ color: 'white', display: 'block', fontSize: '10px' }}>
            Touch: {isTouchDevice() ? 'Yes' : 'No'}
          </Text>
          <Text style={{ color: 'white', display: 'block', fontSize: '10px' }}>
            Online: {navigator.onLine ? 'Yes' : 'No'}
          </Text>
          <Text style={{ color: 'white', display: 'block', fontSize: '10px' }}>
            Camera: {deviceFeatures.hasCamera() ? 'Yes' : 'No'}
          </Text>
          <Text style={{ color: 'white', display: 'block', fontSize: '10px' }}>
            Vibration: {deviceFeatures.hasVibration() ? 'Yes' : 'No'}
          </Text>
        </div>
      )}
    </>
  );
};

export default MobileDeviceManager;
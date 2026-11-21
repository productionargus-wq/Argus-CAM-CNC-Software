import { useState, useEffect } from 'react';

/**
 * Custom hook to detect mobile screen width, touch capability, orientation,
 * and manage active mobile CAM navigation tabs.
 */
export function useMobileLayout() {
  const [windowDimensions, setWindowDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  }));

  const [activeMobileTab, setActiveMobileTab] = useState('viewport'); // 'viewport' | 'cad' | 'toolpaths' | 'tree' | 'simulate' | 'gcode'
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const hasTouch = typeof navigator !== 'undefined' && (
    navigator.maxTouchPoints > 0 || 
    'ontouchstart' in window ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
  );

  const isNativeCapacitor = typeof window !== 'undefined' && Boolean(
    window.Capacitor?.isNativePlatform?.() || 
    window.Capacitor?.getPlatform?.() === 'android' ||
    window.Capacitor?.getPlatform?.() === 'ios'
  );

  const isLandscape = windowDimensions.width > windowDimensions.height;

  // On phones in landscape, height is typically 320px - 450px, width 640px - 950px.
  // In portrait, width is 320px - 500px.
  const isMobileLandscape = isLandscape && (
    windowDimensions.height <= 550 || 
    (hasTouch && windowDimensions.height < 650)
  );
  const isMobilePortrait = !isLandscape && windowDimensions.width < 768;

  const isMobile = Boolean(
    isNativeCapacitor || 
    isMobileLandscape || 
    isMobilePortrait || 
    (hasTouch && windowDimensions.width < 1024 && windowDimensions.height < 650)
  );

  const isTablet = hasTouch && !isMobile && windowDimensions.width < 1280;

  const openMobileTab = (tab) => {
    setActiveMobileTab(tab);
    if (tab === 'viewport') {
      setIsMobileDrawerOpen(false);
    } else {
      setIsMobileDrawerOpen(true);
    }
  };

  const closeMobileDrawer = () => {
    setIsMobileDrawerOpen(false);
  };

  return {
    isMobile,
    isTablet,
    isLandscape,
    hasTouch,
    width: windowDimensions.width,
    height: windowDimensions.height,
    activeMobileTab,
    setActiveMobileTab,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    openMobileTab,
    closeMobileDrawer
  };
}

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

  const isMobile = windowDimensions.width < 768;
  const isTablet = windowDimensions.width >= 768 && windowDimensions.width < 1024;
  const isLandscape = windowDimensions.width > windowDimensions.height;
  const hasTouch = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

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

import React, { useEffect, useState } from 'react';

/**
 * Animated opening splash screen displaying the ARGUS | CAM Intelligence brand lockup.
 */
export default function BootSplashScreen({ onDone }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), 1500);
    const doneTimer = setTimeout(() => onDone?.(), 1880);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => onDone?.(), 180);
  };

  return (
    <div
      onClick={handleSkip}
      role="status"
      aria-label="Argus CAM Intelligence Loading"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200000,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto',
        userSelect: 'none',
        cursor: 'pointer'
      }}
    >
      <div className="argus-splash-logo-wrap">
        <img
          src="/brand/argus_cam_intelligence_full.jpg"
          alt="Argus CAM Intelligence"
          style={{
            width: 'min(420px, 78vw)',
            maxHeight: '42vh',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </div>

      <div
        style={{
          width: 'min(220px, 52vw)',
          height: '3px',
          backgroundColor: '#e2e8f0',
          borderRadius: '999px',
          overflow: 'hidden'
        }}
      >
        <div className="argus-splash-progress-bar" />
      </div>

      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.6px',
          color: '#64748b',
          fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          textTransform: 'uppercase'
        }}
      >
        5-Axis CNC CAD/CAM Suite
      </span>
    </div>
  );
}

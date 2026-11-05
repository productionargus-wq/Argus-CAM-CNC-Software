import React, { useMemo } from 'react';

/**
 * Mastercam Viewport Bottom-Right Distance Scale Bar / Ruler
 * Displays dynamic viewport scale bracket matching:
 * |──────────────|
 *    0.6671 in
 *      Inch
 */
export default function ScaleRulerHUD({
  cameraDistance = 350,
  unitSystem = 'imperial', // 'imperial' | 'metric'
  theme = 'light'
}) {
  const isLight = theme !== 'dark';

  // Compute a realistic human-readable scale value proportional to camera distance
  const scaleValue = useMemo(() => {
    // At default camera distance (around 300-350), 100px screen corresponds to ~0.667 in or ~16.9 mm
    const factor = cameraDistance / 350;
    if (unitSystem === 'imperial') {
      const val = 0.6671 * factor;
      if (val >= 10) return `${val.toFixed(1)} in`;
      if (val >= 1) return `${val.toFixed(2)} in`;
      return `${val.toFixed(4)} in`;
    } else {
      const val = 16.94 * factor;
      if (val >= 100) return `${val.toFixed(0)} mm`;
      if (val >= 10) return `${val.toFixed(1)} mm`;
      return `${val.toFixed(2)} mm`;
    }
  }, [cameraDistance, unitSystem]);

  const unitLabel = unitSystem === 'imperial' ? 'Inch' : 'mm';

  return (
    <div
      className="scale-ruler-hud"
      style={{
        position: 'absolute',
        bottom: '12px',
        right: '16px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Precision Bracket Scale Line: |──────────────| */}
      <div
        style={{
          width: '74px',
          height: '6px',
          borderLeft: `1.5px solid ${isLight ? '#0f172a' : '#f8fafc'}`,
          borderRight: `1.5px solid ${isLight ? '#0f172a' : '#f8fafc'}`,
          borderBottom: `1.5px solid ${isLight ? '#0f172a' : '#f8fafc'}`,
          marginBottom: '2px'
        }}
      />

      {/* Numeric Scale Value */}
      <span
        style={{
          fontSize: '10.5px',
          fontWeight: 700,
          color: isLight ? '#0f172a' : '#f8fafc',
          lineHeight: 1.1
        }}
      >
        {scaleValue}
      </span>

      {/* Unit system text */}
      <span
        style={{
          fontSize: '9.5px',
          color: isLight ? '#475569' : '#94a3b8',
          lineHeight: 1
        }}
      >
        {unitLabel}
      </span>
    </div>
  );
}

import React from 'react';

/**
 * Mastercam View Orientation Gnomon & Label (Bottom-Left Viewport HUD)
 * Renders the 2D/3D view axes indicator and active view text (e.g. 'Top', 'Front', 'Right', 'Isometric').
 */
export default function ViewGnomonHUD({
  activeView = 'Top',
  theme = 'light'
}) {
  const isLight = theme !== 'dark';

  return (
    <div
      className="view-gnomon-hud"
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '16px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        userSelect: 'none',
        pointerEvents: 'none',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}
    >
      {/* 2D Mini Axis Indicator SVG */}
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        <svg width="48" height="48" viewBox="0 0 48 48">
          <defs>
            <marker id="arrow-x" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
            </marker>
            <marker id="arrow-y" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
            </marker>
          </defs>

          {/* X axis (Red) */}
          <line x1="8" y1="40" x2="40" y2="40" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#arrow-x)" />
          {/* Y axis (Green) */}
          <line x1="8" y1="40" x2="8" y2="8" stroke="#16a34a" strokeWidth="2.5" markerEnd="url(#arrow-y)" />

          {/* Axis text labels */}
          <text x="42" y="44" fill="#dc2626" fontSize="9" fontWeight="bold">X</text>
          <text x="5" y="6" fill="#16a34a" fontSize="9" fontWeight="bold">Y</text>
        </svg>
      </div>

      {/* Active View Label (Top, Front, Right, Isometric) */}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: isLight ? '#0f172a' : '#f8fafc',
          marginTop: '2px',
          paddingLeft: '4px'
        }}
      >
        {activeView}
      </span>
    </div>
  );
}

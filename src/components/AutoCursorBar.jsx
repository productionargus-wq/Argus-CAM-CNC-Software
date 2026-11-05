import React, { useState } from 'react';
import {
  Lock, Unlock, ChevronDown, Crosshair, Dot, Circle,
  Minus, Square, Disc, Triangle, CornerDownRight,
  Maximize2, Spline, Compass, Hash
} from 'lucide-react';

/**
 * Mastercam AutoCursor Ribbon / Bar (Top-Center Viewport HUD)
 * Provides instant snapping modes (Origin, Center, Endpoint, Midpoint, Point, Intersection, etc.),
 * Fast Point / XYZ coordinate entry, and AutoCursor snap lock toggle.
 */
export default function AutoCursorBar({
  snapMode = 'auto',
  onSelectSnapMode,
  isLocked = false,
  onToggleLock,
  onOpenCoordinateEntry,
  cursorCoords = { x: 0, y: 0, z: 0 },
  theme = 'light'
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isLight = theme !== 'dark';

  const snapOptions = [
    { id: 'auto', label: 'AutoCursor', title: 'AutoCursor - Automatic Snapping to All Entities' },
    { id: 'origin', label: 'Origin', title: 'Snap to Origin (0,0,0)' },
    { id: 'center', label: 'Arc Center', title: 'Snap to Arc / Circle Center' },
    { id: 'endpoint', label: 'Endpoint', title: 'Snap to Entity Endpoint' },
    { id: 'midpoint', label: 'Midpoint', title: 'Snap to Line / Curve Midpoint' },
    { id: 'point', label: 'Point', title: 'Snap to Point Entity' },
    { id: 'intersection', label: 'Intersection', title: 'Snap to Geometry Intersection' },
    { id: 'quadrant', label: 'Quadrant', title: 'Snap to Arc Quadrant Point' },
    { id: 'tangent', label: 'Tangent', title: 'Snap Tangent to Arc / Curve' },
    { id: 'perpendicular', label: 'Perpendicular', title: 'Snap Perpendicular to Entity' }
  ];

  return (
    <div
      className="autocursor-hud-bar"
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: isLight ? 'rgba(241, 245, 249, 0.88)' : 'rgba(30, 41, 59, 0.88)',
        border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        borderRadius: '20px',
        padding: '3px 10px',
        backdropFilter: 'blur(10px)',
        userSelect: 'none',
        fontSize: '11px',
        color: isLight ? '#334155' : '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* 1. Snap Lock Toggle */}
      <button
        type="button"
        onClick={onToggleLock}
        title={isLocked ? 'AutoCursor Snapping Locked' : 'Lock AutoCursor Snapping'}
        style={{
          background: isLocked ? (isLight ? '#fee2e2' : '#7f1d1d') : 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isLocked ? '#ef4444' : '#64748b'
        }}
      >
        {isLocked ? <Lock size={12} strokeWidth={2.2} /> : <Unlock size={12} strokeWidth={2} />}
      </button>

      <div style={{ width: '1px', height: '14px', background: isLight ? '#cbd5e1' : '#475569', margin: '0 2px' }} />

      {/* 2. AutoCursor Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          title="AutoCursor Selection Mode"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 600,
            color: isLight ? '#1e293b' : '#f8fafc'
          }}
        >
          <span>AutoCursor</span>
          <ChevronDown size={11} color="#64748b" />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '24px',
              left: '0',
              background: isLight ? '#ffffff' : '#1e293b',
              border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              padding: '4px 0',
              zIndex: 50,
              minWidth: '150px'
            }}
          >
            {snapOptions.map((opt) => (
              <div
                key={opt.id}
                onClick={() => {
                  if (onSelectSnapMode) onSelectSnapMode(opt.id);
                  setDropdownOpen(false);
                }}
                style={{
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: snapMode === opt.id ? (isLight ? '#e0f2fe' : '#0369a1') : 'transparent',
                  color: snapMode === opt.id ? (isLight ? '#0284c7' : '#ffffff') : (isLight ? '#334155' : '#cbd5e1'),
                  fontWeight: snapMode === opt.id ? 600 : 400
                }}
              >
                <span>{opt.label}</span>
                {snapMode === opt.id && <span style={{ fontSize: '10px' }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Fast Point / Direct XYZ button */}
      <button
        type="button"
        onClick={onOpenCoordinateEntry}
        title="Direct Coordinate Entry (XYZ Fast Point)"
        style={{
          background: isLight ? '#ffffff' : '#334155',
          border: isLight ? '1px solid #cbd5e1' : '1px solid #475569',
          borderRadius: '4px',
          padding: '2px 6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '10.5px',
          fontFamily: 'monospace',
          fontWeight: 700,
          color: '#0284c7'
        }}
      >
        <span>xyz</span>
      </button>

      <div style={{ width: '1px', height: '14px', background: isLight ? '#cbd5e1' : '#475569', margin: '0 2px' }} />

      {/* 4. Snap Point Quick Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {/* Origin */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('origin')}
          title="Snap to Origin [0, 0, 0]"
          style={snapBtnStyle(snapMode === 'origin', isLight)}
        >
          <Crosshair size={12} />
        </button>

        {/* Center */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('center')}
          title="Snap to Arc / Circle Center"
          style={snapBtnStyle(snapMode === 'center', isLight)}
        >
          <Circle size={11} />
        </button>

        {/* Endpoint */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('endpoint')}
          title="Snap to Endpoint"
          style={snapBtnStyle(snapMode === 'endpoint', isLight)}
        >
          <Square size={10} />
        </button>

        {/* Midpoint */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('midpoint')}
          title="Snap to Midpoint"
          style={snapBtnStyle(snapMode === 'midpoint', isLight)}
        >
          <Triangle size={10} />
        </button>

        {/* Point */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('point')}
          title="Snap to Point Entity"
          style={snapBtnStyle(snapMode === 'point', isLight)}
        >
          <Dot size={14} />
        </button>

        {/* Intersection */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('intersection')}
          title="Snap to Geometry Intersection (X)"
          style={snapBtnStyle(snapMode === 'intersection', isLight)}
        >
          <span style={{ fontSize: '11px', fontWeight: 800 }}>✕</span>
        </button>

        {/* Quadrant */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('quadrant')}
          title="Snap to Arc Quadrant"
          style={snapBtnStyle(snapMode === 'quadrant', isLight)}
        >
          <Disc size={11} />
        </button>

        {/* Tangent */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('tangent')}
          title="Snap Tangent"
          style={snapBtnStyle(snapMode === 'tangent', isLight)}
        >
          <Spline size={11} />
        </button>

        {/* Perpendicular */}
        <button
          type="button"
          onClick={() => onSelectSnapMode && onSelectSnapMode('perpendicular')}
          title="Snap Perpendicular (90°)"
          style={snapBtnStyle(snapMode === 'perpendicular', isLight)}
        >
          <CornerDownRight size={11} />
        </button>
      </div>
    </div>
  );
}

function snapBtnStyle(isActive, isLight) {
  return {
    background: isActive ? (isLight ? '#e0f2fe' : '#0369a1') : 'transparent',
    border: isActive ? (isLight ? '1px solid #38bdf8' : '1px solid #0284c7') : '1px solid transparent',
    borderRadius: '3px',
    cursor: 'pointer',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isActive ? '#0284c7' : (isLight ? '#64748b' : '#94a3b8'),
    padding: 0
  };
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2, ZoomIn, RefreshCw, Hand, Rotate3D,
  Grid, Compass, Layers, CheckSquare, Crosshair, ChevronDown
} from 'lucide-react';

export default function StatusBar({
  coords = { x: '1.29604', y: '-1.33426', z: '0.00000' },
  activeWcs = 'G54',
  activeCPlane = 'Top',
  activeTPlane = 'Top',
  selectedCount = 0,
  isSectionView = false,
  onToggleSectionView,
  unitSystem = 'metric',
  onToggleUnitSystem,
  onSelectCPlane,
  onSelectWcs,
  onToggleAxes,
  showAxes = true,
  activeRadius = null,
  activeRectDimensions = null,
  activeLineDimensions = null,
  theme = 'light'
}) {
  const [cplaneMenuOpen, setCplaneMenuOpen] = useState(false);
  const [wcsMenuOpen, setWcsMenuOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setCplaneMenuOpen(false);
        setWcsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  const cplaneOptions = [
    { id: 'Top', label: 'Top (G17)' },
    { id: 'Front', label: 'Front (G18)' },
    { id: 'Right', label: 'Right (G19)' },
    { id: 'Isometric', label: 'Isometric' }
  ];

  const wcsOptions = ['G54', 'G55', 'G56', 'G57', 'G58', 'G59'];

  return (
    <footer className="app-statusbar" aria-label="Status Bar" ref={containerRef} style={{ position: 'relative' }}>
      <div className="status-left">
        {/* Dynamic CAD Mode Indicators */}
        {activeRadius !== null && activeRadius !== undefined && (
          <>
            <div className="status-item" style={{ background: 'rgba(2, 132, 199, 0.25)', padding: '2px 6px', borderRadius: '3px' }}>
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                Radius = {Number(activeRadius).toFixed(3)}
              </span>
            </div>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
          </>
        )}

        {activeRectDimensions && (
          <>
            <div className="status-item" style={{ background: 'rgba(2, 132, 199, 0.25)', padding: '2px 6px', borderRadius: '3px', gap: '8px', display: 'flex' }}>
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                Width = {Number(activeRectDimensions.width || 0).toFixed(3)}
              </span>
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                Height = {Number(activeRectDimensions.height || 0).toFixed(3)}
              </span>
            </div>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
          </>
        )}

        {activeLineDimensions && (
          <>
            <div className="status-item" style={{ background: 'rgba(2, 132, 199, 0.25)', padding: '2px 6px', borderRadius: '3px', gap: '8px', display: 'flex' }}>
              <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                Length = {Number(activeLineDimensions.length || 0).toFixed(3)}
              </span>
              {activeLineDimensions.angle !== undefined && (
                <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                  Angle = {Number(activeLineDimensions.angle || 0).toFixed(1)}°
                </span>
              )}
            </div>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
          </>
        )}

        {/* Section View */}
        <div className="status-item" style={{ cursor: 'pointer' }} onClick={onToggleSectionView}>
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>SECTION VIEW:</span>
          <span className="status-val" style={{ color: isSectionView ? '#f43f5e' : '#e2e8f0', fontSize: '10.5px' }}>
            {isSectionView ? 'ON' : 'OFF'}
          </span>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Selected Entities */}
        <div className="status-item">
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>SELECTED ENTITIES:</span>
          <span className="status-val" style={{ fontSize: '10.5px' }}>{selectedCount}</span>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Coordinates Readout */}
        <div className="status-item" style={{ gap: '6px', fontFamily: 'monospace', fontSize: '10.5px' }}>
          <span>X:</span>
          <span className="status-val">{coords.x ?? '0.00000'}</span>
          <span>Y:</span>
          <span className="status-val">{coords.y ?? '0.00000'}</span>
          <span>Z:</span>
          <span className="status-val">{coords.z ?? '0.00000'}</span>
          <span style={{ color: '#38bdf8', fontWeight: 700, marginLeft: '4px' }}>3D</span>
        </div>
      </div>

      <div className="status-right" style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
        {/* Origin Axes (F9) Toggle */}
        <button
          type="button"
          onClick={onToggleAxes}
          title="Toggle Origin Axes Crosshairs (F9)"
          style={{
            background: showAxes ? '#0369a1' : 'transparent',
            border: '1px solid #475569',
            borderRadius: '2px',
            color: showAxes ? '#ffffff' : '#94a3b8',
            padding: '2px 6px',
            cursor: 'pointer',
            fontSize: '10.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Crosshair size={11} />
          <span>F9 {showAxes ? 'ON' : 'OFF'}</span>
        </button>

        {/* CPlane with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setCplaneMenuOpen((p) => !p);
              setWcsMenuOpen(false);
            }}
            title="Click to Switch Construction Plane (Cplane)"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px'
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>CPLANE:</span>
            <span className="status-val" style={{ color: '#38bdf8', fontSize: '10.5px', fontWeight: 700 }}>
              {activeCPlane}
            </span>
            <ChevronDown size={10} color="#94a3b8" />
          </button>

          {cplaneMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                boxShadow: '0 -4px 14px rgba(0,0,0,0.15)',
                minWidth: '120px',
                padding: '4px 0',
                zIndex: 9999
              }}
            >
              {cplaneOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectCPlane?.(opt.id);
                    setCplaneMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 10px',
                    fontSize: '11px',
                    background: activeCPlane.includes(opt.id) ? '#e0f2fe' : 'transparent',
                    color: activeCPlane.includes(opt.id) ? '#0369a1' : '#0f172a',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TPlane */}
        <div className="status-item">
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>TPLANE:</span>
          <span className="status-val" style={{ color: '#38bdf8', fontSize: '10.5px' }}>{activeTPlane}</span>
        </div>

        {/* WCS with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setWcsMenuOpen((p) => !p);
              setCplaneMenuOpen(false);
            }}
            title="Click to Switch Work Coordinate System (WCS G54-G59)"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px'
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>WCS:</span>
            <span className="status-val" style={{ color: '#4ade80', fontSize: '10.5px', fontWeight: 700 }}>
              {activeWcs}
            </span>
            <ChevronDown size={10} color="#94a3b8" />
          </button>

          {wcsMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                boxShadow: '0 -4px 14px rgba(0,0,0,0.15)',
                minWidth: '80px',
                padding: '4px 0',
                zIndex: 9999
              }}
            >
              {wcsOptions.map((wcs) => (
                <button
                  key={wcs}
                  type="button"
                  onClick={() => {
                    onSelectWcs?.(wcs);
                    setWcsMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: activeWcs === wcs ? '#f0fdf4' : 'transparent',
                    color: activeWcs === wcs ? '#16a34a' : '#0f172a',
                    fontWeight: activeWcs === wcs ? 700 : 400,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {wcs}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clickable Unit System (Metric / Inch) Badge */}
        <button
          type="button"
          onClick={onToggleUnitSystem}
          title={`Active Unit System: ${unitSystem === 'metric' ? 'Metric (mm, G21)' : 'Imperial (inch, G20)'}. Click to switch.`}
          style={{
            background: unitSystem === 'metric' ? '#166534' : '#854d0e',
            color: '#ffffff',
            border: 'none',
            borderRadius: '2px',
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.5px'
          }}
        >
          {unitSystem === 'metric' ? 'METRIC (mm)' : 'INCH (in)'}
        </button>

        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Viewport Action Mini Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            type="button"
            style={miniIconBtnStyle}
            title="AutoCursor Snapping Settings"
          >
            <Compass size={11} color="#cbd5e1" />
          </button>
          <button
            type="button"
            style={miniIconBtnStyle}
            title="Fit to Window"
          >
            <Maximize2 size={11} color="#cbd5e1" />
          </button>
          <button
            type="button"
            style={miniIconBtnStyle}
            title="Window Zoom"
          >
            <ZoomIn size={11} color="#cbd5e1" />
          </button>
          <button
            type="button"
            style={miniIconBtnStyle}
            title="Repaint Screen"
          >
            <RefreshCw size={11} color="#cbd5e1" />
          </button>
          <button
            type="button"
            style={miniIconBtnStyle}
            title="Pan View"
          >
            <Hand size={11} color="#cbd5e1" />
          </button>
          <button
            type="button"
            style={miniIconBtnStyle}
            title="Rotate View"
          >
            <Rotate3D size={11} color="#cbd5e1" />
          </button>
        </div>
      </div>
    </footer>
  );
}

const miniIconBtnStyle = {
  background: 'transparent',
  border: 'none',
  padding: '1px 3px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '2px',
  opacity: 0.85
};

import React from 'react';
import {
  Maximize2, ZoomIn, RefreshCw, Hand, Rotate3D,
  Grid, Compass, Layers, CheckSquare
} from 'lucide-react';

export default function StatusBar({
  coords = { x: '1.29604', y: '-1.33426', z: '0.00000' },
  activeWcs = 'Top',
  activeCPlane = 'Top',
  activeTPlane = 'Top',
  selectedCount = 0,
  isSectionView = false,
  onToggleSectionView,
  unitSystem = 'imperial',
  activeRadius = null,
  activeRectDimensions = null,
  activeLineDimensions = null,
  theme = 'light'
}) {
  return (
    <footer className="app-statusbar" aria-label="Status Bar">
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

      <div className="status-right" style={{ gap: '10px' }}>
        {/* CPlane */}
        <div className="status-item">
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>CPLANE:</span>
          <span className="status-val" style={{ color: '#38bdf8', fontSize: '10.5px' }}>{activeCPlane}</span>
        </div>

        {/* TPlane */}
        <div className="status-item">
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>TPLANE:</span>
          <span className="status-val" style={{ color: '#38bdf8', fontSize: '10.5px' }}>{activeTPlane}</span>
        </div>

        {/* WCS */}
        <div className="status-item">
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>WCS:</span>
          <span className="status-val" style={{ color: '#4ade80', fontSize: '10.5px' }}>{activeWcs}</span>
        </div>

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

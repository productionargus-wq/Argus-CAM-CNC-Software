import React from 'react';

export default function StatusBar({
  coords = { x: '-390.6200', y: '-233.6562', z: '100.0000' },
  activeWcs = 'G54',
  activeMachine = { name: 'DMG MORI DMU 50 (5X)' },
  theme = 'light'
}) {
  return (
    <footer className="app-statusbar" aria-label="Status Bar">
      <div className="status-left">
        <div className="status-item">
          <span>MACHINE:</span>
          <span className="status-val" style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{activeMachine?.name || 'DMU 50 (5X)'}</span>
        </div>

        <div className="status-item">
          <span>SELECTED:</span>
          <span className="status-val">1 (Solid Mesh)</span>
        </div>

        <div className="status-item" style={{ color: 'var(--accent-cyan)' }}>
          <span>X:</span>
          <span className="status-val">{coords.x}</span>
          <span>Y:</span>
          <span className="status-val">{coords.y}</span>
          <span>Z:</span>
          <span className="status-val">{coords.z}</span>
          <span style={{ color: 'var(--accent-violet)', fontWeight: 700 }}>3D</span>
        </div>
      </div>

      <div className="status-right">
        <div className="status-item">
          <span>CPLANE:</span>
          <span className="status-val">Top (G17)</span>
        </div>

        <div className="status-item">
          <span>TPLANE:</span>
          <span className="status-val">Top</span>
        </div>

        <div className="status-item">
          <span>WCS:</span>
          <span className="status-val" style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{activeWcs}</span>
        </div>

        <div className="status-item">
          <span className="status-val" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>Metric (G21)</span>
        </div>
      </div>
    </footer>
  );
}

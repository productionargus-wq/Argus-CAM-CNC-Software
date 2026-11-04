import React from 'react';
import {
  MousePointer, Minus, Square, Circle, CircleDot,
  Grid, Magnet, Lock, Trash2, CheckCircle2, X, PlusCircle,
  Layers, ArrowUpRight
} from 'lucide-react';

export default function DrawingToolbarHUD({
  activeTool,
  onChangeTool,
  gridSnap,
  onToggleGridSnap,
  gridStep,
  onChangeGridStep,
  objectSnap,
  onToggleObjectSnap,
  orthoLock,
  onToggleOrthoLock,
  drawnCount = 0,
  onClearDrawing,
  onFinishSketch,
  onGenerateToolpathFromSketch,
  cursorCoords = { x: 0, y: 0, z: 0 },
  dimensionFeedback = null,
  theme = 'light'
}) {
  const isLight = theme !== 'dark';

  return (
    <div
      style={{
        position: 'absolute',
        top: '68px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: isLight ? 'rgba(255, 255, 255, 0.97)' : 'rgba(15, 23, 42, 0.94)',
        border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.45)',
        boxShadow: isLight ? '0 10px 28px rgba(0, 0, 0, 0.12)' : '0 16px 36px rgba(0,0,0,0.65)',
        borderRadius: '8px',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backdropFilter: 'blur(12px)',
        userSelect: 'none',
        color: isLight ? '#0f172a' : '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* CAD Sketcher Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: isLight ? '1px solid #e2e8f0' : '1px solid #334155', paddingRight: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          ✏️ CAD Sketcher
        </span>
        <span style={{
          fontSize: '9.5px',
          background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.18)',
          color: '#0284c7',
          border: isLight ? '1px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '3px',
          padding: '1px 5px',
          fontWeight: 700
        }}>
          G17 TOP
        </span>
      </div>

      {/* Primary Drawing Tool Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { id: 'select', label: 'Select', icon: MousePointer, title: 'Select Entity (Esc)' },
          { id: 'line', label: 'Line', icon: Minus, title: 'Draw 2-Point Line (L) - Click start, drag, click end' },
          { id: 'rect', label: 'Rectangle', icon: Square, title: 'Draw Rectangle (R) - Click corner, drag to size' },
          { id: 'circle', label: 'Circle', icon: Circle, title: 'Draw Circle (C) - Click center, drag radius' },
          { id: 'drill', label: 'Drill Point', icon: CircleDot, title: 'Place Drill Points (P) - Click to drop hole coordinates' }
        ].map(({ id, label, icon: Icon, title }) => {
          const isActive = activeTool === id;
          return (
            <button
              key={id}
              onClick={() => onChangeTool(id)}
              style={{
                background: isActive ? '#0284c7' : isLight ? '#f8fafc' : 'transparent',
                color: isActive ? '#fff' : isLight ? '#334155' : '#94a3b8',
                border: isActive ? '1px solid #0284c7' : isLight ? '1px solid #e2e8f0' : '1px solid transparent',
                padding: '5px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                boxShadow: isActive ? '0 2px 6px rgba(2, 132, 199, 0.3)' : 'none'
              }}
              title={title}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Snap Controls Separator */}
      <div style={{ height: '22px', width: '1px', background: isLight ? '#e2e8f0' : '#334155' }} />

      {/* Snapping Options */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Grid Snap Toggle */}
        <button
          onClick={onToggleGridSnap}
          style={{
            background: gridSnap ? (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.2)') : (isLight ? '#f8fafc' : 'transparent'),
            color: gridSnap ? '#15803d' : '#64748b',
            border: `1px solid ${gridSnap ? (isLight ? '#86efac' : '#10b981') : (isLight ? '#cbd5e1' : '#334155')}`,
            padding: '4px 7px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 700
          }}
          title="Toggle Grid Snapping"
        >
          <Grid size={13} />
          <span>Grid</span>
        </button>

        {/* Grid Step Selector */}
        <select
          value={gridStep}
          onChange={(e) => onChangeGridStep(Number(e.target.value))}
          style={{
            background: isLight ? '#f8fafc' : '#090d14',
            color: isLight ? '#0284c7' : '#38bdf8',
            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Grid Step Interval (mm)"
        >
          <option value={1}>1.0 mm</option>
          <option value={2}>2.0 mm</option>
          <option value={5}>5.0 mm</option>
          <option value={10}>10.0 mm</option>
        </select>

        {/* Endpoint / Midpoint / Center Snap Toggle */}
        <button
          onClick={onToggleObjectSnap}
          style={{
            background: objectSnap ? (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.2)') : (isLight ? '#f8fafc' : 'transparent'),
            color: objectSnap ? '#0284c7' : '#64748b',
            border: `1px solid ${objectSnap ? (isLight ? '#7dd3fc' : '#38bdf8') : (isLight ? '#cbd5e1' : '#334155')}`,
            padding: '4px 7px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 700
          }}
          title="Toggle Object Snap (Endpoints, Midpoints, Centers)"
        >
          <Magnet size={13} />
          <span>O-Snap</span>
        </button>

        {/* Ortho Lock Toggle */}
        <button
          onClick={onToggleOrthoLock}
          style={{
            background: orthoLock ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.2)') : (isLight ? '#f8fafc' : 'transparent'),
            color: orthoLock ? '#b45309' : '#64748b',
            border: `1px solid ${orthoLock ? (isLight ? '#fcd34d' : '#f59e0b') : (isLight ? '#cbd5e1' : '#334155')}`,
            padding: '4px 7px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 700
          }}
          title="Toggle Orthogonal Lock (Horizontal/Vertical only)"
        >
          <Lock size={13} />
          <span>Ortho</span>
        </button>
      </div>

      {/* Coordinate & Live Dimension Feedback */}
      <div style={{ height: '22px', width: '1px', background: isLight ? '#e2e8f0' : '#334155' }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '10.5px',
        fontFamily: 'monospace',
        background: isLight ? '#f1f5f9' : '#090d14',
        padding: '3px 8px',
        borderRadius: '4px',
        border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
        color: isLight ? '#0f172a' : '#f8fafc'
      }}>
        <span>X: <strong style={{ color: '#0284c7' }}>{cursorCoords.x.toFixed(1)}</strong></span>
        <span>Y: <strong style={{ color: '#10b981' }}>{cursorCoords.z.toFixed(1)}</strong></span>
        {dimensionFeedback && (
          <span style={{ color: '#d97706', fontWeight: 700, borderLeft: isLight ? '1px solid #cbd5e1' : '1px solid #334155', paddingLeft: '6px' }}>
            {dimensionFeedback}
          </span>
        )}
      </div>

      {/* Actions: Extrude to CAM / Clear / Close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
        {drawnCount > 0 && (
          <>
            <button
              onClick={onGenerateToolpathFromSketch}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
              }}
              title="Create CNC Pocket or Contour Toolpath directly from your drawn sketch"
            >
              <ArrowUpRight size={14} />
              <span>Generate Toolpath</span>
            </button>

            <button
              onClick={onClearDrawing}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Clear all drawn sketches"
            >
              <Trash2 size={13} />
              <span>Clear ({drawnCount})</span>
            </button>
          </>
        )}

        <button
          onClick={onFinishSketch}
          style={{
            background: 'transparent',
            color: isLight ? '#64748b' : '#94a3b8',
            border: 'none',
            cursor: 'pointer',
            padding: '3px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Exit Sketch Mode"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}


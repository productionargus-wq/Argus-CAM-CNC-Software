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
  dimensionFeedback = null
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '68px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.94)',
        border: '1px solid rgba(56, 189, 248, 0.45)',
        boxShadow: '0 16px 36px rgba(0,0,0,0.65)',
        borderRadius: '8px',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backdropFilter: 'blur(12px)',
        userSelect: 'none',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* CAD Sketcher Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid #334155', paddingRight: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          ✏️ CAD Sketcher
        </span>
        <span style={{
          fontSize: '9.5px',
          background: 'rgba(56, 189, 248, 0.18)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '3px',
          padding: '1px 5px',
          fontWeight: 700
        }}>
          G17 TOP
        </span>
      </div>

      {/* Primary Drawing Tool Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onChangeTool('select')}
          style={{
            background: activeTool === 'select' ? '#0284c7' : 'transparent',
            color: activeTool === 'select' ? '#fff' : '#94a3b8',
            border: activeTool === 'select' ? '1px solid #38bdf8' : '1px solid transparent',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600
          }}
          title="Select Entity (Esc)"
        >
          <MousePointer size={14} />
          <span>Select</span>
        </button>

        <button
          onClick={() => onChangeTool('line')}
          style={{
            background: activeTool === 'line' ? '#0284c7' : 'transparent',
            color: activeTool === 'line' ? '#fff' : '#94a3b8',
            border: activeTool === 'line' ? '1px solid #38bdf8' : '1px solid transparent',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600
          }}
          title="Draw 2-Point Line (L) - Click start, drag, click end"
        >
          <Minus size={14} />
          <span>Line</span>
        </button>

        <button
          onClick={() => onChangeTool('rect')}
          style={{
            background: activeTool === 'rect' ? '#0284c7' : 'transparent',
            color: activeTool === 'rect' ? '#fff' : '#94a3b8',
            border: activeTool === 'rect' ? '1px solid #38bdf8' : '1px solid transparent',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600
          }}
          title="Draw Rectangle (R) - Click corner, drag to size"
        >
          <Square size={14} />
          <span>Rectangle</span>
        </button>

        <button
          onClick={() => onChangeTool('circle')}
          style={{
            background: activeTool === 'circle' ? '#0284c7' : 'transparent',
            color: activeTool === 'circle' ? '#fff' : '#94a3b8',
            border: activeTool === 'circle' ? '1px solid #38bdf8' : '1px solid transparent',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600
          }}
          title="Draw Circle (C) - Click center, drag radius"
        >
          <Circle size={14} />
          <span>Circle</span>
        </button>

        <button
          onClick={() => onChangeTool('drill')}
          style={{
            background: activeTool === 'drill' ? '#0284c7' : 'transparent',
            color: activeTool === 'drill' ? '#fff' : '#94a3b8',
            border: activeTool === 'drill' ? '1px solid #38bdf8' : '1px solid transparent',
            padding: '5px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600
          }}
          title="Place Drill Points (P) - Click to drop hole coordinates"
        >
          <CircleDot size={14} />
          <span>Drill Point</span>
        </button>
      </div>

      {/* Snap Controls Separator */}
      <div style={{ height: '22px', width: '1px', background: '#334155' }} />

      {/* Snapping Options */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Grid Snap Toggle */}
        <button
          onClick={onToggleGridSnap}
          style={{
            background: gridSnap ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: gridSnap ? '#10b981' : '#64748b',
            border: `1px solid ${gridSnap ? '#10b981' : '#334155'}`,
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
            background: '#090d14',
            color: '#38bdf8',
            border: '1px solid #334155',
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
            background: objectSnap ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: objectSnap ? '#38bdf8' : '#64748b',
            border: `1px solid ${objectSnap ? '#38bdf8' : '#334155'}`,
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
            background: orthoLock ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            color: orthoLock ? '#f59e0b' : '#64748b',
            border: `1px solid ${orthoLock ? '#f59e0b' : '#334155'}`,
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
      <div style={{ height: '22px', width: '1px', background: '#334155' }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '10.5px',
        fontFamily: 'monospace',
        background: '#090d14',
        padding: '3px 8px',
        borderRadius: '4px',
        border: '1px solid #1e293b'
      }}>
        <span>X: <strong style={{ color: '#38bdf8' }}>{cursorCoords.x.toFixed(1)}</strong></span>
        <span>Y: <strong style={{ color: '#10b981' }}>{cursorCoords.z.toFixed(1)}</strong></span>
        {dimensionFeedback && (
          <span style={{ color: '#facc15', fontWeight: 700, borderLeft: '1px solid #334155', paddingLeft: '6px' }}>
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
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid #ef4444',
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
            color: '#94a3b8',
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

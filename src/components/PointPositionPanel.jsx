import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function PointPositionPanel({
  coords = { x: 0, y: 0, z: 0 },
  onChangeCoords,
  pointMethod = 'position', // 'position' | 'along_curve' | 'endpoints' | 'arc_center'
  onChangePointMethod,
  numSegments = 5,
  onChangeNumSegments,
  alongDistance = 10,
  onChangeAlongDistance,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  const [methodExpanded, setMethodExpanded] = useState(true);
  const [coordsExpanded, setCoordsExpanded] = useState(true);
  const [alongExpanded, setAlongExpanded] = useState(true);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#ffffff',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#1e293b',
        userSelect: 'none',
        overflowY: 'auto'
      }}
    >
      {/* 1. Mastercam Header: Title with Pin & Close */}
      <div
        style={{
          height: '28px',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
          Point Position
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            title="Pin Panel"
            style={{
              width: '18px',
              height: '18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Pin size={13} />
          </button>
          <button
            type="button"
            onClick={onCancel}
            title="Close (Esc)"
            style={{
              width: '18px',
              height: '18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Mastercam Dark Action Bar */}
      <div
        style={{
          height: '34px',
          background: '#2b2d31',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          borderBottom: '1px solid #1e2024'
        }}
      >
        <button
          type="button"
          title="Help on Point Position"
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#0284c7',
            border: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          ?
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            type="button"
            onClick={onApply}
            title="OK and Create New (Apply)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#0284c7',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onOk}
            title="OK: Accept and close tool (Enter)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#16a34a',
              border: '1.5px solid #4ade80',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <Check size={14} strokeWidth={3} />
          </button>

          <button
            type="button"
            onClick={onCancel}
            title="Cancel (Esc)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#dc2626',
              border: '1.5px solid #f87171',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* 3. Method Accordion */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div
          onClick={() => setMethodExpanded(!methodExpanded)}
          style={{
            height: '26px',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f1f5f9',
            cursor: 'pointer',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#334155'
          }}
        >
          <span>Method</span>
          {methodExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {methodExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'position', label: 'Point Position (AutoCursor / Coord)' },
              { id: 'along_curve', label: 'Points Along Curve (Segment / Dist)' },
              { id: 'endpoints', label: 'Curve Endpoints' },
              { id: 'arc_center', label: 'Arc / Hole Center Points' }
            ].map((m) => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="point_method"
                  checked={pointMethod === m.id}
                  onChange={() => onChangePointMethod && onChangePointMethod(m.id)}
                />
                {m.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 4. Coordinate Inputs */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div
          onClick={() => setCoordsExpanded(!coordsExpanded)}
          style={{
            height: '26px',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f1f5f9',
            cursor: 'pointer',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#334155'
          }}
        >
          <span>Point Coordinates (AutoCursor)</span>
          {coordsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {coordsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SketchNumericInput
              label="X:"
              value={coords.x ?? 0}
              onChange={(val) => onChangeCoords && onChangeCoords({ ...coords, x: val })}
              step={1}
            />
            <SketchNumericInput
              label="Y:"
              value={coords.y ?? 0}
              onChange={(val) => onChangeCoords && onChangeCoords({ ...coords, y: val })}
              step={1}
            />
            <SketchNumericInput
              label="Z:"
              value={coords.z ?? 0}
              onChange={(val) => onChangeCoords && onChangeCoords({ ...coords, z: val })}
              step={1}
            />
          </div>
        )}
      </div>

      {/* 5. Along Curve Options */}
      {pointMethod === 'along_curve' && (
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div
            onClick={() => setAlongExpanded(!alongExpanded)}
            style={{
              height: '26px',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f1f5f9',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Along Curve Distribution</span>
            {alongExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
          {alongExpanded && (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SketchNumericInput
                label="Segments:"
                value={numSegments}
                onChange={(val) => onChangeNumSegments && onChangeNumSegments(val)}
                min={1}
                step={1}
              />
              <SketchNumericInput
                label="Distance:"
                value={alongDistance}
                onChange={(val) => onChangeAlongDistance && onChangeAlongDistance(val)}
                min={0.1}
                step={1}
              />
            </div>
          )}
        </div>
      )}

      {/* Info Tip */}
      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>Mastercam Tip:</strong> Click directly in the 3D viewport or type coordinates in the AutoCursor bar. Press <strong>Enter</strong> to commit or <strong>+</strong> to place consecutive points.
      </div>
    </div>
  );
}

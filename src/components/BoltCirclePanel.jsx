import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function BoltCirclePanel({
  pcd = 60,
  onChangePcd,
  numHoles = 6,
  onChangeNumHoles,
  startAngle = 0,
  onChangeStartAngle,
  sweepAngle = 360,
  onChangeSweepAngle,
  holeDiameter = 6.8,
  onChangeHoleDiameter,
  center = { x: 0, y: 0, z: 0 },
  onChangeCenter,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  const [paramsExpanded, setParamsExpanded] = useState(true);
  const [centerExpanded, setCenterExpanded] = useState(true);

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
          padding: '0 32px 0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
          Bolt Circle (PCD)
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
          title="Help on Bolt Circle"
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
            title="OK and Create New (Apply ✓+)"
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 12.5 6.5 17 14 7.5" />
              <line x1="18.5" y1="4.5" x2="18.5" y2="13.5" />
              <line x1="14" y1="9" x2="23" y2="9" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onOk}
            title="OK: Accept bolt circle and close tool (Enter)"
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

      {/* 3. PCD Parameters */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div
          onClick={() => setParamsExpanded(!paramsExpanded)}
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
          <span>Bolt Circle Geometry</span>
          {paramsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {paramsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SketchNumericInput
              label="PCD (Dia):"
              value={pcd}
              onChange={(val) => onChangePcd && onChangePcd(val)}
              min={1}
              step={1}
            />
            <SketchNumericInput
              label="No. of Holes:"
              value={numHoles}
              onChange={(val) => onChangeNumHoles && onChangeNumHoles(val)}
              min={1}
              step={1}
            />
            <SketchNumericInput
              label="Start Angle:"
              value={startAngle}
              onChange={(val) => onChangeStartAngle && onChangeStartAngle(val)}
              step={5}
            />
            <SketchNumericInput
              label="Sweep Angle:"
              value={sweepAngle}
              onChange={(val) => onChangeSweepAngle && onChangeSweepAngle(val)}
              step={15}
            />
            <SketchNumericInput
              label="Hole Diameter:"
              value={holeDiameter}
              onChange={(val) => onChangeHoleDiameter && onChangeHoleDiameter(val)}
              min={0.1}
              step={0.5}
            />
          </div>
        )}
      </div>

      {/* 4. Center Coordinates */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div
          onClick={() => setCenterExpanded(!centerExpanded)}
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
          <span>Center Coordinates</span>
          {centerExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {centerExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SketchNumericInput
              label="Center X:"
              value={center.x ?? 0}
              onChange={(val) => onChangeCenter && onChangeCenter({ ...center, x: val })}
              step={1}
            />
            <SketchNumericInput
              label="Center Y:"
              value={center.y ?? 0}
              onChange={(val) => onChangeCenter && onChangeCenter({ ...center, y: val })}
              step={1}
            />
            <SketchNumericInput
              label="Center Z:"
              value={center.z ?? 0}
              onChange={(val) => onChangeCenter && onChangeCenter({ ...center, z: val })}
              step={1}
            />
          </div>
        )}
      </div>

      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>Bolt Circle Summary:</strong> Radius: {(pcd / 2).toFixed(1)} mm | Spacing: {((sweepAngle === 360 ? 360 / Math.max(1, numHoles) : sweepAngle / Math.max(1, numHoles - 1))).toFixed(1)}°
      </div>
    </div>
  );
}

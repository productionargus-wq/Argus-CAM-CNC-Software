import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function Arc3PointsPanel({
  mode = 'arc3pt', // 'arc3pt' | 'circle_edge'
  onChangeMode,
  p1 = null,
  p2 = null,
  p3 = null,
  radius = 25,
  onChangeRadius,
  isRadiusLocked = false,
  onToggleRadiusLock,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  const [pointsExpanded, setPointsExpanded] = useState(true);
  const [paramsExpanded, setParamsExpanded] = useState(true);

  const pointsCount = (p1 ? 1 : 0) + (p2 ? 1 : 0) + (p3 ? 1 : 0);

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
      {/* 1. Header */}
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
          {mode === 'circle_edge' ? 'Circle Edge Point' : 'Arc 3 Points'}
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

      {/* 2. Action Bar */}
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
          title="Help on Arc 3 Points"
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

      {/* 3. Sequential Points Tracker */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div
          onClick={() => setPointsExpanded(!pointsExpanded)}
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
          <span>Point Sequence ({pointsCount} of 3)</span>
          {pointsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {pointsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: p1 ? '#ecfdf5' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '3px' }}>
              <span>Pt 1 (Start):</span>
              <span style={{ fontWeight: 600, color: p1 ? '#059669' : '#94a3b8' }}>
                {p1 ? `X:${p1.x.toFixed(1)} Y:${p1.y.toFixed(1)} Z:${(p1.z ?? p1.y).toFixed(1)}` : 'Click on canvas...'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: p2 ? '#ecfdf5' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '3px' }}>
              <span>Pt 2 (End):</span>
              <span style={{ fontWeight: 600, color: p2 ? '#059669' : '#94a3b8' }}>
                {p2 ? `X:${p2.x.toFixed(1)} Y:${p2.y.toFixed(1)} Z:${(p2.z ?? p2.y).toFixed(1)}` : (p1 ? 'Click on canvas...' : 'Waiting for Pt 1')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: p3 ? '#ecfdf5' : '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '3px' }}>
              <span>Pt 3 (Through / Rad):</span>
              <span style={{ fontWeight: 600, color: p3 ? '#059669' : '#94a3b8' }}>
                {p3 ? `X:${p3.x.toFixed(1)} Y:${p3.y.toFixed(1)} Z:${(p3.z ?? p3.y).toFixed(1)}` : (p2 ? 'Click on canvas...' : 'Waiting for Pt 2')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Radius Override */}
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
          <span>Radius Dimension</span>
          {paramsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {paramsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SketchNumericInput
              label="Radius:"
              value={radius}
              onChange={(val) => onChangeRadius && onChangeRadius(val)}
              isLocked={isRadiusLocked}
              onToggleLock={onToggleRadiusLock}
              min={0.5}
              step={1}
            />
          </div>
        )}
      </div>

      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>Prompt:</strong> {pointsCount === 0 ? 'Click first endpoint on canvas' : pointsCount === 1 ? 'Click second endpoint on canvas' : 'Click third point to define arc curvature'}
      </div>
    </div>
  );
}

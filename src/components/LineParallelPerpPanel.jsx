import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function LineParallelPerpPanel({
  mode = 'parallel', // 'parallel' | 'perpendicular' | 'closest'
  onChangeMode,
  offsetDistance = 10,
  onChangeOffsetDistance,
  side = 'left', // 'left' | 'right' | 'both'
  onChangeSide,
  lineLength = 50,
  onChangeLineLength,
  isLengthLocked = false,
  onToggleLengthLock,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  const [paramsExpanded, setParamsExpanded] = useState(true);
  const [modeExpanded, setModeExpanded] = useState(true);

  const title = mode === 'perpendicular' ? 'Line Perpendicular' : mode === 'closest' ? 'Line Closest' : 'Line Parallel';

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
          {title}
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
          title={`Help on ${title}`}
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

      {/* 3. Mode Selector */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div
          onClick={() => setModeExpanded(!modeExpanded)}
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
          <span>Line Orientation Mode</span>
          {modeExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {modeExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'parallel', label: 'Line Parallel' },
              { id: 'perpendicular', label: 'Line Perpendicular' },
              { id: 'closest', label: 'Line Closest (Bridge Entities)' }
            ].map((m) => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="line_rel_mode"
                  checked={mode === m.id}
                  onChange={() => onChangeMode && onChangeMode(m.id)}
                />
                {m.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 4. Offset & Side Parameters */}
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
          <span>Parameters</span>
          {paramsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {paramsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mode === 'parallel' && (
              <>
                <SketchNumericInput
                  label="Offset Dist:"
                  value={offsetDistance}
                  onChange={(val) => onChangeOffsetDistance && onChangeOffsetDistance(val)}
                  min={0.1}
                  step={1}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span>Side:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['left', 'right', 'both'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onChangeSide && onChangeSide(s)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '11px',
                          background: side === s ? '#0284c7' : '#f1f5f9',
                          color: side === s ? '#ffffff' : '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === 'perpendicular' && (
              <SketchNumericInput
                label="Length:"
                value={lineLength}
                onChange={(val) => onChangeLineLength && onChangeLineLength(val)}
                isLocked={isLengthLocked}
                onToggleLock={onToggleLengthLock}
                min={1}
                step={1}
              />
            )}

            {mode === 'closest' && (
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Select first entity, then select second entity in viewport to bridge closest points.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>Mastercam Instruction:</strong> Click a line or curve in the 3D viewport. The parallel or perpendicular rubberband line will track your cursor position.
      </div>
    </div>
  );
}

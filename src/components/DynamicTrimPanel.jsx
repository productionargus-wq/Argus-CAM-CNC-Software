import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp, Scissors } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function DynamicTrimPanel({
  trimMode = 'dynamic', // 'dynamic' | 'trim_1' | 'trim_2' | 'trim_3' | 'divide'
  onChangeTrimMode,
  divideSegments = 2,
  onChangeDivideSegments,
  trimCount = 0,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  const [modeExpanded, setModeExpanded] = useState(true);
  const [paramsExpanded, setParamsExpanded] = useState(true);

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
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Scissors size={14} color="#f43f5e" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            Trim / Break / Extend
          </span>
        </div>
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
          title="Help on Trim Tools"
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
            title="OK and Keep Active (Apply)"
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
            title="OK: Accept trims and close tool (Enter)"
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

      {/* 3. Trim Mode Selector */}
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
          <span>Trim Operation Mode</span>
          {modeExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {modeExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'dynamic', label: 'Dynamic Trim (Drag Scissor to Snip)' },
              { id: 'trim_1', label: 'Trim 1 Entity (Trim / Extend to Boundary)' },
              { id: 'trim_2', label: 'Trim 2 Entities (Corner Intersection)' },
              { id: 'trim_3', label: 'Trim 3 Entities (Between Boundaries)' },
              { id: 'divide', label: 'Divide / Break at Point' }
            ].map((m) => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="trim_mode"
                  checked={trimMode === m.id}
                  onChange={() => onChangeTrimMode && onChangeTrimMode(m.id)}
                />
                {m.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 4. Divide Parameters */}
      {trimMode === 'divide' && (
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
            <span>Divide Options</span>
            {paramsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
          {paramsExpanded && (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <SketchNumericInput
                label="No. of Pieces:"
                value={divideSegments}
                onChange={(val) => onChangeDivideSegments && onChangeDivideSegments(val)}
                min={2}
                step={1}
              />
            </div>
          )}
        </div>
      )}

      {/* Instructions & Statistics */}
      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>How it works:</strong>
        {trimMode === 'dynamic' ? (
          <p style={{ margin: '4px 0 0' }}>Click and drag the cursor across any wireframe lines or arcs. The segment between bounding intersections will be instantly snipped!</p>
        ) : trimMode === 'trim_2' ? (
          <p style={{ margin: '4px 0 0' }}>Select two curves. Mastercam will find their intersection and trim or extend both to form a clean, closed corner.</p>
        ) : (
          <p style={{ margin: '4px 0 0' }}>Select target curve, then select boundary entity to trim or extend.</p>
        )}
        {trimCount > 0 && (
          <div style={{ marginTop: '6px', fontWeight: 600, color: '#16a34a' }}>
            ✓ {trimCount} segments trimmed in this session
          </div>
        )}
      </div>
    </div>
  );
}

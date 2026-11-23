import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function ModifyLengthPanel({
  mode = 'delta', // 'delta' | 'total' | 'percent'
  onChangeMode,
  value = 10,
  onChangeValue,
  endToModify = 2, // 1 | 2
  onChangeEndToModify,
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
          padding: '0 32px 0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
          Modify Length
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
          title="Help on Modify Length"
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
            title="OK: Accept change and close tool (Enter)"
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

      {/* 3. Modification Mode */}
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
          <span>Extension Method</span>
          {modeExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {modeExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'delta', label: 'Delta (+/- Length to add/subtract)' },
              { id: 'total', label: 'Total (Set exact total length)' },
              { id: 'percent', label: 'Percentage (%) of current length' }
            ].map((m) => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="modify_mode"
                  checked={mode === m.id}
                  onChange={() => onChangeMode && onChangeMode(m.id)}
                />
                {m.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* 4. Value & End Selection */}
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
          <span>Value & Endpoint</span>
          {paramsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {paramsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SketchNumericInput
              label={mode === 'delta' ? 'Delta (Δ):' : mode === 'total' ? 'Total Length:' : 'Percent (%):'}
              value={value}
              onChange={(val) => onChangeValue && onChangeValue(val)}
              step={mode === 'percent' ? 10 : 5}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span>Extend at:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 2, label: 'End 2' },
                  { id: 1, label: 'End 1' }
                ].map((end) => (
                  <button
                    key={end.id}
                    type="button"
                    onClick={() => onChangeEndToModify && onChangeEndToModify(end.id)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      background: endToModify === end.id ? '#0284c7' : '#f1f5f9',
                      color: endToModify === end.id ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    {end.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>Instruction:</strong> Click the end of any line entity in the 3D viewport to dynamically lengthen or shorten it by the specified amount.
      </div>
    </div>
  );
}

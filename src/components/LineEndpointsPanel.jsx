import React, { useState } from 'react';
import {
  Pin, Check, X,
  ChevronDown, ChevronUp
} from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function LineEndpointsPanel({
  length = 50,
  angle = 0,
  onChangeLength,
  onChangeAngle,
  isLengthLocked = false,
  isAngleLocked = false,
  onToggleLengthLock,
  onToggleAngleLock,
  lineType = 'freeform', // 'freeform' | 'horizontal' | 'vertical'
  onChangeLineType,
  isTangent = false,
  onToggleTangent,
  lineMethod = 'two_endpoints', // 'two_endpoints' | 'midpoint' | 'multi_line'
  onChangeLineMethod,
  activeEndpoint = 1,
  onSelectEndpoint,
  axisOffset = 0,
  onChangeAxisOffset,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  // Section collapse states
  const [entityExpanded, setEntityExpanded] = useState(true);
  const [endpointsExpanded, setEndpointsExpanded] = useState(true);
  const [dimensionsExpanded, setDimensionsExpanded] = useState(true);
  const [axisOffsetExpanded, setAxisOffsetExpanded] = useState(true);

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
          Line Endpoints
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
              padding: 0,
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
              padding: 0,
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

      {/* 2. Mastercam Dark Action Bar (Matching Images 1, 3, 4) */}
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
        {/* Help Button (Blue Circle with ?) */}
        <button
          type="button"
          title="Help on Line Endpoints"
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

        {/* Action Group: Blue (OK and Create New Operation), Green (OK), Red (Cancel) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Blue: OK and Create New Operation */}
          <button
            type="button"
            onClick={onApply}
            title="OK and Create New Operation"
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
              padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>

          {/* Green: OK */}
          <button
            type="button"
            onClick={onOk}
            title="OK: Accept line and close tool (Enter)"
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
              padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          >
            <Check size={14} strokeWidth={3} />
          </button>

          {/* Red: Cancel */}
          <button
            type="button"
            onClick={onCancel}
            title="Cancel: Abort line creation (Esc)"
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
              padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* 2. Basic Tab Header */}
      <div
        style={{
          background: '#e2e8f0',
          borderBottom: '1px solid #cbd5e1',
          padding: '2px 8px 0 8px',
          display: 'flex'
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderBottom: '1px solid #ffffff',
            borderRadius: '3px 3px 0 0',
            padding: '2px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#0284c7',
            marginBottom: '-1px'
          }}
        >
          Basic
        </div>
      </div>

      {/* 3. Panel Body */}
      <div style={{ flex: 1, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Section: Entity */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setEntityExpanded(!entityExpanded)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              borderBottom: entityExpanded ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Entity</span>
            {entityExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>

          {entityExpanded && (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Type Radio Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Type:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="lineType"
                    checked={lineType === 'freeform'}
                    onChange={() => onChangeLineType && onChangeLineType('freeform')}
                  />
                  Freeform
                </label>
                <div style={{ paddingLeft: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isTangent}
                      onChange={(e) => onToggleTangent && onToggleTangent(e.target.checked)}
                      disabled={lineType !== 'freeform'}
                    />
                    Tangent
                  </label>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="lineType"
                    checked={lineType === 'horizontal'}
                    onChange={() => onChangeLineType && onChangeLineType('horizontal')}
                  />
                  Horizontal
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="lineType"
                    checked={lineType === 'vertical'}
                    onChange={() => onChangeLineType && onChangeLineType('vertical')}
                  />
                  Vertical
                </label>
              </div>

              {/* Method Radio Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Method:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="lineMethod"
                    checked={lineMethod === 'two_endpoints'}
                    onChange={() => onChangeLineMethod && onChangeLineMethod('two_endpoints')}
                  />
                  Two endpoints
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="lineMethod"
                    checked={lineMethod === 'midpoint'}
                    onChange={() => onChangeLineMethod && onChangeLineMethod('midpoint')}
                  />
                  Midpoint
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#1e293b', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="lineMethod"
                    checked={lineMethod === 'multi_line'}
                    onChange={() => onChangeLineMethod && onChangeLineMethod('multi_line')}
                  />
                  Multi-line
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section: Endpoints */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setEndpointsExpanded(!endpointsExpanded)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              borderBottom: endpointsExpanded ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Endpoints</span>
            {endpointsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>

          {endpointsExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => onSelectEndpoint && onSelectEndpoint(1)}
                style={{
                  width: '26px',
                  height: '24px',
                  borderRadius: '3px',
                  border: activeEndpoint === 1 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: activeEndpoint === 1 ? '#e0f2fe' : '#f8fafc',
                  color: activeEndpoint === 1 ? '#0284c7' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Endpoint 1"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => onSelectEndpoint && onSelectEndpoint(2)}
                style={{
                  width: '26px',
                  height: '24px',
                  borderRadius: '3px',
                  border: activeEndpoint === 2 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: activeEndpoint === 2 ? '#e0f2fe' : '#f8fafc',
                  color: activeEndpoint === 2 ? '#0284c7' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Endpoint 2"
              >
                2
              </button>
            </div>
          )}
        </div>

        {/* Section: Dimensions */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setDimensionsExpanded(!dimensionsExpanded)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              borderBottom: dimensionsExpanded ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Dimensions</span>
            {dimensionsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>

          {dimensionsExpanded && (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Length */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569', width: '52px' }}>Length:</span>
                <SketchNumericInput
                  value={Number(length) || 0}
                  min={0.01}
                  step={1}
                  decimals={4}
                  allowNegative={false}
                  onChangeNumber={(num) => onChangeLength && onChangeLength(num)}
                  isLocked={isLengthLocked}
                  onToggleLock={onToggleLengthLock}
                  lockTitle={isLengthLocked ? 'Unlock Length' : 'Lock Length'}
                />
              </div>

              {/* Angle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569', width: '52px' }}>Angle:</span>
                <SketchNumericInput
                  value={Number(angle) || 0}
                  min={-360}
                  max={360}
                  step={5}
                  decimals={2}
                  allowNegative={true}
                  onChangeNumber={(num) => onChangeAngle && onChangeAngle(num)}
                  isLocked={isAngleLocked}
                  onToggleLock={onToggleAngleLock}
                  lockTitle={isAngleLocked ? 'Unlock Angle' : 'Lock Angle'}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section: Axis Offset */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setAxisOffsetExpanded(!axisOffsetExpanded)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              borderBottom: axisOffsetExpanded ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Axis Offset</span>
            {axisOffsetExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>

          {axisOffsetExpanded && (
            <div style={{ padding: '8px' }}>
              <SketchNumericInput
                value={Number(axisOffset) || 0}
                step={1}
                decimals={4}
                allowNegative={true}
                onChangeNumber={(num) => onChangeAxisOffset && onChangeAxisOffset(num)}
                showLock={false}
                showStepper={false}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

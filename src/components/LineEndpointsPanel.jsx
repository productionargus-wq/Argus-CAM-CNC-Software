import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Pin, Check, X, Lock, Unlock,
  ChevronDown, ChevronUp
} from 'lucide-react';

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
  theme = 'light'
}) {
  const isLight = theme !== 'dark';

  // Section collapse states
  const [entityExpanded, setEntityExpanded] = useState(true);
  const [endpointsExpanded, setEndpointsExpanded] = useState(true);
  const [dimensionsExpanded, setDimensionsExpanded] = useState(true);
  const [axisOffsetExpanded, setAxisOffsetExpanded] = useState(true);

  // Local text input states for clean typing
  const [lengthInput, setLengthInput] = useState(length.toFixed(4));
  const [angleInput, setAngleInput] = useState(angle.toFixed(1));
  const [offsetInput, setOffsetInput] = useState(axisOffset.toFixed(1));

  useEffect(() => {
    setLengthInput(length.toFixed(4));
  }, [length]);

  useEffect(() => {
    setAngleInput(angle.toFixed(1));
  }, [angle]);

  useEffect(() => {
    setOffsetInput(axisOffset.toFixed(1));
  }, [axisOffset]);

  const handleLengthChange = (valStr) => {
    setLengthInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && onChangeLength) {
      onChangeLength(num);
    }
  };

  const handleAngleChange = (valStr) => {
    setAngleInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && onChangeAngle) {
      onChangeAngle(num);
    }
  };

  const handleOffsetChange = (valStr) => {
    setOffsetInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && onChangeAxisOffset) {
      onChangeAxisOffset(num);
    }
  };

  const stepLength = (delta) => {
    const current = parseFloat(lengthInput) || length;
    const next = Math.max(0.0001, current + delta);
    handleLengthChange(next.toFixed(4));
  };

  const stepAngle = (delta) => {
    const current = parseFloat(angleInput) || angle;
    const next = (current + delta + 360) % 360;
    handleAngleChange(next.toFixed(1));
  };

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
      {/* 1. Header with Title & Action Controls */}
      <div
        style={{
          minHeight: '34px',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
            Line Endpoints
          </span>
        </div>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            type="button"
            title="Help on Line Endpoints"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#0284c7',
              border: 'none',
              color: '#ffffff',
              fontSize: '11px',
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
            <Pin size={12} />
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: '#1e293b',
              borderRadius: '14px',
              padding: '2px 4px'
            }}
          >
            {/* Blue Apply */}
            <button
              type="button"
              onClick={onApply}
              title="Apply: Commit line and create another (Enter)"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#0284c7',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              <Check size={11} strokeWidth={3} />
            </button>

            {/* Green OK */}
            <button
              type="button"
              onClick={onOk}
              title="OK: Accept line and close tool (Enter)"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#16a34a',
                border: '1px solid #4ade80',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              <Check size={11} strokeWidth={3} />
            </button>

            {/* Red Cancel */}
            <button
              type="button"
              onClick={onCancel}
              title="Cancel: Abort line creation (Esc)"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#dc2626',
                border: '1px solid #f87171',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              <X size={11} strokeWidth={3} />
            </button>
          </div>
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    background: '#ffffff',
                    flex: 1,
                    overflow: 'hidden',
                    height: '22px'
                  }}
                >
                  <input
                    type="text"
                    value={lengthInput}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      padding: '2px 4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      width: '100%',
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #cbd5e1', width: '14px', height: '100%' }}>
                    <button
                      type="button"
                      onClick={() => stepLength(1.0)}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: '#f1f5f9',
                        fontSize: '6px',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => stepLength(-1.0)}
                      style={{
                        flex: 1,
                        border: 'none',
                        borderTop: '1px solid #cbd5e1',
                        background: '#f1f5f9',
                        fontSize: '6px',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleLengthLock}
                  title={isLengthLocked ? 'Unlock Length' : 'Lock Length'}
                  style={{
                    width: '20px',
                    height: '22px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    background: isLengthLocked ? '#fef3c7' : '#ffffff',
                    color: isLengthLocked ? '#d97706' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {isLengthLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>

              {/* Angle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569', width: '52px' }}>Angle:</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    background: '#ffffff',
                    flex: 1,
                    overflow: 'hidden',
                    height: '22px'
                  }}
                >
                  <input
                    type="text"
                    value={angleInput}
                    onChange={(e) => handleAngleChange(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      padding: '2px 4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      width: '100%',
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #cbd5e1', width: '14px', height: '100%' }}>
                    <button
                      type="button"
                      onClick={() => stepAngle(5.0)}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: '#f1f5f9',
                        fontSize: '6px',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => stepAngle(-5.0)}
                      style={{
                        flex: 1,
                        border: 'none',
                        borderTop: '1px solid #cbd5e1',
                        background: '#f1f5f9',
                        fontSize: '6px',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleAngleLock}
                  title={isAngleLocked ? 'Unlock Angle' : 'Lock Angle'}
                  style={{
                    width: '20px',
                    height: '22px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    background: isAngleLocked ? '#fef3c7' : '#ffffff',
                    color: isAngleLocked ? '#d97706' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {isAngleLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
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
              <input
                type="text"
                value={offsetInput}
                onChange={(e) => handleOffsetChange(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  padding: '3px 6px',
                  fontSize: '11px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

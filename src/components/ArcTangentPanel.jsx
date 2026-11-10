import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Pin, Check, X, Lock, Unlock,
  ChevronDown, ChevronUp
} from 'lucide-react';

export default function ArcTangentPanel({
  radius = 25,
  onChangeRadius,
  isLocked = false,
  onToggleLock,
  entityMethod = 'one_entity', // 'one_entity' | 'two_entities' | 'three_entities'
  onChangeEntityMethod,
  onApply,
  onOk,
  onCancel,
  theme = 'light'
}) {
  const isLight = theme !== 'dark';

  const [entityExpanded, setEntityExpanded] = useState(true);
  const [sizeExpanded, setSizeExpanded] = useState(true);

  const [radiusInput, setRadiusInput] = useState(radius.toFixed(1));
  const [diameterInput, setDiameterInput] = useState((radius * 2).toFixed(1));

  useEffect(() => {
    setRadiusInput(radius.toFixed(1));
    setDiameterInput((radius * 2).toFixed(1));
  }, [radius]);

  const handleRadiusChange = (valStr) => {
    setRadiusInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      setDiameterInput((num * 2).toFixed(1));
      if (onChangeRadius) onChangeRadius(num);
    }
  };

  const handleDiameterChange = (valStr) => {
    setDiameterInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      setRadiusInput((num / 2).toFixed(1));
      if (onChangeRadius) onChangeRadius(num / 2);
    }
  };

  const stepRadius = (delta) => {
    const current = parseFloat(radiusInput) || radius;
    const next = Math.max(0.1, current + delta);
    handleRadiusChange(next.toFixed(1));
  };

  const stepDiameter = (delta) => {
    const current = parseFloat(diameterInput) || (radius * 2);
    const next = Math.max(0.2, current + delta);
    handleDiameterChange(next.toFixed(1));
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
          Arc Tangent
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
          title="Help on Arc Tangent"
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
            title="OK: Accept arc and close tool (Enter)"
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
            title="Cancel: Abort arc creation (Esc)"
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
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Method:</span>
              <select
                value={entityMethod}
                onChange={(e) => onChangeEntityMethod && onChangeEntityMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '3px 6px',
                  borderRadius: '3px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11px',
                  color: '#1e293b',
                  background: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="one_entity">Arc one entity</option>
                <option value="two_entities">Arc two entities</option>
                <option value="three_entities">Arc three entities</option>
              </select>
            </div>
          )}
        </div>

        {/* Section: Size */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setSizeExpanded(!sizeExpanded)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              borderBottom: sizeExpanded ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Size</span>
            {sizeExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>

          {sizeExpanded && (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Radius Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569', width: '56px' }}>Radius:</span>
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
                    value={radiusInput}
                    onChange={(e) => handleRadiusChange(e.target.value)}
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
                      onClick={() => stepRadius(1.0)}
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
                      onClick={() => stepRadius(-1.0)}
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
                  onClick={onToggleLock}
                  title={isLocked ? 'Unlock Radius' : 'Lock Radius'}
                  style={{
                    width: '20px',
                    height: '22px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    background: isLocked ? '#fef3c7' : '#ffffff',
                    color: isLocked ? '#d97706' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>

              {/* Diameter Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569', width: '56px' }}>Diameter:</span>
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
                    value={diameterInput}
                    onChange={(e) => handleDiameterChange(e.target.value)}
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
                      onClick={() => stepDiameter(2.0)}
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
                      onClick={() => stepDiameter(-2.0)}
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
                  onClick={onToggleLock}
                  title={isLocked ? 'Unlock Diameter' : 'Lock Diameter'}
                  style={{
                    width: '20px',
                    height: '22px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '3px',
                    background: isLocked ? '#fef3c7' : '#ffffff',
                    color: isLocked ? '#d97706' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

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
            Arc Tangent
          </span>
        </div>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            type="button"
            title="Help on Arc Tangent"
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
              title="Apply: Commit arc and create another"
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
              title="OK: Accept arc and close tool"
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
              title="Cancel: Abort arc creation"
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

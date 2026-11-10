import React, { useState, useEffect } from 'react';
import {
  HelpCircle, Pin, Check, X, ArrowUpRight, Lock, Unlock,
  ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';

export default function CircleCenterPointPanel({
  radius = 25,
  onChangeRadius,
  isLocked = false,
  onToggleLock,
  entityMethod = 'manual',
  onChangeEntityMethod,
  onReselectCenter,
  onApply,
  onOk,
  onCancel,
  theme = 'light'
}) {
  const isLight = theme !== 'dark';

  // Section collapse states
  const [entityExpanded, setEntityExpanded] = useState(true);
  const [centerExpanded, setCenterExpanded] = useState(true);
  const [sizeExpanded, setSizeExpanded] = useState(true);

  // Local radius / diameter input text states for clean typing
  const [radiusInput, setRadiusInput] = useState(radius.toFixed(5));
  const [diameterInput, setDiameterInput] = useState((radius * 2).toFixed(5));

  // Sync inputs when prop radius changes externally (e.g. while dragging in viewport)
  useEffect(() => {
    setRadiusInput(radius.toFixed(5));
    setDiameterInput((radius * 2).toFixed(5));
  }, [radius]);

  const handleRadiusChange = (valStr) => {
    setRadiusInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      setDiameterInput((num * 2).toFixed(5));
      if (onChangeRadius) onChangeRadius(num);
    }
  };

  const handleDiameterChange = (valStr) => {
    setDiameterInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      setRadiusInput((num / 2).toFixed(5));
      if (onChangeRadius) onChangeRadius(num / 2);
    }
  };

  const stepRadius = (delta) => {
    const current = parseFloat(radiusInput) || radius;
    const next = Math.max(0.1, current + delta);
    handleRadiusChange(next.toFixed(5));
  };

  const stepDiameter = (delta) => {
    const current = parseFloat(diameterInput) || (radius * 2);
    const next = Math.max(0.2, current + delta);
    handleDiameterChange(next.toFixed(5));
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
            Circle Center Point
          </span>
        </div>

        {/* Action Button Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Help Button */}
          <button
            type="button"
            title="Help on Circle Center Point"
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

          {/* Pin Icon */}
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

          {/* Mastercam 3-Action Circular Group: Apply (Blue), OK (Green), Cancel (Red) */}
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
            {/* Blue Apply & Create Another */}
            <button
              type="button"
              onClick={onApply}
              title="Apply: Commit circle and create another (Enter)"
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

            {/* Green OK / Commit & Close */}
            <button
              type="button"
              onClick={onOk}
              title="OK: Accept circle and close tool (Enter)"
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

            {/* Red Cancel / Abort */}
            <button
              type="button"
              onClick={onCancel}
              title="Cancel: Abort circle creation (Esc)"
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

      {/* 2. Sub-tab: Basic */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #cbd5e1',
          background: '#f1f5f9',
          padding: '0 8px'
        }}
      >
        <div
          style={{
            padding: '3px 8px',
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            borderRight: '1px solid #cbd5e1',
            borderTop: '2px solid #0284c7',
            borderBottom: '1px solid #ffffff',
            fontSize: '11px',
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: '-1px'
          }}
        >
          Basic
        </div>
      </div>

      {/* 3. Panel Sections Container */}
      <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Section 1: Entity */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', background: '#f8fafc' }}>
          <div
            onClick={() => setEntityExpanded(!entityExpanded)}
            style={{
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: '#f1f5f9',
              borderBottom: entityExpanded ? '1px solid #cbd5e1' : 'none'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Entity</span>
            {entityExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>

          {entityExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ minWidth: '45px' }}>Method:</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="circleMethod"
                    value="manual"
                    checked={entityMethod === 'manual'}
                    onChange={() => onChangeEntityMethod?.('manual')}
                    style={{ margin: 0 }}
                  />
                  Manual
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}>
                  <input
                    type="radio"
                    name="circleMethod"
                    value="tangent"
                    checked={entityMethod === 'tangent'}
                    onChange={() => onChangeEntityMethod?.('tangent')}
                    style={{ margin: 0 }}
                  />
                  Tangent
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Center Point */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', background: '#f8fafc' }}>
          <div
            onClick={() => setCenterExpanded(!centerExpanded)}
            style={{
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: '#f1f5f9',
              borderBottom: centerExpanded ? '1px solid #cbd5e1' : 'none'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Center Point</span>
            {centerExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>

          {centerExpanded && (
            <div style={{ padding: '6px 8px' }}>
              <button
                type="button"
                onClick={onReselectCenter}
                title="Reselect Circle Center Point on Canvas"
                style={{
                  padding: '3px 12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  fontSize: '11px',
                  color: '#1e293b',
                  cursor: 'pointer',
                  fontWeight: 500,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                Reselect
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Size (Radius & Diameter with Spinners and Lock) */}
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', background: '#f8fafc' }}>
          <div
            onClick={() => setSizeExpanded(!sizeExpanded)}
            style={{
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: '#f1f5f9',
              borderBottom: sizeExpanded ? '1px solid #cbd5e1' : 'none'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Size</span>
            {sizeExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>

          {sizeExpanded && (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Radius Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '55px', fontSize: '11px', color: '#475569' }}>Radius:</span>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={radiusInput}
                    onChange={(e) => handleRadiusChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '3px 20px 3px 6px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  {/* Stepper Buttons */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '2px',
                      top: '2px',
                      bottom: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '14px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => stepRadius(1.0)}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: '#f1f5f9',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '6px',
                        lineHeight: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid #e2e8f0'
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
                        background: '#f1f5f9',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '6px',
                        lineHeight: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Lock Button */}
                <button
                  type="button"
                  onClick={onToggleLock}
                  title={isLocked ? "Radius Locked (Subsequent clicks use this size)" : "Radius Unlocked"}
                  style={{
                    width: '22px',
                    height: '22px',
                    border: isLocked ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                    background: isLocked ? '#fef3c7' : '#ffffff',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isLocked ? '#b45309' : '#64748b',
                    padding: 0
                  }}
                >
                  {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>

              {/* Diameter Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '55px', fontSize: '11px', color: '#475569' }}>Diameter:</span>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={diameterInput}
                    onChange={(e) => handleDiameterChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '3px 20px 3px 6px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      background: '#ffffff',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  {/* Stepper Buttons */}
                  <div
                    style={{
                      position: 'absolute',
                      right: '2px',
                      top: '2px',
                      bottom: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '14px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => stepDiameter(2.0)}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: '#f1f5f9',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '6px',
                        lineHeight: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid #e2e8f0'
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
                        background: '#f1f5f9',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '6px',
                        lineHeight: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Lock Button */}
                <button
                  type="button"
                  onClick={onToggleLock}
                  title={isLocked ? "Diameter Locked" : "Diameter Unlocked"}
                  style={{
                    width: '22px',
                    height: '22px',
                    border: isLocked ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                    background: isLocked ? '#fef3c7' : '#ffffff',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isLocked ? '#b45309' : '#64748b',
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

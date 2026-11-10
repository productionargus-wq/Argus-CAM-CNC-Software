import React, { useState } from 'react';
import {
  Pin, Check, X,
  ChevronDown, ChevronUp
} from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

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
  theme: _theme = 'light'
}) {
  // Section collapse states
  const [entityExpanded, setEntityExpanded] = useState(true);
  const [centerExpanded, setCenterExpanded] = useState(true);
  const [sizeExpanded, setSizeExpanded] = useState(true);

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
          Circle Center Point
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
          title="Help on Circle Center Point"
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
            title="OK: Accept circle and close tool (Enter)"
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
            title="Cancel: Abort circle creation (Esc)"
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
                <SketchNumericInput
                  value={Number(radius) || 0}
                  min={0.1}
                  step={1}
                  decimals={4}
                  allowNegative={false}
                  onChangeNumber={(num) => onChangeRadius && onChangeRadius(num)}
                  isLocked={isLocked}
                  onToggleLock={onToggleLock}
                  lockTitle={isLocked ? 'Radius Locked (Subsequent clicks use this size)' : 'Lock Radius'}
                />
              </div>

              {/* Diameter Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '55px', fontSize: '11px', color: '#475569' }}>Diameter:</span>
                <SketchNumericInput
                  value={(Number(radius) || 0) * 2}
                  min={0.2}
                  step={2}
                  decimals={4}
                  allowNegative={false}
                  onChangeNumber={(num) => onChangeRadius && onChangeRadius(num / 2)}
                  isLocked={isLocked}
                  onToggleLock={onToggleLock}
                  lockTitle={isLocked ? 'Diameter Locked' : 'Lock Diameter'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Pin, Check, X,
  ChevronDown, ChevronUp
} from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function RectanglePanel({
  width = 80,
  height = 50,
  onChangeWidth,
  onChangeHeight,
  isWidthLocked = false,
  isHeightLocked = false,
  onToggleWidthLock,
  onToggleHeightLock,
  anchorToCenter = false,
  onToggleAnchorToCenter,
  createSurface = false,
  onToggleCreateSurface,
  activePoint = 1,
  onSelectPoint,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  // Section collapse states
  const [pointsExpanded, setPointsExpanded] = useState(true);
  const [dimensionsExpanded, setDimensionsExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

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
          Rectangle
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
          title="Help on Rectangle"
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
            title="OK: Accept rectangle and close (Enter)"
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
            title="Cancel: Abort rectangle (Esc)"
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
        
        {/* Section: Points */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setPointsExpanded(!pointsExpanded)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              borderBottom: pointsExpanded ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Points</span>
            {pointsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>

          {pointsExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => onSelectPoint && onSelectPoint(1)}
                style={{
                  width: '26px',
                  height: '24px',
                  borderRadius: '3px',
                  border: activePoint === 1 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: activePoint === 1 ? '#e0f2fe' : '#f8fafc',
                  color: activePoint === 1 ? '#0284c7' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Corner 1 (First position)"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => onSelectPoint && onSelectPoint(2)}
                style={{
                  width: '26px',
                  height: '24px',
                  borderRadius: '3px',
                  border: activePoint === 2 ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: activePoint === 2 ? '#e0f2fe' : '#f8fafc',
                  color: activePoint === 2 ? '#0284c7' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Corner 2 (Second position)"
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
              {/* Width Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569', width: '52px' }}>Width:</span>
                <SketchNumericInput
                  value={Math.abs(Number(width) || 0)}
                  min={0.01}
                  step={1}
                  decimals={4}
                  allowNegative={false}
                  onChangeNumber={(num) => onChangeWidth && onChangeWidth(num)}
                  isLocked={isWidthLocked}
                  onToggleLock={onToggleWidthLock}
                  lockTitle={isWidthLocked ? 'Unlock Width' : 'Lock Width'}
                />
              </div>

              {/* Height Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569', width: '52px' }}>Height:</span>
                <SketchNumericInput
                  value={Math.abs(Number(height) || 0)}
                  min={0.01}
                  step={1}
                  decimals={4}
                  allowNegative={false}
                  onChangeNumber={(num) => onChangeHeight && onChangeHeight(num)}
                  isLocked={isHeightLocked}
                  onToggleLock={onToggleHeightLock}
                  lockTitle={isHeightLocked ? 'Unlock Height' : 'Lock Height'}
                />
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.35' }}>
                Click Corner 1 &amp; Corner 2 on canvas, or type Width &amp; Height and click canvas / OK.
              </div>
            </div>
          )}
        </div>

        {/* Section: Settings */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            background: '#ffffff',
            overflow: 'hidden'
          }}
        >
          <div
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            style={{
              padding: '4px 8px',
              background: '#f8fafc',
              borderBottom: settingsExpanded ? '1px solid #e2e8f0' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span>Settings</span>
            {settingsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>

          {settingsExpanded && (
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={anchorToCenter}
                  onChange={(e) => onToggleAnchorToCenter && onToggleAnchorToCenter(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Anchor to center
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={createSurface}
                  onChange={(e) => onToggleCreateSurface && onToggleCreateSurface(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Create surface
              </label>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

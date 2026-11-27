import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp, Orbit, Scissors } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function FilletChamferPanel({
  mode = 'fillet', // 'fillet' | 'chamfer'
  onChangeMode,
  radius = 5,
  onChangeRadius,
  isRadiusLocked = false,
  onToggleRadiusLock,
  chamferDist1 = 5,
  onChangeChamferDist1,
  chamferDist2 = 5,
  onChangeChamferDist2,
  trimEntities = true,
  onToggleTrimEntities,
  filletCount = 0,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  const [modeExpanded, setModeExpanded] = useState(true);
  const [paramsExpanded, setParamsExpanded] = useState(true);

  const isFillet = mode === 'fillet';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isFillet ? <Orbit size={14} color="#10b981" /> : <Scissors size={14} color="#f59e0b" />}
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
            {isFillet ? 'Fillet Entities' : 'Chamfer Entities'}
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
          title={`Help on ${isFillet ? 'Fillet' : 'Chamfer'}`}
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

      {/* 3. Corner Treatment Mode */}
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
          <span>Corner Style</span>
          {modeExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {modeExpanded && (
          <div style={{ padding: '8px', display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onChangeMode && onChangeMode('fillet')}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '11px',
                background: isFillet ? '#10b981' : '#f1f5f9',
                color: isFillet ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: isFillet ? 600 : 400
              }}
            >
              Circular Fillet
            </button>
            <button
              type="button"
              onClick={() => onChangeMode && onChangeMode('chamfer')}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '11px',
                background: !isFillet ? '#f59e0b' : '#f1f5f9',
                color: !isFillet ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: !isFillet ? 600 : 400
              }}
            >
              Chamfer Bevel
            </button>
          </div>
        )}
      </div>

      {/* 4. Dimensions & Trim Setting */}
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
          <span>Dimensions</span>
          {paramsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {paramsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isFillet ? (
              <SketchNumericInput
                label="Radius:"
                value={radius}
                onChange={(val) => onChangeRadius && onChangeRadius(val)}
                isLocked={isRadiusLocked}
                onToggleLock={onToggleRadiusLock}
                min={0.1}
                step={0.5}
              />
            ) : (
              <>
                <SketchNumericInput
                  label="Dist 1:"
                  value={chamferDist1}
                  onChange={(val) => onChangeChamferDist1 && onChangeChamferDist1(val)}
                  min={0.1}
                  step={0.5}
                />
                <SketchNumericInput
                  label="Dist 2:"
                  value={chamferDist2}
                  onChange={(val) => onChangeChamferDist2 && onChangeChamferDist2(val)}
                  min={0.1}
                  step={0.5}
                />
              </>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={trimEntities}
                onChange={(e) => onToggleTrimEntities && onToggleTrimEntities(e.target.checked)}
              />
              Trim Original Entities to Tangent Points
            </label>
          </div>
        )}
      </div>

      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>Instruction:</strong> Select Entity 1 in viewport, then select Entity 2. Argus CAM Intelligence automatically calculates the intersection corner and inserts the tangent blend.
        {filletCount > 0 && (
          <div style={{ marginTop: '6px', fontWeight: 600, color: '#16a34a' }}>
            ✓ {filletCount} corners created
          </div>
        )}
      </div>
    </div>
  );
}

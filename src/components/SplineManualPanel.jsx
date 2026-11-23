import React, { useState } from 'react';
import { Pin, Check, X, ChevronDown, ChevronUp, RotateCcw, Trash2 } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

export default function SplineManualPanel({
  splinePoints = [],
  onClearPoints,
  onUndoPoint,
  splineType = 'catmull_rom', // 'catmull_rom' | 'nurbs' | 'bezier'
  onChangeSplineType,
  isClosed = false,
  onToggleClosed,
  tension = 0.5,
  onChangeTension,
  onApply,
  onOk,
  onCancel,
  theme: _theme = 'light'
}) {
  const [nodesExpanded, setNodesExpanded] = useState(true);
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
          Spline Manual
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
          title="Help on Splines"
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
            disabled={splinePoints.length < 2}
            title="OK and Create New (Apply ✓+)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: splinePoints.length >= 2 ? '#0284c7' : '#64748b',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              cursor: splinePoints.length >= 2 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 12.5 6.5 17 14 7.5" />
              <line x1="18.5" y1="4.5" x2="18.5" y2="13.5" />
              <line x1="14" y1="9" x2="23" y2="9" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onOk}
            disabled={splinePoints.length < 2}
            title="OK: Accept spline and close tool (Enter)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: splinePoints.length >= 2 ? '#16a34a' : '#64748b',
              border: '1.5px solid #4ade80',
              color: '#ffffff',
              cursor: splinePoints.length >= 2 ? 'pointer' : 'not-allowed',
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

      {/* 3. Control Points List */}
      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div
          onClick={() => setNodesExpanded(!nodesExpanded)}
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
          <span>Spline Nodes ({splinePoints.length} points)</span>
          {nodesExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {nodesExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={onUndoPoint}
                disabled={splinePoints.length === 0}
                style={{
                  flex: 1,
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  cursor: splinePoints.length > 0 ? 'pointer' : 'not-allowed',
                  color: '#334155'
                }}
              >
                <RotateCcw size={12} /> Undo Node
              </button>
              <button
                type="button"
                onClick={onClearPoints}
                disabled={splinePoints.length === 0}
                style={{
                  flex: 1,
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  cursor: splinePoints.length > 0 ? 'pointer' : 'not-allowed',
                  color: '#dc2626'
                }}
              >
                <Trash2 size={12} /> Clear All
              </button>
            </div>

            <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '3px', background: '#fafafa', padding: '4px' }}>
              {splinePoints.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
                  Click in 3D viewport to add spline nodes
                </div>
              ) : (
                splinePoints.map((pt, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px', fontSize: '10.5px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 600, color: '#0284c7' }}>#{idx + 1}</span>
                    <span>X: {pt.x.toFixed(1)}</span>
                    <span>Y: {pt.y.toFixed(1)}</span>
                    <span>Z: {(pt.z ?? pt.y).toFixed(1)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Spline Interpolation Parameters */}
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
          <span>Spline Type & Curve</span>
          {paramsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
        {paramsExpanded && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px' }}>
              <span>Curve Algorithm:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'catmull_rom', label: 'Catmull-Rom' },
                  { id: 'nurbs', label: 'NURBS' },
                  { id: 'bezier', label: 'Bézier' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onChangeSplineType && onChangeSplineType(type.id)}
                    style={{
                      flex: 1,
                      padding: '3px 0',
                      fontSize: '11px',
                      background: splineType === type.id ? '#0284c7' : '#f1f5f9',
                      color: splineType === type.id ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => onToggleClosed && onToggleClosed(e.target.checked)}
              />
              Closed Spline (Connect End to Start)
            </label>

            <SketchNumericInput
              label="Tension:"
              value={tension}
              onChange={(val) => onChangeTension && onChangeTension(val)}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        )}
      </div>

      <div style={{ margin: '12px 8px', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
        <strong>Instruction:</strong> Click successive nodes on the canvas. Double-click or press <strong>Enter</strong> to commit the spline curve.
      </div>
    </div>
  );
}

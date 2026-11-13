import React, { useRef, useState } from 'react';
import { Pin, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import SketchNumericInput from './SketchNumericInput';

/**
 * Mastercam 2018-style Left Panel for Surfaces -> Extrude ("Surface Extrude").
 * Matches the Basic tab with Chains, Base Point, Dimensions (Height, Scale,
 * Rotation angle, Offset distance, Draft angle + Lock toggles), Axis, and Direction.
 */
export default function SurfaceExtrudePanel({
  extrudeParams,
  selectedChains = [],
  isChainingOpen = false,
  isBasePointPicking = false,
  onChangeParam,
  onToggleLock,
  onReselectChains,
  onReselectBasePoint,
  onApply,
  onOk,
  onCancel
}) {
  const [chainsExpanded, setChainsExpanded] = useState(true);
  const [basePointExpanded, setBasePointExpanded] = useState(true);
  const [dimsExpanded, setDimsExpanded] = useState(true);
  const [axisExpanded, setAxisExpanded] = useState(true);
  const [directionExpanded, setDirectionExpanded] = useState(true);

  const lastPositiveHeightMagRef = useRef(Math.abs(extrudeParams?.height || 20.0) || 20.0);
  if (Math.abs(Number(extrudeParams?.height)) > 0.01) {
    lastPositiveHeightMagRef.current = Math.abs(Number(extrudeParams.height));
  }

  const locks = extrudeParams?.locks || {};
  const hasChains = selectedChains.length > 0;

  const sectionBoxStyle = {
    border: '1px solid #cbd5e1',
    borderRadius: '3px',
    background: '#f8fafc'
  };

  const sectionHeaderStyle = (expanded) => ({
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    background: '#f1f5f9',
    borderBottom: expanded ? '1px solid #cbd5e1' : 'none'
  });

  const dimensionRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const labelStyle = {
    fontSize: '11px',
    color: '#334155',
    width: '92px',
    flexShrink: 0
  };

  const handleHeightRawTextChange = (raw) => {
    if (raw === '-') {
      onChangeParam?.('height', -Math.abs(lastPositiveHeightMagRef.current || 20.0));
    }
  };

  return (
    <div
      data-testid="surface-extrude-panel"
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
          borderBottom: '1px solid #cbd5e1',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
          Surface Extrude
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

      {/* 2. Dark Action Bar (Help, Apply/Create New, OK, Cancel) */}
      <div
        style={{
          height: '34px',
          background: '#2b2d31',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          borderBottom: '1px solid #1e2024',
          flexShrink: 0
        }}
      >
        <button
          type="button"
          title="Help on Surface Extrude"
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
            data-testid="extrude-apply-btn"
            onClick={onApply}
            disabled={!hasChains || isChainingOpen}
            title="OK and Create New Operation"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#0284c7',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              cursor: (!hasChains || isChainingOpen) ? 'not-allowed' : 'pointer',
              opacity: (!hasChains || isChainingOpen) ? 0.45 : 1,
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

          <button
            type="button"
            data-testid="extrude-ok-btn"
            onClick={onOk}
            disabled={!hasChains || isChainingOpen}
            title="OK: Accept extruded surface (Enter)"
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#16a34a',
              border: '1.5px solid #4ade80',
              color: '#ffffff',
              cursor: (!hasChains || isChainingOpen) ? 'not-allowed' : 'pointer',
              opacity: (!hasChains || isChainingOpen) ? 0.45 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          >
            <Check size={14} strokeWidth={3} />
          </button>

          <button
            type="button"
            data-testid="extrude-cancel-btn"
            onClick={onCancel}
            title="Cancel Surface Extrude (Esc)"
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

      {/* 3. Basic Tab Header */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #cbd5e1',
          background: '#f1f5f9',
          padding: '0 8px',
          flexShrink: 0
        }}
      >
        <div
          style={{
            padding: '3px 10px',
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

      {/* 4. Scrollable Parameter Sections */}
      <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Chains */}
        <div style={sectionBoxStyle}>
          <div onClick={() => setChainsExpanded((v) => !v)} style={sectionHeaderStyle(chainsExpanded)}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Chains</span>
            {chainsExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>
          {chainsExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <button
                type="button"
                onClick={onReselectChains}
                style={{
                  padding: '2px 12px',
                  fontSize: '11px',
                  background: isChainingOpen ? '#e0f2fe' : '#f1f5f9',
                  border: isChainingOpen ? '1px solid #0284c7' : '1px solid #94a3b8',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#0f172a',
                  fontWeight: 500
                }}
              >
                Reselect
              </button>
              <span style={{ fontSize: '10.5px', color: hasChains ? '#0369a1' : '#94a3b8', fontWeight: hasChains ? 600 : 400 }}>
                {hasChains ? `${selectedChains.length} selected` : 'None'}
              </span>
            </div>
          )}
        </div>

        {/* Base Point */}
        <div style={sectionBoxStyle}>
          <div onClick={() => setBasePointExpanded((v) => !v)} style={sectionHeaderStyle(basePointExpanded)}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Base Point</span>
            {basePointExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>
          {basePointExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <button
                type="button"
                onClick={onReselectBasePoint}
                style={{
                  padding: '2px 12px',
                  fontSize: '11px',
                  background: isBasePointPicking ? '#e0f2fe' : '#f1f5f9',
                  border: isBasePointPicking ? '1px solid #0284c7' : '1px solid #94a3b8',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#0f172a',
                  fontWeight: 500
                }}
              >
                Reselect
              </button>
              {extrudeParams?.basePoint && (
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#475569' }}>
                  X{Number(extrudeParams.basePoint.x).toFixed(1)} Y{(-Number(extrudeParams.basePoint.z)).toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dimensions */}
        <div style={sectionBoxStyle}>
          <div onClick={() => setDimsExpanded((v) => !v)} style={sectionHeaderStyle(dimsExpanded)}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Dimensions</span>
            {dimsExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>
          {dimsExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={dimensionRowStyle}>
                <span style={{ ...labelStyle, width: '102px' }} title="Extrusion Distance (Height along selected Axis)">Height (Distance):</span>
                <SketchNumericInput
                  value={extrudeParams?.height ?? 20.0}
                  step={5}
                  decimals={3}
                  allowNegative={true}
                  presets={[10, 20, 30, 50, 60, -20, -30, -60]}
                  isLocked={!!locks.height}
                  onToggleLock={() => onToggleLock?.('height')}
                  onRawTextChange={handleHeightRawTextChange}
                  onChangeNumber={(val) => onChangeParam?.('height', val)}
                  onEnter={onOk}
                />
              </div>

              <div style={dimensionRowStyle}>
                <span style={labelStyle}>Scale:</span>
                <SketchNumericInput
                  value={extrudeParams?.scale ?? 1.0}
                  min={0.05}
                  max={20}
                  step={0.1}
                  decimals={3}
                  allowNegative={false}
                  presets={[0.5, 1.0, 1.25, 1.5, 2.0]}
                  isLocked={!!locks.scale}
                  onToggleLock={() => onToggleLock?.('scale')}
                  onChangeNumber={(val) => onChangeParam?.('scale', val)}
                />
              </div>

              <div style={dimensionRowStyle}>
                <span style={labelStyle}>Rotation angle:</span>
                <SketchNumericInput
                  value={extrudeParams?.rotationAngleDeg ?? 0.0}
                  min={-360}
                  max={360}
                  step={5}
                  decimals={3}
                  allowNegative={true}
                  presets={[0, 15, 30, 45, 90]}
                  isLocked={!!locks.rotationAngleDeg}
                  onToggleLock={() => onToggleLock?.('rotationAngleDeg')}
                  onChangeNumber={(val) => onChangeParam?.('rotationAngleDeg', val)}
                />
              </div>

              <div style={dimensionRowStyle}>
                <span style={labelStyle}>Offset distance:</span>
                <SketchNumericInput
                  value={extrudeParams?.offsetDistance ?? 0.0}
                  step={1}
                  decimals={3}
                  allowNegative={true}
                  presets={[0, 2, 5, 10, -2, -5]}
                  isLocked={!!locks.offsetDistance}
                  onToggleLock={() => onToggleLock?.('offsetDistance')}
                  onChangeNumber={(val) => onChangeParam?.('offsetDistance', val)}
                />
              </div>

              <div style={dimensionRowStyle}>
                <span style={labelStyle}>Draft angle:</span>
                <SketchNumericInput
                  value={extrudeParams?.draftAngleDeg ?? 0.0}
                  min={-60}
                  max={60}
                  step={1}
                  decimals={3}
                  allowNegative={true}
                  presets={[0, 2, 5, 10, 15, -5]}
                  isLocked={!!locks.draftAngleDeg}
                  onToggleLock={() => onToggleLock?.('draftAngleDeg')}
                  onChangeNumber={(val) => onChangeParam?.('draftAngleDeg', val)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Axis */}
        <div style={sectionBoxStyle}>
          <div onClick={() => setAxisExpanded((v) => !v)} style={sectionHeaderStyle(axisExpanded)}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Axis</span>
            {axisExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>
          {axisExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={!!extrudeParams?.useAxis}
                  onChange={(e) => onChangeParam?.('useAxis', e.target.checked)}
                  style={{ margin: 0 }}
                />
                Axis
              </label>

              <div style={{ paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '3px', opacity: extrudeParams?.useAxis ? 1 : 0.65 }}>
                {['z', 'x', 'y'].map((ax) => (
                  <label key={ax} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="extrudeAxis"
                      checked={(extrudeParams?.axis || 'z') === ax}
                      onChange={() => {
                        onChangeParam?.('useAxis', true);
                        onChangeParam?.('axis', ax);
                      }}
                      style={{ margin: 0 }}
                    />
                    {ax.toUpperCase()}
                  </label>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="extrudeAxis"
                      checked={extrudeParams?.axis === 'vector'}
                      onChange={() => {
                        onChangeParam?.('useAxis', true);
                        onChangeParam?.('axis', 'vector');
                      }}
                      style={{ margin: 0 }}
                    />
                    Vector
                  </label>
                  <button
                    type="button"
                    disabled={extrudeParams?.axis !== 'vector'}
                    title="Specify custom extrusion vector"
                    onClick={() => {
                      onChangeParam?.('useAxis', true);
                      onChangeParam?.('axis', 'vector');
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      cursor: extrudeParams?.axis === 'vector' ? 'pointer' : 'default'
                    }}
                  >
                    ↖
                  </button>
                </div>

                {extrudeParams?.axis === 'vector' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '3px' }}>
                    {['x', 'y', 'z'].map((comp) => (
                      <div key={comp} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{comp.toUpperCase()}</span>
                        <input
                          type="number"
                          step="0.1"
                          value={extrudeParams?.axisVector?.[comp] ?? (comp === 'z' ? 1 : 0)}
                          onChange={(e) => onChangeParam?.('axisVector', {
                            ...(extrudeParams?.axisVector || { x: 0, y: 0, z: 1 }),
                            [comp]: Number(e.target.value)
                          })}
                          style={{ width: '100%', fontSize: '10px', padding: '2px 3px', border: '1px solid #cbd5e1', borderRadius: '2px' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Direction */}
        <div style={sectionBoxStyle}>
          <div onClick={() => setDirectionExpanded((v) => !v)} style={sectionHeaderStyle(directionExpanded)}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Direction</span>
            {directionExpanded ? <ChevronUp size={13} color="#64748b" /> : <ChevronDown size={13} color="#64748b" />}
          </div>
          {directionExpanded && (
            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              {[
                { id: 'defined', label: 'Defined side' },
                { id: 'reverse', label: 'Reverse' },
                { id: 'both', label: 'Both sides' }
              ].map((opt) => (
                <label key={opt.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="extrudeDirection"
                    checked={(extrudeParams?.direction || 'defined') === opt.id}
                    onChange={() => onChangeParam?.('direction', opt.id)}
                    style={{ margin: 0 }}
                  />
                  {opt.label}
                </label>
              ))}

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginTop: '2px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={extrudeParams?.capEnds !== false}
                  onChange={(e) => onChangeParam?.('capEnds', e.target.checked)}
                  style={{ margin: 0 }}
                />
                Cap closed ends
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

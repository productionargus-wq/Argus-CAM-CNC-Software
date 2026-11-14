import React, { useState } from 'react';
import {
  HelpCircle, Check, X, ArrowLeftRight, Minus, Move
} from 'lucide-react';

/**
 * Mastercam Analyze Dynamic Floating Palette (Image 4 replica)
 * Floats non-blockingly over the 3D viewport.
 */
export default function AnalyzeDynamicDialog({
  isOpen,
  onClose,
  data = null,
  onReverseVector,
  arrowScale = 1.0,
  onChangeArrowScale
}) {
  const [scaleFactor, setScaleFactor] = useState(arrowScale || 1.0);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const pt = data?.point || { x: 34.565, y: -18.661, z: 0.0 };
  const tg = data?.tangent || { x: 0.0, y: -1.0, z: 0.0 };
  const angle = data?.angle ?? 270.0;
  const radius = data?.radius ?? 'Flat (infinite)';
  const diameter = data?.diameter ?? 'Flat (infinite)';
  const colorIndex = data?.colorIndex ?? 1;
  const colorR = data?.colorR ?? 0;
  const colorG = data?.colorG ?? 0;
  const colorB = data?.colorB ?? 128;

  const handleScaleChange = (val) => {
    const num = parseFloat(val) || 1.0;
    setScaleFactor(num);
    if (onChangeArrowScale) onChangeArrowScale(num);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '60px',
        left: '260px',
        zIndex: 120,
        width: '260px',
        background: '#ffffff',
        border: '1px solid #94a3b8',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
        borderRadius: '2px',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        fontSize: '11px',
        color: '#1e293b',
        userSelect: 'none'
      }}
    >
      {/* 1. Title Bar matching Image 4 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#f1f5f9',
          borderBottom: '1px solid #cbd5e1',
          cursor: 'move'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
          Analyze Dynamic
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px', color: '#64748b' }}
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px', color: '#dc2626' }}
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Reverse Vector Direction Button (<-->) matching Image 4 */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onReverseVector}
              title="Reverse Normal / Tangent Vector Direction"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 12px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeftRight size={16} color="#0284c7" />
            </button>
          </div>

          {/* Coordinate Table: Point & Tangent (Matching Image 4) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {/* Point */}
            <div>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: '2px' }}>Point</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <input
                  type="text"
                  readOnly
                  value={Number(pt.x).toFixed(3)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                />
                <input
                  type="text"
                  readOnly
                  value={Number(pt.y).toFixed(3)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                />
                <input
                  type="text"
                  readOnly
                  value={Number(pt.z).toFixed(3)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                />
              </div>
            </div>

            {/* Tangent */}
            <div>
              <div style={{ fontWeight: 600, color: '#475569', marginBottom: '2px' }}>Tangent</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', width: '12px' }}>X</span>
                  <input
                    type="text"
                    readOnly
                    value={Number(tg.x).toFixed(1)}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', width: '12px' }}>Y</span>
                  <input
                    type="text"
                    readOnly
                    value={Number(tg.y).toFixed(1)}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', width: '12px' }}>Z</span>
                  <input
                    type="text"
                    readOnly
                    value={Number(tg.z).toFixed(1)}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Angle & Curvature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Angle:</span>
              <input
                type="text"
                readOnly
                value={Number(angle).toFixed(1)}
                style={{ width: '100px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Radius:</span>
              <input
                type="text"
                readOnly
                value={radius}
                style={{ width: '100px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Diameter:</span>
              <input
                type="text"
                readOnly
                value={diameter}
                style={{ width: '100px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
              />
            </div>
          </div>

          {/* Current Color & RGB Components matching Image 4 */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Current color:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  readOnly
                  value={colorIndex}
                  style={{ width: '40px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                />
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    background: `rgb(${colorR}, ${colorG}, ${colorB})`,
                    border: '1px solid #64748b'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Red component:</span>
              <input
                type="text"
                readOnly
                value={colorR}
                style={{ width: '60px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', textAlign: 'right' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Green component:</span>
              <input
                type="text"
                readOnly
                value={colorG}
                style={{ width: '60px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', textAlign: 'right' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Blue component:</span>
              <input
                type="text"
                readOnly
                value={colorB}
                style={{ width: '60px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', textAlign: 'right' }}
              />
            </div>
          </div>

          {/* Arrow Scale Factor (Yellow box matching Image 4) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569' }}>Arrow scale factor:</span>
            <input
              type="number"
              step="0.1"
              value={scaleFactor}
              onChange={(e) => handleScaleChange(e.target.value)}
              style={{
                width: '60px',
                padding: '2px 4px',
                fontSize: '11px',
                border: '1px solid #cbd5e1',
                background: '#fef9c3', // Light yellow matching Image 4
                fontWeight: 600,
                textAlign: 'center'
              }}
            />
          </div>

          {/* Bottom Action Controls (Image 4): Green Checkmark, Help ? */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              title="OK (Accept and Close)"
              style={{
                padding: '3px 12px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={14} color="#16a34a" strokeWidth={3} />
            </button>

            <button
              type="button"
              onClick={() => alert('Analyze Dynamic: Move cursor across geometry to dynamically evaluate coordinates, surface normals, tangents, and curvature.')}
              title="Help"
              style={{
                padding: '3px 8px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              <HelpCircle size={14} color="#0284c7" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  HelpCircle, Check, X, ArrowLeftRight, Minus
} from 'lucide-react';

/**
 * Mastercam Analyze Dynamic Floating Palette (Image 1 replica)
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

  const pt = data?.point || { x: -23.576, y: -2.841, z: 0.0 };
  const nrm = data?.normal || data?.tangent || { x: 0.0, y: 0.0, z: -1.0 };
  const angle = data?.angle ?? -90.0;
  const radius = data?.radius ?? 'Flat (infinite)';
  const diameter = data?.diameter ?? 'Flat (infinite)';
  const colorIndex = data?.colorIndex ?? 136;
  const colorR = data?.colorR ?? 255;
  const colorG = data?.colorG ?? 128;
  const colorB = data?.colorB ?? 64;

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
        width: '220px',
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
      {/* Floating Prompt Guidance Banner matching Image 1 */}
      <div
        style={{
          position: 'absolute',
          top: '-24px',
          right: '-110px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          padding: '2px 8px',
          fontSize: '11px',
          color: '#334155',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap'
        }}
      >
        Position arrow and click to accept
      </div>

      {/* 1. Title Bar matching Image 1 */}
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
          {/* Reverse Vector Direction Button (<-->) with blue/orange arrows matching Image 1 */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onReverseVector}
              title="Reverse Normal Vector Direction"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 14px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '13px' }}>←</span>
                <div style={{ width: '12px', height: '2px', background: '#475569' }} />
                <span style={{ color: '#ea580c', fontWeight: 700, fontSize: '13px' }}>→</span>
              </div>
            </button>
          </div>

          {/* Coordinate Table: Point & Normal (Matching Image 1) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 14px 1fr', gap: '4px', alignItems: 'center' }}>
            {/* Point */}
            <div>
              <div style={{ fontWeight: 600, color: '#475569', textAlign: 'center', marginBottom: '2px' }}>Point</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <input
                  type="text"
                  readOnly
                  value={Number(pt.x).toFixed(3)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
                />
                <input
                  type="text"
                  readOnly
                  value={Number(pt.y).toFixed(3)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
                />
                <input
                  type="text"
                  readOnly
                  value={Number(pt.z).toFixed(3)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
                />
              </div>
            </div>

            {/* Labels X, Y, Z */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'center', color: '#64748b', fontSize: '10px', marginTop: '14px' }}>
              <div>X</div>
              <div>Y</div>
              <div>Z</div>
            </div>

            {/* Normal */}
            <div>
              <div style={{ fontWeight: 600, color: '#475569', textAlign: 'center', marginBottom: '2px' }}>Normal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <input
                  type="text"
                  readOnly
                  value={Number(nrm.x).toFixed(1)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
                />
                <input
                  type="text"
                  readOnly
                  value={Number(nrm.y).toFixed(1)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
                />
                <input
                  type="text"
                  readOnly
                  value={Number(nrm.z).toFixed(1)}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
                />
              </div>
            </div>
          </div>

          {/* Angle & Curvature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: '#0284c7' }}>∠</span>
              </div>
              <input
                type="text"
                readOnly
                value={Number(angle).toFixed(1)}
                style={{ flex: 1, padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', color: '#b91c1c' }}>↗</span>
              </div>
              <input
                type="text"
                readOnly
                value={radius}
                style={{ flex: 1, padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'center' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', color: '#b91c1c' }}>↔</span>
              </div>
              <input
                type="text"
                readOnly
                value={diameter}
                style={{ flex: 1, padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Current Color & RGB Components matching Image 1 */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569' }}>Current color:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="text"
                  readOnly
                  value={colorIndex}
                  style={{ width: '38px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'center' }}
                />
                <div
                  style={{
                    width: '20px',
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
                style={{ width: '50px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Green component:</span>
              <input
                type="text"
                readOnly
                value={colorG}
                style={{ width: '50px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Blue component:</span>
              <input
                type="text"
                readOnly
                value={colorB}
                style={{ width: '50px', padding: '2px 4px', fontSize: '11px', border: '1px solid #cbd5e1', background: '#e0f2fe', textAlign: 'right' }}
              />
            </div>
          </div>

          {/* Arrow Scale Factor (Yellow box matching Image 1) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569' }}>Arrow scale factor</span>
            <input
              type="number"
              step="0.1"
              value={scaleFactor}
              onChange={(e) => handleScaleChange(e.target.value)}
              style={{
                width: '60px',
                padding: '2px 4px',
                fontSize: '11px',
                border: '1px solid #ca8a04',
                background: '#fef08a', // Light yellow matching Image 1
                fontWeight: 600,
                textAlign: 'center'
              }}
            />
          </div>

          {/* Bottom Action Controls (Image 1): Green Checkmark, Help ? */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              title="OK (Accept and Close)"
              style={{
                padding: '3px 14px',
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

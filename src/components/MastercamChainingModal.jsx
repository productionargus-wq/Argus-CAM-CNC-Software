import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import {
  X,
  Check,
  RotateCw,
  RefreshCw,
  Layers,
  Box,
  Compass,
  ArrowRight,
  MoveUp,
  MoveDown,
  MousePointer
} from 'lucide-react';
import { extractClosedChainsFromCAD } from '../utils/cadDrawingEngine';

export default function MastercamChainingModal({
  isOpen,
  onClose,
  onAcceptChains,
  onNotify,
  customGeometry = []
}) {
  const [chainMode, setChainMode] = useState('wireframe'); // 'wireframe' | 'solids'
  const [selectMethod, setSelectMethod] = useState('chain'); // 'chain' | 'partial' | 'window' | 'point'
  const [chains, setChains] = useState([]);
  const [activeChainId, setActiveChainId] = useState(1);

  useEffect(() => {
    if (customGeometry && customGeometry.length > 0) {
      const realChains = extractClosedChainsFromCAD(customGeometry);
      if (realChains.length > 0) {
        const formatted = realChains.map((rc, idx) => {
          let desc = rc.name || `Chain ${idx + 1}`;
          if (rc.type === 'circle_loop') {
            desc = `Chain ${idx + 1} - Circle (Ø${(rc.radius * 2).toFixed(1)}mm, Center X${rc.center.x.toFixed(1)} Y${rc.center.z.toFixed(1)})`;
          } else if (rc.type === 'rectangle_loop') {
            const size = rc.bounds.getSize(new THREE.Vector3());
            desc = `Chain ${idx + 1} - Rectangle (${size.x.toFixed(1)} x ${size.z.toFixed(1)}mm)`;
          }
          return {
            id: idx + 1,
            name: desc,
            direction: 'Climb (CW)',
            entities: rc.points?.length || 4,
            color: rc.type === 'circle_loop' ? '#0284c7' : '#10b981',
            rawChain: rc
          };
        });
        setChains(formatted);
        setActiveChainId(1);
        return;
      }
    }
    // Fallback if no custom geometry
    setChains([
      { id: 1, name: 'Chain 1 - Exterior Stepped Profile (Closed)', direction: 'Climb (CW)', entities: 8, color: '#38bdf8' },
      { id: 2, name: 'Chain 2 - Center Triangular Pocket (Closed)', direction: 'Climb (CCW)', entities: 3, color: '#a855f7' },
      { id: 3, name: 'Chain 3 - 7x Bolt Hole Points (Pattern)', direction: 'Point Order', entities: 7, color: '#10b981' }
    ]);
  }, [customGeometry, isOpen]);

  if (!isOpen) return null;

  const handleReverseDirection = (id) => {
    setChains((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newDir = c.direction.includes('CW') ? 'Conventional (CCW)' : 'Climb (CW)';
          return { ...c, direction: newDir };
        }
        return c;
      })
    );
    if (onNotify) onNotify(`Reversed chain direction for Chain #${id}`, 'info');
  };

  const handleAccept = () => {
    if (onAcceptChains) {
      onAcceptChains(chains);
    }
    if (onNotify) {
      onNotify(`Mastercam: Accepted ${chains.length} Chains for Machining Region`, 'success');
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
    >
      <div
        style={{
          width: '540px',
          background: '#f8fafc',
          borderRadius: '6px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px #94a3b8',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: '34px',
            background: 'linear-gradient(to bottom, #1e3a8a, #172554)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            userSelect: 'none'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700 }}>
            Chaining - Select Machining Boundaries
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleAccept}
              style={{
                background: '#16a34a',
                border: 'none',
                borderRadius: '3px',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <Check size={14} strokeWidth={2.5} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#dc2626',
                border: 'none',
                borderRadius: '3px',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Mode Toggles: Wireframe vs Solids */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setChainMode('wireframe')}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '12.5px',
              fontWeight: chainMode === 'wireframe' ? 700 : 500,
              background: chainMode === 'wireframe' ? '#0284c7' : '#ffffff',
              color: chainMode === 'wireframe' ? '#ffffff' : '#334155',
              border: '1px solid #94a3b8',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Layers size={14} />
            Wireframe Chaining
          </button>
          <button
            onClick={() => setChainMode('solids')}
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '12.5px',
              fontWeight: chainMode === 'solids' ? 700 : 500,
              background: chainMode === 'solids' ? '#0284c7' : '#ffffff',
              color: chainMode === 'solids' ? '#ffffff' : '#334155',
              border: '1px solid #94a3b8',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Box size={14} />
            Solids Edge / Face
          </button>
        </div>

        {/* Selection Tools Grid */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
            Selection Method:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
            {[
              { id: 'chain', label: 'Chain (C)' },
              { id: 'partial', label: 'Partial (P)' },
              { id: 'window', label: 'Window (W)' },
              { id: 'point', label: 'Point (PT)' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectMethod(m.id)}
                style={{
                  padding: '5px',
                  fontSize: '11.5px',
                  fontWeight: selectMethod === m.id ? 700 : 500,
                  background: selectMethod === m.id ? '#e0f2fe' : '#ffffff',
                  color: selectMethod === m.id ? '#0369a1' : '#334155',
                  border: `1px solid ${selectMethod === m.id ? '#0284c7' : '#cbd5e1'}`,
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Chains List */}
        <div style={{ padding: '12px 14px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
              Selected Machining Chains ({chains.length}):
            </span>
            <button
              onClick={() => handleReverseDirection(activeChainId)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                background: '#f8fafc',
                border: '1px solid #94a3b8',
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#1e293b'
              }}
            >
              <RotateCw size={12} />
              Reverse Arrow Direction
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {chains.map((chain) => {
              const isSel = activeChainId === chain.id;
              return (
                <div
                  key={chain.id}
                  onClick={() => setActiveChainId(chain.id)}
                  style={{
                    padding: '8px 10px',
                    border: `1px solid ${isSel ? '#0284c7' : '#cbd5e1'}`,
                    background: isSel ? '#e0f2fe' : '#ffffff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: chain.color
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                        {chain.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {chain.entities} Entities | {chain.direction}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', color: isSel ? '#0284c7' : '#94a3b8', fontWeight: 700 }}>
                    {isSel ? 'ACTIVE' : 'SELECT'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            height: '42px',
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 12px',
            gap: '8px'
          }}
        >
          <button
            onClick={handleAccept}
            style={{
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Check size={14} />
            Accept Chaining
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #94a3b8',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

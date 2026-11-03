import React from 'react';
import { FileText, X, Check, Box, Layers, Scissors, Disc, Grid } from 'lucide-react';

export default function PartStatisticsModal({
  isOpen,
  onClose,
  currentProjectName = 'Base Structure-ALU.mcam',
  partMetrics = null,
  levels = [],
  solids = [],
  operations = [],
  activeMachine = null,
  activeWcs = 'G54'
}) {
  if (!isOpen) return null;

  const dim = partMetrics?.dimensions || { x: 120.0, y: 80.0, z: 45.0 };
  const bounds = partMetrics?.bounds || {
    min: { x: -60.0, y: 0.0, z: -22.5 },
    max: { x: 60.0, y: 80.0, z: 22.5 }
  };
  const volumeMm3 = dim.x * dim.y * dim.z * 0.72; // approximate machined stock volume
  const surfaceAreaMm2 = 2 * (dim.x * dim.y + dim.x * dim.z + dim.y * dim.z) * 0.85;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '560px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#0284c7',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Mastercam File &amp; Geometry Statistics</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px', maxHeight: '450px', overflowY: 'auto' }}>
          {/* File Header */}
          <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CURRENT FILE</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{currentProjectName}</div>
            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
              Machine: {activeMachine?.name || '4-AXIS VMC'} • Active WCS: {activeWcs} • Units: Metric (mm)
            </div>
          </div>

          {/* Geometry Entity Breakdown */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
              Entity Breakdown
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Solids:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{solids.length || 1}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Surfaces:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>14</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Lines &amp; Arcs:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>48</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Splines / Chains:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>6</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>Levels Configured:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{levels.length || 8}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>CAM Operations:</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>{operations.length}</span>
              </div>
            </div>
          </div>

          {/* Bounding Box & Mass Properties */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
              Extents &amp; Volume Properties
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Part Dimensions (X &times; Y &times; Z):</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                  {dim.x.toFixed(2)} &times; {dim.y.toFixed(2)} &times; {dim.z.toFixed(2)} mm
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>X Range:</span>
                <span style={{ fontFamily: 'monospace' }}>[{bounds.min.x.toFixed(2)} to {bounds.max.x.toFixed(2)}] mm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Y Range:</span>
                <span style={{ fontFamily: 'monospace' }}>[{bounds.min.y.toFixed(2)} to {bounds.max.y.toFixed(2)}] mm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Z Range:</span>
                <span style={{ fontFamily: 'monospace' }}>[{bounds.min.z.toFixed(2)} to {bounds.max.z.toFixed(2)}] mm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Estimated Part Volume:</span>
                <span style={{ fontWeight: 600, color: '#0284c7', fontFamily: 'monospace' }}>{(volumeMm3 / 1000).toFixed(2)} cm&sup3;</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '6px' }}>
                <span style={{ color: '#64748b' }}>Total Surface Area:</span>
                <span style={{ fontWeight: 600, color: '#0284c7', fontFamily: 'monospace' }}>{(surfaceAreaMm2 / 100).toFixed(2)} cm&sup2;</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '10px 16px',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 22px',
              backgroundColor: '#0284c7',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { X } from 'lucide-react';

export const DEFAULT_PROBES_CATALOG = [
  {
    id: 'sample_probe',
    name: 'SampleProbe',
    diameter: 6.0000,
    ewl: 88.5000,
    general: {
      probeName: 'SampleProbe',
      toolChangeId: 11,
      toolOffset: 11,
      probeModule: 'OMP40',
      probeType: 'Touch Trigger',
      transmissionType: 'Optical',
      stylus: 'A-5000-3712',
      extensionLength: 0,
      switchOnAlarm: 'Yes'
    },
    stylusParams: {
      ballDiameter: 6,
      length: 100,
      stemDiameter: 4.5,
      straightTaperLength: 7,
      holderLength: 17,
      threadType: 'M4'
    }
  },
  {
    id: 'omp40_2',
    name: 'Renishaw OMP40-2',
    diameter: 6.0000,
    ewl: 50.0000,
    general: {
      probeName: 'Renishaw OMP40-2',
      toolChangeId: 12,
      toolOffset: 12,
      probeModule: 'OMP40-2',
      probeType: 'Touch Trigger',
      transmissionType: 'Optical',
      stylus: 'A-5000-3709',
      extensionLength: 0,
      switchOnAlarm: 'Yes'
    },
    stylusParams: {
      ballDiameter: 6,
      length: 50,
      stemDiameter: 4.5,
      straightTaperLength: 5,
      holderLength: 15,
      threadType: 'M4'
    }
  },
  {
    id: 'rmp60',
    name: 'Renishaw RMP60',
    diameter: 4.0000,
    ewl: 100.0000,
    general: {
      probeName: 'Renishaw RMP60',
      toolChangeId: 13,
      toolOffset: 13,
      probeModule: 'RMP60',
      probeType: 'Touch Trigger',
      transmissionType: 'Radio Frequency',
      stylus: 'A-5000-3603',
      extensionLength: 50,
      switchOnAlarm: 'Yes'
    },
    stylusParams: {
      ballDiameter: 4,
      length: 100,
      stemDiameter: 3.0,
      straightTaperLength: 8,
      holderLength: 20,
      threadType: 'M4'
    }
  },
  {
    id: 'blum_tc50',
    name: 'Blum TC50',
    diameter: 5.0000,
    ewl: 75.0000,
    general: {
      probeName: 'Blum TC50',
      toolChangeId: 14,
      toolOffset: 14,
      probeModule: 'TC50',
      probeType: 'Optoelectronic',
      transmissionType: 'Infrared',
      stylus: 'B-3000-01',
      extensionLength: 0,
      switchOnAlarm: 'Yes'
    },
    stylusParams: {
      ballDiameter: 5,
      length: 75,
      stemDiameter: 4.0,
      straightTaperLength: 6,
      holderLength: 18,
      threadType: 'M4'
    }
  }
];

export default function SelectProbeModal({
  isOpen,
  onClose,
  onConfirmProbe,
  initialProbeId = 'sample_probe'
}) {
  const [selectedProbeId, setSelectedProbeId] = useState(initialProbeId);
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [stylusExpanded, setStylusExpanded] = useState(true);
  const [activePropertyInfo, setActivePropertyInfo] = useState(
    'This category contains general properties to describe a probe.'
  );

  const selectedProbe = DEFAULT_PROBES_CATALOG.find((p) => p.id === selectedProbeId) || DEFAULT_PROBES_CATALOG[0];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <div
        style={{
          width: '740px',
          background: '#ffffff',
          border: '1px solid #64748b',
          borderRadius: '4px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (Exact Replica of Mastercam Image 6) */}
        <div
          style={{
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            background: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Probe Stylus Icon */}
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <circle cx="5" cy="13.5" r="2" fill="#ef4444" stroke="#991b1b" strokeWidth="1"/>
              <line x1="6.5" y1="12" x2="13" y2="5" stroke="#475569" strokeWidth="2"/>
              <rect x="11" y="2" width="5" height="5" fill="#3b82f6" rx="1"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
              Select probe
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '2px',
              lineHeight: 1
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body: Left Table | Center Property Grid | Right Action Buttons */}
        <div style={{ display: 'flex', padding: '12px', gap: '10px', height: '390px' }}>
          {/* 1. Left Probes Table */}
          <div
            style={{
              width: '240px',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              background: '#ffffff'
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr 0.9fr',
                padding: '4px 6px',
                background: '#f8fafc',
                borderBottom: '1px solid #cbd5e1',
                fontSize: '11px',
                fontWeight: 600,
                color: '#475569'
              }}
            >
              <span>Probe name</span>
              <span style={{ textAlign: 'right' }}>Diameter</span>
              <span style={{ textAlign: 'right' }}>E.W.L.</span>
            </div>

            {/* Table Rows */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {DEFAULT_PROBES_CATALOG.map((probe) => {
                const isSelected = probe.id === selectedProbeId;
                return (
                  <div
                    key={probe.id}
                    onClick={() => setSelectedProbeId(probe.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 0.8fr 0.9fr',
                      padding: '3px 6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      background: isSelected ? '#0078d7' : 'transparent',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      fontFamily: 'Consolas, monospace',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {probe.name}
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      {probe.diameter.toFixed(4)}
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      {probe.ewl.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Help information panel at bottom left */}
            <div
              style={{
                borderTop: '1px solid #cbd5e1',
                background: '#f8fafc',
                padding: '6px 8px',
                fontSize: '10.5px'
              }}
            >
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
                Help information
              </div>
              <div style={{ color: '#64748b', lineHeight: 1.3 }}>
                {activePropertyInfo}
              </div>
            </div>
          </div>

          {/* 2. Center Property Grid (Mastercam Image 6) */}
          <div
            style={{
              flex: 1,
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              overflowY: 'auto',
              background: '#ffffff',
              fontSize: '11px'
            }}
          >
            {/* Category: General */}
            <div>
              <div
                onClick={() => setGeneralExpanded(!generalExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f5f9',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '4px 8px',
                  fontWeight: 700,
                  color: '#1e293b',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '10px', width: '12px' }}>
                  {generalExpanded ? '[-]' : '[+]'}
                </span>
                <span>General</span>
              </div>

              {generalExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { label: 'Probe name', val: selectedProbe.general.probeName, info: 'The unique identification name for this touch-trigger probe tool.' },
                    { label: 'Tool change ID', val: selectedProbe.general.toolChangeId, info: 'CNC Spindle ATC Tool Number for M06 tool call (e.g. T11).' },
                    { label: 'Tool offset', val: selectedProbe.general.toolOffset, info: 'Tool length geometry and wear register index (H11).' },
                    { label: 'Probe module', val: selectedProbe.general.probeModule, info: 'Kinematic module sensor body (e.g. Renishaw OMP40, RMP60, TC50).' },
                    { label: 'Probe type', val: selectedProbe.general.probeType, info: 'Kinematic stylus trigger mechanism (Touch Trigger).' },
                    { label: 'Transmission type', val: selectedProbe.general.transmissionType, info: 'Optical line-of-sight infrared or Radio Frequency transmission.' },
                    { label: 'Stylus', val: selectedProbe.general.stylus, info: 'Renishaw ceramic/ruby stylus assembly catalog part number.' },
                    { label: 'Extension total length', val: selectedProbe.general.extensionLength, info: 'Total intermediate shank extension bar length in mm.' },
                    { label: 'Probe switch-on alarm', val: selectedProbe.general.switchOnAlarm, info: 'Automatic machine interlock safety alarm if probe fails to power on.' }
                  ].map((row) => (
                    <div
                      key={row.label}
                      onClick={() => setActivePropertyInfo(row.info)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr',
                        padding: '3px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ color: '#475569' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category: Stylus Parameters */}
            <div>
              <div
                onClick={() => setStylusExpanded(!stylusExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#f1f5f9',
                  borderTop: '1px solid #cbd5e1',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '4px 8px',
                  fontWeight: 700,
                  color: '#1e293b',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: '10px', width: '12px' }}>
                  {stylusExpanded ? '[-]' : '[+]'}
                </span>
                <span>Stylus Parameters</span>
              </div>

              {stylusExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { label: 'Ball diameter (A)', val: selectedProbe.stylusParams.ballDiameter, info: 'Exact calibrated ruby sphere diameter in mm.' },
                    { label: 'Length (B)', val: selectedProbe.stylusParams.length, info: 'Total effective stylus length from holder gauge face to ruby tip.' },
                    { label: 'Stem diameter (C)', val: selectedProbe.stylusParams.stemDiameter, info: 'Ceramic or tungsten carbide stem diameter.' },
                    { label: 'Holder straight taper length (E)', val: selectedProbe.stylusParams.straightTaperLength, info: 'Length of straight shank taper section.' },
                    { label: 'Holder length (F)', val: selectedProbe.stylusParams.holderLength, info: 'Overall toolholder body length.' },
                    { label: 'Thread type', val: selectedProbe.stylusParams.threadType, info: 'Stylus mounting thread spec (M4 standard Renishaw).' }
                  ].map((row) => (
                    <div
                      key={row.label}
                      onClick={() => setActivePropertyInfo(row.info)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr',
                        padding: '3px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ color: '#475569' }}>{row.label}</span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Right Action Buttons */}
          <div style={{ width: '100px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              style={{ padding: '4px 8px', fontSize: '11px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
            >
              Edit...
            </button>
            <button
              type="button"
              style={{ padding: '4px 8px', fontSize: '11px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
            >
              Create...
            </button>
            <button
              type="button"
              style={{ padding: '4px 8px', fontSize: '11px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
            >
              Delete...
            </button>
            <button
              type="button"
              style={{ padding: '4px 8px', fontSize: '11px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
            >
              Import...
            </button>

            <div style={{ flex: 1 }} />

            <button
              type="button"
              style={{ padding: '4px 8px', fontSize: '11px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '2px', cursor: 'pointer' }}
            >
              &lt;&lt; Simple
            </button>

            <div style={{ height: '10px' }} />

            {/* OK Button: Confirms probe and launches Probing Dialog (Image 7) */}
            <button
              type="button"
              onClick={() => onConfirmProbe?.(selectedProbe)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 700,
                background: '#ffffff',
                border: '1.5px solid #0078d7',
                borderRadius: '2px',
                cursor: 'pointer',
                color: '#0f172a'
              }}
            >
              OK
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

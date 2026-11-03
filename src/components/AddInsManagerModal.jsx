import React, { useState } from 'react';
import { Cpu, X, Play, FolderOpen, HelpCircle, Check, ShieldCheck, Box, Settings } from 'lucide-react';

const DEFAULT_ADDINS = [
  {
    id: 'renishaw_prod_plus',
    name: 'Renishaw Productivity+ Inspection',
    filename: 'RenishawProdPlus.dll',
    type: 'NET-Hook (C# / .NET 4.8)',
    vendor: 'Renishaw plc',
    version: '2018.3.1',
    description: 'Automated in-process probing routines, spindle probe surface calibration, and automatic work coordinate origin setting.',
    enabled: true
  },
  {
    id: 'vericut_interface',
    name: 'CGTech VERICUT Interface',
    filename: 'mcam2vct.dll',
    type: 'C-Hook (Native C++)',
    vendor: 'CGTech Inc.',
    version: '8.1.2',
    description: 'Exports workpiece geometry, stock solids, fixture clamps, tool assemblies, and planned toolpaths into CGTech VERICUT machine simulation.',
    enabled: true
  },
  {
    id: 'robotmaster',
    name: 'Robotmaster 6-Axis Robotic CAM Link',
    filename: 'RobotmasterCAD.dll',
    type: 'NET-Hook',
    vendor: 'Hypertherm Inc.',
    version: '7.4.0',
    description: 'Kinematic trajectory conversion and singularity avoidance for 6-axis industrial articulated robot milling cells.',
    enabled: true
  },
  {
    id: 'moldplus',
    name: 'Moldplus 5-Axis Toolkit',
    filename: 'MoldplusCore.dll',
    type: 'C-Hook',
    vendor: 'Moldplus SA',
    version: '2018.1',
    description: 'Advanced parting line calculation, automatic core/cavity splitting, and 5-axis collision-free tool vector tilting.',
    enabled: true
  },
  {
    id: 'gcode_streamer',
    name: 'Argus DNC & Realtime Machine Link',
    filename: 'ArgusDNCStreamer.dll',
    type: 'NET-Hook',
    vendor: 'Argus Technologies',
    version: '2.0.0',
    description: 'Direct RS-232 and Ethernet FTP streaming to Haas, Fanuc, Heidenhain, and Mazak CNC controllers.',
    enabled: true
  }
];

export default function AddInsManagerModal({
  isOpen,
  onClose,
  onNotify
}) {
  const [selectedAddInId, setSelectedAddInId] = useState(DEFAULT_ADDINS[0].id);
  const [activeTab, setActiveTab] = useState('installed');

  if (!isOpen) return null;

  const selectedAddIn = DEFAULT_ADDINS.find((a) => a.id === selectedAddInId) || DEFAULT_ADDINS[0];

  const handleRun = () => {
    onClose();
    if (onNotify) {
      onNotify(`Executing Mastercam Add-In: ${selectedAddIn.name} (${selectedAddIn.filename})`, 'success');
    }
  };

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
          width: '720px',
          maxWidth: '94vw',
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
            <Cpu size={18} />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Mastercam Run User Applications (C-Hooks / NET-Hooks)</span>
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
        <div style={{ display: 'flex', height: '360px' }}>
          {/* Left: Add-In List */}
          <div
            style={{
              width: '280px',
              borderRight: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              overflowY: 'auto',
              padding: '8px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '4px 8px 8px' }}>
              Available Add-Ins
            </div>
            {DEFAULT_ADDINS.map((addin) => {
              const isSelected = addin.id === selectedAddInId;
              return (
                <div
                  key={addin.id}
                  onClick={() => setSelectedAddInId(addin.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e0f2fe' : 'transparent',
                    border: isSelected ? '1px solid #0284c7' : '1px solid transparent',
                    marginBottom: '4px',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '12px', color: isSelected ? '#0369a1' : '#0f172a' }}>
                    {addin.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                    {addin.filename}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Add-In Details */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>{selectedAddIn.name}</h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Vendor: {selectedAddIn.vendor} • v{selectedAddIn.version}</div>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShieldCheck size={13} />
                Certified
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>FILE PATH &amp; ARCHITECTURE</div>
              <div style={{ backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', color: '#1e293b' }}>
                C:\Program Files\Mastercam 2018\chooks\{selectedAddIn.filename}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>TYPE</div>
              <div style={{ fontSize: '12px', color: '#334155' }}>{selectedAddIn.type}</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>DESCRIPTION</div>
              <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.5, backgroundColor: '#f8fafc', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {selectedAddIn.description}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: '#f1f5f9',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          <button
            onClick={() => {
              if (onNotify) onNotify('Browse dialog opened: Select .dll, .ft, or .chook file', 'info');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <FolderOpen size={14} />
            Browse Other (.dll)...
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 20px',
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <Play size={13} fill="#ffffff" />
              Run Add-In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

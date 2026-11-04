import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  RefreshCw,
  HelpCircle,
  FolderOpen,
  Sliders,
  Layers,
  ArrowRight,
  RotateCw,
  Compass,
  Play,
  Settings,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export default function MastercamToolpathParametersModal({
  isOpen,
  onClose,
  operation,
  tools = [],
  stockConfig = {},
  onSaveOperation,
  onRegenerateToolpath,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState('tool');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (operation) {
      setFormData({
        name: operation.name || '',
        toolId: operation.toolId || (tools[0]?.id || 1),
        badgeClass: operation.badgeClass || 'contour',
        stepoverPct: operation.stepoverPct || 40,
        stepdown: operation.stepdown || 2.5,
        totalDepth: operation.totalDepth || 15.0,
        stockToLeaveXY: operation.stockToLeaveXY ?? 0.0,
        stockToLeaveZ: operation.stockToLeaveZ ?? 0.0,
        rapidHeight: operation.rapidHeight || 25.0,
        feedPlane: operation.feedPlane || 2.5,
        retractHeight: operation.retractHeight || 5.0,
        topOfStock: operation.topOfStock ?? 0.0,
        depthMode: operation.depthMode || 'absolute',
        clearanceMode: operation.clearanceMode || 'absolute',
        retractMode: operation.retractMode || 'absolute',
        feedPlaneMode: operation.feedPlaneMode || 'incremental',
        topOfStockMode: operation.topOfStockMode || 'absolute',
        cuttingDirection: operation.cuttingDirection || 'climb',
        compensationType: operation.compensationType || 'computer',
        rollAroundCorners: operation.rollAroundCorners || 'sharp',
        leadInLineLen: operation.leadInLineLen || 5.0,
        leadInArcRad: operation.leadInArcRad || 5.0,
        leadInSweepDeg: operation.leadInSweepDeg || 90,
        chamferWidth: operation.chamferWidth || 0.508,
        tipOffset: operation.tipOffset || 1.27,
        drillCycleType: operation.drillCycleType || (operation.badgeClass === 'tap' ? 'G84' : operation.badgeClass === 'spotdrill' ? 'G81' : 'G83'),
        peckDepth: operation.peckDepth || 2.0,
        pitch: operation.pitch || 0.79375, // 10-32 UNF pitch (32 TPI)
        dwellSec: operation.dwellSec || 0.0,
        coolant: operation.coolant || 'Flood',
        comment: operation.comment || operation.name || ''
      });
      // Select appropriate default tab for operation
      if (operation.badgeClass === 'drill' || operation.badgeClass === 'spotdrill' || operation.badgeClass === 'tap') {
        setActiveTab('cut_parameters');
      } else {
        setActiveTab('tool');
      }
    }
  }, [operation, tools]);

  if (!isOpen || !operation) return null;

  const currentTool = tools.find((t) => t.id === formData.toolId) || tools[0] || {};

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (regenerate = true) => {
    const updatedOp = {
      ...operation,
      ...formData,
      toolName: currentTool ? `T${currentTool.number} - ${currentTool.name}` : operation.toolName
    };
    if (onSaveOperation) {
      onSaveOperation(updatedOp);
    }
    if (regenerate && onRegenerateToolpath) {
      onRegenerateToolpath(updatedOp.id);
    }
    if (onNotify) {
      onNotify(`Mastercam: Updated parameters & regenerated ${updatedOp.name}`, 'success');
    }
    onClose();
  };

  const navItems = [
    { id: 'toolpath_type', label: 'Toolpath Type', badge: formData.badgeClass?.toUpperCase() },
    { id: 'tool', label: 'Tool', badge: `T${currentTool.number || 1}` },
    { id: 'holder', label: 'Holder', badge: 'CAT40' },
    { id: 'cut_parameters', label: 'Cut Parameters' },
    { id: 'transitions', label: 'Transitions / Entry' },
    { id: 'depth_cuts', label: 'Depth Cuts' },
    { id: 'lead_in_out', label: 'Lead In / Out' },
    { id: 'break_through', label: 'Break Through' },
    { id: 'linking', label: 'Linking Parameters', highlight: true },
    { id: 'planes', label: 'Planes (WCS)' },
    { id: 'coolant', label: 'Coolant', badge: formData.coolant }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
    >
      <div
        style={{
          width: '920px',
          height: '660px',
          background: '#f1f5f9',
          borderRadius: '6px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px #94a3b8',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Mastercam Classic Window Title Bar */}
        <div
          style={{
            height: '36px',
            background: 'linear-gradient(to bottom, #1e3a8a, #172554)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            userSelect: 'none',
            borderBottom: '1px solid #0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px' }}>
              Mastercam 2D Toolpaths - [{formData.name || 'Parameters'}]
            </span>
            <span
              style={{
                background: '#0284c7',
                fontSize: '10.5px',
                padding: '1px 6px',
                borderRadius: '3px',
                fontWeight: 600
              }}
            >
              OP #{operation.id}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleSave(true)}
              title="OK (Save & Regenerate Toolpath)"
              style={{
                background: '#16a34a',
                border: 'none',
                borderRadius: '3px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <Check size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => handleSave(false)}
              title="Apply Changes"
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '3px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <ArrowRight size={15} />
            </button>
            <button
              onClick={onClose}
              title="Cancel (Esc)"
              style={{
                background: '#dc2626',
                border: 'none',
                borderRadius: '3px',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Mastercam Quick Action Toolbar */}
        <div
          style={{
            height: '32px',
            background: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: '12px',
            fontSize: '12px'
          }}
        >
          <span style={{ color: '#475569', fontWeight: 600 }}>Operation Type:</span>
          <select
            value={formData.badgeClass}
            onChange={(e) => handleFieldChange('badgeClass', e.target.value)}
            style={{
              fontSize: '12px',
              padding: '2px 6px',
              border: '1px solid #94a3b8',
              borderRadius: '2px',
              background: '#fff'
            }}
          >
            <option value="face">Facing</option>
            <option value="contour">2D Contour</option>
            <option value="pocket">2D Pocket</option>
            <option value="adaptive">2D Dynamic Mill (High-Speed)</option>
            <option value="chamfer">Model Chamfer / 2D Chamfer</option>
            <option value="spotdrill">Spot Drill (G81)</option>
            <option value="drill">Peck Drill (G83)</option>
            <option value="tap">Rigid Tap (G84)</option>
            <option value="circlemill">Circle Mill / Helical Bore</option>
          </select>

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Machine: Haas VF-2 TR (3-Axis) | WCS: G54 (Top-Left / Center)
          </span>
        </div>

        {/* Modal Main Body (Left Tree + Right Property Page) */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Left Navigation Tree */}
          <div
            style={{
              width: '210px',
              background: '#f8fafc',
              borderRight: '1px solid #cbd5e1',
              overflowY: 'auto',
              padding: '6px 0'
            }}
          >
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '12.5px',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#1e3a8a' : '#334155',
                    background: isSelected ? '#e0f2fe' : 'transparent',
                    borderLeft: isSelected ? '3px solid #0284c7' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    transition: 'background 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChevronRight size={13} color={isSelected ? '#0284c7' : '#94a3b8'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: isSelected ? '#bae6fd' : '#e2e8f0',
                        color: isSelected ? '#0369a1' : '#64748b'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Active Parameter Page */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              padding: '18px 24px',
              overflowY: 'auto'
            }}
          >
            {/* 1. TOOL PAGE */}
            {activeTab === 'tool' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Tool Selection & Cutting Dynamics
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Select cutting tool from machine magazine or shop library
                  </span>
                </div>

                {/* Tool List Table */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>Tool #</th>
                        <th style={{ padding: '6px 10px' }}>Tool Name</th>
                        <th style={{ padding: '6px 10px' }}>Type</th>
                        <th style={{ padding: '6px 10px' }}>Diameter</th>
                        <th style={{ padding: '6px 10px' }}>Corner Rad</th>
                        <th style={{ padding: '6px 10px' }}>Flutes</th>
                        <th style={{ padding: '6px 10px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((t) => {
                        const isSel = formData.toolId === t.id;
                        return (
                          <tr
                            key={t.id}
                            onClick={() => handleFieldChange('toolId', t.id)}
                            style={{
                              background: isSel ? '#e0f2fe' : '#ffffff',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer'
                            }}
                          >
                            <td style={{ padding: '6px 10px', fontWeight: isSel ? 700 : 500 }}>T{t.number}</td>
                            <td style={{ padding: '6px 10px', color: isSel ? '#0369a1' : '#1e293b' }}>{t.name}</td>
                            <td style={{ padding: '6px 10px' }}>{t.type}</td>
                            <td style={{ padding: '6px 10px' }}>{t.diameter} mm</td>
                            <td style={{ padding: '6px 10px' }}>{t.cornerRad || 0} mm</td>
                            <td style={{ padding: '6px 10px' }}>{t.flutes || 2}</td>
                            <td style={{ padding: '6px 10px' }}>
                              {isSel && (
                                <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '11px' }}>
                                  ✓ ACTIVE
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Feeds and Speeds Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Spindle Speed (RPM):
                    </label>
                    <input
                      type="number"
                      value={currentTool.rpm || 3500}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        background: '#f1f5f9'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Feed Rate (mm/min / IPM):
                    </label>
                    <input
                      type="number"
                      value={currentTool.feedRate || 1200}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        background: '#f1f5f9'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Plunge Feed Rate:
                    </label>
                    <input
                      type="number"
                      value={currentTool.plungeRate || 350}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        background: '#f1f5f9'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Coolant:
                    </label>
                    <select
                      value={formData.coolant}
                      onChange={(e) => handleFieldChange('coolant', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        background: '#fff'
                      }}
                    >
                      <option value="Flood">Flood (M08)</option>
                      <option value="Mist">Mist Coolant</option>
                      <option value="Through">Through Spindle (TSC)</option>
                      <option value="Off">Off (M09)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CUT PARAMETERS PAGE */}
            {activeTab === 'cut_parameters' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Cut Parameters
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Configure cutter compensation, stepover, and stock allowance
                  </span>
                </div>

                {/* If Drill or Tap cycle */}
                {(formData.badgeClass === 'drill' || formData.badgeClass === 'spotdrill' || formData.badgeClass === 'tap') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Cycle Type:
                      </label>
                      <select
                        value={formData.drillCycleType}
                        onChange={(e) => handleFieldChange('drillCycleType', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="G81">Drill / Counterbore (G81 - Simple Plunge)</option>
                        <option value="G83">Peck Drill (G83 - Full Retract for Deep Holes)</option>
                        <option value="G73">Chip Break (G73 - High Speed Peck)</option>
                        <option value="G84">Tap (G84 - Floating / Rigid Tapping)</option>
                      </select>
                    </div>

                    {formData.drillCycleType === 'G83' && (
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Peck Increment (Q):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.peckDepth}
                          onChange={(e) => handleFieldChange('peckDepth', parseFloat(e.target.value) || 2.0)}
                          style={{ width: '160px', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                        <span style={{ fontSize: '11.5px', color: '#64748b', marginLeft: '10px' }}>mm per peck</span>
                      </div>
                    )}

                    {formData.drillCycleType === 'G84' && (
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Thread Pitch (F):
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData.pitch}
                          onChange={(e) => handleFieldChange('pitch', parseFloat(e.target.value) || 0.79375)}
                          style={{ width: '160px', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                        <span style={{ fontSize: '11.5px', color: '#64748b', marginLeft: '10px' }}>
                          mm / pitch (0.79375mm for 10-32 UNF / 32 TPI)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Milling Cut Parameters */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Compensation Type:
                        </label>
                        <select
                          value={formData.compensationType}
                          onChange={(e) => handleFieldChange('compensationType', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        >
                          <option value="computer">Computer</option>
                          <option value="control">Control (G41/G42)</option>
                          <option value="wear">Wear</option>
                          <option value="off">Off</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Cutting Direction:
                        </label>
                        <select
                          value={formData.cuttingDirection}
                          onChange={(e) => handleFieldChange('cuttingDirection', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        >
                          <option value="climb">Climb Milling</option>
                          <option value="conventional">Conventional Milling</option>
                        </select>
                      </div>
                    </div>

                    {/* Chamfer Parameters if Chamfer Toolpath */}
                    {formData.badgeClass === 'chamfer' && (
                      <div style={{ background: '#fef3c7', padding: '14px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400e', marginBottom: '10px' }}>
                          2D Model Chamfer Dimensions:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                              Chamfer Width:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.chamferWidth}
                              onChange={(e) => handleFieldChange('chamferWidth', parseFloat(e.target.value) || 0.508)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #d97706', borderRadius: '3px' }}
                            />
                            <span style={{ fontSize: '11px', color: '#b45309' }}>e.g. 0.508mm (0.020")</span>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                              Bottom Tip Offset:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.tipOffset}
                              onChange={(e) => handleFieldChange('tipOffset', parseFloat(e.target.value) || 1.27)}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #d97706', borderRadius: '3px' }}
                            />
                            <span style={{ fontSize: '11px', color: '#b45309' }}>e.g. 1.27mm (0.050")</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stock to Leave XY and Z */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Stock to Leave on Walls (XY):
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={formData.stockToLeaveXY}
                          onChange={(e) => handleFieldChange('stockToLeaveXY', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Stock to Leave on Floors (Z):
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={formData.stockToLeaveZ}
                          onChange={(e) => handleFieldChange('stockToLeaveZ', parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. LINKING PARAMETERS PAGE (THE MASTER SCREEN FROM THE VIDEO) */}
            {activeTab === 'linking' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Linking Parameters
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Absolute / Incremental Z Planes matching Mastercam 2019/2024
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Clearance */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span style={{ width: '130px', fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      Clearance:
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.rapidHeight}
                      onChange={(e) => handleFieldChange('rapidHeight', parseFloat(e.target.value) || 25)}
                      style={{ width: '90px', padding: '4px 8px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="clearanceMode"
                          checked={formData.clearanceMode === 'absolute'}
                          onChange={() => handleFieldChange('clearanceMode', 'absolute')}
                        />
                        Absolute
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="clearanceMode"
                          checked={formData.clearanceMode === 'incremental'}
                          onChange={() => handleFieldChange('clearanceMode', 'incremental')}
                        />
                        Incremental
                      </label>
                    </div>
                  </div>

                  {/* Retract */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span style={{ width: '130px', fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      Retract:
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.retractHeight}
                      onChange={(e) => handleFieldChange('retractHeight', parseFloat(e.target.value) || 5)}
                      style={{ width: '90px', padding: '4px 8px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="retractMode"
                          checked={formData.retractMode === 'absolute'}
                          onChange={() => handleFieldChange('retractMode', 'absolute')}
                        />
                        Absolute
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="retractMode"
                          checked={formData.retractMode === 'incremental'}
                          onChange={() => handleFieldChange('retractMode', 'incremental')}
                        />
                        Incremental
                      </label>
                    </div>
                  </div>

                  {/* Feed Plane */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span style={{ width: '130px', fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      Feed Plane:
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.feedPlane}
                      onChange={(e) => handleFieldChange('feedPlane', parseFloat(e.target.value) || 2.5)}
                      style={{ width: '90px', padding: '4px 8px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="feedPlaneMode"
                          checked={formData.feedPlaneMode === 'absolute'}
                          onChange={() => handleFieldChange('feedPlaneMode', 'absolute')}
                        />
                        Absolute
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="feedPlaneMode"
                          checked={formData.feedPlaneMode === 'incremental'}
                          onChange={() => handleFieldChange('feedPlaneMode', 'incremental')}
                        />
                        Incremental
                      </label>
                    </div>
                  </div>

                  {/* Top of Stock */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <span style={{ width: '130px', fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      Top of Stock:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.topOfStock}
                      onChange={(e) => handleFieldChange('topOfStock', parseFloat(e.target.value) || 0)}
                      style={{ width: '90px', padding: '4px 8px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    />
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="topOfStockMode"
                          checked={formData.topOfStockMode === 'absolute'}
                          onChange={() => handleFieldChange('topOfStockMode', 'absolute')}
                        />
                        Absolute
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="topOfStockMode"
                          checked={formData.topOfStockMode === 'incremental'}
                          onChange={() => handleFieldChange('topOfStockMode', 'incremental')}
                        />
                        Incremental
                      </label>
                    </div>
                  </div>

                  {/* Depth */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                    <span style={{ width: '130px', fontSize: '12.5px', fontWeight: 700, color: '#166534' }}>
                      Depth:
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.totalDepth}
                      onChange={(e) => handleFieldChange('totalDepth', parseFloat(e.target.value) || 0)}
                      style={{ width: '90px', padding: '4px 8px', fontSize: '12.5px', border: '1px solid #86efac', borderRadius: '3px', fontWeight: 700 }}
                    />
                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="depthMode"
                          checked={formData.depthMode === 'absolute'}
                          onChange={() => handleFieldChange('depthMode', 'absolute')}
                        />
                        Absolute
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="depthMode"
                          checked={formData.depthMode === 'incremental'}
                          onChange={() => handleFieldChange('depthMode', 'incremental')}
                        />
                        Incremental
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. LEAD IN / LEAD OUT PAGE */}
            {activeTab === 'lead_in_out' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Lead In / Out (Entry & Exit Tangents)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Arc and line entry motions to prevent tool witness marks
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '10px', color: '#0f172a' }}>
                      Entry Motion:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', color: '#475569' }}>Line Length:</label>
                        <input
                          type="number"
                          value={formData.leadInLineLen}
                          onChange={(e) => handleFieldChange('leadInLineLen', parseFloat(e.target.value) || 5)}
                          style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', color: '#475569' }}>Arc Radius:</label>
                        <input
                          type="number"
                          value={formData.leadInArcRad}
                          onChange={(e) => handleFieldChange('leadInArcRad', parseFloat(e.target.value) || 5)}
                          style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', color: '#475569' }}>Sweep Angle (°):</label>
                        <input
                          type="number"
                          value={formData.leadInSweepDeg}
                          onChange={(e) => handleFieldChange('leadInSweepDeg', parseFloat(e.target.value) || 90)}
                          style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '10px', color: '#0f172a' }}>
                      Exit Motion:
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Copying Entry Parameters enabled.
                      <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 600 }}>
                        ✓ Symmetrical Exit Arc & Line Active
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback for other tabs */}
            {!['tool', 'cut_parameters', 'linking', 'lead_in_out'].includes(activeTab) && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    {navItems.find((n) => n.id === activeTab)?.label || 'Parameters'}
                  </h3>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#64748b' }}>
                  Standard Mastercam default settings applied for this operation branch.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mastercam Footer Action Buttons */}
        <div
          style={{
            height: '48px',
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 16px',
            gap: '10px'
          }}
        >
          <button
            onClick={() => handleSave(true)}
            style={{
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Check size={15} />
            OK & Regenerate
          </button>
          <button
            onClick={() => handleSave(false)}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #94a3b8',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Apply
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
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

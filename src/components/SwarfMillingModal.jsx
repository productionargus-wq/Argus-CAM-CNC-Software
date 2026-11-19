import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, AlertTriangle, ShieldCheck, Cpu, Sliders,
  HelpCircle, Compass, Layers, RotateCw, Activity, Sparkles, Orbit,
  CheckCircle2, Info
} from 'lucide-react';

import {
  SWARF_MILLING_PAGES,
  SWARF_DRIVE_MODES,
  SWARF_SYNC_MODES,
  SWARF_MILLING_MATERIALS,
  SWARF_MILLING_PRESETS,
  SWARF_MACHINE_KINEMATICS,
  SWARF_TCPM_DIALECTS,
  resolveDefaultSwarfTool,
  calculateSwarfPhysics,
  calculateRecommendedSwarfSettings,
  DEFAULT_SWARF_CONFIG
} from '../config/swarfMillingSchema.js';

export default function SwarfMillingModal({
  isOpen,
  onClose,
  operation = null,
  tools = [],
  activeMachine = null,
  machines = [],
  onSelectMachine,
  stockConfig = null,
  currentModel = null,
  onSaveOperation,
  onNotify,
  onOpenToolLibrary
}) {
  if (!isOpen) return null;

  // Selected tool resolver
  const defaultTool = useMemo(() => resolveDefaultSwarfTool(tools), [tools]);

  // Form State
  const [formState, setFormState] = useState(() => {
    const base = { ...DEFAULT_SWARF_CONFIG };
    if (defaultTool) {
      base.toolId = defaultTool.id;
      base.toolName = defaultTool.name;
      base.toolDiameter = Number(defaultTool.diameter) || 10;
      base.spindleRpm = defaultTool.rpm || 12000;
      base.feedRate = defaultTool.feedRate || 2800;
    }
    if (operation) {
      return { ...base, ...operation };
    }
    return base;
  });

  const [activePage, setActivePage] = useState('cut_pattern');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [editedPages, setEditedPages] = useState(
    new Set(['toolpath_type', 'cut_pattern', 'tool', 'tool_axis_control'])
  );

  // Sync when operation prop changes
  useEffect(() => {
    if (operation) {
      setFormState((prev) => ({
        ...prev,
        ...operation
      }));
    }
  }, [operation]);

  // Field updater
  const updateField = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
    setEditedPages((prev) => new Set(prev).add(activePage));
  };

  // Active Tool Resolution
  const selectedTool = useMemo(() => {
    const tId = formState.toolId;
    const match = tools.find((t) => String(t.id) === String(tId));
    if (match) return match;
    return (
      defaultTool || {
        id: 1,
        number: 1,
        name: '10mm 4-Flute Flat Endmill',
        diameter: 10,
        flutes: 4,
        fluteLength: 25,
        type: 'flat'
      }
    );
  }, [tools, formState.toolId, defaultTool]);

  // Real-time Physics Calculation
  const material = SWARF_MILLING_MATERIALS[formState.materialId?.toUpperCase()] || SWARF_MILLING_MATERIALS.ALU_6061;
  const physics = useMemo(() => {
    return calculateSwarfPhysics({
      material,
      tool: selectedTool,
      wallHeight: Number(formState.wallHeightMm) || 22.0,
      stepover: Number(formState.radialStepover) || 0.5,
      feedRate: Number(formState.feedRate) || 2800,
      rpm: Number(formState.spindleRpm) || 12000,
      passes: formState.enableRadialPasses ? Number(formState.radialPasses) || 1 : 1,
      axialSlices: formState.enableAxialSlices ? Number(formState.axialSlices) || 1 : 1,
      toolOverhangMm: Number(formState.toolStickoutMm) || 45.0
    });
  }, [
    material,
    selectedTool,
    formState.wallHeightMm,
    formState.radialStepover,
    formState.feedRate,
    formState.spindleRpm,
    formState.enableRadialPasses,
    formState.radialPasses,
    formState.enableAxialSlices,
    formState.axialSlices,
    formState.toolStickoutMm
  ]);

  // Load Preset
  const handleApplyPreset = (presetKey) => {
    const preset = SWARF_MILLING_PRESETS[presetKey];
    if (!preset) return;
    setFormState((prev) => ({
      ...prev,
      presetId: preset.id,
      materialId: preset.materialId,
      driveMode: preset.driveMode,
      syncMode: preset.syncMode,
      cutDirection: preset.cutDirection,
      cuttingMethod: preset.cuttingMethod,
      enableAxialSlices: preset.axialSlices > 1,
      axialSlices: preset.axialSlices,
      enableRadialPasses: preset.radialPasses > 1,
      radialPasses: preset.radialPasses,
      radialStepover: preset.radialStepover,
      stockToLeaveWall: preset.stockToLeaveWall,
      stockToLeaveFloor: preset.stockToLeaveFloor,
      leadAngleDeg: preset.leadAngleDeg,
      tiltOffsetDeg: preset.tiltOffsetDeg,
      rollInRadiusMm: preset.rollInRadius,
      rollInAngleDeg: preset.rollInAngleDeg
    }));
    onNotify?.(`Applied Preset: ${preset.name}`, 'info');
  };

  // Recommended Values 1-Click Optimization
  const handleRecommendedValues = () => {
    const recommended = calculateRecommendedSwarfSettings({
      materialId: formState.materialId,
      tool: selectedTool,
      tools,
      wallHeightMm: formState.wallHeightMm
    });

    setFormState((prev) => ({
      ...prev,
      ...recommended
    }));

    setEditedPages(new Set(Object.keys(SWARF_MILLING_PAGES)));

    onNotify?.(
      `Loaded Recommended 5-Axis Swarf Settings for ${material.name}! (RPM: ${recommended.spindleRpm}, Feed: ${recommended.feedRate} mm/min, Slices: ${recommended.axialSlices}, Passes: ${recommended.radialPasses})`,
      'success'
    );
  };

  // Commit and Save
  const handleSave = () => {
    const savedOp = {
      id: operation?.id || `op_swarf_${Date.now()}`,
      name: formState.name || '5-Axis Swarf Milling (Flank Contouring)',
      strategy: '5axis_swarf',
      strategyKey: '5axis_swarf',
      badgeClass: 'swarf',
      badgeText: '5X-SWARF',
      color: '#8b5cf6',
      toolId: selectedTool.id,
      tool: selectedTool,
      ...formState,
      physics,
      timestamp: Date.now()
    };

    onSaveOperation?.(savedOp);
    onNotify?.('5-Axis Swarf Milling toolpath generated successfully!', 'success');
    onClose?.();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Tahoma, Helvetica, sans-serif"
      }}
    >
      <div
        style={{
          width: '950px',
          maxWidth: '98vw',
          height: '710px',
          maxHeight: '94vh',
          backgroundColor: '#f0f2f5',
          border: '1px solid #717b87',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontSize: '12px',
          color: '#1e293b',
          userSelect: 'none'
        }}
      >
        {/* Title Bar (Mastercam Classic Slate/Navy Header) */}
        <div
          style={{
            height: '32px',
            background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            fontSize: '12.5px',
            fontWeight: 600,
            borderBottom: '1px solid #475569',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Orbit size={16} color="#a855f7" />
            <span>5-Axis Swarf Milling (Flank Contouring) &mdash; Parameter Configuration</span>
            <span
              style={{
                fontSize: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.25)',
                color: '#e9d5ff',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                fontWeight: 600
              }}
            >
              5X FLANK
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
              transition: 'background 0.15s, color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#cbd5e1';
            }}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Top Dynamics & Physics Quick HUD Bar */}
        <div
          style={{
            backgroundColor: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '11px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                padding: '3px 8px',
                borderRadius: '3px',
                border: '1px solid #cbd5e1'
              }}
            >
              <Compass size={14} color="#7c3aed" />
              <span style={{ color: '#64748b', fontWeight: 500 }}>Lead:</span>
              <strong style={{ color: '#0f172a' }}>{formState.leadAngleDeg}&deg;</strong>
              <span style={{ color: '#cbd5e1', margin: '0 2px' }}>|</span>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Tilt:</span>
              <strong style={{ color: '#0f172a' }}>{formState.tiltOffsetDeg}&deg;</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155' }}>
              <span>
                <span style={{ color: '#64748b' }}>MRR:</span>{' '}
                <strong style={{ color: '#7c3aed' }}>{physics.mrr} cm&sup3;/min</strong>
              </span>
              <span>
                <span style={{ color: '#64748b' }}>Force:</span>{' '}
                <strong style={{ color: '#0f172a' }}>{physics.fc} N</strong>
              </span>
              <span>
                <span style={{ color: '#64748b' }}>Deflection:</span>{' '}
                <strong style={{ color: physics.ratingColor }}>
                  {physics.deflectionMm} mm ({physics.deflectionMicrons} &mu;m)
                </strong>
              </span>
              <span>
                <span style={{ color: '#64748b' }}>Taper Err:</span>{' '}
                <strong style={{ color: '#0f172a' }}>{physics.taperErrorDeg}&deg;</strong>
              </span>
            </div>
          </div>

          {/* Action Tools: Preset + Recommended Values + Machinist Guide */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Preset:</span>
            <select
              value={formState.presetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '11px',
                color: '#0f172a',
                outline: 'none'
              }}
            >
              {Object.entries(SWARF_MILLING_PRESETS).map(([k, p]) => (
                <option key={k} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleRecommendedValues}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                border: '1px solid #6d28d9',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'filter 0.15s'
              }}
              title="Automatically calculate and load optimal tool, speeds, feeds, passes, lead angle, and kinematics"
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <Sparkles size={13} color="#ffffff" />
              <span>Recommended Values</span>
            </button>

            <button
              onClick={() => setIsGuideOpen((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: isGuideOpen ? '#ffffff' : '#0369a1',
                backgroundColor: isGuideOpen ? '#0284c7' : '#e0f2fe',
                border: '1px solid #38bdf8',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Open step-by-step machinist guide on tools, machines, and swarf flank milling"
            >
              <HelpCircle size={13} color={isGuideOpen ? '#ffffff' : '#0284c7'} />
              <span>{isGuideOpen ? 'Hide Guide' : 'Machinist Guide'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Machinist Guide Banner */}
        {isGuideOpen && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              padding: '12px 16px',
              fontSize: '11.5px',
              color: '#1e3a8a',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} color="#2563eb" />
                <strong style={{ fontSize: '12.5px', color: '#1e40af' }}>
                  5-Axis Swarf Milling Machinist Guide &amp; Setup Assistant
                </strong>
              </div>
              <button
                onClick={handleRecommendedValues}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={13} />
                <span>Apply Recommended Setup Now</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '4px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '3px' }}>1. Which Tool to Use?</div>
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.45 }}>
                  Use a <strong>10mm or 12mm 4-Flute Flat or Bullnose Endmill</strong>. Make sure the cutter <strong>Flute Length &ge; Wall Height</strong> ({formState.wallHeightMm}mm) so the flank cuts the entire wall in one continuous pass. If the wall is taller than the flute, the Recommended button automatically turns on Multi-Depth slices.
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '3px' }}>2. Which Machine to Use?</div>
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.45 }}>
                  Use a <strong>Table-Table AC Trunnion</strong> (e.g., Haas UMC-750, Fanuc Robodrill 5X, DMG MORI DMU 50). The A-axis cradle tilts the workpiece while the C-axis table rotates. The spindle stays rigid vertically, giving unmatched rigidity and chatter-free surface finish.
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dbeafe' }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '3px' }}>3. How Swarf Milling Works?</div>
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.45 }}>
                  The side (flank) of the cutter stays parallel to the wall, saving 90% cycle time compared to ball mills. <strong>Lead Angle (+0.5&deg;)</strong> tilts the tool slightly forward into the feed so the back edge never drags. <strong>Roll-In Arc (8mm)</strong> rolls into contact smoothly with zero dwell marks.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body: Mastercam 2-Column Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Navigation Tree */}
          <div
            style={{
              width: '230px',
              backgroundColor: '#ffffff',
              borderRight: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto'
            }}
          >
            <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Swarf Parameters
              </div>
              {Object.entries(SWARF_MILLING_PAGES).map(([pageKey, title]) => {
                const isActive = activePage === pageKey;
                const isEdited = editedPages.has(pageKey);
                return (
                  <button
                    key={pageKey}
                    onClick={() => setActivePage(pageKey)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11.5px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      backgroundColor: isActive ? '#3b82f6' : 'transparent',
                      color: isActive ? '#ffffff' : '#334155',
                      fontWeight: isActive ? 600 : 400
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {title}
                    </span>
                    {isEdited && !isActive && <Check size={12} color="#10b981" />}
                  </button>
                );
              })}
            </div>

            {/* Tool Information Snippet */}
            <div
              style={{
                margin: '8px',
                padding: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Active Cutter:</span>
                <span style={{ fontWeight: 600, color: '#0f172a', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedTool?.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Diameter:</span>
                <span style={{ fontWeight: 600, color: '#7c3aed' }}>{selectedTool?.diameter} mm</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Flute Length:</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>
                  {selectedTool?.fluteLength || 25} mm
                </span>
              </div>
            </div>
          </div>

          {/* Right Parameter Workspace (Light Theme) */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#f8fafc',
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Page 1: Toolpath Type */}
            {activePage === 'toolpath_type' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    5-Axis Swarf Milling (Flank Contouring) Overview
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Machining with the cylindrical/tapered flank of the tool tangential to ruled sidewalls and blade surfaces.
                  </p>
                </div>

                {/* Industrial Presets */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Industrial Application Presets
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.entries(SWARF_MILLING_PRESETS).map(([key, p]) => (
                      <div
                        key={key}
                        onClick={() => handleApplyPreset(key)}
                        style={{
                          padding: '10px',
                          borderRadius: '4px',
                          border: formState.presetId === p.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                          backgroundColor: formState.presetId === p.id ? '#ede9fe' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#7c3aed' }}>{p.name}</div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                          Direction: {p.cutDirection.toUpperCase()} &bull; Slices: {p.axialSlices} &bull; Passes: {p.radialPasses}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operation Name */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Toolpath Name
                  </label>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11.5px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #94a3b8',
                      borderRadius: '3px',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Page 2: Cut Pattern & Rail Guides */}
            {activePage === 'cut_pattern' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Cut Pattern &amp; Rail Guides
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Define ruled guide rails, curve synchronization, and multi-depth / multi-pass slicing.
                  </p>
                </div>

                {/* Geometry Drive Mode */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Geometry Drive Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {Object.values(SWARF_DRIVE_MODES).map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => updateField('driveMode', mode.id)}
                        style={{
                          padding: '10px',
                          borderRadius: '4px',
                          border: formState.driveMode === mode.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                          backgroundColor: formState.driveMode === mode.id ? '#ede9fe' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#7c3aed' }}>{mode.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>{mode.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rail Synchronization */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Rail Synchronization
                  </label>
                  <select
                    value={formState.syncMode}
                    onChange={(e) => updateField('syncMode', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11.5px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #94a3b8',
                      borderRadius: '3px',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  >
                    {Object.values(SWARF_SYNC_MODES).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cutting Direction & Method */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Milling Direction
                    </label>
                    <select
                      value={formState.cutDirection}
                      onChange={(e) => updateField('cutDirection', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    >
                      <option value="climb">Climb Milling (Left of Guide Rail)</option>
                      <option value="conventional">Conventional Milling (Right of Guide Rail)</option>
                    </select>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Cutting Motion
                    </label>
                    <select
                      value={formState.cuttingMethod}
                      onChange={(e) => updateField('cuttingMethod', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    >
                      <option value="one_way">One Way (Consistent Climb Direction)</option>
                      <option value="zig_zag">Zig-Zag (Bi-directional Flank Pass)</option>
                    </select>
                  </div>
                </div>

                {/* Multi-Depth & Multi-Pass Slicing */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formState.enableAxialSlices}
                        onChange={(e) => updateField('enableAxialSlices', e.target.checked)}
                      />
                      Axial Multi-Depth Slices
                    </label>
                    {formState.enableAxialSlices && (
                      <div style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>Number of Axial Slices:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formState.axialSlices}
                          onChange={(e) => updateField('axialSlices', Number(e.target.value))}
                          style={{
                            width: '80px',
                            padding: '3px 6px',
                            fontSize: '11.5px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #94a3b8',
                            borderRadius: '3px',
                            color: '#0f172a'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formState.enableRadialPasses}
                        onChange={(e) => updateField('enableRadialPasses', e.target.checked)}
                      />
                      Radial Multi-Pass (Stock Stepovers)
                    </label>
                    {formState.enableRadialPasses && (
                      <div style={{ paddingLeft: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Passes:</span>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={formState.radialPasses}
                            onChange={(e) => updateField('radialPasses', Number(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '3px 6px',
                              fontSize: '11.5px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #94a3b8',
                              borderRadius: '3px',
                              color: '#0f172a'
                            }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Stepover (mm):</span>
                          <input
                            type="number"
                            step="0.05"
                            value={formState.radialStepover}
                            onChange={(e) => updateField('radialStepover', Number(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '3px 6px',
                              fontSize: '11.5px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #94a3b8',
                              borderRadius: '3px',
                              color: '#0f172a'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock to Leave */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Wall Stock to Leave (mm)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={formState.stockToLeaveWall}
                      onChange={(e) => updateField('stockToLeaveWall', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Floor Stock to Leave (mm)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={formState.stockToLeaveFloor}
                      onChange={(e) => updateField('stockToLeaveFloor', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 3: Tool Selection & Dynamics */}
            {activePage === 'tool' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                      Tool Selection &amp; Dynamics
                    </h3>
                    <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                      Choose cutting tool and configure spindle speeds and feeds.
                    </p>
                  </div>
                  <button
                    onClick={onOpenToolLibrary}
                    style={{
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Tool Library...
                  </button>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Selected Tool
                  </label>
                  <select
                    value={formState.toolId}
                    onChange={(e) => updateField('toolId', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11.5px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #94a3b8',
                      borderRadius: '3px',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  >
                    {tools.map((t) => (
                      <option key={t.id} value={t.id}>
                        T{t.number || t.id} - {t.name} (Dia: {t.diameter}mm, Flute: {t.fluteLength || 25}mm)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Flute Length vs Wall Height Checker */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#0f172a' }}>Tool Flute Contact Check</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px' }}>
                      Flute Length: {selectedTool?.fluteLength || 25}mm &bull; Wall Height: {formState.wallHeightMm}mm
                    </div>
                  </div>
                  {(selectedTool?.fluteLength || 25) >= Number(formState.wallHeightMm) ? (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '3px',
                        backgroundColor: '#dcfce7',
                        border: '1px solid #86efac',
                        color: '#15803d',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Check size={13} /> Full Depth Flank Covered
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '3px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde047',
                        color: '#b45309',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <AlertTriangle size={13} /> Multi-Depth Required
                    </span>
                  )}
                </div>

                {/* Speeds and Feeds */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Spindle Speed (RPM)
                    </label>
                    <input
                      type="number"
                      value={formState.spindleRpm}
                      onChange={(e) => updateField('spindleRpm', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Cutting Feed (mm/min)
                    </label>
                    <input
                      type="number"
                      value={formState.feedRate}
                      onChange={(e) => updateField('feedRate', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Plunge Feed (mm/min)
                    </label>
                    <input
                      type="number"
                      value={formState.plungeFeed}
                      onChange={(e) => updateField('plungeFeed', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 4: Holder Definition & Clearance */}
            {activePage === 'holder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Holder Definition &amp; Clearance
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Manage tool stickout and holder collision envelopes.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Holder Spindle Taper
                    </label>
                    <select
                      value={formState.holderType}
                      onChange={(e) => updateField('holderType', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a'
                      }}
                    >
                      <option value="hsk_a63">HSK-A63 High-Precision Hydraulic Chuck</option>
                      <option value="bt40">BT40 Shrink-Fit Thermal Chuck</option>
                      <option value="cat40">CAT40 ER32 Collet Chuck</option>
                      <option value="capto_c6">Coromant Capto C6 Modular</option>
                    </select>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Tool Stickout (L_overhang mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formState.toolStickoutMm}
                      onChange={(e) => updateField('toolStickoutMm', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Holder Clearance Buffer (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.holderClearanceMm}
                      onChange={(e) => updateField('holderClearanceMm', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Shank Clearance Buffer (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.shankClearanceMm}
                      onChange={(e) => updateField('shankClearanceMm', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 5: Tool Axis Control (Lead / Tilt / Fanning) */}
            {activePage === 'tool_axis_control' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Tool Axis Control &amp; Orientation
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Control primary flank contact, lead/lag forward tilt, and rotary motion smoothing.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Lead / Lag Angle (Degrees)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="-5"
                      max="5"
                      value={formState.leadAngleDeg}
                      onChange={(e) => updateField('leadAngleDeg', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                      Forward lean along feed direction (+0.5&deg; eliminates heel drag).
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Side Tilt Offset (Degrees)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="-10"
                      max="10"
                      value={formState.tiltOffsetDeg}
                      onChange={(e) => updateField('tiltOffsetDeg', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                      Transverse tilt relative to ruled surface normal.
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formState.smoothSingularities}
                      onChange={(e) => updateField('smoothSingularities', e.target.checked)}
                    />
                    Automatic Singularity &amp; Gimbal Lock Smoothing
                  </label>
                  <p style={{ fontSize: '10.5px', color: '#64748b', margin: '4px 0 0 20px' }}>
                    Maintains smooth rotary acceleration near vertical pole transitions (A &approx; 0&deg;).
                  </p>
                </div>
              </div>
            )}

            {/* Page 6: Collision Control & Gouge Protection */}
            {activePage === 'collision_control' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Collision Control &amp; Gouge Protection
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Verify floor clearance and prevent tool body / holder collisions.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Floor Clearance Lift (mm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formState.floorClearanceMm}
                      onChange={(e) => updateField('floorClearanceMm', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                      Axial elevation above floor curve to prevent bottom corner gouging.
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Collision Avoidance Action
                    </label>
                    <select
                      value={formState.collisionRetractMode}
                      onChange={(e) => updateField('collisionRetractMode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a'
                      }}
                    >
                      <option value="retract_along_tool_axis">Retract Tool Along Orientation Vector</option>
                      <option value="tilt_away">Tilt Tool Flank Away From Interference</option>
                      <option value="skip_pass">Trim and Skip Gouging Segment</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Page 7: Linking Parameters & Lead In/Out */}
            {activePage === 'linking_parameters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Linking Parameters &amp; Lead In/Out
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Tangential roll-in / roll-out 3D arcs and safe clearance heights.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Clearance Z (mm)
                    </label>
                    <input
                      type="number"
                      value={formState.clearanceZ}
                      onChange={(e) => updateField('clearanceZ', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Retract Z (mm)
                    </label>
                    <input
                      type="number"
                      value={formState.retractZ}
                      onChange={(e) => updateField('retractZ', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Feed Plane Z (mm)
                    </label>
                    <input
                      type="number"
                      value={formState.feedPlaneZ}
                      onChange={(e) => updateField('feedPlaneZ', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>
                      Roll-In Arc Radius (mm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formState.rollInRadiusMm}
                      onChange={(e) => updateField('rollInRadiusMm', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>
                      Roll-In Arc Sweep (Deg)
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={formState.rollInAngleDeg}
                      onChange={(e) => updateField('rollInAngleDeg', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffd4',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 8: Machine Kinematics & Post Dialect */}
            {activePage === 'machine_kinematics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Machine Kinematics &amp; Post Dialect
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Select 5-axis machine kinematics solver and CNC controller post-processor dialect.
                  </p>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                    Machine Kinematic Architecture
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.values(SWARF_MACHINE_KINEMATICS).map((k) => (
                      <div
                        key={k.id}
                        onClick={() => updateField('machineKinematics', k.id)}
                        style={{
                          padding: '10px',
                          borderRadius: '4px',
                          border: formState.machineKinematics === k.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                          backgroundColor: formState.machineKinematics === k.id ? '#ede9fe' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#7c3aed' }}>{k.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                          Axes: {k.primaryAxis} &bull; {k.secondaryAxis}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    CNC Controller Dialect
                  </label>
                  <select
                    value={formState.controllerDialect}
                    onChange={(e) => updateField('controllerDialect', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '11.5px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #94a3b8',
                      borderRadius: '3px',
                      color: '#0f172a'
                    }}
                  >
                    {Object.values(SWARF_TCPM_DIALECTS).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Page 9: Arc Filter & 5X Tolerance */}
            {activePage === 'arc_filter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Arc Filter &amp; 5X Tolerance
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Control trajectory point density and look-ahead acceleration.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Linearization Tolerance (mm)
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      value={formState.linearizationToleranceMm}
                      onChange={(e) => updateField('linearizationToleranceMm', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Max Rotary Step Per Block (&deg;)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formState.maxRotaryAngleStepDeg}
                      onChange={(e) => updateField('maxRotaryAngleStepDeg', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Page 10: Planes (WCS) & Coolant */}
            {activePage === 'planes_coolant' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0' }}>
                    Planes (WCS) &amp; Coolant Management
                  </h3>
                  <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                    Select work coordinate system and cutting fluid mode.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Work Coordinate System (WCS)
                    </label>
                    <select
                      value={formState.wcsPlane}
                      onChange={(e) => updateField('wcsPlane', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a'
                      }}
                    >
                      <option value="top_g17">Top (G17) - Standard Vertical</option>
                      <option value="front_g19">Front (G19)</option>
                      <option value="right_g18">Right (G18)</option>
                    </select>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Coolant Mode
                    </label>
                    <select
                      value={formState.coolantMode}
                      onChange={(e) => updateField('coolantMode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11.5px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #94a3b8',
                        borderRadius: '3px',
                        color: '#0f172a'
                      }}
                    >
                      <option value="flood_m08">Flood Coolant (M08)</option>
                      <option value="through_spindle_m88">High-Pressure TSC 70 bar (M88)</option>
                      <option value="mist_m07">Air-Oil Mist (M07)</option>
                      <option value="air_blast_m09">Cold Air Blast (M09)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: Real-time Physics HUD & Commit Actions (Mastercam Light Theme) */}
        <div
          style={{
            height: '42px',
            backgroundColor: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            boxSizing: 'border-box'
          }}
        >
          {/* Real-time Physics HUD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Material:</span>
              <select
                value={formState.materialId}
                onChange={(e) => updateField('materialId', e.target.value)}
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '11px',
                  outline: 'none'
                }}
              >
                {Object.values(SWARF_MILLING_MATERIALS).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#cbd5e1' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#334155' }}>
              <span>
                MRR: <strong style={{ color: '#0f172a' }}>{physics.mrr}</strong> cm&sup3;/min
              </span>
              <span>
                Force: <strong style={{ color: '#0f172a' }}>{physics.fc}</strong> N
              </span>
              <span>
                Deflection:{' '}
                <strong style={{ color: physics.ratingColor }}>
                  {physics.deflectionMm} mm ({physics.deflectionMicrons} &mu;m)
                </strong>
              </span>
            </div>
          </div>

          {/* Action Buttons: Classic Mastercam Cancel & Green Commit Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                fontSize: '11.5px',
                fontWeight: 500,
                color: '#334155',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'background 0.1s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              <X size={14} color="#dc2626" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 16px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#ffffff',
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                border: '1px solid #166534',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'filter 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
            >
              <Check size={15} color="#ffffff" />
              Generate Swarf Toolpath
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

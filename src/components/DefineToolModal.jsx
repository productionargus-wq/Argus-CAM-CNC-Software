import React, { useState, useEffect } from 'react';
import {
  X, HelpCircle, ChevronDown, ChevronRight, Check, Wrench, Disc,
  CircleDot, ShieldAlert, Cpu, Layers, Box, ArrowRight, ArrowLeft
} from 'lucide-react';

export default function DefineToolModal({
  isOpen,
  onClose,
  onAddTool,
  onNotify
}) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Select Tool Type, 2: Define Tool Geometry, 3: Finalize Properties
  const [selectedToolId, setSelectedToolId] = useState('end_mill');

  // Tool geometry state (Step 2)
  const [toolGeometry, setToolGeometry] = useState({
    diameter: 12.0,
    fluteLength: 35.0,
    overallLength: 75.0,
    shankDiameter: 12.0,
    cornerRadius: 0.0,
    taperAngle: 0.0,
    flutes: 4,
    shoulderLength: 42.0
  });

  // Tool properties state (Step 3)
  const [toolProps, setToolProps] = useState({
    name: '12mm Flat End Mill',
    number: 1,
    lengthOffset: 1,
    diameterOffset: 1,
    spindleDirection: 'CW',
    spindleSpeed: 4500,
    feedRate: 1200,
    plungeRate: 400,
    retractRate: 2500,
    coolant: 'Flood',
    material: 'Carbide'
  });

  // Reset to step 1 on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Catalog of tools matching Image 1
  const millingTools = [
    { id: 'end_mill', label: 'End Mill', defaultName: 'Flat End Mill', defaultDia: 12, flutes: 4, cr: 0 },
    { id: 'bull_mill', label: 'Bull Mill', defaultName: 'Bull Nose End Mill', defaultDia: 12, flutes: 4, cr: 1.5 },
    { id: 'ball_mill', label: 'Ball Mill', defaultName: 'Ball End Mill', defaultDia: 10, flutes: 2, cr: 5.0 },
    { id: 'face_mill', label: 'Face Mill', defaultName: 'Face Mill Indexable', defaultDia: 50, flutes: 5, cr: 0.8 },
    { id: 'radius_mill', label: 'Radius Mill', defaultName: 'Corner Radius Mill', defaultDia: 16, flutes: 4, cr: 2.0 },
    { id: 'chamfer_mill', label: 'Chamfer Mill', defaultName: 'Chamfer Mill 45°', defaultDia: 12, flutes: 4, taper: 45 },
    { id: 'slot_mill', label: 'Slot Mill', defaultName: 'T-Slot Cutter', defaultDia: 25, flutes: 6, cr: 0 },
    { id: 'taper_mill', label: 'Taper Mill', defaultName: 'Tapered End Mill', defaultDia: 8, flutes: 3, taper: 7 },
    { id: 'dove_mill', label: 'Dove Mill', defaultName: 'Dovetail Cutter', defaultDia: 20, flutes: 4, taper: 60 },
    { id: 'lollipop_mill', label: 'Lollipop Mill', defaultName: 'Lollipop Spherical Mill', defaultDia: 10, flutes: 2, cr: 5 },
    { id: 'engrave_tool', label: 'Engrave Tool', defaultName: 'Engraving Tool V-Bit', defaultDia: 6, flutes: 1, taper: 30 },
    { id: 'thread_mill', label: 'Thread Mill', defaultName: 'Helical Thread Mill', defaultDia: 8, flutes: 3, cr: 0 },
    { id: 'barrel_mill', label: 'Barrel Mill', defaultName: 'Circle Segment Barrel Mill', defaultDia: 12, flutes: 4, cr: 250 },
    { id: 'high_feed_mill', label: 'High Feed Mill', defaultName: 'High Feed Milling Cutter', defaultDia: 25, flutes: 3, cr: 1.0 },
    { id: 'custom_tool', label: 'Custom Tool', defaultName: 'Custom Form Tool', defaultDia: 16, flutes: 4, cr: 0 }
  ];

  const holemakingTools = [
    { id: 'drill', label: 'Drill', defaultName: 'Jobber Twist Drill', defaultDia: 8.5, flutes: 2, taper: 118 },
    { id: 'spot_drill', label: 'Spot Drill', defaultName: 'Spotting Drill 90°', defaultDia: 10, flutes: 2, taper: 90 },
    { id: 'center_drill', label: 'Center Drill', defaultName: 'Center Drill #3', defaultDia: 6, flutes: 2, taper: 60 },
    { id: 'counterbore', label: 'Counterbore', defaultName: 'Counterbore Tool', defaultDia: 14, flutes: 3, cr: 0 },
    { id: 'countersink', label: 'Countersink', defaultName: 'Countersink 90°', defaultDia: 16, flutes: 3, taper: 90 },
    { id: 'reamer', label: 'Reamer', defaultName: 'Precision Chucking Reamer', defaultDia: 10.0, flutes: 6, cr: 0 },
    { id: 'tap', label: 'Tap', defaultName: 'Spiral Flute Machine Tap', defaultDia: 8.0, flutes: 3, cr: 0 },
    { id: 'boring_bar', label: 'Boring Bar', defaultName: 'Precision Boring Head', defaultDia: 20.0, flutes: 1, cr: 0.4 }
  ];

  const handleSelectType = (tool) => {
    setSelectedToolId(tool.id);
    setToolGeometry((prev) => ({
      ...prev,
      diameter: tool.defaultDia || 12,
      cornerRadius: tool.cr || 0,
      taperAngle: tool.taper || 0,
      flutes: tool.flutes || 4
    }));
    setToolProps((prev) => ({
      ...prev,
      name: `${tool.defaultDia || 12}mm ${tool.defaultName}`
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    const allTools = [...millingTools, ...holemakingTools];
    const sel = allTools.find((t) => t.id === selectedToolId) || millingTools[0];

    const newTool = {
      id: Date.now(),
      number: Number(toolProps.number) || 1,
      name: toolProps.name,
      type: sel.label,
      diameter: Number(toolGeometry.diameter) || 12,
      cornerRadius: Number(toolGeometry.cornerRadius) || 0,
      fluteLength: Number(toolGeometry.fluteLength) || 35,
      overallLength: Number(toolGeometry.overallLength) || 75,
      shankDiameter: Number(toolGeometry.shankDiameter) || 12,
      taperAngle: Number(toolGeometry.taperAngle) || 0,
      flutes: Number(toolGeometry.flutes) || 4,
      spindleSpeed: Number(toolProps.spindleSpeed) || 4500,
      feedRate: Number(toolProps.feedRate) || 1200,
      plungeRate: Number(toolProps.plungeRate) || 400,
      retractRate: Number(toolProps.retractRate) || 2500,
      spindleDirection: toolProps.spindleDirection,
      coolant: toolProps.coolant,
      material: toolProps.material
    };

    if (onAddTool) {
      onAddTool(newTool);
    }
    if (onNotify) {
      onNotify(`Defined new tool: T${newTool.number} (${newTool.name})`, 'success');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '840px',
          height: '560px',
          background: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #94a3b8',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: '32px',
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            fontSize: '12px',
            color: '#1e293b'
          }}
        >
          <span style={{ fontWeight: 600 }}>Define Tool</span>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Wizard Body: Left Steps Column + Right Main Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Steps Navigation Column */}
          <div
            style={{
              width: '180px',
              borderRight: '1px solid #cbd5e1',
              padding: '20px 14px',
              background: '#ffffff',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Current Step:
            </div>
            {[
              { num: 1, label: 'Select Tool Type' },
              { num: 2, label: 'Define Tool Geometry' },
              { num: 3, label: 'Finalize Properties' }
            ].map((step) => {
              const isActive = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '2px',
                    border: isActive ? '1px solid #93c5fd' : '1px solid transparent',
                    background: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#1d4ed8' : '#64748b',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  {step.label}
                </div>
              );
            })}
          </div>

          {/* Right Main Wizard Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 32px', overflowY: 'auto' }}>
            
            {/* ================= STEP 1: SELECT TOOL TYPE (Image 1) ================= */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0284c7', margin: '0 0 6px 0' }}>
                  What type of tool would you like to create?
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
                  Select the tool type you wish to create from the list below.
                </p>

                {/* Categorized Scrollable Tool Grid */}
                <div style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: '3px', overflowY: 'auto', padding: '12px' }}>
                  
                  {/* Category: Milling */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
                      <ChevronDown size={14} /> Milling
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {millingTools.map((t) => {
                        const isSelected = selectedToolId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleSelectType(t)}
                            style={{
                              border: isSelected ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                              borderRadius: '3px',
                              background: isSelected ? '#f0f9ff' : '#ffffff',
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            {/* Realistic CAD Tool Graphic */}
                            <div style={{ width: '28px', height: '36px', background: '#e2e8f0', borderRadius: '2px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                              <div style={{ width: '8px', height: '12px', background: '#94a3b8' }} />
                              <div style={{ width: '16px', height: '16px', background: isSelected ? '#0284c7' : '#64748b', borderRadius: t.id === 'ball_mill' ? '50% 50% 0 0' : '0' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 500, color: '#1e293b' }}>
                              {t.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Holemaking */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px', color: '#0f172a', marginBottom: '8px' }}>
                      <ChevronDown size={14} /> Holemaking
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {holemakingTools.map((t) => {
                        const isSelected = selectedToolId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleSelectType(t)}
                            style={{
                              border: isSelected ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                              borderRadius: '3px',
                              background: isSelected ? '#f0f9ff' : '#ffffff',
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            <div style={{ width: '28px', height: '36px', background: '#e2e8f0', borderRadius: '2px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                              <div style={{ width: '8px', height: '14px', background: '#94a3b8' }} />
                              <div style={{ width: '12px', height: '14px', background: isSelected ? '#d97706' : '#475569', clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 500, color: '#1e293b' }}>
                              {t.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ================= STEP 2: DEFINE TOOL GEOMETRY ================= */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0284c7', margin: '0 0 6px 0' }}>
                  Define Tool Geometry
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
                  Specify the cutter dimensions and fluting parameters.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>Diameter (D):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={toolGeometry.diameter}
                        onChange={(e) => setToolGeometry({ ...toolGeometry, diameter: Number(e.target.value) })}
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>Corner Radius (CR):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={toolGeometry.cornerRadius}
                        onChange={(e) => setToolGeometry({ ...toolGeometry, cornerRadius: Number(e.target.value) })}
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>Flute Length (FL):</span>
                      <input
                        type="number"
                        step="0.5"
                        value={toolGeometry.fluteLength}
                        onChange={(e) => setToolGeometry({ ...toolGeometry, fluteLength: Number(e.target.value) })}
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>Overall Length (OAL):</span>
                      <input
                        type="number"
                        step="1.0"
                        value={toolGeometry.overallLength}
                        onChange={(e) => setToolGeometry({ ...toolGeometry, overallLength: Number(e.target.value) })}
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>Shank Diameter (SD):</span>
                      <input
                        type="number"
                        step="0.5"
                        value={toolGeometry.shankDiameter}
                        onChange={(e) => setToolGeometry({ ...toolGeometry, shankDiameter: Number(e.target.value) })}
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3', outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>Number of Flutes:</span>
                      <input
                        type="number"
                        value={toolGeometry.flutes}
                        onChange={(e) => setToolGeometry({ ...toolGeometry, flutes: Number(e.target.value) })}
                        style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Visual Tool Section Diagram */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                      Cutter Geometry Preview
                    </div>
                    <svg width="120" height="180" viewBox="0 0 120 180">
                      {/* Shank */}
                      <rect x="45" y="10" width="30" height="70" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
                      {/* Shoulder */}
                      <polygon points="45,80 35,95 85,95 75,80" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                      {/* Fluted Cutting Portion */}
                      <rect x="35" y="95" width="50" height="70" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
                      {/* Helical Flute Hatch Lines */}
                      <line x1="35" y1="105" x2="85" y2="125" stroke="#0369a1" strokeWidth="1.5" />
                      <line x1="35" y1="125" x2="85" y2="145" stroke="#0369a1" strokeWidth="1.5" />
                      <line x1="35" y1="145" x2="85" y2="165" stroke="#0369a1" strokeWidth="1.5" />
                    </svg>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
                      Ø{toolGeometry.diameter} mm x {toolGeometry.fluteLength} mm Cut
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: FINALIZE PROPERTIES ================= */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0284c7', margin: '0 0 6px 0' }}>
                  Finalize Properties & Machining Parameters
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
                  Assign tool numbers, default spindle speeds, feeds, and coolant options.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Tool Description:</label>
                    <input
                      type="text"
                      value={toolProps.name}
                      onChange={(e) => setToolProps({ ...toolProps, name: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Tool Material:</label>
                    <select
                      value={toolProps.material}
                      onChange={(e) => setToolProps({ ...toolProps, material: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fff' }}
                    >
                      <option value="Carbide">Solid Micrograin Carbide (AlTiN)</option>
                      <option value="HSS">High-Speed Steel (HSS-Co5)</option>
                      <option value="Ceramic">Silicon Nitride Ceramic</option>
                      <option value="PCD">Polycrystalline Diamond (PCD)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Tool Number (T#):</label>
                    <input
                      type="number"
                      value={toolProps.number}
                      onChange={(e) => setToolProps({ ...toolProps, number: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Spindle Direction:</label>
                    <select
                      value={toolProps.spindleDirection}
                      onChange={(e) => setToolProps({ ...toolProps, spindleDirection: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fff' }}
                    >
                      <option value="CW">CW (Clockwise - M03)</option>
                      <option value="CCW">CCW (Counter-Clockwise - M04)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Spindle Speed (RPM):</label>
                    <input
                      type="number"
                      value={toolProps.spindleSpeed}
                      onChange={(e) => setToolProps({ ...toolProps, spindleSpeed: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Feed Rate (mm/min):</label>
                    <input
                      type="number"
                      value={toolProps.feedRate}
                      onChange={(e) => setToolProps({ ...toolProps, feedRate: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Plunge Rate (mm/min):</label>
                    <input
                      type="number"
                      value={toolProps.plungeRate}
                      onChange={(e) => setToolProps({ ...toolProps, plungeRate: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fef9c3' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#475569', marginBottom: '4px' }}>Coolant Strategy:</label>
                    <select
                      value={toolProps.coolant}
                      onChange={(e) => setToolProps({ ...toolProps, coolant: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '2px', background: '#fff' }}
                    >
                      <option value="Flood">Flood Coolant (M08)</option>
                      <option value="Mist">Mist Coolant (M07)</option>
                      <option value="Air">Air Blast Blast</option>
                      <option value="ThruSpindle">High-Pressure Thru-Spindle (TSC)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Dialog Bottom Navigation Bar */}
        <div
          style={{
            height: '48px',
            background: '#f8fafc',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            fontSize: '12px'
          }}
        >
          <button
            onClick={() => alert("Mastercam Define Tool Wizard Guide:\n1. Choose cutter type\n2. Specify physical cutting dimensions\n3. Assign speeds and feeds.")}
            style={{
              padding: '6px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            Help
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{
                padding: '6px 14px',
                background: currentStep === 1 ? '#f1f5f9' : '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                color: currentStep === 1 ? '#94a3b8' : '#334155'
              }}
            >
              Back
            </button>
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                style={{
                  padding: '6px 16px',
                  background: '#0f5a9e',
                  color: '#ffffff',
                  border: '1px solid #0f5a9e',
                  borderRadius: '2px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                style={{
                  padding: '6px 18px',
                  background: '#059669',
                  color: '#ffffff',
                  border: '1px solid #059669',
                  borderRadius: '2px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Finish
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

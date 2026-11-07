import React, { useState, useEffect, useMemo } from 'react';
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
  Maximize2,
  Wrench,
  Shield,
  Gauge,
  Box,
  Droplets,
  Scissors,
  CircleDot,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function MastercamToolpathParametersModal({
  isOpen,
  onClose,
  operation,
  tools = [],
  stockConfig = {},
  onSaveOperation,
  onRegenerateToolpath,
  onNotify,
  onOpenChaining,
  onAddTool
}) {
  const [activeTab, setActiveTab] = useState('tool');
  const [formData, setFormData] = useState({});

  // Toolpath Types catalog matching Mastercam 2D Mill
  const TOOLPATH_TYPES = [
    {
      id: 'face',
      title: 'Face Milling',
      desc: 'Clean top material face across workpiece boundary',
      category: '2D Mill',
      color: '#0284c7'
    },
    {
      id: 'contour',
      title: '2D Contour',
      desc: 'Profile walls and external boundary contours with lead in/out',
      category: '2D Mill',
      color: '#0ea5e9'
    },
    {
      id: 'pocket',
      title: '2D Pocket',
      desc: 'Clear enclosed cavities with parallel spiral / zigzag passes',
      category: '2D Mill',
      color: '#2563eb'
    },
    {
      id: 'adaptive',
      title: 'Dynamic Mill (2D HSM)',
      desc: 'High-speed trochoidal roughing with constant tool engagement',
      category: '2D High Speed',
      color: '#7c3aed'
    },
    {
      id: 'chamfer',
      title: 'Model Chamfer',
      desc: 'Deburr and bevel sharp edges with chamfer mills',
      category: '2D Detail',
      color: '#d97706'
    },
    {
      id: 'spotdrill',
      title: 'Spot Drill (G81)',
      desc: 'Precision center spotting to prevent drill wandering',
      category: 'Holemaking',
      color: '#10b981'
    },
    {
      id: 'drill',
      title: 'Peck Drill (G83)',
      desc: 'Deep hole peck cycle with full retract for chip clearing',
      category: 'Holemaking',
      color: '#059669'
    },
    {
      id: 'tap',
      title: 'Rigid Tap (G84)',
      desc: 'Synchronized spindle/feed tapping for internal threads',
      category: 'Holemaking',
      color: '#4f46e5'
    },
    {
      id: 'circlemill',
      title: 'Circle Mill / Helical Bore',
      desc: 'Helical ramp circular pocketing without specialized drill',
      category: 'Holemaking',
      color: '#0891b2'
    }
  ];

  // Initialize and synchronize form data
  useEffect(() => {
    if (operation) {
      const selectedTool = tools.find((t) => t.id === operation.toolId) || tools[0] || {};
      const toolDiam = selectedTool.diameter || 10;
      const flutes = selectedTool.flutes || 4;
      const initRpm = operation.spindleSpeed || selectedTool.rpm || 3500;
      const initFeed = operation.feedRate || selectedTool.feedRate || 1200;
      const initPlunge = operation.plungeFeedRate || selectedTool.plungeRate || 400;

      // Calculate initial surface speed and FPT
      const surfaceSpeed = Math.round((Math.PI * toolDiam * initRpm) / 1000);
      const fpt = Number((initFeed / (initRpm * Math.max(1, flutes))).toFixed(4));

      setFormData({
        name: operation.name || '2D Toolpath',
        toolId: operation.toolId || selectedTool.id || 1,
        badgeClass: operation.badgeClass || 'contour',
        comment: operation.comment || operation.name || '',
        
        // Feeds & Speeds Dynamics
        spindleSpeed: initRpm,
        feedRate: initFeed,
        plungeFeedRate: initPlunge,
        surfaceSpeed: surfaceSpeed,
        feedPerTooth: fpt,

        // Depth Cuts
        depthCutsEnabled: operation.depthCutsEnabled ?? true,
        stepdown: operation.stepdown || 2.5,
        finishCutsCount: operation.finishCutsCount ?? 1,
        finishStep: operation.finishStep || 0.5,
        keepToolDown: operation.keepToolDown ?? true,

        // Tool Holder
        holderType: operation.holderType || 'CAT40_ER32',
        gaugeLength: operation.gaugeLength || 65,
        stickoutLength: operation.stickoutLength || 35,
        holderDiameter: operation.holderDiameter || 50,

        // Machining Boundaries & Geometry
        machiningRegion: operation.machiningRegion || 'Outer boundary of the part (Silhouette)',
        machiningStrategy: operation.machiningStrategy || 'from_outside',
        avoidanceRegion: operation.avoidanceRegion || 'Clamping fixtures & vise jaws (Level 30)',
        avoidanceAllowance: operation.avoidanceAllowance || 5.0,
        airRegion: operation.airRegion || 'Automatic stock boundary expansion',

        // Cut Parameters
        cutStyle: operation.cutStyle || (operation.badgeClass === 'face' ? 'zigzag' : (operation.badgeClass === 'adaptive' || operation.badgeClass === 'dynamic') ? 'dynamic' : 'constant_overlap'),
        stepoverPct: operation.stepoverPct ?? (operation.badgeClass === 'face' ? 70 : (operation.badgeClass === 'adaptive' || operation.badgeClass === 'dynamic') ? 25 : 45),
        cutAngle: operation.cutAngle ?? 0,
        stockToLeaveXY: operation.stockToLeaveXY ?? 0.0,
        stockToLeaveZ: operation.stockToLeaveZ ?? 0.0,
        cuttingDirection: operation.cuttingDirection || 'climb',
        compensationType: operation.compensationType || 'computer',
        rollAroundCorners: operation.rollAroundCorners || 'sharp',
        chamferWidth: operation.chamferWidth || 0.5,
        tipOffset: operation.tipOffset || 1.25,
        drillCycleType: operation.drillCycleType || (operation.badgeClass === 'tap' ? 'G84' : operation.badgeClass === 'spotdrill' ? 'G81' : 'G83'),
        peckDepth: operation.peckDepth || 2.0,
        pitch: operation.pitch || 0.79375,
        dwellSec: operation.dwellSec || 0.0,

        // Linking Parameters
        clearanceMode: operation.clearanceMode || 'absolute',
        rapidHeight: operation.rapidHeight || 25.0,
        retractMode: operation.retractMode || 'absolute',
        retractHeight: operation.retractHeight || 5.0,
        feedPlaneMode: operation.feedPlaneMode || 'incremental',
        feedPlane: operation.feedPlane || 2.5,
        topOfStockMode: operation.topOfStockMode || 'absolute',
        topOfStock: operation.topOfStock ?? 0.0,
        depthMode: operation.depthMode || 'absolute',
        totalDepth: operation.totalDepth || 15.0,

        // Lead In / Out
        leadInLineLen: operation.leadInLineLen || 5.0,
        leadInArcRad: operation.leadInArcRad || 5.0,
        leadInSweepDeg: operation.leadInSweepDeg || 90,
        leadInOutOverlap: operation.leadInOutOverlap || 0.0,

        // Break Through
        breakThroughEnabled: operation.breakThroughEnabled ?? false,
        breakThroughAmount: operation.breakThroughAmount || 1.0,

        // Planes & Coolant
        wcsPlane: operation.wcsPlane || 'Top (G54)',
        toolPlane: operation.toolPlane || 'Top (G17)',
        constructionPlane: operation.constructionPlane || 'Top (G17)',
        workOffset: operation.workOffset ?? 0,
        coolant: operation.coolant || 'Flood',
        coolantTiming: operation.coolantTiming || 'With'
      });

      // Default active tab
      if (operation.badgeClass === 'drill' || operation.badgeClass === 'spotdrill' || operation.badgeClass === 'tap') {
        setActiveTab('cut_parameters');
      } else {
        setActiveTab('tool');
      }
    }
  }, [operation, tools]);

  if (!isOpen || !operation) return null;

  const currentTool = tools.find((t) => t.id === formData.toolId) || tools[0] || {};
  const toolDiam = currentTool.diameter || 10;
  const toolFlutes = Math.max(1, currentTool.flutes || 4);

  // Field change handler
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Speed & Feed Synchronizers (free-form typing with live sync when valid numbers)
  const handleRpmChange = (rpmVal) => {
    if (rpmVal === '' || rpmVal === '-') {
      setFormData((prev) => ({ ...prev, spindleSpeed: rpmVal }));
      return;
    }
    const rpmNum = parseFloat(rpmVal);
    if (!isNaN(rpmNum) && rpmNum > 0) {
      const sfm = Math.round((Math.PI * toolDiam * rpmNum) / 1000);
      const feed = Math.round(rpmNum * toolFlutes * (parseFloat(formData.feedPerTooth) || 0.05));
      setFormData((prev) => ({
        ...prev,
        spindleSpeed: rpmVal,
        surfaceSpeed: sfm,
        feedRate: feed
      }));
    } else {
      setFormData((prev) => ({ ...prev, spindleSpeed: rpmVal }));
    }
  };

  const handleSurfaceSpeedChange = (sfmVal) => {
    if (sfmVal === '' || sfmVal === '-') {
      setFormData((prev) => ({ ...prev, surfaceSpeed: sfmVal }));
      return;
    }
    const sfmNum = parseFloat(sfmVal);
    if (!isNaN(sfmNum) && sfmNum > 0) {
      const rpm = Math.round((sfmNum * 1000) / (Math.PI * toolDiam));
      const feed = Math.round(rpm * toolFlutes * (parseFloat(formData.feedPerTooth) || 0.05));
      setFormData((prev) => ({
        ...prev,
        surfaceSpeed: sfmVal,
        spindleSpeed: rpm,
        feedRate: feed
      }));
    } else {
      setFormData((prev) => ({ ...prev, surfaceSpeed: sfmVal }));
    }
  };

  const handleFeedRateChange = (feedVal) => {
    if (feedVal === '' || feedVal === '-') {
      setFormData((prev) => ({ ...prev, feedRate: feedVal }));
      return;
    }
    const feedNum = parseFloat(feedVal);
    const rpm = parseFloat(formData.spindleSpeed) || 3500;
    if (!isNaN(feedNum) && feedNum > 0) {
      const fpt = Number((feedNum / (rpm * toolFlutes)).toFixed(4));
      setFormData((prev) => ({
        ...prev,
        feedRate: feedVal,
        feedPerTooth: fpt
      }));
    } else {
      setFormData((prev) => ({ ...prev, feedRate: feedVal }));
    }
  };

  const handleFptChange = (fptVal) => {
    if (fptVal === '' || fptVal === '-') {
      setFormData((prev) => ({ ...prev, feedPerTooth: fptVal }));
      return;
    }
    const fptNum = parseFloat(fptVal);
    const rpm = parseFloat(formData.spindleSpeed) || 3500;
    if (!isNaN(fptNum) && fptNum > 0) {
      const feed = Math.round(rpm * toolFlutes * fptNum);
      setFormData((prev) => ({
        ...prev,
        feedPerTooth: fptVal,
        feedRate: feed
      }));
    } else {
      setFormData((prev) => ({ ...prev, feedPerTooth: fptVal }));
    }
  };

  // Switch Tool with recalculation
  const handleSelectTool = (tId, directToolObj = null) => {
    const newTool = directToolObj || tools.find((t) => t.id === tId);
    if (!newTool) return;
    const d = newTool.diameter || 10;
    const fl = Math.max(1, newTool.flutes || 4);
    const rpm = newTool.rpm || 3500;
    const feed = newTool.feedRate || 1200;
    const plunge = newTool.plungeRate || 350;
    const sfm = Math.round((Math.PI * d * rpm) / 1000);
    const fpt = Number((feed / (rpm * fl)).toFixed(4));

    setFormData((prev) => ({
      ...prev,
      toolId: newTool.id,
      spindleSpeed: rpm,
      feedRate: feed,
      plungeFeedRate: plunge,
      surfaceSpeed: sfm,
      feedPerTooth: fpt
    }));
  };

  // Save changes
  const handleSave = (closeAfterSave = true, regenerate = true) => {
    const parseNum = (val, defaultVal = 0) => {
      if (val === '' || val === '-' || val === null || val === undefined) return defaultVal;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? defaultVal : parsed;
    };

    const updatedOp = {
      ...operation,
      ...formData,
      spindleSpeed: parseNum(formData.spindleSpeed, 3500),
      feedRate: parseNum(formData.feedRate, 1200),
      plungeFeedRate: parseNum(formData.plungeFeedRate, 400),
      totalDepth: parseNum(formData.totalDepth, -35.0),
      topOfStock: parseNum(formData.topOfStock, 0),
      feedPlane: parseNum(formData.feedPlane, 2.5),
      retractHeight: parseNum(formData.retractHeight, 5.0),
      rapidHeight: parseNum(formData.rapidHeight, 25.0),
      stepdown: parseNum(formData.stepdown, 2.5),
      stepoverPct: parseNum(formData.stepoverPct, 70),
      stockToLeaveXY: parseNum(formData.stockToLeaveXY, 0),
      stockToLeaveZ: parseNum(formData.stockToLeaveZ, 0),
      stickoutLength: parseNum(formData.stickoutLength, 35),
      gaugeLength: parseNum(formData.gaugeLength, 65),
      holderDiameter: parseNum(formData.holderDiameter, 50),
      peckDepth: parseNum(formData.peckDepth, 2.0),
      pitch: parseNum(formData.pitch, 0.79375),
      finishCutsCount: Math.round(parseNum(formData.finishCutsCount, 1)),
      cutAngle: parseNum(formData.cutAngle, 0),
      breakThroughAmount: parseNum(formData.breakThroughAmount, 1.0),
      toolName: currentTool ? `T${currentTool.number} - ${currentTool.name}` : operation.toolName
    };

    if (onSaveOperation) {
      onSaveOperation(updatedOp);
    }
    if (regenerate && onRegenerateToolpath) {
      onRegenerateToolpath(updatedOp.id);
    }
    if (onNotify) {
      onNotify(`Mastercam: Updated parameters for ${updatedOp.name}`, 'success');
    }
    if (closeAfterSave) {
      onClose();
    }
  };

  // Navigation Items
  const navItems = [
    { id: 'toolpath_type', label: 'Toolpath Type', badge: formData.badgeClass?.toUpperCase() },
    { id: 'geometry', label: 'Machining Geometry', badge: formData.badgeClass === 'face' ? 'TOP FACE' : 'BOUNDARIES' },
    { id: 'tool', label: 'Tool', badge: `T${currentTool.number || 1}` },
    { id: 'holder', label: 'Holder', badge: formData.holderType?.split('_')[0] || 'CAT40' },
    { id: 'cut_parameters', label: 'Cut Parameters' },
    { id: 'depth_cuts', label: 'Depth Cuts', badge: formData.depthCutsEnabled ? `${formData.stepdown}mm` : 'OFF' },
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
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}
    >
      <div
        style={{
          width: '940px',
          height: '670px',
          background: '#ffffff',
          borderRadius: '6px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px #64748b',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* ================= Mastercam Iconic Window Title Bar ================= */}
        <div
          style={{
            height: '38px',
            background: 'linear-gradient(to bottom, #0f5a9e, #0a4073)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            userSelect: 'none',
            borderBottom: '1px solid #082f55'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px' }}>
              Mastercam 2D Toolpaths - [{formData.name || 'Parameters'}]
            </span>
            <span
              style={{
                background: '#0284c7',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                fontWeight: 700
              }}
            >
              OP #{operation.id}
            </span>
          </div>

          {/* Mastercam Standard Triple Action Buttons: OK (✓), Apply (→), Cancel (✕) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleSave(true, true)}
              title="OK: Accept & Regenerate Toolpath (Enter)"
              style={{
                background: '#16a34a',
                border: '1px solid #15803d',
                borderRadius: '3px',
                width: '26px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              <Check size={16} strokeWidth={3} />
            </button>

            <button
              onClick={() => handleSave(false, true)}
              title="Apply Changes (Alt+A)"
              style={{
                background: '#0284c7',
                border: '1px solid #0369a1',
                borderRadius: '3px',
                width: '26px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>

            <button
              onClick={onClose}
              title="Cancel (Esc)"
              style={{
                background: '#dc2626',
                border: '1px solid #b91c1c',
                borderRadius: '3px',
                width: '26px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ================= Mastercam Subheader Toolbar ================= */}
        <div
          style={{
            height: '34px',
            background: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: '12px',
            fontSize: '12px'
          }}
        >
          <span style={{ color: '#475569', fontWeight: 600 }}>Toolpath:</span>
          <span style={{ color: '#0f5a9e', fontWeight: 700 }}>
            {TOOLPATH_TYPES.find((t) => t.id === formData.badgeClass)?.title || formData.name}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Machine: Haas VF-2 (3-Axis) &bull; WCS: {formData.wcsPlane || 'G54'} &bull; Plane: Top (G17)
          </span>
        </div>

        {/* ================= Main Modal Body (Left Navigation Tree + Right Content) ================= */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Left Tree Page Selector */}
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
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0f5a9e' : '#334155',
                    background: isSelected ? '#e0f2fe' : 'transparent',
                    borderLeft: isSelected ? '3px solid #0f5a9e' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    transition: 'background 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ChevronRight size={13} color={isSelected ? '#0f5a9e' : '#94a3b8'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '9.5px',
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
              padding: '18px 22px',
              overflowY: 'auto'
            }}
          >
            {/* ---------------- 1. TOOLPATH TYPE GALLERY ---------------- */}
            {activeTab === 'toolpath_type' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Select Toolpath Strategy
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Choose the machining strategy for this operation group
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {TOOLPATH_TYPES.map((type) => {
                    const isSel = formData.badgeClass === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => handleFieldChange('badgeClass', type.id)}
                        style={{
                          border: isSel ? '2px solid #0f5a9e' : '1px solid #cbd5e1',
                          background: isSel ? '#f0f9ff' : '#ffffff',
                          borderRadius: '6px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: isSel ? '#0f5a9e' : '#0f172a' }}>
                            {type.title}
                          </span>
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: isSel ? '#0f5a9e' : '#f1f5f9', color: isSel ? '#ffffff' : '#64748b', fontWeight: 600 }}>
                            {type.category}
                          </span>
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                          {type.desc}
                        </span>
                        {isSel && (
                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#0f5a9e', fontSize: '11px', fontWeight: 700 }}>
                            <CheckCircle2 size={13} /> Active Strategy
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- 1.5. MACHINING GEOMETRY & BOUNDARIES PAGE ---------------- */}
            {activeTab === 'geometry' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                      Machining Geometry & Boundaries
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Select drive geometry, machining regions, and fixture avoidance boundaries
                    </span>
                  </div>
                  {onOpenChaining && (
                    <button
                      onClick={onOpenChaining}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Layers size={14} />
                      Chaining Manager...
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* 1. Machining Region Card */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Box size={16} color="#0284c7" />
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          Machining Region (Drive Geometry):
                        </label>
                      </div>
                      <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                        Active Target
                      </span>
                    </div>

                    <select
                      value={formData.machiningRegion}
                      onChange={(e) => handleFieldChange('machiningRegion', e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px', background: '#ffffff', marginBottom: '10px' }}
                    >
                      <option value="Outer boundary of the part (Silhouette)">Outer boundary of the part (Solid Silhouette)</option>
                      <option value="Chain #1 - Exterior Stepped Profile (Closed loop)">Chain #1 - Exterior Stepped Profile (Closed loop)</option>
                      <option value="Chain #2 - Center Triangular Pocket (Closed)">Chain #2 - Center Triangular Pocket (Closed)</option>
                      <option value="All Solid Faces (Automatic 3D Feature Detection)">All Solid Faces (Automatic 3D Feature Detection)</option>
                      <option value="Raw Stock Bounding Perimeter">Raw Stock Bounding Perimeter (Envelope)</option>
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#ffffff', padding: '10px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Machining Strategy (Approach):
                        </label>
                        <select
                          value={formData.machiningStrategy}
                          onChange={(e) => handleFieldChange('machiningStrategy', e.target.value)}
                          style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        >
                          <option value="from_outside">From Outside (Start outside stock - Recommended for Dynamic Roughing)</option>
                          <option value="stay_inside">Stay Inside (Machine enclosed cavity only)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Region Containment:
                        </label>
                        <span style={{ display: 'block', fontSize: '12px', color: '#0f172a', paddingTop: '6px' }}>
                          <strong>145.0 mm &times; 70.0 mm</strong> (Z: 0.0 to -35.0 mm)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Avoidance Region Card */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={16} color="#f59e0b" />
                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          Avoidance Region (Clamps & Fixtures):
                        </label>
                      </div>
                      <span style={{ fontSize: '11px', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                        Collision Protection
                      </span>
                    </div>

                    <select
                      value={formData.avoidanceRegion}
                      onChange={(e) => handleFieldChange('avoidanceRegion', e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px', background: '#ffffff', marginBottom: '10px' }}
                    >
                      <option value="Clamping fixtures & vise jaws (Level 30)">Clamping fixtures & vise jaws (Level 30)</option>
                      <option value="Table Bed & VMC T-Slots (Level 30)">Table Bed & VMC T-Slots (Level 30)</option>
                      <option value="Custom Clamp Wireframe Chain">Custom Clamp Wireframe Chain</option>
                      <option value="None">None (Clear Full Envelope)</option>
                    </select>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#ffffff', padding: '10px', borderRadius: '3px', border: '1px solid #e2e8f0', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Avoidance Clearance Allowance:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formData.avoidanceAllowance ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-' || !isNaN(val)) {
                                handleFieldChange('avoidanceAllowance', val);
                              }
                            }}
                            style={{ width: '100px', padding: '5px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>mm</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>
                        Tool and holder maintain minimum <strong>{formData.avoidanceAllowance || 5.0} mm</strong> safety distance from all fixture jaws and clamps.
                      </div>
                    </div>
                  </div>

                  {/* 3. Air Region Card */}
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Compass size={16} color="#10b981" />
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Air Region (Initial Cutter Entry):
                      </label>
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', background: '#ffffff', padding: '10px', borderRadius: '3px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>
                        Stock Envelope: <strong>Level 20 Raw Stock Block</strong> (Entry vectors approach from air outside raw block)
                      </span>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '11px' }}>
                        &check; Enabled
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 2. TOOL & CUTTING DYNAMICS PAGE ---------------- */}
            {activeTab === 'tool' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                      Tool Selection & Cutting Dynamics
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Select cutting tool and configure spindle speeds and feed rates
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const existingDrill = tools.find((t) => t.type === 'drill' || (t.diameter === 5 && t.type === 'drill'));
                        if (existingDrill) {
                          handleSelectTool(existingDrill.id, existingDrill);
                          return;
                        }
                        const newTool = {
                          id: 7,
                          number: 7,
                          name: '5mm Carbide Twist Drill',
                          type: 'drill',
                          diameter: 5,
                          cornerRad: 0,
                          fluteLength: 35,
                          overallLength: 80,
                          flutes: 2,
                          cuttingSpeedVc: 80,
                          rpm: 5093,
                          feedPerTooth: 0.07,
                          feedRate: 713,
                          plungeRate: 713,
                          coolant: 'Through'
                        };
                        if (onAddTool) onAddTool(newTool);
                        handleSelectTool(newTool.id, newTool);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a',
                        borderRadius: '3px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Add or Select 5mm Carbide Twist Drill"
                    >
                      + Add / Select 5mm Drill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const existing10 = tools.find((t) => (t.diameter === 10 && t.type === 'flat') || t.number === 3);
                        if (existing10) {
                          handleSelectTool(existing10.id, existing10);
                          return;
                        }
                        const newTool = {
                          id: 3,
                          number: 3,
                          name: '10mm 4-Flute Flat Endmill (Finisher)',
                          type: 'flat',
                          diameter: 10,
                          cornerRad: 0,
                          fluteLength: 30,
                          overallLength: 75,
                          flutes: 4,
                          cuttingSpeedVc: 200,
                          rpm: 6000,
                          feedPerTooth: 0.06,
                          feedRate: 1528,
                          plungeRate: 450,
                          coolant: 'Flood'
                        };
                        if (onAddTool) onAddTool(newTool);
                        handleSelectTool(newTool.id, newTool);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        borderRadius: '3px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Add or Select 10mm Flat Endmill"
                    >
                      + Add / Select 10mm Endmill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const existing12 = tools.find((t) => t.diameter === 12 && t.type === 'flat');
                        if (existing12) {
                          handleSelectTool(existing12.id, existing12);
                          return;
                        }
                        const newTool = {
                          id: 2,
                          number: 2,
                          name: '12mm Flat Endmill (Carbide Rougher)',
                          type: 'flat',
                          diameter: 12,
                          cornerRad: 0,
                          fluteLength: 28,
                          overallLength: 75,
                          flutes: 3,
                          cuttingSpeedVc: 220,
                          rpm: 5500,
                          feedPerTooth: 0.08,
                          feedRate: 1800,
                          plungeRate: 450,
                          coolant: 'Flood'
                        };
                        if (onAddTool) onAddTool(newTool);
                        handleSelectTool(newTool.id, newTool);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        borderRadius: '3px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Add or Select 12mm Flat Endmill"
                    >
                      + Add / Select 12mm Endmill
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const existing50 = tools.find((t) => t.diameter === 50 && t.type === 'face');
                        if (existing50) {
                          handleSelectTool(existing50.id, existing50);
                          return;
                        }
                        const newTool = {
                          id: 1,
                          number: 1,
                          name: '50mm Face Mill (Shell Mill)',
                          type: 'face',
                          diameter: 50,
                          cornerRad: 0,
                          fluteLength: 25,
                          overallLength: 75,
                          flutes: 5,
                          cuttingSpeedVc: 399,
                          rpm: 3500,
                          feedPerTooth: 0.09,
                          feedRate: 1200,
                          plungeRate: 350,
                          coolant: 'Flood'
                        };
                        if (onAddTool) onAddTool(newTool);
                        handleSelectTool(newTool.id, newTool);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        padding: '5px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Add or Select 50mm Face Mill"
                    >
                      + Add / Select 50mm Face Mill
                    </button>
                  </div>
                </div>

                {/* Tool List Table */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>Tool #</th>
                        <th style={{ padding: '6px 10px' }}>Tool Name</th>
                        <th style={{ padding: '6px 10px' }}>Type</th>
                        <th style={{ padding: '6px 10px' }}>Diameter</th>
                        <th style={{ padding: '6px 10px' }}>Corner Rad</th>
                        <th style={{ padding: '6px 10px' }}>Flutes</th>
                        <th style={{ padding: '6px 10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((t) => {
                        const isSel = formData.toolId === t.id;
                        return (
                          <tr
                            key={t.id}
                            onClick={() => handleSelectTool(t.id)}
                            style={{
                              background: isSel ? '#e0f2fe' : '#ffffff',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer'
                            }}
                          >
                            <td style={{ padding: '6px 10px', fontWeight: isSel ? 700 : 500 }}>T{t.number}</td>
                            <td style={{ padding: '6px 10px', color: isSel ? '#0369a1' : '#1e293b', fontWeight: isSel ? 700 : 400 }}>{t.name}</td>
                            <td style={{ padding: '6px 10px' }}>{t.type}</td>
                            <td style={{ padding: '6px 10px' }}>{t.diameter} mm</td>
                            <td style={{ padding: '6px 10px' }}>{t.cornerRad || 0} mm</td>
                            <td style={{ padding: '6px 10px' }}>{t.flutes || 4}</td>
                            <td style={{ padding: '6px 10px' }}>
                              {isSel ? (
                                <span style={{ color: '#0f5a9e', fontWeight: 700, fontSize: '11px' }}>
                                  ✓ ACTIVE
                                </span>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>Select</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Live Editable Feeds & Speeds Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Spindle Speed (RPM):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.spindleSpeed ?? ''}
                      onChange={(e) => handleRpmChange(e.target.value)}
                      onBlur={() => {
                        if (formData.spindleSpeed === '' || formData.spindleSpeed === '-') {
                          handleRpmChange(3500);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #0f5a9e',
                        borderRadius: '3px',
                        background: '#ffffff',
                        fontWeight: 700,
                        color: '#0f5a9e'
                      }}
                    />
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      Surface Speed: <strong>{formData.surfaceSpeed || 110} m/min</strong>
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Feed Rate (mm/min):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.feedRate ?? ''}
                      onChange={(e) => handleFeedRateChange(e.target.value)}
                      onBlur={() => {
                        if (formData.feedRate === '' || formData.feedRate === '-') {
                          handleFeedRateChange(1200);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #0f5a9e',
                        borderRadius: '3px',
                        background: '#ffffff',
                        fontWeight: 700,
                        color: '#0f5a9e'
                      }}
                    />
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      Feed / Tooth (FPT): <strong>{formData.feedPerTooth || 0.05} mm/th</strong>
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Plunge Feed Rate (mm/min):
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.plungeFeedRate ?? ''}
                      onChange={(e) => handleFieldChange('plungeFeedRate', e.target.value)}
                      onBlur={() => {
                        if (formData.plungeFeedRate === '' || formData.plungeFeedRate === '-') {
                          handleFieldChange('plungeFeedRate', 400);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Coolant Mode:
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
                      <option value="Mist">Mist (M07)</option>
                      <option value="Through">Through Spindle / TSC (M88)</option>
                      <option value="Air">Air Blast (M12)</option>
                      <option value="Off">Off (M09)</option>
                    </select>
                  </div>
                </div>

                {/* Operation G-Code Comment Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Operation Comment (Output into NC Code):
                  </label>
                  <input
                    type="text"
                    value={formData.comment || ''}
                    onChange={(e) => handleFieldChange('comment', e.target.value)}
                    placeholder="e.g. T1 - 10MM ENDMILL - 2D FACE"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12.5px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            )}

            {/* ---------------- 3. TOOL HOLDER & STICKOUT ---------------- */}
            {activeTab === 'holder' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Tool Holder Definition & Gauge Length
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Configure tool holder geometry to avoid spindle shank gouges during 3D simulation
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Holder Library Profile:
                      </label>
                      <select
                        value={formData.holderType}
                        onChange={(e) => handleFieldChange('holderType', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="CAT40_ER32">CAT40 ER32 Precision Collet Chuck</option>
                        <option value="BT40_MILLING">BT40 High-Grip Milling Chuck</option>
                        <option value="HSK63A_SHRINK">HSK-63A Precision Shrink Fit</option>
                        <option value="BT30_COLLET">BT30 Compact Collet Holder</option>
                      </select>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Tool Stickout Length (L1):
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.stickoutLength ?? ''}
                          onChange={(e) => handleFieldChange('stickoutLength', e.target.value)}
                          onBlur={() => {
                            if (!formData.stickoutLength) handleFieldChange('stickoutLength', 35);
                          }}
                          style={{ width: '140px', padding: '6px 10px', fontSize: '13px', border: '1px solid #0f5a9e', borderRadius: '3px', fontWeight: 700 }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>mm protruding from holder</span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Gauge Length (L2):
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.gaugeLength ?? ''}
                          onChange={(e) => handleFieldChange('gaugeLength', e.target.value)}
                          onBlur={() => {
                            if (!formData.gaugeLength) handleFieldChange('gaugeLength', 65);
                          }}
                          style={{ width: '140px', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>mm from spindle face</span>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Holder Diameter (D1):
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.holderDiameter ?? ''}
                          onChange={(e) => handleFieldChange('holderDiameter', e.target.value)}
                          onBlur={() => {
                            if (!formData.holderDiameter) handleFieldChange('holderDiameter', 50);
                          }}
                          style={{ width: '140px', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>mm outer collar width</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual SVG Silhouette Preview */}
                  <div style={{ background: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                      Holder Assembly Profile
                    </span>
                    <svg width="180" height="230" viewBox="0 0 180 230">
                      {/* Spindle Face */}
                      <rect x="30" y="10" width="120" height="20" fill="#475569" rx="2" />
                      <text x="90" y="24" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">SPINDLE FACE</text>
                      
                      {/* Holder Body */}
                      <path d="M 45 30 L 135 30 L 125 70 L 115 110 L 65 110 L 55 70 Z" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
                      
                      {/* Collet Nut */}
                      <rect x="68" y="110" width="44" height="25" fill="#64748b" stroke="#1e293b" strokeWidth="1" rx="2" />
                      <text x="90" y="126" fill="#ffffff" fontSize="8" textAnchor="middle">{formData.holderType?.split('_')[0] || 'CAT40'}</text>
                      
                      {/* Cutting Tool Endmill */}
                      <rect x="85" y="135" width="10" height="65" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                      <text x="90" y="180" fill="#ffffff" fontSize="8" textAnchor="middle" transform="rotate(-90 90 180)">CUTTER</text>

                      {/* Dimension L1 Stickout */}
                      <line x1="110" y1="135" x2="135" y2="135" stroke="#0f5a9e" strokeWidth="1" strokeDasharray="2,2" />
                      <line x1="110" y1="200" x2="135" y2="200" stroke="#0f5a9e" strokeWidth="1" strokeDasharray="2,2" />
                      <line x1="130" y1="135" x2="130" y2="200" stroke="#0f5a9e" strokeWidth="1.5" />
                      <text x="135" y="170" fill="#0f5a9e" fontSize="9" fontWeight="bold">L1: {formData.stickoutLength}mm</text>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 4. CUT PARAMETERS ---------------- */}
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

                {/* Drill or Tap Cycles */}
                {(formData.badgeClass === 'drill' || formData.badgeClass === 'spotdrill' || formData.badgeClass === 'tap') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Cycle Type:
                      </label>
                      <select
                        value={formData.drillCycleType}
                        onChange={(e) => handleFieldChange('drillCycleType', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="G81">Drill / Spot (G81 - Direct Plunge)</option>
                        <option value="G83">Peck Drill (G83 - Full Retract for Deep Holes)</option>
                        <option value="G73">Chip Break (G73 - High Speed Incremental Peck)</option>
                        <option value="G84">Rigid Tap (G84 - Synchronized Spindle/Feed)</option>
                      </select>
                    </div>

                    {formData.drillCycleType === 'G83' && (
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Peck Increment (Q):
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.peckDepth ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '-' || !isNaN(val)) {
                              handleFieldChange('peckDepth', val);
                            }
                          }}
                          onBlur={() => {
                            if (!formData.peckDepth) handleFieldChange('peckDepth', 2.0);
                          }}
                          style={{ width: '140px', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>mm per peck</span>
                      </div>
                    )}

                    {formData.drillCycleType === 'G84' && (
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Thread Pitch (F):
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.pitch ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '-' || !isNaN(val)) {
                              handleFieldChange('pitch', val);
                            }
                          }}
                          onBlur={() => {
                            if (!formData.pitch) handleFieldChange('pitch', 0.79375);
                          }}
                          style={{ width: '140px', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
                          mm / pitch (e.g. 0.79375 for 10-32 UNF / 32 TPI)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Milling Cut Parameters */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* 1. Style / Pattern & Stepover Controls for Face Milling, Pocket, Dynamic */}
                    {/* 1. Style / Pattern & Stepover Controls for Face Milling, Pocket, Dynamic, Adaptive */}
                    {(formData.badgeClass === 'face' || formData.badgeClass === 'pocket' || formData.badgeClass === 'dynamic' || formData.badgeClass === 'adaptive' || formData.badgeClass === 'rest' || formData.badgeClass === 'contour') && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {/* Style / Pattern */}
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                            {formData.badgeClass === 'face' ? 'Style (Cutting Pattern):' : 'Cutting Method:'}
                          </label>
                          <select
                            value={formData.cutStyle || (formData.badgeClass === 'face' ? 'zigzag' : (formData.badgeClass === 'adaptive' || formData.badgeClass === 'dynamic') ? 'dynamic' : 'constant_overlap')}
                            onChange={(e) => handleFieldChange('cutStyle', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          >
                            {formData.badgeClass === 'face' ? (
                              <>
                                <option value="zigzag">Zigzag (Bi-directional Face Milling)</option>
                                <option value="one_way">One Way (Climb Milling Across Face)</option>
                                <option value="one_pass">One Pass (Single Center Pass)</option>
                                <option value="dynamic">Dynamic (High Speed Trochoidal Face)</option>
                              </>
                            ) : (formData.badgeClass === 'adaptive' || formData.badgeClass === 'dynamic') ? (
                              <>
                                <option value="dynamic">Dynamic High Speed (Trochoidal HSM)</option>
                                <option value="constant_overlap">Constant Overlap Spiral</option>
                                <option value="parallel_spiral">Parallel Spiral</option>
                                <option value="morph_spiral">Morph Spiral</option>
                                <option value="zigzag">Zigzag</option>
                              </>
                            ) : (
                              <>
                                <option value="constant_overlap">Constant Overlap Spiral</option>
                                <option value="parallel_spiral">Parallel Spiral</option>
                                <option value="morph_spiral">Morph Spiral</option>
                                <option value="zigzag">Zigzag</option>
                                <option value="dynamic">Dynamic High Speed</option>
                              </>
                            )}
                          </select>
                        </div>

                        {/* Stepover % and Stepover Distance */}
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                              Stepover Percentage:
                            </label>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Distance: <strong style={{ color: '#0f5a9e' }}>{((toolDiam * (parseFloat(formData.stepoverPct) || (formData.badgeClass === 'face' ? 70 : (formData.badgeClass === 'adaptive' || formData.badgeClass === 'dynamic') ? 25 : 45))) / 100).toFixed(1)} mm</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.stepoverPct ?? (formData.badgeClass === 'face' ? 70 : (formData.badgeClass === 'adaptive' || formData.badgeClass === 'dynamic') ? 25 : 45)}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '-' || !isNaN(val)) {
                                  handleFieldChange('stepoverPct', val);
                                }
                              }}
                              onBlur={() => {
                                if (!formData.stepoverPct) handleFieldChange('stepoverPct', formData.badgeClass === 'face' ? 70 : (formData.badgeClass === 'adaptive' || formData.badgeClass === 'dynamic') ? 25 : 45);
                              }}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>%</span>
                          </div>

                          {/* Quick Stepover Presets */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleFieldChange('stepoverPct', 25)}
                              style={{
                                padding: '2px 7px',
                                fontSize: '10.5px',
                                background: Number(formData.stepoverPct) === 25 ? '#0284c7' : '#ffffff',
                                color: Number(formData.stepoverPct) === 25 ? '#ffffff' : '#0369a1',
                                border: '1px solid #bae6fd',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              title="Set 25% stepover (recommended for Dynamic HSM milling)"
                            >
                              25% (Dynamic HSM)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFieldChange('stepoverPct', 45)}
                              style={{
                                padding: '2px 7px',
                                fontSize: '10.5px',
                                background: Number(formData.stepoverPct) === 45 ? '#0284c7' : '#ffffff',
                                color: Number(formData.stepoverPct) === 45 ? '#ffffff' : '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                              title="Set 45% stepover (standard pocketing)"
                            >
                              45%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFieldChange('stepoverPct', 70)}
                              style={{
                                padding: '2px 7px',
                                fontSize: '10.5px',
                                background: Number(formData.stepoverPct) === 70 ? '#0284c7' : '#ffffff',
                                color: Number(formData.stepoverPct) === 70 ? '#ffffff' : '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                              title="Set 70% stepover (face milling)"
                            >
                              70%
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Auto Cut Angle for Face Milling */}
                    {formData.badgeClass === 'face' && (
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'center' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                            Auto Cut Angle (Degrees):
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={formData.cutAngle ?? 0}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '-' || !isNaN(val)) {
                                  handleFieldChange('cutAngle', val);
                                }
                              }}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>&deg;</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                          &bull; <strong>0&deg;</strong>: Toolpath traverses along X axis (Standard)<br />
                          &bull; <strong>90&deg;</strong>: Toolpath traverses across Y axis
                        </div>
                      </div>
                    )}

                    {/* 3. Compensation & Direction */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Compensation Type:
                        </label>
                        <select
                          value={formData.compensationType}
                          onChange={(e) => handleFieldChange('compensationType', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        >
                          <option value="computer">Computer (Calculated by Mastercam)</option>
                          <option value="control">Control (Outputs G41/G42)</option>
                          <option value="wear">Wear (Tool Wear Offsets)</option>
                          <option value="off">Off (Centerline Toolpath)</option>
                        </select>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Cutting Direction:
                        </label>
                        <select
                          value={formData.cuttingDirection}
                          onChange={(e) => handleFieldChange('cuttingDirection', e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        >
                          <option value="climb">Climb Milling (Recommended for CNC)</option>
                          <option value="conventional">Conventional Milling</option>
                        </select>
                      </div>
                    </div>

                    {/* Stock to Leave XY and Z */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#f8fafc', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Stock to Leave on Walls (XY):
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.stockToLeaveXY ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '-' || !isNaN(val)) {
                              handleFieldChange('stockToLeaveXY', val);
                            }
                          }}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                          Stock to Leave on Floors (Z):
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.stockToLeaveZ ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '-' || !isNaN(val)) {
                              handleFieldChange('stockToLeaveZ', val);
                            }
                          }}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- 5. DEPTH CUTS ---------------- */}
            {activeTab === 'depth_cuts' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Depth Cuts (Z Stepdown)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Control roughing depth increments and finish pass spring cuts
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.depthCutsEnabled}
                      onChange={(e) => handleFieldChange('depthCutsEnabled', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#0f5a9e' }}
                    />
                    Enable Depth Cuts
                  </label>

                  {formData.depthCutsEnabled && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                            Max Rough Step (mm):
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={formData.stepdown ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || val === '-' || !isNaN(val)) {
                                handleFieldChange('stepdown', val);
                              }
                            }}
                            onBlur={() => {
                              if (!formData.stepdown) handleFieldChange('stepdown', 2.5);
                            }}
                            style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #0f5a9e', borderRadius: '3px', fontWeight: 700 }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                            Number of Finish Cuts:
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formData.finishCutsCount ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || !isNaN(val)) {
                                handleFieldChange('finishCutsCount', val);
                              }
                            }}
                            onBlur={() => {
                              if (formData.finishCutsCount === '') handleFieldChange('finishCutsCount', 1);
                            }}
                            style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#1e293b', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.keepToolDown}
                            onChange={(e) => handleFieldChange('keepToolDown', e.target.checked)}
                            style={{ width: '15px', height: '15px', accentColor: '#0f5a9e' }}
                          />
                          <strong>Keep Tool Down</strong> (avoids rapid retract to clearance between depth steps)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- 6. LINKING PARAMETERS (WITH MASTER GRAPHIC) ---------------- */}
            {activeTab === 'linking' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Linking Parameters (Z-Levels)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Absolute and incremental reference heights for tool entry, cutting, and clearance
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  {/* Parameter Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Clearance */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <span style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        Clearance:
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.rapidHeight ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('rapidHeight', val);
                          }
                        }}
                        style={{ width: '75px', padding: '3px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="clrMode" checked={formData.clearanceMode === 'absolute'} onChange={() => handleFieldChange('clearanceMode', 'absolute')} />
                          Abs
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="clrMode" checked={formData.clearanceMode === 'incremental'} onChange={() => handleFieldChange('clearanceMode', 'incremental')} />
                          Inc
                        </label>
                      </div>
                    </div>

                    {/* Retract */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <span style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        Retract:
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.retractHeight ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('retractHeight', val);
                          }
                        }}
                        style={{ width: '75px', padding: '3px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="retMode" checked={formData.retractMode === 'absolute'} onChange={() => handleFieldChange('retractMode', 'absolute')} />
                          Abs
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="retMode" checked={formData.retractMode === 'incremental'} onChange={() => handleFieldChange('retractMode', 'incremental')} />
                          Inc
                        </label>
                      </div>
                    </div>

                    {/* Feed Plane */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <span style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        Feed Plane:
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.feedPlane ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('feedPlane', val);
                          }
                        }}
                        style={{ width: '75px', padding: '3px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="fpMode" checked={formData.feedPlaneMode === 'absolute'} onChange={() => handleFieldChange('feedPlaneMode', 'absolute')} />
                          Abs
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="fpMode" checked={formData.feedPlaneMode === 'incremental'} onChange={() => handleFieldChange('feedPlaneMode', 'incremental')} />
                          Inc
                        </label>
                      </div>
                    </div>

                    {/* Top of Stock */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                      <span style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        Top of Stock:
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.topOfStock ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('topOfStock', val);
                          }
                        }}
                        style={{ width: '75px', padding: '3px 6px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                      <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="tosMode" checked={formData.topOfStockMode === 'absolute'} onChange={() => handleFieldChange('topOfStockMode', 'absolute')} />
                          Abs
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input type="radio" name="tosMode" checked={formData.topOfStockMode === 'incremental'} onChange={() => handleFieldChange('topOfStockMode', 'incremental')} />
                          Inc
                        </label>
                      </div>
                    </div>

                    {/* Depth */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 10px', background: '#f0fdf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '110px', fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                          Depth:
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.totalDepth ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || val === '-' || !isNaN(val)) {
                              handleFieldChange('totalDepth', val);
                            }
                          }}
                          placeholder="-35.0"
                          style={{ width: '75px', padding: '4px 6px', fontSize: '12.5px', border: '1px solid #86efac', borderRadius: '3px', fontWeight: 700, background: '#ffffff', color: '#15803d' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', fontSize: '11.5px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                            <input type="radio" name="dMode" checked={formData.depthMode === 'absolute'} onChange={() => handleFieldChange('depthMode', 'absolute')} />
                            Abs
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                            <input type="radio" name="dMode" checked={formData.depthMode === 'incremental'} onChange={() => handleFieldChange('depthMode', 'incremental')} />
                            Inc
                          </label>
                        </div>
                      </div>

                      {/* Depth Quick Presets (Pocket Bottom / Stock Floor) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '122px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('totalDepth', -35.0)}
                          style={{
                            padding: '2px 7px',
                            fontSize: '11px',
                            background: '#dcfce7',
                            border: '1px solid #86efac',
                            borderRadius: '3px',
                            color: '#15803d',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                          title="Set depth to pocket bottom (-35.0 mm)"
                        >
                          &bull; Pocket Bottom (-35.0 mm)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('totalDepth', -50.8)}
                          style={{
                            padding: '2px 7px',
                            fontSize: '11px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          title="Set depth to stock floor (-50.8 mm)"
                        >
                          Floor (-50.8 mm)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFieldChange('totalDepth', 0)}
                          style={{
                            padding: '2px 7px',
                            fontSize: '11px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 500
                          }}
                          title="Set depth to top face (0 mm)"
                        >
                          Top (0 mm)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mastercam Visual Z-Diagram */}
                  <div style={{ background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      Mastercam Z-Plane Scheme
                    </span>
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      {/* Clearance Plane */}
                      <line x1="20" y1="20" x2="180" y2="20" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" />
                      <text x="185" y="24" fill="#b45309" fontSize="9" fontWeight="bold">CLR</text>

                      {/* Retract Plane */}
                      <line x1="20" y1="60" x2="180" y2="60" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
                      <text x="185" y="64" fill="#0284c7" fontSize="9" fontWeight="bold">RET</text>

                      {/* Feed Plane */}
                      <line x1="20" y1="90" x2="180" y2="90" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2,2" />
                      <text x="185" y="94" fill="#10b981" fontSize="9" fontWeight="bold">FEED</text>

                      {/* Top of Stock */}
                      <line x1="20" y1="120" x2="180" y2="120" stroke="#78350f" strokeWidth="2" />
                      <text x="185" y="124" fill="#78350f" fontSize="9" fontWeight="bold">STOCK</text>

                      {/* Stock Block Graphic */}
                      <rect x="40" y="120" width="120" height="50" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" opacity="0.6" />

                      {/* Depth Plane */}
                      <line x1="20" y1="170" x2="180" y2="170" stroke="#15803d" strokeWidth="2.5" />
                      <text x="185" y="174" fill="#15803d" fontSize="9" fontWeight="bold">DEPTH</text>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 7. PLANES (WCS) ---------------- */}
            {activeTab === 'planes' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Coordinate Systems & Work Planes
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Select Work Coordinate System (WCS), Tool Plane (Tplane), and Construction Plane (Cplane)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        WCS (Work Coordinate System):
                      </label>
                      <select
                        value={formData.wcsPlane}
                        onChange={(e) => handleFieldChange('wcsPlane', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="Top (G54)">Top (G54 - Fixture Offset 0)</option>
                        <option value="Front (G55)">Front (G55 - Fixture Offset 1)</option>
                        <option value="Right (G56)">Right (G56 - Fixture Offset 2)</option>
                        <option value="ISO (G57)">Isometric (G57)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Tool Plane (Tplane):
                      </label>
                      <select
                        value={formData.toolPlane}
                        onChange={(e) => handleFieldChange('toolPlane', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="Top (G17)">Top (G17 - Standard Vertical Milling)</option>
                        <option value="Front (G18)">Front (G18 - ZX Plane)</option>
                        <option value="Right (G19)">Right (G19 - YZ Plane)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Construction Plane (Cplane):
                      </label>
                      <select
                        value={formData.constructionPlane}
                        onChange={(e) => handleFieldChange('constructionPlane', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="Top (G17)">Top (G17)</option>
                        <option value="Front (G18)">Front (G18)</option>
                        <option value="Right (G19)">Right (G19)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Active G-Code Output:
                    </div>
                    <div>&bull; Work Offset: <strong>G54</strong> (X0 Y0 Z0 set on stock top-left)</div>
                    <div>&bull; Arc Interpolation Plane: <strong>G17 (XY)</strong></div>
                    <div>&bull; Spindle Axis Vector: <strong>(0, 0, 1)</strong> Vertical Z</div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 8. COOLANT ---------------- */}
            {activeTab === 'coolant' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Coolant & Chip Evacuation Control
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Select coolant pressure, delivery method, and trigger timing
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Primary Coolant Delivery:
                      </label>
                      <select
                        value={formData.coolant}
                        onChange={(e) => handleFieldChange('coolant', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="Flood">Flood (M08)</option>
                        <option value="Mist">Mist Coolant (M07)</option>
                        <option value="Through">Through Spindle / High Pressure (M88)</option>
                        <option value="Air">Air Blast (M12)</option>
                        <option value="Off">Off (M09)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Activation Timing:
                      </label>
                      <select
                        value={formData.coolantTiming}
                        onChange={(e) => handleFieldChange('coolantTiming', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      >
                        <option value="With">With Spindle Start (M03 / M08 on same block)</option>
                        <option value="Before">Before Motion (M08 before plunge)</option>
                        <option value="After">After Rapid Approach</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Status:
                    </div>
                    <div>Coolant command <strong>{formData.coolant === 'Through' ? 'M88' : formData.coolant === 'Air' ? 'M12' : formData.coolant === 'Off' ? 'M09' : 'M08'}</strong> will be inserted automatically into post-processed NC output.</div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 9. LEAD IN / LEAD OUT ---------------- */}
            {activeTab === 'lead_in_out' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Lead In / Out (Tangent Entry & Exit)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Arc and line entry motions to prevent tool witness marks on workpiece finish walls
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>Entry Motion:</div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569' }}>Line Length (mm):</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.leadInLineLen ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('leadInLineLen', val);
                          }
                        }}
                        onBlur={() => {
                          if (!formData.leadInLineLen) handleFieldChange('leadInLineLen', 5);
                        }}
                        style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569' }}>Arc Radius (mm):</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.leadInArcRad ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('leadInArcRad', val);
                          }
                        }}
                        onBlur={() => {
                          if (!formData.leadInArcRad) handleFieldChange('leadInArcRad', 5);
                        }}
                        style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#475569' }}>Sweep Angle (&deg;):</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.leadInSweepDeg ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('leadInSweepDeg', val);
                          }
                        }}
                        onBlur={() => {
                          if (!formData.leadInSweepDeg) handleFieldChange('leadInSweepDeg', 90);
                        }}
                        style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>Exit Motion:</div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                      Symmetrical Exit Motion enabled. Exit tangency will mirror the entry arc radius ({formData.leadInArcRad}mm) and line length ({formData.leadInLineLen}mm) to smoothly step off finished walls.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- 10. BREAK THROUGH ---------------- */}
            {activeTab === 'break_through' && (
              <div>
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                    Break Through (Tool Tip Overcut)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Extend final depth past stock floor to clear drill points or endmill chamfer rads
                  </span>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.breakThroughEnabled}
                      onChange={(e) => handleFieldChange('breakThroughEnabled', e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#0f5a9e' }}
                    />
                    Enable Break Through
                  </label>

                  {formData.breakThroughEnabled && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                        Break Through Amount (mm):
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.breakThroughAmount ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '-' || !isNaN(val)) {
                            handleFieldChange('breakThroughAmount', val);
                          }
                        }}
                        onBlur={() => {
                          if (!formData.breakThroughAmount) handleFieldChange('breakThroughAmount', 1.0);
                        }}
                        style={{ width: '140px', padding: '6px 10px', fontSize: '13px', border: '1px solid #0f5a9e', borderRadius: '3px', fontWeight: 700 }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>
                        mm past programmed Z depth
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= Authentic Mastercam Status Footer ================= */}
        <div
          style={{
            height: '32px',
            background: '#f1f5f9',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Active Tool: <strong style={{ color: '#0f5a9e' }}>T{currentTool.number} &bull; {currentTool.name}</strong></span>
            <span>&bull;</span>
            <span>RPM: <strong style={{ color: '#0f5a9e' }}>{formData.spindleSpeed}</strong></span>
            <span>&bull;</span>
            <span>Feed: <strong style={{ color: '#0f5a9e' }}>{formData.feedRate} mm/min</strong></span>
            <span>&bull;</span>
            <span>Coolant: <strong style={{ color: '#16a34a' }}>{formData.coolant}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
            <span>Press <kbd style={{ padding: '1px 4px', background: '#e2e8f0', borderRadius: '2px', border: '1px solid #cbd5e1', fontSize: '10px' }}>Enter</kbd> to Save & Regenerate</span>
          </div>
        </div>
      </div>
    </div>
  );
}

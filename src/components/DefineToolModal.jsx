import React, { useState, useMemo } from 'react';
import { X, Calculator, ChevronUp, ChevronDown, Plus, HelpCircle } from 'lucide-react';
import {
  resolveMachineToolpathCapabilities,
  computeSurfaceSpeedCs,
  computeRpmFromCs,
  computeFeedPerTooth,
  computeFeedFromFpt,
  reinitializeFeedsSpeeds
} from '../config/surfaceFinishSchema';

const MILLING_TOOLS = [
  { id: 'end_mill', label: 'End Mill', internalType: 'flat', defaultCR: 0, defaultFlutes: 4, suffix: 'Flat Endmill' },
  { id: 'bull_mill', label: 'Bull Mill', internalType: 'bull', defaultCR: 2.0, defaultFlutes: 4, suffix: 'Bull Endmill' },
  { id: 'ball_mill', label: 'Ball Mill', internalType: 'ball', defaultCR: 5.0, defaultFlutes: 2, suffix: 'Ball Endmill' },
  { id: 'face_mill', label: 'Face Mill', internalType: 'face', defaultCR: 0.4, defaultFlutes: 6, suffix: 'Face Mill' },
  { id: 'radius_mill', label: 'Radius Mill', internalType: 'radius', defaultCR: 3.0, defaultFlutes: 4, suffix: 'Radius Mill' },
  { id: 'chamfer_mill', label: 'Chamfer Mill', internalType: 'chamfer', defaultCR: 0, defaultFlutes: 2, suffix: 'Chamfer Mill' },
  { id: 'slot_mill', label: 'Slot Mill', internalType: 'slot', defaultCR: 0, defaultFlutes: 4, suffix: 'Slot Mill' },
  { id: 'taper_mill', label: 'Taper Mill', internalType: 'taper', defaultCR: 0.5, defaultFlutes: 3, suffix: 'Taper Mill' },
  { id: 'dove_mill', label: 'Dove Mill', internalType: 'dove', defaultCR: 0, defaultFlutes: 4, suffix: 'Dovetail Mill' },
  { id: 'lollipop_mill', label: 'Lollipop Mill', internalType: 'lollipop', defaultCR: 5.0, defaultFlutes: 4, suffix: 'Lollipop Mill' },
  { id: 'engrave_tool', label: 'Engrave Tool', internalType: 'engrave', defaultCR: 0.1, defaultFlutes: 1, suffix: 'Engrave Tool' },
  { id: 'thread_mill', label: 'Thread Mill', internalType: 'thread', defaultCR: 0, defaultFlutes: 3, suffix: 'Thread Mill' },
  { id: 'barrel_mill', label: 'Barrel Mill', internalType: 'barrel', defaultCR: 25.0, defaultFlutes: 4, suffix: 'Barrel Mill' },
  { id: 'high_feed_mill', label: 'High Feed Mill', internalType: 'high_feed', defaultCR: 1.5, defaultFlutes: 4, suffix: 'High Feed Mill' },
  { id: 'custom_tool', label: 'Custom Tool', internalType: 'custom', defaultCR: 0, defaultFlutes: 2, suffix: 'Custom Tool' }
];

const HOLEMAKING_TOOLS = [
  { id: 'drill', label: 'Drill', internalType: 'drill', defaultCR: 0, defaultFlutes: 2, suffix: 'Jobber Drill' },
  { id: 'spot_drill', label: 'Spot Drill', internalType: 'spot_drill', defaultCR: 0, defaultFlutes: 2, suffix: 'Spot Drill' },
  { id: 'center_drill', label: 'Center Drill', internalType: 'center_drill', defaultCR: 0, defaultFlutes: 2, suffix: 'Center Drill' },
  { id: 'reamer', label: 'Reamer', internalType: 'reamer', defaultCR: 0, defaultFlutes: 6, suffix: 'Chucking Reamer' },
  { id: 'boring_bar', label: 'Boring Bar', internalType: 'boring_bar', defaultCR: 0.4, defaultFlutes: 1, suffix: 'Boring Bar' },
  { id: 'tap_right', label: 'Tap Right', internalType: 'tap_right', defaultCR: 0, defaultFlutes: 3, suffix: 'RH Tap' },
  { id: 'tap_left', label: 'Tap Left', internalType: 'tap_left', defaultCR: 0, defaultFlutes: 3, suffix: 'LH Tap' },
  { id: 'counterbore', label: 'Counterbore', internalType: 'counterbore', defaultCR: 0, defaultFlutes: 4, suffix: 'Counterbore' },
  { id: 'countersink', label: 'Countersink', internalType: 'countersink', defaultCR: 0, defaultFlutes: 3, suffix: 'Countersink' }
];

const TURNING_TOOLS = [
  { id: 'od_rough_cnmg', label: 'OD Rough (CNMG 80°)', internalType: 'turning_rough', defaultCR: 0.8, defaultFlutes: 1, suffix: 'OD Rough CNMG' },
  { id: 'od_finish_vnmg', label: 'OD Finish (VNMG 35°)', internalType: 'turning_finish', defaultCR: 0.4, defaultFlutes: 1, suffix: 'OD Finish VNMG' },
  { id: 'od_groove', label: 'OD Groove / Parting', internalType: 'turning_groove', defaultCR: 0.2, defaultFlutes: 1, suffix: 'OD Groove' }
];

const ALL_TOOL_ITEMS = [...MILLING_TOOLS, ...HOLEMAKING_TOOLS, ...TURNING_TOOLS];

/**
 * Renders distinct Mastercam-style 2D metallic silhouette icons for every cutter type.
 */
function ToolTypeIconSvg({ toolId, selected }) {
  const accent = selected ? '#0284c7' : '#334155';
  const bodyFill = '#94a3b8';
  const fluteHighlight = '#cbd5e1';

  if (toolId === 'custom_tool') {
    return (
      <div style={{ width: '28px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#64748b', lineHeight: 1 }}>?</span>
      </div>
    );
  }

  return (
    <svg width="28" height="32" viewBox="0 0 28 32" style={{ flexShrink: 0 }}>
      {/* Upper Shank */}
      <rect x="10" y="2" width="8" height="10" fill={bodyFill} stroke="#475569" strokeWidth="0.8" />
      <line x1="12" y1="2" x2="12" y2="12" stroke={fluteHighlight} strokeWidth="1" />

      {toolId === 'end_mill' && (
        <>
          <rect x="9" y="12" width="10" height="17" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M9,16 L19,19 M9,22 L19,25 M9,27 L15,29" stroke={fluteHighlight} strokeWidth="1.2" />
        </>
      )}
      {toolId === 'bull_mill' && (
        <>
          <path d="M9,12 H19 V26 Q19,29 16,29 H12 Q9,29 9,26 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M9,16 L19,19 M9,22 L19,25" stroke={fluteHighlight} strokeWidth="1.2" />
        </>
      )}
      {toolId === 'ball_mill' && (
        <>
          <path d="M9,12 H19 V24 A5,5 0 0,1 9,24 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M9,16 L19,19 M9,21 L18,24" stroke={fluteHighlight} strokeWidth="1.2" />
        </>
      )}
      {toolId === 'face_mill' && (
        <>
          <rect x="11" y="12" width="6" height="4" fill="#64748b" stroke="#1e293b" strokeWidth="0.8" />
          <path d="M3,16 H25 L26,24 H2 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <rect x="3" y="21" width="4" height="4" fill="#f59e0b" stroke="#1e293b" strokeWidth="0.6" />
          <rect x="21" y="21" width="4" height="4" fill="#f59e0b" stroke="#1e293b" strokeWidth="0.6" />
        </>
      )}
      {toolId === 'radius_mill' && (
        <>
          <path d="M7,12 H21 V22 Q18,22 18,26 V29 H10 V26 Q10,22 7,22 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
        </>
      )}
      {toolId === 'chamfer_mill' && (
        <>
          <path d="M9,12 H19 V20 L14,29 L9,20 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <line x1="14" y1="12" x2="14" y2="29" stroke={fluteHighlight} strokeWidth="1" />
        </>
      )}
      {toolId === 'slot_mill' && (
        <>
          <rect x="12" y="12" width="4" height="8" fill={bodyFill} stroke="#1e293b" strokeWidth="0.8" />
          <rect x="4" y="20" width="20" height="6" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <line x1="8" y1="20" x2="8" y2="26" stroke={fluteHighlight} strokeWidth="1.2" />
          <line x1="20" y1="20" x2="20" y2="26" stroke={fluteHighlight} strokeWidth="1.2" />
        </>
      )}
      {toolId === 'taper_mill' && (
        <>
          <path d="M8,12 H20 L16,29 H12 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M9,16 L19,19 M10,22 L18,24" stroke={fluteHighlight} strokeWidth="1" />
        </>
      )}
      {toolId === 'dove_mill' && (
        <>
          <rect x="12" y="12" width="4" height="9" fill={bodyFill} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M9,21 H19 L22,29 H6 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
        </>
      )}
      {toolId === 'lollipop_mill' && (
        <>
          <rect x="12" y="12" width="4" height="7" fill={bodyFill} stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="14" cy="24" r="5" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
        </>
      )}
      {toolId === 'engrave_tool' && (
        <>
          <path d="M10,12 H18 V22 L14,30 L10,22 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
        </>
      )}
      {toolId === 'thread_mill' && (
        <>
          <rect x="11" y="12" width="6" height="8" fill={bodyFill} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M9,20 L19,21 L9,23 L19,24 L9,26 L19,27 L14,29 L9,28 Z" fill="#d97706" stroke="#1e293b" strokeWidth="0.7" />
        </>
      )}
      {toolId === 'barrel_mill' && (
        <>
          <path d="M10,12 Q7,20 10,27 Q14,30 18,27 Q21,20 18,12 Z" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M10,16 L18,19 M10,22 L18,24" stroke={fluteHighlight} strokeWidth="1" />
        </>
      )}
      {toolId === 'high_feed_mill' && (
        <>
          <rect x="9" y="12" width="10" height="12" fill={bodyFill} stroke="#1e293b" strokeWidth="0.8" />
          <path d="M8,24 H20 V27 L17,29 H11 L8,27 Z" fill="#d97706" stroke="#1e293b" strokeWidth="0.8" />
        </>
      )}
      {(toolId === 'drill' || toolId === 'spot_drill' || toolId === 'center_drill' || toolId === 'countersink') && (
        <>
          <path
            d={
              toolId === 'center_drill'
                ? 'M9,12 H19 V21 H16 V27 L14,30 L12,27 V21 H9 Z'
                : toolId === 'countersink'
                  ? 'M7,16 H21 L14,29 Z'
                  : 'M9,12 H19 V24 L14,30 L9,24 Z'
            }
            fill={accent}
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          <path d="M9,16 L19,20 M9,21 L18,24" stroke={fluteHighlight} strokeWidth="1" />
        </>
      )}
      {(toolId === 'reamer' || toolId === 'tap_right' || toolId === 'tap_left' || toolId === 'counterbore') && (
        <>
          <rect x="9" y="12" width="10" height="17" fill={accent} stroke="#1e293b" strokeWidth="0.8" />
          <line x1="12" y1="12" x2="12" y2="29" stroke={fluteHighlight} strokeWidth="1" />
          <line x1="16" y1="12" x2="16" y2="29" stroke={fluteHighlight} strokeWidth="1" />
        </>
      )}
      {(toolId === 'boring_bar' || toolId.startsWith('od_')) && (
        <>
          <rect x="10" y="12" width="8" height="13" fill={bodyFill} stroke="#1e293b" strokeWidth="0.8" />
          <polygon points="8,24 18,22 20,28 11,30" fill="#d97706" stroke="#1e293b" strokeWidth="0.8" />
        </>
      )}
    </svg>
  );
}

function resolveToolMeta(idOrType) {
  const key = String(idOrType || '').toLowerCase();
  return (
    ALL_TOOL_ITEMS.find((t) => t.id === key || t.internalType === key) || MILLING_TOOLS[0]
  );
}

function DefineToolModalInner({
  onClose,
  onAddTool,
  onUpdateTool,
  initialTool = null,
  activeMachine = null,
  onNotify,
  zIndex = 100000
}) {
  const caps = useMemo(() => resolveMachineToolpathCapabilities(activeMachine), [activeMachine]);
  const isEditing = Boolean(initialTool);
  const initialMeta = useMemo(() => resolveToolMeta(initialTool?.toolSubtype || initialTool?.type), [initialTool]);

  const [currentStep, setCurrentStep] = useState(isEditing ? 2 : 1);
  const [selectedCategoryType, setSelectedCategoryType] = useState(initialMeta.id);
  const [millingExpanded, setMillingExpanded] = useState(!caps.isLathe);
  const [holemakingExpanded, setHolemakingExpanded] = useState(!caps.isLathe);
  const [turningExpanded, setTurningExpanded] = useState(caps.isLathe || caps.isMillTurn);

  const [toolGeometry, setToolGeometry] = useState(() => ({
    diameter: Number(initialTool?.diameter) || 12.0,
    cornerRadius: Number(initialTool?.cornerRadius ?? initialMeta.defaultCR),
    fluteLength: Number(initialTool?.fluteLength) || 25.0,
    overallLength: Number(initialTool?.overallLength) || 75.0,
    shankDiameter: Number(initialTool?.shankDiameter ?? initialTool?.diameter) || 12.0,
    flutes: Number(initialTool?.flutes) || initialMeta.defaultFlutes || 4
  }));

  const [toolProps, setToolProps] = useState(() => {
    const d = Number(initialTool?.diameter) || 12.0;
    const flutes = Number(initialTool?.flutes) || initialMeta.defaultFlutes || 4;
    const rpm = Math.min(caps.maxRpm, Number(initialTool?.spindleSpeed) || 3500);
    const feed = Math.min(caps.maxFeed, Number(initialTool?.feedRate) || 1200);
    return {
      toolNumber: Number(initialTool?.number ?? initialTool?.toolNumber) || 1,
      lengthOffset: Number(initialTool?.lengthOffset ?? initialTool?.number) || 1,
      diameterOffset: Number(initialTool?.diameterOffset ?? initialTool?.number) || 1,
      headNumber: Number(initialTool?.headNumber ?? (caps.hasHeadSelection ? 1 : 0)),
      cs: computeSurfaceSpeedCs(d, rpm),
      fpt: computeFeedPerTooth(feed, rpm, flutes),
      flutes,
      feedRate: feed,
      plungeRate: Number(initialTool?.plungeRate) || 150,
      retractRate: Number(initialTool?.retractRate) || 1200,
      spindleSpeed: rpm,
      spindleDirection: initialTool?.spindleDirection || 'Clockwise',
      material: initialTool?.material || 'Carbide',
      coolant: initialTool?.coolant || 'Flood',
      name: initialTool?.name || `12 ${initialMeta.suffix}`,
      description: initialTool?.description || '',
      manufacturerName: initialTool?.manufacturerName || 'Mastercam Imported',
      manufacturerCode: initialTool?.manufacturerCode || '',
      toolGrade: initialTool?.toolGrade || 'Mastercam Default',
      roughTool: initialTool?.roughTool ?? true,
      finishTool: initialTool?.finishTool ?? true,
      roughXyStepPct: Number(initialTool?.roughXyStepPct) || 0,
      roughZStepPct: Number(initialTool?.roughZStepPct) || 0,
      finishXyStepPct: Number(initialTool?.finishXyStepPct) || 0,
      finishZStepPct: Number(initialTool?.finishZStepPct) || 0
    };
  });

  const [manufacturers, setManufacturers] = useState(['Mastercam Imported', 'Sandvik Coromant', 'Kennametal', 'ISCAR', 'Harvey Tool']);
  const [toolGrades, setToolGrades] = useState(['Mastercam Default', 'TiAlN Micro-Grain', 'DLC Coated', 'Uncoated Carbide']);
  const [collapsedCards, setCollapsedCards] = useState({ operation: false, general: false, category: false });

  const activeToolMeta = resolveToolMeta(selectedCategoryType);
  const isHolemakingTool = HOLEMAKING_TOOLS.some((t) => t.id === selectedCategoryType);
  const isTurningTool = TURNING_TOOLS.some((t) => t.id === selectedCategoryType);
  const thirdCardTitle = isTurningTool ? 'Turning' : isHolemakingTool ? 'Holemaking' : 'Milling';

  const handleSelectToolType = (t) => {
    setSelectedCategoryType(t.id);
    const autoCorner = t.internalType === 'ball' || t.internalType === 'lollipop'
      ? Number((toolGeometry.diameter / 2).toFixed(2))
      : t.defaultCR;
    setToolGeometry((prev) => ({
      ...prev,
      cornerRadius: autoCorner,
      flutes: t.defaultFlutes || prev.flutes
    }));
    setToolProps((prev) => ({
      ...prev,
      flutes: t.defaultFlutes || prev.flutes,
      name: `${toolGeometry.diameter} ${t.suffix}`
    }));
  };

  const updateDiameterAndAutoName = (newDiam) => {
    const d = Math.max(0.1, Number(newDiam) || 1);
    const corner = activeToolMeta.internalType === 'ball' || activeToolMeta.internalType === 'lollipop'
      ? Number((d / 2).toFixed(2))
      : toolGeometry.cornerRadius;
    setToolGeometry((prev) => ({ ...prev, diameter: d, cornerRadius: corner }));
    setToolProps((prev) => ({
      ...prev,
      cs: computeSurfaceSpeedCs(d, prev.spindleSpeed),
      name: isEditing ? prev.name : `${d} ${activeToolMeta.suffix}`
    }));
  };

  // Two-way coupled calculation handlers for Step 3
  const handleRpmChange = (val) => {
    const clampedRpm = Math.min(caps.maxRpm, Math.max(0, Number(val) || 0));
    const cs = computeSurfaceSpeedCs(toolGeometry.diameter, clampedRpm);
    const feedRate = computeFeedFromFpt(toolProps.fpt, clampedRpm, toolProps.flutes, caps.maxFeed);
    setToolProps((prev) => ({ ...prev, spindleSpeed: clampedRpm, cs, feedRate }));
  };

  const handleCsChange = (val) => {
    const cs = Math.max(0, Number(val) || 0);
    const clampedRpm = computeRpmFromCs(toolGeometry.diameter, cs, caps.maxRpm);
    const feedRate = computeFeedFromFpt(toolProps.fpt, clampedRpm, toolProps.flutes, caps.maxFeed);
    setToolProps((prev) => ({ ...prev, cs, spindleSpeed: clampedRpm, feedRate }));
  };

  const handleFeedChange = (val) => {
    const feedRate = Math.min(caps.maxFeed, Math.max(0, Number(val) || 0));
    const fpt = computeFeedPerTooth(feedRate, toolProps.spindleSpeed, toolProps.flutes);
    setToolProps((prev) => ({ ...prev, feedRate, fpt }));
  };

  const handleFptChange = (val) => {
    const fpt = Math.max(0, Number(val) || 0);
    const feedRate = computeFeedFromFpt(fpt, toolProps.spindleSpeed, toolProps.flutes, caps.maxFeed);
    setToolProps((prev) => ({ ...prev, fpt, feedRate }));
  };

  const handleFlutesChange = (val) => {
    const flutes = Math.max(1, Math.round(Number(val) || 1));
    const feedRate = computeFeedFromFpt(toolProps.fpt, toolProps.spindleSpeed, flutes, caps.maxFeed);
    setToolGeometry((prev) => ({ ...prev, flutes }));
    setToolProps((prev) => ({ ...prev, flutes, feedRate }));
  };

  const handleAutoFeedsCalculator = () => {
    const matMap = {
      Carbide: 'ALUMINUM_6061_T6',
      HSS: 'STEEL_1045',
      Cobalt: 'STAINLESS_316L',
      Ceramic: 'TITANIUM_6AL4V',
      PCD: 'ALUMINUM_6061_T6',
      CBN: 'STEEL_1045'
    };
    const res = reinitializeFeedsSpeeds({
      tool: {
        diameter: toolGeometry.diameter,
        flutes: toolProps.flutes,
        type: activeToolMeta.internalType
      },
      activeMachine,
      materialKey: matMap[toolProps.material] || 'ALUMINUM_6061_T6',
      axialDepthAp: Math.max(0.5, toolGeometry.diameter * 0.1)
    });
    setToolProps((prev) => ({
      ...prev,
      spindleSpeed: res.spindleSpeed,
      feedRate: res.feedRate,
      plungeRate: res.plungeRate,
      retractRate: res.retractRate,
      cs: res.cs,
      fpt: res.fpt
    }));
    onNotify?.(`Recalculated CS=${res.cs} m/min, S=${res.spindleSpeed} RPM (capped @ ${caps.maxRpm} RPM)`, 'info');
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    const builtTool = {
      ...(initialTool || {}),
      id: initialTool?.id || `tool_${Date.now()}`,
      number: Number(toolProps.toolNumber) || 1,
      toolNumber: Number(toolProps.toolNumber) || 1,
      lengthOffset: Number(toolProps.lengthOffset) || 1,
      diameterOffset: Number(toolProps.diameterOffset) || 1,
      headNumber: Number(toolProps.headNumber) || 0,
      name: toolProps.name || `${toolGeometry.diameter} ${activeToolMeta.suffix}`,
      description: toolProps.description,
      type: activeToolMeta.internalType,
      toolSubtype: selectedCategoryType,
      diameter: Number(toolGeometry.diameter) || 10.0,
      cornerRadius: Number(toolGeometry.cornerRadius) || 0,
      fluteLength: Number(toolGeometry.fluteLength) || 25.0,
      overallLength: Number(toolGeometry.overallLength) || 75.0,
      shankDiameter: Number(toolGeometry.shankDiameter) || Number(toolGeometry.diameter) || 10.0,
      flutes: Number(toolProps.flutes) || 4,
      spindleSpeed: Number(toolProps.spindleSpeed) || 3500,
      feedRate: Number(toolProps.feedRate) || 1200,
      plungeRate: Number(toolProps.plungeRate) || 150,
      retractRate: Number(toolProps.retractRate) || 1200,
      cs: Number(toolProps.cs),
      fpt: Number(toolProps.fpt),
      spindleDirection: toolProps.spindleDirection,
      coolant: toolProps.coolant,
      material: toolProps.material,
      manufacturerName: toolProps.manufacturerName,
      manufacturerCode: toolProps.manufacturerCode,
      toolGrade: toolProps.toolGrade,
      roughTool: toolProps.roughTool,
      finishTool: toolProps.finishTool,
      roughXyStepPct: toolProps.roughXyStepPct,
      roughZStepPct: toolProps.roughZStepPct,
      finishXyStepPct: toolProps.finishXyStepPct,
      finishZStepPct: toolProps.finishZStepPct,
      holder: initialTool?.holder || `${caps.spindleTaper} ER32 Collet`
    };

    if (isEditing && onUpdateTool) {
      onUpdateTool(builtTool);
      onNotify?.(`Updated tool: T${builtTool.number} (${builtTool.name})`, 'success');
    } else if (onAddTool) {
      onAddTool(builtTool);
      onNotify?.(`Defined new tool: T${builtTool.number} (${builtTool.name})`, 'success');
    }
    onClose();
  };

  const renderStep3CardHeader = (cardKey, title) => (
    <div
      onClick={() => setCollapsedCards((p) => ({ ...p, [cardKey]: !p[cardKey] }))}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        borderBottom: collapsedCards[cardKey] ? 'none' : '1px solid #cbd5e1',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 500,
        color: '#1e293b'
      }}
    >
      <span>{title}</span>
      <span
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '1px solid #94a3b8',
          background: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {collapsedCards[cardKey] ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </span>
    </div>
  );

  const step3InputStyle = {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    height: '22px',
    padding: '1px 6px',
    border: '1px solid #cbd5e1',
    borderRadius: '1px',
    background: '#ffffff',
    fontSize: '11px',
    color: '#0f172a',
    outline: 'none'
  };

  const renderToolGrid = (list) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', padding: '4px 12px 10px 12px' }}>
      {list.map((t) => {
        const isSelected = selectedCategoryType === t.id;
        return (
          <div
            key={t.id}
            onClick={() => handleSelectToolType(t)}
            onDoubleClick={() => {
              handleSelectToolType(t);
              setCurrentStep(2);
            }}
            style={{
              border: isSelected ? '1px solid #60a5fa' : '1px solid transparent',
              background: isSelected ? '#dbeafe' : 'transparent',
              borderRadius: '2px',
              padding: '5px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <ToolTypeIconSvg toolId={t.id} selected={isSelected} />
            <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, color: '#0f172a' }}>
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: 'rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '860px',
          height: '585px',
          background: '#ffffff',
          borderRadius: '2px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.42)',
          border: '1px solid #64748b',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: '30px',
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            fontSize: '12px',
            color: '#1e293b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 500 }}>{isEditing ? 'Edit Tool' : 'Define Tool'}</span>
            <span style={{ fontSize: '10px', color: '#64748b', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0 6px', borderRadius: '2px' }}>
              {caps.machineName} • Max {caps.maxRpm.toLocaleString()} RPM
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Wizard Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#ffffff' }}>
          {/* Left Navigation Stepper (Mastercam Exact Style) */}
          <div
            style={{
              width: '175px',
              borderRight: '1px solid #cbd5e1',
              padding: '22px 0',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '12px', padding: '0 14px 10px 14px' }}>
              Current Step:
            </div>
            {[
              { step: 1, label: 'Select Tool Type' },
              { step: 2, label: 'Define Tool Geometry' },
              { step: 3, label: 'Finalize Properties' }
            ].map((item) => {
              const active = currentStep === item.step;
              return (
                <div
                  key={item.step}
                  onClick={() => setCurrentStep(item.step)}
                  style={{
                    padding: '5px 14px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: active ? '#e2e8f0' : 'transparent',
                    color: active ? '#0f172a' : '#334155',
                    fontWeight: active ? 500 : 400
                  }}
                >
                  {item.label}
                </div>
              );
            })}
          </div>

          {/* Right Main Wizard Content */}
          <div style={{ flex: 1, padding: '18px 24px 12px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* ================= STEP 1: SELECT TOOL TYPE ================= */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 400, color: '#0369a1', margin: '0 0 8px 0' }}>
                  What type of tool would you like to create?
                </h2>
                <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 12px 0' }}>
                  Select the tool type you wish to create from the list below.
                </p>

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    padding: '6px 0'
                  }}
                >
                  {/* Group 1: Milling */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setMillingExpanded((v) => !v)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#0369a1',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>{millingExpanded ? '▾' : '▸'}</span>
                      <span>Milling</span>
                    </button>
                    {millingExpanded && renderToolGrid(MILLING_TOOLS)}
                  </div>

                  {/* Group 2: Holemaking */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setHolemakingExpanded((v) => !v)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '4px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#0369a1',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>{holemakingExpanded ? '▾' : '▸'}</span>
                      <span>Holemaking</span>
                    </button>
                    {holemakingExpanded && renderToolGrid(HOLEMAKING_TOOLS)}
                  </div>

                  {/* Group 3: Turning (visible dynamically for Lathe / Mill-Turn) */}
                  {(caps.isLathe || caps.isMillTurn) && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setTurningExpanded((v) => !v)}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          padding: '4px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: '#0369a1',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span>{turningExpanded ? '▾' : '▸'}</span>
                        <span>Turning ({caps.shortType})</span>
                      </button>
                      {turningExpanded && renderToolGrid(TURNING_TOOLS)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 2: DEFINE TOOL GEOMETRY ================= */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 400, color: '#0369a1', margin: '0 0 8px 0' }}>
                  Define Tool Geometry
                </h2>
                <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 16px 0' }}>
                  Specify the {activeToolMeta.label} dimensions and fluting geometry ({caps.spindleTaper}).
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: '24px', alignItems: 'start', minWidth: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', minWidth: 0 }}>
                    {[
                      { label: 'Cutting diameter (D):', val: toolGeometry.diameter, step: '0.1', fn: (v) => updateDiameterAndAutoName(v) },
                      { label: 'Corner radius (CR):', val: toolGeometry.cornerRadius, step: '0.1', fn: (v) => setToolGeometry({ ...toolGeometry, cornerRadius: Number(v) }) },
                      { label: 'Flute length (FL):', val: toolGeometry.fluteLength, step: '0.5', fn: (v) => setToolGeometry({ ...toolGeometry, fluteLength: Number(v) }) },
                      { label: 'Overall length (OAL):', val: toolGeometry.overallLength, step: '1.0', fn: (v) => setToolGeometry({ ...toolGeometry, overallLength: Number(v) }) },
                      { label: 'Shank diameter (SD):', val: toolGeometry.shankDiameter, step: '0.5', fn: (v) => setToolGeometry({ ...toolGeometry, shankDiameter: Number(v) }) },
                      { label: 'Number of flutes:', val: toolGeometry.flutes, step: '1', min: 1, fn: (v) => handleFlutesChange(v) }
                    ].map((row) => (
                      <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '145px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span style={{ color: '#334155' }}>{row.label}</span>
                        <input
                          type="number"
                          step={row.step}
                          min={row.min}
                          value={row.val}
                          onChange={(e) => row.fn(e.target.value)}
                          style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '1px', background: '#fef9c3', outline: 'none', fontSize: '12px' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Interactive 2D Section Preview */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '2px', background: '#f8fafc', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                      {activeToolMeta.label} Profile Preview
                    </div>
                    <svg width="160" height="220" viewBox="0 0 160 220">
                      {/* Holder taper */}
                      <path d="M40,10 H120 L110,45 H50 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1.2" />
                      {/* Shank */}
                      <rect
                        x={80 - Math.min(24, Math.max(8, toolGeometry.shankDiameter))}
                        y="45"
                        width={Math.min(48, Math.max(16, toolGeometry.shankDiameter * 2))}
                        height="55"
                        fill="#94a3b8"
                        stroke="#334155"
                        strokeWidth="1.2"
                      />
                      {/* Flutes / Head */}
                      <rect
                        x={80 - Math.min(26, Math.max(8, toolGeometry.diameter))}
                        y="100"
                        width={Math.min(52, Math.max(16, toolGeometry.diameter * 2))}
                        height="85"
                        rx={Math.min(18, toolGeometry.cornerRadius * 2.5)}
                        fill="#3b82f6"
                        stroke="#1e3a8a"
                        strokeWidth="1.2"
                      />
                      {/* Helical flute ticks */}
                      <path d="M68,115 L92,130 M68,140 L92,155 M68,165 L92,180" stroke="#e0f2fe" strokeWidth="1.4" />
                      {/* Centerline */}
                      <line x1="80" y1="6" x2="80" y2="205" stroke="#dc2626" strokeDasharray="4,3" strokeWidth="1" />
                      <text x="80" y="206" textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="600">
                        D {toolGeometry.diameter} | CR {toolGeometry.cornerRadius} | OAL {toolGeometry.overallLength}
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: FINALIZE MISCELLANEOUS PROPERTIES (EXACT IMAGE 3) ================= */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 400, color: '#0369a1', margin: '0 0 8px 0' }}>
                  Finalize miscellaneous properties.
                </h2>
                <p style={{ fontSize: '12px', color: '#334155', margin: '0 0 12px 0' }}>
                  Adjust any miscellaneous properties before finalizing tool creation.
                </p>

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start', overflow: 'hidden' }}>
                  {/* LEFT CARD: Operation */}
                  <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                    {renderStep3CardHeader('operation', 'Operation')}
                    {!collapsedCards.operation && (
                      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', fontSize: '11px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Tool number</span>
                          <input type="number" value={toolProps.toolNumber} onChange={(e) => {
                            const n = Number(e.target.value);
                            setToolProps({ ...toolProps, toolNumber: n, lengthOffset: n, diameterOffset: n });
                          }} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Length offset</span>
                          <input type="number" value={toolProps.lengthOffset} onChange={(e) => setToolProps({ ...toolProps, lengthOffset: Number(e.target.value) })} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Diameter offset</span>
                          <input type="number" value={toolProps.diameterOffset} onChange={(e) => setToolProps({ ...toolProps, diameterOffset: Number(e.target.value) })} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Head number</span>
                          <input type="number" value={toolProps.headNumber} onChange={(e) => setToolProps({ ...toolProps, headNumber: Number(e.target.value) })} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>CS</span>
                          <input type="number" step="0.1" value={toolProps.cs} onChange={(e) => handleCsChange(e.target.value)} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>FPT</span>
                          <input type="number" step="0.0005" value={toolProps.fpt} onChange={(e) => handleFptChange(e.target.value)} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Number of flutes</span>
                          <input type="number" min={1} value={toolProps.flutes} onChange={(e) => handleFlutesChange(e.target.value)} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Feed rate</span>
                          <input type="number" value={toolProps.feedRate} onChange={(e) => handleFeedChange(e.target.value)} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 22px', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#334155' }}>Plunge rate</span>
                          <input type="number" value={toolProps.plungeRate} onChange={(e) => setToolProps({ ...toolProps, plungeRate: Number(e.target.value) })} style={step3InputStyle} />
                          <button
                            type="button"
                            onClick={handleAutoFeedsCalculator}
                            title="Calculate feeds & speeds for active machine"
                            style={{ height: '22px', width: '22px', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                          >
                            <Calculator size={12} color="#1e40af" />
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Retract rate</span>
                          <input type="number" value={toolProps.retractRate} onChange={(e) => setToolProps({ ...toolProps, retractRate: Number(e.target.value) })} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Spindle speed</span>
                          <input type="number" value={toolProps.spindleSpeed} onChange={(e) => handleRpmChange(e.target.value)} style={step3InputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Spindle direction</span>
                          <select value={toolProps.spindleDirection} onChange={(e) => setToolProps({ ...toolProps, spindleDirection: e.target.value })} style={step3InputStyle}>
                            <option value="Clockwise">Clockwise</option>
                            <option value="Counterclockwise">Counterclockwise</option>
                            <option value="Off">Off</option>
                          </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#334155' }}>Material</span>
                          <select value={toolProps.material} onChange={(e) => setToolProps({ ...toolProps, material: e.target.value })} style={step3InputStyle}>
                            <option value="Carbide">Carbide</option>
                            <option value="HSS">HSS</option>
                            <option value="Cobalt">Cobalt</option>
                            <option value="Ceramic">Ceramic</option>
                            <option value="PCD">PCD</option>
                            <option value="CBN">CBN</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <div style={{ height: '16px', background: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <ChevronDown size={12} />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: General + Milling/Holemaking/Turning */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* General Card */}
                    <div style={{ border: '1px solid #cbd5e1', background: '#ffffff' }}>
                      {renderStep3CardHeader('general', 'General')}
                      {!collapsedCards.general && (
                        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#334155' }}>Name:</span>
                            <input type="text" value={toolProps.name} onChange={(e) => setToolProps({ ...toolProps, name: e.target.value })} style={step3InputStyle} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#334155' }}>Description:</span>
                            <input type="text" value={toolProps.description} onChange={(e) => setToolProps({ ...toolProps, description: e.target.value })} style={step3InputStyle} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr 22px', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#334155' }}>Manufacturer name:</span>
                            <select value={toolProps.manufacturerName} onChange={(e) => setToolProps({ ...toolProps, manufacturerName: e.target.value })} style={step3InputStyle}>
                              {manufacturers.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const custom = window.prompt('Add manufacturer name:');
                                if (custom?.trim()) {
                                  setManufacturers((p) => [...p, custom.trim()]);
                                  setToolProps((p) => ({ ...p, manufacturerName: custom.trim() }));
                                }
                              }}
                              title="Add manufacturer"
                              style={{ height: '22px', width: '22px', border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, color: '#16a34a' }}
                            >
                              <Plus size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#334155' }}>Manufacturer&apos;s tool code:</span>
                            <input type="text" value={toolProps.manufacturerCode} onChange={(e) => setToolProps({ ...toolProps, manufacturerCode: e.target.value })} style={step3InputStyle} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '125px 1fr 22px', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#334155' }}>Tool Grade:</span>
                            <select value={toolProps.toolGrade} onChange={(e) => setToolProps({ ...toolProps, toolGrade: e.target.value })} style={step3InputStyle}>
                              {toolGrades.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const custom = window.prompt('Add tool grade:');
                                if (custom?.trim()) {
                                  setToolGrades((p) => [...p, custom.trim()]);
                                  setToolProps((p) => ({ ...p, toolGrade: custom.trim() }));
                                }
                              }}
                              title="Add tool grade"
                              style={{ height: '22px', width: '22px', border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, color: '#16a34a' }}
                            >
                              <Plus size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      )}
                      <div style={{ height: '14px', background: '#f8fafc', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                        <ChevronDown size={11} />
                      </div>
                    </div>

                    {/* Milling / Holemaking / Turning Card */}
                    <div style={{ border: '1px solid #cbd5e1', background: '#ffffff' }}>
                      {renderStep3CardHeader('category', thirdCardTitle)}
                      {!collapsedCards.category && (
                        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#0f172a' }}>
                            <input type="checkbox" checked={toolProps.roughTool} onChange={(e) => setToolProps({ ...toolProps, roughTool: e.target.checked })} />
                            <span>Rough Tool</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#0f172a' }}>
                            <input type="checkbox" checked={toolProps.finishTool} onChange={(e) => setToolProps({ ...toolProps, finishTool: e.target.checked })} />
                            <span>Finish Tool</span>
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{ color: '#334155' }}>Rough XY step (%):</span>
                            <input type="number" value={toolProps.roughXyStepPct} onChange={(e) => setToolProps({ ...toolProps, roughXyStepPct: Number(e.target.value) })} style={step3InputStyle} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#334155' }}>Rough Z step (%):</span>
                            <input type="number" value={toolProps.roughZStepPct} onChange={(e) => setToolProps({ ...toolProps, roughZStepPct: Number(e.target.value) })} style={step3InputStyle} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#334155' }}>Finish XY step (%):</span>
                            <input type="number" value={toolProps.finishXyStepPct} onChange={(e) => setToolProps({ ...toolProps, finishXyStepPct: Number(e.target.value) })} style={step3InputStyle} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#334155' }}>Finish Z step (%):</span>
                            <input type="number" value={toolProps.finishZStepPct} onChange={(e) => setToolProps({ ...toolProps, finishZStepPct: Number(e.target.value) })} style={step3InputStyle} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Wizard Footer */}
        <div
          style={{
            height: '46px',
            background: '#ffffff',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            fontSize: '12px'
          }}
        >
          <button
            type="button"
            onClick={() => onNotify?.(`Define Tool Help: Select cutter geometry & speeds for ${caps.machineName}.`, 'info')}
            style={{
              width: '72px',
              height: '26px',
              background: '#f8fafc',
              border: '1px solid #94a3b8',
              borderRadius: '2px',
              cursor: 'pointer',
              color: '#0f172a',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <HelpCircle size={12} />
            Help
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '72px',
                height: '26px',
                background: '#f8fafc',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                cursor: 'pointer',
                color: '#0f172a'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{
                width: '72px',
                height: '26px',
                background: currentStep === 1 ? '#f1f5f9' : '#f8fafc',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                cursor: currentStep === 1 ? 'default' : 'pointer',
                color: currentStep === 1 ? '#94a3b8' : '#0f172a'
              }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentStep >= 3}
              style={{
                width: '72px',
                height: '26px',
                background: currentStep >= 3 ? '#f1f5f9' : '#f8fafc',
                border: currentStep < 3 ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: currentStep >= 3 ? 'default' : 'pointer',
                color: currentStep >= 3 ? '#94a3b8' : '#0f172a',
                fontWeight: currentStep < 3 ? 500 : 400
              }}
            >
              Next
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={currentStep < 3 && !isEditing}
              style={{
                width: '72px',
                height: '26px',
                background: currentStep === 3 || isEditing ? '#f8fafc' : '#f1f5f9',
                border: currentStep === 3 || isEditing ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                borderRadius: '2px',
                cursor: currentStep === 3 || isEditing ? 'pointer' : 'default',
                color: currentStep === 3 || isEditing ? '#0f172a' : '#94a3b8',
                fontWeight: currentStep === 3 ? 500 : 400
              }}
            >
              Finish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DefineToolModal(props) {
  if (!props.isOpen) return null;
  const resetKey = `${props.initialTool?.id || 'new'}-${props.activeMachine?.id || 'default'}`;
  return <DefineToolModalInner key={resetKey} {...props} />;
}

export default DefineToolModal;

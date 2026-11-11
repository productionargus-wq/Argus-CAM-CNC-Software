import React, { useState } from 'react';
import { X, Check, RotateCcw, Layers } from 'lucide-react';
import { MACHINING_MATERIALS } from '../utils/machiningPhysics';
import {
  CUT_PARAMETER_PRESETS,
  reinitializeFeedsSpeeds
} from '../config/surfaceFinishSchema';

/**
 * Shared compact Mastercam modal frame for sub-dialogs opened from Surface Finish tabs.
 */
function SubDialogShell({ title, width = 420, onClose, onOk, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100020,
        background: 'rgba(15, 23, 42, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: `${width}px`,
          maxWidth: '94vw',
          background: '#f0f0f0',
          border: '1px solid #64748b',
          boxShadow: '0 14px 36px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            height: '28px',
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0 0 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#0f172a'
          }}
        >
          <span>{title}</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '28px',
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '12px', fontSize: '11.5px', color: '#0f172a', maxHeight: '72vh', overflowY: 'auto' }}>
          {children}
        </div>

        <div
          style={{
            padding: '8px 12px',
            background: '#e5e7eb',
            borderTop: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '6px'
          }}
        >
          {onOk && (
            <button
              type="button"
              onClick={onOk}
              style={{
                width: '44px',
                height: '26px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                color: '#16a34a',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Accept"
            >
              <Check size={15} strokeWidth={2.5} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '44px',
              height: '26px',
              background: '#ffffff',
              border: '1px solid #94a3b8',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cancel"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive cross-section SVG for Surface parameters tab (matches Mastercam Image 4 verbatim):
 * Spindle Taper/Holder -> Cutter -> Workpiece Contour + 4 horizontal red datum lines aligned to:
 * Clearance (y=24), Retract (y=114), Feed plane (y=170), Top of stock (y=222).
 */
export function SurfaceHeightsSchematicSvg({
  clearanceEnabled,
  retractEnabled,
  topOfStockEnabled,
  spindleTaper = 'CAT 40'
}) {
  return (
    <svg width="215" height="275" viewBox="0 0 215 275" style={{ display: 'block', background: '#cfcfcf', border: '1px solid #94a3b8' }}>
      {/* Background Shading Gradient */}
      <defs>
        <linearGradient id="mcHolderGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="45%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="mcPartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>

      {/* Holder Flange & Collet Chuck */}
      <rect x="74" y="4" width="60" height="8" fill="url(#mcHolderGrad)" stroke="#111827" strokeWidth="1" />
      <polygon points="72,12 136,12 142,20 66,20" fill="url(#mcHolderGrad)" stroke="#111827" strokeWidth="1" />
      <rect x="66" y="20" width="76" height="12" fill="url(#mcHolderGrad)" stroke="#111827" strokeWidth="1" />
      <polygon points="74,32 134,32 130,38 78,38" fill="#4b5563" stroke="#111827" strokeWidth="1" />
      <rect x="81" y="38" width="46" height="28" fill="url(#mcHolderGrad)" stroke="#111827" strokeWidth="1" />
      <polygon points="81,66 127,66 119,76 89,76" fill="#6b7280" stroke="#111827" strokeWidth="1" />
      <text x="104" y="55" textAnchor="middle" fontSize="8" fill="#111827" fontWeight="700">{spindleTaper}</text>

      {/* Fluted Blue Cutter */}
      <rect x="94" y="76" width="20" height="58" rx="4" fill="#1d4ed8" stroke="#0f172a" strokeWidth="1" />
      <path d="M94,86 L114,95 M94,97 L114,106 M94,108 L114,117 M94,119 L110,127" stroke="#60a5fa" strokeWidth="1.5" />
      <path d="M94,129 Q104,138 114,129" fill="none" stroke="#93c5fd" strokeWidth="1.5" />

      {/* Curved Sculpted Part Block at bottom */}
      <path d="M6,202 H58 Q88,202 104,218 Q126,238 175,238 L208,238 V266 H6 Z" fill="url(#mcPartGrad)" stroke="#1f2937" strokeWidth="1" />
      <path d="M58,202 Q88,202 104,218 Q126,238 175,238" fill="none" stroke="#dc2626" strokeWidth="1.2" />

      {/* Cyan Plunge & Retract Motion Arrows */}
      <line x1="104" y1="138" x2="104" y2="215" stroke="#fde047" strokeWidth="1.6" />
      <polygon points="104,166 101,160 107,160" fill="#fde047" />
      <line x1="104" y1="168" x2="104" y2="215" stroke="#22d3ee" strokeWidth="1.8" />
      <polygon points="104,216 101,209 107,209" fill="#22d3ee" />
      {/* Second up/down arrow cycle */}
      <line x1="142" y1="172" x2="142" y2="236" stroke="#22d3ee" strokeWidth="1.5" />
      <polygon points="142,172 139,179 145,179" fill="#22d3ee" />
      <polygon points="142,236 139,229 145,229" fill="#fde047" />

      {/* Datum Dots */}
      <circle cx="104" cy="136" r="2.2" fill="#dc2626" />
      <circle cx="104" cy="168" r="2.2" fill="#dc2626" />
      <circle cx="142" cy="170" r="2" fill="#dc2626" />

      {/* 4 Horizontal Red Mastercam Leader Lines to Right-Side Inputs */}
      {/* 1. Clearance */}
      <path
        d="M118,136 H166 V22 H214"
        fill="none"
        stroke={clearanceEnabled ? '#dc2626' : '#ef4444'}
        strokeWidth="1.3"
        strokeDasharray={clearanceEnabled ? 'none' : '3,2'}
      />
      {/* 2. Retract */}
      <path
        d="M106,136 H190 V112 H214"
        fill="none"
        stroke={retractEnabled ? '#dc2626' : '#ef4444'}
        strokeWidth="1.4"
      />
      {/* 3. Feed plane */}
      <path d="M144,170 H214" fill="none" stroke="#dc2626" strokeWidth="1.4" />
      {/* 4. Top of stock */}
      <path
        d="M54,202 H182 V222 H214"
        fill="none"
        stroke={topOfStockEnabled ? '#dc2626' : '#ef4444'}
        strokeWidth="1.3"
        strokeDasharray={topOfStockEnabled ? 'none' : '3,2'}
      />
    </svg>
  );
}

/**
 * Tip comp preview SVG (Image 4 top-right corner beside "Tip comp [Tip v]").
 */
export function TipCompDiagramSvg({ tipComp = 'tip' }) {
  const isCenter = String(tipComp).toLowerCase() === 'center';
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ border: '1px solid #94a3b8', background: '#d1d5db' }}>
      <path d="M10,2 H26 V18 A8,8 0 0,1 10,18 Z" fill="#f1f5f9" stroke="#334155" strokeWidth="1.2" />
      <line x1="3" y1="30" x2="33" y2="30" stroke="#475569" strokeWidth="1.2" />
      <line x1="18" y1="2" x2="18" y2="32" stroke="#64748b" strokeWidth="0.8" strokeDasharray="2,2" />
      {isCenter ? (
        <>
          <circle cx="18" cy="18" r="2.8" fill="#dc2626" />
          <line x1="3" y1="18" x2="33" y2="18" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2" />
        </>
      ) : (
        <>
          <line x1="3" y1="26" x2="33" y2="26" stroke="#0284c7" strokeWidth="1.2" />
          <circle cx="18" cy="26" r="2.4" fill="#dc2626" />
        </>
      )}
    </svg>
  );
}

/**
 * 4 Transition Graphic Tiles for Finish contour parameters (matches Image 5 verbatim).
 */
export function TransitionTileSvg({ type }) {
  return (
    <svg width="86" height="58" viewBox="0 0 86 58" style={{ display: 'block', background: '#c9ccd1', border: '1px solid #6b7280' }}>
      {/* Upper and lower surface pass diagonal step edges */}
      <path d="M2,18 L24,2 M24,56 L84,12" stroke="#60a5fa" strokeWidth="1.2" fill="none" />
      <path d="M2,46 L60,2" stroke="#60a5fa" strokeWidth="1.1" fill="none" opacity="0.65" />

      {type === 'high_speed' && (
        <>
          <path d="M36,20 C24,20 20,44 44,44 C56,44 60,36 52,32 C46,29 38,32 36,20" fill="none" stroke="#1e3a8a" strokeWidth="2.2" />
          <line x1="40" y1="50" x2="54" y2="50" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="40" y1="47" x2="40" y2="53" stroke="#dc2626" strokeWidth="1.3" />
          <line x1="54" y1="47" x2="54" y2="53" stroke="#dc2626" strokeWidth="1.3" />
        </>
      )}

      {type === 'broken' && (
        <path d="M28,22 H44 V38" fill="none" stroke="#1e3a8a" strokeWidth="2.4" />
      )}

      {type === 'ramp' && (
        <>
          <path d="M44,10 L26,46 L31,45" fill="none" stroke="#1e3a8a" strokeWidth="2.2" />
          <line x1="25" y1="50" x2="41" y2="50" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="25" y1="47" x2="25" y2="53" stroke="#dc2626" strokeWidth="1.3" />
          <line x1="41" y1="47" x2="41" y2="53" stroke="#dc2626" strokeWidth="1.3" />
        </>
      )}

      {type === 'follow_surface' && (
        <path d="M22,20 Q42,20 42,40" fill="none" stroke="#1e3a8a" strokeWidth="2.4" />
      )}
    </svg>
  );
}

export function SurfaceFinishSubDialog({
  dialog,
  onClose,
  toolParams,
  setToolParams,
  machineParams,
  setMachineParams,
  surfaceParams,
  setSurfaceParams,
  contourParams,
  setContourParams,
  caps,
  tools,
  activeTool,
  activeMachine,
  detectedSurfaces,
  selectedSurfaceIds,
  setSelectedSurfaceIds,
  onSelectLibraryTool,
  onApplyFeedsSpeedsCalc,
  onApplyCutPreset,
  onNotify
}) {
  const [localCoolant, setLocalCoolant] = useState({
    mode: toolParams.coolantMode || 'Flood',
    throughTool: Boolean(toolParams.coolantThroughTool),
    mist: Boolean(toolParams.coolantMist),
    air: Boolean(toolParams.coolantAir)
  });
  const [calcMat, setCalcMat] = useState('ALUMINUM_6061_T6');
  const [calcDoc, setCalcDoc] = useState(contourParams.maxStepdown || 0.5);
  const [calcAe, setCalcAe] = useState(Math.max(0.2, (Number(toolParams.toolDiameter) || 10) * 0.2));
  const [projStickout, setProjStickout] = useState(45.0);
  const [projColletLen, setProjColletLen] = useState(32.0);
  const [assyNames, setAssyNames] = useState({
    assemblyName: `${toolParams.toolNumber} - ${toolParams.toolName}`,
    holderName: activeTool?.holder || `${caps.spindleTaper} ER32 Collet`
  });
  const [selectedPresetId, setSelectedPresetId] = useState(CUT_PARAMETER_PRESETS[0].id);
  const [presetSearch, setPresetSearch] = useState('');
  const [localAxisCombo, setLocalAxisCombo] = useState(machineParams.axisCombo);
  const [localHomePos, setLocalHomePos] = useState({ ...machineParams.homePos });
  const [localRotaryMode, setLocalRotaryMode] = useState(machineParams.rotaryAxisMode);
  const [localRotaryDiam, setLocalRotaryDiam] = useState(machineParams.rotaryDiameter);
  const [localPlanes, setLocalPlanes] = useState({
    wcsPlane: machineParams.wcsPlane,
    tplane: machineParams.tplane,
    cplane: machineParams.cplane
  });
  const [localToolDisplay, setLocalToolDisplay] = useState(machineParams.toolDisplayMode);
  const [localRefPoint, setLocalRefPoint] = useState({
    approach: { ...machineParams.refPointApproach },
    retract: { ...machineParams.refPointRetract }
  });
  const [localCanned, setLocalCanned] = useState({
    before: machineParams.cannedTextBefore,
    after: machineParams.cannedTextAfter
  });
  const [localTol, setLocalTol] = useState({
    totalTolerance: contourParams.totalTolerance,
    filterRatio: contourParams.filterToleranceRatio,
    oneWayArcFilter: contourParams.oneWayArcFilter
  });
  const [localHelix, setLocalHelix] = useState({
    radius: contourParams.helixRadius,
    angle: contourParams.helixAngle
  });
  const [localShallow, setLocalShallow] = useState({
    fromSlope: contourParams.shallowFromSlope,
    toSlope: contourParams.shallowToSlope
  });
  const [localFlats, setLocalFlats] = useState({
    extendToStock: contourParams.flatsExtendToStock
  });
  const [localCutDepths, setLocalCutDepths] = useState({
    mode: contourParams.cutDepthsMode,
    minDepth: contourParams.minDepth,
    maxDepth: contourParams.maxDepth
  });
  const [localGaps, setLocalGaps] = useState({
    mode: contourParams.gapSettingsMode,
    maxDist: contourParams.maxGapDistance
  });
  const [localAdvanced, setLocalAdvanced] = useState({
    toolAxis: contourParams.advancedToolAxis,
    collisionCheck: contourParams.advancedCollisionCheck
  });
  const [localDirection, setLocalDirection] = useState(surfaceParams.cutDirectionMode || 'Normal');

  if (!dialog) return null;

  const rowInput = {
    padding: '3px 6px',
    border: '1px solid #94a3b8',
    background: '#ffffdd',
    fontSize: '11.5px',
    fontFamily: 'monospace'
  };

  if (dialog === 'coolant') {
    return (
      <SubDialogShell
        title={`Coolant Options — ${caps.machineName}`}
        width={380}
        onClose={onClose}
        onOk={() => {
          setToolParams((p) => ({
            ...p,
            coolantMode: localCoolant.mode,
            coolantThroughTool: localCoolant.throughTool,
            coolantMist: localCoolant.mist,
            coolantAir: localCoolant.air
          }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {caps.supportedCoolantModes.map((c) => (
            <label
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: c.supported ? 1 : 0.45,
                cursor: c.supported ? 'pointer' : 'not-allowed'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="coolant_mode"
                  disabled={!c.supported}
                  checked={localCoolant.mode === c.id}
                  onChange={() => setLocalCoolant((p) => ({ ...p, mode: c.id }))}
                />
                {c.label}
              </span>
              {!c.supported && <span style={{ fontSize: '10px', color: '#64748b' }}>Not equipped on machine</span>}
            </label>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '4px 0' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={localCoolant.air} onChange={(e) => setLocalCoolant((p) => ({ ...p, air: e.target.checked }))} />
            Air blast after tool change (M07)
          </label>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'feeds_calc') {
    const preview = reinitializeFeedsSpeeds({
      tool: { diameter: toolParams.toolDiameter, flutes: toolParams.flutes, type: activeTool?.type || 'flat' },
      activeMachine,
      materialKey: calcMat,
      axialDepthAp: calcDoc,
      radialDepthAe: calcAe
    });
    return (
      <SubDialogShell
        title="Mastercam Feed / Speed Calculator"
        width={440}
        onClose={onClose}
        onOk={() => {
          onApplyFeedsSpeedsCalc(preview);
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Workpiece Material:</span>
            <select value={calcMat} onChange={(e) => setCalcMat(e.target.value)} style={{ padding: '4px', border: '1px solid #94a3b8' }}>
              {Object.entries(MACHINING_MATERIALS).map(([k, v]) => (
                <option key={k} value={k}>{v.name || k}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Axial DOC ap (mm):</span>
            <input type="number" step="0.1" value={calcDoc} onChange={(e) => setCalcDoc(Number(e.target.value))} style={rowInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Radial Stepover ae (mm):</span>
            <input type="number" step="0.1" value={calcAe} onChange={(e) => setCalcAe(Number(e.target.value))} style={rowInput} />
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
            <div><strong>Calculated RPM:</strong> {preview.spindleSpeed}</div>
            <div><strong>Surface Speed CS:</strong> {preview.cs} m/min</div>
            <div><strong>Feed Rate:</strong> {preview.feedRate} mm/min</div>
            <div><strong>FPT:</strong> {preview.fpt} mm/t</div>
            <div><strong>Plunge / Retract:</strong> {preview.plungeRate} / {preview.retractRate}</div>
            <div><strong>Machine Max:</strong> {caps.maxRpm} RPM</div>
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'search_presets') {
    const filtered = CUT_PARAMETER_PRESETS.filter((p) =>
      `${p.label} ${p.materialKey}`.toLowerCase().includes(presetSearch.toLowerCase())
    );
    return (
      <SubDialogShell
        title="Search for Cut Parameters"
        width={500}
        onClose={onClose}
        onOk={() => {
          onApplyCutPreset(selectedPresetId);
          onClose();
        }}
      >
        <input
          type="text"
          placeholder="Filter by material, ISO group, tolerance..."
          value={presetSearch}
          onChange={(e) => setPresetSearch(e.target.value)}
          style={{ width: '100%', padding: '5px 8px', border: '1px solid #94a3b8', marginBottom: '8px', background: '#ffffff' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
          {filtered.map((p) => (
            <label
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: selectedPresetId === p.id ? '#dbeafe' : '#ffffff',
                border: selectedPresetId === p.id ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="radio" checked={selectedPresetId === p.id} onChange={() => setSelectedPresetId(p.id)} />
                <span>{p.label}</span>
              </span>
              <span style={{ fontSize: '10px', color: '#475569' }}>
                Tol {p.totalTolerance} | Z {p.maxStepdown}
              </span>
            </label>
          ))}
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'edit_projection') {
    return (
      <SubDialogShell
        title="Edit Projection"
        width={360}
        onClose={onClose}
        onOk={() => {
          onNotify?.(`Updated tool projection stickout to ${projStickout} mm (${caps.spindleTaper})`, 'success');
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Flute Projection (mm):</span>
            <input type="number" step="0.5" value={projStickout} onChange={(e) => setProjStickout(Number(e.target.value))} style={rowInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Holder Gauge Length:</span>
            <input type="number" step="0.5" value={projColletLen} onChange={(e) => setProjColletLen(Number(e.target.value))} style={rowInput} />
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 8px', fontSize: '11px' }}>
            Total Assembly Gauge: <strong>{(projStickout + projColletLen).toFixed(1)} mm</strong>
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'edit_assembly') {
    return (
      <SubDialogShell
        title="Edit Assembly Names"
        width={400}
        onClose={onClose}
        onOk={() => {
          setToolParams((p) => ({ ...p, toolName: assyNames.assemblyName.replace(/^\d+\s*-\s*/, '') || p.toolName }));
          onNotify?.(`Assembly updated: ${assyNames.assemblyName} [${assyNames.holderName}]`, 'success');
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Assembly Name:</span>
            <input type="text" value={assyNames.assemblyName} onChange={(e) => setAssyNames((p) => ({ ...p, assemblyName: e.target.value }))} style={{ padding: '4px 6px', border: '1px solid #94a3b8', background: '#ffffff' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Holder Name:</span>
            <input type="text" value={assyNames.holderName} onChange={(e) => setAssyNames((p) => ({ ...p, holderName: e.target.value }))} style={{ padding: '4px 6px', border: '1px solid #94a3b8', background: '#ffffff' }} />
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'select_library_tool') {
    return (
      <SubDialogShell title={`Select Library Tool (${caps.toolManagerSuffix})`} width={540} onClose={onClose}>
        <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #94a3b8', background: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#e2e8f0', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '5px' }}>#</th>
                <th style={{ padding: '5px' }}>Tool Name</th>
                <th style={{ padding: '5px' }}>Type</th>
                <th style={{ padding: '5px' }}>Diam (mm)</th>
                <th style={{ padding: '5px' }}>RPM</th>
                <th style={{ padding: '5px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((t, idx) => (
                <tr key={t.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '4px 5px' }}>{t.number || idx + 1}</td>
                  <td style={{ padding: '4px 5px', fontWeight: 500 }}>{t.name}</td>
                  <td style={{ padding: '4px 5px' }}>{t.type || 'flat'}</td>
                  <td style={{ padding: '4px 5px' }}>{t.diameter}</td>
                  <td style={{ padding: '4px 5px' }}>{t.spindleSpeed || t.rpm || 3500}</td>
                  <td style={{ padding: '4px 5px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLibraryTool(t);
                        onClose();
                      }}
                      style={{ padding: '2px 8px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10.5px' }}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'axis_combos') {
    return (
      <SubDialogShell
        title={`Axis Combinations — ${caps.machineName}`}
        width={440}
        onClose={onClose}
        onOk={() => {
          setMachineParams((p) => ({ ...p, axisCombo: localAxisCombo }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
            Available kinematic axis combinations for {caps.axesCount}-Axis controller ({caps.controller}):
          </div>
          {caps.supportedAxisCombos.map((combo) => (
            <label key={combo} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '5px 8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
              <input type="radio" checked={localAxisCombo === combo} onChange={() => setLocalAxisCombo(combo)} />
              <span>{combo}</span>
            </label>
          ))}
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'home_pos') {
    return (
      <SubDialogShell
        title="Home Position"
        width={340}
        onClose={onClose}
        onOk={() => {
          setMachineParams((p) => ({ ...p, homePosEnabled: true, homePos: localHomePos }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['x', 'y', 'z'].map((ax) => (
            <div key={ax} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: '8px' }}>
              <span style={{ textTransform: 'uppercase' }}>{ax} Home:</span>
              <input type="number" value={localHomePos[ax]} onChange={(e) => setLocalHomePos((p) => ({ ...p, [ax]: Number(e.target.value) }))} style={rowInput} />
            </div>
          ))}
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'rotary_axis') {
    return (
      <SubDialogShell
        title={`Rotary Axis Control (${caps.axesCount}-Axis)`}
        width={390}
        onClose={onClose}
        onOk={() => {
          setMachineParams((p) => ({ ...p, rotaryAxisMode: localRotaryMode, rotaryDiameter: localRotaryDiam }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {caps.rotaryModes.map((mode) => (
            <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="radio" checked={localRotaryMode === mode} onChange={() => setLocalRotaryMode(mode)} />
              <span>{mode}</span>
            </label>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span>Rotary Diameter (mm):</span>
            <input type="number" value={localRotaryDiam} onChange={(e) => setLocalRotaryDiam(Number(e.target.value))} style={rowInput} />
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'planes') {
    const planeChoices = ['Top', 'Front', 'Back', 'Left', 'Right', 'Bottom', 'Isometric'];
    return (
      <SubDialogShell
        title="Planes (WCS / Tool / Construction)"
        width={380}
        onClose={onClose}
        onOk={() => {
          setMachineParams((p) => ({ ...p, ...localPlanes }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { key: 'wcsPlane', label: 'Working coord system (WCS):' },
            { key: 'tplane', label: 'Tool plane (Tplane):' },
            { key: 'cplane', label: 'Construction plane (Cplane):' }
          ].map((item) => (
            <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '170px 1fr', alignItems: 'center', gap: '8px' }}>
              <span>{item.label}</span>
              <select value={localPlanes[item.key]} onChange={(e) => setLocalPlanes((p) => ({ ...p, [item.key]: e.target.value }))} style={{ padding: '4px', border: '1px solid #94a3b8' }}>
                {planeChoices.map((pc) => <option key={pc} value={pc}>{pc}</option>)}
              </select>
            </div>
          ))}
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'tool_display') {
    return (
      <SubDialogShell
        title="Toolpath Display Options"
        width={340}
        onClose={onClose}
        onOk={() => {
          setMachineParams((p) => ({ ...p, toolDisplayMode: localToolDisplay }));
          onClose();
        }}
      >
        {['Wireframe + Holder', 'Tool Centerline Only', 'Shaded Solid Cutter', 'Display Rapid Moves Only'].map((m) => (
          <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', cursor: 'pointer' }}>
            <input type="radio" checked={localToolDisplay === m} onChange={() => setLocalToolDisplay(m)} />
            <span>{m}</span>
          </label>
        ))}
      </SubDialogShell>
    );
  }

  if (dialog === 'ref_point') {
    return (
      <SubDialogShell
        title="Reference Point (Approach / Retract)"
        width={390}
        onClose={onClose}
        onOk={() => {
          setMachineParams((p) => ({
            ...p,
            refPointEnabled: true,
            refPointApproach: localRefPoint.approach,
            refPointRetract: localRefPoint.retract
          }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <strong>Approach Point (X / Y / Z):</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' }}>
              {['x', 'y', 'z'].map((ax) => (
                <input key={ax} type="number" value={localRefPoint.approach[ax]} onChange={(e) => setLocalRefPoint((p) => ({ ...p, approach: { ...p.approach, [ax]: Number(e.target.value) } }))} style={rowInput} />
              ))}
            </div>
          </div>
          <div>
            <strong>Retract Point (X / Y / Z):</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' }}>
              {['x', 'y', 'z'].map((ax) => (
                <input key={ax} type="number" value={localRefPoint.retract[ax]} onChange={(e) => setLocalRefPoint((p) => ({ ...p, retract: { ...p.retract, [ax]: Number(e.target.value) } }))} style={rowInput} />
              ))}
            </div>
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'canned_text') {
    return (
      <SubDialogShell
        title="Canned Text & M-Codes"
        width={390}
        onClose={onClose}
        onOk={() => {
          setMachineParams((p) => ({ ...p, cannedTextBefore: localCanned.before, cannedTextAfter: localCanned.after }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <div style={{ marginBottom: '3px' }}>Output before operation (e.g. M01 / M08):</div>
            <input type="text" value={localCanned.before} onChange={(e) => setLocalCanned((p) => ({ ...p, before: e.target.value }))} style={{ width: '100%', padding: '4px 6px', border: '1px solid #94a3b8', background: '#ffffff' }} />
          </div>
          <div>
            <div style={{ marginBottom: '3px' }}>Output after operation (e.g. M05 / M09):</div>
            <input type="text" value={localCanned.after} onChange={(e) => setLocalCanned((p) => ({ ...p, after: e.target.value }))} style={{ width: '100%', padding: '4px 6px', border: '1px solid #94a3b8', background: '#ffffff' }} />
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'total_tolerance') {
    return (
      <SubDialogShell
        title="Total Tolerance & Filter Settings"
        width={380}
        onClose={onClose}
        onOk={() => {
          setContourParams((p) => ({
            ...p,
            totalTolerance: localTol.totalTolerance,
            filterToleranceRatio: localTol.filterRatio,
            oneWayArcFilter: localTol.oneWayArcFilter
          }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Cut tolerance (mm):</span>
            <input type="number" step="0.005" value={localTol.totalTolerance} onChange={(e) => setLocalTol((p) => ({ ...p, totalTolerance: Number(e.target.value) }))} style={rowInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Filter ratio (0.1 - 0.9):</span>
            <input type="number" step="0.1" value={localTol.filterRatio} onChange={(e) => setLocalTol((p) => ({ ...p, filterRatio: Number(e.target.value) }))} style={rowInput} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={localTol.oneWayArcFilter} onChange={(e) => setLocalTol((p) => ({ ...p, oneWayArcFilter: e.target.checked }))} />
            <span>Create arcs in G17/G18/G19 filter output</span>
          </label>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'helix') {
    return (
      <SubDialogShell
        title="Helix Parameters"
        width={350}
        onClose={onClose}
        onOk={() => {
          setContourParams((p) => ({ ...p, helixEnabled: true, helixRadius: localHelix.radius, helixAngle: localHelix.angle }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Minimum helix radius:</span>
            <input type="number" step="0.5" value={localHelix.radius} onChange={(e) => setLocalHelix((p) => ({ ...p, radius: Number(e.target.value) }))} style={rowInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Plunge angle (deg):</span>
            <input type="number" step="0.5" value={localHelix.angle} onChange={(e) => setLocalHelix((p) => ({ ...p, angle: Number(e.target.value) }))} style={rowInput} />
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'shallow') {
    return (
      <SubDialogShell
        title="Shallow Slope Angle Limits"
        width={360}
        onClose={onClose}
        onOk={() => {
          setContourParams((p) => ({ ...p, shallowEnabled: true, shallowFromSlope: localShallow.fromSlope, shallowToSlope: localShallow.toSlope }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '145px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>From slope angle (deg):</span>
            <input type="number" step="1" value={localShallow.fromSlope} onChange={(e) => setLocalShallow((p) => ({ ...p, fromSlope: Number(e.target.value) }))} style={rowInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '145px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>To slope angle (deg):</span>
            <input type="number" step="1" value={localShallow.toSlope} onChange={(e) => setLocalShallow((p) => ({ ...p, toSlope: Number(e.target.value) }))} style={rowInput} />
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'flats') {
    return (
      <SubDialogShell
        title="Flatland Options"
        width={340}
        onClose={onClose}
        onOk={() => {
          setContourParams((p) => ({ ...p, flatsEnabled: true, flatsExtendToStock: localFlats.extendToStock }));
          onClose();
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input type="checkbox" checked={localFlats.extendToStock} onChange={(e) => setLocalFlats({ extendToStock: e.target.checked })} />
          <span>Machine horizontal flat areas to boundary</span>
        </label>
      </SubDialogShell>
    );
  }

  if (dialog === 'cut_depths') {
    return (
      <SubDialogShell
        title="Cut Depths"
        width={370}
        onClose={onClose}
        onOk={() => {
          setContourParams((p) => ({
            ...p,
            cutDepthsMode: localCutDepths.mode,
            minDepth: localCutDepths.minDepth,
            maxDepth: localCutDepths.maxDepth
          }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Adjustment mode:</span>
            <select value={localCutDepths.mode} onChange={(e) => setLocalCutDepths((p) => ({ ...p, mode: e.target.value }))} style={{ padding: '4px', border: '1px solid #94a3b8' }}>
              <option value="Incremental">Incremental</option>
              <option value="Absolute">Absolute</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Minimum depth (Z):</span>
            <input type="number" step="0.5" value={localCutDepths.minDepth} onChange={(e) => setLocalCutDepths((p) => ({ ...p, minDepth: Number(e.target.value) }))} style={rowInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px' }}>
            <span>Maximum depth (Z):</span>
            <input type="number" step="0.5" value={localCutDepths.maxDepth} onChange={(e) => setLocalCutDepths((p) => ({ ...p, maxDepth: Number(e.target.value) }))} style={rowInput} />
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'gap_settings') {
    return (
      <SubDialogShell
        title="Gap Settings"
        width={380}
        onClose={onClose}
        onOk={() => {
          setContourParams((p) => ({ ...p, gapSettingsMode: localGaps.mode, maxGapDistance: localGaps.maxDist }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Direct', 'Follow surfaces', 'Follow check surfaces', 'High speed'].map((gm) => (
            <label key={gm} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="radio" checked={localGaps.mode === gm} onChange={() => setLocalGaps((p) => ({ ...p, mode: gm }))} />
              <span>{gm}</span>
            </label>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span>Gap distance limit (mm):</span>
            <input type="number" step="0.5" value={localGaps.maxDist} onChange={(e) => setLocalGaps((p) => ({ ...p, maxDist: Number(e.target.value) }))} style={rowInput} />
          </div>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'advanced_settings') {
    return (
      <SubDialogShell
        title={`Advanced Settings — ${caps.axesCount}-Axis (${caps.controller})`}
        width={430}
        onClose={onClose}
        onOk={() => {
          setContourParams((p) => ({
            ...p,
            advancedToolAxis: localAdvanced.toolAxis,
            advancedCollisionCheck: localAdvanced.collisionCheck
          }));
          onClose();
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: '#475569' }}>
            Tool Axis &amp; Collision Mode for {caps.machineName}:
          </div>
          {caps.multiAxisOptions.map((opt) => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input type="radio" checked={localAdvanced.toolAxis === opt} onChange={() => setLocalAdvanced((p) => ({ ...p, toolAxis: opt }))} />
              <span>{opt}</span>
            </label>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '4px 0' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input type="checkbox" checked={localAdvanced.collisionCheck} onChange={(e) => setLocalAdvanced((p) => ({ ...p, collisionCheck: e.target.checked }))} />
            <span>Check holder &amp; arbor gouging against check surfaces</span>
          </label>
        </div>
      </SubDialogShell>
    );
  }

  if (dialog === 'direction_vector') {
    return (
      <SubDialogShell
        title="Surface Cut Direction"
        width={340}
        onClose={onClose}
        onOk={() => {
          setSurfaceParams((p) => ({ ...p, directionEnabled: true, cutDirectionMode: localDirection }));
          onClose();
        }}
      >
        {['Normal', 'Flip Surface Normal', 'Tangent U', 'Tangent V'].map((d) => (
          <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', cursor: 'pointer' }}>
            <input type="radio" checked={localDirection === d} onChange={() => setLocalDirection(d)} />
            <span>{d}</span>
          </label>
        ))}
      </SubDialogShell>
    );
  }

  if (dialog === 'select_surfaces') {
    return (
      <SubDialogShell title="Select Drive / Check Surfaces" width={460} onClose={onClose}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Layers size={14} color="#0284c7" />
            Drive Surfaces ({selectedSurfaceIds.length} / {detectedSurfaces.length})
          </span>
          <button
            type="button"
            onClick={() => setSelectedSurfaceIds(detectedSurfaces.map((s) => s.id))}
            style={{ padding: '2px 8px', background: '#ffffff', border: '1px solid #94a3b8', cursor: 'pointer', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RotateCcw size={11} /> Select All
          </button>
        </div>
        <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #94a3b8', background: '#ffffff', padding: '4px' }}>
          {detectedSurfaces.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No 3D surface entities in workspace (using active stock/part bounds).</div>
          ) : (
            detectedSurfaces.map((s) => {
              const checked = selectedSurfaceIds.includes(s.id);
              return (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedSurfaceIds((prev) =>
                          prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        )
                      }
                    />
                    <span style={{ fontWeight: checked ? 600 : 400 }}>{s.name}</span>
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Height: {s.height.toFixed(1)} mm</span>
                </label>
              );
            })
          )}
        </div>
      </SubDialogShell>
    );
  }

  return null;
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  Unlock,
  ChevronDown,
  MousePointer2,
  Settings,
  CheckSquare,
  RefreshCw,
  FlipHorizontal2,
  X,
  Trash2,
  EyeOff,
  Layers,
  Move3d,
  Check
} from 'lucide-react';

/**
 * Custom Mastercam-style crisp SVG icons for the 7 Selection Methods & Solid/Containment filters
 */
function MethodIcon({ method, size = 15 }) {
  const stroke = 'currentColor';
  switch (method) {
    case 'automatic':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <rect x="2.5" y="2.5" width="9" height="8" stroke={stroke} strokeWidth="1.2" strokeDasharray="2 1.5" />
          <path d="M8 7L15 11.5L11.8 12.4L10.8 15.5L8 7Z" fill="currentColor" />
        </svg>
      );
    case 'chain':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <path d="M7.2 10.8L10.8 7.2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5.5 14.2C4.1 14.2 3 13.1 3 11.7C3 11 3.3 10.3 3.8 9.9L5.8 7.9C6.8 6.9 8.4 6.9 9.4 7.9" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12.5 3.8C13.9 3.8 15 4.9 15 6.3C15 7 14.7 7.7 14.2 8.1L12.2 10.1C11.2 11.1 9.6 11.1 8.6 10.1" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'window':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <rect x="2.5" y="4" width="13" height="10" stroke={stroke} strokeWidth="1.4" strokeDasharray="2.2 1.5" />
        </svg>
      );
    case 'polygon':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <polygon points="9,2.5 15.5,6.5 13.5,14.5 5,14.5 2.5,7.5" stroke={stroke} strokeWidth="1.4" strokeDasharray="2.2 1.4" fill="none" />
        </svg>
      );
    case 'single':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <line x1="3.5" y1="14.5" x2="14.5" y2="3.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'area':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <rect x="2.5" y="3.5" width="13" height="11" stroke={stroke} strokeWidth="1.4" />
          <path d="M9 6.5V11.5M6.5 9H11.5" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'vector':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
          <line x1="3.5" y1="14.5" x2="14.5" y2="3.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="10.5,3.5 14.5,3.5 14.5,7.5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="7.5,14.5 3.5,14.5 3.5,10.5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function SolidFilterIcon({ mode, active }) {
  const accent = active ? '#2563eb' : '#d97706';
  const fillFace = active ? '#bfdbfe' : '#fde68a';
  const sideFace = active ? '#93c5fd' : '#fcd34d';
  switch (mode) {
    case 'wireframe':
      return (
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <polygon points="9,2.5 15,5.8 15,12.2 9,15.5 3,12.2 3,5.8" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
          <path d="M3 5.8L9 9L15 5.8M9 9V15.5" stroke="#94a3b8" strokeWidth="1.1" />
          <circle cx="9" cy="12" r="2.2" fill={active ? '#0284c7' : '#10b981'} />
        </svg>
      );
    case 'solid_edge':
      return (
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <polygon points="9,2.5 15,5.8 15,12.2 9,15.5 3,12.2 3,5.8" fill={fillFace} stroke="#92400e" strokeWidth="1" />
          <line x1="9" y1="9" x2="15" y2="5.8" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
          <line x1="9" y1="9" x2="9" y2="15.5" stroke="#b45309" strokeWidth="1.1" />
        </svg>
      );
    case 'solid_face':
      return (
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <polygon points="9,2.5 15,5.8 9,9 3,5.8" fill={fillFace} stroke="#92400e" strokeWidth="1" />
          <polygon points="3,5.8 9,9 9,15.5 3,12.2" fill={sideFace} stroke="#92400e" strokeWidth="1" />
          <polygon points="9,9 15,5.8 15,12.2 9,15.5" fill={active ? '#3b82f6' : '#60a5fa'} stroke="#1d4ed8" strokeWidth="1.1" />
        </svg>
      );
    case 'solid_body':
      return (
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <polygon points="9,2.5 15,5.8 15,12.2 9,15.5 3,12.2 3,5.8" fill={active ? '#60a5fa' : '#93c5fd'} stroke="#1e40af" strokeWidth="1.2" />
          <path d="M3 5.8L9 9L15 5.8M9 9V15.5" stroke="#1e40af" strokeWidth="1.1" />
        </svg>
      );
    default:
      return (
        <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
          <polygon points="9,2.5 15,5.8 15,12.2 9,15.5 3,12.2 3,5.8" fill={fillFace} stroke="#b45309" strokeWidth="1.1" />
          <path d="M3 5.8L9 9L15 5.8M9 9V15.5" stroke="#b45309" strokeWidth="1.1" />
          <circle cx="9" cy="11.8" r="2.1" fill="#059669" />
        </svg>
      );
  }
}

const SELECTION_METHOD_LIST = [
  { id: 'automatic', label: 'Automatic', title: 'Automatic — Click single/chain; L→R Window; R→L Crossing' },
  { id: 'chain', label: 'Chain', title: 'Chain — Trace connected wireframe entities automatically' },
  { id: 'window', label: 'Window', title: 'Window — Drag marquee using Containment rule' },
  { id: 'polygon', label: 'Polygon', title: 'Polygon — Click vertices (Double-click / Enter to close)' },
  { id: 'single', label: 'Single', title: 'Single — Select individual entity only' },
  { id: 'area', label: 'Area', title: 'Area — Click inside closed contour or pocket boundary' },
  { id: 'vector', label: 'Vector', title: 'Vector — Draw a ray segment across entities to select' }
];

const CONTAINMENT_MODES = [
  { id: 'inside', short: 'In', label: 'Inside', title: 'Inside — Entirely enclosed within boundary' },
  { id: 'in_cross', short: 'C+', label: 'In + Crossing', title: 'Inside + Crossing — Enclosed or crossing boundary' },
  { id: 'crossing_strict', short: 'Cr', label: 'Crossing', title: 'Crossing — Touching or straddling boundary edge' },
  { id: 'outside', short: 'Out', label: 'Outside', title: 'Outside — Completely outside boundary' }
];

const SNAP_OPTIONS = [
  { id: 'auto', label: 'AutoCursor', title: 'Automatic Smart Snapping' },
  { id: 'origin', label: 'Origin', title: 'Snap to WCS Origin (0, 0, 0)' },
  { id: 'center', label: 'Arc Center', title: 'Snap to Arc / Circle Center' },
  { id: 'endpoint', label: 'Endpoint', title: 'Snap to Entity Endpoint / Corner' },
  { id: 'midpoint', label: 'Midpoint', title: 'Snap to Line / Edge Midpoint' },
  { id: 'point', label: 'Point', title: 'Snap to Point / Drill Marker' },
  { id: 'intersection', label: 'Intersection', title: 'Snap to Wireframe Intersection' },
  { id: 'quadrant', label: 'Quadrant', title: 'Snap to Circle Quadrant (0/90/180/270)' },
  { id: 'tangent', label: 'Tangent', title: 'Snap Tangent to Arc' },
  { id: 'perpendicular', label: 'Perpendicular', title: 'Snap Perpendicular' }
];

/**
 * Unified Mastercam Floating AutoCursor & Selection Methods Pill (Top-Center Viewport HUD)
 */
export default function AutoCursorBar({
  snapMode = 'auto',
  onSelectSnapMode,
  isLocked = false,
  onToggleLock,
  onFastPointSubmit,
  cursorCoords = { x: 0, y: 0, z: 0 },
  selectionMethod = 'automatic',
  onChangeSelectionMethod,
  containmentMode = 'in_cross',
  onChangeContainmentMode,
  solidFilterMode = 'all',
  onChangeSolidFilterMode,
  isSelectModeActive = false,
  onToggleSelectMode,
  stickyMultiSelect = false,
  onToggleStickyMultiSelect,
  selectedCount = 0,
  polygonPointCount = 0,
  onCompletePolygon,
  onCancelInteractiveSelection,
  onSelectAll,
  onReselectPrevious,
  onInvertSelection,
  onClearSelection,
  onExtrudeSelection,
  onTransformSelection,
  onBlankSelection,
  onDeleteSelection,
  theme = 'light'
}) {
  const [openMenu, setOpenMenu] = useState(null); // 'autocursor' | 'xyz' | 'settings' | 'method' | 'containment' | null
  const [xyzInput, setXyzInput] = useState({ x: '0', y: '0', z: '0' });
  const barRef = useRef(null);
  const isLight = theme !== 'dark';

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleMenu = (name) => {
    if (name === 'xyz' && openMenu !== 'xyz') {
      setXyzInput({
        x: Number(cursorCoords?.x || 0).toFixed(2),
        y: Number(cursorCoords?.y || 0).toFixed(2),
        z: Number(cursorCoords?.z || 0).toFixed(2)
      });
    }
    setOpenMenu((prev) => (prev === name ? null : name));
  };

  const activeSnap = SNAP_OPTIONS.find((s) => s.id === snapMode) || SNAP_OPTIONS[0];
  const activeContainment = CONTAINMENT_MODES.find((c) => c.id === containmentMode) || CONTAINMENT_MODES[1];
  const activeMethod = SELECTION_METHOD_LIST.find((m) => m.id === selectionMethod) || SELECTION_METHOD_LIST[0];

  const interactiveHint =
    selectionMethod === 'polygon'
      ? `Polygon: ${polygonPointCount} pt${polygonPointCount === 1 ? '' : 's'} — Click vertices, Double-click / Enter to select`
      : selectionMethod === 'vector'
        ? 'Vector: Drag (or click 2 points) across shapes to select'
        : selectionMethod === 'area'
          ? 'Area: Click inside any closed shape or chain loop'
          : selectionMethod === 'chain'
            ? 'Chain: Click any wireframe edge to select connected loop'
            : null;

  return (
    <div
      ref={barRef}
      className="autocursor-pill-wrapper"
      data-testid="canvas-selection-hud"
    >
      {/* Main Floating Mastercam AutoCursor + Selection Methods Pill */}
      <div className={`autocursor-hud-bar ${isLight ? 'is-light' : 'is-dark'}`}>
        {/* 1. Snap Lock */}
        <button
          type="button"
          onClick={onToggleLock}
          title={isLocked ? 'AutoCursor Snap Locked' : 'Lock AutoCursor Snap'}
          className={`pill-icon-btn ${isLocked ? 'is-danger-active' : ''}`}
        >
          {isLocked ? <Lock size={12} strokeWidth={2.2} /> : <Unlock size={12} strokeWidth={1.9} />}
        </button>

        {/* 2. AutoCursor Snap Dropdown */}
        <div className="pill-popover-anchor">
          <button
            type="button"
            onClick={() => toggleMenu('autocursor')}
            title={`AutoCursor Mode: ${activeSnap.label}`}
            className={`pill-text-btn ${openMenu === 'autocursor' ? 'is-open' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="10" height="8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5" />
              <path d="M8 7L15 11.5L11.8 12.4L10.8 15.5L8 7Z" fill="currentColor" />
            </svg>
            <span>{activeSnap.id === 'auto' ? 'AutoCursor' : activeSnap.label}</span>
            <ChevronDown size={11} />
          </button>

          {openMenu === 'autocursor' && (
            <div className="pill-dropdown-menu" style={{ minWidth: '175px' }}>
              {SNAP_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectSnapMode?.(opt.id);
                    setOpenMenu(null);
                  }}
                  title={opt.title}
                  className={`pill-dropdown-item ${snapMode === opt.id ? 'is-selected' : ''}`}
                >
                  <span>{opt.label}</span>
                  {snapMode === opt.id && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Fast Point X,Y,Z */}
        <div className="pill-popover-anchor">
          <button
            type="button"
            onClick={() => toggleMenu('xyz')}
            title="Fast Point (Enter exact X, Y, Z coordinates)"
            className={`pill-xyz-btn ${openMenu === 'xyz' ? 'is-open' : ''}`}
          >
            <span className="xyz-plus">+</span>
            <span className="xyz-label">X,Y,Z</span>
          </button>

          {openMenu === 'xyz' && (
            <div className="pill-dropdown-menu pill-xyz-popover">
              <div className="pill-popover-title">Fast Point Coordinate</div>
              <div className="xyz-grid">
                {['x', 'y', 'z'].map((axis) => (
                  <label key={axis} className="xyz-field">
                    <span>{axis.toUpperCase()}</span>
                    <input
                      type="number"
                      step="0.5"
                      value={xyzInput[axis]}
                      onChange={(e) => setXyzInput((prev) => ({ ...prev, [axis]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onFastPointSubmit?.(xyzInput);
                          setOpenMenu(null);
                        }
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className="xyz-actions">
                <button
                  type="button"
                  className="pill-apply-btn"
                  onClick={() => {
                    onFastPointSubmit?.(xyzInput);
                    setOpenMenu(null);
                  }}
                >
                  Apply Point
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. AutoCursor Config */}
        <div className="pill-popover-anchor">
          <button
            type="button"
            onClick={() => toggleMenu('settings')}
            title="AutoCursor & Selection Options"
            className={`pill-icon-btn ${openMenu === 'settings' ? 'is-open' : ''}`}
          >
            <Settings size={13} color="#d97706" />
          </button>
          {openMenu === 'settings' && (
            <div className="pill-dropdown-menu" style={{ minWidth: '190px', padding: '8px' }}>
              <div className="pill-popover-title">Selection Settings</div>
              <label className="pill-check-row">
                <input
                  type="checkbox"
                  checked={stickyMultiSelect}
                  onChange={() => onToggleStickyMultiSelect?.()}
                />
                <span>Sticky Multi-Select Mode</span>
              </label>
              <label className="pill-check-row">
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={() => onToggleLock?.()}
                />
                <span>Lock Active Snap ({activeSnap.label})</span>
              </label>
            </div>
          )}
        </div>

        <div className="pill-divider" />

        {/* 5. Interactive Selection Cursor Toggle */}
        <button
          type="button"
          onClick={() => onToggleSelectMode?.(!isSelectModeActive)}
          title={isSelectModeActive ? 'Active Canvas Selection (Esc to return)' : 'Activate Canvas Selection Tool (V)'}
          className={`pill-icon-btn ${isSelectModeActive ? 'is-primary-active' : ''}`}
        >
          <MousePointer2 size={13} strokeWidth={2.1} />
        </button>

        {/* 6. Mastercam Entity / Solid Topology Filters */}
        {[
          { id: 'all', title: 'Select All Geometry Types' },
          { id: 'wireframe', title: 'Filter Wireframe Curves Only' },
          { id: 'solid_edge', title: 'Filter Edges & Curves' },
          { id: 'solid_face', title: 'Filter Surface / Solid Faces' },
          { id: 'solid_body', title: 'Filter Complete Bodies / Solids' }
        ].map((flt) => (
          <button
            key={flt.id}
            type="button"
            onClick={() => onChangeSolidFilterMode?.(solidFilterMode === flt.id && flt.id !== 'all' ? 'all' : flt.id)}
            title={flt.title}
            className={`pill-icon-btn ${solidFilterMode === flt.id ? 'is-filter-active' : ''}`}
          >
            <SolidFilterIcon mode={flt.id} active={solidFilterMode === flt.id} />
          </button>
        ))}

        {/* 7. Mastercam Selection Method Split Dropdown (Automatic, Chain, Window, Polygon, Single, Area, Vector) */}
        <div className="pill-popover-anchor">
          <button
            type="button"
            data-testid="selection-method-trigger"
            onClick={() => toggleMenu('method')}
            title={`Selection Method: ${activeMethod.label} (Click to choose Automatic, Chain, Window, Polygon, Single, Area, Vector)`}
            className={`pill-split-btn ${openMenu === 'method' || selectionMethod !== 'automatic' ? 'is-highlight-blue' : ''}`}
          >
            <MethodIcon method={selectionMethod} size={15} />
            <ChevronDown size={11} />
          </button>

          {openMenu === 'method' && (
            <div className="pill-dropdown-menu selection-method-menu" data-testid="selection-method-menu">
              {SELECTION_METHOD_LIST.map((m) => {
                const isSelected = selectionMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    data-testid={`selection-method-option-${m.id}`}
                    onClick={() => {
                      onChangeSelectionMethod?.(m.id);
                      if (!isSelectModeActive) onToggleSelectMode?.(true);
                      setOpenMenu(null);
                    }}
                    title={m.title}
                    className={`pill-method-item ${isSelected ? 'is-selected' : ''}`}
                  >
                    <span className="pill-method-icon">
                      <MethodIcon method={m.id} size={16} />
                    </span>
                    <span className="pill-method-label">{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. Containment Mode Split Dropdown (Inside, In+Crossing, Crossing, Outside) */}
        <div className="pill-popover-anchor">
          <button
            type="button"
            data-testid="containment-mode-trigger"
            onClick={() => toggleMenu('containment')}
            title={`Window/Polygon Containment: ${activeContainment.label}`}
            className={`pill-split-btn ${openMenu === 'containment' ? 'is-highlight-amber' : ''}`}
          >
            <span className={`containment-badge mode-${containmentMode}`} />
            <ChevronDown size={11} />
          </button>

          {openMenu === 'containment' && (
            <div className="pill-dropdown-menu" style={{ minWidth: '155px' }}>
              {CONTAINMENT_MODES.map((cm) => (
                <button
                  key={cm.id}
                  type="button"
                  data-testid={`containment-option-${cm.id}`}
                  onClick={() => {
                    onChangeContainmentMode?.(cm.id);
                    setOpenMenu(null);
                  }}
                  title={cm.title}
                  className={`pill-method-item ${containmentMode === cm.id ? 'is-selected' : ''}`}
                >
                  <span className={`containment-badge mode-${cm.id}`} />
                  <span className="pill-method-label">{cm.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 9. Sticky Multi-Select Lock Toggle */}
        <button
          type="button"
          onClick={onToggleStickyMultiSelect}
          title={stickyMultiSelect ? 'Sticky Multi-Selection ON (clicks add to selection)' : 'Toggle Additive Multi-Selection'}
          className={`pill-icon-btn ${stickyMultiSelect ? 'is-primary-active' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="9" cy="9" r="2" fill="currentColor" />
          </svg>
        </button>

        {/* 10. Select All / Reselect / Invert */}
        <button
          type="button"
          onClick={onSelectAll}
          title="Select All Visible Entities (respects Quick Mask)"
          className="pill-icon-btn"
        >
          <CheckSquare size={13} color="#d97706" />
        </button>

        <button
          type="button"
          onClick={onReselectPrevious}
          title="Reselect Previous Selection"
          className="pill-icon-btn"
        >
          <RefreshCw size={12.5} />
        </button>

        <button
          type="button"
          onClick={onInvertSelection}
          title="Invert Current Selection"
          className="pill-icon-btn"
        >
          <FlipHorizontal2 size={13} color="#0284c7" />
        </button>
      </div>

      {/* Attached Slim Contextual Bar when entities are selected OR Polygon/Vector/Area guidance is active */}
      {(selectedCount > 0 || interactiveHint) && (
        <div className={`autocursor-context-strip ${isLight ? 'is-light' : 'is-dark'}`}>
          {selectedCount > 0 ? (
            <>
              <span className="ctx-badge">{selectedCount} Selected</span>
              {onExtrudeSelection && (
                <button type="button" className="ctx-btn is-accent" onClick={onExtrudeSelection} title="Extrude Selected Contour(s)">
                  <Layers size={11} /> Extrude
                </button>
              )}
              {onTransformSelection && (
                <button type="button" className="ctx-btn" onClick={onTransformSelection} title="Move / Rotate / Copy Selected">
                  <Move3d size={11} /> Transform
                </button>
              )}
              {onBlankSelection && (
                <button type="button" className="ctx-btn" onClick={onBlankSelection} title="Hide Selected Entities">
                  <EyeOff size={11} /> Blank
                </button>
              )}
              {onDeleteSelection && (
                <button type="button" className="ctx-btn is-danger" onClick={onDeleteSelection} title="Delete Selected Entities (Del)">
                  <Trash2 size={11} /> Delete
                </button>
              )}
              {onClearSelection && (
                <button type="button" className="ctx-btn" onClick={onClearSelection} title="Clear Selection (Esc)">
                  <X size={11} /> Clear
                </button>
              )}
            </>
          ) : (
            <>
              <span className="ctx-hint">{interactiveHint}</span>
              {selectionMethod === 'polygon' && polygonPointCount >= 3 && (
                <button type="button" className="ctx-btn is-accent" onClick={onCompletePolygon}>
                  <Check size={11} /> Finish Polygon
                </button>
              )}
              {selectionMethod === 'polygon' && polygonPointCount > 0 && (
                <button type="button" className="ctx-btn is-danger" onClick={onCancelInteractiveSelection}>
                  <X size={11} /> Cancel
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

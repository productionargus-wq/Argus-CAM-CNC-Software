import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare, Square, Eye, RefreshCw, 
  Trash2, Lock, FileCode, PlusCircle, ChevronDown, ChevronRight, Sliders,
  Layers, Box, Compass, Check, Plus, Play, Sparkles, HelpCircle,
  Scissors, ArrowUp, ArrowDown, RotateCcw, ArrowUpDown, Crosshair,
  Wrench, CircleDot, Circle, Clock, Search, Ghost
} from 'lucide-react';
import ToolpathsContextMenu from './ToolpathsContextMenu';

export default function OperationsTree({
  operations = [],
  onToggleOp,
  activeOpId,
  onSelectOp,
  onEditOp,
  onAddOp,
  onRegenerate,
  onOpenStockModal,
  onStartBackplot,
  onStartVerify,
  onOpenAFR = null,
  activeManagerTab = 'Toolpaths',
  onSelectManagerTab,
  levels = [],
  onToggleLevel,
  activeLevelId = 1,
  onSetActiveLevel,
  onAddLevel,
  planes = [],
  activePlane = 'Top (G17)',
  onSelectPlane,
  onOpenCPlanesModal,
  onDeletePlane,
  solids = [],
  activeSolidId,
  onSelectSolid,
  onToggleSolidVisibility,
  onOpenSolidsModal,
  activeMachine = { name: '4 - AXIS VMC', controller: 'Haas_VF2.mcam-control' },
  stockConfig = { dimensions: { x: 120, y: 80, z: 25 } },
  currentProjectName = 'Base Structure-ALU.mcam',
  onOpenPostModal,
  onOpenToolManager,
  onOpenHSMFilter,
  onOpenHelpGuide,
  onOpenWireframeModal,
  onOpenMachineConfig,
  onOpenFeedsSpeeds,
  onMoveOpUp,
  onMoveOpDown,
  onDeleteOp,
  onToggleLockOp,
  onToggleGhostOp,
  onSortOps,
  recentFunctions = [],
  onRunRecentFunction,
  onCopyOp,
  onCutOp,
  onPasteOp,
  canPaste = false,
  onOpenFiveAxisStudio,
  onOpenThreadStudio,
  onOpenLatheStudio,
  onOpenTransformModal,
  onOpenNestingStudio,
  onOpenProbingStudio,
  onOpenSetupSheet,
  onOpenSurfaceFinishContour,
  onExportStockSTL
}) {
  const [localTab, setLocalTab] = useState(activeManagerTab);
  const currentTab = activeManagerTab || localTab;

  const handleTabClick = (tab) => {
    setLocalTab(tab);
    if (onSelectManagerTab) onSelectManagerTab(tab);
  };

  // Tree Expansion States
  const [machineGroupExpanded, setMachineGroupExpanded] = useState(true);
  const [propertiesExpanded, setPropertiesExpanded] = useState(false);
  const [toolpathGroupExpanded, setToolpathGroupExpanded] = useState(true);
  const [expandedOps, setExpandedOps] = useState(() => {
    const map = {};
    operations.forEach((op) => { map[op.id] = true; });
    return map;
  });

  // Red Insertion Arrow Position (index in operations array)
  const [insertIndex, setInsertIndex] = useState(operations.length);

  // Mouse-Resizable Sidebar Width State
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('mastercam_sidebar_width');
      const parsed = saved ? parseInt(saved, 10) : 320;
      return !isNaN(parsed) && parsed >= 220 && parsed <= 850 ? parsed : 320;
    } catch {
      return 320;
    }
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWindowMenuOpen, setIsWindowMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 220), Math.min(window.innerWidth * 0.7, 850));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        try {
          localStorage.setItem('mastercam_sidebar_width', sidebarWidth.toString());
        } catch {
          // ignore
        }
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

  // Recent Functions Search Filter
  const [recentSearch, setRecentSearch] = useState('');

  // Toggle individual operation expand/collapse
  const toggleOpExpand = (opId) => {
    setExpandedOps((prev) => ({
      ...prev,
      [opId]: !prev[opId]
    }));
  };

  // Expand / Collapse all operations
  const handleExpandAll = () => {
    setMachineGroupExpanded(true);
    setPropertiesExpanded(true);
    setToolpathGroupExpanded(true);
    const map = {};
    operations.forEach((op) => { map[op.id] = true; });
    setExpandedOps(map);
  };

  const handleCollapseAll = () => {
    setPropertiesExpanded(false);
    const map = {};
    operations.forEach((op) => { map[op.id] = false; });
    setExpandedOps(map);
  };

  // Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetOp: null
  });

  const handleContextMenu = (e, op = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (op && op.id) {
      onSelectOp(op.id);
    }
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetOp: op || operations.find((o) => o.id === activeOpId) || null
    });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Tabs matching Mastercam screenshot
  const tabs = ['Toolpaths', 'Planes', 'Solids', 'Levels'];

  const displayPlanes = planes && planes.length > 0 ? planes : [
    { id: 'plane_top', name: 'Top (G17)', code: 'G17', desc: 'Spindle along Z, XY Table', isStandard: true, wcsCode: 'G54' },
    { id: 'plane_front', name: 'Front (G18)', code: 'G18', desc: 'Spindle along Y, XZ Plane', isStandard: true, wcsCode: 'G54' },
    { id: 'plane_right', name: 'Right (G19)', code: 'G19', desc: 'Spindle along X, YZ Plane', isStandard: true, wcsCode: 'G54' },
    { id: 'plane_bottom', name: 'Bottom (G17-B)', code: 'G17-B', desc: 'Inverted Sub-Spindle Second Op', isStandard: true, wcsCode: 'G55' },
    { id: 'plane_iso', name: 'Isometric (WCS G54)', code: 'G54', desc: '3D Compound Isometric Reference', isStandard: true, wcsCode: 'G54' }
  ];

  // Fallback default recent functions list if none provided
  const defaultRecent = useMemo(() => [
    { id: 'rf_rect', name: 'Rectangle (Wireframe)', category: 'CAD Drawing', icon: Square, action: 'sketch_rect', time: 'Just now' },
    { id: 'rf_dyn_pocket', name: 'Surface Rough Pocket', category: '2D Mill', icon: Layers, action: 'op_pocket', time: '2m ago' },
    { id: 'rf_drill', name: 'Drilling Cycle (G83 Deep)', category: 'Holemaking', icon: CircleDot, action: 'op_drill', time: '5m ago' },
    { id: 'rf_circle', name: 'Circle Center Point', category: 'CAD Drawing', icon: Circle, action: 'sketch_circle', time: '8m ago' },
    { id: 'rf_backplot', name: '3D Wireframe Backplot', category: 'Simulation', icon: Play, action: 'backplot', time: '12m ago' },
    { id: 'rf_post', name: 'Post Process (G1)', category: 'NC Output', icon: FileCode, action: 'post_g1', time: '15m ago' },
    { id: 'rf_stock', name: 'Stock Setup Bounding Box', category: 'Job Setup', icon: Box, action: 'stock_setup', time: '18m ago' },
    { id: 'rf_contour', name: '2D Contour Profile', category: '2D Mill', icon: Scissors, action: 'op_contour', time: '22m ago' },
    { id: 'rf_tools', name: 'Tool Manager & Assembly', category: 'Tooling', icon: Wrench, action: 'tool_manager', time: '30m ago' }
  ], []);

  const activeRecentList = recentFunctions && recentFunctions.length > 0 ? recentFunctions : defaultRecent;
  const filteredRecent = activeRecentList.filter((rf) =>
    rf.name.toLowerCase().includes(recentSearch.toLowerCase()) ||
    rf.category.toLowerCase().includes(recentSearch.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <aside
        style={{
          width: '28px',
          flexShrink: 0,
          background: '#f1f5f9',
          borderRight: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '8px',
          gap: '12px',
          cursor: 'pointer',
          zIndex: 40
        }}
        onClick={() => setIsCollapsed(false)}
        title="Click to restore Toolpaths Manager"
      >
        <span style={{ fontSize: '11px', transform: 'rotate(90deg)', whiteSpace: 'nowrap', fontWeight: 600, color: '#0284c7', marginTop: '30px' }}>
          Toolpaths
        </span>
        <span style={{ fontSize: '12px', color: '#64748b', marginTop: 'auto', marginBottom: '12px' }} title="Restore Panel">
          ▶
        </span>
      </aside>
    );
  }

  return (
    <aside
      className="ops-manager"
      ref={sidebarRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: `${sidebarWidth}px`,
        minWidth: '220px',
        maxWidth: '850px',
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderRight: isResizing ? '2px solid #0284c7' : '1px solid #cbd5e1',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#1e293b',
        userSelect: 'none',
        overflow: 'hidden',
        position: 'relative',
        transition: isResizing ? 'none' : 'width 0.05s ease'
      }}
      aria-label="Mastercam Toolpaths Manager"
    >
      {/* ================= 1. MASTERCAM PANEL HEADER ================= */}
      <div
        style={{
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          borderBottom: '1px solid #cbd5e1',
          background: '#f1f5f9',
          position: 'relative'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
          {currentTab === 'Toolpaths' && 'Toolpaths'}
          {currentTab === 'Solids' && 'Solids'}
          {currentTab === 'Planes' && 'Planes'}
          {currentTab === 'Levels' && 'Levels'}
          {currentTab === 'Recent Functions' && 'Recent Functions'}
        </span>

        {/* Mastercam window mini controls: drop arrow, pushpin, close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '11px' }}>
          <span
            onClick={() => setIsWindowMenuOpen((prev) => !prev)}
            style={{ cursor: 'pointer', padding: '0 2px' }}
            title="Window Options"
          >
            ▾
          </span>
          <span
            onClick={() => setIsPinned((prev) => !prev)}
            style={{
              cursor: 'pointer',
              padding: '0 2px',
              transform: isPinned ? 'rotate(45deg)' : 'rotate(0deg)',
              color: isPinned ? '#0284c7' : '#94a3b8'
            }}
            title={isPinned ? "Pinned (Click to Unpin)" : "Unpinned (Click to Pin)"}
          >
            📌
          </span>
          <span
            onClick={() => setIsCollapsed(true)}
            style={{ cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}
            title="Close / Collapse Panel"
          >
            ✕
          </span>
        </div>

        {/* Window Options Dropdown Menu */}
        {isWindowMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '26px',
              right: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '3px',
              zIndex: 1000,
              minWidth: '150px',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              onClick={() => { setIsPinned(true); setIsWindowMenuOpen(false); }}
              style={{ padding: '6px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>Dock Left</span>
              {isPinned && <span style={{ color: '#0284c7' }}>✓</span>}
            </div>
            <div
              onClick={() => { setSidebarWidth(320); setIsWindowMenuOpen(false); }}
              style={{ padding: '6px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
            >
              Reset Width (320px)
            </div>
            <div
              onClick={() => { setIsCollapsed(true); setIsWindowMenuOpen(false); }}
              style={{ padding: '6px 12px', cursor: 'pointer', color: '#dc2626' }}
            >
              Collapse Panel
            </div>
          </div>
        )}
      </div>

      {/* ================= 1b. TOP TABS (MATCHING SCREENSHOT) ================= */}
      <div
        style={{
          height: '24px',
          background: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          borderBottom: '1px solid #cbd5e1',
          padding: '0 4px',
          gap: '2px'
        }}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              style={{
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0f172a' : '#64748b',
                fontWeight: isActive ? 600 : 400,
                fontSize: '11px',
                border: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
                borderBottom: isActive ? '1px solid #ffffff' : '1px solid transparent',
                borderRadius: '3px 3px 0 0',
                padding: '2px 7px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                position: 'relative',
                top: '1px'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ================= 2. MASTERCAM 2-ROW ACTION TOOLBAR (ONLY ON TOOLPATHS TAB) ================= */}
      {currentTab === 'Toolpaths' && (
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '1px solid #cbd5e1',
            padding: '3px 4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
        >
          {/* ROW 1 TOOLBAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {/* 1. Backplot */}
            <button
              onClick={() => onStartBackplot?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Backplot selected operations (Alt+S)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0284c7"><polygon points="6 4 20 12 6 20 6 4" /></svg>
            </button>

            {/* 2. Verify Solid */}
            <button
              onClick={() => onStartVerify?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Verify selected operations (Solid Material Removal)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="9 12 11 14 15 10" stroke="#16a34a" /></svg>
            </button>

            {/* 3. Regenerate Dirty Ops */}
            <button
              onClick={onRegenerate}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Regenerate all dirty operations"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /><line x1="12" y1="8" x2="12" y2="12" stroke="#dc2626" strokeWidth="2.5" /></svg>
            </button>

            {/* 4. Regenerate All Ops */}
            <button
              onClick={onRegenerate}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Regenerate all operations (Ctrl+R)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /><line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" /><line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" /></svg>
            </button>

            {/* 5. Toggle Toolpath Display (Waves) */}
            <button
              onClick={() => onToggleOp?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Toggle display on selected operations (Alt+T)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" /><path d="M2 6c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" /><path d="M2 18c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" /></svg>
            </button>

            {/* 6. Toggle Stock Display */}
            <button
              onClick={onOpenStockModal}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Toggle stock display / Stock setup"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="#b45309" strokeWidth="1"><rect x="3" y="4" width="18" height="16" rx="2" /><polyline points="7 12 10 15 17 8" stroke="#16a34a" strokeWidth="2" fill="none" /></svg>
            </button>

            {/* 7. Toggle Shaded Display */}
            <button
              onClick={onRegenerate}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Toggle shaded toolpath / part display"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#38bdf8" stroke="#0284c7" strokeWidth="1"><circle cx="12" cy="12" r="9" /><path d="M12 3v18" stroke="#ffffff" /></svg>
            </button>

            {/* 8. Post Selected (G1) */}
            <button
              onClick={onOpenPostModal}
              style={{ width: '22px', height: '22px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              title="Post selected operations (G1 / Post Process)"
            >
              <span style={{ fontSize: '10px', fontWeight: 900, color: '#2563eb', fontFamily: 'monospace' }}>G1</span>
            </button>

            {/* 9. High Speed / Toolpath Editor */}
            <button
              onClick={onOpenHSMFilter}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="High Speed Filter / Toolpath Editor"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </button>

            {/* 10. Edit Parameters */}
            <button
              onClick={() => {
                const op = operations.find((o) => o.id === activeOpId) || operations[0];
                if (op && onEditOp) onEditOp(op);
              }}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Edit parameters of selected operation"
            >
              <Sliders size={13} color="#ea580c" />
            </button>

            {/* 11. Help */}
            <button
              onClick={onOpenHelpGuide}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Help on Toolpaths Manager"
            >
              <HelpCircle size={13} color="#0284c7" />
            </button>
          </div>

          {/* ROW 2 TOOLBAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {/* 1. Lock Selected Ops */}
            <button
              onClick={() => onToggleLockOp?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Lock / unlock selected operations"
            >
              <Lock size={12} color="#ca8a04" />
            </button>

            {/* 2. Toggle Ghost on Selected Ops */}
            <button
              onClick={() => onToggleGhostOp?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Ghost / un-ghost selected operations"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" /><line x1="4" y1="4" x2="20" y2="20" stroke="#dc2626" strokeWidth="2" /></svg>
            </button>

            {/* 3. Ghost Operation */}
            <button
              onClick={() => onToggleGhostOp?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Ghost operation (exempt from posting & verification)"
            >
              <Ghost size={12} color="#94a3b8" />
            </button>

            {/* 4. Move Down */}
            <button
              onClick={() => onMoveOpDown?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Move operation down (Shift+Down)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#dc2626"><polygon points="12 20 4 8 20 8 12 20" /></svg>
            </button>

            {/* 5. Move Up */}
            <button
              onClick={() => onMoveOpUp?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Move operation up (Shift+Up)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#dc2626"><polygon points="12 4 4 16 20 16 12 4" /></svg>
            </button>

            {/* 6. Reverse Toolpath */}
            <button
              onClick={onRegenerate}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Change NCI / reverse toolpath direction"
            >
              <RotateCcw size={12} color="#0284c7" />
            </button>

            {/* 7. Sort Operations */}
            <button
              onClick={onSortOps}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Sort operations by tool number"
            >
              <ArrowUpDown size={12} color="#16a34a" />
            </button>

            {/* 8. Quick Toolpath Preview */}
            <button
              onClick={() => onToggleOp?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Quick toolpath wireframe tracking preview"
            >
              <Compass size={12} color="#06b6d4" />
            </button>

            {/* 9. Chaining Geometry */}
            <button
              onClick={onOpenWireframeModal}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Chain geometry manager / drive surfaces"
            >
              <Square size={12} color="#e11d48" />
            </button>

            {/* 10. WCS / TPlane */}
            <button
              onClick={onOpenCPlanesModal}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Assign CPlane / WCS to operation"
            >
              <Crosshair size={12} color="#9333ea" />
            </button>

            {/* 11. Trim Toolpath */}
            <button
              onClick={onOpenHSMFilter}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Trim toolpath / Corner relief"
            >
              <Scissors size={12} color="#ea580c" />
            </button>

            {/* 12. Delete Op */}
            <button
              onClick={() => onDeleteOp?.(activeOpId)}
              style={{ width: '22px', height: '22px', background: 'transparent', border: '1px solid transparent', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="Delete selected operation (Delete)"
            >
              <Trash2 size={12} color="#dc2626" />
            </button>
          </div>
        </div>
      )}

      {/* ================= 3. TREE VIEW SCROLLABLE CONTAINER ================= */}
      <div
        onContextMenu={(e) => handleContextMenu(e, null)}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '4px 6px',
          backgroundColor: '#ffffff',
          fontSize: '11px',
          lineHeight: '18px'
        }}
      >
        {/* ==================== A. TOOLPATHS TREE VIEW ==================== */}
        {currentTab === 'Toolpaths' && (
          operations.length === 0 ? (
            /* Blank Project: clean empty canvas list matching screenshot */
            <div style={{ flex: 1, minHeight: '100%', padding: '8px' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Root: Machine Group-1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, color: '#0f172a' }}>
              <span
                onClick={() => setMachineGroupExpanded(!machineGroupExpanded)}
                style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', color: '#64748b', width: '12px', textAlign: 'center' }}
              >
                {machineGroupExpanded ? '[-]' : '[+]'}
              </span>
              {/* Blue 4-box cube icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0284c7"><rect x="2" y="2" width="9" height="9" /><rect x="13" y="2" width="9" height="9" /><rect x="2" y="13" width="9" height="9" /><rect x="13" y="13" width="9" height="9" /></svg>
              <span>Machine Group-1</span>
            </div>

            {machineGroupExpanded && (
              <div style={{ paddingLeft: '14px', borderLeft: '1px dotted #cbd5e1', marginLeft: '6px' }}>
                {/* 1. Properties - 4 - AXIS VMC */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                  <span
                    onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                    style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', color: '#64748b', width: '12px', textAlign: 'center' }}
                  >
                    {propertiesExpanded ? '[-]' : '[+]'}
                  </span>
                  {/* Bar chart icon */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#0284c7"><rect x="3" y="12" width="4" height="8" /><rect x="10" y="8" width="4" height="12" /><rect x="17" y="4" width="4" height="16" /></svg>
                  <span style={{ color: '#334155' }}>Properties - {activeMachine?.name || '4 - AXIS VMC'}</span>
                </div>

                {/* Sub-properties when expanded */}
                {propertiesExpanded && (
                  <div style={{ paddingLeft: '14px', borderLeft: '1px dotted #cbd5e1', marginLeft: '6px' }}>
                    <div
                      onClick={onOpenMachineConfig}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#475569' }}
                      title="Machine configuration files"
                    >
                      <span>📁</span>
                      <span>Files - {activeMachine?.controller || 'Mill.mcam-control'}</span>
                    </div>
                    <div
                      onClick={onOpenFeedsSpeeds}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#475569' }}
                      title="Tool settings & feed rate rules"
                    >
                      <span>⚙️</span>
                      <span>Tool settings - Default feeds &amp; speeds</span>
                    </div>
                    <div
                      onClick={onOpenStockModal}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#0284c7', fontWeight: 600 }}
                      title="Stock setup bounding box"
                    >
                      <span>📦</span>
                      <span>Stock setup - [{stockConfig?.dimensions?.x || 120} × {stockConfig?.dimensions?.y || 80} × {stockConfig?.dimensions?.z || 25} mm]</span>
                    </div>
                  </div>
                )}

                {/* 2. Toolpath Group-1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                  <span
                    onClick={() => setToolpathGroupExpanded(!toolpathGroupExpanded)}
                    style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', color: '#64748b', width: '12px', textAlign: 'center' }}
                  >
                    {toolpathGroupExpanded ? '[-]' : '[+]'}
                  </span>
                  {/* Cyan circles cluster icon */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#06b6d4"><circle cx="7" cy="7" r="4" /><circle cx="17" cy="7" r="4" /><circle cx="7" cy="17" r="4" /><circle cx="17" cy="17" r="4" /></svg>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>Toolpath Group-1</span>
                </div>

                {/* Operations List */}
                {toolpathGroupExpanded && (
                  <div style={{ paddingLeft: '14px', borderLeft: '1px dotted #cbd5e1', marginLeft: '6px' }}>
                    {operations.map((op, idx) => {
                      const isSelected = activeOpId === op.id;
                      const isExpanded = expandedOps[op.id] !== false;

                      return (
                        <div key={op.id} style={{ marginTop: '3px' }}>
                          {/* Operation Title Row */}
                          <div
                            onClick={() => onSelectOp(op.id)}
                            onDoubleClick={() => onEditOp(op)}
                            onContextMenu={(e) => handleContextMenu(e, op)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: isSelected ? '#dbeafe' : 'transparent',
                              borderRadius: '2px',
                              padding: '1px 3px',
                              cursor: 'pointer',
                              border: isSelected ? '1px solid #93c5fd' : '1px solid transparent'
                            }}
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOpExpand(op.id);
                              }}
                              style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', color: '#64748b', width: '12px', textAlign: 'center' }}
                            >
                              {isExpanded ? '[-]' : '[+]'}
                            </span>

                            {/* Folder Icon with Green/Yellow tab */}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15" stroke="#ca8a04" strokeWidth="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M2 10h20" stroke="#16a34a" strokeWidth="2" /></svg>

                            <span style={{ color: isSelected ? '#1e3a8a' : '#1e293b', fontWeight: isSelected ? 700 : 500 }}>
                              {idx + 1} - {op.name} - [WCS: Top] - [Tplane: Top]
                            </span>

                            {op.locked && <span title="Locked">🔒</span>}
                            {op.ghosted && <span title="Ghosted">👻</span>}
                          </div>

                          {/* Sub-Branch Items */}
                          {isExpanded && (
                            <div style={{ paddingLeft: '16px', borderLeft: '1px dotted #cbd5e1', marginLeft: '6px', fontSize: '10.5px' }}>
                              {/* 1. Parameters */}
                              <div
                                onClick={() => onEditOp(op)}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', cursor: 'pointer', padding: '1px 0' }}
                                title="Double-click to edit cutting parameters, feeds, speeds & stepover"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#94a3b8" stroke="#475569" strokeWidth="1"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                <span>Parameters</span>
                              </div>

                              {/* 2. Tool definition */}
                              <div
                                onClick={onOpenToolManager}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a', cursor: 'pointer', padding: '1px 0' }}
                                title="Click to open Tool Manager / Tool Assembly Studio"
                              >
                                {/* Tool Silhouette */}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#1e3a8a"><path d="M10 2h4v8h-4z" /><path d="M7 10h10v12H7z" /></svg>
                                <span>
                                  #{op.toolId || op.tool?.id || (idx + 1)} - M{op.toolDia || op.tool?.diameter || 10}.00 ENDMILL 1 FLAT - {op.toolName || op.tool?.name || '10 FLAT ENDMILL'}
                                </span>
                              </div>

                              {/* 3. Geometry */}
                              <div
                                onClick={onOpenWireframeModal}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a', cursor: 'pointer', padding: '1px 0' }}
                                title="Click to view chained geometry and drive surfaces"
                              >
                                <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#06b6d4', fontWeight: 800 }}>[S]</span>
                                <span>Geometry - (1 Chain / Drive Surface)</span>
                              </div>

                              {/* 4. Toolpath info */}
                              <div
                                onClick={() => onToggleOp(op.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', color: op.visible ? '#0284c7' : '#94a3b8', cursor: 'pointer', padding: '1px 0' }}
                                title="Toggle toolpath visibility / G-code NC stats"
                              >
                                {/* Blue wave icon */}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><path d="M2 12c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" /><path d="M2 6c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0" /></svg>
                                <span>
                                  Toolpath - {(op.waypoints?.length ? (op.waypoints.length * 0.4).toFixed(1) : '314.2')}K - {currentProjectName ? currentProjectName.replace(/\.[^/.]+$/, '') : 'Base Structure-ALU'}.NC - Program {String(idx + 1).padStart(4, '0')}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Red Insertion Arrow between/after operations */}
                          {insertIndex === idx + 1 && (
                            <div
                              onClick={() => setInsertIndex(idx + 1)}
                              style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '12px', cursor: 'pointer', padding: '2px 0' }}
                              title="Active toolpath insertion point"
                            >
                              <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 900, lineHeight: 1 }}>▶</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Red Insertion Arrow at the end if none selected */}
                    {insertIndex >= operations.length && (
                      <div
                        onClick={() => setInsertIndex(operations.length)}
                        style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '12px', marginTop: '4px', cursor: 'pointer' }}
                        title="Active toolpath insertion point"
                      >
                        <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 900, lineHeight: 1 }}>▶</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ==================== B. SOLIDS TREE VIEW ==================== */}
        {currentTab === 'Solids' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>ACTIVE SOLID BODIES</span>
              <button
                onClick={() => onOpenSolidsModal?.('box')}
                style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', color: '#0284c7' }}
              >
                + New Solid
              </button>
            </div>
            {solids.map((s, idx) => (
              <div
                key={s.id || idx}
                onClick={() => onSelectSolid?.(s.id || idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 6px',
                  background: s.active ? '#dbeafe' : '#f8fafc',
                  border: `1px solid ${s.active ? '#93c5fd' : '#e2e8f0'}`,
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSolidVisibility?.(s.id || idx);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {s.visible !== false ? <CheckSquare size={13} color="#0284c7" /> : <Square size={13} color="#94a3b8" />}
                  </button>
                  <Box size={13} color={s.color || '#0284c7'} />
                  <span style={{ fontWeight: s.active ? 700 : 500, color: s.active ? '#1e3a8a' : '#1e293b' }}>
                    {s.name}
                  </span>
                </div>
                {s.isPrimary && (
                  <span style={{ fontSize: '8.5px', padding: '1px 4px', borderRadius: '2px', backgroundColor: '#e0f2fe', color: '#0284c7', fontWeight: 700 }}>
                    WORKPIECE
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ==================== C. PLANES TREE VIEW ==================== */}
        {currentTab === 'Planes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>WCS &amp; CONSTRUCTION PLANES</span>
              <button
                onClick={onOpenCPlanesModal}
                style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', color: '#0284c7' }}
              >
                + New Plane
              </button>
            </div>
            {displayPlanes.map((plane) => {
              const isActive = activePlane === plane.name;
              return (
                <div
                  key={plane.id || plane.name}
                  onClick={() => onSelectPlane?.(plane.name)}
                  style={{
                    background: isActive ? '#dbeafe' : '#f8fafc',
                    border: `1px solid ${isActive ? '#93c5fd' : '#e2e8f0'}`,
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#1e3a8a' : '#1e293b' }}>
                      {plane.name}
                    </span>
                    <span style={{ fontSize: '9.5px', padding: '1px 4px', background: '#e2e8f0', borderRadius: '3px', color: '#475569', fontFamily: 'monospace' }}>
                      {plane.code || 'G17'}
                    </span>
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>
                    {plane.desc}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== D. LEVELS TREE VIEW ==================== */}
        {currentTab === 'Levels' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '20px 24px 1fr 34px',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#64748b',
              padding: '4px 6px',
              borderBottom: '1px solid #cbd5e1',
              background: '#f1f5f9'
            }}>
              <span>Vis</span>
              <span>#</span>
              <span>Level Name</span>
              <span>Ent</span>
            </div>
            {levels.map((lvl) => (
              <div
                key={lvl.id}
                onClick={() => onSetActiveLevel?.(lvl.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 24px 1fr 34px',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  background: lvl.active ? '#dbeafe' : '#ffffff',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLevel?.(lvl.id);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {lvl.visible ? <CheckSquare size={13} color="#0284c7" /> : <Square size={13} color="#94a3b8" />}
                </button>
                <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{lvl.number}</span>
                <span style={{ fontWeight: lvl.active ? 700 : 500, color: lvl.active ? '#1e3a8a' : '#1e293b' }}>{lvl.name}</span>
                <span style={{ fontFamily: 'monospace', color: '#16a34a', textAlign: 'right' }}>{lvl.entities}</span>
              </div>
            ))}
          </div>
        )}

        {/* ==================== E. RECENT FUNCTIONS MANAGER TAB ==================== */}
        {currentTab === 'Recent Functions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Search Box */}
            <div style={{ position: 'relative' }}>
              <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: '6px', top: '7px' }} />
              <input
                type="text"
                placeholder="Search recent functions..."
                value={recentSearch}
                onChange={(e) => setRecentSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 6px 4px 22px',
                  fontSize: '11px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '3px',
                  background: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', padding: '2px 4px' }}>
              Recent Commands &amp; Tools:
            </div>

            {filteredRecent.map((rf) => {
              const IconComponent = rf.icon;
              return (
                <div
                  key={rf.id}
                  onClick={() => onRunRecentFunction?.(rf.action)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Click to execute ${rf.name}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconComponent size={13} color="#2563eb" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{rf.name}</div>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>{rf.category}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8' }}>{rf.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= 4. HORIZONTAL SCROLLBAR CONTROLS ================= */}
      <div
        style={{
          height: '14px',
          background: '#f1f5f9',
          borderTop: '1px solid #cbd5e1',
          borderBottom: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          padding: '0 2px'
        }}
      >
        <button style={{ width: '12px', height: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '8px', color: '#64748b', padding: 0 }}>◀</button>
        <div style={{ flex: 1, height: '4px', background: '#cbd5e1', borderRadius: '2px', margin: '0 4px', position: 'relative' }}>
          <div style={{ width: '35%', height: '100%', background: '#94a3b8', borderRadius: '2px' }} />
        </div>
        <button style={{ width: '12px', height: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '8px', color: '#64748b', padding: 0 }}>▶</button>
      </div>



      {/* ================= 6. MASTERCAM RIGHT-CLICK CONTEXT MENU ================= */}
      {contextMenu.visible && (
        <ToolpathsContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetOp={contextMenu.targetOp}
          onClose={closeContextMenu}
          onAddOperation={(strategy) => {
            if (onAddOp) onAddOp(strategy);
            closeContextMenu();
          }}
          onEditOp={(op) => {
            if (onEditOp && op) onEditOp(op);
            closeContextMenu();
          }}
          onDeleteOp={(opId) => {
            if (onDeleteOp && opId) onDeleteOp(opId);
            closeContextMenu();
          }}
          onCopyOp={(op) => {
            if (onCopyOp) onCopyOp(op);
            closeContextMenu();
          }}
          onCutOp={(op) => {
            if (onCutOp) onCutOp(op);
            closeContextMenu();
          }}
          onPasteOp={() => {
            if (onPasteOp) onPasteOp();
            closeContextMenu();
          }}
          canPaste={canPaste}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onOpenStockModal={onOpenStockModal}
          onOpenToolManager={onOpenToolManager}
          onOpenSetupSheet={onOpenSetupSheet}
          onOpenPostModal={onOpenPostModal}
          onOpenAFR={onOpenAFR}
          onOpenWireframeModal={onOpenWireframeModal}
          onOpenFiveAxisStudio={onOpenFiveAxisStudio}
          onOpenThreadStudio={onOpenThreadStudio}
          onOpenLatheStudio={onOpenLatheStudio}
          onOpenTransformModal={onOpenTransformModal}
          onOpenNestingStudio={onOpenNestingStudio}
          onOpenProbingStudio={onOpenProbingStudio}
          onOpenHSMFilter={onOpenHSMFilter}
          onOpenSurfaceFinishContour={onOpenSurfaceFinishContour}
          onExportStockSTL={onExportStockSTL}
          onToggleLockOp={onToggleLockOp}
          onToggleGhostOp={onToggleGhostOp}
          onSortOps={onSortOps}
          onSelectAllOps={() => {}}
        />
      )}

      {/* 7. Mouse-Draggable Horizontal Resizer Divider */}
      <div
        className="sidebar-resizer"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsResizing(true);
        }}
        onDoubleClick={() => {
          setSidebarWidth(320);
          try {
            localStorage.setItem('mastercam_sidebar_width', '320');
          } catch {}
        }}
        title="Click & drag to resize sidebar (Double-click to reset)"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '6px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 40,
          backgroundColor: isResizing ? '#0284c7' : 'transparent',
          userSelect: 'none'
        }}
      />
    </aside>
  );
}

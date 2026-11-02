import React, { useState, useEffect, useRef } from 'react';

export default function ToolpathsContextMenu({
  x,
  y,
  targetOp = null,
  onClose,
  onAddOperation,
  onEditOp,
  onDeleteOp,
  onCopyOp,
  onCutOp,
  onPasteOp,
  canPaste = false,
  onExpandAll,
  onCollapseAll,
  onOpenStockModal,
  onOpenToolManager,
  onOpenSetupSheet,
  onOpenPostModal,
  onOpenAFR,
  onOpenFiveAxisStudio,
  onOpenThreadStudio,
  onOpenLatheStudio,
  onOpenTransformModal,
  onOpenNestingStudio,
  onOpenProbingStudio,
  onOpenHSMFilter,
  onExportStockSTL,
  onToggleLockOp,
  onToggleGhostOp,
  onSortOps,
  onSelectAllOps
}) {
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'mill' | 'lathe' | 'wire' | 'router' | 'edit_selected' | 'groups' | 'sort'
  const [activeLevel3, setActiveLevel3] = useState(null); // 'surface_finish' | 'surface_rough' | 'high_speed_2d' | 'multiaxis' | 'circle_tp'
  const menuRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position so it stays inside window bounds
  const menuWidth = 230;
  const menuHeight = 520;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  const posX = x + menuWidth > screenW ? Math.max(10, x - menuWidth) : x;
  const posY = y + menuHeight > screenH ? Math.max(10, screenH - menuHeight - 10) : y;

  const handleAction = (callback) => {
    if (callback) callback();
    onClose();
  };

  // Reusable Menu Item Component with Mastercam blue hover highlight
  const MenuItem = ({ label, shortcut, hasSubmenu, active, onMouseEnter, onClick, disabled = false }) => {
    const [hovered, setHovered] = useState(false);
    const isHighlighted = hovered || active;

    return (
      <div
        onMouseEnter={() => {
          setHovered(true);
          if (onMouseEnter) onMouseEnter();
        }}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (!disabled && onClick) onClick();
        }}
        style={{
          padding: '3px 18px 3px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'default' : 'pointer',
          backgroundColor: isHighlighted ? '#3399ff' : 'transparent',
          color: disabled ? '#94a3b8' : (isHighlighted ? '#ffffff' : '#0f172a'),
          fontSize: '11px',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          position: 'relative',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        <span>{label}</span>
        {shortcut && (
          <span style={{ fontSize: '10px', marginLeft: '20px', color: isHighlighted ? '#ffffff' : '#64748b' }}>
            {shortcut}
          </span>
        )}
        {hasSubmenu && (
          <span style={{ fontSize: '9px', marginLeft: '12px', color: isHighlighted ? '#ffffff' : '#475569' }}>
            ▶
          </span>
        )}
      </div>
    );
  };

  const Separator = () => (
    <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '3px 6px' }} />
  );

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${posX}px`,
        top: `${posY}px`,
        zIndex: 99999,
        backgroundColor: '#ffffff',
        border: '1px solid #94a3b8',
        boxShadow: '2px 4px 16px rgba(0,0,0,0.22)',
        borderRadius: '2px',
        padding: '3px 0',
        minWidth: '220px',
        userSelect: 'none'
      }}
    >
      {/* 1. Mill toolpaths > */}
      <div style={{ position: 'relative' }}>
        <MenuItem
          label="Mill toolpaths"
          hasSubmenu
          active={activeSubmenu === 'mill'}
          onMouseEnter={() => {
            setActiveSubmenu('mill');
            setActiveLevel3(null);
          }}
        />

        {/* ================= LEVEL 2 CASCADE MENU: Mill toolpaths ================= */}
        {activeSubmenu === 'mill' && (
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: '-3px',
              backgroundColor: '#ffffff',
              border: '1px solid #94a3b8',
              boxShadow: '2px 4px 16px rgba(0,0,0,0.22)',
              borderRadius: '2px',
              padding: '3px 0',
              minWidth: '210px',
              zIndex: 100000,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <MenuItem label="New" onClick={() => handleAction(() => onAddOperation?.('pocket'))} />
            <Separator />
            <MenuItem label="Contour" onClick={() => handleAction(() => onAddOperation?.('contour'))} />
            <MenuItem label="Drill" onClick={() => handleAction(() => onAddOperation?.('drill'))} />
            <MenuItem label="Pocket" onClick={() => handleAction(() => onAddOperation?.('pocket'))} />
            <MenuItem label="Face" onClick={() => handleAction(() => onAddOperation?.('facing'))} />

            {/* 2D High Speed > */}
            <div style={{ position: 'relative' }}>
              <MenuItem
                label="2D High Speed"
                hasSubmenu
                active={activeLevel3 === 'high_speed_2d'}
                onMouseEnter={() => setActiveLevel3('high_speed_2d')}
              />
              {activeLevel3 === 'high_speed_2d' && (
                <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '160px' }}>
                  <MenuItem label="Dynamic Mill" onClick={() => handleAction(() => onAddOperation?.('adaptive'))} />
                  <MenuItem label="Peel Mill" onClick={() => handleAction(() => onAddOperation?.('contour'))} />
                  <MenuItem label="Blend Mill" onClick={() => handleAction(() => onAddOperation?.('pocket'))} />
                </div>
              )}
            </div>

            <MenuItem label="Engrave" onClick={() => handleAction(() => onAddOperation?.('engrave'))} />
            <Separator />

            {/* Surface rough > */}
            <div style={{ position: 'relative' }}>
              <MenuItem
                label="Surface rough"
                hasSubmenu
                active={activeLevel3 === 'surface_rough'}
                onMouseEnter={() => setActiveLevel3('surface_rough')}
              />
              {activeLevel3 === 'surface_rough' && (
                <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '170px' }}>
                  <MenuItem label="OptiRough" onClick={() => handleAction(() => onAddOperation?.('adaptive'))} />
                  <MenuItem label="Pocket Rough" onClick={() => handleAction(() => onAddOperation?.('pocket'))} />
                  <MenuItem label="Parallel Rough" onClick={() => handleAction(() => onAddOperation?.('parallel'))} />
                  <MenuItem label="Waterline Rough" onClick={() => handleAction(() => onAddOperation?.('waterline'))} />
                </div>
              )}
            </div>

            {/* Surface finish > (MATCHING USER SCREENSHOT EXACTLY!) */}
            <div style={{ position: 'relative' }}>
              <MenuItem
                label="Surface finish"
                hasSubmenu
                active={activeLevel3 === 'surface_finish'}
                onMouseEnter={() => setActiveLevel3('surface_finish')}
              />
              {activeLevel3 === 'surface_finish' && (
                <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '170px' }}>
                  <MenuItem label="Parallel Finish" onClick={() => handleAction(() => onAddOperation?.('parallel'))} />
                  <MenuItem label="Waterline Finish" onClick={() => handleAction(() => onAddOperation?.('waterline'))} />
                  <MenuItem label="Equal Scallop" onClick={() => handleAction(() => onAddOperation?.('pencil'))} />
                  <MenuItem label="Radial Finish" onClick={() => handleAction(() => onAddOperation?.('parallel'))} />
                  <MenuItem label="Spiral Finish" onClick={() => handleAction(() => onAddOperation?.('pocket'))} />
                  <MenuItem label="Pencil Tracing" onClick={() => handleAction(() => onAddOperation?.('pencil'))} />
                </div>
              )}
            </div>

            <MenuItem label="Surface high speed toolpath" hasSubmenu onClick={() => handleAction(() => onOpenHSMFilter?.())} />

            {/* Multiaxis > */}
            <div style={{ position: 'relative' }}>
              <MenuItem
                label="Multiaxis"
                hasSubmenu
                active={activeLevel3 === 'multiaxis'}
                onMouseEnter={() => setActiveLevel3('multiaxis')}
              />
              {activeLevel3 === 'multiaxis' && (
                <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '170px' }}>
                  <MenuItem label="5-Axis Swarf Milling" onClick={() => handleAction(() => onAddOperation?.('swarf'))} />
                  <MenuItem label="5-Axis Morph Between 2 Curves" onClick={() => handleAction(() => onOpenFiveAxisStudio?.())} />
                  <MenuItem label="5-Axis Parallel" onClick={() => handleAction(() => onOpenFiveAxisStudio?.())} />
                  <MenuItem label="Rotary 4-Axis" onClick={() => handleAction(() => onOpenFiveAxisStudio?.())} />
                </div>
              )}
            </div>

            <MenuItem label="Multiaxis Link..." onClick={() => handleAction(() => onOpenFiveAxisStudio?.())} />
            <Separator />
            <MenuItem label="FBM Drill" onClick={() => handleAction(() => onOpenAFR?.())} />
            <MenuItem label="FBM Mill" onClick={() => handleAction(() => onOpenAFR?.())} />
            <Separator />
            <MenuItem label="Stock Model" onClick={() => handleAction(() => onOpenStockModal?.())} />
            <MenuItem label="View Stock Model" onClick={() => handleAction(() => onOpenStockModal?.())} />
            <MenuItem label="Stock Model Export to STL" onClick={() => handleAction(() => onExportStockSTL?.())} />
            <MenuItem label="Stock Model Convert to PMesh" onClick={() => handleAction(() => onOpenStockModal?.())} />
            <Separator />

            {/* Circle toolpaths > */}
            <div style={{ position: 'relative' }}>
              <MenuItem
                label="Circle toolpaths"
                hasSubmenu
                active={activeLevel3 === 'circle_tp'}
                onMouseEnter={() => setActiveLevel3('circle_tp')}
              />
              {activeLevel3 === 'circle_tp' && (
                <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '160px' }}>
                  <MenuItem label="Circle Mill" onClick={() => handleAction(() => onAddOperation?.('pocket'))} />
                  <MenuItem label="Thread Mill" onClick={() => handleAction(() => onOpenThreadStudio?.())} />
                  <MenuItem label="Helix Bore" onClick={() => handleAction(() => onAddOperation?.('drill'))} />
                </div>
              )}
            </div>

            <MenuItem label="Transform" onClick={() => handleAction(() => onOpenTransformModal?.())} />
            <MenuItem label="Nest" onClick={() => handleAction(() => onOpenNestingStudio?.())} />
            <MenuItem label="Manual entry" onClick={() => handleAction(() => onOpenPostModal?.())} />
            <MenuItem label="Point" onClick={() => handleAction(() => onAddOperation?.('drill'))} />
            <MenuItem label="Trim" onClick={() => handleAction(() => onOpenHSMFilter?.())} />
            <MenuItem label="Wire frame" hasSubmenu onClick={() => handleAction(() => onAddOperation?.('contour'))} />
            <Separator />
            <MenuItem label="Probe" onClick={() => handleAction(() => onOpenProbingStudio?.())} />
          </div>
        )}
      </div>

      {/* 2. Lathe toolpaths > */}
      <MenuItem
        label="Lathe toolpaths"
        hasSubmenu
        active={activeSubmenu === 'lathe'}
        onMouseEnter={() => { setActiveSubmenu('lathe'); setActiveLevel3(null); }}
        onClick={() => handleAction(() => onOpenLatheStudio?.())}
      />

      {/* 3. Wire toolpaths > */}
      <MenuItem
        label="Wire toolpaths"
        hasSubmenu
        active={activeSubmenu === 'wire'}
        onMouseEnter={() => { setActiveSubmenu('wire'); setActiveLevel3(null); }}
      />

      {/* 4. Router toolpaths > */}
      <MenuItem
        label="Router toolpaths"
        hasSubmenu
        active={activeSubmenu === 'router'}
        onMouseEnter={() => { setActiveSubmenu('router'); setActiveLevel3(null); }}
        onClick={() => handleAction(() => onOpenNestingStudio?.())}
      />

      {/* 5. Edit selected operations > */}
      <div style={{ position: 'relative' }}>
        <MenuItem
          label="Edit selected operations"
          hasSubmenu
          active={activeSubmenu === 'edit_selected'}
          onMouseEnter={() => { setActiveSubmenu('edit_selected'); setActiveLevel3(null); }}
        />
        {activeSubmenu === 'edit_selected' && (
          <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '180px' }}>
            <MenuItem label="Edit Parameters..." onClick={() => handleAction(() => targetOp && onEditOp?.(targetOp))} />
            <MenuItem label="Change Tool..." onClick={() => handleAction(() => onOpenToolManager?.())} />
            <MenuItem label="Lock Operation" onClick={() => handleAction(() => targetOp && onToggleLockOp?.(targetOp.id))} />
            <MenuItem label="Ghost Operation" onClick={() => handleAction(() => targetOp && onToggleGhostOp?.(targetOp.id))} />
            <MenuItem label="Post Process (G1)" onClick={() => handleAction(() => onOpenPostModal?.())} />
          </div>
        )}
      </div>

      {/* 6. Groups > */}
      <div style={{ position: 'relative' }}>
        <MenuItem
          label="Groups"
          hasSubmenu
          active={activeSubmenu === 'groups'}
          onMouseEnter={() => { setActiveSubmenu('groups'); setActiveLevel3(null); }}
        />
        {activeSubmenu === 'groups' && (
          <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '170px' }}>
            <MenuItem label="New Machine Group" onClick={() => handleAction(() => onAddOperation?.('facing'))} />
            <MenuItem label="New Toolpath Group" onClick={() => handleAction(() => onAddOperation?.('pocket'))} />
          </div>
        )}
      </div>

      <Separator />

      {/* Clipboard actions */}
      <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => handleAction(() => targetOp && onCutOp?.(targetOp))} disabled={!targetOp} />
      <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => handleAction(() => targetOp && onCopyOp?.(targetOp))} disabled={!targetOp} />
      <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => handleAction(() => onPasteOp?.())} disabled={!canPaste} />
      <MenuItem label="Delete" shortcut="Del" onClick={() => handleAction(() => targetOp && onDeleteOp?.(targetOp.id))} disabled={!targetOp} />
      <MenuItem label="Undelete" onClick={() => handleAction(() => onPasteOp?.())} disabled={!canPaste} />
      <MenuItem label="Undo" hasSubmenu shortcut="Ctrl+Z" />

      <Separator />

      {/* Tree controls */}
      <MenuItem label="Expand" onClick={() => handleAction(() => onExpandAll?.())} />
      <MenuItem label="Collapse" onClick={() => handleAction(() => onCollapseAll?.())} />
      <MenuItem label="Doc file..." onClick={() => handleAction(() => onOpenSetupSheet?.())} />
      <MenuItem label="Select..." onClick={() => handleAction(() => onSelectAllOps?.())} />

      {/* Sort > */}
      <div style={{ position: 'relative' }}>
        <MenuItem
          label="Sort"
          hasSubmenu
          active={activeSubmenu === 'sort'}
          onMouseEnter={() => { setActiveSubmenu('sort'); setActiveLevel3(null); }}
        />
        {activeSubmenu === 'sort' && (
          <div style={{ position: 'absolute', left: '100%', top: '-3px', backgroundColor: '#ffffff', border: '1px solid #94a3b8', boxShadow: '2px 4px 16px rgba(0,0,0,0.22)', borderRadius: '2px', padding: '3px 0', minWidth: '170px' }}>
            <MenuItem label="Sort by Tool Number" onClick={() => handleAction(() => onSortOps?.('tool'))} />
            <MenuItem label="Sort by Operation Type" onClick={() => handleAction(() => onSortOps?.('type'))} />
          </div>
        )}
      </div>

      <Separator />

      {/* File I/O */}
      <MenuItem label="Import..." onClick={() => handleAction(() => onOpenPostModal?.())} />
      <MenuItem label="Export..." onClick={() => handleAction(() => onExportStockSTL?.())} />
      <MenuItem label="Batch..." onClick={() => handleAction(() => onOpenPostModal?.())} />

      <Separator />

      {/* Utilities */}
      <MenuItem label="Display options..." onClick={() => handleAction(() => onOpenHSMFilter?.())} />
      <MenuItem label="Setup sheet..." onClick={() => handleAction(() => onOpenSetupSheet?.())} />
      <MenuItem label="Tool list..." onClick={() => handleAction(() => onOpenToolManager?.())} />

      <Separator />

      <MenuItem label="Toolpath Editor" onClick={() => handleAction(() => onOpenHSMFilter?.())} />
    </div>
  );
}


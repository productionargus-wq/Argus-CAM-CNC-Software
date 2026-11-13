import React, { useState, useEffect, useRef } from 'react';

// CSS injected once into document head for ultra-fast 120 FPS CSS-only hover
const CONTEXT_MENU_STYLES = `
  .mcam-ctx-menu {
    position: fixed;
    z-index: 99999;
    background-color: #ffffff;
    border: 1px solid #717b87;
    box-shadow: 2px 4px 14px rgba(0, 0, 0, 0.25);
    border-radius: 2px;
    padding: 3px 0;
    min-width: 215px;
    user-select: none;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #0f172a;
    font-size: 11px;
    animation: mcamFadeIn 0.08s ease-out;
  }

  @keyframes mcamFadeIn {
    from { opacity: 0.4; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  .mcam-ctx-item {
    padding: 3.5px 16px 3.5px 22px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    background-color: transparent;
    color: #0f172a;
    position: relative;
    white-space: nowrap;
    transition: none; /* instant response */
  }

  .mcam-ctx-item:hover,
  .mcam-ctx-item.is-active {
    background-color: #3399ff !important;
    color: #ffffff !important;
  }

  .mcam-ctx-item.is-disabled {
    color: #94a3b8 !important;
    cursor: default;
    background-color: transparent !important;
  }

  .mcam-ctx-item:hover .mcam-ctx-shortcut,
  .mcam-ctx-item.is-active .mcam-ctx-shortcut,
  .mcam-ctx-item:hover .mcam-ctx-arrow,
  .mcam-ctx-item.is-active .mcam-ctx-arrow {
    color: #ffffff !important;
  }

  .mcam-ctx-shortcut {
    font-size: 10px;
    margin-left: 20px;
    color: #64748b;
  }

  .mcam-ctx-arrow {
    font-size: 8px;
    margin-left: 12px;
    color: #475569;
  }

  .mcam-ctx-sep {
    height: 1px;
    background-color: #e2e8f0;
    margin: 3px 6px;
  }

  .mcam-ctx-sub {
    position: absolute;
    top: -4px;
    background-color: #ffffff;
    border: 1px solid #717b87;
    box-shadow: 2px 4px 14px rgba(0, 0, 0, 0.25);
    border-radius: 2px;
    padding: 3px 0;
    min-width: 205px;
    z-index: 100000;
  }
`;

let stylesInjected = false;
function ensureStylesInjected() {
  if (typeof document === 'undefined' || stylesInjected) return;
  const styleEl = document.createElement('style');
  styleEl.setAttribute('id', 'mcam-context-menu-styles');
  styleEl.textContent = CONTEXT_MENU_STYLES;
  document.head.appendChild(styleEl);
  stylesInjected = true;
}

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
  onOpenWireframeModal,
  onOpenFiveAxisStudio,
  onOpenThreadStudio,
  onOpenLatheStudio,
  onOpenTransformModal,
  onOpenNestingStudio,
  onOpenProbingStudio,
  onOpenHSMFilter,
  onOpenSurfaceFinishContour,
  onOpenSurfaceFinishPocket,
  onOpenSurfaceFinishFlowline,
  onOpenSurfaceFinishShallow,
  onOpenSurfaceFinishParallel,
  onOpenSurfaceFinishPencil,
  onExportStockSTL,
  onToggleLockOp,
  onToggleGhostOp,
  onSortOps,
  onSelectAllOps
}) {
  ensureStylesInjected();

  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeLevel3, setActiveLevel3] = useState(null);
  const menuRef = useRef(null);
  const submenuCloseTimerRef = useRef(null);

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

    // Use a small timeout or click listener so mouseup/click finishes before outside-click logic
    const timer = setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      if (submenuCloseTimerRef.current) clearTimeout(submenuCloseTimerRef.current);
    };
  }, [onClose]);

  // Adjust menu position so it stays inside window bounds
  const menuWidth = 220;
  const menuHeight = 540;
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const posX = x + menuWidth > screenW ? Math.max(10, x - menuWidth) : x;
  const posY = y + menuHeight > screenH ? Math.max(10, screenH - menuHeight - 10) : y;

  // Decide if submenus should open to the right (default) or to the left (if near right viewport edge)
  const openSubToLeft = posX + menuWidth + 210 > screenW;
  const subStyle = openSubToLeft ? { right: '100%' } : { left: '100%' };

  const handleAction = (callback) => {
    if (callback) callback();
    onClose();
  };

  const handleOpenSubmenu = (menuName) => {
    if (submenuCloseTimerRef.current) {
      clearTimeout(submenuCloseTimerRef.current);
      submenuCloseTimerRef.current = null;
    }
    setActiveSubmenu(menuName);
    setActiveLevel3(null);
  };

  const handleOpenLevel3 = (level3Name) => {
    if (submenuCloseTimerRef.current) {
      clearTimeout(submenuCloseTimerRef.current);
      submenuCloseTimerRef.current = null;
    }
    setActiveLevel3(level3Name);
  };

  const handleScheduleSubmenuClose = () => {
    if (submenuCloseTimerRef.current) clearTimeout(submenuCloseTimerRef.current);
    submenuCloseTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null);
      setActiveLevel3(null);
    }, 180);
  };

  const handleCancelSubmenuClose = () => {
    if (submenuCloseTimerRef.current) {
      clearTimeout(submenuCloseTimerRef.current);
      submenuCloseTimerRef.current = null;
    }
  };

  return (
    <div
      ref={menuRef}
      className="mcam-ctx-menu"
      style={{ left: `${posX}px`, top: `${posY}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 1. Mill toolpaths > */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => handleOpenSubmenu('mill')}
        onMouseLeave={handleScheduleSubmenuClose}
      >
        <div className={`mcam-ctx-item ${activeSubmenu === 'mill' ? 'is-active' : ''}`}>
          <span>Mill toolpaths</span>
          <span className="mcam-ctx-arrow">▶</span>
        </div>

        {/* ================= LEVEL 2 CASCADE MENU: Mill toolpaths ================= */}
        {activeSubmenu === 'mill' && (
          <div
            className="mcam-ctx-sub"
            style={{ ...subStyle, top: '-24px', overflow: 'visible' }}
            onMouseEnter={handleCancelSubmenuClose}
            onMouseLeave={handleScheduleSubmenuClose}
          >
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('pocket'))}>New</div>
            <div className="mcam-ctx-sep" />
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('contour'))}>Contour</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('drill'))}>Drill</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('pocket'))}>Pocket</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('facing'))}>Face</div>

            {/* 2D High Speed > */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleOpenLevel3('high_speed_2d')}
            >
              <div className={`mcam-ctx-item ${activeLevel3 === 'high_speed_2d' ? 'is-active' : ''}`}>
                <span>2D High Speed</span>
                <span className="mcam-ctx-arrow">▶</span>
              </div>
              {activeLevel3 === 'high_speed_2d' && (
                <div className="mcam-ctx-sub" style={{ ...subStyle, minWidth: '160px' }}>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('adaptive'))}>Dynamic Mill</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('contour'))}>Peel Mill</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('pocket'))}>Blend Mill</div>
                </div>
              )}
            </div>

            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('engrave'))}>Engrave</div>
            <div className="mcam-ctx-sep" />

            {/* Surface rough > */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleOpenLevel3('surface_rough')}
            >
              <div className={`mcam-ctx-item ${activeLevel3 === 'surface_rough' ? 'is-active' : ''}`}>
                <span>Surface rough</span>
                <span className="mcam-ctx-arrow">▶</span>
              </div>
              {activeLevel3 === 'surface_rough' && (
                <div className="mcam-ctx-sub" style={{ ...subStyle, minWidth: '170px' }}>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('adaptive'))}>OptiRough</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('pocket'))}>Pocket Rough</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('parallel'))}>Parallel Rough</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('waterline'))}>Waterline Rough</div>
                </div>
              )}
            </div>

            {/* Surface finish > (MATCHING USER SCREENSHOT EXACTLY!) */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleOpenLevel3('surface_finish')}
            >
              <div className={`mcam-ctx-item ${activeLevel3 === 'surface_finish' ? 'is-active' : ''}`}>
                <span>Surface finish</span>
                <span className="mcam-ctx-arrow">▶</span>
              </div>
              {activeLevel3 === 'surface_finish' && (
                <div className="mcam-ctx-sub" style={{ ...subStyle, minWidth: '170px' }}>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSurfaceFinishParallel ? onOpenSurfaceFinishParallel() : onAddOperation?.('parallel'))}>Parallel</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('parallel'))}>Parallel steep</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('radial'))}>Radial</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('project'))}>Project</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSurfaceFinishFlowline ? onOpenSurfaceFinishFlowline() : onAddOperation?.('flowline'))}>Flowline</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSurfaceFinishContour ? onOpenSurfaceFinishContour() : onAddOperation?.('waterline'))}>Contour</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSurfaceFinishPocket ? onOpenSurfaceFinishPocket() : onAddOperation?.('pocket'))}>Pocket</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSurfaceFinishShallow ? onOpenSurfaceFinishShallow() : onAddOperation?.('shallow'))}>Shallow</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSurfaceFinishPencil ? onOpenSurfaceFinishPencil() : onAddOperation?.('pencil'))}>Pencil</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('rest_milling'))}>Leftover</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('waterline'))}>Scallop</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('blend'))}>Blend</div>
                </div>
              )}
            </div>

            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenHSMFilter?.())}>Surface high speed toolpath</div>

            {/* Multiaxis > */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleOpenLevel3('multiaxis')}
            >
              <div className={`mcam-ctx-item ${activeLevel3 === 'multiaxis' ? 'is-active' : ''}`}>
                <span>Multiaxis</span>
                <span className="mcam-ctx-arrow">▶</span>
              </div>
              {activeLevel3 === 'multiaxis' && (
                <div className="mcam-ctx-sub" style={{ ...subStyle, minWidth: '170px' }}>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('swarf'))}>5-Axis Swarf Milling</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenFiveAxisStudio?.())}>5-Axis Morph Between 2 Curves</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenFiveAxisStudio?.())}>5-Axis Parallel</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenFiveAxisStudio?.())}>Rotary 4-Axis</div>
                </div>
              )}
            </div>

            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenFiveAxisStudio?.())}>Multiaxis Link...</div>
            <div className="mcam-ctx-sep" />
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenAFR?.())}>FBM Drill</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenAFR?.())}>FBM Mill</div>
            <div className="mcam-ctx-sep" />
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenStockModal?.())}>Stock Model</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenStockModal?.())}>View Stock Model</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onExportStockSTL?.())}>Stock Model Export to STL</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenStockModal?.())}>Stock Model Convert to PMesh</div>
            <div className="mcam-ctx-sep" />

            {/* Circle toolpaths > */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => handleOpenLevel3('circle_tp')}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenLevel3(activeLevel3 === 'circle_tp' ? null : 'circle_tp');
              }}
            >
              <div className={`mcam-ctx-item ${activeLevel3 === 'circle_tp' ? 'is-active' : ''}`}>
                <span>Circle toolpaths</span>
                <span className="mcam-ctx-arrow">▶</span>
              </div>
              {activeLevel3 === 'circle_tp' && (
                <div className="mcam-ctx-sub" style={{ ...subStyle, minWidth: '160px' }}>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('pocket'))}>Circle Mill</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenThreadStudio?.())}>Thread Mill</div>
                  <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('drill'))}>Helix Bore</div>
                </div>
              )}
            </div>

            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenTransformModal?.())}>Transform</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenNestingStudio?.())}>Nest</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenPostModal?.())}>Manual entry</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('drill'))}>Point</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenHSMFilter?.())}>Trim</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('contour'))}>Wire frame</div>
            <div className="mcam-ctx-sep" />
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenProbingStudio?.())}>Probe</div>
          </div>
        )}
      </div>

      {/* 2. Lathe toolpaths > */}
      <div
        className={`mcam-ctx-item ${activeSubmenu === 'lathe' ? 'is-active' : ''}`}
        onMouseEnter={() => handleOpenSubmenu('lathe')}
        onClick={() => handleAction(() => onOpenLatheStudio?.())}
      >
        <span>Lathe toolpaths</span>
        <span className="mcam-ctx-arrow">▶</span>
      </div>

      {/* 3. Wire toolpaths > */}
      <div
        className={`mcam-ctx-item ${activeSubmenu === 'wire' ? 'is-active' : ''}`}
        onMouseEnter={() => handleOpenSubmenu('wire')}
        onClick={() => handleAction(() => onOpenWireframeModal?.('line'))}
      >
        <span>Wire toolpaths</span>
        <span className="mcam-ctx-arrow">▶</span>
      </div>

      {/* 4. Router toolpaths > */}
      <div
        className={`mcam-ctx-item ${activeSubmenu === 'router' ? 'is-active' : ''}`}
        onMouseEnter={() => handleOpenSubmenu('router')}
        onClick={() => handleAction(() => onOpenNestingStudio?.())}
      >
        <span>Router toolpaths</span>
        <span className="mcam-ctx-arrow">▶</span>
      </div>

      {/* 5. Edit selected operations > */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => handleOpenSubmenu('edit_selected')}
        onMouseLeave={handleScheduleSubmenuClose}
      >
        <div className={`mcam-ctx-item ${activeSubmenu === 'edit_selected' ? 'is-active' : ''}`}>
          <span>Edit selected operations</span>
          <span className="mcam-ctx-arrow">▶</span>
        </div>
        {activeSubmenu === 'edit_selected' && (
          <div
            className="mcam-ctx-sub"
            style={{ ...subStyle, minWidth: '180px' }}
            onMouseEnter={handleCancelSubmenuClose}
            onMouseLeave={handleScheduleSubmenuClose}
          >
            <div className="mcam-ctx-item" onClick={() => handleAction(() => targetOp && onEditOp?.(targetOp))}>Edit Parameters...</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenToolManager?.())}>Change Tool...</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => targetOp && onToggleLockOp?.(targetOp.id))}>Lock Operation</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => targetOp && onToggleGhostOp?.(targetOp.id))}>Ghost Operation</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenPostModal?.())}>Post Process (G1)</div>
          </div>
        )}
      </div>

      {/* 6. Groups > */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => handleOpenSubmenu('groups')}
        onMouseLeave={handleScheduleSubmenuClose}
      >
        <div className={`mcam-ctx-item ${activeSubmenu === 'groups' ? 'is-active' : ''}`}>
          <span>Groups</span>
          <span className="mcam-ctx-arrow">▶</span>
        </div>
        {activeSubmenu === 'groups' && (
          <div
            className="mcam-ctx-sub"
            style={{ ...subStyle, minWidth: '170px' }}
            onMouseEnter={handleCancelSubmenuClose}
            onMouseLeave={handleScheduleSubmenuClose}
          >
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('facing'))}>New Machine Group</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onAddOperation?.('pocket'))}>New Toolpath Group</div>
          </div>
        )}
      </div>

      <div className="mcam-ctx-sep" />

      {/* Clipboard actions */}
      <div
        className={`mcam-ctx-item ${!targetOp ? 'is-disabled' : ''}`}
        onClick={() => { if (targetOp) handleAction(() => onCutOp?.(targetOp)); }}
      >
        <span>Cut</span>
        <span className="mcam-ctx-shortcut">Ctrl+X</span>
      </div>

      <div
        className={`mcam-ctx-item ${!targetOp ? 'is-disabled' : ''}`}
        onClick={() => { if (targetOp) handleAction(() => onCopyOp?.(targetOp)); }}
      >
        <span>Copy</span>
        <span className="mcam-ctx-shortcut">Ctrl+C</span>
      </div>

      <div
        className={`mcam-ctx-item ${!canPaste ? 'is-disabled' : ''}`}
        onClick={() => { if (canPaste) handleAction(() => onPasteOp?.()); }}
      >
        <span>Paste</span>
        <span className="mcam-ctx-shortcut">Ctrl+V</span>
      </div>

      <div
        className={`mcam-ctx-item ${!targetOp ? 'is-disabled' : ''}`}
        onClick={() => { if (targetOp) handleAction(() => onDeleteOp?.(targetOp.id)); }}
      >
        <span>Delete</span>
        <span className="mcam-ctx-shortcut">Del</span>
      </div>

      <div
        className={`mcam-ctx-item ${!canPaste ? 'is-disabled' : ''}`}
        onClick={() => { if (canPaste) handleAction(() => onPasteOp?.()); }}
      >
        <span>Undelete</span>
      </div>

      <div className="mcam-ctx-item">
        <span>Undo</span>
        <span className="mcam-ctx-shortcut">Ctrl+Z</span>
      </div>

      <div className="mcam-ctx-sep" />

      {/* Tree controls */}
      <div className="mcam-ctx-item" onClick={() => handleAction(() => onExpandAll?.())}>
        <span>Expand</span>
      </div>

      <div className="mcam-ctx-item" onClick={() => handleAction(() => onCollapseAll?.())}>
        <span>Collapse</span>
      </div>

      <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSetupSheet?.())}>
        <span>Doc file...</span>
      </div>

      <div className="mcam-ctx-item" onClick={() => handleAction(() => onSelectAllOps?.())}>
        <span>Select...</span>
      </div>

      {/* Sort > */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => handleOpenSubmenu('sort')}
        onMouseLeave={handleScheduleSubmenuClose}
      >
        <div className={`mcam-ctx-item ${activeSubmenu === 'sort' ? 'is-active' : ''}`}>
          <span>Sort</span>
          <span className="mcam-ctx-arrow">▶</span>
        </div>
        {activeSubmenu === 'sort' && (
          <div
            className="mcam-ctx-sub"
            style={{ ...subStyle, minWidth: '170px' }}
            onMouseEnter={handleCancelSubmenuClose}
            onMouseLeave={handleScheduleSubmenuClose}
          >
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onSortOps?.('tool'))}>Sort by Tool Number</div>
            <div className="mcam-ctx-item" onClick={() => handleAction(() => onSortOps?.('type'))}>Sort by Operation Type</div>
          </div>
        )}
      </div>

      <div className="mcam-ctx-sep" />

      {/* File I/O */}
      <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenPostModal?.())}>
        <span>Import...</span>
      </div>
      <div className="mcam-ctx-item" onClick={() => handleAction(() => onExportStockSTL?.())}>
        <span>Export...</span>
      </div>
      <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenPostModal?.())}>
        <span>Batch...</span>
      </div>

      <div className="mcam-ctx-sep" />

      {/* Utilities */}
      <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenHSMFilter?.())}>
        <span>Display options...</span>
      </div>
      <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenSetupSheet?.())}>
        <span>Setup sheet...</span>
      </div>
      <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenToolManager?.())}>
        <span>Tool list...</span>
      </div>

      <div className="mcam-ctx-sep" />

      <div className="mcam-ctx-item" onClick={() => handleAction(() => onOpenHSMFilter?.())}>
        <span>Toolpath Editor</span>
      </div>
    </div>
  );
}

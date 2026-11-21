import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Layers, Settings, Play, ShieldAlert, FileText, CheckCircle2,
  Box, Scissors, Compass, Sliders, Eye, RefreshCw, Zap,
  Wrench, FileCode, CheckSquare, Upload, FolderOpen, Download,
  Printer, Palette, Move, RotateCcw, Maximize2, Minimize2,
  Trash2, Plus, Sparkles, Orbit, Grid, Crosshair, HelpCircle,
  Save, Clock, Disc, ArrowUp, ArrowDown, Camera, Sun, Moon, Gauge,
  Copy, Cpu, Activity, Type, DollarSign, Tablet, PenTool, Edit3, Columns2,
  Clipboard, Ruler, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CornerDownRight, X, Circle, Square,
  MousePointer
} from 'lucide-react';
import { parseSTLFile, parseOBJFile, parseSTEPFile, parseIGESFile } from '../utils/cadGeometry';
import { parseProjectMCAM } from '../utils/projectStorage';
import { parseAnyCADFile, ALL_SUPPORTED_EXTENSIONS_STRING } from '../utils/universalCadParser';
import SurfacesRibbonGroup from './ribbon/SurfacesRibbonGroup';
import SolidsRibbonGroup from './ribbon/SolidsRibbonGroup';
import ModelPrepRibbonGroup from './ribbon/ModelPrepRibbonGroup';
import DraftingRibbonGroup from './ribbon/DraftingRibbonGroup';
import TransformRibbonGroup from './ribbon/TransformRibbonGroup';
import MachineRibbonGroup from './ribbon/MachineRibbonGroup';
import ViewRibbonGroup from './ribbon/ViewRibbonGroup';
import ToolpathsRibbonGroup from './ribbon/ToolpathsRibbonGroup';
import HomeAttributesColorDropdown from './ribbon/HomeAttributesColorDropdown';

export default function RibbonBar({
  activeTab,
  onSelectTab,
  theme = 'light',
  onToggleTheme,
  isAIActive = false,
  onToggleAI = null,
  onOpenPostModal,
  onOpenSimModal,
  onOpenStockModal,
  onOpenFixtureModal,
  onOpenToolManager,
  onOpenToolAssemblyModal,
  onOpenFeedsSpeedsModal,
  onOpenProbingStudio,
  onOpenAFRModal,
  onOpenAdaptiveModal,
  onOpenOptiRoughModal,
  onOpenSurfaceRoughPocketModal,
  onOpenSurfaceRoughParallelModal,
  onOpenSurfaceRoughWaterlineModal,
  onOpenMultiaxisMorphModal,
  onOpenSwarfMillingModal,
  onOpenMultiaxisParallelModal,
  onOpenRotary4AxisModal,
  onOpenMultiaxisDrillModal,
  onOpenMultiaxisCurveModal,
  onOpenMultiaxisDeburrModal,
  onOpenMultiaxisRoughingModal,
  onOpenPortExpertModal,
  onOpenBladeExpertModal,
  onOpenLeadInOutModal,
  onOpenFiveAxisStudio,
  onOpenSolidVerifyModal,
  onOpenFeedOptimizerModal,
  onOpenLatheStudio,
  onOpenNestingStudio,
  onOpenThreadStudio,
  onOpenEngravingStudio,
  onOpenHSMFilterStudio,
  onOpenCostQuotingModal,
  onOpenCornerReliefStudio,
  onOpenKioskModal,
  onOpenTombstoneStudio,
  onOpenCustomPostStudio,
  onOpenAnomalyScanner,
  onImportNCProgram,
  onOpenGCodeViewer,
  onOpenEntityAnalyzer,
  onOpenDistanceCaliper,
  onOpenWireframeModal,
  onStartInteractiveSketch,
  isSketchModeActive = false,
  sketchTool = 'line',
  isSelectModeActive = false,
  onToggleSelectMode,
  onOpenSurfacesModal,
  onOpenSolidsModal,
  onOpenModelPrepModal,
  onOpenMeshModal,
  onOpenDraftingModal,
  onOpenTransformModal,
  onOpenATPModal,
  onOpenMachineConfigModal,
  onOpenViewStudioModal,
  onOpenCPlanesModal,
  onOpenOperationsWizard,
  workspaceViewMode = '3d',
  onChangeViewMode = null,
  onOpenCollisionCheck,
  onStartBackplot,
  onStartVerify,
  cameraMode = 'perspective',
  onToggleCameraMode,
  clippingPlane = { enabled: false, axis: 'Z', offset: 0, invert: false },
  onUpdateClippingPlane,
  lightingMode = 'studio',
  onChangeLightingMode,
  activeManagerTab = 'Toolpaths',
  onSelectManagerTab,
  onUnblankAll,
  onInvertVisibility,
  onOpenSetupSheet,
  onOpenHelpGuide,
  onSelectSampleModel,
  onModelImported,
  onQuickAddOp,
  onNewPart,
  onOpenNewProjectModal,
  onSaveProject,
  onOpenSaveAsModal,
  onOpenRecentProjectsModal,
  onOpenExportCADModal,
  onProjectLoaded,
  onExportSTL,
  onStartFlowlineWizard,
  workpieceColor = '#3b82f6',
  onChangeWorkpieceColor,
  onChangeRenderMode,
  renderMode,
  materialStyle = 'metallic',
  onChangeMaterialStyle,
  translucencyEnabled = false,
  onToggleTranslucency,
  showBackside = false,
  onToggleBackside,
  showAxes = true,
  onToggleAxes,
  showGnomons = true,
  onToggleGnomons,
  showGrid = true,
  onToggleGrid,
  snapToGrid = false,
  onToggleSnapToGrid,
  isViewsheetsVisible = true,
  onToggleViewsheets,
  onAddViewsheet,
  onSaveViewsheetBookmark,
  onRestoreViewsheetBookmark,
  layerVisibility,
  onToggleLayer,
  onSnapCamera,
  onAddWireframe,
  onClearWireframes,
  onCloseArc,
  onAddSurface,
  onClearSurfaces,
  onAddSolid,
  onTranslatePart,
  onRotatePart,
  onScalePart,
  onResetTransform,
  onDropToTable,
  onPushPull,
  onRegenerateAll,
  onDeleteActiveOp,
  activeMachine,
  machines = [],
  machineMenuByCategory = null,
  machineDirectory = '',
  onSelectMachine,
  onOpenMachineMenuManager,
  onSelectWcs,
  activeWcs,
  onOpenFileBackstage,
  onOpenDefineToolModal,
  onOpenSurfaceFinishContour,
  onOpenSurfaceFinishPocket,
  onOpenSurfaceFinishFlowline,
  onOpenSurfaceFinishShallow,
  onOpenSurfaceFinishParallel,
  onOpenSurfaceFinishParallelSteep,
  onOpenSurfaceFinishPencil,
  onOpenSurfaceFinishRadial,
  onOpenSurfaceFinishProject,
  onOpenSurfaceFinishLeftover,
  onOpenSurfaceFinishScallop,
  onOpenSurfaceFinishBlend,
  onCopyViewportImage,
  onPasteOp,
  onCutOp,
  onCopyOp,
  canPaste = false,
  constructionZ = 0.0,
  onChangeConstructionZ,
  constructionMode = '3d',
  onToggleConstructionMode,
  levels = [],
  activeLevelId = 1,
  onSelectLevel,
  onDeleteNonAssociative,
  onDeleteDuplicates,
  onUndeleteEntity,
  showArcCenters = true,
  onToggleArcCenters,
  showEndpoints = false,
  onToggleEndpoints,
  onToggleBlank,
  onOpenToolpathAnalyzer,
  onOpenDynamicAnalyzer,
  onOpenAngleAnalyzer,
  onOpenChainAnalyzer,
  onOpenChaining,
  onOpenCheckSolid,
  onOpen2DArea,
  onOpenStatistics,
  onOpenAddInsManager,
  onOpenCommandFinder,
  onOpenAttributesModal,
  onCreateBoundingBox,
  onCreateSilhouette,
  onCreateTurnProfile,
  onCreateCurveSlice,
  onExtractAllEdges,
  onExtractOneEdge,
  onBreakManyPieces,
  onJoinEntities,
  onProjectWireframe
}) {
  const fileInputRef = useRef(null);
  const mcamFileInputRef = useRef(null);
  const ncFileInputRef = useRef(null);
  const ribbonContentRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkRibbonScroll = useCallback(() => {
    const el = ribbonContentRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  const [isRibbonCollapsed, setIsRibbonCollapsed] = useState(false);
  const [ribbonContentHeight, setRibbonContentHeight] = useState(() => {
    try {
      const saved = localStorage.getItem('mastercam_ribbon_height');
      return saved ? parseInt(saved, 10) : 94;
    } catch {
      return 94;
    }
  });
  const [isResizingRibbon, setIsResizingRibbon] = useState(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(94);

  const handleRibbonResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch {}
    setIsResizingRibbon(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = isRibbonCollapsed ? 42 : ribbonContentHeight;
  };

  const handleRibbonResizeMove = useCallback((e) => {
    if (!isResizingRibbon) return;
    const deltaY = e.clientY - resizeStartY.current;
    const newHeight = Math.min(Math.max(resizeStartHeight.current + deltaY, 44), 180);
    setRibbonContentHeight(newHeight);
    if (isRibbonCollapsed && newHeight > 54) {
      setIsRibbonCollapsed(false);
    }
  }, [isResizingRibbon, isRibbonCollapsed]);

  const handleRibbonResizeEnd = useCallback((e) => {
    if (isResizingRibbon) {
      setIsResizingRibbon(false);
      try {
        if (e && e.target && e.target.releasePointerCapture) {
          e.target.releasePointerCapture(e.pointerId);
        }
      } catch {}
      try {
        localStorage.setItem('mastercam_ribbon_height', ribbonContentHeight.toString());
      } catch {}
    }
  }, [isResizingRibbon, ribbonContentHeight]);

  useEffect(() => {
    if (!isResizingRibbon) return;
    const onMove = (e) => handleRibbonResizeMove(e);
    const onUp = (e) => handleRibbonResizeEnd(e);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isResizingRibbon, handleRibbonResizeMove, handleRibbonResizeEnd]);

  const ribbonScale = Math.min(Math.max((ribbonContentHeight - 20) / 74, 0.65), 1.35);
  const btnLargeHeight = Math.round(64 * ribbonScale);
  const btnIconSize = Math.max(16, Math.round(26 * ribbonScale));
  const fontSize = Math.max(8.5, (10.5 * ribbonScale).toFixed(1));
  const smallBtnHeight = Math.max(15, Math.round(19 * ribbonScale));
  const stackedColHeight = Math.round(64 * ribbonScale);

  useEffect(() => {
    // Check scroll state after tab changes or resize
    const timer = setTimeout(checkRibbonScroll, 60);
    window.addEventListener('resize', checkRibbonScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkRibbonScroll);
    };
  }, [checkRibbonScroll, activeTab]);

  const handleScrollRibbon = (direction) => {
    const el = ribbonContentRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -280 : 280;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkRibbonScroll, 320);
  };

  const [pointStyleSymbol, setPointStyleSymbol] = useState('*');
  const [showPointStyleMenu, setShowPointStyleMenu] = useState(false);
  const [lineStyleText, setLineStyleText] = useState('───');
  const [showLineStyleMenu, setShowLineStyleMenu] = useState(false);
  const [lineWidth, setLineWidth] = useState('1px');
  const [showLineWidthMenu, setShowLineWidthMenu] = useState(false);

  const tabs = [
    'File', 'Home', 'Wireframe', 'Surfaces', 'Solids',
    'Model Prep', 'Mesh', 'Drafting', 'Transform', 'Machine', 'View', 'Toolpaths'
  ];

  const handleCADFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = '';
      try {
        const modelGroup = await parseAnyCADFile(file);
        if (onModelImported) {
          onModelImported(modelGroup, file.name, file);
        }
      } catch (err) {
        console.error("Failed to parse CAD file:", err);
        alert(`Failed to load ${file.name}: ${err.message}`);
      }
    }
  };

  const handleMCAMFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = '';
      try {
        const projectData = await parseProjectMCAM(file);
        if (onProjectLoaded) {
          onProjectLoaded(projectData);
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleNCFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onImportNCProgram) {
        onImportNCProgram(file);
      }
      e.target.value = '';
    }
  };

  return (
    <nav
      className="ribbon-container"
      aria-label="Application Ribbon Navigation"
      style={{
        '--ribbon-dyn-scale': ribbonScale,
        '--ribbon-btn-large-height': `${btnLargeHeight}px`,
        '--ribbon-icon-size': `${btnIconSize}px`,
        '--ribbon-font-size': `${fontSize}px`,
        '--ribbon-small-btn-height': `${smallBtnHeight}px`,
        '--ribbon-stacked-height': `${stackedColHeight}px`,
      }}
    >
      {/* Hidden file input for 3D CAD models (All 25 supported formats) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALL_SUPPORTED_EXTENSIONS_STRING}
        style={{ display: 'none' }}
        onChange={handleCADFileChange}
      />

      {/* Hidden file input for Mastercam .mcam projects */}
      <input
        ref={mcamFileInputRef}
        type="file"
        accept=".mcam,.json"
        style={{ display: 'none' }}
        onChange={handleMCAMFileChange}
      />

      {/* Hidden file input for raw CNC NC Programs */}
      <input
        ref={ncFileInputRef}
        type="file"
        accept=".nc,.gcode,.h,.mpf,.tap,.txt"
        style={{ display: 'none' }}
        onChange={handleNCFileChange}
      />

      {/* Ribbon Navigation Tabs Bar */}
      <div className="ribbon-tabs" style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Scrollable Tabs Row */}
        <div
          className="ribbon-tabs-scroll"
          style={{
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            flex: 1,
            minWidth: 0,
            scrollbarWidth: 'none',
            paddingRight: onChangeViewMode ? '145px' : '45px'
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'File' && onOpenFileBackstage) {
                  onOpenFileBackstage();
                } else {
                  onSelectTab(tab);
                  setIsRibbonCollapsed(false);
                }
              }}
              className={`ribbon-tab ${tab === 'File' ? 'file-tab' : ''} ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Pinned Right Controls: 2D/3D Mode Switcher & Fixed Arrow Collapse/Expand Button */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            paddingRight: '6px',
            paddingLeft: '8px',
            background: 'var(--ribbon-header-bg, #f1f5f9)',
            boxShadow: '-4px 0 6px rgba(0,0,0,0.06)',
            zIndex: 60,
            flexShrink: 0
          }}
        >
          {/* Workspace Mode Switcher (2D Design Board | Split View | 3D Machine) */}
          {onChangeViewMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <button
                onClick={() => onChangeViewMode('2d')}
                style={{
                  width: '28px',
                  height: '22px',
                  background: workspaceViewMode === '2d' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  color: workspaceViewMode === '2d' ? '#38bdf8' : '#94a3b8',
                  border: workspaceViewMode === '2d' ? '1px solid #38bdf8' : '1px solid #334155',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="2D CAD Design Board"
              >
                <Palette size={13} />
              </button>

              <button
                onClick={() => onChangeViewMode('split')}
                style={{
                  width: '28px',
                  height: '22px',
                  background: workspaceViewMode === 'split' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  color: workspaceViewMode === 'split' ? '#c084fc' : '#94a3b8',
                  border: workspaceViewMode === 'split' ? '1px solid #c084fc' : '1px solid #334155',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Split View: 2D Design Board & 3D Machine Simulation"
              >
                <Columns2 size={13} />
              </button>

              <button
                onClick={() => onChangeViewMode('3d')}
                style={{
                  width: '28px',
                  height: '22px',
                  background: workspaceViewMode === '3d' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  color: workspaceViewMode === '3d' ? '#38bdf8' : '#94a3b8',
                  border: workspaceViewMode === '3d' ? '1px solid #38bdf8' : '1px solid #334155',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="3D Machine Viewport"
              >
                <Box size={13} />
              </button>
            </div>
          )}

          {/* AI Assistant Quick Toggle Button */}
          {onToggleAI && (
            <button
              type="button"
              onClick={() => onToggleAI(!isAIActive)}
              style={{
                height: '22px',
                padding: '0 6px',
                background: isAIActive ? '#0284c7' : '#ffffff',
                color: isAIActive ? '#ffffff' : '#0284c7',
                border: isAIActive ? '1px solid #0284c7' : '1px solid #cbd5e1',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px',
                boxShadow: isAIActive ? '0 0 10px rgba(56, 189, 248, 0.6)' : '0 1px 2px rgba(0,0,0,0.08)',
                transition: 'all 0.15s ease'
              }}
              title={isAIActive ? "Turn off Argus AI Assistant" : "Activate Argus AI Voice Assistant"}
              aria-label="Argus AI Assistant"
            >
              <Sparkles size={12} color={isAIActive ? '#ffffff' : '#0284c7'} />
              <span>AI</span>
            </button>
          )}

          {/* Mastercam Style Collapse / Expand Toggle Arrow Button (Pinned at top right) */}
          <button
            type="button"
            onClick={() => setIsRibbonCollapsed((prev) => !prev)}
            style={{
              width: '22px',
              height: '22px',
              background: isRibbonCollapsed ? '#e2e8f0' : 'transparent',
              color: isRibbonCollapsed ? '#0284c7' : '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              transition: 'all 0.15s ease'
            }}
            title={isRibbonCollapsed ? "Show Ribbon Bar (Ctrl+F1)" : "Hide Ribbon Bar (Ctrl+F1)"}
            aria-label={isRibbonCollapsed ? "Show Ribbon Bar" : "Hide Ribbon Bar"}
          >
            {isRibbonCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Ribbon Action Groups - Dynamically swaps based on activeTab */}
      {!isRibbonCollapsed && (
      <div className="ribbon-content-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="ribbon-scroll-btn ribbon-scroll-left"
            onClick={() => handleScrollRibbon('left')}
            title="Scroll Ribbon Left"
            aria-label="Scroll Ribbon Left"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div
          ref={ribbonContentRef}
          className="ribbon-content"
          style={{ height: `${ribbonContentHeight}px` }}
          onScroll={checkRibbonScroll}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
              checkRibbonScroll();
            }
          }}
        >
        {/* ==================== 1. FILE TAB ==================== */}
        {activeTab === 'File' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenNewProjectModal}
                  title="New CAM Project Wizard (Presets & Templates) - Ctrl+N"
                >
                  <Plus size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>New<br />Project</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => mcamFileInputRef.current?.click()}
                  title="Open .mcam Project File"
                >
                  <FolderOpen size={22} color="#f59e0b" />
                  <span className="btn-label">Open<br />.mcam</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onSaveProject}
                  title="Quick Save Project (.mcam Package)"
                >
                  <Save size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Save<br />.mcam</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenSaveAsModal}
                  title="Save Project As... (Custom Name & Metadata)"
                >
                  <Download size={20} color="#34d399" />
                  <span className="btn-label">Save<br />As...</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenRecentProjectsModal}
                  title="Recent Projects & Auto-Save Recovery"
                >
                  <Clock size={20} color="#60a5fa" />
                  <span className="btn-label">Recent &amp;<br />Backups</span>
                </button>
              </div>
              <span className="ribbon-group-title">Project Management</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => fileInputRef.current?.click()}
                  title="Open / Import CAD File from Laptop (STEP, STL, MCAM, IGES, etc.)"
                >
                  <Upload size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Open / Import<br />CAD (25 Fmt)</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenExportCADModal}
                  title="Export 3D CAD Geometry (Binary STL, ASCII STL, OBJ)"
                >
                  <Box size={22} color="#a855f7" />
                  <span className="btn-label">Export<br />3D CAD</span>
                </button>
              </div>
              <span className="ribbon-group-title">3D CAD Geometry</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => ncFileInputRef.current?.click()}
                  title="Import Raw CNC G-Code File (.nc, .gcode, .h, .mpf) for 3D Backplot"
                >
                  <FileCode size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Import<br />G-Code</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenGCodeViewer}
                  title="Export CNC G-Code (Fanuc, Heidenhain, Haas, Siemens, GRBL)"
                >
                  <FileCode size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Export<br />G-Code</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenSetupSheet}
                  title="Generate & Print CNC Setup Sheet"
                >
                  <Printer size={22} color="#e2e8f0" />
                  <span className="btn-label">Setup<br />Sheet</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenCostQuotingModal}
                  title="Open CNC Machining Cost, Tool Wear &amp; Production Quoting Calculator"
                >
                  <DollarSign size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 700 }}>Cost &amp;<br />Quoting</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenCornerReliefStudio}
                  title="Open CNC Automatic Corner Relief &amp; Dog-Bone / T-Bone Studio (Pockets, Enclosures &amp; Tabs)"
                >
                  <Box size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 700 }}>Corner<br />Relief</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenKioskModal}
                  title="Open Shop Floor Operator Tablet Kiosk (Touch DRO, Jog Pendant, Feed/Spindle Overrides & E-Stop)"
                >
                  <Tablet size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 700 }}>Operator<br />Kiosk</span>
                </button>

                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenTombstoneStudio}
                  title="Open Multi-WCS Tombstone &amp; 4th-Axis Rotary Indexing Studio (HMC B-Axis &amp; VMC A-Axis Multi-Part)"
                >
                  <Grid size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 700 }}>Tombstone<br />Rotary</span>
                </button>

                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenCustomPostStudio}
                  title="Open Custom Post-Processor Syntax Builder &amp; Macro Variable Engine (Fanuc, Haas, Heidenhain, Siemens, Mach4, GRBL)"
                >
                  <FileCode size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 700 }}>Custom<br />Post</span>
                </button>

                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenAnomalyScanner}
                  title="Open AI Toolpath Anomaly, Deflection &amp; Chatter Diagnostic Scanner (Stability Lobes, Cantilever Deflection &amp; Breakage Prevention)"
                >
                  <Activity size={22} color="#f43f5e" />
                  <span className="btn-label" style={{ color: '#f43f5e', fontWeight: 700 }}>AI Chatter<br />&amp; Deflect</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenHelpGuide}
                  title="Mastercam User Manual & Shortcuts"
                >
                  <HelpCircle size={22} color="#f59e0b" />
                  <span className="btn-label">User<br />Manual</span>
                </button>
              </div>
              <span className="ribbon-group-title">Shop Floor &amp; Help</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('step_bracket')} title="Load Native STEP (ISO 10303-21) Solid B-Rep CAD Part">
                  <FileCode size={19} color="#3b82f6" />
                  <span className="btn-label" style={{ color: '#3b82f6', fontWeight: 600 }}>STEP B-Rep<br />Sample</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('multiaxis_benchmark')} title="Load 5-Axis Multiaxis Benchmark STEP (ISO 10303-21) Part (Swarf Ruled Flange & Morph Saddle)">
                  <Orbit size={19} color="#8b5cf6" />
                  <span className="btn-label" style={{ color: '#8b5cf6', fontWeight: 600 }}>5X STEP<br />Benchmark</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('impeller')} title="Load 5-Axis Impeller">
                  <Compass size={19} color="#a855f7" />
                  <span className="btn-label">5X Impeller<br />Sample</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('bracket')} title="Load Aero Bracket">
                  <Layers size={19} color="#06b6d4" />
                  <span className="btn-label">Aero Bracket<br />Sample</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('mold')} title="Load Mold Core">
                  <Box size={19} color="#f59e0b" />
                  <span className="btn-label">Mold Core<br />Sample</span>
                </button>
              </div>
              <span className="ribbon-group-title">Sample CAD Parts</span>
            </div>
          </>
        )}

        {/* ==================== 2. HOME TAB ==================== */}
        {activeTab === 'Home' && (
          <>
            {/* 1. Clipboard */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                {/* Large Paste Button */}
                <button
                  className="ribbon-btn-large"
                  onClick={onPasteOp}
                  disabled={!canPaste}
                  style={{ opacity: canPaste ? 1 : 0.85 }}
                  title="Paste (Ctrl+V) - Paste entities or operations from clipboard"
                >
                  <div style={{ position: 'relative' }}>
                    <Clipboard size={22} color="#0284c7" />
                    <Plus size={10} color="#10b981" style={{ position: 'absolute', bottom: -2, right: -2 }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Paste</span>
                </button>

                {/* 3-Row Micro-Stack: Cut, Copy, Copy Image */}
                <div className="ribbon-col-stacked">
                  <button className="ribbon-btn-small" onClick={onCutOp} title="Cut Selection (Ctrl+X)">
                    <Scissors size={13} color="#f43f5e" />
                    <span>Cut</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onCopyOp} title="Copy Selection (Ctrl+C)">
                    <Copy size={13} color="#38bdf8" />
                    <span>Copy</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onCopyViewportImage} title="Copy Viewport Canvas Image to Clipboard">
                    <Camera size={13} color="#10b981" />
                    <span>Copy Image</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Clipboard</span>
            </div>

            {/* 2. Attributes (Matching Mastercam Image 3) */}
            <div className="ribbon-group" style={{ position: 'relative' }}>
              <div className="ribbon-group-items" style={{ flexDirection: 'column', gap: '4px', height: '64px', justifyContent: 'center' }}>
                {/* Row 1: Point Style, Line Style, Line Width, 3D/2D toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Point Style Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowPointStyleMenu((prev) => !prev)}
                      className="ribbon-combo-select"
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 5px', height: '22px' }}
                      title="Point Style (*, +, o, .)"
                    >
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7', lineHeight: 1 }}>{pointStyleSymbol}</span>
                      <ChevronDown size={11} color="#64748b" />
                    </button>
                    {showPointStyleMenu && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '70px' }}>
                        {['*', '+', 'o', '•'].map((sym) => (
                          <button
                            key={sym}
                            onClick={() => { setPointStyleSymbol(sym); setShowPointStyleMenu(false); }}
                            style={{ background: pointStyleSymbol === sym ? '#e0f2fe' : 'none', border: 'none', padding: '3px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 700, cursor: 'pointer', borderRadius: '3px' }}
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Line Style Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowLineStyleMenu((prev) => !prev)}
                      className="ribbon-combo-select"
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 5px', height: '22px' }}
                      title="Line Style (Solid, Hidden, Center, Phantom)"
                    >
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#334155', fontWeight: 700 }}>{lineStyleText}</span>
                      <ChevronDown size={11} color="#64748b" />
                    </button>
                    {showLineStyleMenu && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '95px' }}>
                        {[
                          { label: '───', name: 'Solid' },
                          { label: '- - -', name: 'Hidden' },
                          { label: '─ · ─', name: 'Center' },
                          { label: '─ ·· ─', name: 'Phantom' }
                        ].map((st) => (
                          <button
                            key={st.name}
                            onClick={() => { setLineStyleText(st.label); setShowLineStyleMenu(false); }}
                            style={{ background: lineStyleText === st.label ? '#e0f2fe' : 'none', border: 'none', padding: '3px 8px', textAlign: 'left', fontSize: '11px', cursor: 'pointer', borderRadius: '3px' }}
                          >
                            {st.label} {st.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Line Width Dropdown (Matching Image 3) */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowLineWidthMenu((prev) => !prev)}
                      className="ribbon-combo-select"
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 5px', height: '22px' }}
                      title="Line Width (Thin, Medium, Thick)"
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                        {lineWidth === '1px' ? '― 1' : lineWidth === '2px' ? '━ 2' : '█ 3'}
                      </span>
                      <ChevronDown size={11} color="#64748b" />
                    </button>
                    {showLineWidthMenu && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '90px' }}>
                        {[
                          { label: '― Thin (1px)', val: '1px' },
                          { label: '━ Medium (2px)', val: '2px' },
                          { label: '█ Thick (3px)', val: '3px' }
                        ].map((w) => (
                          <button
                            key={w.val}
                            onClick={() => { setLineWidth(w.val); setShowLineWidthMenu(false); }}
                            style={{ background: lineWidth === w.val ? '#e0f2fe' : 'none', border: 'none', padding: '3px 8px', textAlign: 'left', fontSize: '11px', cursor: 'pointer', borderRadius: '3px' }}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3D / 2D Toggle Button */}
                  <button
                    onClick={onToggleConstructionMode}
                    className="ribbon-btn-small"
                    style={{
                      height: '22px',
                      padding: '1px 7px',
                      fontWeight: 700,
                      fontSize: '11px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      backgroundColor: constructionMode === '3d' ? '#e0f2fe' : '#fef3c7',
                      color: constructionMode === '3d' ? '#0284c7' : '#d97706'
                    }}
                    title="Toggle Construction Mode between 3D Space and 2D Plane at Z depth"
                  >
                    {constructionMode === '3d' ? '3D' : '2D'}
                  </button>
                </div>

                {/* Row 2: Mastercam Default/Standard Color Dropdown (Image 3) & Swatches */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {/* Mastercam Colors Dropdown Palette */}
                  <HomeAttributesColorDropdown
                    activeColor={workpieceColor || '#3b82f6'}
                    onChangeColor={onChangeWorkpieceColor}
                  />

                  {/* Quick Palette Swatches */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {['#3b82f6', '#94a3b8', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'].map((col) => (
                      <button
                        key={col}
                        onClick={() => onChangeWorkpieceColor(col)}
                        style={{
                          width: '18px',
                          height: '14px',
                          backgroundColor: col,
                          border: workpieceColor === col ? '1.5px solid #000' : '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                className="ribbon-dialog-launcher"
                onClick={onOpenAttributesModal}
                title="Open Attributes / Select All Mask Dialog (Image 4)"
              >
                <CornerDownRight size={10} />
              </button>
              <span className="ribbon-group-title">Attributes</span>
            </div>

            {/* 3. Organize */}
            <div className="ribbon-group">
              <div className="ribbon-group-items" style={{ flexDirection: 'column', gap: '4px', height: '64px', justifyContent: 'center' }}>
                {/* Z Depth Input Field */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', minWidth: '12px' }}>Z</span>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '0 2px', height: '22px' }}>
                    <input
                      type="number"
                      step="0.5"
                      value={constructionZ}
                      onChange={(e) => onChangeConstructionZ && onChangeConstructionZ(parseFloat(e.target.value) || 0)}
                      style={{ width: '48px', border: 'none', outline: 'none', fontSize: '11px', fontFamily: 'monospace', padding: '1px 3px', color: '#0f172a' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0' }}>
                      <button
                        onClick={() => onChangeConstructionZ && onChangeConstructionZ((prev) => (parseFloat(prev) || 0) + 1.0)}
                        style={{ border: 'none', background: 'none', padding: '0 2px', lineHeight: 0.5, cursor: 'pointer', color: '#64748b' }}
                      >
                        ▴
                      </button>
                      <button
                        onClick={() => onChangeConstructionZ && onChangeConstructionZ((prev) => (parseFloat(prev) || 0) - 1.0)}
                        style={{ border: 'none', background: 'none', padding: '0 2px', lineHeight: 0.5, cursor: 'pointer', color: '#64748b' }}
                      >
                        ▾
                      </button>
                    </div>
                  </div>
                </div>

                {/* Level Selector Combo Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={13} color="#0284c7" />
                  <select
                    value={activeLevelId}
                    onChange={(e) => onSelectLevel && onSelectLevel(parseInt(e.target.value))}
                    className="ribbon-combo-select"
                    style={{ width: '96px', fontSize: '10.5px' }}
                    title="Active Construction Level (Layers)"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.number} : {lvl.name || 'Level'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <span className="ribbon-group-title">Organize</span>
            </div>

            {/* 4. Select & Delete */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${isSelectModeActive || (isSketchModeActive && sketchTool === 'select') ? 'active' : ''}`}
                  onClick={() => onToggleSelectMode && onToggleSelectMode(!(isSelectModeActive || (isSketchModeActive && sketchTool === 'select')))}
                  title="Window / Crossing Selection Mode (V) — Drag L->R Enclosed, R->L Crossing"
                >
                  <MousePointer size={20} color="#0284c7" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Window<br />Select</span>
                </button>

                {/* Large Delete Entities Button */}
                <button
                  className="ribbon-btn-large"
                  onClick={onDeleteActiveOp}
                  title="Delete Selected Entities or Operations (Delete key)"
                >
                  <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={22} color="#dc2626" strokeWidth={3} />
                  </div>
                  <span className="btn-label" style={{ color: '#dc2626', fontWeight: 600 }}>Delete<br />Entities</span>
                </button>

                {/* 3-Row Micro-Stack: Non-Associative, Duplicates, Undelete Entity */}
                <div className="ribbon-col-stacked">
                  <button className="ribbon-btn-small" onClick={onDeleteNonAssociative} title="Select and delete non-associative geometry">
                    <X size={12} color="#f59e0b" strokeWidth={2.5} />
                    <span>Non-Associative</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onDeleteDuplicates} title="Find and delete duplicate overlapping entities">
                    <Copy size={12} color="#f59e0b" />
                    <span>Duplicates</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onUndeleteEntity} title="Restore entity deleted with Non-Associative Delete">
                    <RotateCcw size={12} color="#10b981" />
                    <span>Undelete Entity</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Delete</span>
            </div>

            {/* 5. Display */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                {/* Large Hide/Unhide Button */}
                <button
                  className="ribbon-btn-large"
                  onClick={onInvertVisibility}
                  title="Hide / Unhide (Alt+E) - Toggle isolated display of selection"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: '20px', height: '20px' }}>
                    <div style={{ background: '#38bdf8', borderRadius: '1px' }}></div>
                    <div style={{ background: '#f59e0b', borderRadius: '1px' }}></div>
                    <div style={{ background: '#94a3b8', borderRadius: '1px' }}></div>
                    <div style={{ background: '#10b981', borderRadius: '1px' }}></div>
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Hide/Unhide</span>
                </button>

                {/* 3-Row Micro-Stack: Arc Center Points, Endpoints, Blank */}
                <div className="ribbon-col-stacked">
                  <button
                    className={`ribbon-btn-small ${showArcCenters ? 'active' : ''}`}
                    onClick={onToggleArcCenters}
                    title="Toggle display of arc and circle center points"
                  >
                    <Disc size={12} color={showArcCenters ? '#ffffff' : '#0284c7'} />
                    <span>Arc Center Points</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${showEndpoints ? 'active' : ''}`}
                    onClick={onToggleEndpoints}
                    title="Toggle curve endpoints indicator vertices"
                  >
                    <Crosshair size={12} color={showEndpoints ? '#ffffff' : '#64748b'} />
                    <span>Endpoints</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={onToggleBlank}
                    title="Blank / Unblank selected entities"
                  >
                    <Eye size={12} color="#64748b" />
                    <span>Blank</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Display</span>
            </div>

            {/* 6. Analyze */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                {/* 3 Large Buttons */}
                <button className="ribbon-btn-large" onClick={onOpenEntityAnalyzer} title="Analyze Entity (F4) - Inspect geometry properties and dimensions">
                  <div style={{ position: 'relative' }}>
                    <Crosshair size={22} color="#0284c7" />
                    <span style={{ position: 'absolute', top: -3, right: -4, fontSize: '10px', fontWeight: 800, color: '#0284c7' }}>?</span>
                  </div>
                  <span className="btn-label" style={{ color: '#0284c7', fontWeight: 600 }}>Analyze<br />Entity</span>
                </button>

                <button className="ribbon-btn-large" onClick={onOpenDistanceCaliper} title="Analyze Distance - Measure distance and delta XYZ between entities">
                  <div style={{ position: 'relative' }}>
                    <Ruler size={22} color="#d97706" />
                    <span style={{ position: 'absolute', top: -3, right: -4, fontSize: '10px', fontWeight: 800, color: '#d97706' }}>?</span>
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Analyze<br />Distance</span>
                </button>

                <button className="ribbon-btn-large" onClick={onOpenToolpathAnalyzer} title="Analyze Toolpath - Inspect toolpath feed rate, motion and cycle time">
                  <Activity size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Analyze<br />Toolpath</span>
                </button>

                {/* Sub-column 1: ? Dynamic, ? Angle, ? Chain */}
                <div className="ribbon-col-stacked">
                  <button className="ribbon-btn-small" onClick={onOpenDynamicAnalyzer} title="Dynamic entity & radius inspector">
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7' }}>?</span>
                    <span>Dynamic</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onOpenAngleAnalyzer} title="Measure angle between entities">
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7' }}>?</span>
                    <span>Angle</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onOpenChainAnalyzer} title="Analyze wireframe chain continuity and leaks">
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7' }}>?</span>
                    <span>Chain</span>
                  </button>
                </div>

                {/* Sub-column 2: Check Solid ▾, 2D Area ▾, ∑ Statistics */}
                <div className="ribbon-col-stacked">
                  <button className="ribbon-btn-small" onClick={onOpenCheckSolid} title="Check Solid watertight integrity and topology">
                    <CheckSquare size={12} color="#10b981" />
                    <span>Check Solid ▾</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onOpen2DArea} title="Calculate 2D planar projected area">
                    <Grid size={12} color="#a855f7" />
                    <span>2D Area ▾</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onOpenStatistics} title="File and geometry statistics">
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#334155' }}>∑</span>
                    <span>Statistics</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Analyze</span>
            </div>

            {/* 7. Add-Ins */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onOpenAddInsManager} title="Run Mastercam C-Hook / NET-Hook User Application (Alt+C)">
                  <Cpu size={22} color="#0284c7" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Run<br />Add-In</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenCommandFinder} title="Search and launch any Mastercam Ribbon command">
                  <Search size={22} color="#0284c7" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Command<br />Finder</span>
                </button>
              </div>
              <span className="ribbon-group-title">Add-Ins</span>
            </div>
          </>
        )}

        {/* ==================== 3. WIREFRAME TAB ==================== */}
        {activeTab === 'Wireframe' && (
          <>
            {/* 0. Select */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${isSelectModeActive || (isSketchModeActive && sketchTool === 'select') ? 'active' : ''}`}
                  onClick={() => onToggleSelectMode && onToggleSelectMode(!(isSelectModeActive || (isSketchModeActive && sketchTool === 'select')))}
                  title="Window / Crossing Selection (V) — Drag L->R Enclosed, R->L Crossing, Shift to Add"
                >
                  <MousePointer size={22} color="#0284c7" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Window<br />Select</span>
                </button>
              </div>
              <span className="ribbon-group-title">Select</span>
            </div>

            {/* 1. Points */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && (sketchTool === 'point' || sketchTool === 'drill') ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('point') : (onOpenWireframeModal && onOpenWireframeModal('datum'))}
                  title="Point Position (P) - Place 3D coordinate point / datum on viewport or along curves"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={22} color="#0284c7" strokeWidth={2.5} />
                    <div style={{ position: 'absolute', width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Point<br />Position ▾</span>
                </button>
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && sketchTool === 'bolt_circle' ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('bolt_circle') : (onOpenWireframeModal && onOpenWireframeModal('pcd'))}
                  title="Bolt Circle - Create Pitch Circle Diameter (PCD) bolt hole pattern with live preview"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Circle size={20} color="#38bdf8" strokeWidth={1.5} />
                    <div style={{ position: 'absolute', top: 1, left: 9, width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: 1, left: 9, width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: 9, left: 1, width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', top: 9, right: 1, width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Bolt<br />Circle</span>
                </button>
              </div>
              <span className="ribbon-group-title">Points</span>
            </div>

            {/* 2. Lines */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && sketchTool === 'line' ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('line') : (onOpenWireframeModal && onOpenWireframeModal('line'))}
                  title="Line Endpoints (L) - Create 2D/3D wireframe line between endpoints"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '24px', height: '2px', background: '#0284c7', transform: 'rotate(-35deg)' }} />
                    <div style={{ position: 'absolute', top: 2, right: 1, width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: 2, left: 1, width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Line<br />Endpoints</span>
                </button>

                <div className="ribbon-col-stacked">
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'line_parallel' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('line_parallel') : (onOpenWireframeModal && onOpenWireframeModal('parallel'))}
                    title="Line Parallel - Create parallel line at offset distance"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '13px' }}>
                      <div style={{ width: '13px', height: '1.5px', background: '#0284c7' }} />
                      <div style={{ width: '13px', height: '1.5px', background: '#0284c7' }} />
                    </div>
                    <span>Line Parallel</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'line_perp' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('line_perp') : (onOpenWireframeModal && onOpenWireframeModal('perp'))}
                    title="Line Perpendicular - Create 90° normal line from entity"
                  >
                    <div style={{ position: 'relative', width: '12px', height: '12px' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12px', height: '1.5px', background: '#0284c7' }} />
                      <div style={{ position: 'absolute', top: 0, left: '5px', width: '1.5px', height: '12px', background: '#0284c7' }} />
                    </div>
                    <span>Line Perpendicular</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'line_closest' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('line_closest') : (onOpenWireframeModal && onOpenWireframeModal('closest'))}
                    title="Line Closest - Create line connecting closest points between entities"
                  >
                    <div style={{ width: '12px', height: '1.5px', background: '#64748b' }} />
                    <span>Line Closest ▾</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Lines</span>
            </div>

            {/* 3. Arcs */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && sketchTool === 'circle' ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('circle') : (onOpenWireframeModal && onOpenWireframeModal('circle'))}
                  title="Circle Center Point (C) - Create circle by center coordinates and radius"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Circle size={20} color="#0284c7" strokeWidth={2} />
                    <div style={{ position: 'absolute', width: '3px', height: '3px', background: '#0284c7', borderRadius: '50%' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Circle<br />Center Point</span>
                </button>

                <div className="ribbon-col-stacked">
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'arc_3pt' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('arc_3pt') : (onOpenWireframeModal && onOpenWireframeModal('arc3pt'))}
                    title="Arc 3 Points - Create circular arc passing through 3 points"
                  >
                    <Orbit size={13} color="#0284c7" />
                    <span>Arc 3 Points</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && (sketchTool === 'arc_tangent' || sketchTool === 'arctangent') ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('arc_tangent') : (onOpenWireframeModal && onOpenWireframeModal('arctangent'))}
                    title="Arc Tangent - Create circular arc tangent to two curves"
                  >
                    <Disc size={13} color="#0284c7" />
                    <span>Arc Tangent</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'circle_edge' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('circle_edge') : (onOpenWireframeModal && onOpenWireframeModal('circle'))}
                    title="Circle Edge Point - Create circle defined by edge points"
                  >
                    <Circle size={13} color="#64748b" />
                    <span>Circle Edge Point ▾</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Arcs</span>
            </div>

            {/* 4. Splines */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && sketchTool === 'spline' ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('spline') : (onOpenWireframeModal && onOpenWireframeModal('spline'))}
                  title="Spline Manual - Create smooth NURBS / Catmull-Rom spline through points"
                >
                  <Sliders size={22} color="#0284c7" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Spline<br />Manual ▾</span>
                </button>
              </div>
              <span className="ribbon-group-title">Splines</span>
            </div>

            {/* 5. Shapes */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && sketchTool === 'rect' ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('rect') : (onOpenWireframeModal && onOpenWireframeModal('rect'))}
                  title="Rectangle (R) - Create 2D wireframe rectangle or pocket boundary"
                >
                  <Square size={22} color="#0284c7" strokeWidth={2} />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Rectangle</span>
                </button>

                {/* Column 1: Create Letters, Bounding Box, Silhouette Boundary */}
                <div className="ribbon-col-stacked">
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('letters') : onAddWireframe('letters')}
                    title="Create Letters - Generate vector TrueType and stick font lettering"
                  >
                    <Type size={13} color="#0284c7" />
                    <span>Create Letters</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={onCreateBoundingBox}
                    title="Bounding Box - Generate 3D wireframe bounding box around part"
                  >
                    <Box size={13} color="#0284c7" />
                    <span>Bounding Box</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={onCreateSilhouette}
                    title="Silhouette Boundary - Project 2D silhouette boundary profile"
                  >
                    <Layers size={13} color="#0284c7" />
                    <span>Silhouette Boundary</span>
                  </button>
                </div>

                {/* Column 2: Turn Profile, Relief Groove, Raster to Vector, Stairs & Doors */}
                <div className="ribbon-col-stacked">
                  <button
                    className="ribbon-btn-small"
                    onClick={onCreateTurnProfile}
                    title="Turn Profile - Extract 2D lathe turning envelope profile"
                  >
                    <Disc size={13} color="#0284c7" />
                    <span>Turn Profile</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('relief') : onAddWireframe('relief')}
                    title="Relief Groove - Generate standard DIN undercut relief groove"
                  >
                    <Scissors size={13} color="#0284c7" />
                    <span>Relief Groove</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('raster') : onAddWireframe('raster')}
                    title="Raster to Vector - Convert bitmap image to vector wireframe"
                  >
                    <Sparkles size={13} color="#0284c7" />
                    <span>Raster to Vector</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onAddWireframe && onAddWireframe('stair')}
                    title="Stair Geometry - Generate parametric stair tread wireframe"
                  >
                    <Box size={13} color="#64748b" />
                    <span>Stair Geometry</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Shapes</span>
            </div>

            {/* 6. Curves */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onExtractOneEdge}
                  title="Curve One Edge - Extract 3D wireframe curve along selected solid edge"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px' }}>
                    <Box size={22} color="#94a3b8" />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '22px', height: '2px', background: '#0284c7' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Curve<br />One Edge</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onExtractAllEdges}
                  title="Curve All Edges - Extract wireframe curves for all solid model edges"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px' }}>
                    <Box size={22} color="#0284c7" />
                  </div>
                  <span className="btn-label" style={{ color: '#0284c7', fontWeight: 600 }}>Curve All<br />Edges</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onCreateCurveSlice}
                  title="Curve Slice - Slice 3D model with active plane to create cross-section curve"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box size={22} color="#64748b" />
                    <div style={{ position: 'absolute', width: '24px', height: '2px', background: '#10b981' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Curve<br />Slice ▾</span>
                </button>
              </div>
              <span className="ribbon-group-title">Curves</span>
            </div>

            {/* 7. Modify */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                {/* 1. Dynamic Trim (Signature Mastercam Tool) */}
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && sketchTool === 'dynamic_trim' ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('dynamic_trim') : (onOpenWireframeModal && onOpenWireframeModal('trim'))}
                  title="Dynamic Trim (T) - Drag scissor stroke across wireframe entities to snip between intersections"
                >
                  <Scissors size={22} color="#f43f5e" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Dynamic<br />Trim</span>
                </button>

                {/* 2. Trim to Entities (1, 2, 3 entities) */}
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && (sketchTool === 'trim_2' || sketchTool === 'trim_1') ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('trim_2') : (onOpenWireframeModal && onOpenWireframeModal('trim'))}
                  title="Trim to Entities - Interactively trim/extend two entities to clean corner intersection"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '18px', height: '1.5px', background: '#0284c7', transform: 'rotate(45deg)' }} />
                    <div style={{ width: '18px', height: '1.5px', background: '#0284c7', transform: 'rotate(-45deg)' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Trim to<br />Entities ▾</span>
                </button>

                {/* 3. Break Two Pieces */}
                <button
                  className={`ribbon-btn-large ${isSketchModeActive && sketchTool === 'divide' ? 'active' : ''}`}
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('divide') : onBreakManyPieces()}
                  title="Break Two Pieces - Divide entity at point or into segments"
                >
                  <Disc size={20} color="#64748b" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Break Two<br />Pieces</span>
                </button>

                {/* Column 1: Divide, Join, Modify Length */}
                <div className="ribbon-col-stacked">
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'divide' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('divide') : onBreakManyPieces()}
                    title="Divide - Break curve into N equal segments"
                  >
                    <Disc size={12} color="#64748b" />
                    <span>Divide</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={onJoinEntities}
                    title="Join contiguous collinear segments"
                  >
                    <Plus size={12} color="#0284c7" />
                    <span>Join Entities</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'modify_length' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('modify_length') : (onOpenWireframeModal && onOpenWireframeModal('line'))}
                    title="Modify Length - Dynamically extend or shorten lines by delta or %"
                  >
                    <Move size={12} color="#0284c7" />
                    <span>Modify Length ▾</span>
                  </button>
                </div>

                {/* Column 2: Fillet, Chamfer, Offset */}
                <div className="ribbon-col-stacked">
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'fillet' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('fillet') : (onOpenWireframeModal && onOpenWireframeModal('fillet'))}
                    title="Fillet Entities (F) - Add tangent circular fillet radius between curves"
                  >
                    <Orbit size={13} color="#10b981" />
                    <span>Fillet Entities ▾</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'chamfer' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('chamfer') : (onOpenWireframeModal && onOpenWireframeModal('chamfer'))}
                    title="Chamfer Entities - Add beveled chamfer corner between lines"
                  >
                    <Scissors size={13} color="#f59e0b" />
                    <span>Chamfer Entities ▾</span>
                  </button>
                  <button
                    className={`ribbon-btn-small ${isSketchModeActive && sketchTool === 'offset' ? 'active' : ''}`}
                    onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('offset') : (onOpenWireframeModal && onOpenWireframeModal('offset'))}
                    title="Offset Entity - Offset wireframe contour by distance"
                  >
                    <Move size={13} color="#0284c7" />
                    <span>Offset Entity</span>
                  </button>
                </div>

                {/* Column 3: Project, Close Arc, Clear */}
                <div className="ribbon-col-stacked" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '4px' }}>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onProjectWireframe ? onProjectWireframe() : (onOpenWireframeModal ? onOpenWireframeModal('project') : onAddWireframe('project'))}
                    title="Project - Project and flatten wireframe curves onto active CPlane (Z=0)"
                  >
                    <ArrowDown size={12} color="#a855f7" />
                    <span>Project</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={onCloseArc || onBreakManyPieces}
                    title="Close Arc - Convert open circular arc to 360° circle"
                  >
                    <Circle size={12} color="#0284c7" />
                    <span>Close Arc ▾</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={onClearWireframes}
                    title="Clear All Level 10 Wireframe Geometry"
                  >
                    <Trash2 size={12} color="#ef4444" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Modify</span>
            </div>

            {/* Chaining Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenChaining}
                  title="Chaining Manager - Select closed 2D wireframe contours and partial chains"
                >
                  <Layers size={22} color="#0284c7" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Chaining<br />Manager</span>
                </button>
              </div>
              <span className="ribbon-group-title">Chains</span>
            </div>
          </>
        )}

        {/* ==================== 4. SURFACES TAB ==================== */}
        {activeTab === 'Surfaces' && (
          <SurfacesRibbonGroup
            onAction={(action, id) => {
              if (onOpenSurfacesModal) {
                onOpenSurfacesModal(action || id);
              } else if (onAddSurface) {
                onAddSurface(id);
              }
            }}
          />
        )}

        {/* ==================== 5. SOLIDS TAB ==================== */}
        {activeTab === 'Solids' && (
          <SolidsRibbonGroup
            onAction={(action, id) => {
              if (onOpenSolidsModal) {
                onOpenSolidsModal(action || id);
              } else if (onAddSolid) {
                onAddSolid(id);
              }
            }}
          />
        )}

        {/* ==================== 6. MODEL PREP TAB ==================== */}
        {activeTab === 'Model Prep' && (
          <ModelPrepRibbonGroup
            onAction={(action, id) => {
              if (onOpenModelPrepModal) {
                onOpenModelPrepModal(action || id);
              }
            }}
          />
        )}

        {/* ==================== 7. MESH TAB ==================== */}
        {activeTab === 'Mesh' && (
          <>
            {/* Decimation & Subdivision */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenMeshModal ? onOpenMeshModal('decimate') : null}
                  title="Mesh Decimation (Intelligent Triangle Reduction for CAM)"
                >
                  <Scissors size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Decimate<br />Mesh</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenMeshModal ? onOpenMeshModal('subdivide') : null}
                  title="Subdivide &amp; Refine Mesh (4x Density for Fine Finishing)"
                >
                  <Layers size={22} color="#60a5fa" />
                  <span className="btn-label" style={{ color: '#60a5fa', fontWeight: 600 }}>Subdivide<br />(4x Refine)</span>
                </button>
              </div>
              <span className="ribbon-group-title">Refinement</span>
            </div>

            {/* Smoothing & Healing */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenMeshModal ? onOpenMeshModal('smooth') : null}
                  title="Laplacian Mesh Smoothing (Filter Scanning Artifacts &amp; Facet Noise)"
                >
                  <Sparkles size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Laplacian<br />Smooth</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenMeshModal ? onOpenMeshModal('repair') : null}
                  title="Hole Filling &amp; Non-Manifold Healing (Make Watertight)"
                >
                  <CheckCircle2 size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Fill Holes<br />&amp; Heal</span>
                </button>
              </div>
              <span className="ribbon-group-title">Conditioning</span>
            </div>

            {/* Reverse Engineering & Wireframes */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenMeshModal ? onOpenMeshModal('repair') : null}
                  title="Extract Sharp Crease Boundaries to Level 10 Wireframe"
                >
                  <Grid size={21} color="#a855f7" />
                  <span className="btn-label">Extract<br />Curves</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenEntityAnalyzer}
                  title="Inspect Triangle Budget &amp; Vertex Normal Vectors"
                >
                  <Compass size={21} color="#94a3b8" />
                  <span className="btn-label">Mesh<br />Diagnostics</span>
                </button>
              </div>
              <span className="ribbon-group-title">Reverse Eng</span>
            </div>

            {/* Export */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenMeshModal ? onOpenMeshModal('export') : onExportSTL()}
                  title="Export Mesh Formats (Binary STL, ASCII STL, Wavefront OBJ)"
                >
                  <Download size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Export<br />Mesh</span>
                </button>
              </div>
              <span className="ribbon-group-title">Export</span>
            </div>
          </>
        )}

        {/* ==================== 8. DRAFTING TAB ==================== */}
        {activeTab === 'Drafting' && (
          <DraftingRibbonGroup
            onAction={(action, id) => {
              if (onOpenDraftingModal) {
                onOpenDraftingModal(action || id);
              }
            }}
          />
        )}

        {/* ==================== 9. TRANSFORM TAB ==================== */}
        {activeTab === 'Transform' && (
          <TransformRibbonGroup
            onAction={(action, id) => {
              if (action === 'transform_geometry_nesting' && onOpenNestingStudio) {
                onOpenNestingStudio();
                return;
              }
              if (onOpenTransformModal) {
                onOpenTransformModal(action || id);
              }
            }}
          />
        )}

        {/* ==================== 10. MACHINE TAB ==================== */}
        {activeTab === 'Machine' && (
          <MachineRibbonGroup
            activeMachine={activeMachine}
            machines={machines}
            machineMenuByCategory={machineMenuByCategory}
            machineDirectory={machineDirectory}
            onAction={(action, id) => {
              if (action.startsWith('machine_atp') && onOpenATPModal) {
                const tab = action === 'machine_atp_reports' ? 'reports' : action === 'machine_atp_options' ? 'options' : 'wizard';
                onOpenATPModal(tab);
                return;
              }
              if (action === 'machine_machine_definition' || action === 'machine_control_definition') {
                if (onOpenMachineConfigModal) onOpenMachineConfigModal();
                return;
              }
              if (action === 'machine_material_definition' && onOpenStockModal) {
                onOpenStockModal();
                return;
              }
              if (action === 'machine_generate_post' && onOpenPostModal) {
                onOpenPostModal();
                return;
              }
              if ((action === 'machine_backplot' || action === 'machine_sim_backplot') && onStartBackplot) {
                onStartBackplot();
                return;
              }
              if (action === 'machine_verify' || action === 'machine_sim_verify') {
                if (onOpenSolidVerifyModal) onOpenSolidVerifyModal();
                else if (onStartVerify) onStartVerify(null, 'verify');
                return;
              }
              if ((action === 'machine_simulate' || action === 'machine_sim_run') && onOpenSimModal) {
                onOpenSimModal();
                return;
              }
              if (action === 'machine_create_setup_sheet' && onOpenSetupSheet) {
                onOpenSetupSheet();
                return;
              }
              if (action === 'machine_image_capture') {
                if (onCopyViewportImage) onCopyViewportImage();
                return;
              }
              if (action === 'machine_clear_image_list') {
                return;
              }
              if (action === 'machine_select_id' && id && onSelectMachine) {
                onSelectMachine(id);
                return;
              }
              if (action === 'machine_manage_list' && onOpenMachineMenuManager) {
                onOpenMachineMenuManager(id || 'mill');
                return;
              }
              if (action === 'machine_design' && onSelectMachine) {
                onSelectMachine('design');
                return;
              }
            }}
          />
        )}

        {/* ==================== 11. VIEW TAB ==================== */}
        {activeTab === 'View' && (
          <ViewRibbonGroup
            activeManagerTab={activeManagerTab}
            renderMode={renderMode}
            materialStyle={materialStyle}
            translucencyEnabled={translucencyEnabled}
            showBackside={showBackside}
            showAxes={showAxes}
            showGnomons={showGnomons}
            showGrid={showGrid}
            snapToGrid={snapToGrid}
            isViewsheetsVisible={isViewsheetsVisible}
            onAction={(action, id, payload) => {
              // Zoom Actions
              if (action === 'view_zoom_fit' && onSnapCamera) {
                onSnapCamera('fit');
                return;
              }
              if (action === 'view_unzoom_50' && onSnapCamera) {
                onSnapCamera('unzoom_50');
                return;
              }
              if (action === 'view_unzoom_80' && onSnapCamera) {
                onSnapCamera('unzoom_80');
                return;
              }
              if (action === 'view_zoom_window') {
                if (payload === 'target' && onSnapCamera) onSnapCamera('fit');
                return;
              }

              // Graphics View Actions
              if (action === 'view_gv_top' && onSnapCamera) {
                onSnapCamera('top');
                return;
              }
              if (action === 'view_gv_iso' && onSnapCamera) {
                onSnapCamera('iso');
                return;
              }
              if (action === 'view_gv_right' && onSnapCamera) {
                if (payload === 'left_neg') onSnapCamera('left');
                else onSnapCamera('right');
                return;
              }
              if (action === 'view_gv_front' && onSnapCamera) {
                if (payload === 'back_pos') onSnapCamera('back');
                else if (payload === 'bottom_neg') onSnapCamera('bottom');
                else onSnapCamera('front');
                return;
              }

              // Appearance Actions
              if (action === 'view_appearance_launcher' && onOpenViewStudioModal) {
                onOpenViewStudioModal();
                return;
              }
              if (action === 'view_app_wireframe' && onChangeRenderMode) {
                onChangeRenderMode(renderMode === 'wireframe' ? 'edges' : 'wireframe');
                return;
              }
              if (action === 'view_app_outline_shaded' && onChangeRenderMode) {
                if (payload === 'filled_shaded') onChangeRenderMode('shaded');
                else if (payload === 'hidden_line') onChangeRenderMode('hidden_line');
                else onChangeRenderMode('edges');
                return;
              }
              if (action === 'view_mat_metallic' && onChangeMaterialStyle) {
                onChangeMaterialStyle('metallic');
                if (onChangeRenderMode) onChangeRenderMode('shaded');
                return;
              }
              if (action === 'view_mat_plastic' && onChangeMaterialStyle) {
                onChangeMaterialStyle('plastic');
                if (onChangeRenderMode) onChangeRenderMode('shaded');
                return;
              }
              if (action === 'view_mat_glossy' && onChangeMaterialStyle) {
                onChangeMaterialStyle('glossy');
                if (onChangeRenderMode) onChangeRenderMode('shaded');
                return;
              }
              if (action === 'view_mat_translucency' && onToggleTranslucency) {
                onToggleTranslucency();
                return;
              }
              if (action === 'view_mat_backside' && onToggleBackside) {
                onToggleBackside();
                return;
              }

              // Managers Actions
              if (action.startsWith('view_mgr_') && onSelectManagerTab) {
                const targetTab = payload || (action === 'view_mgr_toolpaths' ? 'Toolpaths'
                  : action === 'view_mgr_solids' ? 'Solids'
                  : action === 'view_mgr_planes' ? 'Planes'
                  : action === 'view_mgr_levels' ? 'Levels'
                  : action === 'view_mgr_groups' ? 'Groups'
                  : action === 'view_mgr_recent' ? 'Recent Functions'
                  : action === 'view_mgr_multithreading' ? 'Multi-Threading'
                  : null);
                if (targetTab) onSelectManagerTab(targetTab);
                return;
              }

              // Display Actions
              if (action === 'view_disp_axes' && onToggleAxes) {
                onToggleAxes();
                return;
              }
              if (action === 'view_disp_gnomons' && onToggleGnomons) {
                onToggleGnomons();
                return;
              }

              // Grid Actions
              if (action === 'view_grid_launcher' && onOpenViewStudioModal) {
                onOpenViewStudioModal();
                return;
              }
              if (action === 'view_grid_show' && onToggleGrid) {
                onToggleGrid();
                return;
              }
              if (action === 'view_grid_snap' && onToggleSnapToGrid) {
                onToggleSnapToGrid();
                return;
              }

              // Controller Actions
              if (action === 'view_controller_rotation_position') {
                if (onSnapCamera) onSnapCamera('fit');
                return;
              }

              // Viewsheets Actions
              if (action === 'view_viewsheet_toggle' && onToggleViewsheets) {
                onToggleViewsheets();
                return;
              }
              if (action === 'view_viewsheet_new' && onAddViewsheet) {
                onAddViewsheet();
                return;
              }
              if (action === 'view_viewsheet_save' && onSaveViewsheetBookmark) {
                onSaveViewsheetBookmark();
                return;
              }
              if (action === 'view_viewsheet_restore' && onRestoreViewsheetBookmark) {
                onRestoreViewsheetBookmark();
                return;
              }
            }}
          />
        )}

        {/* ==================== 12. TOOLPATHS TAB ==================== */}
        {activeTab === 'Toolpaths' && (
          <ToolpathsRibbonGroup
            stockVisible={layerVisibility?.stock !== false}
            onAction={(action, id, opType) => {
              // 2D Toolpaths
              if (action.startsWith('tp_2d_')) {
                if (opType && onQuickAddOp) {
                  onQuickAddOp(opType);
                } else if (onQuickAddOp) {
                  onQuickAddOp('contour');
                }
                return;
              }

              // 3D Toolpaths
              if (action.startsWith('tp_3d_')) {
                if (action === 'tp_3d_optirough') {
                  if (onOpenOptiRoughModal) {
                    onOpenOptiRoughModal();
                    return;
                  }
                  if (onOpenAdaptiveModal) {
                    onOpenAdaptiveModal();
                    return;
                  }
                }
                if (action === 'tp_3d_pocket' || action === 'tp_3d_rough_pocket') {
                  if (onOpenSurfaceRoughPocketModal) {
                    onOpenSurfaceRoughPocketModal();
                    return;
                  }
                }
                if (action === 'tp_3d_rough_parallel' || action === 'tp_3d_parallel_rough') {
                  if (onOpenSurfaceRoughParallelModal) {
                    onOpenSurfaceRoughParallelModal();
                    return;
                  }
                }
                if (action === 'tp_3d_rough_waterline' || action === 'tp_3d_waterline_rough' || action === 'tp_3d_waterline') {
                  if (onOpenSurfaceRoughWaterlineModal) {
                    onOpenSurfaceRoughWaterlineModal();
                    return;
                  }
                }
                if (action === 'tp_3d_finish_flowline' && onOpenSurfaceFinishFlowline) {
                  onOpenSurfaceFinishFlowline();
                  return;
                }
                if (action === 'tp_3d_finish_contour' && onOpenSurfaceFinishContour) {
                  onOpenSurfaceFinishContour();
                  return;
                }
                if (action === 'tp_3d_finish_pocket' && onOpenSurfaceFinishPocket) {
                  onOpenSurfaceFinishPocket();
                  return;
                }
                if (action === 'tp_3d_finish_shallow' && onOpenSurfaceFinishShallow) {
                  onOpenSurfaceFinishShallow();
                  return;
                }
                if ((action === 'tp_3d_finish_parallel' || action === 'tp_3d_parallel') && onOpenSurfaceFinishParallel) {
                  onOpenSurfaceFinishParallel();
                  return;
                }
                if ((action === 'tp_3d_finish_parallel_steep' || action === 'tp_3d_parallel_steep') && onOpenSurfaceFinishParallelSteep) {
                  onOpenSurfaceFinishParallelSteep();
                  return;
                }
                if ((action === 'tp_3d_finish_pencil' || action === 'tp_3d_pencil') && onOpenSurfaceFinishPencil) {
                  onOpenSurfaceFinishPencil();
                  return;
                }
                if ((action === 'tp_3d_finish_radial' || action === 'tp_3d_radial') && onOpenSurfaceFinishRadial) {
                  onOpenSurfaceFinishRadial();
                  return;
                }
                if ((action === 'tp_3d_finish_project' || action === 'tp_3d_project') && onOpenSurfaceFinishProject) {
                  onOpenSurfaceFinishProject();
                  return;
                }
                if ((action === 'tp_3d_finish_leftover' || action === 'tp_3d_leftover') && onOpenSurfaceFinishLeftover) {
                  onOpenSurfaceFinishLeftover();
                  return;
                }
                if ((action === 'tp_3d_equal_scallop' || action === 'tp_3d_finish_scallop' || action === 'tp_3d_scallop') && onOpenSurfaceFinishScallop) {
                  onOpenSurfaceFinishScallop();
                  return;
                }
                if ((action === 'tp_3d_finish_blend' || action === 'tp_3d_blend') && onOpenSurfaceFinishBlend) {
                  onOpenSurfaceFinishBlend();
                  return;
                }
                if (opType && onQuickAddOp) {
                  onQuickAddOp(opType);
                } else if (onQuickAddOp) {
                  onQuickAddOp('waterline');
                }
                return;
              }

              // Multiaxis Toolpaths
              if (action.startsWith('tp_multi_')) {
                if (action === 'tp_multi_curve') {
                  if (onOpenMultiaxisCurveModal) {
                    onOpenMultiaxisCurveModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_morph') {
                  if (onOpenMultiaxisMorphModal) {
                    onOpenMultiaxisMorphModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_swarf') {
                  if (onOpenSwarfMillingModal) {
                    onOpenSwarfMillingModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_parallel') {
                  if (onOpenMultiaxisParallelModal) {
                    onOpenMultiaxisParallelModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_rotary') {
                  if (onOpenRotary4AxisModal) {
                    onOpenRotary4AxisModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_drill') {
                  if (onOpenMultiaxisDrillModal) {
                    onOpenMultiaxisDrillModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_port') {
                  if (onOpenPortExpertModal) {
                    onOpenPortExpertModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_blade') {
                  if (onOpenBladeExpertModal) {
                    onOpenBladeExpertModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_deburr') {
                  if (onOpenMultiaxisDeburrModal) {
                    onOpenMultiaxisDeburrModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (action === 'tp_multi_rough') {
                  if (onOpenMultiaxisRoughingModal) {
                    onOpenMultiaxisRoughingModal();
                  } else if (onOpenFiveAxisStudio) {
                    onOpenFiveAxisStudio();
                  }
                  return;
                }
                if (onOpenFiveAxisStudio) {
                  onOpenFiveAxisStudio();
                }
                return;
              }

              // Stock Group
              if (action === 'tp_stock_shading' && onToggleLayer) {
                onToggleLayer('stock');
                return;
              }
              if (action === 'tp_stock_display' && onToggleLayer) {
                onToggleLayer('stock');
                return;
              }
              if (action === 'tp_stock_model' && onOpenStockModal) {
                onOpenStockModal();
                return;
              }

              // Utilities Group
              if (action === 'tp_util_tool_manager' && onOpenToolManager) {
                onOpenToolManager();
                return;
              }
              if (action === 'tp_util_probe' && onOpenProbingStudio) {
                onOpenProbingStudio();
                return;
              }
              if (action === 'tp_util_multiaxis_linking' && onOpenFiveAxisStudio) {
                onOpenFiveAxisStudio();
                return;
              }
              if (action === 'tp_util_transform') {
                if (onOpenTransformModal) onOpenTransformModal('translate');
                return;
              }
              if (action === 'tp_util_check' && onOpenCollisionCheck) {
                onOpenCollisionCheck();
                return;
              }
              if (action === 'tp_util_trim') {
                if (onOpenCornerReliefStudio) onOpenCornerReliefStudio();
                return;
              }
              if (action === 'tp_util_filter' && onOpenHSMFilterStudio) {
                onOpenHSMFilterStudio();
                return;
              }

              // Verify & Post Group (Direct One-Click Simulation)
              if (action === 'tp_verify_backplot') {
                if (onStartBackplot) onStartBackplot();
                return;
              }
              if (action === 'tp_verify_solid') {
                if (onStartVerify) onStartVerify(null, 'verify');
                return;
              }
              if (action === 'tp_verify_post') {
                if (onOpenPostModal) onOpenPostModal();
                return;
              }
              if (action === 'tp_start_flowline_wizard') {
                if (onStartFlowlineWizard) onStartFlowlineWizard();
                return;
              }
            }}
          />
        )}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="ribbon-scroll-btn ribbon-scroll-right"
            onClick={() => handleScrollRibbon('right')}
            title="Scroll Ribbon Right"
            aria-label="Scroll Ribbon Right"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
      )}

      {/* Draggable Bottom Resizer Bar with Centered Arrow Toggle Pill */}
      <div
        className="ribbon-bottom-resizer"
        onPointerDown={handleRibbonResizeStart}
        onPointerMove={handleRibbonResizeMove}
        onPointerUp={handleRibbonResizeEnd}
        onPointerCancel={handleRibbonResizeEnd}
        onDoubleClick={() => {
          setRibbonContentHeight(94);
          try { localStorage.setItem('mastercam_ribbon_height', '94'); } catch {}
        }}
        style={{
          width: '100%',
          height: '10px',
          cursor: 'row-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isResizingRibbon ? '#0284c7' : 'var(--border-subtle, #cbd5e1)',
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none',
          zIndex: 80,
          transition: isResizingRibbon ? 'none' : 'background-color 0.15s ease'
        }}
        title="Click & drag to resize ribbon height (Double-click to reset, Click arrow to toggle)"
      >
        {/* Subtle horizontal grip line */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '20%',
            right: '20%',
            height: '1px',
            backgroundColor: 'rgba(148, 163, 184, 0.4)',
            pointerEvents: 'none'
          }}
        />

        {/* Centered Arrow Button Pill */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setIsRibbonCollapsed((prev) => !prev);
          }}
          style={{
            height: '16px',
            padding: '0 16px',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569',
            zIndex: 82,
            transition: 'all 0.15s ease'
          }}
          title={isRibbonCollapsed ? "Expand Ribbon Bar" : "Collapse Ribbon Bar"}
          aria-label={isRibbonCollapsed ? "Expand Ribbon Bar" : "Collapse Ribbon Bar"}
        >
          {isRibbonCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
      </div>
    </nav>
  );
}

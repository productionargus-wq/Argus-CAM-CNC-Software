import React, { useRef, useState } from 'react';
import {
  Layers, Settings, Play, ShieldAlert, FileText, CheckCircle2,
  Box, Scissors, Compass, Sliders, Eye, RefreshCw, Zap,
  Wrench, FileCode, CheckSquare, Upload, FolderOpen, Download,
  Printer, Palette, Move, RotateCcw, Maximize2, Minimize2,
  Trash2, Plus, Sparkles, Orbit, Grid, Crosshair, HelpCircle,
  Save, Clock, Disc, ArrowUp, ArrowDown, Camera, Sun, Moon, Gauge,
  Copy, Cpu, Activity, Type, DollarSign, Tablet, PenTool, Edit3, Columns2,
  Clipboard, Ruler, Search, ChevronDown, CornerDownRight, X, Circle, Square
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

export default function RibbonBar({
  activeTab,
  onSelectTab,
  theme = 'light',
  onToggleTheme,
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
  onSelectMachine,
  onSelectWcs,
  activeWcs,
  onOpenFileBackstage,
  onOpenMastercamOpenDialog,
  onOpenDefineToolModal,
  onOpenSurfaceFinishContour,
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
  onJoinEntities
}) {
  const fileInputRef = useRef(null);
  const mcamFileInputRef = useRef(null);
  const ncFileInputRef = useRef(null);

  const [pointStyleSymbol, setPointStyleSymbol] = useState('*');
  const [showPointStyleMenu, setShowPointStyleMenu] = useState(false);
  const [lineStyleText, setLineStyleText] = useState('───');
  const [showLineStyleMenu, setShowLineStyleMenu] = useState(false);

  const tabs = [
    'File', 'Home', 'Wireframe', 'Surfaces', 'Solids',
    'Model Prep', 'Mesh', 'Drafting', 'Transform', 'Machine', 'View', 'Toolpaths'
  ];

  const handleCADFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const modelGroup = await parseAnyCADFile(file);
        if (onModelImported) {
          onModelImported(modelGroup, file.name);
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
    <nav className="ribbon-container" aria-label="Application Ribbon Navigation">
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

      {/* Ribbon Navigation Tabs */}
      <div className="ribbon-tabs" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'File' && onOpenFileBackstage) {
                  onOpenFileBackstage();
                } else {
                  onSelectTab(tab);
                }
              }}
              className={`ribbon-tab ${tab === 'File' ? 'file-tab' : ''} ${activeTab === tab ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              {tab === 'Toolpaths' && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#d32f2f',
                    color: '#ffffff',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    padding: '0 4px',
                    borderRadius: '2px',
                    lineHeight: '11px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    letterSpacing: '0.5px'
                  }}
                >
                  MILL
                </span>
              )}
              {tab}
            </button>
          ))}
        </div>

        {/* Workspace Mode Switcher (2D Design Board | Split View | 3D Machine) */}
        {onChangeViewMode && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', paddingRight: '8px' }}>
            <button
              onClick={() => onChangeViewMode('2d')}
              style={{
                width: '30px',
                height: '26px',
                background: workspaceViewMode === '2d' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                color: workspaceViewMode === '2d' ? '#38bdf8' : '#94a3b8',
                border: workspaceViewMode === '2d' ? '1px solid #38bdf8' : '1px solid #334155',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="2D CAD Design Board"
            >
              <Palette size={15} />
            </button>

            <button
              onClick={() => onChangeViewMode('split')}
              style={{
                width: '30px',
                height: '26px',
                background: workspaceViewMode === 'split' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                color: workspaceViewMode === 'split' ? '#c084fc' : '#94a3b8',
                border: workspaceViewMode === 'split' ? '1px solid #c084fc' : '1px solid #334155',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Split View: 2D Design Board & 3D Machine Simulation"
            >
              <Columns2 size={15} />
            </button>

            <button
              onClick={() => onChangeViewMode('3d')}
              style={{
                width: '30px',
                height: '26px',
                background: workspaceViewMode === '3d' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                color: workspaceViewMode === '3d' ? '#38bdf8' : '#94a3b8',
                border: workspaceViewMode === '3d' ? '1px solid #38bdf8' : '1px solid #334155',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="3D Machine Viewport"
            >
              <Box size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Ribbon Action Groups - Dynamically swaps based on activeTab */}
      <div className="ribbon-content">
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
                  onClick={() => {
                    if (onOpenMastercamOpenDialog) {
                      onOpenMastercamOpenDialog();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}
                  title="Open / Import CAD File (Supports All 25 Mastercam Formats)"
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

            {/* 2. Attributes */}
            <div className="ribbon-group" style={{ position: 'relative' }}>
              <div className="ribbon-group-items" style={{ flexDirection: 'column', gap: '4px', height: '64px', justifyContent: 'center' }}>
                {/* Row 1: Point Style, Line Style, Color Picker, 3D/2D toggle */}
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

                  {/* Line Style & Thickness Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowLineStyleMenu((prev) => !prev)}
                      className="ribbon-combo-select"
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 5px', height: '22px' }}
                      title="Line Style & Weight (Solid, Hidden, Center, Phantom)"
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

                  {/* Color Picker Swatch Box */}
                  <input
                    type="color"
                    value={workpieceColor || '#3b82f6'}
                    onChange={(e) => onChangeWorkpieceColor(e.target.value)}
                    title="Active Entity & Workpiece Color"
                    style={{ width: '22px', height: '22px', border: '1px solid #cbd5e1', borderRadius: '3px', padding: 0, cursor: 'pointer', background: 'none' }}
                  />

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

                {/* Row 2: Quick Palette Swatches */}
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
              <button
                className="ribbon-dialog-launcher"
                onClick={onOpenAttributesModal}
                title="Open Attributes Manager (Color, Level, Line Style, Mask)"
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

            {/* 4. Delete */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
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
                  <button className="ribbon-btn-small" onClick={onUndeleteEntity} title="Undelete last deleted entity (Ctrl+Z)">
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
            {/* 1. Points */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onStartInteractiveSketch ? onStartInteractiveSketch('drill') : (onOpenWireframeModal && onOpenWireframeModal('datum'))}
                  title="Point Position - Place 3D coordinate point / datum on viewport"
                >
                  <div style={{ position: 'relative', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={22} color="#0284c7" strokeWidth={2.5} />
                    <div style={{ position: 'absolute', width: '4px', height: '4px', background: '#0284c7', borderRadius: '50%' }} />
                  </div>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Point<br />Position</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('pcd') : onAddWireframe('pcd')}
                  title="Bolt Circle - Create Pitch Circle Diameter (PCD) bolt hole pattern"
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
                  className="ribbon-btn-large"
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
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('parallel') : onAddWireframe('parallel')}
                    title="Line Parallel - Create parallel line at offset distance"
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '13px' }}>
                      <div style={{ width: '13px', height: '1.5px', background: '#0284c7' }} />
                      <div style={{ width: '13px', height: '1.5px', background: '#0284c7' }} />
                    </div>
                    <span>Line Parallel</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('perp') : onAddWireframe('perp')}
                    title="Line Perpendicular - Create 90° normal line from entity"
                  >
                    <div style={{ position: 'relative', width: '12px', height: '12px' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12px', height: '1.5px', background: '#0284c7' }} />
                      <div style={{ position: 'absolute', top: 0, left: '5px', width: '1.5px', height: '12px', background: '#0284c7' }} />
                    </div>
                    <span>Line Perpendicular</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('closest') : onAddWireframe('line')}
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
                  className="ribbon-btn-large"
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
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('arc3pt') : onAddWireframe('circle')}
                    title="Arc 3 Points - Create circular arc passing through 3 points"
                  >
                    <Orbit size={13} color="#0284c7" />
                    <span>Arc 3 Points</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('arctangent') : onAddWireframe('circle')}
                    title="Arc Tangent - Create circular arc tangent to two curves"
                  >
                    <Disc size={13} color="#0284c7" />
                    <span>Arc Tangent</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('circle') : onAddWireframe('circle')}
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
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('spline') : onAddWireframe('spline')}
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
                  className="ribbon-btn-large"
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

                {/* Column 2: Turn Profile, Relief Groove, Raster to Vector */}
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
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('trim') : onAddWireframe('trim')}
                  title="Trim Break Extend - Interactively trim, break or extend wireframe lines"
                >
                  <Scissors size={22} color="#f43f5e" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Trim Break<br />Extend ▾</span>
                </button>

                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('fillet') : onAddWireframe('fillet')}
                  title="Fillet Entities - Add tangent fillet arc radius between curves"
                >
                  <Orbit size={22} color="#10b981" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Fillet<br />Entities ▾</span>
                </button>

                {/* Micro-stack: Chamfer, Offset, Project */}
                <div className="ribbon-col-stacked">
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('chamfer') : onAddWireframe('chamfer')}
                    title="Chamfer Entities - Add beveled chamfer corner between lines"
                  >
                    <Scissors size={13} color="#f59e0b" />
                    <span>Chamfer Entities ▾</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('offset') : onAddWireframe('offset')}
                    title="Offset - Offset wireframe contour by distance"
                  >
                    <Move size={13} color="#0284c7" />
                    <span>Offset ▾</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onOpenWireframeModal ? onOpenWireframeModal('project') : onAddWireframe('project')}
                    title="Project - Project 2D wireframe onto 3D surface or plane"
                  >
                    <ArrowDown size={13} color="#a855f7" />
                    <span>Project</span>
                  </button>
                </div>

                {/* Mini-tools on right: Break, Join, Clear */}
                <div className="ribbon-col-stacked" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '4px' }}>
                  <button className="ribbon-btn-small" onClick={onBreakManyPieces} title="Break Many Pieces into Arcs">
                    <Disc size={12} color="#64748b" />
                    <span>Break</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onJoinEntities} title="Join contiguous collinear segments">
                    <Plus size={12} color="#0284c7" />
                    <span>Join</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={onClearWireframes} title="Clear All Level 10 Wireframe Geometry">
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
              if (action.startsWith('machine_mill') && onSelectMachine) {
                onSelectMachine('dmu50');
                return;
              }
              if (action.startsWith('machine_lathe') && onSelectMachine) {
                onSelectMachine('integrex');
                return;
              }
              if (action === 'machine_mill_turn' && onSelectMachine) {
                onSelectMachine('integrex');
                return;
              }
              if (action === 'machine_wire' && onSelectMachine) {
                onSelectMachine('robodrill');
                return;
              }
              if (action === 'machine_router' && onSelectMachine) {
                onSelectMachine('haas_vf2');
                return;
              }
              if (action === 'machine_design') {
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
                if (action === 'tp_3d_optirough' && onOpenAdaptiveModal) {
                  onOpenAdaptiveModal();
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
                if (action === 'tp_multi_swarf' && onOpenFiveAxisStudio) {
                  onOpenFiveAxisStudio();
                  return;
                }
                if (opType && onQuickAddOp) {
                  onQuickAddOp(opType);
                } else if (onOpenFiveAxisStudio) {
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
            }}
          />
        )}
      </div>
    </nav>
  );
}

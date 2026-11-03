import React, { useRef, useState } from 'react';
import {
  Layers, Settings, Play, ShieldAlert, FileText, CheckCircle2,
  Box, Scissors, Compass, Sliders, Eye, RefreshCw, Zap,
  Wrench, FileCode, CheckSquare, Upload, FolderOpen, Download,
  Printer, Palette, Move, RotateCcw, Maximize2, Minimize2,
  Trash2, Plus, Sparkles, Orbit, Grid, Crosshair, HelpCircle,
  Save, Clock, Disc, ArrowUp, ArrowDown, Camera, Sun, Moon, Gauge,
  Copy, Cpu, Activity, Type, DollarSign, Tablet, PenTool, Edit3, Columns2,
  Clipboard, Ruler, Search, ChevronDown, CornerDownRight, X
} from 'lucide-react';
import { parseSTLFile, parseOBJFile, parseSTEPFile, parseIGESFile } from '../utils/cadGeometry';
import { parseProjectMCAM } from '../utils/projectStorage';
import { parseAnyCADFile, ALL_SUPPORTED_EXTENSIONS_STRING } from '../utils/universalCadParser';

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
                  title="New CAM Project Wizard (Presets & Templates)"
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
          </>
        )}

        {/* ==================== 4. SURFACES TAB ==================== */}
        {activeTab === 'Surfaces' && (
          <>
            {/* Simple */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('cylinder') : onAddSurface('cylinder')}
                  title="Create 3D Cylindrical Surface Sleeve"
                >
                  <Orbit size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Cylinder</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('plane') : onAddSurface('plane')}
                  title="Create 3D Planar Surface Block Sheet"
                >
                  <Box size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Block</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Sphere Surface')} title="Create Spherical Surface Primitive">
                  <Disc size={20} color="#38bdf8" />
                  <span className="btn-label">Sphere</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Cone Surface')} title="Create Conical Surface Primitive">
                  <Compass size={20} color="#f59e0b" />
                  <span className="btn-label">Cone</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Torus Surface')} title="Create Torus Surface Primitive">
                  <Orbit size={20} color="#a855f7" />
                  <span className="btn-label">Torus</span>
                </button>
              </div>
              <span className="ribbon-group-title">Simple</span>
            </div>

            {/* Create */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('extrude') : null}
                  title="Extrude Wireframe Contour into Surface Wall"
                >
                  <Box size={22} color="#8b5cf6" />
                  <span className="btn-label">Extrude</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Draft Surface')} title="Create Draft Angle Surface">
                  <Maximize2 size={20} color="#f59e0b" />
                  <span className="btn-label">Draft</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('From Solid')} title="Create Surface Sheet From Solid Body Faces">
                  <Layers size={20} color="#38bdf8" />
                  <span className="btn-label">From<br />Solid</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Flat Boundary')} title="Create Flat Boundary Surface from Closed Curves">
                  <Grid size={20} color="#10b981" />
                  <span className="btn-label">Flat<br />Boundary</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('loft') : null}
                  title="Create Loft Surface Blending Multiple Contours"
                >
                  <Sliders size={22} color="#3b82f6" />
                  <span className="btn-label">Loft</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Sweep Surface')} title="Create Swept Surface Along Trajectory">
                  <Move size={20} color="#c084fc" />
                  <span className="btn-label">Sweep</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Net Surface')} title="Create Coons Patch Net Surface">
                  <Grid size={20} color="#06b6d4" />
                  <span className="btn-label">Net</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('revolve') : null}
                  title="Revolve Profile Around Axis (Turned Surface)"
                >
                  <Disc size={22} color="#ec4899" />
                  <span className="btn-label">Revolve</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Offset Surface')} title="Offset Surface Body by Normal Distance">
                  <ArrowUp size={20} color="#facc15" />
                  <span className="btn-label">Offset</span>
                </button>
              </div>
              <span className="ribbon-group-title">Create</span>
            </div>

            {/* Modify */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Trim to Curves')} title="Trim Surface to Boundary Curves">
                  <Scissors size={20} color="#f43f5e" />
                  <span className="btn-label">Trim to<br />Curves</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('cap') : null}
                  title="Fill Holes & Cap Openings in Surfaces"
                >
                  <Sparkles size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Fill<br />Holes</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Extend Surface')} title="Extend Surface Edges Tangentially">
                  <Maximize2 size={20} color="#10b981" />
                  <span className="btn-label">Extend</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('fillet') : null}
                  title="Fillet Transition Blend Between Surfaces"
                >
                  <Orbit size={20} color="#14b8a6" />
                  <span className="btn-label">Fillet to<br />Surfaces</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Two Surface Blend')} title="Create Blend Surface Between 2 Surfaces">
                  <Layers size={20} color="#60a5fa" />
                  <span className="btn-label">Two Surface<br />Blend</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Three Surface Blend')} title="Create Blend Surface Across 3 Surfaces">
                  <Layers size={20} color="#a855f7" />
                  <span className="btn-label">Three Surface<br />Blend</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Three Fillet Blend')} title="Corner Blend at Three Fillet Intersection">
                  <Sparkles size={20} color="#f59e0b" />
                  <span className="btn-label">Three Fillet<br />Blend</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Untrim')} title="Restore Untrimmed Underlying Surface">
                  <RotateCcw size={20} color="#94a3b8" />
                  <span className="btn-label">Untrim</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Remove Boundary')} title="Remove Outer / Inner Surface Boundaries">
                  <Trash2 size={20} color="#ef4444" />
                  <span className="btn-label">Remove<br />Boundary</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Split Surface')} title="Split Surface by Isoparametric Curve">
                  <Scissors size={20} color="#ec4899" />
                  <span className="btn-label">Split</span>
                </button>
              </div>
              <span className="ribbon-group-title">Modify</span>
            </div>

            {/* Normals */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onChangeRenderMode && onChangeRenderMode('normals')} title="Flip Normal Vectors">
                  <RefreshCw size={20} color="#38bdf8" />
                  <span className="btn-label">Change</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Set Normal')} title="Set Normal Vector Direction">
                  <ArrowUp size={20} color="#10b981" />
                  <span className="btn-label">Set</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Orient Normals')} title="Orient Connected Surface Patch Normals">
                  <Compass size={20} color="#f59e0b" />
                  <span className="btn-label">Orient</span>
                </button>
              </div>
              <span className="ribbon-group-title">Normals</span>
            </div>

            {/* Drive / Check */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('list') : null}
                  title="Inspect Drive & Check Surfaces Manager on Level 15"
                >
                  <ShieldAlert size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Drive &amp; Check<br />Manager</span>
                </button>
                <button className="ribbon-btn-large" onClick={onClearSurfaces} title="Clear All Level 15 Surface Sheets">
                  <Trash2 size={20} color="#94a3b8" />
                  <span className="btn-label">Clear<br />Surfaces</span>
                </button>
              </div>
              <span className="ribbon-group-title">Drive / Check</span>
            </div>
          </>
        )}

        {/* ==================== 5. SOLIDS TAB ==================== */}
        {activeTab === 'Solids' && (
          <>
            {/* Simple */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('cylinder') : onAddSolid('cylinder')}
                  title="Create Parametric 3D Cylindrical Blank Solid"
                >
                  <Orbit size={22} color="#60a5fa" />
                  <span className="btn-label" style={{ color: '#60a5fa', fontWeight: 600 }}>Cylinder</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('box') : onAddSolid('box')}
                  title="Create Parametric 3D Rectangular Billet Solid"
                >
                  <Box size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Block</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('sphere') : onAddSolid('sphere')}
                  title="Create Parametric Spherical Solid"
                >
                  <Disc size={20} color="#10b981" />
                  <span className="btn-label">Sphere</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('cone') : onAddSolid('cone')}
                  title="Create Parametric Conical Frustum Solid"
                >
                  <Compass size={20} color="#f59e0b" />
                  <span className="btn-label">Cone</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('torus') : onAddSolid('torus')}
                  title="Create Parametric Torus Ring Solid"
                >
                  <Orbit size={20} color="#a855f7" />
                  <span className="btn-label">Torus</span>
                </button>
              </div>
              <span className="ribbon-group-title">Simple</span>
            </div>

            {/* Create */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('extrude') : onAddSolid('extrude')}
                  title="Extrude 2D Contour to 3D Solid Body"
                >
                  <Sliders size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Extrude</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Revolve Solid')} title="Revolve Profile Into Solid of Revolution">
                  <Disc size={20} color="#ec4899" />
                  <span className="btn-label">Revolve</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Loft Solid')} title="Loft Solid Body Through Multiple Sections">
                  <Layers size={20} color="#3b82f6" />
                  <span className="btn-label">Loft</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Sweep Solid')} title="Sweep Solid Profile Along Trajectory">
                  <Move size={20} color="#c084fc" />
                  <span className="btn-label">Sweep</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Boolean Solid')} title="Boolean Union, Subtract, or Intersect">
                  <Sparkles size={20} color="#f59e0b" />
                  <span className="btn-label">Boolean</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Impression Solid')} title="Create Mold Core/Cavity Impression">
                  <Box size={20} color="#06b6d4" />
                  <span className="btn-label">Impression</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Rectangular Pattern')} title="Rectangular Matrix Pattern of Features">
                  <Grid size={20} color="#38bdf8" />
                  <span className="btn-label">Rectangular<br />Pattern</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Circular Pattern')} title="Circular PCD Pattern of Features">
                  <Orbit size={20} color="#facc15" />
                  <span className="btn-label">Circular<br />Pattern</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Manual Pattern')} title="Point-Driven Manual Pattern">
                  <Crosshair size={20} color="#94a3b8" />
                  <span className="btn-label">Manual<br />Pattern</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('From Surfaces')} title="Stitch Surfaces into Watertight Solid Body">
                  <Layers size={20} color="#34d399" />
                  <span className="btn-label">From<br />Surfaces</span>
                </button>
              </div>
              <span className="ribbon-group-title">Create</span>
            </div>

            {/* Modify */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Constant Fillet')} title="Apply Constant Radius Fillet to Solid Edges">
                  <Orbit size={20} color="#10b981" />
                  <span className="btn-label">Constant<br />Fillet</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('One Distance Chamfer')} title="Apply One Distance Chamfer to Edges">
                  <Scissors size={20} color="#f59e0b" />
                  <span className="btn-label">One Distance<br />Chamfer</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Shell Solid')} title="Hollow Out Solid to Thin-Wall Shell">
                  <Box size={20} color="#38bdf8" />
                  <span className="btn-label">Shell</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Thicken Solid')} title="Thicken Sheet Surface into Solid">
                  <Maximize2 size={20} color="#60a5fa" />
                  <span className="btn-label">Thicken</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Draft Solid')} title="Add Mold Release Draft Angle to Faces">
                  <Maximize2 size={20} color="#c084fc" />
                  <span className="btn-label">Draft</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Trim by Plane')} title="Trim Solid Body by Cutting Plane">
                  <Scissors size={20} color="#ef4444" />
                  <span className="btn-label">Trim by<br />Plane</span>
                </button>
              </div>
              <span className="ribbon-group-title">Modify</span>
            </div>

            {/* Drawing & Features */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('manager') : null}
                  title="Open Solids History Tree & Feature Manager"
                >
                  <Layers size={22} color="#60a5fa" />
                  <span className="btn-label" style={{ color: '#60a5fa', fontWeight: 600 }}>Layout /<br />Tree</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('pocket') : null}
                  title="Generate Milled Pocket Workpiece Cavity"
                >
                  <Sparkles size={22} color="#38bdf8" />
                  <span className="btn-label">Pocket<br />Cavity</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenStockModal} title="Configure Raw Stock Bounding Box">
                  <Settings size={20} color="#10b981" />
                  <span className="btn-label">Stock<br />Setup</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenAFRModal}
                  title="Automatic Feature Recognition (AFR) & Feature-Based Machining"
                >
                  <Sparkles size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Recognize<br />Features</span>
                </button>
              </div>
              <span className="ribbon-group-title">Drawing &amp; Features</span>
            </div>

            {/* Sample CAD Workpieces */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onSelectSampleModel && onSelectSampleModel('step_bracket')}
                  title="Load Native ISO 10303-21 STEP Aerospace Bracket Solid"
                >
                  <FileCode size={20} color="#3b82f6" />
                  <span className="btn-label" style={{ color: '#3b82f6', fontWeight: 600 }}>STEP<br />Bracket</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onSelectSampleModel && onSelectSampleModel('impeller')}
                  title="Load 5-Axis Bladed Impeller Solid"
                >
                  <Compass size={20} color="#a855f7" />
                  <span className="btn-label">5X Impeller<br />Solid</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onSelectSampleModel && onSelectSampleModel('bracket')}
                  title="Load 3-Axis Aerospace Pocket Bracket"
                >
                  <Layers size={20} color="#06b6d4" />
                  <span className="btn-label">Aero<br />Bracket</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onSelectSampleModel && onSelectSampleModel('mold')}
                  title="Load Injection Mold Core Cavity Solid"
                >
                  <Box size={20} color="#f59e0b" />
                  <span className="btn-label">Mold Core<br />Solid</span>
                </button>
              </div>
              <span className="ribbon-group-title">Sample Workpieces</span>
            </div>
          </>
        )}

        {/* ==================== 6. MODEL PREP TAB ==================== */}
        {activeTab === 'Model Prep' && (
          <>
            {/* Create */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Hole Axis')} title="Create Coordinate Axis Centerline in Holes">
                  <Crosshair size={20} color="#38bdf8" />
                  <span className="btn-label">Hole<br />Axis</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('pushpull') : (onPushPull && onPushPull(2))}
                  title="Direct Modeling Push / Pull Face Offset"
                >
                  <Maximize2 size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Push / Pull<br />Face</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('align') : onResetTransform()}
                  title="Move Solid Faces / Features"
                >
                  <Move size={20} color="#10b981" />
                  <span className="btn-label">Move</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Split Solid Faces')} title="Split Faces Along Curve Boundary">
                  <Scissors size={20} color="#f59e0b" />
                  <span className="btn-label">Split Solid<br />Faces</span>
                </button>
              </div>
              <span className="ribbon-group-title">Create</span>
            </div>

            {/* Direct Editing */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Modify Feature')} title="Modify CAD Hole Diameter & Depth Directly">
                  <Sliders size={20} color="#38bdf8" />
                  <span className="btn-label">Modify<br />Feature</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Modify Fillet')} title="Modify Existing Fillet Radius">
                  <Orbit size={20} color="#f59e0b" />
                  <span className="btn-label">Modify<br />Fillet</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('defeature') : null}
                  title="Remove Faces & Auto-Cap Cavities (CAM Defeaturing)"
                >
                  <ShieldAlert size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Remove<br />Faces</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Remove Fillets')} title="Remove Fillets & Restore Sharp Corners">
                  <Scissors size={20} color="#ef4444" />
                  <span className="btn-label">Remove<br />Fillets</span>
                </button>
              </div>
              <span className="ribbon-group-title">Direct Editing</span>
            </div>

            {/* Modify */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Simplify Solid')} title="Simplify B-Rep Topology into Analytic Planes & Cylinders">
                  <Sparkles size={20} color="#10b981" />
                  <span className="btn-label">Simplify<br />Solid</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenAFRModal} title="Find Milled Pockets, Slots & Drilled Holes">
                  <Compass size={20} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Find<br />Features</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Remove History')} title="Remove History Tree (Convert to Direct Solid Body)">
                  <Trash2 size={20} color="#94a3b8" />
                  <span className="btn-label">Remove<br />History</span>
                </button>
              </div>
              <span className="ribbon-group-title">Modify</span>
            </div>

            {/* Layout */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Disassemble')} title="Disassemble Multi-Body Assembly onto Table">
                  <Grid size={20} color="#60a5fa" />
                  <span className="btn-label">Disassemble</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('orient') : onRotatePart(0, 0, Math.PI)}
                  title="Position & Orient Part on CNC Machine Table (Flip 180°)"
                >
                  <RotateCcw size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Position /<br />Flip</span>
                </button>
                <button className="ribbon-btn-large" onClick={onResetTransform} title="Clear All Offsets & Snap to Origin">
                  <RefreshCw size={20} color="#ef4444" />
                  <span className="btn-label">Clear All</span>
                </button>
                <button className="ribbon-btn-large" onClick={onDropToTable} title="Align Part Bottom Face to Table Baseplate">
                  <Layers size={20} color="#10b981" />
                  <span className="btn-label">Drop to<br />Table</span>
                </button>
              </div>
              <span className="ribbon-group-title">Layout</span>
            </div>

            {/* Color & Diagnostics */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Change Face Color')} title="Change Color of Specific Solid Faces">
                  <Palette size={20} color="#38bdf8" />
                  <span className="btn-label">Change<br />Face</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Clear Feature Color')} title="Clear Color Override on Selected Feature">
                  <Trash2 size={20} color="#94a3b8" />
                  <span className="btn-label">Clear<br />Feature</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('manifold') : onOpenEntityAnalyzer()}
                  title="Check Watertight Manifold Topology"
                >
                  <CheckCircle2 size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Check<br />Manifold</span>
                </button>
              </div>
              <span className="ribbon-group-title">Color &amp; Health</span>
            </div>
          </>
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
          <>
            {/* Dimension */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('linear') : null}
                  title="Smart Linear Dimension (Horizontal, Vertical & Aligned)"
                >
                  <Scissors size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Smart<br />Dimension</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Horizontal Dimension')} title="Horizontal Dimension">
                  <div style={{ width: '20px', height: '2px', background: '#94a3b8', margin: '10px 0' }} />
                  <span className="btn-label">Horizontal</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Angular Dimension')} title="Angular Dimension Between Lines">
                  <Compass size={20} color="#f59e0b" />
                  <span className="btn-label">Angular</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('radial') : null}
                  title="3D Radial (R) & Diametral (Ø) Leader Callouts"
                >
                  <Disc size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Circular<br />Callout</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Parallel Dimension')} title="Parallel Dimension">
                  <Layers size={20} color="#60a5fa" />
                  <span className="btn-label">Parallel</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Point Dimension')} title="Point Coordinate Dimension">
                  <Crosshair size={20} color="#c084fc" />
                  <span className="btn-label">Point</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Baseline Dimension')} title="Baseline Dimension Stack">
                  <Grid size={20} color="#34d399" />
                  <span className="btn-label">Baseline</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Chained Dimension')} title="Chained Continuous Dimension">
                  <Sliders size={20} color="#f43f5e" />
                  <span className="btn-label">Chained</span>
                </button>
              </div>
              <span className="ribbon-group-title">Dimension</span>
            </div>

            {/* Ordinate */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Horizontal Ordinate')} title="Horizontal Ordinate Dimensioning">
                  <Grid size={20} color="#38bdf8" />
                  <span className="btn-label">Horizontal<br />Ordinate</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Vertical Ordinate')} title="Vertical Ordinate Dimensioning">
                  <Grid size={20} color="#10b981" />
                  <span className="btn-label">Vertical<br />Ordinate</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Parallel Ordinate')} title="Parallel Ordinate Dimensioning">
                  <Grid size={20} color="#f59e0b" />
                  <span className="btn-label">Parallel<br />Ordinate</span>
                </button>
              </div>
              <span className="ribbon-group-title">Ordinate</span>
            </div>

            {/* Annotate */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('leader') : null}
                  title="Machining Operator Leader Note"
                >
                  <FileText size={22} color="#a855f7" />
                  <span className="btn-label">Note /<br />Leader</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Witness Line')} title="Add Witness Extension Line">
                  <div style={{ width: '18px', height: '2px', background: '#38bdf8', margin: '10px 0' }} />
                  <span className="btn-label">Witness<br />Line</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Cross Hatch')} title="Cross Hatch Section Pattern">
                  <Grid size={20} color="#facc15" />
                  <span className="btn-label">Cross<br />Hatch</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('datum') : null}
                  title="WCS Coordinate Datum Tags (G54 / G55 / Datum -A-)"
                >
                  <Crosshair size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>WCS Datum<br />Tag</span>
                </button>
              </div>
              <span className="ribbon-group-title">Annotate</span>
            </div>

            {/* Regenerate & Modify */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Regenerate All Dimensions')} title="Regenerate All Annotations">
                  <RefreshCw size={20} color="#10b981" />
                  <span className="btn-label">Regenerate<br />All</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Align Note')} title="Align Multiple Notes">
                  <Sliders size={20} color="#38bdf8" />
                  <span className="btn-label">Align<br />Note</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('manager') : null}
                  title="Drafting Entity Manager Tree"
                >
                  <Layers size={21} color="#60a5fa" />
                  <span className="btn-label">Drafting<br />Manager</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenEngravingStudio}
                  title="Open CNC 2.5D & 3D Engraving & V-Carve Studio"
                >
                  <Type size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 700 }}>Engraving<br />&amp; V-Carve</span>
                </button>
              </div>
              <span className="ribbon-group-title">Modify &amp; Engrave</span>
            </div>
          </>
        )}

        {/* ==================== 9. TRANSFORM TAB ==================== */}
        {activeTab === 'Transform' && (
          <>
            {/* Position */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('translate') : null}
                  title="Dynamic 3D Translation Workbench"
                >
                  <Move size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Dynamic<br />Translate</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('rotate') : null}
                  title="3D Rotate Around Axis"
                >
                  <RotateCcw size={22} color="#a855f7" />
                  <span className="btn-label" style={{ color: '#a855f7', fontWeight: 600 }}>Rotate</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Project Transform')} title="Project Geometry onto Plane">
                  <ArrowDown size={20} color="#60a5fa" />
                  <span className="btn-label">Project</span>
                </button>
                <button className="ribbon-btn-large" onClick={onResetTransform} title="Move Selection Directly to WCS Origin (0,0,0)">
                  <Crosshair size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Move to<br />Origin</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('mirror') : null}
                  title="Mirror Left/Right Hand Symmetrical Pairs"
                >
                  <Copy size={21} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Mirror</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Roll Transform')} title="Roll Geometry Around Cylindrical Surface">
                  <Orbit size={20} color="#ec4899" />
                  <span className="btn-label">Roll</span>
                </button>
              </div>
              <span className="ribbon-group-title">Position</span>
            </div>

            {/* Offset */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Offset Entity')} title="Offset Individual Entity">
                  <Move size={20} color="#38bdf8" />
                  <span className="btn-label">Entity<br />Offset</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Offset Chains')} title="Offset Connected Wireframe Chains">
                  <Layers size={20} color="#10b981" />
                  <span className="btn-label">Chains<br />Offset</span>
                </button>
              </div>
              <span className="ribbon-group-title">Offset</span>
            </div>

            {/* Layout */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenNestingStudio}
                  title="Open CNC True-Shape Sheet Nesting Studio"
                >
                  <Scissors size={21} color="#0284c7" />
                  <span className="btn-label" style={{ color: '#0284c7', fontWeight: 700 }}>Geometry<br />Nesting</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('pattern') : null}
                  title="Rectangular Array / Matrix Pattern"
                >
                  <Grid size={21} color="#38bdf8" />
                  <span className="btn-label">Rectangular<br />Array</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Distribute')} title="Distribute Geometry Evenly">
                  <Sliders size={20} color="#a855f7" />
                  <span className="btn-label">Distribute</span>
                </button>
              </div>
              <span className="ribbon-group-title">Layout</span>
            </div>

            {/* Size & Reset */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Stretch')} title="Stretch Geometry by Vector">
                  <Maximize2 size={20} color="#f59e0b" />
                  <span className="btn-label">Stretch</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('scale') : null}
                  title="Scale Factor & Casting Shrinkage Compensation"
                >
                  <Maximize2 size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Scale</span>
                </button>
                <button className="ribbon-btn-large" onClick={onResetTransform} title="Reset All Position, Rotation & Scale">
                  <RefreshCw size={20} color="#ef4444" />
                  <span className="btn-label">Reset All</span>
                </button>
              </div>
              <span className="ribbon-group-title">Size &amp; Reset</span>
            </div>
          </>
        )}

        {/* ==================== 10. MACHINE TAB ==================== */}
        {activeTab === 'Machine' && (
          <>
            {/* Machine Type */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenMachineConfigModal}
                  title="Configure CNC Machine Definition & Kinematic Limits"
                >
                  <Cpu size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Machine<br />Definition</span>
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                  <select
                    value={activeMachine?.id || 'dmu50'}
                    onChange={(e) => onSelectMachine(e.target.value)}
                    style={{
                      background: '#141822',
                      border: '1px solid #333d4e',
                      color: '#38bdf8',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      width: '150px'
                    }}
                  >
                    <option value="dmu50">DMG MORI DMU 50 (5X)</option>
                    <option value="haas_vf2">Haas VF-2 (3X VMC)</option>
                    <option value="robodrill">Fanuc Robodrill D21</option>
                    <option value="integrex">Mazak Integrex i-200</option>
                  </select>

                  <div style={{ display: 'flex', gap: '3px', width: '150px' }}>
                    {['G54', 'G55', 'G56'].map((wcs) => (
                      <button
                        key={wcs}
                        onClick={() => onSelectWcs(wcs)}
                        style={{
                          flex: 1,
                          background: activeWcs === wcs ? '#2563eb' : '#1e2430',
                          border: '1px solid #333d4e',
                          color: 'white',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {wcs}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="ribbon-btn-large"
                  onClick={onOpenCPlanesModal}
                  title="Open Construction Planes & Dynamic WCS Origin Studio"
                >
                  <Compass size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Planes /<br />WCS Studio</span>
                </button>
              </div>
              <span className="ribbon-group-title">Machine Type</span>
            </div>

            {/* Job Setup */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onOpenStockModal} title="Configure Stock Bounding Box Dimensions">
                  <Box size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Stock<br />Setup</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFixtureModal}
                  title="Workholding Vises & Fixture Setup"
                >
                  <Wrench size={22} color="#a855f7" />
                  <span className="btn-label" style={{ color: '#a855f7', fontWeight: 600 }}>Workholding<br />&amp; Fixtures</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenToolManager} title="Open Mill Tool Library">
                  <Wrench size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Mill Tool<br />Manager</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenToolAssemblyModal} title="Toolholder Assembly Studio (BT40, HSK, Collets)">
                  <Wrench size={22} color="#0284c7" />
                  <span className="btn-label">Tool<br />Assembly</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenFeedsSpeedsModal} title="Feeds & Speeds Calculator">
                  <Gauge size={22} color="#38bdf8" />
                  <span className="btn-label">Feeds &amp;<br />Speeds</span>
                </button>
              </div>
              <span className="ribbon-group-title">Job Setup</span>
            </div>

            {/* Simulator */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onStartBackplot && onStartBackplot()} title="Backplot Wireframe Tool Tracing">
                  <Play size={20} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Backplot</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onOpenSolidVerifyModal ? onOpenSolidVerifyModal() : (onStartVerify && onStartVerify(null, 'verify'))} title="Verify Solid Stock Removal">
                  <Box size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Verify</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenSimModal} title="Kinematic Machine Digital Twin Simulation">
                  <Play size={22} color="#10b981" />
                  <span className="btn-label">Simulate</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenCollisionCheck} title="Run Tool Collision & Gouge Detection Audit">
                  <ShieldAlert size={20} color="#f43f5e" />
                  <span className="btn-label">Collision<br />Check</span>
                </button>
              </div>
              <span className="ribbon-group-title">Simulator</span>
            </div>

            {/* Post */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenPostModal}
                  title="Generate G-Code (G1)"
                >
                  <div className="post-badge">G1</div>
                  <FileCode size={24} color="#ffffff" />
                  <span className="btn-label" style={{ fontWeight: 700, color: '#ffffff' }}>Generate<br />Post</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenCustomPostStudio} title="Create Custom Post-Processor">
                  <FileCode size={20} color="#38bdf8" />
                  <span className="btn-label">Create</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenGCodeViewer} title="Export CNC G-Code">
                  <Download size={20} color="#10b981" />
                  <span className="btn-label">Export<br />G-Code</span>
                </button>
              </div>
              <span className="ribbon-group-title">Post</span>
            </div>

            {/* Setup Sheet */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onOpenSetupSheet} title="Generate Setup Sheet">
                  <Printer size={22} color="#e2e8f0" />
                  <span className="btn-label">Setup<br />Sheet</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Image Capture')} title="Capture Image for Setup Sheet">
                  <Camera size={20} color="#38bdf8" />
                  <span className="btn-label">Image<br />Capture</span>
                </button>
              </div>
              <span className="ribbon-group-title">Setup Sheet</span>
            </div>

            {/* Argus Production Suite */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large ribbon-btn-highlight" onClick={onOpenTombstoneStudio} title="Tombstone 4-Axis Rotary Studio">
                  <Grid size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 700 }}>Tombstone<br />Rotary</span>
                </button>
                <button className="ribbon-btn-large ribbon-btn-highlight" onClick={onOpenKioskModal} title="Shop Floor Operator Tablet Kiosk">
                  <Tablet size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 700 }}>Operator<br />Kiosk</span>
                </button>
                <button className="ribbon-btn-large ribbon-btn-highlight" onClick={onOpenAnomalyScanner} title="AI Chatter & Cantilever Deflection Scanner">
                  <Activity size={22} color="#f43f5e" />
                  <span className="btn-label" style={{ color: '#f43f5e', fontWeight: 700 }}>AI Chatter<br />&amp; Deflect</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenLatheStudio} title="Turning & Lathe Studio">
                  <Disc size={20} color="#ec4899" />
                  <span className="btn-label">Lathe /<br />Turn</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenProbingStudio} title="Renishaw & Haas Touch Probing Studio">
                  <Crosshair size={20} color="#d946ef" />
                  <span className="btn-label">Touch<br />Probe</span>
                </button>
              </div>
              <span className="ribbon-group-title">Argus CAM Suite</span>
            </div>
          </>
        )}

        {/* ==================== 11. VIEW TAB ==================== */}
        {activeTab === 'View' && (
          <>
            {/* Workspace View Mode (2D Board | Split | 3D Viewport) */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${workspaceViewMode === '2d' ? 'ribbon-btn-highlight' : ''}`}
                  onClick={() => onChangeViewMode && onChangeViewMode('2d')}
                  title="Switch to Full 2D CAD Design Board"
                >
                  <span style={{ fontSize: '20px' }}>🎨</span>
                  <span className="btn-label" style={{ fontWeight: 600 }}>2D Design<br />Board</span>
                </button>
                <button
                  className={`ribbon-btn-large ${workspaceViewMode === 'split' ? 'ribbon-btn-highlight' : ''}`}
                  onClick={() => onChangeViewMode && onChangeViewMode('split')}
                  title="Switch to Side-by-Side Split View"
                >
                  <span style={{ fontSize: '20px' }}>◫</span>
                  <span className="btn-label" style={{ fontWeight: 600 }}>Split<br />2D / 3D</span>
                </button>
                <button
                  className={`ribbon-btn-large ${workspaceViewMode === '3d' ? 'ribbon-btn-highlight' : ''}`}
                  onClick={() => onChangeViewMode && onChangeViewMode('3d')}
                  title="Switch to Full 3D Machine Viewport"
                >
                  <Box size={20} color="#38bdf8" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>3D<br />Machine</span>
                </button>
              </div>
              <span className="ribbon-group-title">Workspace View</span>
            </div>

            {/* Zoom */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('fit')} title="Fit Workpiece to Viewport">
                  <Maximize2 size={20} color="#e2e8f0" />
                  <span className="btn-label" style={{ fontWeight: 600 }}>Fit</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Unzoom 50%')} title="Zoom Out 50%">
                  <Minimize2 size={20} color="#94a3b8" />
                  <span className="btn-label">Unzoom<br />50%</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Unzoom 80%')} title="Zoom Out 80%">
                  <Minimize2 size={20} color="#94a3b8" />
                  <span className="btn-label">Unzoom<br />80%</span>
                </button>
              </div>
              <span className="ribbon-group-title">Zoom</span>
            </div>

            {/* Graphics View */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('iso')} title="Isometric Camera View">
                  <Box size={20} color="#38bdf8" />
                  <span className="btn-label">Isometric</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('top')} title="Top View (G17 XY)">
                  <Eye size={20} color="#f59e0b" />
                  <span className="btn-label">Top</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('front')} title="Front View (G18 XZ)">
                  <Eye size={20} color="#10b981" />
                  <span className="btn-label">Front</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('right')} title="Right View (G19 YZ)">
                  <Eye size={20} color="#a855f7" />
                  <span className="btn-label">Right</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('bottom')} title="Bottom View (-Z)">
                  <Eye size={20} color="#94a3b8" />
                  <span className="btn-label">Bottom</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('left')} title="Left View (-X)">
                  <Eye size={20} color="#94a3b8" />
                  <span className="btn-label">Left</span>
                </button>
              </div>
              <span className="ribbon-group-title">Graphics View</span>
            </div>

            {/* Appearance */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className={`ribbon-btn-large ${renderMode === 'wireframe' ? 'active' : ''}`} onClick={() => onChangeRenderMode('wireframe')} title="Pure CAD Wireframe Only">
                  <Crosshair size={20} color="#10b981" />
                  <span className="btn-label">Wireframe</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'edges' ? 'active' : ''}`} onClick={() => onChangeRenderMode('edges')} title="Outline Shaded with Polygon Edges">
                  <Layers size={20} color="#f59e0b" />
                  <span className="btn-label">Outline<br />Shaded</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'shaded' ? 'active' : ''}`} onClick={() => onChangeRenderMode('shaded')} title="PBR Metallic Shading">
                  <Eye size={20} color="#38bdf8" />
                  <span className="btn-label">Metallic</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'transparent' ? 'active' : ''}`} onClick={() => onChangeRenderMode('transparent')} title="Translucency Glass">
                  <Eye size={20} color="#a855f7" />
                  <span className="btn-label">Translucency</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'normals' ? 'active' : ''}`} onClick={() => onChangeRenderMode('normals')} title="Inspect Surface Normals">
                  <Sparkles size={20} color="#ec4899" />
                  <span className="btn-label">Normals</span>
                </button>
              </div>
              <span className="ribbon-group-title">Appearance</span>
            </div>

            {/* Managers */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onSelectManagerTab && onSelectManagerTab('Toolpaths')} title="Toolpaths Manager">
                  <Layers size={20} color="#10b981" />
                  <span className="btn-label">Toolpaths</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectManagerTab && onSelectManagerTab('Levels')} title="Levels Manager">
                  <Layers size={20} color="#38bdf8" />
                  <span className="btn-label">Levels</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectManagerTab && onSelectManagerTab('Solids')} title="Solids Manager">
                  <Box size={20} color="#f59e0b" />
                  <span className="btn-label">Solids</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectManagerTab && onSelectManagerTab('Planes')} title="Planes Manager">
                  <Compass size={20} color="#a855f7" />
                  <span className="btn-label">Planes</span>
                </button>
              </div>
              <span className="ribbon-group-title">Managers</span>
            </div>

            {/* Display */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onToggleLayer('bed')} title="Toggle Grid Bed">
                  <Grid size={20} color="#60a5fa" />
                  <span className="btn-label">Show Grid</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onToggleLayer('stock')} title="Toggle Stock Bounding Box">
                  <Box size={20} color="#f59e0b" />
                  <span className="btn-label">Show Stock</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onToggleLayer('fixture')} title="Toggle Fixture Vise">
                  <Wrench size={20} color="#a855f7" />
                  <span className="btn-label">Show Vise</span>
                </button>
              </div>
              <span className="ribbon-group-title">Display</span>
            </div>

            {/* Controller & Studio */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${cameraMode === 'orthographic' ? 'active' : ''}`}
                  onClick={() => onToggleCameraMode && onToggleCameraMode(cameraMode === 'orthographic' ? 'perspective' : 'orthographic')}
                  title="Toggle Perspective vs Orthographic Parallel CAD Projection"
                >
                  <Camera size={20} color={cameraMode === 'orthographic' ? '#38bdf8' : '#64748b'} />
                  <span className="btn-label">{cameraMode === 'orthographic' ? 'Ortho CAD' : 'Persp 3D'}</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onToggleTheme}
                  title={`Toggle UI Theme (Current: ${theme === 'light' ? 'Light CAD Day' : 'Dark CAD Night'})`}
                >
                  {theme === 'light' ? <Sun size={20} color="#d97706" /> : <Moon size={20} color="#38bdf8" />}
                  <span className="btn-label">{theme === 'light' ? 'Light Theme' : 'Dark Theme'}</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenViewStudioModal}
                  title="Open Mastercam 3D View Studio"
                >
                  <Sliders size={20} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>View Studio</span>
                </button>
                <button
                  className={`ribbon-btn-large ${clippingPlane?.enabled ? 'active' : ''}`}
                  onClick={() => onUpdateClippingPlane && onUpdateClippingPlane({ ...clippingPlane, enabled: !clippingPlane?.enabled })}
                  title="Toggle 3D Cross-Section Cut"
                >
                  <Scissors size={20} color={clippingPlane?.enabled ? '#f472b6' : '#ec4899'} />
                  <span className="btn-label">Section<br />Cut</span>
                </button>
              </div>
              <span className="ribbon-group-title">Controller &amp; Studio</span>
            </div>
          </>
        )}

        {/* ==================== 12. TOOLPATHS TAB ==================== */}
        {activeTab === 'Toolpaths' && (
          <>
            {/* 2D */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pocket')} title="2D Contour Milling">
                  <div style={{ width: '18px', height: '18px', background: '#3b82f6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CT</div>
                  <span className="btn-label">Contour</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('drilling')} title="2D Hole Drilling Cycle">
                  <div style={{ width: '18px', height: '18px', background: '#ef4444', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DR</div>
                  <span className="btn-label">Drill</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('adaptive')} title="2D Dynamic High-Speed Trochoidal Roughing">
                  <div style={{ width: '18px', height: '18px', background: '#10b981', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DY</div>
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Dynamic...</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('facing')} title="Face Milling Planar Pass">
                  <div style={{ width: '18px', height: '18px', background: '#f59e0b', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FC</div>
                  <span className="btn-label">Face</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pocket')} title="2D Pocket Milling">
                  <div style={{ width: '18px', height: '18px', background: '#8b5cf6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PK</div>
                  <span className="btn-label">Pocket</span>
                </button>
              </div>
              <span className="ribbon-group-title">2D</span>
            </div>

            {/* 3D */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenAdaptiveModal ? onOpenAdaptiveModal : () => onQuickAddOp('adaptive')}
                  title="3D OptiRough High-Speed Constant Engagement Roughing"
                >
                  <div style={{ width: '18px', height: '18px', background: '#06b6d4', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>OR</div>
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>OptiRough</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pocket')} title="3D Pocketing">
                  <div style={{ width: '18px', height: '18px', background: '#3b82f6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PK</div>
                  <span className="btn-label">Pocket</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pencil')} title="3D Project Toolpath">
                  <div style={{ width: '18px', height: '18px', background: '#f97316', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PR</div>
                  <span className="btn-label">Project</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenSurfaceFinishContour ? onOpenSurfaceFinishContour : () => onQuickAddOp('waterline')}
                  title="3D Parallel / Surface Finish Contour"
                >
                  <div style={{ width: '18px', height: '18px', background: '#f59e0b', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PL</div>
                  <span className="btn-label">Parallel</span>
                </button>
              </div>
              <span className="ribbon-group-title">3D</span>
            </div>

            {/* Multiaxis */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onQuickAddOp('pencil')}
                  title="Multiaxis Curve"
                >
                  <div style={{ width: '18px', height: '18px', background: '#a855f7', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CV</div>
                  <span className="btn-label">Curve</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFiveAxisStudio ? onOpenFiveAxisStudio : () => onQuickAddOp('swarf')}
                  title="5-Axis Swarf Milling"
                >
                  <div style={{ width: '18px', height: '18px', background: '#8b5cf6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SW</div>
                  <span className="btn-label">Swarf Mill...</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onQuickAddOp('waterline')}
                  title="Multiaxis Parallel"
                >
                  <div style={{ width: '18px', height: '18px', background: '#38bdf8', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PL</div>
                  <span className="btn-label">Parallel</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onQuickAddOp('drilling')}
                  title="Multiaxis Drill"
                >
                  <div style={{ width: '18px', height: '18px', background: '#ef4444', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DR</div>
                  <span className="btn-label">Drill</span>
                </button>
              </div>
              <span className="ribbon-group-title">Multiaxis</span>
            </div>

            {/* Stock */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onToggleLayer && onToggleLayer('stock')} title="Toggle Stock Shading">
                  <Box size={20} color="#f59e0b" />
                  <span className="btn-label">Stock<br />Shading</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onToggleLayer && onToggleLayer('stock')} title="Toggle Stock Wireframe Display">
                  <Eye size={20} color="#10b981" />
                  <span className="btn-label">Stock<br />Display</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenStockModal} title="Configure Stock Bounding Model">
                  <Settings size={20} color="#38bdf8" />
                  <span className="btn-label">Stock<br />Model</span>
                </button>
              </div>
              <span className="ribbon-group-title">Stock</span>
            </div>

            {/* Utilities */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenDefineToolModal ? onOpenDefineToolModal : onOpenToolManager}
                  title="Define Tool Wizard (Create End Mill, Bull Mill, Drill, etc.)"
                >
                  <Plus size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Define<br />Tool</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenToolManager} title="Open Mill Tool Manager">
                  <Wrench size={20} color="#38bdf8" />
                  <span className="btn-label">Tool<br />Manager</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenProbingStudio} title="Touch Probing Studio">
                  <Crosshair size={20} color="#d946ef" />
                  <span className="btn-label">Probe</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFiveAxisStudio}
                  title="Multiaxis Linking Studio"
                >
                  <Orbit size={20} color="#a855f7" />
                  <span className="btn-label">Multiaxis<br />Linking</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onOpenTransformModal ? onOpenTransformModal('translate') : null} title="Toolpath Transform & Multi-Part Matrix">
                  <Move size={20} color="#38bdf8" />
                  <span className="btn-label">Toolpath<br />Transform</span>
                </button>
              </div>
              <span className="ribbon-group-title">Utilities</span>
            </div>

            {/* Verify & Post */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onStartBackplot && onStartBackplot()} title="Toolpath Wireframe Backplot">
                  <Play size={20} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Backplot</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onOpenSolidVerifyModal ? onOpenSolidVerifyModal() : (onStartVerify && onStartVerify(null, 'verify'))} title="Verify Solid Stock Material Removal">
                  <Box size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Verify<br />Solid</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onStartVerify ? onStartVerify(null, 'heatmap') : null} title="Inspect Heatmap Tolerance Gouges vs Excess">
                  <Gauge size={20} color="#f59e0b" />
                  <span className="btn-label">Tolerance<br />Heatmap</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenFeedOptimizerModal} title="Feed Rate Optimization & Constant Chip Thickness">
                  <Activity size={20} color="#f59e0b" />
                  <span className="btn-label">Feed Rate<br />Optimizer</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenSimModal} title="Full 5-Axis Machine Kinematic Digital Twin Simulation">
                  <Play size={20} color="#38bdf8" />
                  <span className="btn-label">Kinematic<br />Twin</span>
                </button>
                <button className="ribbon-btn-large ribbon-btn-highlight" onClick={onOpenPostModal} title="Generate G-Code & NC2Check">
                  <div className="post-badge">G1</div>
                  <FileCode size={24} color="#ffffff" />
                  <span className="btn-label" style={{ fontWeight: 700, color: '#ffffff' }}>G1 Post</span>
                </button>
              </div>
              <span className="ribbon-group-title">Verify &amp; Post</span>
            </div>

            {/* Operations Controls */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onOpenOperationsWizard} title="Open Operations Wizard">
                  <Layers size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Ops<br />Wizard</span>
                </button>
                <button className="ribbon-btn-large" onClick={onRegenerateAll} title="Regenerate All Operations">
                  <RefreshCw size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Regenerate<br />All</span>
                </button>
                <button className="ribbon-btn-large" onClick={onDeleteActiveOp} title="Delete Selected Operation">
                  <Trash2 size={20} color="#ef4444" />
                  <span className="btn-label">Delete<br />Op</span>
                </button>
              </div>
              <span className="ribbon-group-title">Operation Controls</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

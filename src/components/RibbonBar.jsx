import React, { useRef } from 'react';
import {
  Layers, Settings, Play, ShieldAlert, FileText, CheckCircle2,
  Box, Scissors, Compass, Sliders, Eye, RefreshCw, Zap,
  Wrench, FileCode, CheckSquare, Upload, FolderOpen, Download,
  Printer, Palette, Move, RotateCcw, Maximize2, Minimize2,
  Trash2, Plus, Sparkles, Orbit, Grid, Crosshair, HelpCircle,
  Save, Clock, Disc, ArrowUp, ArrowDown, Camera, Sun, Moon, Gauge,
  Copy, Cpu, Activity, Type, DollarSign, Tablet
} from 'lucide-react';
import { parseSTLFile, parseOBJFile, parseSTEPFile, parseIGESFile } from '../utils/cadGeometry';
import { parseProjectMCAM } from '../utils/projectStorage';

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
  activeWcs
}) {
  const fileInputRef = useRef(null);
  const mcamFileInputRef = useRef(null);
  const ncFileInputRef = useRef(null);

  const tabs = [
    'File', 'Home', 'Wireframe', 'Surfaces', 'Solids',
    'Model Prep', 'Mesh', 'Drafting', 'Transform', 'Machine', 'View', 'Toolpaths'
  ];

  const handleCADFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      try {
        let modelGroup;
        if (ext === 'step' || ext === 'stp') {
          modelGroup = await parseSTEPFile(file);
        } else if (ext === 'iges' || ext === 'igs') {
          modelGroup = await parseIGESFile(file);
        } else if (ext === 'obj') {
          modelGroup = await parseOBJFile(file);
        } else {
          modelGroup = await parseSTLFile(file);
        }
        if (onModelImported) {
          onModelImported(modelGroup, file.name);
        }
      } catch (err) {
        console.error("Failed to parse CAD file:", err);
        alert(`Failed to load ${file.name}. Ensure it is a valid .STEP, .IGES, .STL, or .OBJ file.`);
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
      {/* Hidden file input for 3D CAD models (.step, .stp, .iges, .igs, .stl, .obj) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".step,.stp,.iges,.igs,.stl,.obj"
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
      <div className="ribbon-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`ribbon-tab ${tab === 'File' ? 'file-tab' : ''} ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
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
                  onClick={() => fileInputRef.current?.click()}
                  title="Import 3D CAD Solid Part (STEP / IGES / STL / OBJ)"
                >
                  <Upload size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Import<br />STEP / CAD</span>
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
            {/* Clipboard */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Cut')} title="Cut Selection to Clipboard">
                  <Scissors size={20} color="#f43f5e" />
                  <span className="btn-label">Cut</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Copy')} title="Copy Selection">
                  <Copy size={20} color="#38bdf8" />
                  <span className="btn-label">Copy</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Copy Image')} title="Copy Viewport Image to Clipboard">
                  <Camera size={20} color="#10b981" />
                  <span className="btn-label">Copy<br />Image</span>
                </button>
              </div>
              <span className="ribbon-group-title">Clipboard</span>
            </div>

            {/* Attributes */}
            <div className="ribbon-group">
              <div className="ribbon-group-items" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                  <button style={{ width: '20px', height: '20px', background: '#3b82f6', border: '1px solid #60a5fa', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#3b82f6')} title="Billet Blue" />
                  <button style={{ width: '20px', height: '20px', background: '#94a3b8', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#94a3b8')} title="Steel Silver" />
                  <button style={{ width: '20px', height: '20px', background: '#f59e0b', border: '1px solid #fcd34d', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#f59e0b')} title="Gold Brass" />
                  <button style={{ width: '20px', height: '20px', background: '#10b981', border: '1px solid #34d399', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#10b981')} title="Emerald Green" />
                  <button style={{ width: '20px', height: '20px', background: '#8b5cf6', border: '1px solid #c084fc', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#8b5cf6')} title="Anodized Violet" />
                  <button style={{ width: '20px', height: '20px', background: '#ef4444', border: '1px solid #f87171', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#ef4444')} title="High-Vis Red" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px', color: '#94a3b8' }}>
                  <span style={{ fontWeight: 600 }}>Z: 0.0</span>
                  <span style={{ color: '#38bdf8' }}>3D / 2D</span>
                </div>
              </div>
              <span className="ribbon-group-title">Attributes</span>
            </div>

            {/* Organize */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onSelectManagerTab && onSelectManagerTab('Levels')}
                  title="Open Mastercam Levels / Layers Manager Table"
                >
                  <Layers size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Levels<br />Manager</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Non-Associative')} title="Non-Associative Geometry Selection">
                  <CheckSquare size={20} color="#94a3b8" />
                  <span className="btn-label">Non-<br />Associative</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Duplicates')} title="Find & Select Duplicate Entities">
                  <Copy size={20} color="#f59e0b" />
                  <span className="btn-label">Duplicates</span>
                </button>
              </div>
              <span className="ribbon-group-title">Organize</span>
            </div>

            {/* Delete */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onDeleteActiveOp} title="Delete Selected Entities / Op">
                  <Trash2 size={20} color="#ef4444" />
                  <span className="btn-label" style={{ color: '#ef4444', fontWeight: 600 }}>Delete<br />Entities</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Undelete Entity')} title="Undelete Last Deleted Entity">
                  <RotateCcw size={20} color="#10b981" />
                  <span className="btn-label">Undelete<br />Entity</span>
                </button>
              </div>
              <span className="ribbon-group-title">Delete</span>
            </div>

            {/* Display */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Arc Center Points')} title="Display Arc Center Points">
                  <Disc size={20} color="#38bdf8" />
                  <span className="btn-label">Arc Center<br />Points</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Endpoints')} title="Display Curve Endpoints">
                  <Crosshair size={20} color="#f59e0b" />
                  <span className="btn-label">Endpoints</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onToggleLayer && onToggleLayer('stock')} title="Blank / Hide Selected Entity">
                  <Eye size={20} color="#a855f7" />
                  <span className="btn-label">Blank</span>
                </button>
                <button className="ribbon-btn-large" onClick={onUnblankAll} title="Unblank All Entities">
                  <Eye size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Unblank<br />All</span>
                </button>
                <button className="ribbon-btn-large" onClick={onInvertVisibility} title="Hide / Unhide Toggle">
                  <RefreshCw size={20} color="#38bdf8" />
                  <span className="btn-label">Hide /<br />Unhide</span>
                </button>
              </div>
              <span className="ribbon-group-title">Display</span>
            </div>

            {/* Analyze */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenEntityAnalyzer}
                  title="Analyze Entity Dimensions, Volume, Surface Area & Mass"
                >
                  <Crosshair size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Analyze<br />Entity</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenDistanceCaliper}
                  title="Analyze Distance & Angle (3D Caliper)"
                >
                  <Scissors size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Analyze<br />Distance</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Analyze Toolpath')} title="Analyze Toolpath Motion">
                  <Activity size={20} color="#10b981" />
                  <span className="btn-label">Analyze<br />Toolpath</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Analyze Chain')} title="Analyze Wireframe Chain">
                  <Compass size={20} color="#60a5fa" />
                  <span className="btn-label">Analyze<br />Chain</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('2D Area')} title="Calculate 2D Planar Area">
                  <Grid size={20} color="#c084fc" />
                  <span className="btn-label">2D Area</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Statistics')} title="Display File & Geometry Statistics">
                  <FileText size={20} color="#e2e8f0" />
                  <span className="btn-label">Statistics</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Check Solid')} title="Check Solid Integrity">
                  <Box size={20} color="#34d399" />
                  <span className="btn-label">Check<br />Solid</span>
                </button>
              </div>
              <span className="ribbon-group-title">Analyze</span>
            </div>

            {/* Add-Ins */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Run Add-In')} title="Run Mastercam C-Hook / NET-Hook Add-In">
                  <Cpu size={22} color="#38bdf8" />
                  <span className="btn-label">Run<br />Add-In</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Command Finder')} title="Search All Mastercam Commands">
                  <HelpCircle size={22} color="#f59e0b" />
                  <span className="btn-label">Command<br />Finder</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenCPlanesModal} title="Open CPlanes & Dynamic WCS Origin Studio">
                  <Grid size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>CPlane<br />Studio</span>
                </button>
              </div>
              <span className="ribbon-group-title">Add-Ins</span>
            </div>
          </>
        )}

        {/* ==================== 3. WIREFRAME TAB ==================== */}
        {activeTab === 'Wireframe' && (
          <>
            {/* Points */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('datum') : onAddWireframe('drillpoints')}
                  title="Create 3D Point Position Reference"
                >
                  <Crosshair size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Point<br />Position</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('pcd') : onAddWireframe('pcd')}
                  title="Bolt Hole Circle Pattern (PCD & Drill Centers)"
                >
                  <Disc size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Bolt<br />Circle</span>
                </button>
              </div>
              <span className="ribbon-group-title">Points</span>
            </div>

            {/* Lines */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('line') : onAddWireframe('line')}
                  title="Create Line Between 2 Endpoints"
                >
                  <div style={{ width: '22px', height: '2px', background: '#f43f5e', transform: 'rotate(-30deg)', margin: '10px 0' }} />
                  <span className="btn-label" style={{ color: '#f43f5e', fontWeight: 600 }}>Line<br />Endpoints</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('parallel') : onAddWireframe('parallel')}
                  title="Create Parallel Line Offset"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '8px 0' }}>
                    <div style={{ width: '22px', height: '2px', background: '#f59e0b' }} />
                    <div style={{ width: '22px', height: '2px', background: '#38bdf8' }} />
                  </div>
                  <span className="btn-label">Line<br />Parallel</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('perp') : onAddWireframe('perp')}
                  title="Create Perpendicular Line from Entity"
                >
                  <div style={{ position: 'relative', width: '20px', height: '20px', margin: '2px 0' }}>
                    <div style={{ position: 'absolute', bottom: '2px', width: '20px', height: '2px', background: '#10b981' }} />
                    <div style={{ position: 'absolute', left: '10px', top: '2px', width: '2px', height: '16px', background: '#10b981' }} />
                  </div>
                  <span className="btn-label">Line<br />Perpendicular</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Line Closest')} title="Create Line Along Closest Distance">
                  <div style={{ width: '18px', height: '2px', background: '#94a3b8', margin: '10px 0' }} />
                  <span className="btn-label">Line<br />Closest</span>
                </button>
              </div>
              <span className="ribbon-group-title">Lines</span>
            </div>

            {/* Arcs */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('circle') : onAddWireframe('circle')}
                  title="Create Circle by Center Point & Radius"
                >
                  <div style={{ width: '20px', height: '20px', border: '2px solid #38bdf8', borderRadius: '50%' }} />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Circle<br />Center Point</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Arc 3 Points')} title="Create Arc Defined by 3 Points">
                  <Orbit size={20} color="#f59e0b" />
                  <span className="btn-label">Arc 3<br />Points</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Arc Tangent')} title="Create Tangent Arc to Existing Curve">
                  <Disc size={20} color="#10b981" />
                  <span className="btn-label">Arc<br />Tangent</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Circle Edge Point')} title="Create Circle Through Edge Points">
                  <Orbit size={20} color="#a855f7" />
                  <span className="btn-label">Circle<br />Edge Point</span>
                </button>
              </div>
              <span className="ribbon-group-title">Arcs</span>
            </div>

            {/* Splines */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Spline Manual')} title="Create Manual NURBS Spline through Points">
                  <Sliders size={22} color="#38bdf8" />
                  <span className="btn-label">Spline<br />Manual</span>
                </button>
              </div>
              <span className="ribbon-group-title">Splines</span>
            </div>

            {/* Shapes */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('rect') : onAddWireframe('rect')}
                  title="Create Parametric 2D / 3D Rectangle"
                >
                  <div style={{ width: '22px', height: '16px', border: '2px solid #4ade80', borderRadius: '3px' }} />
                  <span className="btn-label" style={{ color: '#4ade80', fontWeight: 600 }}>Rectangle</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('datum') : onAddWireframe('bounding')}
                  title="Create 3D Bounding Box Wireframe"
                >
                  <Box size={22} color="#facc15" />
                  <span className="btn-label">Bounding<br />Box</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Silhouette Boundary')} title="Create Silhouette Boundary Contour">
                  <Layers size={20} color="#06b6d4" />
                  <span className="btn-label">Silhouette<br />Boundary</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Create Letters')} title="Create Stick / TrueType Lettering Wireframe">
                  <Type size={20} color="#c084fc" />
                  <span className="btn-label">Create<br />Letters</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Turn Profile')} title="Extract Lathe Turning Profile">
                  <Disc size={20} color="#ec4899" />
                  <span className="btn-label">Turn<br />Profile</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Relief Groove')} title="Create Standard Relief Groove Profile">
                  <Scissors size={20} color="#f59e0b" />
                  <span className="btn-label">Relief<br />Groove</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Raster to Vector')} title="Convert Raster Image to Vector Wireframe">
                  <Sparkles size={20} color="#34d399" />
                  <span className="btn-label">Raster to<br />Vector</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenCornerReliefStudio}
                  title="Open CNC Automatic Corner Relief & Dog-Bone Studio"
                >
                  <Box size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Corner<br />Relief</span>
                </button>
              </div>
              <span className="ribbon-group-title">Shapes</span>
            </div>

            {/* Curves */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('edges') : onAddWireframe('edges')}
                  title="Extract Curve on Single Solid Edge"
                >
                  <Box size={22} color="#38bdf8" />
                  <span className="btn-label">Curve<br />One Edge</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('edges') : onAddWireframe('edges')}
                  title="Extract Curves on All Solid Edges"
                >
                  <Box size={22} color="#60a5fa" />
                  <span className="btn-label" style={{ color: '#60a5fa', fontWeight: 600 }}>Curve<br />All Edges</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Curve Slice')} title="Create Wireframe Slice Along Plane">
                  <Scissors size={20} color="#ec4899" />
                  <span className="btn-label">Curve<br />Slice</span>
                </button>
              </div>
              <span className="ribbon-group-title">Curves</span>
            </div>

            {/* Modify */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => console.log('Trim Break Extend')} title="Trim / Break / Extend Wireframe Entities">
                  <Scissors size={20} color="#f43f5e" />
                  <span className="btn-label">Trim Break<br />Extend</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Fillet Entities')} title="Add Fillet Radius Between Entities">
                  <Orbit size={20} color="#10b981" />
                  <span className="btn-label">Fillet<br />Entities</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Chamfer Entities')} title="Add Chamfer Angle Between Entities">
                  <Scissors size={20} color="#f59e0b" />
                  <span className="btn-label">Chamfer<br />Entities</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Offset')} title="Offset Contour by Distance">
                  <Move size={20} color="#38bdf8" />
                  <span className="btn-label">Offset</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => console.log('Project')} title="Project Wireframe Onto Surface / Plane">
                  <ArrowDown size={20} color="#c084fc" />
                  <span className="btn-label">Project</span>
                </button>
                <button className="ribbon-btn-large" onClick={onClearWireframes} title="Clear All Level 10 Wireframe Geometry">
                  <Trash2 size={20} color="#94a3b8" />
                  <span className="btn-label">Clear<br />Wireframes</span>
                </button>
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
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Dynamic</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('facing')} title="Face Milling Planar Pass">
                  <div style={{ width: '18px', height: '18px', background: '#f59e0b', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FC</div>
                  <span className="btn-label">Face</span>
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
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('waterline')} title="3D Parallel / Waterline Finishing">
                  <div style={{ width: '18px', height: '18px', background: '#f59e0b', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PL</div>
                  <span className="btn-label">Parallel</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pencil')} title="3D Curve & Pencil Milling">
                  <div style={{ width: '18px', height: '18px', background: '#f97316', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CV</div>
                  <span className="btn-label">Curve</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenFiveAxisStudio ? onOpenFiveAxisStudio : () => onQuickAddOp('swarf')} title="3D Swarf Milling Along Walls">
                  <div style={{ width: '18px', height: '18px', background: '#8b5cf6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>SW</div>
                  <span className="btn-label">Swarf Milling</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('rest_milling')} title="3D Rest Machining Corner Cleanout">
                  <div style={{ width: '18px', height: '18px', background: '#14b8a6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>RM</div>
                  <span className="btn-label">Rest Mill</span>
                </button>
              </div>
              <span className="ribbon-group-title">3D</span>
            </div>

            {/* Multiaxis */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFiveAxisStudio ? onOpenFiveAxisStudio : () => onQuickAddOp('swarf')}
                  title="5-Axis Simultaneous Swarf Machining"
                >
                  <Compass size={22} color="#8b5cf6" />
                  <span className="btn-label" style={{ color: '#8b5cf6', fontWeight: 600 }}>5-Axis<br />Swarf</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFiveAxisStudio}
                  title="Open Complete 5-Axis Multiaxis Kinematic Studio"
                >
                  <Orbit size={22} color="#a855f7" />
                  <span className="btn-label" style={{ color: '#a855f7', fontWeight: 600 }}>Multiaxis<br />Studio</span>
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
                <button className="ribbon-btn-large" onClick={onOpenProbingStudio} title="Touch Probing Studio">
                  <Crosshair size={20} color="#d946ef" />
                  <span className="btn-label">Probe</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onOpenTransformModal ? onOpenTransformModal('translate') : null} title="Toolpath Transform & Multi-Part Matrix">
                  <Move size={20} color="#38bdf8" />
                  <span className="btn-label">Toolpath<br />Transform</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenToolManager} title="Open Mill Tool Manager">
                  <Wrench size={20} color="#10b981" />
                  <span className="btn-label">Tool<br />Manager</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenThreadStudio} title="Thread Milling Studio">
                  <Disc size={20} color="#c084fc" />
                  <span className="btn-label">Thread<br />Mill</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenLeadInOutModal} title="Lead In / Out Ramp & Arc Studio">
                  <Compass size={20} color="#06b6d4" />
                  <span className="btn-label">Lead In/Out</span>
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

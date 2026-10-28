import React, { useRef } from 'react';
import {
  Layers, Settings, Play, ShieldAlert, FileText, CheckCircle2,
  Box, Scissors, Compass, Sliders, Eye, RefreshCw, Zap,
  Wrench, FileCode, CheckSquare, Upload, FolderOpen, Download,
  Printer, Palette, Move, RotateCcw, Maximize2, Minimize2,
  Trash2, Plus, Sparkles, Orbit, Grid, Crosshair, HelpCircle,
  Save, Clock, Disc, ArrowUp, ArrowDown, Camera, Sun, Moon, Gauge,
  Copy, Cpu, Activity, Type
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
            {/* Levels & Structure Management */}
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
                <button
                  className="ribbon-btn-large"
                  onClick={() => onSelectManagerTab && onSelectManagerTab('Solids')}
                  title="Open Solids Body History Tree"
                >
                  <Box size={20} color="#f59e0b" />
                  <span className="btn-label">Solids<br />Tree</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onSelectManagerTab && onSelectManagerTab('Planes')}
                  title="Open WCS Coordinate Planes Manager (G17/G18/G19)"
                >
                  <Compass size={20} color="#10b981" />
                  <span className="btn-label">WCS<br />Planes</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenCPlanesModal}
                  title="Open CPlanes & Dynamic WCS Origin Studio (Compound 5-Axis Planes & Offsets)"
                >
                  <Grid size={20} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>CPlane<br />Studio</span>
                </button>
              </div>
              <span className="ribbon-group-title">Levels &amp; Structure</span>
            </div>

            {/* Analyze & Precision Calipers */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenEntityAnalyzer}
                  title="Analyze Solid Dimensions, Volume, Surface Area & Mass"
                >
                  <Crosshair size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Analyze<br />Entity</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenDistanceCaliper}
                  title="Precision Distance Caliper (3D Vector & Inclination Angle)"
                >
                  <Scissors size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Distance<br />Caliper</span>
                </button>
              </div>
              <span className="ribbon-group-title">Analyze &amp; Measure</span>
            </div>

            {/* Workpiece Attributes & Colors */}
            <div className="ribbon-group">
              <div className="ribbon-group-items" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '2px 4px' }}>
                <button style={{ width: '22px', height: '22px', background: '#3b82f6', border: '1px solid #60a5fa', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#3b82f6')} title="Billet Blue" />
                <button style={{ width: '22px', height: '22px', background: '#94a3b8', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#94a3b8')} title="Steel Silver" />
                <button style={{ width: '22px', height: '22px', background: '#f59e0b', border: '1px solid #fcd34d', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#f59e0b')} title="Gold Brass" />
                <button style={{ width: '22px', height: '22px', background: '#10b981', border: '1px solid #34d399', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#10b981')} title="Emerald Green" />
                <button style={{ width: '22px', height: '22px', background: '#8b5cf6', border: '1px solid #c084fc', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#8b5cf6')} title="Anodized Violet" />
                <button style={{ width: '22px', height: '22px', background: '#ef4444', border: '1px solid #f87171', borderRadius: '3px', cursor: 'pointer' }} onClick={() => onChangeWorkpieceColor('#ef4444')} title="High-Vis Red" />
              </div>
              <span className="ribbon-group-title">Attributes (Color)</span>
            </div>

            {/* Blank / Visibility Utilities */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className={`ribbon-btn-large ${layerVisibility.fixture ? 'active' : ''}`} onClick={() => onToggleLayer('fixture')} title="Blank / Unblank Fixture Vise">
                  <span className="btn-label">Vise<br />Visibility</span>
                </button>
                <button className={`ribbon-btn-large ${layerVisibility.stock ? 'active' : ''}`} onClick={() => onToggleLayer('stock')} title="Blank / Unblank Stock Bounding Box">
                  <span className="btn-label">Stock<br />Visibility</span>
                </button>
                <button className="ribbon-btn-large" onClick={onUnblankAll} title="Unblank All (Restore All Hidden Layers)">
                  <Eye size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Unblank<br />All</span>
                </button>
                <button className="ribbon-btn-large" onClick={onInvertVisibility} title="Invert Layer Visibility">
                  <RefreshCw size={20} color="#a855f7" />
                  <span className="btn-label">Invert<br />Visibility</span>
                </button>
              </div>
              <span className="ribbon-group-title">Blank / Unblank</span>
            </div>

            {/* Operations Manager Actions */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onRegenerateAll} title="Regenerate All Dirty Toolpaths">
                  <RefreshCw size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Regenerate<br />All Ops</span>
                </button>
                <button className="ribbon-btn-large" onClick={onDeleteActiveOp} title="Delete Active Operation">
                  <Trash2 size={20} color="#ef4444" />
                  <span className="btn-label">Delete<br />Op</span>
                </button>
              </div>
              <span className="ribbon-group-title">Operations</span>
            </div>
          </>
        )}

        {/* ==================== 3. WIREFRAME TAB ==================== */}
        {activeTab === 'Wireframe' && (
          <>
            {/* Lines */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('line') : onAddWireframe('line')}
                  title="3D Line 2 Points (Endpoints or Angle + Length)"
                >
                  <div style={{ width: '22px', height: '2px', background: '#f43f5e', transform: 'rotate(-30deg)', margin: '10px 0' }} />
                  <span className="btn-label" style={{ color: '#f43f5e', fontWeight: 600 }}>Line<br />2 Points</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('parallel') : onAddWireframe('parallel')}
                  title="Parallel Offset Wireframe Line"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '8px 0' }}>
                    <div style={{ width: '22px', height: '2px', background: '#f59e0b' }} />
                    <div style={{ width: '22px', height: '2px', background: '#38bdf8' }} />
                  </div>
                  <span className="btn-label">Parallel<br />Line</span>
                </button>
              </div>
              <span className="ribbon-group-title">Lines</span>
            </div>

            {/* Arcs & Circles */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('circle') : onAddWireframe('circle')}
                  title="Parametric 3D Circle / Arc (Radius, Diameter, Plane G17/G18/G19)"
                >
                  <div style={{ width: '20px', height: '20px', border: '2px solid #38bdf8', borderRadius: '50%' }} />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Circle<br />Radius</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('pcd') : onAddWireframe('pcd')}
                  title="Bolt Hole Circle Pattern (PCD & Drill Centers)"
                >
                  <Disc size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Bolt Circle<br />(PCD)</span>
                </button>
              </div>
              <span className="ribbon-group-title">Arcs &amp; Circles</span>
            </div>

            {/* Shapes */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('rect') : onAddWireframe('rect')}
                  title="3D Rectangular Pocket Boundary (Corner Fillet R)"
                >
                  <div style={{ width: '22px', height: '16px', border: '2px solid #4ade80', borderRadius: '3px' }} />
                  <span className="btn-label" style={{ color: '#4ade80', fontWeight: 600 }}>Rectangle<br />Pocket</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('polygon') : onAddWireframe('polygon')}
                  title="Regular Polygon (Hexagon, Octagon, Prismatic Flange)"
                >
                  <Grid size={21} color="#a855f7" />
                  <span className="btn-label">Polygon<br />Hexagon</span>
                </button>
              </div>
              <span className="ribbon-group-title">Shapes</span>
            </div>

            {/* Curves from Solid CAD Model */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('edges') : onAddWireframe('edges')}
                  title="Extract Sharp Feature Edges from 3D Workpiece Model into Level 10 Wireframe Curves"
                >
                  <Box size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Curve on<br />All Edges</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('datum') : onAddWireframe('bounding')}
                  title="Generate 3D Wireframe Cage Enclosing Part"
                >
                  <Box size={22} color="#facc15" />
                  <span className="btn-label">Bounding<br />Cage</span>
                </button>
              </div>
              <span className="ribbon-group-title">Solid Edges</span>
            </div>

            {/* Datum & Management */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('datum') : onAddWireframe('drillpoints')}
                  title="WCS Coordinate Datum Reference Points"
                >
                  <Crosshair size={22} color="#ef4444" />
                  <span className="btn-label">Datum<br />Points</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenWireframeModal ? onOpenWireframeModal('list') : null}
                  title="Inspect Level 10 Wireframe Entities Manager"
                >
                  <Layers size={21} color="#60a5fa" />
                  <span className="btn-label">Wireframe<br />Manager</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onClearWireframes}
                  title="Clear All Level 10 Wireframe Geometry"
                >
                  <Trash2 size={20} color="#94a3b8" />
                  <span className="btn-label">Clear<br />Wireframes</span>
                </button>
              </div>
              <span className="ribbon-group-title">Datum &amp; Manage</span>
            </div>
          </>
        )}

        {/* ==================== 4. SURFACES TAB ==================== */}
        {activeTab === 'Surfaces' && (
          <>
            {/* Primitives */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('plane') : onAddSurface('plane')}
                  title="Create 3D Planar Surface Sheet (G17/G18/G19, Drive or Check)"
                >
                  <Layers size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Planar<br />Surface</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('cylinder') : onAddSurface('cylinder')}
                  title="Create 3D Cylindrical Surface Sleeve Wrapper"
                >
                  <Orbit size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Cylinder<br />Surface</span>
                </button>
              </div>
              <span className="ribbon-group-title">Primitives</span>
            </div>

            {/* Loft & Extrusions */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('extrude') : null}
                  title="Extrude 2D Boundary into Vertical Surface Walls"
                >
                  <Box size={22} color="#8b5cf6" />
                  <span className="btn-label">Extrude<br />Wall</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('revolve') : null}
                  title="Revolve Profile Around Spindle Axis (Turned & Conical Surfaces)"
                >
                  <Disc size={22} color="#ec4899" />
                  <span className="btn-label">Revolve<br />Surface</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('loft') : null}
                  title="Ruled Loft Surface Blending Between Two Profiles"
                >
                  <Sliders size={22} color="#3b82f6" />
                  <span className="btn-label">Ruled<br />Loft</span>
                </button>
              </div>
              <span className="ribbon-group-title">Lofts &amp; Extrude</span>
            </div>

            {/* CAM Hole Capping & Blends */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('cap') : null}
                  title="Cap Holes / Patch Surface Openings (Prevents Cutter Plunge)"
                >
                  <Sparkles size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Cap<br />Holes</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSurfacesModal ? onOpenSurfacesModal('fillet') : null}
                  title="Curved Fillet Blend Transition Sheet"
                >
                  <Maximize2 size={21} color="#14b8a6" />
                  <span className="btn-label">Fillet<br />Blend</span>
                </button>
              </div>
              <span className="ribbon-group-title">CAM Patches</span>
            </div>

            {/* Drive & Check Management */}
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
                <button
                  className="ribbon-btn-large"
                  onClick={onClearSurfaces}
                  title="Clear All Added Surface Sheets on Level 15"
                >
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
            {/* Primitives */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('box') : onAddSolid('box')}
                  title="Generate Parametric 3D Rectangular Billet Block"
                >
                  <Box size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Block<br />Billet</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('cylinder') : onAddSolid('cylinder')}
                  title="Generate Parametric 3D Cylindrical Blank (Solid or Hollow Bore)"
                >
                  <Orbit size={22} color="#60a5fa" />
                  <span className="btn-label" style={{ color: '#60a5fa', fontWeight: 600 }}>Cylinder<br />Blank</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('cone') : onAddSolid('cone')}
                  title="Generate Parametric 3D Conical Frustum Solid"
                >
                  <Compass size={22} color="#f59e0b" />
                  <span className="btn-label">Cone<br />Frustum</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('torus') : onAddSolid('torus')}
                  title="Generate Parametric 3D Torus Solid Ring"
                >
                  <Disc size={22} color="#a855f7" />
                  <span className="btn-label">Torus<br />Ring</span>
                </button>
              </div>
              <span className="ribbon-group-title">Solid Primitives</span>
            </div>

            {/* Extrusion & Cavities */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('extrude') : onAddSolid('extrude')}
                  title="Extrude 2D Contour to 3D Solid with Draft Angle"
                >
                  <Sliders size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Extrude<br />Solid</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('pocket') : null}
                  title="Generate CNC Milled Pocket Workpiece (Cavity + Fillets)"
                >
                  <Sparkles size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Pocket<br />Cavity</span>
                </button>
              </div>
              <span className="ribbon-group-title">Features &amp; Cavities</span>
            </div>

            {/* Manager & Stock Operations */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenSolidsModal ? onOpenSolidsModal('manager') : null}
                  title="Inspect Solids Manager Tree & Material Densities"
                >
                  <Layers size={22} color="#60a5fa" />
                  <span className="btn-label" style={{ color: '#60a5fa', fontWeight: 600 }}>Solids<br />Manager</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenStockModal}
                  title="Configure Raw Stock Bounding Box Dimensions"
                >
                  <Settings size={20} color="#10b981" />
                  <span className="btn-label">Solid<br />Stock</span>
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
              <span className="ribbon-group-title">Solids Management</span>
            </div>
          </>
        )}

        {/* ==================== 6. MODEL PREP TAB ==================== */}
        {activeTab === 'Model Prep' && (
          <>
            {/* Direct Modeling */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('pushpull') : (onPushPull && onPushPull(2))}
                  title="Direct Modeling Push / Pull Face (Offset Any Planar or Cylindrical Face)"
                >
                  <Maximize2 size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Push / Pull<br />Face</span>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onPushPull ? onPushPull(1) : (onOpenModelPrepModal && onOpenModelPrepModal('pushpull'))}
                    title="Quick Add +1.0mm Top Face Stock Allowance"
                  >
                    <ArrowUp size={12} color="#4ade80" />
                    <span>+1mm Top</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onPushPull ? onPushPull(-1) : (onOpenModelPrepModal && onOpenModelPrepModal('pushpull'))}
                    title="Quick Pull -1.0mm Top Face Finish Skim"
                  >
                    <ArrowDown size={12} color="#f43f5e" />
                    <span>-1mm Top</span>
                  </button>
                  <button
                    className="ribbon-btn-small"
                    onClick={() => onPushPull ? onPushPull(1.5) : (onOpenModelPrepModal && onOpenModelPrepModal('pushpull'))}
                    title="Add Uniform +1.5mm Roughing Stock Skin"
                  >
                    <Sparkles size={12} color="#f59e0b" />
                    <span>+1.5mm Skin</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Direct Modeling</span>
            </div>

            {/* WCS & Table Alignment */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('align') : onResetTransform()}
                  title="WCS Coordinate Alignment & Table Positioning Workbench"
                >
                  <Crosshair size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Align<br />WCS</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onResetTransform}
                  title="Snap Top Face Directly to Z=0 Datum (CNC Standard Origin)"
                >
                  <Grid size={21} color="#60a5fa" />
                  <span className="btn-label">Top to<br />Z0 Datum</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onDropToTable}
                  title="Align Bottom Face of Part to Fixture Baseplate / Vise Jaws"
                >
                  <Layers size={21} color="#10b981" />
                  <span className="btn-label">Drop to<br />Table</span>
                </button>
              </div>
              <span className="ribbon-group-title">WCS &amp; Alignment</span>
            </div>

            {/* Setup Orientation & Indexing */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('orient') : onRotatePart(0, 0, Math.PI)}
                  title="Setup 2 Flip (Rotate 180° for Backside Machining)"
                >
                  <RotateCcw size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Flip Op 2<br />(180&deg;)</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onRotatePart ? onRotatePart(0, Math.PI / 2, 0) : null}
                  title="Index 90° Around Vertical Spindle Axis"
                >
                  <RefreshCw size={21} color="#a855f7" />
                  <span className="btn-label">Rotate<br />+90&deg;</span>
                </button>
              </div>
              <span className="ribbon-group-title">Setup Indexing</span>
            </div>

            {/* Defeaturing & CAM Capping */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('defeature') : null}
                  title="CAM Defeaturing & Auto-Capping Bolt Holes (Level 15)"
                >
                  <ShieldAlert size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>CAM Hole<br />Capping</span>
                </button>
              </div>
              <span className="ribbon-group-title">Defeaturing</span>
            </div>

            {/* Manifold Diagnostics & Healing */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenModelPrepModal ? onOpenModelPrepModal('manifold') : onOpenEntityAnalyzer()}
                  title="Inspect Watertight Manifold Topology & Check for Holes"
                >
                  <CheckCircle2 size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Check<br />Manifold</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenEntityAnalyzer}
                  title="Entity Inspector (Dimensions, Volume, Center of Gravity)"
                >
                  <Compass size={21} color="#94a3b8" />
                  <span className="btn-label">Entity<br />Inspector</span>
                </button>
              </div>
              <span className="ribbon-group-title">Diagnostics</span>
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
            {/* Dimensions */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('linear') : null}
                  title="3D Linear Dimensions with Dual Arrowheads &amp; Tolerances (Level 100)"
                >
                  <Scissors size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Linear<br />Dimension</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('radial') : null}
                  title="3D Radial (R) &amp; Diametral (Ø) Leader Callouts"
                >
                  <Disc size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Radial / &Oslash;<br />Callout</span>
                </button>
              </div>
              <span className="ribbon-group-title">Dimensions</span>
            </div>

            {/* Datums & Leaders */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('datum') : null}
                  title="WCS Coordinate Datum Tags (G54 / G55 / Datum -A-)"
                >
                  <Crosshair size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>WCS Datum<br />Tag</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('leader') : null}
                  title="Machining Operator Leader Note (Taps, Reams, Surface Finishes)"
                >
                  <FileText size={22} color="#a855f7" />
                  <span className="btn-label">Leader<br />Note</span>
                </button>
              </div>
              <span className="ribbon-group-title">Annotations</span>
            </div>

            {/* Level 100 Management & Caliper */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${layerVisibility.dimensions ? 'active' : ''}`}
                  onClick={() => onToggleLayer('dimensions')}
                  title="Toggle Level 100 Drafting Dimensions Visibility"
                >
                  <Eye size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {layerVisibility.dimensions ? 'Hide' : 'Show'}<br />Level 100
                  </span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenDraftingModal ? onOpenDraftingModal('manager') : null}
                  title="Drafting Entity Manager Tree (Inspect &amp; Delete Annotations)"
                >
                  <Layers size={21} color="#60a5fa" />
                  <span className="btn-label">Drafting<br />Manager</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenDistanceCaliper}
                  title="Interactive Digital Vernier Caliper Measure"
                >
                  <Sliders size={20} color="#10b981" />
                  <span className="btn-label">Digital<br />Caliper</span>
                </button>
              </div>
              <span className="ribbon-group-title">Management</span>
            </div>

            {/* CNC Engraving & Marking */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenEngravingStudio}
                  title="Open CNC 2.5D &amp; 3D Engraving &amp; V-Carve Studio (Serial Numbers, Single-Line Stick Font, 3D Prism V-Carving)"
                >
                  <Type size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 700 }}>Engraving<br />&amp; V-Carve</span>
                </button>
              </div>
              <span className="ribbon-group-title">Part Marking</span>
            </div>
          </>
        )}

        {/* ==================== 9. TRANSFORM TAB ==================== */}
        {activeTab === 'Transform' && (
          <>
            {/* Translation & Step Move */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('translate') : null}
                  title="3D Translation Workbench (Exact Delta X/Y/Z, Move Original or Multi-Copy)"
                >
                  <Move size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>3D Move<br />/ Copy</span>
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                  <button className="ribbon-btn-small" onClick={() => onTranslatePart(10, 0, 0)} title="Translate +10 mm on X">
                    <span style={{ color: '#38bdf8' }}>X+10</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={() => onTranslatePart(0, 10, 0)} title="Translate +10 mm on Y">
                    <span style={{ color: '#10b981' }}>Y+10</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={() => onTranslatePart(0, 0, 10)} title="Translate +10 mm on Z">
                    <span style={{ color: '#f59e0b' }}>Z+10</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={() => onTranslatePart(-10, 0, 0)} title="Translate -10 mm on X">
                    <span style={{ color: '#38bdf8' }}>X-10</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={() => onTranslatePart(0, -10, 0)} title="Translate -10 mm on Y">
                    <span style={{ color: '#10b981' }}>Y-10</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={() => onTranslatePart(0, 0, -10)} title="Translate -10 mm on Z">
                    <span style={{ color: '#f59e0b' }}>Z-10</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Translation</span>
            </div>

            {/* Rotation & Indexing */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('rotate') : null}
                  title="Rotary Indexer &amp; Spindle Alignment (X, Y, Z Axis Angles)"
                >
                  <RotateCcw size={22} color="#a855f7" />
                  <span className="btn-label" style={{ color: '#a855f7', fontWeight: 600 }}>3D Rotate<br />&amp; Index</span>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button className="ribbon-btn-small" onClick={() => onRotatePart(0, 0, Math.PI / 2)} title="Rotate 90° around Spindle (Z)">
                    <span>Rot 90&deg; Z</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={() => onRotatePart(Math.PI / 2, 0, 0)} title="Tilt 90° around Trunnion (X)">
                    <span>Tilt 90&deg; X</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Rotation</span>
            </div>

            {/* Scale & Shrinkage */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('scale') : null}
                  title="Scale Factor &amp; Casting Shrinkage Compensation (+2.5%, Unit Conversion)"
                >
                  <Maximize2 size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Scale &amp;<br />Shrinkage</span>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button className="ribbon-btn-small" onClick={() => onScalePart(1.25)} title="Scale Up 1.25x">
                    <span>1.25&times;</span>
                  </button>
                  <button className="ribbon-btn-small" onClick={() => onScalePart(0.8)} title="Scale Down 0.8x">
                    <span>0.8&times;</span>
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">Scale</span>
            </div>

            {/* Mirror & Multi-Part Pattern */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('mirror') : null}
                  title="Mirror Left/Right Hand Symmetrical Pairs across YZ/XZ/XY Planes"
                >
                  <Copy size={21} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Mirror<br />(LH / RH)</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={() => onOpenTransformModal ? onOpenTransformModal('pattern') : null}
                  title="Multi-Part Matrix Pattern &amp; Circular PCD Array (Multi-Fixture Setup)"
                >
                  <Grid size={21} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Matrix<br />Pattern</span>
                </button>
              </div>
              <span className="ribbon-group-title">Mirror &amp; Array</span>
            </div>

            {/* Sheet Nesting & Stock Optimizer */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenNestingStudio}
                  title="Open CNC True-Shape Sheet Nesting Studio (2D/2.5D Router, Waterjet, Laser, Plasma Stock Packing &amp; Remnant Recovery)"
                >
                  <Scissors size={21} color="#0284c7" />
                  <span className="btn-label" style={{ color: '#0284c7', fontWeight: 700 }}>Sheet<br />Nesting</span>
                </button>
              </div>
              <span className="ribbon-group-title">Sheet CAM</span>
            </div>

            {/* Reset */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onResetTransform} title="Reset All Position, Rotation &amp; Scale to WCS G54 Origin">
                  <RefreshCw size={20} color="#ef4444" />
                  <span className="btn-label" style={{ color: '#ef4444', fontWeight: 600 }}>Reset All<br />Transforms</span>
                </button>
              </div>
              <span className="ribbon-group-title">Reset</span>
            </div>
          </>
        )}

        {/* ==================== 10. MACHINE TAB (Default & Main Screenshot Tab) ==================== */}
        {activeTab === 'Machine' && (
          <>
            {/* Machine Definition Selector */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenMachineConfigModal}
                  title="Configure CNC Machine Definition &amp; Kinematic Limits (Axes, Controller, ATC)"
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
                      width: '160px'
                    }}
                  >
                    <option value="dmu50">DMG MORI DMU 50 (5X)</option>
                    <option value="haas_vf2">Haas VF-2 (3X VMC)</option>
                    <option value="robodrill">Fanuc Robodrill D21</option>
                    <option value="integrex">Mazak Integrex i-200</option>
                  </select>

                  <div style={{ display: 'flex', gap: '4px', width: '160px' }}>
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
                  title="Open Construction Planes & Dynamic WCS Origin Studio (Compound 5-Axis Planes)"
                >
                  <Compass size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Planes /<br />WCS Studio</span>
                </button>
              </div>
              <span className="ribbon-group-title">Machine &amp; WCS</span>
            </div>

            {/* CAD Model & Samples Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => fileInputRef.current?.click()} title="Import 3D CAD Solid Part (STEP / IGES / STL / OBJ)">
                  <Upload size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Import<br />STEP / CAD</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('step_bracket')} title="Load Native STEP (ISO 10303-21) Solid B-Rep CAD Part">
                  <FileCode size={19} color="#3b82f6" />
                  <span className="btn-label" style={{ color: '#3b82f6', fontWeight: 600 }}>STEP B-Rep<br />Sample</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('impeller')} title="Load 5-Axis Impeller CAD Model">
                  <Compass size={19} color="#a855f7" />
                  <span className="btn-label">5X Impeller<br />Sample</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('bracket')} title="Load Aerospace Pocketing Bracket Model">
                  <Layers size={19} color="#06b6d4" />
                  <span className="btn-label">Aero Bracket<br />Sample</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('mold')} title="Load Precision Mold Core Model">
                  <Box size={19} color="#f59e0b" />
                  <span className="btn-label">Mold Core<br />Sample</span>
                </button>
              </div>
              <span className="ribbon-group-title">CAD Models</span>
            </div>

            {/* Job Setup Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onOpenStockModal} title="Configure Stock Bounding Box & Raw Allowances">
                  <Box size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Stock<br />Setup</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFixtureModal}
                  title="Open 3D Parametric CNC Workholding & Fixture Setup Studio (5-Axis Vises, Dovetail Step Jaws, Clamps)"
                >
                  <Wrench size={22} color="#a855f7" />
                  <span className="btn-label" style={{ color: '#a855f7', fontWeight: 600 }}>Workholding<br />&amp; Fixtures</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenLatheStudio}
                  title="Open CNC Turning & Lathe / Mill-Turn Studio (OD Roughing G71, Profile Finishing G70, Threading G76, Grooving G75)"
                >
                  <Disc size={22} color="#ec4899" />
                  <span className="btn-label" style={{ color: '#ec4899', fontWeight: 600 }}>Lathe &amp;<br />Mill-Turn</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenNestingStudio}
                  title="Open CNC True-Shape Sheet Nesting Studio (2D/2.5D Router, Waterjet, Laser, Plasma Stock Packing &amp; Remnant Recovery)"
                >
                  <Scissors size={22} color="#0284c7" />
                  <span className="btn-label" style={{ color: '#0284c7', fontWeight: 600 }}>Sheet<br />Nesting</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenThreadStudio}
                  title="Open CNC Feature-Based Thread Milling &amp; Tapping Studio (Metric M, Unified UNC/UNF, NPT Pipe)"
                >
                  <Disc size={22} color="#c084fc" />
                  <span className="btn-label" style={{ color: '#c084fc', fontWeight: 600 }}>Thread Mill<br />&amp; Tapping</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenEngravingStudio}
                  title="Open CNC 2.5D &amp; 3D Engraving &amp; V-Carve Studio (Serial Numbers, Single-Line Stick Font, 3D Prism V-Carving)"
                >
                  <Type size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Engraving<br />&amp; V-Carve</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenHSMFilterStudio}
                  title="Open CNC High-Speed Machining (HSM) Tolerance Filter &amp; Arc Spline Studio"
                >
                  <Zap size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 700 }}>HSM Arc<br />Filter</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenToolManager} title="Open Mill Tool Library (Endmill, Ballnose, Drills)">
                  <Wrench size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Mill Tool<br />Manager</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenToolAssemblyModal} title="Open 3D Parametric Tool & Toolholder Assembly Studio (BT40, HSK-A63, ShrinkFit, Collets)">
                  <Wrench size={22} color="#0284c7" />
                  <span className="btn-label" style={{ color: '#0284c7', fontWeight: 600 }}>Tool<br />Assembly</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenFeedsSpeedsModal} title="Feeds, Speeds & Material Machinability Physics Calculator">
                  <Gauge size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Feeds &amp;<br />Speeds</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenProbingStudio} title="Renishaw Inspection Plus & Haas WIPS Touch Probing Studio">
                  <Crosshair size={22} color="#d946ef" />
                  <span className="btn-label" style={{ color: '#d946ef', fontWeight: 600 }}>Touch<br />Probing</span>
                </button>
              </div>
              <span className="ribbon-group-title">Job Setup</span>
            </div>

            {/* Post Group - BUBBLE 1 FROM USER'S SCREENSHOT */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenPostModal}
                  title="Generate G-Code & Launch NC2Check Simulation (Step 1)"
                >
                  <div className="post-badge">G1</div>
                  <FileCode size={26} color="#ffffff" />
                  <span className="btn-label" style={{ fontWeight: 700, color: '#ffffff' }}>Generate<br />Post</span>
                </button>

                <button
                  className="ribbon-btn-large"
                  onClick={onOpenGCodeViewer}
                  title="Inspect & Download Multi-Controller G-Code (Fanuc, Heidenhain, Haas, GRBL)"
                >
                  <Download size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Export<br />G-Code</span>
                </button>
              </div>
              <span className="ribbon-group-title" style={{ color: '#60a5fa', fontWeight: 600 }}>Post &amp; Export</span>
            </div>

            {/* Machine Kinematic Simulation - BUBBLE 3 FROM SCREENSHOT */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onOpenSimModal} title="Run Digital Twin Kinematic Simulation">
                  <Play size={22} color="#10b981" />
                  <span className="btn-label">Run<br />Machine</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenSimModal} title="Collision & Safety Check">
                  <ShieldAlert size={22} color="#f43f5e" />
                  <span className="btn-label">Verify<br />Safety</span>
                </button>
              </div>
              <span className="ribbon-group-title">Machine Simulation</span>
            </div>
          </>
        )}

        {/* ==================== 11. VIEW TAB ==================== */}
        {activeTab === 'View' && (
          <>
            {/* View Studio & Camera Projection */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenViewStudioModal}
                  title="Open Mastercam 3D View Studio (Ortho/Persp, Clipping, Shading, Lighting)"
                >
                  <Sliders size={20} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>View<br />Studio</span>
                </button>

                <button
                  className={`ribbon-btn-large ${cameraMode === 'orthographic' ? 'active' : ''}`}
                  onClick={() => onToggleCameraMode && onToggleCameraMode(cameraMode === 'orthographic' ? 'perspective' : 'orthographic')}
                  title="Toggle Perspective vs Orthographic Parallel CAD Projection"
                >
                  <Camera size={20} color={cameraMode === 'orthographic' ? '#38bdf8' : '#64748b'} />
                  <span className="btn-label">{cameraMode === 'orthographic' ? 'Ortho<br />CAD' : 'Persp<br />3D'}</span>
                </button>

                <button
                  className="ribbon-btn-large"
                  onClick={onToggleTheme}
                  title={`Toggle UI Theme (Current: ${theme === 'light' ? 'Light CAD Day' : 'Dark CAD Night'})`}
                >
                  {theme === 'light' ? <Sun size={20} color="#d97706" /> : <Moon size={20} color="#38bdf8" />}
                  <span className="btn-label">{theme === 'light' ? 'Light<br />Theme' : 'Dark<br />Theme'}</span>
                </button>
              </div>
              <span className="ribbon-group-title">Camera Mode</span>
            </div>

            {/* Standard Views */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('iso')} title="Isometric Camera (WCS G54)">
                  <Box size={20} color="#38bdf8" />
                  <span className="btn-label">Isometric</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('top')} title="Top View (G17 XY Plane)">
                  <Eye size={20} color="#f59e0b" />
                  <span className="btn-label">Top (G17)</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('front')} title="Front View (G18 XZ Plane)">
                  <Eye size={20} color="#10b981" />
                  <span className="btn-label">Front (G18)</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('right')} title="Right View (G19 YZ Plane)">
                  <Eye size={20} color="#a855f7" />
                  <span className="btn-label">Right (G19)</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('bottom')} title="Bottom View (-Z Plane)">
                  <Eye size={20} color="#94a3b8" />
                  <span className="btn-label">Bottom</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('left')} title="Left View (-X Plane)">
                  <Eye size={20} color="#94a3b8" />
                  <span className="btn-label">Left</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('fit')} title="Fit Part to Viewport">
                  <Maximize2 size={20} color="#e2e8f0" />
                  <span className="btn-label">Fit Screen</span>
                </button>
              </div>
              <span className="ribbon-group-title">Standard Views</span>
            </div>

            {/* Dynamic 3D Cross-Section Cut */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${clippingPlane?.enabled ? 'active' : ''}`}
                  onClick={() => onUpdateClippingPlane && onUpdateClippingPlane({ ...clippingPlane, enabled: !clippingPlane?.enabled })}
                  title="Toggle Real-time 3D Cross-Section Slicing Plane"
                >
                  <Scissors size={20} color={clippingPlane?.enabled ? '#f472b6' : '#ec4899'} />
                  <span className="btn-label" style={{ color: clippingPlane?.enabled ? '#f472b6' : 'inherit' }}>
                    Section Cut<br />{clippingPlane?.enabled ? 'Active' : 'Off'}
                  </span>
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {['X', 'Y', 'Z'].map(axis => (
                      <button
                        key={axis}
                        onClick={() => onUpdateClippingPlane && onUpdateClippingPlane({ ...clippingPlane, enabled: true, axis })}
                        style={{
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          borderRadius: '3px',
                          background: clippingPlane?.axis === axis && clippingPlane?.enabled ? 'rgba(236,72,153,0.3)' : '#1e293b',
                          border: clippingPlane?.axis === axis && clippingPlane?.enabled ? '1px solid #ec4899' : '1px solid #334155',
                          color: clippingPlane?.axis === axis && clippingPlane?.enabled ? '#f472b6' : '#94a3b8',
                          cursor: 'pointer'
                        }}
                        title={`Cut normal along ${axis}-axis`}
                      >
                        {axis}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => onUpdateClippingPlane && onUpdateClippingPlane({ ...clippingPlane, invert: !clippingPlane?.invert })}
                    disabled={!clippingPlane?.enabled}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      borderRadius: '3px',
                      background: '#161b29',
                      border: '1px solid #283347',
                      color: '#94a3b8',
                      cursor: clippingPlane?.enabled ? 'pointer' : 'default',
                      opacity: clippingPlane?.enabled ? 1 : 0.5
                    }}
                    title="Flip Section Normal Vector"
                  >
                    Flip Cut
                  </button>
                </div>
              </div>
              <span className="ribbon-group-title">3D Section Cut</span>
            </div>

            {/* Display & Shading Modes */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className={`ribbon-btn-large ${renderMode === 'shaded' ? 'active' : ''}`} onClick={() => onChangeRenderMode('shaded')} title="PBR Metallic Shading">
                  <Eye size={20} color="#38bdf8" />
                  <span className="btn-label">Shaded</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'edges' ? 'active' : ''}`} onClick={() => onChangeRenderMode('edges')} title="Shaded with Polygon Edges">
                  <Layers size={20} color="#f59e0b" />
                  <span className="btn-label">Edges</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'transparent' ? 'active' : ''}`} onClick={() => onChangeRenderMode('transparent')} title="Translucent Glass (Inspect Internal Cavities)">
                  <Eye size={20} color="#a855f7" />
                  <span className="btn-label">Glass</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'wireframe' ? 'active' : ''}`} onClick={() => onChangeRenderMode('wireframe')} title="Pure CAD Wireframe Only">
                  <Crosshair size={20} color="#10b981" />
                  <span className="btn-label">Wireframe</span>
                </button>
                <button className={`ribbon-btn-large ${renderMode === 'normals' ? 'active' : ''}`} onClick={() => onChangeRenderMode('normals')} title="Inspect Surface Normals & Draft Angles">
                  <Sparkles size={20} color="#ec4899" />
                  <span className="btn-label">Normals</span>
                </button>
              </div>
              <span className="ribbon-group-title">Display Modes</span>
            </div>

            {/* Lighting Studio */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${lightingMode === 'studio' ? 'active' : ''}`}
                  onClick={() => onChangeLightingMode && onChangeLightingMode('studio')}
                  title="CAD Dark Studio Lighting"
                >
                  <Sun size={20} color="#38bdf8" />
                  <span className="btn-label">Studio<br />Dark</span>
                </button>
                <button
                  className={`ribbon-btn-large ${lightingMode === 'shop' ? 'active' : ''}`}
                  onClick={() => onChangeLightingMode && onChangeLightingMode('shop')}
                  title="Bright CNC Machine Enclosure Flood Lighting"
                >
                  <Sun size={20} color="#f59e0b" />
                  <span className="btn-label">Machine<br />Shop</span>
                </button>
                <button
                  className={`ribbon-btn-large ${lightingMode === 'inspect' ? 'active' : ''}`}
                  onClick={() => onChangeLightingMode && onChangeLightingMode('inspect')}
                  title="High-Contrast Scallop & Surface Quality Raking Light"
                >
                  <Sun size={20} color="#ec4899" />
                  <span className="btn-label">Inspect<br />Rake</span>
                </button>
              </div>
              <span className="ribbon-group-title">Lighting</span>
            </div>

            {/* Layer Toggles */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className={`ribbon-btn-large ${layerVisibility.fixture ? 'active' : ''}`} onClick={() => onToggleLayer('fixture')} title="Toggle Vise & Baseplate">
                  <span className="btn-label">Toggle<br />Vise</span>
                </button>
                <button className={`ribbon-btn-large ${layerVisibility.bed ? 'active' : ''}`} onClick={() => onToggleLayer('bed')} title="Toggle Machine Bed Grid">
                  <span className="btn-label">Toggle<br />Bed</span>
                </button>
                <button className={`ribbon-btn-large ${layerVisibility.stock ? 'active' : ''}`} onClick={() => onToggleLayer('stock')} title="Toggle Stock Bounding Box">
                  <span className="btn-label">Toggle<br />Stock</span>
                </button>
                <button className={`ribbon-btn-large ${layerVisibility.toolpaths ? 'active' : ''}`} onClick={() => onToggleLayer('toolpaths')} title="Toggle Feed Cut Moves">
                  <span className="btn-label">Toggle<br />Feed Cuts</span>
                </button>
                <button className={`ribbon-btn-large ${layerVisibility.rapids ? 'active' : ''}`} onClick={() => onToggleLayer('rapids')} title="Toggle Rapid Moves">
                  <span className="btn-label">Toggle<br />Rapids</span>
                </button>
                <button className={`ribbon-btn-large ${layerVisibility.dimensions ? 'active' : ''}`} onClick={() => onToggleLayer('dimensions')} title="Toggle 3D Drafting Dimensions (Level 100)">
                  <span className="btn-label">Toggle<br />Dims</span>
                </button>
              </div>
              <span className="ribbon-group-title">Layer Toggles</span>
            </div>
          </>
        )}

        {/* ==================== 12. TOOLPATHS TAB ==================== */}
        {activeTab === 'Toolpaths' && (
          <>
            {/* Operations Wizard & Setup */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenOperationsWizard}
                  title="Open Mastercam CAM Operations Manager Wizard"
                >
                  <Layers size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Operations<br />Wizard</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenCollisionCheck}
                  title="Run Tool Collision & Gouge Detection Audit"
                >
                  <ShieldAlert size={22} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Collision<br />Check</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFeedsSpeedsModal}
                  title="Feeds, Speeds & Material Machinability Physics Calculator"
                >
                  <Gauge size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Feeds &amp;<br />Speeds</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFixtureModal}
                  title="Open 3D Parametric CNC Workholding & Fixture Setup Studio (5-Axis Vises, Dovetail Step Jaws, Clamps)"
                >
                  <Wrench size={22} color="#a855f7" />
                  <span className="btn-label" style={{ color: '#a855f7', fontWeight: 600 }}>Workholding<br />&amp; Fixtures</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenLatheStudio}
                  title="Open CNC Turning & Lathe / Mill-Turn Studio (OD Roughing G71, Profile Finishing G70, Threading G76, Grooving G75)"
                >
                  <Disc size={22} color="#ec4899" />
                  <span className="btn-label" style={{ color: '#ec4899', fontWeight: 600 }}>Lathe &amp;<br />Mill-Turn</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenNestingStudio}
                  title="Open CNC True-Shape Sheet Nesting Studio (2D/2.5D Router, Waterjet, Laser, Plasma Stock Packing &amp; Remnant Recovery)"
                >
                  <Scissors size={22} color="#0284c7" />
                  <span className="btn-label" style={{ color: '#0284c7', fontWeight: 600 }}>Sheet<br />Nesting</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenThreadStudio}
                  title="Open CNC Feature-Based Thread Milling &amp; Tapping Studio (Metric M, Unified UNC/UNF, NPT Pipe)"
                >
                  <Disc size={22} color="#c084fc" />
                  <span className="btn-label" style={{ color: '#c084fc', fontWeight: 600 }}>Thread Mill<br />&amp; Tapping</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenEngravingStudio}
                  title="Open CNC 2.5D &amp; 3D Engraving &amp; V-Carve Studio (Serial Numbers, Single-Line Stick Font, 3D Prism V-Carving)"
                >
                  <Type size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Engraving<br />&amp; V-Carve</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenHSMFilterStudio}
                  title="Open CNC High-Speed Machining (HSM) Tolerance Filter &amp; Arc Spline Studio"
                >
                  <Zap size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 700 }}>HSM Arc<br />Filter</span>
                </button>
                <button
                  className="ribbon-btn-large ribbon-btn-highlight"
                  onClick={onOpenAFRModal}
                  title="Automatic Feature Recognition (AFR) & Feature-Based Machining (FBM)"
                >
                  <Sparkles size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Auto Feature<br />Recognition</span>
                </button>
              </div>
              <span className="ribbon-group-title">CAM Manager</span>
            </div>

            {/* CAM Strategies */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('facing')} title="Add Face Milling Operation">
                  <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FM</div>
                  <span className="btn-label">Face<br />Milling</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pocket')} title="Add 2D Dynamic Pocketing">
                  <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PK</div>
                  <span className="btn-label">Dynamic<br />Pocket</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('waterline')} title="Add 3D Waterline Finishing">
                  <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>WL</div>
                  <span className="btn-label">Waterline<br />3D</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenAdaptiveModal ? onOpenAdaptiveModal : () => onQuickAddOp('adaptive')}
                  title="Open Adaptive Trochoidal High-Speed Roughing Studio (Constant Engagement & Chip Thinning)"
                >
                  <div style={{ width: '16px', height: '16px', background: '#06b6d4', borderRadius: '3px', color: 'black', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AD</div>
                  <span className="btn-label">Adaptive<br />Roughing</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenFiveAxisStudio ? onOpenFiveAxisStudio : () => onQuickAddOp('swarf')} title="Open 5-Axis Multiaxis Studio (Continuous Swarf, Flowline & TCPM Kinematics)">
                  <div style={{ width: '16px', height: '16px', background: '#8b5cf6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5X</div>
                  <span className="btn-label">5-Axis<br />Swarf</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('drilling')} title="Add Peck Drilling Cycle">
                  <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DR</div>
                  <span className="btn-label">Peck<br />Drill</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenThreadStudio}
                  title="Open Helical Thread Milling &amp; Rigid Tapping Studio (G03/G02 &amp; G84 Cycle)"
                >
                  <div style={{ width: '16px', height: '16px', background: '#c084fc', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>TM</div>
                  <span className="btn-label" style={{ color: '#c084fc', fontWeight: 600 }}>Thread<br />Mill</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('chamfer')} title="Add 45-degree Chamfer & Deburr">
                  <div style={{ width: '16px', height: '16px', background: '#ec4899', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>CH</div>
                  <span className="btn-label">Chamfer<br />Deburr</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenEngravingStudio}
                  title="Open CNC 2.5D &amp; 3D Engraving &amp; V-Carve Studio (Serial Numbers, Single-Line Stick Font, 3D Prism V-Carving)"
                >
                  <div style={{ width: '16px', height: '16px', background: '#06b6d4', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>VC</div>
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Engrave<br />V-Carve</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('rest_milling')} title="Add Rest Machining & Corner Cleanout">
                  <div style={{ width: '16px', height: '16px', background: '#14b8a6', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>RM</div>
                  <span className="btn-label">Rest<br />Milling</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pencil')} title="Add 3D Pencil Fillet Valley Tracing">
                  <div style={{ width: '16px', height: '16px', background: '#f97316', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PC</div>
                  <span className="btn-label">3D<br />Pencil</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('probe')} title="Add In-Process Touch Probing Cycle (Renishaw / Haas WIPS)">
                  <div style={{ width: '16px', height: '16px', background: '#d946ef', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PR</div>
                  <span className="btn-label">Touch<br />Probe</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenLatheStudio}
                  title="Open CNC Turning & Lathe / Mill-Turn Studio (OD Roughing G71, Profile Finishing G70, Threading G76, Grooving G75)"
                >
                  <div style={{ width: '16px', height: '16px', background: '#ec4899', borderRadius: '3px', color: 'white', fontWeight: 800, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>LT</div>
                  <span className="btn-label" style={{ color: '#ec4899', fontWeight: 600 }}>Lathe /<br />Turning</span>
                </button>
              </div>
              <span className="ribbon-group-title">CAM Strategies</span>
            </div>

            {/* Probing & CMM Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenProbingStudio}
                  title="Open Renishaw Inspection Plus & Haas WIPS Touch Probing Studio"
                >
                  <Crosshair size={22} color="#d946ef" />
                  <span className="btn-label" style={{ color: '#d946ef', fontWeight: 600 }}>Probing<br />Studio</span>
                </button>
              </div>
              <span className="ribbon-group-title">Probing &amp; CMM</span>
            </div>

            {/* Lead In / Lead Out & Compensation Designer Studio */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenLeadInOutModal}
                  title="Open Toolpath Lead-In / Lead-Out Ramp & Tangent Arc Designer Studio (Mastercam Grade)"
                >
                  <Compass size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Lead In/Out<br />Studio</span>
                </button>
              </div>
              <span className="ribbon-group-title">Lead In/Out &amp; Comp</span>
            </div>

            {/* Regeneration & Editing */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onRegenerateAll} title="Regenerate All Operations">
                  <RefreshCw size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Regenerate<br />All</span>
                </button>
                <button className="ribbon-btn-large" onClick={onDeleteActiveOp} title="Delete Selected Operation">
                  <Trash2 size={20} color="#ef4444" />
                  <span className="btn-label">Delete<br />Active Op</span>
                </button>
              </div>
              <span className="ribbon-group-title">Operation Controls</span>
            </div>

            {/* Verify & Post */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onStartBackplot} title="Toolpath Wireframe Backplot (In-Viewport 3D Tool Tracing)">
                  <Play size={20} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Backplot</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenSolidVerifyModal ? onOpenSolidVerifyModal : onStartVerify} title="Open Solid Stock Material Removal Verification & Real-Time Voxel Simulator">
                  <Box size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Verify<br />Solid</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onStartVerify ? onStartVerify(null, 'heatmap') : null} title="Inspect In-Process Tolerance Deviation Heatmap (Gouges vs Excess Stock)">
                  <Gauge size={20} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Tolerance<br />Heatmap</span>
                </button>
                <button
                  className="ribbon-btn-large"
                  onClick={onOpenFeedOptimizerModal}
                  title="Open Feed Rate Optimization & Constant Chip Thickness Studio (Corner Deceleration & RCTF High-Feed)"
                >
                  <Activity size={20} color="#f59e0b" />
                  <span className="btn-label" style={{ color: '#f59e0b', fontWeight: 600 }}>Feed Rate<br />Optimizer</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenSimModal} title="Full 5-Axis Machine Kinematic Digital Twin Simulation">
                  <Eye size={20} color="#38bdf8" />
                  <span className="btn-label">Kinematic<br />Twin</span>
                </button>
                <button className="ribbon-btn-large ribbon-btn-highlight" onClick={onOpenPostModal} title="Generate G-Code &amp; NC2Check">
                  <div className="post-badge">G1</div>
                  <FileCode size={24} color="#ffffff" />
                  <span className="btn-label" style={{ fontWeight: 700, color: '#ffffff' }}>G1 Post</span>
                </button>
              </div>
              <span className="ribbon-group-title">Verify &amp; Post</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

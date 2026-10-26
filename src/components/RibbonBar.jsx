import React, { useRef } from 'react';
import {
  Layers, Settings, Play, ShieldAlert, FileText, CheckCircle2,
  Box, Scissors, Compass, Sliders, Eye, RefreshCw, Zap,
  Wrench, FileCode, CheckSquare, Upload, FolderOpen, Download,
  Printer, Palette, Move, RotateCcw, Maximize2, Minimize2,
  Trash2, Plus, Sparkles, Orbit, Grid, Crosshair, HelpCircle,
  Save, Clock
} from 'lucide-react';
import { parseSTLFile, parseOBJFile } from '../utils/cadGeometry';
import { parseProjectMCAM } from '../utils/projectStorage';

export default function RibbonBar({
  activeTab,
  onSelectTab,
  onOpenPostModal,
  onOpenSimModal,
  onOpenStockModal,
  onOpenToolManager,
  onOpenGCodeViewer,
  onOpenEntityAnalyzer,
  onOpenDistanceCaliper,
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
        if (ext === 'obj') {
          modelGroup = await parseOBJFile(file);
        } else {
          modelGroup = await parseSTLFile(file);
        }
        if (onModelImported) {
          onModelImported(modelGroup, file.name);
        }
      } catch (err) {
        console.error("Failed to parse CAD file:", err);
        alert(`Failed to load ${file.name}. Ensure it is a valid .STL or .OBJ file.`);
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

  return (
    <nav className="ribbon-container" aria-label="Application Ribbon Navigation">
      {/* Hidden file input for 3D CAD meshes (.stl, .obj) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.obj"
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
                  title="Import 3D CAD Part (STL / OBJ)"
                >
                  <Upload size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Import<br />STL / OBJ</span>
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
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onAddWireframe('line')} title="Create 3D Line Between Endpoints">
                  <div style={{ width: '24px', height: '2px', background: '#f43f5e', transform: 'rotate(-30deg)', margin: '10px 0' }} />
                  <span className="btn-label">Line<br />2 Points</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onAddWireframe('circle')} title="Create 3D Wireframe Circle / Arc">
                  <div style={{ width: '20px', height: '20px', border: '2px solid #38bdf8', borderRadius: '50%' }} />
                  <span className="btn-label">Circle<br />Radius</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onAddWireframe('rect')} title="Create 3D Rectangular Pocket Boundary">
                  <div style={{ width: '22px', height: '16px', border: '2px solid #4ade80', borderRadius: '2px' }} />
                  <span className="btn-label">Rectangle<br />Boundary</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onAddWireframe('bounding')} title="Generate 3D Wireframe Cage Enclosing Part">
                  <Box size={22} color="#facc15" />
                  <span className="btn-label" style={{ color: '#facc15', fontWeight: 600 }}>Bounding<br />Cage</span>
                </button>
              </div>
              <span className="ribbon-group-title">Curves &amp; 2D Boundaries</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onAddWireframe('drillpoints')} title="Generate 4-Corner WCS Drill Reference Points">
                  <Crosshair size={22} color="#ef4444" />
                  <span className="btn-label">Drill<br />Points</span>
                </button>
                <button className="ribbon-btn-large" onClick={onClearWireframes} title="Clear Added Wireframe Geometry">
                  <Trash2 size={20} color="#94a3b8" />
                  <span className="btn-label">Clear<br />Wireframes</span>
                </button>
              </div>
              <span className="ribbon-group-title">Datum &amp; Cleanup</span>
            </div>
          </>
        )}

        {/* ==================== 4. SURFACES TAB ==================== */}
        {activeTab === 'Surfaces' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onAddSurface('plane')} title="Create 3D Planar Surface Sheet">
                  <Layers size={22} color="#06b6d4" />
                  <span className="btn-label" style={{ color: '#06b6d4', fontWeight: 600 }}>Planar<br />Surface</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onAddSurface('cylinder')} title="Create 3D Cylindrical Surface Wrapper">
                  <Orbit size={22} color="#10b981" />
                  <span className="btn-label">Cylinder<br />Surface</span>
                </button>
                <button className="ribbon-btn-large" onClick={onClearSurfaces} title="Clear Added Surface Entities">
                  <Trash2 size={20} color="#94a3b8" />
                  <span className="btn-label">Clear<br />Surfaces</span>
                </button>
              </div>
              <span className="ribbon-group-title">3D Surface Creation</span>
            </div>
          </>
        )}

        {/* ==================== 5. SOLIDS TAB ==================== */}
        {activeTab === 'Solids' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onAddSolid('box')} title="Generate Parametric 3D Rectangular Billet Block">
                  <Box size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Block<br />Billet</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onAddSolid('cylinder')} title="Generate Parametric 3D Cylindrical Blank">
                  <Orbit size={22} color="#60a5fa" />
                  <span className="btn-label">Cylinder<br />Blank</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onAddSolid('sphere')} title="Generate Parametric 3D Spherical Solid">
                  <Compass size={22} color="#a855f7" />
                  <span className="btn-label">Sphere<br />Solid</span>
                </button>
              </div>
              <span className="ribbon-group-title">Parametric Solid Primitives</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onAddSolid('box')} title="Create Solid Bounding Stock Block">
                  <Box size={20} color="#f59e0b" />
                  <span className="btn-label">Extrude<br />Solid</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenStockModal} title="Configure Stock Bounding Box">
                  <Settings size={20} color="#10b981" />
                  <span className="btn-label">Solid<br />Stock</span>
                </button>
              </div>
              <span className="ribbon-group-title">Solid Operations</span>
            </div>
          </>
        )}

        {/* ==================== 6. MODEL PREP TAB ==================== */}
        {activeTab === 'Model Prep' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onResetTransform} title="Snap Model Origin Directly to G54 (Center of Table)">
                  <Crosshair size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Snap Origin<br />to G54</span>
                </button>
                <button className="ribbon-btn-large" onClick={onDropToTable} title="Align Bottom Face of Part to Fixture Baseplate">
                  <Grid size={22} color="#10b981" />
                  <span className="btn-label">Align to<br />Table</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onPushPull(2)} title="Offset Top Face (+2.0 mm)">
                  <Maximize2 size={20} color="#f59e0b" />
                  <span className="btn-label">Push Face<br />(+2mm)</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onPushPull(-2)} title="Offset Top Face (-2.0 mm)">
                  <Minimize2 size={20} color="#ef4444" />
                  <span className="btn-label">Pull Face<br />(-2mm)</span>
                </button>
              </div>
              <span className="ribbon-group-title">Direct Modeling &amp; Alignment</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onOpenEntityAnalyzer} title="Check Watertight Solid &amp; Manifold Integrity">
                  <CheckCircle2 size={22} color="#10b981" />
                  <span className="btn-label">Check<br />Manifold</span>
                </button>
              </div>
              <span className="ribbon-group-title">Model Diagnostics</span>
            </div>
          </>
        )}

        {/* ==================== 7. MESH TAB ==================== */}
        {activeTab === 'Mesh' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onSelectSampleModel('impeller')} title="High-Density Mesh Tessellation">
                  <Layers size={22} color="#38bdf8" />
                  <span className="btn-label">Tessellate<br />Mesh</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenEntityAnalyzer} title="Inspect Triangle Count &amp; Edge Normals">
                  <Crosshair size={20} color="#a855f7" />
                  <span className="btn-label">Mesh<br />Diagnostics</span>
                </button>
                <button className="ribbon-btn-large" onClick={onExportSTL} title="Export Active Mesh as Binary STL">
                  <Download size={22} color="#10b981" />
                  <span className="btn-label">Export<br />STL Mesh</span>
                </button>
              </div>
              <span className="ribbon-group-title">Mesh Utilities</span>
            </div>
          </>
        )}

        {/* ==================== 8. DRAFTING TAB ==================== */}
        {activeTab === 'Drafting' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button
                  className={`ribbon-btn-large ${layerVisibility.dimensions ? 'active' : ''}`}
                  onClick={() => onToggleLayer('dimensions')}
                  title="Toggle 3D Dimensional Arrows (X Length, Y Height, Z Depth)"
                >
                  <Scissors size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {layerVisibility.dimensions ? 'Hide' : 'Show'}<br />Dimensions
                  </span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onToggleLayer('wcs')} title="Toggle G54 WCS Coordinate Triad">
                  <Crosshair size={20} color="#f59e0b" />
                  <span className="btn-label">G54 Datum<br />Note</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenEntityAnalyzer} title="Smart Caliper Dimension Inspector">
                  <FileText size={20} color="#10b981" />
                  <span className="btn-label">Smart<br />Inspector</span>
                </button>
              </div>
              <span className="ribbon-group-title">3D Dimensions &amp; Notes</span>
            </div>
          </>
        )}

        {/* ==================== 9. TRANSFORM TAB ==================== */}
        {activeTab === 'Transform' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onTranslatePart(10, 0, 0)} title="Translate +10 mm on X">
                  <Move size={18} color="#38bdf8" />
                  <span className="btn-label">X +10mm</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onTranslatePart(-10, 0, 0)} title="Translate -10 mm on X">
                  <Move size={18} color="#38bdf8" />
                  <span className="btn-label">X -10mm</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onTranslatePart(0, 10, 0)} title="Translate +10 mm on Y (Height)">
                  <Move size={18} color="#10b981" />
                  <span className="btn-label">Y +10mm</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onTranslatePart(0, -10, 0)} title="Translate -10 mm on Y (Height)">
                  <Move size={18} color="#10b981" />
                  <span className="btn-label">Y -10mm</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onTranslatePart(0, 0, 10)} title="Translate +10 mm on Z">
                  <Move size={18} color="#f59e0b" />
                  <span className="btn-label">Z +10mm</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onTranslatePart(0, 0, -10)} title="Translate -10 mm on Z">
                  <Move size={18} color="#f59e0b" />
                  <span className="btn-label">Z -10mm</span>
                </button>
              </div>
              <span className="ribbon-group-title">Translation (Move)</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onRotatePart(0, 0, Math.PI / 2)} title="Rotate 90 deg around Spindle (Z)">
                  <RotateCcw size={20} color="#a855f7" />
                  <span className="btn-label">Rotate 90°<br />Z-Axis</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onRotatePart(Math.PI / 2, 0, 0)} title="Tilt 90 deg around Table (X)">
                  <RotateCcw size={20} color="#a855f7" />
                  <span className="btn-label">Tilt 90°<br />X-Axis</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onScalePart(1.25)} title="Scale Up 1.25x">
                  <Maximize2 size={20} color="#38bdf8" />
                  <span className="btn-label">Scale<br />1.25&times;</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onScalePart(0.8)} title="Scale Down 0.8x">
                  <Minimize2 size={20} color="#f59e0b" />
                  <span className="btn-label">Scale<br />0.8&times;</span>
                </button>
                <button className="ribbon-btn-large" onClick={onResetTransform} title="Reset All Transforms to Origin">
                  <RefreshCw size={20} color="#ef4444" />
                  <span className="btn-label">Reset<br />Transforms</span>
                </button>
              </div>
              <span className="ribbon-group-title">Rotate &amp; Scale</span>
            </div>
          </>
        )}

        {/* ==================== 10. MACHINE TAB (Default & Main Screenshot Tab) ==================== */}
        {activeTab === 'Machine' && (
          <>
            {/* Machine Definition Selector */}
            <div className="ribbon-group">
              <div className="ribbon-group-items" style={{ flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
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
              <span className="ribbon-group-title">Machine &amp; WCS</span>
            </div>

            {/* CAD Model & Samples Group */}
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => fileInputRef.current?.click()} title="Import 3D CAD Part (STL / OBJ)">
                  <Upload size={22} color="#38bdf8" />
                  <span className="btn-label" style={{ color: '#38bdf8', fontWeight: 600 }}>Import<br />STL / OBJ</span>
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
                <button className="ribbon-btn-large" onClick={onOpenToolManager} title="Open Mill Tool Library (Endmill, Ballnose, Drills)">
                  <Wrench size={22} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Mill Tool<br />Manager</span>
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
                <button className="ribbon-btn-large" onClick={() => onSnapCamera('fit')} title="Fit Part to Viewport">
                  <Maximize2 size={20} color="#e2e8f0" />
                  <span className="btn-label">Fit Screen</span>
                </button>
              </div>
              <span className="ribbon-group-title">Standard Views</span>
            </div>

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
              </div>
              <span className="ribbon-group-title">Display Modes</span>
            </div>

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
              </div>
              <span className="ribbon-group-title">Layer Toggles</span>
            </div>
          </>
        )}

        {/* ==================== 12. TOOLPATHS TAB ==================== */}
        {activeTab === 'Toolpaths' && (
          <>
            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('facing')} title="Add Face Milling Operation">
                  <div style={{ width: '14px', height: '14px', background: '#3b82f6', borderRadius: '2px', color: 'white', fontWeight: 800, fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>FM</div>
                  <span className="btn-label">Face<br />Milling</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('pocket')} title="Add 2D Dynamic Pocketing">
                  <div style={{ width: '14px', height: '14px', background: '#10b981', borderRadius: '2px', color: 'white', fontWeight: 800, fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>PK</div>
                  <span className="btn-label">Dynamic<br />Pocket</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('waterline')} title="Add 3D Waterline Finishing">
                  <div style={{ width: '14px', height: '14px', background: '#f59e0b', borderRadius: '2px', color: 'black', fontWeight: 800, fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>WL</div>
                  <span className="btn-label">Waterline<br />3D</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('swarf')} title="Add 5-Axis Swarf Machining">
                  <div style={{ width: '14px', height: '14px', background: '#8b5cf6', borderRadius: '2px', color: 'white', fontWeight: 800, fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5X</div>
                  <span className="btn-label">5-Axis<br />Swarf</span>
                </button>
                <button className="ribbon-btn-large" onClick={() => onQuickAddOp('drilling')} title="Add Peck Drilling Cycle">
                  <div style={{ width: '14px', height: '14px', background: '#ef4444', borderRadius: '2px', color: 'white', fontWeight: 800, fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DR</div>
                  <span className="btn-label">Peck<br />Drill</span>
                </button>
              </div>
              <span className="ribbon-group-title">CAM Strategies</span>
            </div>

            <div className="ribbon-group">
              <div className="ribbon-group-items">
                <button className="ribbon-btn-large" onClick={onRegenerateAll} title="Regenerate All Operations">
                  <RefreshCw size={20} color="#10b981" />
                  <span className="btn-label" style={{ color: '#10b981', fontWeight: 600 }}>Regenerate<br />All</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenSimModal} title="Toolpath Wireframe Backplot">
                  <Play size={20} color="#06b6d4" />
                  <span className="btn-label">Backplot</span>
                </button>
                <button className="ribbon-btn-large" onClick={onOpenSimModal} title="Full Machine Kinematic Simulation">
                  <Eye size={20} color="#38bdf8" />
                  <span className="btn-label">Simulate</span>
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

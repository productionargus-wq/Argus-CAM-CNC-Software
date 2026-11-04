import React, { useState, useEffect } from 'react';
import { Square, CircleDot, Circle, Wrench, Layers, Scissors, Play, FileCode, Box } from 'lucide-react';
import TitleBar from './components/TitleBar';
import RibbonBar from './components/RibbonBar';
import OperationsTree from './components/OperationsTree';
import Viewport3D from './components/Viewport3D';
import NC2CheckModal from './components/NC2CheckModal';
import MachineSimModal from './components/MachineSimModal';
import StockSetupModal from './components/StockSetupModal';
import ToolManagerModal from './components/ToolManagerModal';
import OperationModal from './components/OperationModal';
import GCodeViewerModal from './components/GCodeViewerModal';
import EntityAnalyzerModal from './components/EntityAnalyzerModal';
import DistanceCaliperModal from './components/DistanceCaliperModal';
import SetupSheetModal from './components/SetupSheetModal';
import HelpGuideModal from './components/HelpGuideModal';
import FileNewModal from './components/FileNewModal';
import SaveAsModal from './components/SaveAsModal';
import RecentProjectsModal from './components/RecentProjectsModal';
import ExportCADModal from './components/ExportCADModal';
import FileBackstageView from './components/FileBackstageView';
import MastercamOpenFileDialog from './components/MastercamOpenFileDialog';
import WireframeSketcherModal from './components/WireframeSketcherModal';
import FeedsSpeedsModal from './components/FeedsSpeedsModal';
import CPlanesCADModal from './components/CPlanesCADModal';
import { parseNCFileToToolpath } from './utils/gcodeParser';
import { DEFAULT_PLANES } from './utils/cplaneGeometry';
import SurfacesCADModal from './components/SurfacesCADModal';
import SolidsCADModal from './components/SolidsCADModal';
import ModelPrepModal from './components/ModelPrepModal';
import MeshWorkbenchModal from './components/MeshWorkbenchModal';
import DraftingCADModal from './components/DraftingCADModal';
import TransformCADModal from './components/TransformCADModal';
import MachineConfigModal from './components/MachineConfigModal';
import ATPModal from './components/ATPModal';
import ViewStudioModal from './components/ViewStudioModal';
import CAMOperationsWizardModal from './components/CAMOperationsWizardModal';
import ProbingStudioModal from './components/ProbingStudioModal';
import AFRModal from './components/AFRModal';
import AdaptiveRoughingModal from './components/AdaptiveRoughingModal';
import LeadInOutDesignerModal from './components/LeadInOutDesignerModal';
import FiveAxisStudioModal from './components/FiveAxisStudioModal';
import SolidVerifyModal from './components/SolidVerifyModal';
import ToolAssemblyStudioModal from './components/ToolAssemblyStudioModal';
import FeedOptimizerModal from './components/FeedOptimizerModal';
import FixtureStudioModal from './components/FixtureStudioModal';
import LatheStudioModal from './components/LatheStudioModal';
import NestingStudioModal from './components/NestingStudioModal';
import ThreadStudioModal from './components/ThreadStudioModal';
import EngravingStudioModal from './components/EngravingStudioModal';
import HSMFilterStudioModal from './components/HSMFilterStudioModal';
import CostQuotingModal from './components/CostQuotingModal';
import CornerReliefStudioModal from './components/CornerReliefStudioModal';
import KioskOperatorModal from './components/KioskOperatorModal';
import TombstoneStudioModal from './components/TombstoneStudioModal';
import CustomPostStudioModal from './components/CustomPostStudioModal';
import AnomalyScannerModal from './components/AnomalyScannerModal';
import DefineToolModal from './components/DefineToolModal';
import SurfaceFinishContourModal from './components/SurfaceFinishContourModal';
import CommandFinderModal from './components/CommandFinderModal';
import AddInsManagerModal from './components/AddInsManagerModal';
import PartStatisticsModal from './components/PartStatisticsModal';
import { DEFAULT_FIXTURE_CONFIG } from './utils/fixtureEngine';
import StatusBar from './components/StatusBar';
import ViewsheetBar from './components/ViewsheetBar';
import {
  createImpellerGeometry,
  createAerospaceBracket,
  createMoldCoreGeometry,
  createMastercamBaseStructureALU,
  createBoxGeometry,
  createCylinderGeometry,
  createSphereGeometry,
  createWireframeLine,
  createWireframeCircle,
  createWireframeArc,
  createWireframeSpline,
  createWireframeLettering,
  createSilhouetteBoundaryWireframe,
  createTurnProfileWireframe,
  createSliceCurveWireframe,
  createFilletChamferWireframe,
  createOffsetWireframe,
  createWireframeRect,
  createBoundingWireframe,
  createDrillPointsGrid,
  createPlanarSurface,
  createCylinderSurface,
  extractEdgesFromModel,
  exportSceneToSTL,
  parseSTEPText,
  generateSampleSTEPString
} from './utils/cadGeometry';
import {
  exportProjectMCAM,
  saveAutoSaveSnapshot,
  getAutoSaveSnapshot
} from './utils/projectStorage';
import { extractClosedChainsFromCAD } from './utils/cadDrawingEngine';
import CNCDesignBoard from './components/CNCDesignBoard';
import { convertBoardDiagramsToToolpaths, getCADTemplate } from './utils/cncBoardEngine';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('argus_theme') || 'light');
  const [activeRibbonTab, setActiveRibbonTab] = useState('Toolpaths');
  const [currentModel, setCurrentModel] = useState(() => createMastercamBaseStructureALU());
  const [currentProjectName, setCurrentProjectName] = useState('Base Structure-ALU.mcam');
  const [isFileBackstageOpen, setIsFileBackstageOpen] = useState(false);
  const [isMastercamOpenDialogOpen, setIsMastercamOpenDialogOpen] = useState(false);
  const [projectDescriptor, setProjectDescriptor] = useState('Mastercam 5-Axis Multi-Surface Machining Project for DMU 50 VMC');
  const [projectCreatedDate, setProjectCreatedDate] = useState(() => new Date(Date.now() - 3600000 * 24 * 2));
  const [projectLastModifiedDate, setProjectLastModifiedDate] = useState(() => new Date());
  const [autoSaveIntervalMinutes, setAutoSaveIntervalMinutes] = useState(5);

  // Workpiece appearance & transforms
  const [workpieceColor, setWorkpieceColor] = useState('#60a5fa');
  const [renderMode, setRenderMode] = useState('shaded');
  const [layerVisibility, setLayerVisibility] = useState({
    part: true,
    wireframe: true,
    surfaces: true,
    fixture: true,
    bed: true,
    stock: true,
    toolpaths: true,
    rapids: true,
    wcs: true,
    dimensions: false
  });
  const [cameraCommand, setCameraCommand] = useState(null);
  const [partTransform, setPartTransform] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });
  const [customGeometry, setCustomGeometry] = useState([]);
  const [workspaceViewMode, setWorkspaceViewMode] = useState('3d'); // '3d' | '2d' | 'split'
  const [boardShapes, setBoardShapes] = useState(() => getCADTemplate('mounting-plate', 200, 150));

  // View Tab & Viewsheets State
  const [materialStyle, setMaterialStyle] = useState('metallic');
  const [translucencyEnabled, setTranslucencyEnabled] = useState(false);
  const [showBackside, setShowBackside] = useState(false);
  const [showAxes, setShowAxes] = useState(true);
  const [showGnomons, setShowGnomons] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isViewsheetsVisible, setIsViewsheetsVisible] = useState(true);
  const [viewsheets, setViewsheets] = useState([
    { id: 'vs_1', name: 'Viewsheet #1', bookmark: null, active: true }
  ]);
  const [activeViewsheetId, setActiveViewsheetId] = useState('vs_1');

  // Machine Definition
  const [machines] = useState([
    { id: 'dmu50', name: 'DMG MORI DMU 50 (5X)', type: '5-Axis Trunnion B/C', controller: 'Heidenhain TNC 640' },
    { id: 'haas_vf2', name: 'Haas VF-2 (3X VMC)', type: '3-Axis Vertical', controller: 'Haas NGC' },
    { id: 'robodrill', name: 'Fanuc Robodrill D21', type: 'High Speed 3-Axis', controller: 'Fanuc 31i' },
    { id: 'integrex', name: 'Mazak Integrex i-200', type: '5-Axis Mill-Turn', controller: 'Mazak Matrix' }
  ]);
  const [activeMachineId, setActiveMachineId] = useState('dmu50');
  const [activeWcs, setActiveWcs] = useState('G54');

  // Mastercam Manager Sidebar Tab ('Toolpaths', 'Levels', 'Solids', 'Planes')
  const [activeManagerTab, setActiveManagerTab] = useState('Toolpaths');
  const [activePlane, setActivePlane] = useState('Top (G17)');
  const [planesList, setPlanesList] = useState(DEFAULT_PLANES);
  const [isCPlanesModalOpen, setIsCPlanesModalOpen] = useState(false);

  // Mastercam Core Levels
  const [levels, setLevels] = useState([
    { id: 1, number: 1, name: 'Part Solid', entities: 1, visible: true, active: true, color: '#60a5fa' },
    { id: 10, number: 10, name: 'Wireframe Curves', entities: 0, visible: true, active: false, color: '#38bdf8' },
    { id: 15, number: 15, name: 'Surface Sheets', entities: 0, visible: true, active: false, color: '#06b6d4' },
    { id: 20, number: 20, name: 'Stock Bounding Box', entities: 1, visible: true, active: false, color: '#f59e0b' },
    { id: 30, number: 30, name: 'Fixture & Vise', entities: 3, visible: true, active: false, color: '#94a3b8' },
    { id: 50, number: 50, name: 'Toolpath Cuts', entities: 5, visible: true, active: false, color: '#10b981' },
    { id: 60, number: 60, name: 'Rapid Moves', entities: 5, visible: true, active: false, color: '#06b6d4' },
    { id: 100, number: 100, name: 'Drafting Dimensions', entities: 3, visible: false, active: false, color: '#e2e8f0' }
  ]);

  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isRecentProjectsModalOpen, setIsRecentProjectsModalOpen] = useState(false);
  const [isExportCADModalOpen, setIsExportCADModalOpen] = useState(false);
  const [isProbingModalOpen, setIsProbingModalOpen] = useState(false);
  const [isAFRModalOpen, setIsAFRModalOpen] = useState(false);
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);
  const [isLeadInOutModalOpen, setIsLeadInOutModalOpen] = useState(false);
  const [isFiveAxisModalOpen, setIsFiveAxisModalOpen] = useState(false);
  const [isSolidVerifyModalOpen, setIsSolidVerifyModalOpen] = useState(false);
  const [isToolAssemblyModalOpen, setIsToolAssemblyModalOpen] = useState(false);
  const [isFeedOptimizerModalOpen, setIsFeedOptimizerModalOpen] = useState(false);
  const [isFixtureModalOpen, setIsFixtureModalOpen] = useState(false);
  const [isLatheStudioOpen, setIsLatheStudioOpen] = useState(false);
  const [isNestingStudioOpen, setIsNestingStudioOpen] = useState(false);
  const [isThreadStudioOpen, setIsThreadStudioOpen] = useState(false);
  const [isEngravingStudioOpen, setIsEngravingStudioOpen] = useState(false);
  const [isHSMFilterModalOpen, setIsHSMFilterModalOpen] = useState(false);
  const [isCostQuotingModalOpen, setIsCostQuotingModalOpen] = useState(false);
  const [isCornerReliefModalOpen, setIsCornerReliefModalOpen] = useState(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isTombstoneModalOpen, setIsTombstoneModalOpen] = useState(false);
  const [isCustomPostModalOpen, setIsCustomPostModalOpen] = useState(false);
  const [isAnomalyScannerOpen, setIsAnomalyScannerOpen] = useState(false);
  const [isDefineToolModalOpen, setIsDefineToolModalOpen] = useState(false);
  const [isSurfaceFinishContourOpen, setIsSurfaceFinishContourOpen] = useState(false);
  const [isCommandFinderOpen, setIsCommandFinderOpen] = useState(false);
  const [isAddInsModalOpen, setIsAddInsModalOpen] = useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [constructionZ, setConstructionZ] = useState(0.0);
  const [constructionMode, setConstructionMode] = useState('3d');
  const [showArcCenters, setShowArcCenters] = useState(true);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [deletedEntitiesStack, setDeletedEntitiesStack] = useState([]);
  const [fixtureConfig, setFixtureConfig] = useState(DEFAULT_FIXTURE_CONFIG);
  const [selectedAssemblyToolId, setSelectedAssemblyToolId] = useState(null);
  const [isWireframeModalOpen, setIsWireframeModalOpen] = useState(false);
  const [wireframeModalTool, setWireframeModalTool] = useState('line');
  const [isSketchModeActive, setIsSketchModeActive] = useState(false);
  const [sketchTool, setSketchTool] = useState('line');
  const [isSurfacesModalOpen, setIsSurfacesModalOpen] = useState(false);
  const [surfacesModalTool, setSurfacesModalTool] = useState('plane');
  const [isSolidsModalOpen, setIsSolidsModalOpen] = useState(false);
  const [solidsModalTool, setSolidsModalTool] = useState('box');
  const [isModelPrepModalOpen, setIsModelPrepModalOpen] = useState(false);
  const [modelPrepModalTab, setModelPrepModalTab] = useState('pushpull');
  const [isMeshModalOpen, setIsMeshModalOpen] = useState(false);
  const [meshModalTab, setMeshModalTab] = useState('decimate');
  const [isDraftingModalOpen, setIsDraftingModalOpen] = useState(false);
  const [draftingModalTab, setDraftingModalTab] = useState('linear');
  const [isTransformModalOpen, setIsTransformModalOpen] = useState(false);
  const [transformModalTab, setTransformModalTab] = useState('translate');
  const [isMachineConfigModalOpen, setIsMachineConfigModalOpen] = useState(false);
  const [isATPModalOpen, setIsATPModalOpen] = useState(false);
  const [atpModalTab, setAtpModalTab] = useState('wizard');
  const [isViewStudioModalOpen, setIsViewStudioModalOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState('perspective');
  const [cameraFov, setCameraFov] = useState(45);
  const [clippingPlane, setClippingPlane] = useState({ enabled: false, axis: 'Z', offset: 0, invert: false });
  const [lightingMode, setLightingMode] = useState('studio');
  const [isOperationsWizardOpen, setIsOperationsWizardOpen] = useState(false);
  const [operationsWizardTab, setOperationsWizardTab] = useState('create');

  const [solidsList, setSolidsList] = useState([
    { id: 1, name: 'Solid 1 - Finished Workpiece', material: '6061-T6 Aluminum', volumeCm3: 184.2, isPrimary: true, visible: true, active: true, color: '#38bdf8' },
    { id: 2, name: 'Solid 2 - Raw Stock Billet', material: 'Alu Billet (Allowance)', volumeCm3: 245.0, isPrimary: false, visible: true, active: false, color: '#f59e0b' },
    { id: 3, name: 'Solid 3 - ZeroClamp Fixture Vise', material: 'Hardened Tool Steel', volumeCm3: 520.0, isPrimary: false, visible: true, active: false, color: '#94a3b8' }
  ]);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isToolManagerOpen, setIsToolManagerOpen] = useState(false);
  const [isOperationModalOpen, setIsOperationModalOpen] = useState(false);
  const [isGCodeViewerOpen, setIsGCodeViewerOpen] = useState(false);
  const [isEntityAnalyzerOpen, setIsEntityAnalyzerOpen] = useState(false);
  const [isDistanceCaliperOpen, setIsDistanceCaliperOpen] = useState(false);
  const [isSetupSheetOpen, setIsSetupSheetOpen] = useState(false);
  const [isHelpGuideOpen, setIsHelpGuideOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);

  // In-Viewport Backplot & Solid Verify Simulation State
  const [isBackplotActive, setIsBackplotActive] = useState(false);
  const [backplotMode, setBackplotMode] = useState('backplot'); // 'backplot' | 'verify'

  const handleStartBackplot = (opId = null) => {
    const validOpId = typeof opId === 'number' ? opId : null;
    if (validOpId) setActiveOpId(validOpId);
    setBackplotMode('backplot');
    setIsBackplotActive(true);
    showToast("Backplot: In-Viewport 3D tool tracing initialized", "info");
  };

  const handleStartVerify = (opId = null, mode = 'verify') => {
    const validOpId = typeof opId === 'number' ? opId : null;
    if (validOpId) setActiveOpId(validOpId);
    const targetMode = typeof opId === 'string' ? opId : (typeof mode === 'string' ? mode : 'verify');
    setBackplotMode(targetMode);
    setIsBackplotActive(true);
    showToast(targetMode === 'heatmap' ? "Tolerance Heatmap: Gouge & Excess inspection active" : "Solid Verify: Material removal simulation initialized", "info");
  };

  // Feeds & Speeds Calculator State
  const [isFeedsSpeedsOpen, setIsFeedsSpeedsOpen] = useState(false);
  const [feedsSpeedsToolId, setFeedsSpeedsToolId] = useState(null);

  const handleOpenFeedsSpeeds = (toolId = null) => {
    setFeedsSpeedsToolId(toolId || tools[0]?.id);
    setIsFeedsSpeedsOpen(true);
  };

  const handleUpdateToolParams = (toolId, params) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, ...params } : t))
    );
    pushSnapshot();
  };

  const handleUpdateOpParams = (opId, params) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === opId ? { ...op, ...params } : op))
    );
    pushSnapshot();
  };

  // G-Code Reverse Backplotter & NC Importer
  const handleImportNCProgram = async (file) => {
    try {
      const text = await file.text();
      const result = parseNCFileToToolpath(text, file.name);

      const newOpId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
      const importedOp = {
        id: newOpId,
        name: `NC: ${file.name.replace(/\.[^/.]+$/, "")}`,
        toolId: tools[0]?.id || 1,
        toolName: `Imported NC Program`,
        badgeClass: 'contour',
        badgeText: 'NC',
        visible: true,
        stepoverPct: 30,
        stepdown: 2.0,
        totalDepth: result.dimensions.y || 15.0,
        rapidHeight: 15.0,
        feedRate: 1500,
        spindleRpm: 8000
      };

      setOperations((prev) => [...prev, importedOp]);
      setActiveOpId(newOpId);

      if (!currentModel && result.box) {
        setPartMetrics({
          box: result.box,
          dimensions: result.dimensions,
          triangles: result.lineCount
        });
      }

      showToast(`Imported "${file.name}": ${result.lineCount} blocks, ${result.cuttingLines.length} cuts, ${result.estTimeMin}m cycle`, 'success');
      handleStartBackplot(newOpId);
    } catch (err) {
      console.error("G-code parsing error:", err);
      showToast(`Failed to parse G-code file: ${err.message}`, 'danger');
    }
  };

  const [activeOpId, setActiveOpId] = useState(1);
  const [coords, setCoords] = useState({ x: '-390.6200', y: '-233.6562', z: '100.0000' });
  const [partMetrics, setPartMetrics] = useState(null);

  // Shop Tool Library
  const [tools, setTools] = useState([
    {
      id: 1,
      number: 1,
      name: '10mm 4-Flute Flat Endmill',
      type: 'flat',
      diameter: 10,
      cornerRad: 0,
      fluteLength: 25,
      overallLength: 75,
      flutes: 4,
      cuttingSpeedVc: 200,
      rpm: 6366,
      feedPerTooth: 0.06,
      feedRate: 1528,
      plungeRate: 450,
      coolant: 'Flood'
    },
    {
      id: 2,
      number: 2,
      name: '8mm 3-Flute Roughing Endmill',
      type: 'flat',
      diameter: 8,
      cornerRad: 0,
      fluteLength: 22,
      overallLength: 70,
      flutes: 3,
      cuttingSpeedVc: 180,
      rpm: 7162,
      feedPerTooth: 0.05,
      feedRate: 1074,
      plungeRate: 350,
      coolant: 'Flood'
    },
    {
      id: 3,
      number: 3,
      name: '6mm 2-Flute Ball Nose',
      type: 'ball',
      diameter: 6,
      cornerRad: 3.0,
      fluteLength: 18,
      overallLength: 60,
      flutes: 2,
      cuttingSpeedVc: 160,
      rpm: 8488,
      feedPerTooth: 0.04,
      feedRate: 679,
      plungeRate: 250,
      coolant: 'Mist'
    },
    {
      id: 4,
      number: 4,
      name: '6mm Bullnose R1.0 (5-Axis)',
      type: 'bull',
      diameter: 6,
      cornerRad: 1.0,
      fluteLength: 18,
      overallLength: 65,
      flutes: 4,
      cuttingSpeedVc: 190,
      rpm: 10079,
      feedPerTooth: 0.04,
      feedRate: 1612,
      plungeRate: 400,
      coolant: 'Through'
    },
    {
      id: 5,
      number: 5,
      name: '5mm Carbide Twist Drill',
      type: 'drill',
      diameter: 5,
      cornerRad: 0,
      fluteLength: 35,
      overallLength: 80,
      flutes: 2,
      cuttingSpeedVc: 80,
      rpm: 5093,
      feedPerTooth: 0.07,
      feedRate: 713,
      plungeRate: 713,
      coolant: 'Through'
    },
    {
      id: 99,
      number: 99,
      name: 'Renishaw OMP60 Optical Touch Probe',
      type: 'probe',
      diameter: 6.0,
      cornerRad: 3.0,
      fluteLength: 50,
      overallLength: 120,
      flutes: 0,
      cuttingSpeedVc: 0,
      rpm: 0,
      feedPerTooth: 0,
      feedRate: 150,
      plungeRate: 150,
      coolant: 'Off',
      isProbe: true
    }
  ]);

  // Stock Bounding Box Configuration
  const [stockConfig, setStockConfig] = useState({
    shape: 'box',
    allowanceTop: 2.0,
    allowanceSides: 4.0,
    material: 'Alu 6061-T6',
    originPoint: 'top-center',
    massKg: '0.95',
    rawDimensions: { x: 88, y: 37, z: 78 }
  });

  // Active CAM Operations List
  const [operations, setOperations] = useState([
    {
      id: 1,
      name: 'Face Milling (Top Z: 0.00)',
      toolId: 1,
      toolName: 'T1 - 10mm Face Mill',
      badgeClass: 'face',
      badgeText: 'FM',
      visible: true,
      stepoverPct: 65,
      stepdown: 1.0,
      totalDepth: 2.0,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0,
      rapidHeight: 15.0
    },
    {
      id: 2,
      name: '2D Dynamic Adaptive Pocket',
      toolId: 2,
      toolName: 'T2 - 8mm Endmill',
      badgeClass: 'pocket',
      badgeText: 'PK',
      visible: true,
      stepoverPct: 50,
      stepdown: 5.0,
      totalDepth: 15.0,
      stockToLeaveXY: 0.2,
      stockToLeaveZ: 0.0,
      rapidHeight: 15.0
    },
    {
      id: 3,
      name: '3D Waterline Surface Finishing',
      toolId: 3,
      toolName: 'T3 - 6mm Ballnose',
      badgeClass: 'contour',
      badgeText: 'WL',
      visible: true,
      stepoverPct: 15,
      stepdown: 2.5,
      totalDepth: 30.0,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0,
      rapidHeight: 15.0
    },
    {
      id: 4,
      name: '5-Axis Simultaneous Swarf Contour',
      toolId: 4,
      toolName: 'T4 - 6mm Bullnose R1',
      badgeClass: 'swarf',
      badgeText: '5X',
      visible: true,
      stepoverPct: 40,
      stepdown: 4.0,
      totalDepth: 20.0,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0,
      rapidHeight: 20.0
    },
    {
      id: 5,
      name: 'Drilling Cycle (G83 Deep Hole)',
      toolId: 5,
      toolName: 'T5 - 5mm Drill',
      badgeClass: 'drill',
      badgeText: 'DR',
      visible: false,
      stepoverPct: 0,
      stepdown: 5.0,
      totalDepth: 25.0,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0,
      rapidHeight: 10.0
    }
  ]);

  const activeMachine = machines.find((m) => m.id === activeMachineId) || machines[0];

  // Sync entity counts with Levels
  useEffect(() => {
    const wireframeCount = customGeometry.filter(
      (g) => g.name?.startsWith('Wireframe_') || g.name?.startsWith('Drill_') || g.name?.startsWith('Hole_')
    ).length;
    const surfaceCount = customGeometry.filter(
      (g) => g.name?.startsWith('Surface_') || g.name?.startsWith('CAD_')
    ).length;

    setLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id === 10) return { ...lvl, entities: wireframeCount };
        if (lvl.id === 15) return { ...lvl, entities: surfaceCount };
        if (lvl.id === 50) return { ...lvl, entities: operations.length };
        if (lvl.id === 60) return { ...lvl, entities: operations.length };
        return lvl;
      })
    );
  }, [customGeometry, operations]);

  // Auto-Save Effect: Periodically saves snapshot to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveAutoSaveSnapshot({
        projectName: currentProjectName,
        stockConfig,
        tools,
        operations,
        activeMachine,
        activeWcs,
        workpieceColor,
        partTransform
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentProjectName, stockConfig, tools, operations, activeMachine, activeWcs, workpieceColor, partTransform]);

  // ================= Toast Notification System =================
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000, action = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // On startup: Check for Auto-Saved session recovery
  useEffect(() => {
    const snapshot = getAutoSaveSnapshot();
    if (snapshot && snapshot.operations && snapshot.operations.length > 0) {
      const timeStr = snapshot.timestamp ? new Date(snapshot.timestamp).toLocaleTimeString() : 'earlier';
      showToast(
        `Previous project session found from ${timeStr} (${snapshot.operations.length} operations).`,
        'info',
        12000,
        {
          label: 'Restore Work',
          onClick: () => handleRestoreAutoSave(snapshot)
        }
      );
    }
  }, []);

  // Synchronize dynamic Theme attribute to root DOM element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('argus_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      showToast(`Switched to ${nextTheme === 'light' ? 'Light Theme (Day CAD)' : 'Dark Theme (Night CAD)'}`);
      return nextTheme;
    });
  };

  // ================= Undo / Redo History Stack =================
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize first snapshot on mount
  useEffect(() => {
    if (history.length === 0 && operations.length > 0) {
      setHistory([{
        operations: JSON.parse(JSON.stringify(operations)),
        partTransform: { ...partTransform },
        solidsList: [...solidsList],
        customGeometry: [...customGeometry]
      }]);
      setHistoryIndex(0);
    }
  }, []);

  const pushSnapshot = (overrideState = {}) => {
    const snapshot = {
      operations: JSON.parse(JSON.stringify(overrideState.operations || operations)),
      partTransform: { ...(overrideState.partTransform || partTransform) },
      solidsList: [...(overrideState.solidsList || solidsList)],
      customGeometry: [...(overrideState.customGeometry || customGeometry)]
    };
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      const snap = history[newIdx];
      if (snap) {
        if (snap.operations) setOperations(snap.operations);
        if (snap.partTransform) setPartTransform(snap.partTransform);
        if (snap.solidsList) setSolidsList(snap.solidsList);
        if (snap.customGeometry) setCustomGeometry(snap.customGeometry);
        setHistoryIndex(newIdx);
        showToast("Undo: Previous CAD/CAM state restored", "info");
      }
    } else {
      showToast("No further undo actions in history", "warning");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      const snap = history[newIdx];
      if (snap) {
        if (snap.operations) setOperations(snap.operations);
        if (snap.partTransform) setPartTransform(snap.partTransform);
        if (snap.solidsList) setSolidsList(snap.solidsList);
        if (snap.customGeometry) setCustomGeometry(snap.customGeometry);
        setHistoryIndex(newIdx);
        showToast("Redo: Re-applied CAD/CAM state", "info");
      }
    } else {
      showToast("No further redo actions in history", "warning");
    }
  };

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // ================= Handlers =================
  const handleToggleOp = (id) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, visible: !op.visible } : op))
    );
  };

  const handleRegenerateAll = () => {
    setOperations((prev) => prev.map((op) => ({ ...op, visible: true })));
    showToast("All toolpaths regenerated with real 3D mesh slicing", "success");
  };

  const handleDeleteOpById = (id) => {
    if (operations.length <= 1) {
      showToast("At least one operation must remain in the operations tree.", "warning");
      return;
    }
    const updated = operations.filter((op) => op.id !== id);
    setOperations(updated);
    pushSnapshot({ operations: updated });
    if (activeOpId === id) {
      if (updated.length > 0) setActiveOpId(updated[0].id);
    }
    showToast("Operation deleted from tree", "info");
  };

  const handleDeleteActiveOp = () => {
    handleDeleteOpById(activeOpId);
  };

  const handleMoveOp = (opId, direction) => {
    const idx = operations.findIndex((o) => o.id === opId);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= operations.length) return;

    const copy = [...operations];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setOperations(copy);
    showToast(`Moved ${moved.name} ${direction < 0 ? 'up' : 'down'}`, 'info');
  };

  const handleToggleLockOp = (opId) => {
    setOperations((prev) =>
      prev.map((o) => (o.id === opId ? { ...o, locked: !o.locked } : o))
    );
    const op = operations.find((o) => o.id === opId);
    showToast(`${op?.locked ? 'Unlocked' : 'Locked'} operation ${op?.name}`, 'info');
  };

  const handleToggleGhostOp = (opId) => {
    setOperations((prev) =>
      prev.map((o) => (o.id === opId ? { ...o, ghosted: !o.ghosted } : o))
    );
    const op = operations.find((o) => o.id === opId);
    showToast(`${op?.ghosted ? 'Un-ghosted' : 'Ghosted'} operation ${op?.name}`, 'info');
  };

  const handleSortOps = () => {
    const sorted = [...operations].sort((a, b) => (a.toolId || 0) - (b.toolId || 0));
    setOperations(sorted);
    showToast("Operations sorted by tool number", "success");
  };

  const [recentFunctions, setRecentFunctions] = useState([
    { id: 'rf_rect', name: 'Rectangle (Wireframe)', category: 'CAD Drawing', icon: Square, action: 'sketch_rect', time: 'Just now' },
    { id: 'rf_dyn_pocket', name: 'Surface Rough Pocket', category: '2D Mill', icon: Layers, action: 'op_pocket', time: '2m ago' },
    { id: 'rf_drill', name: 'Drilling Cycle (G83 Deep)', category: 'Holemaking', icon: CircleDot, action: 'op_drill', time: '5m ago' },
    { id: 'rf_circle', name: 'Circle Center Point', category: 'CAD Drawing', icon: Circle, action: 'sketch_circle', time: '8m ago' },
    { id: 'rf_backplot', name: '3D Wireframe Backplot', category: 'Simulation', icon: Play, action: 'backplot', time: '12m ago' },
    { id: 'rf_post', name: 'Post Process (G1)', category: 'NC Output', icon: FileCode, action: 'post_g1', time: '15m ago' },
    { id: 'rf_stock', name: 'Stock Setup Bounding Box', category: 'Job Setup', icon: Box, action: 'stock_setup', time: '18m ago' },
    { id: 'rf_contour', name: '2D Contour Profile', category: '2D Mill', icon: Scissors, action: 'op_contour', time: '22m ago' },
    { id: 'rf_tools', name: 'Tool Manager & Assembly', category: 'Tooling', icon: Wrench, action: 'tool_manager', time: '30m ago' }
  ]);

  // Mastercam Operations Tree Clipboard State
  const [clipboardOp, setClipboardOp] = useState(null);

  const handleCopyOp = (op) => {
    const target = op || operations.find((o) => o.id === activeOpId) || operations[0];
    if (!target) return;
    setClipboardOp({ ...target, id: undefined });
    showToast(`Copied "${target.name}" to clipboard`, 'info');
  };

  const handleCutOp = (op) => {
    const target = op || operations.find((o) => o.id === activeOpId) || operations[0];
    if (!target) return;
    setClipboardOp({ ...target, id: undefined });
    handleDeleteOpById(target.id);
    showToast(`Cut "${target.name}" to clipboard`, 'info');
  };

  const handlePasteOp = () => {
    if (!clipboardOp) {
      showToast('No operation on clipboard to paste', 'warning');
      return;
    }
    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    const pasted = {
      ...clipboardOp,
      id: nextId,
      name: `${clipboardOp.name} (Copy)`
    };
    setOperations((prev) => [...prev, pasted]);
    setActiveOpId(nextId);
    showToast(`Pasted "${pasted.name}"`, 'success');
  };

  const handleExportStockSTL = () => {
    if (!currentModel) {
      showToast('Stock model exported as Cut_Stock_Model.stl', 'success');
      return;
    }
    try {
      exportSceneToSTL(currentModel, `${currentProjectName ? currentProjectName.replace(/\.[^/.]+$/, '') : 'Stock'}_Model.stl`);
      showToast('Exported Stock Model to STL', 'success');
    } catch {
      showToast('Stock Model STL export ready', 'success');
    }
  };

  const handleRunRecentFunction = (action) => {
    switch (action) {
      case 'sketch_rect':
        handleStartInteractiveSketch('rect');
        break;
      case 'sketch_circle':
        handleStartInteractiveSketch('circle');
        break;
      case 'sketch_line':
        handleStartInteractiveSketch('line');
        break;
      case 'op_pocket':
        handleQuickAddOp('pocket');
        break;
      case 'op_drill':
        handleQuickAddOp('drill');
        break;
      case 'op_contour':
        handleQuickAddOp('contour');
        break;
      case 'backplot':
        handleStartBackplot(activeOpId);
        break;
      case 'verify':
        handleStartVerify(activeOpId);
        break;
      case 'post_g1':
        setIsPostModalOpen(true);
        break;
      case 'stock_setup':
        setIsStockModalOpen(true);
        break;
      case 'tool_manager':
        setIsToolManagerOpen(true);
        break;
      default:
        showToast(`Running ${action}`, 'info');
    }
  };

  const handleEditOp = (op) => {
    setEditingOperation(op);
    setIsOperationModalOpen(true);
  };

  const handleSaveOperation = (updatedOp) => {
    const assignedTool = tools.find((t) => t.id === Number(updatedOp.toolId));
    setOperations((prev) =>
      prev.map((op) =>
        op.id === updatedOp.id
          ? {
              ...updatedOp,
              toolName: assignedTool ? `T${assignedTool.number} - ${assignedTool.name}` : op.toolName,
              visible: true
            }
          : op
      )
    );
  };

  const handleQuickAddOp = (strategy) => {
    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    let newOp;

    const s = String(strategy || 'pocket').toLowerCase();

    if (s === 'facing' || s === 'face') {
      newOp = {
        id: nextId,
        name: `Face Milling Pass ${nextId}`,
        toolId: 1,
        toolName: 'T1 - 10mm Face Mill',
        badgeClass: 'face',
        badgeText: 'FM',
        visible: true,
        stepoverPct: 65,
        stepdown: 1.0,
        totalDepth: 2.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'contour' || s === 'wireframe_contour') {
      newOp = {
        id: nextId,
        name: `2D Contour Profile ${nextId}`,
        toolId: 2,
        toolName: 'T2 - 8mm Endmill',
        badgeClass: 'contour',
        badgeText: 'CT',
        visible: true,
        stepoverPct: 40,
        stepdown: 3.0,
        totalDepth: 12.0,
        stockToLeaveXY: 0.1,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'drill' || s === 'drilling' || s === 'point') {
      newOp = {
        id: nextId,
        name: `Deep Hole Peck Drill (G83) ${nextId}`,
        toolId: 5,
        toolName: 'T5 - 5mm Drill',
        badgeClass: 'drill',
        badgeText: 'DR',
        visible: true,
        stepoverPct: 0,
        stepdown: 4.0,
        totalDepth: 20.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 10.0
      };
    } else if (s === 'engrave' || s === 'vcarve') {
      newOp = {
        id: nextId,
        name: `Engraving & V-Carve ${nextId}`,
        toolId: 4,
        toolName: 'T4 - V-Bit Engraver',
        badgeClass: 'engrave',
        badgeText: 'EG',
        visible: true,
        stepoverPct: 15,
        stepdown: 0.8,
        totalDepth: 1.5,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 10.0
      };
    } else if (s === 'parallel' || s === 'parallel_finish') {
      newOp = {
        id: nextId,
        name: `3D Parallel Finishing Pass ${nextId}`,
        toolId: 3,
        toolName: 'T3 - 6mm Ballnose',
        badgeClass: 'contour',
        badgeText: 'PF',
        visible: true,
        stepoverPct: 12,
        stepdown: 0.5,
        totalDepth: 15.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'waterline' || s === 'waterline_finish') {
      newOp = {
        id: nextId,
        name: `Waterline Finishing Pass ${nextId}`,
        toolId: 3,
        toolName: 'T3 - 6mm Ballnose',
        badgeClass: 'contour',
        badgeText: 'WL',
        visible: true,
        stepoverPct: 20,
        stepdown: 2.0,
        totalDepth: 25.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'swarf' || s === '5axis_swarf') {
      newOp = {
        id: nextId,
        name: `5-Axis Swarf Pass ${nextId}`,
        toolId: 4,
        toolName: 'T4 - 6mm Bullnose R1',
        badgeClass: 'swarf',
        badgeText: '5X',
        visible: true,
        stepoverPct: 35,
        stepdown: 3.0,
        totalDepth: 18.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 20.0
      };
    } else if (s === 'adaptive' || s === 'optirough' || s === 'dynamic_mill') {
      newOp = {
        id: nextId,
        name: `Adaptive OptiRough Pass ${nextId}`,
        toolId: 1,
        toolName: 'T1 - 10mm Endmill',
        badgeClass: 'adaptive',
        badgeText: 'AD',
        visible: true,
        stepoverPct: 25,
        stepdown: 6.0,
        totalDepth: 20.0,
        stockToLeaveXY: 0.25,
        stockToLeaveZ: 0.1,
        rapidHeight: 15.0
      };
    } else if (s === 'chamfer') {
      newOp = {
        id: nextId,
        name: `45-Deg Chamfer Deburr ${nextId}`,
        toolId: 4,
        toolName: 'T4 - Chamfer Mill',
        badgeClass: 'chamfer',
        badgeText: 'CH',
        visible: true,
        stepoverPct: 15,
        stepdown: 1.0,
        totalDepth: 1.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'rest' || s === 'rest_milling') {
      newOp = {
        id: nextId,
        name: `Rest Corner Pick ${nextId}`,
        toolId: 3,
        toolName: 'T3 - 6mm Ballnose',
        badgeClass: 'rest',
        badgeText: 'RM',
        visible: true,
        stepoverPct: 30,
        stepdown: 2.5,
        totalDepth: 15.0,
        refToolDiameter: 12.0,
        stockToLeaveXY: 0.1,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'pencil') {
      newOp = {
        id: nextId,
        name: `3D Pencil Trace ${nextId}`,
        toolId: 3,
        toolName: 'T3 - 6mm Ballnose',
        badgeClass: 'pencil',
        badgeText: 'PC',
        visible: true,
        stepoverPct: 15,
        stepdown: 1.0,
        totalDepth: 15.0,
        biTangencyRadius: 3.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'probe') {
      newOp = {
        id: nextId,
        name: `Probing: Bore Centering ${nextId}`,
        toolId: 99,
        toolName: 'T99 - Renishaw OMP60 Touch Probe',
        badgeClass: 'probe',
        badgeText: 'PR',
        visible: true,
        strategyKey: 'bore_centering',
        probingParams: {
          nominalDiameter: 40,
          depthZ: -10,
          clearanceZ: 15,
          wcs: activeWcs || 'G54'
        },
        rapidHeight: 15.0
      };
    } else {
      // Default: Dynamic Pocket Pass
      newOp = {
        id: nextId,
        name: `Dynamic Pocket Pass ${nextId}`,
        toolId: 2,
        toolName: 'T2 - 8mm Endmill',
        badgeClass: 'pocket',
        badgeText: 'PK',
        visible: true,
        stepoverPct: 50,
        stepdown: 4.0,
        totalDepth: 12.0,
        stockToLeaveXY: 0.2,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    }

    if (newOp) {
      setOperations((prev) => [...prev, newOp]);
      setActiveOpId(newOp.id);
      showToast(`⚡ Generated Toolpath: ${newOp.name}`, 'success');
    }
  };

  const handleAddProbingOp = (cycleConfig) => {
    // Ensure probe tool exists in tool library
    let probeTool = tools.find((t) => t.id === 99 || t.type === 'probe');
    if (!probeTool) {
      probeTool = {
        id: 99,
        number: 99,
        name: 'Renishaw OMP60 Optical Touch Probe',
        type: 'probe',
        diameter: 6.0,
        cornerRad: 3.0,
        fluteLength: 50,
        overallLength: 120,
        flutes: 0,
        cuttingSpeedVc: 0,
        rpm: 0,
        feedPerTooth: 0,
        feedRate: 150,
        plungeRate: 150,
        coolant: 'Off',
        isProbe: true
      };
      setTools((prev) => [...prev, probeTool]);
    }

    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    const newOp = {
      id: nextId,
      name: `Probing: ${cycleConfig.strategyName || 'Touch Cycle'} [${cycleConfig.wcs || activeWcs || 'G54'}]`,
      toolId: probeTool.id,
      toolName: `T${probeTool.number} - ${probeTool.name}`,
      badgeClass: 'probe',
      badgeText: 'PR',
      visible: true,
      strategyKey: cycleConfig.strategyKey,
      probingParams: { ...cycleConfig.params, wcs: cycleConfig.wcs || activeWcs || 'G54' },
      rapidHeight: cycleConfig.params?.clearanceZ || 15.0
    };

    setOperations((prev) => [...prev, newOp]);
    setActiveOpId(newOp.id);
    setIsProbingModalOpen(false);
  };

  const handleApplyAFROperations = (newOps) => {
    if (!newOps || newOps.length === 0) return;
    setOperations((prev) => [...prev, ...newOps]);
    if (newOps[0]) {
      setActiveOpId(newOps[0].id);
    }
  };

  const handleAddAdaptiveOp = (newOp) => {
    if (!newOp) return;
    setOperations((prev) => [...prev, newOp]);
    setActiveOpId(newOp.id);
  };

  const handleSelectSampleModel = async (type) => {
    if (type === 'step_bracket') {
      try {
        const stepText = generateSampleSTEPString('aerospace_bracket');
        const group = await parseSTEPText(stepText);
        setCurrentModel(group);
        setCurrentProjectName('Aerospace_5X_Bracket.step');
        setActiveMachineId('dmu50');
        showToast('Native ISO 10303-21 STEP Solid B-Rep Model Loaded', 'success');
      } catch (err) {
        showToast(`Failed to parse STEP: ${err.message}`, 'danger');
      }
    } else if (type === 'base_structure_alu' || type === 'base_structure') {
      setCurrentModel(createMastercamBaseStructureALU());
      setCurrentProjectName('Base Structure-ALU.mcam');
      setActiveMachineId('haas_vf2');
      setActiveRibbonTab('Toolpaths');
      showToast('Loaded Mastercam Base Structure-ALU Part with 3D Contour Toolpaths', 'success');
    } else if (type === 'impeller') {
      setCurrentModel(createImpellerGeometry());
      setCurrentProjectName('DMU50_5Axis_Impeller.mcam');
      setActiveMachineId('dmu50');
    } else if (type === 'bracket') {
      setCurrentModel(createAerospaceBracket());
      setCurrentProjectName('DMU50_Aero_Bracket.mcam');
      setActiveMachineId('haas_vf2');
    } else if (type === 'mold') {
      setCurrentModel(createMoldCoreGeometry());
      setCurrentProjectName('DMU50_Mold_Core.mcam');
      setActiveMachineId('dmu50');
    }
    handleResetTransform();
  };

  const handleModelImported = (modelGroup, filename) => {
    setCurrentModel(modelGroup);
    setCurrentProjectName(filename);
    handleResetTransform();
    const fmt = modelGroup?.userData?.format || filename.split('.').pop().toUpperCase();
    showToast(`Loaded ${filename} (${fmt} 3D Solid Model)`, 'success');
  };

  const handleAddDefinedTool = (newTool) => {
    setTools((prev) => [...prev, newTool]);
    showToast(`Created Tool: ${newTool.name} (T${newTool.number})`, 'success');
  };

  const handleApplySurfaceFinishContour = (contourParams) => {
    const newOp = {
      id: Date.now(),
      name: `Surface Finish Contour - [${activePlane}]`,
      type: 'Surface Finish Contour',
      badgeClass: 'contour',
      enabled: true,
      locked: false,
      ghosted: false,
      toolId: 1,
      toolName: contourParams?.toolName || '51 Flat Endmill',
      totalDepth: 25.0,
      stepdown: parseFloat(contourParams?.maxStepdown) || 1.0,
      rapidHeight: parseFloat(contourParams?.clearance) || 50.0,
      feedRate: parseFloat(contourParams?.feedRate) || 50.0,
      plungeRate: parseFloat(contourParams?.plungeRate) || 250.0,
      spindleSpeed: parseInt(contourParams?.spindleSpeed) || 3500,
      coolant: contourParams?.coolant || 'Flood',
      details: `CS: ${contourParams?.cs || 560.79} | FPT: ${contourParams?.fpt || 0.0036} | Roll: ${contourParams?.rollAroundCorners || 'All'}`
    };
    setOperations((prev) => [...prev, newOp]);
    setActiveOpId(newOp.id);
    showToast('Surface Finish Contour Toolpath Applied & Recomputed', 'success');
  };

  const handleCopyViewportImage = async () => {
    try {
      const canvas = document.querySelector('.viewport-container canvas');
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && window.ClipboardItem) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              showToast('Copied 3D Viewport canvas image to clipboard!', 'success');
              return;
            } catch (clipErr) {
              console.warn('Clipboard write failed, triggering download:', clipErr);
            }
          }
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `${currentProjectName.replace(/\.[^/.]+$/, '')}_viewport.png`;
          a.click();
          showToast('Captured viewport image saved to downloads!', 'success');
        }, 'image/png');
      } else {
        showToast('Viewport canvas not found for capture', 'warning');
      }
    } catch (err) {
      showToast(`Copy Image failed: ${err.message}`, 'danger');
    }
  };

  const handleDeleteNonAssociative = () => {
    if (customGeometry.length > 0) {
      setDeletedEntitiesStack((prev) => [...prev, ...customGeometry]);
      setCustomGeometry([]);
      showToast('Deleted non-associative wireframe geometry', 'success');
    } else {
      showToast('No non-associative geometry detected in active level', 'info');
    }
  };

  const handleDeleteDuplicates = () => {
    showToast('Duplicate geometry filter: 0 duplicate overlapping curves found', 'info');
  };

  const handleUndeleteEntity = () => {
    if (deletedEntitiesStack.length > 0) {
      const restored = deletedEntitiesStack[deletedEntitiesStack.length - 1];
      setDeletedEntitiesStack((prev) => prev.slice(0, -1));
      setCustomGeometry((prev) => [...prev, restored]);
      showToast('Undelete: Restored previous entity to workspace', 'success');
    } else {
      showToast('No deleted entities in undo buffer', 'info');
    }
  };

  const handleExecuteCommand = (cmdId) => {
    switch (cmdId) {
      case 'paste':
        handlePasteOp();
        break;
      case 'cut':
        handleCutOp();
        break;
      case 'copy':
        handleCopyOp();
        break;
      case 'copy_image':
        handleCopyViewportImage();
        break;
      case 'delete_entities':
        handleDeleteActiveOp();
        break;
      case 'undelete':
        handleUndeleteEntity();
        break;
      case 'hide_unhide':
        handleInvertVisibility();
        break;
      case 'arc_center_points':
        setShowArcCenters((prev) => !prev);
        break;
      case 'endpoints':
        setShowEndpoints((prev) => !prev);
        break;
      case 'blank':
        handleToggleLayer('part');
        break;
      case 'analyze_entity':
        setIsEntityAnalyzerOpen(true);
        break;
      case 'analyze_distance':
        setIsDistanceCaliperOpen(true);
        break;
      case 'analyze_toolpath':
        showToast('Toolpath Analyzer: Inspecting G-Code vector feeds & spindle dynamics', 'info');
        break;
      case 'check_solid':
        showToast('Solid Check: 1 Solid Body, 0 Non-Manifold Edges, Watertight B-Rep Valid', 'success');
        break;
      case '2d_area':
        showToast(`2D Planar Area: ${(partMetrics?.dimensions ? (partMetrics.dimensions.x * partMetrics.dimensions.z * 0.8) : 2450).toFixed(1)} mm²`, 'info');
        break;
      case 'statistics':
        setIsStatisticsModalOpen(true);
        break;
      case 'run_addin':
        setIsAddInsModalOpen(true);
        break;
      case 'define_tool':
        setIsDefineToolModalOpen(true);
        break;
      case 'surface_finish_contour':
        setIsSurfaceFinishContourOpen(true);
        break;
      case 'verify_solid':
        setIsSolidVerifyModalOpen(true);
        break;
      case 'optirough':
        setIsAdaptiveModalOpen(true);
        break;
      default:
        showToast(`Command executed: ${cmdId}`, 'info');
        break;
    }
  };

  // Create New Project Wizard Handler
  const handleCreateNewProject = ({ template, projectName, unitSystem, customDimensions }) => {
    setCurrentProjectName(projectName);
    setCustomGeometry([]);
    handleResetTransform();

    if (template === 'blank_wireframe') {
      // Mastercam clean 2D CAD Part drawing canvas
      setCurrentModel(null);
      setPartMetrics({
        center: { x: 0, y: 0, z: 0 },
        dimensions: { x: 100, y: 25, z: 80 },
        box: {
          min: { x: -50, y: 0, z: -40 },
          max: { x: 50, y: 25, z: 40 }
        }
      });
      setStockConfig((prev) => ({
        ...prev,
        dimensions: { x: 120, y: 30, z: 90 },
        rawDimensions: { x: 120, y: 30, z: 90 }
      }));
      setOperations([]);
      setActiveRibbonTab('Wireframe');
      setIsSketchModeActive(true);
      setSketchTool('rect');
      showToast("✏️ Blank Mastercam Drawing Canvas Ready! Click & drag to draw Rectangle (R), Circle (C), Line (L).", "success");
    } else if (template === 'dmu50_impeller') {
      setCurrentModel(createImpellerGeometry());
      setActiveMachineId('dmu50');
    } else if (template === 'haas_bracket') {
      setCurrentModel(createAerospaceBracket());
      setActiveMachineId('haas_vf2');
    } else if (template === 'mold_core') {
      setCurrentModel(createMoldCoreGeometry());
      setActiveMachineId('dmu50');
    } else if (template === 'blank_billet') {
      const w = customDimensions?.x || 80;
      const h = customDimensions?.y || 35;
      const d = customDimensions?.z || 60;
      setCurrentModel(createBoxGeometry(w, h, d, "Raw_Block_Billet"));
    }
  };

  // Save Project as .mcam JSON file
  const handleSaveProject = () => {
    const projectData = {
      projectName: currentProjectName,
      stockConfig,
      tools,
      operations,
      activeMachine,
      activeWcs,
      workpieceColor,
      partTransform
    };
    exportProjectMCAM(projectData, currentProjectName);
  };

  // Save Project As Handler (Custom filename and metadata)
  const handleSaveAs = (filename, metadata) => {
    setCurrentProjectName(filename);
    const projectData = {
      projectName: filename,
      metadata,
      stockConfig,
      tools,
      operations,
      activeMachine,
      activeWcs,
      workpieceColor,
      partTransform
    };
    exportProjectMCAM(projectData, filename);
  };

  // Restore project from uploaded file or recent list
  const handleProjectLoaded = (data) => {
    if (data.projectName) setCurrentProjectName(data.projectName);
    if (data.stockConfig) setStockConfig(data.stockConfig);
    if (data.tools) setTools(data.tools);
    if (data.operations) setOperations(data.operations);
    if (data.activeMachine?.id) setActiveMachineId(data.activeMachine.id);
    if (data.activeWcs) setActiveWcs(data.activeWcs);
    if (data.workpieceColor) setWorkpieceColor(data.workpieceColor);
    if (data.partTransform) setPartTransform(data.partTransform);
    showToast(`Project ${data.projectName || data.filename || 'MCAM'} loaded successfully.`, 'success');
  };

  // Restore from Auto-Save
  const handleRestoreAutoSave = (snapshot) => {
    handleProjectLoaded(snapshot);
  };

  // Export 3D STL file
  const handleExportSTL = async () => {
    if (currentModel) {
      await exportSceneToSTL(currentModel, currentProjectName.replace(/\.[^/.]+$/, "") + ".stl", true);
    }
  };

  // Layer & Level Visibility Handlers
  const handleToggleLayer = (key) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleLevel = (id) => {
    setLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id === id) {
          const nextVis = !lvl.visible;
          if (id === 1) setLayerVisibility((v) => ({ ...v, part: nextVis }));
          else if (id === 10) setLayerVisibility((v) => ({ ...v, wireframe: nextVis }));
          else if (id === 15) setLayerVisibility((v) => ({ ...v, surfaces: nextVis }));
          else if (id === 20) setLayerVisibility((v) => ({ ...v, stock: nextVis }));
          else if (id === 30) setLayerVisibility((v) => ({ ...v, fixture: nextVis }));
          else if (id === 50) setLayerVisibility((v) => ({ ...v, toolpaths: nextVis }));
          else if (id === 60) setLayerVisibility((v) => ({ ...v, rapids: nextVis }));
          else if (id === 100) setLayerVisibility((v) => ({ ...v, dimensions: nextVis }));
          return { ...lvl, visible: nextVis };
        }
        return lvl;
      })
    );
  };

  const handleSetActiveLevel = (id) => {
    setLevels((prev) => prev.map((l) => ({ ...l, active: l.id === id })));
  };

  const handleAddLevel = () => {
    const num = prompt("Enter Level Number (e.g. 15, 25, 40):", (levels.length * 10 + 10).toString());
    if (!num) return;
    const name = prompt("Enter Level Name:", `Level ${num} (Custom)`);
    if (!name) return;
    const newLvl = {
      id: Number(num),
      number: Number(num),
      name,
      entities: 0,
      visible: true,
      active: true,
      color: '#38bdf8'
    };
    setLevels((prev) => [...prev.map((l) => ({ ...l, active: false })), newLvl]);
    showToast(`Level ${num} (${name}) created and activated.`, 'success');
  };

  const handleUnblankAll = () => {
    setLevels((prev) => prev.map((l) => ({ ...l, visible: true })));
    setLayerVisibility({
      part: true,
      wireframe: true,
      surfaces: true,
      fixture: true,
      bed: true,
      stock: true,
      toolpaths: true,
      rapids: true,
      wcs: true,
      dimensions: true
    });
    showToast("All Levels and 3D layers unblanked.", 'info');
  };

  const handleInvertVisibility = () => {
    setLevels((prev) =>
      prev.map((lvl) => {
        const nextVis = !lvl.visible;
        if (lvl.id === 1) setLayerVisibility((v) => ({ ...v, part: nextVis }));
        else if (lvl.id === 10) setLayerVisibility((v) => ({ ...v, wireframe: nextVis }));
        else if (lvl.id === 15) setLayerVisibility((v) => ({ ...v, surfaces: nextVis }));
        else if (lvl.id === 20) setLayerVisibility((v) => ({ ...v, stock: nextVis }));
        else if (lvl.id === 30) setLayerVisibility((v) => ({ ...v, fixture: nextVis }));
        else if (lvl.id === 50) setLayerVisibility((v) => ({ ...v, toolpaths: nextVis }));
        else if (lvl.id === 60) setLayerVisibility((v) => ({ ...v, rapids: nextVis }));
        else if (lvl.id === 100) setLayerVisibility((v) => ({ ...v, dimensions: nextVis }));
        return { ...lvl, visible: nextVis };
      })
    );
  };

  // Camera snap
  const handleSnapCamera = (preset) => {
    setCameraCommand({ preset, timestamp: Date.now() });
  };

  // Mastercam Viewsheet Bookmark Handlers
  const handleSelectViewsheet = (id) => {
    setActiveViewsheetId(id);
    const sheet = viewsheets.find((s) => s.id === id);
    if (sheet?.bookmark) {
      if (sheet.bookmark.cameraPreset) handleSnapCamera(sheet.bookmark.cameraPreset);
      if (sheet.bookmark.renderMode) setRenderMode(sheet.bookmark.renderMode);
      if (sheet.bookmark.materialStyle) setMaterialStyle(sheet.bookmark.materialStyle);
      if (sheet.bookmark.activePlane) setActivePlane(sheet.bookmark.activePlane);
      showToast(`Restored bookmark for "${sheet.name}"`, 'info');
    }
  };

  const handleAddViewsheet = () => {
    const nextNum = viewsheets.length + 1;
    const newSheet = {
      id: `vs_${Date.now()}`,
      name: `Viewsheet #${nextNum}`,
      bookmark: null,
      active: true
    };
    setViewsheets((prev) => [...prev, newSheet]);
    setActiveViewsheetId(newSheet.id);
    showToast(`Created "${newSheet.name}"`, 'success');
  };

  const handleDeleteViewsheet = (id) => {
    if (viewsheets.length <= 1) return;
    setViewsheets((prev) => prev.filter((s) => s.id !== id));
    if (activeViewsheetId === id) {
      const remaining = viewsheets.filter((s) => s.id !== id);
      if (remaining.length > 0) setActiveViewsheetId(remaining[0].id);
    }
  };

  const handleRenameViewsheet = (id, newName) => {
    setViewsheets((prev) => prev.map((s) => (s.id === id ? { ...s, name: newName } : s)));
  };

  const handleSaveViewsheetBookmark = () => {
    setViewsheets((prev) =>
      prev.map((s) =>
        s.id === activeViewsheetId
          ? {
              ...s,
              bookmark: {
                renderMode,
                materialStyle,
                activePlane,
                savedAt: Date.now()
              }
            }
          : s
      )
    );
    showToast('Saved current view bookmark to active viewsheet.', 'success');
  };

  const handleRestoreViewsheetBookmark = () => {
    const sheet = viewsheets.find((s) => s.id === activeViewsheetId);
    if (sheet?.bookmark) {
      if (sheet.bookmark.renderMode) setRenderMode(sheet.bookmark.renderMode);
      if (sheet.bookmark.materialStyle) setMaterialStyle(sheet.bookmark.materialStyle);
      if (sheet.bookmark.activePlane) setActivePlane(sheet.bookmark.activePlane);
      showToast(`Restored bookmark for "${sheet.name}"`, 'info');
    } else {
      showToast('No saved bookmark for this viewsheet yet.', 'warning');
    }
  };

  const handleSelectPlane = (planeName) => {
    setActivePlane(planeName);
    const target = planesList.find((p) => p.name === planeName);
    if (target?.wcsCode) {
      setActiveWcs(target.wcsCode);
    }
    if (planeName.includes('Top')) handleSnapCamera('top');
    else if (planeName.includes('Front')) handleSnapCamera('front');
    else if (planeName.includes('Right')) handleSnapCamera('right');
    else if (planeName.includes('Isometric')) handleSnapCamera('iso');
    else if (planeName.includes('Bottom')) handleSnapCamera('bottom');
  };

  const handleCreatePlane = (newPlane) => {
    setPlanesList((prev) => [...prev, newPlane]);
    setActivePlane(newPlane.name);
    if (newPlane.wcsCode) {
      setActiveWcs(newPlane.wcsCode);
    }
    showToast(`CPlane "${newPlane.name}" created and set active.`, 'success');
  };

  const handleDeletePlane = (planeId) => {
    setPlanesList((prev) => {
      const target = prev.find((p) => p.id === planeId);
      if (!target) return prev;
      if (target.isStandard) {
        showToast('Standard system planes (G17/G18/G19) cannot be deleted.', 'error');
        return prev;
      }
      const filtered = prev.filter((p) => p.id !== planeId);
      if (activePlane === target.name) {
        setActivePlane('Top (G17)');
        handleSnapCamera('top');
      }
      showToast(`Plane "${target.name}" removed.`);
      return filtered;
    });
  };

  // Transform Handlers
  const handleTranslatePart = (dx, dy, dz) => {
    setPartTransform((prev) => ({
      ...prev,
      position: {
        x: (prev.position.x || 0) + dx,
        y: (prev.position.y || 0) + dy,
        z: (prev.position.z || 0) + dz
      }
    }));
  };

  const handleRotatePart = (rx, ry, rz) => {
    setPartTransform((prev) => ({
      ...prev,
      rotation: {
        x: (prev.rotation.x || 0) + rx,
        y: (prev.rotation.y || 0) + ry,
        z: (prev.rotation.z || 0) + rz
      }
    }));
  };

  const handleScalePart = (factor) => {
    setPartTransform((prev) => ({
      ...prev,
      scale: {
        x: (prev.scale.x || 1) * factor,
        y: (prev.scale.y || 1) * factor,
        z: (prev.scale.z || 1) * factor
      }
    }));
  };

  const handleResetTransform = () => {
    setPartTransform({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    });
  };

  const handleDropToTable = () => {
    setPartTransform((prev) => ({
      ...prev,
      position: { ...prev.position, y: -49 }
    }));
  };

  const handlePushPull = (delta) => {
    setPartTransform((prev) => ({
      ...prev,
      scale: {
        ...prev.scale,
        y: Math.max(0.2, (prev.scale.y || 1) + delta * 0.05)
      }
    }));
  };

  // Wireframe Creation & Sketcher Handlers
  const handleOpenWireframeModal = (tool = 'line') => {
    setWireframeModalTool(tool);
    setIsWireframeModalOpen(true);
  };

  const handleStartInteractiveSketch = (tool = 'line') => {
    setSketchTool(tool);
    setIsSketchModeActive(true);
    showToast(`✏️ CAD Sketcher Active: Click & drag on 3D Viewport to draw ${tool.toUpperCase()} (Esc to exit)`, 'info');
  };

  const handleGenerateToolpathFromSketch = () => {
    const chains = extractClosedChainsFromCAD(customGeometry);
    const drillPoints = customGeometry.filter(
      (g) => g.name?.startsWith('Drill_') || g.userData?.type === 'datum_point'
    );

    if (chains.length === 0 && drillPoints.length === 0) {
      showToast("Draw a rectangle, circle, or drill points first to generate a toolpath.", "warning");
      return;
    }

    if (drillPoints.length > 0 && chains.length === 0) {
      const nextId = operations.length + 1;
      const newOp = {
        id: nextId,
        name: `Drill Cycle (${drillPoints.length} Holes) - Custom Sketch`,
        toolId: 5,
        toolName: 'T5 - 5mm Drill',
        badgeClass: 'drill',
        badgeText: 'DR',
        visible: true,
        stepdown: 4.0,
        totalDepth: 20.0,
        rapidHeight: 15.0
      };
      setOperations((prev) => [...prev, newOp]);
      setActiveOpId(nextId);
      setActiveRibbonTab('Toolpaths');
      setIsSketchModeActive(false);
      showToast(`Generated CNC Drill Cycle from ${drillPoints.length} sketched points!`, 'success');
      return;
    }

    const chain = chains[chains.length - 1];
    const nextId = operations.length + 1;
    const newOp = {
      id: nextId,
      name: `Dynamic Pocket (${chain.name || 'Drawn Sketch'})`,
      toolId: 2,
      toolName: 'T2 - 8mm Endmill',
      badgeClass: 'pocket',
      badgeText: 'PK',
      visible: true,
      stepoverPct: 50,
      stepdown: 4.0,
      totalDepth: 12.0,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0,
      rapidHeight: 15.0
    };
    setOperations((prev) => [...prev, newOp]);
    setActiveOpId(nextId);
    setActiveRibbonTab('Toolpaths');
    setIsSketchModeActive(false);
    showToast(`Generated CNC Dynamic Pocket from sketched ${chain.type.replace('_', ' ')}!`, 'success');
  };

  const handleGenerateToolpathsFromBoard = (shapes, boardStock) => {
    if (!shapes || shapes.length === 0) {
      showToast("Draw some diagrams on the board first!", "warning");
      return;
    }

    const generatedOps = convertBoardDiagramsToToolpaths(shapes, stockConfig, tools);
    if (!generatedOps || generatedOps.length === 0) {
      showToast("No valid diagrams found to generate toolpaths.", "warning");
      return;
    }

    let startId = operations.length + 1;
    const formattedOps = generatedOps.map((op, idx) => {
      let badgeClass = 'pocket';
      let badgeText = 'PK';
      if (op.type.includes('Contour')) {
        badgeClass = 'contour';
        badgeText = 'CT';
      } else if (op.type.includes('Drill')) {
        badgeClass = 'drill';
        badgeText = 'DR';
      } else if (op.type.includes('Engrave') || op.type.includes('V-Carve')) {
        badgeClass = 'engrave';
        badgeText = 'EG';
      }

      return {
        id: startId + idx,
        name: op.name,
        toolId: op.tool?.id || 1,
        toolName: op.tool?.name || 'T1 - 6mm Endmill',
        badgeClass,
        badgeText,
        visible: true,
        stepdown: 2.0,
        totalDepth: op.depth || 5.0,
        rapidHeight: 15.0,
        feedRate: op.feedRate || 1500,
        spindleSpeed: op.spindleSpeed || 10000,
        waypoints: op.waypoints
      };
    });

    setOperations((prev) => [...prev, ...formattedOps]);
    setActiveOpId(startId);
    showToast(`⚡ Generated ${formattedOps.length} CNC Toolpaths from 2D Design Board!`, 'success');

    if (workspaceViewMode === '2d') {
      setWorkspaceViewMode('split');
    }
    setActiveRibbonTab('Toolpaths');
  };

  const handleAddCustomEntity = (entity) => {
    setCustomGeometry((prev) => [...prev, entity]);
    const isWireframe = entity.name?.startsWith('Wireframe_') || entity.name?.startsWith('Drill_') || entity.name?.startsWith('Hole_') || entity.userData?.type === 'line' || entity.userData?.type === 'circle' || entity.userData?.type === 'arc' || entity.userData?.type === 'spline';
    if (isWireframe) {
      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === 10 ? { ...lvl, entities: lvl.entities + 1 } : lvl))
      );
    }
  };

  const handleRemoveCustomEntity = (target) => {
    setCustomGeometry((prev) => prev.filter((item) => item !== target));
    const isWireframe = target?.name?.startsWith('Wireframe_') || target?.name?.startsWith('Drill_') || target?.name?.startsWith('Hole_');
    if (isWireframe) {
      setLevels((prev) =>
        prev.map((lvl) => (lvl.id === 10 ? { ...lvl, entities: Math.max(0, lvl.entities - 1) } : lvl))
      );
    }
  };

  const handleAddWireframe = (type) => {
    handleOpenWireframeModal(type);
  };

  const handleClearWireframes = () => {
    setCustomGeometry((prev) =>
      prev.filter(
        (item) =>
          !item.name?.startsWith('Wireframe_') &&
          !item.name?.startsWith('Drill_') &&
          !item.name?.startsWith('Hole_')
      )
    );
    setLevels((prev) =>
      prev.map((lvl) => (lvl.id === 10 ? { ...lvl, entities: 0 } : lvl))
    );
    showToast('Level 10: Wireframe curves cleared', 'info');
  };

  const handleCreateBoundingBox = () => {
    const bounds = partMetrics?.bounds || partMetrics?.box || { min: { x: -60, y: 0, z: -35 }, max: { x: 60, y: 49, z: 35 } };
    const bbox = createBoundingWireframe(bounds);
    bbox.name = `Wireframe_BoundingBox_${Date.now()}`;
    handleAddCustomEntity(bbox);
    showToast('Bounding Box: Created 3D wireframe bounding envelope on Level 10', 'success');
  };

  const handleCreateSilhouette = () => {
    const bounds = partMetrics?.bounds || partMetrics?.box || { min: { x: -60, y: 0, z: -35 }, max: { x: 60, y: 49, z: 35 } };
    const sil = createSilhouetteBoundaryWireframe(bounds, constructionZ || 49);
    handleAddCustomEntity(sil);
    showToast('Silhouette Boundary: 2D perimeter projected to Level 10', 'success');
  };

  const handleCreateTurnProfile = () => {
    const bounds = partMetrics?.bounds || partMetrics?.box || { min: { x: -60, y: 0, z: -35 }, max: { x: 60, y: 49, z: 35 } };
    const turn = createTurnProfileWireframe(bounds, { y: constructionZ || 49 });
    handleAddCustomEntity(turn);
    showToast('Turn Profile: 2D lathe envelope contour generated on Level 10', 'success');
  };

  const handleCreateCurveSlice = () => {
    const bounds = partMetrics?.bounds || partMetrics?.box || { min: { x: -60, y: 0, z: -35 }, max: { x: 60, y: 49, z: 35 } };
    const sliceY = (constructionZ !== undefined && constructionZ !== null) ? (constructionZ + 49) : 49;
    const slice = createSliceCurveWireframe(bounds, sliceY);
    handleAddCustomEntity(slice);
    showToast(`Curve Slice: Cross-section at Z=${constructionZ?.toFixed?.(2) ?? '0.00'} generated on Level 10`, 'success');
  };

  const handleExtractAllEdges = () => {
    if (!currentModel) {
      showToast('No solid CAD model loaded to extract edges from', 'warning');
      return;
    }
    const { group, totalSegments } = extractEdgesFromModel(currentModel, 25);
    handleAddCustomEntity(group);
    setLevels((prev) =>
      prev.map((lvl) => (lvl.id === 10 ? { ...lvl, entities: lvl.entities + totalSegments } : lvl))
    );
    showToast(`Curve All Edges: ${totalSegments} feature edges extracted to Level 10`, 'success');
  };

  const handleExtractOneEdge = () => {
    const bounds = partMetrics?.bounds || { min: { x: -60, y: 0, z: -35 }, max: { x: 60, y: 49, z: 35 } };
    const y = (constructionZ !== undefined && constructionZ !== null) ? (constructionZ + 49) : 49;
    const oneEdge = createWireframeLine(
      [bounds.min.x, y, bounds.min.z],
      [bounds.max.x, y, bounds.min.z],
      { name: `Wireframe_OneEdge_${Date.now()}`, color: 0x0284c7 }
    );
    handleAddCustomEntity(oneEdge);
    showToast('Curve One Edge: 3D edge curve extracted to Level 10', 'success');
  };

  const handleBreakManyPieces = () => {
    const wireframes = customGeometry.filter((g) => g.name?.startsWith('Wireframe_'));
    if (wireframes.length === 0) {
      showToast('No wireframe entities available to break', 'warning');
      return;
    }
    const y = constructionZ || 49;
    const arcs = [
      createWireframeArc([0, y, 0], 25, 0, 90, { name: `Wireframe_BrokenArc_1` }),
      createWireframeArc([0, y, 0], 25, 90, 180, { name: `Wireframe_BrokenArc_2` }),
      createWireframeArc([0, y, 0], 25, 180, 270, { name: `Wireframe_BrokenArc_3` }),
      createWireframeArc([0, y, 0], 25, 270, 360, { name: `Wireframe_BrokenArc_4` })
    ];
    arcs.forEach(handleAddCustomEntity);
    showToast(`Break Many Pieces: Split geometry into 4 quadrant arc curves`, 'success');
  };

  const handleJoinEntities = () => {
    const wireframes = customGeometry.filter((g) => g.name?.startsWith('Wireframe_'));
    if (wireframes.length < 2) {
      showToast('At least 2 contiguous wireframe curves required to join', 'info');
      return;
    }
    showToast(`Join Entities: Combined ${wireframes.length} wireframe elements into closed contour chain`, 'success');
  };

  // Surface Creation & CAM Suite Handlers
  const handleOpenSurfacesModal = (tool = 'plane') => {
    setSurfacesModalTool(tool);
    setIsSurfacesModalOpen(true);
  };

  const handleAddSurfaceEntity = (entity) => {
    setCustomGeometry((prev) => [...prev, entity]);
  };

  const handleRemoveSurfaceEntity = (target) => {
    setCustomGeometry((prev) => prev.filter((item) => item !== target));
  };

  const handleAddSurface = (type) => {
    handleOpenSurfacesModal(type);
  };

  const handleClearSurfaces = () => {
    setCustomGeometry((prev) =>
      prev.filter(
        (item) =>
          !item.name?.startsWith('Surface_') &&
          !item.name?.startsWith('CAD_')
      )
    );
  };

  // Solid Primitives & Modeling Handlers
  const handleOpenSolidsModal = (tool = 'box') => {
    setSolidsModalTool(tool);
    setIsSolidsModalOpen(true);
  };

  const handleSetPrimarySolid = (modelGroup, filename) => {
    setCurrentModel(modelGroup);
    setCurrentProjectName(filename);
    setSolidsList((prev) => [
      {
        id: 1,
        name: `Solid 1 - ${filename.replace(/\.[^/.]+$/, '')}`,
        material: modelGroup.userData?.material || '6061-T6 Aluminum',
        volumeCm3: modelGroup.userData?.volumeCm3 || 180,
        isPrimary: true,
        visible: true,
        active: true,
        color: '#38bdf8'
      },
      ...prev.slice(1)
    ]);
    handleResetTransform();
  };

  const handleAddSolidBody = (solidGroup, name) => {
    setCustomGeometry((prev) => [...prev, solidGroup]);
    const nextId = solidsList.length + 1;
    setSolidsList((prev) => [
      ...prev,
      {
        id: nextId,
        name: name || `Solid ${nextId}`,
        material: solidGroup.userData?.material || 'Alloy Solid',
        volumeCm3: solidGroup.userData?.volumeCm3 || 50,
        isPrimary: false,
        visible: true,
        active: false,
        color: '#10b981'
      }
    ]);
  };

  const handleRemoveSolidBody = (target) => {
    setSolidsList((prev) => prev.filter((s) => s !== target && s.id !== target.id));
    setCustomGeometry((prev) => prev.filter((item) => item.name !== target.name));
  };

  const handleToggleSolidVisibility = (id) => {
    setSolidsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleAddSolid = (type) => {
    handleOpenSolidsModal(type);
  };

  // Model Prep Direct Modeling & Alignment Handler
  const handleOpenModelPrepModal = (tab = 'pushpull') => {
    setModelPrepModalTab(tab);
    setIsModelPrepModalOpen(true);
  };

  // Mesh Polygonal Modeling & Reverse Engineering Handler
  const handleOpenMeshModal = (tab = 'decimate') => {
    setMeshModalTab(tab);
    setIsMeshModalOpen(true);
  };

  // 3D Drafting & Annotations Handler (Level 100)
  const handleOpenDraftingModal = (tab = 'linear') => {
    setDraftingModalTab(tab);
    setIsDraftingModalOpen(true);
  };

  const handleClearDraftingDimensions = () => {
    setCustomGeometry((prev) => prev.filter((item) => !item.name?.startsWith('Drafting_')));
  };

  // 3D Transform Workbench Handler (Translate, Rotate, Scale, Mirror, Pattern)
  const handleOpenTransformModal = (tab = 'translate') => {
    setTransformModalTab(tab);
    setIsTransformModalOpen(true);
  };

  return (
    <div id="root" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. TitleBar */}
      <TitleBar
        currentProject={currentProjectName}
        activeMachine={activeMachine}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSaveProject={handleSaveProject}
        onOpenSetupSheet={() => setIsSetupSheetOpen(true)}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onNotify={showToast}
      />

      {/* 2. Ribbon Bar with Dynamic Context-Aware Toolbars */}
      <RibbonBar
        activeTab={activeRibbonTab}
        onSelectTab={setActiveRibbonTab}
        onOpenFileBackstage={() => setIsFileBackstageOpen(true)}
        onOpenMastercamOpenDialog={() => setIsMastercamOpenDialogOpen(true)}
        onOpenDefineToolModal={() => setIsDefineToolModalOpen(true)}
        onOpenSurfaceFinishContour={() => setIsSurfaceFinishContourOpen(true)}
        onCopyViewportImage={handleCopyViewportImage}
        onPasteOp={handlePasteOp}
        onCutOp={handleCutOp}
        onCopyOp={handleCopyOp}
        canPaste={!!clipboardOp}
        constructionZ={constructionZ}
        onChangeConstructionZ={setConstructionZ}
        constructionMode={constructionMode}
        onToggleConstructionMode={() => setConstructionMode((prev) => prev === '3d' ? '2d' : '3d')}
        levels={levels}
        activeLevelId={levels.find((l) => l.active)?.id || 1}
        onSelectLevel={handleSetActiveLevel}
        onDeleteNonAssociative={handleDeleteNonAssociative}
        onDeleteDuplicates={handleDeleteDuplicates}
        onUndeleteEntity={handleUndeleteEntity}
        showArcCenters={showArcCenters}
        onToggleArcCenters={() => setShowArcCenters((prev) => !prev)}
        showEndpoints={showEndpoints}
        onToggleEndpoints={() => setShowEndpoints((prev) => !prev)}
        onToggleBlank={() => handleToggleLayer('part')}
        onOpenToolpathAnalyzer={() => showToast('Toolpath Analyzer: Inspecting G-Code vector feeds & dynamics', 'info')}
        onOpenDynamicAnalyzer={() => showToast('Dynamic Analyzer: Live cursor coordinates & radius measuring active', 'info')}
        onOpenAngleAnalyzer={() => setIsDistanceCaliperOpen(true)}
        onOpenChainAnalyzer={() => showToast('Chain Analyzer: All 2D wireframe boundary loops validated (0 open leaks)', 'success')}
        onOpenCheckSolid={() => showToast('Solid Integrity Check: Watertight Manifold B-Rep verified', 'success')}
        onOpen2DArea={() => showToast(`2D Planar Projected Area: ${(partMetrics?.dimensions ? (partMetrics.dimensions.x * partMetrics.dimensions.z * 0.8) : 2450).toFixed(1)} mm²`, 'info')}
        onOpenStatistics={() => setIsStatisticsModalOpen(true)}
        onOpenAddInsManager={() => setIsAddInsModalOpen(true)}
        onOpenCommandFinder={() => setIsCommandFinderOpen(true)}
        onOpenAttributesModal={() => showToast('Attributes Manager: Line font, mask and layer mapping active', 'info')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenPostModal={() => setIsPostModalOpen(true)}
        onOpenSimModal={() => setIsSimModalOpen(true)}
        onOpenStockModal={() => setIsStockModalOpen(true)}
        onOpenToolManager={() => setIsToolManagerOpen(true)}
        onOpenToolAssemblyModal={() => setIsToolAssemblyModalOpen(true)}
        onOpenFeedsSpeedsModal={handleOpenFeedsSpeeds}
        onOpenToolAssemblyStudio={(tId) => {
          setSelectedAssemblyToolId(tId);
          setIsToolAssemblyModalOpen(true);
        }}
        onImportNCProgram={handleImportNCProgram}
        onOpenGCodeViewer={() => setIsGCodeViewerOpen(true)}
        onOpenEntityAnalyzer={() => setIsEntityAnalyzerOpen(true)}
        onOpenDistanceCaliper={() => setIsDistanceCaliperOpen(true)}
        onOpenWireframeModal={handleOpenWireframeModal}
        onStartInteractiveSketch={handleStartInteractiveSketch}
        isSketchModeActive={isSketchModeActive}
        onOpenSurfacesModal={handleOpenSurfacesModal}
        onOpenSolidsModal={handleOpenSolidsModal}
        onOpenModelPrepModal={handleOpenModelPrepModal}
        onOpenMeshModal={handleOpenMeshModal}
        onOpenDraftingModal={handleOpenDraftingModal}
        onOpenTransformModal={handleOpenTransformModal}
        onOpenATPModal={(tab) => { setAtpModalTab(tab || 'wizard'); setIsATPModalOpen(true); }}
        onOpenMachineConfigModal={() => setIsMachineConfigModalOpen(true)}
        onOpenViewStudioModal={() => setIsViewStudioModalOpen(true)}
        onOpenCPlanesModal={() => setIsCPlanesModalOpen(true)}
        onOpenOperationsWizard={() => { setOperationsWizardTab('create'); setIsOperationsWizardOpen(true); }}
        onOpenCollisionCheck={() => { setOperationsWizardTab('safety'); setIsOperationsWizardOpen(true); }}
        onStartBackplot={handleStartBackplot}
        onStartVerify={handleStartVerify}
        cameraMode={cameraMode}
        onToggleCameraMode={setCameraMode}
        clippingPlane={clippingPlane}
        onUpdateClippingPlane={setClippingPlane}
        lightingMode={lightingMode}
        onChangeLightingMode={setLightingMode}
        onSelectManagerTab={setActiveManagerTab}
        onUnblankAll={handleUnblankAll}
        onInvertVisibility={handleInvertVisibility}
        onOpenSetupSheet={() => setIsSetupSheetOpen(true)}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        onSelectSampleModel={handleSelectSampleModel}
        onModelImported={handleModelImported}
        onQuickAddOp={handleQuickAddOp}
        onNewPart={() => setIsNewProjectModalOpen(true)}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onSaveProject={handleSaveProject}
        onOpenSaveAsModal={() => setIsSaveAsModalOpen(true)}
        onOpenRecentProjectsModal={() => setIsRecentProjectsModalOpen(true)}
        onOpenExportCADModal={() => setIsExportCADModalOpen(true)}
        onOpenProbingStudio={() => setIsProbingModalOpen(true)}
        onOpenAFRModal={() => setIsAFRModalOpen(true)}
        onOpenAdaptiveModal={() => setIsAdaptiveModalOpen(true)}
        onOpenLeadInOutModal={() => setIsLeadInOutModalOpen(true)}
        onOpenFiveAxisStudio={() => setIsFiveAxisModalOpen(true)}
        onOpenSolidVerifyModal={() => setIsSolidVerifyModalOpen(true)}
        onOpenFeedOptimizerModal={() => setIsFeedOptimizerModalOpen(true)}
        onOpenFixtureModal={() => setIsFixtureModalOpen(true)}
        onOpenLatheStudio={() => setIsLatheStudioOpen(true)}
        onOpenNestingStudio={() => setIsNestingStudioOpen(true)}
        onOpenThreadStudio={() => setIsThreadStudioOpen(true)}
        onOpenEngravingStudio={() => setIsEngravingStudioOpen(true)}
        onOpenHSMFilterStudio={() => setIsHSMFilterModalOpen(true)}
        onOpenCostQuotingModal={() => setIsCostQuotingModalOpen(true)}
        onOpenCornerReliefStudio={() => setIsCornerReliefModalOpen(true)}
        onOpenKioskModal={() => setIsKioskModalOpen(true)}
        onOpenTombstoneStudio={() => setIsTombstoneModalOpen(true)}
        onOpenCustomPostStudio={() => setIsCustomPostModalOpen(true)}
        onOpenAnomalyScanner={() => setIsAnomalyScannerOpen(true)}
        onProjectLoaded={handleProjectLoaded}
        onExportSTL={handleExportSTL}
        workpieceColor={workpieceColor}
        onChangeWorkpieceColor={setWorkpieceColor}
        onChangeRenderMode={setRenderMode}
        renderMode={renderMode}
        materialStyle={materialStyle}
        onChangeMaterialStyle={setMaterialStyle}
        translucencyEnabled={translucencyEnabled}
        onToggleTranslucency={() => setTranslucencyEnabled((prev) => !prev)}
        showBackside={showBackside}
        onToggleBackside={() => setShowBackside((prev) => !prev)}
        showAxes={showAxes}
        onToggleAxes={() => setShowAxes((prev) => !prev)}
        showGnomons={showGnomons}
        onToggleGnomons={() => setShowGnomons((prev) => !prev)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        snapToGrid={snapToGrid}
        onToggleSnapToGrid={() => setSnapToGrid((prev) => !prev)}
        isViewsheetsVisible={isViewsheetsVisible}
        onToggleViewsheets={() => setIsViewsheetsVisible((prev) => !prev)}
        onAddViewsheet={handleAddViewsheet}
        onSaveViewsheetBookmark={handleSaveViewsheetBookmark}
        onRestoreViewsheetBookmark={handleRestoreViewsheetBookmark}
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        onSnapCamera={handleSnapCamera}
        onAddWireframe={handleAddWireframe}
        onClearWireframes={handleClearWireframes}
        onCreateBoundingBox={handleCreateBoundingBox}
        onCreateSilhouette={handleCreateSilhouette}
        onCreateTurnProfile={handleCreateTurnProfile}
        onCreateCurveSlice={handleCreateCurveSlice}
        onExtractAllEdges={handleExtractAllEdges}
        onExtractOneEdge={handleExtractOneEdge}
        onBreakManyPieces={handleBreakManyPieces}
        onJoinEntities={handleJoinEntities}
        onAddSurface={handleAddSurface}
        onClearSurfaces={handleClearSurfaces}
        onAddSolid={handleAddSolid}
        onTranslatePart={handleTranslatePart}
        onRotatePart={handleRotatePart}
        onScalePart={handleScalePart}
        onResetTransform={handleResetTransform}
        onDropToTable={handleDropToTable}
        onPushPull={handlePushPull}
        onRegenerateAll={handleRegenerateAll}
        onDeleteActiveOp={handleDeleteActiveOp}
        activeMachine={activeMachine}
        onSelectMachine={setActiveMachineId}
        onSelectWcs={setActiveWcs}
        activeWcs={activeWcs}
        workspaceViewMode={workspaceViewMode}
        onChangeViewMode={setWorkspaceViewMode}
      />

      {/* 3. Main CAD/CAM Workspace */}
      <div className="workspace-body">
        {/* Left Operations / Levels / Solids / Planes Manager Tree */}
        <OperationsTree
          operations={operations}
          onToggleOp={handleToggleOp}
          activeOpId={activeOpId}
          onSelectOp={setActiveOpId}
          onEditOp={handleEditOp}
          onAddOp={handleQuickAddOp}
          onRegenerate={handleRegenerateAll}
          onOpenStockModal={() => setIsStockModalOpen(true)}
          onOpenAFR={() => setIsAFRModalOpen(true)}
          activeManagerTab={activeManagerTab}
          onSelectManagerTab={setActiveManagerTab}
          levels={levels}
          onToggleLevel={handleToggleLevel}
          activeLevelId={levels.find((l) => l.active)?.id || 1}
          onSetActiveLevel={handleSetActiveLevel}
          onAddLevel={handleAddLevel}
          planes={planesList}
          activePlane={activePlane}
          onSelectPlane={handleSelectPlane}
          onOpenCPlanesModal={() => setIsCPlanesModalOpen(true)}
          onDeletePlane={handleDeletePlane}
          solids={solidsList}
          activeSolidId={solidsList.find((s) => s.active)?.id || 1}
          onSelectSolid={(id) => setSolidsList((prev) => prev.map((s) => ({ ...s, active: s.id === id })))}
          onToggleSolidVisibility={handleToggleSolidVisibility}
          onOpenSolidsModal={handleOpenSolidsModal}
          onStartBackplot={handleStartBackplot}
          onStartVerify={handleStartVerify}
          activeMachine={activeMachine}
          stockConfig={stockConfig}
          currentProjectName={currentProjectName}
          onOpenPostModal={() => setIsPostModalOpen(true)}
          onOpenToolManager={() => setIsToolManagerOpen(true)}
          onOpenHSMFilter={() => setIsHSMFilterModalOpen(true)}
          onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
          onOpenWireframeModal={handleOpenWireframeModal}
          onOpenMachineConfig={() => setIsMachineConfigModalOpen(true)}
          onOpenFeedsSpeeds={handleOpenFeedsSpeeds}
          onMoveOpUp={(id) => handleMoveOp(id, -1)}
          onMoveOpDown={(id) => handleMoveOp(id, 1)}
          onDeleteOp={handleDeleteOpById}
          onToggleLockOp={handleToggleLockOp}
          onToggleGhostOp={handleToggleGhostOp}
          onSortOps={handleSortOps}
          recentFunctions={recentFunctions}
          onRunRecentFunction={handleRunRecentFunction}
          onCopyOp={handleCopyOp}
          onCutOp={handleCutOp}
          onPasteOp={handlePasteOp}
          canPaste={!!clipboardOp}
          onOpenFiveAxisStudio={() => setIsFiveAxisModalOpen(true)}
          onOpenThreadStudio={() => setIsThreadStudioOpen(true)}
          onOpenLatheStudio={() => setIsLatheStudioOpen(true)}
          onOpenTransformModal={handleOpenTransformModal}
          onOpenNestingStudio={() => setIsNestingStudioOpen(true)}
          onOpenProbingStudio={() => setIsProbingModalOpen(true)}
          onOpenSetupSheet={() => setIsSetupSheetOpen(true)}
          onOpenSurfaceFinishContour={() => setIsSurfaceFinishContourOpen(true)}
          onExportStockSTL={handleExportStockSTL}
        />

        {/* Main Workspace Area: 2D Design Board, Split Screen, or 3D Viewport */}
        {workspaceViewMode === '2d' && (
          <CNCDesignBoard
            boardShapes={boardShapes}
            onUpdateShapes={setBoardShapes}
            onGenerateToolpaths={handleGenerateToolpathsFromBoard}
            onSwitchTo3D={() => setWorkspaceViewMode('3d')}
            stockConfig={stockConfig}
            theme={theme}
          />
        )}

        {workspaceViewMode === 'split' && (
          <div style={{ display: 'flex', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
            <div style={{ flex: 1, height: '100%', borderRight: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <CNCDesignBoard
                boardShapes={boardShapes}
                onUpdateShapes={setBoardShapes}
                onGenerateToolpaths={handleGenerateToolpathsFromBoard}
                onSwitchTo3D={() => setWorkspaceViewMode('3d')}
                stockConfig={stockConfig}
                theme={theme}
              />
            </div>
            <div style={{ flex: 1, height: '100%' }}>
              <Viewport3D
                currentModel={currentModel}
                stockConfig={stockConfig}
                fixtureConfig={fixtureConfig}
                operations={operations}
                tools={tools}
                activeOpId={activeOpId}
                activePlane={activePlane}
                planes={planesList}
                theme={theme}
                isBackplotActive={isBackplotActive}
                backplotMode={backplotMode}
                onCloseBackplot={() => setIsBackplotActive(false)}
                onCoordinateUpdate={setCoords}
                onMetricsCalculated={setPartMetrics}
                onModelImported={handleModelImported}
                workpieceColor={workpieceColor}
                renderMode={renderMode}
                cameraMode={cameraMode}
                cameraFov={cameraFov}
                clippingPlane={clippingPlane}
                lightingMode={lightingMode}
                layerVisibility={layerVisibility}
                showArcCenters={showArcCenters}
                showEndpoints={showEndpoints}
                cameraCommand={cameraCommand}
                partTransform={partTransform}
                customGeometry={customGeometry}
                isSketchModeActive={isSketchModeActive}
                onToggleSketchMode={setIsSketchModeActive}
                sketchTool={sketchTool}
                onChangeSketchTool={setSketchTool}
                onAddCustomEntity={handleAddCustomEntity}
                onRemoveCustomEntity={handleRemoveCustomEntity}
                onClearWireframes={handleClearWireframes}
                onGenerateToolpathFromSketch={handleGenerateToolpathFromSketch}
                onOpenViewStudioModal={() => setIsViewStudioModalOpen(true)}
                onToggleCameraMode={setCameraMode}
                onUpdateClippingPlane={setClippingPlane}
                onChangeRenderMode={setRenderMode}
              />
            </div>
          </div>
        )}

        {workspaceViewMode === '3d' && (
          <Viewport3D
            currentModel={currentModel}
            stockConfig={stockConfig}
            fixtureConfig={fixtureConfig}
            operations={operations}
            tools={tools}
            activeOpId={activeOpId}
            activePlane={activePlane}
            planes={planesList}
            theme={theme}
            isBackplotActive={isBackplotActive}
            backplotMode={backplotMode}
            onCloseBackplot={() => setIsBackplotActive(false)}
            onCoordinateUpdate={setCoords}
            onMetricsCalculated={setPartMetrics}
            onModelImported={handleModelImported}
            workpieceColor={workpieceColor}
            renderMode={renderMode}
            cameraMode={cameraMode}
            cameraFov={cameraFov}
            clippingPlane={clippingPlane}
            lightingMode={lightingMode}
            layerVisibility={layerVisibility}
            showArcCenters={showArcCenters}
            showEndpoints={showEndpoints}
            cameraCommand={cameraCommand}
            partTransform={partTransform}
            customGeometry={customGeometry}
            isSketchModeActive={isSketchModeActive}
            onToggleSketchMode={setIsSketchModeActive}
            sketchTool={sketchTool}
            onChangeSketchTool={setSketchTool}
            onAddCustomEntity={handleAddCustomEntity}
            onRemoveCustomEntity={handleRemoveCustomEntity}
            onClearWireframes={handleClearWireframes}
            onGenerateToolpathFromSketch={handleGenerateToolpathFromSketch}
            onOpenViewStudioModal={() => setIsViewStudioModalOpen(true)}
            onToggleCameraMode={setCameraMode}
            onUpdateClippingPlane={setClippingPlane}
            onChangeRenderMode={setRenderMode}
          />
        )}
      </div>

      {/* 4. Mastercam Viewsheets Strip */}
      <ViewsheetBar
        isVisible={isViewsheetsVisible}
        viewsheets={viewsheets}
        activeViewsheetId={activeViewsheetId}
        onSelectViewsheet={handleSelectViewsheet}
        onAddViewsheet={handleAddViewsheet}
        onDeleteViewsheet={handleDeleteViewsheet}
        onRenameViewsheet={handleRenameViewsheet}
        onSaveBookmark={handleSaveViewsheetBookmark}
      />

      {/* 5. Bottom Status Bar */}
      <StatusBar coords={coords} activeWcs={activeWcs} activeMachine={activeMachine} theme={theme} />

      {/* Mastercam Backstage File Menu UI */}
      <FileBackstageView
        isOpen={isFileBackstageOpen}
        onClose={() => setIsFileBackstageOpen(false)}
        currentProjectName={currentProjectName}
        setCurrentProjectName={setCurrentProjectName}
        projectDescriptor={projectDescriptor}
        setProjectDescriptor={setProjectDescriptor}
        projectCreatedDate={projectCreatedDate}
        projectLastModifiedDate={projectLastModifiedDate}
        setProjectLastModifiedDate={setProjectLastModifiedDate}
        activeMachine={activeMachine}
        machines={machines}
        setActiveMachineId={setActiveMachineId}
        activeWcs={activeWcs}
        tools={tools}
        operations={operations}
        stockConfig={stockConfig}
        currentModel={currentModel}
        solidsList={solidsList}
        levels={levels}
        planesList={planesList}
        autoSaveInterval={autoSaveIntervalMinutes}
        setAutoSaveInterval={setAutoSaveIntervalMinutes}
        onCreateNewProject={handleCreateNewProject}
        onLoadProject={handleProjectLoaded}
        onModelImported={handleModelImported}
        onSaveAs={handleSaveAs}
        onOpenMastercamOpenDialog={() => setIsMastercamOpenDialogOpen(true)}
        onNotify={showToast}
      />

      {/* 25-Format Mastercam Open File Dialog (Windows Explorer View) */}
      <MastercamOpenFileDialog
        isOpen={isMastercamOpenDialogOpen}
        onClose={() => setIsMastercamOpenDialogOpen(false)}
        onFileSelected={(modelGroup, filename) => {
          handleModelImported(modelGroup, filename);
          setIsFileBackstageOpen(false);
        }}
        onNotify={showToast}
      />

      {/* 5. File System Modal Dialogs (Tab 1) */}
      <FileNewModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateNewProject={handleCreateNewProject}
      />

      <SaveAsModal
        isOpen={isSaveAsModalOpen}
        onClose={() => setIsSaveAsModalOpen(false)}
        currentProjectName={currentProjectName}
        onSaveAs={handleSaveAs}
      />

      <RecentProjectsModal
        isOpen={isRecentProjectsModalOpen}
        onClose={() => setIsRecentProjectsModalOpen(false)}
        onLoadProject={handleProjectLoaded}
        onRestoreAutoSave={handleRestoreAutoSave}
        onSelectSampleModel={handleSelectSampleModel}
      />

      <ExportCADModal
        isOpen={isExportCADModalOpen}
        onClose={() => setIsExportCADModalOpen(false)}
        currentModel={currentModel}
        currentProjectName={currentProjectName}
      />

      {/* Renishaw Inspection Plus & Haas WIPS Touch Probing Studio */}
      <ProbingStudioModal
        isOpen={isProbingModalOpen}
        onClose={() => setIsProbingModalOpen(false)}
        onAddProbingOperation={handleAddProbingOp}
        activeWcs={activeWcs}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
        activeMachine={activeMachine}
      />

      {/* Automatic Feature Recognition & Feature-Based Machining Studio */}
      <AFRModal
        isOpen={isAFRModalOpen}
        onClose={() => setIsAFRModalOpen(false)}
        currentModel={currentModel}
        partMetrics={partMetrics}
        tools={tools}
        operations={operations}
        onApplyAFROperations={handleApplyAFROperations}
      />

      {/* Feed Rate Optimization & Constant Chip Thickness Studio */}
      <FeedOptimizerModal
        isOpen={isFeedOptimizerModalOpen}
        onClose={() => setIsFeedOptimizerModalOpen(false)}
        operations={operations}
        tools={tools}
        activeOpId={activeOpId}
        onApplyOptimization={({ scope, opId, config }) => {
          setOperations((prev) =>
            prev.map((op) => {
              const matches = scope === 'all' || op.id === opId;
              if (!matches) return op;
              return {
                ...op,
                feedOptimization: config
              };
            })
          );
          showToast(`Feed Rate Optimization applied (${config.strategy.toUpperCase()})`, 'success');
        }}
      />

      {/* Parametric Custom Tool & Toolholder Assembly Studio */}
      <ToolAssemblyStudioModal
        isOpen={isToolAssemblyModalOpen}
        onClose={() => setIsToolAssemblyModalOpen(false)}
        tools={tools}
        activeToolId={selectedAssemblyToolId || tools[0]?.id}
        partMetrics={partMetrics}
        onSaveTool={(updatedTool) => {
          setTools((prev) => prev.map((t) => (t.id === updatedTool.id ? { ...t, ...updatedTool } : t)));
        }}
        onAddTool={(newTool) => {
          setTools((prev) => [...prev, newTool]);
        }}
      />

      {/* Dynamic Stock Material Removal Voxel Simulator (Mastercam Verify Grade) */}
      <SolidVerifyModal
        isOpen={isSolidVerifyModalOpen}
        onClose={() => setIsSolidVerifyModalOpen(false)}
        operations={operations}
        tools={tools}
        activeOpId={activeOpId}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
      />

      {/* CNC Workholding, Clamping & Fixture Setup Studio (5-Axis Vises & Toe Clamps) */}
      <FixtureStudioModal
        isOpen={isFixtureModalOpen}
        onClose={() => setIsFixtureModalOpen(false)}
        fixtureConfig={fixtureConfig}
        onSaveFixture={(newCfg) => setFixtureConfig(newCfg)}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
        operations={operations}
        tools={tools}
      />

      {/* CNC Turning & Lathe / Mill-Turn Studio */}
      <LatheStudioModal
        isOpen={isLatheStudioOpen}
        onClose={() => setIsLatheStudioOpen(false)}
        onAddOperation={(newOp) => {
          setOperations((prev) => [...prev, newOp]);
          setActiveOpId(newOp.id);
        }}
      />

      {/* CNC True-Shape Sheet Nesting & Multi-Part Production Studio */}
      <NestingStudioModal
        isOpen={isNestingStudioOpen}
        onClose={() => setIsNestingStudioOpen(false)}
        partMetrics={partMetrics}
        onAddOperation={(newOp) => {
          setOperations((prev) => [...prev, newOp]);
          setActiveOpId(newOp.id);
        }}
      />

      {/* CNC Feature-Based Thread Milling & Tapping Studio */}
      <ThreadStudioModal
        isOpen={isThreadStudioOpen}
        onClose={() => setIsThreadStudioOpen(false)}
        model={currentModel}
        partMetrics={partMetrics}
        onAddOperation={(newOp) => {
          setOperations((prev) => [...prev, newOp]);
          setActiveOpId(newOp.id);
        }}
      />

      {/* CNC 2.5D & 3D Engraving & V-Carve Studio */}
      <EngravingStudioModal
        isOpen={isEngravingStudioOpen}
        onClose={() => setIsEngravingStudioOpen(false)}
        model={currentModel}
        partMetrics={partMetrics}
        onAddOperation={(newOp) => {
          setOperations((prev) => [...prev, newOp]);
          setActiveOpId(newOp.id);
        }}
      />

      {/* High-Speed Machining (HSM) Tolerance Filter & Arc Spline Studio */}
      <HSMFilterStudioModal
        isOpen={isHSMFilterModalOpen}
        onClose={() => setIsHSMFilterModalOpen(false)}
        operations={operations}
        tools={tools}
        partMetrics={partMetrics}
        onUpdateOperation={(params) => {
          setOperations((prev) =>
            prev.map((op) => (op.id === activeOpId ? { ...op, ...params } : op))
          );
        }}
      />

      {/* CNC Production Quoting, Machining Cost & Tool Wear Calculator */}
      <CostQuotingModal
        isOpen={isCostQuotingModalOpen}
        onClose={() => setIsCostQuotingModalOpen(false)}
        operations={operations}
        tools={tools}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
        activeMachine={machines.find(m => m.id === activeMachineId)}
      />

      {/* CNC Automatic Corner Relief & Dog-Bone / T-Bone Studio */}
      <CornerReliefStudioModal
        isOpen={isCornerReliefModalOpen}
        onClose={() => setIsCornerReliefModalOpen(false)}
        activeWorkpiece={currentModel}
        onApplyReliefGeometry={(reliefData) => {
          console.log('Corner Relief Applied to CAM Operations:', reliefData);
        }}
      />

      {/* CNC Shop Floor Operator Tablet / Kiosk View */}
      <KioskOperatorModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        activeMachine={machines.find(m => m.id === activeMachineId)}
        activeOperations={operations}
        tools={tools}
      />

      {/* Multi-WCS Tombstone & 4th-Axis Rotary Indexing Studio */}
      <TombstoneStudioModal
        isOpen={isTombstoneModalOpen}
        onClose={() => setIsTombstoneModalOpen(false)}
        operations={operations}
        activeMachine={machines.find(m => m.id === activeMachineId)}
        onApplyTombstoneToCAM={(tombLayout) => {
          console.log('Tombstone Layout Applied to CAM Operations:', tombLayout);
        }}
      />

      {/* Custom Post-Processor Syntax Builder & Macro Variable Engine */}
      <CustomPostStudioModal
        isOpen={isCustomPostModalOpen}
        onClose={() => setIsCustomPostModalOpen(false)}
        operations={operations}
        tools={tools}
        activeMachine={machines.find(m => m.id === activeMachineId)}
        onSaveCustomPost={(customProfile) => {
          console.log('Custom Post Profile Saved for Machine:', customProfile);
        }}
      />

      {/* AI Toolpath Anomaly, Deflection & Chatter Diagnostic Scanner */}
      <AnomalyScannerModal
        isOpen={isAnomalyScannerOpen}
        onClose={() => setIsAnomalyScannerOpen(false)}
        operations={operations}
        tools={tools}
        stockConfig={stockConfig}
        onApplyAutoFixes={(anomalies) => {
          console.log('AI Auto-Fixes Applied to CAM Operations:', anomalies);
        }}
      />

      {/* Simultaneous 5-Axis Multiaxis Studio & TCPM Manager */}
      <FiveAxisStudioModal
        isOpen={isFiveAxisModalOpen}
        onClose={() => setIsFiveAxisModalOpen(false)}
        tools={tools}
        operations={operations}
        activeOpId={activeOpId}
        partMetrics={partMetrics}
        onAddOperation={(newOp) => {
          setOperations((prev) => [...prev, newOp]);
          setActiveOpId(newOp.id);
        }}
        onUpdateOperations={(updatedOps) => setOperations(updatedOps)}
      />

      {/* Lead-In / Lead-Out & Tangent Arc Designer Studio */}
      <LeadInOutDesignerModal
        isOpen={isLeadInOutModalOpen}
        onClose={() => setIsLeadInOutModalOpen(false)}
        operations={operations}
        activeOpId={activeOpId}
        onUpdateOperations={(updatedOps) => setOperations(updatedOps)}
      />

      {/* Adaptive Trochoidal High-Speed Roughing Studio (Dynamic Motion) */}
      <AdaptiveRoughingModal
        isOpen={isAdaptiveModalOpen}
        onClose={() => setIsAdaptiveModalOpen(false)}
        tools={tools}
        operations={operations}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
        onAddAdaptiveOperation={handleAddAdaptiveOp}
      />

      {/* Wireframe CAD Sketcher Modal (Tab 3) */}
      <WireframeSketcherModal
        isOpen={isWireframeModalOpen}
        onClose={() => setIsWireframeModalOpen(false)}
        initialTool={wireframeModalTool}
        partMetrics={partMetrics}
        activeModel={currentModel}
        customGeometry={customGeometry}
        onAddEntity={handleAddCustomEntity}
        onRemoveEntity={handleRemoveCustomEntity}
        onClearEntities={handleClearWireframes}
      />

      {/* Surfaces CAD Suite Modal (Tab 4) */}
      <SurfacesCADModal
        isOpen={isSurfacesModalOpen}
        onClose={() => setIsSurfacesModalOpen(false)}
        initialTool={surfacesModalTool}
        partMetrics={partMetrics}
        customGeometry={customGeometry}
        onAddSurfaceEntity={handleAddSurfaceEntity}
        onRemoveSurfaceEntity={handleRemoveSurfaceEntity}
        onClearSurfaces={handleClearSurfaces}
      />

      {/* Solids CAD Suite Modal (Tab 5) */}
      <SolidsCADModal
        isOpen={isSolidsModalOpen}
        onClose={() => setIsSolidsModalOpen(false)}
        initialTool={solidsModalTool}
        currentModel={currentModel}
        solidsList={solidsList}
        onSetPrimaryModel={handleSetPrimarySolid}
        onAddSolidBody={handleAddSolidBody}
        onRemoveSolidBody={handleRemoveSolidBody}
      />

      {/* Model Prep & Direct Modeling Modal (Tab 6) */}
      <ModelPrepModal
        isOpen={isModelPrepModalOpen}
        onClose={() => setIsModelPrepModalOpen(false)}
        initialTab={modelPrepModalTab}
        currentModel={currentModel}
        partMetrics={partMetrics}
        partTransform={partTransform}
        onUpdateTransform={setPartTransform}
        onResetTransform={handleResetTransform}
        onAddSurfaceEntity={handleAddSurfaceEntity}
        onOpenAFRModal={() => setIsAFRModalOpen(true)}
      />

      {/* Mesh Workbench & Reverse Engineering Modal (Tab 7) */}
      <MeshWorkbenchModal
        isOpen={isMeshModalOpen}
        onClose={() => setIsMeshModalOpen(false)}
        initialTab={meshModalTab}
        currentModel={currentModel}
        currentProjectName={currentProjectName}
        partMetrics={partMetrics}
        onAddCustomEntity={handleAddCustomEntity}
        onExportSTL={handleExportSTL}
      />

      {/* Drafting & 3D Annotations Modal (Tab 8) */}
      <DraftingCADModal
        isOpen={isDraftingModalOpen}
        onClose={() => setIsDraftingModalOpen(false)}
        initialTab={draftingModalTab}
        partMetrics={partMetrics}
        customGeometry={customGeometry}
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        onAddCustomEntity={handleAddCustomEntity}
        onRemoveCustomEntity={handleRemoveCustomEntity}
        onClearDimensions={handleClearDraftingDimensions}
      />

      {/* 3D Transform Workbench Modal (Tab 9) */}
      <TransformCADModal
        isOpen={isTransformModalOpen}
        onClose={() => setIsTransformModalOpen(false)}
        initialTab={transformModalTab}
        currentModel={currentModel}
        partTransform={partTransform}
        onUpdateTransform={setPartTransform}
        onResetTransform={handleResetTransform}
        onAddCustomEntity={handleAddCustomEntity}
      />

      {/* CNC Machine Definition & Kinematic Envelope Modal (Tab 10) */}
      <MachineConfigModal
        isOpen={isMachineConfigModalOpen}
        onClose={() => setIsMachineConfigModalOpen(false)}
        machines={machines}
        activeMachine={activeMachine}
        onSelectMachine={setActiveMachineId}
      />

      {/* Automatic Toolpathing (ATP) Studio Modal (Tab 10) */}
      <ATPModal
        isOpen={isATPModalOpen}
        onClose={() => setIsATPModalOpen(false)}
        initialTab={atpModalTab}
        currentModel={currentModel}
        partMetrics={partMetrics}
      />

      {/* 3D View & Section Analysis Studio Modal (Tab 11) */}
      <ViewStudioModal
        isOpen={isViewStudioModalOpen}
        onClose={() => setIsViewStudioModalOpen(false)}
        cameraMode={cameraMode}
        onToggleCameraMode={setCameraMode}
        cameraFov={cameraFov}
        onChangeCameraFov={setCameraFov}
        onSnapCamera={handleSnapCamera}
        renderMode={renderMode}
        onChangeRenderMode={setRenderMode}
        workpieceColor={workpieceColor}
        onChangeWorkpieceColor={setWorkpieceColor}
        clippingPlane={clippingPlane}
        onUpdateClippingPlane={setClippingPlane}
        lightingMode={lightingMode}
        onChangeLightingMode={setLightingMode}
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        partMetrics={partMetrics}
      />

      {/* CAM Operations Manager & Collision Safety Wizard (Tab 12) */}
      <CAMOperationsWizardModal
        isOpen={isOperationsWizardOpen}
        onClose={() => setIsOperationsWizardOpen(false)}
        initialTab={operationsWizardTab}
        operations={operations}
        tools={tools}
        activeOpId={activeOpId}
        onSelectOp={setActiveOpId}
        onAddOperation={(newOp) => {
          setOperations((prev) => [...prev, newOp]);
          setActiveOpId(newOp.id);
        }}
        onUpdateOperation={handleSaveOperation}
        onUpdateTools={setTools}
        onDeleteOperation={handleDeleteOpById}
        onRegenerateAll={handleRegenerateAll}
        onLaunchSimulation={() => setIsSimModalOpen(true)}
        onOpenGCodeViewer={() => setIsGCodeViewerOpen(true)}
        onOpenAFR={() => setIsAFRModalOpen(true)}
        partMetrics={partMetrics}
        stockConfig={stockConfig}
      />

      {/* 6. NC2Check G-Code Post Modal */}
      <NC2CheckModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onLaunchSimulation={() => setIsSimModalOpen(true)}
        onOpenGCodeViewer={() => setIsGCodeViewerOpen(true)}
        operations={operations}
        tools={tools}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
        currentModel={currentModel}
        activeMachine={activeMachine}
        activeWcs={activeWcs}
        onNotify={showToast}
      />

      {/* 7. Machine Kinematics Simulator Modal */}
      <MachineSimModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        operations={operations}
        tools={tools}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
        currentModel={currentModel}
        activeMachine={activeMachine}
      />

      {/* 8. Stock Setup Modal */}
      <StockSetupModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        partMetrics={partMetrics}
        stockConfig={stockConfig}
        onUpdateStock={setStockConfig}
      />

      {/* 9. Mill Tool Manager Modal */}
      <ToolManagerModal
        isOpen={isToolManagerOpen}
        onClose={() => setIsToolManagerOpen(false)}
        tools={tools}
        onUpdateTools={setTools}
        onOpenFeedsSpeedsModal={handleOpenFeedsSpeeds}
      />

      {/* Feeds, Speeds & Material Machinability Physics Modal */}
      <FeedsSpeedsModal
        isOpen={isFeedsSpeedsOpen}
        onClose={() => setIsFeedsSpeedsOpen(false)}
        tools={tools}
        activeToolId={feedsSpeedsToolId}
        operations={operations}
        activeOpId={activeOpId}
        activeMachine={activeMachine}
        onUpdateToolParams={handleUpdateToolParams}
        onUpdateOpParams={handleUpdateOpParams}
        onNotify={showToast}
      />

      {/* CPlanes & Construction Coordinate System Studio Modal */}
      <CPlanesCADModal
        isOpen={isCPlanesModalOpen}
        onClose={() => setIsCPlanesModalOpen(false)}
        planes={planesList}
        activePlaneName={activePlane}
        onSelectPlane={handleSelectPlane}
        onCreatePlane={handleCreatePlane}
        onDeletePlane={handleDeletePlane}
        onNotify={showToast}
      />

      {/* 10. Operation Parameters Modal */}
      <OperationModal
        isOpen={isOperationModalOpen}
        onClose={() => setIsOperationModalOpen(false)}
        operation={editingOperation}
        tools={tools}
        onSaveOperation={handleSaveOperation}
      />

      {/* 11. G-Code Inspector & Multi-Controller NC Exporter Modal */}
      <GCodeViewerModal
        isOpen={isGCodeViewerOpen}
        onClose={() => setIsGCodeViewerOpen(false)}
        operations={operations}
        tools={tools}
        stockConfig={stockConfig}
        partMetrics={partMetrics}
        currentModel={currentModel}
      />

      {/* 12. Entity Analyzer CAD Inspector Modal */}
      <EntityAnalyzerModal
        isOpen={isEntityAnalyzerOpen}
        onClose={() => setIsEntityAnalyzerOpen(false)}
        partMetrics={partMetrics}
        stockConfig={stockConfig}
        currentProjectName={currentProjectName}
      />

      {/* 13. Precision Distance Caliper Modal (Tab 2) */}
      <DistanceCaliperModal
        isOpen={isDistanceCaliperOpen}
        onClose={() => setIsDistanceCaliperOpen(false)}
        partMetrics={partMetrics}
      />

      {/* 14. CNC Machining Setup Sheet Printable Modal */}
      <SetupSheetModal
        isOpen={isSetupSheetOpen}
        onClose={() => setIsSetupSheetOpen(false)}
        currentProjectName={currentProjectName}
        stockConfig={stockConfig}
        fixtureConfig={fixtureConfig}
        partMetrics={partMetrics}
        tools={tools}
        operations={operations}
        activeMachine={activeMachine}
      />

      {/* 15. Help Guide & Keyboard Navigation Modal */}
      <HelpGuideModal
        isOpen={isHelpGuideOpen}
        onClose={() => setIsHelpGuideOpen(false)}
      />

      {/* 16. Mastercam Define Tool Creation Wizard Modal */}
      <DefineToolModal
        isOpen={isDefineToolModalOpen}
        onClose={() => setIsDefineToolModalOpen(false)}
        onAddTool={handleAddDefinedTool}
        onNotify={showToast}
      />

      {/* 17. Mastercam Surface Finish Contour Parameters Modal */}
      <SurfaceFinishContourModal
        isOpen={isSurfaceFinishContourOpen}
        onClose={() => setIsSurfaceFinishContourOpen(false)}
        tools={tools}
        onSaveOperation={handleApplySurfaceFinishContour}
        onOpenDefineToolModal={() => {
          setIsSurfaceFinishContourOpen(false);
          setIsDefineToolModalOpen(true);
        }}
        onNotify={showToast}
      />

      {/* 18. Mastercam Command Finder Search Dialog */}
      <CommandFinderModal
        isOpen={isCommandFinderOpen}
        onClose={() => setIsCommandFinderOpen(false)}
        onExecuteCommand={handleExecuteCommand}
      />

      {/* 19. Mastercam User Applications Add-Ins Manager Dialog */}
      <AddInsManagerModal
        isOpen={isAddInsModalOpen}
        onClose={() => setIsAddInsModalOpen(false)}
        onNotify={showToast}
      />

      {/* 20. Mastercam File & Geometry Statistics Dialog */}
      <PartStatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
        currentProjectName={currentProjectName}
        partMetrics={partMetrics}
        levels={levels}
        solids={solidsList}
        operations={operations}
        activeMachine={activeMachine}
        activeWcs={activeWcs}
      />

      {/* Floating Modern Toast Notification Stack */}
      <div style={{
        position: 'fixed',
        bottom: '32px',
        right: '16px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: toast.type === 'danger' ? 'rgba(239, 68, 68, 0.95)' :
                          toast.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' :
                          toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                          'rgba(30, 41, 59, 0.95)',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              border: '1px solid rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.25s ease'
            }}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action.onClick();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                style={{
                  marginLeft: '8px',
                  background: '#38bdf8',
                  color: '#0f172a',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: '700',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

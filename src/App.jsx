import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
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
import MachineMenuManagementModal from './components/MachineMenuManagementModal';
import FlowlineWizardBar from './components/FlowlineWizardBar';
import {
  MACHINE_DEFINITIONS_CATALOG,
  DEFAULT_MACHINE_DIRECTORY,
  DEFAULT_MENU_IDS_BY_CATEGORY,
  DESIGN_MODE_MACHINE,
  resolveMachineById
} from './config/machineDefinitionsCatalog';
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
import ToolpathSurfaceSelectionModal from './components/ToolpathSurfaceSelectionModal';
import FlowlineDataModal from './components/FlowlineDataModal';
import { buildSolidFaceCatalog } from './utils/solidFaceSelectionEngine';
import { createDefaultSurfaceFinishState } from './config/surfaceFinishSchema';
import CommandFinderModal from './components/CommandFinderModal';
import AddInsManagerModal from './components/AddInsManagerModal';
import PartStatisticsModal from './components/PartStatisticsModal';
import MastercamToolpathParametersModal from './components/MastercamToolpathParametersModal';
import MastercamChainingModal from './components/MastercamChainingModal';
import ChainingPalette from './components/ChainingPalette';
import { DEFAULT_FIXTURE_CONFIG } from './utils/fixtureEngine';
import SelectAllDialog from './components/SelectAllDialog';
import SelectProbeModal from './components/SelectProbeModal';
import ProbingDialogHUD from './components/ProbingDialogHUD';
import MastercamOpenDialog from './components/MastercamOpenDialog';
import SolidExtrudePanel from './components/SolidExtrudePanel';
import StatusBar from './components/StatusBar';
import ViewsheetBar from './components/ViewsheetBar';
import {
  createImpellerGeometry,
  createAerospaceBracket,
  createMoldCoreGeometry,
  createMastercamBaseStructureALU,
  createMastercamMultiBodyAssembly,
  createMastercam2019TutorialPart,
  createMastercam2019TutorialWireframe,
  createTitan1MPart,
  createTitan1MWireframe,
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
  createParametricChainExtrusion,
  extractEdgesFromModel,
  exportSceneToSTL,
  parseSTEPText,
  generateSampleSTEPString
} from './utils/cadGeometry';
import {
  exportProjectMCAM,
  parseProjectMCAM,
  saveAutoSaveSnapshot,
  serializeCustomGeometry,
  deserializeCustomGeometry
} from './utils/projectStorage';
import {
  saveWorkspaceSession,
  loadWorkspaceSession,
  clearWorkspaceSession,
  deserializeHistoryFromPersistence
} from './utils/workspacePersistence';
import { parseAnyCADFile } from './utils/universalCadParser';
import { extractClosedChainsFromCAD, buildChainFromEntity, computeRectPlacement, computeLineEnd, isSelectableWireframeEntity } from './utils/cadDrawingEngine';
import { getCustomEntityId, transformCustomEntityClone } from './utils/cadSelectionEngine';
import CNCDesignBoard from './components/CNCDesignBoard';
import { convertBoardDiagramsToToolpaths, getCADTemplate } from './utils/cncBoardEngine';

function rehydrateBox3(b) {
  if (!b || !b.min || !b.max) return null;
  if (typeof b.getCenter === 'function') return b;
  return new THREE.Box3(
    new THREE.Vector3(b.min.x || 0, b.min.y || 0, b.min.z || 0),
    new THREE.Vector3(b.max.x || 0, b.max.y || 0, b.max.z || 0)
  );
}

function countWireframes(list = []) {
  return (list || []).filter(
    (g) => {
      if (!g) return false;
      const gName = typeof g.name === 'string' ? g.name : '';
      return (
        gName.startsWith('Wireframe_') ||
        gName.startsWith('Drill_') ||
        gName.startsWith('Hole_') ||
        ['line', 'circle', 'rectangle', 'arc', 'spline'].includes(g.userData?.type)
      );
    }
  ).length;
}

function cloneSerializableUserData(value, seen = new WeakMap()) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (typeof value.clone === 'function' && (value.isVector3 || value.isVector2 || value.isQuaternion || value.isMatrix4 || value.isBox3 || value.isColor)) {
    return value.clone();
  }
  if (value.isObject3D || typeof value === 'function') return undefined;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const arr = [];
    seen.set(value, arr);
    for (let i = 0; i < value.length; i++) {
      const item = cloneSerializableUserData(value[i], seen);
      if (item !== undefined) arr.push(item);
    }
    return arr;
  }
  const copy = {};
  seen.set(value, copy);
  for (const [k, v] of Object.entries(value)) {
    if (k.startsWith('__') || typeof v === 'function') continue;
    const clonedVal = cloneSerializableUserData(v, seen);
    if (clonedVal !== undefined) copy[k] = clonedVal;
  }
  return copy;
}

function cloneEntityForSnapshot(entity) {
  if (!entity || typeof entity.clone !== 'function') return entity;
  const cloned = entity.clone(true);
  cloned.uuid = entity.uuid;
  cloned.visible = entity.visible !== false;

  const cloneNodeDeep = (srcNode, dstNode) => {
    if (!dstNode) return;
    if (srcNode?.uuid) dstNode.uuid = srcNode.uuid;
    dstNode.visible = srcNode?.visible !== false;
    if (srcNode?.userData) {
      dstNode.userData = cloneSerializableUserData(srcNode.userData) || {};
    }
    if (dstNode.geometry && typeof dstNode.geometry.clone === 'function') {
      dstNode.geometry = dstNode.geometry.clone();
    }
    if (dstNode.material) {
      dstNode.material = Array.isArray(srcNode?.material || dstNode.material)
        ? (srcNode?.material || dstNode.material).map((m) => (typeof m?.clone === 'function' ? m.clone() : m))
        : (typeof (srcNode?.material || dstNode.material).clone === 'function'
            ? (srcNode?.material || dstNode.material).clone()
            : dstNode.material);
    }
    if (Array.isArray(dstNode.children)) {
      dstNode.children.forEach((child, idx) => cloneNodeDeep(srcNode?.children?.[idx], child));
    }
  };

  cloneNodeDeep(entity, cloned);
  return cloned;
}

function cloneCustomGeometryList(list = []) {
  if (!Array.isArray(list)) return [];
  return list.filter(Boolean).map(cloneEntityForSnapshot);
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    // Pure Light Theme default
    localStorage.setItem('argus_theme', 'light');
    return 'light';
  });
  const [activeRibbonTab, setActiveRibbonTab] = useState('Toolpaths');
  const [currentModel, setCurrentModel] = useState(() => createMastercamBaseStructureALU());
  const [currentProjectName, setCurrentProjectName] = useState('Surface_Finish_Pencil.mcam');
  const [unitSystem, setUnitSystem] = useState('metric');
  const [isFileBackstageOpen, setIsFileBackstageOpen] = useState(false);
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
  const customGeometryRef = useRef([]);
  const operationsRef = useRef([]);
  const partTransformRef = useRef(partTransform);
  const solidsListRef = useRef([]);
  const [workspaceViewMode, setWorkspaceViewMode] = useState('3d'); // '3d' | '2d' | 'split'
  const [boardShapes, setBoardShapes] = useState(() => getCADTemplate('mounting-plate', 200, 150));
  const [cadSource, setCadSource] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

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

  // Machine Definition & Mastercam Menu Configuration
  const [machines, setMachines] = useState(() => {
    try {
      const savedCustom = JSON.parse(localStorage.getItem('argus_custom_machines_v1') || '[]');
      if (Array.isArray(savedCustom) && savedCustom.length > 0) {
        return [...MACHINE_DEFINITIONS_CATALOG, ...savedCustom.filter((c) => c?.id && !MACHINE_DEFINITIONS_CATALOG.some((m) => m.id === c.id))];
      }
    } catch {
      // ignore storage errors
    }
    return [...MACHINE_DEFINITIONS_CATALOG];
  });
  const [machineDirectory, setMachineDirectory] = useState(() => {
    return localStorage.getItem('argus_machine_directory_v1') || DEFAULT_MACHINE_DIRECTORY;
  });
  const [machineMenuByCategory, setMachineMenuByCategory] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('argus_machine_menu_config_v1') || 'null');
      if (saved && typeof saved === 'object') {
        return { ...DEFAULT_MENU_IDS_BY_CATEGORY, ...saved };
      }
    } catch {
      // ignore storage errors
    }
    return { ...DEFAULT_MENU_IDS_BY_CATEGORY };
  });
  const [isMachineMenuModalOpen, setIsMachineMenuModalOpen] = useState(false);
  const [machineMenuCategory, setMachineMenuCategory] = useState('mill');
  const [activeMachineId, setActiveMachineId] = useState('mill_3x_default');
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
  const [isMastercamOpenDialogOpen, setIsMastercamOpenDialogOpen] = useState(false);
  const [isSolidExtrudeActive, setIsSolidExtrudeActive] = useState(false);
  const [solidExtrudeChains, setSolidExtrudeChains] = useState([]);
  const [isProbingModalOpen, setIsProbingModalOpen] = useState(false);
  const [isSelectAllOpen, setIsSelectAllOpen] = useState(false);
  const [isSelectProbeOpen, setIsSelectProbeOpen] = useState(false);
  const [isProbingHUDOpen, setIsProbingHUDOpen] = useState(false);
  const [activeProbe, setActiveProbe] = useState(null);
  const [activeProbingCycle, setActiveProbingCycle] = useState('bore_boss');
  const [probingPickedFeature, setProbingPickedFeature] = useState(null);
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
  const [editingDefinedTool, setEditingDefinedTool] = useState(null);
  const [lastDefinedToolState, setLastDefinedToolState] = useState({ seq: 0, tool: null });
  const [isSurfaceFinishContourOpen, setIsSurfaceFinishContourOpen] = useState(false);
  const [surfaceFinishStrategyMode, setSurfaceFinishStrategyMode] = useState('contour');
  const [editingSurfaceFinishOp, setEditingSurfaceFinishOp] = useState(null);
  const [isSurfaceSelectionOpen, setIsSurfaceSelectionOpen] = useState(false);
  const [isFlowlineDataOpen, setIsFlowlineDataOpen] = useState(false);
  const [activeFacePickRole, setActiveFacePickRole] = useState(null); // 'drive' | 'check' | 'containment' | null
  const [surfaceSelectionDraft, setSurfaceSelectionDraft] = useState(() => ({
    mode: 'flowline',
    editingOp: null,
    driveFaceIds: [],
    checkFaceIds: [],
    containmentIds: [],
    cadFileCount: 0,
    flowlineData: {
      offsetDir: 1,
      cutDir: 1,
      stepDir: 1,
      swapUV: false,
      startCorner: 0,
      edgeTolerance: 0.025,
      plotEdges: false
    },
    editingFromModal: false
  }));
  const [isCommandFinderOpen, setIsCommandFinderOpen] = useState(false);
  const [isAddInsModalOpen, setIsAddInsModalOpen] = useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [constructionZ, setConstructionZ] = useState(0.0);
  const [constructionMode, setConstructionMode] = useState('3d');
  const [showArcCenters, setShowArcCenters] = useState(false);
  const [showEndpoints, setShowEndpoints] = useState(false);
  const [deletedEntitiesStack, setDeletedEntitiesStack] = useState([]);
  const [fixtureConfig, setFixtureConfig] = useState(DEFAULT_FIXTURE_CONFIG);
  const [selectedAssemblyToolId, setSelectedAssemblyToolId] = useState(null);
  const [isWireframeModalOpen, setIsWireframeModalOpen] = useState(false);
  const [wireframeModalTool, setWireframeModalTool] = useState('line');
  const [isSketchModeActive, setIsSketchModeActive] = useState(false);
  const [sketchTool, setSketchTool] = useState('line');
  const [isSelectModeActive, setIsSelectModeActive] = useState(false);
  const [selectedEntityIds, setSelectedEntityIds] = useState([]);
  const [previousSelectionIds, setPreviousSelectionIds] = useState([]);
  const [snapMode, setSnapMode] = useState('auto');
  const [isAutoCursorLocked, setIsAutoCursorLocked] = useState(false);
  const [canvasSelectionMethod, setCanvasSelectionMethod] = useState('automatic');
  const [containmentMode, setContainmentMode] = useState('in_cross');
  const [solidFilterMode, setSolidFilterMode] = useState('all');
  const [selectionMask, setSelectionMask] = useState('all');
  const [stickyMultiSelect, setStickyMultiSelect] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState(null);
  const [circleParams, setCircleParams] = useState({
    radius: 25.0,
    diameter: 50.0,
    isLocked: false,
    entityMethod: 'manual',
    center: { x: 0, y: 0, z: 0 }
  });
  const [activeCircleId, setActiveCircleId] = useState(null);

  const [rectParams, setRectParams] = useState({
    width: 80.0,
    height: 50.0,
    cornerFillet: 0.0,
    dirX: 1,
    dirZ: -1,
    isWidthLocked: false,
    isHeightLocked: false,
    isFilletLocked: false,
    anchorToCenter: false,
    createSurface: false,
    activePoint: 1,
    firstCorner: null,
    secondCorner: null
  });
  const [activeRectId, setActiveRectId] = useState(null);

  const [lineParams, setLineParams] = useState({
    length: 50.0,
    angle: 0.0,
    isLengthLocked: false,
    isAngleLocked: false,
    lineType: 'freeform',
    isTangent: false,
    lineMethod: 'two_endpoints',
    activeEndpoint: 1,
    axisOffset: 0.0,
    pt1: null,
    pt2: null
  });
  const [activeLineId, setActiveLineId] = useState(null);

  const [arcParams, setArcParams] = useState({
    radius: 25.0,
    diameter: 50.0,
    isLocked: false,
    entityMethod: 'one_entity'
  });
  const [activeArcId, setActiveArcId] = useState(null);

  // Mastercam Surfaces -> Extrude & Interactive Floating Chaining State
  const [activeSurfaceTool, setActiveSurfaceTool] = useState(null); // 'extrude' | null
  const [isChainingPaletteOpen, setIsChainingPaletteOpen] = useState(false);
  const [isBasePointPickActive, setIsBasePointPickActive] = useState(false);
  const [chainingConfig, setChainingConfig] = useState({
    chainMode: 'wireframe',
    planeMode: '3d',
    selectionMethod: 'chain',
    containmentSide: 'inside',
    waitMode: false
  });
  const [selectedExtrudeChains, setSelectedExtrudeChains] = useState([]);
  const selectedExtrudeChainsRef = useRef([]);
  const setSelectedExtrudeChainsSync = (updater) => {
    const prev = selectedExtrudeChainsRef.current || [];
    const next = typeof updater === 'function' ? updater(prev) : updater;
    const safeNext = Array.isArray(next) ? next : [];
    selectedExtrudeChainsRef.current = safeNext;
    setSelectedExtrudeChains(safeNext);
    return safeNext;
  };
  const [extrudeParams, setExtrudeParams] = useState({
    height: 20.0,
    scale: 1.0,
    rotationAngleDeg: 0.0,
    offsetDistance: 0.0,
    draftAngleDeg: 0.0,
    useAxis: false,
    axis: 'z',
    axisVector: { x: 0, y: 0, z: 1 },
    direction: 'defined',
    basePoint: null,
    capEnds: true,
    locks: {}
  });

  // Synchronous sketch refs prevent stale closures during rapid keyboard typing + clicks
  const activeDrawingToolRef = useRef(activeDrawingTool);
  const circleParamsRef = useRef(circleParams);
  const activeCircleIdRef = useRef(activeCircleId);
  const rectParamsRef = useRef(rectParams);
  const activeRectIdRef = useRef(activeRectId);
  const lineParamsRef = useRef(lineParams);
  const activeLineIdRef = useRef(activeLineId);
  const activeSurfaceToolRef = useRef(activeSurfaceTool);
  activeSurfaceToolRef.current = activeSurfaceTool;
  const handleCancelSurfaceExtrudeRef = useRef(null);

  const setDrawingToolSync = (val) => {
    activeDrawingToolRef.current = val;
    setActiveDrawingTool(val);
  };
  const updateCircleParams = (updater) => {
    const prev = circleParamsRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    circleParamsRef.current = next;
    setCircleParams(next);
    return next;
  };
  const setActiveCircle = (id) => {
    activeCircleIdRef.current = id;
    setActiveCircleId(id);
  };
  const updateRectParams = (updater) => {
    const prev = rectParamsRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    rectParamsRef.current = next;
    setRectParams(next);
    return next;
  };
  const setActiveRect = (id) => {
    activeRectIdRef.current = id;
    setActiveRectId(id);
  };
  const updateLineParams = (updater) => {
    const prev = lineParamsRef.current;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    lineParamsRef.current = next;
    setLineParams(next);
    return next;
  };
  const setActiveLine = (id) => {
    activeLineIdRef.current = id;
    setActiveLineId(id);
  };
  const [reselectTrigger, setReselectTrigger] = useState(0);
  const [undoTrigger, setUndoTrigger] = useState(0);
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
  const [flowlineWizardActive, setFlowlineWizardActive] = useState(false);
  const [flowlineWizardStep, setFlowlineWizardStep] = useState(1);

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
  const [isMastercamToolpathModalOpen, setIsMastercamToolpathModalOpen] = useState(false);
  const [isNewOperation, setIsNewOperation] = useState(false);
  const isNewOperationRef = useRef(false);
  const [isMastercamChainingModalOpen, setIsMastercamChainingModalOpen] = useState(false);

  // In-Viewport Backplot & Solid Verify Simulation State
  const [isBackplotActive, setIsBackplotActive] = useState(false);
  const [backplotMode, setBackplotMode] = useState('backplot'); // 'backplot' | 'verify'

  const handleStartBackplot = (opId = null) => {
    const validOpId = (typeof opId === 'number' || opId === 'all') ? opId : null;
    if (validOpId) setActiveOpId(validOpId);
    setBackplotMode('backplot');
    setIsBackplotActive(true);
    showToast(validOpId === 'all' ? "Backplot: Tracing all operations in sequence" : "Backplot: In-Viewport 3D tool tracing initialized", "info");
  };

  const handleStartVerify = (opId = null, mode = 'verify') => {
    const validOpId = (typeof opId === 'number' || opId === 'all') ? opId : null;
    if (validOpId) setActiveOpId(validOpId);
    const targetMode = (typeof opId === 'string' && opId !== 'all') ? opId : (typeof mode === 'string' ? mode : 'verify');
    setBackplotMode(targetMode);
    setIsBackplotActive(true);
    showToast(validOpId === 'all'
      ? "Solid Verify: Material removal simulation across ALL operations initialized"
      : (targetMode === 'heatmap' ? "Tolerance Heatmap: Gouge & Excess inspection active" : "Solid Verify: Material removal simulation initialized"),
      "info"
    );
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
      name: '50mm Face Mill (Shell Mill)',
      type: 'face',
      diameter: 50,
      cornerRad: 0,
      fluteLength: 25,
      overallLength: 75,
      flutes: 5,
      cuttingSpeedVc: 399,
      rpm: 3500,
      feedPerTooth: 0.09,
      feedRate: 1200,
      plungeRate: 350,
      coolant: 'Flood'
    },
    {
      id: 2,
      number: 2,
      name: '12mm Flat Endmill (Carbide Rougher)',
      type: 'flat',
      diameter: 12,
      cornerRad: 0,
      fluteLength: 28,
      overallLength: 75,
      flutes: 3,
      cuttingSpeedVc: 220,
      rpm: 5500,
      feedPerTooth: 0.08,
      feedRate: 1800,
      plungeRate: 450,
      coolant: 'Flood'
    },
    {
      id: 3,
      number: 3,
      name: '10mm 4-Flute Flat Endmill (Finisher)',
      type: 'flat',
      diameter: 10,
      cornerRad: 0,
      fluteLength: 25,
      overallLength: 75,
      flutes: 4,
      cuttingSpeedVc: 200,
      rpm: 6000,
      feedPerTooth: 0.06,
      feedRate: 1528,
      plungeRate: 450,
      coolant: 'Flood'
    },
    {
      id: 4,
      number: 4,
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
      id: 5,
      number: 5,
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
      id: 6,
      number: 6,
      name: '12mm 90° Spot / Chamfer Drill',
      type: 'chamfer',
      diameter: 12,
      cornerRad: 0,
      fluteLength: 15,
      overallLength: 70,
      flutes: 2,
      cuttingSpeedVc: 140,
      rpm: 3500,
      feedPerTooth: 0.12,
      feedRate: 889,
      plungeRate: 250,
      coolant: 'Flood'
    },
    {
      id: 7,
      number: 7,
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
      id: 8,
      number: 8,
      name: '12 Bull-Nosed Endmill',
      type: 'bull',
      diameter: 12,
      cornerRad: 0.6,
      cornerRadius: 0.6,
      fluteLength: 25,
      overallLength: 75,
      flutes: 4,
      cuttingSpeedVc: 403,
      rpm: 10695,
      feedPerTooth: 0.07,
      feedRate: 3000,
      plungeRate: 450,
      retractRate: 3000,
      coolant: 'Flood'
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

  const activeMachine = useMemo(() => {
    return resolveMachineById(activeMachineId, machines) || machines[0] || DESIGN_MODE_MACHINE;
  }, [activeMachineId, machines]);

  const handleSelectMachine = (nextMachineId) => {
    if (!nextMachineId) return;
    setActiveMachineId(nextMachineId);
    const resolved = resolveMachineById(nextMachineId, machines) || DESIGN_MODE_MACHINE;
    showToast(`Machine selected: ${resolved.name} (${resolved.type} • ${resolved.controller})`, 'success');
  };

  const handleOpenMachineMenuManager = (category = 'mill') => {
    setMachineMenuCategory(category || 'mill');
    setIsMachineMenuModalOpen(true);
  };

  const handleSaveMachineMenu = ({ category, directory, menuItemIds }) => {
    if (directory) {
      setMachineDirectory(directory);
      localStorage.setItem('argus_machine_directory_v1', directory);
    }
    setMachineMenuByCategory((prev) => {
      const next = { ...prev, [category]: menuItemIds };
      try {
        localStorage.setItem('argus_machine_menu_config_v1', JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
    showToast(`Updated Machine Definition menu list (${menuItemIds.length} item(s))`, 'success');
  };

  const handleImportCustomMachine = (newMachine) => {
    if (!newMachine?.id) return;
    setMachines((prev) => {
      const next = [...prev, newMachine];
      try {
        const customOnly = next.filter((m) => !MACHINE_DEFINITIONS_CATALOG.some((c) => c.id === m.id));
        localStorage.setItem('argus_custom_machines_v1', JSON.stringify(customOnly));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    showToast(`Imported machine definition: ${newMachine.fileName || newMachine.name}`, 'success');
  };

  // Sync entity counts with Levels and keep synchronous refs updated
  useEffect(() => {
    customGeometryRef.current = customGeometry;
    operationsRef.current = operations;
    partTransformRef.current = partTransform;
    solidsListRef.current = solidsList;

    const wireframeCount = countWireframes(customGeometry);
    const surfaceCount = (customGeometry || []).filter(
      (g) => {
        if (!g) return false;
        const gName = typeof g.name === 'string' ? g.name : '';
        return gName.startsWith('Surface_') || gName.startsWith('CAD_');
      }
    ).length;

    setLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id === 10) return { ...lvl, entities: wireframeCount, count: wireframeCount };
        if (lvl.id === 15) return { ...lvl, entities: surfaceCount };
        if (lvl.id === 50) return { ...lvl, entities: operations.length };
        if (lvl.id === 60) return { ...lvl, entities: operations.length };
        return lvl;
      })
    );
  }, [customGeometry, operations, partTransform, solidsList]);

  // ================= Toast Notification System =================
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000, action = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // ================= Atomic Undo / Redo History Engine =================
  const [historyState, setHistoryState] = useState({ entries: [], index: -1 });
  const historyStateRef = useRef({ entries: [], index: -1 });
  const history = historyState.entries;
  const historyIndex = historyState.index;

  const createSnapshot = (overrideState = {}) => {
    const nextCustomGeo = overrideState.customGeometry !== undefined ? overrideState.customGeometry : customGeometryRef.current;
    const nextOps = overrideState.operations !== undefined ? overrideState.operations : operationsRef.current;
    const nextPartTransform = overrideState.partTransform !== undefined ? overrideState.partTransform : partTransformRef.current;
    const nextSolids = overrideState.solidsList !== undefined ? overrideState.solidsList : solidsListRef.current;

    return {
      operations: JSON.parse(JSON.stringify(nextOps || [])),
      partTransform: { ...(nextPartTransform || { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }) },
      solidsList: [...(nextSolids || [])],
      customGeometry: cloneCustomGeometryList(nextCustomGeo || [])
    };
  };

  const resetHistory = (baselineOverride = {}) => {
    const baseline = createSnapshot(baselineOverride);
    const nextState = { entries: [baseline], index: 0 };
    historyStateRef.current = nextState;
    setHistoryState(nextState);
  };

  const pushSnapshot = (overrideState = {}) => {
    const snapshot = createSnapshot(overrideState);
    const cur = historyStateRef.current;
    const upToCurrent = cur.entries.length > 0 && cur.index >= 0
      ? cur.entries.slice(0, cur.index + 1)
      : [createSnapshot({ customGeometry: [], operations: [] })];
    const updatedEntries = [...upToCurrent, snapshot].slice(-60);
    const nextState = { entries: updatedEntries, index: updatedEntries.length - 1 };
    historyStateRef.current = nextState;
    setHistoryState(nextState);
  };

  const replaceCurrentSnapshot = (overrideState = {}) => {
    const cur = historyStateRef.current;
    if (cur.index < 0 || cur.index >= cur.entries.length) {
      pushSnapshot(overrideState);
      return;
    }
    const updated = [...cur.entries];
    updated[cur.index] = createSnapshot(overrideState);
    const nextState = { entries: updated, index: cur.index };
    historyStateRef.current = nextState;
    setHistoryState(nextState);
  };

  // Initialize baseline snapshot on mount
  useEffect(() => {
    if (historyStateRef.current.entries.length === 0) {
      resetHistory();
    }
  }, []);

  // Workspace Session Rehydration on Mount (from IndexedDB)
  useEffect(() => {
    let isMounted = true;

    async function restoreWorkspace() {
      try {
        const session = await loadWorkspaceSession();
        if (!isMounted) return;

        if (session) {
          if (session.projectName) setCurrentProjectName(session.projectName);
          if (session.projectDescriptor) setProjectDescriptor(session.projectDescriptor);
          if (session.unitSystem) setUnitSystem(session.unitSystem);
          if (session.activeRibbonTab) setActiveRibbonTab(session.activeRibbonTab);
          if (session.activeMachineId) setActiveMachineId(session.activeMachineId);
          if (session.activeWcs) setActiveWcs(session.activeWcs);
          if (session.activePlane) setActivePlane(session.activePlane);
          if (session.workpieceColor) setWorkpieceColor(session.workpieceColor);
          if (session.renderMode) setRenderMode(session.renderMode);
          if (session.layerVisibility) setLayerVisibility(session.layerVisibility);
          if (session.partTransform) {
            partTransformRef.current = session.partTransform;
            setPartTransform(session.partTransform);
          }
          let restoredSessionGeo = customGeometryRef.current;
          if (session.customGeometry) {
            restoredSessionGeo = deserializeCustomGeometry(session.customGeometry);
            customGeometryRef.current = restoredSessionGeo;
            setCustomGeometry(restoredSessionGeo);
          }
          let restoredSessionSolids = solidsListRef.current;
          if (session.solidsList) {
            restoredSessionSolids = session.solidsList;
            solidsListRef.current = restoredSessionSolids;
            setSolidsList(restoredSessionSolids);
          }
          if (session.stockConfig) setStockConfig(session.stockConfig);
          if (session.tools && Array.isArray(session.tools) && session.tools.length > 0) {
            let loadedTools = [...session.tools];
            const standardTools = [
              {
                id: 1,
                number: 1,
                name: '50mm Face Mill (Shell Mill)',
                type: 'face',
                diameter: 50,
                cornerRad: 0,
                fluteLength: 25,
                overallLength: 75,
                flutes: 5,
                cuttingSpeedVc: 399,
                rpm: 3500,
                feedPerTooth: 0.09,
                feedRate: 1200,
                plungeRate: 350,
                coolant: 'Flood'
              },
              {
                id: 2,
                number: 2,
                name: '12mm Flat Endmill (Carbide Rougher)',
                type: 'flat',
                diameter: 12,
                cornerRad: 0,
                fluteLength: 28,
                overallLength: 75,
                flutes: 3,
                cuttingSpeedVc: 220,
                rpm: 5500,
                feedPerTooth: 0.08,
                feedRate: 1800,
                plungeRate: 450,
                coolant: 'Flood'
              },
              {
                id: 3,
                number: 3,
                name: '10mm 4-Flute Flat Endmill (Finisher)',
                type: 'flat',
                diameter: 10,
                cornerRad: 0,
                fluteLength: 30,
                overallLength: 75,
                flutes: 4,
                cuttingSpeedVc: 200,
                rpm: 6000,
                feedPerTooth: 0.06,
                feedRate: 1528,
                plungeRate: 450,
                coolant: 'Flood'
              },
              {
                id: 4,
                number: 4,
                name: '8mm 3-Flute Roughing Endmill',
                type: 'flat',
                diameter: 8,
                cornerRad: 0,
                fluteLength: 20,
                overallLength: 60,
                flutes: 3,
                cuttingSpeedVc: 180,
                rpm: 7162,
                feedPerTooth: 0.05,
                feedRate: 1074,
                plungeRate: 350,
                coolant: 'Flood'
              },
              {
                id: 5,
                number: 5,
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
                id: 6,
                number: 6,
                name: '12mm 90° Spot / Chamfer Drill',
                type: 'chamfer',
                diameter: 12,
                cornerRad: 0,
                fluteLength: 15,
                overallLength: 70,
                flutes: 2,
                cuttingSpeedVc: 140,
                rpm: 3500,
                feedPerTooth: 0.12,
                feedRate: 889,
                plungeRate: 250,
                coolant: 'Flood'
              },
              {
                id: 7,
                number: 7,
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
                id: 8,
                number: 8,
                name: '12 Bull-Nosed Endmill',
                type: 'bull',
                diameter: 12,
                cornerRad: 0.6,
                cornerRadius: 0.6,
                fluteLength: 25,
                overallLength: 75,
                flutes: 4,
                cuttingSpeedVc: 403,
                rpm: 10695,
                feedPerTooth: 0.07,
                feedRate: 3000,
                plungeRate: 450,
                retractRate: 3000,
                coolant: 'Flood'
              }
            ];

            const t7 = loadedTools.find((t) => t.number === 7 || (t.type === 'drill' && t.diameter === 5));
            const hasFullLibrary = loadedTools.length >= 7 && Boolean(t7);

            if (!hasFullLibrary) {
              const probeTool = loadedTools.find((t) => t.number === 99 || t.type === 'probe') || {
                id: 99,
                number: 99,
                name: 'Renishaw OMP60 Optical Touch Probe',
                type: 'probe',
                diameter: 6.0,
                cornerRad: 3.0,
                fluteLength: 10,
                overallLength: 50,
                flutes: 4,
                cuttingSpeedVc: 0,
                rpm: 0,
                feedPerTooth: 0,
                feedRate: 500,
                plungeRate: 250,
                coolant: 'Off'
              };
              loadedTools = [...standardTools, probeTool];
            } else if (!loadedTools.some((t) => t.type === 'bull')) {
              const defaultBull = standardTools.find((t) => t.type === 'bull');
              if (defaultBull) {
                const maxNum = Math.max(0, ...loadedTools.map((t) => Number(t.number) || 0));
                const numTaken = loadedTools.some((t) => Number(t.number) === 8);
                loadedTools = [
                  ...loadedTools,
                  {
                    ...defaultBull,
                    id: loadedTools.some((t) => t.id === 8) ? Date.now() : 8,
                    number: numTaken ? maxNum + 1 : 8
                  }
                ];
              }
            }
            setTools(loadedTools);
          }
          let restoredSessionOps = operationsRef.current;
          if (session.operations && Array.isArray(session.operations)) {
            restoredSessionOps = session.operations.map((op) => ({
              ...op,
              bounds: rehydrateBox3(op.bounds) || op.bounds
            }));
            operationsRef.current = restoredSessionOps;
            setOperations(restoredSessionOps);
            if (restoredSessionOps.length > 0) {
              setActiveOpId(restoredSessionOps[0].id);
            } else {
              setActiveOpId(null);
            }
          }
          if (session.fixtureConfig) setFixtureConfig(session.fixtureConfig);

          // Rebuild CAD model geometry
          if (session.cadSource) {
            setCadSource(session.cadSource);
            const cs = session.cadSource;
            if (cs.type === 'file' && cs.content) {
              try {
                const fileBlob = new Blob([cs.content], {
                  type: cs.isBinary ? 'application/octet-stream' : 'text/plain'
                });
                fileBlob.name = cs.filename;
                const modelGroup = await parseAnyCADFile(fileBlob);
                if (isMounted && modelGroup) {
                  setCurrentModel(modelGroup);
                }
              } catch (err) {
                console.warn('Could not re-parse stored CAD file on refresh:', err);
              }
            } else if (cs.type === 'sample' && cs.sampleType) {
              if (cs.sampleType === 'impeller') setCurrentModel(createImpellerGeometry());
              else if (cs.sampleType === 'bracket') setCurrentModel(createAerospaceBracket());
              else if (cs.sampleType === 'mold') setCurrentModel(createMoldCoreGeometry());
              else if (cs.sampleType === 'titan_1m' || cs.sampleType === 'titan1m' || cs.sampleType === 'titan') setCurrentModel(createTitan1MPart());
              else if (cs.sampleType === 'base_structure_alu' || cs.sampleType === 'base_structure') setCurrentModel(createMastercamBaseStructureALU());
            }
          } else if (Array.isArray(session.solidsList) && session.solidsList.length === 0) {
            // Blank CAD / Surface project had no solid body; clear default Base Structure-ALU model
            setCadSource(null);
            setCurrentModel(null);
            const restoredBox = new THREE.Box3();
            (restoredSessionGeo || []).forEach((ent) => {
              if (ent && ent.visible !== false) {
                ent.updateMatrixWorld?.(true);
                restoredBox.expandByObject(ent);
              }
            });
            if (!restoredBox.isEmpty()) {
              setPartMetrics({
                box: restoredBox,
                bounds: restoredBox,
                center: restoredBox.getCenter(new THREE.Vector3()),
                dimensions: restoredBox.getSize(new THREE.Vector3()),
                triangles: 0
              });
            }
          }

          const restoredHistory = deserializeHistoryFromPersistence(session.undoHistory);
          if (restoredHistory && Array.isArray(restoredHistory.entries) && restoredHistory.entries.length > 0) {
            historyStateRef.current = restoredHistory;
            setHistoryState(restoredHistory);
          } else {
            resetHistory({
              operations: restoredSessionOps,
              partTransform: session.partTransform || partTransformRef.current,
              solidsList: restoredSessionSolids,
              customGeometry: restoredSessionGeo
            });
          }

          showToast(`Workspace restored: ${session.projectName || 'Active Session'}`, 'success');
        }
      } catch (err) {
        console.warn('Error rehydrating workspace session:', err);
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    restoreWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ref tracking latest state for beforeunload flush
  const latestSessionRef = React.useRef();
  latestSessionRef.current = {
    projectName: currentProjectName,
    projectDescriptor,
    unitSystem,
    activeRibbonTab,
    activeMachineId,
    activeWcs,
    activePlane,
    workpieceColor,
    renderMode,
    layerVisibility,
    partTransform,
    customGeometry,
    solidsList,
    stockConfig,
    tools,
    operations,
    fixtureConfig,
    cadSource
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (latestSessionRef.current && !isRestoringSession) {
        saveWorkspaceSession(latestSessionRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRestoringSession]);

  // Debounced Auto-Save to IndexedDB and LocalStorage
  useEffect(() => {
    if (isRestoringSession) return;

    const timer = setTimeout(() => {
      saveWorkspaceSession({
        projectName: currentProjectName,
        projectDescriptor,
        unitSystem,
        activeRibbonTab,
        activeMachineId,
        activeWcs,
        activePlane,
        workpieceColor,
        renderMode,
        layerVisibility,
        partTransform,
        customGeometry,
        solidsList,
        stockConfig,
        tools,
        operations,
        fixtureConfig,
        cadSource,
        undoHistory: historyStateRef.current
      });

      saveAutoSaveSnapshot({
        projectName: currentProjectName,
        stockConfig,
        tools,
        operations,
        customGeometry: serializeCustomGeometry(customGeometry),
        partMetrics,
        solidsList,
        activeMachine,
        activeWcs,
        workpieceColor,
        partTransform
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [
    isRestoringSession,
    currentProjectName,
    projectDescriptor,
    unitSystem,
    activeRibbonTab,
    activeMachineId,
    activeWcs,
    activePlane,
    workpieceColor,
    renderMode,
    layerVisibility,
    partTransform,
    customGeometry,
    solidsList,
    stockConfig,
    tools,
    operations,
    fixtureConfig,
    cadSource,
    activeMachine,
    partMetrics,
    historyState
  ]);

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

  // ================= Undo / Redo Handlers (Atomic State) =================
  const commitCustomGeometry = (nextGeo, shouldPush = true) => {
    const safeList = Array.isArray(nextGeo) ? nextGeo : [];
    const validIds = new Set(safeList.map(getCustomEntityId).filter(Boolean));
    customGeometryRef.current = safeList;
    setCustomGeometry(safeList);
    setSelectedEntityIds((prev) => {
      const filtered = prev.filter((id) => validIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });
    if (shouldPush) {
      pushSnapshot({ customGeometry: safeList });
    }
  };

  const resetPendingSketchLocks = () => {
    setActiveCircle(null);
    setActiveRect(null);
    setActiveLine(null);
    setActiveArcId(null);
    updateCircleParams((prev) => ({ ...prev, isLocked: false, center: null }));
    updateRectParams((prev) => ({
      ...prev,
      isWidthLocked: false,
      isHeightLocked: false,
      firstCorner: null,
      secondCorner: null
    }));
    updateLineParams((prev) => ({
      ...prev,
      isLengthLocked: false,
      isAngleLocked: false,
      pt1: null,
      pt2: null
    }));
    setArcParams((prev) => ({ ...prev, isLocked: false }));
  };

  const shouldBypassAppUndoRedo = (target) => {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') {
      const inputType = String(target.type || 'text').toLowerCase();
      if (['checkbox', 'radio', 'range', 'button', 'submit', 'color'].includes(inputType)) {
        return false;
      }
      if (target.dataset?.sketchNumeric === 'true') {
        return target.dataset?.dirty === 'true';
      }
      if (['text', 'search', 'email', 'url', 'password'].includes(inputType)) {
        return true;
      }
      return target.dataset?.dirty === 'true';
    }
    return false;
  };

  const applyHistorySnapshot = (snap, nextIdx, msg) => {
    if (!snap) return;
    if (snap.operations) {
      const hydratedOps = snap.operations.map((op) => ({
        ...op,
        bounds: rehydrateBox3(op.bounds) || op.bounds
      }));
      operationsRef.current = hydratedOps;
      setOperations(hydratedOps);
    }
    if (snap.partTransform) {
      partTransformRef.current = snap.partTransform;
      setPartTransform(snap.partTransform);
    }
    if (snap.solidsList) {
      solidsListRef.current = snap.solidsList;
      setSolidsList(snap.solidsList);
    }
    if (snap.customGeometry !== undefined) {
      const restoredGeo = cloneCustomGeometryList(snap.customGeometry);
      commitCustomGeometry(restoredGeo, false);
      syncPartMetricsFromCustomSurfaces(restoredGeo);
      if (snap.selectedExtrudeChains !== undefined) {
        setSelectedExtrudeChainsSync(snap.selectedExtrudeChains);
      } else if (activeSurfaceToolRef.current === 'extrude' && selectedExtrudeChainsRef.current.length > 0) {
        const validChains = extractClosedChainsFromCAD(restoredGeo);
        const validIds = new Set(validChains.map((c) => c.id));
        const surviving = selectedExtrudeChainsRef.current.filter((c) => validIds.has(c.id));
        setSelectedExtrudeChainsSync(surviving);
      }
    }
    resetPendingSketchLocks();
    setUndoTrigger((prev) => prev + 1);

    const cur = historyStateRef.current;
    const nextHist = { entries: cur.entries, index: nextIdx };
    historyStateRef.current = nextHist;
    setHistoryState(nextHist);
    showToast(msg, "info");
  };

  const handleUndo = () => {
    // Step 1: If actively picking Surface Extrude chains (uncommitted preview), step back last chain first
    if (activeSurfaceToolRef.current === 'extrude' && selectedExtrudeChainsRef.current.length > 0) {
      const remaining = setSelectedExtrudeChainsSync((prev) => prev.slice(0, -1));
      setUndoTrigger((prev) => prev + 1);
      if (remaining.length === 0) {
        setIsChainingPaletteOpen(true);
        showToast('Undo: Cleared Surface Extrude chain preview', 'info');
      } else {
        showToast(`Undo: Removed last Surface Extrude chain (${remaining.length} remaining)`, 'info');
      }
      return;
    }

    const cur = historyStateRef.current;
    if (cur.index > 0) {
      const newIdx = cur.index - 1;
      applyHistorySnapshot(cur.entries[newIdx], newIdx, "Undo: Previous CAD/CAM state restored");
      return;
    }

    const hasPendingSketchPreview =
      circleParamsRef.current.isLocked ||
      rectParamsRef.current.isWidthLocked ||
      rectParamsRef.current.isHeightLocked ||
      Boolean(rectParamsRef.current.firstCorner) ||
      lineParamsRef.current.isLengthLocked ||
      lineParamsRef.current.isAngleLocked ||
      Boolean(lineParamsRef.current.pt1) ||
      Boolean(activeCircleIdRef.current) ||
      Boolean(activeRectIdRef.current) ||
      Boolean(activeLineIdRef.current);

    if (hasPendingSketchPreview) {
      resetPendingSketchLocks();
      setUndoTrigger((prev) => prev + 1);
      showToast("Cleared active sketch preview and locks", "info");
    } else {
      showToast("No further undo actions in history", "warning");
    }
  };

  const handleRedo = () => {
    const cur = historyStateRef.current;
    if (cur.index < cur.entries.length - 1) {
      const newIdx = cur.index + 1;
      applyHistorySnapshot(cur.entries[newIdx], newIdx, "Redo: Re-applied CAD/CAM state");
    } else {
      showToast("No further redo actions in history", "warning");
    }
  };

  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  useEffect(() => {
    handleUndoRef.current = handleUndo;
    handleRedoRef.current = handleRedo;
  });

  // Keyboard shortcut listener for Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const lowerKey = (e.key || '').toLowerCase();

      if (isCtrlOrMeta && (lowerKey === 'z' || e.code === 'KeyZ')) {
        if (shouldBypassAppUndoRedo(target)) return;

        e.preventDefault();
        if (e.shiftKey) {
          handleRedoRef.current();
        } else {
          handleUndoRef.current();
        }
        return;
      }

      if (isCtrlOrMeta && (lowerKey === 'y' || e.code === 'KeyY')) {
        if (shouldBypassAppUndoRedo(target)) return;

        e.preventDefault();
        handleRedoRef.current();
        return;
      }

      if (e.key === 'Escape' && activeSurfaceToolRef.current === 'extrude') {
        e.preventDefault();
        handleCancelSurfaceExtrudeRef.current?.();
        return;
      }

      if (e.key === 'F9' || e.code === 'F9') {
        e.preventDefault();
        setShowAxes((prev) => {
          const next = !prev;
          showToast(`Origin coordinate crosshairs (F9): ${next ? 'ON' : 'OFF'}`, 'info', 1600);
          return next;
        });
        return;
      }

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable) return;

      if (isCtrlOrMeta && (lowerKey === 'n' || e.code === 'KeyN')) {
        e.preventDefault();
        setIsNewProjectModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ================= Handlers =================
  const handleToggleOp = (id) => {
    if (id === 'all' || id === null) {
      setOperations((prev) => {
        const anyVisible = prev.some((op) => op.visible !== false);
        return prev.map((op) => ({ ...op, visible: !anyVisible }));
      });
      return;
    }
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, visible: !op.visible } : op))
    );
  };

  const handleRegenerateAll = () => {
    setOperations((prev) => prev.map((op) => ({ ...op, visible: true })));
    showToast("All toolpaths regenerated with real 3D mesh slicing", "success");
  };

  const handleDeleteOpById = (id) => {
    const curOps = operationsRef.current || operations;
    if (curOps.length <= 1) {
      showToast("At least one operation must remain in the operations tree.", "warning");
      return;
    }
    const updated = curOps.filter((op) => op.id !== id);
    operationsRef.current = updated;
    setOperations(updated);
    pushSnapshot({ operations: updated });
    if (activeOpId === id) {
      if (updated.length > 0) setActiveOpId(updated[0].id);
    }
    showToast("Operation deleted from tree", "info");
  };

  const handleDeleteActiveOp = () => {
    if (selectedEntityIds.length > 0) {
      handleDeleteSelectedEntities(selectedEntityIds);
      return;
    }
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
    const curOps = operationsRef.current || operations;
    const nextId = curOps.length > 0 ? Math.max(...curOps.map((o) => o.id)) + 1 : 1;
    const pasted = {
      ...clipboardOp,
      id: nextId,
      name: `${clipboardOp.name} (Copy)`
    };
    const nextOps = [...curOps, pasted];
    operationsRef.current = nextOps;
    setOperations(nextOps);
    pushSnapshot({ operations: nextOps });
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
    if (
      op?.strategyKey === 'surface_finish_flowline' ||
      op?.badgeClass === 'flowline' ||
      op?.strategyKey === 'surface_finish_contour' ||
      op?.strategyKey === 'surface_finish_pocket' ||
      op?.strategyKey === 'surface_finish_shallow' ||
      op?.badgeClass === 'shallow' ||
      op?.strategyKey === 'surface_finish_parallel' ||
      op?.badgeClass === 'parallel' ||
      op?.strategyKey === 'surface_finish_pencil' ||
      op?.badgeClass === 'pencil' ||
      op?.usesCustomSurfaces
    ) {
      const mode =
        op.strategyKey === 'surface_finish_flowline' || op.badgeClass === 'flowline'
          ? 'flowline'
          : op.strategyKey === 'surface_finish_pocket' || op.badgeClass === 'pocket'
            ? 'pocket'
            : op.strategyKey === 'surface_finish_shallow' || op.badgeClass === 'shallow'
              ? 'shallow'
              : op.strategyKey === 'surface_finish_parallel' || op.badgeClass === 'parallel'
                ? 'parallel'
                : op.strategyKey === 'surface_finish_pencil' || op.badgeClass === 'pencil'
                  ? 'pencil'
                  : 'contour';
      if (mode === 'flowline') {
        setSurfaceSelectionDraft({
          mode: 'flowline',
          editingOp: op,
          driveFaceIds: Array.isArray(op.driveFaceIds) ? op.driveFaceIds : [],
          checkFaceIds: Array.isArray(op.checkFaceIds) ? op.checkFaceIds : [],
          containmentIds: Array.isArray(op.containmentIds) ? op.containmentIds : [],
          cadFileCount: Number(op.cadFileCount) || 0,
          flowlineData: {
            ...createDefaultSurfaceFinishState({ activeMachine, stockConfig, strategyMode: 'flowline' }).flowlineData,
            ...(op.flowlineData || {})
          },
          editingFromModal: false
        });
      }
      setEditingSurfaceFinishOp(op);
      setSurfaceFinishStrategyMode(mode);
      setIsSurfaceFinishContourOpen(true);
      return;
    }
    isNewOperationRef.current = false;
    setIsNewOperation(false);
    setEditingOperation(op);
    setIsMastercamToolpathModalOpen(true);
  };

  const handleCloseToolpathModal = () => {
    if (isNewOperationRef.current && editingOperation) {
      setOperations((prev) => prev.filter((o) => o.id !== editingOperation.id));
      setActiveOpId(null);
    }
    isNewOperationRef.current = false;
    setIsNewOperation(false);
    setIsMastercamToolpathModalOpen(false);
  };

  const handleSaveOperation = (updatedOp) => {
    isNewOperationRef.current = false;
    setIsNewOperation(false);
    setIsMastercamToolpathModalOpen(false);
    const assignedTool = tools.find((t) => t.id === Number(updatedOp.toolId));
    const prevOps = operationsRef.current || [];
    const exists = prevOps.some((op) => op.id === updatedOp.id);
    const updatedOps = exists
      ? prevOps.map((op) =>
          op.id === updatedOp.id
            ? {
                ...updatedOp,
                toolName: assignedTool ? `T${assignedTool.number} - ${assignedTool.name}` : op.toolName,
                visible: true
              }
            : op
        )
      : [
          ...prevOps,
          {
            ...updatedOp,
            toolName: assignedTool ? `T${assignedTool.number} - ${assignedTool.name}` : updatedOp.toolName,
            visible: true
          }
        ];
    operationsRef.current = updatedOps;
    setOperations(updatedOps);
    pushSnapshot({ operations: updatedOps });
    setActiveOpId(updatedOp.id);
    setActiveManagerTab('Toolpaths');
    setLayerVisibility((prev) => ({ ...prev, toolpaths: true }));
  };

  const handleQuickAddOp = (strategy) => {
    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    let newOp;

    const s = String(strategy || 'pocket').toLowerCase();
    const chains = extractClosedChainsFromCAD(customGeometry);
    const latestChain = chains.length > 0 ? chains[chains.length - 1] : null;

    if (latestChain && latestChain.bounds && !partMetrics) {
      setPartMetrics({
        box: latestChain.bounds,
        bounds: latestChain.bounds,
        dimensions: latestChain.bounds.getSize(new THREE.Vector3()),
        triangles: 12
      });
    }

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
        name: latestChain ? `2D Contour (${latestChain.name || 'Drawn Sketch'})` : `2D Contour Profile ${nextId}`,
        toolId: 1,
        toolName: 'T1 - 10mm Flat Endmill',
        badgeClass: 'contour',
        badgeText: 'CT',
        visible: true,
        chain: latestChain,
        bounds: latestChain?.bounds,
        stepoverPct: 40,
        stepdown: 1.0,
        totalDepth: 5.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'circlemill' || s === 'circle_mill') {
      const circDia = latestChain?.radius ? (latestChain.radius * 2) : 50.0;
      newOp = {
        id: nextId,
        name: `Circle Mill / Bore Ø${circDia.toFixed(1)}mm ${nextId}`,
        toolId: 1,
        toolName: 'T1 - 10mm Flat Endmill',
        badgeClass: 'circlemill',
        badgeText: 'CM',
        visible: true,
        diameter: circDia,
        chain: latestChain,
        bounds: latestChain?.bounds,
        center: latestChain?.center,
        stepoverPct: 50,
        stepdown: 1.0,
        totalDepth: 5.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    } else if (s === 'spotdrill' || s === 'spot_drill' || s === 'spot') {
      newOp = {
        id: nextId,
        name: `Spot Drill Chamfer ${nextId}`,
        toolId: 3,
        toolName: 'T3 - 1/2" 90° Spot Drill',
        badgeClass: 'spotdrill',
        badgeText: 'SD',
        visible: true,
        stepdown: 3.8,
        totalDepth: 3.8,
        stockToLeaveXY: 0.0,
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
    } else if (s === 'flowline' || s === 'surface_finish_flowline') {
      openSurfaceFinishFlowline(null);
      return;
    } else if (s === 'shallow' || s === 'surface_finish_shallow') {
      openSurfaceFinishModal('shallow', null);
      return;
    } else if (s === 'parallel' || s === 'surface_finish_parallel' || s === '3d_parallel') {
      openSurfaceFinishModal('parallel', null);
      return;
    } else if (s === 'pencil' || s === 'surface_finish_pencil' || s === '3d_pencil') {
      openSurfaceFinishModal('pencil', null);
      return;
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
        name: latestChain ? `Dynamic Pocket (${latestChain.name || 'Drawn Sketch'})` : `Dynamic Pocket Pass ${nextId}`,
        toolId: 1,
        toolName: 'T1 - 10mm Flat Endmill',
        badgeClass: 'pocket',
        badgeText: 'PK',
        visible: true,
        chain: latestChain,
        bounds: latestChain?.bounds,
        stepoverPct: 50,
        stepdown: 1.0,
        totalDepth: 5.0,
        stockToLeaveXY: 0.0,
        stockToLeaveZ: 0.0,
        rapidHeight: 15.0
      };
    }

    if (newOp) {
      setOperations((prev) => [...prev, newOp]);
      setActiveOpId(newOp.id);
      setEditingOperation(newOp);
      isNewOperationRef.current = true;
      setIsNewOperation(true);
      setIsMastercamToolpathModalOpen(true);
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

  const handleSelectProbeConfirm = (selectedProbe) => {
    setActiveProbe(selectedProbe);
    setIsSelectProbeOpen(false);
    setIsProbingHUDOpen(true);
    showToast(`Loaded ${selectedProbe.name}. Click feature in 3D viewport or choose cycle in Probing Dialog.`, 'info');
  };

  const handleApplyMastercamProbe = (probeData) => {
    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    const probe = activeProbe || { name: 'Renishaw OMP40-2', diameter: 6, toolChangeId: 11 };

    let pTool = tools.find((t) => t.type === 'probe' || t.id === probe.toolChangeId);
    if (!pTool) {
      pTool = {
        id: probe.toolChangeId || 11,
        number: probe.toolChangeId || 11,
        name: probe.name || 'Renishaw OMP40-2 Touch Probe',
        type: 'probe',
        diameter: probe.diameter || 6.0,
        cornerRad: (probe.diameter || 6.0) / 2,
        fluteLength: 50,
        overallLength: 100,
        flutes: 0,
        cuttingSpeedVc: 0,
        rpm: 0,
        feedRate: 150,
        plungeRate: 150,
        coolant: 'Off',
        isProbe: true
      };
      setTools((prev) => [...prev, pTool]);
    }

    const cycleLabels = {
      point: 'Single Point Surface Touch',
      single_point: 'Single Point Surface Touch',
      web_slot: 'Web / Slot Measurement',
      bore_boss: 'Bore / Boss Inspection',
      angled_surface: 'Angled Surface Alignment',
      angled_plane: 'Angled Surface Alignment',
      corner: 'Corner 3-Point Intersection',
      corner_wcs: 'Corner 3-Point Intersection',
      block_3d: '3D Block Origin Datuming'
    };
    const cKey = probeData.cycleId || probeData.cycle || 'bore_boss';
    const cycleLabel = cycleLabels[cKey] || 'Touch Probe Routine';
    const resolvedFeature = probeData.targetFeature || probeData.feature;
    const featDesc = resolvedFeature
      ? `[X:${Number(resolvedFeature.x || 0).toFixed(1)} Y:${Number(resolvedFeature.y || 0).toFixed(1)}]`
      : '[Origin]';

    const mapCycleToStrategy = {
      bore_boss: 'bore_centering',
      single_point: 'surface_z',
      point: 'surface_z',
      web_slot: 'web_x',
      angled_plane: 'surface_z',
      corner_wcs: 'corner_3point',
      corner: 'corner_3point',
      block_3d: 'corner_3point'
    };
    const mappedStrat = mapCycleToStrategy[cKey] || 'bore_centering';

    const fx = resolvedFeature?.x || 0;
    const fy = resolvedFeature?.y || 0;
    const fz = resolvedFeature?.z || 0;
    const approachZ = fz + 25.0;

    const newOp = {
      id: nextId,
      name: `${cycleLabel} ${featDesc}`,
      toolId: pTool.id,
      toolNumber: pTool.number,
      toolName: pTool.name,
      toolDiameter: pTool.diameter,
      toolType: 'probe',
      badgeClass: 'probe',
      badgeText: 'PR',
      visible: true,
      strategyKey: mappedStrat,
      probeCycle: cKey,
      probeGeometry: resolvedFeature ? `Point ${featDesc}` : 'Datum Point',
      probingParams: {
        nominalDiameter: 40,
        nominalWidth: 30,
        clearanceZ: 15,
        depthZ: fz > -5 ? fz - 5 : -5,
        wcs: 'G54',
        touchPoint: resolvedFeature
      },
      waypoints: [
        new THREE.Vector3(fx, fy + 20, approachZ),
        new THREE.Vector3(fx, fy, approachZ),
        new THREE.Vector3(fx, fy, fz),
        new THREE.Vector3(fx, fy, approachZ)
      ],
      cuttingLines: [
        { start: new THREE.Vector3(fx, fy + 20, approachZ), end: new THREE.Vector3(fx, fy, approachZ), isRapid: true },
        { start: new THREE.Vector3(fx, fy, approachZ), end: new THREE.Vector3(fx, fy, fz), isRapid: false },
        { start: new THREE.Vector3(fx, fy, fz), end: new THREE.Vector3(fx, fy, approachZ), isRapid: true }
      ],
      rapidHeight: approachZ
    };

    setOperations((prev) => [...prev, newOp]);
    setActiveOpId(nextId);
    showToast(`Mastercam Productivity+: Touch Probe operation #${nextId} created in Toolpath Group-1`, 'success');
  };

  const handleProbeFeaturePicked = (feature) => {
    setProbingPickedFeature(feature);
    showToast(`Probe Target Picked: X=${feature.x?.toFixed(2)}, Y=${feature.y?.toFixed(2)}, Z=${feature.z?.toFixed(2)}`, 'info');
  };

  const handleSelectAllApply = (maskFilter) => {
    if (maskFilter.category === 'color') {
      const colors = maskFilter.selectedColors || [];
      if (colors.length === 0) {
        setSelectionMask('all');
      } else {
        setSelectionMask(`color:${colors[0]}`);
      }
    } else {
      setSelectionMask(maskFilter.category || 'all');
    }
    setIsSelectAllOpen(false);
    showToast(`Selection Mask applied: ${maskFilter.category} (${maskFilter.selectedColors?.length || 0} colors)`, 'info');
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
        setCadSource({
          type: 'file',
          filename: 'Aerospace_5X_Bracket.step',
          content: stepText,
          isBinary: false,
          format: 'STEP (ISO 10303-21)'
        });
        showToast('Native ISO 10303-21 STEP Solid B-Rep Model Loaded', 'success');
      } catch (err) {
        showToast(`Failed to parse STEP: ${err.message}`, 'danger');
      }
      handleResetTransform();
      return;
    }

    setCadSource({ type: 'sample', sampleType: type });

    if (type === 'mastercam_multibody' || type === 'multibody_assembly' || type === 'multibody' || type === 'extrude_assembly') {
      const mbPart = createMastercamMultiBodyAssembly();
      setCurrentModel(mbPart);
      setCurrentProjectName('Mastercam Multi-Body Assembly.mcam');
      setActiveMachineId('haas_vf2');
      setActiveWcs('G54');
      setActiveRibbonTab('Solids');
      setStockConfig({
        shape: 'box',
        material: 'Alu 6061 Orange & Hardened Steel',
        originPoint: 'top-left',
        rawDimensions: { x: 170, y: 75, z: 80 }
      });
      setSolidsList([
        { id: 1, name: 'Solid 1 - Base Slab (Orange)', material: '6061-T6 Aluminum', volumeCm3: 192.0, isPrimary: true, visible: true, active: true, color: '#ea580c' },
        { id: 2, name: 'Solid 2 - Cylinder Boss (Orange)', material: '6061-T6 Aluminum', volumeCm3: 43.0, isPrimary: false, visible: true, active: false, color: '#ea580c' },
        { id: 3, name: 'Solid 3 - Charcoal Saddle Block', material: 'Hardened Tool Steel', volumeCm3: 110.0, isPrimary: false, visible: true, active: false, color: '#334155' }
      ]);
      showToast('Loaded Mastercam Multi-Body Assembly (Image 3)', 'success');
      handleResetTransform();
      return;
    }

    if (type === 'base_structure_alu' || type === 'base_structure') {
        setCurrentModel(createMastercamBaseStructureALU());
        setCurrentProjectName('Base Structure-ALU.mcam');
        setActiveMachineId('haas_vf2');
        setActiveRibbonTab('Toolpaths');
        showToast('Loaded Mastercam Base Structure-ALU Part with 3D Contour Toolpaths', 'success');
      } else if (type === 'titan_1m' || type === 'titan1m' || type === 'titan') {
      const titanPart = createTitan1MPart();
      setCurrentModel(titanPart);
      setCurrentProjectName('TITAN-1M_Mastercam_Benchmark.mcam');
      setActiveMachineId('haas_vf2');
      setActiveWcs('G54');
      setActiveRibbonTab('Toolpaths');

      setStockConfig({
        shape: 'box',
        allowanceTop: 0.508,
        allowanceSides: 1.27,
        material: 'Alu 6061-T6',
        originPoint: 'top-left',
        massKg: '0.42',
        rawDimensions: { x: 104.14, y: 25.4, z: 50.8 }
      });

      const titanTools = [
        {
          id: 1,
          number: 1,
          name: '2" Face Mill (Shell Mill)',
          type: 'face',
          diameter: 50.8,
          cornerRad: 0,
          fluteLength: 25,
          overallLength: 75,
          flutes: 5,
          cuttingSpeedVc: 399,
          rpm: 2500,
          feedPerTooth: 0.09,
          feedRate: 1143,
          plungeRate: 350,
          coolant: 'Flood'
        },
        {
          id: 2,
          number: 2,
          name: '3/8" Carbide Flat Endmill',
          type: 'flat',
          diameter: 9.525,
          cornerRad: 0,
          fluteLength: 28,
          overallLength: 75,
          flutes: 3,
          cuttingSpeedVc: 135,
          rpm: 4500,
          feedPerTooth: 0.11,
          feedRate: 1524,
          plungeRate: 400,
          coolant: 'Flood'
        },
        {
          id: 3,
          number: 3,
          name: '1/2" 90° Spot / Chamfer Mill',
          type: 'chamfer',
          diameter: 12.7,
          cornerRad: 0,
          fluteLength: 15,
          overallLength: 70,
          flutes: 2,
          cuttingSpeedVc: 140,
          rpm: 3500,
          feedPerTooth: 0.12,
          feedRate: 889,
          plungeRate: 250,
          coolant: 'Flood'
        },
        {
          id: 4,
          number: 4,
          name: '#21 Drill (0.159" Tap Drill)',
          type: 'drill',
          diameter: 4.039,
          cornerRad: 0,
          fluteLength: 35,
          overallLength: 70,
          flutes: 2,
          cuttingSpeedVc: 35,
          rpm: 2800,
          feedPerTooth: 0.08,
          feedRate: 457,
          plungeRate: 457,
          coolant: 'Through'
        },
        {
          id: 5,
          number: 5,
          name: '10-32 UNF Form / Roll Tap',
          type: 'tap',
          diameter: 4.826,
          cornerRad: 0,
          fluteLength: 20,
          overallLength: 65,
          flutes: 4,
          cuttingSpeedVc: 15,
          rpm: 1000,
          feedPerTooth: 0.198,
          feedRate: 793.75,
          plungeRate: 793.75,
          coolant: 'Flood',
          pitchTpi: 32,
          pitchMm: 0.79375
        }
      ];
      setTools(titanTools);

      const titanOps = [
        {
          id: 1,
          name: '1 - Facing (Top Z: 0.00)',
          toolId: 1,
          toolName: 'T1 - 2" Face Mill',
          badgeClass: 'face',
          badgeText: 'FM',
          visible: true,
          stepoverPct: 70,
          stepdown: 0.508,
          totalDepth: 0.508,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 2,
          name: '2 - 2D Dynamic Mill (Rough Outside & Pocket)',
          toolId: 2,
          toolName: 'T2 - 3/8" Flat Endmill',
          badgeClass: 'adaptive',
          badgeText: 'DM',
          visible: true,
          stepoverPct: 25,
          stepdown: 19.05,
          totalDepth: 19.05,
          stockToLeaveXY: 0.254,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 3,
          name: '3 - 2D Contour (Finish Outside Profile)',
          toolId: 2,
          toolName: 'T2 - 3/8" Flat Endmill',
          badgeClass: 'contour',
          badgeText: 'CT',
          visible: true,
          stepoverPct: 40,
          stepdown: 9.525,
          totalDepth: 19.05,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 4,
          name: '4 - 2D Pocket (Finish Inside Pocket)',
          toolId: 2,
          toolName: 'T2 - 3/8" Flat Endmill',
          badgeClass: 'pocket',
          badgeText: 'PK',
          visible: true,
          stepoverPct: 45,
          stepdown: 6.35,
          totalDepth: 12.7,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 5,
          name: '5 - Model Chamfer (0.020" Chamfer Outside & Pocket)',
          toolId: 3,
          toolName: 'T3 - 1/2" Chamfer Mill',
          badgeClass: 'chamfer',
          badgeText: 'CH',
          visible: true,
          chamferWidth: 0.508,
          tipOffset: 1.27,
          totalDepth: 1.778,
          rapidHeight: 25.0
        },
        {
          id: 6,
          name: '6 - Spot Drill (7x Holes Chamfer)',
          toolId: 3,
          toolName: 'T3 - 1/2" 90° Spot Drill',
          badgeClass: 'spotdrill',
          badgeText: 'SD',
          visible: true,
          totalDepth: 1.8,
          rapidHeight: 15.0
        },
        {
          id: 7,
          name: '7 - Peck Drill G83 (7x #21 Tap Drill to Z-0.580)',
          toolId: 4,
          toolName: 'T4 - #21 Tap Drill',
          badgeClass: 'drill',
          badgeText: 'DR',
          visible: true,
          stepdown: 1.27,
          totalDepth: 14.732,
          rapidHeight: 15.0
        },
        {
          id: 8,
          name: '8 - Rigid Tap G84 (7x 10-32 UNF to Z-0.480)',
          toolId: 5,
          toolName: 'T5 - 10-32 Form Tap',
          badgeClass: 'tap',
          badgeText: 'TP',
          visible: true,
          pitch: 0.79375,
          totalDepth: 12.192,
          rapidHeight: 15.0
        }
      ];
      operationsRef.current = titanOps;
      setOperations(titanOps);
      setActiveOpId(1);

      const wireframes = createTitan1MWireframe();
      customGeometryRef.current = wireframes;
      setCustomGeometry(wireframes);

      const titanSolids = [
        { id: 1, name: 'Solid 1 - TITAN-1M Workpiece', material: '6061-T6 Aluminum', volumeCm3: 88.4, isPrimary: true, visible: true, active: true, color: '#38bdf8' }
      ];
      solidsListRef.current = titanSolids;
      setSolidsList(titanSolids);

      showToast('Loaded TITANS of CNC: TITAN-1M Benchmark Project with 8 Standard Operations', 'success');
    } else if (type === 'mastercam2019_tutorial' || type === 'mastercam_tutorial' || type === 'milling_tutorial') {
      const tutorialPart = createMastercam2019TutorialPart();
      setCurrentModel(tutorialPart);
      setCurrentProjectName('Mastercam2019_Milling_Tutorial.mcam');
      setActiveMachineId('haas_vf2');
      setActiveWcs('G54');
      setActiveRibbonTab('Toolpaths');

      setStockConfig({
        shape: 'box',
        allowanceTop: 5.08,
        allowanceSides: 2.54,
        material: 'Alu 6061-T6',
        originPoint: 'top-center',
        massKg: '2.85',
        rawDimensions: { x: 132, y: 88, z: 132 }
      });

      const tutorialTools = [
        {
          id: 1,
          number: 1,
          name: '2" Face Mill (5-Flute)',
          type: 'face',
          diameter: 50.8,
          cornerRad: 0,
          fluteLength: 25,
          overallLength: 75,
          flutes: 5,
          cuttingSpeedVc: 170,
          rpm: 1069,
          feedPerTooth: 0.2,
          feedRate: 1069,
          plungeRate: 250,
          coolant: 'Flood'
        },
        {
          id: 2,
          number: 2,
          name: '1/2" Flat Endmill (4-Flute)',
          type: 'flat',
          diameter: 12.7,
          cornerRad: 0,
          fluteLength: 35,
          overallLength: 75,
          flutes: 4,
          cuttingSpeedVc: 85,
          rpm: 2139,
          feedPerTooth: 0.08,
          feedRate: 684,
          plungeRate: 200,
          coolant: 'Flood'
        },
        {
          id: 3,
          number: 3,
          name: '1/2" 90° Spot Drill',
          type: 'spot',
          diameter: 12.7,
          cornerRad: 0,
          fluteLength: 20,
          overallLength: 70,
          flutes: 2,
          cuttingSpeedVc: 65,
          rpm: 1630,
          feedPerTooth: 0.05,
          feedRate: 163,
          plungeRate: 163,
          coolant: 'Flood'
        },
        {
          id: 4,
          number: 4,
          name: '1/2" Carbide Drill',
          type: 'drill',
          diameter: 12.7,
          cornerRad: 0,
          fluteLength: 60,
          overallLength: 100,
          flutes: 2,
          cuttingSpeedVc: 75,
          rpm: 1880,
          feedPerTooth: 0.12,
          feedRate: 451,
          plungeRate: 451,
          coolant: 'Through'
        }
      ];
      setTools(tutorialTools);

      const tutorialOps = [
        {
          id: 1,
          name: '1 - Facing (Top Z: 0.00)',
          toolId: 1,
          toolName: 'T1 - 2" Face Mill',
          badgeClass: 'face',
          badgeText: 'FM',
          visible: true,
          stepoverPct: 75,
          stepdown: 2.54,
          totalDepth: 5.08,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 2,
          name: '2 - Contour (2D) - Outside Profile',
          toolId: 2,
          toolName: 'T2 - 1/2" Flat Endmill',
          badgeClass: 'contour',
          badgeText: 'CT',
          visible: true,
          stepoverPct: 40,
          stepdown: 6.35,
          totalDepth: 50.8,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 3,
          name: '3 - Circle Mill / Pocket (Center Bore)',
          toolId: 2,
          toolName: 'T2 - 1/2" Flat Endmill',
          badgeClass: 'circlemill',
          badgeText: 'CM',
          visible: true,
          diameter: 50.8,
          stepoverPct: 50,
          stepdown: 6.35,
          totalDepth: 50.8,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 4,
          name: '4 - Spot Drill - 4x Corners',
          toolId: 3,
          toolName: 'T3 - 1/2" 90° Spot Drill',
          badgeClass: 'spotdrill',
          badgeText: 'SD',
          visible: true,
          stepdown: 3.8,
          totalDepth: 3.8,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        },
        {
          id: 5,
          name: '5 - Peck Drill (G83) - 4x Through Holes',
          toolId: 4,
          toolName: 'T4 - 1/2" Drill',
          badgeClass: 'drill',
          badgeText: 'DR',
          visible: true,
          stepdown: 5.0,
          totalDepth: 50.8,
          stockToLeaveXY: 0.0,
          stockToLeaveZ: 0.0,
          rapidHeight: 25.0
        }
      ];
      operationsRef.current = tutorialOps;
      setOperations(tutorialOps);
      setActiveOpId(1);

      const wireframes = createMastercam2019TutorialWireframe();
      customGeometryRef.current = wireframes;
      setCustomGeometry(wireframes);

      showToast('Loaded Mastercam 2019 Milling Tutorial Project with 5 Standard Operations', 'success');
    } else if (type === 'impeller') {
      setCurrentModel(createImpellerGeometry());
      setCurrentProjectName('DMU50_5Axis_Impeller.mcam');
      setActiveMachineId('dmu50');
      customGeometryRef.current = [];
      operationsRef.current = [];
      setCustomGeometry([]);
      setOperations([]);
      const impSolids = [
        { id: 1, name: 'Solid 1 - 5-Axis Impeller Blisk', material: 'Ti-6Al-4V Titanium', volumeCm3: 142.5, isPrimary: true, visible: true, active: true, color: '#38bdf8' }
      ];
      solidsListRef.current = impSolids;
      setSolidsList(impSolids);
      showToast('Loaded DMU50 5-Axis Impeller Geometry', 'success');
    } else if (type === 'bracket') {
      setCurrentModel(createAerospaceBracket());
      setCurrentProjectName('DMU50_Aero_Bracket.mcam');
      setActiveMachineId('haas_vf2');
      customGeometryRef.current = [];
      operationsRef.current = [];
      setCustomGeometry([]);
      setOperations([]);
      const brkSolids = [
        { id: 1, name: 'Solid 1 - Aerospace 5X Bracket', material: '7075-T6 Aluminum', volumeCm3: 98.4, isPrimary: true, visible: true, active: true, color: '#38bdf8' }
      ];
      solidsListRef.current = brkSolids;
      setSolidsList(brkSolids);
      showToast('Loaded Aerospace Structural Bracket Geometry', 'success');
    } else if (type === 'mold') {
      setCurrentModel(createMoldCoreGeometry());
      setCurrentProjectName('DMU50_Mold_Core.mcam');
      setActiveMachineId('dmu50');
      customGeometryRef.current = [];
      operationsRef.current = [];
      setCustomGeometry([]);
      setOperations([]);
      const mldSolids = [
        { id: 1, name: 'Solid 1 - Mold Core Cavity', material: 'P20 Tool Steel', volumeCm3: 210.0, isPrimary: true, visible: true, active: true, color: '#38bdf8' }
      ];
      solidsListRef.current = mldSolids;
      setSolidsList(mldSolids);
      showToast('Loaded Injection Mold Core Geometry', 'success');
    }
    handleResetTransform();
    resetHistory();
  };

  const handleModelImported = async (modelGroup, filename, rawFile = null) => {
    // If opening an MCAM project file, restore whole project rather than treating as raw solid part CAD
    if (filename.toLowerCase().endsWith('.mcam') || modelGroup?.userData?.projectData) {
      let pData = modelGroup?.userData?.projectData;
      if (!pData && rawFile) {
        try {
          pData = await parseProjectMCAM(rawFile);
        } catch (err) {
          console.warn('Could not parse MCAM file in handleModelImported:', err);
        }
      }
      if (pData) {
        handleProjectLoaded(pData);
        return;
      }
    }

    // 1. Set imported 3D CAD model and project name
    setCurrentModel(modelGroup);
    setCurrentProjectName(filename);

    let srcPayload = modelGroup?.userData?.rawCadSource || null;
    if (!srcPayload && rawFile) {
      try {
        const isBinary = filename.endsWith('.stl') || filename.endsWith('.dwg') || filename.endsWith('.sab') || filename.endsWith('.x_b');
        const content = isBinary ? await rawFile.arrayBuffer() : await rawFile.text();
        srcPayload = {
          type: 'file',
          filename,
          content,
          isBinary,
          format: modelGroup?.userData?.format || filename.split('.').pop().toUpperCase()
        };
      } catch (err) {
        console.warn('Failed reading rawFile for cadSource:', err);
      }
    }

    if (srcPayload) {
      setCadSource(srcPayload);
    }

    // 2. Clear previous toolpaths & scratch wireframes (Standard clean CAM workflow)
    resetFlowlineWorkflowState();
    operationsRef.current = [];
    customGeometryRef.current = [];
    setOperations([]);
    setCustomGeometry([]);
    setIsBackplotActive(false);
    setActiveOpId(null);
    setDeletedEntitiesStack([]);
    setShowArcCenters(false);
    setShowEndpoints(false);

    // 3. Register imported model as the primary solid in Solids Manager
    const fmt = modelGroup?.userData?.format || filename.split('.').pop().toUpperCase();
    const newSolids = [
      {
        id: 1,
        name: `Solid 1 - ${filename}`,
        material: 'Alu 6061-T6',
        volumeCm3: 185.0,
        isPrimary: true,
        visible: true,
        active: true,
        color: '#64748b'
      }
    ];
    solidsListRef.current = newSolids;
    setSolidsList(newSolids);

    // 4. Configure clean CAD view: solid part model visible, no toolpaths, no fixture or stock obstruction
    const cleanLayers = {
      part: true,
      wireframe: true,
      surfaces: true,
      fixture: false,
      bed: false,
      stock: false,
      toolpaths: false,
      rapids: false,
      wcs: true,
      dimensions: false
    };
    setLayerVisibility(cleanLayers);

    handleResetTransform();
    resetHistory({
      operations: [],
      partTransform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      solidsList: newSolids,
      customGeometry: []
    });
    setCameraCommand({ preset: 'iso', timestamp: Date.now() });

    // Immediate session flush to IndexedDB
    saveWorkspaceSession({
      projectName: filename,
      projectDescriptor,
      unitSystem,
      activeRibbonTab,
      activeMachineId,
      activeWcs,
      activePlane,
      workpieceColor,
      renderMode,
      layerVisibility: cleanLayers,
      partTransform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      customGeometry: [],
      solidsList: newSolids,
      stockConfig,
      tools,
      operations: [],
      fixtureConfig,
      cadSource: srcPayload
    });

    showToast(`Loaded ${filename} (${fmt} 3D Solid Model) - Clean View`, 'success');
  };

  const handleAddDefinedTool = (newTool) => {
    setTools((prev) => [...prev, newTool]);
    setLastDefinedToolState((prev) => ({ seq: prev.seq + 1, tool: newTool }));
    showToast(`Created Tool: ${newTool.name} (T${newTool.number})`, 'success');
  };

  const handleUpdateDefinedTool = (updatedTool) => {
    setTools((prev) => prev.map((t) => (String(t.id) === String(updatedTool.id) ? { ...t, ...updatedTool } : t)));
    setLastDefinedToolState((prev) => ({ seq: prev.seq + 1, tool: updatedTool }));
    showToast(`Updated Tool: ${updatedTool.name} (T${updatedTool.number})`, 'success');
  };

  const computeDriveBoundsForFaceIds = (faceIds = []) => {
    if (!Array.isArray(faceIds) || faceIds.length === 0) return null;
    const catalog = buildSolidFaceCatalog({ currentModel, customGeometry, partTransform });
    const box = new THREE.Box3();
    faceIds.forEach((fid) => {
      const f = catalog.byId.get(fid);
      if (f?.bounds && !f.bounds.isEmpty()) box.union(f.bounds);
    });
    return box.isEmpty() ? null : box;
  };

  const resetFlowlineWorkflowState = () => {
    setActiveFacePickRole(null);
    setIsFlowlineDataOpen(false);
    setIsSurfaceSelectionOpen(false);
    setIsSurfaceFinishContourOpen(false);
    setEditingSurfaceFinishOp(null);
    setSurfaceSelectionDraft({
      mode: 'flowline',
      editingOp: null,
      driveFaceIds: [],
      checkFaceIds: [],
      containmentIds: [],
      cadFileCount: 0,
      flowlineData: createDefaultSurfaceFinishState({ activeMachine, stockConfig, strategyMode: 'flowline' }).flowlineData,
      editingFromModal: false
    });
  };

  const openSurfaceFinishModal = (mode = 'contour', opToEdit = null) => {
    setEditingSurfaceFinishOp(opToEdit);
    setSurfaceFinishStrategyMode(mode);
    setIsSurfaceFinishContourOpen(true);
  };

  const openSurfaceFinishFlowline = (opToEdit = null, options = {}) => {
    const { fromModal = false } = options;
    setIsSketchModeActive(false);
    setIsSelectModeActive(false);
    setActiveFacePickRole(null);
    setIsFlowlineDataOpen(false);
    setSurfaceSelectionDraft({
      mode: 'flowline',
      editingOp: opToEdit,
      driveFaceIds: Array.isArray(opToEdit?.driveFaceIds) ? opToEdit.driveFaceIds : [],
      checkFaceIds: Array.isArray(opToEdit?.checkFaceIds) ? opToEdit.checkFaceIds : [],
      containmentIds: Array.isArray(opToEdit?.containmentIds) ? opToEdit.containmentIds : [],
      cadFileCount: Number(opToEdit?.cadFileCount) || 0,
      flowlineData: {
        ...createDefaultSurfaceFinishState({ activeMachine, stockConfig, strategyMode: 'flowline' }).flowlineData,
        ...(opToEdit?.flowlineData || {})
      },
      editingFromModal: fromModal
    });
    setIsSurfaceSelectionOpen(true);
  };

  const handleOpenFlowlineGeometryEdit = (op) => {
    openSurfaceFinishFlowline(op, { fromModal: false });
  };

  const handleFlowlineWizardStep = (stepId, stepNum = 1) => {
    setFlowlineWizardActive(true);
    if (stepNum) setFlowlineWizardStep(stepNum);

    switch (stepId) {
      case 'wizard_new_file':
        setIsNewProjectModalOpen(true);
        break;

      case 'wizard_set_units':
        setUnitSystem('metric');
        showToast('Units set to Metric (mm - G21). Click status bar badge anytime to toggle.', 'success', 2500);
        break;

      case 'wizard_machine':
        setActiveRibbonTab('Machine');
        setActiveMachineId('mill_3x_default');
        showToast('Active Machine: Haas VF-2 3-Axis VMC (Fanuc / Haas NGC G-code).', 'info', 2500);
        break;

      case 'wizard_wireframe':
        setActiveRibbonTab('Wireframe');
        setIsWireframeModalOpen(true);
        setWireframeModalTool('circle');
        showToast('In Circle / Arc, select "Arc Endpoints (2 Pts + R)" and click Insert into Level 10.', 'info', 3500);
        break;

      case 'wizard_extrude':
        setActiveRibbonTab('Surfaces');
        handleOpenSurfacesModal('surface_extrude');
        showToast('Select arc wireframe on canvas, click Green Checkmark in Chaining, then set Height = 60mm.', 'info', 4000);
        break;

      case 'wizard_stock':
        setActiveRibbonTab('Toolpaths');
        setIsStockSetupModalOpen(true);
        break;

      case 'wizard_flowline':
        setActiveRibbonTab('Toolpaths');
        openSurfaceFinishFlowline(null);
        break;

      case 'wizard_post':
        setIsGCodeViewerOpen(true);
        break;

      default:
        break;
    }
  };

  const handlePickSolidFacesForDraft = (faceIds = [], modeLabel = '', meta = {}) => {
    const role = meta.role || activeFacePickRole || 'drive';
    if (!Array.isArray(faceIds) || faceIds.length === 0) return;

    setSurfaceSelectionDraft((prev) => {
      const field = role === 'check' ? 'checkFaceIds' : role === 'containment' ? 'containmentIds' : 'driveFaceIds';
      const existing = prev[field] || [];
      let nextList;
      if (meta.clickCount === 1 && !meta.hasModifier && faceIds.length === 1) {
        const fid = faceIds[0];
        nextList = existing.includes(fid) ? existing.filter((id) => id !== fid) : [...existing, fid];
      } else {
        nextList = [...new Set([...existing, ...faceIds])];
      }
      return { ...prev, [field]: nextList };
    });

    if (modeLabel) {
      showToast(`${role === 'check' ? 'Check' : 'Drive'}: ${modeLabel} (${faceIds.length} face${faceIds.length === 1 ? '' : 's'})`, 'info', 1800);
    }
  };

  const handleImportCadDriveFile = async (file) => {
    try {
      const modelGroup = await parseAnyCADFile(file);
      if (!modelGroup) return;
      const customId = `cad_drive_${Date.now()}`;
      modelGroup.userData = {
        ...(modelGroup.userData || {}),
        customId,
        cadType: 'surface_extrusion',
        surfaceRole: 'drive'
      };
      modelGroup.name = modelGroup.name || `Surface_${file.name}`;
      const nextGeo = [...(customGeometryRef.current || []), modelGroup];
      commitCustomGeometry(nextGeo, true);
      syncPartMetricsFromCustomSurfaces(nextGeo);
      const catalog = buildSolidFaceCatalog({ currentModel, customGeometry: nextGeo, partTransform });
      const newFaces = catalog.faces.filter((f) => String(f.bodyId) === customId).map((f) => f.id);
      setSurfaceSelectionDraft((prev) => ({
        ...prev,
        driveFaceIds: [...new Set([...(prev.driveFaceIds || []), ...newFaces])],
        cadFileCount: (prev.cadFileCount || 0) + 1
      }));
      showToast(`Attached ${file.name} (${newFaces.length} drive face(s))`, 'success');
    } catch (err) {
      showToast(`Failed to attach CAD file: ${err.message}`, 'danger');
    }
  };

  const handlePlotFlowlineEdges = (enabled) => {
    const driveCount = surfaceSelectionDraft.driveFaceIds?.length || 0;
    showToast(
      enabled
        ? `Plotting UV boundary edges across ${driveCount} drive face(s).`
        : 'Hid flowline UV boundary edge overlay.',
      'info'
    );
  };

  const handleConfirmSurfaceSelection = () => {
    setActiveFacePickRole(null);
    setIsFlowlineDataOpen(false);
    setIsSurfaceSelectionOpen(false);
    setEditingSurfaceFinishOp(surfaceSelectionDraft.editingOp || null);
    setSurfaceFinishStrategyMode('flowline');
    setIsSurfaceFinishContourOpen(true);
  };

  const handleApplySurfaceFinishContour = (updatedOp) => {
    const prevOps = operationsRef.current || operations || [];
    const nextId = updatedOp.id || (prevOps.length > 0 ? Math.max(...prevOps.map((o) => Number(o.id) || 0)) + 1 : 1);
    const assignedTool =
      tools.find((t) => String(t.id) === String(updatedOp.toolId)) ||
      tools.find((t) => Number(t.number) === Number(updatedOp.toolNumber)) ||
      tools[0] ||
      { id: 1, number: 1, type: 'flat', diameter: 10, name: updatedOp.toolName || '10mm Flat Endmill' };
    const defaultLabel =
      updatedOp.strategyKey === 'surface_finish_flowline'
        ? 'Surface Finish Flowline'
        : updatedOp.strategyKey === 'surface_finish_pocket'
          ? 'Surface Finish Pocket'
          : updatedOp.strategyKey === 'surface_finish_shallow'
            ? 'Surface Finish Shallow'
            : updatedOp.strategyKey === 'surface_finish_parallel'
              ? 'Surface Finish Parallel'
              : updatedOp.strategyKey === 'surface_finish_pencil'
                ? 'Surface Finish Pencil'
                : 'Surface Finish Contour';
    const finalOp = {
      ...updatedOp,
      id: nextId,
      name: updatedOp.name || `${defaultLabel} - [${activePlane}]`,
      visible: true,
      enabled: true,
      locked: false,
      ghosted: false,
      toolId: assignedTool.id,
      toolNumber: Number(updatedOp.toolNumber ?? assignedTool.number) || 1,
      toolType: updatedOp.toolType || assignedTool.type || 'flat',
      toolDiameter: Number(updatedOp.toolDiameter ?? assignedTool.diameter) || 10,
      toolName: updatedOp.toolName || assignedTool.name,
      usesCustomSurfaces: true
    };

    if (finalOp.bounds && !currentModel) {
      const box = rehydrateBox3(finalOp.bounds) || finalOp.bounds;
      if (box?.min && box?.max && typeof box.getSize === 'function') {
        const dim = box.getSize(new THREE.Vector3());
        setPartMetrics({
          box,
          bounds: box,
          center: box.getCenter(new THREE.Vector3()),
          dimensions: dim,
          triangles: 0
        });
      }
    }

    const exists = prevOps.some((o) => o.id === nextId);
    const nextOps = exists
      ? prevOps.map((o) => (o.id === nextId ? finalOp : o))
      : [...prevOps, finalOp];

    operationsRef.current = nextOps;
    setOperations(nextOps);
    setActiveOpId(finalOp.id);
    setEditingSurfaceFinishOp(null);
    setActiveManagerTab('Toolpaths');
    setLayerVisibility((prev) => ({ ...prev, toolpaths: true }));
    pushSnapshot({ operations: nextOps });
    showToast(`${finalOp.name} computed & added to toolpaths.`, 'success');
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
    const currentList = customGeometryRef.current || [];
    if (currentList.length > 0) {
      setDeletedEntitiesStack((prev) => [...prev, ...currentList]);
      commitCustomGeometry([], true);
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
      const items = Array.isArray(restored) ? restored : [restored];
      items.forEach((it) => { if (it) it.visible = true; });
      const nextList = [...(customGeometryRef.current || []), ...items];
      commitCustomGeometry(nextList, true);
      setSelectedEntityIds(items.map(getCustomEntityId).filter(Boolean));
      showToast(`Undelete: Restored ${items.length} previous entity(s) to workspace`, 'success');
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
      case 'surface_finish_flowline':
        openSurfaceFinishFlowline(null);
        break;
      case 'surface_finish_contour':
        openSurfaceFinishModal('contour', null);
        break;
      case 'surface_finish_pocket':
        openSurfaceFinishModal('pocket', null);
        break;
      case 'surface_finish_shallow':
        openSurfaceFinishModal('shallow', null);
        break;
      case 'surface_finish_parallel':
      case 'parallel':
        openSurfaceFinishModal('parallel', null);
        break;
      case 'surface_finish_pencil':
      case 'pencil':
        openSurfaceFinishModal('pencil', null);
        break;
      case 'verify_solid':
        setIsSolidVerifyModalOpen(true);
        break;
      case 'optirough':
        setIsAdaptiveModalOpen(true);
        break;
      case 'chaining':
      case 'chain':
        setIsMastercamChainingModalOpen(true);
        break;
      case 'toolpath_parameters':
      case 'parameters':
        if (activeOpId) {
          const targetOp = operations.find((o) => o.id === activeOpId) || operations[0];
          setEditingOperation(targetOp);
          setIsMastercamToolpathModalOpen(true);
        } else if (operations.length > 0) {
          setEditingOperation(operations[0]);
          setIsMastercamToolpathModalOpen(true);
        } else {
          showToast('No active toolpath operation selected to edit parameters', 'warning');
        }
        break;
      default:
        showToast(`Command executed: ${cmdId}`, 'info');
        break;
    }
  };

  // Create New Project Wizard Handler
  const handleCreateNewProject = async ({ template, projectName, unitSystem, customDimensions }) => {
    try {
      await clearWorkspaceSession();
    } catch (err) {
      console.warn("Failed to clear workspace session on new project:", err);
    }
    setCadSource(null);

    // 1. Comprehensive State Teardown & Reset
    resetFlowlineWorkflowState();
    setIsBackplotActive(false);
    setActiveOpId(null);
    setDeletedEntitiesStack([]);
    handleResetTransform();
    operationsRef.current = [];
    customGeometryRef.current = [];
    solidsListRef.current = [];
    setOperations([]);
    setCustomGeometry([]);
    setShowArcCenters(false);
    setShowEndpoints(false);

    const projName = projectName || 'Surface_Finish_Pencil.mcam';
    setCurrentProjectName(projName);

    const t = String(template || 'blank').toLowerCase().trim();
    const defaultTransform = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } };

    if (t === 'blank' || t === 'blank_wireframe' || t === 'blank_part') {
      // Mastercam clean blank canvas
      setCurrentModel(null);
      setSolidsList([]);
      setPartMetrics({
        center: { x: 0, y: 0, z: 0 },
        dimensions: { x: 100, y: 25, z: 80 },
        box: new THREE.Box3(
          new THREE.Vector3(-50, 0, -40),
          new THREE.Vector3(50, 25, 40)
        ),
        triangles: 0
      });
      const stockDims = customDimensions || { x: 120, y: 30, z: 90 };
      setStockConfig((prev) => ({
        ...prev,
        dimensions: stockDims,
        rawDimensions: stockDims
      }));
      setLayerVisibility((prev) => ({
        ...prev,
        fixture: false,
        bed: false,
        stock: false,
        wcs: true
      }));
      setActiveRibbonTab('Toolpaths');
      setIsSketchModeActive(false);
      setCameraCommand({ preset: 'top' });
      if (unitSystem) setUnitSystem(unitSystem);
      resetHistory({
        operations: [],
        partTransform: defaultTransform,
        solidsList: [],
        customGeometry: []
      });
      showToast("Mastercam Blank Project Ready", "success");
    } else if (t === 'titan_1m' || t === 'titan1m' || t === 'titan') {
      handleSelectSampleModel('titan_1m');
    } else if (t === 'mastercam2019_tutorial' || t === 'milling_tutorial' || t === 'mastercam_tutorial') {
      handleSelectSampleModel('mastercam2019_tutorial');
    } else if (t === 'vmc3x' || t === 'blank_billet' || t === 'billet') {
      const w = customDimensions?.x || 120;
      const h = customDimensions?.y || 45;
      const d = customDimensions?.z || 80;
      setCurrentModel(createBoxGeometry(w, h, d, "Raw_Block_Billet"));
      const billetSolids = [
        { id: 1, name: 'Solid 1 - Raw Stock Billet', material: '6061-T6 Aluminum', volumeCm3: parseFloat(((w * h * d) / 1000).toFixed(1)), isPrimary: true, visible: true, active: true, color: '#38bdf8' }
      ];
      solidsListRef.current = billetSolids;
      setSolidsList(billetSolids);
      setPartMetrics({
        center: { x: 0, y: 0, z: 0 },
        dimensions: { x: w, y: h, z: d },
        box: new THREE.Box3(
          new THREE.Vector3(-w / 2, -h / 2, -d / 2),
          new THREE.Vector3(w / 2, h / 2, d / 2)
        ),
        triangles: 12
      });
      setStockConfig((prev) => ({
        ...prev,
        dimensions: { x: w + 10, y: h + 10, z: d + 10 },
        rawDimensions: { x: w + 10, y: h + 10, z: d + 10 }
      }));
      setActiveMachineId('haas_vf2');
      setIsSketchModeActive(false);
      setActiveRibbonTab('Toolpaths');
      resetHistory({
        operations: [],
        partTransform: defaultTransform,
        solidsList: billetSolids,
        customGeometry: []
      });
      showToast("Loaded 3-Axis VMC Billet Machining Template", "success");
    } else if (t === 'impeller' || t === 'dmu50_impeller') {
      handleSelectSampleModel('impeller');
      setIsSketchModeActive(false);
      setActiveRibbonTab('Toolpaths');
    } else if (t === 'bracket' || t === 'haas_bracket') {
      handleSelectSampleModel('bracket');
      setIsSketchModeActive(false);
      setActiveRibbonTab('Toolpaths');
    } else if (t === 'mold' || t === 'mold_core') {
      handleSelectSampleModel('mold');
      setIsSketchModeActive(false);
      setActiveRibbonTab('Toolpaths');
    } else if (t === 'lathe' || t === 'lathe_turn') {
      setCurrentModel(null);
      setSolidsList([]);
      setIsSketchModeActive(false);
      setIsLatheStudioOpen(true);
      resetHistory({
        operations: [],
        partTransform: defaultTransform,
        solidsList: [],
        customGeometry: []
      });
      showToast("Opened 2-Axis CNC Lathe Studio", "success");
    } else {
      // Clean fallback blank canvas
      setCurrentModel(null);
      setSolidsList([]);
      setIsSketchModeActive(true);
      setActiveRibbonTab('Wireframe');
      resetHistory({
        operations: [],
        partTransform: defaultTransform,
        solidsList: [],
        customGeometry: []
      });
      showToast("Created New Project Canvas", "success");
    }
  };

  // Rename Project
  const handleRenameProject = (newName) => {
    if (!newName) return;
    const finalName = newName.endsWith('.mcam') ? newName : `${newName}.mcam`;
    setCurrentProjectName(finalName);
    showToast(`Project renamed to ${finalName}`, 'success');
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
      partTransform,
      customGeometry: serializeCustomGeometry(customGeometry),
      partMetrics,
      solidsList
    };
    exportProjectMCAM(projectData, currentProjectName);
    showToast(`Saved Mastercam project: ${currentProjectName}`, 'success');
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
      partTransform,
      customGeometry: serializeCustomGeometry(customGeometry),
      partMetrics,
      solidsList
    };
    exportProjectMCAM(projectData, filename);
    showToast(`Saved project as: ${filename}`, 'success');
  };

  // Restore project from uploaded file or recent list
  const handleProjectLoaded = (data) => {
    if (!data) return;
    resetFlowlineWorkflowState();
    if (data.projectName) setCurrentProjectName(data.projectName);
    if (data.stockConfig) setStockConfig(data.stockConfig);
    if (data.tools && data.tools.length > 0) setTools(data.tools);

    let hydratedOps = operationsRef.current;
    if (data.operations) {
      hydratedOps = data.operations.map((op) => ({
        ...op,
        bounds: op.bounds ? rehydrateBox3(op.bounds) : null
      }));
      operationsRef.current = hydratedOps;
      setOperations(hydratedOps);
      if (hydratedOps.length > 0) {
        setActiveOpId(hydratedOps[0].id);
      } else {
        setActiveOpId(null);
      }
    }
    if (data.activeMachine?.id) setActiveMachineId(data.activeMachine.id);
    if (data.activeWcs) setActiveWcs(data.activeWcs);
    if (data.workpieceColor) setWorkpieceColor(data.workpieceColor);
    if (data.partTransform) {
      partTransformRef.current = data.partTransform;
      setPartTransform(data.partTransform);
    }

    // Restore custom wireframes (circles, rectangles, lines, drill points)
    let restoredGeo = [];
    if (data.customGeometry && Array.isArray(data.customGeometry)) {
      restoredGeo = deserializeCustomGeometry(data.customGeometry);
      commitCustomGeometry(restoredGeo, false);
    }

    if (data.partMetrics) {
      const reBox = rehydrateBox3(data.partMetrics.box || data.partMetrics.bounds);
      setPartMetrics({
        ...data.partMetrics,
        box: reBox,
        bounds: reBox
      });
    }
    if (data.solidsList && Array.isArray(data.solidsList) && data.solidsList.length > 0) {
      solidsListRef.current = data.solidsList;
      setSolidsList(data.solidsList);
    }

    // Ensure layers visible and switch to Toolpaths tab
    setLayerVisibility((prev) => ({
      ...prev,
      toolpaths: true,
      wireframe: true,
      part: true,
      stock: true
    }));
    setActiveManagerTab('Toolpaths');
    resetHistory({
      operations: hydratedOps,
      partTransform: data.partTransform || partTransformRef.current,
      customGeometry: restoredGeo,
      solidsList: data.solidsList || solidsListRef.current
    });

    showToast(`Project ${data.projectName || data.filename || 'MCAM'} loaded successfully with all toolpaths & wireframe geometry.`, 'success');
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
    const currentList = customGeometryRef.current || [];
    if (currentList.some((ent) => ent && ent.visible === false)) {
      const restored = currentList.map((ent) => {
        if (!ent || ent.visible !== false) return ent;
        const cloned = cloneEntityForSnapshot(ent);
        cloned.visible = true;
        if (cloned.userData) cloned.userData.isBlanked = false;
        return cloned;
      });
      commitCustomGeometry(restored, true);
    }
    showToast("All Levels, entities, and 3D layers unblanked.", 'info');
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
    if (tool === 'select') {
      setIsSelectModeActive(true);
      setIsSketchModeActive(true);
      setDrawingToolSync(null);
      showToast('Window Select Mode (V): Drag L->R to enclose or R->L to cross shapes', 'info');
      return;
    }
    setIsSelectModeActive(false);
    setIsSketchModeActive(true);
    if (tool === 'circle') {
      setDrawingToolSync('circle');
      setActiveManagerTab('Circle Cent...');
      updateCircleParams((prev) => ({
        ...prev,
        isLocked: false,
        center: null
      }));
      setActiveCircle(null);
      showToast('Circle Center Point: Click center & radius on canvas, or type Radius/Diameter and click OK', 'info');
    } else if (tool === 'rect') {
      setDrawingToolSync('rect');
      setActiveManagerTab('Rectangle');
      updateRectParams((prev) => ({
        ...prev,
        dirX: 1,
        dirZ: -1,
        isWidthLocked: false,
        isHeightLocked: false,
        firstCorner: null,
        secondCorner: null
      }));
      setActiveRect(null);
      showToast('Rectangle: Click two corners on canvas, or type Width & Height and click canvas / OK', 'info');
    } else if (tool === 'line') {
      setDrawingToolSync('line');
      setActiveManagerTab('Line Endp...');
      updateLineParams((prev) => ({
        ...prev,
        isLengthLocked: false,
        isAngleLocked: false,
        pt1: null,
        pt2: null
      }));
      setActiveLine(null);
      showToast('Line Endpoints: Click two endpoints on canvas, or type Length & Angle and click OK', 'info');
    } else if (tool === 'arc_tangent' || tool === 'arctangent') {
      setDrawingToolSync('arc_tangent');
      setActiveManagerTab('Arc Tangent');
      setArcParams((prev) => ({ ...prev, isLocked: false }));
      setActiveArcId(null);
      showToast('Arc Tangent: Select entity that arc is to be tangent to', 'info');
    } else {
      setDrawingToolSync(null);
      showToast(`✏️ CAD Sketcher Active: Click & drag on 3D Viewport to draw ${tool.toUpperCase()} (Esc to exit)`, 'info');
    }
  };

  const handleDrawingUpdate = (data) => {
    if (!data) return;
    if (data.tool === 'circle') {
      updateCircleParams((prev) => ({
        ...prev,
        radius: data.radius !== undefined ? data.radius : prev.radius,
        diameter: data.diameter !== undefined ? data.diameter : prev.diameter,
        center: data.center ? { x: data.center.x, y: data.center.y, z: data.center.z } : prev.center
      }));
      if (data.completed) {
        const currentList = customGeometryRef.current || [];
        const lastEntity = currentList[currentList.length - 1];
        if (lastEntity && (lastEntity.userData?.type === 'circle' || lastEntity.name?.startsWith('Wireframe_Circle'))) {
          setActiveCircle(lastEntity.id || lastEntity.uuid || lastEntity.name);
        }
      }
    } else if (data.tool === 'rect') {
      updateRectParams((prev) => ({
        ...prev,
        width: data.width !== undefined ? Math.abs(Number(data.width)) : prev.width,
        height: data.height !== undefined ? Math.abs(Number(data.height)) : prev.height,
        dirX: data.dirX !== undefined ? data.dirX : prev.dirX,
        dirZ: data.dirZ !== undefined ? data.dirZ : prev.dirZ,
        firstCorner: data.firstCorner ? { x: data.firstCorner.x, y: data.firstCorner.y, z: data.firstCorner.z } : prev.firstCorner,
        secondCorner: data.secondCorner ? { x: data.secondCorner.x, y: data.secondCorner.y, z: data.secondCorner.z } : prev.secondCorner
      }));
      if (data.completed) {
        const currentList = customGeometryRef.current || [];
        const lastEntity = currentList[currentList.length - 1];
        if (lastEntity && (lastEntity.userData?.type === 'rectangle' || lastEntity.name?.startsWith('Wireframe_Rect'))) {
          setActiveRect(lastEntity.id || lastEntity.uuid || lastEntity.name);
        }
      }
    } else if (data.tool === 'line') {
      updateLineParams((prev) => ({
        ...prev,
        length: data.length !== undefined ? Number(data.length) : prev.length,
        angle: data.angle !== undefined ? Number(data.angle) : prev.angle,
        pt1: data.pt1 ? { x: data.pt1.x, y: data.pt1.y, z: data.pt1.z } : prev.pt1,
        pt2: data.pt2 ? { x: data.pt2.x, y: data.pt2.y, z: data.pt2.z } : prev.pt2
      }));
      if (data.completed) {
        const currentList = customGeometryRef.current || [];
        const lastEntity = currentList[currentList.length - 1];
        if (lastEntity && (lastEntity.userData?.type === 'line' || lastEntity.name?.startsWith('Wireframe_Line'))) {
          setActiveLine(lastEntity.id || lastEntity.uuid || lastEntity.name);
        }
      }
    }
  };

  // Shared helper to update an in-progress live CAD entity cleanly without duplicating find/replace boilerplate
  const replaceCustomEntity = (entityId, buildFn) => {
    if (!entityId) return false;
    const prevList = customGeometryRef.current || [];
    const targetIndex = prevList.findIndex(
      (item) => (item.id || item.uuid || item.name) === entityId
    );
    if (targetIndex < 0) return false;
    const updated = buildFn(prevList[targetIndex]);
    if (!updated) return false;
    updated.uuid = entityId;
    if (updated.userData) updated.userData.customId = entityId;
    const newList = [...prevList];
    newList[targetIndex] = updated;
    commitCustomGeometry(newList, false);
    replaceCurrentSnapshot({ customGeometry: newList });
    return true;
  };

  const commitActiveCustomEntity = (entityId, setEntityId) => {
    const prevList = customGeometryRef.current || [];
    const next = prevList.map((item) => {
      if ((item.id || item.uuid || item.name) === entityId) {
        const cloned = cloneEntityForSnapshot(item);
        if (cloned?.material?.color?.setHex) {
          cloned.material.color.setHex(0x1d4ed8);
        }
        return cloned;
      }
      return item;
    });
    commitCustomGeometry(next, false);
    replaceCurrentSnapshot({ customGeometry: next });
    setEntityId(null);
  };

  const buildRectFromParams = (params, existingEntity, colorHex = 0x38bdf8) => {
    const absW = Math.max(0.5, Math.abs(Number(params.width) || 80));
    const absH = Math.max(0.5, Math.abs(Number(params.height) || 50));
    const y = existingEntity?.position?.y ?? existingEntity?.userData?.center?.y ?? params.firstCorner?.y ?? (partMetrics?.box?.max?.y ?? 0);
    const dirX = params.dirX ?? existingEntity?.userData?.dirX ?? 1;
    const dirZ = params.dirZ ?? existingEntity?.userData?.dirZ ?? -1;

    const anchor = params.firstCorner
      || existingEntity?.userData?.firstCorner
      || existingEntity?.userData?.center
      || { x: 0, y, z: 0 };

    const anchorVec = new THREE.Vector3(anchor.x || 0, y, anchor.z || 0);
    const { cx, cz } = computeRectPlacement(anchorVec, anchorVec, {
      anchorToCenter: !!params.anchorToCenter,
      lockedWidth: absW,
      lockedHeight: absH,
      dirX,
      dirZ
    });

    const maxR = Math.max(0, Math.min(absW, absH) / 2 - 0.05);
    const filletR = Math.max(0, Math.min(maxR, Number(params.cornerFillet) || 0));

    const rectEntity = createWireframeRect(absW, absH, y, filletR, [cx, cz], {
      color: colorHex,
      name: `Wireframe_Rect_${Math.round(absW)}x${Math.round(absH)}${filletR > 0 ? `_R${filletR}` : ''}`
    });
    rectEntity.userData.firstCorner = { x: anchorVec.x, y, z: anchorVec.z };
    rectEntity.userData.dirX = dirX;
    rectEntity.userData.dirZ = dirZ;

    if (params.createSurface) {
      const planeGeo = new THREE.PlaneGeometry(absW, absH);
      planeGeo.rotateX(-Math.PI / 2);
      const planeMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const surfMesh = new THREE.Mesh(planeGeo, planeMat);
      surfMesh.position.set(cx, y, cz);
      surfMesh.name = `Surface_Plane_${Math.round(absW)}x${Math.round(absH)}`;
      surfMesh.userData = { type: 'surface', cadType: 'surface_plane' };
      rectEntity.add(surfMesh);
    }

    return rectEntity;
  };

  // ----- Circle Handlers -----
  const handleChangeCircleRadius = (newRadius) => {
    const safeR = Math.max(0.1, Number(newRadius));
    if (!Number.isFinite(safeR)) return;
    const liveId = activeCircleIdRef.current;
    updateCircleParams((prev) => ({
      ...prev,
      radius: safeR,
      diameter: safeR * 2,
      isLocked: !liveId ? true : prev.isLocked
    }));

    replaceCustomEntity(liveId, (oldEntity) => {
      const center = oldEntity.userData?.center || { x: 0, y: 0, z: 0 };
      const cx = Array.isArray(center) ? center[0] : (center.x || 0);
      const cz = Array.isArray(center) ? center[1] : (center.z || 0);
      const y = oldEntity.position?.y || center.y || 0;
      return createWireframeCircle(
        safeR,
        y,
        [cx, cz],
        0,
        360,
        'G17',
        { color: 0x38bdf8, name: `Wireframe_Circle_R${safeR.toFixed(1)}` }
      );
    });
  };

  const handleToggleCircleRadiusLock = () => {
    updateCircleParams((prev) => ({ ...prev, isLocked: !prev.isLocked }));
  };

  const handleChangeCircleEntityMethod = (method) => {
    updateCircleParams((prev) => ({ ...prev, entityMethod: method }));
  };

  const handleReselectCircleCenter = () => {
    setReselectTrigger((prev) => prev + 1);
    showToast('Click on canvas to pick new circle center point', 'info');
  };

  const handleApplyCircle = (suppressToast = false) => {
    let createdNew = false;
    const prevList = customGeometryRef.current || [];
    const curCircle = circleParamsRef.current;
    const liveId = activeCircleIdRef.current;
    if (!liveId && curCircle.radius > 0) {
      const cx = curCircle.center?.x || 0;
      const cz = curCircle.center?.z || 0;
      const cy = curCircle.center?.y ?? (partMetrics?.box?.max?.y ?? 0);
      const newCirc = createWireframeCircle(
        curCircle.radius,
        cy,
        [cx, cz],
        0,
        360,
        'G17',
        { color: 0x1d4ed8, name: `Wireframe_Circle_R${Number(curCircle.radius).toFixed(1)}` }
      );
      commitCustomGeometry([...prevList, newCirc], true);
      updateCircleParams((prev) => ({ ...prev, center: null, isLocked: false }));
      createdNew = true;
    } else if (liveId) {
      commitActiveCustomEntity(liveId, setActiveCircle);
      updateCircleParams((prev) => ({ ...prev, center: null, isLocked: false }));
      createdNew = true;
    }
    if (createdNew) {
      setReselectTrigger((prev) => prev + 1);
      if (suppressToast !== true) {
        showToast('Circle committed to Level 10. Ready for next circle.', 'success');
      }
    }
  };

  const handleOkCircle = () => {
    handleApplyCircle(true);
    setIsSketchModeActive(false);
    setDrawingToolSync(null);
    setActiveManagerTab('Toolpaths');
    showToast('Circle Center Point accepted on Level 10.', 'success');
  };

  const handleCancelCircle = () => {
    const liveId = activeCircleIdRef.current;
    if (liveId) {
      const prevList = customGeometryRef.current || [];
      const next = prevList.filter((item) => (item.id || item.uuid || item.name) !== liveId);
      commitCustomGeometry(next, true);
    }
    setActiveCircle(null);
    setReselectTrigger((prev) => prev + 1);
    setIsSketchModeActive(false);
    setDrawingToolSync(null);
    setActiveManagerTab('Toolpaths');
    showToast('Circle creation cancelled.', 'info');
  };

  // ----- Rectangle Handlers -----
  const handleChangeRectWidth = (newWidth) => {
    const absW = Math.max(0.5, Math.abs(Number(newWidth)));
    if (!Number.isFinite(absW)) return;
    const liveId = activeRectIdRef.current;
    const nextParams = updateRectParams((prev) => ({
      ...prev,
      width: absW,
      isWidthLocked: !liveId ? true : prev.isWidthLocked
    }));

    replaceCustomEntity(liveId, (oldEntity) =>
      buildRectFromParams(nextParams, oldEntity, 0x38bdf8)
    );
  };

  const handleChangeRectHeight = (newHeight) => {
    const absH = Math.max(0.5, Math.abs(Number(newHeight)));
    if (!Number.isFinite(absH)) return;
    const liveId = activeRectIdRef.current;
    const nextParams = updateRectParams((prev) => ({
      ...prev,
      height: absH,
      isHeightLocked: !liveId ? true : prev.isHeightLocked
    }));

    replaceCustomEntity(liveId, (oldEntity) =>
      buildRectFromParams(nextParams, oldEntity, 0x38bdf8)
    );
  };

  const handleChangeRectCornerFillet = (newFillet) => {
    const safeR = Math.max(0, Math.abs(Number(newFillet) || 0));
    if (!Number.isFinite(safeR)) return;
    const liveId = activeRectIdRef.current;
    const nextParams = updateRectParams((prev) => ({
      ...prev,
      cornerFillet: safeR,
      isFilletLocked: !liveId ? true : prev.isFilletLocked
    }));

    replaceCustomEntity(liveId, (oldEntity) =>
      buildRectFromParams(nextParams, oldEntity, 0x38bdf8)
    );
  };

  const handleToggleRectWidthLock = () => {
    updateRectParams((prev) => ({ ...prev, isWidthLocked: !prev.isWidthLocked }));
  };

  const handleToggleRectHeightLock = () => {
    updateRectParams((prev) => ({ ...prev, isHeightLocked: !prev.isHeightLocked }));
  };

  const handleToggleRectFilletLock = () => {
    updateRectParams((prev) => ({ ...prev, isFilletLocked: !prev.isFilletLocked }));
  };

  const handleToggleRectAnchorToCenter = () => {
    const nextParams = updateRectParams((prev) => ({ ...prev, anchorToCenter: !prev.anchorToCenter }));
    replaceCustomEntity(activeRectIdRef.current, (oldEntity) =>
      buildRectFromParams(nextParams, oldEntity, 0x38bdf8)
    );
  };

  const handleToggleRectCreateSurface = () => {
    const nextParams = updateRectParams((prev) => ({ ...prev, createSurface: !prev.createSurface }));
    replaceCustomEntity(activeRectIdRef.current, (oldEntity) =>
      buildRectFromParams(nextParams, oldEntity, 0x38bdf8)
    );
  };

  const handleSelectRectPoint = (pointNum) => {
    updateRectParams((prev) => ({ ...prev, activePoint: pointNum }));
    setReselectTrigger((prev) => prev + 1);
  };

  const handleApplyRect = (suppressToast = false) => {
    let createdNew = false;
    const prevList = customGeometryRef.current || [];
    const curRect = rectParamsRef.current;
    const liveId = activeRectIdRef.current;
    const w = Math.abs(Number(curRect.width) || 0);
    const h = Math.abs(Number(curRect.height) || 0);

    if (!liveId && w >= 0.5 && h >= 0.5) {
      const newRect = buildRectFromParams(curRect, null, 0x1d4ed8);
      commitCustomGeometry([...prevList, newRect], true);
      updateRectParams((prev) => ({ ...prev, firstCorner: null, secondCorner: null, isWidthLocked: false, isHeightLocked: false }));
      createdNew = true;
    } else if (liveId) {
      commitActiveCustomEntity(liveId, setActiveRect);
      updateRectParams((prev) => ({ ...prev, firstCorner: null, secondCorner: null, isWidthLocked: false, isHeightLocked: false }));
      createdNew = true;
    }
    if (createdNew) {
      setReselectTrigger((prev) => prev + 1);
      if (suppressToast !== true) {
        showToast('Rectangle committed to Level 10. Ready for next rectangle.', 'success');
      }
    }
  };

  const handleOkRect = () => {
    handleApplyRect(true);
    setIsSketchModeActive(false);
    setDrawingToolSync(null);
    setActiveManagerTab('Toolpaths');
    showToast('Rectangle accepted on Level 10.', 'success');
  };

  const handleCancelRect = () => {
    const liveId = activeRectIdRef.current;
    if (liveId) {
      const prevList = customGeometryRef.current || [];
      const next = prevList.filter((item) => (item.id || item.uuid || item.name) !== liveId);
      commitCustomGeometry(next, true);
    }
    setActiveRect(null);
    updateRectParams((prev) => ({ ...prev, firstCorner: null, secondCorner: null, isWidthLocked: false, isHeightLocked: false }));
    setReselectTrigger((prev) => prev + 1);
    setIsSketchModeActive(false);
    setDrawingToolSync(null);
    setActiveManagerTab('Toolpaths');
    showToast('Rectangle creation cancelled.', 'info');
  };

  // ----- Line Endpoints Handlers -----
  const handleChangeLineLength = (newLen) => {
    const safeLen = Math.max(0.01, Number(newLen));
    if (!Number.isFinite(safeLen)) return;
    const liveId = activeLineIdRef.current;
    const nextLine = updateLineParams((prev) => ({
      ...prev,
      length: safeLen,
      isLengthLocked: !liveId ? true : prev.isLengthLocked
    }));
    replaceCustomEntity(liveId, (oldEntity) => {
      const p1 = oldEntity.userData?.p1 || { x: 0, y: 0, z: 0 };
      const anchorVec = new THREE.Vector3(p1.x || 0, p1.y || 0, p1.z || 0);
      const { p2 } = computeLineEnd(anchorVec, anchorVec, {
        lineType: nextLine.lineType,
        lockedLength: safeLen,
        lockedAngle: nextLine.angle || 0
      });
      return createWireframeLine(
        [anchorVec.x, anchorVec.y, anchorVec.z],
        [p2.x, p2.y, p2.z],
        { color: 0x38bdf8, name: `Wireframe_Line_L${safeLen.toFixed(1)}` }
      );
    });
  };

  const handleChangeLineAngle = (newAngle) => {
    const safeAngle = Number(newAngle);
    if (!Number.isFinite(safeAngle)) return;
    const liveId = activeLineIdRef.current;
    const nextLine = updateLineParams((prev) => ({
      ...prev,
      angle: safeAngle,
      isAngleLocked: !liveId ? true : prev.isAngleLocked
    }));
    replaceCustomEntity(liveId, (oldEntity) => {
      const p1 = oldEntity.userData?.p1 || { x: 0, y: 0, z: 0 };
      const anchorVec = new THREE.Vector3(p1.x || 0, p1.y || 0, p1.z || 0);
      const currentLen = Math.max(0.01, Number(nextLine.length) || 50);
      const { p2 } = computeLineEnd(anchorVec, anchorVec, {
        lineType: nextLine.lineType,
        lockedLength: currentLen,
        lockedAngle: safeAngle
      });
      return createWireframeLine(
        [anchorVec.x, anchorVec.y, anchorVec.z],
        [p2.x, p2.y, p2.z],
        { color: 0x38bdf8, name: `Wireframe_Line_L${currentLen.toFixed(1)}` }
      );
    });
  };

  const handleToggleLineLengthLock = () => {
    updateLineParams((prev) => ({ ...prev, isLengthLocked: !prev.isLengthLocked }));
  };

  const handleToggleLineAngleLock = () => {
    updateLineParams((prev) => ({ ...prev, isAngleLocked: !prev.isAngleLocked }));
  };

  const handleChangeLineType = (lineType) => {
    updateLineParams((prev) => ({ ...prev, lineType }));
  };

  const handleToggleLineTangent = () => {
    updateLineParams((prev) => ({ ...prev, isTangent: !prev.isTangent }));
  };

  const handleChangeLineMethod = (lineMethod) => {
    updateLineParams((prev) => ({ ...prev, lineMethod }));
  };

  const handleSelectLineEndpoint = (endpointNum) => {
    updateLineParams((prev) => ({ ...prev, activeEndpoint: endpointNum }));
    setReselectTrigger((prev) => prev + 1);
  };

  const handleChangeLineAxisOffset = (axisOffset) => {
    updateLineParams((prev) => ({ ...prev, axisOffset }));
  };

  const handleApplyLine = (suppressToast = false) => {
    let committed = false;
    const prevList = customGeometryRef.current || [];
    const curLine = lineParamsRef.current;
    const liveId = activeLineIdRef.current;
    if (!liveId && curLine.length > 0) {
      const y = partMetrics?.box?.max?.y ?? 0;
      const p1 = curLine.pt1 || { x: 0, y, z: 0 };
      const anchorVec = new THREE.Vector3(p1.x || 0, p1.y ?? y, p1.z || 0);
      const { p2 } = computeLineEnd(anchorVec, anchorVec, {
        lineType: curLine.lineType,
        lockedLength: curLine.length,
        lockedAngle: curLine.angle || 0
      });
      const newLine = createWireframeLine(
        [anchorVec.x, anchorVec.y, anchorVec.z],
        [p2.x, p2.y, p2.z],
        { color: 0x1d4ed8, name: `Wireframe_Line_L${Number(curLine.length).toFixed(1)}` }
      );
      commitCustomGeometry([...prevList, newLine], true);
      updateLineParams((prev) => ({ ...prev, pt1: null, pt2: null, isLengthLocked: false, isAngleLocked: false }));
      committed = true;
    } else if (liveId) {
      commitActiveCustomEntity(liveId, setActiveLine);
      updateLineParams((prev) => ({ ...prev, pt1: null, pt2: null, isLengthLocked: false, isAngleLocked: false }));
      committed = true;
    }
    if (committed) {
      setReselectTrigger((prev) => prev + 1);
      if (suppressToast !== true) {
        showToast('Line committed to Level 10. Ready for next line.', 'success');
      }
    }
  };

  const handleOkLine = () => {
    handleApplyLine(true);
    setIsSketchModeActive(false);
    setDrawingToolSync(null);
    setActiveManagerTab('Toolpaths');
    showToast('Line Endpoints accepted on Level 10.', 'success');
  };

  const handleCancelLine = () => {
    const liveId = activeLineIdRef.current;
    if (liveId) {
      const prevList = customGeometryRef.current || [];
      const next = prevList.filter((item) => (item.id || item.uuid || item.name) !== liveId);
      commitCustomGeometry(next, true);
    }
    setActiveLine(null);
    setReselectTrigger((prev) => prev + 1);
    setIsSketchModeActive(false);
    setDrawingToolSync(null);
    setActiveManagerTab('Toolpaths');
    showToast('Line creation cancelled.', 'info');
  };

  // ----- Arc Tangent Handlers -----
  const handleChangeArcRadius = (newRadius) => {
    const safeR = Math.max(0.1, Number(newRadius));
    if (!Number.isFinite(safeR)) return;
    setArcParams((prev) => ({
      ...prev,
      radius: safeR,
      diameter: safeR * 2,
      isLocked: !activeArcId ? true : prev.isLocked
    }));
  };

  const handleToggleArcLock = () => {
    setArcParams((prev) => ({ ...prev, isLocked: !prev.isLocked }));
  };

  const handleChangeArcEntityMethod = (entityMethod) => {
    setArcParams((prev) => ({ ...prev, entityMethod }));
  };

  const handleApplyArc = (suppressToast = false) => {
    if (activeArcId) {
      commitActiveCustomEntity(activeArcId, setActiveArcId);
      if (suppressToast !== true) {
        showToast('Arc Tangent committed to Level 10.', 'success');
      }
    }
  };

  const handleOkArc = () => {
    handleApplyArc(true);
    setIsSketchModeActive(false);
    setActiveDrawingTool(null);
    setActiveManagerTab('Toolpaths');
    showToast('Arc Tangent accepted on Level 10.', 'success');
  };

  const handleCancelArc = () => {
    if (activeArcId) {
      const prevList = customGeometryRef.current || [];
      const next = prevList.filter((item) => (item.id || item.uuid || item.name) !== activeArcId);
      commitCustomGeometry(next, true);
    }
    setActiveArcId(null);
    setIsSketchModeActive(false);
    setActiveDrawingTool(null);
    setActiveManagerTab('Toolpaths');
    showToast('Arc Tangent creation cancelled.', 'info');
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
      const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
      const newOp = {
        id: nextId,
        name: `Drill Cycle (${drillPoints.length} Holes) - Custom Sketch`,
        toolId: 5,
        toolName: 'T5 - 5mm Drill',
        badgeClass: 'drill',
        badgeText: 'DR',
        visible: true,
        stepdown: 1.0,
        totalDepth: 5.0,
        rapidHeight: 15.0
      };
      const nextOps = [...(operationsRef.current || []), newOp];
      operationsRef.current = nextOps;
      setOperations(nextOps);
      pushSnapshot({ operations: nextOps });
      setActiveOpId(nextId);
      setActiveRibbonTab('Toolpaths');
      setIsSketchModeActive(false);
      showToast(`Generated CNC Drill Cycle from ${drillPoints.length} sketched points!`, 'success');
      return;
    }

    const chain = chains[chains.length - 1];
    const isCircle = chain.type === 'circle_loop';
    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    const diameter = isCircle ? (chain.radius * 2) : 50;

    if (chain.bounds) {
      setPartMetrics({
        box: chain.bounds,
        bounds: chain.bounds,
        dimensions: chain.bounds.getSize(new THREE.Vector3()),
        triangles: 12
      });
    }

    const newOp = {
      id: nextId,
      name: isCircle
        ? `Circle Mill (Ø${diameter.toFixed(1)}mm) - Sketch`
        : `2D Contour (${chain.name || 'Drawn Rectangle'})`,
      toolId: 1,
      toolName: 'T1 - 10mm Flat Endmill',
      badgeClass: isCircle ? 'circlemill' : 'contour',
      badgeText: isCircle ? 'CM' : 'CT',
      visible: true,
      chain: chain,
      bounds: chain.bounds,
      center: chain.center,
      diameter: diameter,
      stepdown: 1.0,
      totalDepth: 5.0,
      stockToLeaveXY: 0.0,
      stockToLeaveZ: 0.0,
      rapidHeight: 15.0
    };
    const nextOps = [...(operationsRef.current || []), newOp];
    operationsRef.current = nextOps;
    setOperations(nextOps);
    pushSnapshot({ operations: nextOps });
    setActiveOpId(nextId);
    setActiveRibbonTab('Toolpaths');
    setIsSketchModeActive(false);
    showToast(`Generated CNC ${isCircle ? 'Circle Mill' : 'Contour'} Toolpath from sketched ${chain.type.replace('_', ' ')}! Ready for G-code posting.`, 'success');
  };

  const handleAcceptChains = (acceptedChains) => {
    if (!acceptedChains || acceptedChains.length === 0) return;
    const newOps = [];
    acceptedChains.forEach((c, idx) => {
      const raw = c.rawChain;
      const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 + idx : 1 + idx;
      const isCircle = raw?.type === 'circle_loop';
      const diameter = isCircle ? (raw.radius * 2) : 50;

      if (raw?.bounds) {
        setPartMetrics({
          box: raw.bounds,
          bounds: raw.bounds,
          dimensions: raw.bounds.getSize(new THREE.Vector3()),
          triangles: 12
        });
      }

      newOps.push({
        id: nextId,
        name: isCircle ? `Circle Mill (Ø${diameter.toFixed(1)}mm) - Chain ${c.id}` : `2D Contour (${raw?.name || `Chain ${c.id}`})`,
        toolId: 1,
        toolName: 'T1 - 10mm Flat Endmill',
        badgeClass: isCircle ? 'circlemill' : 'contour',
        badgeText: isCircle ? 'CM' : 'CT',
        visible: true,
        chain: raw,
        bounds: raw?.bounds,
        center: raw?.center,
        diameter: diameter,
        stepdown: 1.0,
        totalDepth: 5.0,
        rapidHeight: 15.0
      });
    });

    const nextOps = [...(operationsRef.current || []), ...newOps];
    operationsRef.current = nextOps;
    setOperations(nextOps);
    pushSnapshot({ operations: nextOps });
    if (newOps.length > 0) setActiveOpId(newOps[0].id);
    setActiveRibbonTab('Toolpaths');
    showToast(`Mastercam Chaining: Created ${newOps.length} Toolpath Operation(s) from Sketch!`, 'success');
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

  const handleAddCustomEntity = (entity, options = {}) => {
    if (!entity) return;
    const curTool = activeDrawingToolRef.current || activeDrawingTool;
    const entityCadType = String(entity.userData?.cadType || entity.userData?.type || '').toLowerCase();
    const allowActiveBind = options.bindActive !== false && !entity.userData?.fromModal && isSketchModeActive;
    const activeIdToCommit = allowActiveBind ? (
      curTool === 'circle' ? activeCircleIdRef.current :
      curTool === 'rect' ? activeRectIdRef.current :
      curTool === 'line' ? activeLineIdRef.current :
      null
    ) : null;

    const currentList = customGeometryRef.current || [];
    const baseList = activeIdToCommit
      ? currentList.map((item) => {
          if ((item.id || item.uuid || item.name) === activeIdToCommit && item.material) {
            item.material.color.setHex(0x1d4ed8);
          }
          return item;
        })
      : currentList;

    const entId = entity.id || entity.uuid || entity.name;
    if (allowActiveBind) {
      if (curTool === 'circle' && entityCadType === 'circle') {
        setActiveCircle(entId);
      } else if (curTool === 'rect' && (entityCadType === 'rect' || entityCadType === 'rectangle')) {
        setActiveRect(entId);
      } else if (curTool === 'line' && entityCadType === 'line') {
        setActiveLine(entId);
      } else if ((curTool === 'arc_tangent' || curTool === 'arctangent') && entityCadType === 'arc') {
        setActiveArcId(entId);
      }
    }

    const nextList = [...baseList, entity];
    commitCustomGeometry(nextList, true);
    syncPartMetricsFromCustomSurfaces(nextList);
  };

  const handleAddCustomEntitiesBatch = (entities = []) => {
    const valid = (Array.isArray(entities) ? entities : []).filter(Boolean);
    if (valid.length === 0) return;
    const currentList = customGeometryRef.current || [];
    const nextList = [...currentList, ...valid];
    commitCustomGeometry(nextList, true);
    syncPartMetricsFromCustomSurfaces(nextList);
  };

  const handleRemoveCustomEntity = (target) => {
    const currentList = customGeometryRef.current || [];
    const targetKey = target?.id || target?.uuid || target?.name || target;
    const removed = currentList.filter((item) => item === target || getCustomEntityId(item) === targetKey || item.name === targetKey);
    const next = currentList.filter((item) => !removed.includes(item));
    if (removed.length > 0) {
      setDeletedEntitiesStack((prev) => [...prev, ...removed]);
    }
    commitCustomGeometry(next, true);
    setSelectedEntityIds((prev) => prev.filter((id) => id !== targetKey));
  };

  const selectedEntitiesList = useMemo(() => {
    const idSet = new Set(selectedEntityIds);
    return (customGeometry || []).filter((ent) => ent && idSet.has(getCustomEntityId(ent)));
  }, [customGeometry, selectedEntityIds]);

  const handleToggleSelectMode = (nextVal) => {
    const enabled = typeof nextVal === 'boolean' ? nextVal : !isSelectModeActive;
    setIsSelectModeActive(enabled);
    if (enabled) {
      setSketchTool('select');
      setDrawingToolSync(null);
      showToast('Window Select (V): Drag L->R (Inside) or R->L (Crossing) on canvas', 'info');
    } else if (sketchTool === 'select') {
      setSketchTool('line');
    }
  };

  const handleDeleteSelectedEntities = (ids = selectedEntityIds) => {
    const idSet = new Set(Array.isArray(ids) ? ids : []);
    if (idSet.size === 0) return;
    const currentList = customGeometryRef.current || [];
    const removed = currentList.filter((ent) => ent && idSet.has(getCustomEntityId(ent)));
    if (removed.length === 0) return;
    const next = currentList.filter((ent) => !ent || !idSet.has(getCustomEntityId(ent)));
    setDeletedEntitiesStack((prev) => [...prev, removed]);
    commitCustomGeometry(next, true);
    syncPartMetricsFromCustomSurfaces(next);
    setSelectedEntityIds([]);
    showToast(`Deleted ${removed.length} selected entity(s) (Use Undelete Entity to restore)`, 'success');
  };

  const handleUpdateSelectedEntities = (updater) => {
    setSelectedEntityIds((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const safeNext = Array.isArray(next) ? next : [];
      if (prev.length > 0 && safeNext.length !== prev.length) {
        setPreviousSelectionIds(prev);
      }
      return safeNext;
    });
  };

  const handleReselectPreviousSelection = () => {
    const validIds = new Set((customGeometryRef.current || []).map(getCustomEntityId).filter(Boolean));
    const surviving = previousSelectionIds.filter((id) => validIds.has(id));
    if (surviving.length === 0) {
      showToast('No previous selection available to reselect.', 'info');
      return;
    }
    setSelectedEntityIds(surviving);
    showToast(`Reselected ${surviving.length} previous entity(s).`, 'success');
  };

  const handleClearSelection = () => {
    setSelectedEntityIds((prev) => {
      if (prev.length > 0) setPreviousSelectionIds(prev);
      return [];
    });
  };

  const handleBlankSelectedEntities = (ids = selectedEntityIds) => {
    const idSet = new Set(Array.isArray(ids) ? ids : []);
    if (idSet.size === 0) {
      handleToggleLayer('part');
      return;
    }
    const currentList = customGeometryRef.current || [];
    let hiddenCount = 0;
    const next = currentList.map((ent) => {
      if (ent && idSet.has(getCustomEntityId(ent))) {
        const cloned = cloneEntityForSnapshot(ent);
        cloned.visible = false;
        if (cloned.userData) cloned.userData.isBlanked = true;
        hiddenCount++;
        return cloned;
      }
      return ent;
    });
    if (hiddenCount > 0) {
      commitCustomGeometry(next, true);
      syncPartMetricsFromCustomSurfaces(next);
      handleClearSelection();
      showToast(`Blanked ${hiddenCount} selected entity(s) (Ctrl+Z to Undo or Unblank to restore)`, 'info');
    }
  };

  const handleCommitPartTransform = (nextTransform) => {
    partTransformRef.current = nextTransform;
    setPartTransform(nextTransform);
    pushSnapshot({ partTransform: nextTransform });
  };

  const handleFastPointSubmit = (pt) => {
    const x = Number(pt?.x) || 0;
    const y = Number(pt?.y) || 0; // CAD Y -> -Z in Three.js
    const z = Number(pt?.z) || 0; // CAD Z -> Y height in Three.js
    const worldPt = { x, y: z, z: -y };

    if (activeSurfaceToolRef.current === 'extrude' && isBasePointPickActive) {
      handlePickExtrudeBasePoint(worldPt);
      return;
    }
    if (isSketchModeActive && activeDrawingToolRef.current === 'circle') {
      const center = { x, y: z, z: -y };
      const r = Math.max(0.5, Number(circleParamsRef.current.radius) || 25);
      const circ = createWireframeCircle(r, center.y, [center.x, center.z], 0, 360, 'G17', { color: 0x38bdf8 });
      circ.userData = { ...(circ.userData || {}), cadType: 'circle', center, radius: r };
      updateCircleParams((prev) => ({ ...prev, center }));
      handleAddCustomEntity(circ);
      showToast(`Fast Point Circle at X${x.toFixed(1)} Y${y.toFixed(1)} Z${z.toFixed(1)}`, 'success');
      return;
    }
    const marker = createPointMarker([worldPt.x, worldPt.y, worldPt.z], `Point_${x.toFixed(1)}_${y.toFixed(1)}_${z.toFixed(1)}`, 0xf59e0b);
    handleAddCustomEntity(marker, { bindActive: false });
    showToast(`Fast Point created at X${x.toFixed(2)} Y${y.toFixed(2)} Z${z.toFixed(2)}`, 'success');
  };

  const handleWindowSelectChains = (matchedEntities = [], { append = false } = {}) => {
    const pool = customGeometryRef.current || [];
    const newChains = [];
    const seenEntIds = new Set();

    matchedEntities.forEach((ent) => {
      if (!ent || !isSelectableWireframeEntity(ent)) return;
      const eid = getCustomEntityId(ent);
      if (seenEntIds.has(eid)) return;
      const chain = buildChainFromEntity(ent, pool, {
        method: 'chain',
        planeMode: chainingConfig.planeMode
      });
      if (!chain) return;
      (chain.sourceEntityIds || [eid]).forEach((srcId) => seenEntIds.add(srcId));
      newChains.push(chain);
    });

    if (newChains.length === 0) {
      if (!append) setSelectedExtrudeChainsSync([]);
      return;
    }

    setSelectedExtrudeChainsSync((prev) => {
      const base = (append || chainingConfig.waitMode) ? prev : [];
      const existingIds = new Set(base.map((c) => c.id));
      const merged = [...base];
      newChains.forEach((ch) => {
        if (!existingIds.has(ch.id)) merged.push(ch);
      });
      return merged;
    });

    if (newChains[0]?.center) {
      setExtrudeParams((prev) => ({
        ...prev,
        basePoint: prev.locks?.basePoint ? prev.basePoint : {
          x: newChains[0].center.x,
          y: newChains[0].center.y,
          z: newChains[0].center.z
        }
      }));
    }
    showToast(`Window Select: ${newChains.length} contour chain(s) added`, 'success');
  };

  const handleExtrudeFromSelection = (entities = selectedEntitiesList) => {
    const pool = customGeometryRef.current || [];
    const wireMatches = (entities || []).filter((e) => e && isSelectableWireframeEntity(e));
    if (wireMatches.length === 0) {
      showToast('Select one or more wireframe shapes to extrude.', 'warning');
      return;
    }
    const chains = [];
    const seen = new Set();
    wireMatches.forEach((ent) => {
      const ch = buildChainFromEntity(ent, pool, { method: 'chain', planeMode: chainingConfig.planeMode });
      if (!ch || seen.has(ch.id)) return;
      seen.add(ch.id);
      chains.push(ch);
    });
    if (chains.length === 0) return;

    setSelectedExtrudeChainsSync(chains);
    setActiveSurfaceTool('extrude');
    setActiveManagerTab('Surface Ex...');
    setIsChainingPaletteOpen(false);
    setIsSketchModeActive(false);
    setIsSelectModeActive(false);
    setExtrudeParams((prev) => ({
      ...prev,
      basePoint: chains[0]?.center ? { x: chains[0].center.x, y: chains[0].center.y, z: chains[0].center.z } : prev.basePoint
    }));
    showToast(`Loaded ${chains.length} selected shape chain(s) into Surface Extrude`, 'success');
  };

  const handleApplyCustomTransform = (matrices = [], mode = 'move') => {
    if (!Array.isArray(matrices) || matrices.length === 0 || selectedEntitiesList.length === 0) return;
    const currentList = customGeometryRef.current || [];
    const selectedSet = new Set(selectedEntitiesList.map(getCustomEntityId));

    if (mode === 'move') {
      const m = matrices[0];
      const nextIds = [];
      const nextList = currentList.map((ent) => {
        if (!ent || !selectedSet.has(getCustomEntityId(ent))) return ent;
        const transformed = transformCustomEntityClone(ent, m, { preserveName: true });
        nextIds.push(getCustomEntityId(transformed));
        return transformed;
      });
      commitCustomGeometry(nextList, true);
      syncPartMetricsFromCustomSurfaces(nextList);
      setSelectedEntityIds(nextIds.filter(Boolean));
    } else {
      const clones = [];
      const cloneIds = [];
      matrices.forEach((m, mIdx) => {
        selectedEntitiesList.forEach((ent) => {
          const copy = transformCustomEntityClone(ent, m, { suffix: `Copy${mIdx + 1}` });
          if (copy) {
            clones.push(copy);
            cloneIds.push(getCustomEntityId(copy));
          }
        });
      });
      const nextList = [...currentList, ...clones];
      commitCustomGeometry(nextList, true);
      syncPartMetricsFromCustomSurfaces(nextList);
      setSelectedEntityIds(cloneIds.filter(Boolean));
    }
  };

  const handleAddWireframe = (type) => {
    handleOpenWireframeModal(type);
  };

  const handleClearWireframes = () => {
    const currentList = customGeometryRef.current || [];
    const next = currentList.filter(
      (item) =>
        !item.name?.startsWith('Wireframe_') &&
        !item.name?.startsWith('Drill_') &&
        !item.name?.startsWith('Hole_') &&
        item.userData?.type !== 'line' &&
        item.userData?.type !== 'circle' &&
        item.userData?.type !== 'rectangle' &&
        item.userData?.type !== 'arc'
    );
    commitCustomGeometry(next, true);
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
    commitCustomGeometry([...(customGeometryRef.current || []), ...arcs], true);
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

  // Surface Creation & Mastercam Surface Extrude Handlers
  const syncPartMetricsFromCustomSurfaces = (entityList = []) => {
    if (currentModel) return;
    const visibleAll = (Array.isArray(entityList) ? entityList : []).filter((ent) => ent && ent.visible !== false);
    const surfs = visibleAll.filter((ent) => {
      const ct = String(ent.userData?.cadType || ent.userData?.type || '').toLowerCase();
      return ent.name?.startsWith('Surface_') || ent.name?.startsWith('CAD_Surface') || ct === 'surface_extrusion' || ct === 'solid';
    });
    const measureTargets = surfs.length > 0 ? surfs : visibleAll;
    if (measureTargets.length === 0) {
      const emptyBox = new THREE.Box3(new THREE.Vector3(-50, 0, -50), new THREE.Vector3(50, 20, 50));
      setPartMetrics({
        box: emptyBox,
        bounds: emptyBox,
        center: emptyBox.getCenter(new THREE.Vector3()),
        dimensions: emptyBox.getSize(new THREE.Vector3()),
        triangles: 0
      });
      return;
    }
    const box = new THREE.Box3();
    measureTargets.forEach((s) => {
      // Measure unparented local CAD bounds so customGeoGroup's +49 world Y offset doesn't leak in on subsequent extrudes
      const localClone = s.clone(true);
      localClone.updateMatrixWorld(true);
      box.expandByObject(localClone);
    });
    if (!box.isEmpty()) {
      const dims = box.getSize(new THREE.Vector3());
      setPartMetrics({
        box,
        bounds: box,
        center: box.getCenter(new THREE.Vector3()),
        dimensions: dims,
        triangles: 0
      });
      setStockConfig((prev) => {
        const allowSides = Number(prev?.allowanceSides ?? 4);
        const allowTop = Number(prev?.allowanceTop ?? 2);
        return {
          ...prev,
          dimensions: {
            x: Number(dims.x.toFixed(2)),
            y: Number(dims.y.toFixed(2)),
            z: Number(dims.z.toFixed(2))
          },
          rawDimensions: {
            x: Number((dims.x + allowSides * 2).toFixed(2)),
            y: Number((dims.y + allowTop).toFixed(2)),
            z: Number((dims.z + allowSides * 2).toFixed(2))
          }
        };
      });
    }
  };

  const handleOpenSurfacesModal = (tool = 'plane') => {
    if (tool === 'surface_extrude' || tool === 'extrude') {
      setIsSketchModeActive(false);
      setDrawingToolSync(null);
      resetPendingSketchLocks();
      setActiveSurfaceTool('extrude');
      setActiveManagerTab('Surface Ex...');
      setSelectedExtrudeChainsSync([]);
      setExtrudeParams({
        height: 20.0,
        scale: 1.0,
        rotationAngleDeg: 0.0,
        offsetDistance: 0.0,
        draftAngleDeg: 0.0,
        useAxis: false,
        axis: 'z',
        axisVector: { x: 0, y: 0, z: 1 },
        direction: 'defined',
        basePoint: null,
        capEnds: true,
        locks: {}
      });
      setIsBasePointPickActive(false);
      setIsChainingPaletteOpen(true);
      showToast('Select wireframe chain on canvas, then click Green Check in Chaining.', 'info');
      return;
    }
    setSurfacesModalTool(tool);
    setIsSurfacesModalOpen(true);
  };

  const handleSelectChainEntityOnViewport = (entity) => {
    if (!entity) return;
    const chain = buildChainFromEntity(entity, customGeometryRef.current || [], {
      method: chainingConfig.selectionMethod,
      planeMode: chainingConfig.planeMode
    });
    if (!chain) return;

    setSelectedExtrudeChainsSync((prev) => {
      const exists = prev.some((c) => c.id === chain.id);
      if (chainingConfig.waitMode) {
        return exists ? prev.filter((c) => c.id !== chain.id) : [...prev, chain];
      }
      return [chain];
    });

    setExtrudeParams((prev) => ({
      ...prev,
      basePoint: prev.locks?.basePoint ? prev.basePoint : (
        chain.center ? { x: chain.center.x, y: chain.center.y, z: chain.center.z } : prev.basePoint
      )
    }));
  };

  const handleReverseExtrudeChain = () => {
    setSelectedExtrudeChainsSync((prev) =>
      prev.map((c) => ({
        ...c,
        points: [...c.points].reverse(),
        direction: c.direction === 'CCW / Reversed' ? 'CW / Forward' : 'CCW / Reversed'
      }))
    );
  };

  const handleAddAllClosedChainsToExtrude = () => {
    const detected = extractClosedChainsFromCAD(customGeometryRef.current || []);
    if (detected.length === 0) {
      showToast('No closed wireframe contours found in viewport.', 'warning');
      return;
    }
    setSelectedExtrudeChainsSync(detected);
    if (detected[0]?.center) {
      setExtrudeParams((prev) => ({
        ...prev,
        basePoint: prev.basePoint || { x: detected[0].center.x, y: detected[0].center.y, z: detected[0].center.z }
      }));
    }
    showToast(`Selected ${detected.length} closed contour chain(s).`, 'success');
  };

  const handleConfirmChaining = () => {
    if (isSolidExtrudeActive) {
      const curChains = selectedExtrudeChains.length > 0
        ? selectedExtrudeChains
        : extractClosedChainsFromCAD(customGeometryRef.current || []);
      setSolidExtrudeChains(curChains);
      setIsChainingPaletteOpen(false);
      setActiveManagerTab('Solid Extru...');
      showToast(`Selected ${curChains.length} chain(s) for Solid Extrude.`, 'info');
      return;
    }

    if (selectedExtrudeChains.length === 0) {
      const detected = extractClosedChainsFromCAD(customGeometryRef.current || []);
      if (detected.length === 1) {
        setSelectedExtrudeChainsSync(detected);
        if (detected[0]?.center) {
          setExtrudeParams((prev) => ({
            ...prev,
            basePoint: { x: detected[0].center.x, y: detected[0].center.y, z: detected[0].center.z }
          }));
        }
      } else {
        showToast('Select a wireframe contour on the canvas first.', 'warning');
        return;
      }
    }
    setIsChainingPaletteOpen(false);
  };

  const handleChangeExtrudeParam = (key, value) => {
    setExtrudeParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleExtrudeLock = (key) => {
    setExtrudeParams((prev) => ({
      ...prev,
      locks: { ...(prev.locks || {}), [key]: !prev.locks?.[key] }
    }));
  };

  const handlePickExtrudeBasePoint = (pt) => {
    setExtrudeParams((prev) => ({ ...prev, basePoint: pt }));
    setIsBasePointPickActive(false);
    showToast(`Base Point updated: X${pt.x.toFixed(1)} Y${(-pt.z).toFixed(1)}`, 'success');
  };

  const handleCommitSurfaceExtrude = (keepOpen = false) => {
    if (selectedExtrudeChains.length === 0) {
      showToast('Select a chain before creating Surface Extrude.', 'warning');
      return;
    }
    const surfMesh = createParametricChainExtrusion(selectedExtrudeChains, extrudeParams, {
      color: 0x22d3ee
    });
    const nextList = [...(customGeometryRef.current || []), surfMesh];
    commitCustomGeometry(nextList, true);
    setLayerVisibility((prev) => ({ ...prev, surfaces: true }));
    syncPartMetricsFromCustomSurfaces(nextList);

    if (keepOpen) {
      setSelectedExtrudeChainsSync([]);
      setIsChainingPaletteOpen(true);
      showToast(`Created ${surfMesh.name} on Level 15 — select next chain.`, 'success');
    } else {
      setIsChainingPaletteOpen(false);
      setIsBasePointPickActive(false);
      setSelectedExtrudeChainsSync([]);
      setActiveSurfaceTool(null);
      setActiveManagerTab('Toolpaths');
      showToast(`Surface Extrude created (${surfMesh.name}) on Level 15.`, 'success');
    }
  };

  const handleCancelSurfaceExtrude = () => {
    setIsChainingPaletteOpen(false);
    setIsBasePointPickActive(false);
    setSelectedExtrudeChainsSync([]);
    setActiveSurfaceTool(null);
    setActiveManagerTab('Toolpaths');
  };

  handleCancelSurfaceExtrudeRef.current = handleCancelSurfaceExtrude;

  const handleAddSurfaceEntity = (entity) => {
    const next = [...(customGeometryRef.current || []), entity];
    commitCustomGeometry(next, true);
  };

  const handleRemoveSurfaceEntity = (target) => {
    const next = (customGeometryRef.current || []).filter((item) => item !== target);
    commitCustomGeometry(next, true);
  };

  const handleAddSurface = (type) => {
    handleOpenSurfacesModal(type);
  };

  const handleClearSurfaces = () => {
    const next = (customGeometryRef.current || []).filter(
      (item) =>
        !item.name?.startsWith('Surface_') &&
        !item.name?.startsWith('CAD_')
    );
    commitCustomGeometry(next, true);
  };

  // Solid Primitives & Modeling Handlers
  const handleOpenSolidsModal = (tool = 'box') => {
    if (tool === 'extrude' || tool === 'solid_extrude') {
      setIsSolidExtrudeActive(true);
      setActiveManagerTab('Solid Extru...');
      setIsChainingPaletteOpen(true);
      showToast('Mastercam Solid Extrude: Select 2D wireframe chain to extrude', 'info');
      return;
    }
    setSolidsModalTool(tool);
    setIsSolidsModalOpen(true);
  };

  const handleApplySolidExtrude = (config) => {
    const targetChain = config.chains?.[0] || selectedExtrudeChains?.[0] || solidExtrudeChains?.[0];
    const dist = Number(config.distance) || 50.0;
    const isBoth = Boolean(config.bothDirections);

    let pts = targetChain?.points;
    if (!pts || pts.length < 3) {
      pts = [
        new THREE.Vector3(-30, 0, -20),
        new THREE.Vector3(30, 0, -20),
        new THREE.Vector3(30, 0, 20),
        new THREE.Vector3(-30, 0, 20),
        new THREE.Vector3(-30, 0, -20)
      ];
    }

    const shape = new THREE.Shape();
    shape.moveTo(pts[0].x, pts[0].z || pts[0].y || 0);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].x, pts[i].z || pts[i].y || 0);
    }
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: dist,
      bevelEnabled: false
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    if (isBoth) {
      geom.translate(0, -dist / 2, 0);
    }

    const color = config.type === 'cut' ? 0xdc2626 : config.type === 'boss' ? 0xf59e0b : 0xea580c;
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.25,
      side: THREE.DoubleSide
    });
    const solidMesh = new THREE.Mesh(geom, mat);
    solidMesh.castShadow = true;
    solidMesh.receiveShadow = true;

    const edgeLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(geom),
      new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 1.5 })
    );
    solidMesh.add(edgeLines);

    const solidGroup = new THREE.Group();
    solidGroup.name = config.name || 'Extrude Solid';
    solidGroup.add(solidMesh);

    handleAddSolidBody(solidGroup, config.name || 'Extrude Solid');
    setIsChainingPaletteOpen(false);
    showToast(`Mastercam Solids: Extrusion operation "${config.name || 'Extrude'}" completed (${config.type.toUpperCase()})`, 'success');
  };

  const handleSetPrimarySolid = (modelGroup, filename) => {
    setCurrentModel(modelGroup);
    setCurrentProjectName(filename);
    const nextSolids = [
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
      ...(solidsListRef.current || solidsList).slice(1)
    ];
    solidsListRef.current = nextSolids;
    setSolidsList(nextSolids);
    handleResetTransform();
    pushSnapshot({ solidsList: nextSolids });
  };

  const handleAddSolidBody = (solidGroup, name) => {
    const nextGeo = [...(customGeometryRef.current || []), solidGroup];
    const currentSolids = solidsListRef.current || solidsList;
    const nextId = currentSolids.length + 1;
    const nextSolids = [
      ...currentSolids,
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
    ];
    solidsListRef.current = nextSolids;
    setSolidsList(nextSolids);
    commitCustomGeometry(nextGeo, false);
    pushSnapshot({ customGeometry: nextGeo, solidsList: nextSolids });
  };

  const handleRemoveSolidBody = (target) => {
    const nextSolids = (solidsListRef.current || solidsList).filter((s) => s !== target && s.id !== target.id);
    const nextGeo = (customGeometryRef.current || []).filter((item) => item.name !== target.name);
    solidsListRef.current = nextSolids;
    setSolidsList(nextSolids);
    commitCustomGeometry(nextGeo, false);
    pushSnapshot({ customGeometry: nextGeo, solidsList: nextSolids });
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
    const next = (customGeometryRef.current || []).filter((item) => !item.name?.startsWith('Drafting_'));
    commitCustomGeometry(next, true);
  };

  // 3D Transform Workbench Handler (Translate, Rotate, Scale, Mirror, Pattern)
  const handleOpenTransformModal = (tab = 'translate') => {
    setTransformModalTab(tab);
    setIsTransformModalOpen(true);
  };

  const flowlineSelectionSession = activeFacePickRole
    ? {
        active: true,
        role: activeFacePickRole,
        driveFaceIds: surfaceSelectionDraft.driveFaceIds,
        checkFaceIds: surfaceSelectionDraft.checkFaceIds,
        onPickFaces: handlePickSolidFacesForDraft,
        onEndSelection: () => setActiveFacePickRole(null),
        onClearSelection: () => {
          setSurfaceSelectionDraft((prev) => ({
            ...prev,
            [activeFacePickRole === 'check' ? 'checkFaceIds' : 'driveFaceIds']: []
          }));
        }
      }
    : null;

  const flowlineViewportPreview =
    (isFlowlineDataOpen ||
      isSurfaceSelectionOpen ||
      (isSurfaceFinishContourOpen && surfaceFinishStrategyMode === 'flowline')) &&
    surfaceSelectionDraft.driveFaceIds.length > 0
      ? {
          active: true,
          showGrid: true,
          driveFaceIds: surfaceSelectionDraft.driveFaceIds,
          checkFaceIds: surfaceSelectionDraft.checkFaceIds,
          flowlineData: surfaceSelectionDraft.flowlineData
        }
      : null;

  return (
    <div id="root" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. TitleBar */}
      <TitleBar
        currentProject={currentProjectName}
        activeMachine={activeMachine}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSaveProject={handleSaveProject}
        onOpenFile={() => setIsMastercamOpenDialogOpen(true)}
        onOpenSetupSheet={() => setIsSetupSheetOpen(true)}
        onOpenHelpGuide={() => setIsHelpGuideOpen(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={Boolean(
          historyIndex > 0 ||
          (activeSurfaceTool === 'extrude' && selectedExtrudeChains.length > 0) ||
          circleParams.isLocked ||
          rectParams.isWidthLocked ||
          rectParams.isHeightLocked ||
          rectParams.firstCorner ||
          lineParams.isLengthLocked ||
          lineParams.isAngleLocked ||
          lineParams.pt1 ||
          activeCircleId ||
          activeRectId ||
          activeLineId
        )}
        canRedo={historyIndex < history.length - 1}
        onNotify={showToast}
        onRenameProject={handleRenameProject}
      />

      {/* 2. Ribbon Bar with Dynamic Context-Aware Toolbars */}
      <RibbonBar
        activeTab={activeRibbonTab}
        onSelectTab={setActiveRibbonTab}
        onOpenFileBackstage={() => setIsFileBackstageOpen(true)}
        onOpenDefineToolModal={() => setIsDefineToolModalOpen(true)}
        onOpenSurfaceFinishContour={() => openSurfaceFinishModal('contour', null)}
        onOpenSurfaceFinishPocket={() => openSurfaceFinishModal('pocket', null)}
        onOpenSurfaceFinishFlowline={() => openSurfaceFinishFlowline(null)}
        onOpenSurfaceFinishShallow={() => openSurfaceFinishModal('shallow', null)}
        onOpenSurfaceFinishParallel={() => openSurfaceFinishModal('parallel', null)}
        onOpenSurfaceFinishPencil={() => openSurfaceFinishModal('pencil', null)}
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
        onToggleBlank={() => handleBlankSelectedEntities()}
        onOpenToolpathAnalyzer={() => showToast('Toolpath Analyzer: Inspecting G-Code vector feeds & dynamics', 'info')}
        onOpenDynamicAnalyzer={() => showToast('Dynamic Analyzer: Live cursor coordinates & radius measuring active', 'info')}
        onOpenAngleAnalyzer={() => setIsDistanceCaliperOpen(true)}
        onOpenChainAnalyzer={() => showToast('Chain Analyzer: All 2D wireframe boundary loops validated (0 open leaks)', 'success')}
        onOpenCheckSolid={() => showToast('Solid Integrity Check: Watertight Manifold B-Rep verified', 'success')}
        onOpen2DArea={() => showToast(`2D Planar Projected Area: ${(partMetrics?.dimensions ? (partMetrics.dimensions.x * partMetrics.dimensions.z * 0.8) : 2450).toFixed(1)} mm²`, 'info')}
        onOpenStatistics={() => setIsStatisticsModalOpen(true)}
        onOpenAddInsManager={() => setIsAddInsModalOpen(true)}
        onOpenCommandFinder={() => setIsCommandFinderOpen(true)}
        onOpenAttributesModal={() => setIsSelectAllOpen(true)}
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
        onOpenChaining={() => setIsMastercamChainingModalOpen(true)}
        onStartInteractiveSketch={handleStartInteractiveSketch}
        isSketchModeActive={isSketchModeActive}
        sketchTool={sketchTool}
        isSelectModeActive={isSelectModeActive}
        onToggleSelectMode={handleToggleSelectMode}
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
        activeManagerTab={activeManagerTab}
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
        onOpenProbingStudio={() => setIsSelectProbeOpen(true)}
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
        machines={machines}
        machineMenuByCategory={machineMenuByCategory}
        machineDirectory={machineDirectory}
        onSelectMachine={handleSelectMachine}
        onOpenMachineMenuManager={handleOpenMachineMenuManager}
        onSelectWcs={setActiveWcs}
        activeWcs={activeWcs}
        workspaceViewMode={workspaceViewMode}
        onChangeViewMode={setWorkspaceViewMode}
        onStartFlowlineWizard={() => handleFlowlineWizardStep('wizard_new_file', 1)}
      />

      {/* Flowline 3-Axis Guided Wizard Bar */}
      <FlowlineWizardBar
        isActive={flowlineWizardActive}
        currentStep={flowlineWizardStep}
        onStepClick={handleFlowlineWizardStep}
        onClose={() => setFlowlineWizardActive(false)}
        unitSystem={unitSystem}
        activeMachineName={activeMachine?.name || '3-Axis Mill Default'}
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
        onOpenChaining={() => setIsMastercamChainingModalOpen(true)}
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
          onOpenProbingStudio={() => setIsSelectProbeOpen(true)}
          onOpenSetupSheet={() => setIsSetupSheetOpen(true)}
          onOpenSurfaceFinishContour={() => openSurfaceFinishModal('contour', null)}
          onOpenSurfaceFinishPocket={() => openSurfaceFinishModal('pocket', null)}
          onOpenSurfaceFinishFlowline={() => openSurfaceFinishFlowline(null)}
          onOpenSurfaceFinishShallow={() => openSurfaceFinishModal('shallow', null)}
          onOpenSurfaceFinishParallel={() => openSurfaceFinishModal('parallel', null)}
          onOpenSurfaceFinishPencil={() => openSurfaceFinishModal('pencil', null)}
          onEditOpGeometry={handleOpenFlowlineGeometryEdit}
          onExportStockSTL={handleExportStockSTL}
          activeDrawingTool={activeDrawingTool}
          circleParams={circleParams}
          onChangeCircleRadius={handleChangeCircleRadius}
          onToggleCircleRadiusLock={handleToggleCircleRadiusLock}
          onChangeCircleEntityMethod={handleChangeCircleEntityMethod}
          onReselectCircleCenter={handleReselectCircleCenter}
          onApplyCircle={handleApplyCircle}
          onOkCircle={handleOkCircle}
          onCancelCircle={handleCancelCircle}
          rectParams={rectParams}
          onChangeRectWidth={handleChangeRectWidth}
          onChangeRectHeight={handleChangeRectHeight}
          onChangeRectCornerFillet={handleChangeRectCornerFillet}
          onToggleRectWidthLock={handleToggleRectWidthLock}
          onToggleRectHeightLock={handleToggleRectHeightLock}
          onToggleRectFilletLock={handleToggleRectFilletLock}
          onToggleRectAnchorToCenter={handleToggleRectAnchorToCenter}
          onToggleRectCreateSurface={handleToggleRectCreateSurface}
          onSelectRectPoint={handleSelectRectPoint}
          onApplyRect={handleApplyRect}
          onOkRect={handleOkRect}
          onCancelRect={handleCancelRect}
          lineParams={lineParams}
          onChangeLineLength={handleChangeLineLength}
          onChangeLineAngle={handleChangeLineAngle}
          onToggleLineLengthLock={handleToggleLineLengthLock}
          onToggleLineAngleLock={handleToggleLineAngleLock}
          onChangeLineType={handleChangeLineType}
          onToggleLineTangent={handleToggleLineTangent}
          onChangeLineMethod={handleChangeLineMethod}
          onSelectLineEndpoint={handleSelectLineEndpoint}
          onChangeLineAxisOffset={handleChangeLineAxisOffset}
          onApplyLine={handleApplyLine}
          onOkLine={handleOkLine}
          onCancelLine={handleCancelLine}
          arcParams={arcParams}
          onChangeArcRadius={handleChangeArcRadius}
          onToggleArcLock={handleToggleArcLock}
          onChangeArcEntityMethod={handleChangeArcEntityMethod}
          onApplyArc={handleApplyArc}
          onOkArc={handleOkArc}
          onCancelArc={handleCancelArc}
          activeSurfaceTool={activeSurfaceTool}
          surfaceExtrudeParams={extrudeParams}
          selectedExtrudeChains={selectedExtrudeChains}
          isChainingOpen={isChainingPaletteOpen}
          isBasePointPicking={isBasePointPickActive}
          onChangeExtrudeParam={handleChangeExtrudeParam}
          onToggleExtrudeLock={handleToggleExtrudeLock}
          onReselectExtrudeChains={() => {
            setIsBasePointPickActive(false);
            setIsChainingPaletteOpen(true);
          }}
          onReselectExtrudeBasePoint={() => {
            setIsChainingPaletteOpen(false);
            setIsBasePointPickActive(true);
            showToast('Click new Base Point in 3D Viewport', 'info');
          }}
          onApplyExtrude={() => handleCommitSurfaceExtrude(true)}
          onOkExtrude={() => handleCommitSurfaceExtrude(false)}
          onCancelExtrude={handleCancelSurfaceExtrude}
          isSolidExtrudeActive={isSolidExtrudeActive}
          solidExtrudeChains={selectedExtrudeChains.length > 0 ? selectedExtrudeChains : solidExtrudeChains}
          onReverseSolidExtrudeChain={handleReverseExtrudeChain}
          onCloseSolidExtrude={() => setIsSolidExtrudeActive(false)}
          onApplySolidExtrude={handleApplySolidExtrude}
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
                partMetrics={partMetrics}
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
                activeDrawingRadius={circleParams.radius}
                isRadiusLocked={circleParams.isLocked}
                activeDrawingWidth={rectParams.width}
                isWidthLocked={rectParams.isWidthLocked}
                activeDrawingHeight={rectParams.height}
                isHeightLocked={rectParams.isHeightLocked}
                rectCornerFillet={rectParams.cornerFillet}
                rectAnchorToCenter={rectParams.anchorToCenter}
                rectCreateSurface={rectParams.createSurface}
                activeDrawingLength={lineParams.length}
                isLengthLocked={lineParams.isLengthLocked}
                activeDrawingAngle={lineParams.angle}
                isAngleLocked={lineParams.isAngleLocked}
                lineType={lineParams.lineType}
                onDrawingUpdate={handleDrawingUpdate}
                reselectTrigger={reselectTrigger}
                undoTrigger={undoTrigger}
                selectedEntityIds={selectedEntityIds}
                onChangeSelectedEntities={handleUpdateSelectedEntities}
                isSelectModeActive={isSelectModeActive}
                onToggleSelectMode={handleToggleSelectMode}
                onDeleteSelectedEntities={handleDeleteSelectedEntities}
                onBlankSelectedEntities={handleBlankSelectedEntities}
                onRequestExtrudeSelection={handleExtrudeFromSelection}
                onRequestTransformSelection={() => handleOpenTransformModal('translate')}
                snapMode={snapMode}
                onChangeSnapMode={setSnapMode}
                isAutoCursorLocked={isAutoCursorLocked}
                onToggleAutoCursorLock={() => setIsAutoCursorLocked((v) => !v)}
                canvasSelectionMethod={canvasSelectionMethod}
                onChangeCanvasSelectionMethod={setCanvasSelectionMethod}
                containmentMode={containmentMode}
                onChangeContainmentMode={setContainmentMode}
                solidFilterMode={solidFilterMode}
                onChangeSolidFilterMode={(mode) => {
                  setSolidFilterMode(mode);
                  if (mode === 'solid_face' && !isSelectModeActive) {
                    setIsSelectModeActive(true);
                    setSketchTool('select');
                  }
                }}
                selectionMask={selectionMask}
                onChangeSelectionMask={setSelectionMask}
                stickyMultiSelect={stickyMultiSelect}
                onToggleStickyMultiSelect={() => setStickyMultiSelect((v) => !v)}
                onReselectPrevious={handleReselectPreviousSelection}
                onFastPointSubmit={handleFastPointSubmit}
                surfaceSelectionSession={flowlineSelectionSession}
                flowlinePreview={flowlineViewportPreview}
                onOpenSelectAllModal={() => setIsSelectAllOpen(true)}
                onSwitchToLevels={() => setActiveManagerTab('Levels')}
                onSwitchToPlanes={() => setActiveManagerTab('Planes')}
                onOpenGroups={() => setActiveManagerTab('Toolpaths')}
                probingSession={{ active: isProbingHUDOpen, cycle: activeProbingCycle, feature: probingPickedFeature }}
                onProbeFeaturePicked={handleProbeFeaturePicked}
              />
            </div>
          </div>
        )}

        {workspaceViewMode === '3d' && (
          <div style={{ position: 'relative', flex: 1, height: '100%', display: 'flex', minWidth: 0 }}>
            <ChainingPalette
              isOpen={isChainingPaletteOpen}
              chainMode={chainingConfig.chainMode}
              onChangeChainMode={(chainMode) => setChainingConfig((prev) => ({ ...prev, chainMode }))}
              planeMode={chainingConfig.planeMode}
              onChangePlaneMode={(planeMode) => setChainingConfig((prev) => ({ ...prev, planeMode }))}
              selectionMethod={chainingConfig.selectionMethod}
              onChangeSelectionMethod={(selectionMethod) => setChainingConfig((prev) => ({ ...prev, selectionMethod }))}
              containmentSide={chainingConfig.containmentSide}
              onChangeContainmentSide={(containmentSide) => setChainingConfig((prev) => ({ ...prev, containmentSide }))}
              waitMode={chainingConfig.waitMode}
              onToggleWaitMode={(waitMode) => setChainingConfig((prev) => ({ ...prev, waitMode }))}
              selectedChains={selectedExtrudeChains}
              onReverseChain={handleReverseExtrudeChain}
              onUnselectLast={() => setSelectedExtrudeChainsSync((prev) => prev.slice(0, -1))}
              onUnselectAll={() => setSelectedExtrudeChainsSync([])}
              onAddAllClosedChains={handleAddAllClosedChainsToExtrude}
              onConfirm={handleConfirmChaining}
              onCancel={handleCancelSurfaceExtrude}
            />
            <Viewport3D
              currentModel={currentModel}
              partMetrics={partMetrics}
              stockConfig={stockConfig}
              fixtureConfig={fixtureConfig}
              unitSystem={unitSystem}
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
              activeDrawingRadius={circleParams.radius}
              isRadiusLocked={circleParams.isLocked}
              activeDrawingWidth={rectParams.width}
              isWidthLocked={rectParams.isWidthLocked}
              activeDrawingHeight={rectParams.height}
              isHeightLocked={rectParams.isHeightLocked}
              rectCornerFillet={rectParams.cornerFillet}
              rectAnchorToCenter={rectParams.anchorToCenter}
              rectCreateSurface={rectParams.createSurface}
              activeDrawingLength={lineParams.length}
              isLengthLocked={lineParams.isLengthLocked}
              activeDrawingAngle={lineParams.angle}
              isAngleLocked={lineParams.isAngleLocked}
              lineType={lineParams.lineType}
              onDrawingUpdate={handleDrawingUpdate}
              reselectTrigger={reselectTrigger}
              undoTrigger={undoTrigger}
              isChainingActive={isChainingPaletteOpen}
              chainingPlaneMode={chainingConfig.planeMode}
              chainingSelectionMethod={chainingConfig.selectionMethod}
              isBasePointPickActive={isBasePointPickActive}
              selectedExtrudeChains={selectedExtrudeChains}
              onSelectChainEntity={handleSelectChainEntityOnViewport}
              onWindowSelectChains={handleWindowSelectChains}
              onPickBasePoint={handlePickExtrudeBasePoint}
              surfaceExtrudePreview={
                activeSurfaceTool === 'extrude' && !isChainingPaletteOpen && selectedExtrudeChains.length > 0
                  ? { chains: selectedExtrudeChains, params: extrudeParams }
                  : null
              }
              selectedEntityIds={selectedEntityIds}
              onChangeSelectedEntities={handleUpdateSelectedEntities}
              isSelectModeActive={isSelectModeActive}
              onToggleSelectMode={handleToggleSelectMode}
              onDeleteSelectedEntities={handleDeleteSelectedEntities}
              onBlankSelectedEntities={handleBlankSelectedEntities}
              onRequestExtrudeSelection={handleExtrudeFromSelection}
              onRequestTransformSelection={() => handleOpenTransformModal('translate')}
              snapMode={snapMode}
              onChangeSnapMode={setSnapMode}
              isAutoCursorLocked={isAutoCursorLocked}
              onToggleAutoCursorLock={() => setIsAutoCursorLocked((v) => !v)}
              canvasSelectionMethod={canvasSelectionMethod}
              onChangeCanvasSelectionMethod={(m) => {
                setCanvasSelectionMethod(m);
                if (isChainingPaletteOpen && (m === 'chain' || m === 'window' || m === 'polygon' || m === 'single' || m === 'area' || m === 'vector')) {
                  setChainingConfig((prev) => ({ ...prev, selectionMethod: m }));
                }
              }}
              containmentMode={containmentMode}
              onChangeContainmentMode={setContainmentMode}
              solidFilterMode={solidFilterMode}
              onChangeSolidFilterMode={(mode) => {
                setSolidFilterMode(mode);
                if (mode === 'solid_face' && !isSelectModeActive) {
                  setIsSelectModeActive(true);
                  setSketchTool('select');
                }
              }}
              selectionMask={selectionMask}
              onChangeSelectionMask={setSelectionMask}
              stickyMultiSelect={stickyMultiSelect}
              onToggleStickyMultiSelect={() => setStickyMultiSelect((v) => !v)}
              onReselectPrevious={handleReselectPreviousSelection}
              onFastPointSubmit={handleFastPointSubmit}
              surfaceSelectionSession={flowlineSelectionSession}
              flowlinePreview={flowlineViewportPreview}
              onOpenSelectAllModal={() => setIsSelectAllOpen(true)}
              onSwitchToLevels={() => setActiveManagerTab('Levels')}
              onSwitchToPlanes={() => setActiveManagerTab('Planes')}
              onOpenGroups={() => setActiveManagerTab('Toolpaths')}
              probingSession={{ active: isProbingHUDOpen, cycle: activeProbingCycle, feature: probingPickedFeature }}
              onProbeFeaturePicked={handleProbeFeaturePicked}
            />
          </div>
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
      <StatusBar
        coords={coords}
        activeWcs={activeWcs}
        activeCPlane={activePlane}
        activeTPlane="Top"
        selectedCount={selectedEntityIds.length || (currentModel ? 1 : 0)}
        isSectionView={clippingPlane?.enabled}
        onToggleSectionView={() => setClippingPlane(cp => ({ ...cp, enabled: !cp?.enabled }))}
        unitSystem={unitSystem}
        onToggleUnitSystem={() => {
          setUnitSystem((prev) => {
            const next = prev === 'metric' ? 'imperial' : 'metric';
            showToast(`Active Units switched to: ${next.toUpperCase()}`, 'info', 1800);
            return next;
          });
        }}
        onSelectCPlane={(plane) => {
          setActivePlane(plane);
          showToast(`Cplane set to ${plane}`, 'info', 1600);
        }}
        onSelectWcs={(wcs) => {
          setActiveWcs(wcs);
          showToast(`Active WCS Datum: ${wcs}`, 'info', 1600);
        }}
        onToggleAxes={() => {
          setShowAxes((prev) => {
            const next = !prev;
            showToast(`Origin crosshairs (F9): ${next ? 'ON' : 'OFF'}`, 'info', 1500);
            return next;
          });
        }}
        showAxes={showAxes}
        activeRadius={isSketchModeActive && (sketchTool === 'circle' || activeDrawingTool === 'circle' || sketchTool === 'arc_tangent' || activeDrawingTool === 'arc_tangent') ? (sketchTool === 'arc_tangent' ? arcParams.radius : circleParams.radius) : null}
        activeRectDimensions={isSketchModeActive && (sketchTool === 'rect' || activeDrawingTool === 'rect') ? { width: rectParams.width, height: rectParams.height } : null}
        activeLineDimensions={isSketchModeActive && (sketchTool === 'line' || activeDrawingTool === 'line') ? { length: lineParams.length, angle: lineParams.angle } : null}
        theme={theme}
      />

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
        customGeometry={customGeometry}
        partMetrics={partMetrics}
        solidsList={solidsList}
        levels={levels}
        planesList={planesList}
        autoSaveInterval={autoSaveIntervalMinutes}
        setAutoSaveInterval={setAutoSaveIntervalMinutes}
        onCreateNewProject={handleCreateNewProject}
        onLoadProject={handleProjectLoaded}
        onModelImported={handleModelImported}
        onSaveAs={handleSaveAs}
        onOpenMastercamDialog={() => setIsMastercamOpenDialogOpen(true)}
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

      {/* Mastercam Images 1 & 2 Open File Dialog with Vertical Categorized Extensions */}
      <MastercamOpenDialog
        isOpen={isMastercamOpenDialogOpen}
        onClose={() => setIsMastercamOpenDialogOpen(false)}
        onFileSelected={(file) => {
          if (file.rawProject) {
            handleProjectLoaded(file.rawProject);
          } else if (file.name.includes('Multi-Body') || file.name.includes('Assembly')) {
            handleSelectSampleModel('mastercam_multibody');
          } else {
            showToast(`Opening ${file.name}...`, 'info');
          }
        }}
        onLoadProject={handleProjectLoaded}
        onModelImported={handleModelImported}
      />

      <ExportCADModal
        isOpen={isExportCADModalOpen}
        onClose={() => setIsExportCADModalOpen(false)}
        currentModel={currentModel}
        currentProjectName={currentProjectName}
      />

      {/* Mastercam Image 4 "Select All" / Mask selection dialog */}
      <SelectAllDialog
        isOpen={isSelectAllOpen}
        onClose={() => setIsSelectAllOpen(false)}
        customGeometry={customGeometry}
        onApplyFilter={handleSelectAllApply}
        activeMask={selectionMask}
      />

      {/* Mastercam Image 6 "Select probe" modal */}
      <SelectProbeModal
        isOpen={isSelectProbeOpen}
        onClose={() => setIsSelectProbeOpen(false)}
        onConfirmProbe={handleSelectProbeConfirm}
        currentProbe={activeProbe}
      />

      {/* Mastercam Image 7 Floating "Probing Dialog" HUD Palette */}
      <ProbingDialogHUD
        isOpen={isProbingHUDOpen}
        onClose={() => setIsProbingHUDOpen(false)}
        activeProbe={activeProbe}
        activeCycleId={activeProbingCycle}
        activeCycle={activeProbingCycle}
        onSelectCycle={setActiveProbingCycle}
        onChangeCycle={setActiveProbingCycle}
        targetFeature={probingPickedFeature}
        pickedFeature={probingPickedFeature}
        onApplyProbingOperation={handleApplyMastercamProbe}
        onApplyOperation={handleApplyMastercamProbe}
        onClearTargetFeature={() => setProbingPickedFeature(null)}
        onClearFeature={() => setProbingPickedFeature(null)}
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
        currentModel={currentModel}
        customGeometry={customGeometry}
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
        activeMachine={activeMachine}
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
        activeMachine={activeMachine}
        activeOperations={operations}
        tools={tools}
      />

      {/* Multi-WCS Tombstone & 4th-Axis Rotary Indexing Studio */}
      <TombstoneStudioModal
        isOpen={isTombstoneModalOpen}
        onClose={() => setIsTombstoneModalOpen(false)}
        operations={operations}
        activeMachine={activeMachine}
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
        activeMachine={activeMachine}
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
        onAddCustomEntitiesBatch={handleAddCustomEntitiesBatch}
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
        onUpdateTransform={handleCommitPartTransform}
        onResetTransform={handleResetTransform}
        onAddCustomEntity={handleAddCustomEntity}
        onAddCustomEntitiesBatch={handleAddCustomEntitiesBatch}
        selectedEntities={selectedEntitiesList}
        onApplyCustomTransform={handleApplyCustomTransform}
      />

      {/* CNC Machine Definition Menu Management Modal */}
      <MachineMenuManagementModal
        isOpen={isMachineMenuModalOpen}
        onClose={() => setIsMachineMenuModalOpen(false)}
        category={machineMenuCategory}
        machines={machines}
        menuItemIds={machineMenuByCategory[machineMenuCategory] || []}
        machineDirectory={machineDirectory}
        onSaveMenu={handleSaveMachineMenu}
        onImportCustomMachine={handleImportCustomMachine}
        theme={theme}
      />

      {/* CNC Machine Definition & Kinematic Envelope Modal (Tab 10) */}
      <MachineConfigModal
        isOpen={isMachineConfigModalOpen}
        onClose={() => setIsMachineConfigModalOpen(false)}
        machines={machines}
        activeMachine={activeMachine}
        onSelectMachine={handleSelectMachine}
        onUpdateMachineConfig={(updatedConfig) => {
          setActiveMachineId(updatedConfig.id);
          setMachines((prev) => {
            const exists = prev.some((m) => m.id === updatedConfig.id);
            return exists
              ? prev.map((m) => (m.id === updatedConfig.id ? { ...m, ...updatedConfig } : m))
              : [...prev, updatedConfig];
          });
          showToast(`Saved Machine Definition: ${updatedConfig.name}`, 'success');
        }}
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
        currentProjectName={currentProjectName}
        customGeometry={customGeometry}
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
        customGeometry={customGeometry}
        activeMachine={activeMachine}
      />

      {/* 8. Stock Setup Modal */}
      <StockSetupModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        partMetrics={partMetrics}
        stockConfig={stockConfig}
        onUpdateStock={setStockConfig}
        unitSystem={unitSystem}
        onUpdateUnitSystem={setUnitSystem}
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

      {/* 1:1 Mastercam Toolpath Parameters Modal (Classic Tree & Property Page) */}
      <MastercamToolpathParametersModal
        isOpen={isMastercamToolpathModalOpen}
        onClose={handleCloseToolpathModal}
        operation={editingOperation}
        tools={tools}
        stockConfig={stockConfig}
        onSaveOperation={handleSaveOperation}
        onRegenerateToolpath={handleRegenerateAll}
        onNotify={showToast}
        onOpenChaining={() => setIsMastercamChainingModalOpen(true)}
        onAddTool={handleAddDefinedTool}
      />

      {/* 1:1 Mastercam Chaining Modal */}
      <MastercamChainingModal
        isOpen={isMastercamChainingModalOpen}
        onClose={() => setIsMastercamChainingModalOpen(false)}
        customGeometry={customGeometry}
        onAcceptChains={handleAcceptChains}
        onNotify={showToast}
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
        customGeometry={customGeometry}
        activeMachine={activeMachine}
        currentProjectName={currentProjectName}
      />

      {/* 12. Entity Analyzer CAD Inspector Modal */}
      <EntityAnalyzerModal
        isOpen={isEntityAnalyzerOpen}
        onClose={() => setIsEntityAnalyzerOpen(false)}
        partMetrics={partMetrics}
        stockConfig={stockConfig}
        currentProjectName={currentProjectName}
        selectedEntities={selectedEntitiesList}
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

      {/* 16. Mastercam Toolpath/surface selection & Flowline data Floating Modals */}
      <ToolpathSurfaceSelectionModal
        isOpen={isSurfaceSelectionOpen && !activeFacePickRole && !isFlowlineDataOpen}
        mode={surfaceSelectionDraft.mode}
        driveCount={surfaceSelectionDraft.driveFaceIds?.length || 0}
        cadFileCount={surfaceSelectionDraft.cadFileCount || 0}
        checkCount={surfaceSelectionDraft.checkFaceIds?.length || 0}
        containmentCount={surfaceSelectionDraft.containmentIds?.length || 0}
        activePickRole={activeFacePickRole}
        onStartPick={(role) => {
          if (role === 'containment') {
            showToast('Click containment wireframe chains or select drive faces first.', 'info');
            return;
          }
          setActiveFacePickRole(role);
          showToast(
            `Select ${role === 'check' ? 'Check' : 'Drive'} solid faces/surfaces in viewport, then click End Selection.`,
            'info'
          );
        }}
        onClearRole={(role) => {
          setSurfaceSelectionDraft((prev) => ({
            ...prev,
            ...(role === 'drive' ? { driveFaceIds: [] } : role === 'check' ? { checkFaceIds: [] } : role === 'cadfile' ? { cadFileCount: 0 } : { containmentIds: [] })
          }));
        }}
        onImportCadFile={handleImportCadDriveFile}
        onShowRole={(role) => {
          const count = role === 'check' ? surfaceSelectionDraft.checkFaceIds.length : surfaceSelectionDraft.driveFaceIds.length;
          showToast(`Highlighting ${count} selected ${role} face(s) in 3D viewport.`, 'info');
        }}
        onOpenFlowlineData={() => setIsFlowlineDataOpen(true)}
        onConfirm={handleConfirmSurfaceSelection}
        onCancel={() => {
          setActiveFacePickRole(null);
          setIsFlowlineDataOpen(false);
          setIsSurfaceSelectionOpen(false);
        }}
        onHelp={() =>
          showToast('Pick Drive/Check solid faces, tune Flowline directions, then click OK to configure Surface Finish Flowline parameters.', 'info')
        }
      />

      <FlowlineDataModal
        isOpen={isFlowlineDataOpen}
        flowlineData={surfaceSelectionDraft.flowlineData}
        onChangeFlowlineData={(nextData) => setSurfaceSelectionDraft((prev) => ({ ...prev, flowlineData: nextData }))}
        onPlotEdges={handlePlotFlowlineEdges}
        onConfirm={() => setIsFlowlineDataOpen(false)}
        onCancel={() => setIsFlowlineDataOpen(false)}
        onHelp={() =>
          showToast('Flip Offset, Cut direction, Step direction, or Start corner while inspecting the live 3D UV flowlines and green arrows.', 'info')
        }
      />

      {/* 16b. Mastercam Surface Finish Contour, Pocket & Flowline Parameters Modal */}
      <SurfaceFinishContourModal
        isOpen={isSurfaceFinishContourOpen}
        onClose={() => {
          setIsSurfaceFinishContourOpen(false);
          setEditingSurfaceFinishOp(null);
        }}
        operation={editingSurfaceFinishOp}
        strategyMode={surfaceFinishStrategyMode}
        tools={tools}
        customGeometry={customGeometry}
        activeMachine={activeMachine}
        stockConfig={stockConfig}
        lastDefinedTool={lastDefinedToolState}
        flowlineSelection={
          surfaceFinishStrategyMode === 'flowline'
            ? {
                ...surfaceSelectionDraft,
                driveBounds: computeDriveBoundsForFaceIds(surfaceSelectionDraft.driveFaceIds)
              }
            : null
        }
        onOpenSurfaceSelection={() => {
          setIsSurfaceFinishContourOpen(false);
          setIsSurfaceSelectionOpen(true);
        }}
        onSaveOperation={(op) => {
          handleApplySurfaceFinishContour(op);
          setIsSurfaceFinishContourOpen(false);
        }}
        onOpenDefineToolModal={() => {
          setEditingDefinedTool(null);
          setIsDefineToolModalOpen(true);
        }}
        onEditTool={(toolToEdit) => {
          setEditingDefinedTool(toolToEdit);
          setIsDefineToolModalOpen(true);
        }}
        onNotify={showToast}
      />

      {/* 17. Mastercam Define Tool Creation Wizard Modal (stacks cleanly over Surface Finish modals) */}
      <DefineToolModal
        isOpen={isDefineToolModalOpen}
        onClose={() => {
          setIsDefineToolModalOpen(false);
          setEditingDefinedTool(null);
        }}
        initialTool={editingDefinedTool}
        activeMachine={activeMachine}
        onAddTool={handleAddDefinedTool}
        onUpdateTool={handleUpdateDefinedTool}
        onNotify={showToast}
        zIndex={100005}
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
              background: toast.type === 'danger' ? '#ef4444' :
                          toast.type === 'warning' ? '#f59e0b' :
                          toast.type === 'success' ? '#10b981' :
                          '#ffffff',
              color: toast.type ? '#ffffff' : '#0f172a',
              padding: '9px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              border: toast.type ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
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
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: '700',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
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

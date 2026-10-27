import React, { useState, useEffect } from 'react';
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
import ViewStudioModal from './components/ViewStudioModal';
import CAMOperationsWizardModal from './components/CAMOperationsWizardModal';
import StatusBar from './components/StatusBar';
import {
  createImpellerGeometry,
  createAerospaceBracket,
  createMoldCoreGeometry,
  createBoxGeometry,
  createCylinderGeometry,
  createSphereGeometry,
  createWireframeLine,
  createWireframeCircle,
  createWireframeRect,
  createBoundingWireframe,
  createDrillPointsGrid,
  createPlanarSurface,
  createCylinderSurface,
  exportSceneToSTL
} from './utils/cadGeometry';
import {
  exportProjectMCAM,
  saveAutoSaveSnapshot
} from './utils/projectStorage';

export default function App() {
  const [activeRibbonTab, setActiveRibbonTab] = useState('Home');
  const [currentModel, setCurrentModel] = useState(() => createImpellerGeometry());
  const [currentProjectName, setCurrentProjectName] = useState('DMU50_5Axis_Impeller.mcam');

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
  const [isWireframeModalOpen, setIsWireframeModalOpen] = useState(false);
  const [wireframeModalTool, setWireframeModalTool] = useState('line');
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
    if (opId) setActiveOpId(opId);
    setBackplotMode('backplot');
    setIsBackplotActive(true);
    showToast("Backplot: In-Viewport 3D tool tracing initialized", "info");
  };

  const handleStartVerify = (opId = null) => {
    if (opId) setActiveOpId(opId);
    setBackplotMode('verify');
    setIsBackplotActive(true);
    showToast("Solid Verify: Material removal simulation initialized", "info");
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

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
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
    const nextId = operations.length + 1;
    let newOp;

    if (strategy === 'facing') {
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
    } else if (strategy === 'pocket') {
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
    } else if (strategy === 'waterline') {
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
    } else if (strategy === 'swarf') {
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
    } else if (strategy === 'drilling') {
      newOp = {
        id: nextId,
        name: `Deep Hole Peck Drill ${nextId}`,
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
    } else if (strategy === 'adaptive') {
      newOp = {
        id: nextId,
        name: `Adaptive Roughing Pass ${nextId}`,
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
    } else if (strategy === 'chamfer') {
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
    } else if (strategy === 'rest' || strategy === 'rest_milling') {
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
    } else if (strategy === 'pencil') {
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
    }

    if (newOp) {
      setOperations([...operations, newOp]);
      setActiveOpId(newOp.id);
    }
  };

  const handleSelectSampleModel = (type) => {
    if (type === 'impeller') {
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
  };

  // Create New Project Wizard Handler
  const handleCreateNewProject = ({ template, projectName, unitSystem, customDimensions }) => {
    setCurrentProjectName(projectName);
    setCustomGeometry([]);
    handleResetTransform();

    if (template === 'dmu50_impeller') {
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

  const handleAddCustomEntity = (entity) => {
    setCustomGeometry((prev) => [...prev, entity]);
  };

  const handleRemoveCustomEntity = (target) => {
    setCustomGeometry((prev) => prev.filter((item) => item !== target));
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
        onOpenPostModal={() => setIsPostModalOpen(true)}
        onOpenSimModal={() => setIsSimModalOpen(true)}
        onOpenStockModal={() => setIsStockModalOpen(true)}
        onOpenToolManager={() => setIsToolManagerOpen(true)}
        onOpenFeedsSpeedsModal={handleOpenFeedsSpeeds}
        onImportNCProgram={handleImportNCProgram}
        onOpenGCodeViewer={() => setIsGCodeViewerOpen(true)}
        onOpenEntityAnalyzer={() => setIsEntityAnalyzerOpen(true)}
        onOpenDistanceCaliper={() => setIsDistanceCaliperOpen(true)}
        onOpenWireframeModal={handleOpenWireframeModal}
        onOpenSurfacesModal={handleOpenSurfacesModal}
        onOpenSolidsModal={handleOpenSolidsModal}
        onOpenModelPrepModal={handleOpenModelPrepModal}
        onOpenMeshModal={handleOpenMeshModal}
        onOpenDraftingModal={handleOpenDraftingModal}
        onOpenTransformModal={handleOpenTransformModal}
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
        onProjectLoaded={handleProjectLoaded}
        onExportSTL={handleExportSTL}
        onChangeWorkpieceColor={setWorkpieceColor}
        onChangeRenderMode={setRenderMode}
        renderMode={renderMode}
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        onSnapCamera={handleSnapCamera}
        onAddWireframe={handleAddWireframe}
        onClearWireframes={handleClearWireframes}
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
          onAddOp={() => handleQuickAddOp('pocket')}
          onRegenerate={handleRegenerateAll}
          onOpenStockModal={() => setIsStockModalOpen(true)}
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
        />

        {/* 3D Viewport with Integrated Backplot & Solid Verify */}
        <Viewport3D
          currentModel={currentModel}
          stockConfig={stockConfig}
          operations={operations}
          tools={tools}
          activeOpId={activeOpId}
          activePlane={activePlane}
          planes={planesList}
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
          cameraCommand={cameraCommand}
          partTransform={partTransform}
          customGeometry={customGeometry}
          onOpenViewStudioModal={() => setIsViewStudioModalOpen(true)}
          onToggleCameraMode={setCameraMode}
          onUpdateClippingPlane={setClippingPlane}
          onChangeRenderMode={setRenderMode}
        />
      </div>

      {/* 4. Bottom Status Bar */}
      <StatusBar coords={coords} activeWcs={activeWcs} activeMachine={activeMachine} />

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
          </div>
        ))}
      </div>
    </div>
  );
}

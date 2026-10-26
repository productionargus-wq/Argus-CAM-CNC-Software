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

  // Mastercam Core Levels
  const [levels, setLevels] = useState([
    { id: 1, number: 1, name: 'Part Solid', entities: 1, visible: true, active: true, color: '#60a5fa' },
    { id: 10, number: 10, name: 'Wireframe Curves', entities: 0, visible: true, active: false, color: '#38bdf8' },
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
    setLevels((prev) =>
      prev.map((lvl) => {
        if (lvl.id === 10) return { ...lvl, entities: customGeometry.length };
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

  // ================= Handlers =================
  const handleToggleOp = (id) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, visible: !op.visible } : op))
    );
  };

  const handleRegenerateAll = () => {
    setOperations((prev) => prev.map((op) => ({ ...op, visible: true })));
    alert("All toolpaths regenerated successfully.");
  };

  const handleDeleteActiveOp = () => {
    if (operations.length <= 1) {
      alert("At least one operation must remain in the operations tree.");
      return;
    }
    setOperations((prev) => prev.filter((op) => op.id !== activeOpId));
    setActiveOpId(operations[0].id);
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
    alert(`Project ${data.projectName || data.filename || 'MCAM'} loaded successfully.`);
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
    alert(`Level ${num} (${name}) created and activated.`);
  };

  const handleUnblankAll = () => {
    setLevels((prev) => prev.map((l) => ({ ...l, visible: true })));
    setLayerVisibility({
      part: true,
      wireframe: true,
      fixture: true,
      bed: true,
      stock: true,
      toolpaths: true,
      rapids: true,
      wcs: true,
      dimensions: true
    });
    alert("All Levels and 3D layers unblanked.");
  };

  const handleInvertVisibility = () => {
    setLevels((prev) =>
      prev.map((lvl) => {
        const nextVis = !lvl.visible;
        if (lvl.id === 1) setLayerVisibility((v) => ({ ...v, part: nextVis }));
        else if (lvl.id === 10) setLayerVisibility((v) => ({ ...v, wireframe: nextVis }));
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
    if (planeName.includes('Top')) handleSnapCamera('top');
    else if (planeName.includes('Front')) handleSnapCamera('front');
    else if (planeName.includes('Right')) handleSnapCamera('right');
    else if (planeName.includes('Isometric')) handleSnapCamera('iso');
    else if (planeName.includes('Bottom')) handleSnapCamera('bottom');
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

  // Surface Creation Handlers
  const handleAddSurface = (type) => {
    if (type === 'plane') {
      const plane = createPlanarSurface(80, 60);
      setCustomGeometry((prev) => [...prev, plane]);
    } else if (type === 'cylinder') {
      const cyl = createCylinderSurface(35, 45);
      setCustomGeometry((prev) => [...prev, cyl]);
    }
  };

  const handleClearSurfaces = () => {
    setCustomGeometry((prev) => prev.filter((item) => !item.name?.startsWith('CAD_')));
  };

  // Solid Primitives Handlers
  const handleAddSolid = (type) => {
    if (type === 'box') {
      setCurrentModel(createBoxGeometry(80, 35, 60, "Rectangular_Billet"));
      setCurrentProjectName("Parametric_Billet.mcam");
    } else if (type === 'cylinder') {
      setCurrentModel(createCylinderGeometry(35, 45, "Cylindrical_Blank"));
      setCurrentProjectName("Cylindrical_Blank.mcam");
    } else if (type === 'sphere') {
      setCurrentModel(createSphereGeometry(30, "Spherical_Solid"));
      setCurrentProjectName("Spherical_Solid.mcam");
    }
    handleResetTransform();
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
      />

      {/* 2. Ribbon Bar with Dynamic Context-Aware Toolbars */}
      <RibbonBar
        activeTab={activeRibbonTab}
        onSelectTab={setActiveRibbonTab}
        onOpenPostModal={() => setIsPostModalOpen(true)}
        onOpenSimModal={() => setIsSimModalOpen(true)}
        onOpenStockModal={() => setIsStockModalOpen(true)}
        onOpenToolManager={() => setIsToolManagerOpen(true)}
        onOpenGCodeViewer={() => setIsGCodeViewerOpen(true)}
        onOpenEntityAnalyzer={() => setIsEntityAnalyzerOpen(true)}
        onOpenDistanceCaliper={() => setIsDistanceCaliperOpen(true)}
        onOpenWireframeModal={handleOpenWireframeModal}
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
          activePlane={activePlane}
          onSelectPlane={handleSelectPlane}
        />

        {/* 3D Viewport */}
        <Viewport3D
          currentModel={currentModel}
          stockConfig={stockConfig}
          operations={operations}
          tools={tools}
          onCoordinateUpdate={setCoords}
          onMetricsCalculated={setPartMetrics}
          onModelImported={handleModelImported}
          workpieceColor={workpieceColor}
          renderMode={renderMode}
          layerVisibility={layerVisibility}
          cameraCommand={cameraCommand}
          partTransform={partTransform}
          customGeometry={customGeometry}
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

      {/* 6. NC2Check G-Code Post Modal */}
      <NC2CheckModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onLaunchSimulation={() => setIsSimModalOpen(true)}
        onOpenGCodeViewer={() => setIsGCodeViewerOpen(true)}
      />

      {/* 7. Machine Kinematics Simulator Modal */}
      <MachineSimModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
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
    </div>
  );
}

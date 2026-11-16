import React, { useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { X, Check, HelpCircle, MousePointer, ChevronRight, FolderCog, Sparkles } from 'lucide-react';
import {
  resolveMachineToolpathCapabilities,
  isDriveSurfaceEntity,
  computeSurfaceSpeedCs,
  computeRpmFromCs,
  computeFeedPerTooth,
  computeFeedFromFpt,
  reinitializeFeedsSpeeds,
  buildPresetApplication,
  createDefaultSurfaceFinishState,
  saveOperationDefaults,
  loadOperationDefaults
} from '../config/surfaceFinishSchema';
import {
  SurfaceHeightsSchematicSvg,
  TipCompDiagramSvg,
  TransitionTileSvg,
  SurfaceFinishSubDialog
} from './SurfaceFinishSubDialogs';

const CLASSIC_YELLOW = {
  background: '#ffffd4',
  border: '1px solid #9ca3af',
  borderRadius: '1px',
  fontSize: '11.5px',
  color: '#0f172a',
  padding: '2px 5px',
  height: '22px',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'Segoe UI', Tahoma, sans-serif"
};

const DISABLED_GRAY = {
  background: '#e5e7eb',
  border: '1px solid #cbd5e1',
  borderRadius: '1px',
  fontSize: '11.5px',
  color: '#64748b',
  padding: '2px 5px',
  height: '22px',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'Segoe UI', Tahoma, sans-serif"
};

const WHITE_INPUT = {
  background: '#ffffff',
  border: '1px solid #9ca3af',
  borderRadius: '1px',
  fontSize: '11.5px',
  color: '#0f172a',
  padding: '2px 5px',
  height: '22px',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'Segoe UI', Tahoma, sans-serif"
};

const MC_BUTTON = {
  height: '23px',
  padding: '0 8px',
  background: '#f3f4f6',
  border: '1px solid #9ca3af',
  borderRadius: '2px',
  fontSize: '11px',
  color: '#0f172a',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box'
};

function buildToolStateFromRecord(tool, caps, current) {
  if (!tool) return current;
  const diameter = Number(tool.diameter) || 10.0;
  const flutes = Math.max(1, Number(tool.flutes) || 4);
  const rpm = Math.min(caps.maxRpm, Number(tool.spindleSpeed ?? tool.rpm) || 3500);
  const feed = Math.min(caps.maxFeed, Number(tool.feedRate) || 250.0);
  const cornerRadius = Number(tool.cornerRadius ?? (tool.type === 'ball' ? diameter / 2 : 0));

  return {
    ...current,
    toolId: tool.id || current.toolId,
    toolName: tool.name || current.toolName,
    toolNumber: Number(tool.number ?? tool.toolNumber) || 1,
    headNumber: Number(tool.headNumber ?? (caps.hasHeadSelection ? 1 : -1)),
    lengthOffset: Number(tool.lengthOffset ?? tool.number) || 1,
    diameterOffset: Number(tool.diameterOffset ?? tool.number) || 1,
    toolDiameter: diameter,
    cornerRadius,
    flutes,
    spindleDirection: tool.spindleDirection === 'Counterclockwise' ? 'CCW' : tool.spindleDirection === 'Off' ? 'Off' : 'CW',
    feedRate: feed,
    fpt: computeFeedPerTooth(feed, rpm, flutes),
    plungeRate: Number(tool.plungeRate) || 150.0,
    retractRate: Number(tool.retractRate) || 250.0,
    spindleSpeed: rpm,
    cs: computeSurfaceSpeedCs(diameter, rpm),
    coolantMode: tool.coolant || current.coolantMode || 'Flood'
  };
}

function SurfaceFinishContourModalInner({
  onClose,
  operation,
  strategyMode = 'contour',
  tools = [],
  customGeometry = [],
  currentModel = null,
  activeMachine = null,
  stockConfig = null,
  lastDefinedTool = null,
  flowlineSelection = null,
  onOpenSurfaceSelection = null,
  onSaveOperation,
  onOpenDefineToolModal,
  onEditTool,
  onNotify
}) {
  const isPocket = strategyMode === 'pocket' || operation?.strategyKey === 'surface_finish_pocket';
  const isFlowline = strategyMode === 'flowline' || operation?.strategyKey === 'surface_finish_flowline' || operation?.badgeClass === 'flowline';
  const isShallow = strategyMode === 'shallow' || operation?.strategyKey === 'surface_finish_shallow' || operation?.badgeClass === 'shallow';
  const isParallel = strategyMode === 'parallel' || operation?.strategyKey === 'surface_finish_parallel' || operation?.badgeClass === 'parallel';
  const isParallelSteep = strategyMode === 'parallel_steep' || strategyMode === 'steep' || operation?.strategyKey === 'surface_finish_parallel_steep' || operation?.badgeClass === 'parallel_steep';
  const isPencil = strategyMode === 'pencil' || operation?.strategyKey === 'surface_finish_pencil' || operation?.badgeClass === 'pencil';
  const isRadial = strategyMode === 'radial' || operation?.strategyKey === 'surface_finish_radial' || operation?.badgeClass === 'radial';
  const isProject = strategyMode === 'project' || operation?.strategyKey === 'surface_finish_project' || operation?.badgeClass === 'project';
  const isLeftover = strategyMode === 'leftover' || strategyMode === 'rest_milling' || operation?.strategyKey === 'surface_finish_leftover' || operation?.badgeClass === 'leftover';
  const caps = useMemo(() => resolveMachineToolpathCapabilities(activeMachine), [activeMachine]);

  const detectedSurfaces = useMemo(() => {
    const surfaceItems = (customGeometry || []).filter((item) => isDriveSurfaceEntity(item));
    let sourceItems = surfaceItems.length > 0
      ? surfaceItems
      : (customGeometry || []).filter((item) => item && item.visible !== false && !item.isLine && !item.isLineSegments);

    // If no customGeometry surfaces, discover meshes from imported CAD model (STEP, STL, etc.)
    if (sourceItems.length === 0 && currentModel) {
      const modelMeshes = [];
      currentModel.traverse((child) => {
        if (child.isMesh && child.geometry && child.visible !== false) {
          modelMeshes.push(child);
        }
      });
      if (modelMeshes.length > 0) {
        sourceItems = modelMeshes;
      }
    }

    return sourceItems.map((item, idx) => {
      let box = item.boundingBox || null;
      if (!box && item.mesh && typeof item.mesh.clone === 'function') {
        box = new THREE.Box3().setFromObject(item.mesh);
      } else if (!box && typeof item.clone === 'function') {
        // Clone without customGeoGroup's +49 parent matrix so local surface coordinates match drive bounds
        const localClone = item.clone(true);
        localClone.updateMatrixWorld(true);
        box = new THREE.Box3().setFromObject(localClone);
      } else if (!box && item.isMesh) {
        box = new THREE.Box3().setFromObject(item);
      }
      const validBox = box && !box.isEmpty() ? box : null;
      return {
        id: String(item.userData?.customId || item.uuid || item.id || `surf_${idx}`),
        name: item.name || item.userData?.type || `3D Drive Surface #${idx + 1}`,
        height: validBox ? Number((validBox.max.y - validBox.min.y).toFixed(2)) : 20.0,
        box: validBox
      };
    });
  }, [customGeometry, currentModel]);

  const initialTool = useMemo(() => {
    if (operation?.toolId) {
      return (
        tools.find((t) => String(t.id) === String(operation.toolId)) ||
        tools.find((t) => Number(t.number) === Number(operation.toolNumber)) ||
        tools[0] ||
        null
      );
    }
    if (isFlowline || isShallow || isParallel || isParallelSteep || isPencil || isRadial || isProject || isLeftover) {
      return (
        tools.find((t) => ['ball'].includes(String(t.type || '').toLowerCase())) ||
        tools.find((t) => ['bull', 'ball', 'flat', 'engrave'].includes(String(t.type || '').toLowerCase())) ||
        tools[0] ||
        null
      );
    }
    return (
      tools.find((t) => ['flat', 'bull', 'ball'].includes(String(t.type || '').toLowerCase())) ||
      tools[0] ||
      null
    );
  }, [operation, tools, isFlowline, isShallow, isParallel, isParallelSteep, isPencil, isRadial, isProject, isLeftover]);

  const initialDefaults = useMemo(
    () =>
      createDefaultSurfaceFinishState({
        activeMachine,
        stockConfig,
        strategyMode: isFlowline ? 'flowline' : isPocket ? 'pocket' : isShallow ? 'shallow' : isParallelSteep ? 'parallel_steep' : isParallel ? 'parallel' : isPencil ? 'pencil' : isRadial ? 'radial' : isProject ? 'project' : isLeftover ? 'leftover' : 'contour',
        tool: initialTool
      }),
    [activeMachine, stockConfig, isPocket, isFlowline, isShallow, isParallel, isParallelSteep, isPencil, isRadial, isProject, isLeftover, initialTool]
  );

  const [activeTab, setActiveTab] = useState('toolpath_params');
  const [selectedToolId, setSelectedToolId] = useState(() => operation?.toolId ?? initialTool?.id ?? null);
  const [selectedSurfaceIds, setSelectedSurfaceIds] = useState(() => {
    if (operation?.driveSurfaceIds?.length > 0) return operation.driveSurfaceIds;
    return detectedSurfaces.map((s) => s.id);
  });

  const [toolParams, setToolParams] = useState(() => ({
    ...initialDefaults.toolParams,
    ...(operation ? buildToolStateFromRecord({
      id: operation.toolId,
      name: operation.toolName || initialDefaults.toolParams.toolName,
      number: operation.toolNumber || initialDefaults.toolParams.toolNumber,
      diameter: operation.toolDiameter || initialDefaults.toolParams.toolDiameter,
      feedRate: operation.feedRate || initialDefaults.toolParams.feedRate,
      spindleSpeed: operation.spindleSpeed || initialDefaults.toolParams.spindleSpeed,
      plungeRate: operation.plungeRate || initialDefaults.toolParams.plungeRate,
      retractRate: operation.retractRate || initialDefaults.toolParams.retractRate
    }, caps, initialDefaults.toolParams) : {}),
    comment: operation?.comment || ''
  }));

  const [machineParams, setMachineParams] = useState(() => ({
    ...initialDefaults.machineParams,
    ...(operation?.machineParams || {})
  }));

  const [surfaceParams, setSurfaceParams] = useState(() => ({
    ...initialDefaults.surfaceParams,
    ...(operation?.surfaceParams || {})
  }));

  const [contourParams, setContourParams] = useState(() => ({
    ...initialDefaults.contourParams,
    ...(isShallow
      ? {
          shallowEnabled: true,
          shallowFromSlope: 0.0,
          shallowToSlope: 35.0,
          maxStepdown: 0.5
        }
      : isParallelSteep
        ? {
            steepEnabled: true,
            steepFromSlope: Number(operation?.steepFromSlope ?? 35.0),
            steepToSlope: Number(operation?.steepToSlope ?? 90.0),
            machiningAngle: Number(operation?.machiningAngle ?? 90.0),
            maxStepdown: Number(operation?.stepdown ?? operation?.stepover ?? 0.5),
            totalTolerance: 0.025,
            openContourDirection: operation?.cuttingMethod || 'zigzag',
            direction: 'climb'
          }
      : isParallel
        ? {
            machiningAngle: Number(operation?.machiningAngle ?? 90.0),
            maxStepdown: Number(operation?.stepover ?? 0.5),
            totalTolerance: 0.025,
            openContourDirection: operation?.cuttingMethod || 'zigzag',
            direction: 'climb'
          }
        : {}),
    ...(operation?.contourParams || {})
  }));

  const [pocketParams, setPocketParams] = useState(() => ({
    ...initialDefaults.pocketParams,
    ...(operation?.pocketParams || {})
  }));

  const [flowlineParams, setFlowlineParams] = useState(() => ({
    ...initialDefaults.flowlineParams,
    ...(operation?.flowlineParams || {})
  }));

  const [pencilParams, setPencilParams] = useState(() => ({
    ...(initialDefaults.pencilParams || {
      totalTolerance: 0.025,
      biTangencyRadius: 3.0,
      numberOfPasses: 1,
      stepover: 0.3,
      cuttingMethod: 'Zigzag',
      machiningDirection: 'climb',
      traceFloorFillet: true,
      traceVerticalCorners: true
    }),
    ...(operation?.pencilParams || {})
  }));

  const [radialParams, setRadialParams] = useState(() => ({
    ...(initialDefaults.radialParams || {
      totalTolerance: 0.025,
      filterToleranceRatio: 0.5,
      oneWayArcFilter: false,
      stepoverMode: 'max_stepover',
      maxStepover: 1.0,
      angularIncrement: 2.0,
      startAngle: 0.0,
      sweepAngle: 360.0,
      startRadius: 0.0,
      endRadius: 50.0,
      centerPoint: { x: 0.0, y: 0.0, z: 0.0 },
      autoCenter: true,
      cutDirection: 'inside_to_outside',
      cuttingMethod: 'Zigzag',
      rotationDirection: 'CW',
      shallowEnabled: false,
      shallowFromSlope: 0.0,
      shallowToSlope: 35.0,
      steepEnabled: false,
      steepFromSlope: 35.0,
      steepToSlope: 90.0,
      transitionType: 'broken',
      maxGapDistance: 10.0
    }),
    ...(operation?.radialParams || {})
  }));

  const [projectParams, setProjectParams] = useState(() => ({
    ...(initialDefaults.projectParams || {
      totalTolerance: 0.025,
      filterToleranceRatio: 0.5,
      oneWayArcFilter: false,
      projectType: 'curve',
      projectionDirection: 'view_z',
      curveSource: 'active_sketch',
      machiningAngle: 0.0,
      stepover: 1.0,
      crosshatchEnabled: false,
      crossAngle: 90.0,
      crossStepover: 1.0,
      sourceOpId: null,
      depthOfCut: 0.2,
      numberOfPasses: 1,
      stepdown: 0.2,
      cuttingMethod: 'Zigzag',
      machiningDirection: 'climb',
      maxGapDistance: 10.0,
      transitionType: 'broken',
      tipComp: 'tip'
    }),
    ...(operation?.projectParams || {})
  }));

  const [leftoverParams, setLeftoverParams] = useState(() => ({
    ...(initialDefaults.leftoverParams || {
      totalTolerance: 0.025,
      filterToleranceRatio: 0.5,
      oneWayArcFilter: false,
      refToolDiameter: 12.0,
      refToolCornerRadius: 6.0,
      refToolType: 'ball',
      machiningMethod: 'along',
      stepover: 0.4,
      numberOfPasses: 3,
      overlap: 1.0,
      cuttingMethod: 'Zigzag',
      machiningDirection: 'climb',
      maxGapDistance: 10.0,
      shallowCutoffAngle: 35.0,
      steepCutoffAngle: 90.0,
      transitionType: 'broken',
      tipComp: 'tip'
    }),
    ...(operation?.leftoverParams || {})
  }));

  // Auto-compute center point and outer radius from detected surfaces if autoCenter is active
  useEffect(() => {
    if (isRadial && (!operation?.radialParams?.centerPoint || radialParams.autoCenter)) {
      if (detectedSurfaces.length > 0) {
        const box = new THREE.Box3();
        detectedSurfaces.forEach((s) => {
          if (s.box && !s.box.isEmpty()) box.union(s.box);
        });
        if (!box.isEmpty()) {
          const cx = Number(((box.min.x + box.max.x) / 2).toFixed(3));
          const cy = Number(((box.min.y + box.max.y) / 2).toFixed(3));
          const cz = Number(((box.min.z + box.max.z) / 2).toFixed(3));
          const rMax = Number(Math.max(
            Math.hypot(box.max.x - cx, box.max.z - cz),
            Math.hypot(box.min.x - cx, box.min.z - cz),
            10.0
          ).toFixed(2));
          setRadialParams((prev) => {
            if (prev.centerPoint?.x === cx && prev.centerPoint?.y === cz && prev.endRadius === rMax) {
              return prev;
            }
            return {
              ...prev,
              centerPoint: { x: cx, y: cz, z: cy },
              endRadius: prev.endRadius > 0 && !prev.autoCenter ? prev.endRadius : rMax
            };
          });
        }
      }
    }
  }, [isRadial, detectedSurfaces]);

  // Tool table UI state (view mode, sort order, right-click menu, active sub-dialog)
  const [toolViewMode, setToolViewMode] = useState('details'); // details | large | small
  const [toolSortBy, setToolSortBy] = useState('number'); // number | diameter | type | name
  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(null); // 'view' | 'arrange'
  const [activeSubDialog, setActiveSubDialog] = useState(null);
  const [seenDefinedToolSeq, setSeenDefinedToolSeq] = useState(lastDefinedTool?.seq || 0);

  // If a tool was just created or edited via stacked DefineToolModal, select & reflect it immediately
  if (lastDefinedTool && lastDefinedTool.seq > seenDefinedToolSeq) {
    setSeenDefinedToolSeq(lastDefinedTool.seq);
    if (lastDefinedTool.tool) {
      setSelectedToolId(lastDefinedTool.tool.id);
      setToolParams((prev) => buildToolStateFromRecord(lastDefinedTool.tool, caps, prev));
    }
  }

  const displayedTools = useMemo(() => {
    const arr = [...tools];
    if (toolSortBy === 'number') arr.sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
    else if (toolSortBy === 'diameter') arr.sort((a, b) => (Number(a.diameter) || 0) - (Number(b.diameter) || 0));
    else if (toolSortBy === 'type') arr.sort((a, b) => String(a.type || '').localeCompare(String(b.type || '')));
    else if (toolSortBy === 'name') arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    return arr;
  }, [tools, toolSortBy]);

  const activeTool = useMemo(
    () => tools.find((t) => String(t.id) === String(selectedToolId)) || tools[0] || null,
    [tools, selectedToolId]
  );

  const handleSelectTool = (tool) => {
    setSelectedToolId(tool.id);
    setToolParams((prev) => buildToolStateFromRecord(tool, caps, prev));
  };

  // Coupled Feeds & Speeds handlers (Tab 1)
  const updateRpm = (val) => {
    const rpm = Math.min(caps.maxRpm, Math.max(0, Number(val) || 0));
    const cs = computeSurfaceSpeedCs(toolParams.toolDiameter, rpm);
    const feedRate = computeFeedFromFpt(toolParams.fpt, rpm, toolParams.flutes, caps.maxFeed);
    setToolParams((p) => ({ ...p, spindleSpeed: rpm, cs, feedRate }));
  };

  const updateCs = (val) => {
    const cs = Math.max(0, Number(val) || 0);
    const rpm = computeRpmFromCs(toolParams.toolDiameter, cs, caps.maxRpm);
    const feedRate = computeFeedFromFpt(toolParams.fpt, rpm, toolParams.flutes, caps.maxFeed);
    setToolParams((p) => ({ ...p, cs, spindleSpeed: rpm, feedRate }));
  };

  const updateFeed = (val) => {
    const feedRate = Math.min(caps.maxFeed, Math.max(0, Number(val) || 0));
    const fpt = computeFeedPerTooth(feedRate, toolParams.spindleSpeed, toolParams.flutes);
    setToolParams((p) => ({ ...p, feedRate, fpt }));
  };

  const updateFpt = (val) => {
    const fpt = Math.max(0, Number(val) || 0);
    const feedRate = computeFeedFromFpt(fpt, toolParams.spindleSpeed, toolParams.flutes, caps.maxFeed);
    setToolParams((p) => ({ ...p, fpt, feedRate }));
  };

  const handleReinitializeFeedsSpeeds = () => {
    const res = reinitializeFeedsSpeeds({
      tool: { diameter: toolParams.toolDiameter, flutes: toolParams.flutes, type: activeTool?.type || 'flat' },
      activeMachine,
      axialDepthAp: contourParams.maxStepdown || 0.5
    });
    setToolParams((p) => ({
      ...p,
      spindleSpeed: res.spindleSpeed,
      feedRate: res.feedRate,
      plungeRate: res.plungeRate,
      retractRate: res.retractRate,
      cs: res.cs,
      fpt: res.fpt
    }));
    onNotify?.(`Re-initialized feeds & speeds for ${caps.machineName}: S${res.spindleSpeed}, F${res.feedRate}`, 'info');
  };

  const handleSaveDefaults = () => {
    const ok = saveOperationDefaults({
      toolParams,
      machineParams,
      surfaceParams,
      contourParams,
      pocketParams,
      flowlineParams
    });
    onNotify?.(ok ? 'Saved parameters to Mastercam defaults file.' : 'Unable to persist defaults.', ok ? 'success' : 'error');
  };

  const handleReloadDefaults = () => {
    const loaded = loadOperationDefaults();
    if (!loaded) {
      onNotify?.('No saved defaults file found. Resetting to machine baseline.', 'info');
      setSurfaceParams(initialDefaults.surfaceParams);
      setContourParams(initialDefaults.contourParams);
      setPocketParams(initialDefaults.pocketParams);
      setFlowlineParams(initialDefaults.flowlineParams);
      return;
    }
    if (loaded.toolParams) setToolParams((p) => ({ ...p, ...loaded.toolParams }));
    if (loaded.machineParams) setMachineParams((p) => ({ ...p, ...loaded.machineParams }));
    if (loaded.surfaceParams) setSurfaceParams((p) => ({ ...p, ...loaded.surfaceParams }));
    if (loaded.contourParams) setContourParams((p) => ({ ...p, ...loaded.contourParams }));
    if (loaded.pocketParams) setPocketParams((p) => ({ ...p, ...loaded.pocketParams }));
    if (loaded.flowlineParams) setFlowlineParams((p) => ({ ...p, ...loaded.flowlineParams }));
    onNotify?.('Reloaded Surface Finish parameters from defaults file.', 'success');
  };

  const handleSaveToLibrary = () => {
    if (!activeTool) return;
    try {
      const key = 'argus_cam_custom_tool_library_v1';
      const existing = JSON.parse(window.localStorage.getItem(key) || '[]');
      const next = [...existing.filter((x) => x.name !== toolParams.toolName), { ...activeTool, ...toolParams, name: toolParams.toolName }];
      window.localStorage.setItem(key, JSON.stringify(next));
      onNotify?.(`Saved "${toolParams.toolName}" to ${caps.toolManagerSuffix} library.`, 'success');
    } catch {
      onNotify?.('Tool saved for active session.', 'info');
    }
  };

  const handleApply = () => {
    const activeSurfaces = detectedSurfaces.filter((s) => selectedSurfaceIds.includes(s.id));
    let combinedBox = flowlineSelection?.driveBounds ? flowlineSelection.driveBounds.clone() : null;
    if (!combinedBox && activeSurfaces.length > 0) {
      combinedBox = new THREE.Box3();
      activeSurfaces.forEach((s) => {
        if (s.box && !s.box.isEmpty()) combinedBox.union(s.box);
      });
    }

    const opTitle = isFlowline
      ? 'Surface Finish Flowline'
      : isPocket
        ? 'Surface Finish Pocket'
        : isShallow
          ? 'Surface Finish Shallow'
          : isParallelSteep
            ? 'Surface Finish Parallel Steep'
            : isParallel
              ? 'Surface Finish Parallel'
              : isPencil
                ? 'Surface Finish Pencil'
                : isRadial
                  ? 'Surface Finish Radial'
                  : isProject
                    ? 'Surface Finish Project'
                    : isLeftover
                      ? 'Surface Finish Leftover'
                      : 'Surface Finish Contour';
    const rapidHeight = surfaceParams.clearanceEnabled && surfaceParams.clearanceMode === 'abs'
      ? Number(surfaceParams.clearance)
      : (Number(surfaceParams.retract) || 25.0);

    const driveFaceIds = flowlineSelection?.driveFaceIds || operation?.driveFaceIds || [];
    const checkFaceIds = flowlineSelection?.checkFaceIds || operation?.checkFaceIds || [];
    const containmentIds = flowlineSelection?.containmentIds || operation?.containmentIds || [];
    const flowlineData = flowlineSelection?.flowlineData || operation?.flowlineData || initialDefaults.flowlineData;

    const updatedOp = {
      ...(operation || {}),
      name: operation?.name || opTitle,
      type: isFlowline ? 'surface_finish_flowline' : isPocket ? 'surface_finish_pocket' : isShallow ? 'surface_finish_shallow' : isParallelSteep ? 'surface_finish_parallel_steep' : isParallel ? 'surface_finish_parallel' : isPencil ? 'surface_finish_pencil' : isRadial ? 'surface_finish_radial' : isProject ? 'surface_finish_project' : isLeftover ? 'surface_finish_leftover' : 'surface_finish_contour',
      strategyKey: isFlowline ? 'surface_finish_flowline' : isPocket ? 'surface_finish_pocket' : isShallow ? 'surface_finish_shallow' : isParallelSteep ? 'surface_finish_parallel_steep' : isParallel ? 'surface_finish_parallel' : isPencil ? 'surface_finish_pencil' : isRadial ? 'surface_finish_radial' : isProject ? 'surface_finish_project' : isLeftover ? 'surface_finish_leftover' : 'surface_finish_contour',
      badgeClass: isFlowline ? 'flowline' : isPocket ? 'pocket' : isShallow ? 'shallow' : isParallelSteep ? 'parallel_steep' : isParallel ? 'parallel' : isPencil ? 'pencil' : isRadial ? 'radial' : isProject ? 'project' : isLeftover ? 'leftover' : 'contour',
      badgeText: isFlowline ? 'SF' : isPocket ? 'SP' : isShallow ? 'SS' : isParallelSteep ? 'PS' : isParallel ? 'PA' : isPencil ? 'PC' : isRadial ? 'RD' : isProject ? 'PJ' : isLeftover ? 'LO' : 'SC',
      machiningAngle: Number(contourParams.machiningAngle ?? 90.0),
      steepFromSlope: Number(contourParams.steepFromSlope ?? 35.0),
      steepToSlope: Number(contourParams.steepToSlope ?? 90.0),
      stepover: Number(isRadial ? (radialParams.stepoverMode === 'angular' ? radialParams.angularIncrement : radialParams.maxStepover) : isProject ? projectParams.stepover : isLeftover ? leftoverParams.stepover : isPencil ? pencilParams.stepover : contourParams.maxStepdown) || 0.5,
      cuttingMethod: isRadial ? (radialParams.cuttingMethod || 'zigzag').toLowerCase() : isProject ? (projectParams.cuttingMethod || 'zigzag').toLowerCase() : isLeftover ? (leftoverParams.cuttingMethod || 'zigzag').toLowerCase() : isPencil ? (pencilParams.cuttingMethod || 'zigzag').toLowerCase() : (contourParams.openContourDirection || 'zigzag'),
      toolId: activeTool?.id || toolParams.toolId || 1,
      toolName: toolParams.toolName,
      toolNumber: Number(toolParams.toolNumber) || 1,
      toolType: activeTool?.type || 'flat',
      toolDiameter: Number(toolParams.toolDiameter) || 10.0,
      cornerRadius: Number(toolParams.cornerRadius) || 0,
      feedRate: Number(toolParams.feedRate) || 250,
      spindleSpeed: Number(toolParams.spindleSpeed) || 3500,
      plungeRate: Number(toolParams.plungeRate) || 150,
      plungeFeedRate: Number(toolParams.plungeRate) || 150,
      retractRate: Number(toolParams.retractRate) || 250,
      rapidHeight,
      stepdown: Number(isFlowline ? flowlineParams.stepoverDistance : isPocket ? pocketParams.maxStepdown : isPencil ? pencilParams.stepover : isRadial ? (radialParams.stepoverMode === 'angular' ? radialParams.angularIncrement : radialParams.maxStepover) : isProject ? (projectParams.depthOfCut || projectParams.stepdown || 0.2) : isLeftover ? leftoverParams.stepover : contourParams.maxStepdown) || 0.5,
      stockToLeaveXY: Number(surfaceParams.stockToLeaveDrive) || 0.0,
      stockToLeaveZ: Number(surfaceParams.stockToLeaveDrive) || 0.0,
      cuttingDirection: isPocket ? pocketParams.machiningDirection : isPencil ? pencilParams.machiningDirection : isProject ? projectParams.machiningDirection : isLeftover ? leftoverParams.machiningDirection : contourParams.direction,
      contourSide: surfaceParams.containmentMode,
      cutStyle: isFlowline
        ? String(flowlineParams.cuttingMethod || 'Zigzag').toLowerCase()
        : isPencil
          ? String(pencilParams.cuttingMethod || 'Zigzag').toLowerCase()
          : isRadial
            ? String(radialParams.cuttingMethod || 'Zigzag').toLowerCase()
            : isProject
              ? String(projectParams.cuttingMethod || 'Zigzag').toLowerCase()
              : isLeftover
                ? String(leftoverParams.cuttingMethod || 'Zigzag').toLowerCase()
                : (pocketParams.cuttingMethod?.toLowerCase() || 'constant_overlap'),
      stepoverPct: Math.max(5, Math.min(95, Math.round((Number((isFlowline ? flowlineParams.stepoverDistance : isPencil ? pencilParams.stepover : isRadial ? radialParams.maxStepover : isProject ? projectParams.stepover : isLeftover ? leftoverParams.stepover : pocketParams.stepover) || 5) / Math.max(1, Number(toolParams.toolDiameter))) * 100))),
      biTangencyRadius: Number(pencilParams.biTangencyRadius) || 3.0,
      numberOfPasses: Number(isLeftover ? leftoverParams.numberOfPasses : pencilParams.numberOfPasses) || 1,
      driveSurfaceIds: selectedSurfaceIds,
      driveFaceIds,
      checkFaceIds,
      containmentIds,
      usesCustomSurfaces: true,
      bounds: combinedBox && !combinedBox.isEmpty() ? combinedBox : (operation?.bounds || null),
      comment: toolParams.comment,
      machineId: caps.machineId,
      machineAxes: caps.axesCount,
      machineParams: { ...machineParams },
      surfaceParams: {
        ...surfaceParams,
        driveSurfacesCount: isFlowline ? (driveFaceIds.length || activeSurfaces.length) : activeSurfaces.length,
        checkSurfacesCount: checkFaceIds.length
      },
      contourParams: { ...contourParams },
      pocketParams: { ...pocketParams },
      flowlineData: { ...flowlineData },
      flowlineParams: { ...flowlineParams },
      pencilParams: { ...pencilParams },
      radialParams: { ...radialParams },
      projectParams: { ...projectParams },
      leftoverParams: { ...leftoverParams }
    };

    onSaveOperation?.(updatedOp);
    onNotify?.(`Applied "${updatedOp.name}" for ${caps.machineName}`, 'success');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        background: 'rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: 'none'
      }}
      onClick={() => {
        if (contextMenuPos) {
          setContextMenuPos(null);
          setOpenSubMenu(null);
        }
      }}
    >
      <div
        style={{
          width: '820px',
          maxWidth: '96vw',
          background: '#f0f0f0',
          border: '1px solid #64748b',
          boxShadow: '0 22px 48px rgba(0, 0, 0, 0.42)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar matching Mastercam 2018 */}
        <div
          style={{
            height: '29px',
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0 0 10px',
            fontSize: '12px',
            color: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 500 }}>
              {isFlowline
                ? 'Surface Finish Flowline'
                : isPocket
                  ? 'Surface Finish Pocket'
                  : isShallow
                    ? 'Surface Finish Shallow'
                    : isParallelSteep
                      ? 'Surface Finish Parallel Steep'
                      : isParallel
                        ? 'Surface Finish Parallel'
                        : isPencil
                          ? 'Surface Finish Pencil'
                          : isRadial
                            ? 'Surface Finish Radial'
                            : isProject
                              ? 'Surface Finish Project'
                              : isLeftover
                                ? 'Surface Finish Leftover'
                                : 'Surface Finish Contour'}
            </span>
            <span
              style={{
                fontSize: '10px',
                background: caps.is5Axis ? '#ede9fe' : caps.is4Axis ? '#fef3c7' : '#e0f2fe',
                color: caps.is5Axis ? '#5b21b6' : caps.is4Axis ? '#92400e' : '#0369a1',
                border: '1px solid #cbd5e1',
                padding: '1px 6px',
                borderRadius: '2px',
                fontWeight: 600
              }}
            >
              {caps.machineName} • {caps.axesCount}-Axis ({caps.controller})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '40px',
              height: '29px',
              background: '#ffffff',
              border: 'none',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e81123';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#334155';
            }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Flowline Tutorial Quick Helper Banner */}
        {isFlowline && (
          <div
            style={{
              background: '#eff6ff',
              borderBottom: '1px solid #bfdbfe',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div>
              <strong>Surface Finish Flowline:</strong> 1. Select Ball Endmill &rarr; 2. Set Surface Clearance (50mm Abs) &rarr; 3. Set Stepover (0.5mm Zigzag) &rarr; Click <strong>Green Checkmark (OK)</strong> &rarr; Click <strong>Post (G1)</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                setToolParams((p) => ({
                  ...p,
                  toolName: '10mm Ball Endmill',
                  toolDiameter: 10,
                  cornerRadius: 5,
                  spindleSpeed: 5000,
                  feedRate: 1500,
                  plungeRate: 500,
                  retractRate: 5000
                }));
                setSurfaceParams((p) => ({
                  ...p,
                  clearance: 50,
                  clearanceEnabled: true,
                  clearanceMode: 'abs',
                  retract: 10,
                  retractEnabled: true,
                  retractMode: 'inc',
                  feedPlane: 2,
                  feedPlaneMode: 'inc',
                  topOfStock: 0,
                  stockToLeaveDrive: 0
                }));
                setFlowlineParams((p) => ({
                  ...p,
                  stepoverMode: 'distance',
                  stepoverDistance: 0.5,
                  cuttingMethod: 'Zigzag',
                  totalTolerance: 0.01
                }));
                onNotify?.('Loaded recommended tutorial values for 10mm Ball Endmill.', 'success');
              }}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Tutorial Values
            </button>
          </div>
        )}

        {/* Shallow Tutorial Quick Helper Banner */}
        {isShallow && (
          <div
            style={{
              background: '#ecfdf5',
              borderBottom: '1px solid #a7f3d0',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div>
              <strong>Surface Finish Shallow:</strong> 1. Select Ball Endmill &rarr; 2. Surface Parameters (Clearance 50mm Abs) &rarr; 3. Finish Shallow Parameters (Slope 0°–35°, Stepover 0.5mm) &rarr; Click <strong>Green Checkmark (OK)</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                setContourParams((p) => ({
                  ...p,
                  shallowEnabled: true,
                  shallowFromSlope: 0.0,
                  shallowToSlope: 35.0,
                  maxStepdown: 0.5
                }));
                onNotify?.('Loaded recommended Surface Finish Shallow parameters (0°–35° slope, 0.5mm stepover).', 'success');
              }}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Shallow Values
            </button>
          </div>
        )}

        {/* Parallel Tutorial Quick Helper Banner */}
        {isParallel && (
          <div
            style={{
              background: '#fdf4ff',
              borderBottom: '1px solid #f0abfc',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#86198f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div>
              <strong>Surface Finish Parallel:</strong> 1. Select Ball Endmill &rarr; 2. Surface Parameters (Clearance 50mm Abs) &rarr; 3. Finish Parallel Parameters (Machining Angle 90°, Stepover 0.5mm) &rarr; Click <strong>Green Checkmark (OK)</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                setContourParams((p) => ({
                  ...p,
                  machiningAngle: 90.0,
                  maxStepdown: 0.5,
                  totalTolerance: 0.025,
                  openContourDirection: 'zigzag',
                  direction: 'climb'
                }));
                onNotify?.('Loaded recommended Surface Finish Parallel parameters (90° angle, 0.5mm stepover, Zigzag).', 'success');
              }}
              style={{
                background: '#c026d3',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Parallel Values
            </button>
          </div>
        )}

        {/* Parallel Steep Tutorial Quick Helper Banner */}
        {isParallelSteep && (
          <div
            style={{
              background: '#fdf2f8',
              borderBottom: '1px solid #fbcfe8',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#9d174d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div>
              <strong>Surface Finish Parallel Steep:</strong> 1. Select Ball Endmill &rarr; 2. Surface Parameters (Clearance 50mm Abs) &rarr; 3. Finish Parallel Steep Parameters (Angle 90°, Steep Slope 35°–90°, Stepover 0.5mm) &rarr; Click <strong>Green Checkmark (OK)</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                const ballTool = tools.find((t) => t.type === 'ball' || /ball/i.test(t.name)) || tools[0];
                if (ballTool) {
                  setSelectedToolId(ballTool.id);
                  setToolParams((prev) => buildToolStateFromRecord(ballTool, caps, prev));
                }
                setSurfaceParams((p) => ({
                  ...p,
                  clearanceEnabled: true,
                  clearance: 50.0,
                  clearanceMode: 'abs',
                  retractEnabled: true,
                  retract: 25.0,
                  retractMode: 'inc',
                  feedPlane: 5.0,
                  feedPlaneMode: 'inc',
                  stockToLeaveDrive: 0.0,
                  stockToLeaveCheck: 0.0
                }));
                setContourParams((p) => ({
                  ...p,
                  steepEnabled: true,
                  steepFromSlope: 35.0,
                  steepToSlope: 90.0,
                  machiningAngle: 90.0,
                  maxStepdown: 0.5,
                  totalTolerance: 0.025,
                  openContourDirection: 'zigzag',
                  direction: 'climb'
                }));
                onNotify?.('Loaded recommended Surface Finish Parallel Steep parameters (35°–90° steep slopes, 90° angle, 0.5mm stepover, Zigzag).', 'success');
              }}
              style={{
                background: '#be185d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Parallel Steep Values
            </button>
          </div>
        )}

        {/* Pencil Tutorial Quick Helper Banner */}
        {isPencil && (
          <div
            style={{
              background: '#fef3c7',
              borderBottom: '1px solid #fde68a',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div>
              <strong>Surface Finish Pencil:</strong> 1. Select Ball Endmill &rarr; 2. Surface Parameters (Clearance 25mm Abs) &rarr; 3. Finish Pencil Parameters (Bi-tangency R3.0, Passes) &rarr; Click <strong>Green Checkmark (OK)</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                const ballTool = tools.find((t) => t.type === 'ball' || /ball/i.test(t.name)) || tools[0];
                if (ballTool) {
                  setSelectedToolId(ballTool.id);
                  setToolParams((prev) => buildToolStateFromRecord(ballTool, caps, prev));
                }
                setSurfaceParams((p) => ({
                  ...p,
                  clearanceEnabled: true,
                  clearance: 25.0,
                  clearanceMode: 'abs',
                  retractEnabled: true,
                  retract: 2.5,
                  retractMode: 'inc',
                  feedPlane: 2.5,
                  feedPlaneMode: 'inc',
                  stockToLeaveDrive: 0.0,
                  stockToLeaveCheck: 0.0
                }));
                setPencilParams((p) => ({
                  ...p,
                  totalTolerance: 0.025,
                  biTangencyRadius: 3.0,
                  numberOfPasses: 1,
                  stepover: 0.3,
                  cuttingMethod: 'Zigzag',
                  machiningDirection: 'climb',
                  traceFloorFillet: true,
                  traceVerticalCorners: true
                }));
                onNotify?.('Loaded recommended Surface Finish Pencil parameters (T5 Ball Nose, R3.0 Bi-tangency).', 'success');
              }}
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Pencil Values
            </button>
          </div>
        )}

        {/* Radial Tutorial Quick Helper Banner */}
        {isRadial && (
          <div
            style={{
              background: '#ecfeff',
              borderBottom: '1px solid #a5f3fc',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#0e7490',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div>
              <strong>Surface Finish Radial:</strong> 1. Select Ball/Bull Nose &rarr; 2. Surface Parameters (Clearance 25mm Abs) &rarr; 3. Radial Parameters (Center, Stepover/Angle, Sector) &rarr; Click <strong>Green Checkmark (OK)</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                const ballTool = tools.find((t) => t.type === 'ball' || /ball/i.test(t.name)) || tools[0];
                if (ballTool) {
                  setSelectedToolId(ballTool.id);
                  setToolParams((prev) => buildToolStateFromRecord(ballTool, caps, prev));
                }
                setSurfaceParams((p) => ({
                  ...p,
                  clearanceEnabled: true,
                  clearance: 25.0,
                  clearanceMode: 'abs',
                  retractEnabled: true,
                  retract: 2.5,
                  retractMode: 'inc',
                  feedPlane: 2.5,
                  feedPlaneMode: 'inc',
                  stockToLeaveDrive: 0.0,
                  containmentMode: 'center'
                }));
                if (detectedSurfaces.length > 0) {
                  const box = new THREE.Box3();
                  detectedSurfaces.forEach((s) => { if (s.box && !s.box.isEmpty()) box.union(s.box); });
                  if (!box.isEmpty()) {
                    const cx = Number(((box.min.x + box.max.x) / 2).toFixed(3));
                    const cy = Number(((box.min.y + box.max.y) / 2).toFixed(3));
                    const cz = Number(((box.min.z + box.max.z) / 2).toFixed(3));
                    const rMax = Number(Math.max(Math.hypot(box.max.x - cx, box.max.z - cz), 10.0).toFixed(2));
                    setRadialParams((p) => ({
                      ...p,
                      centerPoint: { x: cx, y: cz, z: cy },
                      endRadius: rMax,
                      autoCenter: true,
                      maxStepover: 1.0,
                      angularIncrement: Number(((1.0 / rMax) * (180 / Math.PI)).toFixed(2)),
                      sweepAngle: 360.0
                    }));
                  }
                }
                onNotify?.('Loaded recommended Radial values & auto-centered on drive surfaces', 'success');
              }}
              style={{
                background: '#0891b2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Radial Values
            </button>
          </div>
        )}

        {/* Project Tutorial Quick Helper Banner */}
        {isProject && (
          <div
            style={{
              background: '#f5f3ff',
              borderBottom: '1px solid #ddd6fe',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#5b21b6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div>
              <strong>Surface Finish Project:</strong> 1. Select Ball/Bull Nose or Engrave Tool &rarr; 2. Surface Parameters (Clearance 25mm Abs) &rarr; 3. Project Parameters (Curve/Crosshatch, Depth 0.2mm, Zigzag) &rarr; Click <strong>Green Checkmark (OK)</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                const projTool = tools.find((t) => t.type === 'ball' || /ball|engrave|bull/i.test(t.name)) || tools[0];
                if (projTool) {
                  setSelectedToolId(projTool.id);
                  setToolParams((prev) => buildToolStateFromRecord(projTool, caps, prev));
                }
                setSurfaceParams((p) => ({
                  ...p,
                  clearanceEnabled: true,
                  clearance: 25.0,
                  clearanceMode: 'abs',
                  retractEnabled: true,
                  retract: 2.5,
                  retractMode: 'inc',
                  feedPlane: 2.0,
                  feedPlaneMode: 'inc',
                  stockToLeaveDrive: 0.0
                }));
                setProjectParams((p) => ({
                  ...p,
                  totalTolerance: 0.025,
                  projectType: 'curve',
                  projectionDirection: 'view_z',
                  depthOfCut: 0.2,
                  numberOfPasses: 1,
                  stepdown: 0.2,
                  cuttingMethod: 'Zigzag',
                  machiningDirection: 'climb',
                  stepover: 1.0,
                  crosshatchEnabled: false,
                  maxGapDistance: 10.0
                }));
                onNotify?.('Loaded recommended Surface Finish Project parameters (0.2mm depth, Zigzag, View Z).', 'success');
              }}
              style={{
                background: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Project Values
            </button>
          </div>
        )}

        {/* Leftover Rest Machining Quick Helper Banner */}
        {isLeftover && (
          <div
            style={{
              background: '#ecfdf5',
              borderBottom: '1px solid #a7f3d0',
              padding: '6px 12px',
              fontSize: '11px',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} color="#10b981" />
              <span>
                <strong>Surface Finish Leftover:</strong> Targets unmachined material in fillets & corners left by previous roughing tool (D={leftoverParams.refToolDiameter}mm R={leftoverParams.refToolCornerRadius}mm) with tangential overlap blending.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const finishTool = tools.find((t) => t.type === 'ball' || /ball/i.test(t.name)) || tools[0];
                if (finishTool) {
                  setSelectedToolId(finishTool.id);
                  setToolParams((prev) => buildToolStateFromRecord(finishTool, caps, prev));
                }
                setSurfaceParams((p) => ({
                  ...p,
                  clearanceEnabled: true,
                  clearance: 25.0,
                  clearanceMode: 'abs',
                  retractEnabled: true,
                  retract: 2.5,
                  retractMode: 'inc',
                  feedPlane: 2.0,
                  feedPlaneMode: 'inc',
                  stockToLeaveDrive: 0.0
                }));
                setLeftoverParams((p) => ({
                  ...p,
                  refToolDiameter: Math.max(12.0, (Number(toolParams.toolDiameter) || 6.0) * 2),
                  refToolCornerRadius: Math.max(6.0, Number(toolParams.toolDiameter) || 6.0),
                  overlap: 1.0,
                  stepover: Number(((Number(toolParams.toolDiameter) || 6.0) * 0.15).toFixed(2)) || 0.4,
                  numberOfPasses: 3,
                  cuttingMethod: 'Zigzag',
                  machiningMethod: 'along'
                }));
                onNotify?.('Loaded recommended leftover parameters for active tool', 'info');
              }}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ⚡ Load Recommended Leftover Values
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', background: '#f0f0f0', padding: '5px 8px 0 8px', borderBottom: '1px solid #d1d5db' }}>
          {[
            { id: 'toolpath_params', label: 'Toolpath parameters' },
            { id: 'surface_params', label: 'Surface parameters' },
            {
              id: 'finish_contour_params',
              label: isFlowline
                ? 'Finish flowline parameters'
                : isPocket
                  ? 'Finish pocket parameters'
                  : isShallow
                    ? 'Finish shallow parameters'
                    : isParallelSteep
                      ? 'Finish parallel steep parameters'
                      : isParallel
                        ? 'Finish parallel parameters'
                        : isPencil
                          ? 'Finish pencil parameters'
                          : isRadial
                            ? 'Finish radial parameters'
                            : isProject
                              ? 'Finish project parameters'
                              : isLeftover
                                ? 'Finish leftover parameters'
                                : 'Finish contour parameters'
            }
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  background: active ? '#ffffff' : '#e5e7eb',
                  color: '#0f172a',
                  borderTop: '1px solid #9ca3af',
                  borderLeft: '1px solid #9ca3af',
                  borderRight: '1px solid #9ca3af',
                  borderBottom: active ? '1px solid #ffffff' : '1px solid #9ca3af',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  fontWeight: active ? 500 : 400
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main White-Backed Tab Workspace */}
        <div style={{ background: '#ffffff', margin: '0 8px 0 8px', border: '1px solid #cbd5e1', borderTop: 'none', padding: '12px', minHeight: '365px' }}>
          {/* ==================== TAB 1: TOOLPATH PARAMETERS (IMAGE 1) ==================== */}
          {activeTab === 'toolpath_params' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '14px', minWidth: 0 }}>
                {/* Left Pane: Tool Table + Context Menu Trigger */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenuPos({
                        x: Math.min(rect.width - 10, Math.max(8, e.clientX - rect.left)),
                        y: Math.min(rect.height - 10, Math.max(8, e.clientY - rect.top)),
                        clientX: e.clientX,
                        clientY: e.clientY
                      });
                    }}
                    style={{
                      height: '286px',
                      border: '1px solid #94a3b8',
                      background: '#ffffff',
                      overflowY: 'auto',
                      position: 'relative'
                    }}
                    title="Right-click to Create new tool, Edit tool, Re-initialize feeds & speeds, or Search presets"
                  >
                    {toolViewMode === 'details' ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                          <tr style={{ textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '4px 6px', width: '28px', borderRight: '1px solid #e2e8f0', fontWeight: 500 }}>#</th>
                            <th style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0', fontWeight: 500 }}>Assembly N...</th>
                            <th style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0', fontWeight: 500 }}>Tool Name</th>
                            <th style={{ padding: '4px 6px', fontWeight: 500 }}>Holder N...</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedTools.map((t, idx) => {
                            const selected = String(t.id) === String(activeTool?.id);
                            return (
                              <tr
                                key={t.id || idx}
                                onClick={() => handleSelectTool(t)}
                                onDoubleClick={() => onEditTool?.(t)}
                                style={{
                                  background: selected ? '#cce8ff' : '#ffffff',
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer'
                                }}
                              >
                                <td style={{ padding: '4px 6px', fontWeight: 600 }}>{t.number || idx + 1}</td>
                                <td style={{ padding: '4px 6px', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  T{t.number || idx + 1} Assembly
                                </td>
                                <td style={{ padding: '4px 6px', maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {t.name}
                                </td>
                                <td style={{ padding: '4px 6px', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
                                  {t.holder || caps.spindleTaper}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: toolViewMode === 'large' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '6px', padding: '6px' }}>
                        {displayedTools.map((t, idx) => {
                          const selected = String(t.id) === String(activeTool?.id);
                          return (
                            <div
                              key={t.id || idx}
                              onClick={() => handleSelectTool(t)}
                              onDoubleClick={() => onEditTool?.(t)}
                              style={{
                                padding: toolViewMode === 'large' ? '8px' : '4px 6px',
                                border: selected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                                background: selected ? '#e0f2fe' : '#f8fafc',
                                fontSize: '10.5px',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ fontWeight: 700 }}>#{t.number || idx + 1} ({t.diameter}mm)</div>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Select Library Tool Button below table */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveSubDialog('select_library_tool')}
                      style={{ ...MC_BUTTON, width: '132px' }}
                    >
                      Select library tool...
                    </button>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Right-click list for tools &amp; defaults</span>
                  </div>
                </div>

                {/* Right Pane: Exact Mastercam Tool Parameters Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '11.5px', color: '#0f172a', minWidth: 0 }}>
                  {/* Tool name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <span style={{ textAlign: 'right' }}>Tool name:</span>
                    <input
                      type="text"
                      value={toolParams.toolName}
                      onChange={(e) => setToolParams((p) => ({ ...p, toolName: e.target.value }))}
                      style={WHITE_INPUT}
                    />
                  </div>

                  {/* Tool #, Length offset, Head #, Diameter offset, Tool diameter, Corner radius */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '6px 12px', minWidth: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Tool #:</span>
                      <input type="number" value={toolParams.toolNumber} onChange={(e) => setToolParams((p) => ({ ...p, toolNumber: Number(e.target.value) }))} style={CLASSIC_YELLOW} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Length offset:</span>
                      <input type="number" value={toolParams.lengthOffset} onChange={(e) => setToolParams((p) => ({ ...p, lengthOffset: Number(e.target.value) }))} style={CLASSIC_YELLOW} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Head #:</span>
                      <input
                        type="number"
                        value={toolParams.headNumber}
                        disabled={!caps.hasHeadSelection && caps.is3Axis}
                        onChange={(e) => setToolParams((p) => ({ ...p, headNumber: Number(e.target.value) }))}
                        style={caps.hasHeadSelection ? CLASSIC_YELLOW : { ...CLASSIC_YELLOW, background: '#fef9c3' }}
                        title={caps.hasHeadSelection ? 'Multi-head station index' : '-1 for single vertical spindle (3-Axis)'}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Diameter offset:</span>
                      <input type="number" value={toolParams.diameterOffset} onChange={(e) => setToolParams((p) => ({ ...p, diameterOffset: Number(e.target.value) }))} style={CLASSIC_YELLOW} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Tool diameter:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={toolParams.toolDiameter}
                        onChange={(e) => {
                          const d = Math.max(0.1, Number(e.target.value) || 0.1);
                          setToolParams((p) => ({ ...p, toolDiameter: d, cs: computeSurfaceSpeedCs(d, p.spindleSpeed) }));
                        }}
                        style={CLASSIC_YELLOW}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Corner radius:</span>
                      <input type="number" step="0.1" value={toolParams.cornerRadius} onChange={(e) => setToolParams((p) => ({ ...p, cornerRadius: Number(e.target.value) }))} style={CLASSIC_YELLOW} />
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '3px 0' }} />

                  {/* Coolant... & Spindle direction */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '6px 12px', alignItems: 'center', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => setActiveSubDialog('coolant')}
                        style={{ ...MC_BUTTON, width: '100%' }}
                        title={`Active coolant: ${toolParams.coolantMode}`}
                      >
                        Coolant... ({toolParams.coolantMode})
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Spindle direction:</span>
                      <select
                        value={toolParams.spindleDirection}
                        onChange={(e) => setToolParams((p) => ({ ...p, spindleDirection: e.target.value }))}
                        style={WHITE_INPUT}
                      >
                        <option value="CW">CW</option>
                        <option value="CCW">CCW</option>
                        <option value="Off">Off</option>
                      </select>
                    </div>

                    {/* Feed rate <-> Spindle speed */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Feed rate:</span>
                      <input type="number" step="1" value={toolParams.feedRate} onChange={(e) => updateFeed(e.target.value)} style={CLASSIC_YELLOW} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Spindle speed:</span>
                      <input type="number" step="50" value={toolParams.spindleSpeed} onChange={(e) => updateRpm(e.target.value)} style={CLASSIC_YELLOW} />
                    </div>

                    {/* FPT <-> CS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>FPT:</span>
                      <input type="number" step="0.0005" value={toolParams.fpt} onChange={(e) => updateFpt(e.target.value)} style={CLASSIC_YELLOW} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>CS:</span>
                      <input type="number" step="0.1" value={toolParams.cs} onChange={(e) => updateCs(e.target.value)} style={CLASSIC_YELLOW} />
                    </div>

                    {/* Plunge rate & Retract rate */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Plunge rate:</span>
                      <input type="number" step="5" value={toolParams.plungeRate} onChange={(e) => setToolParams((p) => ({ ...p, plungeRate: Number(e.target.value) }))} style={CLASSIC_YELLOW} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '92px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <span style={{ textAlign: 'right' }}>Retract rate:</span>
                      <input type="number" step="5" value={toolParams.retractRate} onChange={(e) => setToolParams((p) => ({ ...p, retractRate: Number(e.target.value) }))} style={CLASSIC_YELLOW} />
                    </div>
                  </div>

                  {/* Force tool change / Rapid retract */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', paddingLeft: '80px', marginTop: '2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={toolParams.forceToolChange} onChange={(e) => setToolParams((p) => ({ ...p, forceToolChange: e.target.checked }))} />
                      <span>Force tool change</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={toolParams.rapidRetract} onChange={(e) => setToolParams((p) => ({ ...p, rapidRetract: e.target.checked }))} />
                      <span>Rapid retract</span>
                    </label>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '3px 0' }} />

                  {/* Comment box */}
                  <div>
                    <div style={{ fontSize: '11px', marginBottom: '2px', color: '#334155' }}>Comment</div>
                    <textarea
                      value={toolParams.comment}
                      onChange={(e) => setToolParams((p) => ({ ...p, comment: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                        border: '1px solid #9ca3af',
                        background: '#ffffff',
                        padding: '4px 6px',
                        fontSize: '11px',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom 2-Row Machine Buttons Strip (Dynamic per 3X / 4X / 5X / Mill-Turn) */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'grid', gridTemplateColumns: '125px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '6px 10px', alignItems: 'center', fontSize: '11.5px' }}>
                <button
                  type="button"
                  disabled={!caps.hasAxisCombos}
                  onClick={() => setActiveSubDialog('axis_combos')}
                  style={{ ...MC_BUTTON, width: '100%', opacity: caps.hasAxisCombos ? 1 : 0.45, cursor: caps.hasAxisCombos ? 'pointer' : 'not-allowed' }}
                  title={caps.hasAxisCombos ? `Configure axis combos for ${caps.machineName}` : 'Disabled on 3-Axis machine'}
                >
                  Axis Combo&apos;s
                </button>
                <div style={{ gridColumn: '2 / 4' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  <input type="checkbox" checked={machineParams.toolDisplayEnabled} onChange={(e) => setMachineParams((p) => ({ ...p, toolDisplayEnabled: e.target.checked }))} />
                  <button type="button" onClick={() => setActiveSubDialog('tool_display')} style={{ ...MC_BUTTON, flex: 1, minWidth: 0 }}>
                    Tool display...
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  <input type="checkbox" checked={machineParams.refPointEnabled} onChange={(e) => setMachineParams((p) => ({ ...p, refPointEnabled: e.target.checked }))} />
                  <button
                    type="button"
                    disabled={!machineParams.refPointEnabled}
                    onClick={() => setActiveSubDialog('ref_point')}
                    style={{ ...MC_BUTTON, flex: 1, minWidth: 0, opacity: machineParams.refPointEnabled ? 1 : 0.5 }}
                  >
                    Ref point...
                  </button>
                </div>

                {/* Second Row */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={machineParams.toBatch} onChange={(e) => setMachineParams((p) => ({ ...p, toBatch: e.target.checked }))} />
                  <span>To batch</span>
                </label>
                <button type="button" onClick={() => setActiveSubDialog('home_pos')} style={{ ...MC_BUTTON, width: '100%' }}>
                  Home pos...
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                  <input
                    type="checkbox"
                    disabled={!caps.hasRotaryAxis}
                    checked={caps.hasRotaryAxis && machineParams.rotaryAxisEnabled}
                    onChange={(e) => setMachineParams((p) => ({ ...p, rotaryAxisEnabled: e.target.checked }))}
                  />
                  <button
                    type="button"
                    disabled={!caps.hasRotaryAxis}
                    onClick={() => setActiveSubDialog('rotary_axis')}
                    style={{ ...MC_BUTTON, flex: 1, minWidth: 0, opacity: caps.hasRotaryAxis ? 1 : 0.45, cursor: caps.hasRotaryAxis ? 'pointer' : 'not-allowed' }}
                  >
                    Rotary axis...
                  </button>
                </div>
                <button type="button" onClick={() => setActiveSubDialog('planes')} style={{ ...MC_BUTTON, width: '100%' }}>
                  Planes...
                </button>
                <button type="button" onClick={() => setActiveSubDialog('canned_text')} style={{ ...MC_BUTTON, width: '100%' }}>
                  Canned text...
                </button>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: SURFACE PARAMETERS (IMAGE 4 VERBATIM) ==================== */}
          {activeTab === 'surface_params' && (
            <div style={{ display: 'grid', gridTemplateColumns: '215px minmax(0, 1fr) 265px', gap: '10px', alignItems: 'start', minWidth: 0 }}>
              {/* Column 1: Schematic SVG + Regen button */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <SurfaceHeightsSchematicSvg
                  clearanceEnabled={surfaceParams.clearanceEnabled}
                  retractEnabled={surfaceParams.retractEnabled}
                  topOfStockEnabled={surfaceParams.topOfStockEnabled}
                  spindleTaper={caps.spindleTaper}
                />
                <button
                  type="button"
                  onClick={() => onNotify?.('Previewing Z clearance, retract & feed planes against active drive surfaces.', 'info')}
                  style={{ ...MC_BUTTON, width: '90px', marginTop: '10px' }}
                >
                  Regen...
                </button>
              </div>

              {/* Column 2: 4 Rigid Datum Bands Aligned to SVG Leader Lines (y=22, 112, 170, 222) + Direction */}
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11.5px', minWidth: 0 }}>
                {/* Band 1 (0..92px): Clearance center @ ~22.5px */}
                <div style={{ height: '92px', boxSizing: 'border-box', paddingTop: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={surfaceParams.clearanceEnabled}
                      onChange={(e) => setSurfaceParams((p) => ({ ...p, clearanceEnabled: e.target.checked }))}
                    />
                    <button
                      type="button"
                      disabled={!surfaceParams.clearanceEnabled}
                      onClick={() => setSurfaceParams((p) => ({ ...p, clearanceEnabled: true }))}
                      style={{ ...MC_BUTTON, width: '82px', opacity: surfaceParams.clearanceEnabled ? 1 : 0.6 }}
                    >
                      Clearance...
                    </button>
                    <input
                      type="number"
                      step="1"
                      disabled={!surfaceParams.clearanceEnabled}
                      value={surfaceParams.clearance}
                      onChange={(e) => setSurfaceParams((p) => ({ ...p, clearance: Number(e.target.value) }))}
                      style={{ ...(surfaceParams.clearanceEnabled ? CLASSIC_YELLOW : DISABLED_GRAY), width: '64px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '20px', opacity: surfaceParams.clearanceEnabled ? 1 : 0.6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" disabled={!surfaceParams.clearanceEnabled} checked={surfaceParams.clearanceMode === 'abs'} onChange={() => setSurfaceParams((p) => ({ ...p, clearanceMode: 'abs' }))} />
                      <span>Absolute</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" disabled={!surfaceParams.clearanceEnabled} checked={surfaceParams.clearanceMode === 'inc'} onChange={() => setSurfaceParams((p) => ({ ...p, clearanceMode: 'inc' }))} />
                      <span>Incremental</span>
                    </label>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', paddingLeft: '20px', fontSize: '11px', color: surfaceParams.clearanceEnabled ? '#0f172a' : '#64748b', lineHeight: 1.2 }}>
                    <input type="checkbox" disabled={!surfaceParams.clearanceEnabled} checked={surfaceParams.useClearanceStartEndOnly} onChange={(e) => setSurfaceParams((p) => ({ ...p, useClearanceStartEndOnly: e.target.checked }))} />
                    <span>Use clearance only at the start and end of operation</span>
                  </label>
                </div>

                {/* Band 2 (92..150px): Retract center @ 92 + 8 + 11.5 = 111.5px */}
                <div style={{ height: '58px', boxSizing: 'border-box', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="checkbox" checked={surfaceParams.retractEnabled} onChange={(e) => setSurfaceParams((p) => ({ ...p, retractEnabled: e.target.checked }))} />
                    <button type="button" disabled={!surfaceParams.retractEnabled} style={{ ...MC_BUTTON, width: '82px', opacity: surfaceParams.retractEnabled ? 1 : 0.6 }}>
                      Retract...
                    </button>
                    <input
                      type="number"
                      step="1"
                      disabled={!surfaceParams.retractEnabled}
                      value={surfaceParams.retract}
                      onChange={(e) => setSurfaceParams((p) => ({ ...p, retract: Number(e.target.value) }))}
                      style={{ ...(surfaceParams.retractEnabled ? CLASSIC_YELLOW : DISABLED_GRAY), width: '64px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" checked={surfaceParams.retractMode === 'abs'} onChange={() => setSurfaceParams((p) => ({ ...p, retractMode: 'abs' }))} />
                      <span>Absolute</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" checked={surfaceParams.retractMode === 'inc'} onChange={() => setSurfaceParams((p) => ({ ...p, retractMode: 'inc' }))} />
                      <span>Incremental</span>
                    </label>
                  </div>
                </div>

                {/* Band 3 (150..208px): Feed plane center @ 150 + 8 + 11.5 = 169.5px */}
                <div style={{ height: '58px', boxSizing: 'border-box', paddingTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button type="button" style={{ ...MC_BUTTON, width: '82px' }}>Feed plane...</button>
                    <input
                      type="number"
                      step="0.5"
                      value={surfaceParams.feedPlane}
                      onChange={(e) => setSurfaceParams((p) => ({ ...p, feedPlane: Number(e.target.value) }))}
                      style={{ ...CLASSIC_YELLOW, width: '64px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" checked={surfaceParams.feedPlaneMode === 'abs'} onChange={() => setSurfaceParams((p) => ({ ...p, feedPlaneMode: 'abs' }))} />
                      <span>Absolute</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" checked={surfaceParams.feedPlaneMode === 'inc'} onChange={() => setSurfaceParams((p) => ({ ...p, feedPlaneMode: 'inc' }))} />
                      <span>Incremental</span>
                    </label>
                  </div>
                </div>

                {/* Band 4 (208..275px): Top of stock center @ 208 + 3 + 11.5 = 222.5px */}
                <div style={{ height: '67px', boxSizing: 'border-box', paddingTop: '3px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="checkbox" checked={surfaceParams.topOfStockEnabled} onChange={(e) => setSurfaceParams((p) => ({ ...p, topOfStockEnabled: e.target.checked }))} />
                    <button type="button" disabled={!surfaceParams.topOfStockEnabled} style={{ ...MC_BUTTON, width: '82px', opacity: surfaceParams.topOfStockEnabled ? 1 : 0.6 }}>
                      Top of stock...
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!surfaceParams.topOfStockEnabled}
                      value={surfaceParams.topOfStock}
                      onChange={(e) => setSurfaceParams((p) => ({ ...p, topOfStock: Number(e.target.value) }))}
                      style={{ ...(surfaceParams.topOfStockEnabled ? CLASSIC_YELLOW : DISABLED_GRAY), width: '64px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '20px', opacity: surfaceParams.topOfStockEnabled ? 1 : 0.6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" disabled={!surfaceParams.topOfStockEnabled} checked={surfaceParams.topOfStockMode === 'abs'} onChange={() => setSurfaceParams((p) => ({ ...p, topOfStockMode: 'abs' }))} />
                      <span>Absolute</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input type="radio" disabled={!surfaceParams.topOfStockEnabled} checked={surfaceParams.topOfStockMode === 'inc'} onChange={() => setSurfaceParams((p) => ({ ...p, topOfStockMode: 'inc' }))} />
                      <span>Incremental</span>
                    </label>
                  </div>
                </div>

                {/* Bottom Direction Toggle aligned across from Regen... */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                  <input type="checkbox" checked={surfaceParams.directionEnabled} onChange={(e) => setSurfaceParams((p) => ({ ...p, directionEnabled: e.target.checked }))} />
                  <button
                    type="button"
                    disabled={!surfaceParams.directionEnabled}
                    onClick={() => setActiveSubDialog('direction_vector')}
                    style={{ ...MC_BUTTON, width: '82px', opacity: surfaceParams.directionEnabled ? 1 : 0.55 }}
                  >
                    Direction...
                  </button>
                </div>
              </div>

              {/* Column 3: Tip Comp + Surface Pointer + Stock to Leave + Tool Containment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span>Tip comp</span>
                  <select
                    value={surfaceParams.tipComp}
                    onChange={(e) => setSurfaceParams((p) => ({ ...p, tipComp: e.target.value }))}
                    style={{ width: '92px', height: '22px', border: '1px solid #9ca3af', background: '#ffffff', fontSize: '11.5px', boxSizing: 'border-box' }}
                  >
                    <option value="tip">Tip</option>
                    <option value="center">Center</option>
                  </select>
                  <TipCompDiagramSvg tipComp={surfaceParams.tipComp} />
                </div>

                {/* Pointer Button to Choose Drive/Check Surfaces */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isFlowline && onOpenSurfaceSelection) {
                        onOpenSurfaceSelection();
                      } else {
                        setActiveSubDialog('select_surfaces');
                      }
                    }}
                    style={{ ...MC_BUTTON, width: '58px', height: '24px' }}
                    title="Select Drive / Check Surfaces"
                  >
                    <MousePointer size={13} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '126px minmax(0, 1fr) 26px', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ lineHeight: 1.2 }}>Stock to leave on drive</span>
                  <input
                    type="number"
                    step="0.05"
                    value={surfaceParams.stockToLeaveDrive}
                    onChange={(e) => setSurfaceParams((p) => ({ ...p, stockToLeaveDrive: Number(e.target.value) }))}
                    style={CLASSIC_YELLOW}
                  />
                  <span style={{ textAlign: 'right' }}>
                    ({isFlowline ? (flowlineSelection?.driveFaceIds?.length ?? operation?.driveFaceIds?.length ?? selectedSurfaceIds.length) : selectedSurfaceIds.length})
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '126px minmax(0, 1fr) 26px', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                  <span style={{ lineHeight: 1.2 }}>Stock to leave on check</span>
                  <input
                    type="number"
                    step="0.05"
                    value={surfaceParams.stockToLeaveCheck}
                    onChange={(e) => setSurfaceParams((p) => ({ ...p, stockToLeaveCheck: Number(e.target.value) }))}
                    style={CLASSIC_YELLOW}
                  />
                  <span style={{ textAlign: 'right' }}>
                    ({isFlowline ? (flowlineSelection?.checkFaceIds?.length ?? operation?.checkFaceIds?.length ?? 0) : 0})
                  </span>
                </div>

                {/* Tool Containment Box */}
                <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px 10px', marginTop: '4px', minWidth: 0, boxSizing: 'border-box' }}>
                  <legend style={{ fontSize: '11px', color: '#0f172a', padding: '0 4px' }}>Tool containment</legend>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                    <span>Compensate to:</span>
                    <span>({isFlowline ? (flowlineSelection?.containmentIds?.length ?? operation?.containmentIds?.length ?? 0) : 0})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    {[
                      { id: 'inside', label: 'Inside' },
                      { id: 'center', label: 'Center' },
                      { id: 'outside', label: 'Outside' }
                    ].map((opt) => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="tool_containment"
                          checked={surfaceParams.containmentMode === opt.id}
                          onChange={() => setSurfaceParams((p) => ({ ...p, containmentMode: opt.id }))}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: surfaceParams.additionalOffsetEnabled ? '#0f172a' : '#64748b', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={surfaceParams.additionalOffsetEnabled}
                        onChange={(e) => setSurfaceParams((p) => ({ ...p, additionalOffsetEnabled: e.target.checked }))}
                      />
                      <span>Additional offset</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      disabled={!surfaceParams.additionalOffsetEnabled}
                      value={surfaceParams.additionalOffset}
                      onChange={(e) => setSurfaceParams((p) => ({ ...p, additionalOffset: Number(e.target.value) }))}
                      style={{ ...(surfaceParams.additionalOffsetEnabled ? CLASSIC_YELLOW : DISABLED_GRAY), maxWidth: '72px', justifySelf: 'end' }}
                    />
                  </div>
                </fieldset>
              </div>
            </div>
          )}

          {/* ==================== TAB 3A: FINISH CONTOUR PARAMETERS (IMAGE 5 VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && !isPocket && !isFlowline && !isParallel && !isParallelSteep && !isPencil && !isRadial && !isProject && !isLeftover && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '246px minmax(0, 1fr)', gap: '16px', alignItems: 'start', minWidth: 0 }}>
                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <button type="button" onClick={() => setActiveSubDialog('total_tolerance')} style={{ ...MC_BUTTON, width: '100%', borderColor: '#3b82f6' }}>
                      Total tolerance...
                    </button>
                    <input
                      type="number"
                      step="0.005"
                      value={contourParams.totalTolerance}
                      onChange={(e) => setContourParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span>Maximum stepdown</span>
                    <input
                      type="number"
                      step="0.05"
                      value={contourParams.maxStepdown}
                      onChange={(e) => setContourParams((p) => ({ ...p, maxStepdown: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', cursor: 'pointer', paddingLeft: '6px' }}>
                    <input
                      type="checkbox"
                      checked={contourParams.detectUndercuts}
                      onChange={(e) => setContourParams((p) => ({ ...p, detectUndercuts: e.target.checked }))}
                    />
                    <span>Detect undercuts</span>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span>Corner rounding radius</span>
                    <input
                      type="number"
                      step="0.5"
                      value={contourParams.cornerRoundingRadius}
                      onChange={(e) => setContourParams((p) => ({ ...p, cornerRoundingRadius: Number(e.target.value) }))}
                      style={WHITE_INPUT}
                    />
                  </div>

                  {/* Entry/exit arc/line group */}
                  <div style={{ border: '1px solid #cbd5e1', padding: '7px 8px', marginTop: '2px', boxSizing: 'border-box', minWidth: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, marginBottom: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={contourParams.entryExitArcEnabled}
                        onChange={(e) => setContourParams((p) => ({ ...p, entryExitArcEnabled: e.target.checked }))}
                      />
                      <span>Entry/exit arc/line</span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: contourParams.entryExitArcEnabled ? 1 : 0.6, minWidth: 0 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span>Arc radius:</span>
                        <input
                          type="number"
                          step="0.5"
                          disabled={!contourParams.entryExitArcEnabled}
                          value={contourParams.arcRadius}
                          onChange={(e) => setContourParams((p) => ({ ...p, arcRadius: Number(e.target.value) }))}
                          style={contourParams.entryExitArcEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span>Arc sweep:</span>
                        <input
                          type="number"
                          step="5"
                          disabled={!contourParams.entryExitArcEnabled}
                          value={contourParams.arcSweep}
                          onChange={(e) => setContourParams((p) => ({ ...p, arcSweep: Number(e.target.value) }))}
                          style={contourParams.entryExitArcEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '112px minmax(0, 1fr)', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span>Line length:</span>
                        <input
                          type="number"
                          step="0.5"
                          disabled={!contourParams.entryExitArcEnabled}
                          value={contourParams.lineLength}
                          onChange={(e) => setContourParams((p) => ({ ...p, lineLength: Number(e.target.value) }))}
                          style={contourParams.entryExitArcEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                        />
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', cursor: 'pointer', marginTop: '2px' }}>
                        <input
                          type="checkbox"
                          disabled={!contourParams.entryExitArcEnabled}
                          checked={contourParams.allowOutsideBoundary}
                          onChange={(e) => setContourParams((p) => ({ ...p, allowOutsideBoundary: e.target.checked }))}
                        />
                        <span>Allow arc/line outside boundary</span>
                      </label>
                    </div>
                  </div>

                  {/* Lower Ordering Checkboxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={contourParams.useApproxStartPoint} onChange={(e) => setContourParams((p) => ({ ...p, useApproxStartPoint: e.target.checked }))} />
                      <span>Use approximate start point</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={contourParams.optimizeCutOrder} onChange={(e) => setContourParams((p) => ({ ...p, optimizeCutOrder: e.target.checked }))} />
                      <span>Optimize cut order</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#475569' }}>
                      <input type="checkbox" checked={contourParams.minimizeBurial} onChange={(e) => setContourParams((p) => ({ ...p, minimizeBurial: e.target.checked }))} />
                      <span>Minimize burial</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={contourParams.orderBottomToTop} onChange={(e) => setContourParams((p) => ({ ...p, orderBottomToTop: e.target.checked }))} />
                      <span>Order cuts bottom to top</span>
                    </label>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                  {/* Direction of closed contours + Direction of open contours */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: '10px', minWidth: 0 }}>
                    <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px 10px', minWidth: 0, boxSizing: 'border-box' }}>
                      <legend style={{ fontSize: '11px', padding: '0 4px' }}>Direction of closed contours</legend>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input type="radio" checked={contourParams.direction === 'climb'} onChange={() => setContourParams((p) => ({ ...p, direction: 'climb' }))} />
                          <span>Climb</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input type="radio" checked={contourParams.direction === 'conventional'} onChange={() => setContourParams((p) => ({ ...p, direction: 'conventional' }))} />
                          <span>Conventional</span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span>Start length</span>
                        <input
                          type="number"
                          step="0.5"
                          value={contourParams.startLength}
                          onChange={(e) => setContourParams((p) => ({ ...p, startLength: Number(e.target.value) }))}
                          style={{ ...CLASSIC_YELLOW, width: '68px' }}
                        />
                      </div>
                    </fieldset>

                    <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px 10px', minWidth: 0, boxSizing: 'border-box' }}>
                      <legend style={{ fontSize: '11px', padding: '0 4px' }}>Direction of open contours</legend>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input type="radio" checked={contourParams.openContourDirection === 'one_way'} onChange={() => setContourParams((p) => ({ ...p, openContourDirection: 'one_way' }))} />
                          <span>One way</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input type="radio" checked={contourParams.openContourDirection === 'zigzag'} onChange={() => setContourParams((p) => ({ ...p, openContourDirection: 'zigzag' }))} />
                          <span>Zigzag</span>
                        </label>
                      </div>
                    </fieldset>
                  </div>

                  {/* Transition Box with 4 SVG Tiles */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px 10px', minWidth: 0, boxSizing: 'border-box' }}>
                    <legend style={{ fontSize: '11px', padding: '0 4px' }}>Transition</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px', minWidth: 0 }}>
                      {[
                        { id: 'high_speed', label: 'High speed' },
                        { id: 'broken', label: 'Broken' },
                        { id: 'ramp', label: 'Ramp' },
                        { id: 'follow_surface', label: 'Follow surface' }
                      ].map((tr) => (
                        <div
                          key={tr.id}
                          onClick={() => setContourParams((p) => ({ ...p, transitionType: tr.id }))}
                          style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            <input
                              type="radio"
                              checked={contourParams.transitionType === tr.id}
                              onChange={() => setContourParams((p) => ({ ...p, transitionType: tr.id }))}
                            />
                            <span>{tr.label}</span>
                          </label>
                          <TransitionTileSvg type={tr.id} />
                        </div>
                      ))}
                    </div>
                  </fieldset>

                  {/* Loop length & Ramp length */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: contourParams.transitionType === 'high_speed' ? '#0f172a' : '#64748b' }}>Loop length</span>
                      <input
                        type="number"
                        step="0.5"
                        value={contourParams.loopLength}
                        onChange={(e) => setContourParams((p) => ({ ...p, loopLength: Number(e.target.value) }))}
                        style={{ ...(contourParams.transitionType === 'high_speed' ? CLASSIC_YELLOW : WHITE_INPUT), width: '74px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: contourParams.transitionType === 'ramp' ? '#0f172a' : '#64748b' }}>Ramp length</span>
                      <input
                        type="number"
                        step="0.5"
                        value={contourParams.rampLength}
                        onChange={(e) => setContourParams((p) => ({ ...p, rampLength: Number(e.target.value) }))}
                        style={{ ...(contourParams.transitionType === 'ramp' ? CLASSIC_YELLOW : WHITE_INPUT), width: '74px' }}
                      />
                    </div>
                  </div>

                  {/* Helix... / Shallow... / Flats... Checkboxes + Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <input type="checkbox" checked={contourParams.helixEnabled} onChange={(e) => setContourParams((p) => ({ ...p, helixEnabled: e.target.checked }))} />
                      <button type="button" onClick={() => setActiveSubDialog('helix')} style={{ ...MC_BUTTON, flex: 1, minWidth: 0, opacity: contourParams.helixEnabled ? 1 : 0.65 }}>
                        Helix...
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <input type="checkbox" checked={contourParams.shallowEnabled} onChange={(e) => setContourParams((p) => ({ ...p, shallowEnabled: e.target.checked }))} />
                      <button type="button" onClick={() => setActiveSubDialog('shallow')} style={{ ...MC_BUTTON, flex: 1, minWidth: 0, opacity: contourParams.shallowEnabled ? 1 : 0.65, borderColor: isShallow ? '#10b981' : undefined, fontWeight: isShallow ? 600 : 400 }}>
                        Shallow... ({contourParams.shallowFromSlope}°–{contourParams.shallowToSlope}°)
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <input type="checkbox" checked={contourParams.flatsEnabled} onChange={(e) => setContourParams((p) => ({ ...p, flatsEnabled: e.target.checked }))} />
                      <button type="button" onClick={() => setActiveSubDialog('flats')} style={{ ...MC_BUTTON, flex: 1, minWidth: 0, opacity: contourParams.flatsEnabled ? 1 : 0.65 }}>
                        Flats...
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Spiral + Limit | Cut depths... | Gap settings... | Advanced settings... */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'nowrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={contourParams.spiralEnabled} onChange={(e) => setContourParams((p) => ({ ...p, spiralEnabled: e.target.checked }))} />
                      <span>Spiral</span>
                    </label>
                    <span style={{ color: contourParams.spiralEnabled ? '#0f172a' : '#64748b' }}>Limit</span>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!contourParams.spiralEnabled}
                      value={contourParams.spiralLimit}
                      onChange={(e) => setContourParams((p) => ({ ...p, spiralLimit: Number(e.target.value) }))}
                      style={{ ...(contourParams.spiralEnabled ? CLASSIC_YELLOW : DISABLED_GRAY), width: '54px' }}
                    />
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={() => setActiveSubDialog('cut_depths')} style={MC_BUTTON}>Cut depths...</button>
                    <button type="button" onClick={() => setActiveSubDialog('gap_settings')} style={MC_BUTTON}>Gap settings...</button>
                    <button type="button" onClick={() => setActiveSubDialog('advanced_settings')} style={MC_BUTTON}>Advanced settings...</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3D: FINISH PARALLEL PARAMETERS (MASTERCAM VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && isParallel && !isParallelSteep && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr)', gap: '16px', alignItems: 'start', minWidth: 0 }}>
                {/* LEFT COLUMN: Tolerances, Stepover, Angle, Scallop */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
                  {/* Total tolerance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <button type="button" onClick={() => setActiveSubDialog('total_tolerance')} style={{ ...MC_BUTTON, width: '100%', borderColor: '#3b82f6' }}>
                      Total tolerance...
                    </button>
                    <input
                      type="number"
                      step="0.005"
                      value={contourParams.totalTolerance ?? 0.025}
                      onChange={(e) => setContourParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Maximum stepover */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>Maximum stepover</span>
                    <input
                      type="number"
                      step="0.05"
                      value={contourParams.maxStepdown ?? 0.5}
                      onChange={(e) => setContourParams((p) => ({ ...p, maxStepdown: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Scallop Height (computed) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ color: '#64748b' }}>Scallop height</span>
                    <div style={{ ...CLASSIC_YELLOW, background: '#f8fafc', color: '#0369a1', display: 'flex', alignItems: 'center', fontWeight: 600, padding: '0 6px' }}>
                      {(() => {
                        const r = Math.max(0.5, (Number(toolParams.toolDiameter) || 6) / 2);
                        const s = Math.max(0.01, Number(contourParams.maxStepdown) || 0.5);
                        const scallop = r - Math.sqrt(Math.max(0, r * r - (s / 2) * (s / 2)));
                        return `${(scallop || 0.005).toFixed(4)} mm`;
                      })()}
                    </div>
                  </div>

                  {/* Machining Angle */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '4px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Machining Angle</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span>Cut Angle (deg)</span>
                      <input
                        type="number"
                        step="5"
                        value={contourParams.machiningAngle ?? 90.0}
                        onChange={(e) => setContourParams((p) => ({ ...p, machiningAngle: Number(e.target.value) }))}
                        style={CLASSIC_YELLOW}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      {[
                        { label: '0° (X-axis)', angle: 0 },
                        { label: '90° (Y-axis)', angle: 90 },
                        { label: '45° (Diag)', angle: 45 }
                      ].map((btn) => {
                        const isSelected = Number(contourParams.machiningAngle) === btn.angle;
                        return (
                          <button
                            key={btn.angle}
                            type="button"
                            onClick={() => setContourParams((p) => ({ ...p, machiningAngle: btn.angle }))}
                            style={{
                              ...MC_BUTTON,
                              background: isSelected ? '#e0f2fe' : '#ffffff',
                              borderColor: isSelected ? '#0284c7' : '#9ca3af',
                              color: isSelected ? '#0369a1' : '#0f172a',
                              fontWeight: isSelected ? 600 : 400,
                              padding: '3px 2px',
                              fontSize: '10.5px'
                            }}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Direction */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '2px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Machining Direction</legend>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['climb', 'conventional'].map((dir) => (
                        <label key={dir} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textTransform: 'capitalize' }}>
                          <input
                            type="radio"
                            name="parallelDirection"
                            checked={(contourParams.direction || 'climb') === dir}
                            onChange={() => setContourParams((p) => ({ ...p, direction: dir }))}
                          />
                          {dir}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* RIGHT COLUMN: Cutting Method & Visual Graphic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                  {/* Cutting Method */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Cutting Method</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'zigzag', label: 'Zigzag (Bi-dir)', desc: 'Continuous forward & back' },
                        { id: 'one_way', label: 'One Way', desc: 'Single direction + retract' },
                        { id: 'spiral', label: 'Spiral', desc: 'Inward / outward raster' }
                      ].map((m) => {
                        const active = (contourParams.openContourDirection || 'zigzag') === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setContourParams((p) => ({ ...p, openContourDirection: m.id }))}
                            style={{
                              border: active ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              background: active ? '#f0f9ff' : '#ffffff',
                              padding: '8px 6px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: active ? 600 : 500, color: active ? '#0369a1' : '#1e293b', fontSize: '11px' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>{m.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Mastercam Schematic Graphic */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Parallel Raster Topology (Angle: {contourParams.machiningAngle ?? 90}°, Stepover: {contourParams.maxStepdown ?? 0.5}mm)
                    </div>
                    <svg width="280" height="90" viewBox="0 0 280 90">
                      {/* 3D Arch Mesh Wireframe */}
                      <path d="M 20 70 Q 140 10 260 70" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
                      <path d="M 20 85 Q 140 25 260 85" fill="none" stroke="#64748b" strokeWidth="2" />
                      <line x1="20" y1="70" x2="20" y2="85" stroke="#64748b" strokeWidth="1.5" />
                      <line x1="260" y1="70" x2="260" y2="85" stroke="#64748b" strokeWidth="1.5" />
                      {/* Parallel Toolpath Raster Passes */}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                        const xOff = 30 + i * 35;
                        const yArch = 75 - Math.sin(((xOff - 20) / 240) * Math.PI) * 55;
                        return (
                          <g key={i}>
                            <line x1={xOff} y1={yArch - 12} x2={xOff} y2={yArch} stroke="#10b981" strokeWidth="2" />
                            <circle cx={xOff} cy={yArch} r="3" fill="#059669" />
                            {i < 6 && (contourParams.openContourDirection !== 'one_way') && (
                              <path d={`M ${xOff} ${yArch - 12} Q ${xOff + 17.5} ${yArch - 18} ${xOff + 35} ${yArch - 12}`} fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />
                            )}
                          </g>
                        );
                      })}
                      <text x="140" y="85" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="600">Drive Surface Normal Contact</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3F: FINISH PARALLEL STEEP PARAMETERS (MASTERCAM VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && isParallelSteep && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr)', gap: '16px', alignItems: 'start', minWidth: 0 }}>
                {/* LEFT COLUMN: Tolerances, Stepover, Stepdown, Angle, Slope Limits, Scallop */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
                  {/* Total tolerance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <button type="button" onClick={() => setActiveSubDialog('total_tolerance')} style={{ ...MC_BUTTON, width: '100%', borderColor: '#3b82f6' }}>
                      Total tolerance...
                    </button>
                    <input
                      type="number"
                      step="0.005"
                      value={contourParams.totalTolerance ?? 0.025}
                      onChange={(e) => setContourParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Maximum stepover */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>Maximum stepover</span>
                    <input
                      type="number"
                      step="0.05"
                      value={contourParams.maxStepdown ?? 0.5}
                      onChange={(e) => setContourParams((p) => ({ ...p, maxStepdown: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Scallop Height (computed on steep slope) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ color: '#64748b' }}>Scallop height</span>
                    <div style={{ ...CLASSIC_YELLOW, background: '#f8fafc', color: '#be185d', display: 'flex', alignItems: 'center', fontWeight: 600, padding: '0 6px' }}>
                      {(() => {
                        const r = Math.max(0.5, (Number(toolParams.toolDiameter) || 6) / 2);
                        const s = Math.max(0.01, Number(contourParams.maxStepdown) || 0.5);
                        const scallop = r - Math.sqrt(Math.max(0, r * r - (s / 2) * (s / 2)));
                        return `${(scallop || 0.005).toFixed(4)} mm`;
                      })()}
                    </div>
                  </div>

                  {/* Steep Slope Angle Limits */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '2px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Steep Slope Limits (Mastercam)</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span>From slope (deg)</span>
                      <input
                        type="number"
                        step="1"
                        value={contourParams.steepFromSlope ?? 35.0}
                        onChange={(e) => setContourParams((p) => ({ ...p, steepFromSlope: Number(e.target.value) }))}
                        style={CLASSIC_YELLOW}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span>To slope (deg)</span>
                      <input
                        type="number"
                        step="1"
                        value={contourParams.steepToSlope ?? 90.0}
                        onChange={(e) => setContourParams((p) => ({ ...p, steepToSlope: Number(e.target.value) }))}
                        style={CLASSIC_YELLOW}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '6px' }}>
                      {[
                        { label: '35°–90°', from: 35, to: 90 },
                        { label: '45°–90°', from: 45, to: 90 },
                        { label: '60°–90°', from: 60, to: 90 }
                      ].map((preset) => {
                        const isSelected = Number(contourParams.steepFromSlope) === preset.from && Number(contourParams.steepToSlope) === preset.to;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setContourParams((p) => ({ ...p, steepFromSlope: preset.from, steepToSlope: preset.to }))}
                            style={{
                              ...MC_BUTTON,
                              background: isSelected ? '#fdf2f8' : '#ffffff',
                              borderColor: isSelected ? '#db2777' : '#9ca3af',
                              color: isSelected ? '#9d174d' : '#0f172a',
                              fontWeight: isSelected ? 600 : 400,
                              padding: '2px 2px',
                              fontSize: '10.5px'
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSubDialog('steep')}
                      style={{ ...MC_BUTTON, width: '100%', borderColor: '#db2777', color: '#9d174d', fontWeight: 600 }}
                    >
                      Steep limits... ({contourParams.steepFromSlope ?? 35}°–{contourParams.steepToSlope ?? 90}°)
                    </button>
                  </fieldset>

                  {/* Machining Angle */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '2px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Machining Angle</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span>Cut Angle (deg)</span>
                      <input
                        type="number"
                        step="5"
                        value={contourParams.machiningAngle ?? 90.0}
                        onChange={(e) => setContourParams((p) => ({ ...p, machiningAngle: Number(e.target.value) }))}
                        style={CLASSIC_YELLOW}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      {[
                        { label: '0° (X-axis)', angle: 0 },
                        { label: '90° (Y-axis)', angle: 90 },
                        { label: '45° (Diag)', angle: 45 }
                      ].map((btn) => {
                        const isSelected = Number(contourParams.machiningAngle) === btn.angle;
                        return (
                          <button
                            key={btn.angle}
                            type="button"
                            onClick={() => setContourParams((p) => ({ ...p, machiningAngle: btn.angle }))}
                            style={{
                              ...MC_BUTTON,
                              background: isSelected ? '#fdf2f8' : '#ffffff',
                              borderColor: isSelected ? '#db2777' : '#9ca3af',
                              color: isSelected ? '#9d174d' : '#0f172a',
                              fontWeight: isSelected ? 600 : 400,
                              padding: '3px 2px',
                              fontSize: '10.5px'
                            }}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Direction */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '2px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Machining Direction</legend>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['climb', 'conventional'].map((dir) => (
                        <label key={dir} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textTransform: 'capitalize' }}>
                          <input
                            type="radio"
                            name="parallelSteepDirection"
                            checked={(contourParams.direction || 'climb') === dir}
                            onChange={() => setContourParams((p) => ({ ...p, direction: dir }))}
                          />
                          {dir}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* RIGHT COLUMN: Cutting Method, Action buttons, & Parallel Steep Graphic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                  {/* Cutting Method */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Cutting Method</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'zigzag', label: 'Zigzag (Bi-dir)', desc: 'Continuous forward & back on steep walls' },
                        { id: 'one_way', label: 'One Way', desc: 'Single direction + safe air retract' },
                        { id: 'spiral', label: 'Spiral', desc: 'Inward / outward steep raster' }
                      ].map((m) => {
                        const active = (contourParams.openContourDirection || 'zigzag') === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setContourParams((p) => ({ ...p, openContourDirection: m.id }))}
                            style={{
                              border: active ? '2px solid #be185d' : '1px solid #cbd5e1',
                              background: active ? '#fdf2f8' : '#ffffff',
                              padding: '8px 6px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: active ? 600 : 500, color: active ? '#9d174d' : '#1e293b', fontSize: '11px' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>{m.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Mastercam Schematic Graphic: Parallel Steep */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Parallel Steep Topology (Steep Angle: {contourParams.steepFromSlope ?? 35}°–{contourParams.steepToSlope ?? 90}°, Angle: {contourParams.machiningAngle ?? 90}°)
                    </div>
                    <svg width="280" height="90" viewBox="0 0 280 90">
                      {/* Base surface: Flat floor + Steep walls */}
                      <path d="M 15 25 L 55 75 L 225 75 L 265 25" fill="none" stroke="#64748b" strokeWidth="2" />
                      {/* Excluded shallow floor (dashed gray) */}
                      <line x1="55" y1="75" x2="225" y2="75" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="4,3" />
                      <text x="140" y="86" textAnchor="middle" fontSize="8.5" fill="#94a3b8" fontStyle="italic">Shallow Zone (&lt; {contourParams.steepFromSlope ?? 35}° Excluded)</text>

                      {/* Steep Left Wall Toolpath Passes (green) */}
                      {[0, 1, 2, 3].map((i) => {
                        const t = (i + 0.5) / 4;
                        const x = 15 + t * 40;
                        const y = 25 + t * 50;
                        return (
                          <g key={`l-${i}`}>
                            <line x1={x - 6} y1={y - 8} x2={x} y2={y} stroke="#10b981" strokeWidth="2.5" />
                            <circle cx={x} cy={y} r="2.5" fill="#059669" />
                          </g>
                        );
                      })}

                      {/* Steep Right Wall Toolpath Passes (green) */}
                      {[0, 1, 2, 3].map((i) => {
                        const t = (i + 0.5) / 4;
                        const x = 225 + t * 40;
                        const y = 75 - t * 50;
                        return (
                          <g key={`r-${i}`}>
                            <line x1={x + 6} y1={y - 8} x2={x} y2={y} stroke="#10b981" strokeWidth="2.5" />
                            <circle cx={x} cy={y} r="2.5" fill="#059669" />
                          </g>
                        );
                      })}

                      {/* Rapid Link across shallow gap */}
                      <path d="M 50 68 Q 140 38 230 68" fill="none" stroke="#be185d" strokeWidth="1.5" strokeDasharray="3,3" />
                      <text x="140" y="44" textAnchor="middle" fontSize="8" fill="#be185d" fontWeight="600">Steep Wall Transition</text>
                      <text x="35" y="18" textAnchor="middle" fontSize="8.5" fill="#059669" fontWeight="600">Steep Wall ({contourParams.steepFromSlope ?? 35}°–90°)</text>
                      <text x="245" y="18" textAnchor="middle" fontSize="8.5" fill="#059669" fontWeight="600">Steep Wall ({contourParams.steepFromSlope ?? 35}°–90°)</text>
                    </svg>
                  </div>

                  {/* Action buttons row: Cut depths, Gap settings, Advanced settings */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: 'auto' }}>
                    <button type="button" onClick={() => setActiveSubDialog('cut_depths')} style={MC_BUTTON}>Cut depths...</button>
                    <button type="button" onClick={() => setActiveSubDialog('gap_settings')} style={MC_BUTTON}>Gap settings...</button>
                    <button type="button" onClick={() => setActiveSubDialog('advanced_settings')} style={MC_BUTTON}>Advanced settings...</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3E: FINISH PENCIL PARAMETERS (MASTERCAM VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && isPencil && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr)', gap: '16px', alignItems: 'start', minWidth: 0 }}>
                {/* LEFT COLUMN: Bi-tangency, Passes, Tolerances, Direction */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  {/* Total tolerance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <button type="button" onClick={() => setActiveSubDialog('total_tolerance')} style={{ ...MC_BUTTON, width: '100%', borderColor: '#3b82f6' }}>
                      Total tolerance...
                    </button>
                    <input
                      type="number"
                      step="0.005"
                      value={pencilParams.totalTolerance ?? 0.025}
                      onChange={(e) => setPencilParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Bi-tangency Corner Radius Limit */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>Bi-tangency radius</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="50"
                      value={pencilParams.biTangencyRadius ?? 3.0}
                      onChange={(e) => setPencilParams((p) => ({ ...p, biTangencyRadius: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Number of Passes (Single pass vs Multiple passes) */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '2px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Pass Distribution</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="pencilPassMode"
                          checked={Number(pencilParams.numberOfPasses) <= 1}
                          onChange={() => setPencilParams((p) => ({ ...p, numberOfPasses: 1 }))}
                        />
                        <span>Single pass (fillet centerline)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="pencilPassMode"
                          checked={Number(pencilParams.numberOfPasses) > 1}
                          onChange={() => setPencilParams((p) => ({ ...p, numberOfPasses: 3 }))}
                        />
                        <span>Multiple passes (offset cleanup)</span>
                      </label>
                    </div>

                    {Number(pencilParams.numberOfPasses) > 1 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr)', alignItems: 'center', gap: '6px', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                        <span>Passes count:</span>
                        <input
                          type="number"
                          min="2"
                          max="9"
                          step="1"
                          value={pencilParams.numberOfPasses ?? 3}
                          onChange={(e) => setPencilParams((p) => ({ ...p, numberOfPasses: Math.max(2, parseInt(e.target.value) || 3) }))}
                          style={CLASSIC_YELLOW}
                        />
                        <span>Stepover (mm):</span>
                        <input
                          type="number"
                          min="0.05"
                          max="5"
                          step="0.05"
                          value={pencilParams.stepover ?? 0.3}
                          onChange={(e) => setPencilParams((p) => ({ ...p, stepover: Number(e.target.value) }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                    )}
                  </fieldset>

                  {/* Machining Direction */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '2px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Machining Direction</legend>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      {['climb', 'conventional'].map((dir) => (
                        <label key={dir} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', textTransform: 'capitalize' }}>
                          <input
                            type="radio"
                            name="pencilDirection"
                            checked={(pencilParams.machiningDirection || 'climb') === dir}
                            onChange={() => setPencilParams((p) => ({ ...p, machiningDirection: dir }))}
                          />
                          {dir}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Cleanout Features */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', marginTop: '2px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Intersection Cleanout</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={pencilParams.traceFloorFillet !== false}
                          onChange={(e) => setPencilParams((p) => ({ ...p, traceFloorFillet: e.target.checked }))}
                        />
                        <span>Floor perimeter fillet seam</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={pencilParams.traceVerticalCorners !== false}
                          onChange={(e) => setPencilParams((p) => ({ ...p, traceVerticalCorners: e.target.checked }))}
                        />
                        <span>Vertical internal corner seams</span>
                      </label>
                    </div>
                  </fieldset>
                </div>

                {/* RIGHT COLUMN: Cutting Method & Mastercam Vector Graphic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                  {/* Cutting Method */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Cutting Method</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'Zigzag', label: 'Zigzag', desc: 'Forward and back continuous passes' },
                        { id: 'One-way', label: 'One-way', desc: 'Climb cut only with rapid reposition' }
                      ].map((item) => {
                        const isSel = (pencilParams.cuttingMethod || 'Zigzag').toLowerCase() === item.id.toLowerCase();
                        return (
                          <div
                            key={item.id}
                            onClick={() => setPencilParams((p) => ({ ...p, cuttingMethod: item.id }))}
                            style={{
                              border: isSel ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                              background: isSel ? '#fef3c7' : '#ffffff',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              borderRadius: '2px'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: isSel ? '#b45309' : '#0f172a' }}>{item.label}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{item.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Mastercam Bi-Tangency Fillet Vector Illustration */}
                  <div style={{ border: '1px solid #cbd5e1', background: '#ffffff', padding: '10px', borderRadius: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '8px', alignSelf: 'flex-start' }}>
                      Bi-Tangency Fillet Contact Locus
                    </div>
                    <svg width="280" height="130" viewBox="0 0 280 130" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      {/* Internal corner surface: vertical wall + fillet + floor */}
                      <path d="M 40 15 L 40 75 Q 40 105 70 105 L 240 105" fill="none" stroke="#64748b" strokeWidth="4" />
                      <path d="M 38 15 L 38 75 Q 38 107 70 107 L 240 107" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                      
                      {/* Ball nose cutter touching both surfaces (Bi-tangent position) */}
                      <circle cx="70" cy="75" r="30" fill="rgba(249, 115, 22, 0.15)" stroke="#ea580c" strokeWidth="2" />
                      <line x1="70" y1="45" x2="70" y2="10" stroke="#ea580c" strokeWidth="2" strokeDasharray="3,2" />
                      <line x1="60" y1="10" x2="80" y2="10" stroke="#ea580c" strokeWidth="2" />
                      
                      {/* Tangency contact points */}
                      <circle cx="40" cy="75" r="3" fill="#dc2626" />
                      <circle cx="70" cy="105" r="3" fill="#dc2626" />
                      
                      {/* Bi-tangent trajectory center point & line */}
                      <circle cx="70" cy="75" r="3" fill="#0284c7" />
                      <line x1="70" y1="75" x2="160" y2="75" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="4,3" />
                      
                      {/* Labels */}
                      <text x="45" y="65" fontSize="9" fill="#dc2626" fontWeight="600">Tangent 1</text>
                      <text x="75" y="118" fontSize="9" fill="#dc2626" fontWeight="600">Tangent 2</text>
                      <text x="78" y="70" fontSize="9" fill="#0284c7" fontWeight="600">Pencil Center Path</text>
                      <text x="140" y="25" fontSize="10" fill="#0f172a" fontWeight="600">Ball Nose (T5 - R3.0)</text>
                      <text x="150" y="42" fontSize="9" fill="#64748b">Bi-tangent cleanup seam</text>
                    </svg>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '6px', textAlign: 'center', lineHeight: '1.4' }}>
                      Traces along internal intersections where ball cutter is simultaneously tangent to both surfaces.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3B: FINISH POCKET PARAMETERS (PRESERVED DYNAMICALLY) ==================== */}
          {activeTab === 'finish_contour_params' && isPocket && !isFlowline && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11.5px' }}>
              <div style={{ fontWeight: 600, color: '#0369a1' }}>
                3D Pocket Cutting Method ({caps.machineName})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {['Zigzag', 'Constant Overlap Spiral', 'Parallel Spiral', 'Morph Spiral'].map((m) => {
                  const active = pocketParams.cuttingMethod === m;
                  return (
                    <div
                      key={m}
                      onClick={() => setPocketParams((p) => ({ ...p, cuttingMethod: m }))}
                      style={{
                        border: active ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: active ? '#f0f9ff' : '#ffffff',
                        padding: '10px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: active ? 600 : 400
                      }}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <div>
                  <div style={{ marginBottom: '3px' }}>Max stepdown (mm):</div>
                  <input type="number" step="0.1" value={pocketParams.maxStepdown} onChange={(e) => setPocketParams((p) => ({ ...p, maxStepdown: Number(e.target.value) }))} style={{ ...CLASSIC_YELLOW, width: '100%' }} />
                </div>
                <div>
                  <div style={{ marginBottom: '3px' }}>Stepover distance (mm):</div>
                  <input type="number" step="0.5" value={pocketParams.stepover} onChange={(e) => setPocketParams((p) => ({ ...p, stepover: Number(e.target.value) }))} style={{ ...CLASSIC_YELLOW, width: '100%' }} />
                </div>
                <div>
                  <div style={{ marginBottom: '3px' }}>Machining direction:</div>
                  <select value={pocketParams.machiningDirection} onChange={(e) => setPocketParams((p) => ({ ...p, machiningDirection: e.target.value }))} style={{ width: '100%', height: '22px', border: '1px solid #9ca3af' }}>
                    <option value="climb">Climb</option>
                    <option value="conventional">Conventional</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', paddingTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={pocketParams.roughEntryHelix} onChange={(e) => setPocketParams((p) => ({ ...p, roughEntryHelix: e.target.checked }))} />
                  <span>Helical ramp entry into pocket</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={pocketParams.finishOuterBoundary} onChange={(e) => setPocketParams((p) => ({ ...p, finishOuterBoundary: e.target.checked }))} />
                  <span>Finish outer boundary wall pass</span>
                </label>
              </div>
            </div>
          )}

          {/* ==================== TAB 3C: FINISH FLOWLINE PARAMETERS (IMAGE 5 VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && isFlowline && (
            <div
              data-testid="finish-flowline-params-tab"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '340px',
                fontSize: '11.5px',
                color: '#0f172a'
              }}
            >
              {/* Top Row: Cut control + Stepover control + Cutting method */}
              <div style={{ display: 'grid', gridTemplateColumns: '235px 235px minmax(0, 1fr)', gap: '12px', alignItems: 'start' }}>
                {/* 1. Cut control */}
                <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px 10px', margin: 0, minWidth: 0 }}>
                  <legend style={{ fontSize: '11px', padding: '0 4px', color: '#0f172a' }}>Cut control</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={flowlineParams.cutControlDistanceEnabled}
                          onChange={(e) => setFlowlineParams((p) => ({ ...p, cutControlDistanceEnabled: e.target.checked }))}
                        />
                        <span>Distance</span>
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.1"
                        disabled={!flowlineParams.cutControlDistanceEnabled}
                        value={flowlineParams.cutControlDistance}
                        onChange={(e) => setFlowlineParams((p) => ({ ...p, cutControlDistance: Number(e.target.value) }))}
                        style={flowlineParams.cutControlDistanceEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveSubDialog('total_tolerance')}
                        style={{ ...MC_BUTTON, width: '100%' }}
                      >
                        Total tolerance...
                      </button>
                      <input
                        type="number"
                        step="0.005"
                        min="0.001"
                        value={flowlineParams.totalTolerance}
                        onChange={(e) => setFlowlineParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                        style={CLASSIC_YELLOW}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', paddingTop: '2px' }}>
                      <input
                        type="checkbox"
                        checked={flowlineParams.checkGouge}
                        onChange={(e) => setFlowlineParams((p) => ({ ...p, checkGouge: e.target.checked }))}
                      />
                      <span>Check flowline motion for gouge</span>
                    </label>
                  </div>
                </fieldset>

                {/* 2. Stepover control */}
                <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px 10px', margin: 0, minWidth: 0 }}>
                  <legend style={{ fontSize: '11px', padding: '0 4px', color: '#0f172a' }}>Stepover control</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 74px', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="flowline_stepover_mode"
                          checked={flowlineParams.stepoverMode === 'distance'}
                          onChange={() => setFlowlineParams((p) => ({ ...p, stepoverMode: 'distance' }))}
                        />
                        <span>Distance</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.05"
                        disabled={flowlineParams.stepoverMode !== 'distance'}
                        value={flowlineParams.stepoverDistance}
                        onChange={(e) => setFlowlineParams((p) => ({ ...p, stepoverDistance: Number(e.target.value) }))}
                        style={flowlineParams.stepoverMode === 'distance' ? CLASSIC_YELLOW : DISABLED_GRAY}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 74px', alignItems: 'center', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="flowline_stepover_mode"
                          checked={flowlineParams.stepoverMode === 'scallop'}
                          onChange={() => setFlowlineParams((p) => ({ ...p, stepoverMode: 'scallop' }))}
                        />
                        <span>Scallop height</span>
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.005"
                        disabled={flowlineParams.stepoverMode !== 'scallop'}
                        value={flowlineParams.scallopHeight}
                        onChange={(e) => setFlowlineParams((p) => ({ ...p, scallopHeight: Number(e.target.value) }))}
                        style={flowlineParams.stepoverMode === 'scallop' ? CLASSIC_YELLOW : DISABLED_GRAY}
                      />
                    </div>
                  </div>
                </fieldset>

                {/* 3. Cutting method & Single row only */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '6px', minWidth: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '95px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                    <span>Cutting method</span>
                    <select
                      value={flowlineParams.cuttingMethod}
                      onChange={(e) => setFlowlineParams((p) => ({ ...p, cuttingMethod: e.target.value }))}
                      style={WHITE_INPUT}
                    >
                      <option value="Zigzag">Zigzag</option>
                      <option value="One way">One way</option>
                      <option value="Spiral">Spiral</option>
                    </select>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={flowlineParams.singleRowOnly}
                      onChange={(e) => setFlowlineParams((p) => ({ ...p, singleRowOnly: e.target.checked }))}
                    />
                    <span>Single row only</span>
                  </label>
                </div>
              </div>

              {/* Bottom Row: Rib cut (left) + Depth limits / Gap settings / Advanced settings (right) */}
              <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: '16px', alignItems: 'center', marginTop: '48px' }}>
                <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px 10px', margin: 0 }}>
                  <legend style={{ fontSize: '11px', padding: '0 4px', color: '#0f172a' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={flowlineParams.ribCutEnabled}
                        onChange={(e) => setFlowlineParams((p) => ({ ...p, ribCutEnabled: e.target.checked }))}
                      />
                      <span>Rib cut</span>
                    </label>
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px', alignItems: 'center', gap: '8px', padding: '6px 0 4px 0', color: flowlineParams.ribCutEnabled ? '#0f172a' : '#64748b' }}>
                    <span>Resolution percent of tool</span>
                    <input
                      type="number"
                      step="5"
                      min="5"
                      max="100"
                      disabled={!flowlineParams.ribCutEnabled}
                      value={flowlineParams.ribCutResolutionPct}
                      onChange={(e) => setFlowlineParams((p) => ({ ...p, ribCutResolutionPct: Number(e.target.value) }))}
                      style={flowlineParams.ribCutEnabled ? CLASSIC_YELLOW : DISABLED_GRAY}
                    />
                  </div>
                </fieldset>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={flowlineParams.depthLimitsEnabled}
                      onChange={(e) => setFlowlineParams((p) => ({ ...p, depthLimitsEnabled: e.target.checked }))}
                    />
                    <button
                      type="button"
                      disabled={!flowlineParams.depthLimitsEnabled}
                      onClick={() => setActiveSubDialog('cut_depths')}
                      style={{ ...MC_BUTTON, opacity: flowlineParams.depthLimitsEnabled ? 1 : 0.6 }}
                    >
                      Depth limits...
                    </button>
                  </div>
                  <button type="button" onClick={() => setActiveSubDialog('gap_settings')} style={MC_BUTTON}>
                    Gap settings...
                  </button>
                  <button type="button" onClick={() => setActiveSubDialog('advanced_settings')} style={MC_BUTTON}>
                    Advanced settings...
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3H: FINISH RADIAL PARAMETERS (MASTERCAM VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && isRadial && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: '16px', alignItems: 'start', minWidth: 0 }}>
                {/* LEFT COLUMN: Tolerances, Stepover Mode, Sector Angles, Radii Limits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
                  {/* Total tolerance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <button type="button" onClick={() => setActiveSubDialog('total_tolerance')} style={{ ...MC_BUTTON, width: '100%', borderColor: '#3b82f6' }}>
                      Total tolerance...
                    </button>
                    <input
                      type="number"
                      step="0.005"
                      value={radialParams.totalTolerance ?? 0.025}
                      onChange={(e) => setRadialParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Stepover & Angular Increment Mode */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Stepover & Resolution</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="radio"
                            name="radialStepMode"
                            checked={radialParams.stepoverMode === 'max_stepover'}
                            onChange={() => setRadialParams((p) => ({ ...p, stepoverMode: 'max_stepover' }))}
                          />
                          <span style={{ fontWeight: radialParams.stepoverMode === 'max_stepover' ? 600 : 400 }}>Max stepover (mm)</span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min="0.05"
                          value={radialParams.maxStepover ?? 1.0}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const rEnd = radialParams.endRadius > 0 ? radialParams.endRadius : 50;
                            const deg = Number(((val / rEnd) * (180 / Math.PI)).toFixed(2));
                            setRadialParams((p) => ({ ...p, maxStepover: val, angularIncrement: deg }));
                          }}
                          disabled={radialParams.stepoverMode !== 'max_stepover'}
                          style={{ ...CLASSIC_YELLOW, opacity: radialParams.stepoverMode === 'max_stepover' ? 1 : 0.6 }}
                        />
                      </label>

                      <label style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="radio"
                            name="radialStepMode"
                            checked={radialParams.stepoverMode === 'angular'}
                            onChange={() => setRadialParams((p) => ({ ...p, stepoverMode: 'angular' }))}
                          />
                          <span style={{ fontWeight: radialParams.stepoverMode === 'angular' ? 600 : 400 }}>Angular step (deg)</span>
                        </div>
                        <input
                          type="number"
                          step="0.2"
                          min="0.1"
                          max="30"
                          value={radialParams.angularIncrement ?? 2.0}
                          onChange={(e) => {
                            const deg = Number(e.target.value);
                            const rEnd = radialParams.endRadius > 0 ? radialParams.endRadius : 50;
                            const step = Number(((deg * Math.PI / 180) * rEnd).toFixed(2));
                            setRadialParams((p) => ({ ...p, angularIncrement: deg, maxStepover: step }));
                          }}
                          disabled={radialParams.stepoverMode !== 'angular'}
                          style={{ ...CLASSIC_YELLOW, opacity: radialParams.stepoverMode === 'angular' ? 1 : 0.6 }}
                        />
                      </label>

                      {/* Computed Scallop Height at outer radius */}
                      <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#64748b' }}>Scallop height (rim)</span>
                        <div style={{ ...CLASSIC_YELLOW, background: '#f8fafc', color: '#0369a1', display: 'flex', alignItems: 'center', fontWeight: 600, padding: '0 6px' }}>
                          {(() => {
                            const r = Math.max(0.5, (Number(toolParams.toolDiameter) || 6) / 2);
                            const s = Math.max(0.01, Number(radialParams.maxStepover) || 1.0);
                            const scallop = r - Math.sqrt(Math.max(0, r * r - (s / 2) * (s / 2)));
                            return `${(scallop || 0.005).toFixed(4)} mm`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </fieldset>

                  {/* Sector Angles */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Angular Sector Bounds</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Start Angle (deg)</span>
                        <input
                          type="number"
                          step="5"
                          value={radialParams.startAngle ?? 0.0}
                          onChange={(e) => setRadialParams((p) => ({ ...p, startAngle: Number(e.target.value) }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Sweep Angle (deg)</span>
                        <input
                          type="number"
                          step="5"
                          min="1"
                          max="360"
                          value={radialParams.sweepAngle ?? 360.0}
                          onChange={(e) => setRadialParams((p) => ({ ...p, sweepAngle: Number(e.target.value) }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      {[
                        { label: '360° Full', sweep: 360 },
                        { label: '180° Half', sweep: 180 },
                        { label: '90° Quadrant', sweep: 90 }
                      ].map((btn) => (
                        <button
                          key={btn.sweep}
                          type="button"
                          onClick={() => setRadialParams((p) => ({ ...p, sweepAngle: btn.sweep }))}
                          style={{
                            ...MC_BUTTON,
                            background: Number(radialParams.sweepAngle) === btn.sweep ? '#e0f2fe' : '#ffffff',
                            borderColor: Number(radialParams.sweepAngle) === btn.sweep ? '#0284c7' : '#9ca3af',
                            color: Number(radialParams.sweepAngle) === btn.sweep ? '#0369a1' : '#0f172a',
                            fontWeight: Number(radialParams.sweepAngle) === btn.sweep ? 600 : 400,
                            padding: '3px 2px',
                            fontSize: '10.5px'
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Radial Range (Start & End Radius) */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Radial Limits (mm)</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Start Radius (Inner)</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={radialParams.startRadius ?? 0.0}
                          onChange={(e) => setRadialParams((p) => ({ ...p, startRadius: Number(e.target.value) }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>End Radius (Outer)</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={radialParams.endRadius ?? 50.0}
                          onChange={(e) => {
                            const r = Number(e.target.value);
                            setRadialParams((p) => ({
                              ...p,
                              endRadius: r,
                              maxStepover: p.stepoverMode === 'angular' ? Number(((p.angularIncrement * Math.PI / 180) * r).toFixed(2)) : p.maxStepover
                            }));
                          }}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* RIGHT COLUMN: Center Point, Cut Direction, Cutting Method, Graphic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                  {/* Center Point */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Center Point (Spoke Origin)</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Center X</span>
                        <input
                          type="number"
                          step="0.5"
                          value={radialParams.centerPoint?.x ?? 0.0}
                          onChange={(e) => setRadialParams((p) => ({ ...p, autoCenter: false, centerPoint: { ...(p.centerPoint || {}), x: Number(e.target.value) } }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Center Y</span>
                        <input
                          type="number"
                          step="0.5"
                          value={radialParams.centerPoint?.y ?? 0.0}
                          onChange={(e) => setRadialParams((p) => ({ ...p, autoCenter: false, centerPoint: { ...(p.centerPoint || {}), y: Number(e.target.value) } }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Center Z</span>
                        <input
                          type="number"
                          step="0.5"
                          value={radialParams.centerPoint?.z ?? 0.0}
                          onChange={(e) => setRadialParams((p) => ({ ...p, autoCenter: false, centerPoint: { ...(p.centerPoint || {}), z: Number(e.target.value) } }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (detectedSurfaces.length > 0) {
                            const box = new THREE.Box3();
                            detectedSurfaces.forEach((s) => { if (s.box && !s.box.isEmpty()) box.union(s.box); });
                            if (!box.isEmpty()) {
                              const cx = Number(((box.min.x + box.max.x) / 2).toFixed(3));
                              const cy = Number(((box.min.y + box.max.y) / 2).toFixed(3));
                              const cz = Number(((box.min.z + box.max.z) / 2).toFixed(3));
                              const rMax = Number(Math.max(Math.hypot(box.max.x - cx, box.max.z - cz), 10.0).toFixed(2));
                              setRadialParams((p) => ({ ...p, autoCenter: true, centerPoint: { x: cx, y: cz, z: cy }, endRadius: rMax }));
                              onNotify?.('Center point and outer radius calculated from drive surfaces', 'success');
                            }
                          }
                        }}
                        style={{ ...MC_BUTTON, flex: 1, borderColor: '#0284c7', color: '#0369a1' }}
                      >
                        Auto Center from Surfaces
                      </button>
                      <button
                        type="button"
                        onClick={() => setRadialParams((p) => ({ ...p, autoCenter: false, centerPoint: { x: 0, y: 0, z: 0 } }))}
                        style={{ ...MC_BUTTON, width: '130px' }}
                      >
                        Set WCS (0,0)
                      </button>
                    </div>
                  </fieldset>

                  {/* Cut Direction & Rotation */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                      <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Cut Direction</legend>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[
                          { id: 'inside_to_outside', label: 'Inside to Outside' },
                          { id: 'outside_to_inside', label: 'Outside to Inside' }
                        ].map((d) => (
                          <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="radialCutDir"
                              checked={(radialParams.cutDirection || 'inside_to_outside') === d.id}
                              onChange={() => setRadialParams((p) => ({ ...p, cutDirection: d.id }))}
                            />
                            <span>{d.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                      <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Angular Progression</legend>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[
                          { id: 'CW', label: 'Clockwise (CW)' },
                          { id: 'CCW', label: 'Counter-Clockwise (CCW)' }
                        ].map((r) => (
                          <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="radialRotDir"
                              checked={(radialParams.rotationDirection || 'CW') === r.id}
                              onChange={() => setRadialParams((p) => ({ ...p, rotationDirection: r.id }))}
                            />
                            <span>{r.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  {/* Cutting Method */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Cutting Method</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {[
                        { id: 'Zigzag', label: 'Zigzag (Bi-dir)', desc: 'Continuous spokes' },
                        { id: 'One way', label: 'One Way', desc: 'Retract to center/rim' },
                        { id: 'Spiral', label: 'Spiral', desc: 'Continuous archimedean' }
                      ].map((m) => {
                        const active = (radialParams.cuttingMethod || 'Zigzag').toLowerCase() === m.id.toLowerCase();
                        return (
                          <div
                            key={m.id}
                            onClick={() => setRadialParams((p) => ({ ...p, cuttingMethod: m.id }))}
                            style={{
                              border: active ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              background: active ? '#f0f9ff' : '#ffffff',
                              padding: '8px 6px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontWeight: active ? 600 : 500, color: active ? '#0369a1' : '#1e293b', fontSize: '11px' }}>
                              {m.label}
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px' }}>{m.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Mastercam Schematic Graphic */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Radial Finish Topology ({radialParams.cuttingMethod || 'Zigzag'} • Step: {radialParams.stepoverMode === 'angular' ? `${radialParams.angularIncrement ?? 2}°` : `${radialParams.maxStepover ?? 1}mm`} • Sweep: {radialParams.sweepAngle ?? 360}°)
                    </div>
                    <svg width="280" height="100" viewBox="0 0 280 100">
                      {/* Center concentric circles */}
                      <circle cx="140" cy="50" r="42" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                      <circle cx="140" cy="50" r="28" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                      <circle cx="140" cy="50" r="12" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                      {/* Center Origin Mark */}
                      <circle cx="140" cy="50" r="3" fill="#dc2626" />
                      <line x1="134" y1="50" x2="146" y2="50" stroke="#dc2626" strokeWidth="1" />
                      <line x1="140" y1="44" x2="140" y2="56" stroke="#dc2626" strokeWidth="1" />
                      {/* Radial Spokes */}
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, idx) => {
                        const rad = (deg * Math.PI) / 180;
                        const r1 = Math.max(6, Number(radialParams.startRadius) || 6);
                        const r2 = 42;
                        const x1 = 140 + r1 * Math.cos(rad);
                        const y1 = 50 + r1 * Math.sin(rad);
                        const x2 = 140 + r2 * Math.cos(rad);
                        const y2 = 50 + r2 * Math.sin(rad);
                        const isEven = idx % 2 === 0;
                        return (
                          <g key={deg}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0284c7" strokeWidth="1.6" />
                            <circle cx={x2} cy={y2} r="2" fill="#0284c7" />
                            {/* Arc transition for zigzag */}
                            {(radialParams.cuttingMethod || 'Zigzag').toLowerCase() === 'zigzag' && isEven && (
                              <path
                                d={`M ${x2} ${y2} A 42 42 0 0 1 ${140 + r2 * Math.cos(rad + Math.PI / 6)} ${50 + r2 * Math.sin(rad + Math.PI / 6)}`}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="1.2"
                                strokeDasharray="2,2"
                              />
                            )}
                          </g>
                        );
                      })}
                      <text x="140" y="96" textAnchor="middle" fontSize="9" fill="#0f172a" fontWeight="600">
                        Center ({radialParams.centerPoint?.x ?? 0}, {radialParams.centerPoint?.y ?? 0}) • R_in: {radialParams.startRadius ?? 0}mm • R_out: {radialParams.endRadius ?? 50}mm
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3I: FINISH PROJECT PARAMETERS (MASTERCAM VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && isProject && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '16px', alignItems: 'start', minWidth: 0 }}>
                {/* LEFT COLUMN: Projection Type, Source, Angles, Direction, Tolerances */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  {/* Total tolerance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <button type="button" onClick={() => setActiveSubDialog('total_tolerance')} style={{ ...MC_BUTTON, width: '100%', borderColor: '#7c3aed' }}>
                      Total tolerance...
                    </button>
                    <input
                      type="number"
                      step="0.005"
                      value={projectParams.totalTolerance ?? 0.025}
                      onChange={(e) => setProjectParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>

                  {/* Projection Source Type */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Project Source Entity</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                      {[
                        { id: 'curve', label: 'Curves / Wireframe', icon: '〰' },
                        { id: 'crosshatch', label: 'Crosshatch Grid', icon: '▦' },
                        { id: 'toolpath', label: 'Toolpath (NCI)', icon: '⮑' }
                      ].map((t) => {
                        const active = (projectParams.projectType || 'curve') === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setProjectParams((p) => ({ ...p, projectType: t.id }))}
                            style={{
                              border: active ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                              background: active ? '#f5f3ff' : '#ffffff',
                              padding: '6px 4px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{ fontSize: '13px' }}>{t.icon}</div>
                            <div style={{ fontWeight: active ? 600 : 500, color: active ? '#6d28d9' : '#1e293b', fontSize: '10px', marginTop: '2px' }}>
                              {t.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mode-Specific Sub-Settings */}
                    {(projectParams.projectType || 'curve') === 'curve' && (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px', borderRadius: '2px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ fontSize: '10.5px', color: '#475569' }}>
                          <strong>Source:</strong> Active Sketches, Text, & Level 10 Wireframe
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          • Discretizes 2D/3D chains and projects down onto 3D surfaces.<br />
                          • Auto-generates centered demonstration pattern if no curves are drawn yet.
                        </div>
                      </div>
                    )}

                    {projectParams.projectType === 'crosshatch' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10.5px', color: '#475569' }}>Machining angle (°)</span>
                          <input
                            type="number"
                            step="5"
                            value={projectParams.machiningAngle ?? 0.0}
                            onChange={(e) => setProjectParams((p) => ({ ...p, machiningAngle: Number(e.target.value) }))}
                            style={CLASSIC_YELLOW}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10.5px', color: '#475569' }}>Stepover (mm)</span>
                          <input
                            type="number"
                            step="0.2"
                            min="0.1"
                            value={projectParams.stepover ?? 1.0}
                            onChange={(e) => setProjectParams((p) => ({ ...p, stepover: Number(e.target.value) }))}
                            style={CLASSIC_YELLOW}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '4px' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(projectParams.crosshatchEnabled)}
                            onChange={(e) => setProjectParams((p) => ({ ...p, crosshatchEnabled: e.target.checked }))}
                          />
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>Enable Crosshatch (2nd Angle)</span>
                        </label>
                        {projectParams.crosshatchEnabled && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', paddingLeft: '16px' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: '#475569' }}>Cross angle (°)</span>
                              <input
                                type="number"
                                step="5"
                                value={projectParams.crossAngle ?? 90.0}
                                onChange={(e) => setProjectParams((p) => ({ ...p, crossAngle: Number(e.target.value) }))}
                                style={CLASSIC_YELLOW}
                              />
                            </div>
                            <div>
                              <span style={{ fontSize: '10px', color: '#475569' }}>Cross step (mm)</span>
                              <input
                                type="number"
                                step="0.2"
                                min="0.1"
                                value={projectParams.crossStepover ?? projectParams.stepover ?? 1.0}
                                onChange={(e) => setProjectParams((p) => ({ ...p, crossStepover: Number(e.target.value) }))}
                                style={CLASSIC_YELLOW}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {projectParams.projectType === 'toolpath' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Source Operation to Project:</span>
                        <select
                          value={projectParams.sourceOpId || ''}
                          onChange={(e) => setProjectParams((p) => ({ ...p, sourceOpId: e.target.value }))}
                          style={{ ...CLASSIC_YELLOW, height: '26px' }}
                        >
                          <option value="">(Most Recent 2D Operation)</option>
                          {(operation?.availableOps || []).map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.id}: {o.name || o.strategyKey}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </fieldset>

                  {/* Projection Direction */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Projection Direction</legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {[
                        { id: 'view_z', label: 'Along Tool Axis / View Z (Standard 3-Axis Downward)' },
                        { id: 'surface_normal', label: 'Normal to Drive Surfaces (3D Contact)' }
                      ].map((dir) => (
                        <label key={dir.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="projectDirection"
                            checked={(projectParams.projectionDirection || 'view_z') === dir.id}
                            onChange={() => setProjectParams((p) => ({ ...p, projectionDirection: dir.id }))}
                          />
                          <span>{dir.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {/* Gap Distance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#475569' }}>Max gap distance (mm)</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={projectParams.maxGapDistance ?? 10.0}
                      onChange={(e) => setProjectParams((p) => ({ ...p, maxGapDistance: Number(e.target.value) }))}
                      style={CLASSIC_YELLOW}
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Cutting Method, Depth of Cut, Direction, Schematic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                  {/* Cutting Method */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Cutting Method & Direction</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>Method</span>
                        {[
                          { id: 'Zigzag', label: 'Zigzag (Bi-directional)' },
                          { id: 'One way', label: 'One Way (Retract per pass)' }
                        ].map((m) => (
                          <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="projMethod"
                              checked={(projectParams.cuttingMethod || 'Zigzag').toLowerCase() === m.id.toLowerCase()}
                              onChange={() => setProjectParams((p) => ({ ...p, cuttingMethod: m.id }))}
                            />
                            <span>{m.label}</span>
                          </label>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>Machining Direction</span>
                        {[
                          { id: 'climb', label: 'Climb Milling' },
                          { id: 'conventional', label: 'Conventional' }
                        ].map((d) => (
                          <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="projMachDir"
                              checked={(projectParams.machiningDirection || 'climb') === d.id}
                              onChange={() => setProjectParams((p) => ({ ...p, machiningDirection: d.id }))}
                            />
                            <span>{d.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </fieldset>

                  {/* Depth Control & Multi-Passes */}
                  <fieldset style={{ border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '2px' }}>
                    <legend style={{ padding: '0 4px', color: '#1e293b', fontWeight: 600 }}>Depth of Cut & Passes</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Depth of Cut (mm)</span>
                        <input
                          type="number"
                          step="0.05"
                          min="0.0"
                          value={projectParams.depthOfCut ?? 0.2}
                          onChange={(e) => setProjectParams((p) => ({ ...p, depthOfCut: Number(e.target.value) }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Number of Passes</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max="10"
                          value={projectParams.numberOfPasses ?? 1}
                          onChange={(e) => setProjectParams((p) => ({ ...p, numberOfPasses: Math.max(1, parseInt(e.target.value) || 1) }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10.5px', color: '#475569' }}>Stepdown (mm)</span>
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          value={projectParams.stepdown ?? 0.2}
                          onChange={(e) => setProjectParams((p) => ({ ...p, stepdown: Number(e.target.value) }))}
                          style={CLASSIC_YELLOW}
                        />
                      </div>
                    </div>
                  </fieldset>

                  {/* Mastercam Schematic Graphic for 3D Project */}
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      3D Surface Project Topology ({projectParams.projectType || 'curve'} • Depth: {projectParams.depthOfCut ?? 0.2}mm • {projectParams.cuttingMethod || 'Zigzag'})
                    </div>
                    <svg width="280" height="100" viewBox="0 0 280 100">
                      {/* Projection Source Plane (Top) */}
                      <line x1="30" y1="18" x2="250" y2="18" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4,4" />
                      <text x="140" y="14" textAnchor="middle" fontSize="9" fill="#6d28d9" fontWeight="600">
                        {projectParams.projectType === 'crosshatch' ? 'Crosshatch Grid Pattern (Z_top)' : projectParams.projectType === 'toolpath' ? 'Source Toolpath Curve' : '2D / 3D Curve Geometry'}
                      </text>
                      {/* Curved 3D Drive Surface (Dome Profile) */}
                      <path
                        d="M 20 85 Q 140 38 260 85"
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="3"
                      />
                      <text x="140" y="78" textAnchor="middle" fontSize="9" fill="#0369a1" fontWeight="600">
                        3D Drive Surface
                      </text>
                      {/* Downward Projection Rays */}
                      {[50, 80, 110, 140, 170, 200, 230].map((rx) => {
                        const normX = (rx - 140) / 120;
                        const hitY = 38 + 47 * (normX * normX);
                        return (
                          <g key={rx}>
                            <line x1={rx} y1="20" x2={rx} y2={hitY} stroke="#a855f7" strokeWidth="1.2" strokeDasharray="2,2" />
                            <polygon points={`${rx - 2.5},${hitY - 5} ${rx + 2.5},${hitY - 5} ${rx},${hitY}`} fill="#a855f7" />
                            <circle cx={rx} cy={hitY} r="2.2" fill="#10b981" />
                          </g>
                        );
                      })}
                      {/* Tool Representation touching center */}
                      <g transform="translate(140, 38)">
                        <rect x="-3" y="-30" width="6" height="26" fill="#64748b" />
                        <path d="M -3 -4 A 3 3 0 0 0 3 -4 Z" fill="#f59e0b" />
                      </g>
                      <text x="140" y="96" textAnchor="middle" fontSize="9" fill="#0f172a">
                        Projection: View Z &rarr; Surface Normal Contact &rarr; Depth: {projectParams.depthOfCut ?? 0.2}mm
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3J: FINISH LEFTOVER PARAMETERS (MASTERCAM VERBATIM) ==================== */}
          {activeTab === 'finish_contour_params' && isLeftover && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '16px', alignItems: 'start', minWidth: 0 }}>
                {/* LEFT COLUMN: Tolerances, Reference Roughing Tool, Overlap */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  {/* Total tolerance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <button type="button" onClick={() => setActiveSubDialog('total_tolerance')} style={{ ...MC_BUTTON, width: '100%', borderColor: '#10b981' }}>
                      Total tolerance...
                    </button>
                    <input
                      type="number"
                      step="0.001"
                      value={leftoverParams.totalTolerance ?? 0.025}
                      onChange={(e) => setLeftoverParams((p) => ({ ...p, totalTolerance: Number(e.target.value) }))}
                      style={{ ...MC_INPUT, width: '100%' }}
                    />
                  </div>

                  {/* Reference Roughing Tool Parameters Fieldset */}
                  <fieldset style={{ border: '1px solid #10b981', padding: '8px 10px', margin: 0, borderRadius: '2px', background: '#ecfdf5' }}>
                    <legend style={{ padding: '0 4px', color: '#047857', fontWeight: 600, fontSize: '11px' }}>
                      Reference Roughing Tool (Prior Cutter)
                    </legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '136px minmax(0, 1fr)', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#065f46' }}>Rough tool dia:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.5"
                            min="1.0"
                            value={leftoverParams.refToolDiameter ?? 12.0}
                            onChange={(e) => setLeftoverParams((p) => ({ ...p, refToolDiameter: Math.max(1, Number(e.target.value)) }))}
                            style={{ ...MC_INPUT, width: '100%', fontWeight: 600 }}
                          />
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>mm</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '136px minmax(0, 1fr)', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#065f46' }}>Rough corner rad:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.25"
                            min="0.0"
                            value={leftoverParams.refToolCornerRadius ?? 6.0}
                            onChange={(e) => setLeftoverParams((p) => ({ ...p, refToolCornerRadius: Math.max(0, Number(e.target.value)) }))}
                            style={{ ...MC_INPUT, width: '100%' }}
                          />
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>mm</span>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        {[
                          { label: '16 Bull R2', d: 16.0, r: 2.0 },
                          { label: '12 Ball', d: 12.0, r: 6.0 },
                          { label: '10 Flat', d: 10.0, r: 0.0 }
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setLeftoverParams((p) => ({ ...p, refToolDiameter: preset.d, refToolCornerRadius: preset.r }))}
                            style={{
                              ...MC_BUTTON,
                              flex: 1,
                              fontSize: '9.5px',
                              padding: '2px 4px',
                              background: '#ffffff',
                              borderColor: '#a7f3d0'
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </fieldset>

                  {/* Overlap / Tangential Extension */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span title="Tangential overlap extension to blend with pre-cut surfaces without cusps">Overlap / extension:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0.0"
                        value={leftoverParams.overlap ?? 1.0}
                        onChange={(e) => setLeftoverParams((p) => ({ ...p, overlap: Math.max(0, Number(e.target.value)) }))}
                        style={{ ...MC_INPUT, width: '100%' }}
                      />
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>mm</span>
                    </div>
                  </div>

                  {/* Max Gap Distance */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span>Max gap distance:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="1.0"
                        min="0.5"
                        value={leftoverParams.maxGapDistance ?? 10.0}
                        onChange={(e) => setLeftoverParams((p) => ({ ...p, maxGapDistance: Math.max(0.5, Number(e.target.value)) }))}
                        style={{ ...MC_INPUT, width: '100%' }}
                      />
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>mm</span>
                    </div>
                  </div>

                  {/* Filter Tolerance Ratio */}
                  <div style={{ display: 'grid', gridTemplateColumns: '146px minmax(0, 1fr)', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span>Filter ratio:</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="0.9"
                      value={leftoverParams.filterToleranceRatio ?? 0.5}
                      onChange={(e) => setLeftoverParams((p) => ({ ...p, filterToleranceRatio: Number(e.target.value) }))}
                      style={{ ...MC_INPUT, width: '100%' }}
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Machining Method, Passes, Stepover, Cut Style, and SVG Schematic */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                  {/* Machining Method */}
                  <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Machining method:</span>
                    <select
                      value={leftoverParams.machiningMethod || 'along'}
                      onChange={(e) => setLeftoverParams((p) => ({ ...p, machiningMethod: e.target.value }))}
                      style={{ ...MC_SELECT, width: '100%', borderColor: '#10b981' }}
                    >
                      <option value="along">Along Surface (Valleys & Fillets)</option>
                      <option value="across">Across Surface (Transverse Passes)</option>
                    </select>
                  </div>

                  {/* Stepover & Number of Passes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                    <span>Stepover:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={leftoverParams.stepover ?? 0.4}
                        onChange={(e) => setLeftoverParams((p) => ({ ...p, stepover: Math.max(0.01, Number(e.target.value)) }))}
                        style={{ ...MC_INPUT, width: '100%' }}
                      />
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>mm</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                    <span>Number of passes:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={leftoverParams.numberOfPasses ?? 3}
                      onChange={(e) => setLeftoverParams((p) => ({ ...p, numberOfPasses: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                      style={{ ...MC_INPUT, width: '100%' }}
                    />
                  </div>

                  {/* Cutting Method & Machining Direction */}
                  <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                    <span>Cutting method:</span>
                    <select
                      value={leftoverParams.cuttingMethod || 'Zigzag'}
                      onChange={(e) => setLeftoverParams((p) => ({ ...p, cuttingMethod: e.target.value }))}
                      style={{ ...MC_SELECT, width: '100%' }}
                    >
                      <option value="Zigzag">Zigzag (Bi-directional)</option>
                      <option value="One way">One way (Climb/Conventional retracts)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0, 1fr)', alignItems: 'center', gap: '8px' }}>
                    <span>Direction:</span>
                    <select
                      value={leftoverParams.machiningDirection || 'climb'}
                      onChange={(e) => setLeftoverParams((p) => ({ ...p, machiningDirection: e.target.value }))}
                      style={{ ...MC_SELECT, width: '100%' }}
                    >
                      <option value="climb">Climb milling</option>
                      <option value="conventional">Conventional milling</option>
                    </select>
                  </div>

                  {/* Mastercam Leftover Rest Machining SVG Diagram */}
                  <div
                    style={{
                      height: '110px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <svg width="280" height="106" viewBox="0 0 280 106" style={{ width: '100%', height: '100%' }}>
                      {/* Fillet / Valley Surface Profile */}
                      <path
                        d="M 15 15 L 15 50 Q 15 85 50 85 L 265 85"
                        fill="none"
                        stroke="#334155"
                        strokeWidth="2.5"
                      />
                      {/* Roughing tool envelope (dashed reference tool) */}
                      <circle
                        cx="75"
                        cy="45"
                        r="38"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        strokeDasharray="4,3"
                      />
                      <text x="82" y="32" fontSize="8.5" fill="#2563eb" fontWeight="600">
                        Ref D={leftoverParams.refToolDiameter ?? 12}mm
                      </text>

                      {/* Leftover Material Cusp Zone */}
                      <path
                        d="M 15 65 Q 15 85 35 85 Q 22 75 15 65 Z"
                        fill="#fef08a"
                        stroke="#eab308"
                        strokeWidth="0.8"
                      />

                      {/* Finishing active tool (smaller) */}
                      <circle
                        cx="32"
                        cy="68"
                        r="16"
                        fill="rgba(16, 185, 129, 0.2)"
                        stroke="#10b981"
                        strokeWidth="1.5"
                      />
                      {/* Multiple rest milling passes */}
                      <line x1="24" y1="78" x2="24" y2="72" stroke="#10b981" strokeWidth="1.5" strokeDasharray="1,1" />
                      <line x1="30" y1="82" x2="30" y2="76" stroke="#10b981" strokeWidth="1.5" strokeDasharray="1,1" />
                      <line x1="36" y1="84" x2="36" y2="78" stroke="#10b981" strokeWidth="1.5" strokeDasharray="1,1" />

                      <text x="45" y="70" fontSize="8.5" fill="#047857" fontWeight="600">
                        Finish D={toolParams.toolDiameter}mm
                      </text>
                      <text x="140" y="99" textAnchor="middle" fontSize="9" fill="#0f172a">
                        Mode: {leftoverParams.machiningMethod === 'along' ? 'Along Valleys' : 'Across Ribs'} • Overlap: {leftoverParams.overlap ?? 1.0}mm
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Strip (OK / Cancel / Help + Machine Status) */}
        <div
          style={{
            height: '44px',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px'
          }}
        >
          <div style={{ fontSize: '10.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderCog size={13} color="#0369a1" />
            <span>{caps.spindleTaper} • Max {caps.maxRpm.toLocaleString()} RPM / {caps.maxFeed.toLocaleString()} mm/min</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleApply}
              style={{
                width: '40px',
                height: '26px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                color: '#16a34a',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="OK (Apply Toolpath)"
            >
              <Check size={16} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '40px',
                height: '26px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Cancel (Esc)"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() =>
                onNotify?.(
                  `${isFlowline ? 'Surface Finish Flowline' : isPocket ? 'Surface Finish Pocket' : isShallow ? 'Surface Finish Shallow' : isParallelSteep ? 'Surface Finish Parallel Steep' : isParallel ? 'Surface Finish Parallel' : isPencil ? 'Surface Finish Pencil' : isRadial ? 'Surface Finish Radial' : 'Surface Finish Contour'} (${caps.machineName} - ${caps.axesCount}-Axis)`,
                  'info'
                )
              }
              style={{
                width: '40px',
                height: '26px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                color: '#0284c7',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Help"
            >
              <HelpCircle size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Floating Mastercam Tool Table Right-Click Context Menu (Screenshot 1 Verbatim) */}
        {contextMenuPos && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: `${contextMenuPos.clientX}px`,
              top: `${contextMenuPos.clientY}px`,
              zIndex: 100010,
              width: '215px',
              background: '#f2f2f2',
              border: '1px solid #8c8c8c',
              boxShadow: '2px 3px 10px rgba(0, 0, 0, 0.28)',
              padding: '2px',
              fontSize: '11.5px',
              color: '#111827'
            }}
          >
            {[
              { label: 'Create new tool...', action: () => { setContextMenuPos(null); onOpenDefineToolModal?.(); } },
              { label: 'Edit tool...', disabled: !activeTool, action: () => { setContextMenuPos(null); onEditTool?.(activeTool); } },
              { label: 'Edit projection...', disabled: !activeTool, action: () => { setContextMenuPos(null); setActiveSubDialog('edit_projection'); } },
              { label: 'Edit assembly names...', disabled: !activeTool, action: () => { setContextMenuPos(null); setActiveSubDialog('edit_assembly'); } },
              {
                label: 'Get angled head...',
                disabled: !caps.supportsAngledHead,
                action: () => {
                  setContextMenuPos(null);
                  setToolParams((p) => ({ ...p, headNumber: 2 }));
                  onNotify?.(`Configured B/C Angled Head #2 for ${caps.machineName}`, 'info');
                }
              },
              { label: `Tool manager... (${caps.toolManagerSuffix})`, action: () => { setContextMenuPos(null); setActiveSubDialog('select_library_tool'); } },
              { label: 'Save tool to library...', disabled: !activeTool, action: () => { setContextMenuPos(null); handleSaveToLibrary(); } },
              { separator: true },
              { label: 'View', submenu: 'view' },
              { label: 'Arrange tools', submenu: 'arrange' },
              { separator: true },
              { label: 'Re-initialize feeds & speeds', action: () => { setContextMenuPos(null); handleReinitializeFeedsSpeeds(); } },
              { label: 'Feed speed calculator...', action: () => { setContextMenuPos(null); setActiveSubDialog('feeds_calc'); } },
              { label: 'Search for cut parameters...', action: () => { setContextMenuPos(null); setActiveSubDialog('search_presets'); } },
              { separator: true },
              { label: 'Save parameters to defaults file', action: () => { setContextMenuPos(null); handleSaveDefaults(); } },
              { label: 'Reload parameters from defaults file', action: () => { setContextMenuPos(null); handleReloadDefaults(); } }
            ].map((item, idx) => {
              if (item.separator) {
                return <div key={`sep_${idx}`} style={{ height: '1px', background: '#d1d5db', margin: '2px 4px' }} />;
              }
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setOpenSubMenu(item.submenu || null)}
                  onClick={() => !item.disabled && !item.submenu && item.action?.()}
                  style={{
                    padding: '4px 12px 4px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: item.disabled ? 'default' : 'pointer',
                    color: item.disabled ? '#9ca3af' : '#111827',
                    position: 'relative'
                  }}
                  className={item.disabled ? '' : 'mc-ctx-item'}
                >
                  <span>{item.label}</span>
                  {item.submenu && <ChevronRight size={12} />}

                  {item.submenu === 'view' && openSubMenu === 'view' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        width: '130px',
                        background: '#f2f2f2',
                        border: '1px solid #8c8c8c',
                        boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                        padding: '2px'
                      }}
                    >
                      {[
                        { id: 'small', label: 'Small Icons' },
                        { id: 'large', label: 'Large Icons' },
                        { id: 'details', label: 'Details' }
                      ].map((v) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setToolViewMode(v.id);
                            setContextMenuPos(null);
                            setOpenSubMenu(null);
                          }}
                          style={{ padding: '4px 10px', cursor: 'pointer', fontWeight: toolViewMode === v.id ? 600 : 400 }}
                        >
                          {toolViewMode === v.id ? `✓ ${v.label}` : v.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.submenu === 'arrange' && openSubMenu === 'arrange' && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        width: '140px',
                        background: '#f2f2f2',
                        border: '1px solid #8c8c8c',
                        boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
                        padding: '2px'
                      }}
                    >
                      {[
                        { id: 'number', label: 'By Tool #' },
                        { id: 'diameter', label: 'By Diameter' },
                        { id: 'type', label: 'By Tool Type' },
                        { id: 'name', label: 'By Tool Name' }
                      ].map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setToolSortBy(s.id);
                            setContextMenuPos(null);
                            setOpenSubMenu(null);
                          }}
                          style={{ padding: '4px 10px', cursor: 'pointer', fontWeight: toolSortBy === s.id ? 600 : 400 }}
                        >
                          {toolSortBy === s.id ? `✓ ${s.label}` : s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <style>{`.mc-ctx-item:hover { background: #91c9f7 !important; color: #000000 !important; }`}</style>
          </div>
        )}

        {/* Active Sub-Dialog Portal */}
        <SurfaceFinishSubDialog
          key={activeSubDialog || 'none'}
          dialog={activeSubDialog}
          onClose={() => setActiveSubDialog(null)}
          isFlowline={isFlowline}
          toolParams={toolParams}
          setToolParams={setToolParams}
          machineParams={machineParams}
          setMachineParams={setMachineParams}
          surfaceParams={surfaceParams}
          setSurfaceParams={setSurfaceParams}
          contourParams={contourParams}
          setContourParams={setContourParams}
          flowlineParams={flowlineParams}
          setFlowlineParams={setFlowlineParams}
          caps={caps}
          tools={displayedTools}
          activeTool={activeTool}
          activeMachine={activeMachine}
          detectedSurfaces={detectedSurfaces}
          selectedSurfaceIds={selectedSurfaceIds}
          setSelectedSurfaceIds={setSelectedSurfaceIds}
          onSelectLibraryTool={handleSelectTool}
          onApplyFeedsSpeedsCalc={(calc) => {
            setToolParams((p) => ({
              ...p,
              spindleSpeed: calc.spindleSpeed,
              feedRate: calc.feedRate,
              plungeRate: calc.plungeRate,
              retractRate: calc.retractRate,
              cs: calc.cs,
              fpt: calc.fpt
            }));
          }}
          onApplyCutPreset={(presetId) => {
            const applied = buildPresetApplication({
              presetId,
              tool: { diameter: toolParams.toolDiameter, flutes: toolParams.flutes, type: activeTool?.type || 'flat' },
              activeMachine
            });
            setToolParams((p) => ({
              ...p,
              feedRate: applied.feedsSpeeds.feedRate,
              spindleSpeed: applied.feedsSpeeds.spindleSpeed,
              plungeRate: applied.feedsSpeeds.plungeRate,
              retractRate: applied.feedsSpeeds.retractRate,
              coolantMode: applied.feedsSpeeds.coolantMode,
              cs: computeSurfaceSpeedCs(p.toolDiameter, applied.feedsSpeeds.spindleSpeed),
              fpt: computeFeedPerTooth(applied.feedsSpeeds.feedRate, applied.feedsSpeeds.spindleSpeed, p.flutes)
            }));
            setContourParams((p) => ({ ...p, ...applied.contourPatch }));
            onNotify?.(`Applied cut preset: ${applied.preset.label}`, 'success');
          }}
          onNotify={onNotify}
        />
      </div>
    </div>
  );
}

export function SurfaceFinishContourModal(props) {
  if (!props.isOpen) return null;
  const resetKey = `${props.operation?.id || 'new'}-${props.strategyMode || 'contour'}-${props.activeMachine?.id || 'default'}`;
  return <SurfaceFinishContourModalInner key={resetKey} {...props} />;
}

export default SurfaceFinishContourModal;

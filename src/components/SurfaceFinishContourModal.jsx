import React, { useState, useMemo } from 'react';
import * as THREE from 'three';
import { X, Check, HelpCircle, MousePointer, ChevronRight, FolderCog } from 'lucide-react';
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
  const caps = useMemo(() => resolveMachineToolpathCapabilities(activeMachine), [activeMachine]);

  const detectedSurfaces = useMemo(() => {
    const surfaceItems = (customGeometry || []).filter((item) => isDriveSurfaceEntity(item));
    const sourceItems = surfaceItems.length > 0
      ? surfaceItems
      : (customGeometry || []).filter((item) => item && item.visible !== false && !item.isLine && !item.isLineSegments);

    return sourceItems.map((item, idx) => {
      let box = item.boundingBox || null;
      if (!box && item.mesh && typeof item.mesh.clone === 'function') {
        box = new THREE.Box3().setFromObject(item.mesh);
      } else if (!box && typeof item.clone === 'function') {
        // Clone without customGeoGroup's +49 parent matrix so local surface coordinates match drive bounds
        const localClone = item.clone(true);
        localClone.updateMatrixWorld(true);
        box = new THREE.Box3().setFromObject(localClone);
      }
      const validBox = box && !box.isEmpty() ? box : null;
      return {
        id: String(item.userData?.customId || item.uuid || item.id || `surf_${idx}`),
        name: item.name || item.userData?.type || `3D Drive Surface #${idx + 1}`,
        height: validBox ? Number((validBox.max.y - validBox.min.y).toFixed(2)) : 20.0,
        box: validBox
      };
    });
  }, [customGeometry]);

  const initialTool = useMemo(() => {
    if (operation?.toolId) {
      return (
        tools.find((t) => String(t.id) === String(operation.toolId)) ||
        tools.find((t) => Number(t.number) === Number(operation.toolNumber)) ||
        tools[0] ||
        null
      );
    }
    if (isFlowline) {
      return (
        tools.find((t) => ['bull', 'ball'].includes(String(t.type || '').toLowerCase())) ||
        tools.find((t) => ['flat', 'bull', 'ball'].includes(String(t.type || '').toLowerCase())) ||
        tools[0] ||
        null
      );
    }
    return (
      tools.find((t) => ['flat', 'bull', 'ball'].includes(String(t.type || '').toLowerCase())) ||
      tools[0] ||
      null
    );
  }, [operation, tools, isFlowline]);

  const initialDefaults = useMemo(
    () =>
      createDefaultSurfaceFinishState({
        activeMachine,
        stockConfig,
        strategyMode: isFlowline ? 'flowline' : isPocket ? 'pocket' : 'contour',
        tool: initialTool
      }),
    [activeMachine, stockConfig, isPocket, isFlowline, initialTool]
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
      type: isFlowline ? 'surface_finish_flowline' : isPocket ? 'surface_finish_pocket' : 'surface_finish_contour',
      strategyKey: isFlowline ? 'surface_finish_flowline' : isPocket ? 'surface_finish_pocket' : 'surface_finish_contour',
      badgeClass: isFlowline ? 'flowline' : isPocket ? 'pocket' : 'contour',
      badgeText: isFlowline ? 'SF' : isPocket ? 'SP' : 'SC',
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
      stepdown: Number(isFlowline ? flowlineParams.stepoverDistance : isPocket ? pocketParams.maxStepdown : contourParams.maxStepdown) || 0.5,
      stockToLeaveXY: Number(surfaceParams.stockToLeaveDrive) || 0.0,
      stockToLeaveZ: Number(surfaceParams.stockToLeaveDrive) || 0.0,
      cuttingDirection: isPocket ? pocketParams.machiningDirection : contourParams.direction,
      contourSide: surfaceParams.containmentMode,
      cutStyle: isFlowline
        ? String(flowlineParams.cuttingMethod || 'Zigzag').toLowerCase()
        : (pocketParams.cuttingMethod?.toLowerCase() || 'constant_overlap'),
      stepoverPct: Math.max(5, Math.min(95, Math.round((Number((isFlowline ? flowlineParams.stepoverDistance : pocketParams.stepover) || 5) / Math.max(1, Number(toolParams.toolDiameter))) * 100))),
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
      flowlineParams: { ...flowlineParams }
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
          {activeTab === 'finish_contour_params' && !isPocket && !isFlowline && (
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
                      <button type="button" onClick={() => setActiveSubDialog('shallow')} style={{ ...MC_BUTTON, flex: 1, minWidth: 0, opacity: contourParams.shallowEnabled ? 1 : 0.65 }}>
                        Shallow...
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
                  `${isFlowline ? 'Surface Finish Flowline' : isPocket ? 'Surface Finish Pocket' : 'Surface Finish Contour'} (${caps.machineName} - ${caps.axesCount}-Axis)`,
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

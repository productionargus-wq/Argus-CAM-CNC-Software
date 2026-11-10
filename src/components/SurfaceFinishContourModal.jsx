import React, { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { X, Check, HelpCircle } from 'lucide-react';

export default function SurfaceFinishContourModal({
  isOpen,
  onClose,
  operation = null,
  strategyMode = 'contour', // 'contour' | 'pocket'
  tools = [],
  customGeometry = [],
  onSaveOperation,
  onOpenDefineToolModal,
  onNotify
}) {
  const mode = operation?.strategyKey === 'surface_finish_pocket' || operation?.badgeClass === 'pocket'
    ? 'pocket'
    : strategyMode;
  const isPocket = mode === 'pocket';

  const [activeTab, setActiveTab] = useState('toolpath_params');
  const [selectedToolIndex, setSelectedToolIndex] = useState(0);

  const detectedSurfaces = useMemo(() => {
    return (Array.isArray(customGeometry) ? customGeometry : [])
      .filter((ent) => {
        if (!ent || ent.visible === false) return false;
        const ct = String(ent.userData?.cadType || ent.userData?.type || '').toLowerCase();
        return ent.name?.startsWith('Surface_') || ent.name?.startsWith('CAD_Surface') || ct === 'surface_extrusion' || ct === 'surface_plane';
      })
      .map((ent, idx) => {
        ent.updateMatrixWorld?.(true);
        const box = new THREE.Box3().setFromObject(ent);
        const height = !box.isEmpty() ? Math.max(0.5, Number((box.max.y - box.min.y).toFixed(2))) : 20.0;
        const id = String(ent.uuid || ent.userData?.customId || ent.name || `surf_${idx}`);
        return { id, name: ent.name || `Surface ${idx + 1}`, height, box };
      });
  }, [customGeometry, isOpen]);

  const [selectedSurfaceIds, setSelectedSurfaceIds] = useState([]);

  const [params, setParams] = useState({
    toolId: 1,
    toolName: '10mm Flat Endmill',
    toolNumber: 1,
    lengthOffset: 1,
    headNumber: 0,
    diameterOffset: 1,
    toolDiameter: 10.0,
    cornerRadius: 0.0,
    spindleDirection: 'CW',
    feedRate: 1200.0,
    spindleSpeed: 6000,
    fpt: 0.05,
    cs: 188.5,
    plungeRate: 450.0,
    retractRate: 1000.0,
    rapidHeight: 15.0,
    forceToolChange: false,
    rapidRetract: true,
    comment: 'Surface Finish Contour - 3D Drive Surfaces'
  });

  const [surfaceParams, setSurfaceParams] = useState({
    stockToLeaveDrive: 0.0,
    stockToLeaveCheck: 0.5,
    totalTolerance: 0.025,
    maxStepdown: 2.0,
    totalDepth: 20.0
  });

  const [contourParams, setContourParams] = useState({
    direction: 'climb',
    contourSide: 'outside',
    rollAroundCorners: 'all',
    shallowCuts: true,
    shallowAngleLimitDeg: 45
  });

  const [pocketParams, setPocketParams] = useState({
    cutMethod: 'constant_overlap',
    stepoverPct: 45,
    direction: 'climb',
    finishWallPass: true,
    helicalEntry: true
  });

  useEffect(() => {
    if (!isOpen) return;
    const defaultIds = (Array.isArray(operation?.driveSurfaceIds) && operation.driveSurfaceIds.length > 0)
      ? operation.driveSurfaceIds.map(String)
      : detectedSurfaces.map((s) => s.id);
    setSelectedSurfaceIds(defaultIds);

    const maxSurfHeight = detectedSurfaces.length > 0
      ? Math.max(...detectedSurfaces.map((s) => s.height))
      : 20.0;

    if (operation) {
      const sp = operation.surfaceParams || {};
      const cp = operation.contourParams || {};
      const pp = operation.pocketParams || {};
      const idx = tools.findIndex((t) => t.id === operation.toolId);
      setSelectedToolIndex(idx >= 0 ? idx : 0);
      setParams((prev) => ({
        ...prev,
        toolId: operation.toolId || 1,
        toolName: operation.toolName || operation.tool?.name || prev.toolName,
        toolNumber: operation.toolNumber || operation.tool?.number || 1,
        toolDiameter: operation.toolDiameter || operation.tool?.diameter || 10.0,
        feedRate: operation.feedRate || 1200.0,
        spindleSpeed: operation.spindleSpeed || operation.tool?.rpm || 6000,
        plungeRate: operation.plungeFeedRate || operation.plungeRate || 450.0,
        retractRate: operation.retractRate || 1000.0,
        rapidHeight: operation.rapidHeight || 15.0,
        comment: operation.comment || operation.name || ''
      }));
      setSurfaceParams({
        stockToLeaveDrive: Number(sp.stockToLeaveDrive ?? operation.stockToLeaveXY) || 0.0,
        stockToLeaveCheck: Number(sp.stockToLeaveCheck) || 0.5,
        totalTolerance: Number(sp.totalTolerance) || 0.025,
        maxStepdown: Number(sp.maxStepdown ?? operation.stepdown) || 2.0,
        totalDepth: Number(operation.totalDepth ?? sp.totalDepth) || maxSurfHeight
      });
      setContourParams({
        direction: cp.direction || operation.cuttingDirection || 'climb',
        contourSide: cp.contourSide || operation.contourSide || 'outside',
        rollAroundCorners: cp.rollAroundCorners || operation.rollAroundCorners || 'all',
        shallowCuts: cp.shallowCuts ?? true,
        shallowAngleLimitDeg: cp.shallowAngleLimitDeg ?? 45
      });
      setPocketParams({
        cutMethod: pp.cutMethod || operation.cutStyle || 'constant_overlap',
        stepoverPct: Number(pp.stepoverPct ?? operation.stepoverPct) || 45,
        direction: pp.direction || operation.cuttingDirection || 'climb',
        finishWallPass: pp.finishWallPass !== false,
        helicalEntry: pp.helicalEntry !== false
      });
    } else {
      const t = tools[0] || { id: 1, number: 1, name: '10mm Flat Endmill', diameter: 10, rpm: 6000, feedRate: 1200, plungeRate: 450 };
      setSelectedToolIndex(0);
      setParams((prev) => ({
        ...prev,
        toolId: t.id || 1,
        toolName: t.name,
        toolNumber: t.number || 1,
        lengthOffset: t.number || 1,
        diameterOffset: t.number || 1,
        toolDiameter: t.diameter || 10.0,
        feedRate: t.feedRate || 1200.0,
        spindleSpeed: t.rpm || t.spindleSpeed || 6000,
        plungeRate: t.plungeRate || 450.0,
        comment: isPocket ? 'Surface Finish Pocket - 3D Drive Surfaces' : 'Surface Finish Contour - 3D Drive Surfaces'
      }));
      setSurfaceParams((prev) => ({
        ...prev,
        totalDepth: maxSurfHeight
      }));
    }
  }, [isOpen, operation, tools, detectedSurfaces, isPocket]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApply = () => {
    const activeSurfaces = detectedSurfaces.filter((s) => selectedSurfaceIds.includes(s.id));
    let combinedBox = null;
    if (activeSurfaces.length > 0) {
      combinedBox = new THREE.Box3();
      activeSurfaces.forEach((s) => {
        if (s.box && !s.box.isEmpty()) combinedBox.union(s.box);
      });
    }

    const opTitle = isPocket ? 'Surface Finish Pocket' : 'Surface Finish Contour';
    const updatedOp = {
      ...(operation || {}),
      name: operation?.name || opTitle,
      type: isPocket ? 'surface_finish_pocket' : 'surface_finish_contour',
      strategyKey: isPocket ? 'surface_finish_pocket' : 'surface_finish_contour',
      badgeClass: isPocket ? 'pocket' : 'contour',
      badgeText: isPocket ? 'SP' : 'SC',
      toolId: Number(params.toolId) || 1,
      toolName: params.toolName,
      toolNumber: Number(params.toolNumber),
      toolDiameter: Number(params.toolDiameter),
      feedRate: Number(params.feedRate),
      spindleSpeed: Number(params.spindleSpeed),
      plungeRate: Number(params.plungeRate),
      plungeFeedRate: Number(params.plungeRate),
      retractRate: Number(params.retractRate),
      rapidHeight: Number(params.rapidHeight) || 15.0,
      stepdown: Number(surfaceParams.maxStepdown) || 2.0,
      totalDepth: Number(surfaceParams.totalDepth) || 20.0,
      stockToLeaveXY: Number(surfaceParams.stockToLeaveDrive) || 0.0,
      stockToLeaveZ: 0.0,
      cuttingDirection: isPocket ? pocketParams.direction : contourParams.direction,
      contourSide: contourParams.contourSide,
      cutStyle: pocketParams.cutMethod,
      stepoverPct: Number(pocketParams.stepoverPct) || 45,
      driveSurfaceIds: selectedSurfaceIds,
      usesCustomSurfaces: true,
      bounds: combinedBox && !combinedBox.isEmpty() ? combinedBox : (operation?.bounds || null),
      comment: params.comment,
      surfaceParams: { ...surfaceParams, driveSurfacesCount: activeSurfaces.length },
      contourParams: { ...contourParams },
      pocketParams: { ...pocketParams }
    };

    if (onSaveOperation) {
      onSaveOperation(updatedOp);
    }
    if (onNotify) {
      onNotify(`Applied "${updatedOp.name}" across ${activeSurfaces.length || 'active'} drive surface(s)`, 'success');
    }
    onClose();
  };

  if (!isOpen) return null;

  // Classic Mastercam Yellow Input Style
  const yellowInputStyle = {
    padding: '3px 6px',
    background: '#ffffdd',
    border: '1px solid #ca8a04',
    borderRadius: '2px',
    fontSize: '11.5px',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'monospace',
    fontWeight: 500
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '780px',
          background: '#f1f5f9',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid #717b87',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar with Mastercam Red Close Box (Image 3) */}
        <div
          style={{
            height: '30px',
            background: '#ffffff',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0 0 12px',
            fontSize: '12px',
            color: '#1e293b'
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {isPocket ? 'Surface Finish Pocket' : 'Surface Finish Contour'}
          </span>
          <button
            onClick={onClose}
            style={{
              width: '42px',
              height: '30px',
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close (Esc)"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Top 3 Navigation Tabs */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderBottom: '1px solid #cbd5e1', padding: '4px 8px 0 8px', gap: '4px' }}>
          {[
            { id: 'toolpath_params', label: 'Toolpath parameters' },
            { id: 'surface_params', label: 'Surface parameters' },
            { id: 'finish_contour_params', label: isPocket ? 'Finish pocket parameters' : 'Finish contour parameters' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderTop: isActive ? '2px solid #0f5a9e' : '1px solid transparent',
                  borderLeft: '1px solid #cbd5e1',
                  borderRight: '1px solid #cbd5e1',
                  borderBottom: isActive ? '1px solid #ffffff' : '1px solid #cbd5e1',
                  background: isActive ? '#ffffff' : '#f1f5f9',
                  color: isActive ? '#0f172a' : '#64748b',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  marginBottom: '-1px'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1 Content: Toolpath Parameters (Exact match to Image 3) */}
        {activeTab === 'toolpath_params' && (
          <div style={{ background: '#ffffff', padding: '16px', display: 'flex', gap: '16px' }}>
            
            {/* Left Column: Tool Table & Filter */}
            <div style={{ width: '310px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '260px', border: '1px solid #94a3b8', background: '#ffffff', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '4px 6px', width: '25px' }}>#</th>
                      <th style={{ padding: '4px 6px', width: '80px' }}>Assembly N...</th>
                      <th style={{ padding: '4px 6px' }}>Tool Name</th>
                      <th style={{ padding: '4px 6px', width: '60px' }}>Holder T...</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tools.length > 0 ? tools : [
                      { id: 1, number: 1, assembly: '--', name: '51 Flat Endmill', holder: 'BT40-ER32' },
                      { id: 2, number: 2, assembly: '--', name: '12 Flat Endmill', holder: 'BT40-ER32' },
                      { id: 3, number: 3, assembly: '--', name: '10 Ball Endmill', holder: 'BT40-ER25' },
                      { id: 4, number: 4, assembly: '--', name: '8.5 Twist Drill', holder: 'BT40-Collet' }
                    ]).map((t, idx) => {
                      const isSel = selectedToolIndex === idx;
                      return (
                        <tr
                          key={t.id || idx}
                          onClick={() => {
                            setSelectedToolIndex(idx);
                            setParams((prev) => ({
                              ...prev,
                              toolId: t.id || idx + 1,
                              toolName: t.name,
                              toolNumber: t.number || idx + 1,
                              lengthOffset: t.number || idx + 1,
                              diameterOffset: t.number || idx + 1,
                              toolDiameter: t.diameter || 10,
                              feedRate: t.feedRate || 1200,
                              plungeRate: t.plungeRate || 450,
                              spindleSpeed: t.rpm || t.spindleSpeed || 6000
                            }));
                          }}
                          style={{
                            background: isSel ? '#0284c7' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            color: isSel ? '#ffffff' : '#1e293b',
                            cursor: 'pointer'
                          }}
                        >
                          <td style={{ padding: '4px 6px' }}>{t.number || idx + 1}</td>
                          <td style={{ padding: '4px 6px' }}>{t.assembly || '--'}</td>
                          <td style={{ padding: '4px 6px', fontWeight: 600 }}>{t.name}</td>
                          <td style={{ padding: '4px 6px' }}>{t.holder || 'BT40'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Below Table Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenDefineToolModal) onOpenDefineToolModal();
                  }}
                  style={{
                    padding: '4px 10px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  Select library tool...
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={false} /> Tool filter
                </label>
              </div>

              {/* Comment Box */}
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>Comment:</div>
                <textarea
                  value={params.comment}
                  onChange={(e) => setParams({ ...params, comment: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '2px', resize: 'none', outline: 'none' }}
                />
              </div>
            </div>

            {/* Right Column: Mastercam Yellow Parameters Form (Image 3) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
              
              {/* Tool Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '85px', color: '#334155' }}>Tool name:</span>
                <input
                  type="text"
                  value={params.toolName}
                  onChange={(e) => setParams({ ...params, toolName: e.target.value })}
                  style={{ flex: 1, padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11.5px', outline: 'none' }}
                />
              </div>

              {/* Numbers Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px', background: '#f8fafc', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Tool #:</span>
                  <input type="number" value={params.toolNumber} onChange={(e) => setParams({ ...params, toolNumber: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Length offset:</span>
                  <input type="number" value={params.lengthOffset} onChange={(e) => setParams({ ...params, lengthOffset: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Head #:</span>
                  <input type="number" value={params.headNumber} onChange={(e) => setParams({ ...params, headNumber: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Diameter offset:</span>
                  <input type="number" value={params.diameterOffset} onChange={(e) => setParams({ ...params, diameterOffset: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Tool diameter:</span>
                  <input type="number" step="0.1" value={params.toolDiameter} onChange={(e) => setParams({ ...params, toolDiameter: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Corner radius:</span>
                  <input type="number" step="0.1" value={params.cornerRadius} onChange={(e) => setParams({ ...params, cornerRadius: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
              </div>

              {/* Speeds & Feeds Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px', background: '#f8fafc', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button type="button" style={{ padding: '2px 8px', fontSize: '11px', background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer' }}>Coolant...</button>
                  <span style={{ color: '#059669', fontSize: '11px' }}>Flood (On)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Spindle direction:</span>
                  <select value={params.spindleDirection} onChange={(e) => setParams({ ...params, spindleDirection: e.target.value })} style={{ width: '70px', padding: '2px', fontSize: '11px' }}>
                    <option value="CW">CW</option>
                    <option value="CCW">CCW</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Feed rate:</span>
                  <input type="number" step="1" value={params.feedRate} onChange={(e) => setParams({ ...params, feedRate: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Spindle speed:</span>
                  <input type="number" step="50" value={params.spindleSpeed} onChange={(e) => setParams({ ...params, spindleSpeed: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>FPT:</span>
                  <input type="number" step="0.0001" value={params.fpt} onChange={(e) => setParams({ ...params, fpt: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>CS:</span>
                  <input type="number" step="1" value={params.cs} onChange={(e) => setParams({ ...params, cs: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Plunge rate:</span>
                  <input type="number" step="10" value={params.plungeRate} onChange={(e) => setParams({ ...params, plungeRate: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Retract rate:</span>
                  <input type="number" step="10" value={params.retractRate} onChange={(e) => setParams({ ...params, retractRate: Number(e.target.value) })} style={{ ...yellowInputStyle, width: '70px' }} />
                </div>
              </div>

              {/* Checkboxes */}
              <div style={{ display: 'flex', gap: '24px', padding: '4px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={params.forceToolChange}
                    onChange={(e) => setParams({ ...params, forceToolChange: e.target.checked })}
                  />
                  Force tool change
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={params.rapidRetract}
                    onChange={(e) => setParams({ ...params, rapidRetract: e.target.checked })}
                  />
                  Rapid retract
                </label>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Surface Parameters */}
        {activeTab === 'surface_params' && (
          <div style={{ background: '#ffffff', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#0f5a9e' }}>Drive & Check Surfaces Configuration</h3>

            <div style={{ border: '1px solid #cbd5e1', borderRadius: '3px', padding: '8px 10px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, color: '#334155', fontSize: '11.5px' }}>
                <span>Drive Surfaces ({selectedSurfaceIds.length} / {detectedSurfaces.length} selected)</span>
                <button
                  type="button"
                  onClick={() => setSelectedSurfaceIds(detectedSurfaces.map((s) => s.id))}
                  style={{ fontSize: '10.5px', padding: '1px 6px', border: '1px solid #94a3b8', background: '#ffffff', borderRadius: '2px', cursor: 'pointer' }}
                >
                  Select All
                </button>
              </div>
              {detectedSurfaces.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  No extruded surfaces found on Level 15 — will target active Solid / Stock boundaries.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '72px', overflowY: 'auto' }}>
                  {detectedSurfaces.map((surf) => {
                    const checked = selectedSurfaceIds.includes(surf.id);
                    return (
                      <label
                        key={surf.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          background: checked ? '#e0f2fe' : '#ffffff',
                          border: `1px solid ${checked ? '#0284c7' : '#cbd5e1'}`,
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSurfaceIds((prev) => [...prev, surf.id]);
                            } else {
                              setSelectedSurfaceIds((prev) => prev.filter((id) => id !== surf.id));
                            }
                          }}
                        />
                        <span>{surf.name}</span>
                        <span style={{ color: '#64748b', fontSize: '10px' }}>({surf.height}mm)</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Stock to leave on drive (mm):</label>
                <input type="number" step="0.05" value={surfaceParams.stockToLeaveDrive} onChange={(e) => setSurfaceParams({ ...surfaceParams, stockToLeaveDrive: Number(e.target.value) })} style={yellowInputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Total Cut Depth (mm):</label>
                <input type="number" step="1" min="0.1" value={surfaceParams.totalDepth} onChange={(e) => setSurfaceParams({ ...surfaceParams, totalDepth: Number(e.target.value) })} style={yellowInputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Maximum Stepdown (mm):</label>
                <input type="number" step="0.5" min="0.1" value={surfaceParams.maxStepdown} onChange={(e) => setSurfaceParams({ ...surfaceParams, maxStepdown: Number(e.target.value) })} style={yellowInputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Stock to leave on check (mm):</label>
                <input type="number" step="0.05" value={surfaceParams.stockToLeaveCheck} onChange={(e) => setSurfaceParams({ ...surfaceParams, stockToLeaveCheck: Number(e.target.value) })} style={yellowInputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Total Chordal Tolerance (mm):</label>
                <input type="number" step="0.005" value={surfaceParams.totalTolerance} onChange={(e) => setSurfaceParams({ ...surfaceParams, totalTolerance: Number(e.target.value) })} style={yellowInputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label>Clearance / Rapid Z (mm):</label>
                <input type="number" step="1" min="1" value={params.rapidHeight} onChange={(e) => setParams({ ...params, rapidHeight: Number(e.target.value) })} style={yellowInputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Finish Contour or Finish Pocket Parameters */}
        {activeTab === 'finish_contour_params' && (
          <div style={{ background: '#ffffff', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#0f5a9e' }}>
              {isPocket ? 'Finish Pocket Clearing Strategy' : 'Contour Wall Engagement Strategy'}
            </h3>

            {isPocket ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Pocket Cut Method:</label>
                  <select value={pocketParams.cutMethod} onChange={(e) => setPocketParams({ ...pocketParams, cutMethod: e.target.value })} style={{ padding: '4px', fontSize: '12px' }}>
                    <option value="constant_overlap">Constant Overlap Spiral</option>
                    <option value="parallel_spiral">Parallel Spiral</option>
                    <option value="zigzag">Zigzag Parallel Raster</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Stepover (% of Tool Diameter):</label>
                  <input type="number" step="5" min="5" max="90" value={pocketParams.stepoverPct} onChange={(e) => setPocketParams({ ...pocketParams, stepoverPct: Number(e.target.value) })} style={yellowInputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Cutting Direction:</label>
                  <select value={pocketParams.direction} onChange={(e) => setPocketParams({ ...pocketParams, direction: e.target.value })} style={{ padding: '4px', fontSize: '12px' }}>
                    <option value="climb">Climb Milling (Down Cut)</option>
                    <option value="conventional">Conventional Milling (Up Cut)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', paddingTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={pocketParams.helicalEntry} onChange={(e) => setPocketParams({ ...pocketParams, helicalEntry: e.target.checked })} />
                    Helical Ramp Plunge Entry
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={pocketParams.finishWallPass} onChange={(e) => setPocketParams({ ...pocketParams, finishWallPass: e.target.checked })} />
                    Final Finish Wall Spring Pass
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Cutting Direction:</label>
                  <select value={contourParams.direction} onChange={(e) => setContourParams({ ...contourParams, direction: e.target.value })} style={{ padding: '4px', fontSize: '12px' }}>
                    <option value="climb">Climb Milling (Down Cut)</option>
                    <option value="conventional">Conventional Milling (Up Cut)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Wall Offset Side:</label>
                  <select value={contourParams.contourSide} onChange={(e) => setContourParams({ ...contourParams, contourSide: e.target.value })} style={{ padding: '4px', fontSize: '12px' }}>
                    <option value="outside">Outside (External Boss / Wall)</option>
                    <option value="inside">Inside (Internal Cavity / Bore)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label>Corner Roll Rule:</label>
                  <select value={contourParams.rollAroundCorners} onChange={(e) => setContourParams({ ...contourParams, rollAroundCorners: e.target.value })} style={{ padding: '4px', fontSize: '12px' }}>
                    <option value="all">Roll around all sharp corners</option>
                    <option value="sharp">Sharp corners only</option>
                    <option value="none">None (G01 sharp decel)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Mastercam Function Buttons & OK / Cancel (Image 3) */}
        <div
          style={{
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px'
          }}
        >
          {/* Sub-functions row */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              "Axis Combo's (Default (1))",
              "Misc values...",
              "Tool display...",
              "Ref point...",
              "Planes..."
            ].map((btnLabel) => (
              <button
                key={btnLabel}
                type="button"
                onClick={() => {}}
                style={{
                  padding: '3px 8px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                {btnLabel}
              </button>
            ))}
          </div>

          {/* OK (Green Check), Cancel (Red Cross), Help (Blue Question) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleApply}
              style={{
                width: '32px',
                height: '26px',
                background: '#22c55e',
                border: '1px solid #16a34a',
                borderRadius: '3px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="OK / Apply Changes (Enter)"
            >
              <Check size={16} strokeWidth={3} />
            </button>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '26px',
                background: '#ef4444',
                border: '1px solid #dc2626',
                borderRadius: '3px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Cancel (Esc)"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <button
              onClick={() => alert("Mastercam Surface Finish Contour:\nCreates constant Z-depth planar contour passes across complex 3D drive surfaces.")}
              style={{
                width: '32px',
                height: '26px',
                background: '#0284c7',
                border: '1px solid #0369a1',
                borderRadius: '3px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Help"
            >
              <HelpCircle size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

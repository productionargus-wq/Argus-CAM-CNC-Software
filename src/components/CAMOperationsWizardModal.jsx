import React, { useState, useEffect, useRef } from 'react';
import {
  X, Layers, Play, RefreshCw, Scissors, Sparkles, CheckCircle2,
  ShieldAlert, Sliders, Clock, Gauge, Plus, Trash2, ArrowUp,
  ArrowDown, Disc, Wrench, AlertTriangle, FileCode
} from 'lucide-react';
import {
  calculateToolpathMetrics,
  checkToolpathCollisions
} from '../utils/toolpathEngine';

export default function CAMOperationsWizardModal({
  isOpen,
  onClose,
  initialTab = 'create',
  operations = [],
  tools = [],
  activeOpId,
  onSelectOp,
  onAddOperation,
  onUpdateOperation,
  onDeleteOperation,
  onRegenerateAll,
  onLaunchSimulation,
  onOpenGCodeViewer,
  partMetrics
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // New Operation Creation Form State
  const [strategy, setStrategy] = useState('pocket');
  const [opName, setOpName] = useState('2D High Speed Pocket');
  const [toolId, setToolId] = useState(tools[0]?.id || 1);
  const [stepoverPct, setStepoverPct] = useState(50);
  const [stepdown, setStepdown] = useState(4.0);
  const [totalDepth, setTotalDepth] = useState(15.0);
  const [stockToLeaveXY, setStockToLeaveXY] = useState(0.2);
  const [stockToLeaveZ, setStockToLeaveZ] = useState(0.0);
  const [rapidHeight, setRapidHeight] = useState(15.0);
  const [feedRate, setFeedRate] = useState(1500);
  const [spindleRpm, setSpindleRpm] = useState(6500);

  // Feedback Toast
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const notify = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Strategy presets
  const strategies = [
    {
      id: 'facing',
      name: 'Face Milling',
      badge: 'FM',
      color: '#3b82f6',
      desc: 'Top surface leveling with bidirectional raster & loop leads',
      defaultStepover: 65,
      defaultStepdown: 1.0,
      defaultDepth: 2.0,
      badgeClass: 'face'
    },
    {
      id: 'pocket',
      name: 'Dynamic Pocket',
      badge: 'PK',
      color: '#10b981',
      desc: 'High speed pocket clearing with center helical plunge entry',
      defaultStepover: 50,
      defaultStepdown: 4.0,
      defaultDepth: 15.0,
      badgeClass: 'pocket'
    },
    {
      id: 'waterline',
      name: '3D Waterline',
      badge: 'WL',
      color: '#f59e0b',
      desc: 'Z-level surface contouring for vertical & steep walls',
      defaultStepover: 20,
      defaultStepdown: 2.0,
      defaultDepth: 25.0,
      badgeClass: 'contour'
    },
    {
      id: 'adaptive',
      name: 'Adaptive Roughing',
      badge: 'AD',
      color: '#06b6d4',
      desc: 'Constant tool engagement trochoidal milling for deep cavities',
      defaultStepover: 25,
      defaultStepdown: 8.0,
      defaultDepth: 24.0,
      badgeClass: 'adaptive'
    },
    {
      id: 'swarf',
      name: '5-Axis Swarf',
      badge: '5X',
      color: '#8b5cf6',
      desc: 'Simultaneous 5-axis flank milling along curved impeller blades',
      defaultStepover: 35,
      defaultStepdown: 3.0,
      defaultDepth: 18.0,
      badgeClass: 'swarf'
    },
    {
      id: 'drilling',
      name: 'Peck Drill',
      badge: 'DR',
      color: '#ef4444',
      desc: 'G83 deep hole chip-breaking peck drilling cycle',
      defaultStepover: 0,
      defaultStepdown: 4.0,
      defaultDepth: 20.0,
      badgeClass: 'drill'
    },
    {
      id: 'chamfer',
      name: 'Chamfer & Deburr',
      badge: 'CH',
      color: '#ec4899',
      desc: '45-degree edge break & sharp corner deburring perimeter',
      defaultStepover: 10,
      defaultStepdown: 1.0,
      defaultDepth: 1.0,
      badgeClass: 'chamfer'
    }
  ];

  const handleSelectStrategy = (strat) => {
    setStrategy(strat.id);
    setOpName(`${strat.name} Pass ${operations.length + 1}`);
    setStepoverPct(strat.defaultStepover);
    setStepdown(strat.defaultStepdown);
    setTotalDepth(strat.defaultDepth);
  };

  const handleCreateOperation = () => {
    const selectedStrat = strategies.find((s) => s.id === strategy) || strategies[1];
    const assignedTool = tools.find((t) => t.id === Number(toolId)) || tools[0];

    const nextId = operations.length > 0 ? Math.max(...operations.map((o) => o.id)) + 1 : 1;
    const newOp = {
      id: nextId,
      name: opName || `${selectedStrat.name} ${nextId}`,
      toolId: Number(toolId),
      toolName: assignedTool ? `T${assignedTool.number} - ${assignedTool.name}` : 'T1 - Endmill',
      badgeClass: selectedStrat.badgeClass,
      badgeText: selectedStrat.badge,
      visible: true,
      stepoverPct: Number(stepoverPct),
      stepdown: Number(stepdown),
      totalDepth: Number(totalDepth),
      stockToLeaveXY: Number(stockToLeaveXY),
      stockToLeaveZ: Number(stockToLeaveZ),
      rapidHeight: Number(rapidHeight),
      feedRate: Number(feedRate),
      spindleRpm: Number(spindleRpm)
    };

    if (onAddOperation) {
      onAddOperation(newOp);
    }
    notify(`Added ${newOp.name} to CNC operations tree!`);
    setActiveTab('manager');
  };

  // Run collision check
  const collisionIssues = checkToolpathCollisions(operations, tools);

  // Compute total cycle time and metrics
  const totalCuttingTimeMinutes = operations.reduce((acc, op) => {
    const assignedTool = tools.find((t) => t.id === op.toolId) || { diameter: 10 };
    const depth = Number(op.totalDepth || op.stepdown || 10);
    const passes = Math.max(1, Math.ceil(depth / (op.stepdown || 2)));
    const perimeterMm = partMetrics ? (partMetrics.dimensions.x + partMetrics.dimensions.z) * 2 : 250;
    const estimatedDistance = perimeterMm * passes * 1.5;
    const opFeed = op.feedRate || 1200;
    return acc + (estimatedDistance / opFeed);
  }, 0);

  const totalMin = Math.floor(totalCuttingTimeMinutes);
  const totalSec = Math.round((totalCuttingTimeMinutes - totalMin) * 60);
  const formattedTotalTime = `${totalMin}m ${totalSec.toString().padStart(2, '0')}s`;

  return (
    <dialog
      ref={dialogRef}
      className="argus-modal-dialog"
      onClick={handleBackdropClick}
      style={{
        maxWidth: '880px',
        width: '94vw',
        background: '#141824',
        border: '1px solid #2a3449',
        borderRadius: '10px',
        color: '#e2e8f0',
        padding: 0,
        boxShadow: '0 25px 65px rgba(0,0,0,0.75)'
      }}
    >
      {/* Header */}
      <div className="modal-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #232c3d',
        background: '#0f131d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={22} color="#10b981" />
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
              Mastercam CAM Operations Manager &bull; Toolpath Suite
            </h2>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              2.5D, 3D &amp; 5-Axis Milling Cycles &bull; Collision &amp; Gouge Verification &bull; Cycle Times
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #232c3d',
        background: '#111522',
        padding: '0 16px'
      }}>
        {[
          { id: 'create', label: 'Create Operation', icon: Plus },
          { id: 'manager', label: `Operations Sequence (${operations.length})`, icon: Layers },
          { id: 'safety', label: `Collision Safety (${collisionIssues.length})`, icon: ShieldAlert, alert: collisionIssues.length > 0 },
          { id: 'metrics', label: 'Cycle Time & MRR', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 16px',
                border: 'none',
                background: 'transparent',
                color: tab.alert ? '#f59e0b' : isActive ? '#10b981' : '#94a3b8',
                borderBottom: isActive ? '2px solid #10b981' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} color={tab.alert ? '#f59e0b' : isActive ? '#10b981' : '#94a3b8'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={15} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Body Content */}
      <div style={{ padding: '20px', maxHeight: '550px', overflowY: 'auto' }}>
        {/* ================= TAB 1: CREATE OPERATION ================= */}
        {activeTab === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Strategy Selector Grid */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                1. Select Milling Strategy:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {strategies.map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => handleSelectStrategy(strat)}
                    style={{
                      padding: '12px 10px',
                      background: strategy === strat.id ? 'rgba(16, 185, 129, 0.15)' : '#161b29',
                      border: strategy === strat.id ? '1px solid #10b981' : '1px solid #283347',
                      color: strategy === strat.id ? '#34d399' : '#cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        background: strat.color,
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {strat.badge}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '12px' }}>{strat.name}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1.3 }}>{strat.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Left Column: Tool & Identity */}
              <div style={{ background: '#10141f', padding: '16px', borderRadius: '8px', border: '1px solid #1f2738', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>
                  Operation Identity &amp; Tool Setup
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Operation Name:
                  </label>
                  <input
                    type="text"
                    value={opName}
                    onChange={(e) => setOpName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#161b29',
                      border: '1px solid #283347',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    Assigned Shop Tool:
                  </label>
                  <select
                    value={toolId}
                    onChange={(e) => setToolId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#161b29',
                      border: '1px solid #283347',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    {tools.map((t) => (
                      <option key={t.id} value={t.id}>
                        T{t.number} - {t.name} (&Oslash;{t.diameter}mm &bull; {t.flutes}F &bull; {t.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Cutting Feed (mm/min):
                    </label>
                    <input
                      type="number"
                      value={feedRate}
                      onChange={(e) => setFeedRate(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Spindle Speed (RPM):
                    </label>
                    <input
                      type="number"
                      value={spindleRpm}
                      onChange={(e) => setSpindleRpm(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Depths & Stepover */}
              <div style={{ background: '#10141f', padding: '16px', borderRadius: '8px', border: '1px solid #1f2738', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b' }}>
                  Cut Depths &amp; Stepover Geometry
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Stepover % (Ae):
                    </label>
                    <input
                      type="number"
                      value={stepoverPct}
                      onChange={(e) => setStepoverPct(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Stepdown Depth (Ap mm):
                    </label>
                    <input
                      type="number"
                      value={stepdown}
                      onChange={(e) => setStepdown(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Total Depth (Z mm):
                    </label>
                    <input
                      type="number"
                      value={totalDepth}
                      onChange={(e) => setTotalDepth(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Rapid Clearance Z (mm):
                    </label>
                    <input
                      type="number"
                      value={rapidHeight}
                      onChange={(e) => setRapidHeight(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Stock to Leave XY (mm):
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={stockToLeaveXY}
                      onChange={(e) => setStockToLeaveXY(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                      Stock to Leave Floor Z (mm):
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={stockToLeaveZ}
                      onChange={(e) => setStockToLeaveZ(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleCreateOperation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                <span>Add Operation &amp; Generate Toolpath</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: OPERATIONS MANAGER SEQUENCE ================= */}
        {activeTab === 'manager' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Active Machining Sequence ({operations.length} Passes programmed):
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (onRegenerateAll) onRegenerateAll();
                    notify("Regenerated all active operations toolpaths in 3D viewport!");
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#34d399',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Regenerate All</span>
                </button>
                <button
                  onClick={onLaunchSimulation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Play size={13} />
                  <span>Simulate Toolpaths</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {operations.map((op, idx) => {
                const assignedTool = tools.find((t) => t.id === op.toolId) || tools[0];
                const isSelected = op.id === activeOpId;
                return (
                  <div
                    key={op.id}
                    onClick={() => onSelectOp && onSelectOp(op.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#161b29',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid #283347',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, width: '20px' }}>
                        #{idx + 1}
                      </span>
                      <div style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        fontWeight: 800,
                        fontSize: '10px',
                        color: '#38bdf8'
                      }}>
                        {op.badgeText || 'OP'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#f8fafc' }}>
                          {op.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {op.toolName || `T${assignedTool?.number || 1}`} &bull; Stepdown: {op.stepdown || 2}mm &bull; Stepover: {op.stepoverPct || 50}% &bull; Depth: {op.totalDepth || 10}mm
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeleteOperation) onDeleteOperation(op.id);
                          notify(`Deleted operation ${op.name}`);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Delete Operation"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: COLLISION & GOUGE DETECTION ================= */}
        {activeTab === 'safety' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: collisionIssues.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: collisionIssues.length > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {collisionIssues.length > 0 ? (
                <AlertTriangle size={24} color="#ef4444" />
              ) : (
                <CheckCircle2 size={24} color="#10b981" />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: collisionIssues.length > 0 ? '#ef4444' : '#10b981' }}>
                  {collisionIssues.length > 0
                    ? `${collisionIssues.length} Potential Safety &amp; Gouge Warnings Detected`
                    : 'All Operations Passed Tool &amp; Holder Clearance Inspection'}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Verifies tool flute stickout, spindle collet collision envelope, excessive radial engagement chatter, and rapid Z plunge clearance.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {collisionIssues.map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#161b29',
                    border: issue.type === 'danger' ? '1px solid #ef4444' : '1px solid #f59e0b',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: issue.type === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                    color: issue.type === 'danger' ? '#f87171' : '#fbbf24',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    {issue.severity}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: '#f8fafc' }}>
                      {issue.title} &bull; <span style={{ color: '#94a3b8' }}>{issue.opName}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                      {issue.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: CYCLE TIME & MRR ================= */}
        {activeTab === 'metrics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: '#10141f', padding: '14px', borderRadius: '8px', border: '1px solid #1f2738' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Machining Runtime:</span>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                  {formattedTotalTime}
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>At 100% feed override</span>
              </div>

              <div style={{ background: '#10141f', padding: '14px', borderRadius: '8px', border: '1px solid #1f2738' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Programmed Passes:</span>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  {operations.length} Cycles
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Full 5-axis DMG MORI cycle</span>
              </div>

              <div style={{ background: '#10141f', padding: '14px', borderRadius: '8px', border: '1px solid #1f2738' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>G-Code Block Count:</span>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {(operations.length * 480).toLocaleString()} Lines
                </div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>ISO/DIN 66025 CNC output</span>
              </div>
            </div>

            {/* Operations Breakdown Table */}
            <div style={{ background: '#10141f', borderRadius: '8px', border: '1px solid #1f2738', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#161b29', borderBottom: '1px solid #283347', color: '#94a3b8' }}>
                    <th style={{ padding: '8px 12px' }}>#</th>
                    <th style={{ padding: '8px 12px' }}>Operation</th>
                    <th style={{ padding: '8px 12px' }}>Tool</th>
                    <th style={{ padding: '8px 12px' }}>Stepdown</th>
                    <th style={{ padding: '8px 12px' }}>Stepover</th>
                    <th style={{ padding: '8px 12px' }}>Feed</th>
                    <th style={{ padding: '8px 12px' }}>Est. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((op, idx) => {
                    const assignedTool = tools.find((t) => t.id === op.toolId) || tools[0];
                    return (
                      <tr key={op.id} style={{ borderBottom: '1px solid #1c2332', color: '#cbd5e1' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f8fafc' }}>{op.name}</td>
                        <td style={{ padding: '8px 12px' }}>{assignedTool ? `T${assignedTool.number} (\u00D8${assignedTool.diameter})` : 'T1'}</td>
                        <td style={{ padding: '8px 12px' }}>{op.stepdown || 2} mm</td>
                        <td style={{ padding: '8px 12px' }}>{op.stepoverPct || 50}%</td>
                        <td style={{ padding: '8px 12px' }}>{op.feedRate || 1200} mm/min</td>
                        <td style={{ padding: '8px 12px', color: '#38bdf8', fontWeight: 600 }}>
                          {(1.2 * (op.stepdown || 2)).toFixed(1)}m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderTop: '1px solid #232c3d',
        background: '#0f131d'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onOpenGCodeViewer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <FileCode size={13} />
            <span>View G-Code Program</span>
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '7px 20px',
            background: '#2563eb',
            border: 'none',
            borderRadius: '5px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Done
        </button>
      </div>
    </dialog>
  );
}

import React, { useState } from 'react';
import {
  FolderTree, CheckSquare, Square, Eye, RefreshCw, 
  Trash2, Lock, FileCode, PlusCircle, ChevronDown, ChevronRight, Sliders,
  Layers, Box, Compass, Check, Plus
} from 'lucide-react';

export default function OperationsTree({
  operations,
  onToggleOp,
  activeOpId,
  onSelectOp,
  onEditOp,
  onAddOp,
  onRegenerate,
  onOpenStockModal,
  activeManagerTab = 'Toolpaths',
  onSelectManagerTab,
  levels = [],
  onToggleLevel,
  activeLevelId = 1,
  onSetActiveLevel,
  onAddLevel,
  activePlane = 'Top (G17)',
  onSelectPlane
}) {
  const [localTab, setLocalTab] = useState(activeManagerTab);
  const [groupExpanded, setGroupExpanded] = useState(true);

  const currentTab = activeManagerTab || localTab;

  const handleTabClick = (tab) => {
    setLocalTab(tab);
    if (onSelectManagerTab) onSelectManagerTab(tab);
  };

  const tabs = ['Toolpaths', 'Levels', 'Solids', 'Planes'];

  const planesList = [
    { name: 'Top (G17)', code: 'G17', desc: 'Spindle along Z, XY Table', active: true },
    { name: 'Front (G18)', code: 'G18', desc: 'Spindle along Y, XZ Plane' },
    { name: 'Right (G19)', code: 'G19', desc: 'Spindle along X, YZ Plane' },
    { name: 'Isometric (WCS G54)', code: 'G54', desc: '3D Angled Reference' },
    { name: 'Bottom (Inverted)', code: 'G17-B', desc: 'Sub-spindle / 2nd Op' }
  ];

  return (
    <aside className="ops-manager" aria-label="Operations Manager">
      {/* Title */}
      <div className="ops-manager-header">
        <span style={{ fontWeight: 700, color: '#f8fafc' }}>
          {currentTab === 'Toolpaths' && 'Toolpaths Manager'}
          {currentTab === 'Levels' && 'Levels / Layers Manager'}
          {currentTab === 'Solids' && 'Solids Tree Manager'}
          {currentTab === 'Planes' && 'WCS & CPlanes Manager'}
        </span>

        {currentTab === 'Toolpaths' && (
          <button
            onClick={onAddOp}
            className="btn-secondary"
            style={{ padding: '2px 6px', fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '3px' }}
            title="Add New CAM Operation"
          >
            <PlusCircle size={11} color="#38bdf8" />
            <span>New Op</span>
          </button>
        )}

        {currentTab === 'Levels' && (
          <button
            onClick={onAddLevel}
            className="btn-secondary"
            style={{ padding: '2px 6px', fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '3px' }}
            title="Create New Level"
          >
            <Plus size={11} color="#10b981" />
            <span>New Level</span>
          </button>
        )}
      </div>

      {/* Manager Navigation Tabs */}
      <div className="ops-manager-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`ops-tab-btn ${currentTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================= 1. TOOLPATHS TAB ================= */}
      {currentTab === 'Toolpaths' && (
        <>
          {/* Operations Action Bar */}
          <div className="ops-toolbar">
            <button className="ops-tool-btn" title="Regenerate All Dirty Operations" onClick={onRegenerate}>
              <RefreshCw size={13} color="#f59e0b" />
            </button>
            <button className="ops-tool-btn" title="Toggle Toolpath Display" onClick={onRegenerate}>
              <Eye size={13} color="#38bdf8" />
            </button>
            <button className="ops-tool-btn" title="Lock/Unlock Operations">
              <Lock size={13} color="#94a3b8" />
            </button>
            <button className="ops-tool-btn" title="Configure Stock" onClick={onOpenStockModal}>
              <Sliders size={13} color="#a855f7" />
            </button>
          </div>

          {/* Tree Content */}
          <div className="ops-tree-content">
            <div className="tree-node-group">
              {/* Machine Group 1 */}
              <div className="tree-header-item" onClick={() => setGroupExpanded(!groupExpanded)}>
                {groupExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <FolderTree size={14} color="#60a5fa" />
                <span style={{ fontSize: '11px' }}>Maschinengruppe-1 (DMU 50)</span>
              </div>

              {groupExpanded && (
                <div className="tree-sub-list">
                  {/* Properties / Stock Setup */}
                  <div
                    className="tree-op-item"
                    style={{ color: '#94a3b8', fontSize: '10.5px' }}
                    onClick={onOpenStockModal}
                    title="Click to edit Stock Setup"
                  >
                    <div className="op-left">
                      <span>⚙ Properties - Stock Setup</span>
                    </div>
                    <span className="op-badge" style={{ color: '#f59e0b' }}>[Configure]</span>
                  </div>

                  {/* Toolpaths list */}
                  {operations.map((op) => (
                    <div
                      key={op.id}
                      className={`tree-op-item ${activeOpId === op.id ? 'active' : ''}`}
                      onClick={() => onSelectOp(op.id)}
                      onDoubleClick={() => onEditOp(op)}
                      title="Double-click to edit operation parameters"
                    >
                      <div className="op-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleOp(op.id);
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                          title="Toggle Visibility"
                        >
                          {op.visible ? (
                            <CheckSquare size={13} color="#38bdf8" />
                          ) : (
                            <Square size={13} color="#64748b" />
                          )}
                        </button>

                        <span className={`op-type-icon op-type-${op.badgeClass}`}>
                          {op.badgeText}
                        </span>

                        <span style={{ fontSize: '11px', color: op.visible ? '#f1f5f9' : '#64748b' }}>
                          {op.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="op-badge">{op.toolName || op.tool}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditOp(op);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                          title="Edit Parameters"
                        >
                          <Sliders size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= 2. LEVELS MANAGER TAB (Mastercam Level Tree) ================= */}
      {currentTab === 'Levels' && (
        <div className="ops-tree-content" style={{ padding: '4px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '20px 24px 1fr 34px',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#94a3b8',
            padding: '4px 6px',
            borderBottom: '1px solid #283344',
            background: '#131822'
          }}>
            <span>Vis</span>
            <span>#</span>
            <span>Level Name</span>
            <span>Ent</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {levels.map((lvl) => (
              <div
                key={lvl.id}
                onClick={() => onSetActiveLevel && onSetActiveLevel(lvl.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 24px 1fr 34px',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 6px',
                  background: lvl.active ? '#1e293b' : '#141822',
                  border: `1px solid ${lvl.active ? '#3b82f6' : 'transparent'}`,
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                {/* Visibility Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleLevel) onToggleLevel(lvl.id);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                  title="Toggle Level Visibility"
                >
                  {lvl.visible ? (
                    <CheckSquare size={13} color="#38bdf8" />
                  ) : (
                    <Square size={13} color="#64748b" />
                  )}
                </button>

                {/* Level Number */}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8', fontSize: '10.5px' }}>
                  {lvl.number}
                </span>

                {/* Level Name with color dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: lvl.color || '#38bdf8', flexShrink: 0 }} />
                  <span style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: lvl.visible ? '#f8fafc' : '#64748b',
                    fontWeight: lvl.active ? 700 : 500
                  }}>
                    {lvl.name}
                  </span>
                </div>

                {/* Entities Count */}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981', textAlign: 'right', fontSize: '10.5px' }}>
                  {lvl.entities}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '12px', padding: '8px', background: '#0e1218', borderRadius: '4px', border: '1px solid #1f2737', fontSize: '10px', color: '#94a3b8' }}>
            <div>Active Level: <strong style={{ color: '#38bdf8' }}>Level {levels.find((l) => l.active)?.number || 1}</strong></div>
            <div style={{ marginTop: '2px' }}>New CAD entities &amp; sketches are created on the active level.</div>
          </div>
        </div>
      )}

      {/* ================= 3. SOLIDS MANAGER TAB ================= */}
      {currentTab === 'Solids' && (
        <div className="ops-tree-content">
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
            ACTIVE SOLID BODIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ background: '#171b24', border: '1px solid #283344', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={14} color="#60a5fa" />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>Solid 1 - Finished Workpiece</div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Tessellated Manifold B-Rep</div>
              </div>
            </div>

            <div style={{ background: '#171b24', border: '1px solid #283344', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={14} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>Solid 2 - Raw Stock Billet</div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Bounding Allowance Block</div>
              </div>
            </div>

            <div style={{ background: '#171b24', border: '1px solid #283344', padding: '6px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={14} color="#94a3b8" />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc' }}>Solid 3 - ZeroClamp Fixture Vise</div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Centric Vise + Baseplate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. PLANES & WCS TAB ================= */}
      {currentTab === 'Planes' && (
        <div className="ops-tree-content">
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
            WORK COORDINATE SYSTEM (WCS) &amp; PLANES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {planesList.map((plane) => (
              <div
                key={plane.name}
                onClick={() => onSelectPlane && onSelectPlane(plane.name)}
                style={{
                  background: activePlane === plane.name ? '#1e293b' : '#141822',
                  border: `1px solid ${activePlane === plane.name ? '#3b82f6' : '#283344'}`,
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#f8fafc' }}>{plane.name}</span>
                  <span style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>[{plane.code}]</span>
                </div>
                <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>{plane.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

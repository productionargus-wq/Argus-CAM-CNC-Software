import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Command, Play, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

const ALL_MASTERCAM_COMMANDS = [
  // Home Tab
  { id: 'paste', name: 'Paste', category: 'Home > Clipboard', shortcut: 'Ctrl+V', desc: 'Paste copied entities or toolpaths from clipboard' },
  { id: 'cut', name: 'Cut', category: 'Home > Clipboard', shortcut: 'Ctrl+X', desc: 'Cut selected entities to clipboard' },
  { id: 'copy', name: 'Copy', category: 'Home > Clipboard', shortcut: 'Ctrl+C', desc: 'Copy selected entities to clipboard' },
  { id: 'copy_image', name: 'Copy Image', category: 'Home > Clipboard', shortcut: '', desc: 'Capture and copy 3D viewport canvas image to clipboard' },
  { id: 'delete_entities', name: 'Delete Entities', category: 'Home > Delete', shortcut: 'Del', desc: 'Delete selected geometry entities or operations' },
  { id: 'undelete', name: 'Undelete Entity', category: 'Home > Delete', shortcut: 'Ctrl+Z', desc: 'Restore recently deleted geometry' },
  { id: 'hide_unhide', name: 'Hide / Unhide', category: 'Home > Display', shortcut: 'Alt+E', desc: 'Isolate or invert visibility of selected entities' },
  { id: 'arc_center_points', name: 'Arc Center Points', category: 'Home > Display', shortcut: '', desc: 'Toggle arc and circle center points display' },
  { id: 'endpoints', name: 'Endpoints', category: 'Home > Display', shortcut: '', desc: 'Toggle curve endpoints indicator vertices' },
  { id: 'blank', name: 'Blank / Unblank', category: 'Home > Display', shortcut: '', desc: 'Blank selected entities or unblank hidden geometry' },
  { id: 'analyze_entity', name: 'Analyze Entity', category: 'Home > Analyze', shortcut: 'F4', desc: 'Analyze entity dimensions, type, coordinates and properties' },
  { id: 'analyze_distance', name: 'Analyze Distance', category: 'Home > Analyze', shortcut: '', desc: 'Measure distance, angle and delta XYZ between entities' },
  { id: 'analyze_toolpath', name: 'Analyze Toolpath', category: 'Home > Analyze', shortcut: '', desc: 'Analyze feed rates, cycle times and cutter path vectors' },
  { id: 'check_solid', name: 'Check Solid', category: 'Home > Analyze', shortcut: '', desc: 'Verify solid watertight integrity and manifold topology' },
  { id: '2d_area', name: '2D Area Calculation', category: 'Home > Analyze', shortcut: '', desc: 'Compute planar surface area and perimeter of enclosed curves' },
  { id: 'statistics', name: 'Statistics', category: 'Home > Analyze', shortcut: '', desc: 'Display geometry, entity counts, memory and database statistics' },
  { id: 'run_addin', name: 'Run Add-In', category: 'Home > Add-Ins', shortcut: 'Alt+C', desc: 'Execute Mastercam C-Hook, NET-Hook or external plugin' },

  // Wireframe
  { id: 'line_endpoints', name: 'Line Endpoints', category: 'Wireframe', shortcut: '', desc: 'Create 2D/3D lines between two points' },
  { id: 'circle_center_point', name: 'Circle Center Point', category: 'Wireframe', shortcut: '', desc: 'Create circle from center and radius' },
  { id: 'rectangle', name: 'Rectangle', category: 'Wireframe', shortcut: '', desc: 'Create planar rectangular wireframe boundary' },
  { id: 'curve_all_edges', name: 'Curve All Edges', category: 'Wireframe', shortcut: '', desc: 'Extract wireframe curves from all solid model edges' },

  // Surfaces & Solids
  { id: 'extrude_solid', name: 'Extrude Solid', category: 'Solids', shortcut: '', desc: 'Extrude closed wireframe chain into 3D solid' },
  { id: 'revolve_solid', name: 'Revolve Solid', category: 'Solids', shortcut: '', desc: 'Revolve wireframe cross-section around rotation axis' },
  { id: 'boolean_combine', name: 'Boolean Combine', category: 'Solids', shortcut: '', desc: 'Union, subtract, or intersect 3D solid bodies' },

  // Toolpaths
  { id: 'optirough', name: '3D OptiRough', category: 'Toolpaths > 3D', shortcut: '', desc: 'Dynamic high-speed constant engagement 3D roughing' },
  { id: 'surface_finish_flowline', name: 'Surface Finish Flowline', category: 'Toolpaths > 3D', shortcut: '', desc: '3D surface finish flowline machining across selected solid faces & surfaces' },
  { id: 'surface_finish_contour', name: 'Surface Finish Contour', category: 'Toolpaths > 3D', shortcut: '', desc: '3D semi-finishing and finishing waterline contour passes' },
  { id: 'surface_finish_pocket', name: 'Surface Finish Pocket', category: 'Toolpaths > 3D', shortcut: '', desc: '3D surface finish pocketing across extruded/drive surfaces' },
  { id: 'contour_2d', name: '2D Contour', category: 'Toolpaths > 2D', shortcut: '', desc: 'Profile milling along open or closed 2D chains' },
  { id: 'pocket_2d', name: '2D Pocket', category: 'Toolpaths > 2D', shortcut: '', desc: 'Zigzag, spiral, or true spiral pocket milling' },
  { id: 'drill_cycle', name: 'Hole Drilling', category: 'Toolpaths > 2D', shortcut: '', desc: 'Canned drilling, pecking (G83), and tapping cycles' },
  { id: 'define_tool', name: 'Define Tool Wizard', category: 'Toolpaths > Utilities', shortcut: '', desc: 'Interactive 3-step wizard to create custom milling and drilling tools' },
  { id: 'verify_solid', name: 'Verify Solid', category: 'Toolpaths > Verify', shortcut: '', desc: 'Simulate material removal against 3D stock billet' }
];

export default function CommandFinderModal({
  isOpen,
  onClose,
  onExecuteCommand
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCommands = ALL_MASTERCAM_COMMANDS.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.desc.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredCommands.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleRun(filteredCommands[selectedIndex]);
      }
    }
  };

  const handleRun = (cmd) => {
    onClose();
    if (onExecuteCommand) {
      onExecuteCommand(cmd.id);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '640px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            gap: '10px'
          }}
        >
          <Search size={20} color="#0284c7" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all Mastercam Ribbon commands, shortcuts, or functions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: '#0f172a',
              backgroundColor: 'transparent'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 600
            }}
          >
            <span>ESC to close</span>
          </div>
        </div>

        {/* Command List */}
        <div
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px'
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
              <Command size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>No commands found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try searching for "paste", "toolpath", "statistics", or "analyze"</div>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => handleRun(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
                    border: isSelected ? '1px solid #bae6fd' : '1px solid transparent',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#0284c7' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Sparkles size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{cmd.name}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#64748b'
                          }}
                        >
                          {cmd.category}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: '#64748b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px'
                        }}
                      >
                        {cmd.desc}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                    {cmd.shortcut && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#475569'
                        }}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                    {isSelected && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#0284c7',
                          fontWeight: 600
                        }}
                      >
                        <span>Run</span>
                        <CornerDownLeft size={12} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#64748b'
          }}
        >
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span style={{ fontWeight: 600, color: '#0284c7' }}>Mastercam 2018 Command Finder</span>
        </div>
      </div>
    </div>
  );
}

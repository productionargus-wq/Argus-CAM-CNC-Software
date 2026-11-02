import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MousePointer, Square, Circle, Minus, Type, CircleDot,
  Grid, ZoomIn, ZoomOut, Maximize2, Trash2, Copy,
  ArrowUpRight, Play, Download, Sparkles, Layers,
  Compass, Scissors, ShieldAlert, CheckCircle2, ChevronRight,
  Sliders, Box, RefreshCw, Undo2, Hexagon
} from 'lucide-react';
import {
  screenToBoard,
  boardToScreen,
  createBoardRect,
  createBoardCircle,
  createBoardDrillHole,
  createBoardDrillGrid,
  createBoardBoltPattern,
  createBoardText,
  createBoardPolygon,
  createBoardPolyline,
  applyDogboneFillets,
  getCADTemplate,
  exportBoardToSVG
} from '../utils/cncBoardEngine';

export default function CNCDesignBoard({
  boardShapes = [],
  onUpdateShapes,
  onGenerateToolpaths,
  onSwitchTo3D,
  stockConfig = { dimensions: { x: 200, y: 150, z: 25 } },
  theme = 'dark'
}) {
  // Board setup (in millimeters)
  const [boardW, setBoardW] = useState(stockConfig?.dimensions?.x || 200);
  const [boardH, setBoardH] = useState(stockConfig?.dimensions?.y || 150);
  const [boardThickness, setBoardThickness] = useState(stockConfig?.dimensions?.z || 20);
  const [material, setMaterial] = useState('Alu 6061-T6');
  const [originLocation, setOriginLocation] = useState('bottom-left'); // 'bottom-left' | 'center' | 'top-left'

  // Canvas Viewport Pan & Zoom
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [zoom, setZoom] = useState(2.2); // px per mm
  const [gridSnap, setGridSnap] = useState(true);
  const [gridStep, setGridStep] = useState(5.0); // mm

  // Active Tool & Selection
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'rect' | 'circle' | 'line' | 'text' | 'drill' | 'polygon'
  const [selectedId, setSelectedId] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Mouse interaction state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  // Sync board dimensions with stock config if changed
  useEffect(() => {
    if (stockConfig?.dimensions?.x) setBoardW(stockConfig.dimensions.x);
    if (stockConfig?.dimensions?.y) setBoardH(stockConfig.dimensions.y);
    if (stockConfig?.dimensions?.z) setBoardThickness(stockConfig.dimensions.z);
  }, [stockConfig]);

  // Selected Shape
  const selectedShape = boardShapes.find((s) => s.id === selectedId) || null;

  // Snap to grid helper
  const snapVal = (val, step) => {
    if (!gridSnap) return Math.round(val * 10) / 10;
    return Math.round(val / step) * step;
  };

  // 1. Mouse Event Handlers
  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Pan with Middle Click or Right Click or Space+LeftClick
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: mouseX - pan.x, y: mouseY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Only left-click draws or selects

    const bPos = screenToBoard(mouseX, mouseY, pan, zoom, boardW, boardH, originLocation);
    const snappedX = snapVal(bPos.x, gridStep);
    const snappedY = snapVal(bPos.y, gridStep);

    if (activeTool === 'select') {
      // Find clicked shape (hit testing)
      let hit = null;
      for (let i = boardShapes.length - 1; i >= 0; i--) {
        const s = boardShapes[i];
        if (!s.visible) continue;

        if (s.type === 'rect') {
          if (bPos.x >= s.x && bPos.x <= s.x + s.width && bPos.y >= s.y && bPos.y <= s.y + s.height) {
            hit = s;
            break;
          }
        } else if (s.type === 'circle' || s.type === 'drill') {
          const dist = Math.hypot(bPos.x - s.cx, bPos.y - s.cy);
          if (dist <= (s.radius || s.diameter / 2 || 5)) {
            hit = s;
            break;
          }
        } else if (s.type === 'polygon' && s.cx !== undefined) {
          const dist = Math.hypot(bPos.x - s.cx, bPos.y - s.cy);
          if (dist <= (s.radius || 20)) {
            hit = s;
            break;
          }
        } else if (s.type === 'text') {
          if (Math.abs(bPos.x - s.x) < 40 && Math.abs(bPos.y - s.y) < 15) {
            hit = s;
            break;
          }
        }
      }

      if (hit) {
        setSelectedId(hit.id);
        setIsDraggingShape(true);
        if (hit.x !== undefined) {
          setDragOffset({ x: bPos.x - hit.x, y: bPos.y - hit.y });
        } else if (hit.cx !== undefined) {
          setDragOffset({ x: bPos.x - hit.cx, y: bPos.y - hit.cy });
        }
      } else {
        setSelectedId(null);
      }
    } else if (activeTool === 'drill') {
      // Single drill click
      const newHole = createBoardDrillHole(snappedX, snappedY, 6.0);
      onUpdateShapes([...boardShapes, newHole]);
      setSelectedId(newHole.id);
    } else {
      // Start Drawing Shape
      setIsDrawing(true);
      setDrawStart({ x: snappedX, y: snappedY });
      setDrawCurrent({ x: snappedX, y: snappedY });
    }
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPanning) {
      setPan({ x: mouseX - panStart.x, y: mouseY - panStart.y });
      return;
    }

    const bPos = screenToBoard(mouseX, mouseY, pan, zoom, boardW, boardH, originLocation);
    const snappedX = snapVal(bPos.x, gridStep);
    const snappedY = snapVal(bPos.y, gridStep);
    setCursorPos({ x: snappedX, y: snappedY });

    if (isDraggingShape && selectedShape) {
      const updated = boardShapes.map((s) => {
        if (s.id !== selectedShape.id) return s;
        if (s.x !== undefined) {
          return { ...s, x: snapVal(bPos.x - dragOffset.x, gridStep), y: snapVal(bPos.y - dragOffset.y, gridStep) };
        } else if (s.cx !== undefined) {
          return { ...s, cx: snapVal(bPos.x - dragOffset.x, gridStep), cy: snapVal(bPos.y - dragOffset.y, gridStep) };
        }
        return s;
      });
      onUpdateShapes(updated);
    } else if (isDrawing && drawStart) {
      setDrawCurrent({ x: snappedX, y: snappedY });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingShape) {
      setIsDraggingShape(false);
      return;
    }

    if (isDrawing && drawStart && drawCurrent) {
      setIsDrawing(false);
      const w = Math.abs(drawCurrent.x - drawStart.x);
      const h = Math.abs(drawCurrent.y - drawStart.y);
      const minX = Math.min(drawStart.x, drawCurrent.x);
      const minY = Math.min(drawStart.y, drawCurrent.y);

      let newShape = null;

      if (activeTool === 'rect' && (w > 2 || h > 2)) {
        newShape = createBoardRect(minX, minY, Math.max(5, w), Math.max(5, h));
      } else if (activeTool === 'circle') {
        const radius = Math.max(3, Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y));
        newShape = createBoardCircle(drawStart.x, drawStart.y, radius);
      } else if (activeTool === 'polygon') {
        const radius = Math.max(10, Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y));
        newShape = createBoardPolygon(drawStart.x, drawStart.y, radius, 6);
      } else if (activeTool === 'text') {
        newShape = createBoardText('CNC ENGRAVE', drawStart.x, drawStart.y, 22);
      } else if (activeTool === 'line') {
        newShape = createBoardPolyline([
          { x: drawStart.x, y: drawStart.y },
          { x: drawCurrent.x, y: drawCurrent.y }
        ]);
      }

      if (newShape) {
        onUpdateShapes([...boardShapes, newShape]);
        setSelectedId(newShape.id);
        setActiveTool('select');
      }

      setDrawStart(null);
      setDrawCurrent(null);
    }
  };

  // Zoom with Wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.min(10.0, Math.max(0.4, prev * zoomFactor)));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'v') setActiveTool('select');
      if (key === 'r') setActiveTool('rect');
      if (key === 'c') setActiveTool('circle');
      if (key === 'd') setActiveTool('drill');
      if (key === 't') setActiveTool('text');
      if (key === 'p') setActiveTool('polygon');
      if (key === 'l') setActiveTool('line');

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        onUpdateShapes(boardShapes.filter((s) => s.id !== selectedId));
        setSelectedId(null);
      }

      if ((e.ctrlKey || e.metaKey) && key === 'd' && selectedShape) {
        e.preventDefault();
        const clone = {
          ...selectedShape,
          id: `clone_${Date.now()}`,
          name: `${selectedShape.name} (Copy)`,
          x: selectedShape.x !== undefined ? selectedShape.x + 10 : undefined,
          y: selectedShape.y !== undefined ? selectedShape.y + 10 : undefined,
          cx: selectedShape.cx !== undefined ? selectedShape.cx + 10 : undefined,
          cy: selectedShape.cy !== undefined ? selectedShape.cy + 10 : undefined
        };
        onUpdateShapes([...boardShapes, clone]);
        setSelectedId(clone.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedShape, boardShapes, onUpdateShapes]);

  // Quick CAD Template Loader
  const handleLoadTemplate = (templateName) => {
    const templateShapes = getCADTemplate(templateName, boardW, boardH);
    if (templateShapes.length > 0) {
      onUpdateShapes([...boardShapes, ...templateShapes]);
      if (templateShapes[0]) setSelectedId(templateShapes[0].id);
    }
  };

  // Export to SVG
  const handleExportSVG = () => {
    const svgStr = exportBoardToSVG(boardShapes, boardW, boardH);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argus_cnc_drawing_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Update selected shape property helper
  const updateSelectedProp = (key, val) => {
    if (!selectedShape) return;
    onUpdateShapes(
      boardShapes.map((s) => (s.id === selectedShape.id ? { ...s, [key]: val } : s))
    );
  };

  // Render Millimeter Rulers
  const renderRulers = () => {
    const step = 20; // 20mm major tick
    const xTicks = [];
    for (let x = 0; x <= boardW; x += step) {
      const scr = boardToScreen(x, 0, pan, zoom, boardW, boardH, originLocation);
      xTicks.push(
        <div
          key={`xtick_${x}`}
          style={{
            position: 'absolute',
            left: `${scr.x}px`,
            top: 0,
            height: '100%',
            borderLeft: '1px solid rgba(148, 163, 184, 0.3)',
            paddingLeft: '2px',
            fontSize: '9px',
            color: '#94a3b8',
            pointerEvents: 'none'
          }}
        >
          {x}
        </div>
      );
    }

    const yTicks = [];
    for (let y = 0; y <= boardH; y += step) {
      const scr = boardToScreen(0, y, pan, zoom, boardW, boardH, originLocation);
      yTicks.push(
        <div
          key={`ytick_${y}`}
          style={{
            position: 'absolute',
            top: `${scr.y}px`,
            left: 0,
            width: '100%',
            borderTop: '1px solid rgba(148, 163, 184, 0.3)',
            paddingTop: '1px',
            fontSize: '9px',
            color: '#94a3b8',
            pointerEvents: 'none'
          }}
        >
          {y}
        </div>
      );
    }

    return { xTicks, yTicks };
  };

  const rulers = renderRulers();

  // Screen coordinates of the Raw Material Sheet
  const sheetTopLeft = boardToScreen(0, boardH, pan, zoom, boardW, boardH, originLocation);
  const sheetBottomRight = boardToScreen(boardW, 0, pan, zoom, boardW, boardH, originLocation);
  const sheetW = boardW * zoom;
  const sheetH = boardH * zoom;
  const originScreen = boardToScreen(0, 0, pan, zoom, boardW, boardH, originLocation);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* 1. TOP HEADER & SETTINGS BAR */}
      <div
        style={{
          height: '42px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontSize: '11px',
          zIndex: 20
        }}
      >
        {/* Left: Board Title & Material Preset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>🎨</span>
            <span style={{ fontWeight: 800, color: '#38bdf8', letterSpacing: '0.5px' }}>
              CNC 2D DESIGN BOARD
            </span>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '1px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: 700
            }}>
              CAM WORKBENCH
            </span>
          </div>

          <div style={{ height: '16px', width: '1px', background: '#334155' }} />

          {/* Stock Sheet Size Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
            <span>Stock:</span>
            <input
              type="number"
              value={boardW}
              onChange={(e) => setBoardW(Math.max(10, Number(e.target.value)))}
              style={{
                width: '46px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '3px',
                padding: '2px 4px',
                fontSize: '11px',
                textAlign: 'center'
              }}
              title="Stock Width X (mm)"
            />
            <span>×</span>
            <input
              type="number"
              value={boardH}
              onChange={(e) => setBoardH(Math.max(10, Number(e.target.value)))}
              style={{
                width: '46px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '3px',
                padding: '2px 4px',
                fontSize: '11px',
                textAlign: 'center'
              }}
              title="Stock Height Y (mm)"
            />
            <span>×</span>
            <input
              type="number"
              value={boardThickness}
              onChange={(e) => setBoardThickness(Math.max(1, Number(e.target.value)))}
              style={{
                width: '40px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                borderRadius: '3px',
                padding: '2px 4px',
                fontSize: '11px',
                textAlign: 'center'
              }}
              title="Stock Thickness Z (mm)"
            />
            <span>mm</span>
          </div>

          <div style={{ height: '16px', width: '1px', background: '#334155' }} />

          {/* Material selection */}
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            style={{
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #475569',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="Alu 6061-T6">Alu 6061-T6</option>
            <option value="Brass C360">Brass C360</option>
            <option value="Delrin (Acetal)">Delrin (Acetal)</option>
            <option value="MDF Wood">MDF Wood</option>
            <option value="Acrylic Cast">Acrylic Cast</option>
            <option value="Carbon Fiber">Carbon Fiber</option>
          </select>
        </div>

        {/* Center: Grid & Snap */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setGridSnap(!gridSnap)}
            style={{
              background: gridSnap ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: gridSnap ? '#38bdf8' : '#64748b',
              border: `1px solid ${gridSnap ? '#38bdf8' : '#334155'}`,
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Toggle Grid Snapping"
          >
            <Grid size={12} />
            <span>Snap {gridStep}mm</span>
          </button>

          <select
            value={gridStep}
            onChange={(e) => setGridStep(Number(e.target.value))}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '3px',
              padding: '2px 4px',
              fontSize: '10px'
            }}
          >
            <option value={1}>1 mm</option>
            <option value={2}>2 mm</option>
            <option value={5}>5 mm</option>
            <option value={10}>10 mm</option>
          </select>

          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.min(10, z * 1.2))}
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={() => { setZoom(2.2); setPan({ x: 80, y: 60 }); }}
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
            title="Reset Zoom & Pan"
          >
            100%
          </button>
        </div>

        {/* Right: Quick Templates & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleLoadTemplate(e.target.value);
                e.target.value = '';
              }
            }}
            style={{
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="">⚡ Load Template...</option>
            <option value="mounting-plate">Faceplate with 4 Mounting Holes</option>
            <option value="speaker-baffle">Speaker Ring Baffle (6-Bolt PCD)</option>
            <option value="engraved-sign">Signboard with Border & Text</option>
            <option value="nema-flange">NEMA 23 Motor Flange</option>
          </select>

          <button
            onClick={handleExportSVG}
            style={{
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Export Vector Drawing as SVG"
          >
            <Download size={12} />
            <span>SVG</span>
          </button>

          {/* Switch to 3D Viewport button */}
          <button
            onClick={onSwitchTo3D}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid #38bdf8',
              borderRadius: '4px',
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Switch to 3D Machine CAM View"
          >
            <Box size={13} />
            <span>3D View</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE (TOOLS PALETTE + CANVAS + CNC INSPECTOR) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* A. LEFT TOOL PALETTE */}
        <div
          style={{
            width: '48px',
            background: 'rgba(15, 23, 42, 0.96)',
            borderRight: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 0',
            gap: '8px',
            zIndex: 10
          }}
        >
          {[
            { id: 'select', icon: MousePointer, label: 'Select & Move (V)', key: 'V' },
            { id: 'rect', icon: Square, label: 'Rectangle (R)', key: 'R' },
            { id: 'circle', icon: Circle, label: 'Circle / Arc (C)', key: 'C' },
            { id: 'line', icon: Minus, label: 'Polyline / Line (L)', key: 'L' },
            { id: 'drill', icon: CircleDot, label: 'Drill Hole (D)', key: 'D' },
            { id: 'text', icon: Type, label: 'Text Engrave (T)', key: 'T' },
            { id: 'polygon', icon: Hexagon, label: 'Polygon / Star (P)', key: 'P' }
          ].map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: `1px solid ${isActive ? '#38bdf8' : 'transparent'}`,
                  background: isActive ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
                title={tool.label}
              >
                <Icon size={18} />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '3px',
                    fontSize: '8px',
                    color: isActive ? '#38bdf8' : '#64748b',
                    fontWeight: 700
                  }}
                >
                  {tool.key}
                </span>
              </button>
            );
          })}

          <div style={{ width: '28px', height: '1px', background: '#334155', margin: '4px 0' }} />

          {/* Quick Hole Patterns */}
          <button
            onClick={() => {
              const gridHoles = createBoardDrillGrid(boardW / 2 - 30, boardH / 2 - 30, 3, 3, 30, 30, 5.0);
              onUpdateShapes([...boardShapes, ...gridHoles]);
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: 'transparent',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Insert 3x3 Drill Grid (30mm pitch)"
          >
            <Grid size={16} />
          </button>
        </div>

        {/* B. MAIN CANVAS (RULERS + WORKPIECE MATERIAL SHEET) */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            flex: 1,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            cursor: activeTool === 'select' ? (isDraggingShape ? 'grabbing' : 'default') : 'crosshair',
            background: '#0a0f1d'
          }}
        >
          {/* Top Horizontal Millimeter Ruler */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '24px',
              right: 0,
              height: '20px',
              background: '#0f172a',
              borderBottom: '1px solid #334155',
              zIndex: 5,
              overflow: 'hidden'
            }}
          >
            {rulers.xTicks}
            {/* Live Cursor Indicator Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${boardToScreen(cursorPos.x, 0, pan, zoom, boardW, boardH, originLocation).x}px`,
                width: '1px',
                background: '#ef4444',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Left Vertical Millimeter Ruler */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: 0,
              bottom: 0,
              width: '24px',
              background: '#0f172a',
              borderRight: '1px solid #334155',
              zIndex: 5,
              overflow: 'hidden'
            }}
          >
            {rulers.yTicks}
            {/* Live Cursor Indicator Line */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${boardToScreen(0, cursorPos.y, pan, zoom, boardW, boardH, originLocation).y - 20}px`,
                height: '1px',
                background: '#ef4444',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* SVG RENDERING LAYER */}
          <svg
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            {/* Raw Material Stock Board Representation */}
            <rect
              x={sheetTopLeft.x}
              y={sheetTopLeft.y}
              width={sheetW}
              height={sheetH}
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              rx="2"
            />

            {/* Grid Lines inside Stock Board */}
            {(() => {
              const lines = [];
              const step = gridStep;
              for (let x = 0; x <= boardW; x += step) {
                const sTop = boardToScreen(x, boardH, pan, zoom, boardW, boardH, originLocation);
                const sBot = boardToScreen(x, 0, pan, zoom, boardW, boardH, originLocation);
                lines.push(
                  <line
                    key={`g_v_${x}`}
                    x1={sTop.x}
                    y1={sTop.y}
                    x2={sBot.x}
                    y2={sBot.y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="0.8"
                  />
                );
              }
              for (let y = 0; y <= boardH; y += step) {
                const sL = boardToScreen(0, y, pan, zoom, boardW, boardH, originLocation);
                const sR = boardToScreen(boardW, y, pan, zoom, boardW, boardH, originLocation);
                lines.push(
                  <line
                    key={`g_h_${y}`}
                    x1={sL.x}
                    y1={sL.y}
                    x2={sR.x}
                    y2={sR.y}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="0.8"
                  />
                );
              }
              return lines;
            })()}

            {/* Origin (0,0) WCS Crosshair */}
            <circle cx={originScreen.x} cy={originScreen.y} r="6" fill="none" stroke="#ef4444" strokeWidth="1.5" />
            <line x1={originScreen.x - 12} y1={originScreen.y} x2={originScreen.x + 12} y2={originScreen.y} stroke="#ef4444" strokeWidth="1.5" />
            <line x1={originScreen.x} y1={originScreen.y - 12} x2={originScreen.x} y2={originScreen.y + 12} stroke="#ef4444" strokeWidth="1.5" />
            <text x={originScreen.x + 8} y={originScreen.y - 6} fill="#ef4444" fontSize="10" fontWeight="bold">WCS (0,0)</text>

            {/* RENDER ALL DRAWN SHAPES */}
            {boardShapes.map((s) => {
              if (!s.visible) return null;
              const isSel = s.id === selectedId;
              const strokeColor = isSel ? '#38bdf8' : (s.color || '#94a3b8');
              const strokeWidth = isSel ? 2.5 : 1.5;
              const fill = s.cutType === 'pocket' ? 'rgba(56, 189, 248, 0.22)' : 'none';

              if (s.type === 'rect') {
                const p = boardToScreen(s.x, s.y + s.height, pan, zoom, boardW, boardH, originLocation);
                const w = s.width * zoom;
                const h = s.height * zoom;

                return (
                  <g key={s.id}>
                    <rect
                      x={p.x}
                      y={p.y}
                      width={w}
                      height={h}
                      rx={(s.cornerRadius || 0) * zoom}
                      fill={fill}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                    {/* Dogbone Corner Reliefs preview */}
                    {s.dogbones === 'dogbone' && (
                      applyDogboneFillets(s, (s.toolDia || 6) / 2)?.map((c, i) => {
                        const cp = boardToScreen(c.cx, c.cy, pan, zoom, boardW, boardH, originLocation);
                        return (
                          <circle
                            key={`dog_${i}`}
                            cx={cp.x}
                            cy={cp.y}
                            r={c.radius * zoom}
                            fill="rgba(239, 68, 68, 0.4)"
                            stroke="#ef4444"
                            strokeWidth="1"
                          />
                        );
                      })
                    )}
                    {isSel && (
                      <rect
                        x={p.x - 4}
                        y={p.y - 4}
                        width={w + 8}
                        height={h + 8}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                    )}
                  </g>
                );
              } else if (s.type === 'circle') {
                const cp = boardToScreen(s.cx, s.cy, pan, zoom, boardW, boardH, originLocation);
                const r = s.radius * zoom;
                return (
                  <g key={s.id}>
                    <circle
                      cx={cp.x}
                      cy={cp.y}
                      r={r}
                      fill={fill}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                    {isSel && (
                      <circle
                        cx={cp.x}
                        cy={cp.y}
                        r={r + 4}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                    )}
                  </g>
                );
              } else if (s.type === 'drill') {
                const cp = boardToScreen(s.cx, s.cy, pan, zoom, boardW, boardH, originLocation);
                const r = Math.max(3, (s.diameter / 2) * zoom);
                return (
                  <g key={s.id}>
                    <circle cx={cp.x} cy={cp.y} r={r} fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth={strokeWidth} />
                    <line x1={cp.x - r * 1.5} y1={cp.y} x2={cp.x + r * 1.5} y2={cp.y} stroke="#ef4444" strokeWidth="1" />
                    <line x1={cp.x} y1={cp.y - r * 1.5} x2={cp.x} y2={cp.y + r * 1.5} stroke="#ef4444" strokeWidth="1" />
                    {isSel && (
                      <rect x={cp.x - r - 3} y={cp.y - r - 3} width={r * 2 + 6} height={r * 2 + 6} fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
                    )}
                  </g>
                );
              } else if (s.type === 'text') {
                const p = boardToScreen(s.x, s.y, pan, zoom, boardW, boardH, originLocation);
                return (
                  <text
                    key={s.id}
                    x={p.x}
                    y={p.y}
                    fill={strokeColor}
                    fontSize={s.fontSize * (zoom / 2.2)}
                    fontFamily="Inter, system-ui, sans-serif"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {s.text}
                  </text>
                );
              } else if (s.type === 'polygon' && s.points) {
                const ptsStr = s.points
                  .map((pt) => {
                    const scr = boardToScreen(pt.x, pt.y, pan, zoom, boardW, boardH, originLocation);
                    return `${scr.x},${scr.y}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={s.id}
                    points={ptsStr}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                );
              } else if (s.type === 'polyline' && s.points) {
                const ptsStr = s.points
                  .map((pt) => {
                    const scr = boardToScreen(pt.x, pt.y, pan, zoom, boardW, boardH, originLocation);
                    return `${scr.x},${scr.y}`;
                  })
                  .join(' ');
                return (
                  <polyline
                    key={s.id}
                    points={ptsStr}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                  />
                );
              }
              return null;
            })}

            {/* LIVE DRAWING PREVIEW (RUBBER-BAND) */}
            {isDrawing && drawStart && drawCurrent && (
              <g>
                {activeTool === 'rect' && (
                  <rect
                    x={Math.min(
                      boardToScreen(drawStart.x, drawStart.y, pan, zoom, boardW, boardH, originLocation).x,
                      boardToScreen(drawCurrent.x, drawCurrent.y, pan, zoom, boardW, boardH, originLocation).x
                    )}
                    y={Math.min(
                      boardToScreen(drawStart.x, drawStart.y, pan, zoom, boardW, boardH, originLocation).y,
                      boardToScreen(drawCurrent.x, drawCurrent.y, pan, zoom, boardW, boardH, originLocation).y
                    )}
                    width={Math.abs(drawCurrent.x - drawStart.x) * zoom}
                    height={Math.abs(drawCurrent.y - drawStart.y) * zoom}
                    fill="rgba(56, 189, 248, 0.15)"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                )}
                {activeTool === 'circle' && (
                  <circle
                    cx={boardToScreen(drawStart.x, drawStart.y, pan, zoom, boardW, boardH, originLocation).x}
                    cy={boardToScreen(drawStart.x, drawStart.y, pan, zoom, boardW, boardH, originLocation).y}
                    r={Math.hypot(drawCurrent.x - drawStart.x, drawCurrent.y - drawStart.y) * zoom}
                    fill="rgba(168, 85, 247, 0.15)"
                    stroke="#c084fc"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                )}
                {activeTool === 'line' && (
                  <line
                    x1={boardToScreen(drawStart.x, drawStart.y, pan, zoom, boardW, boardH, originLocation).x}
                    y1={boardToScreen(drawStart.x, drawStart.y, pan, zoom, boardW, boardH, originLocation).y}
                    x2={boardToScreen(drawCurrent.x, drawCurrent.y, pan, zoom, boardW, boardH, originLocation).x}
                    y2={boardToScreen(drawCurrent.x, drawCurrent.y, pan, zoom, boardW, boardH, originLocation).y}
                    stroke="#ec4899"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                )}
              </g>
            )}
          </svg>

          {/* Bottom-Left Live Coordinate Readout */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '36px',
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#38bdf8',
              display: 'flex',
              gap: '12px',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
          >
            <span>X: {cursorPos.x.toFixed(1)} mm</span>
            <span>Y: {cursorPos.y.toFixed(1)} mm</span>
            <span style={{ color: '#94a3b8' }}>Zoom: {Math.round(zoom * 45)}%</span>
          </div>
        </div>

        {/* C. RIGHT CNC INSPECTOR PANEL */}
        <div
          style={{
            width: '280px',
            background: 'rgba(15, 23, 42, 0.98)',
            borderLeft: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
            gap: '12px',
            overflowY: 'auto',
            fontSize: '11px',
            zIndex: 10
          }}
        >
          {selectedShape ? (
            <>
              {/* Selected Shape Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '12px' }}>
                  ⚙️ {selectedShape.name}
                </span>
                <button
                  onClick={() => {
                    onUpdateShapes(boardShapes.filter((s) => s.id !== selectedShape.id));
                    setSelectedId(null);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    cursor: 'pointer'
                  }}
                  title="Delete Diagram (Del)"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* 1. CNC Cut Type Selection */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  CNC Machining Operation:
                </label>
                <select
                  value={selectedShape.cutType}
                  onChange={(e) => updateSelectedProp('cutType', e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  <option value="pocket">🟢 Pocket (Clear Interior Area)</option>
                  <option value="outline-outside">🔵 Outline - Outside (Part Profile)</option>
                  <option value="outline-inside">🔵 Outline - Inside (Hole Cutout)</option>
                  <option value="outline-on">⚪ Outline - On Path (Centerline)</option>
                  <option value="engrave">🟡 Engrave / V-Carve (Surface Score)</option>
                  <option value="drill">🔴 Drill (Plunge Hole)</option>
                </select>
              </div>

              {/* 2. Target Cut Depth */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '4px' }}>
                  <span>Target Cut Depth:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{selectedShape.cutDepth || 3.0} mm</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max={boardThickness}
                  step="0.5"
                  value={selectedShape.cutDepth || 3.0}
                  onChange={(e) => updateSelectedProp('cutDepth', Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* 3. Tool Selection */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>Assigned Tool:</label>
                <select
                  value={selectedShape.toolDia || 6.0}
                  onChange={(e) => updateSelectedProp('toolDia', Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px'
                  }}
                >
                  <option value={3.0}>Ø3.0mm Flat Endmill (Fine detail)</option>
                  <option value={6.0}>Ø6.0mm Flat Endmill (Standard)</option>
                  <option value={10.0}>Ø10.0mm Roughing Endmill (Fast clearing)</option>
                  <option value={3.175}>Ø1/8" (3.175mm) Router Bit</option>
                  <option value={5.0}>Ø5.0mm Twist Drill</option>
                </select>
              </div>

              {/* 4. CNC Router Dog-Bone Corner Relief (For Rectangles) */}
              {selectedShape.type === 'rect' && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>Dog-Bone Corner Relief:</span>
                    <select
                      value={selectedShape.dogbones || 'none'}
                      onChange={(e) => updateSelectedProp('dogbones', e.target.value)}
                      style={{
                        background: '#1e293b',
                        color: '#f87171',
                        border: '1px solid #ef4444',
                        borderRadius: '3px',
                        padding: '2px 4px',
                        fontSize: '10px'
                      }}
                    >
                      <option value="none">Off (Standard)</option>
                      <option value="dogbone">Dog-Bone (45° ears)</option>
                    </select>
                  </div>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Removes material at 90° corners so mating mortise & tenon joints fit flush!
                  </span>
                </div>
              )}

              {/* 5. Holding Tabs (Bridges so cut parts don't fly off) */}
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', padding: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>Holding Tabs (Bridges):</span>
                  <input
                    type="checkbox"
                    checked={selectedShape.tabsEnabled || false}
                    onChange={(e) => updateSelectedProp('tabsEnabled', e.target.checked)}
                    style={{ accentColor: '#38bdf8' }}
                  />
                </div>
                {selectedShape.tabsEnabled && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>Count:</span>
                      <input
                        type="number"
                        value={selectedShape.tabCount || 4}
                        onChange={(e) => updateSelectedProp('tabCount', Number(e.target.value))}
                        style={{ width: '100%', background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', padding: '2px 4px', fontSize: '10px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>Width (mm):</span>
                      <input
                        type="number"
                        value={selectedShape.tabWidth || 6.0}
                        onChange={(e) => updateSelectedProp('tabWidth', Number(e.target.value))}
                        style={{ width: '100%', background: '#1e293b', border: '1px solid #475569', color: '#f8fafc', padding: '2px 4px', fontSize: '10px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Alignment & Center buttons */}
              <div>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '4px' }}>Alignment:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    onClick={() => {
                      if (selectedShape.x !== undefined) {
                        updateSelectedProp('x', Math.round((boardW - selectedShape.width) / 2));
                        updateSelectedProp('y', Math.round((boardH - selectedShape.height) / 2));
                      } else if (selectedShape.cx !== undefined) {
                        updateSelectedProp('cx', Math.round(boardW / 2));
                        updateSelectedProp('cy', Math.round(boardH / 2));
                      }
                    }}
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      padding: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Center on Board
                  </button>
                  <button
                    onClick={() => {
                      if (selectedShape.x !== undefined) updateSelectedProp('x', 10);
                      if (selectedShape.cx !== undefined) updateSelectedProp('cx', selectedShape.radius || 10);
                    }}
                    style={{
                      background: '#1e293b',
                      color: '#f8fafc',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      padding: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Align Left
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Shape Selected State */
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📐</div>
              <span style={{ fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                No Shape Selected
              </span>
              <p style={{ fontSize: '10px', lineHeight: 1.4 }}>
                Click any diagram on the board to inspect and configure its CNC cut type, depth, tool diameter, and dog-bone relief.
              </p>
              <div style={{ marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '12px', textAlign: 'left' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Total Diagrams: {boardShapes.length}</span>
                <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                  <li>Pockets: {boardShapes.filter((s) => s.cutType === 'pocket').length}</li>
                  <li>Outlines: {boardShapes.filter((s) => s.cutType.startsWith('outline')).length}</li>
                  <li>Drill Holes: {boardShapes.filter((s) => s.type === 'drill' || s.cutType === 'drill').length}</li>
                  <li>Engravings: {boardShapes.filter((s) => s.cutType === 'engrave').length}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM ACTION BAR (GENERATE TOOLPATHS & G-CODE) */}
      <div
        style={{
          height: '48px',
          background: 'rgba(15, 23, 42, 0.98)',
          borderTop: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Board: <strong style={{ color: '#f8fafc' }}>{boardW} × {boardH} × {boardThickness} mm</strong> ({material})
          </span>
          <span style={{ fontSize: '11px', color: '#38bdf8' }}>
            {boardShapes.length} Diagram{boardShapes.length === 1 ? '' : 's'} Drawn
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {boardShapes.length > 0 && (
            <button
              onClick={() => onUpdateShapes([])}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Clear all diagrams from board"
            >
              <Trash2 size={13} />
              <span>Clear Board</span>
            </button>
          )}

          {/* ⚡ GENERATE CNC TOOLPATHS & G-CODE BUTTON */}
          <button
            onClick={() => onGenerateToolpaths(boardShapes, { dimensions: { x: boardW, y: boardH, z: boardThickness }, material })}
            disabled={boardShapes.length === 0}
            style={{
              background: boardShapes.length > 0
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: boardShapes.length > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: boardShapes.length > 0 ? '0 2px 12px rgba(16, 185, 129, 0.45)' : 'none'
            }}
            title="Convert all 2D Board Diagrams into 3D CNC Toolpaths & G-Code operations"
          >
            <Sparkles size={14} />
            <span>⚡ Generate CNC Toolpaths & G-Code</span>
          </button>
        </div>
      </div>
    </div>
  );
}

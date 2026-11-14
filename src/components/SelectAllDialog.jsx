import React, { useState, useMemo } from 'react';
import { X, Check, CheckSquare, RefreshCw, Star, Trash2 } from 'lucide-react';
import { getCustomEntityColor, getCustomEntityId } from '../utils/cadSelectionEngine';

export default function SelectAllDialog({
  isOpen,
  onClose,
  customGeometry = [],
  selectedEntityIds = [],
  onChangeSelectedEntities,
  activeLevelId = 1,
  levels = [],
  onPickSameAsEntity
}) {
  const [activeCategory, setActiveCategory] = useState('Color');
  const [showAllColors, setShowAllColors] = useState(false);
  const [planeMaskInChaining, setPlaneMaskInChaining] = useState(false);
  const [ignoreDepthsInChaining, setIgnoreDepthsInChaining] = useState(false);
  const [useOnlyMask, setUseOnlyMask] = useState(false);

  // Selected colors map
  const [selectedColorMap, setSelectedColorMap] = useState({});
  // Selected levels map
  const [selectedLevelMap, setSelectedLevelMap] = useState({});
  // Selected entity types map
  const [selectedTypesMap, setSelectedTypesMap] = useState({});

  // 1. Gather all unique colors from entities currently in the scene
  const sceneColors = useMemo(() => {
    const map = {};
    (customGeometry || []).forEach((ent) => {
      if (!ent || ent.visible === false) return;
      const hex = getCustomEntityColor(ent).toLowerCase();
      map[hex] = (map[hex] || 0) + 1;
    });

    const standardList = [
      { hex: '#000080', id: 1, name: 'Dark Blue' },
      { hex: '#00ff00', id: 10, name: 'Bright Green' },
      { hex: '#ff0000', id: 12, name: 'Red' },
      { hex: '#00ffff', id: 11, name: 'Cyan' },
      { hex: '#ffff00', id: 14, name: 'Yellow' },
      { hex: '#ff00ff', id: 13, name: 'Magenta' },
      { hex: '#ffffff', id: 15, name: 'White' },
      { hex: '#000000', id: 0, name: 'Black' }
    ];

    if (showAllColors) {
      return standardList.map((st) => ({
        hex: st.hex,
        id: st.id,
        count: map[st.hex] || 0
      }));
    }

    const result = Object.entries(map).map(([hex, count], idx) => {
      const match = standardList.find((s) => s.hex.toLowerCase() === hex);
      return {
        hex,
        id: match ? match.id : idx + 1,
        count
      };
    });

    // Default fallback matching Image 4 if empty
    if (result.length === 0) {
      return [
        { hex: '#000080', id: 1, count: 1 },
        { hex: '#00ff00', id: 10, count: 10 }
      ];
    }

    return result;
  }, [customGeometry, showAllColors]);

  // Handle color checkbox toggle
  const handleToggleColor = (hex) => {
    const nextMap = { ...selectedColorMap, [hex]: !selectedColorMap[hex] };
    setSelectedColorMap(nextMap);

    const activeHexes = Object.keys(nextMap).filter((h) => nextMap[h]);
    if (activeHexes.length === 0) {
      onChangeSelectedEntities?.([]);
      return;
    }

    const matchedIds = (customGeometry || [])
      .filter((ent) => ent && ent.visible !== false && activeHexes.includes(getCustomEntityColor(ent).toLowerCase()))
      .map(getCustomEntityId)
      .filter(Boolean);

    onChangeSelectedEntities?.(matchedIds);
  };

  const handleSelectAllColors = () => {
    const nextMap = {};
    sceneColors.forEach((c) => { nextMap[c.hex] = true; });
    setSelectedColorMap(nextMap);

    const allIds = (customGeometry || [])
      .filter((ent) => ent && ent.visible !== false)
      .map(getCustomEntityId)
      .filter(Boolean);
    onChangeSelectedEntities?.(allIds);
  };

  const handleInvertColors = () => {
    const nextMap = {};
    sceneColors.forEach((c) => {
      nextMap[c.hex] = !selectedColorMap[c.hex];
    });
    setSelectedColorMap(nextMap);

    const activeHexes = Object.keys(nextMap).filter((h) => nextMap[h]);
    const matchedIds = (customGeometry || [])
      .filter((ent) => ent && ent.visible !== false && activeHexes.includes(getCustomEntityColor(ent).toLowerCase()))
      .map(getCustomEntityId)
      .filter(Boolean);
    onChangeSelectedEntities?.(matchedIds);
  };

  const handleClearColors = () => {
    setSelectedColorMap({});
    onChangeSelectedEntities?.([]);
  };

  const handleSelectAllEntities = () => {
    const allIds = (customGeometry || [])
      .filter((ent) => ent && ent.visible !== false)
      .map(getCustomEntityId)
      .filter(Boolean);
    onChangeSelectedEntities?.(allIds);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        left: '280px',
        zIndex: 9999,
        width: '380px',
        background: '#f1f5f9',
        border: '1px solid #64748b',
        borderRadius: '4px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: 'none',
        color: '#0f172a'
      }}
    >
      {/* Title Bar matching Mastercam (Image 4) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          background: '#e2e8f0',
          borderBottom: '1px solid #cbd5e1',
          cursor: 'move'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
          Select All
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            lineHeight: 1,
            color: '#64748b'
          }}
          title="Close Dialog"
        >
          <X size={14} />
        </button>
      </div>

      {/* Top Action Buttons (Image 4) */}
      <div style={{ display: 'flex', gap: '4px', padding: '6px 8px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
        <button
          type="button"
          onClick={handleSelectAllEntities}
          style={{
            flex: 1,
            padding: '4px 6px',
            fontSize: '11px',
            fontWeight: 600,
            background: '#e0f2fe',
            border: '1px solid #0284c7',
            borderRadius: '2px',
            color: '#0369a1',
            cursor: 'pointer'
          }}
        >
          All Entities
        </button>
        <button
          type="button"
          onClick={handleSelectAllEntities}
          style={{
            flex: 1,
            padding: '4px 6px',
            fontSize: '11px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '2px',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          Transform Result
        </button>
        <button
          type="button"
          style={{
            flex: 1,
            padding: '4px 6px',
            fontSize: '11px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '2px',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          Transform Group
        </button>
        <button
          type="button"
          style={{
            flex: 1,
            padding: '4px 6px',
            fontSize: '11px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '2px',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          Group Manager
        </button>
      </div>

      {/* Main Content: Left Category Tabs + Center Sub-panel */}
      <div style={{ display: 'flex', padding: '8px', gap: '8px' }}>
        {/* Left Category Checklist (Image 4) */}
        <div style={{ width: '110px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            { id: 'Entities', label: 'Entities' },
            { id: 'Color', label: 'Color' },
            { id: 'Level', label: 'Level' },
            { id: 'Width', label: 'Width' },
            { id: 'Style', label: 'Style' },
            { id: 'Point', label: 'Point' },
            { id: 'Miscellaneous', label: 'Miscellaneous' }
          ].map((cat) => {
            const isCurrent = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 6px',
                  fontSize: '11px',
                  background: isCurrent ? '#dbeafe' : '#ffffff',
                  border: isCurrent ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? '#1e3a8a' : '#334155'
                }}
              >
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={() => setActiveCategory(cat.id)}
                  style={{ margin: 0, cursor: 'pointer' }}
                />
                <span>{cat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Center Sub-Panel (Color active matching Image 4) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activeCategory === 'Color' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '6px', display: 'flex', flexDirection: 'column' }}>
              {/* Mini Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllColors}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#16a34a' }}
                  title="Select all colors"
                >
                  <CheckSquare size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleInvertColors}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#10b981' }}
                  title="Invert color selection"
                >
                  <Star size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleClearColors}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}
                  title="Clear color selection"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Color Items List with Swatches and IDs */}
              <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sceneColors.map((item) => {
                  const isChecked = !!selectedColorMap[item.hex];
                  return (
                    <label
                      key={item.hex}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '2px',
                        background: isChecked ? '#eff6ff' : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleColor(item.hex)}
                        style={{ margin: 0, cursor: 'pointer' }}
                      />
                      {/* Color swatch bar matching Image 4 */}
                      <div
                        style={{
                          width: '70px',
                          height: '14px',
                          backgroundColor: item.hex,
                          border: '1px solid #94a3b8',
                          borderRadius: '1px'
                        }}
                      />
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                        {item.id}
                      </span>
                      {item.count > 0 && (
                        <span style={{ fontSize: '9px', color: '#64748b', marginLeft: 'auto' }}>
                          ({item.count})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Show All Checkbox */}
              <div style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showAllColors}
                    onChange={(e) => setShowAllColors(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <span>Show All</span>
                </label>
              </div>
            </div>
          )}

          {activeCategory !== 'Color' && (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '2px', padding: '12px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
              Filter by {activeCategory} options
            </div>
          )}
        </div>
      </div>

      {/* Bottom Options (Matching Mastercam Image 4) */}
      <div style={{ padding: '6px 8px', borderTop: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={planeMaskInChaining}
            onChange={(e) => setPlaneMaskInChaining(e.target.checked)}
            style={{ margin: 0 }}
          />
          <span>Plane mask in chaining</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={ignoreDepthsInChaining}
            onChange={(e) => setIgnoreDepthsInChaining(e.target.checked)}
            style={{ margin: 0 }}
          />
          <span>Ignore depths in chaining</span>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => onPickSameAsEntity?.()}
            style={{
              padding: '3px 12px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '2px',
              cursor: 'pointer',
              color: '#1e293b'
            }}
          >
            Same as...
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useOnlyMask}
              onChange={(e) => setUseOnlyMask(e.target.checked)}
              style={{ margin: 0 }}
            />
            <span>Use Only Mask</span>
          </label>
        </div>
      </div>
    </div>
  );
}

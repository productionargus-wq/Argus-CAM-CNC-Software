import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CornerDownRight } from 'lucide-react';
import { VIEW_RIBBON_CONFIG } from '../../config/viewRibbonConfig';
import { VIEW_ICON_MAP } from '../icons/ViewIcons';

export default function ViewRibbonGroup({
  onAction,
  activeManagerTab = 'Toolpaths',
  renderMode = 'edges',
  materialStyle = 'metallic',
  translucencyEnabled = false,
  showBackside = false,
  showAxes = true,
  showGnomons = true,
  showGrid = true,
  snapToGrid = false,
  isViewsheetsVisible = true
}) {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const containerRef = useRef(null);

  // Close flyout dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleDropdownToggle = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const handleItemClick = (action, id, payload = null) => {
    setOpenDropdownId(null);
    if (onAction) {
      onAction(action, id, payload);
    }
  };

  const renderIcon = (iconName, size = 26) => {
    const IconComp = VIEW_ICON_MAP[iconName];
    if (!IconComp) {
      return <div style={{ width: size, height: size, background: '#cbd5e1', borderRadius: 2 }} />;
    }
    return <IconComp size={size} />;
  };

  return (
    <div className="ribbon-tab-content" ref={containerRef} style={{ display: 'flex', alignItems: 'stretch' }}>
      {VIEW_RIBBON_CONFIG.map((group) => (
        <div key={group.id} className="ribbon-group" style={{ position: 'relative' }}>
          <div className="ribbon-group-items" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {group.items.map((item) => {
              // 1. STACK LAYOUT (3 Rows)
              if (item.type === 'stack') {
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '66px',
                      padding: '1px 0'
                    }}
                  >
                    {item.items.map((subItem) => {
                      const isDropdownOpen = openDropdownId === subItem.id;
                      return (
                        <div key={subItem.id} style={{ position: 'relative' }}>
                          <button
                            className="ribbon-btn-small"
                            onClick={(e) => {
                              if (subItem.hasDropdown) {
                                handleDropdownToggle(subItem.id, e);
                              } else {
                                handleItemClick(subItem.action, subItem.id);
                              }
                            }}
                            title={subItem.tooltip || subItem.label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 5px',
                              height: '20px',
                              fontSize: '11px',
                              border: isDropdownOpen ? '1px solid #0284c7' : '1px solid transparent',
                              borderRadius: '2px',
                              background: isDropdownOpen ? '#e0f2fe' : 'transparent',
                              cursor: 'pointer',
                              color: '#1e293b',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {renderIcon(subItem.icon, 15)}
                            <span>{subItem.label}</span>
                            {subItem.hasDropdown && <ChevronDown size={10} color="#64748b" />}
                          </button>

                          {/* Flyout Dropdown */}
                          {subItem.hasDropdown && isDropdownOpen && subItem.dropdownItems && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                zIndex: 120,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '3px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: '160px',
                                padding: '3px 0'
                              }}
                            >
                              {subItem.dropdownItems.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => handleItemClick(subItem.action, subItem.id, opt.id)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '5px 12px',
                                    fontSize: '11px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: '#0f172a'
                                  }}
                                  onMouseEnter={(e) => (e.target.style.background = '#f1f5f9')}
                                  onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // 2. APPEARANCE GRID (2 Columns of 5 items)
              if (item.type === 'appearance_grid') {
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      height: '66px',
                      padding: '0 4px',
                      borderLeft: '1px solid #e2e8f0',
                      marginLeft: '2px'
                    }}
                  >
                    {/* Col 1: Material styles (Metallic, Plastic, Glossy) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {item.col1.map((mat) => {
                        const isActive = materialStyle === mat.styleType;
                        return (
                          <button
                            key={mat.id}
                            onClick={() => handleItemClick(mat.action, mat.id)}
                            title={mat.tooltip}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 5px',
                              height: '19px',
                              fontSize: '10.5px',
                              background: isActive ? '#e0f2fe' : 'transparent',
                              border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              color: '#0f172a',
                              fontWeight: isActive ? 600 : 400
                            }}
                          >
                            {renderIcon(mat.icon, 14)}
                            <span>{mat.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Col 2: Translucency, Backside */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {item.col2.map((opt) => {
                        const isActive =
                          opt.id === 'mat_translucency'
                            ? translucencyEnabled
                            : opt.id === 'mat_backside'
                            ? showBackside
                            : false;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleItemClick(opt.action, opt.id)}
                            title={opt.tooltip}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 5px',
                              height: '19px',
                              fontSize: '10.5px',
                              background: isActive ? '#e0f2fe' : 'transparent',
                              border: isActive ? '1px solid #38bdf8' : '1px solid transparent',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              color: '#0f172a',
                              fontWeight: isActive ? 600 : 400
                            }}
                          >
                            {renderIcon(opt.icon, 14)}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // 3. MANAGERS COLUMNS (3 Columns of checkboxes with authentic blue active boxes)
              if (item.type === 'managers_columns') {
                const renderManagerCol = (colItems, colIdx) => (
                  <div key={`mcol-${colIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {colItems.map((mgr) => {
                      const isActive = activeManagerTab === mgr.tabName;
                      const isDisabled = !!mgr.disabled;
                      return (
                        <button
                          key={mgr.id}
                          disabled={isDisabled}
                          onClick={() => !isDisabled && handleItemClick(mgr.action, mgr.id, mgr.tabName)}
                          title={mgr.tooltip}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            height: '19px',
                            fontSize: '10.5px',
                            background: isDisabled
                              ? 'transparent'
                              : isActive
                              ? '#dbeafe'
                              : 'transparent',
                            border: isDisabled
                              ? '1px solid transparent'
                              : isActive
                              ? '1px solid #93c5fd'
                              : '1px solid transparent',
                            borderRadius: '2px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            color: isDisabled ? '#94a3b8' : isActive ? '#1d4ed8' : '#1e293b',
                            fontWeight: isActive ? 600 : 400,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {renderIcon(mgr.icon, 13)}
                          <span>{mgr.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                      height: '66px',
                      padding: '0 2px'
                    }}
                  >
                    {renderManagerCol(item.col1, 1)}
                    {renderManagerCol(item.col2, 2)}
                    {renderManagerCol(item.col3, 3)}
                  </div>
                );
              }

              // 4. LARGE BUTTON (With or without dropdown)
              const isDropdownOpen = openDropdownId === item.id;
              const isItemActive =
                item.id === 'app_wireframe'
                  ? renderMode === 'wireframe'
                  : item.id === 'app_outline_shaded'
                  ? renderMode === 'edges'
                  : item.id === 'disp_axes'
                  ? showAxes
                  : item.id === 'disp_gnomons'
                  ? showGnomons
                  : item.id === 'grid_show'
                  ? showGrid
                  : item.id === 'grid_snap'
                  ? snapToGrid
                  : item.id === 'viewsheet_on_off'
                  ? isViewsheetsVisible
                  : false;

              return (
                <div key={item.id} style={{ position: 'relative' }}>
                  <button
                    className={`ribbon-btn-large ${isItemActive ? 'active' : ''}`}
                    onClick={(e) => {
                      if (item.hasDropdown) {
                        handleDropdownToggle(item.id, e);
                      } else {
                        handleItemClick(item.action, item.id);
                      }
                    }}
                    title={item.tooltip || item.label}
                    style={{
                      minWidth: '48px',
                      height: '66px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3px 5px',
                      border: isDropdownOpen
                        ? '1px solid #0284c7'
                        : isItemActive
                        ? '1px solid #bae6fd'
                        : '1px solid transparent',
                      background: isDropdownOpen
                        ? '#e0f2fe'
                        : isItemActive
                        ? '#f0f9ff'
                        : 'transparent',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      {renderIcon(item.icon, 25)}
                      {item.hasDropdown && (
                        <ChevronDown
                          size={11}
                          color="#64748b"
                          style={{
                            position: 'absolute',
                            right: -9,
                            bottom: 2
                          }}
                        />
                      )}
                    </div>
                    <span
                      className="btn-label"
                      style={{
                        fontSize: '11px',
                        marginTop: '3px',
                        textAlign: 'center',
                        lineHeight: '12px',
                        color: isItemActive ? '#0369a1' : '#1e293b',
                        fontWeight: isItemActive ? 600 : 400
                      }}
                    >
                      {item.label}
                    </span>
                  </button>

                  {/* Flyout Dropdown */}
                  {item.hasDropdown && isDropdownOpen && item.dropdownItems && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 120,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '170px',
                        padding: '4px 0'
                      }}
                    >
                      {item.dropdownItems.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleItemClick(item.action, item.id, opt.id)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 12px',
                            fontSize: '11px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#0f172a'
                          }}
                          onMouseEnter={(e) => (e.target.style.background = '#f1f5f9')}
                          onMouseLeave={(e) => (e.target.style.background = 'transparent')}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Group Title and Optional Dialog Launcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginTop: '2px',
              padding: '0 6px'
            }}
          >
            <span className="ribbon-group-title" style={{ fontSize: '10.5px', color: '#64748b' }}>
              {group.title}
            </span>

            {/* Dialog Launcher Icon (bottom right corner) */}
            {group.hasLauncher && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(group.launcherAction, group.id);
                }}
                title={group.launcherTooltip || `Open ${group.title} Dialog`}
                style={{
                  position: 'absolute',
                  right: '2px',
                  bottom: '-1px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0284c7')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                <CornerDownRight size={10} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TOOLPATHS_RIBBON_CONFIG } from '../../config/toolpathsRibbonConfig';
import { TOOLPATHS_ICON_MAP } from '../icons/ToolpathsIcons';

export default function ToolpathsRibbonGroup({
  onAction,
  stockVisible = true,
  stockShading = 'solid'
}) {
  const [openGalleryId, setOpenGalleryId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const containerRef = useRef(null);

  // Close galleries and dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenGalleryId(null);
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleGalleryToggle = (groupId, e) => {
    e.stopPropagation();
    setOpenGalleryId((prev) => (prev === groupId ? null : groupId));
    setOpenDropdownId(null);
  };

  const handleDropdownToggle = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
    setOpenGalleryId(null);
  };

  const handleItemClick = (action, id, opType = null) => {
    setOpenGalleryId(null);
    setOpenDropdownId(null);
    if (onAction) {
      onAction(action, id, opType);
    }
  };

  const renderIcon = (iconName, size = 26) => {
    const IconComp = TOOLPATHS_ICON_MAP[iconName];
    if (!IconComp) {
      return <div style={{ width: size, height: size, background: '#cbd5e1', borderRadius: 2 }} />;
    }
    return <IconComp size={size} />;
  };

  return (
    <div className="ribbon-tab-content" ref={containerRef} style={{ display: 'flex', alignItems: 'stretch' }}>
      {TOOLPATHS_RIBBON_CONFIG.map((group) => {
        // ==================== 1. GALLERY GROUPS (2D, 3D, MULTIAXIS) ====================
        if (group.type === 'gallery') {
          const isGalleryOpen = openGalleryId === group.id;

          return (
            <div key={group.id} className="ribbon-group" style={{ position: 'relative' }}>
              <div className="ribbon-group-items" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {/* 4 Primary Large Buttons */}
                {group.primaryItems.map((item) => (
                  <button
                    key={item.id}
                    className="ribbon-btn-large"
                    onClick={() => handleItemClick(item.action, item.id, item.opType)}
                    title={item.tooltip || item.label}
                    style={{
                      minWidth: '48px',
                      height: '66px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3px 5px',
                      border: '1px solid transparent',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      background: 'transparent'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ position: 'relative' }}>{renderIcon(item.icon, 26)}</div>
                    <span
                      className="btn-label"
                      style={{
                        fontSize: '11px',
                        marginTop: '3px',
                        textAlign: 'center',
                        lineHeight: '12px',
                        color: '#1e293b'
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}

                {/* Mastercam Gallery Up / Down / More Scrollbar Column */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '64px',
                    width: '16px',
                    marginLeft: '1px',
                    borderLeft: '1px solid #e2e8f0',
                    paddingLeft: '2px'
                  }}
                >
                  <button
                    onClick={(e) => handleGalleryToggle(group.id, e)}
                    title="Previous Toolpaths"
                    style={{
                      height: '18px',
                      width: '14px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronUp size={10} color="#64748b" />
                  </button>
                  <button
                    onClick={(e) => handleGalleryToggle(group.id, e)}
                    title="Next Toolpaths"
                    style={{
                      height: '18px',
                      width: '14px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronDown size={10} color="#64748b" />
                  </button>
                  <button
                    onClick={(e) => handleGalleryToggle(group.id, e)}
                    title="More Toolpaths Gallery"
                    style={{
                      height: '18px',
                      width: '14px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isGalleryOpen ? '#bae6fd' : '#f8fafc',
                      border: isGalleryOpen ? '1px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '8px', height: '1.5px', background: '#475569', marginBottom: '1px' }} />
                      <ChevronDown size={8} color="#475569" />
                    </div>
                  </button>
                </div>

                {/* Floating Gallery Dropdown Popover */}
                {isGalleryOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 150,
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
                      padding: '8px',
                      minWidth: '280px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '4px'
                    }}
                  >
                    <div
                      style={{
                        gridColumn: 'span 2',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '4px',
                        marginBottom: '4px'
                      }}
                    >
                      {group.title} Toolpath Suite Gallery
                    </div>

                    {group.galleryMoreItems.map((moreItem) => (
                      <button
                        key={moreItem.id}
                        onClick={() => handleItemClick(moreItem.action, moreItem.id, moreItem.opType)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 8px',
                          border: '1px solid transparent',
                          borderRadius: '3px',
                          background: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f0f9ff';
                          e.currentTarget.style.borderColor = '#bae6fd';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        {renderIcon(moreItem.icon, 18)}
                        <span style={{ fontSize: '11px', color: '#0f172a' }}>{moreItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <span className="ribbon-group-title" style={{ fontSize: '10.5px', color: '#64748b' }}>
                  {group.title}
                </span>
              </div>
            </div>
          );
        }

        // ==================== 2. STANDARD GROUP (STOCK) ====================
        if (group.type === 'standard') {
          return (
            <div key={group.id} className="ribbon-group" style={{ position: 'relative' }}>
              <div className="ribbon-group-items" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {group.items.map((item) => {
                  const isItemActive = item.id === 'stock_display' ? stockVisible : false;
                  const isDropdownOpen = openDropdownId === item.id;

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
                          minWidth: '50px',
                          height: '66px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 6px',
                          border: isDropdownOpen
                            ? '1px solid #0284c7'
                            : isItemActive
                            ? '1px solid #93c5fd'
                            : '1px solid transparent',
                          background: isDropdownOpen
                            ? '#e0f2fe'
                            : isItemActive
                            ? '#dbeafe'
                            : 'transparent',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ position: 'relative' }}>
                          {renderIcon(item.icon, 26)}
                          {item.hasDropdown && (
                            <ChevronDown
                              size={10}
                              color="#64748b"
                              style={{ position: 'absolute', right: -8, bottom: 2 }}
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
                            color: isItemActive ? '#1d4ed8' : '#1e293b',
                            fontWeight: isItemActive ? 600 : 400,
                            whiteSpace: 'pre-line'
                          }}
                        >
                          {item.label}
                        </span>
                      </button>

                      {/* Dropdown Popover */}
                      {item.hasDropdown && isDropdownOpen && item.dropdownItems && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            zIndex: 150,
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

              <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <span className="ribbon-group-title" style={{ fontSize: '10.5px', color: '#64748b' }}>
                  {group.title}
                </span>
              </div>
            </div>
          );
        }

        // ==================== 3. UTILITIES COMPOSITE GROUP ====================
        if (group.type === 'utilities_composite') {
          return (
            <div key={group.id} className="ribbon-group" style={{ position: 'relative' }}>
              <div className="ribbon-group-items" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* 1. Large Tool Manager Button */}
                <button
                  className="ribbon-btn-large"
                  onClick={() => handleItemClick(group.toolManagerItem.action, group.toolManagerItem.id)}
                  title={group.toolManagerItem.tooltip}
                  style={{
                    minWidth: '52px',
                    height: '66px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px 6px',
                    border: '1px solid transparent',
                    background: 'transparent',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {renderIcon(group.toolManagerItem.icon, 26)}
                  <span
                    className="btn-label"
                    style={{
                      fontSize: '11px',
                      marginTop: '3px',
                      textAlign: 'center',
                      lineHeight: '12px',
                      color: '#1e293b',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {group.toolManagerItem.label}
                  </span>
                </button>

                {/* 2. Middle Column: 3 Labeled Micro-rows */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '66px',
                    padding: '1px 0'
                  }}
                >
                  {group.labeledStack.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleItemClick(subItem.action, subItem.id)}
                      title={subItem.tooltip}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 5px',
                        height: '20px',
                        fontSize: '11px',
                        border: '1px solid transparent',
                        borderRadius: '2px',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#1e293b',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {renderIcon(subItem.icon, 15)}
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>

                {/* 3. Right Column: 3 Icon-Only Micro-buttons */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '66px',
                    padding: '1px 0',
                    borderLeft: '1px solid #e2e8f0',
                    paddingLeft: '3px'
                  }}
                >
                  {group.iconOnlyStack.map((iconItem) => (
                    <button
                      key={iconItem.id}
                      onClick={() => handleItemClick(iconItem.action, iconItem.id)}
                      title={iconItem.tooltip}
                      style={{
                        width: '22px',
                        height: '20px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent',
                        border: '1px solid transparent',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {renderIcon(iconItem.icon, 16)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2px' }}>
                <span className="ribbon-group-title" style={{ fontSize: '10.5px', color: '#64748b' }}>
                  {group.title}
                </span>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

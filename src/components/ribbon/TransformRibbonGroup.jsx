import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { TRANSFORM_RIBBON_CONFIG } from '../../config/transformRibbonConfig';
import { TRANSFORM_ICON_MAP } from '../icons/TransformIcons';

/**
 * Dynamic, schema-driven Transform Ribbon Group
 * Replaces hardcoded UI with data-driven components and Mastercam 2018 authentic styling.
 */
export default function TransformRibbonGroup({ onAction, activeAction = null }) {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleButtonClick = (item, e) => {
    e.stopPropagation();
    if (item.hasDropdown && !item.actionOnly) {
      setOpenDropdownId(openDropdownId === item.id ? null : item.id);
    }
    if (onAction && item.action) {
      onAction(item.action, item.id);
    }
  };

  const handleDropdownSubItemClick = (parentItem, subItem, e) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (onAction) {
      onAction(subItem.action || parentItem.action, subItem.id);
    }
  };

  return (
    <div className="transform-ribbon-bar" style={{ display: 'flex', alignItems: 'stretch', height: '100%' }} ref={dropdownRef}>
      {TRANSFORM_RIBBON_CONFIG.map((group) => (
        <div key={group.id} className="ribbon-group" style={{ position: 'relative' }}>
          <div className="ribbon-group-items">
            {group.items.map((item) => {
              // 1. Stacked 3-row column
              if (item.type === 'stack') {
                return (
                  <div key={item.id} className="ribbon-col-stacked" style={{ display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
                    {item.items.map((sub) => {
                      const IconComponent = TRANSFORM_ICON_MAP[sub.icon];
                      const isDropdownOpen = openDropdownId === sub.id;

                      return (
                        <div key={sub.id} style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className={`ribbon-btn-small ${activeAction === sub.id ? 'active' : ''}`}
                            onClick={(e) => handleButtonClick(sub, e)}
                            title={sub.tooltip || sub.label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '2px 6px',
                              height: '22px',
                              width: '100%',
                              textAlign: 'left'
                            }}
                          >
                            {IconComponent && <IconComponent size={15} />}
                            <span style={{ fontSize: '11px', color: 'inherit' }}>{sub.label}</span>
                            {sub.hasDropdown && <ChevronDown size={10} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
                          </button>

                          {/* Flyout Submenu for Stacked Items */}
                          {sub.hasDropdown && isDropdownOpen && sub.dropdownItems && (
                            <div
                              className="ribbon-dropdown-menu"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                zIndex: 1200,
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                minWidth: '160px',
                                padding: '4px 0'
                              }}
                            >
                              {sub.dropdownItems.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={(e) => handleDropdownSubItemClick(sub, opt, e)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '6px 12px',
                                    fontSize: '11.5px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#1e293b',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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

              // 2. Large button with icon on top and multi-line label
              const IconComponent = TRANSFORM_ICON_MAP[item.icon];
              const isDropdownOpen = openDropdownId === item.id;

              return (
                <div key={item.id} style={{ position: 'relative', display: 'flex', height: '100%' }}>
                  <button
                    type="button"
                    className={`ribbon-btn-large ${activeAction === item.id ? 'active' : ''}`}
                    onClick={(e) => handleButtonClick(item, e)}
                    title={item.tooltip || item.label}
                    style={{
                      minWidth: '52px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 6px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {IconComponent && <IconComponent size={28} />}
                    </div>
                    <div
                      className="btn-label"
                      style={{
                        fontSize: '10px',
                        lineHeight: '1.15',
                        textAlign: 'center',
                        marginTop: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>
                        {item.label.split('\n').map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line}
                            {idx < item.label.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </span>
                      {item.hasDropdown && <ChevronDown size={10} style={{ opacity: 0.7 }} />}
                    </div>
                  </button>

                  {/* Flyout Submenu for Large Buttons */}
                  {item.hasDropdown && isDropdownOpen && item.dropdownItems && (
                    <div
                      className="ribbon-dropdown-menu"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        zIndex: 1200,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                        minWidth: '180px',
                        padding: '4px 0'
                      }}
                    >
                      {item.dropdownItems.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={(e) => handleDropdownSubItemClick(item, opt, e)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            background: 'transparent',
                            border: 'none',
                            color: '#1e293b',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
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
          <span className="ribbon-group-title">{group.title}</span>
        </div>
      ))}
    </div>
  );
}

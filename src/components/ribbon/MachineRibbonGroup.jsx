import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CornerDownRight, Check } from 'lucide-react';
import { MACHINE_RIBBON_CONFIG } from '../../config/machineRibbonConfig';
import {
  DEFAULT_MACHINE_DIRECTORY,
  DEFAULT_MACHINE_ID_BY_CATEGORY,
  DEFAULT_MENU_IDS_BY_CATEGORY,
  MACHINE_DEFINITIONS_CATALOG,
  formatMachineMenuPath
} from '../../config/machineDefinitionsCatalog';
import { MACHINE_ICON_MAP } from '../icons/MachineIcons';

/**
 * Dynamic, schema-driven Machine Ribbon Group
 * Matches Mastercam 2018 Machine Type dropdowns (Default, .MCAM-MMD items, Manage List...).
 */
export default function MachineRibbonGroup({
  onAction,
  activeAction = null,
  activeMachine = null,
  machines = MACHINE_DEFINITIONS_CATALOG,
  machineMenuByCategory = DEFAULT_MENU_IDS_BY_CATEGORY,
  machineDirectory = DEFAULT_MACHINE_DIRECTORY
}) {
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
      return;
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

  const renderMachineTypeDropdown = (item) => {
    const category = item.category || 'mill';
    const defaultId = DEFAULT_MACHINE_ID_BY_CATEGORY[category] || 'mill_3x_default';
    const menuIds = machineMenuByCategory?.[category] || DEFAULT_MENU_IDS_BY_CATEGORY[category] || [];
    const activeCatMatches = activeMachine?.category === category || (item.id === 'design' && activeMachine?.id === 'design');

    return (
      <div
        className="ribbon-dropdown-menu"
        data-testid={`machine-dropdown-${category}`}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 1200,
          background: '#ffffff',
          border: '1px solid #94a3b8',
          borderRadius: '2px',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
          minWidth: '410px',
          maxWidth: '540px',
          padding: '4px 0',
          fontFamily: 'Segoe UI, Inter, system-ui, sans-serif'
        }}
      >
        {/* 1. Top "Default" Entry */}
        <button
          type="button"
          data-testid={`machine-menu-default-${category}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(null);
            onAction?.('machine_select_id', defaultId);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            textAlign: 'left',
            padding: '5px 14px 5px 28px',
            fontSize: '12px',
            background: activeMachine?.id === defaultId ? '#e0f2fe' : 'transparent',
            border: 'none',
            color: '#0f172a',
            fontWeight: activeMachine?.id === defaultId ? 600 : 400,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#cde4fb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = activeMachine?.id === defaultId ? '#e0f2fe' : 'transparent'; }}
        >
          <span>Default</span>
          {activeMachine?.id === defaultId && <Check size={12} color="#0284c7" />}
        </button>

        <div style={{ height: '1px', background: '#e2e8f0', margin: '3px 8px' }} />

        {/* 2. Configured Machine Definition Paths (.MCAM-MMD) */}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {menuIds.map((id) => {
            const mach = machines.find((m) => m.id === id);
            if (!mach) return null;
            const isSelected = activeMachine?.id === mach.id;
            const displayPath = formatMachineMenuPath(machineDirectory, mach.fileName || `${mach.name}.MCAM-MMD`);
            return (
              <button
                key={mach.id}
                type="button"
                data-testid={`machine-menu-item-${mach.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownId(null);
                  onAction?.('machine_select_id', mach.id);
                }}
                title={`${machineDirectory}${mach.fileName || mach.name}\n${mach.name} (${mach.type} • ${mach.controller})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '4px 12px 4px 28px',
                  fontSize: '11.5px',
                  background: isSelected ? '#cde4fb' : 'transparent',
                  border: isSelected ? '1px solid #93c5fd' : '1px solid transparent',
                  color: '#0f172a',
                  fontWeight: isSelected ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#cde4fb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? '#cde4fb' : 'transparent'; }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayPath}</span>
                {isSelected && <Check size={12} color="#0284c7" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
          {menuIds.length === 0 && (
            <div style={{ padding: '6px 28px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
              No menu items added. Click Manage List... to add machines.
            </div>
          )}
        </div>

        <div style={{ height: '1px', background: '#e2e8f0', margin: '3px 8px' }} />

        {/* 3. Bottom "Manage List..." Entry */}
        <button
          type="button"
          data-testid={`machine-manage-list-${category}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(null);
            onAction?.('machine_manage_list', category);
          }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '5px 14px 5px 28px',
            fontSize: '12px',
            background: 'transparent',
            border: 'none',
            color: '#0f172a',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#cde4fb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Manage List...
        </button>

        {activeCatMatches && (
          <div style={{ padding: '3px 12px 2px 28px', fontSize: '10.5px', color: '#475569', borderTop: '1px solid #f1f5f9', marginTop: '2px' }}>
            Active: <strong>{activeMachine?.name}</strong> ({activeMachine?.controller})
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="machine-ribbon-bar" style={{ display: 'flex', alignItems: 'stretch', height: '100%' }} ref={dropdownRef}>
      {MACHINE_RIBBON_CONFIG.map((group) => (
        <div key={group.id} className="ribbon-group" style={{ position: 'relative' }}>
          <div className="ribbon-group-items">
            {group.items.map((item) => {
              // 1. Stacked 2-row or 3-row column
              if (item.type === 'stack') {
                return (
                  <div key={item.id} className="ribbon-col-stacked" style={{ display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center' }}>
                    {item.items.map((sub) => {
                      const IconComponent = MACHINE_ICON_MAP[sub.icon];
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
              const IconComponent = MACHINE_ICON_MAP[item.icon];
              const isDropdownOpen = openDropdownId === item.id;
              const isSelectedCategory =
                (item.supportsMachineMenu && activeMachine?.category === item.category) ||
                (item.id === 'design' && activeMachine?.id === 'design');

              return (
                <div key={item.id} style={{ position: 'relative', display: 'flex', height: '100%' }}>
                  <button
                    type="button"
                    className={`ribbon-btn-large ${activeAction === item.id || isSelectedCategory ? 'active' : ''}`}
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
                  {item.hasDropdown && isDropdownOpen && item.supportsMachineMenu && renderMachineTypeDropdown(item)}
                  {item.hasDropdown && isDropdownOpen && !item.supportsMachineMenu && item.dropdownItems && (
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
                        minWidth: '200px',
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

          {/* Group Title with optional launcher */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span className="ribbon-group-title">{group.title}</span>
            {group.hasLauncher && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAction && group.launcherAction) {
                    onAction(group.launcherAction, group.id);
                  }
                }}
                title={`${group.title} Configuration & Options`}
                style={{
                  position: 'absolute',
                  right: '2px',
                  bottom: '1px',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  opacity: 0.65,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <CornerDownRight size={10} color="#64748b" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, ArrowUp, ArrowDown, Check, HelpCircle } from 'lucide-react';
import {
  DEFAULT_MACHINE_DIRECTORY,
  PRESET_MACHINE_DIRECTORIES,
  MACHINE_CATEGORY_META,
  addMenuItems,
  removeMenuItems,
  moveMenuItemUp,
  moveMenuItemDown
} from '../config/machineDefinitionsCatalog';

/**
 * Authentic Mastercam 2018 "Machine Definition Menu Management" Dialog
 * Controls which machine definitions (.MCAM-MMD / .LMD / etc.) appear in the ribbon Machine Type dropdowns.
 */
export default function MachineMenuManagementModal(props) {
  if (!props.isOpen) return null;
  return (
    <MachineMenuManagementDialog
      key={`${props.category || 'mill'}_${props.machineDirectory || ''}`}
      {...props}
    />
  );
}

function MachineMenuManagementDialog({
  isOpen,
  onClose,
  category = 'mill',
  machines = [],
  menuItemIds = [],
  machineDirectory = DEFAULT_MACHINE_DIRECTORY,
  onSaveMenu,
  onImportCustomMachine,
  theme = 'light'
}) {
  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);
  const [draftDirectory, setDraftDirectory] = useState(machineDirectory || DEFAULT_MACHINE_DIRECTORY);
  const [draftMenuIds, setDraftMenuIds] = useState(() => (Array.isArray(menuItemIds) ? [...menuItemIds] : []));
  const [selectedLeftIds, setSelectedLeftIds] = useState([]);
  const [selectedRightIds, setSelectedRightIds] = useState([]);
  const [showDirPresets, setShowDirPresets] = useState(false);
  const [showHelpNote, setShowHelpNote] = useState(false);

  const isLight = theme !== 'dark';
  const catMeta = MACHINE_CATEGORY_META[category] || MACHINE_CATEGORY_META.mill;

  const availableInCategory = machines.filter(
    (m) => m && (m.category === category || (!m.category && category === 'mill'))
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  const handleToggleSelect = (id, curSelected, setSelected, multi = false) => {
    if (multi) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelected([id]);
    }
  };

  const handleAddSelected = () => {
    if (selectedLeftIds.length === 0) return;
    setDraftMenuIds((prev) => addMenuItems(prev, selectedLeftIds));
    setSelectedRightIds(selectedLeftIds);
  };

  const handleRemoveSelected = () => {
    if (selectedRightIds.length === 0) return;
    setDraftMenuIds((prev) => removeMenuItems(prev, selectedRightIds));
    setSelectedRightIds([]);
  };

  const handleMoveUp = () => {
    if (selectedRightIds.length !== 1) return;
    setDraftMenuIds((prev) => moveMenuItemUp(prev, selectedRightIds[0]));
  };

  const handleMoveDown = () => {
    if (selectedRightIds.length !== 1) return;
    setDraftMenuIds((prev) => moveMenuItemDown(prev, selectedRightIds[0]));
  };

  const handleImportMachineFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    let parsedMeta = {};
    try {
      const txt = await file.text();
      if (txt.trim().startsWith('{')) {
        parsedMeta = JSON.parse(txt);
      }
    } catch {
      // treat binary/native .mcam-mmd descriptor cleanly by filename heuristics
    }

    const upper = file.name.toUpperCase();
    const axesCount = parsedMeta.axesCount
      || (upper.includes('5X') || upper.includes('5 - AXIS') || upper.includes('5-AXIS') ? 5
        : upper.includes('4X') || upper.includes('4 - AXIS') || upper.includes('4-AXIS') ? 4
        : 3);

    const newMachine = {
      id: `custom_${Date.now()}`,
      category,
      cardName: parsedMeta.name || baseName,
      name: parsedMeta.name || baseName,
      fileName: file.name,
      type: parsedMeta.type || `${axesCount}-Axis Custom Definition`,
      shortType: `${axesCount}-Axis`,
      axesCount,
      controller: parsedMeta.controller || (upper.includes('HAAS') ? 'Haas NGC' : upper.includes('SIEMENS') ? 'Siemens 840D sl' : 'Fanuc 31i'),
      controllerDialect: parsedMeta.controllerDialect || (
        upper.includes('HAAS') ? 'Haas NGC (Next Gen Control)'
          : upper.includes('SIEMENS') ? 'Siemens Sinumerik 840D sl'
          : upper.includes('HEIDENHAIN') || upper.includes('DMU') ? 'Heidenhain TNC 640 (Klartext)'
          : 'Fanuc 30i / 31i / 0i-MF'
      ),
      kinematicsPresetId: axesCount >= 5 ? 'dmu50' : axesCount === 4 ? 'hmc_4x' : 'haas_vf2',
      xTravel: parsedMeta.xTravel || 762,
      yTravel: parsedMeta.yTravel || 406,
      zTravel: parsedMeta.zTravel || 508,
      bMin: axesCount >= 5 ? -35 : 0,
      bMax: axesCount >= 5 ? 110 : 0,
      cRotaryContinuous: axesCount >= 4,
      maxRpm: parsedMeta.maxRpm || 12000,
      maxFeed: parsedMeta.maxFeed || 24000,
      spindleTaper: parsedMeta.spindleTaper || 'CAT 40',
      atcCapacity: parsedMeta.atcCapacity || 24
    };

    onImportCustomMachine?.(newMachine);
    setDraftMenuIds((prev) => addMenuItems(prev, [newMachine.id]));
    setSelectedRightIds([newMachine.id]);
    e.target.value = '';
  };

  const handleConfirmOk = () => {
    onSaveMenu?.({
      category,
      directory: draftDirectory,
      menuItemIds: draftMenuIds
    });
    onClose?.();
  };

  return (
    <dialog
      ref={dialogRef}
      data-testid="machine-menu-management-modal"
      aria-label="Machine Definition Menu Management"
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      className="mcam-dialog-reset"
      style={{
        padding: 0,
        border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
        borderRadius: '4px',
        background: isLight ? '#f1f5f9' : '#1e293b',
        color: isLight ? '#0f172a' : '#f1f5f9',
        width: 'min(740px, 94vw)',
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.35)',
        overflow: 'visible'
      }}
    >
      {/* Classic Mastercam Titlebar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: isLight ? '#ffffff' : '#0f172a',
          borderBottom: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`,
          fontSize: '12.5px',
          fontWeight: 600
        }}
      >
        <span>Machine Definition Menu Management ({catMeta.label})</span>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex'
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Modal Body */}
      <div style={{ padding: '14px 16px 12px' }}>
        {/* 1. Directory Picker Row */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '5px' }}>
            Current Machine Definition Directory:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowDirPresets((v) => !v)}
              title="Select Machine Definition Folder or Import .MCAM-MMD File"
              style={{
                width: '32px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLight ? '#ffffff' : '#334155',
                border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                borderRadius: '3px',
                cursor: 'pointer',
                color: '#d97706'
              }}
            >
              <FolderOpen size={16} />
            </button>

            <input
              type="text"
              value={draftDirectory}
              onChange={(e) => setDraftDirectory(e.target.value)}
              style={{
                flex: 1,
                height: '28px',
                padding: '0 8px',
                fontSize: '11.5px',
                fontFamily: 'Segoe UI, Inter, sans-serif',
                background: isLight ? '#e2e8f0' : '#0f172a',
                color: isLight ? '#1e293b' : '#cbd5e1',
                border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                borderRadius: '2px'
              }}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".mcam-mmd,.mcam-lmd,.mcam-wmd,.mcam-rmd,.mcam-mmmd,.json"
              onChange={handleImportMachineFile}
              style={{ display: 'none' }}
            />

            {showDirPresets && (
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  left: 0,
                  zIndex: 40,
                  background: isLight ? '#ffffff' : '#0f172a',
                  border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                  borderRadius: '4px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  minWidth: '340px',
                  padding: '4px'
                }}
              >
                {PRESET_MACHINE_DIRECTORIES.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => {
                      setDraftDirectory(dir);
                      setShowDirPresets(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 8px',
                      fontSize: '11.5px',
                      background: draftDirectory === dir ? '#dbeafe' : 'transparent',
                      color: isLight ? '#0f172a' : '#f1f5f9',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    {dir}
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`, margin: '4px 0' }} />
                <button
                  type="button"
                  onClick={() => {
                    setShowDirPresets(false);
                    fileInputRef.current?.click();
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#0284c7',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Browse local {catMeta.ext} file...
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Dual-Listbox Transfer Interface matching Mastercam 2018 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 86px 1fr 34px',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          {/* Left Box: Directory Available Machine Definitions */}
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 500, marginBottom: '4px', height: '16px', color: isLight ? '#475569' : '#94a3b8' }}>
              Available Definitions ({availableInCategory.length}):
            </div>
            <div
              data-testid="machine-available-list"
              style={{
                height: '295px',
                overflowY: 'auto',
                overflowX: 'auto',
                background: isLight ? '#ffffff' : '#0f172a',
                border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
                padding: '2px'
              }}
            >
              {availableInCategory.map((mach) => {
                const isSelected = selectedLeftIds.includes(mach.id);
                return (
                  <button
                    key={mach.id}
                    type="button"
                    onClick={(e) => handleToggleSelect(mach.id, selectedLeftIds, setSelectedLeftIds, e.ctrlKey || e.metaKey)}
                    onDoubleClick={() => {
                      setDraftMenuIds((prev) => addMenuItems(prev, [mach.id]));
                      setSelectedRightIds([mach.id]);
                    }}
                    title={`${mach.name} • ${mach.type} • ${mach.controller}`}
                    style={{
                      display: 'block',
                      minWidth: '100%',
                      width: 'max-content',
                      textAlign: 'left',
                      padding: '2px 6px',
                      fontSize: '11.5px',
                      whiteSpace: 'nowrap',
                      border: 'none',
                      cursor: 'pointer',
                      background: isSelected ? '#0284c7' : 'transparent',
                      color: isSelected ? '#ffffff' : (isLight ? '#0f172a' : '#e2e8f0')
                    }}
                  >
                    {mach.fileName || `${mach.name}${catMeta.ext}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Add / Remove Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={selectedLeftIds.length === 0}
              style={{
                width: '74px',
                height: '26px',
                fontSize: '12px',
                fontWeight: 500,
                background: isLight ? '#e2e8f0' : '#334155',
                color: isLight ? '#0f172a' : '#f1f5f9',
                border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
                borderRadius: '2px',
                cursor: selectedLeftIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedLeftIds.length === 0 ? 0.55 : 1
              }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={selectedRightIds.length === 0}
              style={{
                width: '74px',
                height: '26px',
                fontSize: '12px',
                fontWeight: 500,
                background: isLight ? '#e2e8f0' : '#334155',
                color: isLight ? '#0f172a' : '#f1f5f9',
                border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
                borderRadius: '2px',
                cursor: selectedRightIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedRightIds.length === 0 ? 0.55 : 1
              }}
            >
              Remove
            </button>
          </div>

          {/* Right Box: Machine Definition Menu Items */}
          <div>
            <div style={{ fontSize: '11.5px', fontWeight: 500, marginBottom: '4px', height: '16px' }}>
              Machine Definition Menu Items:
            </div>
            <div
              data-testid="machine-menu-items-list"
              style={{
                height: '295px',
                overflowY: 'auto',
                overflowX: 'auto',
                background: isLight ? '#ffffff' : '#0f172a',
                border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
                padding: '2px'
              }}
            >
              {draftMenuIds.map((id) => {
                const mach = machines.find((m) => m.id === id);
                if (!mach) return null;
                const isSelected = selectedRightIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={(e) => handleToggleSelect(id, selectedRightIds, setSelectedRightIds, e.ctrlKey || e.metaKey)}
                    onDoubleClick={() => {
                      setDraftMenuIds((prev) => removeMenuItems(prev, [id]));
                      setSelectedRightIds((prev) => prev.filter((x) => x !== id));
                    }}
                    title={`${mach.name} (${mach.axesCount}-Axis • ${mach.controller})`}
                    style={{
                      display: 'block',
                      minWidth: '100%',
                      width: 'max-content',
                      textAlign: 'left',
                      padding: '2px 6px',
                      fontSize: '11.5px',
                      whiteSpace: 'nowrap',
                      border: 'none',
                      cursor: 'pointer',
                      background: isSelected ? '#0284c7' : 'transparent',
                      color: isSelected ? '#ffffff' : (isLight ? '#0f172a' : '#e2e8f0')
                    }}
                  >
                    {mach.fileName || `${mach.name}${catMeta.ext}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Far Right Up / Down Reorder Arrows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleMoveUp}
              disabled={selectedRightIds.length !== 1}
              title="Move Selected Menu Item Up"
              style={{
                width: '28px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLight ? '#e2e8f0' : '#334155',
                border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
                borderRadius: '2px',
                cursor: selectedRightIds.length !== 1 ? 'not-allowed' : 'pointer',
                opacity: selectedRightIds.length !== 1 ? 0.55 : 1,
                color: isLight ? '#334155' : '#e2e8f0'
              }}
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              onClick={handleMoveDown}
              disabled={selectedRightIds.length !== 1}
              title="Move Selected Menu Item Down"
              style={{
                width: '28px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLight ? '#e2e8f0' : '#334155',
                border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
                borderRadius: '2px',
                cursor: selectedRightIds.length !== 1 ? 'not-allowed' : 'pointer',
                opacity: selectedRightIds.length !== 1 ? 0.55 : 1,
                color: isLight ? '#334155' : '#e2e8f0'
              }}
            >
              <ArrowDown size={13} />
            </button>
          </div>
        </div>

        {/* Optional Help Note Strip */}
        {showHelpNote && (
          <div
            style={{
              marginTop: '10px',
              padding: '6px 10px',
              fontSize: '11px',
              background: isLight ? '#e0f2fe' : '#0c4a6e',
              color: isLight ? '#0369a1' : '#bae6fd',
              borderRadius: '3px',
              border: '1px solid #38bdf8'
            }}
          >
            Select any {catMeta.label} machine definition on the left and click <strong>Add</strong> (or double-click) to show it inside the ribbon dropdown. Use the Up/Down arrows to reorder menu items, or click the folder button to browse custom {catMeta.ext} files.
          </div>
        )}

        {/* Bottom OK / Cancel / Help Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '8px',
            marginTop: '14px'
          }}
        >
          <button
            type="button"
            data-testid="machine-menu-ok-btn"
            onClick={handleConfirmOk}
            title="Save Menu List (OK)"
            style={{
              width: '44px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isLight ? '#e2e8f0' : '#334155',
              border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
              borderRadius: '2px',
              cursor: 'pointer',
              color: '#16a34a'
            }}
          >
            <Check size={16} strokeWidth={3} />
          </button>
          <button
            type="button"
            data-testid="machine-menu-cancel-btn"
            onClick={onClose}
            title="Cancel"
            style={{
              width: '44px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isLight ? '#e2e8f0' : '#334155',
              border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
              borderRadius: '2px',
              cursor: 'pointer',
              color: '#dc2626'
            }}
          >
            <X size={16} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => setShowHelpNote((v) => !v)}
            title="Help"
            style={{
              width: '44px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isLight ? '#e2e8f0' : '#334155',
              border: `1px solid ${isLight ? '#94a3b8' : '#475569'}`,
              borderRadius: '2px',
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>
    </dialog>
  );
}

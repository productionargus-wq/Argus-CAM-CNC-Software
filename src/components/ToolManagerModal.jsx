import React, { useEffect, useRef, useState } from 'react';
import { X, Wrench, Plus, Trash2, Copy, Check, Disc, Shield, Zap, Gauge } from 'lucide-react';

export default function ToolManagerModal({
  isOpen,
  onClose,
  tools,
  onUpdateTools,
  onOpenFeedsSpeedsModal,
  onOpenToolAssemblyStudio
}) {
  const dialogRef = useRef(null);

  const [toolList, setToolList] = useState(tools);
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id || 1);

  const selectedTool = toolList.find((t) => t.id === selectedToolId) || toolList[0];

  useEffect(() => {
    setToolList(tools);
    if (!toolList.some((t) => t.id === selectedToolId) && tools.length > 0) {
      setSelectedToolId(tools[0].id);
    }
  }, [tools]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }

    const handleBackdrop = (e) => {
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inBox =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inBox) onClose();
    };

    dialog.addEventListener('click', handleBackdrop);
    return () => dialog.removeEventListener('click', handleBackdrop);
  }, [isOpen, onClose]);

  // Recalculate RPM and Feed when diameter or Vc changes
  const handleFieldChange = (field, value) => {
    setToolList((prev) =>
      prev.map((t) => {
        if (t.id !== selectedToolId) return t;

        const updated = { ...t, [field]: value };

        // Auto-compute Spindle RPM: S = (Vc * 1000) / (pi * D)
        if (field === 'diameter' || field === 'cuttingSpeedVc') {
          const d = field === 'diameter' ? Number(value) : t.diameter;
          const vc = field === 'cuttingSpeedVc' ? Number(value) : t.cuttingSpeedVc;
          if (d > 0) {
            updated.rpm = Math.round((vc * 1000) / (Math.PI * d));
            updated.feedRate = Math.round(updated.rpm * t.flutes * t.feedPerTooth);
          }
        }

        // Auto-compute Feed Rate: F = S * Z * fz
        if (field === 'feedPerTooth' || field === 'flutes' || field === 'rpm') {
          const s = field === 'rpm' ? Number(value) : t.rpm;
          const z = field === 'flutes' ? Number(value) : t.flutes;
          const fz = field === 'feedPerTooth' ? Number(value) : t.feedPerTooth;
          updated.feedRate = Math.round(s * z * fz);
        }

        return updated;
      })
    );
  };

  const handleAddNewTool = () => {
    const nextNum = toolList.length + 1;
    const newTool = {
      id: Date.now(),
      number: nextNum,
      name: `${10}mm Flat Endmill T${nextNum}`,
      type: 'flat',
      diameter: 10,
      cornerRad: 0,
      fluteLength: 30,
      overallLength: 75,
      flutes: 4,
      cuttingSpeedVc: 180,
      rpm: 5730,
      feedPerTooth: 0.05,
      feedRate: 1146,
      plungeRate: 400,
      coolant: 'Flood'
    };
    setToolList([...toolList, newTool]);
    setSelectedToolId(newTool.id);
  };

  const handleDeleteTool = (id) => {
    if (toolList.length <= 1) {
      alert("At least one tool must remain in the tool library.");
      return;
    }
    const filtered = toolList.filter((t) => t.id !== id);
    setToolList(filtered);
    setSelectedToolId(filtered[0].id);
  };

  const handleSaveAndApply = () => {
    onUpdateTools(toolList);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      id="tool-manager-dialog"
      aria-labelledby="tool-manager-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '820px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={16} color="#10b981" />
            <span id="tool-manager-title">Mill Tool Manager &bull; Machine Tool Library</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
          {/* Left Panel: Tool List */}
          <div className="nc2check-section" style={{ padding: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="section-label">ACTIVE TOOLS ({toolList.length})</span>
              <button
                className="btn-secondary"
                onClick={handleAddNewTool}
                style={{ padding: '2px 8px', fontSize: '10px' }}
                title="Add New Tool to Library"
              >
                <Plus size={11} style={{ marginRight: '2px', verticalAlign: 'text-bottom' }} />
                New Tool
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '420px', overflowY: 'auto' }}>
              {toolList.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedToolId(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: selectedToolId === t.id ? '#1e293b' : '#0f131a',
                    border: `1px solid ${selectedToolId === t.id ? '#38bdf8' : 'transparent'}`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '4px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', color: 'white' }}>
                      T{t.number}
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>{t.name}</div>
                      <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
                        &Oslash;{t.diameter}mm &bull; {t.rpm} RPM &bull; F{t.feedRate}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTool(t.id);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    title="Delete Tool"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Tool Geometry & Speeds/Feeds Editor */}
          {selectedTool && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Tool Geometry Card */}
              <div className="nc2check-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
                  <div className="section-label" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    TOOL GEOMETRY (T{selectedTool.number})
                  </div>
                  {onOpenToolAssemblyStudio && (
                    <button
                      className="btn-secondary"
                      onClick={() => onOpenToolAssemblyStudio(selectedTool.id)}
                      style={{ padding: '2px 8px', fontSize: '10px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Open 3D Parametric Tool & Toolholder Assembly Studio"
                    >
                      <Wrench size={11} color="#38bdf8" />
                      3D Assembly Studio
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
                  <div className="form-group">
                    <label>Tool Type:</label>
                    <select
                      value={selectedTool.type}
                      onChange={(e) => handleFieldChange('type', e.target.value)}
                      className="text-input"
                    >
                      <option value="flat">Flat Endmill</option>
                      <option value="ball">Ball Nose</option>
                      <option value="bull">Bullnose (Radius)</option>
                      <option value="drill">Twist Drill</option>
                      <option value="chamfer">Chamfer Mill (90&deg;)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Diameter &Oslash; (mm):</label>
                    <input
                      type="number"
                      step="0.5"
                      className="text-input"
                      value={selectedTool.diameter}
                      onChange={(e) => handleFieldChange('diameter', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Corner Radius R (mm):</label>
                    <input
                      type="number"
                      step="0.1"
                      className="text-input"
                      value={selectedTool.cornerRad}
                      disabled={selectedTool.type !== 'bull'}
                      onChange={(e) => handleFieldChange('cornerRad', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Flute Length (mm):</label>
                    <input
                      type="number"
                      className="text-input"
                      value={selectedTool.fluteLength}
                      onChange={(e) => handleFieldChange('fluteLength', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Overall Length OAL (mm):</label>
                    <input
                      type="number"
                      className="text-input"
                      value={selectedTool.overallLength}
                      onChange={(e) => handleFieldChange('overallLength', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Flute Count (Z):</label>
                    <input
                      type="number"
                      className="text-input"
                      value={selectedTool.flutes}
                      onChange={(e) => handleFieldChange('flutes', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Speeds & Feeds Card */}
              <div className="nc2check-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '4px' }}>
                  <div className="section-label" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    SPEEDS &amp; FEEDS (CHIP LOAD CALCULATOR)
                  </div>
                  {onOpenFeedsSpeedsModal && (
                    <button
                      className="btn-secondary"
                      onClick={() => onOpenFeedsSpeedsModal(selectedTool.id)}
                      style={{ padding: '2px 8px', fontSize: '10px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Open Material Machinability Physics Calculator"
                    >
                      <Gauge size={11} color="#38bdf8" />
                      Physics Calculator
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
                  <div className="form-group">
                    <label>Cutting Speed Vc (m/min):</label>
                    <input
                      type="number"
                      className="text-input"
                      value={selectedTool.cuttingSpeedVc}
                      onChange={(e) => handleFieldChange('cuttingSpeedVc', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Spindle Speed (RPM):</label>
                    <input
                      type="number"
                      className="text-input"
                      style={{ color: '#38bdf8', fontWeight: 700 }}
                      value={selectedTool.rpm}
                      onChange={(e) => handleFieldChange('rpm', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Feed per Tooth fz (mm):</label>
                    <input
                      type="number"
                      step="0.01"
                      className="text-input"
                      value={selectedTool.feedPerTooth}
                      onChange={(e) => handleFieldChange('feedPerTooth', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cutting Feed Rate F (mm/min):</label>
                    <input
                      type="number"
                      className="text-input"
                      style={{ color: '#10b981', fontWeight: 700 }}
                      value={selectedTool.feedRate}
                      onChange={(e) => handleFieldChange('feedRate', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Plunge Rate (mm/min):</label>
                    <input
                      type="number"
                      className="text-input"
                      value={selectedTool.plungeRate}
                      onChange={(e) => handleFieldChange('plungeRate', Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Coolant Delivery:</label>
                    <select
                      value={selectedTool.coolant}
                      onChange={(e) => handleFieldChange('coolant', e.target.value)}
                      className="text-input"
                    >
                      <option value="Flood">Flood Coolant (M8)</option>
                      <option value="Mist">Mist / Air Blast (M7)</option>
                      <option value="Through">Through-Spindle (TSC)</option>
                      <option value="Off">Coolant Off (M9)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSaveAndApply}>
                  <Check size={14} />
                  <span>Save Tool Library</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  X, Sparkles, Box, Target, Layers, Scissors, CheckCircle2,
  RefreshCw, CheckSquare, Square, Wrench, ShieldCheck, ChevronRight,
  Info, Sliders, Play, AlertCircle
} from 'lucide-react';
import { analyzeModelFeatures, convertFeaturesToOperations, FEATURE_TYPES } from '../utils/featureRecognitionEngine.js';

export default function AFRModal({
  isOpen,
  onClose,
  currentModel,
  partMetrics,
  tools = [],
  operations = [],
  onApplyAFROperations,
  onHighlightFeature = null
}) {
  const dialogRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFeatureIds, setSelectedFeatureIds] = useState(new Set());
  const [featureOverrides, setFeatureOverrides] = useState({});
  const [isScanning, setIsScanning] = useState(false);

  // Analyze model features
  const afrResult = useMemo(() => {
    return analyzeModelFeatures(currentModel, partMetrics?.box, tools);
  }, [currentModel, partMetrics, tools]);

  const { features, countsByType, modelBounds } = afrResult;

  // Initialize all features as selected by default when opened
  useEffect(() => {
    if (isOpen) {
      const allIds = new Set(features.map((f) => f.id));
      setSelectedFeatureIds(allIds);
      setFeatureOverrides({});
    }
  }, [isOpen, features]);

  // Modal lifecycle & backdrop click handler
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

  // Filter features
  const filteredFeatures = useMemo(() => {
    if (activeFilter === 'all') return features;
    return features.filter((f) => f.type === activeFilter);
  }, [features, activeFilter]);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFeatureIds.size === features.length) {
      setSelectedFeatureIds(new Set());
    } else {
      setSelectedFeatureIds(new Set(features.map((f) => f.id)));
    }
  };

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setSelectedFeatureIds(new Set(features.map((f) => f.id)));
    }, 400);
  };

  const handleGenerateToolpaths = () => {
    const selected = features
      .filter((f) => selectedFeatureIds.has(f.id))
      .map((f) => {
        const override = featureOverrides[f.id];
        if (!override) return f;
        return {
          ...f,
          suggestedOp: {
            ...f.suggestedOp,
            ...override
          }
        };
      });

    const newOps = convertFeaturesToOperations(selected, operations);
    onApplyAFROperations(newOps);
    onClose();
  };

  const modelW = modelBounds ? (modelBounds.max.x - modelBounds.min.x).toFixed(1) : '90.0';
  const modelH = modelBounds ? (modelBounds.max.y - modelBounds.min.y).toFixed(1) : '35.0';
  const modelD = modelBounds ? (modelBounds.max.z - modelBounds.min.z).toFixed(1) : '65.0';

  return (
    <dialog
      ref={dialogRef}
      id="afr-studio-dialog"
      aria-labelledby="afr-dialog-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '920px', maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color, #334155)', padding: '12px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div id="afr-dialog-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
                Automatic Feature Recognition (AFR) &amp; Feature-Based Machining
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                Autonomous Solid CAD B-Rep Topology Decomposition &bull; Dynamic CAM Toolpath Synthesis
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close AFR Studio">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Model Metrics & Scanning Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card, rgba(30, 41, 59, 0.5))',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '8px',
            padding: '10px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '11px' }}>SOLID BOUNDS: </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary, #f8fafc)', fontFamily: 'var(--font-mono)' }}>
                  {modelW} &times; {modelH} &times; {modelD} mm
                </span>
              </div>
              <div style={{ width: '1px', height: '18px', background: 'var(--border-color, #334155)' }} />
              <div>
                <span style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '11px' }}>RECOGNIZED: </span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{features.length} Machinable Features</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleRescan}
                disabled={isScanning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-input, #0f172a)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '5px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #f8fafc)',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} color="#38bdf8" />
                {isScanning ? 'Scanning...' : 'Re-scan Solid'}
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: activeFilter === 'all' ? '1px solid #10b981' : '1px solid var(--border-color, #334155)',
                background: activeFilter === 'all' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                color: activeFilter === 'all' ? '#10b981' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              All Features ({features.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('planar_face')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: activeFilter === 'planar_face' ? '1px solid #3b82f6' : '1px solid var(--border-color, #334155)',
                background: activeFilter === 'planar_face' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                color: activeFilter === 'planar_face' ? '#3b82f6' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              <Layers size={13} />
              Faces ({countsByType.face || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('pocket')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: activeFilter === 'pocket' ? '1px solid #10b981' : '1px solid var(--border-color, #334155)',
                background: activeFilter === 'pocket' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                color: activeFilter === 'pocket' ? '#10b981' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              <Box size={13} />
              Pockets ({countsByType.pocket || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('hole')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: activeFilter === 'hole' ? '1px solid #ef4444' : '1px solid var(--border-color, #334155)',
                background: activeFilter === 'hole' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                color: activeFilter === 'hole' ? '#ef4444' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              <Target size={13} />
              Holes ({countsByType.hole || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('contour')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: activeFilter === 'contour' ? '1px solid #f59e0b' : '1px solid var(--border-color, #334155)',
                background: activeFilter === 'contour' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                color: activeFilter === 'contour' ? '#f59e0b' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              <Scissors size={13} />
              Contour ({countsByType.contour || 0})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('chamfer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: activeFilter === 'chamfer' ? '1px solid #ec4899' : '1px solid var(--border-color, #334155)',
                background: activeFilter === 'chamfer' ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-card, rgba(30, 41, 59, 0.5))',
                color: activeFilter === 'chamfer' ? '#ec4899' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={13} />
              Chamfers ({countsByType.chamfer || 0})
            </button>

            <div style={{ marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {selectedFeatureIds.size === features.length ? <CheckSquare size={13} color="#10b981" /> : <Square size={13} />}
                {selectedFeatureIds.size === features.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Features Table List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '340px',
            overflowY: 'auto'
          }}>
            {filteredFeatures.map((feat) => {
              const isSelected = selectedFeatureIds.has(feat.id);
              const op = feat.suggestedOp;
              const typeInfo = feat.typeInfo;

              return (
                <div
                  key={feat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--bg-card, rgba(30, 41, 59, 0.7))' : 'var(--bg-card, rgba(15, 23, 42, 0.4))',
                    border: isSelected ? `1.5px solid ${typeInfo.color}` : '1px solid var(--border-color, #334155)',
                    opacity: isSelected ? 1 : 0.65,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={() => onHighlightFeature && onHighlightFeature(feat)}
                >
                  {/* Left: Checkbox & Identity */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1.2 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(feat.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {isSelected ? <CheckSquare size={17} color={typeInfo.color} /> : <Square size={17} color="var(--text-muted, #94a3b8)" />}
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: typeInfo.color,
                          color: 'white'
                        }}>
                          {typeInfo.badgeText}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                          {feat.name}
                        </span>
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                          {(feat.confidence * 100).toFixed(0)}% Match
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)' }}>
                        {feat.description}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Recommended Tool & Parameters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, justifyContent: 'flex-end', marginRight: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary, #f8fafc)' }}>
                        {op.toolName}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', fontFamily: 'var(--font-mono)' }}>
                        Depth: {op.totalDepth}mm &bull; Stepdown: {op.stepdown}mm
                      </div>
                    </div>

                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      fontSize: '11px',
                      color: '#38bdf8',
                      fontWeight: 600
                    }}>
                      {op.badgeText === 'FM' ? 'Face Mill' : op.badgeText === 'PK' ? '2D Pocket' : op.badgeText === 'DR' ? 'Peck Drill' : op.badgeText === 'WL' ? 'Waterline' : 'Chamfer'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color, #334155)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary, #f8fafc)' }}>
              {selectedFeatureIds.size} of {features.length}
            </span> features selected for autonomous toolpath generation
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              style={{ padding: '7px 16px', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerateToolpaths}
              disabled={selectedFeatureIds.size === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                background: selectedFeatureIds.size > 0 ? 'linear-gradient(135deg, #10b981, #06b6d4)' : '#334155',
                color: 'white',
                border: 'none',
                cursor: selectedFeatureIds.size > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedFeatureIds.size > 0 ? '0 2px 10px rgba(16, 185, 129, 0.35)' : 'none'
              }}
            >
              <Sparkles size={14} />
              Auto-Generate {selectedFeatureIds.size} CAM Operations
            </button>
          </div>
        </div>

      </div>
    </dialog>
  );
}

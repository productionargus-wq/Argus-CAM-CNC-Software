import React, { useState, useEffect, useRef } from 'react';
import {
  X, Eye, Box, Sliders, Scissors, Sun, Layers,
  Rotate3D, Maximize2, Compass, CheckCircle2, ShieldAlert,
  Sparkles, RefreshCw, FlipHorizontal, Camera
} from 'lucide-react';

export default function ViewStudioModal({
  isOpen,
  onClose,
  initialTab = 'projection',
  cameraMode = 'perspective',
  onToggleCameraMode,
  cameraFov = 45,
  onChangeCameraFov,
  onSnapCamera,
  renderMode = 'shaded',
  onChangeRenderMode,
  workpieceColor = '#60a5fa',
  onChangeWorkpieceColor,
  clippingPlane = { enabled: false, axis: 'Z', offset: 0, invert: false },
  onUpdateClippingPlane,
  lightingMode = 'studio',
  onChangeLightingMode,
  layerVisibility = {},
  onToggleLayer,
  partMetrics
}) {
  const dialogRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Local state for clipping plane slider
  const [clipEnabled, setClipEnabled] = useState(clippingPlane.enabled || false);
  const [clipAxis, setClipAxis] = useState(clippingPlane.axis || 'Z');
  const [clipOffset, setClipOffset] = useState(clippingPlane.offset || 0);
  const [clipInvert, setClipInvert] = useState(clippingPlane.invert || false);

  // Local FOV state
  const [fov, setFov] = useState(cameraFov || 45);

  // Feedback toast
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setClipEnabled(clippingPlane.enabled || false);
    setClipAxis(clippingPlane.axis || 'Z');
    setClipOffset(clippingPlane.offset || 0);
    setClipInvert(clippingPlane.invert || false);
  }, [clippingPlane]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const notify = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApplyClipping = (enabled, axis, offset, invert) => {
    setClipEnabled(enabled);
    setClipAxis(axis);
    setClipOffset(offset);
    setClipInvert(invert);

    if (onUpdateClippingPlane) {
      onUpdateClippingPlane({
        enabled,
        axis,
        offset,
        invert
      });
    }
  };

  const handleResetClipping = () => {
    handleApplyClipping(false, 'Z', 0, false);
    notify("Cross-section clipping plane reset and disabled.");
  };

  const handleFovChange = (newFov) => {
    setFov(newFov);
    if (onChangeCameraFov) {
      onChangeCameraFov(newFov);
    }
  };

  // Color options
  const colorPresets = [
    { label: 'Mastercam Sky', hex: '#60a5fa' },
    { label: 'Titanium Grey', hex: '#94a3b8' },
    { label: 'Brass / Bronze', hex: '#f59e0b' },
    { label: 'Emerald Tool', hex: '#10b981' },
    { label: 'Anodized Purple', hex: '#a855f7' },
    { label: 'Signal Amber', hex: '#f97316' },
    { label: 'Clean White', hex: '#e2e8f0' }
  ];

  return (
    <dialog
      ref={dialogRef}
      className="argus-modal-dialog"
      onClick={handleBackdropClick}
      style={{
        maxWidth: '820px',
        width: '92vw',
        background: '#141824',
        border: '1px solid #2a3449',
        borderRadius: '10px',
        color: '#e2e8f0',
        padding: 0,
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
      }}
    >
      <div className="modal-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #232c3d',
        background: '#0f131d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Eye size={22} color="#38bdf8" />
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
              3D View &amp; Display Studio (Mastercam View Manager)
            </h2>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Perspective/Ortho Cameras &bull; Dynamic 3D Cross-Sections &bull; Studio PBR Shading &bull; Lighting
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #232c3d',
        background: '#111522',
        padding: '0 16px'
      }}>
        {[
          { id: 'projection', label: 'Camera & Angles', icon: Camera },
          { id: 'section', label: '3D Cross-Section Cut', icon: Scissors },
          { id: 'shading', label: 'Shading & Materials', icon: Sliders },
          { id: 'lighting', label: 'Environment Lighting', icon: Sun },
          { id: 'layers', label: 'Layer Visibility', icon: Layers }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 16px',
                border: 'none',
                background: 'transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(16, 185, 129, 0.15)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={15} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Body Content */}
      <div style={{ padding: '20px', maxHeight: '550px', overflowY: 'auto' }}>
        {/* ================= TAB 1: CAMERA PROJECTION & ANGLES ================= */}
        {activeTab === 'projection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Camera Projection Type */}
              <div style={{ background: '#10141f', padding: '16px', borderRadius: '8px', border: '1px solid #1f2738' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={16} />
                  <span>Camera Projection Mode</span>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '14px' }}>
                  Perspective provides human-eye depth cues. Orthographic renders true parallel projection required for exact CAD blueprint alignment without perspective foreshortening.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (cameraMode !== 'perspective' && onToggleCameraMode) onToggleCameraMode('perspective');
                      notify("Switched to Perspective 3D Camera.");
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: cameraMode === 'perspective' ? 'rgba(56, 189, 248, 0.15)' : '#161b29',
                      border: cameraMode === 'perspective' ? '1px solid #38bdf8' : '1px solid #283347',
                      color: cameraMode === 'perspective' ? '#38bdf8' : '#cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Perspective 3D</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>Realistic Depth</span>
                  </button>

                  <button
                    onClick={() => {
                      if (cameraMode !== 'orthographic' && onToggleCameraMode) onToggleCameraMode('orthographic');
                      notify("Switched to Orthographic Parallel CAD Projection.");
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: cameraMode === 'orthographic' ? 'rgba(56, 189, 248, 0.15)' : '#161b29',
                      border: cameraMode === 'orthographic' ? '1px solid #38bdf8' : '1px solid #283347',
                      color: cameraMode === 'orthographic' ? '#38bdf8' : '#cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Orthographic</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>True 2D/3D Blueprint</span>
                  </button>
                </div>

                {/* FOV Slider for Perspective */}
                {cameraMode === 'perspective' && (
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #1c2332' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Field of View (FOV):</span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>{fov}&deg;</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      value={fov}
                      onChange={(e) => handleFovChange(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#38bdf8' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                      <span>20&deg; (Telephoto CAD)</span>
                      <span>45&deg; (Standard)</span>
                      <span>80&deg; (Wide Angle)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Standard View Angles */}
              <div style={{ background: '#10141f', padding: '16px', borderRadius: '8px', border: '1px solid #1f2738' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Rotate3D size={16} color="#f59e0b" />
                  <span>Standard Machine View Angles</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'iso', label: 'Isometric (G54)', color: '#38bdf8' },
                    { id: 'top', label: 'Top (G17 XY)', color: '#f59e0b' },
                    { id: 'front', label: 'Front (G18 XZ)', color: '#10b981' },
                    { id: 'right', label: 'Right (G19 YZ)', color: '#a855f7' },
                    { id: 'bottom', label: 'Bottom (-Z)', color: '#94a3b8' },
                    { id: 'left', label: 'Left (-X)', color: '#94a3b8' },
                    { id: 'back', label: 'Back (-Y)', color: '#94a3b8' },
                    { id: 'fit', label: 'Fit to Screen', color: '#38bdf8' }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        if (onSnapCamera) onSnapCamera(v.id);
                        notify(`Snapped view to ${v.label}`);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#161b29',
                        border: '1px solid #283347',
                        color: '#cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textAlign: 'left'
                      }}
                    >
                      <span>{v.label}</span>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: v.color }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '6px',
              padding: '12px 16px',
              fontSize: '11px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong style={{ color: '#38bdf8' }}>Pro-Tip for CAM Machinists:</strong> Press <kbd style={{ background: '#1e293b', padding: '2px 5px', borderRadius: '3px', color: '#f8fafc' }}>Top (G17)</kbd> before drafting wireframes or calculating 2D contours, and switch to <kbd style={{ background: '#1e293b', padding: '2px 5px', borderRadius: '3px', color: '#f8fafc' }}>Isometric</kbd> to inspect 5-axis swarf toolpath clearance.
              </div>
              <button
                onClick={() => {
                  if (onSnapCamera) onSnapCamera('fit');
                  notify("Camera zoomed to fit workpiece extents.");
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#38bdf8',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                <Maximize2 size={13} />
                <span>Zoom Extents</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: 3D CROSS-SECTION CLIPPING ================= */}
        {activeTab === 'section' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ background: '#10141f', padding: '18px', borderRadius: '8px', border: '1px solid #1f2738' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scissors size={18} color="#ec4899" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    Dynamic 3D Section Plane (Slice Inspection)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => handleApplyClipping(!clipEnabled, clipAxis, clipOffset, clipInvert)}
                    style={{
                      padding: '6px 14px',
                      background: clipEnabled ? 'rgba(236, 72, 153, 0.2)' : '#1e293b',
                      border: clipEnabled ? '1px solid #ec4899' : '1px solid #334155',
                      color: clipEnabled ? '#f472b6' : '#94a3b8',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {clipEnabled ? 'Section Cut: ACTIVE' : 'Enable Section Cut'}
                  </button>

                  {clipEnabled && (
                    <button
                      onClick={handleResetClipping}
                      style={{
                        padding: '6px 12px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        color: '#94a3b8',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                Cuts through the 3D solid part in real-time along the selected axis plane to allow full visual inspection of internal bore diameters, undercut pockets, rib wall thicknesses, and toolpath depth of cut.
              </p>

              {/* Cut Plane Axis Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
                  Cutting Plane Orientation:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { axis: 'X', label: 'YZ Plane (Cut Along X)', desc: 'Sagittal Cross Section' },
                    { axis: 'Y', label: 'XZ Plane (Cut Along Y)', desc: 'Frontal Cross Section' },
                    { axis: 'Z', label: 'XY Plane (Cut Along Z)', desc: 'Depth / Bore Cross Section' }
                  ].map((p) => (
                    <button
                      key={p.axis}
                      onClick={() => handleApplyClipping(true, p.axis, clipOffset, clipInvert)}
                      style={{
                        padding: '10px',
                        background: clipAxis === p.axis ? 'rgba(236, 72, 153, 0.15)' : '#161b29',
                        border: clipAxis === p.axis ? '1px solid #ec4899' : '1px solid #283347',
                        color: clipAxis === p.axis ? '#f472b6' : '#cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{p.label}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Offset Position Slider */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Plane Position Offset:</span>
                  <span style={{ color: '#f472b6', fontWeight: 700, fontFamily: 'monospace' }}>
                    {clipOffset > 0 ? `+${clipOffset}` : clipOffset} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={clipOffset}
                  disabled={!clipEnabled}
                  onChange={(e) => handleApplyClipping(clipEnabled, clipAxis, Number(e.target.value), clipInvert)}
                  style={{ width: '100%', accentColor: '#ec4899', opacity: clipEnabled ? 1 : 0.4 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                  <span>-100 mm</span>
                  <span>0 mm (Center WCS)</span>
                  <span>+100 mm</span>
                </div>
              </div>

              {/* Flip Cut Direction Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #1c2332' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FlipHorizontal size={16} color="#94a3b8" />
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Invert Cut Normal (Slice Opposite Side)</span>
                </div>
                <input
                  type="checkbox"
                  checked={clipInvert}
                  disabled={!clipEnabled}
                  onChange={(e) => handleApplyClipping(clipEnabled, clipAxis, clipOffset, e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#ec4899', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Part Size Reference */}
            {partMetrics && (
              <div style={{ background: '#0e121c', padding: '12px 16px', borderRadius: '6px', border: '1px solid #1c2332', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>Workpiece Enclosure Bounding Range:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                  X: [-{(partMetrics.dimensions.x / 2).toFixed(1)} to +{(partMetrics.dimensions.x / 2).toFixed(1)}] mm &bull;
                  Y: [0 to {partMetrics.dimensions.y}] mm &bull;
                  Z: [-{(partMetrics.dimensions.z / 2).toFixed(1)} to +{(partMetrics.dimensions.z / 2).toFixed(1)}] mm
                </span>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: SHADING & MATERIALS ================= */}
        {activeTab === 'shading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Shading Style */}
            <div style={{ background: '#10141f', padding: '16px', borderRadius: '8px', border: '1px solid #1f2738' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px' }}>
                Studio Shading &amp; Geometry Display Style
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {[
                  { id: 'shaded', label: 'Shaded PBR', desc: 'Metallic CNC Surface', color: '#38bdf8' },
                  { id: 'edges', label: 'Shaded + Edges', desc: 'Polygonal Boundary Lines', color: '#f59e0b' },
                  { id: 'transparent', label: 'Glass / X-Ray', desc: 'Cavity Inspection Opacity', color: '#a855f7' },
                  { id: 'wireframe', label: 'Wireframe', desc: 'Pure Tessellation Mesh', color: '#10b981' },
                  { id: 'normals', label: 'Normal Vectors', desc: 'Curvature & Draft Angles', color: '#ec4899' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if (onChangeRenderMode) onChangeRenderMode(mode.id);
                      notify(`Render mode set to: ${mode.label}`);
                    }}
                    style={{
                      padding: '12px 10px',
                      background: renderMode === mode.id ? 'rgba(56, 189, 248, 0.15)' : '#161b29',
                      border: renderMode === mode.id ? '1px solid #38bdf8' : '1px solid #283347',
                      color: renderMode === mode.id ? '#38bdf8' : '#cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '11px' }}>{mode.label}</span>
                    <span style={{ fontSize: '9px', color: '#94a3b8' }}>{mode.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Workpiece Color Presets */}
            <div style={{ background: '#10141f', padding: '16px', borderRadius: '8px', border: '1px solid #1f2738' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>
                Solid Part Material Color Tint
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {colorPresets.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => {
                      if (onChangeWorkpieceColor) onChangeWorkpieceColor(preset.hex);
                      notify(`Part color changed to: ${preset.label}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      background: workpieceColor === preset.hex ? 'rgba(255,255,255,0.1)' : '#161b29',
                      border: workpieceColor === preset.hex ? `2px solid ${preset.hex}` : '1px solid #283347',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.hex }} />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: ENVIRONMENT LIGHTING ================= */}
        {activeTab === 'lighting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ background: '#10141f', padding: '18px', borderRadius: '8px', border: '1px solid #1f2738' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sun size={17} color="#f59e0b" />
                <span>Shop Floor &amp; CAD Studio Lighting Environment</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  {
                    id: 'studio',
                    label: 'CAD Dark Studio',
                    desc: 'Deep navy backdrop with balanced key and fill lighting. Soft specular highlights ideal for long programming sessions.',
                    bg: '#131722',
                    badge: 'Default'
                  },
                  {
                    id: 'shop',
                    label: 'CNC Machine Enclosure',
                    desc: 'Bright overhead fluorescent high-bay illumination replicating the inside of a sealed DMG MORI milling enclosure.',
                    bg: '#0f172a',
                    badge: 'High Visibility'
                  },
                  {
                    id: 'inspect',
                    label: 'Quality Inspection Studio',
                    desc: 'High-contrast angled raking light that highlights micro-ridges, stepdown scallops, surface chatter, and cusps.',
                    bg: '#090d16',
                    badge: 'Scallop Inspector'
                  }
                ].map((env) => (
                  <button
                    key={env.id}
                    onClick={() => {
                      if (onChangeLightingMode) onChangeLightingMode(env.id);
                      notify(`Lighting environment changed to: ${env.label}`);
                    }}
                    style={{
                      padding: '16px',
                      background: lightingMode === env.id ? 'rgba(245, 158, 11, 0.15)' : '#161b29',
                      border: lightingMode === env.id ? '1px solid #f59e0b' : '1px solid #283347',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '12px', color: lightingMode === env.id ? '#fbbf24' : '#f8fafc' }}>
                        {env.label}
                      </span>
                      <span style={{ fontSize: '9px', background: '#1e293b', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                        {env.badge}
                      </span>
                    </div>
                    <p style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                      {env.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: LAYER & ENTITY VISIBILITY ================= */}
        {activeTab === 'layers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#10141f', padding: '16px', borderRadius: '8px', border: '1px solid #1f2738' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px' }}>
                Mastercam Level &amp; Entity Visibility Switches
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { key: 'part', label: 'Level 1: Part Solid Workpiece', color: '#60a5fa' },
                  { key: 'wireframe', label: 'Level 10: Wireframe Curves & 2D Geometry', color: '#38bdf8' },
                  { key: 'surfaces', label: 'Level 15: Drive & Check Surface Sheets', color: '#06b6d4' },
                  { key: 'stock', label: 'Level 20: Raw Stock Bounding Envelope', color: '#f59e0b' },
                  { key: 'fixture', label: 'Level 30: Machine Vise & Fixture Clamps', color: '#94a3b8' },
                  { key: 'toolpaths', label: 'Level 50: CNC Toolpath Feed Cutting Moves', color: '#10b981' },
                  { key: 'rapids', label: 'Level 60: Rapid Clearance G0 Moves', color: '#06b6d4' },
                  { key: 'dimensions', label: 'Level 100: Drafting Dimensions & Tolerances', color: '#e2e8f0' },
                  { key: 'bed', label: 'CNC Machine Table Bed Grid', color: '#64748b' },
                  { key: 'wcs', label: 'Active Work Coordinate (G54 Origin Triad)', color: '#ef4444' }
                ].map((layer) => {
                  const isVisible = layerVisibility[layer.key] !== false;
                  return (
                    <div
                      key={layer.key}
                      onClick={() => {
                        if (onToggleLayer) onToggleLayer(layer.key);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#161b29',
                        border: '1px solid #283347',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: layer.color }} />
                        <span style={{ fontSize: '11px', color: isVisible ? '#f8fafc' : '#64748b' }}>
                          {layer.label}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => {}}
                        style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderTop: '1px solid #232c3d',
        background: '#0f131d'
      }}>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Real-time OpenGL/WebGL 3D Rendering &bull; Three.js r128 &bull; 60 FPS
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '7px 20px',
            background: '#2563eb',
            border: 'none',
            borderRadius: '5px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Done
        </button>
      </div>
    </dialog>
  );
}

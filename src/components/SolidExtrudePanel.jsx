import React, { useState } from 'react';
import {
  HelpCircle, Check, X, RotateCcw, Link2, ArrowLeftRight,
  ChevronDown, ChevronUp, MousePointer
} from 'lucide-react';

export default function SolidExtrudePanel({
  isOpen = true,
  onClose,
  chains = [],
  onReverseChain,
  onOpenChaining,
  onApplyExtrude,
  solidsList = [],
  activeTargetSolidId = 1,
  onSelectTargetSolid
}) {
  const [activeTab, setActiveTab] = useState('Basic'); // 'Basic' | 'Advanced'
  const [operationName, setOperationName] = useState('Extrude');
  const [operationType, setOperationType] = useState('create'); // 'create' | 'cut' | 'boss'
  const [createSingleOperation, setCreateSingleOperation] = useState(true);
  const [autoDetermineType, setAutoDetermineType] = useState(false);

  // Chains state
  const [selectedChainIndex, setSelectedChainIndex] = useState(0);

  // Distance state
  const [distanceMode, setDistanceMode] = useState('distance'); // 'distance' | 'through_all'
  const [extrudeDistance, setExtrudeDistance] = useState(50.0);
  const [bothDirections, setBothDirections] = useState(false);
  const [trimToFaces, setTrimToFaces] = useState(false);

  // Advanced tab parameters
  const [draftAngle, setDraftAngle] = useState(0.0);
  const [draftOutward, setDraftOutward] = useState(false);
  const [wallThickness, setWallThickness] = useState(0.0);

  // Collapsible section states
  const [isOpExpanded, setIsOpExpanded] = useState(true);
  const [isChainsExpanded, setIsChainsExpanded] = useState(true);
  const [isDistExpanded, setIsDistExpanded] = useState(true);

  if (!isOpen) return null;

  const handleApply = (stayOpen = false) => {
    if (onApplyExtrude) {
      onApplyExtrude({
        name: operationName,
        type: operationType, // 'create' | 'cut' | 'boss'
        chains,
        distance: distanceMode === 'through_all' ? 100.0 : Number(extrudeDistance) || 50.0,
        bothDirections,
        trimToFaces,
        draftAngle: Number(draftAngle) || 0,
        draftOutward,
        targetSolidId: activeTargetSolidId
      });
    }
    if (!stayOpen && onClose) {
      onClose();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f8fafc',
        borderRight: '1px solid #cbd5e1',
        fontSize: '11px',
        color: '#1e293b',
        userSelect: 'none',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* 1. Mastercam Header Bar (Image 4) */}
      <div
        style={{
          padding: '6px 8px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>
          Solid Extrude
        </span>

        {/* Action Glyphs (Image 4): ? Help, ✔+ Apply & Stay, ✔ OK, ✕ Cancel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Help ? */}
          <button
            type="button"
            style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 900 }}
            title="Help"
          >
            ?
          </button>

          {/* Double Checkmark ✔+ (Apply & Stay) */}
          <button
            type="button"
            onClick={() => handleApply(true)}
            style={{
              width: '24px',
              height: '22px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800
            }}
            title="Apply and create another operation (Keep open)"
          >
            ✓+
          </button>

          {/* Green Checkmark ✔ (OK & Close) */}
          <button
            type="button"
            onClick={() => handleApply(false)}
            style={{
              width: '24px',
              height: '22px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="OK (Execute and close)"
          >
            <Check size={14} strokeWidth={3} />
          </button>

          {/* Red Cancel ✕ */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '22px',
              height: '22px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Cancel Extrude (Esc)"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs: Basic / Advanced (Image 4) */}
      <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
        <button
          type="button"
          onClick={() => setActiveTab('Basic')}
          style={{
            padding: '4px 12px',
            background: activeTab === 'Basic' ? '#ffffff' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Basic' ? '2px solid #0284c7' : 'none',
            fontWeight: activeTab === 'Basic' ? 600 : 400,
            color: activeTab === 'Basic' ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Basic
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Advanced')}
          style={{
            padding: '4px 12px',
            background: activeTab === 'Advanced' ? '#ffffff' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Advanced' ? '2px solid #0284c7' : 'none',
            fontWeight: activeTab === 'Advanced' ? 600 : 400,
            color: activeTab === 'Advanced' ? '#0f172a' : '#64748b',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Advanced
        </button>
      </div>

      {/* 3. Panel Body (Scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeTab === 'Basic' ? (
          <>
            {/* ================= SECTION 1: OPERATION ================= */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '2px', background: '#ffffff', overflow: 'hidden' }}>
              <div
                onClick={() => setIsOpExpanded(!isOpExpanded)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f1f5f9',
                  borderBottom: isOpExpanded ? '1px solid #cbd5e1' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <span>Operation</span>
                {isOpExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>

              {isOpExpanded && (
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Name field */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '45px', color: '#475569' }}>Name:</span>
                    <input
                      type="text"
                      value={operationName}
                      onChange={(e) => setOperationName(e.target.value)}
                      style={{
                        flex: 1,
                        height: '22px',
                        border: '1px solid #cbd5e1',
                        padding: '0 6px',
                        fontSize: '11px',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  {/* Type Radio Group (Image 4) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
                    <span style={{ color: '#475569', fontWeight: 500 }}>Type:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="extrude_type"
                        value="create"
                        checked={operationType === 'create'}
                        onChange={() => setOperationType('create')}
                      />
                      <span>Create body</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="extrude_type"
                        value="cut"
                        checked={operationType === 'cut'}
                        onChange={() => setOperationType('cut')}
                      />
                      <span>Cut body</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="extrude_type"
                        value="boss"
                        checked={operationType === 'boss'}
                        onChange={() => setOperationType('boss')}
                      />
                      <span>Add boss</span>
                    </label>
                  </div>

                  {/* Target Solid Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ width: '45px', color: '#475569' }}>Target:</span>
                    <select
                      value={activeTargetSolidId}
                      onChange={(e) => onSelectTargetSolid?.(Number(e.target.value))}
                      style={{
                        flex: 1,
                        height: '22px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '11px',
                        padding: '0 4px'
                      }}
                    >
                      {solidsList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name || `Solid ${s.id}`}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      style={{ width: '22px', height: '22px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Pick target solid body in 3D viewport"
                    >
                      <MousePointer size={12} color="#0284c7" />
                    </button>
                  </div>

                  {/* Checkboxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={createSingleOperation}
                        onChange={(e) => setCreateSingleOperation(e.target.checked)}
                      />
                      <span>Create a single operation</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoDetermineType}
                        onChange={(e) => setAutoDetermineType(e.target.checked)}
                      />
                      <span>Automatically determine operation type</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* ================= SECTION 2: CHAINS ================= */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '2px', background: '#ffffff', overflow: 'hidden' }}>
              <div
                onClick={() => setIsChainsExpanded(!isChainsExpanded)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f1f5f9',
                  borderBottom: isChainsExpanded ? '1px solid #cbd5e1' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <span>Chains ({chains.length})</span>
                {isChainsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>

              {isChainsExpanded && (
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Chains List Box (Image 4) */}
                  <div
                    style={{
                      height: '70px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      overflowY: 'auto',
                      padding: '2px'
                    }}
                  >
                    {chains.length === 0 ? (
                      <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '6px', fontSize: '10.5px' }}>
                        (No chains selected - click below or on viewport)
                      </div>
                    ) : (
                      chains.map((chain, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedChainIndex(idx)}
                          style={{
                            padding: '3px 6px',
                            backgroundColor: selectedChainIndex === idx ? '#0078d7' : 'transparent',
                            color: selectedChainIndex === idx ? '#ffffff' : '#0f172a',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>{chain.name || `Chain ${idx + 1}`}</span>
                          <span style={{ fontSize: '9px', opacity: 0.8 }}>
                            {chain.points?.length ? `${chain.points.length} pts` : 'Closed Loop'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chains Toolbar: Reverse direction, Chaining dialog button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => onReverseChain?.(selectedChainIndex)}
                      disabled={chains.length === 0}
                      style={{
                        padding: '3px 8px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        cursor: chains.length > 0 ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px'
                      }}
                      title="Reverse Chain Direction (<->)"
                    >
                      <ArrowLeftRight size={12} color="#0284c7" />
                      <span>Reverse</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenChaining}
                      style={{
                        padding: '3px 8px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px'
                      }}
                      title="Open Mastercam Chaining Palette"
                    >
                      <Link2 size={12} color="#0284c7" />
                      <span>Chaining...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================= SECTION 3: DISTANCE ================= */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '2px', background: '#ffffff', overflow: 'hidden' }}>
              <div
                onClick={() => setIsDistExpanded(!isDistExpanded)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f1f5f9',
                  borderBottom: isDistExpanded ? '1px solid #cbd5e1' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <span>Distance</span>
                {isDistExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </div>

              {isDistExpanded && (
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Distance radio + Numeric input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dist_mode"
                        value="distance"
                        checked={distanceMode === 'distance'}
                        onChange={() => setDistanceMode('distance')}
                      />
                      <span>Distance:</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={extrudeDistance}
                      onChange={(e) => setExtrudeDistance(parseFloat(e.target.value) || 0)}
                      disabled={distanceMode !== 'distance'}
                      style={{
                        width: '65px',
                        height: '22px',
                        border: '1px solid #cbd5e1',
                        padding: '0 4px',
                        textAlign: 'right',
                        fontSize: '11px',
                        backgroundColor: distanceMode === 'distance' ? '#ffffff' : '#f1f5f9'
                      }}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>

                  {/* Through all radio */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="dist_mode"
                        value="through_all"
                        checked={distanceMode === 'through_all'}
                        onChange={() => setDistanceMode('through_all')}
                      />
                      <span>Through all</span>
                    </label>
                  </div>

                  {/* Checkboxes: Both directions & Trim to Faces (Image 4) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={bothDirections}
                        onChange={(e) => setBothDirections(e.target.checked)}
                      />
                      <span>Both directions</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={trimToFaces}
                        onChange={(e) => setTrimToFaces(e.target.checked)}
                      />
                      <span>Trim to Faces</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ================= ADVANCED TAB ================= */
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '2px', background: '#ffffff', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Draft & Thin Wall Options</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '80px', color: '#475569' }}>Draft Angle:</span>
              <input
                type="number"
                step="0.5"
                value={draftAngle}
                onChange={(e) => setDraftAngle(parseFloat(e.target.value) || 0)}
                style={{ width: '60px', height: '22px', border: '1px solid #cbd5e1', padding: '0 4px', fontSize: '11px', textAlign: 'right' }}
              />
              <span>deg</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draftOutward}
                onChange={(e) => setDraftOutward(e.target.checked)}
              />
              <span>Draft Outward</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ width: '80px', color: '#475569' }}>Thin Wall:</span>
              <input
                type="number"
                step="0.5"
                value={wallThickness}
                onChange={(e) => setWallThickness(parseFloat(e.target.value) || 0)}
                style={{ width: '60px', height: '22px', border: '1px solid #cbd5e1', padding: '0 4px', fontSize: '11px', textAlign: 'right' }}
              />
              <span>mm</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Quick Status */}
      <div style={{ padding: '4px 8px', borderTop: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Target: Solid #{activeTargetSolidId}</span>
        <span>{chains.length} chain(s) armed</span>
      </div>
    </div>
  );
}

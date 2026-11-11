import React, { useState, useEffect, useRef, useId } from 'react';
import {
  X, Settings, Cpu, Gauge, Sliders, Sparkles, Save, Check
} from 'lucide-react';

const MACHINE_FLEET_ORDER = ['dmu50', 'haas_vf2', 'robodrill', 'integrex'];

const MACHINE_PRESETS = {
  dmu50: {
    id: 'dmu50',
    cardName: 'DMG MORI DMU 50',
    name: 'DMG MORI DMU 50 (5X)',
    type: '5-Axis Trunnion B/C',
    shortType: '5-Axis Trunnion',
    controller: 'Heidenhain TNC 640',
    xTravel: 650,
    yTravel: 520,
    zTravel: 475,
    bMin: -35,
    bMax: 110,
    cRotaryContinuous: true,
    maxRpm: 15000,
    maxFeed: 30000,
    spindleTaper: 'HSK-A63',
    atcCapacity: 60,
    coolantTSC: true,
    tcpEnabled: true,
    arcFormat: 'ijk',
    safeZ: 50
  },
  haas_vf2: {
    id: 'haas_vf2',
    cardName: 'Haas VF-2',
    name: 'Haas VF-2 (3X VMC)',
    type: '3-Axis Vertical',
    shortType: '3-Axis Vertical',
    controller: 'Haas NGC',
    xTravel: 762,
    yTravel: 406,
    zTravel: 508,
    bMin: 0,
    bMax: 0,
    cRotaryContinuous: false,
    maxRpm: 10000,
    maxFeed: 25400,
    spindleTaper: 'CAT 40',
    atcCapacity: 24,
    coolantTSC: false,
    tcpEnabled: false,
    arcFormat: 'ijk',
    safeZ: 50
  },
  robodrill: {
    id: 'robodrill',
    cardName: 'Fanuc Robodrill',
    name: 'Fanuc Robodrill D21',
    type: 'High Speed 3-Axis',
    shortType: 'High Speed 3-Axis',
    controller: 'Fanuc 31i-B5',
    xTravel: 500,
    yTravel: 400,
    zTravel: 330,
    bMin: 0,
    bMax: 0,
    cRotaryContinuous: false,
    maxRpm: 24000,
    maxFeed: 54000,
    spindleTaper: 'BT30 / BBT30',
    atcCapacity: 21,
    coolantTSC: false,
    tcpEnabled: false,
    arcFormat: 'ijk',
    safeZ: 50
  },
  integrex: {
    id: 'integrex',
    cardName: 'Mazak Integrex',
    name: 'Mazak Integrex i-200',
    type: '5-Axis Mill-Turn',
    shortType: '5-Axis Mill-Turn',
    controller: 'Mazak SmoothX',
    xTravel: 615,
    yTravel: 260,
    zTravel: 1077,
    bMin: -30,
    bMax: 120,
    cRotaryContinuous: true,
    maxRpm: 12000,
    maxFeed: 38000,
    spindleTaper: 'Capto C6',
    atcCapacity: 36,
    coolantTSC: true,
    tcpEnabled: true,
    arcFormat: 'ijk',
    safeZ: 50
  }
};

function resolveMachineSnapshot(machineId, machines = [], fallbackMachine = null) {
  const preset = MACHINE_PRESETS[machineId] || MACHINE_PRESETS.dmu50;
  const saved = machines.find((m) => m.id === machineId)
    || (fallbackMachine?.id === machineId ? fallbackMachine : null);

  return {
    id: preset.id,
    name: saved?.name || preset.name,
    controller: saved?.controller || preset.controller,
    type: saved?.type || preset.type,
    xTravel: saved?.travel?.x ?? preset.xTravel,
    yTravel: saved?.travel?.y ?? preset.yTravel,
    zTravel: saved?.travel?.z ?? preset.zTravel,
    bMin: saved?.rotary?.bMin ?? preset.bMin,
    bMax: saved?.rotary?.bMax ?? preset.bMax,
    cRotaryContinuous: saved?.rotary?.continuousC ?? preset.cRotaryContinuous,
    maxRpm: saved?.spindle?.maxRpm ?? saved?.maxRpm ?? preset.maxRpm,
    maxFeed: saved?.spindle?.maxFeed ?? saved?.maxFeed ?? preset.maxFeed,
    spindleTaper: saved?.spindle?.taper ?? preset.spindleTaper,
    atcCapacity: saved?.spindle?.atc ?? preset.atcCapacity,
    coolantTSC: saved?.spindle?.tsc ?? preset.coolantTSC,
    tcpEnabled: saved?.post?.tcp ?? preset.tcpEnabled,
    arcFormat: saved?.post?.arc ?? preset.arcFormat,
    safeZ: saved?.post?.safeZ ?? preset.safeZ
  };
}

function MachineConfigForm({
  titleId,
  machines,
  activeMachine,
  onSelectMachine,
  onUpdateMachineConfig,
  onClose
}) {
  const uid = useId();
  const initialSnap = resolveMachineSnapshot(activeMachine?.id || 'dmu50', machines, activeMachine);

  // Machine Parameters state
  const [selectedMachineId, setSelectedMachineId] = useState(initialSnap.id);
  const [machineName, setMachineName] = useState(initialSnap.name);
  const [controller, setController] = useState(initialSnap.controller);
  const [machineType, setMachineType] = useState(initialSnap.type);

  // Envelopes
  const [xTravel, setXTravel] = useState(String(initialSnap.xTravel));
  const [yTravel, setYTravel] = useState(String(initialSnap.yTravel));
  const [zTravel, setZTravel] = useState(String(initialSnap.zTravel));
  const [bMin, setBMin] = useState(String(initialSnap.bMin));
  const [bMax, setBMax] = useState(String(initialSnap.bMax));
  const [cRotaryContinuous, setCRotaryContinuous] = useState(Boolean(initialSnap.cRotaryContinuous));

  // Spindle & Feeds
  const [maxRpm, setMaxRpm] = useState(String(initialSnap.maxRpm));
  const [maxFeed, setMaxFeed] = useState(String(initialSnap.maxFeed));
  const [spindleTaper, setSpindleTaper] = useState(initialSnap.spindleTaper);
  const [atcCapacity, setAtcCapacity] = useState(String(initialSnap.atcCapacity));
  const [coolantTSC, setCoolantTSC] = useState(Boolean(initialSnap.coolantTSC));

  // Post processor defaults
  const [tcpEnabled, setTcpEnabled] = useState(Boolean(initialSnap.tcpEnabled));
  const [arcFormat, setArcFormat] = useState(initialSnap.arcFormat);
  const [safeZ, setSafeZ] = useState(String(initialSnap.safeZ));

  // Feedback
  const [feedback, setFeedback] = useState(null);

  const applySnapshotToForm = (snap) => {
    setSelectedMachineId(snap.id);
    setMachineName(snap.name);
    setController(snap.controller);
    setMachineType(snap.type);
    setXTravel(String(snap.xTravel));
    setYTravel(String(snap.yTravel));
    setZTravel(String(snap.zTravel));
    setBMin(String(snap.bMin));
    setBMax(String(snap.bMax));
    setCRotaryContinuous(Boolean(snap.cRotaryContinuous));
    setMaxRpm(String(snap.maxRpm));
    setMaxFeed(String(snap.maxFeed));
    setSpindleTaper(snap.spindleTaper);
    setAtcCapacity(String(snap.atcCapacity));
    setCoolantTSC(Boolean(snap.coolantTSC));
    setTcpEnabled(Boolean(snap.tcpEnabled));
    setArcFormat(snap.arcFormat);
    setSafeZ(String(snap.safeZ));
  };

  const handleMachineSelect = (id) => {
    const snap = resolveMachineSnapshot(id, machines, null);
    applySnapshotToForm(snap);
    if (onSelectMachine) onSelectMachine(id);
    setFeedback(`Loaded kinematic profile for ${snap.name}`);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const numOr = (val, fallback) => {
      const n = Number(val);
      return Number.isFinite(n) ? n : fallback;
    };
    const preset = MACHINE_PRESETS[selectedMachineId] || MACHINE_PRESETS.dmu50;

    if (onUpdateMachineConfig) {
      onUpdateMachineConfig({
        id: selectedMachineId,
        name: machineName,
        controller,
        type: machineType,
        maxRpm: numOr(maxRpm, preset.maxRpm),
        maxFeed: numOr(maxFeed, preset.maxFeed),
        travel: {
          x: numOr(xTravel, preset.xTravel),
          y: numOr(yTravel, preset.yTravel),
          z: numOr(zTravel, preset.zTravel)
        },
        rotary: {
          bMin: numOr(bMin, preset.bMin),
          bMax: numOr(bMax, preset.bMax),
          continuousC: cRotaryContinuous
        },
        spindle: {
          maxRpm: numOr(maxRpm, preset.maxRpm),
          maxFeed: numOr(maxFeed, preset.maxFeed),
          taper: spindleTaper,
          atc: numOr(atcCapacity, preset.atcCapacity),
          tsc: coolantTSC
        },
        post: {
          tcp: tcpEnabled,
          arc: arcFormat,
          safeZ: numOr(safeZ, preset.safeZ)
        }
      });
    } else if (onSelectMachine) {
      onSelectMachine(selectedMachineId);
    }

    onClose?.();
  };

  const isFiveAxis = machineType.includes('5-Axis');

  return (
    <div className="modal-window mcm-window">
      {/* Header */}
      <div className="mcm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: '#dbeafe',
              border: '1px solid #93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Cpu size={16} color="#1d4ed8" />
          </div>
          <div>
            <h2 id={titleId} className="mcm-title">
              Mastercam Machine &bull; CNC Machine Definition, Kinematics &amp; Controller Setup
            </h2>
            <p className="mcm-subtitle">
              Active Profile: <strong>{machineName}</strong> &bull; {machineType} &bull; {controller}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close Machine Definition dialog"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="mcm-feedback" role="status" aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            className="mcm-feedback-close"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss status message"
          >
            &times;
          </button>
        </div>
      )}

      <form onSubmit={handleSaveConfig} className="mcm-form">
        {/* Modal Body */}
        <div className="mcm-body">
          {/* 1. Machine Fleet Selection */}
          <section className="mcm-section" aria-labelledby={`${uid}-sec-fleet`}>
            <h3 id={`${uid}-sec-fleet`} className="mcm-section-title">
              <Cpu size={14} color="#2563eb" />
              <span>Active CNC Machine in Shop Fleet</span>
            </h3>

            <div className="mcm-fleet-grid">
              {MACHINE_FLEET_ORDER.map((id) => {
                const preset = MACHINE_PRESETS[id];
                const saved = machines.find((m) => m.id === id);
                const displayCtrl = saved?.controller || preset.controller;
                const isSelected = selectedMachineId === id;

                return (
                  <button
                    key={id}
                    type="button"
                    autoFocus={isSelected}
                    aria-pressed={isSelected}
                    onClick={() => handleMachineSelect(id)}
                    className={`mcm-fleet-card ${isSelected ? 'is-selected' : ''}`}
                  >
                    <div className="mcm-card-top">
                      <span className="mcm-card-name">{preset.cardName}</span>
                      {isSelected && (
                        <span className="mcm-active-pill">
                          <Check size={10} strokeWidth={3} />
                          Active
                        </span>
                      )}
                    </div>
                    <span className="mcm-card-type">{preset.shortType}</span>
                    <span className="mcm-card-ctrl">{displayCtrl}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Kinematic Travel Envelopes */}
          <section className="mcm-section" aria-labelledby={`${uid}-sec-travel`}>
            <h3 id={`${uid}-sec-travel`} className="mcm-section-title">
              <Gauge size={14} color="#0369a1" />
              <span>Axis Travel Limits &amp; Rotary Boundaries</span>
            </h3>

            <div className="mcm-grid-3">
              <div className="mcm-field">
                <label htmlFor={`${uid}-x`} className="mcm-label axis-x">
                  X-Axis Travel (mm)
                </label>
                <input
                  id={`${uid}-x`}
                  type="number"
                  step="any"
                  className="mcm-control mcm-control-mono"
                  value={xTravel}
                  onChange={(e) => setXTravel(e.target.value)}
                />
              </div>

              <div className="mcm-field">
                <label htmlFor={`${uid}-y`} className="mcm-label axis-y">
                  Y-Axis Travel (mm)
                </label>
                <input
                  id={`${uid}-y`}
                  type="number"
                  step="any"
                  className="mcm-control mcm-control-mono"
                  value={yTravel}
                  onChange={(e) => setYTravel(e.target.value)}
                />
              </div>

              <div className="mcm-field">
                <label htmlFor={`${uid}-z`} className="mcm-label axis-z">
                  Z-Axis Travel (mm)
                </label>
                <input
                  id={`${uid}-z`}
                  type="number"
                  step="any"
                  className="mcm-control mcm-control-mono"
                  value={zTravel}
                  onChange={(e) => setZTravel(e.target.value)}
                />
              </div>
            </div>

            {isFiveAxis && (
              <div className="mcm-rotary-row mcm-grid-2">
                <div className="mcm-field">
                  <label htmlFor={`${uid}-bmin`} className="mcm-label">
                    B-Axis Swivel Range (deg)
                  </label>
                  <div className="mcm-inline-range">
                    <input
                      id={`${uid}-bmin`}
                      type="number"
                      step="any"
                      aria-label="B-Axis minimum angle in degrees"
                      className="mcm-control mcm-control-mono"
                      value={bMin}
                      onChange={(e) => setBMin(e.target.value)}
                    />
                    <span className="mcm-range-sep">to</span>
                    <input
                      id={`${uid}-bmax`}
                      type="number"
                      step="any"
                      aria-label="B-Axis maximum angle in degrees"
                      className="mcm-control mcm-control-mono"
                      value={bMax}
                      onChange={(e) => setBMax(e.target.value)}
                    />
                    <span className="mcm-range-sep">deg</span>
                  </div>
                </div>

                <div className="mcm-field">
                  <span className="mcm-label">C-Axis Rotary Table</span>
                  <label htmlFor={`${uid}-contC`} className="mcm-checkbox-row">
                    <input
                      id={`${uid}-contC`}
                      type="checkbox"
                      className="mcm-checkbox"
                      checked={cRotaryContinuous}
                      onChange={(e) => setCRotaryContinuous(e.target.checked)}
                    />
                    <span className="mcm-checkbox-label">
                      Continuous Infinite 360&deg; Rotation
                    </span>
                  </label>
                </div>
              </div>
            )}
          </section>

          {/* 3. Spindle & Dynamic Capabilities */}
          <section className="mcm-section" aria-labelledby={`${uid}-sec-spindle`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h3 id={`${uid}-sec-spindle`} className="mcm-section-title" style={{ margin: 0 }}>
                <Sliders size={14} color="#047857" />
                <span>Spindle Dynamics &amp; Tool Changer (ATC)</span>
              </h3>
              <label htmlFor={`${uid}-tsc`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  id={`${uid}-tsc`}
                  type="checkbox"
                  className="mcm-checkbox"
                  checked={coolantTSC}
                  onChange={(e) => setCoolantTSC(e.target.checked)}
                />
                <span className="mcm-checkbox-label" style={{ fontSize: '11px' }}>
                  Through-Spindle Coolant (TSC)
                </span>
              </label>
            </div>

            <div className="mcm-grid-4">
              <div className="mcm-field">
                <label htmlFor={`${uid}-rpm`} className="mcm-label">
                  Max Spindle RPM
                </label>
                <input
                  id={`${uid}-rpm`}
                  type="number"
                  step="any"
                  min="1"
                  className="mcm-control mcm-control-mono"
                  value={maxRpm}
                  onChange={(e) => setMaxRpm(e.target.value)}
                />
              </div>

              <div className="mcm-field">
                <label htmlFor={`${uid}-feed`} className="mcm-label">
                  Max Rapid (mm/min)
                </label>
                <input
                  id={`${uid}-feed`}
                  type="number"
                  step="any"
                  min="1"
                  className="mcm-control mcm-control-mono"
                  value={maxFeed}
                  onChange={(e) => setMaxFeed(e.target.value)}
                />
              </div>

              <div className="mcm-field">
                <label htmlFor={`${uid}-taper`} className="mcm-label">
                  Spindle Taper
                </label>
                <select
                  id={`${uid}-taper`}
                  className="mcm-control"
                  value={spindleTaper}
                  onChange={(e) => setSpindleTaper(e.target.value)}
                >
                  <option value="HSK-A63">HSK-A63</option>
                  <option value="CAT 40">CAT 40</option>
                  <option value="BT30 / BBT30">BT30 / BBT30</option>
                  <option value="Capto C6">Capto C6</option>
                </select>
              </div>

              <div className="mcm-field">
                <label htmlFor={`${uid}-atc`} className="mcm-label">
                  ATC Magazine Pockets
                </label>
                <input
                  id={`${uid}-atc`}
                  type="number"
                  step="1"
                  min="1"
                  className="mcm-control mcm-control-mono"
                  value={atcCapacity}
                  onChange={(e) => setAtcCapacity(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 4. Post Processor Settings */}
          <section className="mcm-section" aria-labelledby={`${uid}-sec-post`}>
            <h3 id={`${uid}-sec-post`} className="mcm-section-title">
              <Settings size={14} color="#b45309" />
              <span>G-Code Post Output Configurations</span>
            </h3>

            <div className="mcm-grid-3">
              <div className="mcm-field">
                <span className="mcm-label">5-Axis TCP Management</span>
                <label
                  htmlFor={`${uid}-tcp`}
                  className={`mcm-checkbox-row ${!isFiveAxis ? 'is-disabled' : ''}`}
                >
                  <input
                    id={`${uid}-tcp`}
                    type="checkbox"
                    className="mcm-checkbox"
                    checked={tcpEnabled}
                    disabled={!isFiveAxis}
                    onChange={(e) => setTcpEnabled(e.target.checked)}
                  />
                  <span className="mcm-checkbox-label">
                    Enable TRAORI / G43.4
                  </span>
                </label>
                {!isFiveAxis && (
                  <span className="mcm-hint">Not applicable on 3-Axis machines.</span>
                )}
              </div>

              <div className="mcm-field">
                <label htmlFor={`${uid}-arc`} className="mcm-label">
                  Circular Arc G2/G3 Format
                </label>
                <select
                  id={`${uid}-arc`}
                  className="mcm-control"
                  value={arcFormat}
                  onChange={(e) => setArcFormat(e.target.value)}
                >
                  <option value="ijk">I, J, K Center Vectors</option>
                  <option value="r">Radius (R) Format</option>
                </select>
              </div>

              <div className="mcm-field">
                <label htmlFor={`${uid}-safez`} className="mcm-label">
                  Safe Retract Clearance (Z mm)
                </label>
                <input
                  id={`${uid}-safez`}
                  type="number"
                  step="any"
                  className="mcm-control mcm-control-mono"
                  value={safeZ}
                  onChange={(e) => setSafeZ(e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mcm-footer">
          <span className="mcm-footer-note">
            Active machine determines post-processor dialect and NC2Check kinematic collision physics.
          </span>
          <div className="mcm-footer-actions">
            <button
              type="button"
              onClick={onClose}
              className="mcm-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary mcm-btn-save"
            >
              <Save size={14} />
              <span>Save Machine Definition</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function MachineConfigModal({
  isOpen,
  onClose,
  machines = [],
  activeMachine,
  onSelectMachine,
  onUpdateMachineConfig
}) {
  const dialogRef = useRef(null);
  const pointerStartedOutsideRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const isPointOutsideDialog = (e, dialog) => {
    const rect = dialog.getBoundingClientRect();
    return (
      e.clientX < rect.left
      || e.clientX > rect.right
      || e.clientY < rect.top
      || e.clientY > rect.bottom
    );
  };

  const handleDialogPointerDown = (e) => {
    const dialog = dialogRef.current;
    pointerStartedOutsideRef.current = dialog ? isPointOutsideDialog(e, dialog) : false;
  };

  const handleDialogPointerUp = (e) => {
    const dialog = dialogRef.current;
    if (pointerStartedOutsideRef.current && dialog && isPointOutsideDialog(e, dialog)) {
      onClose?.();
    }
    pointerStartedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onPointerDown={handleDialogPointerDown}
      onPointerUp={handleDialogPointerUp}
      aria-labelledby={titleId}
      closedby="any"
    >
      {isOpen && (
        <MachineConfigForm
          titleId={titleId}
          machines={machines}
          activeMachine={activeMachine}
          onSelectMachine={onSelectMachine}
          onUpdateMachineConfig={onUpdateMachineConfig}
          onClose={onClose}
        />
      )}
    </dialog>
  );
}

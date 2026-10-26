import React, { useState, useEffect, useRef } from 'react';
import {
  X, Settings, Cpu, Gauge, ShieldAlert, CheckCircle2,
  Sliders, Layers, Sparkles, RefreshCw, Wrench, Save
} from 'lucide-react';

export default function MachineConfigModal({
  isOpen,
  onClose,
  machines = [],
  activeMachine,
  onSelectMachine,
  onUpdateMachineConfig
}) {
  const dialogRef = useRef(null);

  // Machine Parameters state
  const [selectedMachineId, setSelectedMachineId] = useState(activeMachine?.id || 'dmu50');
  const [machineName, setMachineName] = useState(activeMachine?.name || 'DMG MORI DMU 50 (5X)');
  const [controller, setController] = useState(activeMachine?.controller || 'Heidenhain TNC 640');
  const [machineType, setMachineType] = useState(activeMachine?.type || '5-Axis Trunnion B/C');

  // Envelopes
  const [xTravel, setXTravel] = useState(650);
  const [yTravel, setYTravel] = useState(520);
  const [zTravel, setZTravel] = useState(475);
  const [bMin, setBMin] = useState(-35);
  const [bMax, setBMax] = useState(110);
  const [cRotaryContinuous, setCRotaryContinuous] = useState(true);

  // Spindle & Feeds
  const [maxRpm, setMaxRpm] = useState(15000);
  const [maxFeed, setMaxFeed] = useState(30000);
  const [spindleTaper, setSpindleTaper] = useState('HSK-A63');
  const [atcCapacity, setAtcCapacity] = useState(60);
  const [coolantTSC, setCoolantTSC] = useState(true);

  // Post processor defaults
  const [tcpEnabled, setTcpEnabled] = useState(true); // G43.4 / TRAORI
  const [arcFormat, setArcFormat] = useState('ijk'); // 'ijk' or 'r'
  const [safeZ, setSafeZ] = useState(50);

  // Feedback
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (activeMachine) {
      setSelectedMachineId(activeMachine.id);
      setMachineName(activeMachine.name);
      setController(activeMachine.controller);
      setMachineType(activeMachine.type);
    }
  }, [activeMachine]);

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

  if (!isOpen) return null;

  const handleMachineSelect = (id) => {
    setSelectedMachineId(id);
    if (onSelectMachine) onSelectMachine(id);

    if (id === 'dmu50') {
      setMachineName('DMG MORI DMU 50 (5X)');
      setController('Heidenhain TNC 640');
      setMachineType('5-Axis Trunnion B/C');
      setXTravel(650); setYTravel(520); setZTravel(475);
      setMaxRpm(15000); setMaxFeed(30000);
      setSpindleTaper('HSK-A63');
      setTcpEnabled(true);
    } else if (id === 'haas_vf2') {
      setMachineName('Haas VF-2 (3X VMC)');
      setController('Haas NGC');
      setMachineType('3-Axis Vertical');
      setXTravel(762); setYTravel(406); setZTravel(508);
      setMaxRpm(10000); setMaxFeed(25400);
      setSpindleTaper('CAT 40');
      setTcpEnabled(false);
    } else if (id === 'robodrill') {
      setMachineName('Fanuc Robodrill D21');
      setController('Fanuc 31i-B5');
      setMachineType('High Speed 3-Axis');
      setXTravel(500); setYTravel(400); setZTravel(330);
      setMaxRpm(24000); setMaxFeed(54000);
      setSpindleTaper('BT30 / BBT30');
      setTcpEnabled(false);
    } else if (id === 'integrex') {
      setMachineName('Mazak Integrex i-200');
      setController('Mazak SmoothX');
      setMachineType('5-Axis Mill-Turn');
      setXTravel(615); setYTravel(260); setZTravel(1077);
      setMaxRpm(12000); setMaxFeed(38000);
      setSpindleTaper('Capto C6');
      setTcpEnabled(true);
    }
    setFeedback(`Loaded Kinematic Definition for ${id.toUpperCase()}`);
  };

  const handleSaveConfig = () => {
    if (onUpdateMachineConfig) {
      onUpdateMachineConfig({
        id: selectedMachineId,
        name: machineName,
        controller,
        type: machineType,
        travel: { x: xTravel, y: yTravel, z: zTravel },
        rotary: { bMin, bMax, continuousC: cRotaryContinuous },
        spindle: { maxRpm, maxFeed, taper: spindleTaper, atc: atcCapacity, tsc: coolantTSC },
        post: { tcp: tcpEnabled, arc: arcFormat, safeZ }
      });
    }
    setFeedback('Machine Definition & Kinematic Envelope saved successfully!');
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-label="CNC Machine Definition & Kinematic Setup"
      closedby="any"
    >
      <div className="modal-window" style={{ width: '740px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#38bdf8" />
            <span>Mastercam Machine &bull; CNC Machine Definition, Kinematics &amp; Controller Setup</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div style={{
            background: 'rgba(56, 189, 248, 0.15)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '6px 14px',
            fontSize: '11px',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} />
              <span>{feedback}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Machine Fleet Selection */}
          <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '8px' }}>
              Active CNC Machine in Shop Fleet:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { id: 'dmu50', name: 'DMG MORI DMU 50', type: '5-Axis Trunnion', ctrl: 'Heidenhain TNC 640' },
                { id: 'haas_vf2', name: 'Haas VF-2', type: '3-Axis Vertical', ctrl: 'Haas NGC' },
                { id: 'robodrill', name: 'Fanuc Robodrill', type: 'High Speed 3-Axis', ctrl: 'Fanuc 31i-B5' },
                { id: 'integrex', name: 'Mazak Integrex', type: '5-Axis Mill-Turn', ctrl: 'Mazak SmoothX' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleMachineSelect(m.id)}
                  style={{
                    padding: '8px',
                    background: selectedMachineId === m.id ? '#1e293b' : '#141822',
                    border: `1px solid ${selectedMachineId === m.id ? '#38bdf8' : '#232c3d'}`,
                    borderRadius: '4px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: selectedMachineId === m.id ? '#38bdf8' : '#f8fafc' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>{m.type}</div>
                  <div style={{ fontSize: '8.5px', color: '#10b981', marginTop: '2px' }}>{m.ctrl}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Kinematic Travel Envelopes */}
          <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              <Gauge size={14} color="#38bdf8" />
              <span>Axis Travel Limits &amp; Rotary Boundaries</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#38bdf8', display: 'block' }}>X-Axis Travel (mm):</label>
                <input
                  type="number"
                  value={xTravel}
                  onChange={(e) => setXTravel(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px', marginTop: '3px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#10b981', display: 'block' }}>Y-Axis Travel (mm):</label>
                <input
                  type="number"
                  value={yTravel}
                  onChange={(e) => setYTravel(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px', marginTop: '3px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#f59e0b', display: 'block' }}>Z-Axis Travel (mm):</label>
                <input
                  type="number"
                  value={zTravel}
                  onChange={(e) => setZTravel(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px', marginTop: '3px' }}
                />
              </div>
            </div>

            {/* 5-Axis Rotary Limits */}
            {machineType.includes('5-Axis') && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #232c3d', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>B-Axis Swivel Range (deg):</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                    <input type="number" value={bMin} onChange={(e) => setBMin(e.target.value)} style={{ width: '70px', padding: '5px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>to</span>
                    <input type="number" value={bMax} onChange={(e) => setBMax(e.target.value)} style={{ width: '70px', padding: '5px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#fff', fontSize: '11px' }} />
                    <span style={{ fontSize: '10px', color: '#64748b' }}>deg</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>C-Axis Rotary Table:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={cRotaryContinuous}
                      onChange={(e) => setCRotaryContinuous(e.target.checked)}
                      id="contC"
                    />
                    <label htmlFor="contC" style={{ fontSize: '11px', color: '#f8fafc', cursor: 'pointer' }}>
                      Continuous Infinite 360&deg; Rotation
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spindle & Dynamic Capabilities */}
          <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              <Sliders size={14} color="#10b981" />
              <span>Spindle Dynamics &amp; Tool Changer (ATC)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Max Spindle RPM:</label>
                <input
                  type="number"
                  step="500"
                  value={maxRpm}
                  onChange={(e) => setMaxRpm(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px', marginTop: '3px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Max Rapid (mm/min):</label>
                <input
                  type="number"
                  step="1000"
                  value={maxFeed}
                  onChange={(e) => setMaxFeed(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px', marginTop: '3px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Spindle Taper:</label>
                <select
                  value={spindleTaper}
                  onChange={(e) => setSpindleTaper(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '11px', marginTop: '3px' }}
                >
                  <option value="HSK-A63">HSK-A63</option>
                  <option value="CAT 40">CAT 40</option>
                  <option value="BT30 / BBT30">BT30 / BBT30</option>
                  <option value="Capto C6">Capto C6</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>ATC Magazine Pockets:</label>
                <input
                  type="number"
                  value={atcCapacity}
                  onChange={(e) => setAtcCapacity(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '12px', marginTop: '3px' }}
                />
              </div>
            </div>
          </div>

          {/* Post Processor Settings */}
          <div style={{ background: '#0e1218', border: '1px solid #1f2737', borderRadius: '6px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
              <Settings size={14} color="#f59e0b" />
              <span>G-Code Post Output Configurations</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>5-Axis TCP Management:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={tcpEnabled}
                    onChange={(e) => setTcpEnabled(e.target.checked)}
                    id="tcpCheck"
                  />
                  <label htmlFor="tcpCheck" style={{ fontSize: '11px', color: '#f8fafc', cursor: 'pointer' }}>
                    Enable TRAORI / G43.4
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Circular Arc G2/G3 Format:</label>
                <select
                  value={arcFormat}
                  onChange={(e) => setArcFormat(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '11px', marginTop: '4px' }}
                >
                  <option value="ijk">I, J, K Center Vectors</option>
                  <option value="r">Radius (R) Format</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Safe Retract Clearance (Z mm):</label>
                <input
                  type="number"
                  value={safeZ}
                  onChange={(e) => setSafeZ(e.target.value)}
                  style={{ width: '100%', padding: '6px', background: '#141822', border: '1px solid #334155', borderRadius: '3px', color: '#f8fafc', fontSize: '11px', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #1f2737', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            Active machine determines post-processor dialect and NC2Check kinematic collision physics.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={13} />
              Save Machine Definition
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

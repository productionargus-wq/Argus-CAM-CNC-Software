import React, { useState, useMemo } from 'react';
import {
  X, Maximize2, Minimize2, Activity, ShieldAlert, ShieldCheck, AlertTriangle,
  Zap, Sliders, Download, RefreshCw, Check, CheckCircle2, Cpu, Wrench,
  Layers, Grid, ChevronRight, TrendingUp, Sparkles, ArrowRight, Clock
} from 'lucide-react';
import {
  scanProjectToolpaths,
  calculateToolDeflection,
  analyzeSpindleChatter,
  TOOL_SUBSTRATE_MODULUS,
  DEFAULT_MACHINE_RESONANCE
} from '../utils/toolpathAnomalyEngine.js';

export default function AnomalyScannerModal({
  isOpen,
  onClose,
  operations = [],
  tools = [],
  stockConfig = {},
  onApplyAutoFixes = null
}) {

  // Window State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('anomalies'); // 'anomalies' | 'sld' | 'deflection'
  const [appliedFeedback, setAppliedFeedback] = useState(false);
  const [fixedAnomalyIds, setFixedAnomalyIds] = useState(new Set());

  // Interactive Deflection Simulation State (Tab 3)
  const [simDiameter, setSimDiameter] = useState(10.0);
  const [simStickout, setSimStickout] = useState(48.0);
  const [simSubstrate, setSimSubstrate] = useState('CARBIDE');
  const [simCuttingForce, setSimCuttingForce] = useState(420);

  // Interactive Chatter SLD Simulation State (Tab 2)
  const [simRpm, setSimRpm] = useState(10400);
  const [simFlutes, setSimFlutes] = useState(4);

  // Scan Project Toolpaths
  const scanResult = useMemo(() => {
    return scanProjectToolpaths(operations, tools, stockConfig);
  }, [operations, tools, stockConfig]);

  // Compute Active Deflection for Simulator
  const activeDeflection = useMemo(() => {
    return calculateToolDeflection({
      toolDiameter: simDiameter,
      stickoutLength: simStickout,
      substrate: simSubstrate,
      cuttingForceN: simCuttingForce
    });
  }, [simDiameter, simStickout, simSubstrate, simCuttingForce]);

  // Compute Active Chatter for Simulator
  const activeChatter = useMemo(() => {
    return analyzeSpindleChatter({
      spindleRpm: simRpm,
      fluteCount: simFlutes
    });
  }, [simRpm, simFlutes]);

  // Single Auto-Fix
  const handleFixSingleAnomaly = (anomalyId) => {
    setFixedAnomalyIds(prev => new Set([...prev, anomalyId]));
  };

  // Apply All AI Recommendations
  const handleApplyAllFixes = () => {
    if (onApplyAutoFixes) {
      onApplyAutoFixes(scanResult.anomalies);
    }
    const allIds = new Set(scanResult.anomalies.map(a => a.id));
    setFixedAnomalyIds(allIds);
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  // Download Diagnostic Report
  const handleDownloadReport = () => {
    const report = [
      `ARGUS CAM AI TOOLPATH ANOMALY & CHATTER AUDIT REPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      `Overall Project Health Score: ${scanResult.healthScore}%`,
      `Total Checks Performed: ${scanResult.totalChecks}`,
      `Total Anomalies Flagged: ${scanResult.anomaliesCount} (${scanResult.criticalCount} Critical, ${scanResult.moderateCount} Moderate)`,
      ``,
      `DETAILED ANOMALY FINDINGS:`,
      `----------------------------------------------------------------------------`
    ];

    scanResult.anomalies.forEach((a, idx) => {
      report.push(`[${idx + 1}] ${a.severity}: ${a.title}`);
      report.push(`    Operation: ${a.operationName}`);
      report.push(`    Physics Metric: ${a.metric}`);
      report.push(`    Diagnosis: ${a.description}`);
      report.push(`    AI Fix: ${a.recommendation}`);
      report.push(``);
    });

    const blob = new Blob([report.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ArgusCAM_Toolpath_Anomaly_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const scoreColor = scanResult.healthScore >= 80 ? 'text-emerald-400' : scanResult.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg = scanResult.healthScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : scanResult.healthScore >= 60 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-hidden select-none">
      <div
        className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none m-0' : 'w-[96vw] max-w-7xl h-[92vh]'
        }`}
      >
        {/* ================================================================== */}
        {/* MODAL HEADER */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  AI Toolpath Anomaly, Deflection &amp; Chatter Diagnostic Scanner
                </h2>
                {/* Health Score Pill */}
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-mono font-bold ${scoreBg} ${scoreColor}`}>
                  <ShieldAlert size={13} />
                  <span>Health: {scanResult.healthScore}%</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-mono bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                  {scanResult.criticalCount} Critical Flags
                </span>
                <span className="px-2 py-0.5 text-xs font-mono bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  {scanResult.moderateCount} Warnings
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cantilever beam bending deflection, spindle harmonic resonance lobes, radial chip thinning (RCT), and tool breakage prevention
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Restore Window' : 'Full Screen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Close Scanner"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* TABS NAVIGATION */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('anomalies')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === 'anomalies'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert size={14} />
              AI Anomaly Stream ({scanResult.anomaliesCount})
            </button>
            <button
              onClick={() => setActiveTab('sld')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === 'sld'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp size={14} />
              Stability Lobe Diagram (SLD) &amp; Chatter
            </button>
            <button
              onClick={() => setActiveTab('deflection')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                activeTab === 'deflection'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Wrench size={14} />
              Tool Deflection &amp; Cantilever Bending
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Operations Scanned: {scanResult.scannedOperationsCount}</span>
            <span>Total Physics Checks: {scanResult.totalChecks}</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MAIN BODY: TAB CONTENTS */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950">
          {/* TAB 1: AI ANOMALY STREAM */}
          {activeTab === 'anomalies' && (
            <div className="space-y-4">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl border ${scoreBg}`}>
                  <span className="text-[11px] text-slate-400 font-mono block">Project Health Score</span>
                  <span className={`text-3xl font-mono font-bold mt-1 block ${scoreColor}`}>
                    {scanResult.healthScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    {scanResult.healthScore >= 80 ? 'Safe for production machining' : 'High vibration & breakage risk'}
                  </span>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono block">Critical Toolpath Hazards</span>
                  <span className="text-3xl font-mono font-bold text-rose-400 mt-1 block">
                    {scanResult.criticalCount}
                  </span>
                  <span className="text-[10px] text-rose-400/80 font-mono mt-0.5 block">
                    Requires immediate parameter review
                  </span>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono block">Moderate Warnings</span>
                  <span className="text-3xl font-mono font-bold text-amber-400 mt-1 block">
                    {scanResult.moderateCount}
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono mt-0.5 block">
                    May affect surface finish / tool life
                  </span>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono block">Anomalies Auto-Fixed</span>
                  <span className="text-3xl font-mono font-bold text-emerald-400 mt-1 block">
                    {fixedAnomalyIds.size} / {scanResult.anomaliesCount}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5 block">
                    Safe parameter overrides applied
                  </span>
                </div>
              </div>

              {/* Anomaly Cards List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={15} className="text-rose-400" />
                    Detected Toolpath Hazards &amp; Physics Anomalies
                  </span>
                  <button
                    onClick={handleApplyAllFixes}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Sparkles size={14} />
                    Apply All AI Auto-Fixes ({scanResult.anomaliesCount - fixedAnomalyIds.size})
                  </button>
                </div>

                {scanResult.anomalies.map((a) => {
                  const isFixed = fixedAnomalyIds.has(a.id);
                  const isCritical = a.severity === 'CRITICAL';

                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isFixed
                          ? 'bg-slate-900/30 border-slate-800/50 opacity-75'
                          : isCritical
                          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
                          : 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isCritical ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {a.severity}
                            </span>
                            <span className="font-semibold text-sm text-slate-100">{a.title}</span>
                            <span className="text-xs text-slate-400 font-mono">[{a.operationName}]</span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {a.description}
                          </p>

                          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                            <span className="px-2 py-0.5 rounded bg-slate-950 text-sky-300 border border-slate-800 text-[11px]">
                              {a.metric}
                            </span>
                            <span className="text-slate-500">→</span>
                            <span className="text-emerald-300 text-[11px]">
                              {a.recommendation}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0 flex items-center">
                          {isFixed ? (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold flex items-center gap-1.5">
                              <CheckCircle2 size={14} />
                              AI Safe Parameter Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => handleFixSingleAnomaly(a.id)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                            >
                              <Sparkles size={13} className="text-emerald-400" />
                              Apply Safe Fix
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STABILITY LOBE DIAGRAM (SLD) */}
          {activeTab === 'sld' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Controls & Analysis */}
              <div className="col-span-12 lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="text-amber-400" />
                    Spindle &amp; Tooth Passing Parameters
                  </h3>

                  {/* RPM Slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300">Spindle Speed</span>
                      <span className="font-mono text-amber-400 font-bold">{simRpm} RPM</span>
                    </div>
                    <input
                      type="range"
                      min="2000"
                      max="24000"
                      step="100"
                      value={simRpm}
                      onChange={e => setSimRpm(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>

                  {/* Flutes */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300">Cutter Flutes (z)</span>
                      <span className="font-mono text-cyan-400 font-bold">{simFlutes} Flutes</span>
                    </div>
                    <div className="flex gap-2">
                      {[2, 3, 4, 5, 6].map(z => (
                        <button
                          key={z}
                          onClick={() => setSimFlutes(z)}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                            simFlutes === z
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {z}F
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Machine Resonant Freq */}
                  <div className="pt-2 border-t border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Spindle Resonant Peak:</span>
                      <span className="text-slate-200">{DEFAULT_MACHINE_RESONANCE.spindleNaturalFreqHz} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tooth Passing Frequency:</span>
                      <span className="text-amber-300 font-bold">{activeChatter.toothPassFreqHz} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Harmonic Proximity:</span>
                      <span className={activeChatter.chatterRisk === 'HIGH' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {activeChatter.chatterRisk}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chatter Sweet Spots Card */}
                <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wide">
                    <CheckCircle2 size={15} />
                    Nearest Vibration-Free Sweet Spot
                  </div>
                  <div className="text-2xl font-mono font-black text-emerald-300">
                    {activeChatter.nearestSweetSpot.stableRpm} RPM
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Operates in Stability Lobe #{activeChatter.nearestSweetSpot.lobeNumber} ({activeChatter.nearestSweetSpot.frequencyHz} Hz). Eliminates resonant harmonics without needing to drop depth of cut!
                  </p>
                  <button
                    onClick={() => setSimRpm(activeChatter.nearestSweetSpot.stableRpm)}
                    className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check size={14} />
                    Snap Spindle to Sweet Spot ({activeChatter.nearestSweetSpot.stableRpm} RPM)
                  </button>
                </div>
              </div>

              {/* Right Stability Lobes Interactive SVG Chart */}
              <div className="col-span-12 lg:col-span-7 p-5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                <div className="w-full flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Harmonic Stability Lobe Diagram (SLD)
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Depth of Cut (ap) vs Spindle RPM
                  </span>
                </div>

                {/* SVG Chart */}
                <svg viewBox="0 0 500 260" className="w-full max-h-[300px] bg-[#070b14] rounded-lg border border-slate-800/80 p-3">
                  <defs>
                    <linearGradient id="lobeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  {[50, 100, 150, 200].map(y => (
                    <line key={y} x1="40" y1={y} x2="480" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  ))}
                  {[100, 200, 300, 400].map(x => (
                    <line key={x} x1={x} y1="20" x2={x} y2="220" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                  ))}

                  {/* Stability Lobes (Curves where chatter is avoided) */}
                  {/* Lobe 1 */}
                  <path d="M 360 220 Q 420 50 480 220" fill="url(#lobeGrad)" stroke="#10b981" strokeWidth="2" />
                  {/* Lobe 2 */}
                  <path d="M 240 220 Q 290 80 340 220" fill="url(#lobeGrad)" stroke="#10b981" strokeWidth="2" />
                  {/* Lobe 3 */}
                  <path d="M 150 220 Q 185 110 220 220" fill="url(#lobeGrad)" stroke="#10b981" strokeWidth="2" />
                  {/* Lobe 4 */}
                  <path d="M 80 220 Q 105 130 130 220" fill="url(#lobeGrad)" stroke="#10b981" strokeWidth="2" />

                  {/* Active RPM Marker Line */}
                  {(() => {
                    const plotX = 40 + ((simRpm - 2000) / 22000) * 440;
                    return (
                      <g>
                        <line x1={plotX} y1="20" x2={plotX} y2="220" stroke={activeChatter.chatterRisk === 'HIGH' ? '#ef4444' : '#f59e0b'} strokeWidth="2.5" />
                        <circle cx={plotX} cy="120" r="5" fill={activeChatter.chatterRisk === 'HIGH' ? '#ef4444' : '#f59e0b'} />
                        <text x={plotX} y="15" fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                          {simRpm} RPM
                        </text>
                      </g>
                    );
                  })()}

                  {/* Axis Labels */}
                  <text x="40" y="240" fill="#64748b" fontSize="8" fontFamily="monospace">2,000 RPM</text>
                  <text x="250" y="240" fill="#64748b" fontSize="8" fontFamily="monospace">13,000 RPM</text>
                  <text x="450" y="240" fill="#64748b" fontSize="8" fontFamily="monospace">24,000 RPM</text>
                  <text x="15" y="120" fill="#64748b" fontSize="8" fontFamily="monospace" transform="rotate(-90 15 120)">Depth ap</text>
                </svg>

                {/* Legend */}
                <div className="flex gap-4 mt-3 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-400" />
                    <span>Stable Cutting Zone (Chatter Free)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-rose-500" />
                    <span>Active Spindle Operating Point</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CANTILEVER BEAM DEFLECTION */}
          {activeTab === 'deflection' && (
            <div className="grid grid-cols-12 gap-6">
              {/* Controls */}
              <div className="col-span-12 lg:col-span-5 space-y-4">
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={14} className="text-cyan-400" />
                    Tool Geometry &amp; Rigidity Parameters
                  </h3>

                  {/* Diameter */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300">Tool Diameter (D)</span>
                      <span className="font-mono text-emerald-400 font-bold">{simDiameter} mm</span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="25.0"
                      step="0.5"
                      value={simDiameter}
                      onChange={e => setSimDiameter(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>

                  {/* Stickout Length */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300">Collet Stickout Length (L)</span>
                      <span className="font-mono text-cyan-400 font-bold">{simStickout} mm (L/D {(simStickout / simDiameter).toFixed(1)}:1)</span>
                    </div>
                    <input
                      type="range"
                      min="15.0"
                      max="120.0"
                      step="1.0"
                      value={simStickout}
                      onChange={e => setSimStickout(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>

                  {/* Radial Cutting Force */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300">Radial Cutting Force (Fr)</span>
                      <span className="font-mono text-amber-400 font-bold">{simCuttingForce} N</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1500"
                      step="25"
                      value={simCuttingForce}
                      onChange={e => setSimCuttingForce(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
                    />
                  </div>

                  {/* Substrate Selector */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1">Tool Substrate Material</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(TOOL_SUBSTRATE_MODULUS).map(subKey => (
                        <button
                          key={subKey}
                          onClick={() => setSimSubstrate(subKey)}
                          className={`p-2 rounded-lg border text-xs font-mono text-left transition-colors ${
                            simSubstrate === subKey
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <div className="font-bold">{subKey}</div>
                          <div className="text-[10px] text-slate-500">{TOOL_SUBSTRATE_MODULUS[subKey].E / 1000} GPa</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deflection Gauge & Beam Physics */}
              <div className="col-span-12 lg:col-span-7 space-y-4">
                <div className="p-5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Euler-Bernoulli Cantilever Tip Deflection
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        activeDeflection.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : activeDeflection.riskLevel === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {activeDeflection.riskLevel}
                    </span>
                  </div>

                  {/* Big Deflection Callout */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-mono block">Tip Deflection (y)</span>
                      <span className="text-4xl font-mono font-black text-slate-100">
                        {activeDeflection.deflectionMicrons} <span className="text-lg text-slate-400 font-normal">μm</span>
                      </span>
                    </div>

                    <div className="text-right font-mono text-xs text-slate-400 space-y-1">
                      <div>Allowable Finish Tolerance: <span className="text-emerald-400 font-bold">&lt; 15.0 μm</span></div>
                      <div>Pocket Wall Tapering: <span className="text-amber-400 font-bold">~{(activeDeflection.deflectionMm).toFixed(3)} mm</span></div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeDeflection.message}
                  </p>

                  {/* Safe Recommendation */}
                  {activeDeflection.recommendedForceReductionPct > 0 && (
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs text-amber-300 font-mono">
                      Recommended AI Fix: Reduce feedrate by {activeDeflection.recommendedForceReductionPct}% or choke tool into collet by {Math.round(simStickout * 0.25)}mm to keep deflection under 15 μm.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* MODAL FOOTER ACTIONS */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadReport}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Download Audit Report
            </button>
          </div>

          <div className="flex items-center gap-3">
            {appliedFeedback && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                <Check size={14} /> All AI Safety Parameters Applied!
              </span>
            )}
            <button
              onClick={handleApplyAllFixes}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <Sparkles size={15} />
              Apply All AI Recommendations
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


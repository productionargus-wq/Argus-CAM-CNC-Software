import React, { useState, useMemo, useRef } from 'react';
import {
  X, Maximize2, Minimize2, FileCode, Sliders, Download, Upload, Copy,
  Check, CheckCircle2, RefreshCw, Plus, Trash2, Cpu, Layers, Zap,
  Code, ShieldCheck, Eye, HelpCircle, Info
} from 'lucide-react';
import {
  BUILTIN_POST_PROFILES,
  generateWithCustomPost,
  exportPostProfileJSON,
  importPostProfileJSON
} from '../utils/customPostEngine.js';

export default function CustomPostStudioModal({
  isOpen,
  onClose,
  operations = [],
  tools = [],
  activeMachine = null,
  onSaveCustomPost = null
}) {
  if (!isOpen) return null;

  // Window State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedGCode, setCopiedGCode] = useState(false);
  const [appliedFeedback, setAppliedFeedback] = useState(false);
  const fileInputRef = useRef(null);

  // Active Post Configuration State (Cloned from selected preset)
  const [selectedPresetKey, setSelectedPresetKey] = useState('FANUC_0I_31I');
  const [activeProfile, setActiveProfile] = useState(() => {
    return JSON.parse(JSON.stringify(BUILTIN_POST_PROFILES.FANUC_0I_31I));
  });

  // Active Template Tab (Accordion)
  const [activeTemplateTab, setActiveTemplateTab] = useState('header'); // 'header' | 'toolChange' | 'linear' | 'arc' | 'drill' | 'footer'

  // Custom Macro Inputs for adding new key-value pair
  const [newMacroKey, setNewMacroKey] = useState('');
  const [newMacroVal, setNewMacroVal] = useState('');
  const [newMacroDesc, setNewMacroDesc] = useState('');

  // Handle Preset Change
  const handleSelectPreset = (key) => {
    setSelectedPresetKey(key);
    const preset = BUILTIN_POST_PROFILES[key];
    if (preset) {
      setActiveProfile(JSON.parse(JSON.stringify(preset)));
    }
  };

  // Update Template Block Text
  const handleTemplateChange = (blockKey, newText) => {
    setActiveProfile(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [blockKey]: newText
      }
    }));
  };

  // Insert Macro Token at Cursor
  const handleInsertToken = (token) => {
    const current = activeProfile.templates[activeTemplateTab] || '';
    handleTemplateChange(activeTemplateTab, `${current} {{${token}}}`);
  };

  // Add Custom User Macro
  const handleAddCustomMacro = () => {
    if (!newMacroKey.trim() || !newMacroVal.trim()) return;
    const cleanKey = newMacroKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    setActiveProfile(prev => ({
      ...prev,
      customMacros: [
        ...(prev.customMacros || []),
        { key: cleanKey, value: newMacroVal.trim(), desc: newMacroDesc.trim() || 'User custom macro' }
      ]
    }));
    setNewMacroKey('');
    setNewMacroVal('');
    setNewMacroDesc('');
  };

  // Remove Custom Macro
  const handleRemoveCustomMacro = (index) => {
    setActiveProfile(prev => ({
      ...prev,
      customMacros: prev.customMacros.filter((_, i) => i !== index)
    }));
  };

  // Generate Live Real-Time G-Code
  const gcodeOutput = useMemo(() => {
    return generateWithCustomPost(activeProfile, operations, tools, {
      programName: 'ARGUS_CUSTOM_JOB',
      programNumber: '2024',
      activeWcs: 'G54'
    });
  }, [activeProfile, operations, tools]);

  // Copy G-Code
  const handleCopyGCode = () => {
    if (!gcodeOutput) return;
    navigator.clipboard.writeText(gcodeOutput);
    setCopiedGCode(true);
    setTimeout(() => setCopiedGCode(false), 2200);
  };

  // Download G-Code
  const handleDownloadGCode = () => {
    if (!gcodeOutput) return;
    const blob = new Blob([gcodeOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ArgusCAM_${activeProfile.name.replace(/\s+/g, '_')}${activeProfile.extension || '.nc'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export .arguspost Profile
  const handleExportProfile = () => {
    const jsonStr = exportPostProfileJSON(activeProfile);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProfile.id.toLowerCase()}_custom.arguspost`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import .arguspost Profile
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = importPostProfileJSON(event.target.result);
      if (res.success) {
        setActiveProfile(res.profile);
      } else {
        alert(`Failed to import post profile: ${res.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save / Apply Post to Machine
  const handleApplyToMachine = () => {
    if (onSaveCustomPost) {
      onSaveCustomPost(activeProfile);
    }
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  // Macro Token Glossary
  const standardTokens = [
    { token: 'PROGRAM_NAME', desc: 'Job file or operation name' },
    { token: 'PROGRAM_NUMBER', desc: '4-digit program O-number' },
    { token: 'TOOL_NUMBER', desc: 'Cutter ATC pocket number (T01)' },
    { token: 'TOOL_NAME', desc: 'Cutter descriptor & diameter' },
    { token: 'SPINDLE_RPM', desc: 'Computed spindle speed (RPM)' },
    { token: 'FEEDRATE', desc: 'Cutting feedrate (mm/min)' },
    { token: 'SAFE_Z', desc: 'Retract clearance Z height' },
    { token: 'WCS', desc: 'Work offset coordinate (G54-G59)' },
    { token: 'COOLANT_ON', desc: 'Flood/Mist/TSC activation M-code' },
    { token: 'DATE', desc: 'ISO creation date timestamp' },
    { token: 'N', desc: 'Dynamic block sequence number' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-hidden select-none">
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
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Code size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  Custom Post-Processor Syntax Builder &amp; Macro Engine
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                  {activeProfile.controllerFamily} Dialect
                </span>
                <span className="px-2 py-0.5 text-xs font-mono bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  Ext: {activeProfile.extension}
                </span>
                <span className="px-2 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                  {activeProfile.decimalPrecision} Decimals
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Construct and fine-tune controller G-code blocks, dynamic macro tags, custom shop M-codes, and line formatting
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
              title="Close Post Builder"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MAIN BODY: 2-PANEL LAYOUT */}
        {/* ================================================================== */}
        <div className="flex-1 flex overflow-hidden">
          {/* ---------------------------------------------------------------- */}
          {/* LEFT PANEL: TEMPLATES, BLOCKS & MACRO BUILDER */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-1/2 border-r border-slate-800 bg-slate-900/90 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-5">
            {/* BASE CONTROLLER PRESET SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu size={14} className="text-emerald-400" />
                Base Controller Architecture
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Object.keys(BUILTIN_POST_PROFILES).map((key) => {
                  const prof = BUILTIN_POST_PROFILES[key];
                  const isSelected = selectedPresetKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {prof.name.split(' (')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PROFILE SETTINGS & FORMATTING */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Post Profile Name</label>
                <input
                  type="text"
                  value={activeProfile.name}
                  onChange={e => setActiveProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">File Extension</label>
                <input
                  type="text"
                  value={activeProfile.extension}
                  onChange={e => setActiveProfile(prev => ({ ...prev, extension: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Decimal Digits</label>
                <select
                  value={activeProfile.decimalPrecision}
                  onChange={e => setActiveProfile(prev => ({ ...prev, decimalPrecision: parseInt(e.target.value, 10) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value={3}>3 Places (0.001 mm / Metric)</option>
                  <option value={4}>4 Places (0.0001 in / Inch)</option>
                  <option value={5}>5 Places (High Precision Mold)</option>
                </select>
              </div>
            </div>

            {/* BLOCK TEMPLATE TABS */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileCode size={14} className="text-cyan-400" />
                  G-Code Syntax Block Template
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Live Updating Right Pane
                </span>
              </label>

              {/* Template Tabs */}
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {[
                  { id: 'header', label: '1. Header' },
                  { id: 'toolChange', label: '2. Tool Change' },
                  { id: 'linearMove', label: '3. Linear' },
                  { id: 'arcMove', label: '4. Arcs' },
                  { id: 'drillCycle', label: '5. Drilling' },
                  { id: 'footer', label: '6. Footer' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTemplateTab(tab.id)}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                      activeTemplateTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Template Editor Area */}
              <div className="relative">
                <textarea
                  value={activeProfile.templates[activeTemplateTab] || ''}
                  onChange={e => handleTemplateChange(activeTemplateTab, e.target.value)}
                  rows={8}
                  className="w-full bg-[#050811] border border-slate-700 rounded-xl p-3 font-mono text-xs text-emerald-300 leading-relaxed focus:outline-none focus:border-cyan-500 shadow-inner resize-y custom-scrollbar"
                />
              </div>

              {/* Quick Macro Token Inserter Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Zap size={12} className="text-amber-400" />
                  Click to Insert Dynamic Macro Variable into Template:
                </span>
                <div className="flex flex-wrap gap-1">
                  {standardTokens.map(tok => (
                    <button
                      key={tok.token}
                      onClick={() => handleInsertToken(tok.token)}
                      title={tok.desc}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-300 text-[10px] font-mono transition-colors"
                    >
                      +{tok.token}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* USER CUSTOM MACROS TABLE */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders size={14} className="text-purple-400" />
                  Custom User Macro Variables ({activeProfile.customMacros?.length || 0})
                </span>
                <span className="text-[10px] text-slate-400">
                  Custom M-Codes &amp; Probe Cycles
                </span>
              </label>

              {/* Macros List */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                {activeProfile.customMacros?.map((macro, idx) => (
                  <div
                    key={macro.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-purple-400 font-semibold">{`{{${macro.key}}}`}</span>
                      <span className="text-slate-500">=</span>
                      <span className="text-emerald-300 font-bold">{macro.value}</span>
                      <span className="text-slate-500 text-[10px] truncate">({macro.desc})</span>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomMacro(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete Macro"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Macro Form */}
              <div className="grid grid-cols-12 gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="KEY (e.g. CHIP_AUGER)"
                  value={newMacroKey}
                  onChange={e => setNewMacroKey(e.target.value)}
                  className="col-span-5 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="VALUE (e.g. M31)"
                  value={newMacroVal}
                  onChange={e => setNewMacroVal(e.target.value)}
                  className="col-span-3 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newMacroDesc}
                  onChange={e => setNewMacroDesc(e.target.value)}
                  className="col-span-3 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddCustomMacro}
                  className="col-span-1 bg-purple-600 hover:bg-purple-500 text-white rounded flex items-center justify-center transition-colors"
                  title="Add Custom Macro"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT PANEL: LIVE REAL-TIME G-CODE OUTPUT PREVIEW */}
          {/* ---------------------------------------------------------------- */}
          <div className="w-1/2 flex flex-col bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} className="text-emerald-400" />
                  Live Compiled G-Code Preview
                </span>
                <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded font-mono">
                  {gcodeOutput.split('\n').length} Blocks
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyGCode}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  {copiedGCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedGCode ? 'Copied!' : 'Copy G-Code'}
                </button>
                <button
                  onClick={handleDownloadGCode}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download size={14} />
                  Download {activeProfile.extension}
                </button>
              </div>
            </div>

            {/* Code Output Viewer */}
            <div className="flex-1 overflow-y-auto bg-[#070b14] p-4 font-mono text-xs text-slate-300 leading-relaxed custom-scrollbar select-text">
              {gcodeOutput.split('\n').map((line, idx) => {
                const isComment = line.trim().startsWith('(') || line.trim().startsWith(';') || line.trim().startsWith('%');
                const isToolChange = line.includes('M06') || line.includes('TOOL CALL');
                const isSpindle = line.includes('M03') || line.includes('M04') || line.includes('M05');
                const isCoolant = line.includes('M08') || line.includes('M09') || line.includes('M88');

                return (
                  <div key={idx} className="flex hover:bg-slate-900/60 px-1 py-0.5 rounded">
                    <span className="w-10 text-slate-600 select-none text-right pr-4 font-mono text-[11px]">
                      {idx + 1}
                    </span>
                    <span
                      className={`flex-1 ${
                        isComment
                          ? 'text-slate-500 italic'
                          : isToolChange
                          ? 'text-purple-400 font-bold'
                          : isSpindle
                          ? 'text-amber-400 font-semibold'
                          : isCoolant
                          ? 'text-cyan-400 font-semibold'
                          : 'text-slate-200'
                      }`}
                    >
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Status Ticker */}
            <div className="px-6 py-2 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                Syntax Validated for {activeProfile.name}
              </span>
              <span>All Macro Tags Resolved</span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MODAL FOOTER ACTIONS */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".arguspost,.json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Upload size={14} />
              Import Post (.arguspost)
            </button>
            <button
              onClick={handleExportProfile}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Export Post Profile (.arguspost)
            </button>
          </div>

          <div className="flex items-center gap-3">
            {appliedFeedback && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                <Check size={14} /> Post-Processor Profile Saved as Default!
              </span>
            )}
            <button
              onClick={handleApplyToMachine}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 size={15} />
              Save as Default Machine Post
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


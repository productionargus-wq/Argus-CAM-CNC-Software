import React from 'react';
import { 
  PenTool, Circle, Square, Scissors, Sliders, Box, Layers, 
  Play, Pause, SkipForward, RotateCcw, FileCode, Download, 
  Copy, Check, Plus, Eye, Wrench, ShieldAlert
} from 'lucide-react';

export function MobileCADPanel({
  onSelectTool,
  onOpenDrafting,
  onOpenTransform,
  onClose
}) {
  const cadTools = [
    { id: 'line', label: '2-Point Line', icon: PenTool, desc: 'Draw wireframe lines between points' },
    { id: 'circle', label: 'Center Circle', icon: Circle, desc: 'Ø Diameter & Radius circular curves' },
    { id: 'bolt_circle', label: 'Bolt Circle (PCD)', icon: Circle, desc: 'PCD hole pattern circle' },
    { id: 'rectangle', label: 'Rectangle', icon: Square, desc: 'Boundary rectangles' },
    { id: 'trim', label: 'Dynamic Trim', icon: Scissors, desc: 'Mastercam Scissor Drag Snip' },
    { id: 'fillet', label: 'Fillet Entities', icon: Sliders, desc: 'Tangent blend corner fillets' },
    { id: 'extrude', label: 'Extrude Surface', icon: Box, desc: 'Extrude 2D chains into 3D solid' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {cadTools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                onSelectTool(t.id);
                onClose?.();
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 active:scale-95 text-left transition-all"
            >
              <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white leading-tight truncate">{t.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-800 flex gap-2">
        <button
          onClick={() => { onOpenDrafting?.(); onClose?.(); }}
          className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium text-center active:scale-95 shadow"
        >
          Drafting Dimensions
        </button>
        <button
          onClick={() => { onOpenTransform?.(); onClose?.(); }}
          className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium text-center active:scale-95 shadow"
        >
          Transform & Move
        </button>
      </div>
    </div>
  );
}

export function MobileToolpathsPanel({
  onOpenFlowline,
  onOpenOptiRough,
  onOpenContour,
  onOpenPocket,
  onOpenDrill,
  onOpenSwarf,
  onClose
}) {
  const strategies = [
    { id: 'flowline', label: 'Surface Finish Flowline', category: '3D High-Speed Finishing', action: onOpenFlowline, color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-800/50' },
    { id: 'optirough', label: '3D OptiRough', category: 'Constant Engagement Roughing', action: onOpenOptiRough, color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-800/50' },
    { id: 'contour', label: 'Surface Finish Contour', category: 'Waterline Finishing', action: onOpenContour, color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-800/50' },
    { id: 'pocket', label: 'Surface Finish Pocket', category: 'Cavity Pocketing', action: onOpenPocket, color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-800/50' },
    { id: 'swarf', label: '5-Axis Swarf Milling', category: 'Multi-Axis Flank Machining', action: onOpenSwarf, color: 'text-violet-400', bg: 'bg-violet-950/60', border: 'border-violet-800/50' },
    { id: 'drill', label: 'Drilling & Pecking', category: 'Hole Making G81/G83', action: onOpenDrill, color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-800/50' },
  ];

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium text-slate-400 px-1">
        Select 3D Surface Strategy to generate toolpath on workpiece:
      </div>
      <div className="grid grid-cols-1 gap-2">
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              s.action?.();
              onClose?.();
            }}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 active:scale-98 text-left transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg} ${s.color} border ${s.border}`}>
                <Layers size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{s.label}</div>
                <div className="text-[10px] text-slate-400">{s.category}</div>
              </div>
            </div>
            <Plus size={16} className="text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function MobileSimulatePanel({
  isBackplotActive,
  onToggleBackplot,
  onStepForward,
  onStepBack,
  onReset,
  backplotProgress = 0,
  onOpenVerifyModal,
  onClose
}) {
  return (
    <div className="space-y-4">
      {/* Simulation Playback Bar */}
      <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white">3D CNC Simulation</span>
          <span className="text-xs font-mono text-cyan-400 font-bold">{Math.round(backplotProgress * 100)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mb-4 border border-slate-700">
          <div 
            className="bg-cyan-500 h-full transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, backplotProgress * 100))}%` }}
          />
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={onReset}
            className="p-2.5 rounded-full bg-slate-700 text-slate-300 hover:text-white active:scale-95"
            title="Reset Simulation"
          >
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={onStepBack}
            className="p-2.5 rounded-full bg-slate-700 text-slate-300 hover:text-white active:scale-95"
            title="Step Backward"
          >
            <SkipForward size={18} className="rotate-180" />
          </button>
          <button 
            onClick={onToggleBackplot}
            className="p-3.5 rounded-full bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 active:scale-95 shadow-lg shadow-cyan-500/30"
            title={isBackplotActive ? "Pause" : "Play"}
          >
            {isBackplotActive ? <Pause size={22} /> : <Play size={22} className="translate-x-0.5" />}
          </button>
          <button 
            onClick={onStepForward}
            className="p-2.5 rounded-full bg-slate-700 text-slate-300 hover:text-white active:scale-95"
            title="Step Forward"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      {/* Solid Stock Verify Launch */}
      <button
        onClick={() => { onOpenVerifyModal?.(); onClose?.(); }}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-98"
      >
        <Eye size={16} />
        Open Volumetric Stock Verify Studio
      </button>
    </div>
  );
}

export function MobileGCodePanel({
  gcode = '',
  onPostProcess,
  onCopy,
  onDownload,
  projectName = 'Program'
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(gcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">Generated CNC Program</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 active:scale-95"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={onDownload}
            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1 active:scale-95 shadow"
          >
            <Download size={13} />
            Save .NC
          </button>
        </div>
      </div>

      <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 h-64 overflow-y-auto custom-scrollbar select-text leading-relaxed">
        {gcode || '( No toolpaths posted yet. Select a toolpath and click Post Process to generate standard Fanuc / ISO G-code. )'}
      </pre>

      <button
        onClick={onPostProcess}
        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-98 shadow"
      >
        Post Process All Operations (G-Code)
      </button>
    </div>
  );
}

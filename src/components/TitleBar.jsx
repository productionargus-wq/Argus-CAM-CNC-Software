import React from 'react';
import { Save, RotateCcw, RotateCw, Printer, HelpCircle, Minus, Square, X, Cpu } from 'lucide-react';

export default function TitleBar({
  currentProject = "DMU_50evo_Katana_Schraubstock.mcam",
  activeMachine = { name: "DMG MORI DMU 50", type: "5-Axis Mill-Turn" },
  onSaveProject,
  onOpenSetupSheet,
  onOpenHelpGuide
}) {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="app-titlebar">
      <div className="titlebar-left">
        <div className="titlebar-logo">
          <Cpu size={16} className="text-cyan-400" />
          <span>ARGUS CAM</span>
        </div>

        <div className="titlebar-quick-actions">
          <button className="quick-btn" onClick={onSaveProject} title="Save Project (.mcam JSON Package)">
            <Save size={13} />
          </button>
          <button className="quick-btn" onClick={() => alert("Undo: Previous operation state restored.")} title="Undo (Ctrl+Z)">
            <RotateCcw size={13} />
          </button>
          <button className="quick-btn" onClick={() => alert("Redo: Operation state re-applied.")} title="Redo (Ctrl+Y)">
            <RotateCw size={13} />
          </button>
          <button className="quick-btn" onClick={onOpenSetupSheet} title="Print CNC Setup Sheet">
            <Printer size={13} />
          </button>
          <button className="quick-btn" onClick={onOpenHelpGuide} title="Help &amp; Keyboard Navigation Guide">
            <HelpCircle size={13} />
          </button>
        </div>
      </div>

      <div className="titlebar-center">
        <span>Mastercam 2026 Interface Engine &bull;</span>
        <span className="titlebar-filename">{currentProject}</span>
        <span className="titlebar-badge">{activeMachine?.name || '5-Axis Mill-Turn'}</span>
      </div>

      <div className="titlebar-right">
        <button className="win-control-btn" onClick={() => alert("Application minimized to taskbar")} title="Minimize">
          <Minus size={12} />
        </button>
        <button className="win-control-btn" onClick={toggleFullscreen} title="Toggle Fullscreen Maximize">
          <Square size={11} />
        </button>
        <button className="win-control-btn close" onClick={() => { if (window.confirm("Close Argus Mastercam project? Any unsaved changes will be lost.")) window.location.reload(); }} title="Close">
          <X size={13} />
        </button>
      </div>
    </header>
  );
}

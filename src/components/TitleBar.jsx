import React from 'react';
import { Save, RotateCcw, RotateCw, Printer, HelpCircle, Minus, Square, X, Cpu } from 'lucide-react';

export default function TitleBar({
  currentProject = "DMU_50evo_Katana_Schraubstock.mcam",
  activeMachine = { name: "DMG MORI DMU 50", type: "5-Axis Mill-Turn" },
  onSaveProject,
  onOpenSetupSheet,
  onOpenHelpGuide,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onNotify
}) {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMinimize = async () => {
    if (window.__TAURI__?.window) {
      try {
        const { getCurrentWindow } = window.__TAURI__.window;
        await getCurrentWindow().minimize();
        return;
      } catch {
        // fallback
      }
    }
    if (onNotify) {
      onNotify("Desktop app running in browser container mode. Use browser minimize.", "info");
    }
  };

  const handleClose = async () => {
    if (window.confirm("Close Argus Master CAM project? Any unsaved toolpath or CAD edits will be lost.")) {
      if (window.__TAURI__?.window) {
        try {
          const { getCurrentWindow } = window.__TAURI__.window;
          await getCurrentWindow().close();
          return;
        } catch {
          // fallback
        }
      }
      window.location.reload();
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
          <button
            className={`quick-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            style={{ opacity: canUndo ? 1 : 0.45 }}
          >
            <RotateCcw size={13} />
          </button>
          <button
            className={`quick-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            style={{ opacity: canRedo ? 1 : 0.45 }}
          >
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
        <button className="win-control-btn" onClick={handleMinimize} title="Minimize Window">
          <Minus size={12} />
        </button>
        <button className="win-control-btn" onClick={toggleFullscreen} title="Toggle Fullscreen Maximize">
          <Square size={11} />
        </button>
        <button className="win-control-btn close" onClick={handleClose} title="Close Application">
          <X size={13} />
        </button>
      </div>
    </header>
  );
}

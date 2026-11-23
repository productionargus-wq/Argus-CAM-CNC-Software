import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, RotateCcw, RotateCw, Printer, HelpCircle, Minus, Square, X, Cpu, Sun, Moon, Sparkles } from 'lucide-react';

export default function TitleBar({
  currentProject = "Part1.mcam",
  activeMachine = null,
  theme = 'light',
  onToggleTheme,
  onSaveProject,
  onOpenFile,
  onOpenSetupSheet,
  onOpenHelpGuide,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onNotify,
  onRenameProject,
  isAIActive = false,
  onToggleAI = null
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentProject);

  useEffect(() => {
    setTempName(currentProject);
  }, [currentProject]);

  const handleCommitName = () => {
    setIsEditingName(false);
    const trimmed = tempName.trim();
    if (!trimmed || trimmed === currentProject) return;
    const finalName = trimmed.endsWith('.mcam') ? trimmed : `${trimmed}.mcam`;
    if (onRenameProject) {
      onRenameProject(finalName);
    }
  };

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
    if (window.confirm("Close Argus CAM Intelligence project? Any unsaved toolpath or CAD edits will be lost.")) {
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
          <img 
            src="/brand/argus_cam_icon.jpg" 
            alt="Argus CAM Intelligence" 
            style={{ 
              height: '22px', 
              width: '22px', 
              objectFit: 'contain', 
              borderRadius: '3px',
              display: 'block' 
            }} 
          />
          <span style={{ fontWeight: 800, fontSize: '11px', color: '#ea580c', letterSpacing: '0.5px' }}>
            ARGUS <span style={{ color: theme === 'light' ? '#0f172a' : '#f8fafc', fontWeight: 600 }}>CAM INTELLIGENCE</span>
          </span>
        </div>

        <div className="titlebar-quick-actions">
          <button className="quick-btn" onClick={onOpenFile} title="Open Argus CAM or CAD File (Ctrl+O)">
            <FolderOpen size={13} />
          </button>
          <button className="quick-btn" onClick={onSaveProject} title="Save Argus CAM Project (.mcam JSON Package)">
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
          <button
            className="quick-btn"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode (CAD Night)' : 'Switch to Light Mode (CAD Day)'}
            style={{ color: theme === 'light' ? '#d97706' : '#38bdf8', marginLeft: '4px' }}
          >
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          </button>
          {onToggleAI && (
            <button
              className="quick-btn"
              onClick={() => onToggleAI(!isAIActive)}
              title={isAIActive ? 'Turn off Argus AI Assistant' : 'Turn on Argus AI Voice Assistant'}
              style={{
                marginLeft: '6px',
                background: isAIActive ? '#0284c7' : '#e0f2fe',
                color: isAIActive ? '#ffffff' : '#0369a1',
                border: isAIActive ? '1px solid #0284c7' : '1px solid #7dd3fc',
                borderRadius: '3px',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isAIActive ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={12} color={isAIActive ? '#ffffff' : '#0284c7'} />
              <span>AI</span>
            </button>
          )}
        </div>
      </div>

      <div className="titlebar-center">
        <span style={{ fontWeight: 600, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>Argus CAM Intelligence</span>
        <span style={{ color: '#94a3b8', margin: '0 5px' }}>&ndash;</span>
        {isEditingName ? (
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleCommitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommitName();
              if (e.key === 'Escape') {
                setTempName(currentProject);
                setIsEditingName(false);
              }
            }}
            autoFocus
            style={{
              background: theme === 'light' ? '#ffffff' : '#1e293b',
              color: theme === 'light' ? '#0f172a' : '#f8fafc',
              border: '1px solid #0284c7',
              borderRadius: '2px',
              padding: '1px 6px',
              fontSize: '11.5px',
              fontWeight: 600,
              outline: 'none',
              height: '20px'
            }}
          />
        ) : (
          <span
            className="titlebar-filename"
            onClick={() => setIsEditingName(true)}
            title="Click to rename project (.mcam)"
            style={{ cursor: 'pointer', padding: '1px 4px', borderRadius: '2px' }}
          >
            [{currentProject}]
          </span>
        )}
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

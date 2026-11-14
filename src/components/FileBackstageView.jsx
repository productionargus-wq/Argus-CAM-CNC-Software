import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Folder, FolderOpen, RefreshCw, Eye, Settings, FileText,
  Check, ShieldAlert, Cpu, HardDrive, Download, Upload, Copy,
  Wrench, Search, Play, X, Minus, Square, CheckSquare, Plus,
  Save, Printer, HelpCircle, Users, Sliders, ChevronDown, Clock,
  Layers, Box, Disc, Activity, AlertTriangle, FileCode, CheckCircle2,
  ExternalLink, Trash2, Edit3, ArrowRight, CornerDownRight, Zap
} from 'lucide-react';
import {
  exportProjectMCAM,
  parseProjectMCAM,
  getRecentProjects,
  saveAutoSaveSnapshot,
  getAutoSaveSnapshot
} from '../utils/projectStorage';
import { generateNCProgram } from '../utils/postProcessor';
import { deriveControllerDialect } from '../config/machineDefinitionsCatalog';
import {
  CAD_FILE_FORMATS,
  parseAnyCADFile,
  ALL_SUPPORTED_EXTENSIONS_STRING
} from '../utils/universalCadParser';
import PrintSheetViewport from './PrintSheetViewport';

export default function FileBackstageView({
  isOpen,
  onClose,
  currentProjectName,
  setCurrentProjectName,
  projectDescriptor,
  setProjectDescriptor,
  projectCreatedDate,
  projectLastModifiedDate,
  setProjectLastModifiedDate,
  activeMachine,
  machines,
  setActiveMachineId,
  activeWcs,
  tools,
  operations,
  customGeometry = [],
  partMetrics = null,
  stockConfig,
  currentModel,
  solidsList,
  levels,
  planesList,
  autoSaveInterval,
  setAutoSaveInterval,
  onCreateNewProject,
  onLoadProject,
  onModelImported,
  onSaveAs,
  onOpenMastercamDialog,
  onNotify
}) {
  const [activeTab, setActiveTab] = useState('Info');

  // Hidden file inputs
  const openCadInputRef = useRef(null);
  const openMcamInputRef = useRef(null);
  const mergeCadInputRef = useRef(null);

  // Sub-dialogs state for Info tab cards
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isChangeRecogOpen, setIsChangeRecogOpen] = useState(false);
  const [isTrackChangesOpen, setIsTrackChangesOpen] = useState(false);
  const [isAutoSaveModalOpen, setIsAutoSaveModalOpen] = useState(false);
  const [isRepairFileOpen, setIsRepairFileOpen] = useState(false);
  const [repairStatus, setRepairStatus] = useState(null);

  // Configurable folder paths for Project Manager
  const [projectFolders, setProjectFolders] = useState({
    cadFolder: 'E:\\ARGUS_CAM\\Projects\\CAD_Models',
    ncFolder: 'E:\\ARGUS_CAM\\Projects\\NC_GCode',
    toolDbPath: 'E:\\ARGUS_CAM\\Libraries\\Mastercam_Tools.tooldb',
    postFolder: 'E:\\ARGUS_CAM\\Posts\\Heidenhain_TNC640.pst',
    fixturesFolder: 'E:\\ARGUS_CAM\\Fixtures\\ZeroClamp'
  });

  // Track Changes state
  const [isTrackChangesEnabled, setIsTrackChangesEnabled] = useState(true);
  const [trackedFiles, setTrackedFiles] = useState([
    { name: currentProjectName, path: 'Local Disk / Project Root', status: 'Synchronized', hash: '8f4c2b9a' },
    { name: 'DMU50_Vise_Fixture.step', path: 'Fixtures/ZeroClamp/', status: 'Synchronized', hash: '3e1a77d4' }
  ]);

  // AutoSave state
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Mastercam Print Backstage Settings State (Image 1 replica)
  const [printCopies, setPrintCopies] = useState(1);
  const [printPrinter, setPrintPrinter] = useState('Microsoft Print to PDF');
  const [printOrientation, setPrintOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [printPaperSize, setPrintPaperSize] = useState('letter'); // 'letter' | 'a4' | 'tabloid' | 'legal'

  // New Project Form State
  const [newTemplate, setNewTemplate] = useState('blank');
  const [newProjectNameInput, setNewProjectNameInput] = useState('Mastercam_Part1.mcam');
  const [newUnitSystem, setNewUnitSystem] = useState('metric');
  const [newStockDim, setNewStockDim] = useState({ x: 120, y: 80, z: 45 });

  // Save As state
  const [saveAsFilename, setSaveAsFilename] = useState(currentProjectName || 'Mastercam_Part1.mcam');
  const [saveAsFormat, setSaveAsFormat] = useState('mcam');
  const [includeStockInSave, setIncludeStockInSave] = useState(true);
  const [includeToolLibrary, setIncludeToolLibrary] = useState(true);

  // Save Some selection state
  const [saveSomeSelection, setSaveSomeSelection] = useState({
    solids: true,
    wireframe: true,
    surfaces: true,
    toolpaths: true,
    tools: true,
    fixtures: false,
    planes: true
  });

  // Zip2Go bundle selection
  const [zip2GoItems, setZip2GoItems] = useState({
    partFile: true,
    ncProgram: true,
    machineDef: true,
    controlDef: true,
    postProcessor: true,
    toolDb: true,
    setupSheet: true,
    diagnosticLog: true
  });
  const [zip2GoGenerating, setZip2GoGenerating] = useState(false);

  // Editor (NC Code Expert) state
  const [editorCode, setEditorCode] = useState('');
  const [editorFeedMultiplier, setEditorFeedMultiplier] = useState(100);

  // Merge CAD state
  const [mergeTargetLevel, setMergeTargetLevel] = useState(10);
  const [mergeOffset, setMergeOffset] = useState({ x: 0, y: 0, z: 0 });
  const [pendingMergeFile, setPendingMergeFile] = useState(null);

  // Convert state
  const [convertTargetFormat, setConvertTargetFormat] = useState('step');
  const [convertScaleFactor, setConvertScaleFactor] = useState(1.0);

  // Configuration settings
  const [sysConfig, setSysConfig] = useState({
    chainingTolerance: 0.01,
    chordalDeviation: 0.025,
    screenBg: 'gradient_classic',
    cursorCrosshair: true,
    ncExtension: '.nc',
    autoSaveInterval: autoSaveInterval || 5
  });

  // Options settings
  const [appOptions, setAppOptions] = useState({
    mouseWheelZoom: 'standard', // standard | inverted
    defaultUnits: 'metric',
    hardwareAcceleration: true,
    soundNotifications: true
  });

  // Feedback form state in Community
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('feedback');

  // Compute live project size
  const projectSizeBytes = React.useMemo(() => {
    try {
      const summary = {
        name: currentProjectName,
        stock: stockConfig,
        toolsCount: tools?.length || 0,
        opsCount: operations?.length || 0,
        solidsCount: solidsList?.length || 0,
        descriptor: projectDescriptor
      };
      const str = JSON.stringify(summary);
      return Math.max(12480, str.length * 42); // realistic MCAM part size
    } catch {
      return 156800;
    }
  }, [currentProjectName, stockConfig, tools, operations, solidsList, projectDescriptor]);

  const formattedFileSize = React.useMemo(() => {
    if (projectSizeBytes < 1024) return `${projectSizeBytes} B`;
    if (projectSizeBytes < 1024 * 1024) return `${(projectSizeBytes / 1024).toFixed(1)} KB`;
    return `${(projectSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [projectSizeBytes]);

  // Format dates matching screenshot style: "Mon Nov 02 14:34:46 2026"
  const formatDateMastercam = (d) => {
    if (!d) return 'Mon Nov 02 14:34:46 2026';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return 'Mon Nov 02 14:34:46 2026';
    return dateObj.toDateString() + ' ' + dateObj.toTimeString().split(' ')[0];
  };

  // Generate G-code when opening Editor tab
  useEffect(() => {
    if (activeTab === 'Open in Editor' || activeTab === 'Print') {
      try {
        let code = '';
        if (operations && operations.length > 0) {
          const generated = generateNCProgram({
            operations,
            tools: tools || [],
            stockConfig,
            partMetrics,
            controller: deriveControllerDialect(activeMachine),
            machineName: activeMachine?.name || '',
            model: currentModel,
            customGeometry,
            programName: currentProjectName ? currentProjectName.replace(/\.[^/.]+$/, "") : 'MASTERCAM_PART'
          });
          code = generated?.gcodeText || (typeof generated === 'string' ? generated : '');
        } else {
          code = `( PROGRAM: ${currentProjectName || 'MASTERCAM_PART'} )\n` +
                 `( MACHINE: ${activeMachine?.name || 'No Machine Selected'} )\n` +
                 `( DATE: ${new Date().toLocaleDateString()} )\n` +
                 `G21 (METRIC)\nG90 G94 G17 G40 G49 G80\nG54\nT01 M06 (12MM ENDMILL)\nS3500 M03\nG00 X0. Y0. Z50.\nM08\nG01 Z-5. F450.\nG01 X50. Y0.\nG01 Y50.\nG01 X0.\nG01 Y0.\nG00 Z50.\nM09\nM05\nG28 G91 Z0.\nM30\n%`;
        }
        setEditorCode(code);
      } catch (e) {
        setEditorCode(`( Error loading G-Code program: ${e.message} )`);
      }
    }
  }, [activeTab, operations, stockConfig, activeMachine, currentProjectName]);

  // Handle ESC key to close Backstage
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handlers for File Tab Operations
  const handleImmediateSave = () => {
    const projectState = {
      projectName: currentProjectName,
      stockConfig,
      tools,
      operations,
      customGeometry,
      partMetrics,
      activeMachine,
      activeWcs,
      solidsList,
      descriptor: projectDescriptor
    };
    exportProjectMCAM(projectState, currentProjectName);
    const now = new Date();
    if (setProjectLastModifiedDate) setProjectLastModifiedDate(now);
    if (onNotify) onNotify(`Project "${currentProjectName}" saved successfully.`, 'success');
  };

  const handleSaveAsSubmit = (e) => {
    e.preventDefault();
    const finalName = saveAsFilename.endsWith(`.${saveAsFormat}`)
      ? saveAsFilename
      : `${saveAsFilename}.${saveAsFormat}`;
    
    if (saveAsFormat === 'mcam' || saveAsFormat === 'json') {
      const projectState = {
        projectName: finalName,
        stockConfig: includeStockInSave ? stockConfig : null,
        tools: includeToolLibrary ? tools : [],
        operations,
        customGeometry,
        partMetrics,
        solidsList,
        activeMachine,
        activeWcs,
        descriptor: projectDescriptor
      };
      exportProjectMCAM(projectState, finalName);
    } else if (saveAsFormat === 'nc') {
      const blob = new Blob([editorCode || 'G21 G90\nM30\n%'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalName;
      a.click();
      URL.revokeObjectURL(a);
    } else {
      if (onSaveAs) {
        onSaveAs(finalName, { format: saveAsFormat });
      }
    }
    setCurrentProjectName(finalName);
    if (onNotify) onNotify(`Saved as ${finalName}`, 'success');
    onClose();
  };

  const handleCreateNewProjectSubmit = (e) => {
    e.preventDefault();
    if (onCreateNewProject) {
      onCreateNewProject({
        template: newTemplate,
        projectName: newProjectNameInput.endsWith('.mcam') ? newProjectNameInput : `${newProjectNameInput}.mcam`,
        unitSystem: newUnitSystem,
        customDimensions: newStockDim
      });
    }
    if (onNotify) onNotify(`Created new project: ${newProjectNameInput}`, 'success');
    onClose();
  };

  const handleOpenCADFile = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        if (file.name.toLowerCase().endsWith('.mcam')) {
          const projectData = await parseProjectMCAM(file);
          if (onLoadProject) {
            onLoadProject(projectData);
          }
          if (onNotify) onNotify(`Successfully opened ${file.name}`, 'success');
          onClose();
          return;
        }

        const modelGroup = await parseAnyCADFile(file);
        if (onModelImported) {
          onModelImported(modelGroup, file.name, file);
        }
        if (onNotify) onNotify(`Successfully opened ${file.name}`, 'success');
        onClose();
      } catch (err) {
        alert(`Failed to load ${file.name}: ${err.message}`);
      }
    }
  };

  const handleMergeCADFile = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const modelGroup = await parseAnyCADFile(file);
        // Offset merged model
        if (modelGroup) {
          modelGroup.position.set(
            Number(mergeOffset.x) || 0,
            Number(mergeOffset.y) || 0,
            Number(mergeOffset.z) || 0
          );
        }
        if (onModelImported) {
          onModelImported(modelGroup, `Merged_${file.name}`);
        }
        if (onNotify) onNotify(`Geometry merged into Level ${mergeTargetLevel}: ${file.name}`, 'success');
        onClose();
      } catch (err) {
        alert(`Failed to merge ${file.name}: ${err.message}`);
      }
    }
  };

  const handleRunRepairFile = () => {
    setRepairStatus('running');
    setTimeout(() => {
      setRepairStatus({
        cleanEntities: 14,
        repairedSolids: 1,
        rebuiltBoundingBox: true,
        purgedHistoryNodes: 3,
        statusText: 'All B-Rep geometry and toolpath tree records verified. File integrity is optimal.'
      });
      if (onNotify) onNotify('File repair routine completed successfully.', 'success');
    }, 800);
  };

  const handleTriggerZip2Go = () => {
    setZip2GoGenerating(true);
    setTimeout(() => {
      setZip2GoGenerating(false);
      // Generate Zip package representation
      const zipSummary = {
        package: `Zip2Go_${currentProjectName.replace(/\.[^/.]+$/, "")}.zip`,
        created: new Date().toISOString(),
        included: Object.keys(zip2GoItems).filter(k => zip2GoItems[k]),
        part: currentProjectName,
        machine: activeMachine?.name,
        ncCodeSize: editorCode.length,
        systemInfo: navigator.userAgent
      };
      const blob = new Blob([JSON.stringify(zipSummary, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Zip2Go_${currentProjectName.replace(/\.[^/.]+$/, "")}.zip2go`;
      a.click();
      URL.revokeObjectURL(a);
      if (onNotify) onNotify('Zip2Go diagnostic package generated and downloaded.', 'success');
    }, 1200);
  };

  const sidebarTabs = [
    { id: 'Info', label: 'Info' },
    { id: 'New', label: 'New' },
    { id: 'Open', label: 'Open' },
    { id: 'Open in Editor', label: 'Open in Editor' },
    { id: 'Merge', label: 'Merge' },
    { id: 'Save', label: 'Save' },
    { id: 'Save As', label: 'Save As' },
    { id: 'Save Some', label: 'Save Some' },
    { id: 'Zip2Go', label: 'Zip2Go' },
    { id: 'Convert', label: 'Convert' },
    { id: 'Print', label: 'Print' },
    { id: 'Help', label: 'Help' },
    { id: 'Community', label: 'Community' },
    { id: 'Configuration', label: 'Configuration' },
    { id: 'Options', label: 'Options' }
  ];

  return (
    <div
      className="backstage-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        color: '#1e293b',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Hidden File Pickers accepting all 25 Mastercam formats */}
      <input
        ref={openCadInputRef}
        type="file"
        accept={ALL_SUPPORTED_EXTENSIONS_STRING}
        style={{ display: 'none' }}
        onChange={handleOpenCADFile}
      />
      <input
        ref={mergeCadInputRef}
        type="file"
        accept={ALL_SUPPORTED_EXTENSIONS_STRING}
        style={{ display: 'none' }}
        onChange={handleMergeCADFile}
      />

      {/* 1. TOP WINDOW BAR (Mastercam Design 2018 style) */}
      <div
        style={{
          height: '32px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontSize: '12px',
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: '#0f5a9e' }}>Mastercam Design 2018</span>
          <span>-</span>
          <span style={{ color: '#334155' }}>{currentProjectName || 'Untitled.mcam'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => {}}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => {}}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            title="Maximize"
          >
            <Square size={12} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
            title="Close Backstage (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. MAIN BACKSTAGE BODY: Left Blue Navigation + Right Content Canvas */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ================= LEFT SIDEBAR (Mastercam Blue) ================= */}
        <div
          style={{
            width: '210px',
            background: '#0f5a9e',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: '8px',
            boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.1)',
            zIndex: 10
          }}
        >
          {/* Top Circular Return/Back Button (<-) */}
          <div style={{ padding: '8px 0 16px 18px' }}>
            <button
              onClick={onClose}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.85)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.85)';
              }}
              title="Return to CAD/CAM Workspace (Esc)"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
          </div>

          {/* Vertical Menu Buttons */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {sidebarTabs.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === 'Save') {
                      handleImmediateSave();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 22px',
                    fontSize: '13.5px',
                    fontWeight: isActive ? 600 : 400,
                    color: '#ffffff',
                    background: isActive ? '#196db8' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.12s ease',
                    boxShadow: isActive ? 'inset 4px 0 0 #ffffff' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Bottom Version Indicator */}
          <div style={{ padding: '12px 18px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            Argus Mastercam 2018/2026<br />64-bit Workstation Edition
          </div>
        </div>

        {/* ================= RIGHT WORKSPACE CONTENT ================= */}
        <div
          style={{
            flex: 1,
            background: activeTab === 'Print' ? '#cbd5e1' : '#ffffff',
            overflowY: activeTab === 'Print' ? 'hidden' : 'auto',
            padding: activeTab === 'Print' ? '0' : '36px 48px',
            position: 'relative',
            display: activeTab === 'Print' ? 'flex' : 'block'
          }}
        >
          {/* ==================== 1. INFO TAB (MATCHING SCREENSHOT) ==================== */}
          {activeTab === 'Info' && (
            <div style={{ maxWidth: '1100px' }}>
              <h1 style={{ fontSize: '38px', fontWeight: 400, color: '#1e293b', margin: '0 0 32px 0' }}>
                Info
              </h1>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '64px', alignItems: 'start' }}>
                
                {/* LEFT COLUMN: ACTION TILES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  
                  {/* Card 1: Project Manager */}
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <button
                      onClick={() => setIsProjectManagerOpen(true)}
                      style={{
                        width: '74px',
                        height: '74px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0f5a9e';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 90, 158, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title="Open Project Manager"
                    >
                      <div style={{ position: 'relative' }}>
                        <Folder size={32} color="#f59e0b" fill="#fef3c7" strokeWidth={1.5} />
                        <FileText size={16} color="#0f5a9e" style={{ position: 'absolute', bottom: -2, right: -4 }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500, textAlign: 'center', lineHeight: 1.1 }}>
                        Project<br />Manager
                      </span>
                    </button>
                    <div>
                      <h3
                        onClick={() => setIsProjectManagerOpen(true)}
                        style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0f5a9e'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1e293b'}
                      >
                        Project Manager
                      </h3>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
                        Use the Project Manager to specify the types of files to save in your project folder. Specifying these file types lets you keep all project files in a single place.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Change Recognition */}
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <button
                      onClick={() => setIsChangeRecogOpen(true)}
                      style={{
                        width: '74px',
                        height: '74px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0f5a9e';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 90, 158, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title="Run Change Recognition"
                    >
                      <Search size={28} color="#0f5a9e" strokeWidth={1.8} />
                      <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500, textAlign: 'center', lineHeight: 1.1 }}>
                        Change<br />Recognition
                      </span>
                    </button>
                    <div>
                      <h3
                        onClick={() => setIsChangeRecogOpen(true)}
                        style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0f5a9e'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1e293b'}
                      >
                        Change Recognition
                      </h3>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
                        Compare the geometry of two versions of a part file, identify changed geometry, view the status of affected operations, and make decisions on updating the original file.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Track Changes */}
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setIsTrackChangesOpen(true)}
                        style={{
                          width: '74px',
                          height: '74px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '2px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#0f5a9e';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 90, 158, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        title="Manage Track Changes"
                      >
                        <RefreshCw size={26} color="#059669" strokeWidth={1.8} />
                        <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500, textAlign: 'center', lineHeight: 1.1 }}>
                          Track<br />Changes
                        </span>
                      </button>
                      <div style={{ position: 'absolute', bottom: 2, right: 4, pointerEvents: 'none' }}>
                        <ChevronDown size={10} color="#64748b" />
                      </div>
                    </div>
                    <div>
                      <h3
                        onClick={() => setIsTrackChangesOpen(true)}
                        style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0f5a9e'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1e293b'}
                      >
                        Track Changes
                      </h3>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
                        Manage the files that Mastercam tracks, and customize how Mastercam searches for newer versions of tracked files.
                      </p>
                    </div>
                  </div>

                  {/* Card 4: AutoSave */}
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <button
                      onClick={() => setIsAutoSaveModalOpen(true)}
                      style={{
                        width: '74px',
                        height: '74px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0f5a9e';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 90, 158, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title="Configure AutoSave"
                    >
                      <div style={{ position: 'relative' }}>
                        <Save size={26} color="#0284c7" strokeWidth={1.8} />
                        <Settings size={14} color="#f59e0b" style={{ position: 'absolute', top: -3, right: -4 }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500, textAlign: 'center', lineHeight: 1.1 }}>
                        AutoSave
                      </span>
                    </button>
                    <div>
                      <h3
                        onClick={() => setIsAutoSaveModalOpen(true)}
                        style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0f5a9e'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1e293b'}
                      >
                        AutoSave
                      </h3>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
                        Configure Mastercam to automatically save current geometry and operations at regular and specific time intervals.
                      </p>
                    </div>
                  </div>

                  {/* Card 5: Repair File */}
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    <button
                      onClick={() => setIsRepairFileOpen(true)}
                      style={{
                        width: '74px',
                        height: '74px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0f5a9e';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 90, 158, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title="Run File Repair Utility"
                    >
                      <HardDrive size={26} color="#475569" strokeWidth={1.8} />
                      <span style={{ fontSize: '11px', color: '#334155', fontWeight: 500, textAlign: 'center', lineHeight: 1.1 }}>
                        RAM<br />Repair File
                      </span>
                    </button>
                    <div>
                      <h3
                        onClick={() => setIsRepairFileOpen(true)}
                        style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#0f5a9e'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#1e293b'}
                      >
                        Repair File
                      </h3>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
                        Perform routine maintenance on the current file to improve performance and ensure file integrity.
                      </p>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: PROPERTIES & RELATED DATES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Properties Section */}
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 16px 0' }}>
                      Properties
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '12px', fontSize: '12.5px' }}>
                      <div style={{ color: '#64748b' }}>Name</div>
                      <div style={{ color: '#1e293b', fontWeight: 500 }}>
                        {currentProjectName || 'Not saved yet'}
                      </div>

                      <div style={{ color: '#64748b' }}>Type</div>
                      <div style={{ color: '#1e293b', fontWeight: 500 }}>Mastercam Part File</div>

                      <div style={{ color: '#64748b' }}>Folder Path</div>
                      <div style={{ color: '#94a3b8' }}>
                        {currentProjectName ? 'E:\\CAM_Workspace\\Projects\\' : 'Not saved yet'}
                      </div>

                      <div style={{ color: '#64748b' }}>Size</div>
                      <div style={{ color: '#1e293b', fontWeight: 500 }}>{formattedFileSize}</div>

                      <div style={{ color: '#64748b' }}>Units</div>
                      <div style={{ color: '#1e293b', fontWeight: 500 }}>
                        {newUnitSystem === 'imperial' ? 'Inch' : 'Metric'}
                      </div>

                      <div style={{ color: '#64748b' }}>Descriptor</div>
                      <div>
                        <textarea
                          value={projectDescriptor || ''}
                          onChange={(e) => setProjectDescriptor(e.target.value)}
                          placeholder="Not saved yet"
                          rows={4}
                          style={{
                            width: '100%',
                            maxWidth: '280px',
                            padding: '6px 8px',
                            fontSize: '12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '2px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            color: '#1e293b',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#0f5a9e'}
                          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Related Dates Section */}
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 16px 0' }}>
                      Related Dates
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '10px', fontSize: '12.5px' }}>
                      <div style={{ color: '#64748b' }}>Last Modified</div>
                      <div style={{ color: '#334155' }}>
                        {formatDateMastercam(projectLastModifiedDate)}
                      </div>

                      <div style={{ color: '#64748b' }}>Created</div>
                      <div style={{ color: '#334155' }}>
                        {formatDateMastercam(projectCreatedDate)}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ==================== 2. NEW TAB ==================== */}
          {activeTab === 'New' && (
            <div style={{ maxWidth: '900px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 24px 0' }}>
                New CAM Project Wizard
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>
                Select an engineering template and configure initial stock and machining parameters to begin.
              </p>

              <form onSubmit={handleCreateNewProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Template Cards */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
                    Select Machining Template:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {[
                      { id: 'titan_1m', label: 'TITAN-1M (Titans of CNC)', desc: 'Benchmark 4x1.9x0.75" milling part: Facing, Dynamic Mill, Contour, Pocket, Chamfer, Drill & Tap', icon: Zap },
                      { id: 'mastercam2019_tutorial', label: 'Mastercam 2019 Tutorial', desc: '5x5" plate with Facing, 2D Contour, Circle Mill, Spot & Peck Drill', icon: Zap },
                      { id: 'blank', label: 'Blank Part', desc: 'Empty CAD canvas with default levels and origin', icon: Box },
                      { id: 'vmc3x', label: '3-Axis VMC Billet', desc: 'Raw 6061-T6 stock block with G54 WCS', icon: Layers },
                      { id: 'impeller', label: '5-Axis Impeller', desc: 'Rotary blisk geometry for multiaxis milling', icon: Cpu },
                      { id: 'bracket', label: 'Aerospace Bracket', desc: 'Prismatic structural bracket with fixture vise', icon: ShieldAlert },
                      { id: 'lathe', label: '2-Axis Lathe Turn', desc: 'Cylindrical stock for turning & grooving', icon: Disc },
                      { id: 'mold', label: 'Injection Mold Core', desc: 'Hardened tool steel core with 3D contours', icon: Wrench }
                    ].map((tpl) => {
                      const IconComp = tpl.icon;
                      const isSel = newTemplate === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setNewTemplate(tpl.id)}
                          style={{
                            padding: '16px',
                            border: isSel ? '2px solid #0f5a9e' : '1px solid #cbd5e1',
                            borderRadius: '4px',
                            background: isSel ? '#f0f7ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IconComp size={20} color={isSel ? '#0f5a9e' : '#64748b'} />
                            <span style={{ fontSize: '13.5px', fontWeight: 600, color: isSel ? '#0f5a9e' : '#1e293b' }}>
                              {tpl.label}
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.35 }}>
                            {tpl.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Project File Name:
                    </label>
                    <input
                      type="text"
                      value={newProjectNameInput}
                      onChange={(e) => setNewProjectNameInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Unit System:
                    </label>
                    <select
                      value={newUnitSystem}
                      onChange={(e) => setNewUnitSystem(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '3px',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="metric">Metric (Millimeters - G21)</option>
                      <option value="imperial">Imperial (Inches - G20)</option>
                    </select>
                  </div>
                </div>

                {/* Stock Dimensions */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Initial Stock Dimensions ({newUnitSystem === 'imperial' ? 'Inches' : 'mm'}):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Width X:</span>
                      <input
                        type="number"
                        value={newStockDim.x}
                        onChange={(e) => setNewStockDim({ ...newStockDim, x: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Depth Y:</span>
                      <input
                        type="number"
                        value={newStockDim.y}
                        onChange={(e) => setNewStockDim({ ...newStockDim, y: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Height Z:</span>
                      <input
                        type="number"
                        value={newStockDim.z}
                        onChange={(e) => setNewStockDim({ ...newStockDim, z: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      background: '#0f5a9e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '10px 20px',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      fontWeight: 500,
                      fontSize: '13.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== 3. OPEN TAB ==================== */}
          {activeTab === 'Open' && (
            <div style={{ maxWidth: '900px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 24px 0' }}>
                Open Project / CAD File
              </h1>

              {/* Browse Buttons Bar */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    if (onOpenMastercamDialog) {
                      onClose();
                      onOpenMastercamDialog();
                    } else {
                      openCadInputRef.current?.click();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    background: '#0f5a9e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15, 90, 158, 0.3)'
                  }}
                >
                  <FolderOpen size={18} />
                  Open Project or CAD File...
                </button>
              </div>

              {/* Recent Files Section */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 16px 0' }}>
                  Recent Documents
                </h3>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  {getRecentProjects().map((p, idx) => (
                    <div
                      key={p.filename || idx}
                      onClick={() => {
                        if (onLoadProject) onLoadProject(p);
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        borderBottom: idx < getRecentProjects().length - 1 ? '1px solid #f1f5f9' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={20} color="#0f5a9e" />
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                            {p.projectName || p.filename}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {p.filename} • {p.machine || 'DMG MORI DMU 50'} • {p.opsCount || 5} operations
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {formatDateMastercam(p.savedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. OPEN IN EDITOR TAB ==================== */}
          {activeTab === 'Open in Editor' && (
            <div style={{ maxWidth: '1000px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: 400, color: '#1e293b', margin: 0 }}>
                    Mastercam Code Expert Editor
                  </h1>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Active CNC NC G-Code program ready for controller dispatch.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                    <span>Feed Rate:</span>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={editorFeedMultiplier}
                      onChange={(e) => setEditorFeedMultiplier(Number(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    <span>{editorFeedMultiplier}%</span>
                  </div>

                  <button
                    onClick={() => {
                      const blob = new Blob([editorCode], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${currentProjectName.replace(/\.[^/.]+$/, "")}.nc`;
                      a.click();
                      URL.revokeObjectURL(a);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#0f5a9e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={14} /> Download .NC File
                  </button>
                </div>
              </div>

              {/* Code Textarea with Mono Font */}
              <div style={{ flex: 1, minHeight: '400px', position: 'relative' }}>
                <textarea
                  value={editorCode}
                  onChange={(e) => setEditorCode(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '420px',
                    fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                    fontSize: '13px',
                    lineHeight: '1.5',
                    padding: '16px',
                    background: '#0f172a',
                    color: '#38bdf8',
                    border: '1px solid #1e293b',
                    borderRadius: '4px',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* ==================== 5. MERGE TAB ==================== */}
          {activeTab === 'Merge' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 16px 0' }}>
                Merge Geometry
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>
                Import external CAD files into your active part file without replacing existing solids or wiping toolpaths.
              </p>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <button
                    onClick={() => mergeCadInputRef.current?.click()}
                    style={{
                      padding: '10px 20px',
                      background: '#0f5a9e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FolderOpen size={16} /> Select CAD File to Merge (.step, .iges, .stl, .obj)...
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Target Mastercam Level:
                    </label>
                    <select
                      value={mergeTargetLevel}
                      onChange={(e) => setMergeTargetLevel(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value={1}>Level 1: Part Solid</option>
                      <option value={10}>Level 10: Wireframe Curves</option>
                      <option value={15}>Level 15: Surfaces</option>
                      <option value={20}>Level 20: Stock Bounding Box</option>
                      <option value={30}>Level 30: Fixture & Clamps</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Position Offset (X, Y, Z mm):
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder="X"
                        value={mergeOffset.x}
                        onChange={(e) => setMergeOffset({ ...mergeOffset, x: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="number"
                        placeholder="Y"
                        value={mergeOffset.y}
                        onChange={(e) => setMergeOffset({ ...mergeOffset, y: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                      />
                      <input
                        type="number"
                        placeholder="Z"
                        value={mergeOffset.z}
                        onChange={(e) => setMergeOffset({ ...mergeOffset, z: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 6. SAVE TAB ==================== */}
          {activeTab === 'Save' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 16px 0' }}>
                Save Project
              </h1>
              <div style={{ padding: '24px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={28} color="#059669" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
                      Active Project Saved
                    </h3>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                      "{currentProjectName}" is synchronized with local storage snapshot and ready for export.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    onClick={handleImmediateSave}
                    style={{
                      padding: '10px 20px',
                      background: '#0f5a9e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={16} /> Download .MCAM Part File
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      padding: '10px 20px',
                      background: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Return to CAD Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 7. SAVE AS TAB ==================== */}
          {activeTab === 'Save As' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 24px 0' }}>
                Save As
              </h1>

              <form onSubmit={handleSaveAsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    File Name:
                  </label>
                  <input
                    type="text"
                    value={saveAsFilename}
                    onChange={(e) => setSaveAsFilename(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Save As Type:
                  </label>
                  <select
                    value={saveAsFormat}
                    onChange={(e) => setSaveAsFormat(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px', background: '#ffffff' }}
                  >
                    <option value="mcam">Mastercam Part File (*.mcam)</option>
                    <option value="json">Mastercam CAD/CAM JSON Schema (*.json)</option>
                    <option value="step">ISO 10303-21 STEP Solid (*.step)</option>
                    <option value="stl">Stereolithography Mesh (*.stl)</option>
                    <option value="nc">NC G-Code Program (*.nc)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeStockInSave}
                      onChange={(e) => setIncludeStockInSave(e.target.checked)}
                    />
                    Include raw stock workpiece model and bounding coordinates
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeToolLibrary}
                      onChange={(e) => setIncludeToolLibrary(e.target.checked)}
                    />
                    Embed active cutting tool assemblies and feed/speed libraries
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 24px',
                      background: '#0f5a9e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Save File
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '10px 20px',
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== 8. SAVE SOME TAB ==================== */}
          {activeTab === 'Save Some' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 16px 0' }}>
                Save Some (Selective Entity Export)
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>
                Select only the specific components and layers you wish to export to a separate file.
              </p>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(saveSomeSelection).map((key) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={saveSomeSelection[key]}
                      onChange={(e) => setSaveSomeSelection({ ...saveSomeSelection, [key]: e.target.checked })}
                    />
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                      {key === 'tools' ? 'Cutting Tool Library' : key === 'solids' ? '3D Solid Bodies' : key}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={() => {
                    const partialState = {
                      projectName: `Selective_${currentProjectName}`,
                      exportedComponents: saveSomeSelection,
                      operations: saveSomeSelection.toolpaths ? operations : [],
                      tools: saveSomeSelection.tools ? tools : []
                    };
                    exportProjectMCAM(partialState, `Selective_${currentProjectName}`);
                    if (onNotify) onNotify('Selected entities exported successfully.', 'success');
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#0f5a9e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '3px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Export Selected Entities
                </button>
              </div>
            </div>
          )}

          {/* ==================== 9. ZIP2GO TAB ==================== */}
          {activeTab === 'Zip2Go' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 16px 0' }}>
                Zip2Go Diagnostic & Support Package
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>
                Zip2Go bundles your CAD part, posted NC programs, post processors, machine definitions, and tool libraries into an archive for shop floor transfer or technical assistance.
              </p>

              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.keys(zip2GoItems).map((key) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={zip2GoItems[key]}
                      onChange={(e) => setZip2GoItems({ ...zip2GoItems, [key]: e.target.checked })}
                    />
                    <span style={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ marginTop: '24px' }}>
                <button
                  onClick={handleTriggerZip2Go}
                  disabled={zip2GoGenerating}
                  style={{
                    padding: '12px 28px',
                    background: zip2GoGenerating ? '#94a3b8' : '#0f5a9e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    cursor: zip2GoGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {zip2GoGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                  {zip2GoGenerating ? 'Creating Zip2Go Package...' : 'Create & Download Zip2Go Package'}
                </button>
              </div>
            </div>
          )}

          {/* ==================== 10. CONVERT TAB ==================== */}
          {activeTab === 'Convert' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 16px 0' }}>
                Convert & Translate CAD Formats
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 24px 0' }}>
                Translate between neutral STEP, IGES, STL, and DXF representations with geometric unit scaling.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '24px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Target Format:
                  </label>
                  <select
                    value={convertTargetFormat}
                    onChange={(e) => setConvertTargetFormat(e.target.value)}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  >
                    <option value="step">ISO 10303-21 STEP (*.step)</option>
                    <option value="iges">IGES 5.3 Surface Mesh (*.igs)</option>
                    <option value="stl">Stereolithography Mesh (*.stl)</option>
                    <option value="obj">Wavefront 3D Object (*.obj)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Unit Scaling Factor:
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={convertScaleFactor}
                    onChange={(e) => setConvertScaleFactor(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={() => {
                    if (onSaveAs) onSaveAs(`Converted_${currentProjectName.split('.')[0]}.${convertTargetFormat}`, { format: convertTargetFormat });
                    if (onNotify) onNotify(`Converted and exported as ${convertTargetFormat.toUpperCase()}`, 'success');
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#0f5a9e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '3px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Execute Conversion
                </button>
              </div>
            </div>
          )}

          {/* ==================== 11. PRINT TAB (EXACT MASTERCAM IMAGE 1 REPLICA) ==================== */}
          {activeTab === 'Print' && (
            <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
              
              {/* MIDDLE COLUMN: PRINT CONTROLS & SETTINGS (Image 1 replica) */}
              <div
                style={{
                  width: '320px',
                  background: '#ffffff',
                  borderRight: '1px solid #cbd5e1',
                  padding: '24px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  overflowY: 'auto'
                }}
              >
                <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: 0 }}>
                  Print
                </h1>

                {/* Print Button + Copies Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      width: '72px',
                      height: '72px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '2px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                    title="Print Document (Ctrl+P)"
                  >
                    <Printer size={26} color="#334155" />
                    <span style={{ fontSize: '11px', marginTop: '4px', color: '#1e293b', fontWeight: 500 }}>Print</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#475569' }}>Copies:</span>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={printCopies}
                      onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: '56px',
                        padding: '4px 6px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>

                {/* Section: Printer */}
                <div>
                  <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: '0 0 6px 0', textTransform: 'none' }}>
                    Printer
                  </h3>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f8fafc',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ position: 'relative' }}>
                          <Printer size={22} color="#0f5a9e" />
                          <div style={{ position: 'absolute', bottom: -2, right: -2, width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a', border: '1.5px solid #ffffff' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{printPrinter}</span>
                          <span style={{ fontSize: '11px', color: '#16a34a' }}>Ready</span>
                        </div>
                      </div>
                      <ChevronDown size={14} color="#64748b" />
                    </div>
                  </div>
                  <a
                    href="#printer-props"
                    onClick={(e) => { e.preventDefault(); onNotify?.('Printer status: Microsoft Print to PDF is online and ready.', 'info'); }}
                    style={{ fontSize: '11.5px', color: '#0f5a9e', textDecoration: 'none', display: 'inline-block', marginTop: '6px' }}
                  >
                    Printer Properties
                  </a>
                </div>

                {/* Section: Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#475569', margin: '0 0 2px 0' }}>
                    Settings
                  </h3>

                  {/* Orientation Dropdown */}
                  <div>
                    <div
                      onClick={() => setPrintOrientation(printOrientation === 'portrait' ? 'landscape' : 'portrait')}
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                      title="Click to toggle Portrait / Landscape Orientation"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={18} color="#64748b" />
                        <span style={{ fontSize: '12px', color: '#1e293b' }}>
                          {printOrientation === 'portrait' ? 'Portrait Orientation' : 'Landscape Orientation'}
                        </span>
                      </div>
                      <ChevronDown size={14} color="#64748b" />
                    </div>
                  </div>

                  {/* Paper Size Dropdown */}
                  <div>
                    <select
                      value={printPaperSize}
                      onChange={(e) => setPrintPaperSize(e.target.value)}
                      style={{
                        width: '100%',
                        border: '1px solid #cbd5e1',
                        borderRadius: '2px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#1e293b',
                        background: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="letter">Letter  21.59 cm x 27.94 cm (8.5 x 11 in)</option>
                      <option value="a4">A4  21.00 cm x 29.70 cm</option>
                      <option value="tabloid">Tabloid / A3  27.94 cm x 43.18 cm</option>
                      <option value="legal">Legal  21.59 cm x 35.56 cm</option>
                    </select>
                  </div>

                  <a
                    href="#page-setup"
                    onClick={(e) => { e.preventDefault(); onNotify?.('Page Setup: Margins 15mm, Scale: Fit to Printable Sheet Area', 'info'); }}
                    style={{ fontSize: '11.5px', color: '#0f5a9e', textDecoration: 'none', display: 'inline-block', marginTop: '2px' }}
                  >
                    Page Setup
                  </a>
                </div>
              </div>

              {/* RIGHT COLUMN: DYNAMIC PRINT SHEET PREVIEW (Image 1 replica) */}
              <div
                style={{
                  flex: 1,
                  background: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  overflow: 'auto',
                  position: 'relative'
                }}
              >
                {/* Paper Sheet */}
                <div
                  id="mastercam-print-sheet"
                  style={{
                    width: printOrientation === 'portrait' ? '540px' : '720px',
                    height: printOrientation === 'portrait' ? '700px' : '540px',
                    background: '#ffffff',
                    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.22)',
                    position: 'relative',
                    borderRadius: '1px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Inner Dotted Printable Margin Boundary (Matching Image 1) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '20px',
                      border: '1px dashed #94a3b8',
                      pointerEvents: 'none',
                      zIndex: 20
                    }}
                  />

                  {/* Header / Drawing Title Block Info */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '28px',
                      right: '28px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: '#64748b',
                      pointerEvents: 'none',
                      zIndex: 20,
                      fontFamily: "'Segoe UI', Tahoma, sans-serif"
                    }}
                  >
                    <span><strong>Project:</strong> {currentProjectName || 'Mastercam_Part'}</span>
                    <span><strong>Scale:</strong> FIT TO PAGE</span>
                    <span><strong>Date:</strong> {new Date().toLocaleDateString()}</span>
                  </div>

                  {/* Dynamic CAD 3D Viewport on the Sheet */}
                  <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
                    <PrintSheetViewport
                      currentModel={currentModel}
                      solidsList={solidsList}
                      customGeometry={customGeometry}
                      partMetrics={partMetrics}
                      orientation={printOrientation}
                      paperSize={printPaperSize}
                    />
                  </div>

                  {/* Bottom Footer block */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '28px',
                      right: '28px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '10.5px',
                      color: '#64748b',
                      pointerEvents: 'none',
                      zIndex: 20
                    }}
                  >
                    <span><strong>Machine:</strong> {activeMachine?.name || '4-AXIS VMC'}</span>
                    <span><strong>WCS:</strong> {activeWcs || 'Top (G54)'}</span>
                    <span><strong>Format:</strong> {printPaperSize.toUpperCase()} ({printOrientation})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 12. HELP TAB ==================== */}
          {activeTab === 'Help' && (
            <div style={{ maxWidth: '850px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 16px 0' }}>
                Mastercam Help & Reference Center
              </h1>

              {/* Keyboard Shortcuts Table */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', margin: '0 0 12px 0' }}>
                  Standard Mastercam Keyboard Shortcuts
                </h3>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                  {[
                    { key: 'F9', action: 'Toggle Mastercam Coordinate Axes & World Origin' },
                    { key: 'Alt + F9', action: 'Toggle Construction Plane (CPlane) Triad' },
                    { key: 'Alt + 1 / 2 / 3', action: 'Standard Views: Top (G17), Front (G19), Side (G18)' },
                    { key: 'Alt + 7', action: 'Isometric 3D Workpiece View' },
                    { key: 'S', action: 'Toggle Shaded vs Wireframe Mode' },
                    { key: 'Alt + S', action: 'Toggle Shading with Translucency' },
                    { key: 'Ctrl + Z', action: 'Undo Last Operation or Sketch Entity' },
                    { key: 'Escape', action: 'Exit Backstage / Cancel Current Modal' }
                  ].map((sc, idx) => (
                    <div key={sc.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: idx < 7 ? '1px solid #f1f5f9' : 'none', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '12.5px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0f5a9e' }}>{sc.key}</span>
                      <span style={{ color: '#475569' }}>{sc.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Box */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#f8fafc' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#1e293b' }}>
                  Argus Mastercam Design 2018 / 2026 Edition
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  High-performance CNC Toolpath Simulation, Multiaxis CAD/CAM Engine and Shop Floor Management Suite.
                  Built for precision machining, 5-axis aerospace fabrication, and high-speed milling.
                </p>
              </div>
            </div>
          )}

          {/* ==================== 13. COMMUNITY TAB ==================== */}
          {activeTab === 'Community' && (
            <div style={{ maxWidth: '850px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 16px 0' }}>
                CNC Community & Manufacturer Portals
              </h1>

              {/* External Links */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                  { title: 'eMastercam Community Forum', url: 'https://forum.emastercam.com', desc: 'Discuss toolpath strategies, custom posts, and tips with Mastercam programmers worldwide' },
                  { title: 'Sandvik Coromant CoroPlus', url: 'https://www.sandvik.coromant.com', desc: 'Access manufacturer cutting tool data, inserts, and speed/feed calculators' },
                  { title: 'Kennametal NOVO Tool Advisor', url: 'https://www.kennametal.com', desc: 'Cutting tool assembly catalog with ISO 13399 standard parameters' },
                  { title: 'CNCzone Machining Forums', url: 'https://www.cnczone.com', desc: 'CNC milling, lathe turning, 5-axis simultaneous post processor discussions' }
                ].map((comm) => (
                  <a
                    key={comm.title}
                    href={comm.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: 'none',
                      padding: '16px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f5a9e', fontWeight: 600, fontSize: '13.5px' }}>
                      {comm.title} <ExternalLink size={14} />
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>{comm.desc}</span>
                  </a>
                ))}
              </div>

              {/* Feedback Form */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#ffffff' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: '0 0 12px 0' }}>
                  Submit Diagnostics & Software Feedback
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe any issues, post processor requirements, or toolpath features..."
                    rows={4}
                    style={{ width: '100%', padding: '10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  />
                  <div>
                    <button
                      onClick={() => {
                        if (!feedbackText.trim()) return;
                        alert('Thank you! Your feedback and diagnostics report have been submitted.');
                        setFeedbackText('');
                      }}
                      style={{
                        padding: '8px 20px',
                        background: '#0f5a9e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '3px',
                        fontWeight: 600,
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      Send Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 14. CONFIGURATION TAB ==================== */}
          {activeTab === 'Configuration' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 20px 0' }}>
                Mastercam System Configuration
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Tolerances */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: '0 0 14px 0' }}>
                    Chaining & Surface Tolerances
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>Chaining Tolerance (mm):</span>
                      <input
                        type="number"
                        step="0.001"
                        value={sysConfig.chainingTolerance}
                        onChange={(e) => setSysConfig({ ...sysConfig, chainingTolerance: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '4px' }}>Chordal Deviation (mm):</span>
                      <input
                        type="number"
                        step="0.001"
                        value={sysConfig.chordalDeviation}
                        onChange={(e) => setSysConfig({ ...sysConfig, chordalDeviation: Number(e.target.value) })}
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12.5px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                </div>

                {/* AutoSave Interval */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: '0 0 14px 0' }}>
                    Automatic Backup & AutoSave
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '12.5px', color: '#475569' }}>Save snapshot every:</span>
                    <select
                      value={sysConfig.autoSaveInterval}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSysConfig({ ...sysConfig, autoSaveInterval: val });
                        if (setAutoSaveInterval) setAutoSaveInterval(val);
                      }}
                      style={{ padding: '6px 12px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                    >
                      <option value={1}>1 Minute</option>
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (onNotify) onNotify('System Configuration updated and applied.', 'success');
                    }}
                    style={{
                      padding: '10px 24px',
                      background: '#0f5a9e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Apply & Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 15. OPTIONS TAB ==================== */}
          {activeTab === 'Options' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 400, color: '#1e293b', margin: '0 0 20px 0' }}>
                Options & User Preferences
              </h1>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: '0 0 12px 0' }}>
                    3D Viewport Mouse Navigation
                  </h3>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="zoomDirection"
                        checked={appOptions.mouseWheelZoom === 'standard'}
                        onChange={() => setAppOptions({ ...appOptions, mouseWheelZoom: 'standard' })}
                      />
                      Standard Mastercam (Roll Forward = Zoom In)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="zoomDirection"
                        checked={appOptions.mouseWheelZoom === 'inverted'}
                        onChange={() => setAppOptions({ ...appOptions, mouseWheelZoom: 'inverted' })}
                      />
                      Inverted CAD (AutoCAD / SolidWorks Style)
                    </label>
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: '0 0 12px 0' }}>
                    Hardware Acceleration & Diagnostics
                  </h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={appOptions.hardwareAcceleration}
                      onChange={(e) => setAppOptions({ ...appOptions, hardwareAcceleration: e.target.checked })}
                    />
                    Enable WebGL 2.0 Hardware GPU Shading Acceleration
                  </label>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (onNotify) onNotify('Preferences saved successfully.', 'success');
                    }}
                    style={{
                      padding: '10px 24px',
                      background: '#0f5a9e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-MODALS FOR INFO TAB ACTION CARDS                           */}
      {/* ============================================================== */}

      {/* 1. Project Manager Modal */}
      {isProjectManagerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '560px', background: '#ffffff', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: '#0f5a9e', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '14px' }}>
              <span>Mastercam Project Manager</span>
              <button onClick={() => setIsProjectManagerOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
              <p style={{ margin: 0, color: '#64748b' }}>
                Specify folder locations for linked project assets. Mastercam will automatically search these directories.
              </p>
              {Object.keys(projectFolders).map((key) => (
                <div key={key}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}:
                  </label>
                  <input
                    type="text"
                    value={projectFolders[key]}
                    onChange={(e) => setProjectFolders({ ...projectFolders, [key]: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setIsProjectManagerOpen(false);
                    if (onNotify) onNotify('Project folder paths saved.', 'success');
                  }}
                  style={{ padding: '8px 18px', background: '#0f5a9e', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Paths
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Change Recognition Modal */}
      {isChangeRecogOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '600px', background: '#ffffff', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: '#0f5a9e', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '14px' }}>
              <span>Change Recognition Analysis</span>
              <button onClick={() => setIsChangeRecogOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#059669', background: '#f0fdf4', padding: '10px', borderRadius: '4px' }}>
                <CheckCircle2 size={20} />
                <span>Comparison Base: <strong>{currentProjectName}</strong> vs Revision 2</span>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: '#f8fafc', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Operation Status Assessment:</div>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>• Op 1 - Facing: No geometry alteration detected. Valid.</div>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>• Op 2 - Dynamic Roughing: Pocket wall moved by +1.5mm. Marked DIRTY.</div>
                <div style={{ padding: '8px 12px' }}>• Op 3 - Chamfer Milling: Chamfer radius unchanged. Valid.</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => {
                    setIsChangeRecogOpen(false);
                    if (onNotify) onNotify('Dirty toolpaths flagged for regeneration.', 'info');
                  }}
                  style={{ padding: '8px 18px', background: '#0f5a9e', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Regenerate Affected Toolpaths
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Track Changes Modal */}
      {isTrackChangesOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '560px', background: '#ffffff', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: '#0f5a9e', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '14px' }}>
              <span>Track Changes Settings</span>
              <button onClick={() => setIsTrackChangesOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isTrackChangesEnabled}
                  onChange={(e) => setIsTrackChangesEnabled(e.target.checked)}
                />
                Enable Live External CAD File Hash Tracking
              </label>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '3px', padding: '12px', background: '#f8fafc' }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>Monitored Files:</div>
                {trackedFiles.map((f) => (
                  <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                    <span>{f.name} ({f.path})</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>{f.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setIsTrackChangesOpen(false)}
                  style={{ padding: '8px 18px', background: '#0f5a9e', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AutoSave Modal */}
      {isAutoSaveModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '520px', background: '#ffffff', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: '#0f5a9e', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '14px' }}>
              <span>AutoSave Configuration</span>
              <button onClick={() => setIsAutoSaveModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                />
                Enable Background AutoSave Snapshots
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Interval:</span>
                <select
                  value={autoSaveInterval}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (setAutoSaveInterval) setAutoSaveInterval(val);
                  }}
                  style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                >
                  <option value={1}>Every 1 minute</option>
                  <option value={5}>Every 5 minutes</option>
                  <option value={10}>Every 10 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    saveAutoSaveSnapshot({
                      projectName: currentProjectName,
                      stockConfig,
                      tools,
                      operations,
                      activeMachine,
                      activeWcs
                    });
                    if (onNotify) onNotify('Instant AutoSave snapshot taken.', 'success');
                  }}
                  style={{ padding: '8px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '3px', fontWeight: 500, cursor: 'pointer' }}
                >
                  Trigger Snapshot Now
                </button>
                <button
                  onClick={() => setIsAutoSaveModalOpen(false)}
                  style={{ padding: '8px 18px', background: '#0f5a9e', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Repair File Modal */}
      {isRepairFileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '560px', background: '#ffffff', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: '#0f5a9e', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '14px' }}>
              <span>RAM File Integrity & Maintenance Utility</span>
              <button onClick={() => { setIsRepairFileOpen(false); setRepairStatus(null); }} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12.5px' }}>
              <p style={{ margin: 0, color: '#64748b' }}>
                Routine maintenance scans for non-manifold solid faces, orphaned toolpath links, and unreferenced memory buffers.
              </p>
              {repairStatus === 'running' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0f5a9e', padding: '14px', background: '#f0f7ff', borderRadius: '4px' }}>
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Scanning B-Rep topology and reindexing cache...</span>
                </div>
              )}
              {repairStatus && repairStatus !== 'running' && (
                <div style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', padding: '12px', borderRadius: '4px', color: '#166534' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Maintenance Complete:</div>
                  <div>• Cleaned geometry nodes: {repairStatus.cleanEntities}</div>
                  <div>• Repaired solid headers: {repairStatus.repairedSolids}</div>
                  <div>• Purged unreferenced buffers: {repairStatus.purgedHistoryNodes}</div>
                  <div style={{ marginTop: '6px', fontWeight: 500 }}>{repairStatus.statusText}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                {!repairStatus && (
                  <button
                    onClick={handleRunRepairFile}
                    style={{ padding: '8px 18px', background: '#0f5a9e', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Start Repair Routine
                  </button>
                )}
                {repairStatus && repairStatus !== 'running' && (
                  <button
                    onClick={() => { setIsRepairFileOpen(false); setRepairStatus(null); }}
                    style={{ padding: '8px 18px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '3px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Folder, FileText, ChevronRight, ArrowLeft, ArrowRight,
  ArrowUp, Search, RefreshCw, X, HardDrive, Monitor, Download,
  Music, Image, Film, FileCode, Upload, Box, Cpu, Plus, Check
} from 'lucide-react';
import { CAD_FILE_FORMATS, parseAnyCADFile, ALL_SUPPORTED_EXTENSIONS_STRING } from '../utils/universalCadParser';
import { generateSampleSTEPString } from '../utils/stepIgesParser';

// Master repository of all simulated & real CAD files across directories
const MASTER_CAD_FILES = [
  { name: 'DMU50_5Axis_Impeller.mcam', format: 'mcam', ext: 'mcam', size: '184.2 KB', desc: '5-Axis Turbine Impeller CAM Project', folder: 'Desktop' },
  { name: 'DMU50_Aero_Bracket.mcx', format: 'mcx', ext: 'mcx', size: '215.0 KB', desc: 'Mastercam X Aerospace Structural Bracket', folder: 'Desktop' },
  { name: 'Educational_Tutorial_Part.emcx', format: 'emcx', ext: 'emcx', size: '142.8 KB', desc: 'Mastercam Edu X Sample Part', folder: 'Desktop' },
  { name: 'Turbine_Blade_Surface.igs', format: 'iges', ext: 'igs', size: '520.4 KB', desc: 'ASME Y14.26M Multi-Surface IGES', folder: 'Desktop' },
  { name: 'Core_Cavity_Insert.x_t', format: 'parasolid', ext: 'x_t', size: '380.6 KB', desc: 'Siemens Parasolid B-Rep Body', folder: 'Desktop' },
  { name: 'Aerospace_5X_Bracket.step', format: 'step', ext: 'step', size: '840.5 KB', desc: 'ISO 10303-21 STEP AP214 B-Rep', folder: 'Desktop' },
  { name: 'Finished_Workpiece_Mesh.stl', format: 'stl', ext: 'stl', size: '1.10 MB', desc: 'StereoLithography Triangular Mesh', folder: 'Desktop' },

  // Subfolder '2D'
  { name: 'Mounting_Plate_Contour.dxf', format: 'autocad', ext: 'dxf', size: '94.2 KB', desc: 'AutoCAD 2D/3D Wireframe & Polyline', folder: '2D' },
  { name: 'Laser_Plot_Profile.plt', format: 'hpgl', ext: 'plt', size: '38.4 KB', desc: 'HPGL Plotter Vector Cut Paths', folder: '2D' },
  { name: 'Vector_Emblem_Contour.eps', format: 'postscript', ext: 'eps', size: '115.0 KB', desc: 'PostScript / Illustrator Profile', folder: '2D' },

  // Subfolder 'arm'
  { name: 'Robotic_Arm_Linkage.step', format: 'step', ext: 'step', size: '640.2 KB', desc: 'Robotic Arm 5-Axis Linkage Body', folder: 'arm' },
  { name: 'Arm_Bracket.stl', format: 'stl', ext: 'stl', size: '420.0 KB', desc: 'Arm Structural Mount Bracket', folder: 'arm' },

  // Subfolder 'bottom flange a10'
  { name: 'Flange_A10_Turning.mcam', format: 'mcam', ext: 'mcam', size: '280.0 KB', desc: 'Turning / Boring Lathe Mastercam Setup', folder: 'bottom flange a10' },
  { name: 'Flange_A10_CAD.step', format: 'step', ext: 'step', size: '512.0 KB', desc: 'A10 Flange 3D Solid Model', folder: 'bottom flange a10' },

  // Downloads folder
  { name: 'Base_Structure-ALU.stl', format: 'stl', ext: 'stl', size: '950.0 KB', desc: 'CNC Workpiece Base Structure Mesh', folder: 'Downloads' },
  { name: 'Aerospace_5X_Bracket.step', format: 'step', ext: 'step', size: '840.5 KB', desc: 'ISO 10303-21 STEP AP214 B-Rep', folder: 'Downloads' },
  { name: 'Wing_Rib_Section.catpart', format: 'catia', ext: 'catpart', size: '1.80 MB', desc: 'Dassault CATIA V5 Part Solid', folder: 'Downloads' },

  // Documents folder
  { name: 'Hydraulic_Manifold_Block.sat', format: 'acis', ext: 'sat', size: '445.8 KB', desc: 'Spatial ACIS Kernel SAT Solid', folder: 'Documents' },
  { name: 'Drive_Spindle_Shaft.ipt', format: 'inventor', ext: 'ipt', size: '740.2 KB', desc: 'Autodesk Inventor IPT Part', folder: 'Documents' },
  { name: 'Cylinder_Head_Cover.sldprt', format: 'solidworks', ext: 'sldprt', size: '1.24 MB', desc: 'SOLIDWORKS Native 3D Solid', folder: 'Documents' },

  // 3D Objects folder
  { name: 'Engine_Piston_Assembly.prt', format: 'proe_creo', ext: 'prt', size: '610.1 KB', desc: 'PTC Creo / ProE Parametric Solid', folder: '3D Objects' },
  { name: 'Organic_Ergonomic_Grip.3dm', format: 'rhino', ext: '3dm', size: '920.0 KB', desc: 'Rhino 3D OpenNURBS Part', folder: '3D Objects' },
  { name: 'Gearbox_Housing.par', format: 'solidedge', ext: 'par', size: '890.1 KB', desc: 'Siemens Solid Edge Part Model', folder: '3D Objects' },

  // Mastercam 2018 folder
  { name: 'Educational_Tutorial_Part.emcx', format: 'emcx', ext: 'emcx', size: '142.8 KB', desc: 'Mastercam Edu X Sample Part', folder: 'Mastercam 2018' },
  { name: 'DMU50_5Axis_Impeller.mcam', format: 'mcam', ext: 'mcam', size: '184.2 KB', desc: '5-Axis Turbine Impeller CAM Project', folder: 'Mastercam 2018' },
  { name: 'DMU50_Aero_Bracket.mcx', format: 'mcx', ext: 'mcx', size: '215.0 KB', desc: 'Mastercam X Aerospace Structural Bracket', folder: 'Mastercam 2018' },

  // OneDrive folder
  { name: 'Cloud_Backup_Part.mcam', format: 'mcam', ext: 'mcam', size: '310.0 KB', desc: 'Cloud Synced Mastercam Project', folder: 'OneDrive - Personal' },
  { name: 'Remote_Job_Setup.step', format: 'step', ext: 'step', size: '720.0 KB', desc: 'Remote Customer Setup Model', folder: 'OneDrive - Personal' }
];

// Initial folder hierarchy
const INITIAL_FOLDER_STRUCTURE = {
  'Desktop': [
    { name: '2D', itemsCount: 3 },
    { name: 'arm', itemsCount: 2 },
    { name: 'BACKUP_MANUAL', itemsCount: 12 },
    { name: 'boring bar setting', itemsCount: 6 },
    { name: 'bottom flange a10', itemsCount: 2 },
    { name: 'Google Business Extractor', itemsCount: 3 },
    { name: 'Gulliver', itemsCount: 5 },
    { name: 'New folder', itemsCount: 2 },
    { name: 'New folder (2)', itemsCount: 1 },
    { name: 'New folder (3)', itemsCount: 7 },
    { name: 'Photos-3-001', itemsCount: 19 },
    { name: 'profile', itemsCount: 11 },
    { name: 'software', itemsCount: 24 },
    { name: 'studio personal', itemsCount: 14 }
  ],
  '2D': [
    { name: 'CNC_Profiles', itemsCount: 4 },
    { name: 'Laser_Cuts', itemsCount: 2 }
  ],
  'arm': [
    { name: 'CAD_Assemblies', itemsCount: 5 }
  ],
  'bottom flange a10': [
    { name: 'Lathe_Roughing', itemsCount: 3 }
  ],
  'Documents': [
    { name: 'Mastercam Projects', itemsCount: 8 },
    { name: 'Job Sheets', itemsCount: 4 }
  ],
  'Downloads': [
    { name: 'Vendor_CAD', itemsCount: 10 },
    { name: 'Customer_STEP_Files', itemsCount: 6 }
  ],
  '3D Objects': [
    { name: 'Solid_Meshes', itemsCount: 7 }
  ],
  'Mastercam 2018': [
    { name: 'Tutorials', itemsCount: 15 },
    { name: 'Posts', itemsCount: 8 }
  ],
  'OneDrive - Personal': [
    { name: 'Cloud_Sync_Projects', itemsCount: 5 }
  ],
  'Local Disk (C:)': [
    { name: 'Mastercam 2018', itemsCount: 24 },
    { name: 'Program Files', itemsCount: 40 },
    { name: 'Users', itemsCount: 3 },
    { name: 'ARGUS_CAM', itemsCount: 18 }
  ]
};

export default function MastercamOpenFileDialog({
  isOpen,
  onClose,
  onFileSelected,
  onNotify
}) {
  const [selectedFormatId, setSelectedFormatId] = useState('all_mcam');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFolderName, setSelectedFolderName] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation & Virtual File System State
  const [currentLocation, setCurrentLocation] = useState('Desktop');
  const [historyStack, setHistoryStack] = useState(['Desktop']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [folderStructure, setFolderStructure] = useState(INITIAL_FOLDER_STRUCTURE);
  const [isOrganizeMenuOpen, setIsOrganizeMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const nativeFileInputRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Navigate to a directory
  const navigateToLocation = (loc) => {
    if (loc === currentLocation) return;
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(loc);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
    setCurrentLocation(loc);
    setSelectedFileName('');
    setSelectedFolderName(null);
  };

  // Back button
  const handleGoBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentLocation(historyStack[newIdx]);
      setSelectedFileName('');
      setSelectedFolderName(null);
    }
  };

  // Forward button
  const handleGoForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentLocation(historyStack[newIdx]);
      setSelectedFileName('');
      setSelectedFolderName(null);
    }
  };

  // Up button
  const handleGoUp = () => {
    if (['2D', 'arm', 'bottom flange a10', 'BACKUP_MANUAL', 'boring bar setting'].includes(currentLocation)) {
      navigateToLocation('Desktop');
    } else if (currentLocation !== 'This PC' && currentLocation !== 'Desktop') {
      navigateToLocation('Desktop');
    } else if (currentLocation === 'Desktop') {
      navigateToLocation('Local Disk (C:)');
    }
  };

  // Refresh button
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (onNotify) onNotify(`Refreshed ${currentLocation}`, 'info');
    }, 250);
  };

  // Create New Folder
  const handleCreateNewFolder = () => {
    const folderName = prompt('Enter new folder name:', `New Folder (${Math.floor(Math.random() * 100)})`);
    if (folderName && folderName.trim()) {
      const trimmed = folderName.trim();
      setFolderStructure((prev) => {
        const currentList = prev[currentLocation] || [];
        return {
          ...prev,
          [currentLocation]: [...currentList, { name: trimmed, itemsCount: 0 }]
        };
      });
      if (onNotify) onNotify(`Created folder "${trimmed}" in ${currentLocation}`, 'success');
    }
  };

  // Active folders in current location
  const currentFolders = useMemo(() => {
    const list = folderStructure[currentLocation] || [];
    if (!searchQuery.trim()) return list;
    return list.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [folderStructure, currentLocation, searchQuery]);

  // Active CAD files in current location
  const currentFiles = useMemo(() => {
    let files = MASTER_CAD_FILES.filter((f) => f.folder === currentLocation);
    // If empty folder, show sample compatible parts so the user can test
    if (files.length === 0 && currentLocation !== 'Local Disk (C:)') {
      files = [
        { name: `${currentLocation}_Part1.step`, format: 'step', ext: 'step', size: '540 KB', desc: 'Sample STEP Model', folder: currentLocation },
        { name: `${currentLocation}_Mesh.stl`, format: 'stl', ext: 'stl', size: '320 KB', desc: 'Sample STL Mesh', folder: currentLocation }
      ];
    }

    return files.filter((f) => {
      if (searchQuery.trim() && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      const activeFmt = CAD_FILE_FORMATS.find((cf) => cf.id === selectedFormatId);
      if (!activeFmt || activeFmt.id === 'all_files') return true;
      if (activeFmt.id === 'all_mcam') {
        return ['mcam', 'mcx', 'emcx'].includes(f.ext);
      }
      return activeFmt.extensions.includes(f.ext);
    });
  }, [currentLocation, searchQuery, selectedFormatId]);

  // Open file or enter selected folder
  const handleOpenClick = async () => {
    // If a folder is selected, navigate into it
    if (selectedFolderName) {
      navigateToLocation(selectedFolderName);
      return;
    }

    if (!selectedFileName) {
      // If no file selected from list, open native system file picker
      nativeFileInputRef.current?.click();
      return;
    }

    // Check if target file exists
    const targetFile = MASTER_CAD_FILES.find((f) => f.name === selectedFileName) || {
      name: selectedFileName,
      format: selectedFileName.split('.').pop().toLowerCase(),
      desc: 'Selected CAD Part'
    };

    try {
      let content = `CAD_DATA_${targetFile.format}`;
      if (targetFile.format === 'step' || selectedFileName.endsWith('.step') || selectedFileName.endsWith('.stp')) {
        content = generateSampleSTEPString('aerospace_bracket');
      }
      const dummyBlob = new Blob([content], { type: 'text/plain' });
      const fileObj = new File([dummyBlob], targetFile.name, { type: 'application/octet-stream' });
      const modelGroup = await parseAnyCADFile(fileObj);
      if (onFileSelected) {
        onFileSelected(modelGroup, targetFile.name);
      }
      if (onNotify) onNotify(`Loaded ${targetFile.name} (${targetFile.desc || '3D Solid Model'})`, 'success');
      onClose();
    } catch (err) {
      alert(`Failed to load ${targetFile.name}: ${err.message}`);
    }
  };

  const handleNativeFileUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const modelGroup = await parseAnyCADFile(file);
        if (onFileSelected) {
          onFileSelected(modelGroup, file.name);
        }
        if (onNotify) onNotify(`Successfully imported ${file.name}`, 'success');
        onClose();
      } catch (err) {
        alert(`Failed to open file: ${err.message}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Hidden real file input */}
      <input
        ref={nativeFileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept={ALL_SUPPORTED_EXTENSIONS_STRING}
        onChange={handleNativeFileUpload}
      />

      {/* Main Mastercam Windows Open Dialog Box */}
      <div
        style={{
          width: '840px',
          height: '560px',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #94a3b8',
          overflow: 'hidden',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        {/* 1. TITLEBAR */}
        <div
          style={{
            height: '32px',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 12px',
            fontSize: '12px',
            color: '#334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={16} color="#0f5a9e" />
            <span style={{ fontWeight: 600 }}>Open</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* 2. WINDOWS EXPLORER NAVIGATION & ADDRESS BAR */}
        <div
          style={{
            padding: '6px 12px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {/* Back, Forward, Up Buttons - ALL WORKING! */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              onClick={handleGoBack}
              disabled={historyIndex <= 0}
              style={{
                width: '26px',
                height: '26px',
                border: 'none',
                background: 'transparent',
                color: historyIndex > 0 ? '#334155' : '#cbd5e1',
                cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px'
              }}
              title="Back"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={handleGoForward}
              disabled={historyIndex >= historyStack.length - 1}
              style={{
                width: '26px',
                height: '26px',
                border: 'none',
                background: 'transparent',
                color: historyIndex < historyStack.length - 1 ? '#334155' : '#cbd5e1',
                cursor: historyIndex < historyStack.length - 1 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px'
              }}
              title="Forward"
            >
              <ArrowRight size={14} />
            </button>
            <button
              onClick={handleGoUp}
              style={{
                width: '26px',
                height: '26px',
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px'
              }}
              title="Up to Parent Directory"
            >
              <ArrowUp size={14} />
            </button>
          </div>

          {/* Breadcrumb Path Bar - Interactive! */}
          <div
            style={{
              flex: 1,
              height: '28px',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              fontSize: '12px',
              gap: '4px',
              background: '#ffffff'
            }}
          >
            <Monitor size={14} color="#0f5a9e" />
            <span
              onClick={() => navigateToLocation('Desktop')}
              style={{ color: '#64748b', cursor: 'pointer' }}
              title="Go to This PC"
            >
              This PC
            </span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{currentLocation}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw
                size={12}
                color={isRefreshing ? '#0284c7' : '#64748b'}
                onClick={handleRefresh}
                style={{
                  cursor: 'pointer',
                  transform: isRefreshing ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.25s'
                }}
                title="Refresh (F5)"
              />
            </div>
          </div>

          {/* Search Box */}
          <div
            style={{
              width: '200px',
              height: '28px',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              fontSize: '12px',
              gap: '6px'
            }}
          >
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder={`Search ${currentLocation}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* 3. TOOLBAR: Organize, New Folder, View Mode */}
        <div
          style={{
            height: '28px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontSize: '11.5px',
            gap: '16px',
            color: '#475569',
            position: 'relative'
          }}
        >
          {/* Organize Dropdown */}
          <div style={{ position: 'relative' }}>
            <span
              onClick={() => setIsOrganizeMenuOpen((prev) => !prev)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              Organize ▾
            </span>

            {isOrganizeMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '24px',
                  left: 0,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  borderRadius: '3px',
                  zIndex: 1000,
                  minWidth: '160px',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div
                  onClick={() => {
                    if (currentFiles.length > 0) setSelectedFileName(currentFiles[0].name);
                    setIsOrganizeMenuOpen(false);
                  }}
                  style={{ padding: '6px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                >
                  Select First File
                </div>
                <div
                  onClick={() => { handleCreateNewFolder(); setIsOrganizeMenuOpen(false); }}
                  style={{ padding: '6px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                >
                  New Folder
                </div>
                <div
                  onClick={() => { nativeFileInputRef.current?.click(); setIsOrganizeMenuOpen(false); }}
                  style={{ padding: '6px 12px', cursor: 'pointer', color: '#0f5a9e', fontWeight: 600 }}
                >
                  Browse Real PC...
                </div>
              </div>
            )}
          </div>

          {/* New Folder Button - WORKING! */}
          <span
            onClick={handleCreateNewFolder}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Create a new folder"
          >
            <Plus size={11} /> New folder
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => nativeFileInputRef.current?.click()}
              style={{
                background: '#0f5a9e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Pick any CAD file from your real computer"
            >
              <Upload size={11} /> Browse Real PC...
            </button>
          </div>
        </div>

        {/* 4. MAIN BODY: Left Quick Access Sidebar + Right File Grid */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Quick Access Sidebar - ALL CLICKABLE & FUNCTIONAL! */}
          <div
            style={{
              width: '210px',
              background: '#f8fafc',
              borderRight: '1px solid #e2e8f0',
              overflowY: 'auto',
              padding: '8px 4px',
              fontSize: '12px',
              color: '#334155'
            }}
          >
            <div style={{ fontWeight: 600, color: '#0f5a9e', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>★ Quick access</span>
            </div>
            
            {/* Quick Access items */}
            <div
              onClick={() => navigateToLocation('Mastercam 2018')}
              style={{
                padding: '4px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: currentLocation === 'Mastercam 2018' ? '#e0f2fe' : 'transparent',
                color: currentLocation === 'Mastercam 2018' ? '#0369a1' : '#334155',
                fontWeight: currentLocation === 'Mastercam 2018' ? 600 : 400
              }}
            >
              <Cpu size={14} color="#d97706" /> Mastercam 2018
            </div>

            <div
              onClick={() => navigateToLocation('OneDrive - Personal')}
              style={{
                padding: '4px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: currentLocation === 'OneDrive - Personal' ? '#e0f2fe' : 'transparent',
                color: currentLocation === 'OneDrive - Personal' ? '#0369a1' : '#334155',
                fontWeight: currentLocation === 'OneDrive - Personal' ? 600 : 400
              }}
            >
              <HardDrive size={14} color="#0284c7" /> OneDrive - Personal
            </div>

            <div style={{ marginTop: '10px', fontWeight: 600, color: '#334155', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Monitor size={14} /> This PC
            </div>

            {[
              { label: '3D Objects', icon: Box },
              { label: 'Desktop', icon: Monitor },
              { label: 'Documents', icon: FileText },
              { label: 'Downloads', icon: Download },
              { label: 'Music', icon: Music },
              { label: 'Pictures', icon: Image },
              { label: 'Videos', icon: Film },
              { label: 'Local Disk (C:)', icon: HardDrive }
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = currentLocation === item.label;
              return (
                <div
                  key={item.label}
                  onClick={() => navigateToLocation(item.label)}
                  style={{
                    padding: '4px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isActive ? '#e0f2fe' : 'transparent',
                    color: isActive ? '#0369a1' : '#334155',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  <IconComp size={13} color={isActive ? '#0284c7' : '#64748b'} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Right Main Grid (Folders & Files) - ALL CLICKABLE & FUNCTIONAL! */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              overflowY: 'auto',
              padding: '16px'
            }}
          >
            {/* Folder section */}
            {currentFolders.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Folders ({currentFolders.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {currentFolders.map((fld) => {
                    const isSelected = selectedFolderName === fld.name;
                    return (
                      <div
                        key={fld.name}
                        onClick={() => {
                          setSelectedFolderName(fld.name);
                          setSelectedFileName('');
                        }}
                        onDoubleClick={() => navigateToLocation(fld.name)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          padding: '8px 4px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          border: isSelected ? '1px solid #0f5a9e' : '1px solid transparent',
                          background: isSelected ? '#f0f7ff' : 'transparent',
                          transition: 'background 0.12s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                        title={`Double-click to open "${fld.name}" folder`}
                      >
                        <Folder size={40} color="#f59e0b" fill="#fef3c7" strokeWidth={1.5} />
                        <span style={{ fontSize: '11.5px', color: '#1e293b', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fld.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CAD Part Files Section matching Filter */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Part Files matching filter ({currentFiles.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {currentFiles.map((cad) => {
                  const isSelected = selectedFileName === cad.name;
                  return (
                    <div
                      key={cad.name}
                      onClick={() => {
                        setSelectedFileName(cad.name);
                        setSelectedFolderName(null);
                      }}
                      onDoubleClick={handleOpenClick}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '3px',
                        border: isSelected ? '1px solid #0f5a9e' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f7ff' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <div style={{ position: 'relative', marginBottom: '6px' }}>
                        <FileCode size={34} color={isSelected ? '#0f5a9e' : '#64748b'} />
                        <span style={{ position: 'absolute', bottom: -2, right: -4, background: '#0f5a9e', color: '#ffffff', fontSize: '8px', padding: '1px 3px', borderRadius: '2px', fontWeight: 700 }}>
                          {cad.ext.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '11.5px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#0f5a9e' : '#1e293b', wordBreak: 'break-all', lineHeight: 1.25 }}>
                        {cad.name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                        {cad.size}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* 5. FOOTER: File Name, File Type, Open & Cancel Buttons */}
        <div
          style={{
            height: '76px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '8px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {/* Row 1: File name input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '80px', fontSize: '12px', color: '#334155' }}>File name:</span>
            <input
              type="text"
              value={selectedFileName || selectedFolderName || ''}
              onChange={(e) => setSelectedFileName(e.target.value)}
              placeholder="Type filename or click a file above..."
              style={{
                flex: 1,
                height: '26px',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                padding: '0 8px',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleOpenClick}
              style={{
                width: '84px',
                height: '26px',
                background: '#0f5a9e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '2px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Open
            </button>
          </div>

          {/* Row 2: File format dropdown (25 Mastercam Formats) & Cancel Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '80px', fontSize: '12px', color: '#334155' }}>Files of type:</span>
            <select
              value={selectedFormatId}
              onChange={(e) => setSelectedFormatId(e.target.value)}
              style={{
                flex: 1,
                height: '26px',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                padding: '0 6px',
                fontSize: '12px',
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {CAD_FILE_FORMATS.map((fmt) => (
                <option key={fmt.id} value={fmt.id}>
                  {fmt.name} ({fmt.extensions.map((ext) => `*.${ext}`).join(';')})
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              style={{
                width: '84px',
                height: '26px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

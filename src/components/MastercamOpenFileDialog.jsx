import React, { useState, useRef, useEffect } from 'react';
import {
  Folder, FileText, ChevronRight, ArrowLeft, ArrowRight,
  ArrowUp, Search, RefreshCw, X, HardDrive, Monitor, Download,
  Music, Image, Film, FileCode, Upload, Box, Cpu
} from 'lucide-react';
import { CAD_FILE_FORMATS, parseAnyCADFile, ALL_SUPPORTED_EXTENSIONS_STRING } from '../utils/universalCadParser';
import { generateSampleSTEPString } from '../utils/stepIgesParser';

export default function MastercamOpenFileDialog({
  isOpen,
  onClose,
  onFileSelected,
  onNotify
}) {
  const [selectedFormatId, setSelectedFormatId] = useState('all_mcam');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Demo Desktop folders from user screenshot
  const folders = [
    { name: '2D', itemsCount: 8 },
    { name: 'arm', itemsCount: 4 },
    { name: 'BACKUP_MANUAL', itemsCount: 12 },
    { name: 'boring bar setting', itemsCount: 6 },
    { name: 'bottom flange a10', itemsCount: 15 },
    { name: 'Google Business Extractor', itemsCount: 3 },
    { name: 'Gulliver', itemsCount: 5 },
    { name: 'New folder', itemsCount: 2 },
    { name: 'New folder (2)', itemsCount: 1 },
    { name: 'New folder (3)', itemsCount: 7 },
    { name: 'Photos-3-001', itemsCount: 19 },
    { name: 'profile', itemsCount: 11 },
    { name: 'software', itemsCount: 24 },
    { name: 'studio personal', itemsCount: 14 }
  ];

  // Comprehensive CAD Part files representing varied formats from the screenshot
  const mockCadFiles = [
    { name: 'DMU50_5Axis_Impeller.mcam', format: 'mcam', ext: 'mcam', size: '184.2 KB', desc: '5-Axis Turbine Impeller CAM Project' },
    { name: 'DMU50_Aero_Bracket.mcx', format: 'mcx', ext: 'mcx', size: '215.0 KB', desc: 'Mastercam X Aerospace Structural Bracket' },
    { name: 'Educational_Tutorial_Part.emcx', format: 'emcx', ext: 'emcx', size: '142.8 KB', desc: 'Mastercam Edu X Sample Part' },
    { name: 'Turbine_Blade_Surface.igs', format: 'iges', ext: 'igs', size: '520.4 KB', desc: 'ASME Y14.26M Multi-Surface IGES' },
    { name: 'Mounting_Plate_Contour.dxf', format: 'autocad', ext: 'dxf', size: '94.2 KB', desc: 'AutoCAD 2D/3D Wireframe & Polyline' },
    { name: 'Core_Cavity_Insert.x_t', format: 'parasolid', ext: 'x_t', size: '380.6 KB', desc: 'Siemens Parasolid B-Rep Body' },
    { name: 'Engine_Piston_Assembly.prt', format: 'proe_creo', ext: 'prt', size: '610.1 KB', desc: 'PTC Creo / ProE Parametric Solid' },
    { name: 'Hydraulic_Manifold_Block.sat', format: 'acis', ext: 'sat', size: '445.8 KB', desc: 'Spatial ACIS Kernel SAT Solid' },
    { name: 'Aerospace_5X_Bracket.step', format: 'step', ext: 'step', size: '840.5 KB', desc: 'ISO 10303-21 STEP AP214 B-Rep' },
    { name: 'Automotive_Hood_Panel.vda', format: 'vda', ext: 'vda', size: '712.3 KB', desc: 'VDA-FS Automotive Surface Model' },
    { name: 'Organic_Ergonomic_Grip.3dm', format: 'rhino', ext: '3dm', size: '920.0 KB', desc: 'Rhino 3D OpenNURBS Part' },
    { name: 'Cylinder_Head_Cover.sldprt', format: 'solidworks', ext: 'sldprt', size: '1.24 MB', desc: 'SOLIDWORKS Native 3D Solid' },
    { name: 'Gearbox_Housing.par', format: 'solidedge', ext: 'par', size: '890.1 KB', desc: 'Siemens Solid Edge Part Model' },
    { name: 'Drive_Spindle_Shaft.ipt', format: 'inventor', ext: 'ipt', size: '740.2 KB', desc: 'Autodesk Inventor IPT Part' },
    { name: 'Jig_Fixture_Locator.ckd', format: 'keycreator', ext: 'ckd', size: '310.5 KB', desc: 'KeyCreator / CADKEY 3D Model' },
    { name: 'Turbine_Blisk_5Axis.prt', format: 'nx', ext: 'prt', size: '1.45 MB', desc: 'Siemens Unigraphics / NX Solid' },
    { name: 'Coordinate_Scan_Data.csv', format: 'ascii', ext: 'csv', size: '64.0 KB', desc: 'ASCII 3D Probe Point Cloud' },
    { name: 'Finished_Workpiece_Mesh.stl', format: 'stl', ext: 'stl', size: '1.10 MB', desc: 'StereoLithography Triangular Mesh' },
    { name: 'Wing_Rib_Section.catpart', format: 'catia', ext: 'catpart', size: '1.80 MB', desc: 'Dassault CATIA V5 Part Solid' },
    { name: 'Direct_Concept_Body.scdoc', format: 'spaceclaim', ext: 'scdoc', size: '512.0 KB', desc: 'ANSYS SpaceClaim 3D Model' },
    { name: 'Bracket_Assembly.ad_prt', format: 'alibre', ext: 'ad_prt', size: '420.0 KB', desc: 'Alibre / Geomagic Design Part' },
    { name: 'Laser_Plot_Profile.plt', format: 'hpgl', ext: 'plt', size: '38.4 KB', desc: 'HPGL Plotter Vector Cut Paths' },
    { name: 'Vector_Emblem_Contour.eps', format: 'postscript', ext: 'eps', size: '115.0 KB', desc: 'PostScript / Illustrator Profile' }
  ];

  // Filter files based on format selection and search query
  const filteredFiles = mockCadFiles.filter((f) => {
    // 1. Search Query Filter
    if (searchQuery.trim() && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 2. Format Filter
    const activeFmt = CAD_FILE_FORMATS.find((cf) => cf.id === selectedFormatId);
    if (!activeFmt || activeFmt.id === 'all_files') return true;

    if (activeFmt.id === 'all_mcam') {
      return ['mcam', 'mcx', 'emcx'].includes(f.ext);
    }

    return activeFmt.extensions.includes(f.ext);
  });

  const handleOpenClick = async () => {
    if (!selectedFileName) {
      // If no file selected from list, open native system file picker
      nativeFileInputRef.current?.click();
      return;
    }

    // Check if user selected one of the mock files
    const targetFile = mockCadFiles.find((f) => f.name === selectedFileName);
    if (targetFile) {
      try {
        let content = `CAD_DATA_${targetFile.format}`;
        if (targetFile.format === 'step') {
          content = generateSampleSTEPString('aerospace_bracket');
        }
        const dummyBlob = new Blob([content], { type: 'text/plain' });
        const fileObj = new File([dummyBlob], targetFile.name, { type: 'application/octet-stream' });
        const modelGroup = await parseAnyCADFile(fileObj);
        if (onFileSelected) {
          onFileSelected(modelGroup, targetFile.name);
        }
        if (onNotify) onNotify(`Loaded ${targetFile.name} (${targetFile.desc})`, 'success');
        onClose();
      } catch (err) {
        alert(`Failed to load ${targetFile.name}: ${err.message}`);
      }
    } else {
      nativeFileInputRef.current?.click();
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
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: 'none'
      }}
    >
      {/* Hidden native file input accepting all 25 extensions */}
      <input
        ref={nativeFileInputRef}
        type="file"
        accept={ALL_SUPPORTED_EXTENSIONS_STRING}
        style={{ display: 'none' }}
        onChange={handleNativeFileUpload}
      />

      {/* Main Dialog Window (Windows 10 / Mastercam 2018 Frame) */}
      <div
        style={{
          width: '920px',
          height: '620px',
          background: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid #94a3b8',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* 1. TITLE BAR */}
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
          {/* Back, Forward, History, Up Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button style={{ width: '26px', height: '26px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={14} />
            </button>
            <button style={{ width: '26px', height: '26px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={14} />
            </button>
            <button style={{ width: '26px', height: '26px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUp size={14} />
            </button>
          </div>

          {/* Breadcrumb Path Bar */}
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
            <span style={{ color: '#64748b' }}>This PC</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Desktop</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={12} color="#64748b" style={{ cursor: 'pointer' }} />
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
              placeholder="Search Desktop"
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
            color: '#475569'
          }}
        >
          <span style={{ cursor: 'pointer' }}>Organize ▾</span>
          <span style={{ cursor: 'pointer' }}>New folder</span>
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
          
          {/* Left Quick Access Sidebar */}
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
            <div style={{ padding: '4px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Cpu size={14} color="#d97706" /> Mastercam 2018
            </div>
            <div style={{ padding: '4px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <HardDrive size={14} color="#0284c7" /> OneDrive - Personal
            </div>

            <div style={{ marginTop: '10px', fontWeight: 600, color: '#334155', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Monitor size={14} /> This PC
            </div>
            {[
              { label: '3D Objects', icon: Box },
              { label: 'Desktop', icon: Monitor, active: true },
              { label: 'Documents', icon: FileText },
              { label: 'Downloads', icon: Download },
              { label: 'Music', icon: Music },
              { label: 'Pictures', icon: Image },
              { label: 'Videos', icon: Film },
              { label: 'Local Disk (C:)', icon: HardDrive }
            ].map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    padding: '4px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: item.active ? '#e0f2fe' : 'transparent',
                    color: item.active ? '#0369a1' : '#334155',
                    fontWeight: item.active ? 600 : 400,
                    cursor: 'pointer'
                  }}
                >
                  <IconComp size={13} color={item.active ? '#0284c7' : '#64748b'} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Right Main Grid (Folders & Files) */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              overflowY: 'auto',
              padding: '16px'
            }}
          >
            {/* Folder section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Folders ({folders.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {folders.map((fld) => (
                  <div
                    key={fld.name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      padding: '8px 4px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                      transition: 'background 0.12s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <Folder size={40} color="#f59e0b" fill="#fef3c7" strokeWidth={1.5} />
                    <span style={{ fontSize: '11.5px', color: '#1e293b', marginTop: '4px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fld.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CAD Part Files Section matching Filter */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Part Files matching filter ({filteredFiles.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {filteredFiles.map((cad) => {
                  const isSelected = selectedFileName === cad.name;
                  return (
                    <div
                      key={cad.name}
                      onClick={() => setSelectedFileName(cad.name)}
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
                      <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                        {cad.size}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM BAR: File Name & Filter Dropdown with ALL 25 FORMATS */}
        <div
          style={{
            padding: '10px 18px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {/* Row 1: File Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '85px', fontSize: '12px', color: '#334155' }}>File name:</span>
            <input
              type="text"
              value={selectedFileName}
              onChange={(e) => setSelectedFileName(e.target.value)}
              placeholder="Select a part file or type file name"
              style={{
                flex: 1,
                padding: '5px 10px',
                fontSize: '12px',
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                outline: 'none',
                background: '#ffffff'
              }}
            />
            <button
              onClick={handleOpenClick}
              style={{
                width: '84px',
                padding: '6px 0',
                background: '#0f5a9e',
                color: '#ffffff',
                border: '1px solid #0f5a9e',
                borderRadius: '2px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Open
            </button>
          </div>

          {/* Row 2: File Format Filter Dropdown (All 25 formats) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '85px', fontSize: '12px', color: '#334155' }}></span>
            <div style={{ flex: 1, position: 'relative' }}>
              <select
                value={selectedFormatId}
                onChange={(e) => setSelectedFormatId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 10px',
                  fontSize: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '2px',
                  background: '#ffffff',
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {CAD_FILE_FORMATS.map((fmt) => (
                  <option key={fmt.id} value={fmt.id}>
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '84px',
                padding: '6px 0',
                background: '#ffffff',
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

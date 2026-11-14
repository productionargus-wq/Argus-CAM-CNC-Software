import React, { useState, useRef, useEffect } from 'react';
import {
  Folder, FolderOpen, ArrowUp, Plus, List, Grid, Search, X,
  FileText, HardDrive, FileCode, Check
} from 'lucide-react';
import { CAD_FILE_FORMATS, parseAnyCADFile } from '../utils/universalCadParser';
import { getRecentProjects } from '../utils/projectStorage';

export default function MastercamOpenDialog({
  isOpen,
  onClose,
  onFileSelected,
  onLoadProject,
  onModelImported
}) {
  const [selectedFormatId, setSelectedFormatId] = useState('all_mcam');
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [fileNameInput, setFileNameInput] = useState('');
  const [selectedFileItem, setSelectedFileItem] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentFolder, setCurrentFolder] = useState('C:\\Users\\HP\\Documents\\my mcam2018\\Parts');
  const [openAsReadOnly, setOpenAsReadOnly] = useState(false);

  const hiddenFileInputRef = useRef(null);
  const dropdownListRef = useRef(null);
  const comboboxRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        comboboxRef.current && !comboboxRef.current.contains(e.target) &&
        dropdownListRef.current && !dropdownListRef.current.contains(e.target)
      ) {
        setIsFormatDropdownOpen(false);
      }
    }
    if (isFormatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFormatDropdownOpen]);

  if (!isOpen) return null;

  const activeFormat = CAD_FILE_FORMATS.find((f) => f.id === selectedFormatId) || CAD_FILE_FORMATS[3];

  // Build accept string for the hidden input
  const acceptString = activeFormat.id === 'all_files'
    ? '*/*'
    : (activeFormat.extensions || []).map((ext) => `.${ext}`).join(',');

  // Mock folder files + recent projects
  const recentDocs = getRecentProjects() || [];
  const sampleParts = [
    { name: 'Base Structure-ALU.NC', type: 'mcam', size: '314.2 KB', date: '11/14/2026 09:40 AM' },
    { name: 'Mastercam Part 1.mcam', type: 'mcam', size: '186.4 KB', date: '11/14/2026 08:15 AM' },
    { name: 'Mastercam Multi-Body Assembly.mcam', type: 'mcam', size: '428.0 KB', date: '11/14/2026 10:20 AM' },
    { name: 'Titan_1M_Workpiece.step', type: 'step', size: '1.24 MB', date: '11/10/2026 02:30 PM' },
    { name: 'AutoCAD_Bracket_Profile.dwg', type: 'autocad', size: '540.8 KB', date: '11/08/2026 11:12 AM' },
    { name: 'ZeroClamp_Fixture_Vise.step', type: 'step', size: '2.80 MB', date: '11/06/2026 04:45 PM' },
    { name: 'Mold_Core_Impeller.stl', type: 'stl', size: '3.10 MB', date: '11/04/2026 01:20 PM' }
  ];

  // Merge with recent files
  const allAvailableFiles = [
    ...sampleParts,
    ...recentDocs.map((r) => ({
      name: r.filename || r.projectName || 'Recent_Project.mcam',
      type: r.filename?.split('.').pop()?.toLowerCase() || 'mcam',
      size: `${(r.opsCount || 4) * 42} KB`,
      date: r.savedAt ? new Date(r.savedAt).toLocaleDateString() : 'Recent',
      isRecent: true,
      rawProject: r
    }))
  ];

  // Filter files by selected extension
  const filteredFiles = allAvailableFiles.filter((file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const matchesSearch = !searchFilter || file.name.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFormat.id === 'all_files') return true;
    if (activeFormat.id === 'all_mcam') {
      return ['mcam', 'mcx', 'emcx', 'emc', 'nc'].includes(ext);
    }
    return (activeFormat.extensions || []).includes(ext);
  });

  const handleSelectFile = (file) => {
    setSelectedFileItem(file);
    setFileNameInput(file.name);
  };

  const handleConfirmOpen = () => {
    if (selectedFileItem) {
      if (selectedFileItem.rawProject && onLoadProject) {
        onLoadProject(selectedFileItem.rawProject);
      } else if (onFileSelected) {
        onFileSelected(selectedFileItem);
      }
      onClose();
      return;
    }
    // If no list item clicked but input has text, trigger local file browse
    if (hiddenFileInputRef.current) {
      hiddenFileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.mcam') || file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (onLoadProject) onLoadProject(parsed);
      } else {
        const parsedResult = await parseAnyCADFile(file);
        if (parsedResult?.group && onModelImported) {
          onModelImported(parsedResult.group, file.name);
        }
      }
    } catch (err) {
      console.warn("Direct file open error, attempting universal parser:", err);
      const parsedResult = await parseAnyCADFile(file);
      if (parsedResult?.group && onModelImported) {
        onModelImported(parsedResult.group, file.name);
      }
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        userSelect: 'none'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Hidden system file picker input */}
      <input
        ref={hiddenFileInputRef}
        type="file"
        accept={acceptString}
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Main Mastercam Windows Open Dialog Box */}
      <div
        style={{
          width: '620px',
          height: '460px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #707070',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div
          style={{
            height: '30px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px',
            borderBottom: '1px solid #dfdfdf',
            fontSize: '12px',
            color: '#1e293b'
          }}
        >
          <span style={{ fontWeight: 500 }}>Open</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#475569',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Toolbar: Look in, Navigation, Folder, Views */}
        <div
          style={{
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 10px',
            fontSize: '12px',
            color: '#334155'
          }}
        >
          <span>Look in:</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #abadb3',
              padding: '2px 8px',
              height: '24px',
              flex: 1,
              borderRadius: '1px'
            }}
          >
            <Folder size={14} color="#f59e0b" />
            <span style={{ fontSize: '11.5px', color: '#1e293b' }}>Parts</span>
          </div>

          <button
            onClick={() => setCurrentFolder('C:\\Users\\HP\\Documents\\my mcam2018')}
            style={{ width: '24px', height: '24px', background: '#f8fafc', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Up One Level"
          >
            <ArrowUp size={13} color="#475569" />
          </button>
          <button
            onClick={() => hiddenFileInputRef.current?.click()}
            style={{ width: '24px', height: '24px', background: '#f8fafc', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Browse Local Disk..."
          >
            <HardDrive size={13} color="#0f5a9e" />
          </button>
        </div>

        {/* Explorer File List View */}
        <div
          style={{
            flex: 1,
            margin: '0 10px',
            backgroundColor: '#ffffff',
            border: '1px solid #828790',
            overflowY: 'auto',
            padding: '4px'
          }}
        >
          {filteredFiles.length === 0 ? (
            <div style={{ padding: '16px', color: '#64748b', fontSize: '11.5px', fontStyle: 'italic', textAlign: 'center' }}>
              No files matching "{activeFormat.label}" found in this directory.
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => hiddenFileInputRef.current?.click()}
                  style={{ padding: '4px 10px', background: '#0f5a9e', color: '#ffffff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '11px' }}
                >
                  Browse Files from My Computer...
                </button>
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '4px 6px', fontWeight: 500 }}>Name</th>
                  <th style={{ padding: '4px 6px', fontWeight: 500, width: '130px' }}>Date modified</th>
                  <th style={{ padding: '4px 6px', fontWeight: 500, width: '80px' }}>Type</th>
                  <th style={{ padding: '4px 6px', fontWeight: 500, width: '70px', textAlign: 'right' }}>Size</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileItem?.name === file.name;
                  return (
                    <tr
                      key={file.name}
                      onClick={() => handleSelectFile(file)}
                      onDoubleClick={handleConfirmOpen}
                      style={{
                        backgroundColor: isSelected ? '#0078d7' : 'transparent',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {file.type === 'mcam' ? (
                          <span style={{ color: isSelected ? '#ffffff' : '#0f5a9e', fontWeight: 700, fontSize: '10px' }}>MC</span>
                        ) : (
                          <FileText size={13} color={isSelected ? '#ffffff' : '#64748b'} />
                        )}
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                          {file.name}
                        </span>
                      </td>
                      <td style={{ padding: '3px 6px', color: isSelected ? '#e0f2fe' : '#64748b' }}>{file.date}</td>
                      <td style={{ padding: '3px 6px', color: isSelected ? '#e0f2fe' : '#64748b' }}>{file.type.toUpperCase()} File</td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', color: isSelected ? '#e0f2fe' : '#64748b' }}>{file.size}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Inputs Area (Matching Reference Image 1 & 2) */}
        <div style={{ padding: '8px 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Row 1: File name + Open button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '80px', fontSize: '11.5px', color: '#1e293b' }}>File name:</span>
            <input
              type="text"
              value={fileNameInput}
              onChange={(e) => setFileNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmOpen(); }}
              style={{
                flex: 1,
                height: '24px',
                padding: '0 6px',
                border: '1px solid #abadb3',
                fontSize: '11.5px',
                backgroundColor: '#ffffff',
                outline: 'none'
              }}
            />
            <button
              onClick={handleConfirmOpen}
              style={{
                width: '75px',
                height: '24px',
                backgroundColor: '#e1e1e1',
                border: '1px solid #0078d7',
                borderRadius: '1px',
                fontSize: '11.5px',
                color: '#000000',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Open
            </button>
          </div>

          {/* Row 2: Files of type Combobox + Cancel button (Images 1 & 2) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <span style={{ width: '80px', fontSize: '11.5px', color: '#1e293b' }}>Files of type:</span>

            {/* Combobox Anchor Button (Image 2 closed state) */}
            <div
              ref={comboboxRef}
              onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
              style={{
                flex: 1,
                height: '24px',
                backgroundColor: '#ffffff',
                border: '1px solid #abadb3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 6px',
                fontSize: '11.5px',
                color: '#0f172a',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              title={activeFormat.label}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeFormat.label}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px' }}>▼</span>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '75px',
                height: '24px',
                backgroundColor: '#e1e1e1',
                border: '1px solid #adadad',
                borderRadius: '1px',
                fontSize: '11.5px',
                color: '#000000',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            {/* Vertical Categorized Popup Menu (Exact replication of Image 1) */}
            {isFormatDropdownOpen && (
              <div
                ref={dropdownListRef}
                style={{
                  position: 'absolute',
                  left: '90px',
                  right: '85px',
                  bottom: '26px', // Pops upwards as shown in Image 1
                  maxHeight: '340px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #707070',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                  overflowY: 'auto',
                  zIndex: 9999,
                  fontSize: '11.5px',
                  color: '#0f172a'
                }}
              >
                {CAD_FILE_FORMATS.map((fmt) => {
                  const isSelected = fmt.id === selectedFormatId;
                  return (
                    <div
                      key={fmt.id}
                      onClick={() => {
                        setSelectedFormatId(fmt.id);
                        setIsFormatDropdownOpen(false);
                      }}
                      style={{
                        padding: '3px 10px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        backgroundColor: isSelected ? '#0078d7' : 'transparent',
                        color: isSelected ? '#ffffff' : '#0f172a'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#e5f3ff';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {fmt.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 3: Options / Open as read-only */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '90px', fontSize: '11px', color: '#475569' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={openAsReadOnly}
                onChange={(e) => setOpenAsReadOnly(e.target.checked)}
              />
              <span>Open as read-only</span>
            </label>
            <button
              onClick={() => hiddenFileInputRef.current?.click()}
              style={{ background: 'transparent', border: 'none', color: '#0f5a9e', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Browse computer directly...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

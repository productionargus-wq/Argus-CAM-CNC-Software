import React, { useEffect, useRef, useState } from 'react';
import { X, FileCode, Download, Copy, Check, Search, Clock, Cpu, ArrowDown } from 'lucide-react';
import { CONTROLLER_DIALECTS, generateNCProgram, downloadNCFile } from '../utils/postProcessor';

export default function GCodeViewerModal({
  isOpen,
  onClose,
  operations,
  tools,
  stockConfig,
  partMetrics,
  defaultController = CONTROLLER_DIALECTS.HEIDENHAIN
}) {
  const dialogRef = useRef(null);

  const [selectedController, setSelectedController] = useState(defaultController);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [ncData, setNcData] = useState(null);

  // Generate G-code when opened or parameters change
  useEffect(() => {
    if (isOpen) {
      const generated = generateNCProgram({
        operations,
        tools,
        stockConfig,
        partMetrics,
        controller: selectedController,
        programName: 'DMU50_ZeroClamp_Job'
      });
      setNcData(generated);
    }
  }, [isOpen, selectedController, operations, tools, stockConfig, partMetrics]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }

    const handleBackdrop = (e) => {
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inBox =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inBox) onClose();
    };

    dialog.addEventListener('click', handleBackdrop);
    return () => dialog.removeEventListener('click', handleBackdrop);
  }, [isOpen, onClose]);

  const handleCopy = () => {
    if (!ncData) return;
    navigator.clipboard.writeText(ncData.gcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!ncData) return;
    const filename = `DMU50_ZeroClamp_Job${ncData.fileExtension}`;
    downloadNCFile(ncData.gcodeText, filename);
  };

  const lines = ncData?.gcodeText.split('\n') || [];
  const filteredLines = searchTerm
    ? lines.filter((l) => l.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines;

  return (
    <dialog
      ref={dialogRef}
      id="gcode-viewer-dialog"
      aria-labelledby="gcode-dialog-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: '840px', maxHeight: '88vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={16} color="#10b981" />
            <span id="gcode-dialog-title">G-Code Inspector & NC Exporter &bull; DMU50_ZeroClamp_Job</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
          {/* Top Dialect Selector & Program Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3, 130px)', gap: '10px', alignItems: 'center' }}>
            <div className="form-group">
              <label>CNC Post Dialect:</label>
              <select
                value={selectedController}
                onChange={(e) => setSelectedController(e.target.value)}
                className="text-input"
              >
                {Object.values(CONTROLLER_DIALECTS).map((dialect) => (
                  <option key={dialect} value={dialect}>
                    {dialect}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ background: '#11151c', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>TOTAL BLOCKS</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                {ncData?.lineCount || 0} Lines
              </span>
            </div>

            <div style={{ background: '#11151c', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>EST. CYCLE TIME</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                {ncData?.estimatedTimeMin || 4} min
              </span>
            </div>

            <div style={{ background: '#11151c', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>FEED TRAVEL</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                {ncData?.cuttingDistanceM || '0.00'} m
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #2d3748' }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search in G-Code (e.g. TOOL CALL, G01, S12000, Z-15)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#f1f5f9', width: '100%', fontSize: '11px', outline: 'none', fontFamily: 'monospace' }}
            />
          </div>

          {/* G-Code Output Code Viewer */}
          <div
            style={{
              height: '360px',
              background: '#090c10',
              border: '1px solid #1e2633',
              borderRadius: '6px',
              padding: '10px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              lineHeight: 1.6,
              overflowY: 'auto',
              color: '#94a3b8'
            }}
          >
            {filteredLines.map((line, idx) => {
              const isComment = line.trim().startsWith(';') || line.trim().startsWith('(');
              const isRapid = line.includes('FMAX') || line.includes('G00') || line.includes('G0 ');
              const isCut = line.includes('G01') || line.includes('G1 ') || line.includes(' F');
              const isTool = line.includes('TOOL CALL') || line.includes(' M6');

              let color = '#cbd5e1';
              if (isComment) color = '#64748b';
              else if (isTool) color = '#a855f7';
              else if (isRapid) color = '#06b6d4';
              else if (isCut) color = '#10b981';

              return (
                <div key={idx} style={{ display: 'flex', gap: '14px', whiteSpace: 'pre' }}>
                  <span style={{ width: '42px', color: '#475569', textAlign: 'right', userSelect: 'none' }}>
                    {idx + 1}
                  </span>
                  <span style={{ color, fontWeight: isTool ? 700 : 400 }}>
                    {line}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Output file: <strong style={{ color: '#38bdf8' }}>DMU50_ZeroClamp_Job{ncData?.fileExtension}</strong>
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={handleCopy}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy G-Code'}</span>
              </button>

              <button
                className="btn-primary"
                onClick={handleDownload}
                style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
              >
                <Download size={14} />
                <span>Download NC File ({ncData?.fileExtension})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

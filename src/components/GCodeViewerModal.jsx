import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { X, FileCode, Download, Copy, Check, Search } from 'lucide-react';
import { CONTROLLER_DIALECTS, generateNCProgram, downloadNCFile } from '../utils/postProcessor';
import { deriveControllerDialect } from '../config/machineDefinitionsCatalog';
import VirtualizedGCodeList from './VirtualizedGCodeList';

export default function GCodeViewerModal({
  isOpen,
  onClose,
  operations,
  tools,
  stockConfig,
  partMetrics,
  currentModel = null,
  customGeometry = [],
  activeMachine = null,
  defaultController = CONTROLLER_DIALECTS.FANUC,
  currentProjectName = 'Part1.mcam'
}) {
  const dialogRef = useRef(null);
  const lastGenInputsRef = useRef(null);

  const cleanProgName = currentProjectName
    ? currentProjectName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
    : 'Argus_CAM_Job';

  const resolvedDefaultController = activeMachine ? deriveControllerDialect(activeMachine) : defaultController;
  const [selectedController, setSelectedController] = useState(resolvedDefaultController);
  const [prevDefaultController, setPrevDefaultController] = useState(resolvedDefaultController);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [copied, setCopied] = useState(false);
  const [ncData, setNcData] = useState(null);
  const ncDataRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  if (resolvedDefaultController !== prevDefaultController) {
    setPrevDefaultController(resolvedDefaultController);
    setSelectedController(resolvedDefaultController);
  }

  // Schedule G-code generation after modal paints so the UI never freezes on large 3D pockets
  useEffect(() => {
    if (!isOpen) return undefined;

    const currentInputs = {
      selectedController,
      operations,
      tools,
      stockConfig,
      partMetrics,
      currentModel,
      customGeometry,
      cleanProgName,
      machineName: activeMachine?.name || ''
    };

    const prev = lastGenInputsRef.current;
    const isSameInputs = prev &&
      Object.keys(currentInputs).every((k) => Object.is(prev[k], currentInputs[k]));
    if (isSameInputs && ncDataRef.current) {
      setIsGenerating(false);
      return undefined;
    }

    let cancelled = false;
    let rafId = null;
    let timerId = null;
    setIsGenerating(true);
    setGenError('');

    rafId = requestAnimationFrame(() => {
      timerId = setTimeout(() => {
        if (cancelled) return;
        try {
          const generated = generateNCProgram({
            operations,
            tools,
            stockConfig,
            partMetrics,
            controller: selectedController,
            machineName: activeMachine?.name || '',
            programName: cleanProgName,
            model: currentModel,
            customGeometry
          });
          if (!cancelled) {
            lastGenInputsRef.current = currentInputs;
            ncDataRef.current = generated;
            setNcData(generated);
            setIsGenerating(false);
          }
        } catch (err) {
          if (!cancelled) {
            setGenError(err?.message || 'Failed to generate NC program.');
            setIsGenerating(false);
          }
        }
      }, 0);
    });

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [isOpen, selectedController, operations, tools, stockConfig, partMetrics, currentModel, customGeometry, cleanProgName, activeMachine]);

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
    if (!ncData?.gcodeText || isGenerating) return;
    navigator.clipboard.writeText(ncData.gcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!ncData?.gcodeText || isGenerating) return;
    const filename = `${cleanProgName}${ncData.fileExtension}`;
    downloadNCFile(ncData.gcodeText, filename);
  };

  const gcodeText = ncData?.gcodeText || '';
  const indexedLines = useMemo(() => {
    if (!gcodeText) return [];
    const rawLines = gcodeText.split('\n');
    return rawLines.map((text, idx) => ({ lineNo: idx + 1, text }));
  }, [gcodeText]);

  const filteredLines = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    if (!q) return indexedLines;
    return indexedLines.filter((entry) => entry.text.toLowerCase().includes(q));
  }, [indexedLines, deferredSearchTerm]);

  const outputFileExt = ncData?.fileExtension || '.nc';

  return (
    <dialog
      ref={dialogRef}
      id="gcode-viewer-dialog"
      aria-labelledby="gcode-dialog-title"
      closedby="any"
      onClose={onClose}
    >
      <div className="modal-window" style={{ width: 'min(840px, 90vw)', maxHeight: '88vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <FileCode size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span
              id="gcode-dialog-title"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              G-Code Inspector &amp; NC Exporter &bull; {cleanProgName}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Dialog">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px' }}>
          {/* Top Dialect Selector & Program Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) repeat(3, 130px)', gap: '10px', alignItems: 'center' }}>
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
                {isGenerating ? '...' : `${(ncData?.lineCount || 0).toLocaleString()} Lines`}
              </span>
            </div>

            <div style={{ background: '#11151c', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>EST. CYCLE TIME</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>
                {isGenerating ? '...' : ncData ? `${ncData.estimatedTimeMin} min` : '--'}
              </span>
            </div>

            <div style={{ background: '#11151c', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '9.5px', color: '#94a3b8', display: 'block' }}>FEED TRAVEL</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>
                {isGenerating ? '...' : ncData ? `${ncData.cuttingDistanceM} m` : '--'}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0d1117', padding: '4px 8px', borderRadius: '4px', border: '1px solid #2d3748' }}>
            <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search in G-Code (e.g. TOOL CALL, G01, S5500, Z-1.000)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#f1f5f9', width: '100%', fontSize: '11px', outline: 'none', fontFamily: 'monospace' }}
            />
            {searchTerm && (
              <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                {filteredLines.length.toLocaleString()} / {indexedLines.length.toLocaleString()}
              </span>
            )}
          </div>

          {/* Windowed / Virtualized G-Code Viewer */}
          {isGenerating ? (
            <div
              style={{
                height: '360px',
                background: '#090c10',
                border: '1px solid #1e2633',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            >
              Generating NC program blocks for {activeMachine?.name || selectedController}...
            </div>
          ) : genError ? (
            <div
              style={{
                height: '360px',
                background: '#090c10',
                border: '1px solid #7f1d1d',
                borderRadius: '6px',
                padding: '16px',
                color: '#fca5a5',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            >
              NC Post Error: {genError}
            </div>
          ) : (
            <VirtualizedGCodeList
              lines={filteredLines}
              rowHeight={20}
              fallbackHeight={360}
              showLineNumbers={true}
              syntaxHighlight={true}
              rowClassName=""
              resetScrollKey={`${selectedController}|${ncData?.lineCount || 0}|${deferredSearchTerm}`}
              emptyMessage={searchTerm ? `No G-code blocks match "${searchTerm}".` : 'No G-code blocks generated.'}
              style={{
                background: '#090c10',
                border: '1px solid #1e2633',
                borderRadius: '6px',
                padding: '10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#94a3b8'
              }}
            />
          )}

          {/* Bottom Actions Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Output file: <strong style={{ color: '#38bdf8' }}>{cleanProgName}{outputFileExt}</strong>
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={handleCopy} disabled={isGenerating || !ncData?.gcodeText}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy G-Code'}</span>
              </button>

              <button
                className="btn-primary"
                onClick={handleDownload}
                disabled={isGenerating || !ncData?.gcodeText}
                style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', borderColor: '#10b981' }}
              >
                <Download size={14} />
                <span>Download NC File ({outputFileExt})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

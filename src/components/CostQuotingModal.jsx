import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Maximize2, Minimize2, DollarSign, TrendingUp, TrendingDown,
  Percent, Layers, Clock, Cpu, HardDrive, Printer, Download, Copy,
  Check, Info, Sliders, ShieldCheck, AlertTriangle, Box, FileText,
  ChevronRight, Zap, RefreshCw, BarChart2
} from 'lucide-react';
import {
  MACHINE_RATE_CATALOG,
  RAW_MATERIALS_CATALOG,
  DEFAULT_SHOP_RATES,
  calculateJobMachiningQuote
} from '../utils/costQuotingEngine.js';

export default function CostQuotingModal({
  isOpen,
  onClose,
  operations = [],
  tools = [],
  stockConfig = {},
  partMetrics = null,
  activeMachine = null
}) {
  const dialogRef = useRef(null);

  // Modal State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' | 'toolwear' | 'stock' | 'quotesheet'
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Job Configuration State
  const [batchQuantity, setBatchQuantity] = useState(50);
  const [selectedMachineId, setSelectedMachineId] = useState('DMG_DMU50');
  const [selectedMaterialId, setSelectedMaterialId] = useState('AL_6061_T6');

  // Shop Rates Overrides
  const [operatorLaborRate, setOperatorLaborRate] = useState(DEFAULT_SHOP_RATES.operatorLaborRateUsd);
  const [setupTimeMinutes, setSetupTimeMinutes] = useState(DEFAULT_SHOP_RATES.fixedSetupTimeMinutes);
  const [inspectionTimeMin, setInspectionTimeMin] = useState(DEFAULT_SHOP_RATES.firstPieceInspectionMin);
  const [partHandlingSec, setPartHandlingSec] = useState(DEFAULT_SHOP_RATES.partHandlingTimeSec);
  const [overheadPct, setOverheadPct] = useState(DEFAULT_SHOP_RATES.overheadRatePct);
  const [targetMarginPct, setTargetMarginPct] = useState(DEFAULT_SHOP_RATES.targetProfitMarginPct);

  // Customer Quote Details
  const [customerName, setCustomerName] = useState('Apex Aerospace Dynamics');
  const [rfqNumber, setRfqNumber] = useState(`RFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [leadTimeWeeks, setLeadTimeWeeks] = useState(2);

  // Calculate Machining Quote
  const quoteResult = useMemo(() => {
    if (!isOpen) return null;

    return calculateJobMachiningQuote({
      operations,
      tools,
      stockConfig,
      partMetrics,
      machineId: selectedMachineId,
      materialId: selectedMaterialId,
      batchQuantity,
      shopRates: {
        operatorLaborRateUsd: operatorLaborRate,
        fixedSetupTimeMinutes: setupTimeMinutes,
        firstPieceInspectionMin: inspectionTimeMin,
        partHandlingTimeSec: partHandlingSec,
        overheadRatePct: overheadPct,
        targetProfitMarginPct: targetMarginPct
      }
    });
  }, [
    isOpen,
    operations,
    tools,
    stockConfig,
    partMetrics,
    selectedMachineId,
    selectedMaterialId,
    batchQuantity,
    operatorLaborRate,
    setupTimeMinutes,
    inspectionTimeMin,
    partHandlingSec,
    overheadPct,
    targetMarginPct
  ]);

  // Copy Quote Breakdown text
  const handleCopyQuote = () => {
    if (!quoteResult) return;
    const m = quoteResult.metrics;
    const text = `
=== ARGUS CAM MANUFACTURING QUOTATION ===
RFQ / Quote: ${rfqNumber}
Customer: ${customerName}
Part Name: ${partMetrics?.name || 'DMU50_Workpiece'}
Batch Quantity: ${batchQuantity} Units
Machine Center: ${quoteResult.machine.name}
Raw Material: ${quoteResult.material.name}

COST BREAKDOWN (PER UNIT):
- Machine Run Time: $${m.machineRunningCostPerPart} (${m.totalMachiningFormatted})
- Raw Material Net: $${m.netMaterialCostPerPart} (Buy-to-Fly ${m.buyToFlyRatio}:1)
- Tool Wear & Cutter Depreciation: $${m.toolWearCostPerPart}
- Operator Handling & Setup Amortization: $${(m.partHandlingCostPerPart + m.amortizedSetupPerPart).toFixed(2)}
- Electricity & Power Draw: $${m.electricityCostPerPart}
- Shop Overhead (${targetMarginPct}%): $${m.overheadCostPerPart}

COMMERCIAL SUMMARY:
- Unit COGS Cost: $${m.cogsPerPart}
- Target Gross Margin: ${m.targetProfitMarginPct}%
- Quoted Selling Price: $${m.quotedPricePerPart} / Unit
- Total Purchase Order Value: $${m.totalJobQuoteUsd}
- Delivery Lead Time: ${leadTimeWeeks} Weeks ARO
=========================================
`.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2000);
    });
  };

  // Keyboard shortcut ESC
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

  const m = quoteResult?.metrics || {
    quotedPricePerPart: 0,
    totalJobQuoteUsd: 0,
    cogsPerPart: 0,
    profitPerPart: 0,
    totalMachiningFormatted: '0m 00s',
    buyToFlyRatio: 1.0,
    machineRunningCostPerPart: 0,
    netMaterialCostPerPart: 0,
    toolWearCostPerPart: 0,
    partHandlingCostPerPart: 0,
    amortizedSetupPerPart: 0,
    electricityCostPerPart: 0,
    overheadCostPerPart: 0
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0px' : '20px'
      }}
    >
      <div
        style={{
          width: isFullscreen ? '100vw' : '96vw',
          maxWidth: isFullscreen ? '100vw' : '1680px',
          height: isFullscreen ? '100vh' : '92vh',
          background: '#0d1527',
          borderRadius: isFullscreen ? '0px' : '14px',
          border: '1px solid #1e293b',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#e2e8f0'
        }}
      >
        {/* ================================================================== */}
        {/* HEADER */}
        {/* ================================================================== */}
        <div
          style={{
            height: '56px',
            borderBottom: '1px solid #1e293b',
            background: 'linear-gradient(90deg, #090f1d 0%, #0e172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              <DollarSign size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.3px', color: '#f8fafc' }}>
                  CNC Machining Cost, Tool Wear &amp; Production Quoting Calculator
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: 600
                  }}
                >
                  Taylor Tool Wear &bull; Buy-to-Fly Ratio &bull; Machine Burden
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Machine: {quoteResult?.machine.name} &bull; Material: {quoteResult?.material.name} &bull; Cycle Time: {m.totalMachiningFormatted} / Part
              </div>
            </div>
          </div>

          {/* Center Commercial Financial Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <DollarSign size={16} color="#10b981" />
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Quoted Unit Price</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                  ${m.quotedPricePerPart}{' '}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1' }}>/ Part</span>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <TrendingUp size={16} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Total Job Value</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                  ${m.totalJobQuoteUsd}{' '}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1' }}>(Q={batchQuantity})</span>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Percent size={16} color="#c084fc" />
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>Gross Margin</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#c084fc' }}>
                  {targetMarginPct}%{' '}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#cbd5e1' }}>(${m.profitPerPart}/part)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Restore standard window' : 'Full screen'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              title="Close Cost Quoting Studio (ESC)"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MAIN BODY: 2-COLUMN SPLIT */}
        {/* ================================================================== */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* ================================================================ */}
          {/* LEFT SIDEBAR: SHOP RATES, BATCH & MACHINE PARAMETERS */}
          {/* ================================================================ */}
          <div
            style={{
              width: '410px',
              borderRight: '1px solid #1e293b',
              background: '#090f1d',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
              {/* SECTION 1: BATCH QUANTITY & MACHINE */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#10b981', marginBottom: '10px' }}>
                  <Box size={15} />
                  Batch Size &amp; Machine Center
                </div>

                {/* Batch Size Stepper & Quick Pills */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Production Batch Quantity (Q):
                  </label>
                  <input
                    type="number"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{
                      width: '100%',
                      background: '#0b1320',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginBottom: '6px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 10, 50, 100, 500, 1000].map(qty => (
                      <button
                        key={qty}
                        onClick={() => setBatchQuantity(qty)}
                        style={{
                          flex: 1,
                          padding: '4px 0',
                          borderRadius: '4px',
                          background: batchQuantity === qty ? '#10b981' : '#1e293b',
                          border: `1px solid ${batchQuantity === qty ? '#10b981' : '#334155'}`,
                          color: batchQuantity === qty ? '#ffffff' : '#cbd5e1',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Machine Selection */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Target Machine Center:
                  </label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0b1320',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      fontSize: '12px'
                    }}
                  >
                    {Object.entries(MACHINE_RATE_CATALOG).map(([key, mach]) => (
                      <option key={key} value={key}>
                        {mach.name} (${mach.hourlyRateUsd}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Material Selection */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Raw Stock Material Alloy:
                  </label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0b1320',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      padding: '7px 10px',
                      fontSize: '12px'
                    }}
                  >
                    {Object.entries(RAW_MATERIALS_CATALOG).map(([key, mat]) => (
                      <option key={key} value={key}>
                        {mat.name} (${mat.costPerKgUsd}/kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 2: LABOR, SETUP & UTILITIES */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
                  <Clock size={15} />
                  Setup, Labor &amp; Handling Rates
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Machinist Rate ($/hr)</label>
                    <input
                      type="number"
                      value={operatorLaborRate}
                      onChange={(e) => setOperatorLaborRate(parseFloat(e.target.value) || 50)}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Part Handling (Sec)</label>
                    <input
                      type="number"
                      value={partHandlingSec}
                      onChange={(e) => setPartHandlingSec(parseInt(e.target.value, 10) || 60)}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Setup Time (Min)</label>
                    <input
                      type="number"
                      value={setupTimeMinutes}
                      onChange={(e) => setSetupTimeMinutes(parseFloat(e.target.value) || 45)}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>1st Article CMM (Min)</label>
                    <input
                      type="number"
                      value={inspectionTimeMin}
                      onChange={(e) => setInspectionTimeMin(parseFloat(e.target.value) || 20)}
                      style={{
                        width: '100%',
                        background: '#0b1320',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        padding: '6px 8px',
                        fontSize: '12px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PROFIT MARGIN & OVERHEAD */}
              <div
                style={{
                  background: '#0e172a',
                  borderRadius: '10px',
                  padding: '14px',
                  border: '1px solid #1e293b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#c084fc', marginBottom: '10px' }}>
                  <Percent size={15} />
                  Overhead &amp; Profit Margins
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Shop Overhead (SG&amp;A):</span>
                    <strong style={{ color: '#38bdf8' }}>{overheadPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    value={overheadPct}
                    onChange={(e) => setOverheadPct(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#38bdf8' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                    <span style={{ color: '#94a3b8' }}>Target Gross Profit Margin:</span>
                    <strong style={{ color: '#10b981' }}>{targetMarginPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="65"
                    value={targetMarginPct}
                    onChange={(e) => setTargetMarginPct(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CENTER & RIGHT WORKSPACE */}
          {/* ================================================================ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0b1320', overflow: 'hidden' }}>
            {/* Top Workspace Navigation Tabs */}
            <div
              style={{
                height: '42px',
                borderBottom: '1px solid #1e293b',
                background: '#090f1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setActiveTab('breakdown')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'breakdown' ? '#1e293b' : 'transparent',
                    color: activeTab === 'breakdown' ? '#10b981' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <BarChart2 size={14} />
                  Cost Breakdown &amp; Quantity Curves
                </button>
                <button
                  onClick={() => setActiveTab('toolwear')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'toolwear' ? '#1e293b' : 'transparent',
                    color: activeTab === 'toolwear' ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Cpu size={14} />
                  Taylor Tool Wear Forecast ({quoteResult?.toolWearReports.length || 0} Cutters)
                </button>
                <button
                  onClick={() => setActiveTab('stock')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'stock' ? '#1e293b' : 'transparent',
                    color: activeTab === 'stock' ? '#f59e0b' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <HardDrive size={14} />
                  Stock &amp; Buy-to-Fly Ratio ({m.buyToFlyRatio}:1)
                </button>
                <button
                  onClick={() => setActiveTab('quotesheet')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: activeTab === 'quotesheet' ? '#1e293b' : 'transparent',
                    color: activeTab === 'quotesheet' ? '#c084fc' : '#94a3b8',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <FileText size={14} />
                  Commercial Quote Sheet
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Job Run Time: {m.totalJobRunTimeHours} hrs across {batchQuantity} parts
              </div>
            </div>

            {/* TAB CONTENT 1: COST BREAKDOWN & QUANTITY BREAKS */}
            {activeTab === 'breakdown' && (
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                {/* 4 Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Machine Run Cost</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                      ${m.machineRunningCostPerPart}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      {m.totalMachiningFormatted} @ ${quoteResult?.machine.hourlyRateUsd}/hr
                    </div>
                  </div>

                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Net Material Cost</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                      ${m.netMaterialCostPerPart}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      {m.rawWeightKg} kg stock (-${m.scrapSalvageCreditPerPart} scrap)
                    </div>
                  </div>

                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Tool Wear Cost</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                      ${m.toolWearCostPerPart}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Taylor carbide depreciation
                    </div>
                  </div>

                  <div style={{ background: '#0e172a', padding: '16px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Setup &amp; Handling</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
                      ${(m.partHandlingCostPerPart + m.amortizedSetupPerPart).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Amortized setup: ${m.amortizedSetupPerPart}/part
                    </div>
                  </div>
                </div>

                {/* Itemized Cost Drivers Table */}
                <div style={{ background: '#0e172a', borderRadius: '10px', padding: '20px', border: '1px solid #1e293b', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} color="#10b981" />
                    Itemized Cost Distribution per Part (Q={batchQuantity})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Machine Center Operation', val: m.machineRunningCostPerPart, color: '#38bdf8' },
                      { label: 'Raw Stock Material (Net)', val: m.netMaterialCostPerPart, color: '#10b981' },
                      { label: 'Carbide Tool Wear & Cutter Life', val: m.toolWearCostPerPart, color: '#f59e0b' },
                      { label: 'Operator Loading & Handling', val: m.partHandlingCostPerPart, color: '#a855f7' },
                      { label: 'Amortized Fixture & WCS Setup', val: m.amortizedSetupPerPart, color: '#ec4899' },
                      { label: 'Spindle Electric Power Draw', val: m.electricityCostPerPart, color: '#06b6d4' },
                      { label: 'Shop Burden & Overhead', val: m.overheadCostPerPart, color: '#64748b' }
                    ].map((item, idx) => {
                      const pct = Math.min(100, (item.val / Math.max(1, m.cogsPerPart)) * 100);
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                            <strong>${item.val.toFixed(2)} ({pct.toFixed(1)}%)</strong>
                          </div>
                          <div style={{ height: '6px', background: '#0b1320', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Discount Schedule */}
                <div style={{ background: '#0e172a', borderRadius: '10px', padding: '20px', border: '1px solid #1e293b' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingDown size={16} color="#38bdf8" />
                    Quantity Discount Break Schedule (Fixed Setup Amortization)
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#0b1320', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Batch Quantity</th>
                        <th style={{ padding: '8px 12px' }}>Amortized Setup</th>
                        <th style={{ padding: '8px 12px' }}>Unit COGS</th>
                        <th style={{ padding: '8px 12px' }}>Unit Quoted Price</th>
                        <th style={{ padding: '8px 12px' }}>Total PO Value</th>
                        <th style={{ padding: '8px 12px' }}>Savings vs Q=1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteResult?.quantityBreaks.map(qb => {
                        const savings = quoteResult.quantityBreaks[0].pricePerPart > 0
                          ? ((quoteResult.quantityBreaks[0].pricePerPart - qb.pricePerPart) / quoteResult.quantityBreaks[0].pricePerPart) * 100
                          : 0;

                        return (
                          <tr key={qb.quantity} style={{ borderBottom: '1px solid #1e293b', background: qb.quantity === batchQuantity ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>
                              {qb.quantity} {qb.quantity === batchQuantity && <span style={{ color: '#10b981', fontSize: '10px' }}>(ACTIVE)</span>}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#94a3b8' }}>${qb.setupPerPart}</td>
                            <td style={{ padding: '8px 12px' }}>${qb.cogsPerPart}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#10b981' }}>${qb.pricePerPart}</td>
                            <td style={{ padding: '8px 12px' }}>${qb.totalJobCost.toLocaleString()}</td>
                            <td style={{ padding: '8px 12px', color: savings > 0 ? '#38bdf8' : '#64748b' }}>
                              {savings > 0 ? `-${savings.toFixed(1)}%` : 'Baseline'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: TAYLOR TOOL LIFE */}
            {activeTab === 'toolwear' && (
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ background: '#0e172a', borderRadius: '10px', padding: '20px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={16} color="#38bdf8" />
                    Taylor Tool Life Equation Wear Analysis (Vc &bull; T^n = C)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                    Using Taylor's empirical tool wear equation for <strong>{quoteResult?.material.name}</strong> (Exponent n = {quoteResult?.material.taylorExponentN}, Constant C = {quoteResult?.material.taylorConstantC}), cutter degradation is calculated per operation.
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#e2e8f0' }}>
                    <thead>
                      <tr style={{ background: '#0b1320', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Tool Name</th>
                        <th style={{ padding: '8px 12px' }}>Diameter</th>
                        <th style={{ padding: '8px 12px' }}>Speed Vc</th>
                        <th style={{ padding: '8px 12px' }}>Engaged / Part</th>
                        <th style={{ padding: '8px 12px' }}>Expected Life</th>
                        <th style={{ padding: '8px 12px' }}>Wear / Part</th>
                        <th style={{ padding: '8px 12px' }}>Parts / Edge</th>
                        <th style={{ padding: '8px 12px' }}>Cost / Part</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteResult?.toolWearReports.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{t.toolName}</td>
                          <td style={{ padding: '8px 12px', color: '#94a3b8' }}>&Oslash;{t.diameter} mm</td>
                          <td style={{ padding: '8px 12px' }}>{t.cuttingSpeedVc} m/min</td>
                          <td style={{ padding: '8px 12px' }}>{t.engagedMinutes} min</td>
                          <td style={{ padding: '8px 12px' }}>{t.expectedLifeMin} min</td>
                          <td style={{ padding: '8px 12px', color: t.lifeConsumedPct > 15 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                            {t.lifeConsumedPct}%
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{t.partsPerTool} parts</td>
                          <td style={{ padding: '8px 12px', color: '#38bdf8', fontWeight: 700 }}>${t.costPerPartUsd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: STOCK & BUY-TO-FLY */}
            {activeTab === 'stock' && (
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ background: '#0e172a', borderRadius: '10px', padding: '20px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HardDrive size={16} color="#f59e0b" />
                    Stock Material Envelope &amp; Buy-to-Fly Ratio
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Raw Stock Bounding Block:</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>
                        {m.rawDimensions.x} &times; {m.rawDimensions.y} &times; {m.rawDimensions.z} mm
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Includes 4mm side &amp; 5mm vise grip stock</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Buy-to-Fly Ratio:</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: m.buyToFlyRatio > 3 ? '#f59e0b' : '#10b981', marginTop: '2px' }}>
                        {m.buyToFlyRatio} : 1.0
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Raw Weight ({m.rawWeightKg} kg) / Net ({m.finishedWeightKg} kg)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Recyclable Chip Salvage Credit:</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                        -${m.scrapSalvageCreditPerPart} / Part
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{m.chipScrapWeightKg} kg chips @ ${quoteResult?.material.scrapSalvagePerKgUsd}/kg</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: FORMAL MACHINE SHOP QUOTE SHEET */}
            {activeTab === 'quotesheet' && (
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div
                  style={{
                    maxWidth: '850px',
                    margin: '0 auto',
                    background: '#ffffff',
                    color: '#0f172a',
                    padding: '36px',
                    borderRadius: '8px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  {/* Quote Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                        ARGUS TECHNOLOGIES &bull; PRECISION CNC
                      </h1>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                        High-Precision 5-Axis Multiaxis Machining &bull; AS9100 / ISO 9001 Certified
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>OFFICIAL QUOTATION</div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>{rfqNumber}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '12px' }}>
                    <div>
                      <strong style={{ display: 'block', color: '#475569' }}>PREPARED FOR:</strong>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{customerName}</div>
                      <div style={{ color: '#64748b' }}>Attn: Purchasing &amp; Engineering</div>
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#475569' }}>PROJECT / PART:</strong>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{partMetrics?.name || 'DMU50_Workpiece.mcam'}</div>
                      <div style={{ color: '#64748b' }}>Material: {quoteResult?.material.name}</div>
                    </div>
                  </div>

                  {/* Line Item Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '24px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Line</th>
                        <th style={{ padding: '8px' }}>Description</th>
                        <th style={{ padding: '8px' }}>Qty</th>
                        <th style={{ padding: '8px' }}>Unit Price</th>
                        <th style={{ padding: '8px' }}>Ext. Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}>1</td>
                        <td style={{ padding: '8px' }}>
                          <strong>Precision CNC Machined Component</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Full 5-axis multiaxis machining on {quoteResult?.machine.name}. Includes 100% CMM dimensional inspection.
                          </div>
                        </td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>{batchQuantity}</td>
                        <td style={{ padding: '8px', fontWeight: 700 }}>${m.quotedPricePerPart}</td>
                        <td style={{ padding: '8px', fontWeight: 800 }}>${m.totalJobQuoteUsd.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Terms & Totals */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: '16px', fontSize: '12px' }}>
                    <div style={{ color: '#64748b', maxWidth: '400px' }}>
                      <div><strong>Payment Terms:</strong> Net 30 Days</div>
                      <div><strong>Lead Time:</strong> {leadTimeWeeks} Weeks ARO (After Receipt of Order)</div>
                      <div><strong>Quote Validity:</strong> 30 Days from date of issue</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', color: '#475569' }}>Total Purchase Order Value:</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>
                        ${m.totalJobQuoteUsd.toLocaleString()} USD
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Status Strip */}
            <div
              style={{
                height: '40px',
                borderTop: '1px solid #1e293b',
                background: '#090f1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                fontSize: '11px',
                color: '#94a3b8',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>Unit Cost: ${m.cogsPerPart}</span>
                <span>Margin: {targetMarginPct}%</span>
                <span>Unit Price: ${m.quotedPricePerPart}</span>
                <span>Batch: {batchQuantity} pcs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={13} color="#10b981" />
                <span>Cycle Time: <strong>{m.totalMachiningFormatted}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* FOOTER */}
        {/* ================================================================== */}
        <div
          style={{
            height: '56px',
            borderTop: '1px solid #1e293b',
            background: '#090f1d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCopyQuote}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: copiedQuote ? '#10b981' : '#1e293b',
                border: '1px solid #334155',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copiedQuote ? <Check size={14} /> : <Copy size={14} />}
              {copiedQuote ? 'Quotation Copied!' : 'Copy Quote Text'}
            </button>
            <button
              onClick={() => setActiveTab('quotesheet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FileText size={14} />
              View Formal Quote Sheet
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

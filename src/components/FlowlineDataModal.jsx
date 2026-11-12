import React from 'react';
import { Check, HelpCircle, X } from 'lucide-react';

const MC_BTN = {
  height: '24px',
  width: '100%',
  background: 'linear-gradient(180deg, #f8fafc 0%, #e5e7eb 100%)',
  border: '1px solid #9ca3af',
  borderRadius: '2px',
  fontSize: '11.5px',
  color: '#0f172a',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  padding: '0 8px'
};

/**
 * Non-blocking Mastercam Flowline data floating dialog (Flip Offset/Cut/Step/Start, Edge tolerance, Plot edges).
 * State badges show current direction on each button, matching Mastercam 2026 style.
 */
export default function FlowlineDataModal({
  isOpen,
  flowlineData = {
    offsetDir: 1,
    cutDir: 1,
    stepDir: 1,
    swapUV: false,
    startCorner: 0,
    edgeTolerance: 0.025,
    plotEdges: false
  },
  onChangeFlowlineData,
  onPlotEdges,
  onConfirm,
  onCancel,
  onHelp
}) {
  if (!isOpen) return null;

  const update = (patch) => {
    onChangeFlowlineData?.({ ...flowlineData, ...patch });
  };

  const stepLabel = (() => {
    const swap = Boolean(flowlineData.swapUV);
    const sign = (flowlineData.stepDir ?? 1) >= 0 ? '+' : '-';
    return `${sign}${swap ? 'U' : 'V'}`;
  })();

  const cornerIndex = (Number(flowlineData.startCorner) || 0) % 4;

  return (
    <div
      data-testid="flowline-data-modal"
      style={{
        position: 'fixed',
        left: '12px',
        top: '96px',
        width: '214px',
        zIndex: 99965,
        background: '#f0f0f0',
        border: '1px solid #7f8c8d',
        boxShadow: '0 10px 28px rgba(15, 23, 42, 0.28)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '11.5px',
        color: '#0f172a',
        userSelect: 'none'
      }}
    >
      {/* Classic Title Bar */}
      <div
        style={{
          height: '28px',
          background: '#ffffff',
          borderBottom: '1px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px 0 10px'
        }}
      >
        <span style={{ fontSize: '12px', color: '#111827', fontWeight: 500 }}>Flowline data</span>
        <button
          type="button"
          onClick={onCancel}
          title="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            padding: '2px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <fieldset style={{ border: '1px solid #cbd5e1', padding: '8px', margin: 0 }}>
          <legend style={{ fontSize: '11px', padding: '0 4px', color: '#1e293b' }}>Flip</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button
              type="button"
              data-testid="flowline-flip-offset-btn"
              onClick={() => update({ offsetDir: (flowlineData.offsetDir ?? 1) * -1 })}
              title={`Flip normal offset side (currently ${flowlineData.offsetDir >= 0 ? 'Outer' : 'Inner'})`}
              style={{
                ...MC_BTN,
                border: flowlineData.offsetDir < 0 ? '1px solid #0284c7' : '1px solid #9ca3af',
                background: flowlineData.offsetDir < 0 ? '#e0f2fe' : MC_BTN.background,
                justifyContent: 'space-between'
              }}
            >
              <span>Offset</span>
              <span style={{ color: '#0284c7', fontSize: '10px', fontWeight: 600 }}>
                ({flowlineData.offsetDir >= 0 ? 'Outer' : 'Inner'})
              </span>
            </button>
            <button
              type="button"
              data-testid="flowline-flip-cut-btn"
              onClick={() => update({ cutDir: (flowlineData.cutDir ?? 1) * -1 })}
              title="Reverse cut direction arrow along flowline"
              style={{
                ...MC_BTN,
                border: flowlineData.cutDir < 0 ? '1px solid #0284c7' : '1px solid #9ca3af',
                background: flowlineData.cutDir < 0 ? '#e0f2fe' : MC_BTN.background,
                justifyContent: 'space-between'
              }}
            >
              <span>Cut direction</span>
              <span style={{ color: '#0284c7', fontSize: '11px', fontWeight: 700 }}>
                ({flowlineData.cutDir >= 0 ? '→' : '←'})
              </span>
            </button>
            <button
              type="button"
              data-testid="flowline-flip-step-btn"
              onClick={() => {
                // Cycle through U/V step orientation & sign: (+V -> +U -> -V -> -U)
                const curSwap = Boolean(flowlineData.swapUV);
                const curStep = (flowlineData.stepDir ?? 1) >= 0 ? 1 : -1;
                if (!curSwap && curStep > 0) update({ swapUV: true, stepDir: 1 });
                else if (curSwap && curStep > 0) update({ swapUV: false, stepDir: -1 });
                else if (!curSwap && curStep < 0) update({ swapUV: true, stepDir: -1 });
                else update({ swapUV: false, stepDir: 1 });
              }}
              title="Switch/flip stepover direction across drive surfaces (U vs V)"
              style={{
                ...MC_BTN,
                border: flowlineData.swapUV || flowlineData.stepDir < 0 ? '1px solid #0284c7' : '1px solid #9ca3af',
                background: flowlineData.swapUV || flowlineData.stepDir < 0 ? '#e0f2fe' : MC_BTN.background,
                justifyContent: 'space-between'
              }}
            >
              <span>Step direction</span>
              <span style={{ color: '#0284c7', fontSize: '10px', fontWeight: 600 }}>
                ({stepLabel})
              </span>
            </button>
            <button
              type="button"
              data-testid="flowline-flip-start-btn"
              onClick={() => update({ startCorner: ((Number(flowlineData.startCorner) || 0) + 1) % 4 })}
              title={`Cycle start corner (Corner #${cornerIndex + 1})`}
              style={{
                ...MC_BTN,
                border: cornerIndex > 0 ? '1px solid #0284c7' : '1px solid #9ca3af',
                background: cornerIndex > 0 ? '#dbeafe' : MC_BTN.background,
                justifyContent: 'space-between'
              }}
            >
              <span>Start</span>
              <span style={{ color: '#0284c7', fontSize: '10px', fontWeight: 600 }}>
                (Corner #{cornerIndex + 1})
              </span>
            </button>
          </div>
        </fieldset>

        {/* Edge Tolerance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 68px', alignItems: 'center', gap: '6px', padding: '0 2px' }}>
          <span style={{ color: '#1e293b' }}>Edge tolerance:</span>
          <input
            type="number"
            step="0.005"
            min="0.001"
            value={flowlineData.edgeTolerance ?? 0.025}
            onChange={(e) => update({ edgeTolerance: Math.max(0.001, Number(e.target.value) || 0.025) })}
            style={{
              background: '#ffffd4',
              border: '1px solid #9ca3af',
              borderRadius: '1px',
              height: '22px',
              padding: '2px 5px',
              fontSize: '11.5px',
              color: '#0f172a',
              width: '100%',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        {/* Plot edges */}
        <button
          type="button"
          data-testid="flowline-plot-edges-btn"
          onClick={() => {
            const nextPlot = !flowlineData.plotEdges;
            update({ plotEdges: nextPlot });
            onPlotEdges?.(nextPlot);
          }}
          title="Plot UV boundary edges of selected drive surfaces"
          style={{
            ...MC_BTN,
            border: flowlineData.plotEdges ? '1px solid #0284c7' : '1px solid #9ca3af',
            background: flowlineData.plotEdges ? '#dbeafe' : MC_BTN.background
          }}
        >
          Plot edges
        </button>

        {/* Footer OK & Help */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '2px' }}>
          <button
            type="button"
            data-testid="flowline-data-ok-btn"
            onClick={onConfirm}
            title="OK"
            style={{
              ...MC_BTN,
              width: '56px',
              height: '28px',
              background: '#ffffff',
              color: '#16a34a'
            }}
          >
            <Check size={16} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => onHelp?.()}
            title="Help"
            style={{
              ...MC_BTN,
              width: '56px',
              height: '28px',
              background: '#ffffff',
              color: '#0284c7'
            }}
          >
            <HelpCircle size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

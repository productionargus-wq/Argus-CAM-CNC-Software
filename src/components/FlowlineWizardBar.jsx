import React from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  FilePlus,
  Compass,
  Cpu,
  Layers,
  Box,
  Sliders,
  FileCode,
  CheckCircle2
} from 'lucide-react';

export const FLOWLINE_WIZARD_STEPS = [
  {
    step: 1,
    id: 'wizard_new_file',
    title: '1. New File',
    short: 'New',
    icon: FilePlus,
    description: 'Start fresh project with clear workspace.',
    actionLabel: 'Open File > New'
  },
  {
    step: 2,
    id: 'wizard_set_units',
    title: '2. Units: Metric',
    short: 'Units',
    icon: Compass,
    description: 'Ensure active units are Metric (mm - G21).',
    actionLabel: 'Toggle to Metric'
  },
  {
    step: 3,
    id: 'wizard_machine',
    title: '3. 3-Axis Machine',
    short: 'Machine',
    icon: Cpu,
    description: 'Select 3-Axis Mill Default (Fanuc/Haas compatible).',
    actionLabel: 'Select 3-Axis Mill'
  },
  {
    step: 4,
    id: 'wizard_wireframe',
    title: '4. Draw 3D Arc',
    short: 'Arc',
    icon: Layers,
    description: 'Draw 100mm curved arch (Radius 80mm, X-50 to X+50).',
    actionLabel: 'Create Arc Geometry'
  },
  {
    step: 5,
    id: 'wizard_extrude',
    title: '5. Extrude Surface',
    short: 'Extrude',
    icon: Layers,
    description: 'Extrude the arc 60mm along Y axis into a 3D curved sheet.',
    actionLabel: 'Extrude 3D Surface'
  },
  {
    step: 6,
    id: 'wizard_stock',
    title: '6. Stock Setup',
    short: 'Stock',
    icon: Box,
    description: 'Define 100x60x25mm billet with Top-Center datum.',
    actionLabel: 'Open Stock Setup'
  },
  {
    step: 7,
    id: 'wizard_flowline',
    title: '7. Surface Flowline',
    short: 'Flowline',
    icon: Sliders,
    description: 'Select drive surface, set Ball Endmill & 0.5mm stepover.',
    actionLabel: 'Generate Flowline'
  },
  {
    step: 8,
    id: 'wizard_post',
    title: '8. Post G-Code',
    short: 'G-Code',
    icon: FileCode,
    description: 'Post-process to Fanuc/Haas G-code (.NC) and export.',
    actionLabel: 'Generate G-Code (G1)'
  }
];

export default function FlowlineWizardBar({
  isActive = false,
  currentStep = 1,
  onStepClick,
  onClose,
  unitSystem = 'metric',
  activeMachineName = '3-Axis Mill Default'
}) {
  if (!isActive) return null;

  const activeStepData = FLOWLINE_WIZARD_STEPS.find((s) => s.step === currentStep) || FLOWLINE_WIZARD_STEPS[0];

  const handleNext = () => {
    if (currentStep < FLOWLINE_WIZARD_STEPS.length) {
      const nextStep = FLOWLINE_WIZARD_STEPS.find((s) => s.step === currentStep + 1);
      if (nextStep && onStepClick) {
        onStepClick(nextStep.id, nextStep.step);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStep = FLOWLINE_WIZARD_STEPS.find((s) => s.step === currentStep - 1);
      if (prevStep && onStepClick) {
        onStepClick(prevStep.id, prevStep.step);
      }
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderBottom: '2px solid #0284c7',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.1)',
        padding: '6px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '11.5px',
        color: '#0f172a',
        zIndex: 9000,
        position: 'relative'
      }}
    >
      {/* Top Banner Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '3px',
              fontWeight: 700,
              fontSize: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={13} />
            <span>FLOWLINE 3-AXIS WIZARD</span>
          </div>
          <span style={{ color: '#475569', fontSize: '11px' }}>
            Follow the 8 steps below to create a 3D curved surface from scratch and generate CNC G-code.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep <= 1}
            style={{
              height: '24px',
              padding: '0 8px',
              background: currentStep <= 1 ? '#f1f5f9' : '#e0f2fe',
              color: currentStep <= 1 ? '#94a3b8' : '#0369a1',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              cursor: currentStep <= 1 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStep >= FLOWLINE_WIZARD_STEPS.length}
            style={{
              height: '24px',
              padding: '0 8px',
              background: currentStep >= FLOWLINE_WIZARD_STEPS.length ? '#f1f5f9' : '#0284c7',
              color: currentStep >= FLOWLINE_WIZARD_STEPS.length ? '#94a3b8' : '#ffffff',
              border: '1px solid #0284c7',
              borderRadius: '2px',
              cursor: currentStep >= FLOWLINE_WIZARD_STEPS.length ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            Next <ChevronRight size={13} />
          </button>
          <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 4px' }} />
          <button
            type="button"
            onClick={onClose}
            title="Close Wizard"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Steps Pill Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '6px',
          alignItems: 'stretch'
        }}
      >
        {FLOWLINE_WIZARD_STEPS.map((stepItem) => {
          const isCurrent = stepItem.step === currentStep;
          const isCompleted = stepItem.step < currentStep;
          const StepIcon = stepItem.icon;

          return (
            <button
              key={stepItem.id}
              type="button"
              onClick={() => onStepClick?.(stepItem.id, stepItem.step)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 6px',
                background: isCurrent ? '#0284c7' : isCompleted ? '#f0fdf4' : '#f8fafc',
                border: isCurrent ? '1px solid #0369a1' : isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                borderRadius: '3px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isCurrent ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title={stepItem.description}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: isCurrent ? '#ffffff' : isCompleted ? '#22c55e' : '#e2e8f0',
                  color: isCurrent ? '#0284c7' : isCompleted ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {isCompleted ? <CheckCircle2 size={13} strokeWidth={2.5} /> : stepItem.step}
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? '#ffffff' : isCompleted ? '#15803d' : '#334155'
                  }}
                >
                  {stepItem.short}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Context Box */}
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '3px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '12px' }}>
            {activeStepData.title}:
          </span>
          <span style={{ color: '#0f172a' }}>{activeStepData.description}</span>
        </div>

        <button
          type="button"
          onClick={() => onStepClick?.(activeStepData.id, activeStepData.step)}
          style={{
            background: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '2px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {activeStepData.actionLabel} &rarr;
        </button>
      </div>
    </div>
  );
}

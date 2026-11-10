import React, { useEffect, useRef, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';

function formatCleanNumber(val, decimals = 4) {
  if (val === '' || val === null || val === undefined) return '';
  const num = Number(val);
  if (!Number.isFinite(num)) return '';
  return String(Number(num.toFixed(decimals)));
}

/**
 * Focus-safe numeric input for Mastercam-style 2D sketch panels.
 * Lets the user clear the field completely and type decimals or negative values
 * without external prop sync or fixed-decimal formatting fighting keystrokes.
 */
export default function SketchNumericInput({
  value = 0,
  onChangeNumber,
  min = -Infinity,
  max = Infinity,
  step = 1,
  decimals = 4,
  allowNegative = true,
  isLocked = false,
  onToggleLock = null,
  lockTitle = 'Lock value',
  showLock = true,
  showStepper = true,
  presets = null,
  onRawTextChange = null,
  onEnter = null
}) {
  const [text, setText] = useState(() => formatCleanNumber(value, decimals));
  const [hasTypedEdit, setHasTypedEdit] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(formatCleanNumber(value, decimals));
      setHasTypedEdit(false);
    }
  }, [value, decimals]);

  const commitValidIfReady = (raw) => {
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    if (parsed < min || parsed > max) return;
    if (onChangeNumber) onChangeNumber(parsed);
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    const pattern = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
    if (!pattern.test(raw)) return;
    setText(raw);
    setHasTypedEdit(true);
    if (onRawTextChange) onRawTextChange(raw);
    commitValidIfReady(raw);
  };

  const handleFocus = (e) => {
    isFocusedRef.current = true;
    setHasTypedEdit(false);
    e.target.select();
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setHasTypedEdit(false);
    setShowPresetMenu(false);
    const parsed = text === '' || text === '-' || text === '.' || text === '-.' ? NaN : Number(text);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      if (clamped !== Number(value) && onChangeNumber) {
        onChangeNumber(clamped);
      }
      setText(formatCleanNumber(clamped, decimals));
    } else {
      setText(formatCleanNumber(value, decimals));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setHasTypedEdit(false);
      e.currentTarget.blur();
      if (onEnter) onEnter();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isFocusedRef.current = false;
      setHasTypedEdit(false);
      setText(formatCleanNumber(value, decimals));
      e.currentTarget.blur();
    }
  };

  const stepBy = (delta) => {
    const parsed = Number(text);
    const current = Number.isFinite(parsed) ? parsed : (Number(value) || 0);
    const next = Math.min(max, Math.max(min, Number((current + delta).toFixed(decimals))));
    setHasTypedEdit(false);
    setText(formatCleanNumber(next, decimals));
    if (onChangeNumber) onChangeNumber(next);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0, position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: isLocked ? '1px solid #f59e0b' : '1px solid #cbd5e1',
          borderRadius: '3px',
          background: '#ffffff',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          height: '22px'
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          data-sketch-numeric="true"
          data-dirty={hasTypedEdit ? 'true' : 'false'}
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            border: 'none',
            outline: 'none',
            padding: '2px 5px',
            fontSize: '11px',
            fontFamily: 'monospace',
            width: '100%',
            minWidth: 0,
            color: '#0f172a',
            userSelect: 'text'
          }}
        />
        {Array.isArray(presets) && presets.length > 0 && (
          <button
            type="button"
            title="Select preset value"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPresetMenu((prev) => !prev)}
            style={{
              width: '14px',
              height: '100%',
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              fontSize: '8px',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            ▾
          </button>
        )}
        {showStepper && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid #cbd5e1',
              width: '14px',
              height: '100%',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => stepBy(step)}
              style={{
                flex: 1,
                border: 'none',
                background: '#f1f5f9',
                fontSize: '6px',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
            >
              ▲
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => stepBy(-step)}
              style={{
                flex: 1,
                border: 'none',
                borderTop: '1px solid #cbd5e1',
                background: '#f1f5f9',
                fontSize: '6px',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569'
              }}
            >
              ▼
            </button>
          </div>
        )}
      </div>

      {showLock && (
        <button
          type="button"
          onClick={onToggleLock}
          title={lockTitle}
          style={{
            width: '20px',
            height: '22px',
            border: isLocked ? '1px solid #f59e0b' : '1px solid #cbd5e1',
            borderRadius: '3px',
            background: isLocked ? '#fef3c7' : '#ffffff',
            color: isLocked ? '#d97706' : '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0
          }}
        >
          {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      )}
      {showPresetMenu && Array.isArray(presets) && presets.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '23px',
            left: 0,
            right: showLock ? '24px' : 0,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '3px',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            zIndex: 200,
            maxHeight: '140px',
            overflowY: 'auto'
          }}
        >
          {presets.map((presetVal) => (
            <button
              key={presetVal}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setHasTypedEdit(false);
                setText(formatCleanNumber(presetVal, decimals));
                if (onChangeNumber) onChangeNumber(presetVal);
                setShowPresetMenu(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '3px 7px',
                border: 'none',
                borderBottom: '1px solid #f1f5f9',
                background: Number(value) === Number(presetVal) ? '#e0f2fe' : '#ffffff',
                color: '#0f172a',
                fontSize: '11px',
                fontFamily: 'monospace',
                cursor: 'pointer'
              }}
            >
              {formatCleanNumber(presetVal, decimals)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

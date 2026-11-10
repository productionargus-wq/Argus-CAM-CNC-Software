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
  onEnter = null
}) {
  const [text, setText] = useState(() => formatCleanNumber(value, decimals));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(formatCleanNumber(value, decimals));
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
    commitValidIfReady(raw);
  };

  const handleFocus = (e) => {
    isFocusedRef.current = true;
    e.target.select();
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
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
      e.currentTarget.blur();
      if (onEnter) onEnter();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isFocusedRef.current = false;
      setText(formatCleanNumber(value, decimals));
      e.currentTarget.blur();
    }
  };

  const stepBy = (delta) => {
    const parsed = Number(text);
    const current = Number.isFinite(parsed) ? parsed : (Number(value) || 0);
    const next = Math.min(max, Math.max(min, Number((current + delta).toFixed(decimals))));
    setText(formatCleanNumber(next, decimals));
    if (onChangeNumber) onChangeNumber(next);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
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
    </div>
  );
}

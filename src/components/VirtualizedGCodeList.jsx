import React, { useEffect, useRef, useState } from 'react';

function classifyGCodeLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith(';') || trimmed.startsWith('(') || trimmed.startsWith('%')) {
    return { color: '#64748b', isTool: false };
  }
  const isTool = line.includes('TOOL CALL') || line.includes(' M6') || line.includes(' M06');
  if (isTool) {
    return { color: '#a855f7', isTool: true };
  }
  if (line.includes('FMAX') || line.includes('G00') || line.includes('G0 ')) {
    return { color: '#06b6d4', isTool: false };
  }
  if (line.includes('G01') || line.includes('G1 ') || line.includes(' F')) {
    return { color: '#10b981', isTool: false };
  }
  return { color: '#cbd5e1', isTool: false };
}

const MAX_CONTAINER_HEIGHT_PX = 16000000;

/**
 * Windowed virtual renderer for large CNC G-code programs.
 * Keeps DOM node count bounded (~40-60 rows) even for 50,000+ block programs.
 */
export default function VirtualizedGCodeList({
  lines = [],
  rowHeight = 20,
  fallbackHeight = 360,
  overscan = 14,
  activeIndex = -1,
  keepActiveInView = false,
  resetScrollKey = '',
  showLineNumbers = true,
  syntaxHighlight = true,
  onLineClick = null,
  className = '',
  rowClassName = 'gcode-line',
  activeRowClassName = 'active',
  style = {},
  emptyMessage = 'No G-code blocks to display.'
}) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(fallbackHeight);
  const [prevResetKey, setPrevResetKey] = useState(resetScrollKey);

  if (resetScrollKey !== prevResetKey) {
    setPrevResetKey(resetScrollKey);
    setScrollTop(0);
  }

  // Measure actual scrollable viewport height so flex layouts and fixed boxes both virtualize accurately
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateHeight = () => {
      if (el.clientHeight > 0) {
        setViewportHeight(el.clientHeight);
      }
    };
    updateHeight();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset DOM scroll offset when program dialect, dataset, or filter changes
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = 0;
    }
  }, [resetScrollKey]);

  // Keep active simulation block scrolled into view without redundant updates
  useEffect(() => {
    if (!keepActiveInView || activeIndex < 0) return;
    const el = containerRef.current;
    if (!el) return;

    const viewH = el.clientHeight || viewportHeight;
    const targetTop = activeIndex * rowHeight;
    const targetBottom = targetTop + rowHeight;

    if (targetTop < el.scrollTop) {
      const nextTop = Math.max(0, targetTop - rowHeight * 2);
      el.scrollTop = nextTop;
      setScrollTop(nextTop);
    } else if (targetBottom > el.scrollTop + viewH) {
      const nextTop = Math.max(0, targetBottom - viewH + rowHeight * 2);
      el.scrollTop = nextTop;
      setScrollTop(nextTop);
    }
  }, [activeIndex, keepActiveInView, rowHeight, viewportHeight]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleScroll = (e) => {
    const nextTop = e.currentTarget.scrollTop;
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setScrollTop(nextTop);
    });
  };

  const totalCount = lines.length;
  const totalHeight = Math.min(MAX_CONTAINER_HEIGHT_PX, totalCount * rowHeight);
  const startIdx = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const endIdx = Math.min(totalCount, startIdx + visibleCount);
  const visibleSlice = lines.slice(startIdx, endIdx);
  const offsetY = startIdx * rowHeight;

  const lastItem = totalCount > 0 ? lines[totalCount - 1] : null;
  const maxLineNo = typeof lastItem === 'object' && lastItem !== null && lastItem.lineNo
    ? lastItem.lineNo
    : totalCount;
  const gutterWidth = Math.max(42, String(maxLineNo).length * 8 + 10);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{
        height: typeof fallbackHeight === 'number' ? `${fallbackHeight}px` : fallbackHeight,
        overflowY: 'auto',
        overflowX: 'auto',
        position: 'relative',
        ...style
      }}
    >
      {totalCount === 0 ? (
        <div
          style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '11px'
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div
          style={{
            position: 'relative',
            height: `${totalHeight}px`,
            minWidth: '100%',
            width: 'max-content'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${offsetY}px)`
            }}
          >
            {visibleSlice.map((entry, localIdx) => {
              const absIdx = startIdx + localIdx;
              const isObj = typeof entry === 'object' && entry !== null;
              const text = isObj ? entry.text : String(entry ?? '');
              const lineNo = isObj && entry.lineNo ? entry.lineNo : absIdx + 1;
              const isActive = absIdx === activeIndex;
              const { color, isTool } = syntaxHighlight
                ? classifyGCodeLine(text)
                : { color: undefined, isTool: false };

              return (
                <div
                  key={absIdx}
                  className={isActive ? `${rowClassName} ${activeRowClassName}` : rowClassName}
                  onClick={onLineClick ? () => onLineClick(entry, absIdx) : undefined}
                  style={{
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: showLineNumbers ? '14px' : '0',
                    height: `${rowHeight}px`,
                    lineHeight: `${rowHeight}px`,
                    whiteSpace: 'pre',
                    cursor: onLineClick ? 'pointer' : 'default'
                  }}
                >
                  {showLineNumbers && (
                    <span
                      style={{
                        width: `${gutterWidth}px`,
                        flexShrink: 0,
                        color: '#475569',
                        textAlign: 'right',
                        userSelect: 'none'
                      }}
                    >
                      {lineNo}
                    </span>
                  )}
                  <span
                    style={{
                      color: isActive ? undefined : color,
                      fontWeight: isTool ? 700 : undefined
                    }}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Universal React Portal Dropdown Menu for Mastercam Ribbon Bars.
 * Mounts directly to document.body with position: fixed, completely avoiding
 * ribbon-content container overflow-y: hidden clipping.
 */
export default function RibbonPortalMenu({
  isOpen,
  anchorRect,
  onClose,
  children,
  style = {},
  minWidth = '180px',
  className = 'ribbon-dropdown-menu',
  align = 'left'
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    // Use capturing phase so inside clicks don't close before triggering item action
    document.addEventListener('mousedown', handleOutsideClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;

  // Calculate safe fixed coordinates relative to viewport
  const top = (anchorRect.bottom || 0) + 2;
  let left = align === 'right' 
    ? (anchorRect.right || 0) 
    : (anchorRect.left || 0);

  // Guard against overflowing the right edge of viewport
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const approxWidth = parseInt(minWidth, 10) || 200;
  if (left + approxWidth > viewportWidth - 8) {
    left = Math.max(8, viewportWidth - approxWidth - 12);
  }

  return createPortal(
    <div
      ref={menuRef}
      className={className}
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 99999,
        background: '#ffffff',
        border: '1px solid #94a3b8',
        borderRadius: '2px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
        minWidth,
        padding: '4px 0',
        fontFamily: 'Segoe UI, Inter, system-ui, sans-serif',
        ...style
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

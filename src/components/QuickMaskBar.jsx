import React from 'react';
import {
  Plus, Minus, Circle, Dot, Box, Layers,
  Compass, Palette, Ban, CheckSquare, Sparkles
} from 'lucide-react';

/**
 * Mastercam Quick Mask Toolbar (Right Edge Vertical Viewport HUD)
 * Provides rapid entity selection filters: All, Wireframe, Points, Arcs, Surfaces, Solids, Dimensions, Colors, Clear.
 */
export default function QuickMaskBar({
  activeMask = 'all',
  onSelectMask,
  theme = 'light'
}) {
  const isLight = theme !== 'dark';

  const masks = [
    { id: 'all', label: 'QM All', icon: Plus, title: 'Quick Mask All Entities (+)' },
    { id: 'wireframe', label: 'QM Wireframe', icon: Minus, title: 'Quick Mask Wireframe Curves & Lines' },
    { id: 'points', label: 'QM Points', icon: Dot, title: 'Quick Mask Point Entities' },
    { id: 'arcs', label: 'QM Arcs', icon: Circle, title: 'Quick Mask Arcs & Circles' },
    { id: 'surfaces', label: 'QM Surfaces', icon: Layers, title: 'Quick Mask Surface Entities' },
    { id: 'solids', label: 'QM Solids', icon: Box, title: 'Quick Mask Solid Bodies' },
    { id: 'drafting', label: 'QM Drafting', icon: Compass, title: 'Quick Mask Drafting & Dimensions' },
    { id: 'colors', label: 'QM Color', icon: Palette, title: 'Quick Mask by Entity Color' },
    { id: 'clear', label: 'QM Clear', icon: Ban, title: 'Clear Quick Mask / Deselect All' }
  ];

  return (
    <div
      className="quick-mask-bar"
      style={{
        position: 'absolute',
        top: '50%',
        right: '12px',
        transform: 'translateY(-50%)',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        background: isLight ? 'rgba(241, 245, 249, 0.75)' : 'rgba(30, 41, 59, 0.75)',
        border: isLight ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(71, 85, 105, 0.8)',
        borderRadius: '24px',
        padding: '6px 4px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        userSelect: 'none'
      }}
    >
      {masks.map(({ id, icon: Icon, title }) => {
        const isActive = activeMask === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectMask && onSelectMask(id)}
            title={title}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: isActive ? (isLight ? '1.5px solid #0284c7' : '1.5px solid #38bdf8') : '1px solid transparent',
              background: isActive
                ? (isLight ? '#e0f2fe' : '#0369a1')
                : 'transparent',
              color: isActive
                ? (isLight ? '#0284c7' : '#ffffff')
                : (isLight ? '#64748b' : '#94a3b8'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={13} strokeWidth={isActive ? 2.5 : 1.8} />
          </button>
        );
      })}
    </div>
  );
}

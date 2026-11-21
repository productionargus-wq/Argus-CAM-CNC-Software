import React from 'react';
import { 
  Box, 
  PenTool, 
  Layers, 
  ListTree, 
  Play, 
  FileCode,
  Settings
} from 'lucide-react';

export default function MobileNavBar({
  activeTab,
  onSelectTab,
  isDrawerOpen,
  operationsCount = 0,
  hasModel = false
}) {
  const tabs = [
    { id: 'viewport', label: '3D View', icon: Box },
    { id: 'cad', label: 'CAD', icon: PenTool },
    { id: 'toolpaths', label: 'Toolpaths', icon: Layers, badge: operationsCount > 0 ? operationsCount : null },
    { id: 'tree', label: 'Ops Tree', icon: ListTree },
    { id: 'simulate', label: 'Simulate', icon: Play },
    { id: 'gcode', label: 'G-Code', icon: FileCode },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-300 shadow-2xl safe-area-pb"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && (tab.id === 'viewport' || isDrawerOpen);
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 select-none touch-manipulation active:scale-95 ${
                isActive 
                  ? 'text-cyan-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-cyan-400 rounded-b-full shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
              )}
              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 shadow">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

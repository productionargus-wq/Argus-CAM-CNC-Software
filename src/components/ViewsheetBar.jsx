import React, { useState } from 'react';
import { Plus, X, Bookmark, Check, Edit2 } from 'lucide-react';

export default function ViewsheetBar({
  isVisible = true,
  viewsheets = [
    { id: 'vs_1', name: 'Viewsheet #1', bookmark: null, active: true }
  ],
  activeViewsheetId = 'vs_1',
  onSelectViewsheet,
  onAddViewsheet,
  onDeleteViewsheet,
  onRenameViewsheet,
  onSaveBookmark
}) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  if (!isVisible) return null;

  const handleStartRename = (sheet, e) => {
    e.stopPropagation();
    setEditingId(sheet.id);
    setEditName(sheet.name);
  };

  const handleFinishRename = (id) => {
    if (editName.trim() && onRenameViewsheet) {
      onRenameViewsheet(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className="viewsheet-bar"
      style={{
        height: '24px',
        background: '#e2e8f0',
        borderTop: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        gap: '2px',
        userSelect: 'none',
        zIndex: 10
      }}
    >
      {viewsheets.map((sheet) => {
        const isActive = sheet.id === activeViewsheetId;
        const isEditing = sheet.id === editingId;

        return (
          <div
            key={sheet.id}
            onClick={() => onSelectViewsheet && onSelectViewsheet(sheet.id)}
            title={sheet.bookmark ? `${sheet.name} (Bookmark Saved)` : sheet.name}
            style={{
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0 8px',
              fontSize: '11px',
              background: isActive ? '#ffffff' : '#f1f5f9',
              color: isActive ? '#0284c7' : '#475569',
              fontWeight: isActive ? 600 : 400,
              border: isActive ? '1px solid #94a3b8' : '1px solid #cbd5e1',
              borderBottom: isActive ? '1px solid #ffffff' : '1px solid #cbd5e1',
              borderRadius: '2px 2px 0 0',
              cursor: 'pointer',
              position: 'relative',
              top: isActive ? '1px' : '0'
            }}
          >
            {sheet.bookmark && <Bookmark size={11} color="#0284c7" fill="#0284c7" />}

            {isEditing ? (
              <input
                type="text"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleFinishRename(sheet.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishRename(sheet.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                style={{
                  border: '1px solid #0284c7',
                  borderRadius: '2px',
                  fontSize: '10.5px',
                  padding: '1px 3px',
                  width: '90px',
                  outline: 'none'
                }}
              />
            ) : (
              <span onDoubleClick={(e) => handleStartRename(sheet, e)}>
                {sheet.name}
              </span>
            )}

            {isActive && !isEditing && (
              <button
                onClick={(e) => handleStartRename(sheet, e)}
                title="Rename Viewsheet"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '1px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Edit2 size={9} />
              </button>
            )}

            {viewsheets.length > 1 && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteViewsheet) onDeleteViewsheet(sheet.id);
                }}
                title="Delete Viewsheet"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '1px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={10} />
              </button>
            )}
          </div>
        );
      })}

      {/* Add New Viewsheet Tab '+' button */}
      <button
        onClick={() => onAddViewsheet && onAddViewsheet()}
        title="Add New Viewsheet"
        style={{
          width: '20px',
          height: '19px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '2px',
          cursor: 'pointer',
          color: '#475569',
          marginLeft: '2px'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

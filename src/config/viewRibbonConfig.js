/**
 * Mastercam 2018 VIEW Tab Ribbon Configuration
 * 1:1 Schema matching official Mastercam 2018 View Ribbon.
 * Completely data-driven with 8 functional groups and 32 tools.
 */

export const VIEW_RIBBON_CONFIG = [
  // 1. ZOOM GROUP
  {
    id: 'zoom',
    title: 'Zoom',
    hasLauncher: false,
    items: [
      {
        id: 'zoom_fit',
        type: 'large',
        label: 'Fit',
        icon: 'ViewZoomFit',
        action: 'view_zoom_fit',
        tooltip: 'Fit Entire Geometry into Viewport (Alt+F1)'
      },
      {
        id: 'zoom_stack',
        type: 'stack',
        rows: 3,
        items: [
          {
            id: 'zoom_window',
            label: 'Window',
            icon: 'ViewZoomWindow',
            action: 'view_zoom_window',
            hasDropdown: true,
            tooltip: 'Window Drag Zoom into Selected Region',
            dropdownItems: [
              { id: 'window_box', label: 'Window Area Box' },
              { id: 'target_center', label: 'Target Center Zoom' },
              { id: 'dynamic_zoom', label: 'Dynamic Zoom' }
            ]
          },
          {
            id: 'unzoom_50',
            label: 'Unzoom 50%',
            icon: 'ViewUnzoom50',
            action: 'view_unzoom_50',
            tooltip: 'Zoom Out Viewport by 50% (F2)'
          },
          {
            id: 'unzoom_80',
            label: 'Unzoom 80%',
            icon: 'ViewUnzoom80',
            action: 'view_unzoom_80',
            tooltip: 'Zoom Out Viewport by 80%'
          }
        ]
      }
    ]
  },

  // 2. GRAPHICS VIEW GROUP
  {
    id: 'graphics_view',
    title: 'Graphics View',
    hasLauncher: false,
    items: [
      {
        id: 'gv_top',
        type: 'large',
        label: 'Top',
        icon: 'ViewGvTop',
        action: 'view_gv_top',
        tooltip: 'Top View (G17 XY Plane - Alt+1)'
      },
      {
        id: 'gv_stack',
        type: 'stack',
        rows: 3,
        items: [
          {
            id: 'gv_iso',
            label: 'Isometric',
            icon: 'ViewGvIso',
            action: 'view_gv_iso',
            hasDropdown: true,
            tooltip: 'Isometric Camera Projection (Alt+7)',
            dropdownItems: [
              { id: 'iso_wcs', label: 'Isometric (WCS)' },
              { id: 'iso_cplane', label: 'Isometric (CPlane)' },
              { id: 'iso_tplane', label: 'Isometric (TPlane)' },
              { id: 'dimetric', label: 'Dimetric Projection' },
              { id: 'trimetric', label: 'Trimetric Projection' }
            ]
          },
          {
            id: 'gv_right',
            label: 'Right',
            icon: 'ViewGvRight',
            action: 'view_gv_right',
            hasDropdown: true,
            tooltip: 'Right View (+X / G19 Plane)',
            dropdownItems: [
              { id: 'right_pos', label: 'Right (+X / G19)' },
              { id: 'left_neg', label: 'Left (-X Plane)' }
            ]
          },
          {
            id: 'gv_front',
            label: 'Front',
            icon: 'ViewGvFront',
            action: 'view_gv_front',
            hasDropdown: true,
            tooltip: 'Front View (-Y / G18 Plane - Alt+2)',
            dropdownItems: [
              { id: 'front_neg', label: 'Front (-Y / G18)' },
              { id: 'back_pos', label: 'Back (+Y Plane)' },
              { id: 'bottom_neg', label: 'Bottom (-Z Plane)' }
            ]
          }
        ]
      }
    ]
  },

  // 3. APPEARANCE GROUP
  {
    id: 'appearance',
    title: 'Appearance',
    hasLauncher: true,
    launcherAction: 'view_appearance_launcher',
    launcherTooltip: 'Open Appearance & Shading Parameters Studio',
    items: [
      {
        id: 'app_wireframe',
        type: 'large',
        label: 'Wireframe',
        icon: 'ViewAppWireframe',
        action: 'view_app_wireframe',
        tooltip: 'Display Model as Wireframe Geometry'
      },
      {
        id: 'app_outline_shaded',
        type: 'large',
        label: 'Outline Shaded',
        icon: 'ViewAppOutlineShaded',
        action: 'view_app_outline_shaded',
        hasDropdown: true,
        tooltip: 'Outline Shaded with Silhouette Edge Polygons',
        dropdownItems: [
          { id: 'outline_shaded', label: 'Outline Shaded with Edges' },
          { id: 'filled_shaded', label: 'Smooth Shaded Surfaces' },
          { id: 'hidden_line', label: 'Hidden Line Removal' }
        ]
      },
      {
        id: 'app_materials_grid',
        type: 'appearance_grid',
        col1: [
          {
            id: 'mat_metallic',
            label: 'Metallic',
            icon: 'ViewMatMetallic',
            action: 'view_mat_metallic',
            styleType: 'metallic',
            tooltip: 'PBR Metallic Specular Material Finish'
          },
          {
            id: 'mat_plastic',
            label: 'Plastic',
            icon: 'ViewMatPlastic',
            action: 'view_mat_plastic',
            styleType: 'plastic',
            tooltip: 'Semi-Gloss Plastic Material Finish'
          },
          {
            id: 'mat_glossy',
            label: 'Glossy',
            icon: 'ViewMatGlossy',
            action: 'view_mat_glossy',
            styleType: 'glossy',
            tooltip: 'High-Gloss Polished Lacquer Finish'
          }
        ],
        col2: [
          {
            id: 'mat_translucency',
            label: 'Translucency',
            icon: 'ViewMatTranslucency',
            action: 'view_mat_translucency',
            tooltip: 'Toggle Translucency (Semi-Transparent Ghosting)'
          },
          {
            id: 'mat_backside',
            label: 'Backside',
            icon: 'ViewMatBackside',
            action: 'view_mat_backside',
            tooltip: 'Toggle Back-Facing Surface Polygon Shading'
          }
        ]
      }
    ]
  },

  // 4. MANAGERS GROUP (3 columns of checkboxes with blue borders)
  {
    id: 'managers',
    title: 'Managers',
    hasLauncher: false,
    items: [
      {
        id: 'managers_grid',
        type: 'managers_columns',
        col1: [
          {
            id: 'mgr_toolpaths',
            tabName: 'Toolpaths',
            label: 'Toolpaths',
            icon: 'ViewMgrToolpaths',
            action: 'view_mgr_toolpaths',
            tooltip: 'Toggle Toolpaths Manager Pane (Alt+O)'
          },
          {
            id: 'mgr_solids',
            tabName: 'Solids',
            label: 'Solids',
            icon: 'ViewMgrSolids',
            action: 'view_mgr_solids',
            tooltip: 'Toggle Solids & Features Manager Pane'
          },
          {
            id: 'mgr_planes',
            tabName: 'Planes',
            label: 'Planes',
            icon: 'ViewMgrPlanes',
            action: 'view_mgr_planes',
            tooltip: 'Toggle CPlanes / TPlanes / WCS Manager Pane'
          }
        ],
        col2: [
          {
            id: 'mgr_levels',
            tabName: 'Levels',
            label: 'Levels',
            icon: 'ViewMgrLevels',
            action: 'view_mgr_levels',
            tooltip: 'Toggle Levels & CAD Layers Manager Pane'
          },
          {
            id: 'mgr_multithreading',
            tabName: 'Multi-Threading',
            label: 'Multi-Threading',
            icon: 'ViewMgrMultiThreading',
            action: 'view_mgr_multithreading',
            tooltip: 'Toggle Multi-Threading Compute Status Monitor'
          },
          {
            id: 'mgr_art',
            tabName: 'Art',
            label: 'Art',
            icon: 'ViewMgrArt',
            action: 'view_mgr_art',
            disabled: true,
            tooltip: 'Mastercam Art Manager (Feature not installed)'
          }
        ],
        col3: [
          {
            id: 'mgr_groups',
            tabName: 'Groups',
            label: 'Groups',
            icon: 'ViewMgrGroups',
            action: 'view_mgr_groups',
            tooltip: 'Toggle Entity & Toolpath Groups Manager Pane'
          },
          {
            id: 'mgr_recent',
            tabName: 'Recent Functions',
            label: 'Recent Functions',
            icon: 'ViewMgrRecent',
            action: 'view_mgr_recent',
            tooltip: 'Toggle Recent Functions History Pane'
          }
        ]
      }
    ]
  },

  // 5. DISPLAY GROUP
  {
    id: 'display',
    title: 'Display',
    hasLauncher: false,
    items: [
      {
        id: 'disp_axes',
        type: 'large',
        label: 'Show Axes',
        icon: 'ViewDispAxes',
        action: 'view_disp_axes',
        hasDropdown: true,
        tooltip: 'Show / Hide 3D Coordinate World Axes (F9)',
        dropdownItems: [
          { id: 'axes_world', label: 'World Axes (XYZ)' },
          { id: 'axes_cplane', label: 'Construction Plane Axes' },
          { id: 'axes_tplane', label: 'Tool Plane Axes' }
        ]
      },
      {
        id: 'disp_gnomons',
        type: 'large',
        label: 'Show Gnomons',
        icon: 'ViewDispGnomons',
        action: 'view_disp_gnomons',
        hasDropdown: true,
        tooltip: 'Show / Hide 3D Coordinate Triad Gnomons',
        dropdownItems: [
          { id: 'gnomon_wcs', label: 'WCS Dynamic Gnomon' },
          { id: 'gnomon_origin', label: 'Part Origin Gnomon' },
          { id: 'gnomon_viewport', label: 'Viewport Corner Triad' }
        ]
      }
    ]
  },

  // 6. GRID GROUP
  {
    id: 'grid',
    title: 'Grid',
    hasLauncher: true,
    launcherAction: 'view_grid_launcher',
    launcherTooltip: 'Open Grid Setup & Snapping Parameters',
    items: [
      {
        id: 'grid_show',
        type: 'large',
        label: 'Show Grid',
        icon: 'ViewGridShow',
        action: 'view_grid_show',
        hasDropdown: true,
        tooltip: 'Show / Hide Active Grid Plane (Alt+G)',
        dropdownItems: [
          { id: 'grid_xy', label: 'Active CPlane Grid (XY)' },
          { id: 'grid_world', label: 'World XY Ground Plane' },
          { id: 'grid_xz', label: 'XZ Elevation Grid' },
          { id: 'grid_yz', label: 'YZ Profile Grid' }
        ]
      },
      {
        id: 'grid_snap',
        type: 'large',
        label: 'Snap to Grid',
        icon: 'ViewGridSnap',
        action: 'view_grid_snap',
        hasDropdown: true,
        tooltip: 'Toggle Cursor Snapping to Grid Intersections',
        dropdownItems: [
          { id: 'snap_1', label: 'Snap Pitch: 1.0 mm' },
          { id: 'snap_5', label: 'Snap Pitch: 5.0 mm' },
          { id: 'snap_10', label: 'Snap Pitch: 10.0 mm' },
          { id: 'snap_geom', label: 'Snap to Geometry Intersections' }
        ]
      }
    ]
  },

  // 7. CONTROLLER GROUP
  {
    id: 'controller',
    title: 'Controller',
    hasLauncher: false,
    items: [
      {
        id: 'ctrl_rotation_pos',
        type: 'large',
        label: 'Rotation Position',
        icon: 'ViewControllerRotation',
        action: 'view_controller_rotation_position',
        tooltip: 'Set 3D View Rotation Center / Dynamic Pivot'
      }
    ]
  },

  // 8. VIEWSHEETS GROUP
  {
    id: 'viewsheets',
    title: 'Viewsheets',
    hasLauncher: false,
    items: [
      {
        id: 'viewsheet_on_off',
        type: 'large',
        label: 'On/Off',
        icon: 'ViewsheetOnOff',
        action: 'view_viewsheet_toggle',
        tooltip: 'Toggle Bottom Viewsheets Strip Display'
      },
      {
        id: 'viewsheet_stack',
        type: 'stack',
        rows: 3,
        items: [
          {
            id: 'viewsheet_new',
            label: 'New',
            icon: 'ViewsheetNew',
            action: 'view_viewsheet_new',
            hasDropdown: true,
            tooltip: 'Create New Viewsheet Bookmark',
            dropdownItems: [
              { id: 'new_viewsheet', label: 'New Blank Viewsheet' },
              { id: 'dup_viewsheet', label: 'Duplicate Current Viewsheet' }
            ]
          },
          {
            id: 'viewsheet_save',
            label: 'Save Bookmark',
            icon: 'ViewsheetSaveBookmark',
            action: 'view_viewsheet_save',
            tooltip: 'Save Active View Orientation, Zoom, and Layers to Current Viewsheet'
          },
          {
            id: 'viewsheet_restore',
            label: 'Restore Bookmark',
            icon: 'ViewsheetRestoreBookmark',
            action: 'view_viewsheet_restore',
            tooltip: 'Restore Viewsheet Bookmark Configuration'
          }
        ]
      }
    ]
  }
];

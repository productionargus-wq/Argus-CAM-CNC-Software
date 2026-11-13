/**
 * Mastercam 2018 TOOLPATHS Tab Ribbon Configuration
 * 1:1 Schema matching official Mastercam 2018 Toolpaths Ribbon.
 * Completely data-driven with 5 functional groups and 29 tools.
 */

export const TOOLPATHS_RIBBON_CONFIG = [
  // 1. 2D GROUP (Gallery with Primary Buttons + More Dropdown)
  {
    id: 'group_2d',
    title: '2D',
    type: 'gallery',
    primaryItems: [
      {
        id: '2d_contour',
        label: 'Contour',
        icon: 'Tp2dContour',
        action: 'tp_2d_contour',
        opType: 'contour',
        tooltip: '2D Contour Milling around Part Perimeter'
      },
      {
        id: '2d_drill',
        label: 'Drill',
        icon: 'Tp2dDrill',
        action: 'tp_2d_drill',
        opType: 'drilling',
        tooltip: '2D Hole Drilling, Pecks, and Counter-Bores'
      },
      {
        id: '2d_dynamic',
        label: 'Dynamic ...',
        icon: 'Tp2dDynamic',
        action: 'tp_2d_dynamic',
        opType: 'adaptive',
        hasBadge: true,
        tooltip: '2D Dynamic High-Speed Trochoidal Roughing'
      },
      {
        id: '2d_face',
        label: 'Face',
        icon: 'Tp2dFace',
        action: 'tp_2d_face',
        opType: 'facing',
        hasBadge: true,
        tooltip: '2D Planar Face Milling Passes'
      }
    ],
    galleryMoreItems: [
      {
        id: '2d_pocket',
        label: 'Pocket',
        icon: 'Tp2dPocket',
        action: 'tp_2d_pocket',
        opType: 'pocket',
        tooltip: '2D Cavity Pocket Milling'
      },
      {
        id: '2d_slot_mill',
        label: 'Slot Mill',
        icon: 'Tp2dSlotMill',
        action: 'tp_2d_slot_mill',
        opType: 'contour',
        tooltip: '2D Slot & Keyway Milling'
      },
      {
        id: '2d_helix_bore',
        label: 'Helix Bore',
        icon: 'Tp2dHelixBore',
        action: 'tp_2d_helix_bore',
        opType: 'drilling',
        tooltip: 'Circular Helical Plunge Bore'
      },
      {
        id: '2d_thread_mill',
        label: 'Thread Mill',
        icon: 'Tp2dThreadMill',
        action: 'tp_2d_thread_mill',
        opType: 'contour',
        tooltip: 'Internal & External Helical Thread Milling'
      },
      {
        id: '2d_circle_mill',
        label: 'Circle Mill',
        icon: 'Tp2dCircleMill',
        action: 'tp_2d_circle_mill',
        opType: 'circlemill',
        tooltip: 'Circular Boss & Counterbore Milling'
      },
      {
        id: '2d_engrave',
        label: 'Engrave',
        icon: 'Tp2dEngrave',
        action: 'tp_2d_engrave',
        opType: 'contour',
        tooltip: '2D V-Carve & Text Engraving'
      },
      {
        id: '2d_chamfer',
        label: 'Model Chamfer',
        icon: 'Tp2dContour',
        action: 'tp_2d_chamfer',
        opType: 'chamfer',
        tooltip: '2D / 3D Model Edge Deburring & 45° Chamfering'
      },
      {
        id: '2d_tap',
        label: 'Rigid Tap (G84)',
        icon: 'Tp2dDrill',
        action: 'tp_2d_tap',
        opType: 'tap',
        tooltip: 'Synchronized Spindle Rigid & Floating Tapping'
      }
    ]
  },

  // 2. 3D GROUP (Gallery with Primary Buttons + More Dropdown)
  {
    id: 'group_3d',
    title: '3D',
    type: 'gallery',
    primaryItems: [
      {
        id: '3d_optirough',
        label: 'OptiRough',
        icon: 'Tp3dOptiRough',
        action: 'tp_3d_optirough',
        opType: 'adaptive',
        hasBadge: true,
        tooltip: '3D OptiRough High-Speed Constant Engagement Roughing'
      },
      {
        id: '3d_pocket',
        label: 'Pocket',
        icon: 'Tp3dPocket',
        action: 'tp_3d_pocket',
        opType: 'pocket',
        tooltip: '3D Rough Cavity & Surface Pocketing'
      },
      {
        id: '3d_project',
        label: 'Project',
        icon: 'Tp3dProject',
        action: 'tp_3d_project',
        opType: 'pencil',
        tooltip: 'Project Toolpath Curves onto 3D Geometry'
      },
      {
        id: '3d_finish_flowline',
        label: 'Flowline',
        icon: 'Tp3dFlowline',
        action: 'tp_3d_finish_flowline',
        opType: 'surface_finish_flowline',
        hasBadge: true,
        tooltip: 'Surface Finish Flowline across Selected Drive Faces & Surfaces'
      }
    ],
    galleryMoreItems: [
      {
        id: '3d_parallel',
        label: 'Parallel',
        icon: 'Tp3dParallel',
        action: 'tp_3d_parallel',
        opType: 'waterline',
        tooltip: '3D Surface Parallel Finishing'
      },
      {
        id: '3d_finish_contour',
        label: 'Finish Contour',
        icon: 'Tp3dWaterline',
        action: 'tp_3d_finish_contour',
        opType: 'surface_finish_contour',
        tooltip: 'Surface Finish Contour around 3D Extruded / Drive Surfaces'
      },
      {
        id: '3d_finish_pocket',
        label: 'Finish Pocket',
        icon: 'Tp3dPocket',
        action: 'tp_3d_finish_pocket',
        opType: 'surface_finish_pocket',
        tooltip: 'Surface Finish Pocket Clearing inside 3D Extruded / Drive Cavities'
      },
      {
        id: '3d_equal_scallop',
        label: 'Equal Scallop',
        icon: 'Tp3dEqualScallop',
        action: 'tp_3d_equal_scallop',
        opType: 'waterline',
        tooltip: 'Constant Scallop Height Finishing'
      },
      {
        id: '3d_waterline',
        label: 'Waterline',
        icon: 'Tp3dWaterline',
        action: 'tp_3d_waterline',
        opType: 'waterline',
        tooltip: 'Constant Z Contour Waterline Finishing'
      },
      {
        id: '3d_spiral',
        label: 'Spiral',
        icon: 'Tp3dSpiral',
        action: 'tp_3d_spiral',
        opType: 'waterline',
        tooltip: 'Continuous Spiral Surface Finishing'
      },
      {
        id: '3d_radial',
        label: 'Radial',
        icon: 'Tp3dRadial',
        action: 'tp_3d_radial',
        opType: 'waterline',
        tooltip: 'Radial Pattern Surface Finishing'
      },
      {
        id: '3d_pencil',
        label: 'Pencil',
        icon: 'Tp3dPencil',
        action: 'tp_3d_pencil',
        opType: 'pencil',
        tooltip: 'Pencil Trace Fillet Corner Cleanup'
      },
      {
        id: '3d_hybrid',
        label: 'Hybrid',
        icon: 'Tp3dHybrid',
        action: 'tp_3d_hybrid',
        opType: 'waterline',
        tooltip: 'Combined Steep Waterline & Shallow Scallop'
      }
    ]
  },

  // 3. MULTIAXIS GROUP (Gallery with Primary Buttons + More Dropdown)
  {
    id: 'group_multiaxis',
    title: 'Multiaxis',
    type: 'gallery',
    primaryItems: [
      {
        id: 'multi_curve',
        label: 'Curve',
        icon: 'TpMultiCurve',
        action: 'tp_multi_curve',
        opType: 'pencil',
        tooltip: '5-Axis Curve Machining along Surface Normals'
      },
      {
        id: 'multi_swarf',
        label: 'Swarf Milli...',
        icon: 'TpMultiSwarf',
        action: 'tp_multi_swarf',
        opType: 'swarf',
        tooltip: '5-Axis Swarf Flank Wall Milling'
      },
      {
        id: 'multi_parallel',
        label: 'Parallel',
        icon: 'TpMultiParallel',
        action: 'tp_multi_parallel',
        opType: 'waterline',
        tooltip: '5-Axis Parallel Surface Finishing'
      },
      {
        id: 'multi_drill',
        label: 'Drill',
        icon: 'TpMultiDrill',
        action: 'tp_multi_drill',
        opType: 'drilling',
        tooltip: '5-Axis Radial & Compound Angled Drilling'
      }
    ],
    galleryMoreItems: [
      {
        id: 'multi_morph',
        label: 'Morph',
        icon: 'TpMultiMorph',
        action: 'tp_multi_morph',
        opType: 'pencil',
        tooltip: 'Morph between Two Curves / Surfaces'
      },
      {
        id: 'multi_port',
        label: 'Port Expert',
        icon: 'TpMultiPort',
        action: 'tp_multi_port',
        opType: 'swarf',
        tooltip: '5-Axis Engine Cylinder Head Port Machining'
      },
      {
        id: 'multi_blade',
        label: 'Blade Expert',
        icon: 'TpMultiBlade',
        action: 'tp_multi_blade',
        opType: 'swarf',
        tooltip: '5-Axis Impeller & Blisk Blade Milling'
      },
      {
        id: 'multi_rotary',
        label: 'Rotary Advanced',
        icon: 'TpMultiRotary',
        action: 'tp_multi_rotary',
        opType: 'swarf',
        tooltip: '4-Axis Simultaneous Rotary Cylinder Machining'
      }
    ]
  },

  // 4. STOCK GROUP
  {
    id: 'group_stock',
    title: 'Stock',
    type: 'standard',
    items: [
      {
        id: 'stock_shading',
        type: 'large',
        label: 'Stock\nShading',
        icon: 'TpStockShading',
        action: 'tp_stock_shading',
        tooltip: 'Toggle Stock Shading Display (Solid / Translucent)'
      },
      {
        id: 'stock_display',
        type: 'large',
        label: 'Stock\nDisplay',
        icon: 'TpStockDisplay',
        action: 'tp_stock_display',
        defaultActive: true,
        tooltip: 'Toggle Stock Bounding Box in Viewport'
      },
      {
        id: 'stock_model',
        type: 'large',
        label: 'Stock\nModel',
        icon: 'TpStockModel',
        action: 'tp_stock_model',
        hasDropdown: true,
        tooltip: 'Configure Stock Model & Compare with Workpiece',
        dropdownItems: [
          { id: 'create_model', label: 'Create Stock Model' },
          { id: 'compare_stock', label: 'Compare Stock to Part' },
          { id: 'import_stock', label: 'Import Stock from File (STL)' }
        ]
      }
    ]
  },

  // 5. UTILITIES GROUP
  {
    id: 'group_utilities',
    title: 'Utilities',
    type: 'utilities_composite',
    toolManagerItem: {
      id: 'util_tool_manager',
      label: 'Tool\nManager',
      icon: 'TpUtilToolManager',
      action: 'tp_util_tool_manager',
      tooltip: 'Open Mill/Lathe Cutting Tool Library & Assembly Studio'
    },
    labeledStack: [
      {
        id: 'util_probe',
        label: 'Probe',
        icon: 'TpUtilProbe',
        action: 'tp_util_probe',
        tooltip: 'Touch Probing Calibration & Inspection Studio'
      },
      {
        id: 'util_multiaxis_linking',
        label: 'Multiaxis Linking',
        icon: 'TpUtilMultiaxisLinking',
        action: 'tp_util_multiaxis_linking',
        tooltip: '5-Axis Safety Clearance Planes & Retract Linking'
      },
      {
        id: 'util_transform',
        label: 'Toolpath Transform',
        icon: 'TpUtilTransform',
        action: 'tp_util_transform',
        tooltip: 'Toolpath Pattern Matrix, Mirror, and Rotary Indexing'
      }
    ],
    iconOnlyStack: [
      {
        id: 'util_check_surface',
        icon: 'TpUtilCheckSurface',
        action: 'tp_util_check',
        tooltip: 'Check Surface Gouging & Workholding Vise Collisions'
      },
      {
        id: 'util_trim',
        icon: 'TpUtilTrim',
        action: 'tp_util_trim',
        tooltip: 'Trim Toolpath Cutter Paths against Boundaries'
      },
      {
        id: 'util_filter',
        icon: 'TpUtilFilter',
        action: 'tp_util_filter',
        tooltip: 'HSM Look-Ahead Tolerance & Arc Filtering Studio'
      }
    ]
  },

  // 6. VERIFY & POST GROUP (Standard Mastercam Simulation & Code Generation)
  {
    id: 'group_verify',
    title: 'Verify',
    type: 'standard',
    items: [
      {
        id: 'verify_backplot',
        type: 'large',
        label: 'Backplot',
        icon: 'TpVerifyBackplot',
        action: 'tp_verify_backplot',
        tooltip: 'Backplot Selected Operations (Alt+S) - 3D Wireframe Simulation'
      },
      {
        id: 'verify_solid',
        type: 'large',
        label: 'Verify',
        icon: 'TpVerifySolid',
        action: 'tp_verify_solid',
        tooltip: 'Verify Selected Operations - 3D Solid Material Removal Simulation'
      },
      {
        id: 'verify_post',
        type: 'large',
        label: 'Post (G1)',
        icon: 'TpVerifyPost',
        action: 'tp_verify_post',
        tooltip: 'Post Process Selected Operations to CNC G-Code (G1)'
      },
      {
        id: 'flowline_wizard_launch',
        type: 'large',
        label: 'Flowline\nWizard',
        icon: 'Tp3dFlowline',
        action: 'tp_start_flowline_wizard',
        hasBadge: true,
        tooltip: 'Launch guided step-by-step Flowline finishing wizard from scratch'
      }
    ]
  }
];

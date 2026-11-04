/**
 * Declarative configuration schema for the Mastercam 2018 Drafting Tab Ribbon
 * Ensures no hardcoded UI - completely data-driven layout, icons, actions, and dropdowns.
 */

export const DRAFTING_RIBBON_CONFIG = [
  {
    id: 'dimension',
    title: 'Dimension',
    hasLauncher: true,
    launcherAction: 'drafting_dimension_settings',
    items: [
      {
        id: 'smart_dimension',
        type: 'large',
        label: 'Smart\nDimension',
        icon: 'SmartDimension',
        action: 'drafting_smart_dimension',
        hasDropdown: true,
        dropdownItems: [
          { id: 'smart_auto', label: 'Auto-Detect Geometry', action: 'drafting_smart_dimension' },
          { id: 'smart_horizontal', label: 'Force Horizontal Dimension', action: 'drafting_dim_horizontal' },
          { id: 'smart_vertical', label: 'Force Vertical Dimension', action: 'drafting_dim_vertical' },
          { id: 'smart_aligned', label: 'Force Aligned Dimension', action: 'drafting_dim_parallel' }
        ],
        tooltip: 'Smart Dimension: Automatically detects entity type (linear, circular, angular, arc)'
      },
      {
        id: 'dim_stack_1',
        type: 'stack',
        items: [
          {
            id: 'horizontal',
            label: 'Horizontal',
            icon: 'DimHorizontal',
            action: 'drafting_dim_horizontal',
            tooltip: 'Horizontal Linear Dimension'
          },
          {
            id: 'circular',
            label: 'Circular',
            icon: 'DimCircular',
            action: 'drafting_dim_circular',
            tooltip: 'Circular Diameter / Radial Callout'
          },
          {
            id: 'point',
            label: 'Point',
            icon: 'DimPoint',
            action: 'drafting_dim_point',
            tooltip: 'Point Coordinate Location Callout (X, Y, Z)'
          }
        ]
      },
      {
        id: 'dim_stack_2',
        type: 'stack',
        items: [
          {
            id: 'angular',
            label: 'Angular',
            icon: 'DimAngular',
            action: 'drafting_dim_angular',
            tooltip: 'Angular Dimension Between Lines or Arcs'
          },
          {
            id: 'parallel',
            label: 'Parallel',
            icon: 'DimParallel',
            action: 'drafting_dim_parallel',
            tooltip: 'Aligned Parallel Dimension Along Edge'
          },
          {
            id: 'perpendicular',
            label: 'Perpendicular',
            icon: 'DimPerpendicular',
            action: 'drafting_dim_perpendicular',
            tooltip: 'Perpendicular Distance Dimension'
          }
        ]
      },
      {
        id: 'dim_stack_3',
        type: 'stack',
        items: [
          {
            id: 'baseline',
            label: 'Baseline',
            icon: 'DimBaseline',
            action: 'drafting_dim_baseline',
            tooltip: 'Stacked Baseline Dimensions from Common Datum'
          },
          {
            id: 'chained',
            label: 'Chained',
            icon: 'DimChained',
            action: 'drafting_dim_chained',
            tooltip: 'Continuous Chained Series Dimensions'
          },
          {
            id: 'tangent',
            label: 'Tangent',
            icon: 'DimTangent',
            action: 'drafting_dim_tangent',
            tooltip: 'Tangent Dimension Between Curves / Arcs'
          }
        ]
      }
    ]
  },
  {
    id: 'ordinate',
    title: 'Ordinate',
    items: [
      {
        id: 'ord_stack_1',
        type: 'stack',
        items: [
          {
            id: 'ord_horizontal',
            label: 'Horizontal',
            icon: 'OrdHorizontal',
            action: 'drafting_ord_horizontal',
            tooltip: 'Horizontal Ordinate Dimension from Datum 0.0'
          },
          {
            id: 'ord_vertical',
            label: 'Vertical',
            icon: 'OrdVertical',
            action: 'drafting_ord_vertical',
            tooltip: 'Vertical Ordinate Dimension from Datum 0.0'
          },
          {
            id: 'ord_add_existing',
            label: 'Add To Existing',
            icon: 'OrdAddExisting',
            action: 'drafting_ord_add_existing',
            tooltip: 'Add Point to Existing Ordinate Dimension Set'
          }
        ]
      },
      {
        id: 'ord_stack_2',
        type: 'stack',
        items: [
          {
            id: 'ord_window',
            label: 'Window',
            icon: 'OrdWindow',
            action: 'drafting_ord_window',
            tooltip: 'Window Select Multiple Entities for Ordinate Dimensioning'
          },
          {
            id: 'ord_align',
            label: 'Align',
            icon: 'OrdAlign',
            action: 'drafting_ord_align',
            tooltip: 'Align Ordinate Dimension Text Offsets'
          },
          {
            id: 'ord_parallel',
            label: 'Parallel',
            icon: 'OrdParallel',
            action: 'drafting_ord_parallel',
            tooltip: 'Parallel Inclined Ordinate Dimensions'
          }
        ]
      }
    ]
  },
  {
    id: 'annotate',
    title: 'Annotate',
    items: [
      {
        id: 'note',
        type: 'large',
        label: 'Note',
        icon: 'Note',
        action: 'drafting_note',
        tooltip: 'Multiline Engineering Note & Text Label'
      },
      {
        id: 'anno_stack_1',
        type: 'stack',
        items: [
          {
            id: 'cross_hatch',
            label: 'Cross Hatch',
            icon: 'CrossHatch',
            action: 'drafting_cross_hatch',
            tooltip: 'ANSI Cross-Hatching Pattern on Section Plane'
          },
          {
            id: 'leader',
            label: 'Leader',
            icon: 'Leader',
            action: 'drafting_leader',
            tooltip: 'Machining Operator Leader Note Callout'
          },
          {
            id: 'witness_line',
            label: 'Witness Line',
            icon: 'WitnessLine',
            action: 'drafting_witness_line',
            tooltip: 'Extension Witness Line with CAD Gap'
          }
        ]
      }
    ]
  },
  {
    id: 'regenerate',
    title: 'Regenerate',
    items: [
      {
        id: 'automatic',
        type: 'large',
        label: 'Automatic',
        icon: 'RegenAutomatic',
        action: 'drafting_regen_automatic',
        tooltip: 'Automatic Real-Time Dimension Regeneration'
      },
      {
        id: 'regen_stack_1',
        type: 'stack',
        items: [
          {
            id: 'validate',
            label: 'Validate',
            icon: 'RegenValidate',
            action: 'drafting_regen_validate',
            tooltip: 'Validate Dimension Associativity to 3D Workpiece'
          },
          {
            id: 'select',
            label: 'Select',
            icon: 'RegenSelect',
            action: 'drafting_regen_select',
            tooltip: 'Select Specific Dimensions to Regenerate'
          },
          {
            id: 'all',
            label: 'All',
            icon: 'RegenAll',
            action: 'drafting_regen_all',
            tooltip: 'Regenerate All Drawing Dimensions and Notes'
          }
        ]
      }
    ]
  },
  {
    id: 'modify',
    title: 'Modify',
    items: [
      {
        id: 'align_note',
        type: 'large',
        label: 'Align\nNote',
        icon: 'AlignNote',
        action: 'drafting_align_note',
        tooltip: 'Align Multiple Notes and Dimension Leaders'
      },
      {
        id: 'multi_edit',
        type: 'large',
        label: 'Multi-Edit',
        icon: 'MultiEdit',
        action: 'drafting_multi_edit',
        tooltip: 'Multi-Edit Dimension Values, Tolerances, and Text Styles'
      },
      {
        id: 'break_into_lines',
        type: 'large',
        label: 'Break\nInto Lines',
        icon: 'BreakIntoLines',
        action: 'drafting_break_into_lines',
        tooltip: 'Explode Dimensions into Discrete Wireframe Lines and Text'
      }
    ]
  }
];

/**
 * Declarative configuration schema for the Mastercam 2018 Transform Tab Ribbon
 * Ensures no hardcoded UI - completely data-driven layout, icons, and actions.
 */

export const TRANSFORM_RIBBON_CONFIG = [
  {
    id: 'position',
    title: 'Position',
    items: [
      {
        id: 'dynamic',
        type: 'large',
        label: 'Dynamic',
        icon: 'Dynamic',
        action: 'transform_dynamic',
        tooltip: 'Dynamic 3D Gnomon Translate & Rotate Interactive Manipulator'
      },
      {
        id: 'translate',
        type: 'large',
        label: 'Translate',
        icon: 'Translate',
        action: 'transform_translate',
        tooltip: 'Translate Workpiece / Geometry Along 3D Vector (Move or Copy)'
      },
      {
        id: 'rotate',
        type: 'large',
        label: 'Rotate',
        icon: 'Rotate',
        action: 'transform_rotate',
        tooltip: 'Rotate Workpiece Around Selected Axis or Center Pivot Point'
      },
      {
        id: 'project',
        type: 'large',
        label: 'Project',
        icon: 'Project',
        action: 'transform_project',
        tooltip: 'Project 2D/3D Wireframe Geometry onto Plane or Curved Solid Surface'
      },
      {
        id: 'move_to_origin',
        type: 'large',
        label: 'Move to\nOrigin',
        icon: 'MoveToOrigin',
        action: 'transform_move_to_origin',
        tooltip: 'Move Workpiece Datum Directly to WCS Origin (0,0,0)'
      },
      {
        id: 'mirror',
        type: 'large',
        label: 'Mirror',
        icon: 'Mirror',
        action: 'transform_mirror',
        tooltip: 'Mirror Left/Right Hand Symmetrical Pairs Across Principal Plane'
      },
      {
        id: 'roll',
        type: 'large',
        label: 'Roll',
        icon: 'Roll',
        action: 'transform_roll',
        tooltip: 'Roll / Wrap Flat Geometry Around Cylindrical Rotary Surface'
      }
    ]
  },
  {
    id: 'offset',
    title: 'Offset',
    items: [
      {
        id: 'offset_entity',
        type: 'large',
        label: 'Entity',
        icon: 'OffsetEntity',
        action: 'transform_offset_entity',
        tooltip: 'Offset Single Wireframe Entity by Distance'
      },
      {
        id: 'offset_chains',
        type: 'large',
        label: 'Chains',
        icon: 'OffsetChains',
        action: 'transform_offset_chains',
        tooltip: 'Offset Tangent Chain of Curves / Boundary Profiles'
      }
    ]
  },
  {
    id: 'layout',
    title: 'Layout',
    items: [
      {
        id: 'layout_stack',
        type: 'stack',
        items: [
          {
            id: 'geometry_nesting',
            label: 'Geometry Nesting',
            icon: 'GeometryNesting',
            action: 'transform_geometry_nesting',
            tooltip: 'Open CNC True-Shape Sheet Nesting Studio'
          },
          {
            id: 'rectangular_array',
            label: 'Rectangular Array',
            icon: 'RectangularArray',
            action: 'transform_rectangular_array',
            tooltip: 'Create Rectangular Grid Matrix Array Pattern'
          },
          {
            id: 'distribute',
            label: 'Distribute',
            icon: 'Distribute',
            action: 'transform_distribute',
            tooltip: 'Distribute Multiple Entities Evenly Across Span'
          }
        ]
      }
    ]
  },
  {
    id: 'size',
    title: 'Size',
    items: [
      {
        id: 'stretch',
        type: 'large',
        label: 'Stretch',
        icon: 'Stretch',
        action: 'transform_stretch',
        tooltip: 'Stretch Selected Geometry by Vector Boundary'
      },
      {
        id: 'scale',
        type: 'large',
        label: 'Scale',
        icon: 'Scale',
        action: 'transform_scale',
        tooltip: 'Scale Factor & Casting Shrinkage Compensation'
      }
    ]
  }
];

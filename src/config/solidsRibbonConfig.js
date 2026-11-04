/**
 * Declarative configuration schema for the Mastercam 2018 Solids Tab Ribbon
 * Ensures no hardcoded UI - completely data-driven layout, icons, actions, and dropdowns.
 */

export const SOLIDS_RIBBON_CONFIG = [
  {
    id: 'simple',
    title: 'Simple',
    items: [
      {
        id: 'cylinder',
        type: 'large',
        label: 'Cylinder',
        icon: 'SolidCylinder',
        action: 'solid_cylinder',
        tooltip: 'Create Parametric 3D Cylindrical Solid Billet'
      },
      {
        id: 'block',
        type: 'large',
        label: 'Block',
        icon: 'SolidBlock',
        action: 'solid_block',
        tooltip: 'Create Parametric 3D Rectangular Solid Billet'
      },
      {
        id: 'simple_stack',
        type: 'stack',
        items: [
          {
            id: 'sphere',
            label: 'Sphere',
            icon: 'SolidSphere',
            action: 'solid_sphere',
            tooltip: 'Create Parametric Spherical Solid Body'
          },
          {
            id: 'cone',
            label: 'Cone',
            icon: 'SolidCone',
            action: 'solid_cone',
            tooltip: 'Create Parametric Conical Frustum Solid Body'
          },
          {
            id: 'torus',
            label: 'Torus',
            icon: 'SolidTorus',
            action: 'solid_torus',
            tooltip: 'Create Parametric Torus Ring Solid Body'
          }
        ]
      }
    ]
  },
  {
    id: 'create',
    title: 'Create',
    items: [
      {
        id: 'extrude',
        type: 'large',
        label: 'Extrude',
        icon: 'SolidExtrude',
        action: 'solid_extrude',
        tooltip: 'Extrude 2D Wireframe Profile into 3D Solid Body'
      },
      {
        id: 'create_stack_1',
        type: 'stack',
        items: [
          {
            id: 'revolve',
            label: 'Revolve',
            icon: 'SolidRevolve',
            action: 'solid_revolve',
            tooltip: 'Revolve Profile Curve Around Axis to Create Turned Solid'
          },
          {
            id: 'loft',
            label: 'Loft',
            icon: 'SolidLoft',
            action: 'solid_loft',
            tooltip: 'Loft Solid Body Blending Multiple Cross-Section Wireframes'
          },
          {
            id: 'sweep',
            label: 'Sweep',
            icon: 'SolidSweep',
            action: 'solid_sweep',
            tooltip: 'Sweep Profile Along 3D Guide Trajectory into Solid'
          }
        ]
      },
      {
        id: 'boolean',
        type: 'large',
        label: 'Boolean',
        icon: 'SolidBoolean',
        action: 'solid_boolean',
        tooltip: 'Perform CSG Boolean Operations (Union, Cut/Subtract, Intersect)'
      },
      {
        id: 'impression',
        type: 'large',
        label: 'Impression',
        icon: 'SolidImpression',
        action: 'solid_impression',
        tooltip: 'Create Mold Cavity / Core Stamp Impression in Billet'
      },
      {
        id: 'create_stack_2',
        type: 'stack',
        items: [
          {
            id: 'pattern_rect',
            label: 'Rectangular Pattern',
            icon: 'RectPattern',
            action: 'solid_pattern_rect',
            tooltip: 'Create Rectangular Grid Pattern of Solid Features / Holes'
          },
          {
            id: 'pattern_circ',
            label: 'Circular Pattern',
            icon: 'CircPattern',
            action: 'solid_pattern_circ',
            tooltip: 'Create Radial / Circular Pitch Circle Pattern of Solid Features'
          },
          {
            id: 'pattern_manual',
            label: 'Manual Pattern',
            icon: 'ManualPattern',
            action: 'solid_pattern_manual',
            tooltip: 'Place Pattern Instances at Arbitrary Coordinate Locations'
          }
        ]
      },
      {
        id: 'from_surfaces',
        type: 'large',
        label: 'From\nSurfaces',
        icon: 'FromSurfaces',
        action: 'solid_from_surfaces',
        tooltip: 'Stitch & Knit Connected Surface Sheets into Watertight Solid Body'
      }
    ]
  },
  {
    id: 'modify',
    title: 'Modify',
    items: [
      {
        id: 'constant_fillet',
        type: 'large',
        label: 'Constant\nFillet',
        icon: 'ConstantFillet',
        action: 'solid_fillet',
        hasDropdown: true,
        dropdownItems: [
          { id: 'fillet_constant', label: 'Constant Fillet', action: 'solid_fillet' },
          { id: 'fillet_variable', label: 'Variable Radius Fillet', action: 'solid_fillet' },
          { id: 'fillet_face', label: 'Face Blend Fillet', action: 'solid_fillet' },
          { id: 'fillet_full_round', label: 'Full Round Fillet', action: 'solid_fillet' }
        ],
        tooltip: 'Blend Solid Edges with Constant Radius Fillet'
      },
      {
        id: 'one_distance_chamfer',
        type: 'large',
        label: 'One Distance\nChamfer',
        icon: 'OneDistanceChamfer',
        action: 'solid_chamfer',
        hasDropdown: true,
        dropdownItems: [
          { id: 'chamfer_one_dist', label: 'One Distance Chamfer (45°)', action: 'solid_chamfer' },
          { id: 'chamfer_two_dist', label: 'Two Distance Chamfer', action: 'solid_chamfer' },
          { id: 'chamfer_dist_angle', label: 'Distance and Angle Chamfer', action: 'solid_chamfer' }
        ],
        tooltip: 'Create Flat Bevel Chamfer on Solid Edges'
      },
      {
        id: 'modify_stack',
        type: 'stack',
        items: [
          {
            id: 'shell',
            label: 'Shell',
            icon: 'Shell',
            action: 'solid_shell',
            tooltip: 'Hollow Out Solid Body with Uniform Wall Thickness'
          },
          {
            id: 'thicken',
            label: 'Thicken',
            icon: 'Thicken',
            action: 'solid_thicken',
            tooltip: 'Thicken Surface Sheet into 3D Solid Body'
          },
          {
            id: 'draft',
            label: 'Draft',
            icon: 'SolidDraft',
            action: 'solid_draft',
            hasDropdown: true,
            dropdownItems: [
              { id: 'draft_plane', label: 'Draft by Neutral Plane', action: 'solid_draft' },
              { id: 'draft_split', label: 'Draft by Split Line', action: 'solid_draft' }
            ],
            tooltip: 'Apply Taper / Draft Angles to Solid Faces for Mold Release'
          }
        ]
      },
      {
        id: 'trim_by_plane',
        type: 'large',
        label: 'Trim by\nPlane',
        icon: 'TrimByPlane',
        action: 'solid_trim_plane',
        hasDropdown: true,
        dropdownItems: [
          { id: 'trim_plane', label: 'Trim by Plane', action: 'solid_trim_plane' },
          { id: 'trim_surface', label: 'Trim to Surface', action: 'solid_trim_plane' },
          { id: 'split_solid', label: 'Split Solid Body', action: 'solid_trim_plane' }
        ],
        tooltip: 'Slice and Trim Solid Body Along Planar Knife'
      }
    ]
  },
  {
    id: 'drawing',
    title: 'Drawing',
    items: [
      {
        id: 'drawing_layout',
        type: 'large',
        label: 'Layout',
        icon: 'DrawingLayout',
        action: 'solid_drawing_layout',
        tooltip: 'Generate 2D Multi-View Orthographic Drawing Sheet (Top, Front, Side, Isometric)'
      }
    ]
  }
];

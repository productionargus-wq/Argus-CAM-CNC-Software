/**
 * Declarative configuration schema for the Mastercam 2018 Surfaces Tab Ribbon
 * Ensures no hardcoded UI - completely data-driven layout, icons, actions, and dropdowns.
 */

export const SURFACES_RIBBON_CONFIG = [
  {
    id: 'simple',
    title: 'Simple',
    items: [
      {
        id: 'cylinder',
        type: 'large',
        label: 'Cylinder',
        icon: 'Cylinder',
        action: 'surface_cylinder',
        tooltip: 'Create 3D Cylindrical Surface Sleeve'
      },
      {
        id: 'block',
        type: 'large',
        label: 'Block',
        icon: 'Block',
        action: 'surface_block',
        tooltip: 'Create 3D Planar Block Sheet / Bounded Plane'
      },
      {
        id: 'simple_stack',
        type: 'stack',
        items: [
          {
            id: 'sphere',
            label: 'Sphere',
            icon: 'Sphere',
            action: 'surface_sphere',
            tooltip: 'Create Spherical Surface Primitive'
          },
          {
            id: 'cone',
            label: 'Cone',
            icon: 'Cone',
            action: 'surface_cone',
            tooltip: 'Create Conical Surface Primitive'
          },
          {
            id: 'torus',
            label: 'Torus',
            icon: 'Torus',
            action: 'surface_torus',
            tooltip: 'Create Torus Surface Primitive'
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
        id: 'from_solid',
        type: 'large',
        label: 'From\nSolid',
        icon: 'FromSolid',
        action: 'surface_from_solid',
        tooltip: 'Create Surface Sheets From Solid Body Faces'
      },
      {
        id: 'flat_boundary',
        type: 'large',
        label: 'Flat\nBoundary',
        icon: 'FlatBoundary',
        action: 'surface_flat_boundary',
        tooltip: 'Create Flat Boundary Surface from Closed Curves'
      },
      {
        id: 'loft',
        type: 'large',
        label: 'Loft',
        icon: 'Loft',
        action: 'surface_loft',
        tooltip: 'Create Loft Surface Blending Multiple Contours'
      },
      {
        id: 'create_stack_1',
        type: 'stack',
        items: [
          {
            id: 'extrude',
            label: 'Extrude',
            icon: 'Extrude',
            action: 'surface_extrude',
            tooltip: 'Extrude Wireframe Profile into Surface Wall'
          },
          {
            id: 'sweep',
            label: 'Sweep',
            icon: 'Sweep',
            action: 'surface_sweep',
            tooltip: 'Create Swept Surface Along Trajectory Curve'
          },
          {
            id: 'revolve',
            label: 'Revolve',
            icon: 'Revolve',
            action: 'surface_revolve',
            tooltip: 'Revolve Profile Curve Around Axis'
          }
        ]
      },
      {
        id: 'create_stack_2',
        type: 'stack',
        items: [
          {
            id: 'draft',
            label: 'Draft',
            icon: 'Draft',
            action: 'surface_draft',
            tooltip: 'Create Tapered Draft Angle Surface'
          },
          {
            id: 'net',
            label: 'Net',
            icon: 'Net',
            action: 'surface_net',
            hasDropdown: true,
            dropdownItems: [
              { id: 'net_coons', label: 'Coons Net Surface', action: 'surface_net' },
              { id: 'net_flow', label: 'Flowline Net Mesh', action: 'surface_net' }
            ],
            tooltip: 'Create Coons Patch Net Surface from Boundary Network'
          },
          {
            id: 'offset',
            label: 'Offset',
            icon: 'Offset',
            action: 'surface_offset',
            tooltip: 'Offset Surface Body by Normal Distance'
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
        id: 'trim_curves',
        type: 'large',
        label: 'Trim to\nCurves',
        icon: 'TrimCurves',
        action: 'surface_trim',
        hasDropdown: true,
        dropdownItems: [
          { id: 'trim_curves', label: 'Trim to Curves', action: 'surface_trim' },
          { id: 'trim_surfaces', label: 'Trim to Surfaces', action: 'surface_trim' },
          { id: 'trim_plane', label: 'Trim to Plane', action: 'surface_trim' }
        ],
        tooltip: 'Trim Surface to Boundary Curves'
      },
      {
        id: 'fill_holes',
        type: 'large',
        label: 'Fill\nHoles',
        icon: 'FillHoles',
        action: 'surface_fill_holes',
        tooltip: 'Fill Holes & Cap Openings in Surfaces'
      },
      {
        id: 'extend',
        type: 'large',
        label: 'Extend',
        icon: 'Extend',
        action: 'surface_extend',
        hasDropdown: true,
        dropdownItems: [
          { id: 'extend_linear', label: 'Extend Surface Linearly', action: 'surface_extend' },
          { id: 'extend_tangent', label: 'Extend Tangentially', action: 'surface_extend' }
        ],
        tooltip: 'Extend Surface Edges Tangentially'
      },
      {
        id: 'fillet',
        type: 'large',
        label: 'Fillet to\nSurfaces',
        icon: 'FilletSurfaces',
        action: 'surface_fillet',
        hasDropdown: true,
        dropdownItems: [
          { id: 'fillet_circular', label: 'Circular Fillet', action: 'surface_fillet' },
          { id: 'fillet_chamfer', label: 'Chamfer Blend', action: 'surface_fillet' }
        ],
        tooltip: 'Fillet Transition Blend Between Surfaces'
      },
      {
        id: 'modify_stack_1',
        type: 'stack',
        items: [
          {
            id: 'two_surface_blend',
            label: 'Two Surface Blend',
            icon: 'TwoSurfaceBlend',
            action: 'surface_two_blend',
            tooltip: 'Create Blend Surface Between 2 Surfaces'
          },
          {
            id: 'three_surface_blend',
            label: 'Three Surface Blend',
            icon: 'ThreeSurfaceBlend',
            action: 'surface_three_blend',
            tooltip: 'Create Blend Surface Across 3 Surfaces'
          },
          {
            id: 'three_fillet_blend',
            label: 'Three Fillet Blend',
            icon: 'ThreeFilletBlend',
            action: 'surface_three_fillet_blend',
            tooltip: 'Corner Blend at Three Fillet Intersection'
          }
        ]
      },
      {
        id: 'modify_stack_2',
        type: 'stack',
        items: [
          {
            id: 'untrim',
            label: 'Untrim',
            icon: 'Untrim',
            action: 'surface_untrim',
            tooltip: 'Restore Untrimmed Underlying Surface'
          },
          {
            id: 'remove_boundary',
            label: 'Remove Boundary',
            icon: 'RemoveBoundary',
            action: 'surface_remove_boundary',
            tooltip: 'Remove Outer / Inner Surface Boundaries'
          },
          {
            id: 'split',
            label: 'Split',
            icon: 'Split',
            action: 'surface_split',
            tooltip: 'Split Surface Along Isoparametric Seam'
          }
        ]
      }
    ]
  },
  {
    id: 'normals',
    title: 'Normals',
    items: [
      {
        id: 'normals_stack',
        type: 'stack',
        items: [
          {
            id: 'normals_change',
            label: 'Change',
            icon: 'NormalsChange',
            action: 'surface_normals_change',
            tooltip: 'Flip Normal Vector Direction of Selected Surface'
          },
          {
            id: 'normals_set',
            label: 'Set',
            icon: 'NormalsSet',
            action: 'surface_normals_set',
            tooltip: 'Set Normal Vector Direction'
          },
          {
            id: 'normals_orient',
            label: 'Orient',
            icon: 'NormalsOrient',
            action: 'surface_normals_orient',
            tooltip: 'Orient Connected Surface Patch Normals Consistently'
          }
        ]
      }
    ]
  }
];

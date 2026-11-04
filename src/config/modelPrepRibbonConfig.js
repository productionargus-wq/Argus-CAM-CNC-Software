/**
 * Declarative configuration schema for the Mastercam 2018 Model Prep Tab Ribbon
 * Ensures no hardcoded UI - completely data-driven layout, icons, actions, and dropdowns.
 */

export const MODEL_PREP_RIBBON_CONFIG = [
  {
    id: 'create',
    title: 'Create',
    items: [
      {
        id: 'hole_axis',
        type: 'large',
        label: 'Hole\nAxis',
        icon: 'HoleAxis',
        action: 'modelprep_hole_axis',
        tooltip: 'Create 3D Centerline Axis in Hole Cavity'
      }
    ]
  },
  {
    id: 'direct_editing',
    title: 'Direct Editing',
    items: [
      {
        id: 'push_pull',
        type: 'large',
        label: 'Push/Pull',
        icon: 'PushPull',
        action: 'modelprep_push_pull',
        tooltip: 'Direct Modeling Push / Pull Face Offset'
      },
      {
        id: 'move',
        type: 'large',
        label: 'Move',
        icon: 'MoveFaces',
        action: 'modelprep_move',
        tooltip: 'Translate or Rotate Solid Faces / Features'
      },
      {
        id: 'split_faces',
        type: 'large',
        label: 'Split Solid\nFaces',
        icon: 'SplitSolidFaces',
        action: 'modelprep_split_faces',
        tooltip: 'Split Planar or Cylindrical Solid Faces Along Curve / Seam'
      }
    ]
  },
  {
    id: 'modify',
    title: 'Modify',
    items: [
      {
        id: 'modify_feature',
        type: 'large',
        label: 'Modify\nFeature',
        icon: 'ModifyFeature',
        action: 'modelprep_modify_feature',
        tooltip: 'Directly Modify Parametric Hole Diameter, Depth, or Boss Dimensions'
      },
      {
        id: 'modify_fillet',
        type: 'large',
        label: 'Modify\nFillet',
        icon: 'ModifyFillet',
        action: 'modelprep_modify_fillet',
        tooltip: 'Directly Modify Existing Fillet Radius on Solid Edge'
      },
      {
        id: 'remove_faces',
        type: 'large',
        label: 'Remove\nFaces',
        icon: 'RemoveFaces',
        action: 'modelprep_remove_faces',
        tooltip: 'Remove Solid Faces and Auto-Heal / Cap Cavity (CAM Defeaturing)'
      },
      {
        id: 'remove_fillets',
        type: 'large',
        label: 'Remove\nFillets',
        icon: 'RemoveFillets',
        action: 'modelprep_remove_fillets',
        tooltip: 'Remove Fillets and Restore Sharp Analytical Corners'
      },
      {
        id: 'modify_stack',
        type: 'stack',
        items: [
          {
            id: 'remove_history',
            label: 'Remove History',
            icon: 'RemoveHistory',
            action: 'modelprep_remove_history',
            tooltip: 'Convert Parametric History Tree to Dumb Direct Modeling Solid Body'
          },
          {
            id: 'simplify_solid',
            label: 'Simplify Solid',
            icon: 'SimplifySolid',
            action: 'modelprep_simplify_solid',
            hasDropdown: true,
            dropdownItems: [
              { id: 'simplify_all', label: 'Simplify Entire Solid Body', action: 'modelprep_simplify_solid' },
              { id: 'simplify_faces', label: 'Merge Co-Planar Faces', action: 'modelprep_simplify_solid' },
              { id: 'simplify_curves', label: 'Smooth Spline Curves to Arcs', action: 'modelprep_simplify_solid' }
            ],
            tooltip: 'Simplify B-Rep Topology into Analytical Planes and Cylinders'
          },
          {
            id: 'find_features',
            label: 'Find Features',
            icon: 'FindFeatures',
            action: 'modelprep_find_features',
            tooltip: 'Automatic Feature Recognition (AFR) - Identify Pockets, Holes, Slots, and Bosses'
          }
        ]
      }
    ]
  },
  {
    id: 'layout',
    title: 'Layout',
    items: [
      {
        id: 'disassemble',
        type: 'large',
        label: 'Disassemble',
        icon: 'Disassemble',
        action: 'modelprep_disassemble',
        tooltip: 'Explode & Disassemble Solid Assembly Components for Machining Setup'
      },
      {
        id: 'position',
        type: 'large',
        label: 'Position',
        icon: 'PositionAssembly',
        action: 'modelprep_position',
        tooltip: 'Align and Position Multi-Body Components along Clamping Axis'
      }
    ]
  },
  {
    id: 'color',
    title: 'Color',
    items: [
      {
        id: 'clear_all',
        type: 'large',
        label: 'Clear\nAll',
        icon: 'ClearAllColor',
        action: 'modelprep_clear_all_color',
        tooltip: 'Clear Custom Face & Feature Colors and Restore Default Billet Color'
      },
      {
        id: 'color_stack',
        type: 'stack',
        items: [
          {
            id: 'change_face',
            label: 'Change Face',
            icon: 'ChangeFaceColor',
            action: 'modelprep_change_face_color',
            tooltip: 'Apply Custom Color to Selected Solid Faces (Toolpath Drive/Check Marker)'
          },
          {
            id: 'clear_feature',
            label: 'Clear Feature',
            icon: 'ClearFeatureColor',
            action: 'modelprep_clear_feature_color',
            tooltip: 'Clear Color from Specific Milled Feature / Hole'
          },
          {
            id: 'set_feature',
            label: 'Set Feature',
            icon: 'SetFeatureColor',
            action: 'modelprep_set_feature_color',
            tooltip: 'Assign Distinct Color to Milled Feature for Inspection & Machining'
          }
        ]
      }
    ]
  }
];

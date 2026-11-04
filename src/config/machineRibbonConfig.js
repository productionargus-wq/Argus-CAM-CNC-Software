/**
 * Declarative configuration schema for the Mastercam 2018 Machine Tab Ribbon
 * Ensures no hardcoded UI - completely data-driven layout, icons, actions, and dropdowns.
 */

export const MACHINE_RIBBON_CONFIG = [
  {
    id: 'machine_type',
    title: 'Machine Type',
    items: [
      {
        id: 'mill',
        type: 'large',
        label: 'Mill',
        icon: 'MachineMill',
        action: 'machine_mill',
        hasDropdown: true,
        dropdownItems: [
          { id: 'mill_default', label: 'Default Mill (3-Axis VMC)', action: 'machine_mill_default' },
          { id: 'mill_4axis', label: '4-Axis Horizontal (HMC Tombstone)', action: 'machine_mill_4axis' },
          { id: 'mill_5axis', label: '5-Axis Trunnion Table (DMU 50)', action: 'machine_mill_5axis' }
        ],
        tooltip: 'Select Milling Machine Definition'
      },
      {
        id: 'lathe',
        type: 'large',
        label: 'Lathe',
        icon: 'MachineLathe',
        action: 'machine_lathe',
        hasDropdown: true,
        dropdownItems: [
          { id: 'lathe_2axis', label: '2-Axis Slant Bed Lathe', action: 'machine_lathe_2axis' },
          { id: 'lathe_live_tool', label: 'C-Axis Live Tooling Lathe', action: 'machine_lathe_live_tool' },
          { id: 'lathe_dual_spindle', label: 'Dual Spindle Sub-Spindle Lathe', action: 'machine_lathe_dual_spindle' }
        ],
        tooltip: 'Select Turning / Lathe Machine Definition'
      },
      {
        id: 'mill_turn',
        type: 'large',
        label: 'Mill-Turn',
        icon: 'MachineMillTurn',
        action: 'machine_mill_turn',
        hasDropdown: true,
        dropdownItems: [
          { id: 'mt_integrex', label: 'Mazak Integrex i-200 (B-Axis)', action: 'machine_mt_integrex' },
          { id: 'mt_multiturret', label: 'Dual Turret Twin Spindle Mill-Turn', action: 'machine_mt_multiturret' }
        ],
        tooltip: 'Select Multi-Tasking Mill-Turn Machine'
      },
      {
        id: 'wire',
        type: 'large',
        label: 'Wire',
        icon: 'MachineWire',
        action: 'machine_wire',
        hasDropdown: true,
        dropdownItems: [
          { id: 'wire_4axis', label: '4-Axis Wire EDM (AgieCharmilles)', action: 'machine_wire_4axis' },
          { id: 'wire_submerged', label: 'High-Precision Submerged Wire EDM', action: 'machine_wire_submerged' }
        ],
        tooltip: 'Select Wire EDM Machine Definition'
      },
      {
        id: 'router',
        type: 'large',
        label: 'Router',
        icon: 'MachineRouter',
        action: 'machine_router',
        hasDropdown: true,
        dropdownItems: [
          { id: 'router_3axis', label: '3-Axis Gantry Wood/Composite Router', action: 'machine_router_3axis' },
          { id: 'router_5axis', label: '5-Axis Overhead Gantry Router', action: 'machine_router_5axis' }
        ],
        tooltip: 'Select CNC Router Machine Definition'
      },
      {
        id: 'design',
        type: 'large',
        label: 'Design',
        icon: 'MachineDesign',
        action: 'machine_design',
        tooltip: 'Switch to CAD Pure Design Mode (No Active Machine Group)'
      }
    ]
  },
  {
    id: 'job_setup',
    title: 'Job Setup',
    items: [
      {
        id: 'control_definition',
        type: 'large',
        label: 'Control\nDefinition',
        icon: 'ControlDefinition',
        action: 'machine_control_definition',
        tooltip: 'Configure CNC Controller Parameters (Fanuc, Haas, Heidenhain, Siemens)'
      },
      {
        id: 'machine_definition',
        type: 'large',
        label: 'Machine\nDefinition',
        icon: 'MachineDefinition',
        action: 'machine_machine_definition',
        tooltip: 'Configure Machine Kinematics, Travel Limits & ATC'
      },
      {
        id: 'material_definition',
        type: 'large',
        label: 'Material\nDefinition',
        icon: 'MaterialDefinition',
        action: 'machine_material_definition',
        tooltip: 'Select Raw Stock Material Alloy & Cutting Speed Database'
      }
    ]
  },
  {
    id: 'simulator',
    title: 'Simulator',
    hasLauncher: true,
    launcherAction: 'machine_simulator_settings',
    items: [
      {
        id: 'backplot',
        type: 'large',
        label: 'Backplot',
        icon: 'SimulatorBackplot',
        action: 'machine_backplot',
        tooltip: 'Trace 3D Wireframe Toolpath Movement'
      },
      {
        id: 'verify',
        type: 'large',
        label: 'Verify',
        icon: 'SimulatorVerify',
        action: 'machine_verify',
        tooltip: 'Simulate Solid Material Stock Removal'
      },
      {
        id: 'simulate',
        type: 'large',
        label: 'Simulate',
        icon: 'SimulatorSimulate',
        action: 'machine_simulate',
        tooltip: 'Full 3D Kinematic Machine Twin Simulation'
      }
    ]
  },
  {
    id: 'post',
    title: 'Post',
    items: [
      {
        id: 'generate_post',
        type: 'large',
        label: 'Generate',
        icon: 'PostGenerate',
        action: 'machine_generate_post',
        tooltip: 'Generate CNC G-Code via Post-Processor (G1)'
      }
    ]
  },
  {
    id: 'setup_sheet',
    title: 'Setup Sheet',
    items: [
      {
        id: 'create_setup_sheet',
        type: 'large',
        label: 'Create',
        icon: 'SetupSheetCreate',
        action: 'machine_create_setup_sheet',
        tooltip: 'Generate Printable CNC Operator Setup Sheet'
      },
      {
        id: 'setup_sheet_stack',
        type: 'stack',
        items: [
          {
            id: 'image_capture',
            label: 'Image Capture',
            icon: 'ImageCapture',
            action: 'machine_image_capture',
            tooltip: 'Capture 3D Viewport Screenshot for Setup Sheet'
          },
          {
            id: 'clear_image_list',
            label: 'Clear Image List',
            icon: 'ClearImageList',
            action: 'machine_clear_image_list',
            tooltip: 'Clear Captured Setup Sheet Images'
          }
        ]
      }
    ]
  },
  {
    id: 'machine_simulation',
    title: 'Machine Simulation',
    hasLauncher: true,
    launcherAction: 'machine_sim_settings',
    items: [
      {
        id: 'sim_run',
        type: 'large',
        label: 'Run',
        icon: 'MachineSimRun',
        action: 'machine_sim_run',
        tooltip: 'Run Full Machine Simulation with Active G-Code'
      },
      {
        id: 'sim_stack',
        type: 'stack',
        items: [
          {
            id: 'sim_backplot',
            label: 'Backplot',
            icon: 'MachineSimBackplot',
            action: 'machine_sim_backplot',
            tooltip: 'Synchronized Machine Kinematic Backplot'
          },
          {
            id: 'sim_verify',
            label: 'Verify',
            icon: 'MachineSimVerify',
            action: 'machine_sim_verify',
            tooltip: 'Machine Enclosure Collision Verification'
          }
        ]
      }
    ]
  },
  {
    id: 'automatic_toolpathing',
    title: 'Automatic Toolpathing',
    items: [
      {
        id: 'atp',
        type: 'large',
        label: 'ATP',
        icon: 'ATP',
        action: 'machine_atp',
        tooltip: 'Automatic Toolpathing Wizard: Auto-Detect Features & Assign Toolpaths'
      },
      {
        id: 'atp_stack',
        type: 'stack',
        items: [
          {
            id: 'atp_current_file',
            label: 'ATP Current File',
            icon: 'ATPCurrentFile',
            action: 'machine_atp_current_file',
            tooltip: 'Run Automatic Toolpathing on Active Part File'
          },
          {
            id: 'atp_reports',
            label: 'ATP Reports',
            icon: 'ATPReports',
            action: 'machine_atp_reports',
            tooltip: 'View ATP Automated Machining Cycle Time Reports'
          },
          {
            id: 'atp_options',
            label: 'ATP Options',
            icon: 'ATPOptions',
            action: 'machine_atp_options',
            tooltip: 'Configure Automatic Toolpathing Feature & Tool Assignment Rules'
          }
        ]
      }
    ]
  }
];

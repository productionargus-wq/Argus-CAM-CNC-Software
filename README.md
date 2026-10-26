# Argus Master CAM — CNC CAD/CAM Desktop & Web Suite

An industrial-grade 5-Axis CNC CAM/CAD programming suite, toolpath generation engine, and machine kinematics simulation platform inspired by Mastercam 2024/2026 and NC2Check.

![Argus CAM Screenshot](public/screenshot.png) <!-- optional -->

---

## ⚡ Key Capabilities

- **Mastercam 12-Discipline Ribbon Architecture**:
  - `File`: Full project packaging (`.mcam`), multi-format 3D CAD import/export (Binary STL, ASCII STL, Wavefront OBJ), auto-save crash recovery, printable CNC setup sheets.
  - `Home`: Mastercam Levels/Layers dockable manager, 3D Euclidean distance & angle caliper, entity attribute inspector, blank/unblank and invert visibility.
  - `Wireframe`: 2D/3D CAD sketcher with parametric lines, circle/arc radii, pocket boundaries, bounding cages, and drill point coordinates.
  - `Surfaces`: Analytical planar sheets, cylindrical wrappers, and revolved surfaces.
  - `Solids`: Parametric solid billets (blocks, cylinders, spheres) and raw stock bounds.
  - `Model Prep`: Snap origin directly to WCS G54 datum, align to table baseplate, push/pull face offsets ($\pm 2$ mm), and manifold integrity check.
  - `Mesh`: High-density STL tessellation, polygon decimation, and binary mesh exporter.
  - `Drafting`: Live 3D dimension overlays ($X, Y, Z$ with directional arrows), WCS G54 datum callouts, and caliper notes.
  - `Transform`: 3D translation ($X, Y, Z$), $90^\circ$ spindle/table rotation, scaling ($1.25\times, 0.8\times$), and origin resets.
  - `Machine`: Machine definition selection (DMG MORI DMU 50 5-Axis, Haas VF-2 3-Axis VMC, Fanuc Robodrill D21, Mazak Integrex i-200), active WCS switcher (G54, G55, G56), G1 Post generator, and digital twin kinematics verify.
  - `View`: 5 standard camera views (Isometric, Top G17, Front G18, Right G19, Fit), 4 display styles (Shaded metallic, Polygon edges, Glass translucent, Pure wireframe), and layer toggles.
  - `Toolpaths`: 2D Facing, 2D Dynamic Adaptive Pocketing, 3D Waterline (Z-Level), 5-Axis Simultaneous Swarf Machining, and Peck Drilling (G83).

- **Multi-Controller Post-Processor**:
  - Heidenhain TNC 640 Klartext (`.h`)
  - Fanuc 31i-B5 (`.nc`)
  - Haas NGC Next Generation (`.nc`)
  - Siemens 840D sl (`.mpf`)
  - GRBL 1.1 / LinuxCNC (`.gcode`)
  - Mach3 / Mach4 (`.tap`)

- **5-Axis Digital Twin Kinematics Simulator**:
  - DMU 50 trunnion kinematics ($X, Y, Z$ linear + $B$ tilt + $C$ rotary table)
  - Live G-code execution stream
  - Axis overtravel and gouge/collision detection

---

## 🛠 Tech Stack

- **Frontend**: React 19, Three.js, Lucide Icons, Vanilla CSS
- **Bundler**: Vite
- **Desktop Runtime**: Tauri v2 + Rust
- **CAM Engine**: Algorithmic mathematical toolpath generation and STLLoader / OBJLoader / STLExporter / OBJExporter

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173/`.

### 3. Production Build
```bash
npm run build
```
Generates the optimized static web assets in `dist/`.

---

## 🌐 Live Web Deployment

Because Argus CAM runs 100% on client-side WebGL and Web Workers, it can be hosted on any static hosting provider for free with zero backend configuration:

1. **Vercel** (Recommended):
   - Import this GitHub repo on [Vercel](https://vercel.com).
   - Framework preset: **Vite**.
   - Build command: `npm run build`.
   - Output directory: `dist`.
   - Continuous deployment will auto-update every time you push to `main`!

2. **Netlify**:
   - Connect repo on [Netlify](https://netlify.com).
   - Build command: `npm run build`.
   - Publish directory: `dist`.

3. **GitHub Pages**:
   - Enable GitHub Actions or use `gh-pages` branch with the `dist/` build.

---

## 📄 License
MIT License.

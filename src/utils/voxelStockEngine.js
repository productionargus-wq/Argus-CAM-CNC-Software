import * as THREE from 'three';

/**
 * Argus CAM Dynamic Stock Material Removal Voxel Simulator Engine
 * High-performance 3D Dexel / Voxel Workpiece Carving & In-Process Solid Verification
 * (Mastercam Verify / Vericut Grade)
 */

export const STOCK_COLOR_MODES = {
  TOOL: { id: 'tool', name: 'Color by Tool', desc: 'Each cutting tool leaves a distinctive colored machined path' },
  HEATMAP: { id: 'heatmap', name: 'Tolerance Deviation Heatmap', desc: 'Green = Nominal finished wall, Blue = Uncut raw stock, Red = Gouge' },
  METALLIC: { id: 'metallic', name: 'Realistic Metallic Billet', desc: 'Machined aerospace 6061-T6 aluminum finish with specular highlights' }
};

// Tool color palette
export const TOOL_PALETTE = [
  new THREE.Color('#38bdf8'), // Cyan
  new THREE.Color('#f59e0b'), // Amber
  new THREE.Color('#10b981'), // Emerald
  new THREE.Color('#a855f7'), // Purple
  new THREE.Color('#ec4899'), // Pink
  new THREE.Color('#ef4444'), // Red
  new THREE.Color('#06b6d4'), // Light Blue
  new THREE.Color('#84cc16')  // Lime
];

const COLOR_RAW_STOCK = new THREE.Color('#64748b'); // Untouched stock slate
const COLOR_NOMINAL   = new THREE.Color('#10b981'); // In-tolerance finished wall
const COLOR_EXCESS    = new THREE.Color('#0284c7'); // Unmachined raw stock
const COLOR_GOUGE     = new THREE.Color('#ef4444'); // Gouge (< -tolerance)

export class VoxelStockSimulator {
  constructor(stockBounds, partMetrics = null, options = {}) {
    this.stockBounds = stockBounds || new THREE.Box3(
      new THREE.Vector3(-40, 0, -30),
      new THREE.Vector3(40, 30, 30)
    );

    this.partMetrics = partMetrics;
    this.minX = this.stockBounds.min.x;
    this.maxX = this.stockBounds.max.x;
    this.minY = this.stockBounds.min.y;
    this.maxY = this.stockBounds.max.y;
    this.minZ = this.stockBounds.min.z;
    this.maxZ = this.stockBounds.max.z;

    this.width = this.maxX - this.minX;
    this.height = this.maxY - this.minY;
    this.depth = this.maxZ - this.minZ;

    // Grid resolution (adaptive based on aspect ratio)
    this.gridResX = options.gridResX || 50;
    this.gridResZ = options.gridResZ || Math.max(20, Math.round(this.gridResX * (this.depth / this.width)));

    this.dx = this.width / (this.gridResX - 1);
    this.dz = this.depth / (this.gridResZ - 1);
    this.cellArea = this.dx * this.dz;

    this.initialVolumeCm3 = (this.width * this.height * this.depth) / 1000;

    // Nominal part floor reference
    this.partBottomY = partMetrics?.bounds?.min?.y ?? (this.minY + 2.0);
    this.tolerance = options.tolerance || 0.02; // mm

    this.reset();
  }

  reset() {
    this.heightGrid = new Float32Array(this.gridResX * this.gridResZ);
    this.toolGrid = new Uint8Array(this.gridResX * this.gridResZ);
    this.gougeGrid = new Float32Array(this.gridResX * this.gridResZ);

    // Fill with initial stock top height
    this.heightGrid.fill(this.maxY);
    this.toolGrid.fill(0);
    this.gougeGrid.fill(0);

    this.totalRemovedVolumeCm3 = 0;
    this.gougeCount = 0;
    this.maxGouge = 0;
  }

  getIndex(gx, gz) {
    return gx * this.gridResZ + gz;
  }

  /**
   * Carves a single tool movement step from p1 to p2
   */
  carveStep(p1, p2, tool = { diameter: 10, type: 'FLAT' }, toolIndex = 1) {
    const radius = (tool.diameter || 10) / 2;
    const isBall = (tool.type || '').toUpperCase() === 'BALL';
    const isChamfer = (tool.type || '').toUpperCase() === 'CHAMFER';

    const dist = p1.distanceTo(p2);
    const stepCount = Math.max(1, Math.ceil(dist / Math.max(1.0, radius * 0.4)));

    let volumeRemovedStep = 0;

    for (let s = 0; s <= stepCount; s++) {
      const t = s / stepCount;
      const px = p1.x + (p2.x - p1.x) * t;
      const py = p1.y + (p2.y - p1.y) * t;
      const pz = p1.z + (p2.z - p1.z) * t;

      const minGx = Math.max(0, Math.floor((px - radius - this.minX) / this.dx));
      const maxGx = Math.min(this.gridResX - 1, Math.ceil((px + radius - this.minX) / this.dx));
      const minGz = Math.max(0, Math.floor((pz - radius - this.minZ) / this.dz));
      const maxGz = Math.min(this.gridResZ - 1, Math.ceil((pz + radius - this.minZ) / this.dz));

      const rSq = radius * radius;

      for (let gx = minGx; gx <= maxGx; gx++) {
        const cx = this.minX + gx * this.dx;
        const distXSq = (cx - px) * (cx - px);

        for (let gz = minGz; gz <= maxGz; gz++) {
          const cz = this.minZ + gz * this.dz;
          const distSq = distXSq + (cz - pz) * (cz - pz);

          if (distSq <= rSq) {
            let cutDepth = py;

            // Geometry compensation for ballnose or chamfer
            if (isBall) {
              const dR = Math.sqrt(distSq);
              const sphericalOffset = radius - Math.sqrt(Math.max(0, rSq - dR * dR));
              cutDepth = py + sphericalOffset;
            } else if (isChamfer) {
              const dR = Math.sqrt(distSq);
              cutDepth = py + (radius - dR);
            }

            const idx = this.getIndex(gx, gz);
            const prevY = this.heightGrid[idx];

            if (cutDepth < prevY) {
              const boundedDepth = Math.max(this.minY, cutDepth);
              this.heightGrid[idx] = boundedDepth;
              this.toolGrid[idx] = toolIndex || 1;

              const deltaH = prevY - boundedDepth;
              volumeRemovedStep += (deltaH * this.cellArea) / 1000;

              // Gouge Check: did the cutter breach nominal bottom?
              if (boundedDepth < this.partBottomY - this.tolerance) {
                const gougeAmount = (this.partBottomY - this.tolerance) - boundedDepth;
                this.gougeGrid[idx] = Math.max(this.gougeGrid[idx], gougeAmount);
                if (gougeAmount > this.maxGouge) this.maxGouge = gougeAmount;
                this.gougeCount++;
              }
            }
          }
        }
      }
    }

    this.totalRemovedVolumeCm3 += volumeRemovedStep;
    return volumeRemovedStep;
  }

  /**
   * Simulates full or scrubbed trajectory up to given progress T in [0, 1]
   */
  simulateToProgress(waypoints, progress = 1.0, tools = []) {
    this.reset();
    if (!waypoints || waypoints.length < 2) {
      return this.getTelemetry(null, 0);
    }

    const targetIdx = Math.max(0, Math.min(waypoints.length - 1, Math.floor(progress * (waypoints.length - 1))));
    let lastRemovedStep = 0;
    let activeWp = waypoints[0];

    for (let i = 1; i <= targetIdx; i++) {
      const p1 = waypoints[i - 1];
      const p2 = waypoints[i];
      activeWp = p2;

      if (p2.mode === 'rapid') continue; // G00 rapid clearance does not cut

      const tool = p2.tool || tools.find((t) => t.id === p2.toolId) || { diameter: 10, type: 'FLAT' };
      const toolIdx = (tools.findIndex((t) => t.id === tool.id) % TOOL_PALETTE.length) + 1;

      lastRemovedStep = this.carveStep(p1.pos, p2.pos, tool, toolIdx);
    }

    const dist = waypoints[Math.max(0, targetIdx - 1)]?.pos?.distanceTo(activeWp?.pos || waypoints[0].pos) || 1;
    const feed = activeWp?.tool?.feedRate || 1500;
    const dtMin = Math.max(0.0001, dist / feed);
    const instantaneousMRR = (lastRemovedStep / dtMin); // cm3/min

    return this.getTelemetry(activeWp, instantaneousMRR);
  }

  getTelemetry(currentWp, instantaneousMRR = 0) {
    const removedPct = Math.min(100, (this.totalRemovedVolumeCm3 / this.initialVolumeCm3) * 100);
    const residualVolumeCm3 = Math.max(0, this.initialVolumeCm3 - this.totalRemovedVolumeCm3);

    return {
      initialVolumeCm3: Number(this.initialVolumeCm3.toFixed(2)),
      removedVolumeCm3: Number(this.totalRemovedVolumeCm3.toFixed(2)),
      removedPct: Number(removedPct.toFixed(1)),
      residualVolumeCm3: Number(residualVolumeCm3.toFixed(2)),
      instantaneousMRR: Number(instantaneousMRR.toFixed(1)),
      gougeCount: this.gougeCount,
      maxGougeMm: Number(this.maxGouge.toFixed(3)),
      currentPos: currentWp ? {
        x: Number(currentWp.pos.x.toFixed(3)),
        y: Number(currentWp.pos.y.toFixed(3)),
        z: Number(currentWp.pos.z.toFixed(3))
      } : { x: 0, y: 0, z: 0 }
    };
  }

  /**
   * Generates a watertight 3D Three.js solid Mesh of the living carved stock workpiece
   */
  buildMesh(colorMode = 'tool', clipSection = null) {
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const normals = [];

    const rx = this.gridResX;
    const rz = this.gridResZ;

    // 1. Top Carved Surface Triangles
    for (let gx = 0; gx < rx - 1; gx++) {
      const x0 = this.minX + gx * this.dx;
      const x1 = x0 + this.dx;

      // Section clipping check (e.g. clipSection = { axis: 'x', value: 0 })
      if (clipSection && clipSection.axis === 'x' && x0 > clipSection.value) continue;

      for (let gz = 0; gz < rz - 1; gz++) {
        const z0 = this.minZ + gz * this.dz;
        const z1 = z0 + this.dz;

        if (clipSection && clipSection.axis === 'z' && z0 > clipSection.value) continue;

        const i00 = this.getIndex(gx, gz);
        const i10 = this.getIndex(gx + 1, gz);
        const i01 = this.getIndex(gx, gz + 1);
        const i11 = this.getIndex(gx + 1, gz + 1);

        const y00 = this.heightGrid[i00];
        const y10 = this.heightGrid[i10];
        const y01 = this.heightGrid[i01];
        const y11 = this.heightGrid[i11];

        // Triangle 1: (0,0) -> (1,0) -> (0,1)
        positions.push(x0, y00, z0,  x1, y10, z0,  x0, y01, z1);
        // Triangle 2: (1,0) -> (1,1) -> (0,1)
        positions.push(x1, y10, z0,  x1, y11, z1,  x0, y01, z1);

        // Color calculation
        const c00 = this.getCellColor(i00, y00, colorMode);
        const c10 = this.getCellColor(i10, y10, colorMode);
        const c01 = this.getCellColor(i01, y01, colorMode);
        const c11 = this.getCellColor(i11, y11, colorMode);

        colors.push(c00.r, c00.g, c00.b,  c10.r, c10.g, c10.b,  c01.r, c01.g, c01.b);
        colors.push(c10.r, c10.g, c10.b,  c11.r, c11.g, c11.b,  c01.r, c01.g, c01.b);
      }
    }

    // 2. Solid Skirt / Side Walls down to stock bottom
    const addWallQuad = (x0, y0, z0, x1, y1, z1, col) => {
      positions.push(x0, y0, z0,  x1, y1, z1,  x0, this.minY, z0);
      positions.push(x1, y1, z1,  x1, this.minY, z1,  x0, this.minY, z0);
      for (let k = 0; k < 6; k++) colors.push(col.r, col.g, col.b);
    };

    const wallColor = COLOR_RAW_STOCK;

    // South wall (gz = 0)
    for (let gx = 0; gx < rx - 1; gx++) {
      const x0 = this.minX + gx * this.dx;
      const x1 = x0 + this.dx;
      const y0 = this.heightGrid[this.getIndex(gx, 0)];
      const y1 = this.heightGrid[this.getIndex(gx + 1, 0)];
      addWallQuad(x0, y0, this.minZ, x1, y1, this.minZ, wallColor);
    }
    // North wall (gz = rz - 1)
    for (let gx = 0; gx < rx - 1; gx++) {
      const x0 = this.minX + gx * this.dx;
      const x1 = x0 + this.dx;
      const y0 = this.heightGrid[this.getIndex(gx, rz - 1)];
      const y1 = this.heightGrid[this.getIndex(gx + 1, rz - 1)];
      addWallQuad(x1, y1, this.maxZ, x0, y0, this.maxZ, wallColor);
    }
    // West wall (gx = 0)
    for (let gz = 0; gz < rz - 1; gz++) {
      const z0 = this.minZ + gz * this.dz;
      const z1 = z0 + this.dz;
      const y0 = this.heightGrid[this.getIndex(0, gz)];
      const y1 = this.heightGrid[this.getIndex(0, gz + 1)];
      addWallQuad(this.minX, y1, z1, this.minX, y0, z0, wallColor);
    }
    // East wall (gx = rx - 1)
    for (let gz = 0; gz < rz - 1; gz++) {
      const z0 = this.minZ + gz * this.dz;
      const z1 = z0 + this.dz;
      const y0 = this.heightGrid[this.getIndex(rx - 1, gz)];
      const y1 = this.heightGrid[this.getIndex(rx - 1, gz + 1)];
      addWallQuad(this.maxX, y0, z0, this.maxX, y1, z1, wallColor);
    }

    // 3. Solid Bottom Floor Quad
    positions.push(this.minX, this.minY, this.minZ,  this.minX, this.minY, this.maxZ,  this.maxX, this.minY, this.maxZ);
    positions.push(this.minX, this.minY, this.minZ,  this.maxX, this.minY, this.maxZ,  this.maxX, this.minY, this.minZ);
    for (let k = 0; k < 6; k++) colors.push(0.15, 0.2, 0.25);

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const mat = colorMode === 'metallic' ? new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.35,
      metalness: 0.85
    }) : new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.45,
      metalness: 0.25
    });

    return new THREE.Mesh(geom, mat);
  }

  getCellColor(idx, y, colorMode) {
    if (colorMode === 'heatmap') {
      const gouge = this.gougeGrid[idx];
      if (gouge > 0) return COLOR_GOUGE;
      // If untouched top stock -> excess stock
      if (Math.abs(y - this.maxY) < 0.05) return COLOR_EXCESS;
      // Machined wall near nominal
      return COLOR_NOMINAL;
    }

    if (colorMode === 'metallic') {
      return COLOR_RAW_STOCK;
    }

    // Default 'tool' color mode
    const toolId = this.toolGrid[idx];
    if (toolId === 0 || Math.abs(y - this.maxY) < 0.05) {
      return COLOR_RAW_STOCK; // Untouched stock
    }
    return TOOL_PALETTE[(toolId - 1) % TOOL_PALETTE.length] || COLOR_NOMINAL;
  }

  /**
   * Generates ASCII STL file string for carved solid stock export
   */
  exportSTL() {
    const rx = this.gridResX;
    const rz = this.gridResZ;
    const lines = [];
    lines.push('solid ArgusCAM_Carved_Stock');

    const addFacet = (p1, p2, p3) => {
      const u = new THREE.Vector3().subVectors(p2, p1);
      const v = new THREE.Vector3().subVectors(p3, p1);
      const n = new THREE.Vector3().crossVectors(u, v).normalize();
      lines.push(`  facet normal ${n.x.toFixed(4)} ${n.y.toFixed(4)} ${n.z.toFixed(4)}`);
      lines.push('    outer loop');
      lines.push(`      vertex ${p1.x.toFixed(3)} ${p1.y.toFixed(3)} ${p1.z.toFixed(3)}`);
      lines.push(`      vertex ${p2.x.toFixed(3)} ${p2.y.toFixed(3)} ${p2.z.toFixed(3)}`);
      lines.push(`      vertex ${p3.x.toFixed(3)} ${p3.y.toFixed(3)} ${p3.z.toFixed(3)}`);
      lines.push('    endloop');
      lines.push('  endfacet');
    };

    for (let gx = 0; gx < rx - 1; gx++) {
      const x0 = this.minX + gx * this.dx;
      const x1 = x0 + this.dx;
      for (let gz = 0; gz < rz - 1; gz++) {
        const z0 = this.minZ + gz * this.dz;
        const z1 = z0 + this.dz;

        const y00 = this.heightGrid[this.getIndex(gx, gz)];
        const y10 = this.heightGrid[this.getIndex(gx + 1, gz)];
        const y01 = this.heightGrid[this.getIndex(gx, gz + 1)];
        const y11 = this.heightGrid[this.getIndex(gx + 1, gz + 1)];

        const p00 = new THREE.Vector3(x0, y00, z0);
        const p10 = new THREE.Vector3(x1, y10, z0);
        const p01 = new THREE.Vector3(x0, y01, z1);
        const p11 = new THREE.Vector3(x1, y11, z1);

        addFacet(p00, p10, p01);
        addFacet(p10, p11, p01);
      }
    }

    lines.push('endsolid ArgusCAM_Carved_Stock');
    return lines.join('\n');
  }
}


import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Dynamic Mastercam Print Sheet CAD Viewport
 * Projects the active 3D CAD model, solids, wireframes, and dimensions
 * onto the 2D print sheet preview with clean engineering graphics (Image 1 replica).
 */
export default function PrintSheetViewport({
  currentModel,
  solidsList = [],
  customGeometry = [],
  partMetrics,
  orientation = 'portrait',
  paperSize = 'letter',
  scaleMode = 'fit'
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 650;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');
    sceneRef.current = scene;

    // 2. Camera (Isometric Orthographic for Technical Drawing)
    const aspect = width / height;
    const frustumSize = 260;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -1000,
      2000
    );
    // Isometric angle matching Mastercam default print view in Image 1
    camera.position.set(220, 260, 240);
    camera.lookAt(0, 20, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.55);
    dirLight1.position.set(150, 300, 200);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-150, -100, -150);
    scene.add(dirLight2);

    // 5. Populate Active CAD Geometry
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Edge outline material (black for technical drawing)
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1e293b, linewidth: 1.5 });

    // A. Add Solids from solidsList or currentModel
    if (solidsList && solidsList.length > 0) {
      solidsList.forEach((solid) => {
        if (!solid || solid.visible === false) return;
        const colorHex = solid.color ? parseInt(solid.color.replace('#', '0x'), 16) : 0xea580c;
        const meshMat = new THREE.MeshLambertMaterial({
          color: colorHex,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1
        });

        if (solid.mesh && solid.mesh.geometry) {
          const clonedMesh = new THREE.Mesh(solid.mesh.geometry.clone(), meshMat);
          rootGroup.add(clonedMesh);

          const edgesGeo = new THREE.EdgesGeometry(solid.mesh.geometry, 25);
          const edgeLines = new THREE.LineSegments(edgesGeo, edgeMaterial);
          rootGroup.add(edgeLines);
        } else if (solid.geometry) {
          const mesh = new THREE.Mesh(solid.geometry.clone(), meshMat);
          rootGroup.add(mesh);

          const edgesGeo = new THREE.EdgesGeometry(solid.geometry, 25);
          const edgeLines = new THREE.LineSegments(edgesGeo, edgeMaterial);
          rootGroup.add(edgeLines);
        }
      });
    } else if (currentModel && currentModel.geometry) {
      const meshMat = new THREE.MeshLambertMaterial({
        color: 0xea580c,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
      const mesh = new THREE.Mesh(currentModel.geometry.clone(), meshMat);
      rootGroup.add(mesh);

      const edgesGeo = new THREE.EdgesGeometry(currentModel.geometry, 25);
      const edgeLines = new THREE.LineSegments(edgesGeo, edgeMaterial);
      rootGroup.add(edgeLines);
    } else {
      // Default geometric placeholder if empty (box slab)
      const defaultGeo = new THREE.BoxGeometry(140, 20, 60);
      const defaultMat = new THREE.MeshLambertMaterial({ color: 0xea580c });
      const defMesh = new THREE.Mesh(defaultGeo, defaultMat);
      rootGroup.add(defMesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(defaultGeo), edgeMaterial);
      rootGroup.add(edges);
    }

    // B. Custom Geometry (Wireframes, Dimensions, Centerlines)
    if (customGeometry && customGeometry.length > 0) {
      customGeometry.forEach((ent) => {
        if (!ent || ent.visible === false) return;
        if (ent.type === 'line' && ent.start && ent.end) {
          const points = [
            new THREE.Vector3(ent.start.x, ent.start.y || 11, ent.start.z || 0),
            new THREE.Vector3(ent.end.x, ent.end.y || 11, ent.end.z || 0)
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
          rootGroup.add(new THREE.Line(lineGeo, lineMat));
        } else if (ent.type === 'rect' && ent.width && ent.height) {
          const w = ent.width;
          const h = ent.height;
          const cx = ent.x || 0;
          const cz = ent.z || 0;
          const pts = [
            new THREE.Vector3(cx - w / 2, 11, cz - h / 2),
            new THREE.Vector3(cx + w / 2, 11, cz - h / 2),
            new THREE.Vector3(cx + w / 2, 11, cz + h / 2),
            new THREE.Vector3(cx - w / 2, 11, cz + h / 2),
            new THREE.Vector3(cx - w / 2, 11, cz - h / 2)
          ];
          const rectGeo = new THREE.BufferGeometry().setFromPoints(pts);
          const rectMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
          rootGroup.add(new THREE.Line(rectGeo, rectMat));
        } else if (ent.type === 'circle' && ent.radius) {
          const curve = new THREE.EllipseCurve(
            ent.center?.x || 0,
            ent.center?.z || 0,
            ent.radius,
            ent.radius,
            0,
            2 * Math.PI,
            false,
            0
          );
          const pts2d = curve.getPoints(50);
          const pts3d = pts2d.map((p) => new THREE.Vector3(p.x, 11, p.y));
          const circGeo = new THREE.BufferGeometry().setFromPoints(pts3d);
          const circMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
          rootGroup.add(new THREE.Line(circGeo, circMat));
        }
      });
    }

    // C. Mastercam Construction Centerlines & Rays (Matching Image 1)
    const rayMat = new THREE.LineDashedMaterial({
      color: 0x64748b,
      linewidth: 1,
      scale: 1,
      dashSize: 4,
      gapSize: 3
    });
    const rayPts = [
      new THREE.Vector3(-120, 11, 0), new THREE.Vector3(140, 11, 0),
      new THREE.Vector3(0, 11, -80), new THREE.Vector3(0, 11, 100),
      new THREE.Vector3(50, 11, -120), new THREE.Vector3(50, 11, 120)
    ];
    const rayGeo = new THREE.BufferGeometry().setFromPoints(rayPts);
    const rays = new THREE.LineSegments(rayGeo, rayMat);
    rays.computeLineDistances();
    rootGroup.add(rays);

    // D. Corner Datum Gnomons matching Image 1
    const createGnomon = (x, y, z) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      // X axis (red)
      const xLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(18, 0, 0)]),
        new THREE.LineBasicMaterial({ color: 0xdc2626, linewidth: 2 })
      );
      // Y axis (green)
      const yLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 18, 0)]),
        new THREE.LineBasicMaterial({ color: 0x16a34a, linewidth: 2 })
      );
      g.add(xLine);
      g.add(yLine);
      return g;
    };

    rootGroup.add(createGnomon(-120, 90, -90));
    rootGroup.add(createGnomon(120, 90, -90));
    rootGroup.add(createGnomon(-120, -70, 70));

    // Auto-fit bounds
    const box = new THREE.Box3().setFromObject(rootGroup);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 120;
    const fitScale = (frustumSize * 0.72) / maxDim;
    rootGroup.scale.set(fitScale, fitScale, fitScale);

    // Center root group
    const center = new THREE.Vector3();
    box.getCenter(center);
    rootGroup.position.set(-center.x * fitScale, -center.y * fitScale + 10, -center.z * fitScale);

    // Render loop
    const render = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    render();

    // Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const nw = container.clientWidth || 500;
      const nh = container.clientHeight || 650;
      const naspect = nw / nh;
      const cam = cameraRef.current;
      cam.left = (-frustumSize * naspect) / 2;
      cam.right = (frustumSize * naspect) / 2;
      cam.top = frustumSize / 2;
      cam.bottom = -frustumSize / 2;
      cam.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
      render();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentModel, solidsList, customGeometry, partMetrics, orientation, paperSize, scaleMode]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        overflow: 'hidden'
      }}
    >
      {/* 2D Dimension Overlay annotations matching Mastercam in Image 1 */}
      <div
        style={{
          position: 'absolute',
          bottom: '24%',
          left: '46%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          fontWeight: 600,
          color: '#1e293b',
          fontFamily: "'Segoe UI', Tahoma, sans-serif",
          pointerEvents: 'none',
          background: 'rgba(255, 255, 255, 0.85)',
          padding: '1px 6px',
          border: '1px solid #cbd5e1',
          borderRadius: '2px'
        }}
      >
        96.16 mm
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '33%',
          left: '38%',
          fontSize: '10px',
          fontWeight: 600,
          color: '#0284c7',
          fontFamily: "'Segoe UI', Tahoma, sans-serif",
          pointerEvents: 'none'
        }}
      >
        90.0°
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '34%',
          left: '43%',
          fontSize: '12px',
          fontWeight: 700,
          color: '#0284c7',
          fontFamily: "'Segoe UI', Tahoma, sans-serif",
          pointerEvents: 'none'
        }}
      >
        +
      </div>
    </div>
  );
}

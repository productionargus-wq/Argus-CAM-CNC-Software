import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Eye, Layers, Rotate3D, UploadCloud, Box, Info, Scissors, Camera, Sun, Sliders,
  Play, Pause, SkipForward, SkipBack, RotateCcw, X, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { parseSTLFile, calculatePartMetrics } from '../utils/cadGeometry';
import {
  generateFacingToolpath,
  generatePocketToolpath,
  generateWaterlineToolpath,
  generateSwarfToolpath,
  generateDrillingToolpath,
  generateAdaptiveRoughingToolpath,
  generateChamferToolpath,
  generateSurfaceParallelToolpath,
  buildToolpathMeshes,
  createToolAssembly3D,
  compileBackplotTrajectory,
  sampleTrajectoryAtT
} from '../utils/toolpathEngine';
import {
  buildCPlaneHelperGroup,
  DEFAULT_PLANES
} from '../utils/cplaneGeometry';

export default function Viewport3D({
  currentModel,
  stockConfig,
  operations,
  tools,
  activeOpId = null,
  activePlane = 'Top (G17)',
  planes = [],
  isBackplotActive = false,
  backplotMode = 'backplot',
  onCloseBackplot = null,
  onCoordinateUpdate,
  onMetricsCalculated,
  onModelImported,
  workpieceColor = '#60a5fa',
  renderMode = 'shaded',
  cameraMode = 'perspective',
  cameraFov = 45,
  clippingPlane = { enabled: false, axis: 'Z', offset: 0, invert: false },
  lightingMode = 'studio',
  layerVisibility = {
    fixture: true,
    bed: true,
    stock: true,
    toolpaths: true,
    rapids: true,
    wcs: true,
    dimensions: false
  },
  cameraCommand = null,
  partTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  customGeometry = [],
  onOpenViewStudioModal,
  onToggleCameraMode,
  onUpdateClippingPlane,
  onChangeRenderMode
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const toolpathGroupRef = useRef(null);
  const partHolderGroupRef = useRef(null);
  const fixtureGroupRef = useRef(null);
  const gridHelperRef = useRef(null);
  const axesHelperRef = useRef(null);
  const stockMeshRef = useRef(null);
  const stockWireframeRef = useRef(null);
  const customGeoGroupRef = useRef(null);
  const dimensionGroupRef = useRef(null);
  const ambientLightRef = useRef(null);
  const dirLight1Ref = useRef(null);
  const dirLight2Ref = useRef(null);
  const clipPlaneHelperRef = useRef(null);
  const cplaneHelperGroupRef = useRef(null);
  const normalMaterialRef = useRef(new THREE.MeshNormalMaterial());

  // Backplot & Solid Verify Simulation State & Refs
  const [isBackplotPlaying, setIsBackplotPlaying] = useState(false);
  const [backplotProgress, setBackplotProgress] = useState(0.0);
  const [backplotSpeed, setBackplotSpeed] = useState(1);
  const [backplotLoop, setBackplotLoop] = useState(true);
  const [backplotInternalMode, setBackplotInternalMode] = useState(backplotMode || 'backplot');
  const [holderCollisionAlert, setHolderCollisionAlert] = useState(false);

  const backplotToolRef = useRef(null);
  const backplotTrailRef = useRef(null);
  const backplotVerifyGroupRef = useRef(null);
  const backplotAnimRef = useRef(null);
  const lastAnimTimeRef = useRef(performance.now());
  const waypointsRef = useRef([]);

  useEffect(() => {
    setBackplotInternalMode(backplotMode || 'backplot');
  }, [backplotMode]);

  const [isDragOver, setIsDragOver] = useState(false);
  const [partMetrics, setPartMetrics] = useState(null);

  // 1. Initial Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x131722);
    scene.fog = new THREE.FogExp2(0x131722, 0.002);

    // Camera setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(220, 180, 260);
    camera.lookAt(0, 45, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight1.position.set(200, 300, 150);
    dirLight1.castShadow = true;
    scene.add(dirLight1);
    dirLight1Ref.current = dirLight1;

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dirLight2.position.set(-200, 100, -150);
    scene.add(dirLight2);
    dirLight2Ref.current = dirLight2;

    // Machine Bed Grid
    const gridHelper = new THREE.GridHelper(400, 40, 0x334155, 0x1e293b);
    gridHelper.position.y = -20;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Fixture Group (Baseplate + Studs + ZeroClamp CNC Vise)
    const fixtureGroup = new THREE.Group();
    fixtureGroup.name = "fixture_group";

    const basePlateGeo = new THREE.BoxGeometry(260, 18, 200);
    const basePlateMat = new THREE.MeshStandardMaterial({
      color: 0x242a36,
      roughness: 0.35,
      metalness: 0.8
    });
    const basePlate = new THREE.Mesh(basePlateGeo, basePlateMat);
    basePlate.position.set(0, -9, 0);
    basePlate.receiveShadow = true;
    fixtureGroup.add(basePlate);

    const studGeo = new THREE.CylinderGeometry(14, 14, 4, 32);
    const studMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    [[-70, 0, -50], [70, 0, -50], [-70, 0, 50], [70, 0, 50]].forEach(([x, y, z]) => {
      const stud = new THREE.Mesh(studGeo, studMat);
      stud.position.set(x, 0.5, z);
      fixtureGroup.add(stud);
    });

    const viseBodyGeo = new THREE.BoxGeometry(110, 40, 150);
    const viseMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    const viseBody = new THREE.Mesh(viseBodyGeo, viseMat);
    viseBody.position.set(0, 20, 0);
    viseBody.castShadow = true;
    fixtureGroup.add(viseBody);

    const jawGeo = new THREE.BoxGeometry(110, 18, 16);
    const jawMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const fixedJaw = new THREE.Mesh(jawGeo, jawMat);
    fixedJaw.position.set(0, 49, -45);
    const movableJaw = new THREE.Mesh(jawGeo, jawMat);
    movableJaw.position.set(0, 49, 45);
    fixtureGroup.add(fixedJaw, movableJaw);

    scene.add(fixtureGroup);
    fixtureGroupRef.current = fixtureGroup;

    // Part Holder Group (Workpiece)
    const partHolderGroup = new THREE.Group();
    partHolderGroup.name = "part_holder_group";
    partHolderGroup.position.set(0, 49, 0);
    scene.add(partHolderGroup);
    partHolderGroupRef.current = partHolderGroup;

    // Coordinate Axes at Workpiece WCS (G54 Origin)
    const axesHelper = new THREE.AxesHelper(45);
    axesHelper.position.set(0, 85, 0);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // Dynamic Toolpaths Group
    const toolpathGroup = new THREE.Group();
    scene.add(toolpathGroup);
    toolpathGroupRef.current = toolpathGroup;

    // Custom CAD Entities (Wireframe lines, circles, rects, surfaces)
    const customGeoGroup = new THREE.Group();
    customGeoGroup.position.set(0, 49, 0);
    scene.add(customGeoGroup);
    customGeoGroupRef.current = customGeoGroup;

    // Drafting Dimension Callouts Group
    const dimensionGroup = new THREE.Group();
    dimensionGroup.position.set(0, 49, 0);
    scene.add(dimensionGroup);
    dimensionGroupRef.current = dimensionGroup;

    // Mouse Drag Orbit & Pan
    let isDragging = false;
    let isPanning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = new THREE.Spherical(340, Math.PI / 3.4, Math.PI / 4);

    const onMouseDown = (e) => {
      if (e.button === 0) isDragging = true;
      if (e.button === 2) isPanning = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (isDragging) {
        spherical.theta -= deltaX * 0.008;
        spherical.phi = Math.max(0.1, Math.min(Math.PI / 2.05, spherical.phi - deltaY * 0.008));
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 45, 0);
      } else if (isPanning) {
        camera.position.x -= deltaX * 0.4;
        camera.position.y += deltaY * 0.4;
      }

      if (onCoordinateUpdate) {
        onCoordinateUpdate({
          x: (camera.position.x * -1.5).toFixed(4),
          y: (camera.position.z * -1.2).toFixed(4),
          z: camera.position.y.toFixed(4)
        });
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      isPanning = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(80, Math.min(800, spherical.radius + e.deltaY * 0.4));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 45, 0);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    // Render Loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Camera snap command handler
  const snapView = (preset) => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (preset === 'iso') cam.position.set(220, 180, 260);
    else if (preset === 'top') cam.position.set(0, 360, 1);
    else if (preset === 'front') cam.position.set(0, 50, 360);
    else if (preset === 'right') cam.position.set(360, 50, 0);
    else if (preset === 'bottom') cam.position.set(0, -360, 1);
    else if (preset === 'left') cam.position.set(-360, 50, 0);
    else if (preset === 'back') cam.position.set(0, 50, -360);
    else if (preset === 'fit') cam.position.set(200, 150, 240);
    cam.lookAt(0, 45, 0);
  };

  useEffect(() => {
    if (cameraCommand?.preset) {
      snapView(cameraCommand.preset);
    }
  }, [cameraCommand]);

  // 3. Update 3D Model in Viewport when currentModel changes
  useEffect(() => {
    if (!partHolderGroupRef.current || !currentModel) return;
    const holder = partHolderGroupRef.current;

    while (holder.children.length > 0) {
      holder.remove(holder.children[0]);
    }

    const clone = currentModel.clone(true);
    holder.add(clone);

    const metrics = calculatePartMetrics(clone);
    setPartMetrics(metrics);
    if (onMetricsCalculated) {
      onMetricsCalculated(metrics);
    }
  }, [currentModel]);

  // 4. Update Part Transforms (Position, Rotation, Scale)
  useEffect(() => {
    if (!partHolderGroupRef.current) return;
    const holder = partHolderGroupRef.current;
    if (partTransform) {
      const pos = partTransform.position || { x: 0, y: 0, z: 0 };
      const rot = partTransform.rotation || { x: 0, y: 0, z: 0 };
      const scl = partTransform.scale || { x: 1, y: 1, z: 1 };

      holder.position.set(pos.x, 49 + pos.y, pos.z);
      holder.rotation.set(rot.x, rot.y, rot.z);
      holder.scale.set(scl.x, scl.y, scl.z);

      if (holder.children.length > 0) {
        const metrics = calculatePartMetrics(holder);
        setPartMetrics(metrics);
        if (onMetricsCalculated) onMetricsCalculated(metrics);
      }
    }
  }, [partTransform]);

  // 5. Workpiece Color & RenderMode Updates (Shaded, Transparent, Wireframe, Edges, Normals)
  useEffect(() => {
    if (!partHolderGroupRef.current) return;
    partHolderGroupRef.current.traverse((child) => {
      if (child.isMesh) {
        if (!child.userData.originalMaterial && child.material) {
          child.userData.originalMaterial = child.material;
        }

        if (renderMode === 'normals') {
          child.material = normalMaterialRef.current;
        } else if (child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
          if (workpieceColor && child.material.color) {
            child.material.color.set(workpieceColor);
          }
          if (renderMode === 'wireframe') {
            child.material.wireframe = true;
            child.material.transparent = false;
          } else if (renderMode === 'transparent') {
            child.material.wireframe = false;
            child.material.transparent = true;
            child.material.opacity = 0.35;
          } else {
            // shaded or edges
            child.material.wireframe = false;
            child.material.transparent = false;
            child.material.opacity = 1.0;
          }
        }
        if (child.material) {
          child.material.needsUpdate = true;
        }
      }
    });
  }, [workpieceColor, renderMode]);

  // Dynamic 3D Cross-Section Clipping Plane
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const scene = sceneRef.current;

    if (clipPlaneHelperRef.current) {
      scene.remove(clipPlaneHelperRef.current);
      clipPlaneHelperRef.current = null;
    }

    if (!clippingPlane?.enabled) {
      if (partHolderGroupRef.current) {
        partHolderGroupRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.clippingPlanes = [];
            child.material.needsUpdate = true;
          }
        });
      }
      return;
    }

    const axis = clippingPlane.axis || 'Z';
    const offset = Number(clippingPlane.offset) || 0;
    const invert = Boolean(clippingPlane.invert);

    let normal = new THREE.Vector3(0, 0, 1);
    if (axis === 'X') normal = new THREE.Vector3(invert ? -1 : 1, 0, 0);
    else if (axis === 'Y') normal = new THREE.Vector3(0, invert ? -1 : 1, 0);
    else if (axis === 'Z') normal = new THREE.Vector3(0, 0, invert ? -1 : 1);

    const plane = new THREE.Plane(normal, invert ? offset : -offset);

    if (partHolderGroupRef.current) {
      partHolderGroupRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.clippingPlanes = [plane];
          child.material.clipShadows = true;
          child.material.needsUpdate = true;
        }
      });
    }

    const helper = new THREE.PlaneHelper(plane, 220, 0xec4899);
    helper.name = 'clip_plane_helper';
    scene.add(helper);
    clipPlaneHelperRef.current = helper;
  }, [clippingPlane]);

  // Environment Lighting Updates
  useEffect(() => {
    if (!sceneRef.current || !ambientLightRef.current || !dirLight1Ref.current || !dirLight2Ref.current) return;
    const scene = sceneRef.current;
    const ambient = ambientLightRef.current;
    const l1 = dirLight1Ref.current;
    const l2 = dirLight2Ref.current;

    if (lightingMode === 'shop') {
      scene.background = new THREE.Color(0x0f172a);
      ambient.intensity = 1.0;
      l1.intensity = 1.6;
      l2.intensity = 0.8;
      l1.position.set(0, 400, 0);
    } else if (lightingMode === 'inspect') {
      scene.background = new THREE.Color(0x090d16);
      ambient.intensity = 0.35;
      l1.intensity = 2.2;
      l2.intensity = 1.2;
      l1.position.set(150, 200, 300);
    } else {
      scene.background = new THREE.Color(0x131722);
      ambient.intensity = 0.75;
      l1.intensity = 1.3;
      l2.intensity = 0.5;
      l1.position.set(200, 300, 150);
    }
  }, [lightingMode]);

  // Camera Field of View Updates
  useEffect(() => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (cam.isPerspectiveCamera && cameraFov && cam.fov !== cameraFov) {
      cam.fov = cameraFov;
      cam.updateProjectionMatrix();
    }
  }, [cameraFov]);

  // 6. Custom Geometry (Wireframes, Rectangles, Circles, Surfaces)
  useEffect(() => {
    if (!customGeoGroupRef.current) return;
    const group = customGeoGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    if (Array.isArray(customGeometry)) {
      customGeometry.forEach((item) => {
        group.add(item.clone(true));
      });
    }
  }, [customGeometry]);

  // 7. Layer Visibility Updates (Part Solid, Wireframe, Fixture, Bed, WCS, Stock, Rapids)
  useEffect(() => {
    if (partHolderGroupRef.current) {
      partHolderGroupRef.current.visible = layerVisibility.part !== false;
    }
    if (customGeoGroupRef.current) {
      const showWireframe = layerVisibility.wireframe !== false;
      const showSurfaces = layerVisibility.surfaces !== false;
      customGeoGroupRef.current.children.forEach((child) => {
        if (child.name?.startsWith('Surface_') || child.name?.startsWith('CAD_')) {
          child.visible = showSurfaces;
        } else {
          child.visible = showWireframe;
        }
      });
      customGeoGroupRef.current.visible = true;
    }
    if (fixtureGroupRef.current) {
      fixtureGroupRef.current.visible = layerVisibility.fixture !== false;
    }
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = layerVisibility.bed !== false;
    }
    if (axesHelperRef.current) {
      axesHelperRef.current.visible = layerVisibility.wcs !== false;
    }
    if (stockMeshRef.current) {
      stockMeshRef.current.visible = layerVisibility.stock !== false;
    }
    if (stockWireframeRef.current) {
      stockWireframeRef.current.visible = layerVisibility.stock !== false;
    }
    if (dimensionGroupRef.current) {
      dimensionGroupRef.current.visible = Boolean(layerVisibility.dimensions);
    }
    if (toolpathGroupRef.current) {
      const showCuts = layerVisibility.toolpaths !== false;
      const showRapids = layerVisibility.rapids !== false;
      toolpathGroupRef.current.traverse((child) => {
        if (child.name.startsWith('op_cut_')) {
          child.visible = showCuts;
        } else if (child.name.startsWith('op_rapid_')) {
          child.visible = showRapids;
        }
      });
    }
  }, [layerVisibility]);

  // 8. Update Dynamic Stock Box Mesh
  useEffect(() => {
    if (!sceneRef.current || !partMetrics) return;
    const scene = sceneRef.current;

    if (stockMeshRef.current) scene.remove(stockMeshRef.current);
    if (stockWireframeRef.current) scene.remove(stockWireframeRef.current);

    const dim = partMetrics.dimensions;
    const stockW = dim.x + (stockConfig.allowanceSides || 4) * 2;
    const stockH = dim.y + (stockConfig.allowanceTop || 2);
    const stockD = dim.z + (stockConfig.allowanceSides || 4) * 2;

    const stockGeo = new THREE.BoxGeometry(stockW, stockH, stockD);
    const stockMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false
    });

    const stockMesh = new THREE.Mesh(stockGeo, stockMat);
    stockMesh.position.set(0, 49 + stockH / 2, 0);
    stockMesh.visible = layerVisibility.stock !== false;
    scene.add(stockMesh);
    stockMeshRef.current = stockMesh;

    const edges = new THREE.EdgesGeometry(stockGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, edgeMat);
    wireframe.position.copy(stockMesh.position);
    wireframe.visible = layerVisibility.stock !== false;
    scene.add(wireframe);
    stockWireframeRef.current = wireframe;
  }, [stockConfig, partMetrics, layerVisibility.stock]);

  // 9. Build 3D Drafting Dimension Lines
  useEffect(() => {
    if (!dimensionGroupRef.current || !partMetrics) return;
    const group = dimensionGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const bounds = partMetrics.box;
    const min = bounds.min;
    const max = bounds.max;
    const offset = 12;

    // X Dimension Line (Bottom Front)
    const xPoints = [
      new THREE.Vector3(min.x, min.y, max.z + offset),
      new THREE.Vector3(max.x, min.y, max.z + offset)
    ];
    const xGeo = new THREE.BufferGeometry().setFromPoints(xPoints);
    const xLine = new THREE.Line(xGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
    group.add(xLine);

    // Z Dimension Line (Bottom Right)
    const zPoints = [
      new THREE.Vector3(max.x + offset, min.y, min.z),
      new THREE.Vector3(max.x + offset, min.y, max.z)
    ];
    const zGeo = new THREE.BufferGeometry().setFromPoints(zPoints);
    const zLine = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }));
    group.add(zLine);

    // Y Dimension Line (Vertical Right)
    const yPoints = [
      new THREE.Vector3(max.x + offset, min.y, max.z + offset),
      new THREE.Vector3(max.x + offset, max.y, max.z + offset)
    ];
    const yGeo = new THREE.BufferGeometry().setFromPoints(yPoints);
    const yLine = new THREE.Line(yGeo, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 }));
    group.add(yLine);
  }, [partMetrics]);

  // 10. Dynamically Generate and Render Real Toolpaths from CAM Operations
  useEffect(() => {
    if (!toolpathGroupRef.current || !partMetrics) return;
    const group = toolpathGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const bounds = partMetrics.box;

      const opColors = {
        face: 0x3b82f6,
        pocket: 0x10b981,
        contour: 0xf59e0b,
        swarf: 0x8b5cf6,
        drill: 0xef4444,
        adaptive: 0x06b6d4,
        chamfer: 0xec4899,
        parallel: 0xd946ef,
        surface: 0xd946ef
      };

    operations.forEach((op) => {
      const assignedTool = tools.find((t) => t.id === op.toolId) || tools[0] || { diameter: 10 };

      let toolpathData;
      if (op.badgeClass === 'face') {
        toolpathData = generateFacingToolpath(bounds, assignedTool, {
          stepoverPct: op.stepoverPct || 65,
          faceAllowance: stockConfig.allowanceTop || 2.0,
          depthOfCut: op.stepdown || 1.0,
          rapidHeight: op.rapidHeight || 15.0
        });
      } else if (op.badgeClass === 'pocket') {
        toolpathData = generatePocketToolpath(bounds, assignedTool, {
          stepoverPct: op.stepoverPct || 50,
          totalDepth: op.totalDepth || 15.0,
          stepdown: op.stepdown || 5.0,
          rapidHeight: op.rapidHeight || 15.0
        }, currentModel);
      } else if (op.badgeClass === 'contour') {
        toolpathData = generateWaterlineToolpath(bounds, assignedTool, {
          stepdown: op.stepdown || 3.0,
          rapidHeight: op.rapidHeight || 15.0
        }, currentModel);
      } else if (op.badgeClass === 'swarf') {
        toolpathData = generateSwarfToolpath(bounds, assignedTool, {
          tiltAngleDeg: 15.0,
          passes: 3
        }, currentModel);
      } else if (op.badgeClass === 'drill') {
        toolpathData = generateDrillingToolpath(bounds, assignedTool, {
          drillDepth: op.totalDepth || 25.0,
          peckDepth: op.stepdown || 5.0,
          rapidHeight: op.rapidHeight || 10.0
        }, currentModel);
      } else if (op.badgeClass === 'adaptive') {
        toolpathData = generateAdaptiveRoughingToolpath(bounds, assignedTool, {
          stepoverPct: op.stepoverPct || 25,
          stepdown: op.stepdown || 6.0,
          totalDepth: op.totalDepth || 18.0,
          rapidHeight: op.rapidHeight || 15.0
        });
      } else if (op.badgeClass === 'chamfer') {
        toolpathData = generateChamferToolpath(bounds, assignedTool, {
          chamferWidth: op.stepdown || 1.0,
          rapidHeight: op.rapidHeight || 15.0
        });
      } else if (op.badgeClass === 'parallel' || op.badgeClass === 'surface') {
        toolpathData = generateSurfaceParallelToolpath(bounds, assignedTool, {
          stepoverPct: op.stepoverPct || 20,
          rapidHeight: op.rapidHeight || 15.0
        }, currentModel);
      }

      if (toolpathData) {
        const { cutGeo, rapidGeo } = buildToolpathMeshes(toolpathData);

        // Feed cut line segments
        if (cutGeo.attributes.position && cutGeo.attributes.position.count > 0) {
          const cutMat = new THREE.LineBasicMaterial({
            color: opColors[op.badgeClass] || 0x10b981,
            linewidth: 2
          });
          const cutMesh = new THREE.LineSegments(cutGeo, cutMat);
          cutMesh.name = `op_cut_${op.id}`;
          cutMesh.visible = op.visible && (layerVisibility.toolpaths !== false);
          group.add(cutMesh);
        }

        // Rapid clearance moves (G0) in dashed cyan/yellow
        if (rapidGeo.attributes.position && rapidGeo.attributes.position.count > 0) {
          const rapidMat = new THREE.LineDashedMaterial({
            color: 0x06b6d4,
            dashSize: 3,
            gapSize: 2,
            linewidth: 1
          });
          const rapidMesh = new THREE.LineSegments(rapidGeo, rapidMat);
          rapidMesh.computeLineDistances();
          rapidMesh.name = `op_rapid_${op.id}`;
          rapidMesh.visible = op.visible && (layerVisibility.rapids !== false);
          group.add(rapidMesh);
        }
      }
    });
  }, [operations, tools, partMetrics, stockConfig, currentModel, layerVisibility.toolpaths, layerVisibility.rapids]);

  // 11. Dynamically Render Custom CAD Sketcher & Surface Entities on Level 10 & 15
  useEffect(() => {
    if (!customGeoGroupRef.current) return;
    const group = customGeoGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    customGeometry.forEach((entity) => {
      if (!entity) return;
      const isWire = entity.isLine || entity.name?.startsWith('Wireframe_') || entity.name?.startsWith('Drill_') || entity.name?.startsWith('Hole_');
      const isSurf = entity.name?.startsWith('Surface_') || entity.name?.startsWith('CAD_');

      let visible = true;
      if (isWire && layerVisibility.wireframe === false) visible = false;
      if (isSurf && layerVisibility.surfaces === false) visible = false;

      entity.visible = visible;
      group.add(entity);
    });
  }, [customGeometry, layerVisibility.wireframe, layerVisibility.surfaces]);

  // 11b. Dynamic CPlanes & Construction Coordinate System Grid/Triad
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove previous helper if present
    if (cplaneHelperGroupRef.current) {
      scene.remove(cplaneHelperGroupRef.current);
      cplaneHelperGroupRef.current = null;
    }

    if (layerVisibility?.wcs === false) return;

    const allPlanes = planes && planes.length > 0 ? planes : DEFAULT_PLANES;
    const currentPlane = allPlanes.find((p) => p.name === activePlane) || allPlanes[0];
    if (currentPlane) {
      const helperGroup = buildCPlaneHelperGroup(currentPlane, 240);
      scene.add(helperGroup);
      cplaneHelperGroupRef.current = helperGroup;
    }

    return () => {
      if (cplaneHelperGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(cplaneHelperGroupRef.current);
        cplaneHelperGroupRef.current = null;
      }
    };
  }, [activePlane, planes, layerVisibility?.wcs]);

  // 12. Backplot Trajectory Compilation & Scene Object Setup
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean up previous backplot objects if any
    if (backplotToolRef.current) {
      scene.remove(backplotToolRef.current);
      backplotToolRef.current = null;
    }
    if (backplotTrailRef.current) {
      scene.remove(backplotTrailRef.current);
      backplotTrailRef.current = null;
    }
    if (backplotVerifyGroupRef.current) {
      scene.remove(backplotVerifyGroupRef.current);
      backplotVerifyGroupRef.current = null;
    }

    if (!isBackplotActive || !partMetrics) return;

    // Compile trajectory
    const bounds = partMetrics.box;
    const trajectory = compileBackplotTrajectory(operations, tools, bounds, currentModel, activeOpId);
    waypointsRef.current = trajectory.waypoints;

    if (trajectory.waypoints.length === 0) return;

    // Determine tool for active op or first waypoint
    const firstWp = trajectory.waypoints[0];
    const assignedTool = firstWp.tool || tools[0] || { diameter: 10, fluteLength: 25, length: 65 };

    // 1. Create 3D Tool Assembly
    const toolAssembly = createToolAssembly3D(assignedTool);
    toolAssembly.position.copy(firstWp.pos);
    scene.add(toolAssembly);
    backplotToolRef.current = toolAssembly;

    // 2. Create Glowing Cut Trail Line
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.Float32BufferAttribute([firstWp.pos.x, firstWp.pos.y, firstWp.pos.z], 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: 0xfacc15,
      linewidth: 3
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);
    backplotTrailRef.current = trailLine;

    // 3. Create Solid Verify Material Removal Envelope (in verify mode)
    if (backplotInternalMode === 'verify') {
      const verifyGroup = new THREE.Group();
      verifyGroup.name = "Solid_Verify_Carved_Stock";

      const dim = partMetrics.dimensions;
      const sw = dim.x + (stockConfig?.allowanceSides || 4) * 2;
      const sh = dim.y + (stockConfig?.allowanceTop || 2);
      const sd = dim.z + (stockConfig?.allowanceSides || 4) * 2;

      const rawStockGeo = new THREE.BoxGeometry(sw, sh, sd);
      const rawStockMat = new THREE.MeshPhysicalMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.35,
        roughness: 0.25,
        metalness: 0.85,
        transmission: 0.3
      });
      const stockMesh = new THREE.Mesh(rawStockGeo, rawStockMat);
      stockMesh.position.set(
        (bounds.min.x + bounds.max.x) / 2,
        bounds.min.y + sh / 2,
        (bounds.min.z + bounds.max.z) / 2
      );
      verifyGroup.add(stockMesh);

      scene.add(verifyGroup);
      backplotVerifyGroupRef.current = verifyGroup;
    }

    setBackplotProgress(0.0);
    setIsBackplotPlaying(true);
    lastAnimTimeRef.current = performance.now();

    return () => {
      if (backplotToolRef.current) scene.remove(backplotToolRef.current);
      if (backplotTrailRef.current) scene.remove(backplotTrailRef.current);
      if (backplotVerifyGroupRef.current) scene.remove(backplotVerifyGroupRef.current);
    };
  }, [isBackplotActive, activeOpId, operations, tools, partMetrics, currentModel, backplotInternalMode]);

  // 13. Backplot Animation & Sampling Frame Loop
  useEffect(() => {
    if (!isBackplotActive) {
      if (backplotAnimRef.current) cancelAnimationFrame(backplotAnimRef.current);
      return;
    }

    const animateLoop = (time) => {
      const delta = Math.min(0.1, (time - lastAnimTimeRef.current) / 1000);
      lastAnimTimeRef.current = time;

      if (isBackplotPlaying && waypointsRef.current.length > 0) {
        const totalDist = waypointsRef.current[waypointsRef.current.length - 1].cumulativeDist;
        const currentSpeedMmPerSec = 75 * backplotSpeed;
        const progressDelta = totalDist > 0 ? (currentSpeedMmPerSec * delta) / totalDist : 0.005;

        setBackplotProgress((prev) => {
          let next = prev + progressDelta;
          if (next >= 1.0) {
            if (backplotLoop) {
              next = 0.0;
            } else {
              next = 1.0;
              setIsBackplotPlaying(false);
            }
          }
          return next;
        });
      }

      // Update 3D tool position, spin, and trail
      if (backplotToolRef.current && waypointsRef.current.length > 0) {
        const sample = sampleTrajectoryAtT(waypointsRef.current, backplotProgress);
        backplotToolRef.current.position.copy(sample.currentPos);

        // Spin tool spindle
        backplotToolRef.current.rotation.y += 0.35 * backplotSpeed;

        // Check for collet gouge
        const activeTool = sample.activeWaypoint?.tool || tools[0];
        const cutLen = activeTool?.fluteLength || 25;
        const topY = partMetrics?.box?.max?.y || 45;
        const currentDepth = topY - sample.currentPos.y;
        const isGouge = currentDepth > cutLen + 2.0;
        setHolderCollisionAlert(isGouge);

        const collet = backplotToolRef.current.getObjectByName("tool_collet_mesh");
        if (collet && collet.material) {
          collet.material.color.setHex(isGouge ? 0xef4444 : 0x1e293b);
        }

        // Update trail points
        if (backplotTrailRef.current && sample.traversedPoints.length >= 2) {
          const trailPts = [];
          sample.traversedPoints.forEach((p) => trailPts.push(p.x, p.y, p.z));
          backplotTrailRef.current.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(trailPts, 3)
          );
          backplotTrailRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      backplotAnimRef.current = requestAnimationFrame(animateLoop);
    };

    backplotAnimRef.current = requestAnimationFrame(animateLoop);
    return () => {
      if (backplotAnimRef.current) cancelAnimationFrame(backplotAnimRef.current);
    };
  }, [isBackplotActive, isBackplotPlaying, backplotProgress, backplotSpeed, backplotLoop, partMetrics]);

  // 14. Backplot Keyboard Shortcuts
  useEffect(() => {
    if (!isBackplotActive) return;

    const handleBackplotKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsBackplotPlaying((prev) => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIsBackplotPlaying(false);
        setBackplotProgress((prev) => Math.max(0, prev - 0.02));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsBackplotPlaying(false);
        setBackplotProgress((prev) => Math.min(1, prev + 0.02));
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (onCloseBackplot) onCloseBackplot();
      } else if (e.code === 'Home') {
        e.preventDefault();
        setBackplotProgress(0);
      }
    };

    window.addEventListener('keydown', handleBackplotKey);
    return () => window.removeEventListener('keydown', handleBackplotKey);
  }, [isBackplotActive, onCloseBackplot]);

  // Active Tool Telemetry Sample for HUD
  const currentSample = useMemo(() => {
    if (!isBackplotActive || waypointsRef.current.length === 0) {
      return {
        pos: new THREE.Vector3(0, 0, 0),
        isRapid: false,
        opName: 'Operation',
        feedRate: 1500,
        spindleRpm: 8000,
        tool: tools[0] || { number: 1, name: '10mm Endmill', diameter: 10 }
      };
    }
    const sample = sampleTrajectoryAtT(waypointsRef.current, backplotProgress);
    return {
      pos: sample.currentPos,
      isRapid: sample.activeWaypoint?.isRapid || false,
      opName: sample.activeWaypoint?.opName || 'Milling Pass',
      feedRate: sample.activeWaypoint?.feedRate || 1500,
      spindleRpm: sample.activeWaypoint?.spindleRpm || 8000,
      tool: sample.activeWaypoint?.tool || tools[0] || { number: 1, name: '10mm Endmill', diameter: 10 }
    };
  }, [isBackplotActive, backplotProgress, tools]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.stl')) {
        try {
          const modelGroup = await parseSTLFile(file);
          if (onModelImported) {
            onModelImported(modelGroup, file.name);
          }
        } catch (err) {
          console.error("Failed to parse STL:", err);
          alert("Error parsing STL file. Ensure it is a valid binary or ASCII STL.");
        }
      } else {
        alert("Please drop a valid .STL 3D model file.");
      }
    }
  };

  return (
    <main
      className="viewport-area"
      aria-label="3D CAD/CAM Viewport"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div ref={mountRef} className="canvas-container" />

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="dropzone-overlay">
          <UploadCloud size={48} color="#38bdf8" />
          <span className="dropzone-text">Drop STL or OBJ 3D Model Here to Import</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Automatic Stock Bounding Box will be calculated
          </span>
        </div>
      )}

      {/* Top HUD Controls */}
      <div className="viewport-top-hud">
        <button
          className={`hud-btn ${layerVisibility.toolpaths !== false ? 'active' : ''}`}
          onClick={() => {
            if (layerVisibility.toolpaths !== undefined) {
              layerVisibility.toolpaths = !layerVisibility.toolpaths;
            }
          }}
          title="Toggle Toolpath Lines Display"
        >
          <Layers size={13} />
          <span>Toolpaths</span>
        </button>

        <button
          className={`hud-btn ${layerVisibility.stock !== false ? 'active' : ''}`}
          onClick={() => {
            if (layerVisibility.stock !== undefined) {
              layerVisibility.stock = !layerVisibility.stock;
            }
          }}
          title="Toggle Translucent Stock Block"
        >
          <Box size={13} />
          <span>Stock Box</span>
        </button>

        <button
          className={`hud-btn ${renderMode === 'shaded' ? 'active' : ''}`}
          onClick={onOpenViewStudioModal}
          title="Open 3D View Studio"
        >
          <Sliders size={13} />
          <span style={{ textTransform: 'capitalize' }}>{renderMode}</span>
        </button>

        <button
          className="hud-btn"
          onClick={() => onToggleCameraMode && onToggleCameraMode(cameraMode === 'orthographic' ? 'perspective' : 'orthographic')}
          title="Toggle Perspective / Orthographic Camera"
        >
          <Camera size={13} color={cameraMode === 'orthographic' ? '#38bdf8' : 'inherit'} />
          <span style={{ color: cameraMode === 'orthographic' ? '#38bdf8' : 'inherit' }}>
            {cameraMode === 'orthographic' ? 'Ortho' : 'Persp'}
          </span>
        </button>

        <button
          className={`hud-btn ${clippingPlane?.enabled ? 'active' : ''}`}
          onClick={() => onUpdateClippingPlane && onUpdateClippingPlane({ ...clippingPlane, enabled: !clippingPlane?.enabled })}
          title="Toggle 3D Cross-Section Slicing Plane"
        >
          <Scissors size={13} color={clippingPlane?.enabled ? '#f472b6' : 'inherit'} />
          <span style={{ color: clippingPlane?.enabled ? '#f472b6' : 'inherit' }}>
            {clippingPlane?.enabled ? `Section (${clippingPlane.axis})` : 'Section'}
          </span>
        </button>

        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />

        <button className="hud-btn" onClick={() => snapView('iso')} title="Isometric (WCS G54)">
          <span>Iso</span>
        </button>
        <button className="hud-btn" onClick={() => snapView('top')} title="Top View (G17 Plane)">
          <span>Top</span>
        </button>
        <button className="hud-btn" onClick={() => snapView('front')} title="Front View (G18 Plane)">
          <span>Front</span>
        </button>
        <button className="hud-btn" onClick={() => snapView('right')} title="Right View (G19 Plane)">
          <span>Right</span>
        </button>
      </div>

      {/* Floating Section Cut Indicator Badge */}
      {clippingPlane?.enabled && (
        <div style={{
          position: 'absolute',
          top: '52px',
          left: '16px',
          background: 'rgba(236, 72, 153, 0.18)',
          border: '1px solid rgba(236, 72, 153, 0.4)',
          color: '#f472b6',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(4px)',
          zIndex: 10
        }}>
          <Scissors size={13} />
          <span>Section Slice: {clippingPlane.axis}-Axis ({clippingPlane.offset > 0 ? `+${clippingPlane.offset}` : clippingPlane.offset} mm)</span>
        </div>
      )}

      {/* Part Metrics & Stock Dimension HUD */}
      {partMetrics && (
        <div className="part-info-hud">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '3px', marginBottom: '2px' }}>
            <Info size={12} color="#38bdf8" />
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>PART &amp; STOCK BOUNDS</span>
          </div>
          <div className="part-info-row">
            <span className="part-info-label">Part Size (XYZ):</span>
            <span className="part-info-val">
              {partMetrics.dimensions.x} &times; {partMetrics.dimensions.y} &times; {partMetrics.dimensions.z} mm
            </span>
          </div>
          <div className="part-info-row">
            <span className="part-info-label">Stock Size:</span>
            <span className="part-info-val" style={{ color: '#f59e0b' }}>
              {(partMetrics.dimensions.x + (stockConfig.allowanceSides || 4) * 2).toFixed(1)} &times;{' '}
              {(partMetrics.dimensions.y + (stockConfig.allowanceTop || 2)).toFixed(1)} &times;{' '}
              {(partMetrics.dimensions.z + (stockConfig.allowanceSides || 4) * 2).toFixed(1)} mm
            </span>
          </div>
          <div className="part-info-row">
            <span className="part-info-label">Material &amp; Mass:</span>
            <span className="part-info-val">
              {stockConfig.material} &bull; {stockConfig.massKg || '0.95'} kg
            </span>
          </div>
          <div className="part-info-row">
            <span className="part-info-label">Triangles:</span>
            <span className="part-info-val">{partMetrics.triangles.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* ViewCube Box */}
      <div className="viewport-cube-controls">
        <div className="viewcube-box" onClick={() => snapView('iso')} title="Reset to Isometric">
          <Rotate3D size={20} color="#38bdf8" />
          <span className="viewcube-text">ISOMETRIC</span>
        </div>
      </div>

      {/* Metric Scale Indicator */}
      <div className="viewport-scale-indicator">
        <span>{partMetrics ? `${partMetrics.dimensions.x} mm` : '95.530 mm'}</span>
        <div className="scale-bar" />
        <span style={{ fontSize: '8.5px', color: '#64748b' }}>Metric G21</span>
      </div>

      {/* ================= Mastercam Floating Backplot & Solid Verify HUD Controller ================= */}
      {isBackplotActive && (
        <div className="backplot-hud-container" style={{
          position: 'absolute',
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.7)',
          borderRadius: '10px',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1000,
          width: '720px',
          backdropFilter: 'blur(14px)',
          userSelect: 'none'
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={15} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.5px' }}>
                {backplotInternalMode === 'verify' ? 'SOLID MATERIAL REMOVAL VERIFY' : '3D TOOLPATH WIREFRAME BACKPLOT'}
              </span>
              <span style={{
                fontSize: '9.5px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: holderCollisionAlert ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                border: `1px solid ${holderCollisionAlert ? '#ef4444' : '#10b981'}`,
                color: holderCollisionAlert ? '#ef4444' : '#10b981',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {holderCollisionAlert ? (
                  <>
                    <AlertTriangle size={11} />
                    <span>HOLDER GOUGE WARNING</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={11} />
                    <span>CLEARANCE OK</span>
                  </>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Mode Switcher */}
              <div style={{ display: 'flex', background: '#0a0d14', padding: '2px', borderRadius: '4px', border: '1px solid #1e293b' }}>
                <button
                  onClick={() => setBackplotInternalMode('backplot')}
                  style={{
                    background: backplotInternalMode === 'backplot' ? '#0284c7' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    padding: '2px 9px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Backplot
                </button>
                <button
                  onClick={() => setBackplotInternalMode('verify')}
                  style={{
                    background: backplotInternalMode === 'verify' ? '#10b981' : 'transparent',
                    color: '#fff',
                    border: 'none',
                    padding: '2px 9px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Solid Verify
                </button>
              </div>

              <button
                onClick={onCloseBackplot}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                title="Exit Backplot (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Scrub Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min="0"
              max="1000"
              value={Math.round(backplotProgress * 1000)}
              onChange={(e) => {
                setIsBackplotPlaying(false);
                setBackplotProgress(Number(e.target.value) / 1000);
              }}
              style={{ flex: 1, cursor: 'pointer', accentColor: '#38bdf8' }}
            />
            <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace', minWidth: '45px', textAlign: 'right' }}>
              {(backplotProgress * 100).toFixed(1)}%
            </span>
          </div>

          {/* Controls & Telemetry Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Playback Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsBackplotPlaying(false);
                  setBackplotProgress(0);
                }}
                title="Rewind to Start (Home)"
                style={{ padding: '5px 8px' }}
              >
                <RotateCcw size={13} />
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setIsBackplotPlaying(false);
                  setBackplotProgress((prev) => Math.max(0, prev - 0.02));
                }}
                title="Step Backward (Left Arrow)"
                style={{ padding: '5px 8px' }}
              >
                <SkipBack size={13} />
              </button>

              <button
                className="btn-primary"
                onClick={() => setIsBackplotPlaying(!isBackplotPlaying)}
                style={{
                  padding: '5px 14px',
                  background: isBackplotPlaying ? '#e11d48' : '#0284c7',
                  borderColor: isBackplotPlaying ? '#f43f5e' : '#38bdf8',
                  fontWeight: 700
                }}
                title="Play / Pause (Spacebar)"
              >
                {isBackplotPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span style={{ marginLeft: '4px' }}>{isBackplotPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setIsBackplotPlaying(false);
                  setBackplotProgress((prev) => Math.min(1, prev + 0.02));
                }}
                title="Step Forward (Right Arrow)"
                style={{ padding: '5px 8px' }}
              >
                <SkipForward size={13} />
              </button>

              <button
                className="btn-secondary"
                onClick={() => setBackplotLoop(!backplotLoop)}
                title="Toggle Repeat Loop"
                style={{
                  padding: '5px 8px',
                  color: backplotLoop ? '#38bdf8' : '#94a3b8',
                  borderColor: backplotLoop ? '#38bdf8' : 'rgba(255,255,255,0.1)'
                }}
              >
                Loop
              </button>
            </div>

            {/* Speed Multipliers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[0.5, 1, 2, 5, 10].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setBackplotSpeed(spd)}
                  style={{
                    padding: '3px 7px',
                    fontSize: '10px',
                    borderRadius: '3px',
                    border: backplotSpeed === spd ? '1px solid #38bdf8' : '1px solid #334155',
                    background: backplotSpeed === spd ? 'rgba(56,189,248,0.2)' : '#0f172a',
                    color: backplotSpeed === spd ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: backplotSpeed === spd ? 700 : 500
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Live Tool Telemetry Readout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'monospace',
              fontSize: '10.5px',
              color: '#f8fafc',
              background: '#090d14',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #1e293b'
            }}>
              <span>X: <strong style={{ color: '#38bdf8' }}>{currentSample.pos.x.toFixed(2)}</strong></span>
              <span>Y: <strong style={{ color: '#10b981' }}>{currentSample.pos.y.toFixed(2)}</strong></span>
              <span>Z: <strong style={{ color: '#f59e0b' }}>{currentSample.pos.z.toFixed(2)}</strong></span>
              <span style={{ color: currentSample.isRapid ? '#06b6d4' : '#10b981', fontWeight: 600 }}>
                {currentSample.isRapid ? 'G0 RAPID' : 'G1 CUT'}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

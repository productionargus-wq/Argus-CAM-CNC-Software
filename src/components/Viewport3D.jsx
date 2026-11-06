import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Eye, Layers, Rotate3D, UploadCloud, Box, Info, Scissors, Camera, Sun, Sliders,
  Play, Pause, SkipForward, SkipBack, RotateCcw, X, AlertTriangle, CheckCircle2, Gauge
} from 'lucide-react';
import { parseSTLFile, calculatePartMetrics, createWireframeLine, createWireframeRect, createWireframeCircle, createPointMarker } from '../utils/cadGeometry';
import { parseAnyCADFile } from '../utils/universalCadParser';
import DrawingToolbarHUD from './DrawingToolbarHUD';
import ScaleRulerHUD from './ScaleRulerHUD';
import ViewGnomonHUD from './ViewGnomonHUD';
import {
  createSketchPlane,
  snapToGrid,
  snapToEntityPoints,
  createGhostPreview,
  createSnapIndicator
} from '../utils/cadDrawingEngine';
import {
  generateFacingToolpath,
  generatePocketToolpath,
  generateWaterlineToolpath,
  generateSwarfToolpath,
  generateDrillingToolpath,
  generateCircleMillToolpath,
  generateSpotDrillToolpath,
  generateTapToolpath,
  generateAdaptiveRoughingToolpath,
  generateChamferToolpath,
  generateSurfaceParallelToolpath,
  generateRestMillingToolpath,
  generatePencilTracingToolpath,
  generateProbingToolpath,
  buildToolpathMeshes,
  createToolAssembly3D,
  compileBackplotTrajectory,
  sampleTrajectoryAtT
} from '../utils/toolpathEngine';
import {
  buildCPlaneHelperGroup,
  DEFAULT_PLANES
} from '../utils/cplaneGeometry';
import {
  buildDeviationHeatmapStock,
  extractModelTriangles
} from '../utils/toleranceHeatmap';
import { VoxelStockSimulator } from '../utils/voxelStockEngine';
import { createParametricFixture3D, DEFAULT_FIXTURE_CONFIG } from '../utils/fixtureEngine';

export default function Viewport3D({
  currentModel,
  stockConfig,
  fixtureConfig = DEFAULT_FIXTURE_CONFIG,
  unitSystem = 'imperial',
  operations,
  tools,
  activeOpId = null,
  activePlane = 'Top (G17)',
  planes = [],
  theme = 'light',
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
  isSketchModeActive = false,
  onToggleSketchMode = null,
  sketchTool = 'line',
  onChangeSketchTool = null,
  onAddCustomEntity = null,
  onRemoveCustomEntity = null,
  onClearWireframes = null,
  onGenerateToolpathFromSketch = null,
  onOpenViewStudioModal,
  onToggleCameraMode,
  onUpdateClippingPlane,
  onChangeRenderMode,
  showArcCenters = true,
  showEndpoints = false
}) {
  const isLight = theme !== 'dark';
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const toolpathGroupRef = useRef(null);
  const partHolderGroupRef = useRef(null);
  const fixtureGroupRef = useRef(null);
  const gridHelperRef = useRef(null);
  const stockMeshRef = useRef(null);
  const stockWireframeRef = useRef(null);
  const customGeoGroupRef = useRef(null);
  const arcCentersGroupRef = useRef(null);
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
  const [heatmapTolerance, setHeatmapTolerance] = useState(0.02);
  const [heatmapStats, setHeatmapStats] = useState(null);
  const [backplotSelectedOpFilter, setBackplotSelectedOpFilter] = useState('all');

  const backplotToolRef = useRef(null);
  const backplotTrailRef = useRef(null);
  const backplotVerifyGroupRef = useRef(null);
  const viewportSimulatorRef = useRef(null);
  const backplotAnimRef = useRef(null);
  const lastAnimTimeRef = useRef(performance.now());
  const waypointsRef = useRef([]);
  const backplotProgressRef = useRef(0.0);

  useEffect(() => {
    setBackplotInternalMode(backplotMode || 'backplot');
  }, [backplotMode]);

  const [isDragOver, setIsDragOver] = useState(false);
  const [partMetrics, setPartMetrics] = useState(null);

  // CAD Interactive In-Viewport Sketcher State & Refs
  const [activeSketchTool, setActiveSketchTool] = useState(sketchTool || 'line');
  const [gridSnap, setGridSnap] = useState(true);
  const [gridStep, setGridStep] = useState(5.0);
  const [objectSnap, setObjectSnap] = useState(true);
  const [orthoLock, setOrthoLock] = useState(false);
  const [sketchAnchor, setSketchAnchor] = useState(null);
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0, z: 0 });
  const [dimensionFeedback, setDimensionFeedback] = useState(null);
  const [currentViewName, setCurrentViewName] = useState('Top');
  const [snapMode, setSnapMode] = useState('auto');
  const [isSnapLocked, setIsSnapLocked] = useState(false);
  const [camDist, setCamDist] = useState(350);

  const sketchGhostGroupRef = useRef(null);
  const snapIndicatorGroupRef = useRef(null);
  const sketchAnchorRef = useRef(null);
  const isSketchModeRef = useRef(isSketchModeActive);
  const activeSketchToolRef = useRef(sketchTool || 'line');
  const gridSnapRef = useRef(true);
  const gridStepRef = useRef(5.0);
  const objectSnapRef = useRef(true);
  const orthoLockRef = useRef(false);
  const customGeometryRef = useRef(customGeometry);
  const onAddCustomEntityRef = useRef(onAddCustomEntity);

  useEffect(() => {
    isSketchModeRef.current = isSketchModeActive;
    if (isSketchModeActive) {
      snapView('top');
    } else {
      if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
      if (snapIndicatorGroupRef.current) snapIndicatorGroupRef.current.clear();
      sketchAnchorRef.current = null;
      setSketchAnchor(null);
      setDimensionFeedback(null);
    }
  }, [isSketchModeActive]);

  useEffect(() => {
    setActiveSketchTool(sketchTool);
    activeSketchToolRef.current = sketchTool;
    sketchAnchorRef.current = null;
    setSketchAnchor(null);
    if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
    setDimensionFeedback(null);
  }, [sketchTool]);

  useEffect(() => {
    customGeometryRef.current = customGeometry;
  }, [customGeometry]);

  useEffect(() => {
    onAddCustomEntityRef.current = onAddCustomEntity;
  }, [onAddCustomEntity]);

  useEffect(() => {
    gridSnapRef.current = gridSnap;
  }, [gridSnap]);

  useEffect(() => {
    gridStepRef.current = gridStep;
  }, [gridStep]);

  useEffect(() => {
    objectSnapRef.current = objectSnap;
  }, [objectSnap]);

  useEffect(() => {
    orthoLockRef.current = orthoLock;
  }, [orthoLock]);

  // 1. Initial Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const isLightInit = theme === 'light';
    scene.background = isLightInit ? null : new THREE.Color(0x131722);
    scene.fog = isLightInit ? null : new THREE.FogExp2(0x131722, 0.002);

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
    const gridHelper = new THREE.GridHelper(
      400,
      40,
      isLightInit ? 0x94a3b8 : 0x334155,
      isLightInit ? 0xcbd5e1 : 0x1e293b
    );
    gridHelper.position.y = -20;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // Fixture Group (Parametric CNC Workholding & Vise)
    const initialBounds = new THREE.Box3(
      new THREE.Vector3(-40, 49, -35),
      new THREE.Vector3(40, 85, 35)
    );
    const fixtureGroup = createParametricFixture3D(fixtureConfig || DEFAULT_FIXTURE_CONFIG, initialBounds, theme);
    fixtureGroup.name = "fixture_group";
    scene.add(fixtureGroup);
    fixtureGroupRef.current = fixtureGroup;

    // Part Holder Group (Workpiece)
    const partHolderGroup = new THREE.Group();
    partHolderGroup.name = "part_holder_group";
    partHolderGroup.position.set(0, 49, 0);
    scene.add(partHolderGroup);
    partHolderGroupRef.current = partHolderGroup;

    // Dynamic Toolpaths Group
    const toolpathGroup = new THREE.Group();
    scene.add(toolpathGroup);
    toolpathGroupRef.current = toolpathGroup;

    // Custom CAD Entities (Wireframe lines, circles, rects, surfaces)
    const customGeoGroup = new THREE.Group();
    customGeoGroup.position.set(0, 49, 0);
    scene.add(customGeoGroup);
    customGeoGroupRef.current = customGeoGroup;

    // Interactive Sketch Ghost & Snap Indicator Groups
    const sketchGhostGroup = new THREE.Group();
    sketchGhostGroup.name = "Sketch_Ghost_Group";
    customGeoGroup.add(sketchGhostGroup);
    sketchGhostGroupRef.current = sketchGhostGroup;

    const snapIndicatorGroup = new THREE.Group();
    snapIndicatorGroup.name = "Snap_Indicator_Group";
    customGeoGroup.add(snapIndicatorGroup);
    snapIndicatorGroupRef.current = snapIndicatorGroup;

    // Drafting Dimension Callouts Group
    const dimensionGroup = new THREE.Group();
    dimensionGroup.position.set(0, 49, 0);
    scene.add(dimensionGroup);
    dimensionGroupRef.current = dimensionGroup;

    // Arc Center Points & Endpoints Indicators Group
    const arcCentersGroup = new THREE.Group();
    arcCentersGroup.name = 'arc_center_indicators';
    scene.add(arcCentersGroup);
    arcCentersGroupRef.current = arcCentersGroup;

    // Raycasting for Interactive CAD Drawing
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const sketchPlane = new THREE.Plane();

    const getSketchIntersection = (e) => {
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const topY = partMetrics?.box?.max?.y ?? 35;
      const worldY = 49 + topY;
      sketchPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, worldY, 0));

      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(sketchPlane, target);
      if (!hit) return null;

      return new THREE.Vector3(Number(hit.x.toFixed(3)), Number(topY.toFixed(3)), Number(hit.z.toFixed(3)));
    };

    // Mouse Drag Orbit & Pan
    let isDragging = false;
    let isPanning = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = new THREE.Spherical(340, Math.PI / 3.4, Math.PI / 4);

    const onMouseDown = (e) => {
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (isSketchModeRef.current) {
        // Pan on right-click or orbit on middle-click / Shift+Click
        if (e.button === 2) {
          isPanning = true;
          return;
        }
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
          isDragging = true;
          return;
        }

        // Left-Click: CAD In-Viewport Drawing
        if (e.button === 0) {
          const localPt = getSketchIntersection(e);
          if (!localPt) return;

          let finalPt = localPt;
          let snapResult = { snapped: false, point: localPt };
          if (objectSnapRef.current) {
            snapResult = snapToEntityPoints(localPt, customGeometryRef.current, 5.0);
          }
          if (snapResult.snapped) {
            finalPt = snapResult.point;
          } else if (gridSnapRef.current) {
            finalPt = snapToGrid(localPt, gridStepRef.current, orthoLockRef.current, sketchAnchorRef.current);
          }

          const tool = activeSketchToolRef.current;

          if (tool === 'drill') {
            const marker = createPointMarker([finalPt.x, finalPt.y, finalPt.z], `Drill_Point_${Date.now()}`, 0xef4444);
            if (onAddCustomEntityRef.current) onAddCustomEntityRef.current(marker);
            return;
          }

          if (tool === 'line' || tool === 'rect' || tool === 'circle') {
            if (!sketchAnchorRef.current) {
              sketchAnchorRef.current = finalPt.clone();
              setSketchAnchor(finalPt.clone());
            } else {
              const anchor = sketchAnchorRef.current;
              let newEntity = null;

              if (tool === 'line') {
                newEntity = createWireframeLine(
                  [anchor.x, anchor.y, anchor.z],
                  [finalPt.x, finalPt.y, finalPt.z],
                  { color: 0xf43f5e }
                );
              } else if (tool === 'rect') {
                const w = Math.max(1, Math.abs(finalPt.x - anchor.x));
                const d = Math.max(1, Math.abs(finalPt.z - anchor.z));
                const cx = (anchor.x + finalPt.x) / 2;
                const cz = (anchor.z + finalPt.z) / 2;
                newEntity = createWireframeRect(w, d, anchor.y, 0, [cx, cz], { color: 0x4ade80 });
              } else if (tool === 'circle') {
                const radius = Math.max(1, anchor.distanceTo(finalPt));
                newEntity = createWireframeCircle(radius, anchor.y, [anchor.x, anchor.z], 0, 360, 'G17', { color: 0x38bdf8 });
              }

              if (newEntity && onAddCustomEntityRef.current) {
                onAddCustomEntityRef.current(newEntity);
              }

              sketchAnchorRef.current = null;
              setSketchAnchor(null);
              setDimensionFeedback(null);
              if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
            }
          }
          return;
        }
      }

      if (e.button === 0) isDragging = true;
      if (e.button === 2) isPanning = true;
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
        return;
      } else if (isPanning) {
        camera.position.x -= deltaX * 0.4;
        camera.position.y += deltaY * 0.4;
        return;
      }

      // Sketch Mode Hover & Ghost Preview
      if (isSketchModeRef.current) {
        const localPt = getSketchIntersection(e);
        if (localPt) {
          let finalPt = localPt;
          let snapResult = { snapped: false, point: localPt, type: null };
          if (objectSnapRef.current) {
            snapResult = snapToEntityPoints(localPt, customGeometryRef.current, 5.0);
          }
          if (snapResult.snapped) {
            finalPt = snapResult.point;
          } else if (gridSnapRef.current) {
            finalPt = snapToGrid(localPt, gridStepRef.current, orthoLockRef.current, sketchAnchorRef.current);
          }

          setCursorCoords({ x: finalPt.x, y: finalPt.y, z: finalPt.z });

          // Update snap indicator marker
          if (snapIndicatorGroupRef.current) {
            snapIndicatorGroupRef.current.clear();
            if (snapResult.snapped) {
              snapIndicatorGroupRef.current.add(createSnapIndicator(finalPt, snapResult.type));
            }
          }

          // Update rubber-band ghost preview if anchor set
          if (sketchAnchorRef.current && sketchGhostGroupRef.current) {
            const anchor = sketchAnchorRef.current;
            const tool = activeSketchToolRef.current;
            sketchGhostGroupRef.current.clear();
            const ghost = createGhostPreview(tool, anchor, finalPt);
            sketchGhostGroupRef.current.add(ghost);

            if (tool === 'line') {
              const len = anchor.distanceTo(finalPt).toFixed(1);
              setDimensionFeedback(`L: ${len} mm`);
            } else if (tool === 'rect') {
              const w = Math.abs(finalPt.x - anchor.x).toFixed(1);
              const d = Math.abs(finalPt.z - anchor.z).toFixed(1);
              setDimensionFeedback(`W: ${w} mm, D: ${d} mm`);
            } else if (tool === 'circle') {
              const r = anchor.distanceTo(finalPt).toFixed(1);
              setDimensionFeedback(`R: ${r} mm (Ø ${(r * 2).toFixed(1)} mm)`);
            }
          }
        }
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
    if (preset === 'iso') {
      cam.position.set(220, 180, 260);
      setCurrentViewName('Isometric');
    } else if (preset === 'top') {
      cam.position.set(0, 360, 0.001);
      setCurrentViewName('Top');
    } else if (preset === 'front') {
      cam.position.set(0, 50, 360);
      setCurrentViewName('Front');
    } else if (preset === 'right') {
      cam.position.set(360, 50, 0);
      setCurrentViewName('Right');
    } else if (preset === 'bottom') {
      cam.position.set(0, -360, 0.001);
      setCurrentViewName('Bottom');
    } else if (preset === 'left') {
      cam.position.set(-360, 50, 0);
      setCurrentViewName('Left');
    } else if (preset === 'back') {
      cam.position.set(0, 50, -360);
      setCurrentViewName('Back');
    } else if (preset === 'fit') {
      cam.position.set(200, 150, 240);
    } else if (preset === 'unzoom_50') cam.position.multiplyScalar(1.5);
    else if (preset === 'unzoom_80') cam.position.multiplyScalar(1.8);

    const centerY = currentModel ? 45 : 0;
    cam.lookAt(0, centerY, 0);
    setCamDist(cam.position.distanceTo(new THREE.Vector3(0, centerY, 0)));
  };

  useEffect(() => {
    if (cameraCommand?.preset) {
      snapView(cameraCommand.preset);
    }
  }, [cameraCommand]);

  // 3. Update 3D Model in Viewport when currentModel changes
  useEffect(() => {
    if (!partHolderGroupRef.current) return;
    const holder = partHolderGroupRef.current;

    while (holder.children.length > 0) {
      holder.remove(holder.children[0]);
    }

    if (!currentModel) {
      const defaultMetrics = {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { x: 100, y: 25, z: 80 },
        box: { min: { x: -50, y: 0, z: -40 }, max: { x: 50, y: 0, z: 40 } },
        triangles: 0
      };
      setPartMetrics(defaultMetrics);
      if (onMetricsCalculated) onMetricsCalculated(defaultMetrics);
      return;
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

    const isLight = theme === 'light';
    if (lightingMode === 'shop') {
      scene.background = isLight ? null : new THREE.Color(0x0f172a);
      ambient.intensity = 1.0;
      l1.intensity = 1.6;
      l2.intensity = 0.8;
      l1.position.set(0, 400, 0);
    } else if (lightingMode === 'inspect') {
      scene.background = isLight ? null : new THREE.Color(0x090d16);
      ambient.intensity = 0.35;
      l1.intensity = 2.2;
      l2.intensity = 1.2;
      l1.position.set(150, 200, 300);
    } else {
      scene.background = isLight ? null : new THREE.Color(0x131722);
      ambient.intensity = 0.75;
      l1.intensity = 1.3;
      l2.intensity = 0.5;
      l1.position.set(200, 300, 150);
    }
  }, [lightingMode, theme]);

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

  // 6b. Arc Center Points & Curve Endpoints Indicators (Real CAD entities only)
  useEffect(() => {
    if (!arcCentersGroupRef.current) return;
    const group = arcCentersGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    if (showArcCenters && customGeometry && customGeometry.length > 0) {
      const centerMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
      const ringGeo = new THREE.RingGeometry(1.2, 1.8, 16);

      const arcEntities = customGeometry.filter((g) => g.type === 'circle' || g.type === 'arc');
      arcEntities.forEach((arc) => {
        if (!arc.center) return;
        const marker = new THREE.Group();
        marker.position.set(arc.center.x || 0, arc.center.y || 0, arc.center.z || 0);

        const crossGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-3.5, 0, 0), new THREE.Vector3(3.5, 0, 0),
          new THREE.Vector3(0, -3.5, 0), new THREE.Vector3(0, 3.5, 0),
          new THREE.Vector3(0, 0, -3.5), new THREE.Vector3(0, 0, 3.5)
        ]);
        const cross = new THREE.LineSegments(crossGeo, centerMat);
        marker.add(cross);

        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        marker.add(ring);

        group.add(marker);
      });
    }

    if (showEndpoints && customGeometry && customGeometry.length > 0) {
      const points = [];
      customGeometry.forEach((g) => {
        if (g.start) points.push(new THREE.Vector3(g.start.x, g.start.y, g.start.z || 0));
        if (g.end) points.push(new THREE.Vector3(g.end.x, g.end.y, g.end.z || 0));
      });
      if (points.length > 0) {
        const ptMat = new THREE.PointsMaterial({ color: 0xf59e0b, size: 5, sizeAttenuation: false });
        const ptGeo = new THREE.BufferGeometry().setFromPoints(points);
        const pts = new THREE.Points(ptGeo, ptMat);
        group.add(pts);
      }
    }
  }, [showArcCenters, showEndpoints, customGeometry]);

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
  }, [layerVisibility, currentModel]);

  // 7b. Update Dynamic Workholding Fixture Mesh
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (fixtureGroupRef.current) {
      scene.remove(fixtureGroupRef.current);
      fixtureGroupRef.current = null;
    }

    const bounds = partMetrics?.box || partMetrics?.bounds || new THREE.Box3(
      new THREE.Vector3(-40, 49, -35),
      new THREE.Vector3(40, 85, 35)
    );

    const fixtureMesh = createParametricFixture3D(fixtureConfig || DEFAULT_FIXTURE_CONFIG, bounds, theme);
    fixtureMesh.visible = layerVisibility.fixture !== false;
    scene.add(fixtureMesh);
    fixtureGroupRef.current = fixtureMesh;
  }, [fixtureConfig, partMetrics, stockConfig, layerVisibility.fixture, theme]);

  // 8. Update Dynamic Stock Box Mesh
  useEffect(() => {
    if (!sceneRef.current || !partMetrics) return;
    const scene = sceneRef.current;

    if (stockMeshRef.current) scene.remove(stockMeshRef.current);
    if (stockWireframeRef.current) scene.remove(stockWireframeRef.current);

    const dim = partMetrics.dimensions;
    const shape = stockConfig?.shape || 'box';
    const axis = stockConfig?.axis || 'X';

    let stockGeo;
    let posY = 49;

    if (shape === 'cylinder' || shape === 'tube') {
      const dia = stockConfig.diameter || (Math.max(dim.y, dim.z) + (stockConfig.allowanceSides || 4) * 2);
      const rad = dia / 2;
      const len = stockConfig.length || (dim.x + (stockConfig.allowanceTop || 2) * 2);

      stockGeo = new THREE.CylinderGeometry(rad, rad, len, 48);
      if (axis === 'X') {
        stockGeo.rotateZ(Math.PI / 2);
        posY = 49 + rad;
      } else if (axis === 'Z') {
        stockGeo.rotateX(Math.PI / 2);
        posY = 49 + rad;
      } else {
        posY = 49 + len / 2;
      }
    } else {
      const stockW = dim.x + (stockConfig.allowanceSides || 4) * 2;
      const stockH = dim.y + (stockConfig.allowanceTop || 2);
      const stockD = dim.z + (stockConfig.allowanceSides || 4) * 2;
      stockGeo = new THREE.BoxGeometry(stockW, stockH, stockD);
      posY = 49 + stockH / 2;
    }

    const stockMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false
    });

    const stockMesh = new THREE.Mesh(stockGeo, stockMat);
    stockMesh.position.set(0, posY, 0);
    stockMesh.visible = layerVisibility.stock !== false;
    scene.add(stockMesh);
    stockMeshRef.current = stockMesh;

    const edges = new THREE.EdgesGeometry(stockGeo, shape === 'cylinder' || shape === 'tube' ? 24 : 1);
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
        circlemill: 0xa855f7,
        contour: 0xf59e0b,
        swarf: 0x8b5cf6,
        drill: 0xef4444,
        spotdrill: 0x059669,
        adaptive: 0x06b6d4,
        dynamic: 0x06b6d4,
        chamfer: 0xec4899,
        tap: 0x06b6d4,
        parallel: 0xd946ef,
        surface: 0xd946ef,
        rest: 0x14b8a6,
        rest_milling: 0x14b8a6,
        pencil: 0xf97316,
        probe: 0xd946ef
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
      } else if (op.badgeClass === 'circlemill') {
        toolpathData = generateCircleMillToolpath(bounds, assignedTool, {
          diameter: op.diameter || 50.8,
          totalDepth: op.totalDepth || 50.8,
          stepdown: op.stepdown || 6.35,
          rapidHeight: op.rapidHeight || 15.0
        });
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
      } else if (op.badgeClass === 'spotdrill') {
        toolpathData = generateSpotDrillToolpath(bounds, assignedTool, {
          spotDepth: op.stepdown || op.totalDepth || 3.8,
          rapidHeight: op.rapidHeight || 10.0
        }, currentModel);
      } else if (op.badgeClass === 'adaptive' || op.badgeClass === 'dynamic') {
        toolpathData = generateAdaptiveRoughingToolpath(bounds, assignedTool, {
          stepoverPct: op.stepoverPct || 25,
          stepdown: op.stepdown || 6.0,
          totalDepth: op.totalDepth || 18.0,
          rapidHeight: op.rapidHeight || 15.0
        });
      } else if (op.badgeClass === 'chamfer') {
        toolpathData = generateChamferToolpath(bounds, assignedTool, {
          chamferWidth: op.chamferWidth || op.stepdown || 0.508,
          tipOffset: op.tipOffset || 1.27,
          rapidHeight: op.rapidHeight || 15.0
        }, currentModel);
      } else if (op.badgeClass === 'tap') {
        toolpathData = generateTapToolpath(bounds, assignedTool, {
          pitch: op.pitch || 0.79375,
          totalDepth: op.totalDepth || 12.19,
          rapidHeight: op.rapidHeight || 10.0
        }, currentModel);
      } else if (op.badgeClass === 'parallel' || op.badgeClass === 'surface') {
        toolpathData = generateSurfaceParallelToolpath(bounds, assignedTool, {
          stepoverPct: op.stepoverPct || 20,
          rapidHeight: op.rapidHeight || 15.0
        }, currentModel);
      } else if (op.badgeClass === 'rest' || op.badgeClass === 'rest_milling') {
        toolpathData = generateRestMillingToolpath(bounds, assignedTool, {
          refToolDiameter: op.refToolDiameter || 12.0,
          stepdown: op.stepdown || 2.5,
          totalDepth: op.totalDepth || 15.0,
          stepoverPct: op.stepoverPct || 30,
          rapidHeight: op.rapidHeight || 15.0
        }, currentModel);
      } else if (op.badgeClass === 'pencil') {
        toolpathData = generatePencilTracingToolpath(bounds, assignedTool, {
          totalDepth: op.totalDepth || 15.0,
          stepdown: op.stepdown || 1.0,
          biTangencyRadius: op.biTangencyRadius || 3.0,
          rapidHeight: op.rapidHeight || 15.0
        }, currentModel);
      } else if (op.badgeClass === 'probe') {
        const center = op.center || {
          x: (bounds.min.x + bounds.max.x) / 2,
          y: bounds.max.y,
          z: (bounds.min.z + bounds.max.z) / 2
        };
        toolpathData = generateProbingToolpath(op.strategyKey || 'bore_centering', center, op.probingParams || {});
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
      const helperGroup = buildCPlaneHelperGroup(currentPlane, 240, theme === 'light', layerVisibility.bed !== false);
      scene.add(helperGroup);
      cplaneHelperGroupRef.current = helperGroup;
    }

    return () => {
      if (cplaneHelperGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(cplaneHelperGroupRef.current);
        cplaneHelperGroupRef.current = null;
      }
    };
  }, [activePlane, planes, layerVisibility?.wcs, theme]);

  // 11c. Dynamic Theme Machine Bed Grid & Canvas Background Update
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const isLight = theme === 'light';

    // Canvas background & fog
    scene.background = isLight ? null : new THREE.Color(0x131722);
    scene.fog = isLight ? null : new THREE.FogExp2(0x131722, 0.002);

    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current.geometry.dispose();
      gridHelperRef.current = null;
    }
    const gridHelper = new THREE.GridHelper(
      400,
      40,
      isLight ? 0x94a3b8 : 0x334155,
      isLight ? 0xcbd5e1 : 0x1e293b
    );
    gridHelper.position.y = -20;
    gridHelper.visible = !!currentModel && layerVisibility.bed !== false;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;
  }, [theme, currentModel, layerVisibility.bed]);

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
    const effectiveOpId = backplotSelectedOpFilter === 'all'
      ? null
      : Number(backplotSelectedOpFilter);

    const trajectory = compileBackplotTrajectory(operations, tools, bounds, currentModel, effectiveOpId);
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

    // 3. Create Solid Verify Material Removal Envelope (in verify or heatmap mode)
    if (backplotInternalMode === 'verify' || backplotInternalMode === 'heatmap') {
      const verifyGroup = new THREE.Group();
      verifyGroup.name = "Solid_Verify_Carved_Stock";

      const dim = partMetrics.dimensions;
      const sw = dim.x + (stockConfig?.allowanceSides || 4) * 2;
      const sh = dim.y + (stockConfig?.allowanceTop || 2);
      const sd = dim.z + (stockConfig?.allowanceSides || 4) * 2;

      const stockBounds = new THREE.Box3(
        new THREE.Vector3(bounds.min.x - (stockConfig?.allowanceSides || 4), bounds.min.y, bounds.min.z - (stockConfig?.allowanceSides || 4)),
        new THREE.Vector3(bounds.max.x + (stockConfig?.allowanceSides || 4), bounds.min.y + sh, bounds.max.z + (stockConfig?.allowanceSides || 4))
      );

      if (backplotInternalMode === 'heatmap' && currentModel) {
        const modelTriangles = extractModelTriangles(currentModel, 1500);
        const { mesh: heatmapMesh, stats } = buildDeviationHeatmapStock({
          stockBounds,
          triangles: modelTriangles,
          waypoints: trajectory.waypoints,
          progress: 1.0,
          tolerance: heatmapTolerance
        });
        verifyGroup.add(heatmapMesh);
        setHeatmapStats(stats);
      } else {
        const sim = new VoxelStockSimulator(stockBounds, partMetrics, { gridResX: 42 });
        sim.simulateToProgress(trajectory.waypoints, 0.0, tools);
        const stockMesh = sim.buildMesh('tool');
        verifyGroup.add(stockMesh);
        viewportSimulatorRef.current = sim;
      }

      scene.add(verifyGroup);
      backplotVerifyGroupRef.current = verifyGroup;
    }

    setBackplotProgress(0.0);
    backplotProgressRef.current = 0.0;
    setIsBackplotPlaying(true);
    lastAnimTimeRef.current = performance.now();

    return () => {
      if (backplotToolRef.current) scene.remove(backplotToolRef.current);
      if (backplotTrailRef.current) scene.remove(backplotTrailRef.current);
      if (backplotVerifyGroupRef.current) scene.remove(backplotVerifyGroupRef.current);
    };
  }, [isBackplotActive, activeOpId, backplotSelectedOpFilter, operations, tools, partMetrics, currentModel, backplotInternalMode, heatmapTolerance]);

  // 13. Backplot Animation & Sampling Frame Loop
  useEffect(() => {
    if (!isBackplotActive) {
      if (backplotAnimRef.current) cancelAnimationFrame(backplotAnimRef.current);
      return;
    }

    lastAnimTimeRef.current = performance.now();

    const animateLoop = (time) => {
      const delta = Math.min(0.1, (time - lastAnimTimeRef.current) / 1000);
      lastAnimTimeRef.current = time;

      let currentP = backplotProgressRef.current;

      if (isBackplotPlaying && waypointsRef.current.length > 0) {
        const totalDist = waypointsRef.current[waypointsRef.current.length - 1].cumulativeDist;
        const currentSpeedMmPerSec = 75 * backplotSpeed;
        const progressDelta = totalDist > 0 ? (currentSpeedMmPerSec * delta) / totalDist : 0.005;

        currentP += progressDelta;
        if (currentP >= 1.0) {
          if (backplotLoop) {
            currentP = 0.0;
          } else {
            currentP = 1.0;
            setIsBackplotPlaying(false);
          }
        }
        backplotProgressRef.current = currentP;
        setBackplotProgress(currentP);
      }

      // Update 3D tool position, spin, and trail
      if (backplotToolRef.current && waypointsRef.current.length > 0) {
        const sample = sampleTrajectoryAtT(waypointsRef.current, currentP);
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

        // Dynamic material removal carving in verify mode
        if (backplotInternalMode === 'verify' && viewportSimulatorRef.current && backplotVerifyGroupRef.current) {
          viewportSimulatorRef.current.simulateToProgress(waypointsRef.current, currentP, tools);
          const updatedMesh = viewportSimulatorRef.current.buildMesh('tool');
          backplotVerifyGroupRef.current.clear();
          backplotVerifyGroupRef.current.add(updatedMesh);
        }
      }

      backplotAnimRef.current = requestAnimationFrame(animateLoop);
    };

    backplotAnimRef.current = requestAnimationFrame(animateLoop);
    return () => {
      if (backplotAnimRef.current) cancelAnimationFrame(backplotAnimRef.current);
    };
  }, [isBackplotActive, isBackplotPlaying, backplotSpeed, backplotLoop, backplotInternalMode, heatmapTolerance]);

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

  // 15. CAD Sketcher Keyboard Shortcuts
  useEffect(() => {
    if (!isSketchModeActive) return;

    const handleSketchKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'l') {
        e.preventDefault();
        setActiveSketchTool('line');
        if (onChangeSketchTool) onChangeSketchTool('line');
      } else if (key === 'r') {
        e.preventDefault();
        setActiveSketchTool('rect');
        if (onChangeSketchTool) onChangeSketchTool('rect');
      } else if (key === 'c') {
        e.preventDefault();
        setActiveSketchTool('circle');
        if (onChangeSketchTool) onChangeSketchTool('circle');
      } else if (key === 'p') {
        e.preventDefault();
        setActiveSketchTool('drill');
        if (onChangeSketchTool) onChangeSketchTool('drill');
      } else if (key === 'v') {
        e.preventDefault();
        setActiveSketchTool('select');
        if (onChangeSketchTool) onChangeSketchTool('select');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (sketchAnchorRef.current) {
          sketchAnchorRef.current = null;
          setSketchAnchor(null);
          setDimensionFeedback(null);
          if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
        } else if (onToggleSketchMode) {
          onToggleSketchMode(false);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (customGeometryRef.current && customGeometryRef.current.length > 0) {
          const last = customGeometryRef.current[customGeometryRef.current.length - 1];
          if (onRemoveCustomEntity && last) {
            onRemoveCustomEntity(last.uuid || last.name);
          }
        }
      }
    };

    window.addEventListener('keydown', handleSketchKey);
    return () => window.removeEventListener('keydown', handleSketchKey);
  }, [isSketchModeActive, onChangeSketchTool, onToggleSketchMode, onRemoveCustomEntity]);

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
      try {
        const modelGroup = await parseAnyCADFile(file);
        if (onModelImported) {
          onModelImported(modelGroup, file.name);
        }
      } catch (err) {
        console.error("Failed to parse CAD file:", err);
        alert(`Error parsing CAD file (${file.name}): ${err.message}`);
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
          <span className="dropzone-text">Drop STEP, IGES, STL, OBJ or CAD File Here to Import</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Automatic Stock Bounding Box will be calculated
          </span>
        </div>
      )}

      {/* CAD Sketcher HUD Floating Toolbar */}
      {isSketchModeActive && (
        <DrawingToolbarHUD
          theme={theme}
          activeTool={activeSketchTool}
          onChangeTool={(tool) => {
            setActiveSketchTool(tool);
            if (onChangeSketchTool) onChangeSketchTool(tool);
          }}
          gridSnap={gridSnap}
          onToggleGridSnap={() => setGridSnap(g => !g)}
          gridStep={gridStep}
          onChangeGridStep={(step) => setGridStep(step)}
          objectSnap={objectSnap}
          onToggleObjectSnap={() => setObjectSnap(o => !o)}
          orthoLock={orthoLock}
          onToggleOrthoLock={() => setOrthoLock(o => !o)}
          drawnCount={customGeometry.length}
          onClearDrawing={() => {
            if (onClearWireframes) onClearWireframes();
          }}
          onFinishSketch={() => {
            if (onToggleSketchMode) onToggleSketchMode(false);
          }}
          onGenerateToolpathFromSketch={() => {
            if (onGenerateToolpathFromSketch) onGenerateToolpathFromSketch();
          }}
          cursorCoords={cursorCoords}
          dimensionFeedback={dimensionFeedback}
        />
      )}

      {/* Floating Section Cut Indicator Badge */}
      {clippingPlane?.enabled && (
        <div style={{
          position: 'absolute',
          top: '52px',
          left: '16px',
          background: isLight ? '#fce7f3' : 'rgba(236, 72, 153, 0.18)',
          border: isLight ? '1px solid #f472b6' : '1px solid rgba(236, 72, 153, 0.4)',
          color: isLight ? '#be185d' : '#f472b6',
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

      {/* Mastercam View Orientation Gnomon (Bottom-Left Corner HUD) */}
      <ViewGnomonHUD
        activeView={currentViewName}
        theme={theme}
      />

      {/* Mastercam Distance Scale Bracket Ruler (Bottom-Right Corner HUD) */}
      <ScaleRulerHUD
        cameraDistance={camDist}
        unitSystem={unitSystem}
        theme={theme}
      />

      {/* ================= Mastercam Floating Backplot & Solid Verify HUD Controller ================= */}
      {isBackplotActive && (
        <div className="backplot-hud-container" style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 23, 42, 0.96)',
          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: isLight ? '0 8px 28px rgba(0,0,0,0.12)' : '0 16px 40px rgba(0,0,0,0.6)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
          width: '640px',
          backdropFilter: 'blur(12px)',
          userSelect: 'none',
          color: isLight ? '#0f172a' : '#f8fafc'
        }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: isLight ? '#0f172a' : '#f8fafc', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                {backplotInternalMode === 'heatmap' ? 'Tolerance Heatmap' : backplotInternalMode === 'verify' ? 'Solid Verify' : 'Backplot'}
              </span>

              {/* Operation Scope Selector */}
              <select
                value={backplotSelectedOpFilter}
                onChange={(e) => {
                  setBackplotSelectedOpFilter(e.target.value);
                  setBackplotProgress(0.0);
                  backplotProgressRef.current = 0.0;
                  setIsBackplotPlaying(true);
                }}
                style={{
                  background: isLight ? '#f1f5f9' : '#090d14',
                  color: isLight ? '#0f5a9e' : '#38bdf8',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  maxWidth: '170px'
                }}
                title="Select operation to simulate"
              >
                <option value="all">All Operations ({operations.filter(o => o.visible !== false).length})</option>
                {operations.map((op) => (
                  <option key={op.id} value={op.id}>
                    Op {op.id}: {op.name}
                  </option>
                ))}
              </select>

              <span style={{
                fontSize: '9.5px',
                padding: '2px 6px',
                borderRadius: '3px',
                background: holderCollisionAlert ? (isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.25)') : (isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.2)'),
                border: `1px solid ${holderCollisionAlert ? '#ef4444' : '#10b981'}`,
                color: holderCollisionAlert ? '#b91c1c' : '#15803d',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                {holderCollisionAlert ? (
                  <>
                    <AlertTriangle size={10} />
                    <span>Gouge Alert</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={10} />
                    <span>Clearance OK</span>
                  </>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Mode Switcher */}
              <div style={{ display: 'flex', background: isLight ? '#f1f5f9' : '#0a0d14', padding: '2px', borderRadius: '4px', border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b' }}>
                <button
                  onClick={() => setBackplotInternalMode('backplot')}
                  style={{
                    background: backplotInternalMode === 'backplot' ? '#0f5a9e' : 'transparent',
                    color: backplotInternalMode === 'backplot' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                    border: 'none',
                    padding: '2px 8px',
                    fontSize: '10.5px',
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
                    background: backplotInternalMode === 'verify' ? '#0f5a9e' : 'transparent',
                    color: backplotInternalMode === 'verify' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                    border: 'none',
                    padding: '2px 8px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Verify
                </button>
                <button
                  onClick={() => setBackplotInternalMode('heatmap')}
                  style={{
                    background: backplotInternalMode === 'heatmap' ? '#f59e0b' : 'transparent',
                    color: backplotInternalMode === 'heatmap' ? '#fff' : (isLight ? '#475569' : '#94a3b8'),
                    border: 'none',
                    padding: '2px 8px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                  title="Inspect Tolerance Deviation Heatmap"
                >
                  <Gauge size={10} />
                  Heatmap
                </button>
              </div>

              <button
                onClick={onCloseBackplot}
                style={{ background: 'transparent', border: 'none', color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                title="Exit Backplot (Esc)"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Tolerance Heatmap Legend & Telemetry Card */}
          {backplotInternalMode === 'heatmap' && (
            <div style={{
              background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.75)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '5px',
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '10px'
            }}>
              {/* Spectrum labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: isLight ? '#64748b' : '#94a3b8', fontSize: '9.5px', fontWeight: 600 }}>
                <span style={{ color: '#ef4444' }}>&lt; -{heatmapTolerance}mm (Gouge)</span>
                <span style={{ color: '#10b981' }}>&plusmn;{heatmapTolerance}mm (Nominal)</span>
                <span style={{ color: '#0284c7' }}>&gt; +{(heatmapTolerance * 2.5).toFixed(2)}mm (Excess)</span>
              </div>

              {/* Color Gradient Legend Strip */}
              <div style={{
                height: '5px',
                borderRadius: '3px',
                background: 'linear-gradient(to right, #dc2626 0%, #f97316 20%, #10b981 40%, #10b981 60%, #eab308 80%, #0284c7 100%)',
                width: '100%'
              }} />

              {/* Stats & Band Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: isLight ? '#475569' : '#cbd5e1', paddingTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>In-Tol: <strong style={{ color: '#10b981' }}>{heatmapStats?.inTolerancePct ?? 86.4}%</strong></span>
                  <span>Excess: <strong style={{ color: '#0284c7' }}>{heatmapStats?.excessStockPct ?? 13.6}%</strong></span>
                  <span>Gouges: <strong style={{ color: (heatmapStats?.gougeCount || 0) > 0 ? '#ef4444' : '#10b981' }}>{heatmapStats?.gougeCount || 0}</strong></span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '9.5px' }}>Tol:</span>
                  {[0.01, 0.02, 0.05, 0.10].map((tol) => (
                    <button
                      key={tol}
                      onClick={() => setHeatmapTolerance(tol)}
                      style={{
                        background: heatmapTolerance === tol ? '#0f5a9e' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'),
                        color: heatmapTolerance === tol ? '#fff' : (isLight ? '#334155' : '#cbd5e1'),
                        border: 'none',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      &plusmn;{tol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scrub Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0"
              max="1000"
              value={Math.round(backplotProgress * 1000)}
              onChange={(e) => {
                setIsBackplotPlaying(false);
                const p = Number(e.target.value) / 1000;
                backplotProgressRef.current = p;
                setBackplotProgress(p);
              }}
              style={{ flex: 1, cursor: 'pointer', accentColor: '#0f5a9e', height: '4px' }}
            />
            <span style={{ fontSize: '10.5px', color: isLight ? '#0f5a9e' : '#38bdf8', fontFamily: 'monospace', minWidth: '40px', textAlign: 'right', fontWeight: 600 }}>
              {(backplotProgress * 100).toFixed(1)}%
            </span>
          </div>

          {/* Controls & Telemetry Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            {/* Playback Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsBackplotPlaying(false);
                  backplotProgressRef.current = 0.0;
                  setBackplotProgress(0.0);
                }}
                title="Rewind (Home)"
                style={{ padding: '4px 7px' }}
              >
                <RotateCcw size={12} />
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setIsBackplotPlaying(false);
                  const p = Math.max(0, backplotProgressRef.current - 0.02);
                  backplotProgressRef.current = p;
                  setBackplotProgress(p);
                }}
                title="Step Backward (Left Arrow)"
                style={{ padding: '4px 7px' }}
              >
                <SkipBack size={12} />
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  if (!isBackplotPlaying && backplotProgressRef.current >= 0.99) {
                    backplotProgressRef.current = 0.0;
                    setBackplotProgress(0.0);
                  }
                  lastAnimTimeRef.current = performance.now();
                  setIsBackplotPlaying(!isBackplotPlaying);
                }}
                style={{
                  padding: '4px 10px',
                  background: isBackplotPlaying ? '#dc2626' : '#0f5a9e',
                  borderColor: isBackplotPlaying ? '#ef4444' : '#0f5a9e',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Play / Pause (Spacebar)"
              >
                {isBackplotPlaying ? <Pause size={12} /> : <Play size={12} />}
                <span>{isBackplotPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setIsBackplotPlaying(false);
                  const p = Math.min(1, backplotProgressRef.current + 0.02);
                  backplotProgressRef.current = p;
                  setBackplotProgress(p);
                }}
                title="Step Forward (Right Arrow)"
                style={{ padding: '4px 7px' }}
              >
                <SkipForward size={12} />
              </button>

              <button
                className="btn-secondary"
                onClick={() => setBackplotLoop(!backplotLoop)}
                title="Toggle Repeat Loop"
                style={{
                  padding: '4px 7px',
                  fontSize: '11px',
                  color: backplotLoop ? '#0f5a9e' : (isLight ? '#475569' : '#94a3b8'),
                  borderColor: backplotLoop ? '#0f5a9e' : (isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'),
                  fontWeight: backplotLoop ? 700 : 500
                }}
              >
                Loop
              </button>

              {/* Speed Selector */}
              <select
                value={backplotSpeed}
                onChange={(e) => setBackplotSpeed(Number(e.target.value))}
                style={{
                  background: isLight ? '#f1f5f9' : '#090d14',
                  color: isLight ? '#334155' : '#e2e8f0',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                  borderRadius: '4px',
                  padding: '3px 5px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
                title="Playback Speed"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1.0x</option>
                <option value={2}>2.0x</option>
                <option value={5}>5.0x</option>
                <option value={10}>10x</option>
              </select>
            </div>

            {/* Live Tool Telemetry Readout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'monospace',
              fontSize: '10px',
              color: isLight ? '#0f172a' : '#f8fafc',
              background: isLight ? '#f1f5f9' : '#090d14',
              padding: '3px 8px',
              borderRadius: '4px',
              border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b'
            }}>
              <span>X: <strong style={{ color: '#0f5a9e' }}>{currentSample.pos.x.toFixed(2)}</strong></span>
              <span>Y: <strong style={{ color: '#10b981' }}>{currentSample.pos.y.toFixed(2)}</strong></span>
              <span>Z: <strong style={{ color: '#d97706' }}>{currentSample.pos.z.toFixed(2)}</strong></span>
              <span style={{ color: currentSample.isRapid ? '#0f5a9e' : '#10b981', fontWeight: 700 }}>
                {currentSample.isRapid ? 'G0' : 'G1'}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

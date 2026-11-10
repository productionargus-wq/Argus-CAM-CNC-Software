import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Eye, Layers, Rotate3D, UploadCloud, Box, Info, Scissors, Camera, Sun, Sliders,
  Play, Pause, SkipForward, SkipBack, RotateCcw, X, AlertTriangle, CheckCircle2, Gauge
} from 'lucide-react';
import { parseSTLFile, calculatePartMetrics, createWireframeLine, createWireframeRect, createWireframeCircle, createPointMarker, createParametricChainExtrusion } from '../utils/cadGeometry';
import { parseAnyCADFile } from '../utils/universalCadParser';
import ScaleRulerHUD from './ScaleRulerHUD';
import ViewGnomonHUD from './ViewGnomonHUD';
import {
  createSketchPlane,
  snapToGrid,
  snapToEntityPoints,
  createGhostPreview,
  createSnapIndicator,
  computeRectPlacement,
  computeLineEnd,
  hitTestWireframeEntity
} from '../utils/cadDrawingEngine';
import {
  generateFacingToolpath,
  generateSurfacePocketToolpath,
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
  sampleTrajectoryAtT,
  buildContourParamsFromOp,
  buildPocketParamsFromOp,
  buildEffectiveDriveModel,
  computeDriveModelBounds
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
  showEndpoints = false,
  activeDrawingRadius = null,
  isRadiusLocked = false,
  activeDrawingWidth = null,
  isWidthLocked = false,
  activeDrawingHeight = null,
  isHeightLocked = false,
  rectAnchorToCenter = false,
  rectCreateSurface = false,
  activeDrawingLength = null,
  isLengthLocked = false,
  activeDrawingAngle = null,
  isAngleLocked = false,
  lineType = 'freeform',
  onDrawingUpdate = null,
  reselectTrigger = 0,
  undoTrigger = 0,
  // Chaining & Live Surface Extrude Preview Props
  isChainingActive = false,
  chainingPlaneMode = '3d',
  isBasePointPickActive = false,
  selectedExtrudeChains = [],
  onSelectChainEntity = null,
  onPickBasePoint = null,
  surfaceExtrudePreview = null
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

  useEffect(() => {
    if (activeOpId === 'all' || activeOpId === null) {
      setBackplotSelectedOpFilter('all');
    } else if (typeof activeOpId === 'number') {
      setBackplotSelectedOpFilter(String(activeOpId));
    }
  }, [activeOpId, isBackplotActive]);

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
  const [mouseScreenPos, setMouseScreenPos] = useState({ x: 0, y: 0 });
  const [sketchPromptText, setSketchPromptText] = useState('Enter the center point');
  const [currentViewName, setCurrentViewName] = useState('Top');
  const [snapMode, setSnapMode] = useState('auto');
  const [isSnapLocked, setIsSnapLocked] = useState(false);
  const [camDist, setCamDist] = useState(350);

  const sketchGhostGroupRef = useRef(null);
  const snapIndicatorGroupRef = useRef(null);
  const chainHighlightGroupRef = useRef(null);
  const surfacePreviewGroupRef = useRef(null);
  const isChainingActiveRef = useRef(isChainingActive);
  const chainingPlaneModeRef = useRef(chainingPlaneMode);
  const isBasePointPickActiveRef = useRef(isBasePointPickActive);
  const onSelectChainEntityRef = useRef(onSelectChainEntity);
  const onPickBasePointRef = useRef(onPickBasePoint);
  const sketchAnchorRef = useRef(null);
  const isSketchModeRef = useRef(isSketchModeActive);
  const activeSketchToolRef = useRef(sketchTool || 'line');
  const activeDrawingRadiusRef = useRef(activeDrawingRadius);
  const isRadiusLockedRef = useRef(isRadiusLocked);
  const activeDrawingWidthRef = useRef(activeDrawingWidth);
  const isWidthLockedRef = useRef(isWidthLocked);
  const activeDrawingHeightRef = useRef(activeDrawingHeight);
  const isHeightLockedRef = useRef(isHeightLocked);
  const rectAnchorToCenterRef = useRef(rectAnchorToCenter);
  const rectCreateSurfaceRef = useRef(rectCreateSurface);
  const activeDrawingLengthRef = useRef(activeDrawingLength);
  const isLengthLockedRef = useRef(isLengthLocked);
  const activeDrawingAngleRef = useRef(activeDrawingAngle);
  const isAngleLockedRef = useRef(isAngleLocked);
  const lineTypeRef = useRef(lineType);
  const onDrawingUpdateRef = useRef(onDrawingUpdate);
  const gridSnapRef = useRef(true);
  const gridStepRef = useRef(5.0);
  const objectSnapRef = useRef(true);
  const orthoLockRef = useRef(false);
  const customGeometryRef = useRef(customGeometry);
  const onAddCustomEntityRef = useRef(onAddCustomEntity);
  const partTopYRef = useRef(partMetrics?.box?.max?.y ?? 0);
  const renderLockedPreviewAtRef = useRef(null);

  useEffect(() => { partTopYRef.current = partMetrics?.box?.max?.y ?? 0; }, [partMetrics]);
  useEffect(() => { activeDrawingRadiusRef.current = activeDrawingRadius; }, [activeDrawingRadius]);
  useEffect(() => { isRadiusLockedRef.current = isRadiusLocked; }, [isRadiusLocked]);
  useEffect(() => { activeDrawingWidthRef.current = activeDrawingWidth; }, [activeDrawingWidth]);
  useEffect(() => { isWidthLockedRef.current = isWidthLocked; }, [isWidthLocked]);
  useEffect(() => { activeDrawingHeightRef.current = activeDrawingHeight; }, [activeDrawingHeight]);
  useEffect(() => { isHeightLockedRef.current = isHeightLocked; }, [isHeightLocked]);
  useEffect(() => { rectAnchorToCenterRef.current = rectAnchorToCenter; }, [rectAnchorToCenter]);
  useEffect(() => { rectCreateSurfaceRef.current = rectCreateSurface; }, [rectCreateSurface]);
  useEffect(() => { activeDrawingLengthRef.current = activeDrawingLength; }, [activeDrawingLength]);
  useEffect(() => { isLengthLockedRef.current = isLengthLocked; }, [isLengthLocked]);
  useEffect(() => { activeDrawingAngleRef.current = activeDrawingAngle; }, [activeDrawingAngle]);
  useEffect(() => { isAngleLockedRef.current = isAngleLocked; }, [isAngleLocked]);
  useEffect(() => { lineTypeRef.current = lineType; }, [lineType]);
  useEffect(() => { onDrawingUpdateRef.current = onDrawingUpdate; }, [onDrawingUpdate]);
  useEffect(() => { isChainingActiveRef.current = isChainingActive; }, [isChainingActive]);
  useEffect(() => { chainingPlaneModeRef.current = chainingPlaneMode; }, [chainingPlaneMode]);
  useEffect(() => { isBasePointPickActiveRef.current = isBasePointPickActive; }, [isBasePointPickActive]);
  useEffect(() => { onSelectChainEntityRef.current = onSelectChainEntity; }, [onSelectChainEntity]);
  useEffect(() => { onPickBasePointRef.current = onPickBasePoint; }, [onPickBasePoint]);

  const renderLockedPreviewAt = (basePt, opts = {}) => {
    if (!isSketchModeRef.current || !sketchGhostGroupRef.current) return;
    const { isCursorHover = false } = opts;
    const tool = activeSketchToolRef.current;
    const group = sketchGhostGroupRef.current;

    if (tool === 'rect') {
      const lw = isWidthLockedRef.current && Number(activeDrawingWidthRef.current) > 0
        ? Number(activeDrawingWidthRef.current)
        : null;
      const lh = isHeightLockedRef.current && Number(activeDrawingHeightRef.current) > 0
        ? Number(activeDrawingHeightRef.current)
        : null;
      if (!lw || !lh) {
        if (!sketchAnchorRef.current) group.clear();
        return;
      }
      group.clear();
      group.add(createGhostPreview('rect', basePt, basePt, {
        anchorToCenter: rectAnchorToCenterRef.current,
        createSurface: rectCreateSurfaceRef.current,
        lockedWidth: lw,
        lockedHeight: lh
      }));
      setDimensionFeedback(`W: ${lw.toFixed(2)} mm, H: ${lh.toFixed(2)} mm`);
      setSketchPromptText(
        sketchAnchorRef.current
          ? 'Click canvas or OK to place rectangle'
          : isCursorHover
            ? `Click to place ${lw} × ${lh} mm rectangle`
            : `Click canvas to place ${lw} × ${lh} mm, or click OK for (0, 0)`
      );
    } else if (tool === 'circle' || tool === 'arc_tangent' || tool === 'arctangent') {
      const lr = isRadiusLockedRef.current && Number(activeDrawingRadiusRef.current) > 0
        ? Number(activeDrawingRadiusRef.current)
        : null;
      if (!lr) {
        if (!sketchAnchorRef.current) group.clear();
        return;
      }
      group.clear();
      group.add(createGhostPreview(tool, basePt, basePt, { lockedRadius: lr }));
      setDimensionFeedback(`R: ${lr.toFixed(2)} mm (Ø ${(lr * 2).toFixed(2)} mm)`);
      setSketchPromptText(
        isCursorHover
          ? `Click to place Ø ${(lr * 2).toFixed(1)} mm circle`
          : `Click canvas to place Ø ${(lr * 2).toFixed(1)} mm circle, or OK for (0, 0)`
      );
    } else if (tool === 'line') {
      const ll = isLengthLockedRef.current && Number(activeDrawingLengthRef.current) > 0
        ? Number(activeDrawingLengthRef.current)
        : null;
      const la = isAngleLockedRef.current && activeDrawingAngleRef.current !== null && activeDrawingAngleRef.current !== undefined
        ? Number(activeDrawingAngleRef.current)
        : null;
      if (!ll || la === null) {
        if (!sketchAnchorRef.current) group.clear();
        return;
      }
      group.clear();
      group.add(createGhostPreview('line', basePt, basePt, {
        lineType: lineTypeRef.current,
        lockedLength: ll,
        lockedAngle: la
      }));
      setDimensionFeedback(`L: ${ll.toFixed(2)} mm, ∠ ${la.toFixed(1)}°`);
      setSketchPromptText(
        isCursorHover
          ? `Click to place ${ll} mm line`
          : `Click canvas to place ${ll} mm line, or OK for (0, 0)`
      );
    }
  };
  renderLockedPreviewAtRef.current = renderLockedPreviewAt;

  // Live preview immediately when user types locked dimensions in the left panel
  useEffect(() => {
    if (!isSketchModeActive) return;
    const basePt = sketchAnchorRef.current || new THREE.Vector3(0, partMetrics?.box?.max?.y ?? 0, 0);
    renderLockedPreviewAt(basePt, { isCursorHover: false });
  }, [
    isSketchModeActive,
    sketchTool,
    activeDrawingWidth,
    activeDrawingHeight,
    isWidthLocked,
    isHeightLocked,
    rectAnchorToCenter,
    rectCreateSurface,
    activeDrawingRadius,
    isRadiusLocked,
    activeDrawingLength,
    activeDrawingAngle,
    isLengthLocked,
    isAngleLocked,
    lineType,
    partMetrics?.box?.max?.y
  ]);

  useEffect(() => {
    if (reselectTrigger > 0 || undoTrigger > 0) {
      sketchAnchorRef.current = null;
      setSketchAnchor(null);
      if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
      if (snapIndicatorGroupRef.current) snapIndicatorGroupRef.current.clear();
      setDimensionFeedback(null);
      if (isSketchModeRef.current) {
        const tool = activeSketchToolRef.current;
        setSketchPromptText(
          tool === 'rect' ? 'Select position of first corner' :
          tool === 'line' ? 'Specify first endpoint' :
          tool === 'arc_tangent' ? 'Select the entity that the arc is to be tangent to' :
          'Enter the center point'
        );
      }
    }
  }, [reselectTrigger, undoTrigger]);

  useEffect(() => {
    isSketchModeRef.current = isSketchModeActive;
    if (isSketchModeActive) {
      snapView('top');
      setSketchPromptText(
        sketchTool === 'circle' ? 'Enter the center point' :
        sketchTool === 'rect' ? 'Select position of first corner' :
        sketchTool === 'line' ? 'Specify first endpoint' :
        sketchTool === 'arc_tangent' ? 'Select the entity that the arc is to be tangent to' :
        'Click & drag on canvas'
      );
    } else {
      if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
      if (snapIndicatorGroupRef.current) snapIndicatorGroupRef.current.clear();
      sketchAnchorRef.current = null;
      setSketchAnchor(null);
      setDimensionFeedback(null);
    }
  }, [isSketchModeActive, sketchTool]);

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
    renderer.domElement.tabIndex = -1;
    renderer.domElement.style.outline = 'none';
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

    // Interactive Sketch Ghost & Snap Indicator Groups (sibling of customGeoGroup so clearing customGeometry never detaches them)
    const sketchGhostGroup = new THREE.Group();
    sketchGhostGroup.name = "Sketch_Ghost_Group";
    sketchGhostGroup.position.set(0, 49, 0);
    scene.add(sketchGhostGroup);
    sketchGhostGroupRef.current = sketchGhostGroup;

    const snapIndicatorGroup = new THREE.Group();
    snapIndicatorGroup.name = "Snap_Indicator_Group";
    snapIndicatorGroup.position.set(0, 49, 0);
    scene.add(snapIndicatorGroup);
    snapIndicatorGroupRef.current = snapIndicatorGroup;

    const chainHighlightGroup = new THREE.Group();
    chainHighlightGroup.name = "Chain_Highlight_Group";
    chainHighlightGroup.position.set(0, 49, 0);
    scene.add(chainHighlightGroup);
    chainHighlightGroupRef.current = chainHighlightGroup;

    const surfacePreviewGroup = new THREE.Group();
    surfacePreviewGroup.name = "Surface_Preview_Group";
    surfacePreviewGroup.position.set(0, 49, 0);
    scene.add(surfacePreviewGroup);
    surfacePreviewGroupRef.current = surfacePreviewGroup;

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

    const resolvePickOnWireframe = (e) => {
      const entities = customGeometryRef.current || [];
      const ySet = new Set([0, partTopYRef.current ?? 0, 35]);
      entities.forEach((ent) => {
        if (!ent || !ent.userData) return;
        if (ent.userData.center?.y != null) ySet.add(Number(ent.userData.center.y));
        if (Array.isArray(ent.userData.points) && ent.userData.points[0]?.y != null) {
          ySet.add(Number(ent.userData.points[0].y));
        }
      });

      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hitPlane = new THREE.Plane();
      const target = new THREE.Vector3();
      const tol = Math.max(7.5, spherical.radius * 0.03);

      for (const wy of ySet) {
        hitPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 49 + wy, 0));
        const hit = raycaster.ray.intersectPlane(hitPlane, target);
        if (!hit) continue;
        const localPt = new THREE.Vector3(hit.x, wy, hit.z);
        const match = hitTestWireframeEntity(localPt, entities, tol, chainingPlaneModeRef.current);
        if (match) return { entity: match, localPt };
      }
      return { entity: null, localPt: getSketchIntersection(e) };
    };

    // Mouse Drag Orbit & Pan
    let isDragging = false;
    let isPanning = false;
    let isDrawingDrag = false;
    let dragStartScreenX = 0;
    let dragStartScreenY = 0;
    let pickDownX = 0;
    let pickDownY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = new THREE.Spherical(340, Math.PI / 3.4, Math.PI / 4);

    const getDefaultPromptForTool = (tool) => (
      tool === 'rect' ? 'Select position of first corner' :
      tool === 'line' ? 'Specify first endpoint' :
      tool === 'arc_tangent' ? 'Select the entity that the arc is to be tangent to' :
      'Enter the center point'
    );

    const resolveSnappedPoint = (e) => {
      const localPt = getSketchIntersection(e);
      if (!localPt) return null;
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
      return { finalPt, snapResult };
    };

    const getLockedRectOptions = () => ({
      anchorToCenter: rectAnchorToCenterRef.current,
      createSurface: rectCreateSurfaceRef.current,
      lockedWidth: isWidthLockedRef.current && activeDrawingWidthRef.current > 0 ? activeDrawingWidthRef.current : null,
      lockedHeight: isHeightLockedRef.current && activeDrawingHeightRef.current > 0 ? activeDrawingHeightRef.current : null
    });

    const getLockedLineOptions = () => ({
      lineType: lineTypeRef.current,
      lockedLength: isLengthLockedRef.current && activeDrawingLengthRef.current > 0 ? activeDrawingLengthRef.current : null,
      lockedAngle: isAngleLockedRef.current && activeDrawingAngleRef.current !== null && activeDrawingAngleRef.current !== undefined ? activeDrawingAngleRef.current : null
    });

    const commitInteractiveEntity = (anchor, finalPt) => {
      const tool = activeSketchToolRef.current;
      let newEntity = null;

      if (tool === 'circle' || tool === 'arc_tangent' || tool === 'arctangent') {
        const radius = (isRadiusLockedRef.current && activeDrawingRadiusRef.current > 0)
          ? Number(activeDrawingRadiusRef.current)
          : anchor.distanceTo(finalPt);
        if (radius < 0.5) return false;
        newEntity = createWireframeCircle(radius, anchor.y, [anchor.x, anchor.z], 0, 360, 'G17', { color: 0x38bdf8 });
        if (onDrawingUpdateRef.current) {
          onDrawingUpdateRef.current({ tool: 'circle', radius, diameter: radius * 2, center: anchor, completed: true });
        }
      } else if (tool === 'rect') {
        const rectOpts = getLockedRectOptions();
        const { width, height, cx, cz, dirX, dirZ } = computeRectPlacement(anchor, finalPt, rectOpts);
        if (width < 0.5 || height < 0.5) return false;

        newEntity = createWireframeRect(width, height, anchor.y, 0, [cx, cz], { color: 0x38bdf8 });
        if (rectCreateSurfaceRef.current) {
          const planeGeo = new THREE.PlaneGeometry(width, height);
          planeGeo.rotateX(-Math.PI / 2);
          const planeMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
          });
          const surfMesh = new THREE.Mesh(planeGeo, planeMat);
          surfMesh.position.set(cx, anchor.y, cz);
          surfMesh.name = `Surface_Plane_${Math.round(width)}x${Math.round(height)}`;
          surfMesh.userData = { type: 'surface', cadType: 'surface_plane' };
          newEntity.add(surfMesh);
        }
        if (onDrawingUpdateRef.current) {
          onDrawingUpdateRef.current({
            tool: 'rect',
            width,
            height,
            dirX,
            dirZ,
            firstCorner: anchor,
            secondCorner: finalPt,
            completed: true
          });
        }
      } else if (tool === 'line') {
        const { p2, length, angle } = computeLineEnd(anchor, finalPt, getLockedLineOptions());
        if (length < 0.5) return false;

        newEntity = createWireframeLine(
          [anchor.x, anchor.y, anchor.z],
          [p2.x, p2.y, p2.z],
          { color: 0x38bdf8 }
        );
        if (onDrawingUpdateRef.current) {
          onDrawingUpdateRef.current({
            tool: 'line',
            length,
            angle,
            pt1: anchor,
            pt2: p2,
            completed: true
          });
        }
      }

      if (newEntity && onAddCustomEntityRef.current) {
        onAddCustomEntityRef.current(newEntity);
      }

      sketchAnchorRef.current = null;
      setSketchAnchor(null);
      setDimensionFeedback(null);
      if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
      setSketchPromptText(getDefaultPromptForTool(tool));
      return true;
    };

    const onMouseDown = (e) => {
      if (document.activeElement && document.activeElement !== dom && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      dom.focus({ preventScroll: true });
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
          dragStartScreenX = e.clientX;
          dragStartScreenY = e.clientY;

          const resolved = resolveSnappedPoint(e);
          if (!resolved) return;
          const { finalPt } = resolved;

          const tool = activeSketchToolRef.current;

          if (tool === 'drill') {
            const marker = createPointMarker([finalPt.x, finalPt.y, finalPt.z], `Drill_Point_${Date.now()}`, 0xef4444);
            if (onAddCustomEntityRef.current) onAddCustomEntityRef.current(marker);
            return;
          }

          if (tool === 'line' || tool === 'rect' || tool === 'circle' || tool === 'arc_tangent' || tool === 'arctangent') {
            if (!sketchAnchorRef.current) {
              // 1-Click placement when full dimensions are explicitly locked (Mastercam Auto-place)
              const fullyLockedRect = tool === 'rect'
                && isWidthLockedRef.current && activeDrawingWidthRef.current > 0
                && isHeightLockedRef.current && activeDrawingHeightRef.current > 0;
              const fullyLockedCircle = (tool === 'circle' || tool === 'arc_tangent' || tool === 'arctangent')
                && isRadiusLockedRef.current && activeDrawingRadiusRef.current > 0;
              const fullyLockedLine = tool === 'line'
                && isLengthLockedRef.current && activeDrawingLengthRef.current > 0
                && isAngleLockedRef.current;

              if (fullyLockedRect || fullyLockedCircle || fullyLockedLine) {
                commitInteractiveEntity(finalPt, finalPt);
                return;
              }

              sketchAnchorRef.current = finalPt.clone();
              setSketchAnchor(finalPt.clone());
              isDrawingDrag = true;
              if (onDrawingUpdateRef.current) {
                if (tool === 'circle' || tool === 'arc_tangent' || tool === 'arctangent') {
                  onDrawingUpdateRef.current({
                    tool: 'circle',
                    center: finalPt.clone(),
                    radius: (isRadiusLockedRef.current && activeDrawingRadiusRef.current > 0) ? activeDrawingRadiusRef.current : undefined,
                    diameter: (isRadiusLockedRef.current && activeDrawingRadiusRef.current > 0) ? activeDrawingRadiusRef.current * 2 : undefined,
                    isDragging: true
                  });
                } else if (tool === 'rect') {
                  onDrawingUpdateRef.current({
                    tool: 'rect',
                    firstCorner: finalPt.clone(),
                    isDragging: true
                  });
                } else if (tool === 'line') {
                  onDrawingUpdateRef.current({
                    tool: 'line',
                    pt1: finalPt.clone(),
                    isDragging: true
                  });
                }
              }
              setSketchPromptText(
                tool === 'rect' ? 'Select position of second corner' :
                tool === 'line' ? 'Specify second endpoint' :
                'Enter radius point'
              );
            } else {
              // 2nd click: require valid non-zero dimensions (prevents accidental 1mm slivers)
              const committed = commitInteractiveEntity(sketchAnchorRef.current, finalPt);
              if (!committed && tool === 'rect') {
                setSketchPromptText('Move cursor diagonally to give rectangle non-zero Width & Height');
              }
            }
            return;
          }
        }
      }

      if (e.button === 0) {
        pickDownX = e.clientX;
        pickDownY = e.clientY;
        isDragging = true;
      }
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

      // Sketch Mode Hover & Ghost Preview (ignore cursor movement once user moves off canvas into left panel/UI unless dragging)
      if (isSketchModeRef.current) {
        if (!isDrawingDrag && e.target !== renderer.domElement) {
          return;
        }
        setMouseScreenPos({ x: e.clientX, y: e.clientY });
        const resolved = resolveSnappedPoint(e);
        if (resolved) {
          const { finalPt, snapResult } = resolved;

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

            if (tool === 'circle' || tool === 'arc_tangent' || tool === 'arctangent') {
              const lockedR = (isRadiusLockedRef.current && activeDrawingRadiusRef.current > 0)
                ? Number(activeDrawingRadiusRef.current)
                : null;
              const r = lockedR ?? Math.max(0.5, anchor.distanceTo(finalPt));
              const ghost = createGhostPreview(tool, anchor, finalPt, { lockedRadius: lockedR });
              sketchGhostGroupRef.current.add(ghost);

              setDimensionFeedback(`R: ${r.toFixed(2)} mm (Ø ${(r * 2).toFixed(2)} mm)`);
              setSketchPromptText(`Enter radius point (R: ${r.toFixed(2)} mm)`);

              if (onDrawingUpdateRef.current && !isRadiusLockedRef.current) {
                onDrawingUpdateRef.current({
                  tool: 'circle',
                  radius: r,
                  diameter: r * 2,
                  center: anchor,
                  isDragging: isDrawingDrag
                });
              }
            } else if (tool === 'rect') {
              const rectOpts = getLockedRectOptions();
              const { width, height, dirX, dirZ } = computeRectPlacement(anchor, finalPt, rectOpts);
              const ghost = createGhostPreview(tool, anchor, finalPt, rectOpts);
              sketchGhostGroupRef.current.add(ghost);

              setDimensionFeedback(`W: ${width.toFixed(2)} mm, H: ${height.toFixed(2)} mm`);
              setSketchPromptText('Select position of second corner');

              if (onDrawingUpdateRef.current && (width >= 0.5 || height >= 0.5)) {
                onDrawingUpdateRef.current({
                  tool: 'rect',
                  width: rectOpts.lockedWidth ?? width,
                  height: rectOpts.lockedHeight ?? height,
                  dirX,
                  dirZ,
                  firstCorner: anchor,
                  secondCorner: finalPt,
                  isDragging: isDrawingDrag
                });
              }
            } else if (tool === 'line') {
              const lineOpts = getLockedLineOptions();
              const { p2, length, angle } = computeLineEnd(anchor, finalPt, lineOpts);
              const ghost = createGhostPreview(tool, anchor, p2, lineOpts);
              sketchGhostGroupRef.current.add(ghost);

              setDimensionFeedback(`L: ${length.toFixed(2)} mm, ∠ ${angle.toFixed(1)}°`);
              setSketchPromptText('Specify second endpoint');

              if (onDrawingUpdateRef.current) {
                onDrawingUpdateRef.current({
                  tool: 'line',
                  length: lineOpts.lockedLength ?? length,
                  angle: lineOpts.lockedAngle ?? angle,
                  pt1: anchor,
                  pt2: p2,
                  isDragging: isDrawingDrag
                });
              }
            }
          } else {
            const hasFullLock =
              (activeSketchToolRef.current === 'rect' && isWidthLockedRef.current && Number(activeDrawingWidthRef.current) > 0 && isHeightLockedRef.current && Number(activeDrawingHeightRef.current) > 0) ||
              ((activeSketchToolRef.current === 'circle' || activeSketchToolRef.current === 'arc_tangent' || activeSketchToolRef.current === 'arctangent') && isRadiusLockedRef.current && Number(activeDrawingRadiusRef.current) > 0) ||
              (activeSketchToolRef.current === 'line' && isLengthLockedRef.current && Number(activeDrawingLengthRef.current) > 0 && isAngleLockedRef.current);

            if (hasFullLock) {
              renderLockedPreviewAtRef.current?.(finalPt, { isCursorHover: true });
            } else {
              if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
              setDimensionFeedback(null);
              setSketchPromptText(getDefaultPromptForTool(activeSketchToolRef.current));
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

    const onMouseUp = (e) => {
      isDragging = false;
      isPanning = false;

      if ((isChainingActiveRef.current || isBasePointPickActiveRef.current) && e.button === 0 && !isSketchModeRef.current) {
        const clickDist = Math.hypot(e.clientX - pickDownX, e.clientY - pickDownY);
        if (clickDist < 6) {
          if (isBasePointPickActiveRef.current && onPickBasePointRef.current) {
            const snapped = resolveSnappedPoint(e);
            const pt = snapped?.finalPt || getSketchIntersection(e);
            if (pt) onPickBasePointRef.current({ x: pt.x, y: pt.y, z: pt.z });
            return;
          }
          if (isChainingActiveRef.current && onSelectChainEntityRef.current) {
            const picked = resolvePickOnWireframe(e);
            if (picked?.entity) {
              onSelectChainEntityRef.current(picked.entity);
            }
            return;
          }
        }
      }

      if (isSketchModeRef.current && isDrawingDrag) {
        isDrawingDrag = false;
        const dragDist = Math.hypot(e.clientX - dragStartScreenX, e.clientY - dragStartScreenY);

        if (dragDist > 12 && sketchAnchorRef.current) {
          const anchor = sketchAnchorRef.current;
          const localPt = getSketchIntersection(e);
          let finalPt = localPt || anchor;
          if (objectSnapRef.current) {
            const snap = snapToEntityPoints(finalPt, customGeometryRef.current, 5.0);
            if (snap.snapped) finalPt = snap.point;
          } else if (gridSnapRef.current) {
            finalPt = snapToGrid(finalPt, gridStepRef.current, orthoLockRef.current, anchor);
          }

          commitInteractiveEntity(anchor, finalPt);
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(80, Math.min(800, spherical.radius + e.deltaY * 0.4));
      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 45, 0);
    };

    const onMouseLeave = () => {
      if (isSketchModeRef.current && !isDrawingDrag && !sketchAnchorRef.current) {
        const originPt = new THREE.Vector3(0, partTopYRef.current ?? 0, 0);
        renderLockedPreviewAtRef.current?.(originPt, { isCursorHover: false });
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mouseleave', onMouseLeave);
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
      dom.removeEventListener('mouseleave', onMouseLeave);
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

  // 6. Custom Geometry is managed cleanly by Effect 11 (preserves layer visibility flags)

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
    if (!toolpathGroupRef.current) return;
    const group = toolpathGroupRef.current;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const toBox3 = (b) => {
      if (!b || !b.min || !b.max) return null;
      if (typeof b.getCenter === 'function') return b;
      return new THREE.Box3(
        new THREE.Vector3(b.min.x || 0, b.min.y || 0, b.min.z || 0),
        new THREE.Vector3(b.max.x || 0, b.max.y || 0, b.max.z || 0)
      );
    };

    let bounds = toBox3(partMetrics?.box || partMetrics?.bounds);
    if (!bounds && stockConfig?.dimensions) {
      const sx = stockConfig.dimensions.x || 100;
      const sy = stockConfig.dimensions.y || 40;
      const sz = stockConfig.dimensions.z || 80;
      bounds = new THREE.Box3(
        new THREE.Vector3(-sx / 2, -sy / 2, -sz / 2),
        new THREE.Vector3(sx / 2, sy / 2, sz / 2)
      );
    }
    if (!bounds) {
      bounds = new THREE.Box3(new THREE.Vector3(-50, -20, -50), new THREE.Vector3(50, 20, 50));
    }

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
      const effectiveModel = buildEffectiveDriveModel(currentModel, customGeometry, op);
      const opBounds = (op.usesCustomSurfaces && effectiveModel)
        ? computeDriveModelBounds(effectiveModel, op.bounds || bounds)
        : (toBox3(op.bounds) || bounds);

      let toolpathData;
      if (op.badgeClass === 'face') {
        toolpathData = generateFacingToolpath(opBounds, assignedTool, {
          stepoverPct: op.stepoverPct || 65,
          faceAllowance: stockConfig.allowanceTop || 2.0,
          depthOfCut: op.stepdown || 1.0,
          rapidHeight: op.rapidHeight || 15.0
        });
      } else if (op.badgeClass === 'pocket' || op.badgeClass === 'surface_pocket') {
        toolpathData = generateSurfacePocketToolpath(opBounds, assignedTool, buildPocketParamsFromOp(op), effectiveModel);
      } else if (op.badgeClass === 'circlemill') {
        toolpathData = generateCircleMillToolpath(opBounds, assignedTool, {
          diameter: op.diameter || (op.chain?.radius ? op.chain.radius * 2 : 50.8),
          totalDepth: op.totalDepth || 50.8,
          stepdown: op.stepdown || 6.35,
          rapidHeight: op.rapidHeight || 15.0,
          chain: op.chain,
          center: op.center || op.chain?.center
        });
      } else if (op.badgeClass === 'contour' || op.badgeClass === 'waterline') {
        toolpathData = generateWaterlineToolpath(opBounds, assignedTool, buildContourParamsFromOp(op), effectiveModel);
      } else if (op.badgeClass === 'swarf') {
        toolpathData = generateSwarfToolpath(opBounds, assignedTool, {
          tiltAngleDeg: 15.0,
          passes: 3
        }, effectiveModel);
      } else if (op.badgeClass === 'drill') {
        toolpathData = generateDrillingToolpath(opBounds, assignedTool, {
          drillDepth: op.totalDepth || 25.0,
          peckDepth: op.stepdown || 5.0,
          rapidHeight: op.rapidHeight || 10.0
        }, effectiveModel);
      } else if (op.badgeClass === 'spotdrill') {
        toolpathData = generateSpotDrillToolpath(opBounds, assignedTool, {
          spotDepth: op.stepdown || op.totalDepth || 3.8,
          rapidHeight: op.rapidHeight || 10.0
        }, effectiveModel);
      } else if (op.badgeClass === 'adaptive' || op.badgeClass === 'dynamic') {
        toolpathData = generateAdaptiveRoughingToolpath(opBounds, assignedTool, {
          stepoverPct: op.stepoverPct || 25,
          stepdown: op.stepdown || 6.0,
          totalDepth: op.totalDepth || 18.0,
          rapidHeight: op.rapidHeight || 15.0
        });
      } else if (op.badgeClass === 'chamfer') {
        toolpathData = generateChamferToolpath(opBounds, assignedTool, {
          chamferWidth: op.chamferWidth || op.stepdown || 0.508,
          tipOffset: op.tipOffset || 1.27,
          rapidHeight: op.rapidHeight || 15.0
        }, effectiveModel);
      } else if (op.badgeClass === 'tap') {
        toolpathData = generateTapToolpath(opBounds, assignedTool, {
          pitch: op.pitch || 0.79375,
          totalDepth: op.totalDepth || 12.19,
          rapidHeight: op.rapidHeight || 10.0
        }, effectiveModel);
      } else if (op.badgeClass === 'parallel' || op.badgeClass === 'surface') {
        toolpathData = generateSurfaceParallelToolpath(opBounds, assignedTool, {
          stepoverPct: op.stepoverPct || 20,
          rapidHeight: op.rapidHeight || 15.0
        }, effectiveModel);
      } else if (op.badgeClass === 'rest' || op.badgeClass === 'rest_milling') {
        toolpathData = generateRestMillingToolpath(opBounds, assignedTool, {
          refToolDiameter: op.refToolDiameter || 12.0,
          stepdown: op.stepdown || 2.5,
          totalDepth: op.totalDepth || 15.0,
          stepoverPct: op.stepoverPct || 30,
          rapidHeight: op.rapidHeight || 15.0
        }, effectiveModel);
      } else if (op.badgeClass === 'pencil') {
        toolpathData = generatePencilTracingToolpath(opBounds, assignedTool, {
          totalDepth: op.totalDepth || 15.0,
          stepdown: op.stepdown || 1.0,
          biTangencyRadius: op.biTangencyRadius || 3.0,
          rapidHeight: op.rapidHeight || 15.0
        }, effectiveModel);
      } else if (op.badgeClass === 'probe') {
        const center = op.center || {
          x: (opBounds.min.x + opBounds.max.x) / 2,
          y: opBounds.max.y,
          z: (opBounds.min.z + opBounds.max.z) / 2
        };
        toolpathData = generateProbingToolpath(op.strategyKey || 'bore_centering', center, op.probingParams || {});
      }

      if (toolpathData) {
        const { cutGeo, rapidGeo } = buildToolpathMeshes(toolpathData);
        // CAD entities sit inside customGeoGroup at Y = 49; align CAD/surface toolpaths to that height
        const usesCadSpace = !!op.chain || !!op.usesCustomSurfaces || !!(op.driveSurfaceIds?.length) || !currentModel;
        const visualYOffset = usesCadSpace ? 49 : 0;

        // Feed cut line segments
        if (cutGeo.attributes.position && cutGeo.attributes.position.count > 0) {
          const cutMat = new THREE.LineBasicMaterial({
            color: opColors[op.badgeClass] || 0x10b981,
            linewidth: 2
          });
          const cutMesh = new THREE.LineSegments(cutGeo, cutMat);
          cutMesh.name = `op_cut_${op.id}`;
          cutMesh.position.y = visualYOffset;
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
          rapidMesh.position.y = visualYOffset;
          rapidMesh.visible = op.visible && (layerVisibility.rapids !== false);
          group.add(rapidMesh);
        }
      }
    });
  }, [operations, tools, partMetrics, stockConfig, currentModel, customGeometry, layerVisibility.toolpaths, layerVisibility.rapids]);

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

  // 11a. Render Dashed Selection Highlight for Active Chaining Curves
  useEffect(() => {
    const group = chainHighlightGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) group.remove(group.children[0]);

    if (!isChainingActive && (!Array.isArray(selectedExtrudeChains) || selectedExtrudeChains.length === 0)) {
      return;
    }

    (selectedExtrudeChains || []).forEach((chain) => {
      if (!chain || !Array.isArray(chain.points) || chain.points.length < 2) return;
      const pts = chain.points.map((p) => new THREE.Vector3(p.x, (p.y || 0) + 0.15, p.z));
      const baseGeo = new THREE.BufferGeometry().setFromPoints(pts);

      // Dark underlay + bright dashed overlay matching Mastercam dashed contour highlight
      const underlay = new THREE.Line(baseGeo, new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 2 }));
      group.add(underlay);

      const dashLine = new THREE.Line(
        baseGeo.clone(),
        new THREE.LineDashedMaterial({ color: 0xf8fafc, dashSize: 2.5, gapSize: 2.5, linewidth: 2 })
      );
      dashLine.computeLineDistances();
      group.add(dashLine);

      // Direction Arrow along first segment
      const p0 = pts[0];
      const p1 = pts[Math.min(1, pts.length - 1)];
      const dir = new THREE.Vector3().subVectors(p1, p0);
      if (dir.lengthSq() > 1e-4) {
        dir.normalize();
        const coneGeo = new THREE.ConeGeometry(1.4, 3.8, 8);
        const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x16a34a }));
        cone.position.copy(p0).addScaledVector(dir, 3.0);
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        group.add(cone);
      }
    });
  }, [isChainingActive, selectedExtrudeChains]);

  // 11a-2. Render Live Parametric Cyan Surface Extrude Preview
  useEffect(() => {
    const group = surfacePreviewGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) group.remove(group.children[0]);

    if (!surfaceExtrudePreview || !Array.isArray(surfaceExtrudePreview.chains) || surfaceExtrudePreview.chains.length === 0) {
      return;
    }

    const previewMesh = createParametricChainExtrusion(
      surfaceExtrudePreview.chains,
      surfaceExtrudePreview.params,
      { isPreview: true }
    );
    group.add(previewMesh);
  }, [surfaceExtrudePreview]);

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

    const trajectory = compileBackplotTrajectory(operations, tools, bounds, currentModel, effectiveOpId, 49, customGeometry);
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
  }, [isBackplotActive, activeOpId, backplotSelectedOpFilter, operations, tools, partMetrics, currentModel, customGeometry, backplotInternalMode, heatmapTolerance]);

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
        const topY = currentModel
          ? (partMetrics?.box?.max?.y || 45)
          : ((partMetrics?.box?.max?.y || 0) + 49);
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
      if (e.ctrlKey || e.metaKey || e.altKey) return;

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
          onModelImported(modelGroup, file.name, file);
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

      {/* Floating AutoCursor Prompt Tooltip (Matching Mastercam Image 3) */}
      {isSketchModeActive && mouseScreenPos.x > 0 && mouseScreenPos.y > 0 && (
        <div
          style={{
            position: 'fixed',
            left: mouseScreenPos.x + 15,
            top: mouseScreenPos.y + 15,
            background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.92)',
            border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
            padding: '2px 8px',
            borderRadius: '3px',
            fontSize: '11px',
            fontWeight: 600,
            color: isLight ? '#0f172a' : '#f8fafc',
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap'
          }}
        >
          {sketchPromptText}
        </div>
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

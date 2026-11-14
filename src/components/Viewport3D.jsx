import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  Eye, Layers, Rotate3D, UploadCloud, Box, Info, Scissors, Camera, Sun, Sliders,
  Play, Pause, SkipForward, SkipBack, RotateCcw, X, AlertTriangle, CheckCircle2, Gauge
} from 'lucide-react';
import {
  buildSolidFaceCatalog,
  resolveSolidFaceSelectionAction,
  buildSolidFaceHighlightGroup
} from '../utils/solidFaceSelectionEngine';
import { buildFlowlinePreviewForFaces } from '../utils/flowlineToolpathEngine';
import {
  getCustomEntityId,
  sampleEntityWorldGeometry,
  hitTestEntitiesInMarquee,
  hitTestEntitiesInPolygon,
  hitTestEntitiesByVector,
  hitTestEntitiesByArea,
  hitTestChainAtScreenPoint,
  hitTestEntityAtScreenPoint,
  matchesSelectionMask,
  matchesTopologyFilter,
  summarizeSelectedEntities
} from '../utils/cadSelectionEngine';
import AutoCursorBar from './AutoCursorBar';
import QuickMaskBar from './QuickMaskBar';
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
  generateToolpathForOperation,
  buildLinkedOperationSegments,
  buildToolpathMeshes,
  createToolAssembly3D,
  compileBackplotTrajectory,
  sampleTrajectoryAtT,
  buildEffectiveDriveModel,
  resolveOperationDriveBounds
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

function resolveStockAllowances(stockConfig) {
  return {
    sides: Number(stockConfig?.allowanceSides ?? 4),
    top: Number(stockConfig?.allowanceTop ?? 2)
  };
}

function disposeGroupMeshes(group) {
  if (!group) return;
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    child.traverse?.((node) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) {
        if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
        else node.material.dispose();
      }
    });
  }
}

/**
 * Creates high-resolution Mastercam drafting dimension text badge sprite
 */
function createDimensionBadgeSprite(text, { color = '#1e3a8a', bg = '#ffffff', border = '#3b82f6', fontSize = 26, scale = 11 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;

  const x = 12, y = 14, w = 232, h = 68, r = 10;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, y + h / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(scale, scale * (96 / 256), 1);
  return sprite;
}

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
  partMetrics: externalPartMetrics = null,
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
  rectCornerFillet = 0,
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
  // Chaining, Selection & Live Surface Extrude Preview Props
  isChainingActive = false,
  chainingPlaneMode = '3d',
  chainingSelectionMethod = 'chain',
  isBasePointPickActive = false,
  selectedExtrudeChains = [],
  onSelectChainEntity = null,
  onWindowSelectChains = null,
  onPickBasePoint = null,
  surfaceExtrudePreview = null,
  selectedEntityIds = [],
  onChangeSelectedEntities = null,
  isSelectModeActive = false,
  onToggleSelectMode = null,
  onDeleteSelectedEntities = null,
  onBlankSelectedEntities = null,
  onRequestExtrudeSelection = null,
  onRequestTransformSelection = null,
  snapMode: propSnapMode = 'auto',
  onChangeSnapMode = null,
  isAutoCursorLocked = false,
  onToggleAutoCursorLock = null,
  canvasSelectionMethod = 'automatic',
  onChangeCanvasSelectionMethod = null,
  containmentMode = 'in_cross',
  onChangeContainmentMode = null,
  solidFilterMode = 'all',
  onChangeSolidFilterMode = null,
  selectionMask = 'all',
  onChangeSelectionMask = null,
  stickyMultiSelect = false,
  onToggleStickyMultiSelect = null,
  onReselectPrevious = null,
  onFastPointSubmit = null,
  surfaceSelectionSession = null,
  flowlinePreview = null,
  onOpenSelectAllModal = null,
  onSwitchToLevels = null,
  onSwitchToPlanes = null,
  onOpenGroups = null,
  probingSession = null,
  onProbeFeaturePicked = null,
  activeTransformTool = null,
  transformPreviewState = null,
  isDraftingActive = false,
  isAnalyzeDynamicActive = false,
  onAnalyzeDynamicUpdate = null,
  analyzeDynamicScale = 1.0
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
  const lastVerifyProgressRef = useRef(-1);
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
  const [internalPartMetrics, setInternalPartMetrics] = useState(null);
  const partMetrics = externalPartMetrics || internalPartMetrics;

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
  const [camDist, setCamDist] = useState(350);
  const [selectionMarquee, setSelectionMarquee] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [polygonCursorPt, setPolygonCursorPt] = useState(null);
  const [vectorSegment, setVectorSegment] = useState(null);
  const [hoveredEntityId, setHoveredEntityId] = useState(null);
  const [hoveredFaceId, setHoveredFaceId] = useState(null);
  const [faceCursorScreen, setFaceCursorScreen] = useState(null);
  const [selectedSolidFaceIds, setSelectedSolidFaceIds] = useState([]);
  const [faceSelectionModeNote, setFaceSelectionModeNote] = useState('');
  const [analyzeDynamicCursorScreen, setAnalyzeDynamicCursorScreen] = useState(null);

  const sketchGhostGroupRef = useRef(null);
  const snapIndicatorGroupRef = useRef(null);
  const chainHighlightGroupRef = useRef(null);
  const selectionHighlightGroupRef = useRef(null);
  const faceHighlightGroupRef = useRef(null);
  const transformManipulatorGroupRef = useRef(null);
  const flowlinePreviewGroupRef = useRef(null);
  const surfacePreviewGroupRef = useRef(null);
  const analyzeDynamicGroupRef = useRef(null);
  const isAnalyzeDynamicActiveRef = useRef(isAnalyzeDynamicActive);
  const analyzeDynamicScaleRef = useRef(analyzeDynamicScale);
  const onAnalyzeDynamicUpdateRef = useRef(onAnalyzeDynamicUpdate);
  const surfaceSelectionSessionRef = useRef(surfaceSelectionSession);
  const hoveredFaceIdRef = useRef(null);
  const selectedSolidFaceIdsRef = useRef([]);
  const solidFaceCatalog = useMemo(
    () => buildSolidFaceCatalog({ currentModel, customGeometry, partTransform }),
    [currentModel, customGeometry, partTransform]
  );
  const solidFaceCatalogRef = useRef(solidFaceCatalog);
  const isChainingActiveRef = useRef(isChainingActive);
  const chainingPlaneModeRef = useRef(chainingPlaneMode);
  const chainingSelectionMethodRef = useRef(chainingSelectionMethod);
  const isBasePointPickActiveRef = useRef(isBasePointPickActive);
  const onSelectChainEntityRef = useRef(onSelectChainEntity);
  const onWindowSelectChainsRef = useRef(onWindowSelectChains);
  const onPickBasePointRef = useRef(onPickBasePoint);
  const selectedEntityIdsRef = useRef(selectedEntityIds);
  const onChangeSelectedEntitiesRef = useRef(onChangeSelectedEntities);
  const isSelectModeRef = useRef(isSelectModeActive);
  const onToggleSelectModeRef = useRef(onToggleSelectMode);
  const onDeleteSelectedEntitiesRef = useRef(onDeleteSelectedEntities);
  const layerVisibilityRef = useRef(layerVisibility);
  const canvasSelectionMethodRef = useRef(canvasSelectionMethod);
  const containmentModeRef = useRef(containmentMode);
  const solidFilterModeRef = useRef(solidFilterMode);
  const selectionMaskRef = useRef(selectionMask);
  const stickyMultiSelectRef = useRef(stickyMultiSelect);
  const polygonPointsRef = useRef([]);
  const completePolygonRef = useRef(null);
  const cancelInteractiveSelectionRef = useRef(null);
  const vectorStartRef = useRef(null);
  const hoverCheckFrameRef = useRef(0);
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
  const rectCornerFilletRef = useRef(rectCornerFillet);
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
  useEffect(() => { rectCornerFilletRef.current = rectCornerFillet; }, [rectCornerFillet]);
  useEffect(() => { rectCreateSurfaceRef.current = rectCreateSurface; }, [rectCreateSurface]);
  useEffect(() => { activeDrawingLengthRef.current = activeDrawingLength; }, [activeDrawingLength]);
  useEffect(() => { isLengthLockedRef.current = isLengthLocked; }, [isLengthLocked]);
  useEffect(() => { activeDrawingAngleRef.current = activeDrawingAngle; }, [activeDrawingAngle]);
  useEffect(() => { isAngleLockedRef.current = isAngleLocked; }, [isAngleLocked]);
  useEffect(() => { lineTypeRef.current = lineType; }, [lineType]);
  useEffect(() => { onDrawingUpdateRef.current = onDrawingUpdate; }, [onDrawingUpdate]);
  useEffect(() => { isChainingActiveRef.current = isChainingActive; }, [isChainingActive]);
  useEffect(() => { chainingPlaneModeRef.current = chainingPlaneMode; }, [chainingPlaneMode]);
  useEffect(() => { chainingSelectionMethodRef.current = chainingSelectionMethod; }, [chainingSelectionMethod]);
  useEffect(() => { isBasePointPickActiveRef.current = isBasePointPickActive; }, [isBasePointPickActive]);
  useEffect(() => { onSelectChainEntityRef.current = onSelectChainEntity; }, [onSelectChainEntity]);
  useEffect(() => { onWindowSelectChainsRef.current = onWindowSelectChains; }, [onWindowSelectChains]);
  useEffect(() => { onPickBasePointRef.current = onPickBasePoint; }, [onPickBasePoint]);
  useEffect(() => { selectedEntityIdsRef.current = selectedEntityIds; }, [selectedEntityIds]);
  useEffect(() => { onChangeSelectedEntitiesRef.current = onChangeSelectedEntities; }, [onChangeSelectedEntities]);
  useEffect(() => { isSelectModeRef.current = isSelectModeActive; }, [isSelectModeActive]);
  useEffect(() => { onToggleSelectModeRef.current = onToggleSelectMode; }, [onToggleSelectMode]);
  useEffect(() => { onDeleteSelectedEntitiesRef.current = onDeleteSelectedEntities; }, [onDeleteSelectedEntities]);
  useEffect(() => { layerVisibilityRef.current = layerVisibility; }, [layerVisibility]);
  useEffect(() => { canvasSelectionMethodRef.current = canvasSelectionMethod; }, [canvasSelectionMethod]);
  useEffect(() => { containmentModeRef.current = containmentMode; }, [containmentMode]);
  useEffect(() => { solidFilterModeRef.current = solidFilterMode; }, [solidFilterMode]);
  useEffect(() => { selectionMaskRef.current = selectionMask; }, [selectionMask]);
  useEffect(() => { stickyMultiSelectRef.current = stickyMultiSelect; }, [stickyMultiSelect]);
  useEffect(() => { surfaceSelectionSessionRef.current = surfaceSelectionSession; }, [surfaceSelectionSession]);
  useEffect(() => { solidFaceCatalogRef.current = solidFaceCatalog; }, [solidFaceCatalog]);
  useEffect(() => { selectedSolidFaceIdsRef.current = selectedSolidFaceIds; }, [selectedSolidFaceIds]);
  useEffect(() => { hoveredFaceIdRef.current = hoveredFaceId; }, [hoveredFaceId]);
  const probingSessionRef = useRef(probingSession);
  const onProbeFeaturePickedRef = useRef(onProbeFeaturePicked);
  useEffect(() => { probingSessionRef.current = probingSession; }, [probingSession]);
  useEffect(() => { onProbeFeaturePickedRef.current = onProbeFeaturePicked; }, [onProbeFeaturePicked]);
  useEffect(() => { isAnalyzeDynamicActiveRef.current = isAnalyzeDynamicActive; }, [isAnalyzeDynamicActive]);
  useEffect(() => { analyzeDynamicScaleRef.current = analyzeDynamicScale; }, [analyzeDynamicScale]);
  useEffect(() => { onAnalyzeDynamicUpdateRef.current = onAnalyzeDynamicUpdate; }, [onAnalyzeDynamicUpdate]);
  useEffect(() => {
    // Switching away from polygon/vector clears transient rubber-band overlays cleanly
    polygonPointsRef.current = [];
    setPolygonPoints([]);
    setPolygonCursorPt(null);
    vectorStartRef.current = null;
    setVectorSegment(null);
  }, [canvasSelectionMethod, chainingSelectionMethod, isSelectModeActive]);

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

    const selectionHighlightGroup = new THREE.Group();
    selectionHighlightGroup.name = "Selection_Highlight_Group";
    selectionHighlightGroup.position.set(0, 49, 0);
    scene.add(selectionHighlightGroup);
    selectionHighlightGroupRef.current = selectionHighlightGroup;

    const faceHighlightGroup = new THREE.Group();
    faceHighlightGroup.name = "Face_Highlight_Group";
    faceHighlightGroup.position.set(0, 49, 0);
    scene.add(faceHighlightGroup);
    faceHighlightGroupRef.current = faceHighlightGroup;

    const flowlinePreviewGroup = new THREE.Group();
    flowlinePreviewGroup.name = "Flowline_Preview_Group";
    flowlinePreviewGroup.position.set(0, 49, 0);
    scene.add(flowlinePreviewGroup);
    flowlinePreviewGroupRef.current = flowlinePreviewGroup;

    const surfacePreviewGroup = new THREE.Group();
    surfacePreviewGroup.name = "Surface_Preview_Group";
    surfacePreviewGroup.position.set(0, 49, 0);
    scene.add(surfacePreviewGroup);
    surfacePreviewGroupRef.current = surfacePreviewGroup;

    // Transform Manipulators Group (Rotate Goniometer, Translate Arrows, Offset)
    const transformManipulatorGroup = new THREE.Group();
    transformManipulatorGroup.name = "Transform_Manipulator_Group";
    transformManipulatorGroup.position.set(0, 49, 0);
    scene.add(transformManipulatorGroup);
    transformManipulatorGroupRef.current = transformManipulatorGroup;

    // Drafting Dimension Callouts Group
    const dimensionGroup = new THREE.Group();
    dimensionGroup.position.set(0, 49, 0);
    scene.add(dimensionGroup);
    dimensionGroupRef.current = dimensionGroup;

    // Analyze Dynamic Interactive Vector Group (Image 4)
    const analyzeDynamicGroup = new THREE.Group();
    analyzeDynamicGroup.name = "Analyze_Dynamic_Group";
    analyzeDynamicGroup.position.set(0, 49, 0);
    scene.add(analyzeDynamicGroup);
    analyzeDynamicGroupRef.current = analyzeDynamicGroup;

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

    // Mouse Drag Orbit, Pan & 7-Mode CAD Selection (Automatic, Chain, Window, Polygon, Single, Area, Vector)
    let isDragging = false;
    let isPanning = false;
    let isDrawingDrag = false;
    let isMarqueeDrag = false;
    let isVectorDrag = false;
    let marqueeTarget = null; // 'selection' | 'chaining'
    let marqueeShiftAdd = false;
    let marqueeStartX = 0;
    let marqueeStartY = 0;
    let vectorDownScreenX = 0;
    let vectorDownScreenY = 0;
    let dragStartScreenX = 0;
    let dragStartScreenY = 0;
    let pickDownX = 0;
    let pickDownY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = new THREE.Spherical(340, Math.PI / 3.4, Math.PI / 4);

    const isSelectionArmed = () =>
      isChainingActiveRef.current ||
      isSelectModeRef.current ||
      (isSketchModeRef.current && activeSketchToolRef.current === 'select');

    const isSolidFaceSelectActive = () =>
      Boolean(surfaceSelectionSessionRef.current?.active) ||
      (isSelectModeRef.current && solidFilterModeRef.current === 'solid_face');

    let lastFaceClickTime = 0;
    let lastFaceClickX = 0;
    let lastFaceClickY = 0;
    let faceClickStreak = 0;

    const raycastSolidFaceAtClient = (clientX, clientY) => {
      const rect = dom.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);

      const candidateMeshes = [];
      if (partHolderGroupRef.current && partHolderGroupRef.current.visible !== false) {
        partHolderGroupRef.current.updateMatrixWorld(true);
        partHolderGroupRef.current.traverse((child) => {
          if (child.isMesh && child.visible !== false && !child.userData?.isHelper && !child.name?.startsWith('helper_')) {
            candidateMeshes.push(child);
          }
        });
      }
      if (customGeoGroupRef.current && customGeoGroupRef.current.visible !== false) {
        customGeoGroupRef.current.updateMatrixWorld(true);
        customGeoGroupRef.current.traverse((child) => {
          if (child.isMesh && child.visible !== false && !child.userData?.isHelper && !child.name?.startsWith('helper_')) {
            candidateMeshes.push(child);
          }
        });
      }

      if (candidateMeshes.length === 0) return null;
      const hits = raycaster.intersectObjects(candidateMeshes, false);
      if (!hits || hits.length === 0) return null;

      const catalog = solidFaceCatalogRef.current;
      for (const h of hits) {
        const hitFace = catalog?.lookupFaceFromHit(h, 49);
        if (hitFace) {
          return { hitFace, hits, rect };
        }
      }
      return null;
    };

    const getEffectiveMethod = () => (
      isChainingActiveRef.current
        ? (chainingSelectionMethodRef.current || 'chain')
        : (canvasSelectionMethodRef.current || 'automatic')
    );

    const resolveSelectionFilterOpts = (extra = {}) => ({
      worldYOffset: 49,
      mask: selectionMaskRef.current || 'all',
      solidFilter: solidFilterModeRef.current || 'all',
      layerVisibility: layerVisibilityRef.current,
      ...extra
    });

    const applyMatchedEntities = (matchedEntities = [], target = 'selection', additive = false, toggleSingle = false) => {
      if (target === 'chaining') {
        if (onWindowSelectChainsRef.current) {
          onWindowSelectChainsRef.current(matchedEntities, { append: additive });
        }
        return;
      }
      if (!onChangeSelectedEntitiesRef.current) return;
      const matchedIds = matchedEntities.map(getCustomEntityId).filter(Boolean);
      if (toggleSingle && matchedIds.length === 1 && additive) {
        const curSet = new Set(selectedEntityIdsRef.current || []);
        if (curSet.has(matchedIds[0])) curSet.delete(matchedIds[0]);
        else curSet.add(matchedIds[0]);
        onChangeSelectedEntitiesRef.current([...curSet]);
        return;
      }
      if (additive) {
        const combined = [...new Set([...(selectedEntityIdsRef.current || []), ...matchedIds])];
        onChangeSelectedEntitiesRef.current(combined);
      } else {
        onChangeSelectedEntitiesRef.current(matchedIds);
      }
    };

    const completePolygonSelection = (additive = false) => {
      const pts = polygonPointsRef.current || [];
      if (pts.length < 3) {
        polygonPointsRef.current = [];
        setPolygonPoints([]);
        setPolygonCursorPt(null);
        return;
      }
      const rect = dom.getBoundingClientRect();
      const matched = hitTestEntitiesInPolygon(
        customGeometryRef.current || [],
        camera,
        rect.width,
        rect.height,
        pts,
        resolveSelectionFilterOpts({ mode: containmentModeRef.current || 'in_cross' })
      );
      applyMatchedEntities(
        matched,
        isChainingActiveRef.current ? 'chaining' : 'selection',
        additive || stickyMultiSelectRef.current
      );
      polygonPointsRef.current = [];
      setPolygonPoints([]);
      setPolygonCursorPt(null);
    };

    const cancelInteractiveSelection = () => {
      polygonPointsRef.current = [];
      setPolygonPoints([]);
      setPolygonCursorPt(null);
      vectorStartRef.current = null;
      isVectorDrag = false;
      setVectorSegment(null);
      isMarqueeDrag = false;
      setSelectionMarquee(null);
    };

    completePolygonRef.current = completePolygonSelection;
    cancelInteractiveSelectionRef.current = cancelInteractiveSelection;

    const resolveMarqueeTargetForDown = (e) => {
      if (e.button !== 0 || isBasePointPickActiveRef.current) return null;
      if (isSolidFaceSelectActive()) return null;
      if (isChainingActiveRef.current && chainingSelectionMethodRef.current === 'window') {
        return 'chaining';
      }
      if (isSelectionArmed()) {
        const m = getEffectiveMethod();
        if (m === 'automatic' || m === 'window') {
          return isChainingActiveRef.current ? 'chaining' : 'selection';
        }
      }
      if (e.shiftKey && !isSketchModeRef.current && !isChainingActiveRef.current) return 'selection';
      return null;
    };

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

        const maxR = Math.max(0, Math.min(width, height) / 2 - 0.05);
        const filletR = Math.max(0, Math.min(maxR, Number(rectCornerFilletRef.current) || 0));

        newEntity = createWireframeRect(width, height, anchor.y, filletR, [cx, cz], { color: 0x38bdf8 });
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

      if (e.button === 2) {
        if ((polygonPointsRef.current?.length || 0) >= 3) {
          completePolygonSelection(!!(e.shiftKey || e.ctrlKey || e.metaKey || stickyMultiSelectRef.current));
          return;
        }
        if ((polygonPointsRef.current?.length || 0) > 0 || vectorStartRef.current) {
          cancelInteractiveSelection();
          return;
        }
        isPanning = true;
        return;
      }
      if (e.button === 1) {
        isDragging = true;
        return;
      }

      if (e.button === 0 && probingSessionRef.current?.active) {
        const resolved = resolveSnappedPoint(e);
        if (resolved && onProbeFeaturePickedRef.current) {
          onProbeFeaturePickedRef.current({
            x: resolved.finalPt.x,
            y: resolved.finalPt.y,
            z: resolved.finalPt.z,
            point: resolved.finalPt
          });
          return;
        }
      }

      if (e.button === 0 && !isBasePointPickActiveRef.current && isSelectionArmed()) {
        const effMethod = getEffectiveMethod();
        const rect = dom.getBoundingClientRect();
        const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey || stickyMultiSelectRef.current);

        if (effMethod === 'polygon') {
          const curPoly = polygonPointsRef.current || [];
          if (curPoly.length >= 3 && Math.hypot(curX - curPoly[0].x, curY - curPoly[0].y) <= 12) {
            completePolygonSelection(additive);
            return;
          }
          const nextPoly = [...curPoly, { x: curX, y: curY }];
          polygonPointsRef.current = nextPoly;
          setPolygonPoints(nextPoly);
          setPolygonCursorPt({ x: curX, y: curY });
          return;
        }

        if (effMethod === 'vector') {
          if (vectorStartRef.current) {
            const p1 = vectorStartRef.current;
            const p2 = { x: curX, y: curY };
            vectorStartRef.current = null;
            isVectorDrag = false;
            setVectorSegment(null);
            const hits = hitTestEntitiesByVector(
              customGeometryRef.current || [],
              camera,
              rect.width,
              rect.height,
              p1,
              p2,
              resolveSelectionFilterOpts()
            );
            applyMatchedEntities(hits, isChainingActiveRef.current ? 'chaining' : 'selection', additive);
            return;
          }
          vectorDownScreenX = e.clientX;
          vectorDownScreenY = e.clientY;
          isVectorDrag = true;
          const startPt = { x: curX, y: curY };
          vectorStartRef.current = startPt;
          setVectorSegment({ p1: startPt, p2: startPt });
          return;
        }
      }

      const activeMarqueeTarget = resolveMarqueeTargetForDown(e);
      if (activeMarqueeTarget) {
        const rect = dom.getBoundingClientRect();
        isMarqueeDrag = true;
        marqueeTarget = activeMarqueeTarget;
        marqueeShiftAdd = !!(e.shiftKey || e.ctrlKey || e.metaKey || stickyMultiSelectRef.current);
        marqueeStartX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        marqueeStartY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const initMode = getEffectiveMethod() === 'window'
          ? (containmentModeRef.current || 'in_cross')
          : 'window';
        setSelectionMarquee({
          minX: marqueeStartX,
          maxX: marqueeStartX,
          minY: marqueeStartY,
          maxY: marqueeStartY,
          mode: initMode,
          previewCount: 0
        });
        return;
      }

      if (isSketchModeRef.current) {
        if (e.button === 0 && e.shiftKey) {
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

      if ((isVectorDrag || vectorStartRef.current) && getEffectiveMethod() === 'vector') {
        const rect = dom.getBoundingClientRect();
        const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        if (vectorStartRef.current) {
          setVectorSegment({ p1: vectorStartRef.current, p2: { x: curX, y: curY } });
        }
        return;
      }

      if ((polygonPointsRef.current?.length || 0) > 0 && getEffectiveMethod() === 'polygon') {
        const rect = dom.getBoundingClientRect();
        const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        setPolygonCursorPt({ x: curX, y: curY });
      }

      if (isMarqueeDrag) {
        const rect = dom.getBoundingClientRect();
        const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const effMethod = getEffectiveMethod();
        const isExplicitWindow = effMethod === 'window';
        const hitMode = isExplicitWindow
          ? (containmentModeRef.current || 'in_cross')
          : (curX >= marqueeStartX ? 'enclosed' : 'crossing');
        const displayMode = isExplicitWindow
          ? hitMode
          : (curX >= marqueeStartX ? 'window' : 'crossing');
        const marqueeBox = {
          minX: Math.min(marqueeStartX, curX),
          maxX: Math.max(marqueeStartX, curX),
          minY: Math.min(marqueeStartY, curY),
          maxY: Math.max(marqueeStartY, curY)
        };
        const previewHits = hitTestEntitiesInMarquee(
          customGeometryRef.current || [],
          camera,
          rect.width,
          rect.height,
          marqueeBox,
          resolveSelectionFilterOpts({ mode: hitMode })
        );
        setSelectionMarquee({ ...marqueeBox, mode: displayMode, previewCount: previewHits.length });
        return;
      }

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

      // Mastercam Analyze Dynamic Interactive Cursor Tracking (Image 4)
      if (isAnalyzeDynamicActiveRef.current && e.target === dom) {
        const rect = dom.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        let hitPoint = null;
        let surfaceNormal = new THREE.Vector3(0, 1, 0);

        const hits = raycaster.intersectObjects(scene.children, true);
        const validHit = hits.find(h => {
          let p = h.object;
          while (p) {
            if (p.name === 'Analyze_Dynamic_Group' || p.name === 'Transform_Manipulator_Group') return false;
            p = p.parent;
          }
          return h.object.type === 'Mesh' || h.object.type === 'Line' || h.object.type === 'LineSegments';
        });

        if (validHit) {
          hitPoint = validHit.point.clone().sub(new THREE.Vector3(0, 49, 0));
          if (validHit.face && validHit.face.normal) {
            surfaceNormal = validHit.face.normal.clone().normalize();
          }
        } else {
          const topY = partMetrics?.box?.max?.y ?? 20;
          const worldY = 49 + topY;
          sketchPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, worldY, 0));
          const target = new THREE.Vector3();
          if (raycaster.ray.intersectPlane(sketchPlane, target)) {
            hitPoint = target.clone().sub(new THREE.Vector3(0, 49, 0));
          }
        }

        if (hitPoint && analyzeDynamicGroupRef.current) {
          const group = analyzeDynamicGroupRef.current;
          group.clear();

          const scale = analyzeDynamicScaleRef.current || 1.0;
          const arrowLen = 28 * scale;

          // 1. Crosshair + at target evaluation point (Image 4)
          const chSize = 3 * scale;
          const chMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, depthTest: false });
          const chGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(hitPoint.x - chSize, hitPoint.y + 0.2, hitPoint.z),
            new THREE.Vector3(hitPoint.x + chSize, hitPoint.y + 0.2, hitPoint.z),
            new THREE.Vector3(hitPoint.x, hitPoint.y + 0.2, hitPoint.z - chSize),
            new THREE.Vector3(hitPoint.x, hitPoint.y + 0.2, hitPoint.z + chSize),
          ]);
          group.add(new THREE.LineSegments(chGeo, chMat));

          // 2. Green normal vector arrow pointing upwards/along normal (Image 4)
          const arrowMat = new THREE.LineBasicMaterial({ color: 0x16a34a, linewidth: 3, depthTest: false });
          const arrowEnd = new THREE.Vector3(hitPoint.x, hitPoint.y + arrowLen, hitPoint.z);
          const arrowGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(hitPoint.x, hitPoint.y + 0.2, hitPoint.z),
            arrowEnd
          ]);
          group.add(new THREE.Line(arrowGeo, arrowMat));

          // Green arrowhead cone
          const coneMat = new THREE.MeshBasicMaterial({ color: 0x16a34a, depthTest: false });
          const coneGeo = new THREE.ConeGeometry(2.4 * scale, 6 * scale, 16);
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.copy(arrowEnd);
          group.add(cone);

          // 3. Yellow dashed line extending beyond the arrow (Image 4)
          const dashEnd = new THREE.Vector3(hitPoint.x, hitPoint.y + arrowLen + 32 * scale, hitPoint.z);
          const dashMat = new THREE.LineDashedMaterial({
            color: 0xca8a04,
            dashSize: 3,
            gapSize: 2,
            linewidth: 2,
            depthTest: false
          });
          const dashGeo = new THREE.BufferGeometry().setFromPoints([arrowEnd, dashEnd]);
          const dashLine = new THREE.Line(dashGeo, dashMat);
          dashLine.computeLineDistances();
          group.add(dashLine);

          setAnalyzeDynamicCursorScreen({ x: e.clientX, y: e.clientY });

          if (onAnalyzeDynamicUpdateRef.current) {
            const angleVal = ((Math.atan2(hitPoint.z, hitPoint.x) * 180 / Math.PI + 360) % 360);
            onAnalyzeDynamicUpdateRef.current({
              point: { x: parseFloat(hitPoint.x.toFixed(3)), y: parseFloat(hitPoint.y.toFixed(3)), z: parseFloat(hitPoint.z.toFixed(3)) },
              tangent: { x: 0.0, y: -1.0, z: 0.0 },
              angle: parseFloat(angleVal.toFixed(1)),
              radius: 'Flat (infinite)',
              diameter: 'Flat (infinite)',
              colorIndex: 1,
              colorR: 0,
              colorG: 0,
              colorB: 128
            });
          }
        }
      } else if (!isAnalyzeDynamicActiveRef.current && analyzeDynamicGroupRef.current?.children?.length > 0) {
        analyzeDynamicGroupRef.current.clear();
        setAnalyzeDynamicCursorScreen(null);
      }

      // Live hover highlight in Solid Face Select or general Select Mode
      if (isSolidFaceSelectActive() && e.target === dom) {
        setFaceCursorScreen({ x: e.clientX, y: e.clientY });
        const now = performance.now();
        if (now - hoverCheckFrameRef.current > 32) {
          hoverCheckFrameRef.current = now;
          const res = raycastSolidFaceAtClient(e.clientX, e.clientY);
          const nextHoverId = res?.hitFace?.id || null;
          if (hoveredFaceIdRef.current !== nextHoverId) {
            hoveredFaceIdRef.current = nextHoverId;
            setHoveredFaceId(nextHoverId);
          }
        }
      } else {
        if (hoveredFaceIdRef.current !== null) {
          hoveredFaceIdRef.current = null;
          setHoveredFaceId(null);
        }
        setFaceCursorScreen((prev) => (prev !== null ? null : prev));
      }

      const inSelectHover = !isSolidFaceSelectActive() && (isSelectModeRef.current || (isSketchModeRef.current && activeSketchToolRef.current === 'select'));
      if (inSelectHover && e.target === dom) {
        const now = performance.now();
        if (now - hoverCheckFrameRef.current > 40) {
          hoverCheckFrameRef.current = now;
          const rect = dom.getBoundingClientRect();
          const picked = hitTestEntityAtScreenPoint(
            customGeometryRef.current || [],
            camera,
            { x: e.clientX - rect.left, y: e.clientY - rect.top },
            rect.width,
            rect.height,
            { worldYOffset: 49, layerVisibility: layerVisibilityRef.current }
          );
          setHoveredEntityId(picked ? getCustomEntityId(picked) : null);
        }
      } else if (!inSelectHover) {
        setHoveredEntityId((prev) => (prev !== null ? null : prev));
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

      if (e.button === 0 && !isBasePointPickActiveRef.current && isSolidFaceSelectActive() && e.target === dom) {
        const clickDist = Math.hypot(e.clientX - pickDownX, e.clientY - pickDownY);
        if (clickDist < 6) {
          const now = performance.now();
          if (now - lastFaceClickTime <= 420 && Math.hypot(e.clientX - lastFaceClickX, e.clientY - lastFaceClickY) <= 10) {
            faceClickStreak = Math.min(3, faceClickStreak + 1);
          } else {
            faceClickStreak = 1;
          }
          lastFaceClickTime = now;
          lastFaceClickX = e.clientX;
          lastFaceClickY = e.clientY;
          const clickCount = Math.max(Number(e.detail) || 1, faceClickStreak);

          const hitRes = raycastSolidFaceAtClient(e.clientX, e.clientY);
          if (hitRes?.hitFace) {
            const { faceIds, modeLabel } = resolveSolidFaceSelectionAction(
              solidFaceCatalogRef.current,
              hitRes.hitFace,
              {
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey || e.metaKey,
                altKey: e.altKey,
                clickCount,
                rayHits: hitRes.hits
              }
            );
            setFaceSelectionModeNote(modeLabel);
            const session = surfaceSelectionSessionRef.current;
            if (session?.active && session.onPickFaces) {
              session.onPickFaces(faceIds, modeLabel, {
                clickCount,
                hasModifier: Boolean(e.shiftKey || e.ctrlKey || e.metaKey || e.altKey),
                role: session.role
              });
            } else {
              const additive = Boolean(e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || stickyMultiSelectRef.current);
              setSelectedSolidFaceIds((prev) => {
                if (clickCount === 1 && !additive && faceIds.length === 1) {
                  return prev.length === 1 && prev[0] === faceIds[0] ? [] : faceIds;
                }
                if (clickCount === 1 && additive && faceIds.length === 1 && !e.shiftKey && !e.altKey) {
                  return prev.includes(faceIds[0]) ? prev.filter((id) => id !== faceIds[0]) : [...prev, faceIds[0]];
                }
                return [...new Set([...prev, ...faceIds])];
              });
            }
          }
          return;
        }
      }

      if (isVectorDrag && vectorStartRef.current) {
        isVectorDrag = false;
        const dragDist = Math.hypot(e.clientX - vectorDownScreenX, e.clientY - vectorDownScreenY);
        if (dragDist >= 6) {
          const rect = dom.getBoundingClientRect();
          const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
          const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
          const p1 = vectorStartRef.current;
          const p2 = { x: curX, y: curY };
          vectorStartRef.current = null;
          setVectorSegment(null);
          const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey || stickyMultiSelectRef.current);
          const hits = hitTestEntitiesByVector(
            customGeometryRef.current || [],
            camera,
            rect.width,
            rect.height,
            p1,
            p2,
            resolveSelectionFilterOpts()
          );
          applyMatchedEntities(hits, isChainingActiveRef.current ? 'chaining' : 'selection', additive);
        }
        return;
      }

      if (isMarqueeDrag) {
        const rect = dom.getBoundingClientRect();
        const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const dragDist = Math.hypot(curX - marqueeStartX, curY - marqueeStartY);
        const entities = customGeometryRef.current || [];
        const target = marqueeTarget;
        const additive = marqueeShiftAdd || !!(e.shiftKey || e.ctrlKey || e.metaKey || stickyMultiSelectRef.current);
        const effMethod = getEffectiveMethod();

        isMarqueeDrag = false;
        marqueeTarget = null;
        setSelectionMarquee(null);

        if (dragDist < 6) {
          const picked = hitTestEntityAtScreenPoint(
            entities,
            camera,
            { x: curX, y: curY },
            rect.width,
            rect.height,
            resolveSelectionFilterOpts()
          );
          if (target === 'chaining') {
            if (picked && onSelectChainEntityRef.current) {
              onSelectChainEntityRef.current(picked);
            }
          } else {
            applyMatchedEntities(picked ? [picked] : [], 'selection', additive, true);
          }
          return;
        }

        const hitMode = effMethod === 'window'
          ? (containmentModeRef.current || 'in_cross')
          : (curX >= marqueeStartX ? 'enclosed' : 'crossing');
        const marqueeBox = {
          minX: Math.min(marqueeStartX, curX),
          maxX: Math.max(marqueeStartX, curX),
          minY: Math.min(marqueeStartY, curY),
          maxY: Math.max(marqueeStartY, curY)
        };
        const matched = hitTestEntitiesInMarquee(
          entities,
          camera,
          rect.width,
          rect.height,
          marqueeBox,
          resolveSelectionFilterOpts({ mode: hitMode })
        );

        applyMatchedEntities(matched, target, additive);
        return;
      }

      if (e.button === 0 && !isBasePointPickActiveRef.current && isSelectionArmed() && !isChainingActiveRef.current) {
        const effMethod = getEffectiveMethod();
        const clickDist = Math.hypot(e.clientX - pickDownX, e.clientY - pickDownY);
        if (clickDist < 6 && (effMethod === 'single' || effMethod === 'chain' || effMethod === 'area')) {
          const rect = dom.getBoundingClientRect();
          const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
          const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
          const additive = !!(e.shiftKey || e.ctrlKey || e.metaKey || stickyMultiSelectRef.current);
          const entities = customGeometryRef.current || [];

          if (effMethod === 'single') {
            const picked = hitTestEntityAtScreenPoint(entities, camera, { x: curX, y: curY }, rect.width, rect.height, resolveSelectionFilterOpts());
            applyMatchedEntities(picked ? [picked] : [], 'selection', additive, true);
            return;
          }
          if (effMethod === 'chain') {
            const chainHits = hitTestChainAtScreenPoint(
              entities,
              camera,
              rect.width,
              rect.height,
              { x: curX, y: curY },
              resolveSelectionFilterOpts({ planeMode: chainingPlaneModeRef.current })
            );
            applyMatchedEntities(chainHits, 'selection', additive);
            return;
          }
          if (effMethod === 'area') {
            const areaHits = hitTestEntitiesByArea(entities, camera, rect.width, rect.height, { x: curX, y: curY }, resolveSelectionFilterOpts());
            applyMatchedEntities(areaHits, 'selection', additive);
            return;
          }
        }
      }

      if ((isChainingActiveRef.current || isBasePointPickActiveRef.current) && e.button === 0 && !isSketchModeRef.current) {
        const clickDist = Math.hypot(e.clientX - pickDownX, e.clientY - pickDownY);
        if (clickDist < 6) {
          if (isBasePointPickActiveRef.current && onPickBasePointRef.current) {
            const snapped = resolveSnappedPoint(e);
            const pt = snapped?.finalPt || getSketchIntersection(e);
            if (pt) onPickBasePointRef.current({ x: pt.x, y: pt.y, z: pt.z });
            return;
          }
          if (isChainingActiveRef.current) {
            const effMethod = getEffectiveMethod();
            const rect = dom.getBoundingClientRect();
            const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
            const entities = customGeometryRef.current || [];
            if (effMethod === 'area') {
              const areaHits = hitTestEntitiesByArea(entities, camera, rect.width, rect.height, { x: curX, y: curY }, resolveSelectionFilterOpts());
              if (areaHits.length > 0 && onWindowSelectChainsRef.current) {
                onWindowSelectChainsRef.current(areaHits, { append: true });
              }
              return;
            }
            if (onSelectChainEntityRef.current) {
              const picked = resolvePickOnWireframe(e);
              if (picked?.entity) {
                onSelectChainEntityRef.current(picked.entity);
              }
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

    const onDoubleClick = (e) => {
      if ((polygonPointsRef.current?.length || 0) >= 3 && getEffectiveMethod() === 'polygon') {
        e.preventDefault();
        // Deduplicate trailing double-click vertex if placed near penultimate
        const pts = polygonPointsRef.current;
        if (pts.length > 3 && Math.hypot(pts[pts.length - 1].x - pts[pts.length - 2].x, pts[pts.length - 1].y - pts[pts.length - 2].y) < 5) {
          polygonPointsRef.current = pts.slice(0, -1);
        }
        completePolygonSelection(!!(e.shiftKey || e.ctrlKey || e.metaKey || stickyMultiSelectRef.current));
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('dblclick', onDoubleClick);
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
      dom.removeEventListener('dblclick', onDoubleClick);
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
      // Check if customGeometry has surfaces or CAD entities to measure dynamically
      const surfs = (customGeometry || []).filter((ent) => {
        if (!ent || ent.visible === false) return false;
        const ct = String(ent.userData?.cadType || ent.userData?.type || '').toLowerCase();
        return ent.name?.startsWith('Surface_') || ent.name?.startsWith('CAD_Surface') || ct === 'surface_extrusion' || ct === 'solid';
      });
      const measureTargets = surfs.length > 0 ? surfs : (customGeometry || []).filter((e) => e && e.visible !== false);
      if (measureTargets.length > 0) {
        const box = new THREE.Box3();
        measureTargets.forEach((s) => {
          const clone = s.clone(true);
          clone.updateMatrixWorld(true);
          box.expandByObject(clone);
        });
        if (!box.isEmpty()) {
          const dims = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const metrics = {
            box,
            bounds: box,
            center: { x: center.x, y: center.y, z: center.z },
            dimensions: { x: dims.x, y: dims.y, z: dims.z },
            triangles: 0
          };
          setInternalPartMetrics(metrics);
          if (onMetricsCalculated) onMetricsCalculated(metrics);
          return;
        }
      }

      const defaultMetrics = {
        center: { x: 0, y: 0, z: 0 },
        dimensions: { x: 100, y: 25, z: 80 },
        box: { min: { x: -50, y: 0, z: -40 }, max: { x: 50, y: 0, z: 40 } },
        triangles: 0
      };
      setInternalPartMetrics(defaultMetrics);
      if (onMetricsCalculated) onMetricsCalculated(defaultMetrics);
      return;
    }

    const clone = currentModel.clone(true);
    holder.add(clone);

    const metrics = calculatePartMetrics(clone);
    setInternalPartMetrics(metrics);
    if (onMetricsCalculated) {
      onMetricsCalculated(metrics);
    }
  }, [currentModel, customGeometry]);

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
        setInternalPartMetrics(metrics);
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

  // 6b. Dynamic Mastercam Transform Manipulator Gizmos (Images 2, 3, 4, 5)
  useEffect(() => {
    if (!transformManipulatorGroupRef.current) return;
    const group = transformManipulatorGroupRef.current;
    group.clear();

    if (!activeTransformTool) return;

    if (activeTransformTool === 'rotate') {
      const rotAngle = ((transformPreviewState?.angle ?? 90.0) * Math.PI) / 180;
      const center = transformPreviewState?.center || { x: 0, y: 0, z: 0 };
      
      const goniometer = new THREE.Group();
      goniometer.position.set(center.x, center.y + 12, center.z);

      // Center sphere (gray)
      const sphereMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3 });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16), sphereMat);
      goniometer.add(sphere);

      // Blue rotation ring
      const ringGeo = new THREE.TorusGeometry(36, 1.2, 16, 64);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      goniometer.add(new THREE.Mesh(ringGeo, ringMat));

      // Vertical direction arrow (blue)
      const arrowMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 3 });
      const arrowLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 42, 0)]),
        arrowMat
      );
      goniometer.add(arrowLine);

      const arrowCone = new THREE.Mesh(
        new THREE.ConeGeometry(3, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0x0284c7 })
      );
      arrowCone.position.set(0, 42, 0);
      goniometer.add(arrowCone);

      // Translucent sweep angle sector (e.g. 90 deg red arc from Image 2)
      if (Math.abs(rotAngle) > 0.001) {
        const sectorGeo = new THREE.RingGeometry(0.1, 36, 32, 1, 0, rotAngle);
        sectorGeo.rotateX(-Math.PI / 2);
        const sectorMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide
        });
        goniometer.add(new THREE.Mesh(sectorGeo, sectorMat));
      }

      group.add(goniometer);
    } else if (activeTransformTool === 'translate') {
      const delta = transformPreviewState?.delta || { x: 0, y: 0, z: 0 };
      const gizmo = new THREE.Group();

      // XYZ Arrows matching Mastercam
      // X Arrow (Red)
      const xLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 10, 0), new THREE.Vector3(50, 10, 0)]),
        new THREE.LineBasicMaterial({ color: 0xdc2626, linewidth: 3 })
      );
      const xCone = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 16), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
      xCone.position.set(50, 10, 0);
      xCone.rotateZ(-Math.PI / 2);
      gizmo.add(xLine, xCone);

      // Y Arrow (Green)
      const yLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 60, 0)]),
        new THREE.LineBasicMaterial({ color: 0x16a34a, linewidth: 3 })
      );
      const yCone = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 16), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
      yCone.position.set(0, 60, 0);
      gizmo.add(yLine, yCone);

      // Z Arrow (Blue)
      const zLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 10, 50)]),
        new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 3 })
      );
      const zCone = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 16), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
      zCone.position.set(0, 10, 50);
      zCone.rotateX(Math.PI / 2);
      gizmo.add(zLine, zCone);

      // Dashed vector connecting origin to translated target
      if (Math.abs(delta.x) > 0.1 || Math.abs(delta.y) > 0.1 || Math.abs(delta.z) > 0.1) {
        const dashedPts = [
          new THREE.Vector3(0, 10, 0),
          new THREE.Vector3(delta.x, 10 + delta.y, delta.z)
        ];
        const dashedGeo = new THREE.BufferGeometry().setFromPoints(dashedPts);
        const dashedMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 4, gapSize: 3 });
        const dashedLine = new THREE.Line(dashedGeo, dashedMat);
        dashedLine.computeLineDistances();
        gizmo.add(dashedLine);
      }

      group.add(gizmo);
    } else if (activeTransformTool === 'offset_chains') {
      const dist = transformPreviewState?.distance || 10.0;
      const dir = transformPreviewState?.direction || 'opposite';
      const offsetSign = dir === 'opposite' ? -1 : 1;
      
      // Render offset contour highlight
      const offsetGroup = new THREE.Group();
      const rectW = 100 + (offsetSign * dist * 2);
      const rectH = 40 + (offsetSign * dist * 2);
      const pts = [
        new THREE.Vector3(-rectW / 2, 11, -rectH / 2),
        new THREE.Vector3(rectW / 2, 11, -rectH / 2),
        new THREE.Vector3(rectW / 2, 11, rectH / 2),
        new THREE.Vector3(-rectW / 2, 11, rectH / 2),
        new THREE.Vector3(-rectW / 2, 11, -rectH / 2)
      ];
      const offsetLineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const offsetMat = new THREE.LineDashedMaterial({ color: 0xeab308, dashSize: 4, gapSize: 3, linewidth: 2 });
      const offsetLines = new THREE.Line(offsetLineGeo, offsetMat);
      offsetLines.computeLineDistances();
      offsetGroup.add(offsetLines);
      group.add(offsetGroup);
    }
  }, [activeTransformTool, transformPreviewState]);

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
    const { sides: allowSides, top: allowTop } = resolveStockAllowances(stockConfig);
    const shape = stockConfig?.shape || 'box';
    const axis = stockConfig?.axis || 'X';
    const partCenter = partMetrics?.box?.getCenter
      ? partMetrics.box.getCenter(new THREE.Vector3())
      : new THREE.Vector3(partMetrics?.center?.x || 0, 0, partMetrics?.center?.z || 0);

    const rawDims = stockConfig?.rawDimensions || stockConfig?.dimensions;
    const userW = Number(rawDims?.x);
    const userH = Number(rawDims?.y);
    const userD = Number(rawDims?.z);

    const partBottomY = (partMetrics?.box?.min?.y != null && Number.isFinite(partMetrics.box.min.y))
      ? partMetrics.box.min.y
      : 0;

    let stockGeo;
    let posY = 49 + partBottomY;

    if (shape === 'cylinder' || shape === 'tube') {
      const dia = stockConfig.diameter || (Math.max(dim.y, dim.z) + allowSides * 2);
      const rad = dia / 2;
      const len = stockConfig.length || (dim.x + allowTop * 2);

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
      const stockW = (Number.isFinite(userW) && userW > 0) ? userW : (dim.x + allowSides * 2);
      const stockH = (Number.isFinite(userH) && userH > 0) ? userH : (dim.y + allowTop);
      const stockD = (Number.isFinite(userD) && userD > 0) ? userD : (dim.z + allowSides * 2);
      stockGeo = new THREE.BoxGeometry(stockW, stockH, stockD);
      posY = 49 + partBottomY + stockH / 2;
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
    stockMesh.position.set(partCenter.x, posY, partCenter.z);
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

  // 9. Build 3D Drafting Dimension Lines & Angle Indicators (Images 1 & 2)
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

    // Mastercam In-Canvas Drafting Dimensions (Image 1 & Image 2)
    // Rendered on top of the workpiece when Drafting is active or Dimensions level is visible
    const topY = (max.y || 20) + 0.35;
    const blueCadMat = new THREE.LineBasicMaterial({ color: 0x1d4ed8, linewidth: 2, depthTest: false });

    // 1. Linear Dimension: 96.16 mm across the top plate
    const p1 = new THREE.Vector3(-30, topY, 26);
    const p2 = new THREE.Vector3(66.16, topY, 26);
    
    // Dimension line
    const dimLineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    group.add(new THREE.Line(dimLineGeo, blueCadMat));

    // Witness / extension lines
    const wit1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-30, topY, 16),
      new THREE.Vector3(-30, topY, 30)
    ]);
    group.add(new THREE.Line(wit1, blueCadMat));

    const wit2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(66.16, topY, 16),
      new THREE.Vector3(66.16, topY, 30)
    ]);
    group.add(new THREE.Line(wit2, blueCadMat));

    // Arrowheads for 96.16 mm (pointing inwards)
    const arrLen = 3.5;
    const arr1Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p1.x + arrLen, topY, p1.z - 1.5),
      p1,
      new THREE.Vector3(p1.x + arrLen, topY, p1.z + 1.5)
    ]);
    group.add(new THREE.Line(arr1Geo, blueCadMat));

    const arr2Geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(p2.x - arrLen, topY, p2.z - 1.5),
      p2,
      new THREE.Vector3(p2.x - arrLen, topY, p2.z + 1.5)
    ]);
    group.add(new THREE.Line(arr2Geo, blueCadMat));

    // Text badge: 96.16 mm
    const linearBadge = createDimensionBadgeSprite('96.16 mm', {
      color: '#1d4ed8',
      bg: 'rgba(255, 255, 255, 0.95)',
      border: '#60a5fa',
      fontSize: 26,
      scale: 14
    });
    linearBadge.position.set((p1.x + p2.x) / 2, topY + 2, p1.z + 3);
    group.add(linearBadge);

    // 2. Angular Dimension: 90.0° curved arc sector (Image 2)
    const arcCenter = new THREE.Vector3(-30, topY, -18);
    const arcRadius = 26;
    const arcPoints = [];
    const numArcPts = 24;
    for (let i = 0; i <= numArcPts; i++) {
      const theta = (i / numArcPts) * (Math.PI / 2);
      arcPoints.push(new THREE.Vector3(
        arcCenter.x + Math.cos(theta) * arcRadius,
        topY,
        arcCenter.z + Math.sin(theta) * arcRadius
      ));
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    group.add(new THREE.Line(arcGeo, blueCadMat));

    // Radial witness lines connecting origin to arc ends
    const rad1 = new THREE.BufferGeometry().setFromPoints([
      arcCenter,
      new THREE.Vector3(arcCenter.x + arcRadius + 6, topY, arcCenter.z)
    ]);
    group.add(new THREE.Line(rad1, blueCadMat));

    const rad2 = new THREE.BufferGeometry().setFromPoints([
      arcCenter,
      new THREE.Vector3(arcCenter.x, topY, arcCenter.z + arcRadius + 6)
    ]);
    group.add(new THREE.Line(rad2, blueCadMat));

    // Arrowheads for 90.0° arc
    const arcArr1End = arcPoints[0];
    const arcArr1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(arcArr1End.x - 2, topY, arcArr1End.z + 3),
      arcArr1End,
      new THREE.Vector3(arcArr1End.x + 2, topY, arcArr1End.z + 3)
    ]);
    group.add(new THREE.Line(arcArr1, blueCadMat));

    const arcArr2End = arcPoints[arcPoints.length - 1];
    const arcArr2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(arcArr2End.x + 3, topY, arcArr2End.z - 2),
      arcArr2End,
      new THREE.Vector3(arcArr2End.x + 3, topY, arcArr2End.z + 2)
    ]);
    group.add(new THREE.Line(arcArr2, blueCadMat));

    // Text badge: 90.0°
    const midAngle = Math.PI / 4;
    const angularBadge = createDimensionBadgeSprite('90.0°', {
      color: '#1d4ed8',
      bg: 'rgba(255, 255, 255, 0.95)',
      border: '#60a5fa',
      fontSize: 26,
      scale: 12
    });
    angularBadge.position.set(
      arcCenter.x + Math.cos(midAngle) * (arcRadius + 5),
      topY + 2,
      arcCenter.z + Math.sin(midAngle) * (arcRadius + 5)
    );
    group.add(angularBadge);

    // 3. Center Datum Crosshair (+)
    const crossCenter = new THREE.Vector3(17.5, topY, 0);
    const crossSize = 4.5;
    const crossGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(crossCenter.x - crossSize, topY, crossCenter.z),
      new THREE.Vector3(crossCenter.x + crossSize, topY, crossCenter.z),
      new THREE.Vector3(crossCenter.x, topY, crossCenter.z - crossSize),
      new THREE.Vector3(crossCenter.x, topY, crossCenter.z + crossSize)
    ]);
    group.add(new THREE.LineSegments(crossGeo, blueCadMat));
  }, [partMetrics, isDraftingActive, layerVisibility.dimensions]);

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
        flowline: 0x10b981,
        rest: 0x14b8a6,
        rest_milling: 0x14b8a6,
        pencil: 0xf97316,
        probe: 0xd946ef
      };

    operations.forEach((op) => {
      const assignedTool = tools.find((t) => t.id === op.toolId) || tools[0] || { diameter: 10 };
      const effectiveModel = buildEffectiveDriveModel(currentModel, customGeometry, op);
      const opBounds = resolveOperationDriveBounds(effectiveModel, op, bounds);
      const toolpathData = generateToolpathForOperation(op, opBounds, assignedTool, effectiveModel, stockConfig);

      if (toolpathData) {
        const keepGeneratorRapids = ['drill', 'spotdrill', 'tap', 'probe'].includes(op.badgeClass);
        let linkedRapidLines = null;
        if (!keepGeneratorRapids && toolpathData.cuttingLines?.length > 0) {
          const { segments } = buildLinkedOperationSegments(toolpathData, op, opBounds, assignedTool);
          linkedRapidLines = segments
            .filter((s) => s.isRapid)
            .map((s) => [s.p1, s.p2]);
        }
        const { cutGeo, rapidGeo } = buildToolpathMeshes(toolpathData, linkedRapidLines);
        // CAD entities sit inside customGeoGroup at Y = 49; align CAD/surface toolpaths to that height
        const usesCadSpace = !!op.chain || !!op.usesCustomSurfaces || !!(op.driveSurfaceIds?.length) || !!(op.driveFaceIds?.length) || op.badgeClass === 'flowline' || !currentModel;
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

  // 11a-1b. Render 3D Selection & Hover Highlights across Selected Shapes, Surfaces & Points
  useEffect(() => {
    const group = selectionHighlightGroupRef.current;
    if (!group) return;
    disposeGroupMeshes(group);

    const selectedSet = new Set(selectedEntityIds || []);
    if (selectedSet.size === 0 && !hoveredEntityId) return;

    const addEntityHighlight = (entity, colorHex, isHoverOnly) => {
      const { points, segments } = sampleEntityWorldGeometry(entity, 0);
      if (segments.length > 0) {
        const linePts = [];
        segments.forEach(([a, b]) => {
          linePts.push(a.x, a.y + 0.18, a.z, b.x, b.y + 0.18, b.z);
        });
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
        const lineMat = new THREE.LineBasicMaterial({
          color: colorHex,
          linewidth: 2,
          transparent: isHoverOnly,
          opacity: isHoverOnly ? 0.85 : 1.0
        });
        group.add(new THREE.LineSegments(lineGeo, lineMat));
      }

      if (!isHoverOnly && points.length > 0) {
        // Endpoint, corner, or center grip markers for crisp Mastercam selection feedback
        const gripPts = [];
        const ud = entity.userData || {};
        if (ud.center) {
          gripPts.push(ud.center.x || 0, (ud.center.y || 0) + 0.22, ud.center.z || 0);
        }
        const stride = points.length > 24 ? Math.max(1, Math.floor(points.length / 8)) : 1;
        for (let i = 0; i < points.length; i += stride) {
          gripPts.push(points[i].x, points[i].y + 0.22, points[i].z);
        }
        const ptGeo = new THREE.BufferGeometry();
        ptGeo.setAttribute('position', new THREE.Float32BufferAttribute(gripPts, 3));
        const ptMat = new THREE.PointsMaterial({ color: 0xfef08a, size: 6, sizeAttenuation: false });
        group.add(new THREE.Points(ptGeo, ptMat));
      }
    };

    (customGeometry || []).forEach((entity) => {
      if (!entity || entity.visible === false) return;
      const eid = getCustomEntityId(entity);
      if (selectedSet.has(eid)) {
        addEntityHighlight(entity, 0xfacc15, false);
      } else if (hoveredEntityId && eid === hoveredEntityId) {
        addEntityHighlight(entity, 0x38bdf8, true);
      }
    });
  }, [selectedEntityIds, hoveredEntityId, customGeometry]);

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

  // 11a-3. Render Mastercam Solid Face Hover / Drive / Check Highlights (Yellow/Lime & Coral)
  useEffect(() => {
    const group = faceHighlightGroupRef.current;
    if (!group) return;
    disposeGroupMeshes(group);

    const driveIds = surfaceSelectionSession?.active
      ? (surfaceSelectionSession.driveFaceIds || [])
      : (flowlinePreview?.active ? (flowlinePreview.driveFaceIds || []) : selectedSolidFaceIds);
    const checkIds = surfaceSelectionSession?.active
      ? (surfaceSelectionSession.checkFaceIds || [])
      : (flowlinePreview?.active ? (flowlinePreview.checkFaceIds || []) : []);

    const driveSet = new Set(driveIds);
    const checkSet = new Set(checkIds);

    const driveFaces = solidFaceCatalog.faces.filter((f) => driveSet.has(f.id));
    const checkFaces = solidFaceCatalog.faces.filter((f) => checkSet.has(f.id));
    const hoverFace =
      hoveredFaceId && !driveSet.has(hoveredFaceId) && !checkSet.has(hoveredFaceId)
        ? solidFaceCatalog.byId.get(hoveredFaceId)
        : null;

    if (driveFaces.length > 0) {
      group.add(
        buildSolidFaceHighlightGroup(driveFaces, {
          fillColor: 0xfacc15,
          edgeColor: 0xeab308,
          opacity: 0.42
        })
      );
    }

    if (checkFaces.length > 0) {
      group.add(
        buildSolidFaceHighlightGroup(checkFaces, {
          fillColor: 0xf97316,
          edgeColor: 0xea580c,
          opacity: 0.40
        })
      );
    }

    if (hoverFace) {
      group.add(
        buildSolidFaceHighlightGroup([hoverFace], {
          fillColor: 0xfef08a,
          edgeColor: 0xa3e635,
          opacity: 0.34
        })
      );
    }
  }, [solidFaceCatalog, surfaceSelectionSession, flowlinePreview, selectedSolidFaceIds, hoveredFaceId]);

  // 11a-4. Render Live 3D Flowline UV Grid & Green Directional Arrows (Flowline Data Preview)
  useEffect(() => {
    const group = flowlinePreviewGroupRef.current;
    if (!group) return;
    disposeGroupMeshes(group);

    if (!flowlinePreview?.active || flowlinePreview.showGrid === false || !Array.isArray(flowlinePreview.driveFaceIds) || flowlinePreview.driveFaceIds.length === 0) {
      return;
    }

    const driveSet = new Set(flowlinePreview.driveFaceIds);
    const driveFaces = solidFaceCatalog.faces.filter((f) => driveSet.has(f.id));
    if (driveFaces.length === 0) return;

    const { gridSegments, edgeSegments, arrows } = buildFlowlinePreviewForFaces(
      driveFaces,
      flowlinePreview.flowlineData || {}
    );

    if (gridSegments.length > 0) {
      const pts = [];
      gridSegments.forEach(([a, b]) => {
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      });
      const gridGeo = new THREE.BufferGeometry();
      gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const gridMat = new THREE.LineBasicMaterial({
        color: isLight ? 0x64748b : 0xe2e8f0,
        transparent: true,
        opacity: 0.9
      });
      group.add(new THREE.LineSegments(gridGeo, gridMat));
    }

    if (edgeSegments.length > 0) {
      const ePts = [];
      edgeSegments.forEach(([a, b]) => {
        ePts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      });
      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ePts, 3));
      group.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xfef08a })));
    }

    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const stemMat = new THREE.LineBasicMaterial({ color: 0x16a34a, linewidth: 2 });
    const upY = new THREE.Vector3(0, 1, 0);

    const addGreenArrow = (origin, dir, len) => {
      if (!dir || dir.lengthSq() < 1e-6) return;
      const d = dir.clone().normalize();
      const tipPos = origin.clone().addScaledVector(d, len);
      const stemGeo = new THREE.BufferGeometry().setFromPoints([origin, tipPos]);
      group.add(new THREE.Line(stemGeo, stemMat));

      const coneGeo = new THREE.ConeGeometry(1.15, 3.2, 10);
      const cone = new THREE.Mesh(coneGeo, arrowMat);
      cone.position.copy(tipPos);
      cone.quaternion.setFromUnitVectors(upY, d);
      group.add(cone);
    };

    arrows.forEach((arr) => {
      const baseOrigin = arr.startPos.clone().addScaledVector(arr.normal, 0.35);
      addGreenArrow(baseOrigin, arr.cutDir, arr.length);
      addGreenArrow(baseOrigin, arr.stepDir, arr.length * 0.72);
    });
  }, [flowlinePreview, solidFaceCatalog, isLight]);

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
      disposeGroupMeshes(backplotVerifyGroupRef.current);
      scene.remove(backplotVerifyGroupRef.current);
      backplotVerifyGroupRef.current = null;
    }

    if (!isBackplotActive || !partMetrics) return;

    // Compile trajectory
    const bounds = partMetrics.box;
    const effectiveOpId = backplotSelectedOpFilter === 'all'
      ? null
      : Number(backplotSelectedOpFilter);

    const trajectory = compileBackplotTrajectory(operations, tools, bounds, currentModel, effectiveOpId, 49, customGeometry, stockConfig);
    waypointsRef.current = trajectory.waypoints;
    lastVerifyProgressRef.current = -1;

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

      const { sides: allowSides, top: allowTop } = resolveStockAllowances(stockConfig);
      const dim = partMetrics.dimensions;
      const sh = dim.y + allowTop;
      const stockYOffset = currentModel ? 0 : 49;

      const stockBounds = new THREE.Box3(
        new THREE.Vector3(bounds.min.x - allowSides, bounds.min.y + stockYOffset, bounds.min.z - allowSides),
        new THREE.Vector3(bounds.max.x + allowSides, bounds.min.y + stockYOffset + sh, bounds.max.z + allowSides)
      );
      const verifyMetrics = stockYOffset
        ? {
            ...partMetrics,
            box: new THREE.Box3(
              new THREE.Vector3(bounds.min.x, bounds.min.y + stockYOffset, bounds.min.z),
              new THREE.Vector3(bounds.max.x, bounds.max.y + stockYOffset, bounds.max.z)
            )
          }
        : partMetrics;

      const activeOpObj = operations.find((op) => effectiveOpId == null || String(op.id) === String(effectiveOpId)) || operations[0] || null;
      const heatmapSource = (currentModel && partHolderGroupRef.current)
        ? partHolderGroupRef.current
        : (() => {
            const drive = buildEffectiveDriveModel(null, customGeometry, activeOpObj);
            if (drive) {
              drive.position.y += 49;
              drive.updateMatrixWorld(true);
            }
            return drive;
          })();

      if (backplotInternalMode === 'heatmap' && heatmapSource) {
        const modelTriangles = extractModelTriangles(heatmapSource, 1500);
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
        const sim = new VoxelStockSimulator(stockBounds, verifyMetrics, { gridResX: 42 });
        sim.simulateToProgress(trajectory.waypoints, 0.0, tools);
        const stockMesh = sim.buildMesh('tool');
        verifyGroup.add(stockMesh);
        viewportSimulatorRef.current = sim;
        lastVerifyProgressRef.current = 0.0;
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
      if (backplotVerifyGroupRef.current) {
        disposeGroupMeshes(backplotVerifyGroupRef.current);
        scene.remove(backplotVerifyGroupRef.current);
      }
    };
  }, [isBackplotActive, activeOpId, backplotSelectedOpFilter, operations, tools, partMetrics, stockConfig, currentModel, customGeometry, backplotInternalMode, heatmapTolerance]);

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
        const currentDepth = sample.currentCncPos
          ? Math.max(0, -sample.currentCncPos.z)
          : (topY - sample.currentPos.y);
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

        // Dynamic material removal carving in verify mode (only rebuild on progress change & dispose previous mesh)
        if (
          backplotInternalMode === 'verify' &&
          viewportSimulatorRef.current &&
          backplotVerifyGroupRef.current &&
          Math.abs(currentP - lastVerifyProgressRef.current) > 0.0005
        ) {
          lastVerifyProgressRef.current = currentP;
          viewportSimulatorRef.current.simulateToProgress(waypointsRef.current, currentP, tools);
          const updatedMesh = viewportSimulatorRef.current.buildMesh('tool');
          disposeGroupMeshes(backplotVerifyGroupRef.current);
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
        const nextP = Math.max(0, backplotProgressRef.current - 0.02);
        backplotProgressRef.current = nextP;
        setBackplotProgress(nextP);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIsBackplotPlaying(false);
        const nextP = Math.min(1, backplotProgressRef.current + 0.02);
        backplotProgressRef.current = nextP;
        setBackplotProgress(nextP);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (onCloseBackplot) onCloseBackplot();
      } else if (e.code === 'Home') {
        e.preventDefault();
        backplotProgressRef.current = 0;
        setBackplotProgress(0);
      }
    };

    window.addEventListener('keydown', handleBackplotKey);
    return () => window.removeEventListener('keydown', handleBackplotKey);
  }, [isBackplotActive, onCloseBackplot]);

  // 15. CAD Window Selection & Sketcher Keyboard Shortcuts
  useEffect(() => {
    const handleCadSelectionAndSketchKeys = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target?.isContentEditable) return;

      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'a') {
        const entities = (customGeometryRef.current || []).filter((ent) => ent && ent.visible !== false);
        if (entities.length > 0 && onChangeSelectedEntitiesRef.current) {
          e.preventDefault();
          onChangeSelectedEntitiesRef.current(entities.map(getCustomEntityId).filter(Boolean));
        }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (key === 'v' && !isBackplotActive) {
        e.preventDefault();
        if (isSketchModeRef.current) {
          const nextTool = activeSketchToolRef.current === 'select' ? 'line' : 'select';
          setActiveSketchTool(nextTool);
          if (onChangeSketchTool) onChangeSketchTool(nextTool);
          if (onToggleSelectModeRef.current) onToggleSelectModeRef.current(nextTool === 'select');
        } else if (onToggleSelectModeRef.current) {
          onToggleSelectModeRef.current(!isSelectModeRef.current);
        }
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedEntityIdsRef.current?.length || 0) > 0) {
        e.preventDefault();
        if (onDeleteSelectedEntitiesRef.current) {
          onDeleteSelectedEntitiesRef.current(selectedEntityIdsRef.current);
        }
        return;
      }

      if (e.key === 'Enter' && (polygonPointsRef.current?.length || 0) >= 3) {
        e.preventDefault();
        completePolygonRef.current?.(stickyMultiSelectRef.current);
        return;
      }

      if (e.key === 'Escape') {
        if ((polygonPointsRef.current?.length || 0) > 0 || vectorStartRef.current) {
          e.preventDefault();
          cancelInteractiveSelectionRef.current?.();
          return;
        }
        if (sketchAnchorRef.current) {
          e.preventDefault();
          sketchAnchorRef.current = null;
          setSketchAnchor(null);
          setDimensionFeedback(null);
          if (sketchGhostGroupRef.current) sketchGhostGroupRef.current.clear();
          return;
        }
        if ((selectedEntityIdsRef.current?.length || 0) > 0 && onChangeSelectedEntitiesRef.current) {
          e.preventDefault();
          onChangeSelectedEntitiesRef.current([]);
          return;
        }
        if (selectedSolidFaceIdsRef.current.length > 0) {
          e.preventDefault();
          setSelectedSolidFaceIds([]);
          setFaceSelectionModeNote('');
          return;
        }
        if (isSelectModeRef.current && onToggleSelectModeRef.current) {
          e.preventDefault();
          onToggleSelectModeRef.current(false);
          return;
        }
        if (isSketchModeRef.current && onToggleSketchMode) {
          e.preventDefault();
          onToggleSketchMode(false);
          return;
        }
      }

      if (!isSketchModeActive) return;

      if (key === 'l') {
        e.preventDefault();
        setActiveSketchTool('line');
        if (onChangeSketchTool) onChangeSketchTool('line');
        if (onToggleSelectModeRef.current) onToggleSelectModeRef.current(false);
      } else if (key === 'r') {
        e.preventDefault();
        setActiveSketchTool('rect');
        if (onChangeSketchTool) onChangeSketchTool('rect');
        if (onToggleSelectModeRef.current) onToggleSelectModeRef.current(false);
      } else if (key === 'c') {
        e.preventDefault();
        setActiveSketchTool('circle');
        if (onChangeSketchTool) onChangeSketchTool('circle');
        if (onToggleSelectModeRef.current) onToggleSelectModeRef.current(false);
      } else if (key === 'p') {
        e.preventDefault();
        setActiveSketchTool('drill');
        if (onChangeSketchTool) onChangeSketchTool('drill');
        if (onToggleSelectModeRef.current) onToggleSelectModeRef.current(false);
      }
    };

    window.addEventListener('keydown', handleCadSelectionAndSketchKeys);
    return () => window.removeEventListener('keydown', handleCadSelectionAndSketchKeys);
  }, [isSketchModeActive, isBackplotActive, onChangeSketchTool, onToggleSketchMode]);

  const selectedEntitiesList = useMemo(() => {
    const idSet = new Set(selectedEntityIds || []);
    return (customGeometry || []).filter((ent) => ent && idSet.has(getCustomEntityId(ent)));
  }, [customGeometry, selectedEntityIds]);

  const selectionSummary = useMemo(
    () => summarizeSelectedEntities(selectedEntitiesList),
    [selectedEntitiesList]
  );

  const isSelectCursorArmed = isSelectModeActive
    || (isSketchModeActive && activeSketchTool === 'select')
    || isChainingActive
    || Boolean(surfaceSelectionSession?.active);

  const showSolidFaceGuideOverlay = Boolean(surfaceSelectionSession?.active)
    || (!isBackplotActive && isSelectModeActive && solidFilterMode === 'solid_face');

  const getFilteredSelectableEntities = (overrideMask = selectionMask) =>
    (customGeometry || []).filter((ent) => {
      if (!ent || !matchesSelectionMask(ent, overrideMask) || !matchesTopologyFilter(ent, solidFilterMode)) {
        return false;
      }
      return true;
    });

  const handleSelectAllMatchingMask = () => {
    if (!onChangeSelectedEntities) return;
    const matchedIds = getFilteredSelectableEntities(selectionMask).map(getCustomEntityId).filter(Boolean);
    onChangeSelectedEntities(matchedIds);
  };

  const handleInvertSelection = () => {
    if (!onChangeSelectedEntities) return;
    const curSet = new Set(selectedEntityIds || []);
    const invertedIds = getFilteredSelectableEntities(selectionMask)
      .map(getCustomEntityId)
      .filter((id) => id && !curSet.has(id));
    onChangeSelectedEntities(invertedIds);
  };

  const handleQuickMaskSelect = (maskId) => {
    if (maskId === 'clear') {
      onChangeSelectionMask?.('all');
      onChangeSelectedEntities?.([]);
      return;
    }
    const nextMask = selectionMask === maskId && maskId !== 'all' ? 'all' : maskId;
    onChangeSelectionMask?.(nextMask);
    if (nextMask !== 'all' && nextMask !== 'colors' && onChangeSelectedEntities) {
      const matchedIds = getFilteredSelectableEntities(nextMask).map(getCustomEntityId).filter(Boolean);
      onChangeSelectedEntities(matchedIds);
    }
  };

  // Active Tool Telemetry Sample for HUD
  const currentSample = useMemo(() => {
    if (!isBackplotActive || waypointsRef.current.length === 0) {
      return {
        pos: new THREE.Vector3(0, 0, 0),
        cncPos: new THREE.Vector3(0, 0, 0),
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
      cncPos: sample.currentCncPos || new THREE.Vector3(sample.currentPos.x, -sample.currentPos.z, sample.currentPos.y),
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
      <div
        ref={mountRef}
        className="canvas-container"
        style={{ cursor: isSelectCursorArmed ? 'crosshair' : 'default' }}
      />

      {/* Window / Containment Marquee Overlay */}
      {selectionMarquee && (
        <div
          data-testid="selection-marquee"
          style={{
            position: 'absolute',
            left: `${selectionMarquee.minX}px`,
            top: `${selectionMarquee.minY}px`,
            width: `${Math.max(2, selectionMarquee.maxX - selectionMarquee.minX)}px`,
            height: `${Math.max(2, selectionMarquee.maxY - selectionMarquee.minY)}px`,
            border: (selectionMarquee.mode === 'window' || selectionMarquee.mode === 'inside')
              ? '1.5px solid #0284c7'
              : selectionMarquee.mode === 'outside'
                ? '1.5px dashed #e11d48'
                : '1.5px dashed #10b981',
            backgroundColor: (selectionMarquee.mode === 'window' || selectionMarquee.mode === 'inside')
              ? 'rgba(2, 132, 199, 0.14)'
              : selectionMarquee.mode === 'outside'
                ? 'rgba(225, 29, 72, 0.10)'
                : 'rgba(16, 185, 129, 0.14)',
            pointerEvents: 'none',
            zIndex: 80
          }}
        >
          {(selectionMarquee.maxX - selectionMarquee.minX > 18 || selectionMarquee.maxY - selectionMarquee.minY > 18) && (
            <span
              style={{
                position: 'absolute',
                top: '-20px',
                left: '0px',
                background: (selectionMarquee.mode === 'window' || selectionMarquee.mode === 'inside')
                  ? '#0284c7'
                  : selectionMarquee.mode === 'outside'
                    ? '#e11d48'
                    : '#059669',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              {(selectionMarquee.mode === 'window' || selectionMarquee.mode === 'inside')
                ? 'Window (Inside)'
                : selectionMarquee.mode === 'outside'
                  ? 'Window (Outside)'
                  : selectionMarquee.mode === 'in_cross'
                    ? 'Window (In + Crossing)'
                    : 'Crossing (Touch)'} &bull; {selectionMarquee.previewCount}
            </span>
          )}
        </div>
      )}

      {/* Polygon & Vector Selection Interactive SVG Overlay */}
      {(polygonPoints.length > 0 || vectorSegment) && (
        <svg
          data-testid="interactive-selection-svg"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 79
          }}
        >
          {polygonPoints.length > 0 && (
            <>
              <polygon
                points={[
                  ...polygonPoints,
                  ...(polygonCursorPt ? [polygonCursorPt] : [])
                ].map((p) => `${p.x},${p.y}`).join(' ')}
                fill="rgba(2, 132, 199, 0.14)"
                stroke="#0284c7"
                strokeWidth="1.6"
                strokeDasharray="5 3"
              />
              {polygonPoints.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={pt.x}
                  cy={pt.y}
                  r={idx === 0 && polygonPoints.length >= 3 ? 5.5 : 3.5}
                  fill={idx === 0 && polygonPoints.length >= 3 ? '#10b981' : '#ffffff'}
                  stroke="#0284c7"
                  strokeWidth="1.6"
                />
              ))}
            </>
          )}
          {vectorSegment && (
            <>
              <line
                x1={vectorSegment.p1.x}
                y1={vectorSegment.p1.y}
                x2={vectorSegment.p2.x}
                y2={vectorSegment.p2.y}
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
              <circle cx={vectorSegment.p1.x} cy={vectorSegment.p1.y} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx={vectorSegment.p2.x} cy={vectorSegment.p2.y} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
            </>
          )}
        </svg>
      )}

      {/* Unified Mastercam Floating AutoCursor & Selection Methods Pill */}
      {!isBackplotActive && (
        <AutoCursorBar
          snapMode={propSnapMode}
          onSelectSnapMode={(mode) => {
            onChangeSnapMode?.(mode);
            objectSnapRef.current = mode !== 'none';
          }}
          isLocked={isAutoCursorLocked}
          onToggleLock={onToggleAutoCursorLock}
          onFastPointSubmit={onFastPointSubmit}
          selectionMethod={isChainingActive ? chainingSelectionMethod : canvasSelectionMethod}
          onChangeSelectionMethod={(method) => onChangeCanvasSelectionMethod?.(method)}
          containmentMode={containmentMode}
          onChangeContainmentMode={(mode) => onChangeContainmentMode?.(mode)}
          solidFilterMode={solidFilterMode}
          onChangeSolidFilterMode={(mode) => {
            onChangeSolidFilterMode?.(mode);
            if (mode !== 'solid_face') {
              setSelectedSolidFaceIds([]);
              setFaceSelectionModeNote('');
            }
          }}
          isSelectModeActive={isSelectCursorArmed}
          onToggleSelectMode={(nextVal) => {
            if (isSketchModeActive) {
              const nextTool = nextVal ? 'select' : 'line';
              setActiveSketchTool(nextTool);
              onChangeSketchTool?.(nextTool);
            }
            onToggleSelectMode?.(nextVal);
          }}
          stickyMultiSelect={stickyMultiSelect}
          onToggleStickyMultiSelect={onToggleStickyMultiSelect}
          selectedCount={solidFilterMode === 'solid_face' && selectedSolidFaceIds.length > 0 ? selectedSolidFaceIds.length : selectionSummary.count}
          polygonPointCount={polygonPoints.length}
          onCompletePolygon={() => completePolygonRef.current?.(stickyMultiSelectRef.current)}
          onCancelInteractiveSelection={() => cancelInteractiveSelectionRef.current?.()}
          onSelectAll={handleSelectAllMatchingMask}
          onReselectPrevious={onReselectPrevious}
          onInvertSelection={handleInvertSelection}
          onClearSelection={() => {
            onChangeSelectedEntities?.([]);
            setSelectedSolidFaceIds([]);
            setFaceSelectionModeNote('');
          }}
          onExtrudeSelection={onRequestExtrudeSelection ? () => onRequestExtrudeSelection(selectedEntitiesList) : null}
          onTransformSelection={onRequestTransformSelection ? () => onRequestTransformSelection(selectedEntitiesList) : null}
          onBlankSelection={onBlankSelectedEntities ? () => onBlankSelectedEntities(selectedEntityIds) : null}
          onDeleteSelection={onDeleteSelectedEntities ? () => onDeleteSelectedEntities(selectedEntityIds) : null}
          theme={theme}
        />
      )}

      {/* Mastercam Top-Left "Select Solid Face or Surface:" Shortcut Legend (Image 1) */}
      {showSolidFaceGuideOverlay && (
        <div
          data-testid="solid-face-selection-guide"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: 95,
            background: '#ffffff',
            border: '1px solid #64748b',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.14)',
            padding: '6px 9px',
            fontSize: '11.5px',
            lineHeight: 1.38,
            color: '#0f172a',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            pointerEvents: 'none',
            maxWidth: '285px'
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: '2px' }}>Select Solid Face or Surface:</div>
          <div>- [Shift+click] to select tangent faces.</div>
          <div>- [Alt+click] to vector select.</div>
          <div>- [Ctrl+click] to select matching fillets/holes.</div>
          <div>- [Ctrl+Shift+click] to select similar faces.</div>
          <div>- Double-click to select a feature.</div>
          <div>- [Ctrl+Shift+double-click] to select similar features.</div>
          <div>- Triple-click to select the solid body.</div>
          {faceSelectionModeNote && (
            <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px solid #e2e8f0', color: '#0369a1', fontWeight: 600, fontSize: '10.5px' }}>
              Active: {faceSelectionModeNote}
            </div>
          )}
        </div>
      )}

      {/* Mastercam Center-Top "End Selection" & "Clear Selection" Floating Pills (Image 1) */}
      {surfaceSelectionSession?.active && (
        <div
          data-testid="surface-selection-pills"
          style={{
            position: 'absolute',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 96,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto'
          }}
        >
          <button
            type="button"
            data-testid="end-surface-selection-btn"
            onClick={() => surfaceSelectionSession.onEndSelection?.()}
            style={{
              height: '28px',
              padding: '0 14px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid #cbd5e1',
              boxShadow: '0 3px 10px rgba(15, 23, 42, 0.16)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#0f172a',
              cursor: 'pointer'
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: '#16a34a',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700
              }}
            >
              ✓
            </span>
            <span>End Selection</span>
          </button>

          <button
            type="button"
            data-testid="clear-surface-selection-btn"
            onClick={() => {
              surfaceSelectionSession.onClearSelection?.();
              setFaceSelectionModeNote('');
            }}
            style={{
              height: '28px',
              padding: '0 14px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid #cbd5e1',
              boxShadow: '0 3px 10px rgba(15, 23, 42, 0.16)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#0f172a',
              cursor: 'pointer'
            }}
          >
            <span
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: '#dc2626',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700
              }}
            >
              ⊘
            </span>
            <span>Clear Selection</span>
          </button>
        </div>
      )}

      {/* 1. Mastercam Floating Drafting Prompt (Image 1) */}
      {isDraftingActive && (
        <div
          data-testid="drafting-viewport-prompt"
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.14)',
            padding: '3px 14px',
            borderRadius: '2px',
            fontSize: '11.5px',
            fontWeight: 500,
            color: '#0f172a',
            pointerEvents: 'none',
            zIndex: 40,
            whiteSpace: 'nowrap'
          }}
        >
          Modify current dimension or begin creating a new dimension
        </div>
      )}

      {/* 2. Mastercam Solid Extrude Selection Prompt (Image 3) */}
      {isChainingActive && (
        <div
          data-testid="solid-extrude-viewport-prompt"
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.14)',
            padding: '3px 14px',
            borderRadius: '2px',
            fontSize: '11.5px',
            fontWeight: 500,
            color: '#0f172a',
            pointerEvents: 'none',
            zIndex: 40,
            whiteSpace: 'nowrap'
          }}
        >
          Use dialog to select chains to extrude
        </div>
      )}

      {/* 3. Mastercam Analyze Dynamic Interactive Cursor Tooltip (Image 4) */}
      {isAnalyzeDynamicActive && analyzeDynamicCursorScreen && (
        <div
          data-testid="analyze-dynamic-cursor-tooltip"
          style={{
            position: 'fixed',
            left: analyzeDynamicCursorScreen.x + 18,
            top: analyzeDynamicCursorScreen.y - 24,
            background: 'rgba(255, 255, 255, 0.96)',
            border: '1px solid #94a3b8',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)',
            padding: '2px 8px',
            borderRadius: '2px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#0f172a',
            pointerEvents: 'none',
            zIndex: 9999,
            whiteSpace: 'nowrap'
          }}
        >
          Position arrow and click to accept
        </div>
      )}

      {/* Mastercam Square Pick Cursor Box when hovering a solid face */}
      {showSolidFaceGuideOverlay && hoveredFaceId && faceCursorScreen && (
        <div
          style={{
            position: 'fixed',
            left: faceCursorScreen.x + 10,
            top: faceCursorScreen.y + 10,
            width: '10px',
            height: '10px',
            background: '#ffffff',
            border: '1.5px solid #1e293b',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      )}

      {/* Docked Vertical QuickMask Bar (Right Edge of Viewport matching Image 2) */}
      {!isBackplotActive && (
        <QuickMaskBar
          activeMask={selectionMask}
          onSelectMask={handleQuickMaskSelect}
          theme={theme}
          scaleValue={(() => {
            const factor = camDist / 350;
            if (unitSystem === 'imperial') {
              const v = 0.6671 * factor;
              return v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3);
            }
            const v = 16.94 * factor;
            return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
          })()}
          scaleUnit={unitSystem === 'imperial' ? 'in' : 'mm'}
          onAddEntity={() => {
            if (onToggleSketchMode) onToggleSketchMode(true);
            if (onChangeSketchTool) onChangeSketchTool('line');
          }}
          onAttributes={onOpenSelectAllModal}
          onDeleteEntity={() => {
            if (onDeleteSelectedEntities && selectedEntityIds?.length > 0) {
              onDeleteSelectedEntities(selectedEntityIds);
            }
          }}
          onDeselectAll={() => {
            onChangeSelectionMask?.('all');
            onChangeSelectedEntities?.([]);
            setSelectedSolidFaceIds([]);
          }}
          onZoomExtents={() => applyCameraPreset('fit')}
          onOpenColorMask={onOpenSelectAllModal}
          onSwitchToLevels={onSwitchToLevels}
          onSwitchToPlanes={onSwitchToPlanes}
          onOpenGroups={onOpenGroups}
        />
      )}

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

            {/* Live Tool Telemetry Readout (G54 CNC Coordinates) */}
            <div
              title="G54 CNC Coordinates (X, Y, Z)"
              style={{
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
              }}
            >
              <span>X: <strong style={{ color: '#0f5a9e' }}>{currentSample.cncPos.x.toFixed(2)}</strong></span>
              <span>Y: <strong style={{ color: '#10b981' }}>{currentSample.cncPos.y.toFixed(2)}</strong></span>
              <span>Z: <strong style={{ color: '#d97706' }}>{currentSample.cncPos.z.toFixed(2)}</strong></span>
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

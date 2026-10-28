import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  X, Play, Pause, RotateCcw, Copy, Download, Check, Sparkles,
  Sliders, Gauge, ShieldCheck, Box, RefreshCw, Compass, ArrowRight,
  Disc, Layers, Eye, Zap, Info, FileCode
} from 'lucide-react';
import {
  LATHE_TOOLS,
  LATHE_SAMPLE_PROFILES,
  DEFAULT_LATHE_SETUP,
  generateTurningToolpath,
  generateLatheGCode,
  calculateLathePhysics,
  build3DLatheScene
} from '../utils/latheEngine.js';

export default function LatheStudioModal({
  isOpen,
  onClose,
  onAddOperation = null
}) {
  const dialogRef = useRef(null);
  const mountRef = useRef(null);

  // Configuration State
  const [setupConfig, setSetupConfig] = useState(DEFAULT_LATHE_SETUP);
  const [selectedToolKey, setSelectedToolKey] = useState('CNMG_120408');
  const [activeTab, setActiveTab] = useState('gcode'); // 'gcode' | 'physics' | 'profile'
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Animation & Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [simProgress, setSimProgress] = useState(0.0);
  const [simSpeed, setSimSpeed] = useState(1.0);

  // Three.js Scene References
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const latheGroupRef = useRef(null);
  const toolMeshRef = useRef(null);
  const toolpathGroupRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Active Profile & Tool Data
  const activeProfile = useMemo(() => {
    return LATHE_SAMPLE_PROFILES[setupConfig.partProfileId] || LATHE_SAMPLE_PROFILES.STEPPED_SHAFT;
  }, [setupConfig.partProfileId]);

  const activeTool = useMemo(() => {
    return LATHE_TOOLS[selectedToolKey] || LATHE_TOOLS.CNMG_120408;
  }, [selectedToolKey]);

  // Compute Toolpaths
  const toolpathData = useMemo(() => {
    return generateTurningToolpath(setupConfig);
  }, [setupConfig]);

  // Compute G-Code Output
  const gcodeOutput = useMemo(() => {
    return generateLatheGCode(setupConfig, activeTool);
  }, [setupConfig, activeTool]);

  // Compute Physics & Cycle Time
  const physicsData = useMemo(() => {
    return calculateLathePhysics(setupConfig, activeTool);
  }, [setupConfig, activeTool]);

  // Modal Lifecycle & Backdrop Handling
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
      setIsPlaying(false);
    }

    const handleBackdrop = (e) => {
      if (e.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inBox =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inBox) onClose();
    };

    dialog.addEventListener('click', handleBackdrop);
    return () => dialog.removeEventListener('click', handleBackdrop);
  }, [isOpen, onClose]);

  // Three.js Scene Initialization
  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
    camera.position.set(130, 90, 140);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, -50);
    controlsRef.current = controls;

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambLight);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dir1.position.set(100, 120, 100);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0x38bdf8, 0.45);
    dir2.position.set(-100, 50, -100);
    scene.add(dir2);

    // Lathe Bed Slant Rails Reference
    const bedGeo = new THREE.BoxGeometry(160, 12, 320);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x1e2433, metalness: 0.8, roughness: 0.4 });
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.position.set(0, -60, -60);
    scene.add(bedMesh);

    // Dynamic Render Loop
    const animate = (time) => {
      controls.update();

      // Tool animation progression
      if (isPlaying && toolpathData.waypoints.length > 0) {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const advance = (dt * simSpeed * 0.15) / Math.max(1, toolpathData.totalDistanceMm / 100);
        setSimProgress((prev) => {
          const next = prev + advance;
          if (next >= 1.0) {
            setIsPlaying(false);
            return 1.0;
          }
          return next;
        });
      } else {
        lastTimeRef.current = null;
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isOpen]);

  // Update 3D Lathe Mesh and Toolpaths
  useEffect(() => {
    if (!sceneRef.current || !isOpen) return;
    const scene = sceneRef.current;

    // 1. Remove previous assemblies
    if (latheGroupRef.current) scene.remove(latheGroupRef.current);
    if (toolpathGroupRef.current) scene.remove(toolpathGroupRef.current);
    if (toolMeshRef.current) scene.remove(toolMeshRef.current);

    // 2. Build Part & Chuck Assembly
    const latheAssembly = build3DLatheScene(setupConfig);
    scene.add(latheAssembly);
    latheGroupRef.current = latheAssembly;

    // 3. Build 3D Toolpath Traces
    const tpGroup = new THREE.Group();

    // Cutting Lines (Vivid Cyan)
    if (toolpathData.cuttingLines.length > 0) {
      const cutPoints = [];
      toolpathData.cuttingLines.forEach(([p1, p2]) => {
        cutPoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      });
      const cutGeo = new THREE.BufferGeometry();
      cutGeo.setAttribute('position', new THREE.Float32BufferAttribute(cutPoints, 3));
      const cutMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
      tpGroup.add(new THREE.LineSegments(cutGeo, cutMat));
    }

    // Rapid Lines (Dashed Gold)
    if (toolpathData.rapidLines.length > 0) {
      const rapidPoints = [];
      toolpathData.rapidLines.forEach(([p1, p2]) => {
        rapidPoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      });
      const rapidGeo = new THREE.BufferGeometry();
      rapidGeo.setAttribute('position', new THREE.Float32BufferAttribute(rapidPoints, 3));
      const rapidMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.65 });
      tpGroup.add(new THREE.LineSegments(rapidGeo, rapidMat));
    }

    // Thread Lines (Emerald)
    if (toolpathData.threadLines && toolpathData.threadLines.length > 0) {
      const tPoints = [];
      toolpathData.threadLines.forEach(([p1, p2]) => {
        tPoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      });
      const tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute('position', new THREE.Float32BufferAttribute(tPoints, 3));
      const tMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
      tpGroup.add(new THREE.LineSegments(tGeo, tMat));
    }

    scene.add(tpGroup);
    toolpathGroupRef.current = tpGroup;

    // 4. Create 3D Turning Tool Assembly (Square Shank + Carbide Insert)
    const toolGroup = new THREE.Group();
    const shankGeo = new THREE.BoxGeometry(25, 25, 75);
    const shankMat = new THREE.MeshStandardMaterial({ color: 0x222630, metalness: 0.9, roughness: 0.3 });
    const shank = new THREE.Mesh(shankGeo, shankMat);
    shank.position.set(12.5 + 8, 0, -37.5);
    toolGroup.add(shank);

    // Rhombic Diamond Insert (Gold TiN / Blue AlTiN)
    const insertGeo = new THREE.CylinderGeometry(8, 8, 4.5, 4); // 4-sided diamond approximation
    const insertMat = new THREE.MeshStandardMaterial({
      color: activeTool.insertColor || 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2
    });
    const insert = new THREE.Mesh(insertGeo, insertMat);
    insert.rotation.z = Math.PI / 4;
    insert.position.set(6, 0, 0);
    toolGroup.add(insert);

    // Initial position at first waypoint or safe start
    const startWp = toolpathData.waypoints[0] || { pos: new THREE.Vector3(setupConfig.rawStockOD / 2 + 10, 0, 10) };
    toolGroup.position.copy(startWp.pos);

    scene.add(toolGroup);
    toolMeshRef.current = toolGroup;

  }, [isOpen, setupConfig, toolpathData, activeTool]);

  // Update animated cutter position along trajectory
  useEffect(() => {
    if (!toolMeshRef.current || toolpathData.waypoints.length === 0) return;
    const waypoints = toolpathData.waypoints;
    const totalWp = waypoints.length;
    const currentIdx = Math.min(totalWp - 1, Math.floor(simProgress * (totalWp - 1)));
    const targetWp = waypoints[currentIdx];

    if (targetWp) {
      toolMeshRef.current.position.copy(targetWp.pos);
    }
  }, [simProgress, toolpathData]);

  // Handlers
  const handleSelectSamplePart = (profileKey) => {
    const prof = LATHE_SAMPLE_PROFILES[profileKey];
    if (!prof) return;
    setSetupConfig((prev) => ({
      ...prev,
      partProfileId: profileKey,
      rawStockOD: prof.rawStockOD,
      rawStockLength: prof.rawStockLength
    }));
    setSimProgress(0);
    setIsPlaying(false);
    setFeedback(`Loaded ${prof.name}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleCopyGCode = () => {
    navigator.clipboard.writeText(gcodeOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadNC = () => {
    const blob = new Blob([gcodeOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `O0024_${setupConfig.partProfileId}_Turning_Job.nc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback('Downloaded CNC Lathe .NC File');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleApplyToOperations = () => {
    if (onAddOperation) {
      onAddOperation({
        id: Date.now(),
        name: `Lathe OD Turn (${activeProfile.name})`,
        strategy: 'lathe_turning',
        badgeClass: 'turning',
        toolId: 1,
        feedRate: Math.round(physicsData.rpmAtMaxOD * setupConfig.feedRatePerRev),
        spindleRpm: physicsData.rpmAtMaxOD,
        stepdown: setupConfig.roughingDepthOfCut,
        totalDepth: Math.abs(setupConfig.rawStockLength),
        visible: true
      });
    }
    setFeedback('Turning Operation added to CAM Tree');
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1200);
  };

  const currentWp = useMemo(() => {
    const waypoints = toolpathData.waypoints;
    if (waypoints.length === 0) return { xDia: 0, zLen: 0, code: 'G00' };
    const currentIdx = Math.min(waypoints.length - 1, Math.floor(simProgress * (waypoints.length - 1)));
    return waypoints[currentIdx] || { xDia: 0, zLen: 0, code: 'G00' };
  }, [simProgress, toolpathData]);

  return (
    <dialog
      ref={dialogRef}
      style={{
        width: '95vw',
        maxWidth: '1440px',
        height: '92vh',
        background: '#10141d',
        color: '#f1f5f9',
        border: '1px solid #283347',
        borderRadius: '12px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(56, 189, 248, 0.25)',
        padding: 0,
        margin: 'auto',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: 'linear-gradient(90deg, #141926 0%, #1a2235 100%)',
            borderBottom: '1px solid #283347'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.35)'
              }}
            >
              <Disc size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  CNC TURNING &amp; LATHE / MILL-TURN STUDIO
                </h3>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  2-Axis Turning Center &bull; Canned Cycles G71/G70/G76/G75
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Cycle Time: {physicsData.cycleTimeFormatted}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                OD Roughing, Profile Finishing, Single-Point Threading, Deep Grooving &amp; Constant Surface Speed (G96)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDownloadNC}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} /> Export .NC Program
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            style={{
              padding: '6px 16px',
              background: '#0284c7',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={14} /> {feedback}
          </div>
        )}

        {/* Main Workspace Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left Parameter Panel */}
          <div
            style={{
              background: '#131822',
              borderRight: '1px solid #242d3d',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '16px',
              gap: '16px'
            }}
          >
            {/* 1. Sample Part Selector */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                1. Select Turned Workpiece Profile
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.values(LATHE_SAMPLE_PROFILES).map((prof) => {
                  const isSelected = setupConfig.partProfileId === prof.id;
                  return (
                    <div
                      key={prof.id}
                      onClick={() => handleSelectSamplePart(prof.id)}
                      style={{
                        padding: '10px 12px',
                        background: isSelected ? 'rgba(56, 189, 248, 0.12)' : '#1a2230',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid #283344',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f1f5f9' }}>
                          {prof.name}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{prof.material}</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                        Stock: Ø{prof.rawStockOD}mm &times; {prof.rawStockLength}mm &bull; {prof.profile.length} Contours
                        {prof.threads.length > 0 && ' • Threading'}
                        {prof.grooves.length > 0 && ' • Grooving'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Stock Billet Dimensions */}
            <div style={{ background: '#1a2230', border: '1px solid #283344', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '10px' }}>
                2. Raw Stock Workpiece Billet
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                <div>
                  <label style={{ color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Outer Diameter (OD):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={setupConfig.rawStockOD}
                      onChange={(e) => setSetupConfig({ ...setupConfig, rawStockOD: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        background: '#10141d',
                        border: '1px solid #334155',
                        color: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Stock Length:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={setupConfig.rawStockLength}
                      onChange={(e) => setSetupConfig({ ...setupConfig, rawStockLength: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        background: '#10141d',
                        border: '1px solid #334155',
                        color: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Face Allowance (Z+):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step={0.5}
                      value={setupConfig.stockFacingAllowance}
                      onChange={(e) => setSetupConfig({ ...setupConfig, stockFacingAllowance: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        background: '#10141d',
                        border: '1px solid #334155',
                        color: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </div>

                <div>
                  <label style={{ color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Chuck Grip Z:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={setupConfig.chuckClampingZ}
                      onChange={(e) => setSetupConfig({ ...setupConfig, chuckClampingZ: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        background: '#10141d',
                        border: '1px solid #334155',
                        color: '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                    <span style={{ color: '#64748b' }}>mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Tool Selection */}
            <div style={{ background: '#1a2230', border: '1px solid #283344', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px' }}>
                3. Active Turning Tool &amp; Insert
              </div>
              <select
                value={selectedToolKey}
                onChange={(e) => setSelectedToolKey(e.target.value)}
                style={{
                  width: '100%',
                  background: '#10141d',
                  border: '1px solid #334155',
                  color: '#f1f5f9',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}
              >
                {Object.values(LATHE_TOOLS).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div style={{ background: '#10141d', padding: '8px', borderRadius: '4px', fontSize: '10.5px' }}>
                <div style={{ color: '#94a3b8' }}>
                  ISO Holder: <strong style={{ color: '#f1f5f9' }}>{activeTool.isoCode}</strong>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', color: '#64748b' }}>
                  <span>Nose Radius: <strong>{activeTool.noseRadius}mm</strong></span>
                  <span>Shank: <strong>{activeTool.shankSize}x{activeTool.shankSize}mm</strong></span>
                  <span>Coating: <strong>{activeTool.coating}</strong></span>
                </div>
              </div>
            </div>

            {/* 4. Speeds, Feeds & Depth of Cut */}
            <div style={{ background: '#1a2230', border: '1px solid #283344', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>
                4. Canned Cycle Parameters
              </div>

              {/* Surface Speed Slider */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: '#cbd5e1' }}>Constant Surface Speed (Vc):</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{setupConfig.surfaceSpeedVc} m/min</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={400}
                  step={10}
                  value={setupConfig.surfaceSpeedVc}
                  onChange={(e) => setSetupConfig({ ...setupConfig, surfaceSpeedVc: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              {/* Feed Per Rev Slider */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: '#cbd5e1' }}>Feed Rate Per Revolution (fn):</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{setupConfig.feedRatePerRev} mm/rev</span>
                </div>
                <input
                  type="range"
                  min={0.08}
                  max={0.45}
                  step={0.02}
                  value={setupConfig.feedRatePerRev}
                  onChange={(e) => setSetupConfig({ ...setupConfig, feedRatePerRev: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>

              {/* Depth of Cut (ap) Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: '#cbd5e1' }}>Roughing Depth of Cut (ap):</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{setupConfig.roughingDepthOfCut} mm</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={4.0}
                  step={0.25}
                  value={setupConfig.roughingDepthOfCut}
                  onChange={(e) => setSetupConfig({ ...setupConfig, roughingDepthOfCut: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#64748b' }}>
                  <span>0.5 mm (Light)</span>
                  <span>{toolpathData.roughingPasses} Roughing Passes</span>
                  <span>4.0 mm (Heavy)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Viewport & Diagnostics */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Upper 3D Lathe Canvas */}
            <div style={{ flex: 1, position: 'relative', minHeight: '360px' }}>
              <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

              {/* Live Lathe Coordinate Readout HUD */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  display: 'flex',
                  gap: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>MODE: </span>
                  <strong style={{ color: '#38bdf8' }}>{currentWp.code || 'G01'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>X (DIA): </span>
                  <strong style={{ color: '#10b981' }}>Ø{currentWp.xDia?.toFixed(2) || '0.00'} mm</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Z (LEN): </span>
                  <strong style={{ color: '#f59e0b' }}>Z{currentWp.zLen?.toFixed(2) || '0.00'} mm</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>SPEED: </span>
                  <strong style={{ color: '#a855f7' }}>{physicsData.rpmAtMaxOD} RPM</strong>
                </div>
              </div>

              {/* Viewport Playback Scrubber HUD */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: isPlaying ? '#ef4444' : '#10b981',
                    border: 'none',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={isPlaying ? 'Pause Simulation' : 'Run Lathe Backplot'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button
                  onClick={() => {
                    setSimProgress(0);
                    setIsPlaying(false);
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    padding: '6px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  title="Rewind to Start"
                >
                  <RotateCcw size={16} />
                </button>

                {/* Progress bar */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.002}
                    value={simProgress}
                    onChange={(e) => {
                      setSimProgress(Number(e.target.value));
                      setIsPlaying(false);
                    }}
                    style={{ flex: 1, accentColor: '#38bdf8' }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '40px' }}>
                    {Math.round(simProgress * 100)}%
                  </span>
                </div>

                {/* Speed Multiplier */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1.0, 2.5, 5.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSimSpeed(s)}
                      style={{
                        padding: '3px 8px',
                        background: simSpeed === s ? '#2563eb' : '#1e293b',
                        border: '1px solid #334155',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lower Diagnostics & G-Code Output Tabs */}
            <div
              style={{
                height: '240px',
                background: '#12161f',
                borderTop: '1px solid #283347',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Tab Header */}
              <div
                style={{
                  display: 'flex',
                  borderBottom: '1px solid #283347',
                  background: '#0e121a',
                  padding: '0 16px',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex' }}>
                  <button
                    onClick={() => setActiveTab('gcode')}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'gcode' ? '2px solid #38bdf8' : '2px solid transparent',
                      color: activeTab === 'gcode' ? '#38bdf8' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Lathe G-Code Output (ISO G71/G70/G76)
                  </button>
                  <button
                    onClick={() => setActiveTab('physics')}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'physics' ? '2px solid #38bdf8' : '2px solid transparent',
                      color: activeTab === 'physics' ? '#38bdf8' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cutting Dynamics &amp; Spindle Load
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'profile' ? '2px solid #38bdf8' : '2px solid transparent',
                      color: activeTab === 'profile' ? '#38bdf8' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Diametral Profile Geometry ({activeProfile.profile.length} Steps)
                  </button>
                </div>

                {activeTab === 'gcode' && (
                  <button
                    onClick={handleCopyGCode}
                    style={{
                      background: 'transparent',
                      border: '1px solid #334155',
                      color: copied ? '#10b981' : '#cbd5e1',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                {activeTab === 'gcode' && (
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'Consolas, monospace',
                      fontSize: '11.5px',
                      lineHeight: '1.5',
                      color: '#a5f3fc',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {gcodeOutput}
                  </pre>
                )}

                {activeTab === 'physics' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', fontSize: '11px' }}>
                    <div style={{ background: '#1a2230', padding: '10px', borderRadius: '6px', border: '1px solid #283344' }}>
                      <div style={{ color: '#64748b' }}>Spindle Speed (OD):</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                        {physicsData.rpmAtMaxOD} RPM
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>At Ø{setupConfig.rawStockOD}mm</div>
                    </div>

                    <div style={{ background: '#1a2230', padding: '10px', borderRadius: '6px', border: '1px solid #283344' }}>
                      <div style={{ color: '#64748b' }}>Metal Removal Rate:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                        {physicsData.mrrCm3Min} cm³/min
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>ap {setupConfig.roughingDepthOfCut}mm &times; fn {setupConfig.feedRatePerRev}</div>
                    </div>

                    <div style={{ background: '#1a2230', padding: '10px', borderRadius: '6px', border: '1px solid #283344' }}>
                      <div style={{ color: '#64748b' }}>Tangential Cutting Force Fc:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                        {physicsData.cuttingForceFc} N
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>kc 1950 N/mm²</div>
                    </div>

                    <div style={{ background: '#1a2230', padding: '10px', borderRadius: '6px', border: '1px solid #283344' }}>
                      <div style={{ color: '#64748b' }}>Spindle Power Draw:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ec4899', marginTop: '2px' }}>
                        {physicsData.powerKw} kW
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>Torque: {physicsData.torqueNm} N&bull;m</div>
                    </div>

                    <div style={{ background: '#1a2230', padding: '10px', borderRadius: '6px', border: '1px solid #283344' }}>
                      <div style={{ color: '#64748b' }}>Estimated Machining Time:</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7', marginTop: '2px' }}>
                        {physicsData.cycleTimeFormatted}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>{toolpathData.roughingPasses} Passes + Facing</div>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                        <th style={{ padding: '6px' }}>Step #</th>
                        <th style={{ padding: '6px' }}>Target Diameter (X)</th>
                        <th style={{ padding: '6px' }}>Z Coordinate</th>
                        <th style={{ padding: '6px' }}>Feature Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeProfile.profile.map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '6px', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '6px', fontWeight: 700, color: '#38bdf8' }}>Ø{p.dia.toFixed(2)} mm</td>
                          <td style={{ padding: '6px', fontWeight: 600, color: '#f59e0b' }}>Z{p.z.toFixed(2)} mm</td>
                          <td style={{ padding: '6px', color: '#cbd5e1' }}>{p.note || 'Contour Step'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: '#0e121a',
            borderTop: '1px solid #283347',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Part: <strong style={{ color: '#f1f5f9' }}>{activeProfile.name}</strong> &bull; Raw Stock: Ø{setupConfig.rawStockOD}mm &times; {setupConfig.rawStockLength}mm &bull; Tool: <strong style={{ color: '#38bdf8' }}>{activeTool.name}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyToOperations}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid #38bdf8',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Check size={16} /> Apply Turning Operation to CAM Tree
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

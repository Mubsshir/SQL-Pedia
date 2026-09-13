import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Eye, Sparkles, Layers, Info, CheckCircle2 } from 'lucide-react';

export interface MeterComponentHotspot {
  id: string;
  name: string;
  tableHint: string;
  spHint: string;
  description: string;
}

export const METER_HOTSPOTS: MeterComponentHotspot[] = [
  {
    id: 'lcd',
    name: 'Digital LCD Display',
    tableHint: 'T_Meter_Billing_Determinants / T_Meter_Load_Profile',
    spHint: 'usp_import_hes_daily_reads',
    description: 'Displays cumulative active energy import (kWh), maximum demand (kVA/kW), and real-time voltage/current metrics.',
  },
  {
    id: 'barcode',
    name: 'Meter Serial & Barcode',
    tableHint: 'M_Meter_Master & L_Meter_Lookup',
    spHint: 'usp_wfm_CommissionMeter',
    description: 'Unique manufacturer serial identifier scanned by technician mobile app during installation to bind meter to consumer.',
  },
  {
    id: 'optical',
    name: 'Optical Port / Comms NIC',
    tableHint: 'L_Network_Meter_Lookup & S_HES_Device_Registration',
    spHint: 'usp_hes_ProcessDiscoveryPayload',
    description: 'Cellular 4G/NB-IoT modem and ANSI/IEC optical port used for initial bootstrapping, parameterization, and HES communication.',
  },
  {
    id: 'tamper',
    name: 'Tamper Sensor & Terminal Cover',
    tableHint: 'T_Meter_Events_HES / T_Meter_Alarms',
    spHint: 'usp_hes_ProcessMeterEventAlarms',
    description: 'Internal microswitches detecting magnetic interference, terminal cover opening, reverse current, or neutral disturbance.',
  },
  {
    id: 'terminal',
    name: 'Terminal Block & Grid Feed',
    tableHint: 'M_Consumer_Hierarchy (Feeder -> DTR -> Meter)',
    spHint: 'usp_rep_FeederConsumerMapping',
    description: 'Incoming and outgoing phase terminals connecting grid supply to consumer premise via Distribution Transformer (DTR).',
  },
];

interface ThreeSmartMeterProps {
  activeHotspotId?: string;
  onSelectHotspot?: (hotspot: MeterComponentHotspot) => void;
  className?: string;
}

export const ThreeSmartMeter: React.FC<ThreeSmartMeterProps> = ({
  activeHotspotId,
  onSelectHotspot,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(activeHotspotId || 'lcd');

  // Sync state if activeHotspotId prop updates
  useEffect(() => {
    if (activeHotspotId && activeHotspotId !== selectedId) {
      setSelectedId(activeHotspotId);
    }
  }, [activeHotspotId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x34d399, 0.6);
    blueRimLight.position.set(-5, -3, 3);
    scene.add(blueRimLight);

    // 5. Smart Meter Procedural 3D Model Group
    const meterGroup = new THREE.Group();
    scene.add(meterGroup);

    // A. Main Meter Body (Polycarbonate Enclosure)
    const bodyGeo = new THREE.BoxGeometry(3.2, 4.4, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.15,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    meterGroup.add(bodyMesh);

    // B. Beveled Face Border
    const borderGeo = new THREE.BoxGeometry(3.0, 4.2, 0.15);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.z = 0.62;
    meterGroup.add(borderMesh);

    // C. Digital LCD Display (Canvas Texture for live readout)
    const lcdCanvas = document.createElement('canvas');
    lcdCanvas.width = 512;
    lcdCanvas.height = 256;
    const ctx = lcdCanvas.getContext('2d')!;

    const drawLcdScreen = (kwhValue: number, pulseOn: boolean) => {
      ctx.fillStyle = '#06281e';
      ctx.fillRect(0, 0, 512, 256);

      // Inner LCD frame
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 240);

      // Digital Header
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('COMPANY SMART MDMS • 3-PHASE', 24, 42);

      // Status indicator dots
      ctx.fillStyle = pulseOn ? '#10b981' : '#047857';
      ctx.beginPath();
      ctx.arc(460, 36, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cumulative Energy Readout
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 56px monospace';
      ctx.fillText(`${kwhValue.toFixed(2)}`, 24, 120);

      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('kWh', 350, 120);

      // Secondary Grid Metrics (Voltage & Power Factor)
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = '#34d399';
      ctx.fillText('V: 231.4V  PF: 0.98  MD: 4.8kW', 24, 180);

      // Connection Status Tag
      ctx.fillStyle = '#10b981';
      ctx.fillRect(24, 205, 120, 26);
      ctx.fillStyle = '#022c22';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('HES ONLINE', 32, 224);
    };

    drawLcdScreen(1420.55, true);
    const lcdTexture = new THREE.CanvasTexture(lcdCanvas);

    const lcdGeo = new THREE.PlaneGeometry(2.4, 1.2);
    const lcdMat = new THREE.MeshBasicMaterial({ map: lcdTexture });
    const lcdMesh = new THREE.Mesh(lcdGeo, lcdMat);
    lcdMesh.position.set(0, 0.75, 0.72);
    meterGroup.add(lcdMesh);

    // D. Red Calibration Pulse LED
    const ledGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.rotation.x = Math.PI / 2;
    ledMesh.position.set(1.0, 0.1, 0.7);
    meterGroup.add(ledMesh);

    // E. Optical Communication Port (Metallic Ring + Sensor Center)
    const optRingGeo = new THREE.TorusGeometry(0.24, 0.06, 12, 24);
    const optMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const optRingMesh = new THREE.Mesh(optRingGeo, optMat);
    optRingMesh.position.set(-0.8, 0.1, 0.7);
    meterGroup.add(optRingMesh);

    const optSensorGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16);
    const optSensorMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const optSensorMesh = new THREE.Mesh(optSensorGeo, optSensorMat);
    optSensorMesh.rotation.x = Math.PI / 2;
    optSensorMesh.position.set(-0.8, 0.1, 0.7);
    meterGroup.add(optSensorMesh);

    // F. Barcode / Serial Plate
    const barcodeCanvas = document.createElement('canvas');
    barcodeCanvas.width = 512;
    barcodeCanvas.height = 128;
    const bCtx = barcodeCanvas.getContext('2d')!;
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.fillStyle = '#0f172a';
    bCtx.font = 'bold 24px monospace';
    bCtx.fillText('SERIAL: MTR-2026-98214', 16, 36);

    // Draw simulated barcode lines
    for (let x = 16; x < 490; x += Math.floor(Math.random() * 8) + 4) {
      bCtx.fillRect(x, 48, Math.random() > 0.5 ? 4 : 2, 60);
    }
    const barcodeTexture = new THREE.CanvasTexture(barcodeCanvas);
    const barcodeGeo = new THREE.PlaneGeometry(2.4, 0.6);
    const barcodeMat = new THREE.MeshBasicMaterial({ map: barcodeTexture });
    const barcodeMesh = new THREE.Mesh(barcodeGeo, barcodeMat);
    barcodeMesh.position.set(0, -0.45, 0.72);
    meterGroup.add(barcodeMesh);

    // G. Terminal Cover (Lower Half Compartment)
    const termCoverGeo = new THREE.BoxGeometry(2.9, 1.2, 0.35);
    const termCoverMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
    });
    const termCoverMesh = new THREE.Mesh(termCoverGeo, termCoverMat);
    termCoverMesh.position.set(0, -1.45, 0.65);
    meterGroup.add(termCoverMesh);

    // H. Blue Tamper Seal Wire & Lock Tag
    const sealGeo = new THREE.BoxGeometry(0.25, 0.35, 0.15);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Utility Tamper Seal Blue
      metalness: 0.3,
      roughness: 0.3,
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.set(0.9, -1.45, 0.85);
    meterGroup.add(sealMesh);

    // I. Cellular Antenna on Top
    const antStemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.7, 12);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const antMesh = new THREE.Mesh(antStemGeo, antMat);
    antMesh.position.set(1.2, 2.45, 0);
    meterGroup.add(antMesh);

    // Transparent Outer Acrylic Shield
    const shieldGeo = new THREE.BoxGeometry(3.05, 4.25, 0.1);
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.z = 0.78;
    meterGroup.add(shieldMesh);

    // Tilt meter slightly for dynamic perspective
    meterGroup.rotation.y = 0.25;
    meterGroup.rotation.x = 0.1;

    // 6. Interactive Drag to Orbit Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      meterGroup.rotation.y += deltaX * 0.008;
      meterGroup.rotation.x += deltaY * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 7. Animation Loop with Live Pulse
    let animId: number;
    let clock = new THREE.Clock();
    let lastLcdUpdate = 0;
    let currentKwh = 1420.55;
    let pulseState = false;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow idle auto-rotation if enabled and not being dragged
      if (isAutoRotating && !isDragging) {
        meterGroup.rotation.y += 0.004;
      }

      // Blink red calibration LED every ~1.5s
      const blink = Math.sin(elapsedTime * 4) > 0.7;
      ledMat.emissiveIntensity = blink ? 2.5 : 0.2;

      // Update LCD display numbers every 2 seconds
      if (elapsedTime - lastLcdUpdate > 2.0) {
        lastLcdUpdate = elapsedTime;
        pulseState = !pulseState;
        currentKwh += 0.02;
        drawLcdScreen(currentKwh, pulseState);
        lcdTexture.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      bodyGeo.dispose();
      bodyMat.dispose();
      lcdGeo.dispose();
      lcdMat.dispose();
      lcdTexture.dispose();
    };
  }, [isAutoRotating]);

  const handleHotspotClick = (hotspot: MeterComponentHotspot) => {
    setSelectedId(hotspot.id);
    if (onSelectHotspot) {
      onSelectHotspot(hotspot);
    }
  };

  const selectedHotspot = METER_HOTSPOTS.find(h => h.id === selectedId) || METER_HOTSPOTS[0];

  return (
    <div className={`rounded-2xl border border-emerald-200 dark:border-sql-border bg-gradient-to-b from-slate-900 to-[#080d0b] text-white p-5 shadow-xl overflow-hidden ${className}`}>
      {/* 3D Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-bold text-white tracking-wide">
            Interactive 3D Smart Meter Inspector
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            WebGL / Three.js
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              isAutoRotating
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className="w-3 h-3" />
            <span>{isAutoRotating ? 'Rotating' : 'Paused'}</span>
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Drag to rotate in 3D
          </span>
        </div>
      </div>

      {/* Main 3D Canvas + Hotspot Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Three.js Canvas Container */}
        <div className="lg:col-span-7 relative h-[320px] sm:h-[380px] w-full rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing shadow-inner">
          <div ref={mountRef} className="w-full h-full" />

          {/* Quick HUD Overlay */}
          <div className="absolute top-3 left-3 pointer-events-none space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs block">
              MODEL: GENUS / L&T 3-PHASE SMART
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs block">
              STATUS: COMMISIONED & CONNECTED
            </span>
          </div>
        </div>

        {/* Right: Interactive Component Hotspot Selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Click Component to Inspect Database Impact:</span>
          </div>

          <div className="space-y-1.5">
            {METER_HOTSPOTS.map((h) => (
              <button
                key={h.id}
                onClick={() => handleHotspotClick(h)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                  selectedId === h.id
                    ? 'border-emerald-400 bg-emerald-950/50 text-white ring-1 ring-emerald-400/30'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedId === h.id ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span>{h.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400/90 pl-3.5">
                    {h.tableHint}
                  </div>
                </div>
                {selectedId === h.id && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Active Hotspot Technical Detail Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-emerald-300 text-xs">
                {selectedHotspot.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                MDMS Field Mapping
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {selectedHotspot.description}
            </p>
            <div className="pt-1 space-y-1 font-mono text-[10px]">
              <div className="text-emerald-400">
                <span className="text-slate-500">DB Tables: </span>
                {selectedHotspot.tableHint}
              </div>
              <div className="text-sky-300">
                <span className="text-slate-500">Target SP: </span>
                {selectedHotspot.spHint}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

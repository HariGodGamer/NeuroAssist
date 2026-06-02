import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

// ─── Anatomical 3D Positions for the 6 Primary ML Output Regions ────────────
// Coordinates tuned for the particle-brain space (roughly -1.0 to +1.0 per axis)
const REGION_META = {
  hippocampus:       { pos: [-0.38, -0.22,  0.28], name: 'Hippocampus',       desc: 'Memory formation. Primary early AD atrophy site.' },
  entorhinal_cortex: { pos: [ 0.42, -0.18,  0.22], name: 'Entorhinal Cortex', desc: 'Gateway to hippocampus. Degenerates in early-stage AD.' },
  temporal_lobe:     { pos: [-0.82,  0.05,  0.05], name: 'Temporal Lobe',     desc: 'Language, memory recall & auditory processing.' },
  parietal_cortex:   { pos: [ 0.12,  0.62, -0.12], name: 'Parietal Cortex',   desc: 'Spatial orientation & sensorimotor integration.' },
  frontal_lobe:      { pos: [ 0.05,  0.50,  0.80], name: 'Frontal Lobe',      desc: 'Executive function, planning & decision-making.' },
  cerebellum:        { pos: [ 0.05, -0.68, -0.78], name: 'Cerebellum',        desc: 'Motor coordination & balance regulation.' },
};

function scoreToColors(score) {
  if (score === null || score === undefined)
    return { ring: 0x3b82f6, core: 0x93c5fd, glow: null, label: 'blue' };
  if (score > 0.65)
    return { ring: 0xef4444, core: 0xfca5a5, glow: 0xff2222, label: 'red' };
  if (score > 0.35)
    return { ring: 0xf59e0b, core: 0xfcd34d, glow: null, label: 'amber' };
  return { ring: 0x4ade80, core: 0xa7f3d0, glow: null, label: 'green' };
}

// ─── Component ───────────────────────────────────────────────────────────────
const ThreeBrain = ({ activeHotspot, onHoverHotspot, onClickHotspot, brainRegions, prediction }) => {
  const mountRef = useRef(null);
  // Keep refs to live scene objects so we can update without full rebuild
  const sceneStateRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  // Merge static metadata with live attention scores
  const hotspots = Object.entries(REGION_META).map(([id, meta]) => ({
    id,
    name: meta.name,
    pos:  meta.pos,
    desc: meta.desc,
    score: (brainRegions && typeof brainRegions === 'object') ? (brainRegions[id] ?? null) : null,
  }));

  // ── Effect 1: Build scene once per scan (brainRegions / prediction change) ──
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Cleanup previous scene
    if (sceneStateRef.current) {
      const { reqId, renderer, geometry, material, lineMaterial, lineGeometry, pTexture } = sceneStateRef.current;
      cancelAnimationFrame(reqId.value);
      renderer.domElement.removeEventListener('mousedown', sceneStateRef.current.handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', sceneStateRef.current.handleMouseMove);
      window.removeEventListener('mouseup', sceneStateRef.current.handleMouseUp);
      window.removeEventListener('resize', sceneStateRef.current.handleResize);
      if (currentMount.contains(renderer.domElement))
        currentMount.removeChild(renderer.domElement);
      geometry.dispose(); material.dispose();
      lineMaterial.dispose(); lineGeometry.dispose();
      pTexture.dispose(); renderer.dispose();
      sceneStateRef.current = null;
    }

    // ── Scene ──────────────────────────────────────────────────────────────
    const width  = currentMount.clientWidth  || 400;
    const height = currentMount.clientHeight || 400;
    const scene  = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // ── Brain Particle Cloud ───────────────────────────────────────────────
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // Atrophy visual based on prediction
    let shellColor = 0x2a5282;
    let shellScale = 1.0;
    if (prediction === 'AD') { shellColor = 0xef4444; shellScale = 0.88; }
    else if (prediction === 'MCI') { shellColor = 0xf59e0b; shellScale = 0.94; }
    else if (prediction === 'CN')  { shellColor = 0x10b981; shellScale = 1.0; }
    brainGroup.scale.set(shellScale, shellScale, shellScale);

    const particleCount = 1800;
    const geometry     = new THREE.BufferGeometry();
    const positions    = new Float32Array(particleCount * 3);
    const colors       = new Float32Array(particleCount * 3);
    const originalPositions = [];

    for (let i = 0; i < particleCount; i++) {
      let x, y, z;
      const isLeft = Math.random() > 0.5;
      if (i < particleCount * 0.75) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const rx = 1.0 + Math.sin(theta * 5) * Math.cos(phi * 5) * 0.12;
        const ry = 0.8 + Math.cos(theta * 3) * 0.08;
        const rz = 1.2 + Math.sin(phi  * 4) * 0.10;
        x = rx * Math.sin(phi) * Math.cos(theta);
        y = ry * Math.sin(phi) * Math.sin(theta);
        z = rz * Math.cos(phi);
        x = isLeft ? Math.abs(x) + 0.04 : -Math.abs(x) - 0.04;
        if (y < -0.2) y *= 0.85;
      } else if (i < particleCount * 0.90) {
        const theta = Math.random() * Math.PI * 2;
        const r     = 0.4 + Math.random() * 0.15;
        x = r * Math.cos(theta) * 0.7;
        y = -0.5 + (Math.random() - 0.5) * 0.25;
        z = -0.6 - Math.random() * 0.3;
        x += isLeft ? 0.05 : -0.05;
      } else {
        x = (Math.random() - 0.5) * 0.18;
        y = -0.6 - Math.random() * 0.6;
        z = -0.2 - Math.random() * 0.2;
      }
      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      originalPositions.push({ x, y, z, seed: Math.random() * 100 });
      const mix = (y + 1.2) / 2.4;
      colors[i * 3]     = THREE.MathUtils.lerp(0.40, 0.56, mix);
      colors[i * 3 + 1] = THREE.MathUtils.lerp(0.89, 0.39, mix);
      colors[i * 3 + 2] = THREE.MathUtils.lerp(0.60, 0.96, mix);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    // Glow particle texture
    const cvs = document.createElement('canvas');
    cvs.width = cvs.height = 16;
    const c2d = cvs.getContext('2d');
    const grd = c2d.createRadialGradient(8, 8, 0, 8, 8, 8);
    grd.addColorStop(0.0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1.0, 'rgba(255,255,255,0)');
    c2d.fillStyle = grd;
    c2d.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(cvs);

    // ── Glassy Solid Brain Mesh ──────────────────────────────────────────
    const brainMat = new THREE.MeshPhongMaterial({
      color: shellColor, transparent: true, opacity: 0.18,
      shininess: 70, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false,
    });
    const leftHemi = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), brainMat);
    leftHemi.position.set(-0.15, 0, 0); leftHemi.scale.set(0.85, 0.85, 1.1);
    brainGroup.add(leftHemi);
    const rightHemi = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), brainMat);
    rightHemi.position.set(0.15, 0, 0); rightHemi.scale.set(0.85, 0.85, 1.1);
    brainGroup.add(rightHemi);

    const stemMat = new THREE.MeshPhongMaterial({
      color: prediction === 'AD' ? 0x991b1b : prediction === 'MCI' ? 0x9a3412 : 0x152e4a,
      transparent: true, opacity: 0.30, shininess: 25,
    });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.9, 16), stemMat);
    stem.position.set(0, -1.0, -0.3);
    brainGroup.add(stem);

    const cerebMat = new THREE.MeshPhongMaterial({
      color: prediction === 'AD' ? 0xb91c1c : prediction === 'MCI' ? 0xb45309 : 0x1a3a5c,
      transparent: true, opacity: 0.30, shininess: 25,
    });
    const cereb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), cerebMat);
    cereb.position.set(0, -0.8, -0.7); cereb.scale.set(1.3, 0.7, 0.9);
    brainGroup.add(cereb);

    const fissureMat = new THREE.MeshBasicMaterial({ color: 0x050d18, transparent: true, opacity: 0.15 });
    const fissure = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.8, 2.2), fissureMat);
    brainGroup.add(fissure);

    const material = new THREE.PointsMaterial({
      size: 0.065, map: pTexture, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true,
    });
    brainGroup.add(new THREE.Points(geometry, material));

    // ── Neural Pathway Lines ───────────────────────────────────────────────
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x67e499, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const linePosBuf = [];
    for (let k = 0; k < 120; k++) {
      const iA = Math.floor(Math.random() * particleCount);
      let iB   = Math.floor(Math.random() * particleCount);
      const pA = new THREE.Vector3(positions[iA*3], positions[iA*3+1], positions[iA*3+2]);
      const pB = new THREE.Vector3(positions[iB*3], positions[iB*3+1], positions[iB*3+2]);
      let att = 0;
      while (pA.distanceTo(pB) > 0.4 && att++ < 10) {
        iB = Math.floor(Math.random() * particleCount);
        pB.set(positions[iB*3], positions[iB*3+1], positions[iB*3+2]);
      }
      if (pA.distanceTo(pB) < 0.4)
        linePosBuf.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePosBuf, 3));
    brainGroup.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    // ── Hotspot Markers ─────────────────────────────────────────────────────
    const hotspotMeshes = [];
    const currentHotspots = Object.entries(REGION_META).map(([id, meta]) => ({
      id, name: meta.name, pos: meta.pos, desc: meta.desc,
      score: (brainRegions && typeof brainRegions === 'object') ? (brainRegions[id] ?? null) : null,
    }));

    currentHotspots.forEach(h => {
      const col    = scoreToColors(h.score);
      const hGroup = new THREE.Group();
      hGroup.position.set(...h.pos);

      // Outer ring
      hGroup.add(new THREE.Mesh(
        new THREE.RingGeometry(0.08, 0.096, 32),
        new THREE.MeshBasicMaterial({ color: col.ring, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      ));
      // Inner sphere
      hGroup.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 16, 16),
        new THREE.MeshBasicMaterial({ color: col.core, transparent: true, opacity: 0.95 })
      ));
      // Danger glow for high-risk
      if (col.glow) {
        hGroup.add(new THREE.Mesh(
          new THREE.RingGeometry(0.115, 0.130, 32),
          new THREE.MeshBasicMaterial({ color: col.glow, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
        ));
      }
      hGroup.userData = { id: h.id, name: h.name, desc: h.desc, score: h.score };
      brainGroup.add(hGroup);
      hotspotMeshes.push(hGroup);
    });

    // ── Lights ─────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const dl1 = new THREE.DirectionalLight(0x8f63f4, 1.5);
    dl1.position.set(2, 4, 3); scene.add(dl1);
    const dl2 = new THREE.DirectionalLight(0x67e499, 1.2);
    dl2.position.set(-3, -2, 2); scene.add(dl2);

    // ── Drag rotation state ─────────────────────────────────────────────
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const rotation = { x: 0, y: 0 };
    const autoRotateSpeed = 0.003;

    // Store ref to current hover and active so animation loop can read latest
    let currentHoveredId  = null;
    let currentActiveHotspot = null;

    // ── Animation Loop ──────────────────────────────────────────────────
    const clock = new THREE.Clock();
    const reqId = { value: null };

    const animate = () => {
      reqId.value = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (!isDragging) rotation.y += autoRotateSpeed;
      brainGroup.rotation.y = rotation.y;
      brainGroup.rotation.x = rotation.x;

      // Neural breathing animation
      const posArr = geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const o = originalPositions[i];
        const p = Math.sin(t * 2.0 + o.seed) * 0.015;
        posArr[i * 3]     = o.x * (1 + p);
        posArr[i * 3 + 1] = o.y * (1 + p);
        posArr[i * 3 + 2] = o.z * (1 + p);
      }
      geometry.attributes.position.needsUpdate = true;

      // Update hotspot markers — billboard, scale by score, highlight active/hovered
      hotspotMeshes.forEach(mesh => {
        mesh.quaternion.copy(camera.quaternion);
        const score = mesh.userData.score;
        const isActive  = mesh.userData.id === currentActiveHotspot;
        const isHovered = mesh.userData.id === currentHoveredId;

        // Scale: proportional to attention score
        const baseScale = score !== null ? 0.75 + score * 0.55 : 0.85;
        const finalScale = (isActive || isHovered) ? baseScale * 1.45 : baseScale;
        mesh.scale.set(finalScale, finalScale, finalScale);

        // Smooth opacity pulse only for the active one — gentle, not blinking
        const ringMesh  = mesh.children[0];
        const coreMesh  = mesh.children[1];
        if (ringMesh && ringMesh.material) {
          ringMesh.material.opacity = isActive
            ? 0.7 + Math.sin(t * 3) * 0.25
            : (isHovered ? 1.0 : 0.85);
          ringMesh.material.color.setHex(
            isActive ? 0xcaa8f5 : isHovered ? 0xffffff : scoreToColors(score).ring
          );
        }
        if (coreMesh && coreMesh.material) {
          coreMesh.material.color.setHex(
            isActive ? 0xffffff : isHovered ? 0xffffff : scoreToColors(score).core
          );
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── Raycasting for Hover & Mouse Drag ──────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    let clickStartTime = 0;
    let clickStartX = 0;
    let clickStartY = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
      clickStartTime = Date.now();
      clickStartX = e.clientX;
      clickStartY = e.clientY;
    };

    const handleMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const targets    = hotspotMeshes.flatMap(hm => hm.children);
      const intersects = raycaster.intersectObjects(targets);

      if (intersects.length > 0) {
        const parent = intersects[0].object.parent;
        if (parent?.userData?.id) {
          if (currentHoveredId !== parent.userData.id) {
            currentHoveredId = parent.userData.id;
            setHoveredId(parent.userData.id);
            if (onHoverHotspot) onHoverHotspot(parent.userData);
          }
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        if (currentHoveredId !== null) {
          currentHoveredId = null;
          setHoveredId(null);
          if (onHoverHotspot) onHoverHotspot(null);
        }
        renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
      }

      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        rotation.y += dx * 0.008;
        rotation.x += dy * 0.008;
        rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotation.x));
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e) => {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';

      const duration = Date.now() - clickStartTime;
      const dx = Math.abs(e.clientX - clickStartX);
      const dy = Math.abs(e.clientY - clickStartY);

      if (duration < 250 && dx < 5 && dy < 5) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const targets    = hotspotMeshes.flatMap(hm => hm.children);
        const intersects = raycaster.intersectObjects(targets);

        if (intersects.length > 0) {
          const parent = intersects[0].object.parent;
          if (parent?.userData?.id && onClickHotspot) {
            onClickHotspot(parent.userData.id);
          }
        }
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Store all scene state in ref for updates and cleanup
    sceneStateRef.current = {
      reqId, renderer, camera, geometry, material, lineMaterial, lineGeometry,
      pTexture, hotspotMeshes, handleMouseDown, handleMouseMove, handleMouseUp, handleResize,
      setCurrentActiveHotspot: (id) => { currentActiveHotspot = id; },
    };

    return () => {
      cancelAnimationFrame(reqId.value);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(renderer.domElement))
        currentMount.removeChild(renderer.domElement);
      geometry.dispose(); material.dispose();
      lineMaterial.dispose(); lineGeometry.dispose();
      pTexture.dispose(); renderer.dispose();
      sceneStateRef.current = null;
    };
    // Scene only rebuilds when scan changes (brainRegions or prediction change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brainRegions, prediction]);

  // ── Effect 2: Update active hotspot without rebuilding the scene ────────
  useEffect(() => {
    if (sceneStateRef.current?.setCurrentActiveHotspot) {
      sceneStateRef.current.setCurrentActiveHotspot(activeHotspot);
    }
  }, [activeHotspot]);

  // ── JSX ───────────────────────────────────────────────────────────────────
  const selectedRegion = activeHotspot ? hotspots.find(h => h.id === activeHotspot) : null;

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full" />

      {/* Drag hint */}
      <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-black/50 rounded-lg text-[8px] text-slate-500 font-mono uppercase tracking-wider select-none">
        Drag to rotate
      </div>

      {/* Active Hotspot Details Overlay */}
      {selectedRegion && (
        <div className="absolute top-10 left-3 right-3 z-30 bg-slate-950/95 border border-purple-500/30 p-3 rounded-xl text-xs space-y-1 shadow-2xl shadow-black/90 animate-fadeIn">
          <div className="flex justify-between items-center pb-1 border-b border-surface-border/30">
            <span className="font-bold text-white uppercase tracking-wider select-none">{selectedRegion.name}</span>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-mono font-bold ${
                selectedRegion.score > 0.65 ? 'text-red-400' : selectedRegion.score > 0.35 ? 'text-amber-400' : 'text-green-300'
              }`}>
                Score: {selectedRegion.score !== null ? selectedRegion.score.toFixed(3) : 'N/A'}
              </span>
              <button 
                type="button"
                onClick={() => onClickHotspot && onClickHotspot(null)}
                className="text-slate-500 hover:text-white transition-colors font-bold text-[10px] px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-[9px] text-slate-300 leading-normal pt-1 font-sans select-none">{selectedRegion.desc}</p>
        </div>
      )}

      {/* Collapsed legend button */}
      {!isLegendExpanded && (
        <button
          type="button"
          onClick={() => setIsLegendExpanded(true)}
          className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-slate-950/90 border border-surface-border/60 px-3 py-1.5 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-black/80 cursor-pointer"
        >
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold select-none">
            AI Attention Map
          </span>
          <FaChevronUp className="text-[9px] text-slate-500" />
        </button>
      )}

      {/* Attention-score legend overlay */}
      {isLegendExpanded && (
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 bg-black/85 border border-surface-border p-3.5 rounded-2xl backdrop-blur-md w-48 shadow-2xl shadow-black/80 animate-fadeIn transition-all">
          <div 
            onClick={() => setIsLegendExpanded(false)}
            className="flex items-center justify-between gap-2 cursor-pointer pb-1.5 mb-1.5 border-b border-surface-border/30 text-slate-400 hover:text-white transition-colors"
          >
            <span className="text-[9px] uppercase tracking-widest font-bold font-display select-none">
              AI Attention Map
            </span>
            <FaChevronDown className="text-[10px]" />
          </div>
          {hotspots.map(h => {
            const col = scoreToColors(h.score);
            const dotCls =
              col.label === 'red'   ? 'bg-red-400' :
              col.label === 'amber' ? 'bg-amber-400' :
              col.label === 'blue'  ? 'bg-blue-400' :
                                      'bg-green-400';
            const textCls =
              activeHotspot === h.id ? 'text-purple-300 font-semibold' :
              hoveredId === h.id     ? 'text-white' :
                                       'text-slate-400 hover:text-white';
            const scoreCls =
              col.label === 'red'   ? 'text-red-400' :
              col.label === 'amber' ? 'text-amber-400' :
              col.label === 'blue'  ? 'text-blue-400' :
                                      'text-green-400';
            return (
              <div
                key={h.id}
                className={`flex items-center justify-between gap-3 cursor-pointer transition-colors ${textCls}`}
                onClick={() => onHoverHotspot && onHoverHotspot(h)}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeHotspot === h.id ? 'ring-1 ring-purple-400' : ''} ${dotCls}`} />
                  <span className="text-[10px]">{h.name}</span>
                </div>
                {h.score !== null ? (
                  <span className={`text-[9px] font-mono font-bold ${scoreCls}`}>
                    {h.score.toFixed(3)}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-600">—</span>
                )}
              </div>
            );
          })}

          {/* Risk key */}
          <div className="flex items-center gap-3 mt-1 pt-1.5 border-t border-surface-border/30">
            <span className="flex items-center gap-1 text-[8px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />High
            </span>
            <span className="flex items-center gap-1 text-[8px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Mid
            </span>
            <span className="flex items-center gap-1 text-[8px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Low
            </span>
            <span className="flex items-center gap-1 text-[8px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />N/A
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeBrain;

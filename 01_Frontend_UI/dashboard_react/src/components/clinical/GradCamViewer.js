import React, { useState, useRef } from 'react';
import { LuBrain } from 'react-icons/lu';
import { FiLayers, FiCrosshair, FiEye, FiRotateCcw } from 'react-icons/fi';

/**
 * GradCamViewer — Hospital PACS Radiologist 3D MRI & Grad-CAM Heatmap Viewer
 * Fully interactive movable crosshair with real-time coordinate tracking & 3D slice depth.
 */
export default function GradCamViewer({
  scanId = 'SCN-849201',
  condition = 'CN',
  confidence = 90,
  patientName = 'Patient Record'
}) {
  const [activeSliceView, setActiveSliceView] = useState('axial'); // 'axial' | 'coronal' | 'sagittal'
  const [sliceIndex, setSliceIndex] = useState(50); // 0 to 100
  const [zoomScale, setZoomScale] = useState(100); // 80 to 140
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  // Interactive Crosshair Position (X, Y in percentage 0-100)
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const imageContainerRef = useRef(null);

  // Map 0-100 slider to nearest 5% real slice file
  const roundedSlice = Math.min(100, Math.max(0, Math.round(sliceIndex / 5) * 5));
  
  // Real image source (with heatmap or raw grayscale)
  const realMriSrc = showHeatmap 
    ? `/assets/mri/${activeSliceView}_${roundedSlice}.jpg`
    : `/assets/mri/${activeSliceView}_raw.jpg`;

  // Handle interactive mouse drag/click to move crosshair anywhere on MRI
  const handlePointerMove = (e) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    const posX = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const posY = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    setCrosshairPos({ x: Math.round(posX), y: Math.round(posY) });
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Anatomical landmark descriptor
  const getLandmarkText = () => {
    if (activeSliceView === 'axial') {
      if (sliceIndex < 25) return 'Superior Cerebral Cortex & Vertex';
      if (sliceIndex < 45) return 'Centrum Semiovale & Corona Radiata';
      if (sliceIndex < 65) return 'Lateral Ventricles & Hippocampus (Diagnostic Focus)';
      if (sliceIndex < 80) return 'Medial Temporal Lobes & Midbrain';
      return 'Cerebellar Hemispheres & Brainstem';
    } else if (activeSliceView === 'coronal') {
      if (sliceIndex < 35) return 'Anterior Frontal Pole & Orbits';
      if (sliceIndex < 65) return 'Hippocampal Formation & Temporal Horns';
      return 'Posterior Parieto-Occipital Cortex';
    } else {
      if (sliceIndex < 35) return 'Right Lateral Insular Cortex';
      if (sliceIndex < 65) return 'Mid-Sagittal Corpus Callosum & Brainstem';
      return 'Left Lateral Parieto-Temporal Lobe';
    }
  };

  return (
    <div className="clinical-card p-5 bg-white space-y-4 shadow-clinical border border-[#E8E2DA] rounded-2xl select-none">
      
      {/* Header with spacious, non-overlapping layout */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E8E2DA]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F8EAED] text-[#7A1F2B] flex items-center justify-center border border-[#ECC8CF] shrink-0">
            <LuBrain className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#22201F] truncate">
              Grad-CAM Explainability Heatmap
            </h4>
            <p className="text-[10px] text-[#7A756F] truncate">
              MedicalNet ResNet-10 · Layer4 Attention
            </p>
          </div>
        </div>

        {/* Viewport Selectors (Axial, Coronal, Sagittal) */}
        <div className="flex bg-[#FAF6F3] p-1 rounded-xl border border-[#E8E2DA] gap-1 shrink-0">
          {['axial', 'coronal', 'sagittal'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveSliceView(v)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeSliceView === v
                  ? 'bg-[#7A1F2B] text-white shadow-xs'
                  : 'text-[#7A756F] hover:text-[#22201F]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Real DICOM Clinical MRI Screen - Interactive Drag/Click Viewport */}
      <div 
        ref={imageContainerRef}
        onMouseDown={handlePointerDown}
        onMouseMove={(e) => isDragging && handlePointerMove(e)}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={(e) => isDragging && handlePointerMove(e)}
        onTouchEnd={handlePointerUp}
        className="relative rounded-2xl border border-[#2A2D34] overflow-hidden bg-[#000000] shadow-2xl flex items-center justify-center aspect-square max-h-[380px] w-full cursor-crosshair group"
      >
        
        {/* Top-Left Live Coordinate HUD */}
        <div className="absolute top-3 left-3 z-20 bg-black/80 backdrop-blur-xs border border-white/15 px-2.5 py-1 rounded-lg text-[9px] font-mono text-[#4ADE80] font-bold pointer-events-none shadow-md">
          TARGET: X:{crosshairPos.x}% · Y:{crosshairPos.y}% · Z:{sliceIndex}%
        </div>

        {/* Top-Right Slice Position Badge */}
        <div className="absolute top-3 right-3 z-20 bg-black/85 backdrop-blur-xs border border-[#4ADE80]/60 px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#4ADE80] font-bold pointer-events-none shadow-md">
          SLICE {sliceIndex.toString().padStart(3, '0')} / 100
        </div>

        {/* Real High-Resolution Hospital MRI Scan Image with Zoom Support */}
        <div className="relative w-full h-full flex items-center justify-center p-0 overflow-hidden bg-black pointer-events-none">
          <img
            src={realMriSrc}
            alt={`Clinical MRI ${activeSliceView} slice ${sliceIndex}`}
            className="w-full h-full object-cover select-none transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${zoomScale / 100})`,
            }}
          />

          {/* Movable Laser Crosshair & Targeting Reticle */}
          {showCrosshair && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.85 }}>
              {/* Dynamic Horizontal Laser Line */}
              <line
                x1="0"
                y1={`${crosshairPos.y}%`}
                x2="100%"
                y2={`${crosshairPos.y}%`}
                stroke="#4ade80"
                strokeWidth="0.9"
                strokeDasharray="4 5"
              />
              {/* Dynamic Vertical Laser Line */}
              <line
                x1={`${crosshairPos.x}%`}
                y1="0"
                x2={`${crosshairPos.x}%`}
                y2="100%"
                stroke="#4ade80"
                strokeWidth="0.9"
                strokeDasharray="4 5"
              />
              {/* Central Target Circle Dot */}
              <circle
                cx={`${crosshairPos.x}%`}
                cy={`${crosshairPos.y}%`}
                r="6"
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <circle
                cx={`${crosshairPos.x}%`}
                cy={`${crosshairPos.y}%`}
                r="2"
                fill="#4ade80"
              />
              {/* Precision Target Brackets that follow coordinate */}
              <polyline
                points={`${crosshairPos.x - 3.5}%,${crosshairPos.y - 1.5}% ${crosshairPos.x - 3.5}%,${crosshairPos.y - 3.5}% ${crosshairPos.x - 1.5}%,${crosshairPos.y - 3.5}%`}
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <polyline
                points={`${crosshairPos.x + 1.5}%,${crosshairPos.y - 3.5}% ${crosshairPos.x + 3.5}%,${crosshairPos.y - 3.5}% ${crosshairPos.x + 3.5}%,${crosshairPos.y - 1.5}%`}
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <polyline
                points={`${crosshairPos.x - 3.5}%,${crosshairPos.y + 1.5}% ${crosshairPos.x - 3.5}%,${crosshairPos.y + 3.5}% ${crosshairPos.x - 1.5}%,${crosshairPos.y + 3.5}%`}
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <polyline
                points={`${crosshairPos.x + 1.5}%,${crosshairPos.y + 3.5}% ${crosshairPos.x + 3.5}%,${crosshairPos.y + 3.5}% ${crosshairPos.x + 3.5}%,${crosshairPos.y + 1.5}%`}
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </div>

        {/* Click/Drag Hint Overlay when hovering */}
        <div className="absolute bottom-3 left-3 z-20 bg-black/75 backdrop-blur-xs border border-white/10 px-2 py-0.5 rounded text-[8px] font-mono text-white/70 pointer-events-none">
          CLICK / DRAG TO MOVE CROSSHAIR
        </div>

        {/* Bottom-Right Colormap Legend */}
        {showHeatmap && (
          <div className="absolute bottom-3 right-3 z-20 bg-black/85 backdrop-blur-xs border border-white/15 px-2.5 py-1 rounded-lg flex items-center gap-1.5 pointer-events-none shadow-md">
            <span className="text-[9px] font-mono text-white/80 font-semibold">LOW</span>
            <div className="w-14 h-2 rounded bg-gradient-to-r from-blue-600 via-green-400 via-yellow-400 to-red-600 border border-white/20" />
            <span className="text-[9px] font-mono text-white/80 font-semibold">HIGH</span>
          </div>
        )}
      </div>

      {/* Scrubber & Workstation Controls */}
      <div className="p-3.5 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] space-y-3">
        
        {/* Slice Position Range Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#7A756F] flex items-center gap-1.5 font-bold">
              <FiLayers className="w-3.5 h-3.5 text-[#7A1F2B]" />
              <span>SLICE DEPTH (Z-AXIS 0-100):</span>
            </span>
            <span className="font-bold text-[#7A1F2B] bg-[#F8EAED] px-2 py-0.5 rounded border border-[#ECC8CF]">
              {sliceIndex} / 100
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliceIndex}
            onChange={(e) => setSliceIndex(Number(e.target.value))}
            className="w-full accent-[#7A1F2B] h-2 rounded-lg bg-[#E8E2DA] outline-none cursor-pointer"
          />
        </div>

        {/* Landmark & Interactive Toggle Tools */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E8E2DA]">
          <span className="text-[11px] text-[#7A1F2B] font-semibold flex items-center gap-1 truncate max-w-[190px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A1F2B] shrink-0" />
            <span className="truncate">{getLandmarkText()}</span>
          </span>
          
          <div className="flex items-center gap-1.5">
            {/* Center Reticle Reset */}
            <button
              type="button"
              onClick={() => setCrosshairPos({ x: 50, y: 50 })}
              title="Reset Crosshair to Center"
              className="p-1.5 rounded-md text-[10px] font-semibold border bg-white text-[#7A756F] border-[#E8E2DA] hover:bg-[#FAF6F3] transition-all"
            >
              <FiRotateCcw className="w-3 h-3" />
            </button>

            {/* Toggle Heatmap Overlay */}
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                showHeatmap 
                  ? 'bg-[#F8EAED] text-[#7A1F2B] border-[#ECC8CF]' 
                  : 'bg-white text-[#7A756F] border-[#E8E2DA]'
              }`}
            >
              <FiEye className="w-3 h-3" />
              <span>{showHeatmap ? 'Heatmap' : 'Grayscale'}</span>
            </button>

            {/* Toggle Crosshair */}
            <button
              type="button"
              onClick={() => setShowCrosshair(!showCrosshair)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                showCrosshair 
                  ? 'bg-[#EDF5F0] text-[#2E523A] border-[#CFE3D5]' 
                  : 'bg-white text-[#7A756F] border-[#E8E2DA]'
              }`}
            >
              <FiCrosshair className="w-3 h-3" />
              <span>Crosshair</span>
            </button>

            {/* Zoom Slider */}
            <input
              type="range"
              min="80"
              max="140"
              value={zoomScale}
              onChange={(e) => setZoomScale(Number(e.target.value))}
              className="w-14 accent-[#7A1F2B] h-1.5 rounded-lg bg-[#E8E2DA] outline-none cursor-pointer ml-0.5"
              title={`Zoom: ${zoomScale}%`}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

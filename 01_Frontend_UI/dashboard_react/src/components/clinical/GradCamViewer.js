import React, { useState } from 'react';
import { LuBrain } from 'react-icons/lu';
import { FiLayers, FiCrosshair, FiEye } from 'react-icons/fi';

/**
 * GradCamViewer — Hospital PACS Radiologist 3D MRI & Grad-CAM Heatmap Viewer
 * Fixed anatomical targeting reticle with interactive toggle controls.
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

  // Map 0-100 slider to nearest 5% real slice file
  const roundedSlice = Math.min(100, Math.max(0, Math.round(sliceIndex / 5) * 5));
  
  // Real image source (with heatmap or raw grayscale)
  const realMriSrc = showHeatmap 
    ? `/assets/mri/${activeSliceView}_${roundedSlice}.jpg`
    : `/assets/mri/${activeSliceView}_raw.jpg`;

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
    <div className="clinical-card p-5 bg-white space-y-4 shadow-clinical border border-[#E8E2DA] rounded-2xl">
      
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

      {/* Real DICOM Clinical MRI Screen - Clean & Uncluttered */}
      <div className="relative rounded-2xl border border-[#2A2D34] overflow-hidden bg-[#000000] shadow-2xl flex items-center justify-center aspect-square max-h-[380px] w-full">
        
        {/* Top-Right Slice Position Badge */}
        <div className="absolute top-3 right-3 z-20 bg-black/85 backdrop-blur-xs border border-[#4ADE80]/60 px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#4ADE80] font-bold pointer-events-none shadow-md">
          SLICE {sliceIndex.toString().padStart(3, '0')} / 100
        </div>

        {/* Real High-Resolution Hospital MRI Scan Image with Zoom Support */}
        <div className="relative w-full h-full flex items-center justify-center p-0 overflow-hidden bg-black">
          <img
            src={realMriSrc}
            alt={`Clinical MRI ${activeSliceView} slice ${sliceIndex}`}
            className="w-full h-full object-cover select-none transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${zoomScale / 100})`,
            }}
          />

          {/* Anatomical Center Target Reticle (Locks onto Diagnostic Region) */}
          {showCrosshair && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }}>
              {/* Subtle Horizontal center guide */}
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="#4ade80"
                strokeWidth="0.8"
                strokeDasharray="4 6"
              />
              {/* Subtle Vertical center guide */}
              <line
                x1="50%"
                y1="0"
                x2="50%"
                y2="100%"
                stroke="#4ade80"
                strokeWidth="0.8"
                strokeDasharray="4 6"
              />
              {/* Central Target Reticle */}
              <circle
                cx="50%"
                cy="50%"
                r="6"
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <circle
                cx="50%"
                cy="50%"
                r="1.5"
                fill="#4ade80"
              />
              {/* Precision Target Brackets */}
              <polyline
                points="46%,48% 46%,46% 48%,46%"
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <polyline
                points="54%,48% 54%,46% 52%,46%"
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <polyline
                points="46%,52% 46%,54% 48%,54%"
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
              <polyline
                points="54%,52% 54%,54% 52%,54%"
                fill="none"
                stroke="#4ade80"
                strokeWidth="1.5"
              />
            </svg>
          )}
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
          <span className="text-[11px] text-[#7A1F2B] font-semibold flex items-center gap-1 truncate max-w-[200px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7A1F2B] shrink-0" />
            <span className="truncate">{getLandmarkText()}</span>
          </span>
          
          <div className="flex items-center gap-2">
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
              <span>{showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}</span>
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
              <span>{showCrosshair ? 'Crosshair ON' : 'OFF'}</span>
            </button>

            {/* Zoom Slider */}
            <input
              type="range"
              min="80"
              max="140"
              value={zoomScale}
              onChange={(e) => setZoomScale(Number(e.target.value))}
              className="w-16 accent-[#7A1F2B] h-1.5 rounded-lg bg-[#E8E2DA] outline-none cursor-pointer ml-1"
              title={`Zoom: ${zoomScale}%`}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

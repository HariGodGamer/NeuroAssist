import React, { useState } from 'react';
import { FiActivity, FiEye } from 'react-icons/fi';

export default function InteractiveMriShowcase() {
  const [selectedView, setSelectedView] = useState('axial'); // 'axial' | 'coronal' | 'sagittal'
  const [selectedCondition, setSelectedCondition] = useState('AD'); // 'CN' | 'MCI' | 'AD'
  const [showGradCam, setShowGradCam] = useState(true);

  // Condition metadata
  const conditionMeta = {
    CN: {
      label: 'Cognitively Normal (CN)',
      subtitle: 'Healthy Control · Intact Hippocampal Mass',
      riskScore: 14,
      riskLabel: 'Low Risk',
      riskColor: '#4A7C59',
      riskBg: '#EDF5F0',
      confidence: 94.8,
      hippoVol: '3.62 cm³',
      hippoDev: '+4.2% Normal',
      hippoPct: 15,
      ventVol: '24.1 mL',
      ventDev: 'Nominal Cavity',
      ventPct: 12,
      entorThick: '2.84 mm',
      entorDev: 'Intact Cortex',
      entorPct: 10,
      focalTarget: 'Bilateral Hippocampal Integrity Confirmed',
    },
    MCI: {
      label: 'Mild Cognitive Impairment (MCI)',
      subtitle: 'Prodromal Phase · Early Medial Temporal Changes',
      riskScore: 56,
      riskLabel: 'Moderate Alert',
      riskColor: '#B87326',
      riskBg: '#FAF3E8',
      confidence: 86.4,
      hippoVol: '3.08 cm³',
      hippoDev: '-12.8% Atrophy',
      hippoPct: 52,
      ventVol: '36.4 mL',
      ventDev: '+18.5% Enlargement',
      ventPct: 46,
      entorThick: '2.38 mm',
      entorDev: '-11.2% Thinning',
      entorPct: 48,
      focalTarget: 'Early Entorhinal Degradation & Asymmetry',
    },
    AD: {
      label: "Alzheimer's Disease (AD)",
      subtitle: 'Clinical Neurodegeneration · Severe Volumetric Deficit',
      riskScore: 88,
      riskLabel: 'Critical Flag',
      riskColor: '#7A1F2B',
      riskBg: '#F8EAED',
      confidence: 93.2,
      hippoVol: '2.44 cm³',
      hippoDev: '-28.4% Severe Atrophy',
      hippoPct: 88,
      ventVol: '49.8 mL',
      ventDev: '+44.2% Hydrocephalus ex-vacuo',
      ventPct: 82,
      entorThick: '1.92 mm',
      entorDev: '-27.6% Profound Thinning',
      entorPct: 86,
      focalTarget: 'Severe Hippocampal Collapse & Ventriculomegaly',
    },
  };

  const meta = conditionMeta[selectedCondition];

  // Slice image paths
  const sliceSrc = `/assets/mri/${selectedView}_${selectedCondition}_50.jpg`;
  const fallbackSrc = `/assets/mri/${selectedView}_50.jpg`;

  return (
    <div className="bg-[#161314] text-white rounded-3xl p-6 lg:p-8 border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Subtle background glow */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full filter blur-[120px] pointer-events-none opacity-25"
        style={{ backgroundColor: meta.riskColor }}
      />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#7A1F2B]/40 text-[#E8A3AC] border border-[#7A1F2B]">
              PACS Clinical Volumetric Workstation
            </span>
            <span className="text-xs text-white/40 font-mono">DICOM 3.0 · T1w MPRAGE</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Live 3D Volumetric MRI & Grad-CAM Telemetry
          </h3>
        </div>

        {/* Condition selector tabs */}
        <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10">
          {(['CN', 'MCI', 'AD']).map((cond) => {
            const isSelected = selectedCondition === cond;
            const cMeta = conditionMeta[cond];
            return (
              <button
                key={cond}
                type="button"
                onClick={() => setSelectedCondition(cond)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-white text-[#22201F] shadow-lg shadow-black/40'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cMeta.riskColor }}
                />
                <span>{cond}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-center">
        
        {/* Left 7 Cols: MRI Scan Viewport & Crosshair HUD */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square max-w-[460px] mx-auto rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl flex items-center justify-center group">
            
            {/* DICOM Info Overlay */}
            <div className="absolute top-3 left-3 z-20 text-[10px] font-mono text-emerald-400/90 leading-tight pointer-events-none drop-shadow">
              <div>SERIES: 3D T1-ISO 1.0mm</div>
              <div>MATRIX: 256 x 256 x 176</div>
              <div>PLANE: {selectedView.toUpperCase()}</div>
              <div>SLICE: 88 / 176</div>
            </div>

            <div className="absolute top-3 right-3 z-20 text-[10px] font-mono text-white/60 text-right pointer-events-none drop-shadow">
              <div style={{ color: meta.riskColor }} className="font-bold">
                {selectedCondition} · {meta.confidence}% CONF
              </div>
              <div>FOV: 240 mm</div>
              <div>TR: 2300ms / TE: 2.9ms</div>
            </div>

            {/* Base MRI Image */}
            <img
              src={sliceSrc}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackSrc;
              }}
              alt={`Brain MRI ${selectedView} plane`}
              className="w-full h-full object-contain filter contrast-[1.12] brightness-[1.05]"
            />

            {/* Grad-CAM Attention Heatmap Overlay */}
            {showGradCam && (
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300 mix-blend-screen"
                style={{
                  background: selectedCondition === 'AD'
                    ? 'radial-gradient(ellipse 35% 25% at 52% 56%, rgba(220, 38, 38, 0.75) 0%, rgba(245, 158, 11, 0.5) 45%, rgba(16, 185, 129, 0.2) 75%, transparent 100%)'
                    : selectedCondition === 'MCI'
                    ? 'radial-gradient(ellipse 30% 22% at 50% 55%, rgba(245, 158, 11, 0.65) 0%, rgba(16, 185, 129, 0.35) 60%, transparent 100%)'
                    : 'radial-gradient(ellipse 20% 18% at 50% 54%, rgba(16, 185, 129, 0.35) 0%, transparent 80%)'
                }}
              />
            )}

            {/* Crosshair lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-400/50" />
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400/50" />
            </div>

            {/* Bottom HUD Bar */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-[11px] font-mono bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-white/70">{meta.focalTarget}</span>
              <span className="text-emerald-400 font-bold">Grad-CAM v3.2</span>
            </div>
          </div>

          {/* Plane & Overlay Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Plane Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
              {(['axial', 'coronal', 'sagittal']).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSelectedView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    selectedView === v
                      ? 'bg-[#7A1F2B] text-white shadow'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Grad-CAM Toggle Button */}
            <button
              type="button"
              onClick={() => setShowGradCam(!showGradCam)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                showGradCam
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              <FiEye className="w-3.5 h-3.5" />
              <span>{showGradCam ? 'Grad-CAM: ACTIVE' : 'Grad-CAM: HIDDEN'}</span>
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Volumetric Biomarkers & Risk Telemetry */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Diagnosis Card */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-wider text-white/50">
                Inference Classification
              </span>
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ color: meta.riskColor, backgroundColor: meta.riskBg }}
              >
                {meta.riskLabel}
              </span>
            </div>

            <div>
              <h4 className="text-xl font-serif font-bold text-white">
                {meta.label}
              </h4>
              <p className="text-xs text-white/60 mt-0.5">{meta.subtitle}</p>
            </div>

            {/* Risk Index Meter */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/70">Clinical Dementia Risk Index</span>
                <span className="font-mono font-bold" style={{ color: meta.riskColor }}>
                  {meta.riskScore} / 100
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${meta.riskScore}%`, backgroundColor: meta.riskColor }}
                />
              </div>
            </div>
          </div>

          {/* Biomarkers Breakdown */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <FiActivity className="w-3.5 h-3.5 text-[#7A1F2B]" />
              <span>Volumetric Morphometry Biomarkers</span>
            </h5>

            {/* Biomarker 1: Hippocampus */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Hippocampal Volume Index</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{meta.hippoVol}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-white/70 bg-white/10">
                    {meta.hippoDev}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${meta.hippoPct}%`, backgroundColor: meta.riskColor }}
                />
              </div>
            </div>

            {/* Biomarker 2: Ventricles */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Lateral Ventricle Caliber</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{meta.ventVol}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-white/70 bg-white/10">
                    {meta.ventDev}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${meta.ventPct}%`, backgroundColor: meta.riskColor }}
                />
              </div>
            </div>

            {/* Biomarker 3: Entorhinal Ribbon */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Entorhinal Cortical Ribbon</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white">{meta.entorThick}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-white/70 bg-white/10">
                    {meta.entorDev}
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${meta.entorPct}%`, backgroundColor: meta.riskColor }}
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

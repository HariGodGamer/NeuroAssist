import React, { useState, useEffect } from 'react';
import { 
  FiUploadCloud, 
  FiSliders, 
  FiScissors, 
  FiMaximize, 
  FiBarChart2, 
  FiCpu, 
  FiFileText, 
  FiCheckCircle, 
  FiPlay, 
  FiPause,
  FiArrowRight
} from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';

export default function PipelineStageExplorer() {
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const stages = [
    {
      id: '01',
      title: 'DICOM & NIfTI Ingestion',
      subtitle: 'Multi-slice 3D Series Validation',
      icon: FiUploadCloud,
      duration: '180ms',
      tensor: '256 × 256 × 176 (T1-w)',
      category: 'Input Verification',
      color: '#5B7C99',
      description: 'Ingests clinical DICOM directory or compressed NIfTI (.nii.gz) files. Parses patient metadata, slice thickness, voxel spacing, and verifies structural T1-weighted orientation.',
      highlights: [
        'Automatic orientation check (RAS/LAS)',
        'Voxel dimension extraction (1.0mm isotropic)',
        'Anonymization & HIPAA metadata cleaning'
      ]
    },
    {
      id: '02',
      title: 'N4 Bias Field Correction',
      subtitle: 'RF Inhomogeneity Removal',
      icon: FiSliders,
      duration: '420ms',
      tensor: 'Intensity corrected 3D grid',
      category: 'Artifact Correction',
      color: '#B87326',
      description: 'Applies SimpleITK N4ITK non-parametric non-uniform intensity normalization to eliminate low-frequency radiofrequency coil artifacts across the volumetric brain field.',
      highlights: [
        'SimpleITK N4BiasFieldCorrectionImageFilter',
        '4-level multi-resolution B-spline fitting',
        'Noise suppression & intra-tissue homogenization'
      ]
    },
    {
      id: '03',
      title: 'Skull Stripping (BET)',
      subtitle: 'Non-Brain Tissue Extraction',
      icon: FiScissors,
      duration: '310ms',
      tensor: 'Parenchyma Mask Applied',
      category: 'Segmentation',
      color: '#7A1F2B',
      description: 'Isolates the cerebral parenchyma from extraneous non-brain structures including skull bone, dura mater, scalp, optic nerves, and orbital fat layers.',
      highlights: [
        'Otsu dynamic thresholding + Morphological closing',
        'Brain tissue mask extraction',
        'Elimination of ocular and skull signal noise'
      ]
    },
    {
      id: '04',
      title: 'MNI152 Spatial Alignment',
      subtitle: 'Stereotaxic Affine Registration',
      icon: FiMaximize,
      duration: '520ms',
      tensor: '1.0mm MNI152 Space',
      category: 'Registration',
      color: '#4A7C59',
      description: 'Warps and affinely registers patient brain coordinates to the standardized MNI152 (Montreal Neurological Institute) stereotaxic anatomical atlas for cross-cohort consistency.',
      highlights: [
        '12-parameter affine linear transformation',
        'Standardized stereotaxic alignment',
        'Exact anatomical ROI spatial mapping'
      ]
    },
    {
      id: '05',
      title: 'Intensity Z-Score Scaling',
      subtitle: 'Statistical Dynamic Range Norm',
      icon: FiBarChart2,
      duration: '90ms',
      tensor: 'Zero-mean Unit-variance [0, 1]',
      category: 'Normalization',
      color: '#B87326',
      description: 'Scales voxel intensities across white matter and gray matter to zero-mean and unit variance, clipping 99.5th percentile outliers to maximize deep neural feature sensitivity.',
      highlights: [
        'Z-score: (x - μ) / σ calibration',
        'Robust min-max [0.0, 1.0] tensor clamp',
        'Outlier percentile clipping'
      ]
    },
    {
      id: '06',
      title: '3D ResNet-10 Deep Extraction',
      subtitle: 'MedicalNet 3D Transfer Learning',
      icon: FiCpu,
      duration: '640ms',
      tensor: '1 × 1 × 96 × 112 × 96 → 3-Class Probs',
      category: 'Neural Inference',
      color: '#7A1F2B',
      description: 'Feeds the volumetric 3D tensor into a 3D Residual Network (MedicalNet ResNet-10) pretrained on 23 medical volumetric datasets to extract spatio-temporal hippocampal biomarkers.',
      highlights: [
        '3D Convolutional filters with residual skips',
        'Multi-class Softmax: CN / MCI / AD probabilities',
        'Sub-second GPU inference via PyTorch LibTorch'
      ]
    },
    {
      id: '07',
      title: 'Grad-CAM 3D & Clinical PDF',
      subtitle: 'Explainable AI & Report Generation',
      icon: FiFileText,
      duration: '220ms',
      tensor: '3D Activation Heatmap + PDF',
      category: 'Clinical Output',
      color: '#4A7C59',
      description: 'Calculates gradient-weighted class activation maps (Grad-CAM) at the final convolutional layer, highlighting anatomical focus areas and auto-compiling a signed ReportLab PDF.',
      highlights: [
        'Hippocampal & ventricular attention heatmaps',
        'Multi-planar Axial / Coronal / Sagittal overlays',
        'Automated DICOM-compliant Clinical PDF'
      ]
    },
  ];

  // Auto-play slideshow timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, stages.length]);

  const current = stages[activeStage];
  const Icon = current.icon;

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B] flex items-center gap-1.5 mb-1">
            <LuBrain className="w-4 h-4" />
            <span>End-to-End Clinical Processing</span>
          </span>
          <h3 className="text-2xl font-serif font-bold text-[#22201F]">
            7-Stage SimpleITK & 3D ResNet-10 Pipeline
          </h3>
        </div>

        {/* Play / Pause Autoplay */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E8E2DA] shadow-clinical-sm hover:bg-[#FAF6F3] text-[#5A5550] flex items-center gap-2 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <FiPause className="w-3.5 h-3.5 text-[#7A1F2B]" />
                <span>Pause Auto-Tour</span>
              </>
            ) : (
              <>
                <FiPlay className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span>Resume Tour</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stage Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((stage, idx) => {
          const isCurrent = activeStage === idx;
          const StageIcon = stage.icon;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                setActiveStage(idx);
                setIsPlaying(false);
              }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                isCurrent
                  ? 'bg-white border-[#7A1F2B] shadow-clinical-md ring-2 ring-[#7A1F2B]/10'
                  : 'bg-white/60 border-[#E8E2DA] hover:bg-white hover:border-[#D8C9BC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-[#7A1F2B]' : 'text-[#A39E98]'}`}>
                  {stage.id}
                </span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: isCurrent ? `${stage.color}15` : '#FAF6F3',
                    color: isCurrent ? stage.color : '#7A756F',
                  }}
                >
                  <StageIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <span className={`text-xs font-bold block leading-tight truncate ${isCurrent ? 'text-[#22201F]' : 'text-[#7A756F]'}`}>
                  {stage.title}
                </span>
                <span className="text-[10px] text-[#A39E98] block mt-0.5">{stage.duration}</span>
              </div>

              {isCurrent && (
                <div
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed Showcase Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2DA] shadow-clinical-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left 7 Cols: Description & Highlights */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${current.color}15`, color: current.color }}
            >
              Stage {current.id} · {current.category}
            </span>
            <span className="text-xs text-[#7A756F] font-mono">
              Latency: <strong>{current.duration}</strong>
            </span>
          </div>

          <div>
            <h4 className="text-2xl font-serif font-bold text-[#22201F]">
              {current.title}
            </h4>
            <p className="text-xs text-[#7A756F] font-medium mt-0.5">{current.subtitle}</p>
          </div>

          <p className="text-sm text-[#5A5550] leading-relaxed">
            {current.description}
          </p>

          {/* Highlights checklist */}
          <div className="space-y-2 pt-2">
            {current.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-[#22201F]">
                <FiCheckCircle className="w-4 h-4 text-[#4A7C59] shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Visual Data Spec Box */}
        <div className="lg:col-span-5 bg-[#FAF6F3] p-5 sm:p-6 rounded-2xl border border-[#E8E2DA] space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: current.color, color: '#FFFFFF' }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A39E98]">
                Tensor Output Spec
              </span>
              <div className="text-sm font-mono font-bold text-[#22201F]">
                {current.tensor}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E8E2DA] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#7A756F]">
              <span>Pipeline Position</span>
              <strong className="text-[#22201F]">Step {activeStage + 1} of 7</strong>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E8E2DA] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((activeStage + 1) / 7) * 100}%`,
                  backgroundColor: current.color,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveStage((prev) => (prev > 0 ? prev - 1 : stages.length - 1));
                setIsPlaying(false);
              }}
              className="text-xs font-semibold text-[#7A756F] hover:text-[#22201F] cursor-pointer"
            >
              ← Previous Stage
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveStage((prev) => (prev + 1) % stages.length);
                setIsPlaying(false);
              }}
              className="text-xs font-bold text-[#7A1F2B] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Next Stage</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { FiCheck, FiCpu, FiLayers, FiMinimize2, FiSliders, FiSun, FiTarget } from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';

const STAGES = [
  {
    step: 1,
    title: 'Raw MRI',
    subtitle: 'Format Standardization',
    desc: 'Validates T1 MPRAGE DICOM / NIfTI volumetric header and voxel spacing.',
    icon: FiLayers,
  },
  {
    step: 2,
    title: 'N4 Bias Correction',
    subtitle: 'Field Homogeneity',
    desc: 'Corrects low-frequency B1 RF coil inhomogeneities across brain tissues.',
    icon: FiSun,
  },
  {
    step: 3,
    title: 'Denoising',
    subtitle: 'Noise Reduction',
    desc: 'Anisotropic non-local means filter to suppress scanner acquisition noise.',
    icon: FiSliders,
  },
  {
    step: 4,
    title: 'Skull Stripping',
    subtitle: 'Non-Brain Removal',
    desc: 'Isolates cerebral parenchyma and cerebellar tissue from dura and calvarium.',
    icon: FiMinimize2,
  },
  {
    step: 5,
    title: 'MNI152 Registration',
    subtitle: 'Template Alignment',
    desc: 'Affine registration to standardized 1mm isotropic MNI152 stereotaxic space.',
    icon: FiTarget,
  },
  {
    step: 6,
    title: 'Intensity Norm',
    subtitle: 'Standardize Range',
    desc: 'Min-Max percentile scaling [0.0, 1.0] to normalize voxel intensity curves.',
    icon: FiSliders,
  },
  {
    step: 7,
    title: 'Resampling (128³)',
    subtitle: 'Standard 3D Tensor',
    desc: 'Uniform cubic voxel grid (128x128x128) prepared for 3D CNN input.',
    icon: FiCpu,
  },
];

export default function SevenStageStepper({ currentStep = 7, isProcessing = false }) {
  return (
    <div className="clinical-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-[#E8E2DA]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F2B] bg-[#F8EAED] px-2.5 py-0.5 rounded-full border border-[#ECC8CF]">
            Medical Preprocessing Standard
          </span>
          <h3 className="text-lg font-serif font-bold text-[#22201F] mt-1">
            7-Stage Medical Preprocessing Pipeline
          </h3>
        </div>
        <div className="text-xs text-[#7A756F] flex items-center gap-2 font-medium">
          <span>Target Tensor: <strong className="font-mono text-[#22201F]">128³ 3D Matrix</strong></span>
          <span className="text-[#A39E98]">|</span>
          <span>Latency: <strong className="text-[#4A7C59]">~1.4s</strong></span>
        </div>
      </div>

      {/* Horizontal Step Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isComplete = currentStep > stage.step || (currentStep === 7 && !isProcessing);
          const isCurrent = currentStep === stage.step && isProcessing;

          return (
            <div
              key={stage.step}
              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isComplete
                  ? 'bg-white border-[#CFE3D5] shadow-clinical-sm'
                  : isCurrent
                  ? 'bg-[#F8EAED] border-[#7A1F2B] ring-1 ring-[#7A1F2B]'
                  : 'bg-[#FAF6F3] border-[#E8E2DA] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isComplete
                      ? 'bg-[#EDF5F0] text-[#4A7C59] border border-[#CFE3D5]'
                      : isCurrent
                      ? 'bg-[#7A1F2B] text-white'
                      : 'bg-white text-[#A39E98] border border-[#E8E2DA]'
                  }`}>
                    {isComplete ? <FiCheck className="w-3.5 h-3.5" /> : stage.step}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#7A1F2B]' : 'text-[#A39E98]'}`} />
                </div>

                <h4 className="text-xs font-bold text-[#22201F] leading-tight">
                  {stage.title}
                </h4>
                <span className="text-[10px] text-[#7A756F] font-medium block mt-0.5">
                  {stage.subtitle}
                </span>
              </div>

              <p className="text-[10px] text-[#A39E98] leading-tight mt-2 line-clamp-2">
                {stage.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Model Ready Outcome Bar */}
      <div className="mt-5 pt-4 border-t border-[#F0EBE5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[#FAF6F3] p-3 rounded-xl border border-[#E8E2DA]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7A1F2B] text-white flex items-center justify-center shadow-sm">
            <LuBrain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[#22201F] block">
              MedicalNet 3D ResNet-10 Inference Ready
            </span>
            <span className="text-[11px] text-[#7A756F]">
              Transfer learned from 23 diverse medical datasets (87.0% CN/AD AUC 0.9231)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF5F0] text-[#2E523A] border border-[#CFE3D5]">
            SimpleITK Ready
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F7FA] text-[#5B7C99] border border-[#CFDEEB]">
            1mm Isotropic
          </span>
        </div>
      </div>
    </div>
  );
}

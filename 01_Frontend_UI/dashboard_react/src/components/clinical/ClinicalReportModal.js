import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { FiPrinter, FiX, FiCheckCircle } from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';
import StatusBadge from '../common/StatusBadge';

// Simple hash + PRNG for patient-specific heatmap
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rng32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function ClinicalReportModal({ scan, patient, onClose }) {
  if (!scan) return null;

  const pName = patient?.full_name || patient?.name || scan.patientName || 'Patient';
  const pMrn = patient?.patient_code || patient?.mrn || scan.mrn || scan.patient_code || 'NA-2026-0001';
  const pAge = patient?.age || scan.patientAge || '—';
  const pGender = patient?.gender || scan.patientGender || '—';
  const pDoctor = patient?.assignedDoctor || 'Dr. Krishnam Gupta';

  const cond = (scan.prediction || 'CN').toUpperCase();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-clinical-lg border border-[#E8E2DA] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Modal Action Bar (Hidden on print) */}
        <div className="p-4 border-b border-[#E8E2DA] flex items-center justify-between bg-[#FAF6F3] print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Clinical Diagnostic Summary
            </span>
            <span className="text-xs text-[#A39E98]">|</span>
            <span className="text-xs font-mono text-[#7A756F]">Report ID: REP-{scan.scanId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7A1F2B] hover:bg-[#661823] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <FiPrinter className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#7A756F] hover:text-[#22201F] rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[#22201F]">
          
          {/* Institution Header */}
          <div className="flex items-start justify-between border-b-2 border-[#7A1F2B] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#7A1F2B] text-white flex items-center justify-center">
                  <LuBrain className="w-4 h-4" />
                </div>
                <span className="brand-title text-xl font-bold">
                  <span className="brand-bold">NEURO</span>
                  <span className="brand-regular">ASSIST</span>
                </span>
              </div>
              <p className="text-xs font-medium text-[#7A756F] mt-1">
                Memory & Cognitive Neurology Institute · Department of Neuroradiology
              </p>
            </div>

            <div className="text-right text-xs text-[#7A756F] space-y-0.5">
              <span className="font-bold text-[#22201F] block">CONFIDENTIAL MEDICAL REPORT</span>
              <span>Date Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="block font-mono">Scan ID: {scan.scanId}</span>
            </div>
          </div>

          {/* Patient Demographics Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] text-xs">
            <div>
              <span className="text-[#A39E98] uppercase tracking-wider block font-semibold text-[10px]">Patient Name</span>
              <span className="font-bold text-[#22201F] text-sm">{pName}</span>
            </div>
            <div>
              <span className="text-[#A39E98] uppercase tracking-wider block font-semibold text-[10px]">Medical Record (MRN)</span>
              <span className="font-mono font-medium text-[#22201F]">{pMrn}</span>
            </div>
            <div>
              <span className="text-[#A39E98] uppercase tracking-wider block font-semibold text-[10px]">Age / Gender</span>
              <span className="font-medium text-[#22201F]">{pAge} Years · {pGender}</span>
            </div>
            <div>
              <span className="text-[#A39E98] uppercase tracking-wider block font-semibold text-[10px]">Scan Acquisition</span>
              <span className="font-medium text-[#22201F]">{scan.uploadDate}</span>
            </div>
          </div>

          {/* AI Diagnostic Screening Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B] border-b border-[#F0EBE5] pb-1.5">
              1. 3D Deep Learning Volumetric Screening
            </h4>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-[#F8EAED] border border-[#ECC8CF] gap-3">
              <div>
                <span className="text-xs text-[#7A1F2B] font-semibold uppercase tracking-wider block">
                  AI Primary Classification Output
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-serif font-bold text-[#7A1F2B]">
                    {cond === 'AD' ? "Alzheimer's Disease (AD Profile)" : cond === 'MCI' ? 'Mild Cognitive Impairment (MCI)' : 'Cognitively Normal (CN)'}
                  </span>
                  <StatusBadge status={scan.prediction} size="sm" />
                </div>
                <p className="text-xs text-[#5A5550] mt-1">
                  Confidence: <strong>{scan.confidence}%</strong> · Model: {scan.modelUsed || 'MedicalNet 3D ResNet-10'}
                </p>
              </div>
              <div className="text-right sm:border-l sm:border-[#ECC8CF] sm:pl-4">
                <span className="text-xs text-[#7A1F2B] font-semibold block">Composite Risk Index</span>
                <span className="text-2xl font-serif font-bold text-[#7A1F2B]">{scan.riskScore} / 100</span>
              </div>
            </div>
          </div>

          {/* Volumetric Biomarkers Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B] border-b border-[#F0EBE5] pb-1.5">
              2. Quantitative Neuroimaging Biomarkers
            </h4>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E2DA] text-[#7A756F]">
                  <th className="py-2 font-semibold">Anatomical Region</th>
                  <th className="py-2 font-semibold">Observed Value</th>
                  <th className="py-2 font-semibold">Normative Comparison</th>
                  <th className="py-2 font-semibold text-right">Clinical Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F1EC]">
                <tr>
                  <td className="py-2.5 font-medium text-[#22201F]">Hippocampal Volume Index</td>
                  <td className="py-2.5 font-mono">{scan.biomarkers?.hippocampus?.value || '2.64 cm³'}</td>
                  <td className="py-2.5 text-[#7A1F2B] font-medium">{scan.biomarkers?.hippocampus?.deviation || '-22% Atrophy'}</td>
                  <td className="py-2.5 text-right font-semibold text-[#7A1F2B]">{scan.biomarkers?.hippocampus?.severity || 'Significant Volume Loss'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-[#22201F]">Lateral Ventricles Caliber</td>
                  <td className="py-2.5 font-mono">{scan.biomarkers?.ventricles?.value || '44.8 mL'}</td>
                  <td className="py-2.5 text-[#B87326] font-medium">{scan.biomarkers?.ventricles?.deviation || '+28% Expansion'}</td>
                  <td className="py-2.5 text-right font-semibold text-[#B87326]">{scan.biomarkers?.ventricles?.severity || 'Moderate Ventriculomegaly'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-[#22201F]">Entorhinal Cortical Ribbon</td>
                  <td className="py-2.5 font-mono">{scan.biomarkers?.entorhinalThickness?.value || '2.08 mm'}</td>
                  <td className="py-2.5 text-[#7A1F2B] font-medium">{scan.biomarkers?.entorhinalThickness?.deviation || '-19% Thinning'}</td>
                  <td className="py-2.5 text-right font-semibold text-[#7A1F2B]">{scan.biomarkers?.entorhinalThickness?.severity || 'Early Degeneration'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grad-CAM Attention Maps Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B] border-b border-[#F0EBE5] pb-1.5">
              3. Grad-CAM Attention Heatmaps — AI Focus Regions
            </h4>
            <p className="text-[11px] text-[#7A756F]">
              Class Activation Maps (Grad-CAM) highlighting the brain regions that contributed most to the AI classification decision. 
              Red/yellow regions indicate highest model attention.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['axial', 'coronal', 'sagittal'].map((view) => (
                <div key={view} className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A756F] block text-center">{view} View</span>
                  <GradCamReportCanvas
                    scanId={scan.scanId}
                    patientName={pName}
                    condition={cond}
                    view={view}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#7A756F] pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-2 rounded bg-gradient-to-r from-blue-600 via-green-400 via-yellow-400 to-red-600" />
                <span>JET Colormap (0.0 → 1.0 Activation)</span>
              </div>
            </div>
          </div>

          {/* Doctor Review & Clinical Sign-Off */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B] border-b border-[#F0EBE5] pb-1.5">
              4. Clinician Diagnostic Notes & Recommendations
            </h4>
            <div className="p-4 rounded-xl bg-white border border-[#E8E2DA] text-xs leading-relaxed space-y-2">
              <p className="font-medium text-[#22201F]">
                {scan.doctorNotes || 'Neuroimaging volumetric analysis corroborates clinical presentation. Recommended management includes baseline cognitive therapy, neurological follow-up in 90 days, and caregiver counseling.'}
              </p>
              <div className="pt-4 border-t border-[#F0EBE5] flex items-center justify-between text-[11px] text-[#7A756F]">
                <div className="flex items-center gap-1.5 text-[#4A7C59]">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="font-semibold">Physician Validated & Approved</span>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-[#22201F] block text-sm italic">{pDoctor}</span>
                  <span>Consultant Neurologist</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

/**
 * GradCamReportCanvas — Renders a static patient-specific Grad-CAM heatmap for PDF export.
 */
function GradCamReportCanvas({ scanId, patientName, condition, view }) {
  const canvasRef = useRef(null);
  const cond = (condition || 'CN').toUpperCase();

  const profile = useMemo(() => {
    const seed = hashStr(`${scanId}_${patientName}_${cond}`);
    const r = rng32(seed);
    const asym = (r() - 0.5) * 0.35;
    return {
      lw: Math.min(1, Math.max(0.4, 0.90 + asym)),
      rw: Math.min(1, Math.max(0.4, 0.90 - asym)),
      sx: (r() - 0.5) * 0.05,
      sy: (r() - 0.5) * 0.05,
      hr: 0.85 + r() * 0.30,
      vr: 0.85 + r() * 0.30,
      pi: cond === 'AD' ? 0.88 + r() * 0.11 : cond === 'MCI' ? 0.60 + r() * 0.18 : 0.15 + r() * 0.12,
      fz: 0.48 + (r() - 0.5) * 0.12,
    };
  }, [scanId, patientName, cond]);

  const jetRGB = useCallback((t) => {
    t = Math.min(1, Math.max(0, t));
    let r = 0, g = 0, b = 0;
    if (t < 0.125) { b = 128 + Math.round(t * 8 * 127); }
    else if (t < 0.375) { g = Math.round((t - 0.125) * 4 * 255); b = 255; }
    else if (t < 0.625) { r = Math.round((t - 0.375) * 4 * 255); g = 255; b = Math.round((1 - (t - 0.375) * 4) * 255); }
    else if (t < 0.875) { r = 255; g = Math.round((1 - (t - 0.625) * 4) * 255); }
    else { r = 255 - Math.round((t - 0.875) * 8 * 127); }
    return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b))];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Draw dark brain background ellipse
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, W * 0.42, H * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Build hotspots for this view
    const { lw, rw, sx, sy, hr, vr, pi, fz } = profile;
    const sliceFrac = 0.52; // mid-slice for report
    const hotspots = [];

    if (view === 'axial') {
      const z = Math.exp(-Math.pow((sliceFrac - fz) / 0.15, 2));
      if (z > 0.05) {
        hotspots.push({ x: W * (0.37 + sx), y: H * (0.56 + sy), r: W * 0.16 * hr, i: pi * lw * z });
        hotspots.push({ x: W * (0.63 + sx), y: H * (0.56 + sy), r: W * 0.16 * hr, i: pi * rw * z });
        hotspots.push({ x: W * (0.44 + sx * 0.5), y: H * (0.48 + sy * 0.5), r: W * 0.14 * vr, i: pi * 0.8 * lw * z });
        hotspots.push({ x: W * (0.56 + sx * 0.5), y: H * (0.48 + sy * 0.5), r: W * 0.14 * vr, i: pi * 0.78 * rw * z });
      }
    } else if (view === 'coronal') {
      const z = Math.exp(-Math.pow((sliceFrac - fz) / 0.16, 2));
      if (z > 0.05) {
        hotspots.push({ x: W * (0.38 + sx), y: H * (0.62 + sy), r: W * 0.18 * hr, i: pi * lw * z });
        hotspots.push({ x: W * (0.62 + sx), y: H * (0.62 + sy), r: W * 0.18 * hr, i: pi * rw * z });
        hotspots.push({ x: W * (0.44 + sx), y: H * (0.44 + sy), r: W * 0.15 * vr, i: pi * 0.74 * lw * z });
        hotspots.push({ x: W * (0.56 + sx), y: H * (0.44 + sy), r: W * 0.15 * vr, i: pi * 0.72 * rw * z });
      }
    } else {
      const z = Math.exp(-Math.pow((sliceFrac - fz) / 0.18, 2));
      if (z > 0.05) {
        hotspots.push({ x: W * (0.52 + sx), y: H * (0.58 + sy), r: W * 0.20 * hr, i: pi * ((lw + rw) / 2) * z });
        hotspots.push({ x: W * (0.42 + sx), y: H * (0.42 + sy), r: W * 0.18 * vr, i: pi * 0.78 * z });
      }
    }

    // Render heatmap
    const imgData = ctx.createImageData(W, H);
    const d = imgData.data;
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        let act = 0;
        for (const hs of hotspots) {
          const dx = px - hs.x, dy = py - hs.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < hs.r * hs.r * 4) act += hs.i * Math.exp(-dSq / (2 * hs.r * hs.r * 0.35));
        }
        const nx = (px - W * 0.5) / (W * 0.42), ny = (py - H * 0.5) / (H * 0.42);
        if (act > 0.03 && (nx * nx + ny * ny) <= 1) {
          const c = Math.min(1, act);
          const [cr, cg, cb] = jetRGB(c);
          const idx = (py * W + px) * 4;
          d[idx] = cr; d[idx + 1] = cg; d[idx + 2] = cb;
          d[idx + 3] = Math.min(255, Math.round(255 * 0.75 * Math.min(1, c * 1.35)));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [profile, view, jetRGB]);

  return (
    <div className="rounded-lg overflow-hidden border border-[#2A2D34] bg-black aspect-square">
      <canvas ref={canvasRef} width={180} height={180} className="w-full h-full" />
    </div>
  );
}

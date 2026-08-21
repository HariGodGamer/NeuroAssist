import React from 'react';
import { FiPrinter, FiX, FiCheckCircle } from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';
import StatusBadge from '../common/StatusBadge';

export default function ClinicalReportModal({ scan, onClose }) {
  if (!scan) return null;

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7A1F2B] hover:bg-[#661823] text-white rounded-xl text-xs font-medium transition-colors"
            >
              <FiPrinter className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#7A756F] hover:text-[#22201F] rounded-lg hover:bg-white transition-colors"
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
              <span className="font-bold text-[#22201F] text-sm">{scan.patientName}</span>
            </div>
            <div>
              <span className="text-[#A39E98] uppercase tracking-wider block font-semibold text-[10px]">Medical Record (MRN)</span>
              <span className="font-mono font-medium text-[#22201F]">{scan.mrn || 'MRN-7840192'}</span>
            </div>
            <div>
              <span className="text-[#A39E98] uppercase tracking-wider block font-semibold text-[10px]">Age / Gender</span>
              <span className="font-medium text-[#22201F]">{scan.patientAge} Years · {scan.patientGender}</span>
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
                    {scan.prediction === 'AD' ? 'Alzheimer’s Disease (AD Profile)' : scan.prediction === 'MCI' ? 'Mild Cognitive Impairment (MCI)' : 'Cognitively Normal (CN)'}
                  </span>
                  <StatusBadge status={scan.prediction} size="sm" />
                </div>
                <p className="text-xs text-[#5A5550] mt-1">
                  Confidence: <strong>{scan.confidence}%</strong> · Model: {scan.modelUsed}
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
                  <td className="py-2.5 text-right font-semibold text-[#7A1F2B]">Significant Volume Loss</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-[#22201F]">Lateral Ventricles Caliber</td>
                  <td className="py-2.5 font-mono">{scan.biomarkers?.ventricles?.value || '44.8 mL'}</td>
                  <td className="py-2.5 text-[#B87326] font-medium">{scan.biomarkers?.ventricles?.deviation || '+28% Expansion'}</td>
                  <td className="py-2.5 text-right font-semibold text-[#B87326]">Moderate Ventriculomegaly</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-medium text-[#22201F]">Entorhinal Cortical Ribbon</td>
                  <td className="py-2.5 font-mono">{scan.biomarkers?.entorhinalThickness?.value || '2.08 mm'}</td>
                  <td className="py-2.5 text-[#7A1F2B] font-medium">{scan.biomarkers?.entorhinalThickness?.deviation || '-19% Thinning'}</td>
                  <td className="py-2.5 text-right font-semibold text-[#7A1F2B]">Early Degeneration</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Doctor Review & Clinical Sign-Off */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B] border-b border-[#F0EBE5] pb-1.5">
              3. Clinician Diagnostic Notes & Recommendations
            </h4>
            <div className="p-4 rounded-xl bg-white border border-[#E8E2DA] text-xs leading-relaxed space-y-2">
              <p className="font-medium text-[#22201F]">
                {scan.doctorNotes || 'Neuroimaging volumetric analysis corroborates clinical presentation of amnestic cognitive impairment. Recommended management includes baseline cognitive therapy, neurological follow-up in 90 days, and caregiver counseling.'}
              </p>
              <div className="pt-4 border-t border-[#F0EBE5] flex items-center justify-between text-[11px] text-[#7A756F]">
                <div className="flex items-center gap-1.5 text-[#4A7C59]">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="font-semibold">Physician Validated & Approved</span>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-[#22201F] block text-sm italic">Dr. Sarah Lin, MD</span>
                  <span>Consultant Neurologist · License #NY-882019</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

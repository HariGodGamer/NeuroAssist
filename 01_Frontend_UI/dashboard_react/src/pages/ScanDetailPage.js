import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import RiskGaugeArc from '../components/clinical/RiskGaugeArc';
import StatusBadge from '../components/common/StatusBadge';
import ClinicalReportModal from '../components/clinical/ClinicalReportModal';
import { generateScanData } from '../utils/mockDataGenerator';
import { 
  FiCheck,
  FiFlag, 
  FiEdit3, 
  FiPrinter, 
  FiArrowLeft, 
  FiShield, 
  FiCheckCircle,
  FiTrash2
} from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';

export default function ScanDetailPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const scansList = Array.isArray(state.scans) ? state.scans : [];
  const patientsList = Array.isArray(state.patients) ? state.patients : [];

  // Find target scan or generate deterministic seeded data for this scanId
  const rawScan = scansList.find(s => (s.scanId || s.scan_id_string || s.id) === scanId) || scansList[0];
  const targetScanId = rawScan?.scanId || rawScan?.scan_id_string || rawScan?.id || scanId || 'SCN-849201';

  // Generate deterministic seeded mock values for this scanId
  const seeded = useMemo(() => generateScanData(targetScanId), [targetScanId]);

  const scan = {
    scanId: targetScanId,
    scan_id_string: targetScanId,
    patientId: rawScan?.patientId || rawScan?.patient_id || '',
    patientName: rawScan?.patientName || rawScan?.patient || 'Patient Record',
    uploadDate: rawScan?.uploadDate || rawScan?.date || new Date().toISOString().split('T')[0],
    prediction: rawScan?.prediction || seeded.prediction,
    confidence: rawScan?.confidence || seeded.confidence,
    riskScore: rawScan?.riskScore || seeded.riskScore,
    doctorStatus: rawScan?.doctorStatus || 'pending',
    doctorNotes: rawScan?.doctorNotes || '',
    probabilities: rawScan?.probabilities || seeded.probabilities,
    biomarkers: rawScan?.biomarkers && Object.keys(rawScan.biomarkers).length > 0 ? rawScan.biomarkers : seeded.biomarkers,
    gradCamRegions: rawScan?.gradCamRegions || seeded.gradCamRegions,
  };

  const currentUser = state.auth?.user;
  const loggedInDoctor = currentUser?.full_name 
    ? (currentUser.full_name.startsWith('Dr.') ? currentUser.full_name : `Dr. ${currentUser.full_name}`)
    : 'Dr. Krishnam Gupta';

  const scanPId = scan.patientId || scan.patient_id;
  const scanPName = (scan.patientName || scan.patient || '').trim().toLowerCase();
  const scanMrn = (scan.patient_code || scan.mrn || '').trim().toLowerCase();

  const patient = patientsList.find((p) => {
    const pId = p.id || p._id;
    const pName = (p.full_name || p.name || '').trim().toLowerCase();
    const pMrn = (p.patient_code || p.mrn || '').trim().toLowerCase();
    if (scanPId && pId && scanPId === pId) return true;
    if (scanMrn && pMrn && scanMrn === pMrn) return true;
    if (scanPName && pName && scanPName === pName) return true;
    return false;
  }) || patientsList[0] || {
    id: scan.patientId || 'PT-0001',
    name: scan.patientName || 'Patient Record',
    full_name: scan.patientName || 'Patient Record',
    mrn: scan.patient_code || scan.mrn || 'NA-2026-0001',
    patient_code: scan.patient_code || scan.mrn || 'NA-2026-0001',
    age: scan.patientAge || 65,
    gender: scan.patientGender || 'Unknown',
    assignedDoctor: loggedInDoctor
  };

  const pName = patient.full_name || patient.name || scan.patientName || 'Patient Record';
  const pMrn = patient.patient_code || patient.mrn || 'NA-2026-0042';
  const pInitials = pName.split(' ').map(n => n[0]).join('').slice(0, 2) || 'PT';

  const [decisionNotes, setDecisionNotes] = useState(scan.doctorNotes || '');
  const [showReportModal, setShowReportModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleDecision = (status) => {
    dispatch({
      type: 'UPDATE_SCAN_DECISION',
      payload: {
        scanId: scan.scanId,
        status: status,
        notes: decisionNotes,
      }
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Biomarkers with region severity indicators and 0-100% horizontal bars
  const hippo = scan.biomarkers?.hippocampus || seeded.biomarkers.hippocampus;
  const vents = scan.biomarkers?.ventricles || seeded.biomarkers.ventricles;
  const entor = scan.biomarkers?.entorhinalThickness || seeded.biomarkers.entorhinalThickness;

  const biomarkerCards = [
    {
      name: 'Hippocampal Volume Index',
      val: hippo?.value || '2.64 cm³',
      dev: hippo?.deviation || '-22% vs Norm',
      badge: hippo?.severity || 'Significant Atrophy',
      severityPct: hippo?.severityPct ?? (scan.prediction === 'AD' ? 78 : scan.prediction === 'MCI' ? 45 : 15),
      color: hippo?.status === 'high' || scan.prediction === 'AD' ? '#7A1F2B' : hippo?.status === 'medium' || scan.prediction === 'MCI' ? '#B87326' : '#4A7C59',
      bg: hippo?.status === 'high' || scan.prediction === 'AD' ? '#F8EAED' : hippo?.status === 'medium' || scan.prediction === 'MCI' ? '#FAF3E8' : '#EDF5F0',
      normRange: 'Normal: > 3.40 cm³'
    },
    {
      name: 'Lateral Ventricles Caliber',
      val: vents?.value || '44.8 mL',
      dev: vents?.deviation || '+28% Volume Expansion',
      badge: vents?.severity || 'Moderate Dilation',
      severityPct: vents?.severityPct ?? (scan.prediction === 'AD' ? 72 : scan.prediction === 'MCI' ? 40 : 12),
      color: vents?.status === 'high' || scan.prediction === 'AD' ? '#7A1F2B' : vents?.status === 'medium' || scan.prediction === 'MCI' ? '#B87326' : '#4A7C59',
      bg: vents?.status === 'high' || scan.prediction === 'AD' ? '#F8EAED' : vents?.status === 'medium' || scan.prediction === 'MCI' ? '#FAF3E8' : '#EDF5F0',
      normRange: 'Normal: < 32.0 mL'
    },
    {
      name: 'Entorhinal Cortical Ribbon',
      val: entor?.value || '2.08 mm',
      dev: entor?.deviation || '-19% Thinning',
      badge: entor?.severity || 'Early Degeneration',
      severityPct: entor?.severityPct ?? (scan.prediction === 'AD' ? 82 : scan.prediction === 'MCI' ? 48 : 10),
      color: entor?.status === 'high' || scan.prediction === 'AD' ? '#7A1F2B' : entor?.status === 'medium' || scan.prediction === 'MCI' ? '#B87326' : '#4A7C59',
      bg: entor?.status === 'high' || scan.prediction === 'AD' ? '#F8EAED' : entor?.status === 'medium' || scan.prediction === 'MCI' ? '#FAF3E8' : '#EDF5F0',
      normRange: 'Normal: > 2.65 mm'
    },
  ];

  const handleDeleteScan = () => {
    if (window.confirm(`Are you sure you want to delete scan record ${scan.scanId}?`)) {
      dispatch({ type: 'DELETE_SCAN', payload: scan.scanId });
      navigate('/dashboard');
    }
  };

  return (
    <DashboardLayout
      title={`Diagnostic Examination: ${pName}`}
      subtitle={`Volumetric Series ${scan.scanId} · Acquired ${scan.uploadDate}`}
      action={
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="btn-outline text-xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </Link>
          <button
            type="button"
            onClick={handleDeleteScan}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#7A1F2B] bg-[#F8EAED] border border-[#ECC8CF] hover:bg-[#F0D5DA] transition-colors flex items-center gap-1.5"
            title="Delete this scan record"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span>Delete Scan</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn-maroon text-xs shadow-clinical-sm"
          >
            <FiPrinter className="w-3.5 h-3.5" />
            <span>Generate Clinical PDF</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Patient Demographic Summary Strip */}
        <div className="clinical-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] flex items-center justify-center text-[#7A1F2B] font-serif font-bold text-sm">
              {pInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link to={`/dashboard/patients/${patient.id || patient._id || 'P-001'}`} className="font-bold text-[#22201F] text-sm hover:underline">
                  {pName}
                </Link>
                <span className="font-mono text-[11px] text-[#A39E98]">({pMrn})</span>
              </div>
              <span className="text-[#7A756F] text-[11px]">
                Age: <strong>{patient.age || scan.patientAge || '—'} Yrs</strong> · Gender: <strong>{patient.gender || scan.patientGender || '—'}</strong> · Assigned: <strong>{patient.assignedDoctor || loggedInDoctor}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-[#A39E98]">AI Classification</span>
              <StatusBadge status={scan.prediction} size="sm" />
            </div>
            <div className="flex flex-col text-right pl-3 border-l border-[#E8E2DA]">
              <span className="text-[10px] uppercase font-bold text-[#A39E98]">Confidence</span>
              <span className="font-serif font-bold text-[#7A1F2B] text-base">{scan.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Core Layout: Diagnostic Indicators & Doctor Sign-off Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left 6 Cols: Risk Gauge & Volumetric Biomarkers */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Risk Gauge Arc */}
            <RiskGaugeArc
              score={scan.riskScore}
              probabilities={scan.probabilities}
              prediction={scan.prediction}
              confidence={scan.confidence}
            />

            {/* Volumetric Biomarkers Telemetry Cards with Severity Indicators & Horizontal Bars */}
            <div className="clinical-card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2DA]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A756F]">
                  Volumetric Biomarker Indicators
                </h4>
                <span className="text-[10px] font-mono text-[#A39E98]">SimpleITK v2.3</span>
              </div>

              <div className="space-y-3">
                {biomarkerCards.map((bio, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] text-xs space-y-2">
                    {/* Header: Dot + Name + Value */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                          style={{ backgroundColor: bio.color }}
                        />
                        <span className="font-semibold text-[#22201F]">{bio.name}</span>
                      </div>
                      <span className="font-mono font-bold text-[#22201F]">{bio.val}</span>
                    </div>

                    {/* Deviation & Badge row */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7A756F]">{bio.dev}</span>
                      <span
                        className="px-2 py-0.5 rounded-full font-semibold border"
                        style={{ color: bio.color, backgroundColor: bio.bg, borderColor: bio.color + '40' }}
                      >
                        {bio.badge}
                      </span>
                    </div>

                    {/* Severity Scale Horizontal Bar */}
                    <div className="space-y-1 pt-1 border-t border-[#F0E8E1]">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#A39E98]">{bio.normRange}</span>
                        <span className="font-mono font-bold" style={{ color: bio.color }}>
                          Severity: {bio.severityPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E8E2DA] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${bio.severityPct}%`, backgroundColor: bio.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right 6 Cols: Doctor Decision Panel & Patient Metadata */}
          <div className="lg:col-span-6 space-y-6">

            {/* Patient Clinical & Scan Metadata Overview */}
            <div className="clinical-card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E2DA]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A756F]">
                  Clinical Examination & Acquisition Details
                </h4>
                <span className="text-[10px] font-mono text-[#A39E98]">{scan.scanId}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA]">
                  <span className="text-[10px] uppercase font-bold text-[#A39E98] block">Patient Name</span>
                  <span className="font-bold text-[#22201F] text-sm">{pName}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA]">
                  <span className="text-[10px] uppercase font-bold text-[#A39E98] block">Medical Record #</span>
                  <span className="font-mono font-bold text-[#22201F]">{pMrn}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA]">
                  <span className="text-[10px] uppercase font-bold text-[#A39E98] block">Demographics</span>
                  <span className="font-semibold text-[#22201F]">{patient.age || scan.patientAge || '65'} Yrs · {patient.gender || scan.patientGender || 'Female'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA]">
                  <span className="text-[10px] uppercase font-bold text-[#A39E98] block">Acquisition Date</span>
                  <span className="font-semibold text-[#22201F]">{scan.uploadDate}</span>
                </div>
              </div>
            </div>

            {/* Doctor Decision Panel (Accept / Flag / Override) */}
            <div className="clinical-card p-5 bg-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F2B] bg-[#F8EAED] px-2 py-0.5 rounded-full border border-[#ECC8CF]">
                    Doctor Decision Panel
                  </span>
                  <h4 className="text-sm font-serif font-bold text-[#22201F] mt-1">
                    Physician Validation & Sign-Off
                  </h4>
                </div>
                <div className="text-[10px] font-semibold text-[#4A7C59] flex items-center gap-1">
                  <FiShield className="w-3.5 h-3.5" />
                  <span>Final Authority</span>
                </div>
              </div>

              {/* Three Doctor Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDecision('accepted')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                    scan.doctorStatus === 'accepted'
                      ? 'bg-[#EDF5F0] text-[#2E523A] border-[#CFE3D5] shadow-clinical-sm'
                      : 'bg-white text-[#7A756F] border-[#E8E2DA] hover:bg-[#FAF6F3]'
                  }`}
                >
                  <FiCheck className="w-4 h-4 text-[#4A7C59]" />
                  <span>Accept AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision('flagged')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                    scan.doctorStatus === 'flagged'
                      ? 'bg-[#FAF3E8] text-[#8A5A14] border-[#F0DEC2] shadow-clinical-sm'
                      : 'bg-white text-[#7A756F] border-[#E8E2DA] hover:bg-[#FAF6F3]'
                  }`}
                >
                  <FiFlag className="w-4 h-4 text-[#B87326]" />
                  <span>Flag Case</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDecision('overridden')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all ${
                    scan.doctorStatus === 'overridden'
                      ? 'bg-[#F8EAED] text-[#7A1F2B] border-[#ECC8CF] shadow-clinical-sm'
                      : 'bg-white text-[#7A756F] border-[#E8E2DA] hover:bg-[#FAF6F3]'
                  }`}
                >
                  <FiEdit3 className="w-4 h-4 text-[#7A1F2B]" />
                  <span>Override</span>
                </button>
              </div>

              {/* Doctor Clinical Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F]">
                  Clinical Diagnosis Notes & Treatment Directives
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Enter clinical observations, differential diagnosis, and recommended cognitive follow-up..."
                  className="clinical-input resize-none text-xs leading-relaxed"
                />
              </div>

              {/* Save & Sign-off Button */}
              <button
                type="button"
                onClick={() => handleDecision(scan.doctorStatus || 'accepted')}
                className="w-full py-2.5 bg-[#7A1F2B] hover:bg-[#661823] text-white rounded-xl text-xs font-semibold transition-all shadow-clinical-sm flex items-center justify-center gap-2"
              >
                <FiCheckCircle className="w-4 h-4" />
                <span>Save Diagnostic Sign-Off</span>
              </button>

              {savedSuccess && (
                <div className="p-2.5 rounded-xl bg-[#EDF5F0] border border-[#CFE3D5] text-[#2E523A] text-xs flex items-center justify-center gap-2 animate-fade-in">
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Diagnostic sign-off and clinical notes recorded.</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Clinical Report PDF Export Modal */}
      {showReportModal && (
        <ClinicalReportModal
          scan={scan}
          patient={patient}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

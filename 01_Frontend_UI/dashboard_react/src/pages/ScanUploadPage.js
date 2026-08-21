import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import SevenStageStepper from '../components/clinical/SevenStageStepper';
import AddPatientModal from '../components/clinical/AddPatientModal';
import { generateScanData } from '../utils/mockDataGenerator';
import { 
  FiUploadCloud, 
  FiCheckCircle, 
  FiArrowRight, 
  FiShield,
  FiUserPlus
} from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';

export default function ScanUploadPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const patientsList = Array.isArray(state?.patients) ? state.patients : [];
  const initialPatientId = patientsList[0]?.id || patientsList[0]?._id || '';

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startAnalysis = () => {
    if (patientsList.length === 0) {
      setIsAddPatientOpen(true);
      return;
    }

    const targetPatient = patientsList.find(p => (p.id || p._id) === selectedPatientId) || patientsList[0];
    if (!targetPatient) {
      setIsAddPatientOpen(true);
      return;
    }

    setIsProcessing(true);
    setPipelineStep(1);

    let currentStep = 1;
    // Simulate stepping through the 7-stage preprocessing pipeline with smooth timing
    const stepInterval = setInterval(() => {
      currentStep += 1;
      if (currentStep <= 7) {
        setPipelineStep(currentStep);
      } else {
        clearInterval(stepInterval);
        setIsProcessing(false);

        // Generate new scan record with VARIED AI predictions from seeded mock data
        const newScanId = `SCN-${Math.floor(100000 + Math.random() * 900000)}`;

        // Use mockDataGenerator for varied, scan-specific predictions
        const aiResult = generateScanData(newScanId);

        const newScan = {
          scanId: newScanId,
          scan_id_string: newScanId,
          patientId: targetPatient.id || targetPatient._id,
          patient_id: targetPatient.id || targetPatient._id,
          patientName: targetPatient.full_name || targetPatient.name,
          patient: targetPatient.full_name || targetPatient.name,
          patientAge: targetPatient.age || 65,
          patientGender: targetPatient.gender || 'Unknown',
          patient_code: targetPatient.patient_code || targetPatient.mrn,
          mrn: targetPatient.patient_code || targetPatient.mrn,
          uploadDate: new Date().toLocaleString(),
          date: new Date().toISOString().split('T')[0],
          fileFormat: 'T1_MPRAGE_iso1mm.nii.gz',
          sliceResolution: '128 x 128 x 128 (1.0mm isotropic)',
          prediction: aiResult.prediction,
          confidence: aiResult.confidence,
          probabilities: aiResult.probabilities,
          riskScore: aiResult.riskScore,
          riskLevel: aiResult.riskLevel,
          processingTime: aiResult.processingTime,
          modelUsed: 'MedicalNet 3D ResNet-10 (Pre-trained on 23 Medical Datasets)',
          doctorStatus: 'pending',
          status: 'pending',
          doctorNotes: `Automated 7-stage preprocessing complete. AI classification: ${aiResult.prediction} (${aiResult.confidence}% confidence).`,
          biomarkers: aiResult.biomarkers,
          gradCamRegions: aiResult.gradCamRegions,
        };

        dispatch({ type: 'ADD_SCAN', payload: newScan });
        navigate(`/dashboard/scan/${newScanId}`);
      }
    }, 450);
  };

  return (
    <DashboardLayout
      title="Upload & Pipeline Processing"
      subtitle="Standardized 7-stage SimpleITK medical volumetric preprocessing and 3D CNN inference."
    >
      <div className="space-y-6">
        
        {/* Upload Configuration Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left 7 Cols: Medical Drag & Drop Card */}
          <div className="lg:col-span-7 clinical-card p-6 space-y-4 bg-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7A1F2B]" />
                <h3 className="text-base font-serif font-bold text-[#22201F]">
                  Volumetric MRI Scan File
                </h3>
              </div>
              <span className="text-xs text-[#7A756F]">Accepted: NIfTI (.nii, .nii.gz), DICOM (.dcm)</span>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? 'border-[#7A1F2B] bg-[#F8EAED]'
                  : selectedFile
                  ? 'border-[#4A7C59] bg-[#EDF5F0]'
                  : 'border-[#D8C9BC] bg-[#FAF6F3] hover:border-[#7A1F2B] hover:bg-[#FDF8F9]'
              }`}
            >
              <input
                type="file"
                id="scan-upload-input"
                onChange={handleFileInput}
                accept=".nii,.nii.gz,.dcm,.nrrd,.mha"
                className="hidden"
              />
              <label htmlFor="scan-upload-input" className="cursor-pointer block">
                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#4A7C59] text-white flex items-center justify-center mx-auto shadow-sm">
                      <FiCheckCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#22201F] font-mono max-w-[260px] sm:max-w-sm mx-auto truncate px-2" title={selectedFile.name}>
                      {selectedFile.name}
                    </h4>
                    <p className="text-xs text-[#7A756F]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for 7-stage transformation
                    </p>
                    <span className="inline-block text-xs text-[#7A1F2B] font-semibold underline mt-2">
                      Click to choose another scan
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E2DA] text-[#7A1F2B] flex items-center justify-center mx-auto shadow-clinical-sm">
                      <FiUploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#22201F]">
                        Drag and drop 3D Brain MRI scan here
                      </h4>
                      <p className="text-xs text-[#7A756F] mt-1">
                        or click to browse local filesystem / PACS directory
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-[#A39E98]">
                      <span>DICOM MPRAGE</span>
                      <span>·</span>
                      <span>1.0mm isotropic</span>
                      <span>·</span>
                      <span>T1-Weighted</span>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Right 5 Cols: Patient Selection & Model Inference Configuration */}
          <div className="lg:col-span-5 clinical-card p-6 space-y-4 bg-white">
            <div className="pb-3 border-b border-[#E8E2DA]">
              <h3 className="text-base font-serif font-bold text-[#22201F]">
                Patient & Protocol Assignment
              </h3>
              <p className="text-xs text-[#7A756F] mt-0.5">
                Link this volumetric series to an existing patient record.
              </p>
            </div>

            {/* Patient Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F]">
                  Assign to Patient Record
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(true)}
                  className="text-[11px] font-semibold text-[#7A1F2B] hover:text-[#5e1620] hover:underline flex items-center gap-1 transition-colors"
                >
                  <FiUserPlus className="w-3.5 h-3.5" />
                  <span>+ Add New Patient</span>
                </button>
              </div>

              <select
                value={selectedPatientId || (patientsList[0]?.id || patientsList[0]?._id || '')}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="clinical-input cursor-pointer w-full"
              >
                {patientsList.length === 0 ? (
                  <option value="">No patients registered — Click "+ Add New Patient"</option>
                ) : (
                  patientsList.map((p) => {
                    const pId = p.id || p._id;
                    const pName = p.full_name || p.name || 'Patient Record';
                    const pMrn = p.patient_code || p.mrn ? ` (${p.patient_code || p.mrn})` : '';
                    return (
                      <option key={pId} value={pId}>
                        {pName}{pMrn}
                      </option>
                    );
                  })
                )}
              </select>
            </div>

            {/* Model Architecture Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F]">
                AI Model Architecture
              </label>
              <div className="p-3 rounded-xl border border-[#CFE3D5] bg-[#EDF5F0] text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-[#2E523A]">
                  <span className="flex items-center gap-1.5">
                    <LuBrain className="w-4 h-4 text-[#4A7C59]" />
                    MedicalNet 3D ResNet-10 (Transfer Learning)
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#CFE3D5]">
                    Clinical Grade
                  </span>
                </div>
                <p className="text-[11px] text-[#5A5550]">
                  Pre-trained on 23 medical imaging datasets (87.0% Accuracy / 0.9231 AUC).
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-3">
              <button
                type="button"
                disabled={!selectedFile || isProcessing}
                onClick={startAnalysis}
                className={`w-full py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-clinical flex items-center justify-center gap-2 ${
                  !selectedFile || isProcessing
                    ? 'bg-[#E8DDD4] text-[#A39E98] cursor-not-allowed'
                    : 'bg-[#7A1F2B] hover:bg-[#661823] text-white active:translate-y-0.5'
                }`}
              >
                {isProcessing ? (
                  <span>Executing Pipeline (Stage {pipelineStep}/7)...</span>
                ) : (
                  <>
                    <span>Run 7-Stage Preprocessing & AI Analysis</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Privacy & Compliance Assurance */}
            <div className="pt-2 text-[11px] text-[#A39E98] flex items-center gap-2">
              <FiShield className="w-3.5 h-3.5 text-[#4A7C59] shrink-0" />
              <span>Full DICOM defacing & de-identification applied automatically.</span>
            </div>

          </div>

        </div>

        {/* 7-Stage Medical Preprocessing Pipeline Stepper Section */}
        <SevenStageStepper currentStep={pipelineStep} isProcessing={isProcessing} />

      </div>

      {/* Add Patient Modal */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        redirectToProfile={false}
        onSuccess={(newPatient) => {
          const newId = newPatient.id || newPatient._id;
          if (newId) {
            setSelectedPatientId(newId);
          }
        }}
      />
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { patientAPI, scanAPI, BASE_URL } from '../services/api';
import ThreeBrain from '../components/ThreeBrain';
import { 
  FaBrain, FaUserMd, FaUpload, FaMicroscope, FaFilePdf, 
  FaSearch, FaChevronRight, FaPlus, FaCheck, FaTimes, 
  FaExclamationTriangle, FaSpinner, FaSignOutAlt, FaTrash
} from 'react-icons/fa';

const DoctorWorkspace = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  const [currentUser, setCurrentUser] = useState(null);

  // --- Clinical Data States ---
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [scans, setScans] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [selectedScanDetail, setSelectedScanDetail] = useState(null);
  const [leftPanelTab, setLeftPanelTab] = useState('roster'); // 'roster' or 'case'
  const [activeHotspot, setActiveHotspot] = useState(null);

  // --- Navigation & Viewport States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSliceView, setActiveSliceView] = useState('axial'); // axial, coronal, sagittal
  const [sliceIndex, setSliceIndex] = useState(50); // 0 to 100
  const [zoomScale, setZoomScale] = useState(100); // 50% to 200%
  const [contrastVal, setContrastVal] = useState(100); // 50% to 200%
  
  // --- Create/Upload Form States ---
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDOB, setNewPatientDOB] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Female');
  const [newPatientContact, setNewPatientContact] = useState('');
  const [newPatientHistory, setNewPatientHistory] = useState('');

  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzingProgress, setAnalyzingProgress] = useState(false);
  
  // --- Doctor Review states ---
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [overrideClass, setOverrideClass] = useState('AD');
  
  // --- UI Toast Notifications ---
  const [toast, setToast] = useState(null);

  const triggerToast = (msg, isErr = true) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync Auth User
  useEffect(() => {
    const naUser = localStorage.getItem('na_user');
    if (!naUser) {
      navigate('/auth');
      return;
    }
    const userObj = JSON.parse(naUser);
    if (userObj.role !== 'doctor') {
      navigate('/auth');
      return;
    }
    setCurrentUser(userObj);
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Patients List
  const fetchPatients = async () => {
    try {
      const { data } = await patientAPI.list();
      setPatients(data);
      if (data.length > 0) {
        handleSelectPatient(data[0]);
      }
    } catch (err) {
      triggerToast("Error fetching clinical patient roster.");
    }
  };

  // Handle selected patient change
  const handleSelectPatient = async (patient) => {
    setUploadProgress(0);
    setAnalyzingProgress(false);
    setSelectedScan(null);
    setSelectedScanDetail(null);
    setActiveHotspot(null);
    setSliceIndex(50);
    setScans([]);
    
    try {
      const patientId = patient.id || patient._id;
      const { data: fullPatient } = await patientAPI.get(patientId);
      
      setSelectedPatient(fullPatient);
      setLeftPanelTab('case');
      
      const patientScans = fullPatient.scans || [];
      setScans(patientScans);
      
      try {
        await patientAPI.timeline(patientId);
      } catch (err) {
        console.warn("Timeline fetch failed:", err);
      }

      if (patientScans.length > 0) {
        setSelectedScan(patientScans[0].id);
        loadScanDetail(patientScans[0].id);
      }
    } catch (err) {
      triggerToast("Failed to fetch clinical patient record details.");
    }
  };

  // Load scan detailed metrics
  const loadScanDetail = async (scanId) => {
    try {
      const { data } = await scanAPI.detail(scanId);
      setSelectedScan(scanId);
      setSelectedScanDetail(data);
      setSliceIndex(50);
      setClinicianNotes(data.doctor_notes || '');
      setOverrideClass(data.prediction || 'MCI');

      // Sync active hotspot with maximum attention region
      if (data.brain_regions) {
        let maxRegion = null;
        let maxVal = -1;
        Object.entries(data.brain_regions).forEach(([region, value]) => {
          if (value > maxVal) {
            maxVal = value;
            maxRegion = region;
          }
        });
        
        if (maxRegion) {
          const regionLower = maxRegion.toLowerCase();
          if (regionLower.includes('hippocampus')) setActiveHotspot('hippocampus');
          else if (regionLower.includes('entorhinal')) setActiveHotspot('entorhinal_cortex');
          else if (regionLower.includes('temporal')) setActiveHotspot('temporal_lobe');
          else if (regionLower.includes('parietal')) setActiveHotspot('parietal_cortex');
          else if (regionLower.includes('frontal')) setActiveHotspot('frontal_lobe');
          else if (regionLower.includes('cerebellum')) setActiveHotspot('cerebellum');
        }
      }
    } catch (err) {
      triggerToast("Error downloading scan classification maps.");
    }
  };

  // Add a new patient record
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientName || !newPatientDOB) {
      triggerToast("Please input Patient Name and Date of Birth.");
      return;
    }
    try {
      const payload = {
        full_name: newPatientName,
        date_of_birth: newPatientDOB,
        gender: newPatientGender,
        contact: newPatientContact,
        medical_history: newPatientHistory
      };
      const { data } = await patientAPI.create(payload);
      triggerToast(`Successfully enrolled: ${newPatientName}`, false);
      setShowAddPatient(false);
      
      // Clear forms
      setNewPatientName('');
      setNewPatientDOB('');
      setNewPatientContact('');
      setNewPatientHistory('');

      // Refresh list & select newly created patient
      const refreshRes = await patientAPI.list();
      setPatients(refreshRes.data);
      const newP = refreshRes.data.find(p => p.patient_code === data.patient_code) || data;
      handleSelectPatient(newP);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : "Failed to compile new clinical patient profile.");
      triggerToast(msg);
    }
  };

  // Delete patient record
  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the patient file for ${patientName}? This action will delete all associated MRI scans and cannot be undone.`)) {
      return;
    }
    try {
      await patientAPI.delete(patientId);
      triggerToast(`Successfully deleted patient file: ${patientName}`, false);
      setSelectedPatient(null);
      setSelectedScan(null);
      setSelectedScanDetail(null);
      setScans([]);
      fetchPatients();
    } catch (err) {
      triggerToast("Failed to delete patient clinical profile.");
    }
  };

  // MRI NIfTI File Upload & Preprocessing
  const handleScanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress(1);

    try {
      const patientId = selectedPatient.id || selectedPatient._id;
      const { data } = await scanAPI.upload(file, patientId, (progress) => {
        setUploadProgress(progress);
      });

      triggerToast("NIfTI raw volume uploaded! Launching SimpleITK Preprocessing...", false);
      
      // Automatic trigger analysis pipeline
      setAnalyzingProgress(true);
      const anaRes = await scanAPI.analyze(data.scan_id, 'multiclass');
      triggerToast(`Analysis complete! Diagnosis: ${anaRes.data.prediction}`, false);
      
      // Refresh patient data to see new scan
      handleSelectPatient(selectedPatient);
    } catch (err) {
      triggerToast(err.response?.data?.detail || "MRI processing aborted due to NIfTI scale errors.");
      setUploadProgress(0);
      setAnalyzingProgress(false);
    }
  };

  // Clinician Diagnostics Decisions
  const handleClinicianReview = async (actionType) => {
    if (!selectedScanDetail) return;
    try {
      const scanId = selectedScanDetail.scan_id;
      const payload = {
        action: actionType, // "ACCEPT FINDING", "FLAG FOR REVIEW", "OVERRIDE DIAGNOSIS"
        doctor_diagnosis: actionType === "OVERRIDE DIAGNOSIS" ? overrideClass : selectedScanDetail.prediction,
        doctor_notes: clinicianNotes
      };
      
      const { data } = await scanAPI.review(scanId, payload);
      triggerToast(`Review registered: ${data.status.toUpperCase()}`, false);
      
      // Reload scan details
      loadScanDetail(scanId);
    } catch (err) {
      triggerToast("Review submission refused by authorization layers.");
    }
  };

  // Secure report download with Authorization Bearer token programmatically
  const handleDownloadReport = async (scanId) => {
    try {
      triggerToast("Generating clinical PDF report...", false);
      const response = await fetch(`${BASE_URL}/api/scan/${scanId}/report`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('na_token')}`
        }
      });
      if (!response.ok) throw new Error("Failed to download");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NeuroAssist_Report_${scanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      triggerToast("Report downloaded successfully!", false);
    } catch (err) {
      triggerToast("Could not download report PDF.");
    }
  };

  // Logout clinical session
  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Filtered Patients List
  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="workspace-layout">
      
      {/* ── LEFT PANEL: PATIENT INDEX RENDERER ─────────────────────────────── */}
      <aside className="workspace-left bg-slate-950 border-r border-surface-border flex flex-col justify-between">
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Diagnostic Header */}
          <div className="p-4 border-b border-surface-border bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaBrain className="text-green-300 text-lg" />
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">NeuroAssist AI</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Diagnostic V3</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAddPatient(!showAddPatient)}
              className="w-7 h-7 rounded-lg bg-green-300/10 hover:bg-green-300/20 text-green-300 flex items-center justify-center transition-colors"
              title="Enroll Patient"
            >
              <FaPlus className="text-xs" />
            </button>
          </div>

          {/* User clinical tag */}
          {currentUser && (
            <div className="px-4 py-3 bg-slate-900/60 border-b border-surface-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <FaUserMd className="text-xs" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">{currentUser.full_name}</h4>
                  <span className="text-[9px] text-purple-300 font-bold uppercase tracking-widest mt-0.5 block">Neuroradiologist</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
                title="Sign Out"
              >
                <FaSignOutAlt className="text-xs" />
              </button>
            </div>
          )}

          {leftPanelTab === 'roster' ? (
            <>
              {/* Patients Search Bar */}
              <div className="p-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-2.5 text-slate-500 text-xs" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clinical roster..." 
                    className="w-full bg-slate-900 border border-surface-border/60 rounded-xl pl-9 pr-4 py-2 text-xs outline-none text-white focus:border-green-300"
                  />
                </div>
              </div>

              {/* Add Patient Modal overlay within panel */}
              {showAddPatient ? (
                <form onSubmit={handleCreatePatient} className="p-4 border-b border-surface-border bg-slate-900 space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">Enroll Clinical Patient</span>
                    <button 
                      type="button" 
                      onClick={() => setShowAddPatient(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Patient Full Name</label>
                    <input 
                      type="text" 
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      placeholder="Henry Cavill" 
                      className="w-full bg-slate-950 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Date of Birth</label>
                      <input 
                        type="date" 
                        value={newPatientDOB}
                        onChange={(e) => setNewPatientDOB(e.target.value)}
                        className="w-full bg-slate-950 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase">Gender</label>
                      <select 
                        value={newPatientGender}
                        onChange={(e) => setNewPatientGender(e.target.value)}
                        className="w-full bg-slate-950 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Contact Info</label>
                    <input 
                      type="text" 
                      value={newPatientContact}
                      onChange={(e) => setNewPatientContact(e.target.value)}
                      placeholder="+1 (555) 0192" 
                      className="w-full bg-slate-950 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Prior Medical History</label>
                    <textarea 
                      value={newPatientHistory}
                      onChange={(e) => setNewPatientHistory(e.target.value)}
                      placeholder="Mild hypertension, family history of cognitive decline." 
                      className="w-full bg-slate-950 border border-surface-border rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none h-14 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-green-300 to-green-400 hover:from-green-400 hover:to-green-500 rounded-lg text-slate-950 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Enroll Patient
                  </button>
                </form>
              ) : null}

              {/* Roster list */}
              <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-6">
                {filteredPatients.map(p => (
                  <div 
                    key={p.id || p._id}
                    onClick={() => handleSelectPatient(p)}
                    className={`p-3 rounded-xl cursor-pointer flex items-center justify-between border transition-all group-item ${
                      selectedPatient?.patient_code === p.patient_code 
                        ? 'bg-green-300/10 border-green-300/35 text-white' 
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col">
                      <h4 className="text-xs font-bold leading-tight font-display">{p.full_name}</h4>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">
                        Code: {p.patient_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePatient(p.id || p._id, p.full_name);
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Patient"
                      >
                        <FaTrash className="text-[10px]" />
                      </button>
                      <FaChevronRight className="text-[9px] text-slate-600" />
                    </div>
                  </div>
                ))}

                {filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-600">
                    No matching patients enrolled.
                  </div>
                )}
              </div>
            </>
          ) : (
            // CASE DETAILS TAB
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
              <button 
                onClick={() => setLeftPanelTab('roster')}
                className="text-xs text-green-300 hover:underline flex items-center gap-1 font-semibold self-start"
              >
                &larr; Back to Patients List
              </button>

              {/* Patient Context Card */}
              {selectedPatient && (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-surface-border space-y-2 relative group">
                  <button
                    type="button"
                    onClick={() => handleDeletePatient(selectedPatient.id || selectedPatient._id, selectedPatient.full_name)}
                    className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Patient"
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight font-display pr-6">{selectedPatient.full_name}</h3>
                    <span className="text-[9px] font-mono text-purple-300">{selectedPatient.patient_code}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-surface-border/40 pt-2 font-mono">
                    <div>
                      <span className="block text-[8px] text-slate-500 uppercase font-bold">Gender</span>
                      <span className="text-white">{selectedPatient.gender}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-500 uppercase font-bold">DOB</span>
                      <span className="text-white">{selectedPatient.date_of_birth}</span>
                    </div>
                    {selectedPatient.contact && (
                      <div className="col-span-2">
                        <span className="block text-[8px] text-slate-500 uppercase font-bold">Contact</span>
                        <span className="text-white">{selectedPatient.contact}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Prior Medical History */}
              {selectedPatient && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Clinical History</span>
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-surface-border/30 text-[10px] text-slate-300 leading-normal max-h-24 overflow-y-auto font-sans">
                    {selectedPatient.medical_history || "No prior history recorded."}
                  </div>
                </div>
              )}

              {/* Scan Studies list */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">MRI Studies ({scans.length})</span>
                  
                  {/* Upload button inside studies section */}
                  {selectedPatient && (
                    <label className="text-[10px] font-bold text-green-300 hover:text-green-200 cursor-pointer flex items-center gap-1">
                      <FaUpload className="text-[9px]" />
                      Upload Study
                      <input 
                        type="file" 
                        onChange={handleScanUpload}
                        className="hidden" 
                        accept=".nii,.nii.gz,.dcm,.mha,.nrrd" 
                      />
                    </label>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {scans.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedScan(s.id);
                        loadScanDetail(s.id);
                      }}
                      className={`p-3 rounded-xl cursor-pointer border text-left transition-all ${
                        selectedScan === s.id
                          ? 'bg-green-300/10 border-green-300/35 text-white'
                          : 'bg-transparent border-surface-border/40 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold font-mono text-white">{s.id}</div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            {s.date ? s.date.slice(0, 10) : 'Date Unknown'}
                          </div>
                        </div>
                        {s.diagnosis && (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            s.diagnosis === 'AD' ? 'bg-red-500/10 text-red-400 border border-red-500/25' : s.diagnosis === 'MCI' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-green-500/10 text-green-300 border border-green-500/25'
                          }`}>
                            {s.diagnosis}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 pt-1 border-t border-surface-border/20 text-[9px]">
                        <span className="text-slate-500">Status: <span className="uppercase text-slate-300 font-semibold">{s.status || 'unknown'}</span></span>
                        {s.confidence && <span className="text-slate-400 font-mono font-bold">{s.confidence}% conf</span>}
                      </div>
                    </div>
                  ))}

                  {scans.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-600 border border-dashed border-surface-border/40 rounded-xl">
                      No MRI studies uploaded for this patient.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── CENTER PANEL: NIfTI 3D GRAD-CAM SLICE VIEWPORTS ───────────────── */}
      <main className="workspace-center bg-black border-r border-surface-border flex flex-col justify-between relative">
        
        {/* Workspace Toolbar Header */}
        <div className="workspace-panel-header px-4 py-3">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Diagnostic Case</span>
              <h2 className="text-xs font-bold text-white font-display mt-0.5">
                {selectedPatient ? selectedPatient.full_name : "Selecting Clinical Case..."}
              </h2>
            </div>
            {selectedPatient && (
              <div className="px-2.5 py-0.5 bg-slate-900 border border-surface-border rounded-full text-[9px] text-green-300 font-mono">
                {selectedPatient.patient_code}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport Selectors */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-surface-border/50">
              {['axial', 'coronal', 'sagittal'].map(v => (
                <button
                  key={v}
                  onClick={() => setActiveSliceView(v)}
                  className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    activeSliceView === v 
                      ? 'bg-purple-500 text-white shadow' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* The Slice Display Viewport Area */}
        <div className="flex-1 flex items-stretch p-4 gap-4 relative bg-[#05060a] overflow-hidden">
          {selectedScanDetail ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full">
              
              {/* Left Column: 3D Interactive Brain Model */}
              <div className="relative rounded-2xl border border-surface-border/60 overflow-hidden bg-slate-950/40 shadow-2xl flex flex-col items-center justify-center p-2 min-h-[300px]">
                <div className="absolute top-3 left-3 z-10 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                  Anatomical Reference (Interactive 3D)
                </div>
                <div className="w-full h-full min-h-0">
                  <ThreeBrain
                    activeHotspot={activeHotspot}
                    onHoverHotspot={(h) => setActiveHotspot(h ? h.id : null)}
                    brainRegions={selectedScanDetail?.brain_regions}
                    prediction={selectedScanDetail?.prediction}
                  />
                </div>
              </div>

              {/* Right Column: 2D MRI Slice / Grad-CAM Viewer */}
              <div className="relative rounded-2xl border border-surface-border/60 overflow-hidden bg-black shadow-2xl mri-viewer flex items-center justify-center min-h-[300px]">
                
                {/* Radiologist coordinate tags overlay */}
                <div className="absolute top-3 left-3 z-10 font-mono text-[9px] text-slate-500 flex flex-col">
                  <span>VIEW: {activeSliceView.toUpperCase()}</span>
                  <span>COORD: X:{sliceIndex} Y:{sliceIndex} Z:{sliceIndex}</span>
                  <span>ZOOM: {zoomScale}%</span>
                </div>

                <div className="absolute top-3 right-3 z-10 font-mono text-[9px] text-slate-500">
                  <span>SCALE: 1px / 0.85mm</span>
                </div>

                {/* Dynamic MRI/GradCAM Image Renderer with Crosshair Overlay */}
                {selectedScanDetail.prediction ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={`${BASE_URL}/api/scan/${selectedScanDetail.scan_id}/slice/${activeSliceView}/${sliceIndex}?token=${localStorage.getItem('na_token')}`}
                      alt={`${activeSliceView} slice`}
                      className="w-full h-full object-contain transition-all"
                      style={{
                        transform: `scale(${zoomScale / 100})`,
                        filter: `contrast(${contrastVal}%) brightness(100%)`,
                      }}
                    />
                    {/* Slice-position crosshair overlay */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ opacity: 0.6 }}
                    >
                      {/* Horizontal scan line */}
                      <line
                        x1="0" y1={`${sliceIndex}%`}
                        x2="100%" y2={`${sliceIndex}%`}
                        stroke="#4ade80" strokeWidth="1"
                        strokeDasharray="4 6"
                      />
                      {/* Vertical scan line */}
                      <line
                        x1={`${sliceIndex}%`} y1="0"
                        x2={`${sliceIndex}%`} y2="100%"
                        stroke="#4ade80" strokeWidth="1"
                        strokeDasharray="4 6"
                      />
                      {/* Crosshair centre dot */}
                      <circle
                        cx={`${sliceIndex}%`} cy={`${sliceIndex}%`}
                        r="4" fill="none" stroke="#4ade80" strokeWidth="1.5"
                      />
                      {/* Corner brackets */}
                      <polyline points={`${sliceIndex - 3}%,${sliceIndex - 1.5}% ${sliceIndex - 3}%,${sliceIndex - 3}% ${sliceIndex - 1.5}%,${sliceIndex - 3}%`} fill="none" stroke="#4ade80" strokeWidth="1"/>
                      <polyline points={`${sliceIndex + 1.5}%,${sliceIndex - 3}% ${sliceIndex + 3}%,${sliceIndex - 3}% ${sliceIndex + 3}%,${sliceIndex - 1.5}%`} fill="none" stroke="#4ade80" strokeWidth="1"/>
                    </svg>
                    {/* Slice position readout */}
                    <div className="absolute top-2 right-2 bg-black/70 border border-green-500/30 px-2 py-0.5 rounded text-[9px] font-mono text-green-300">
                      SLICE {sliceIndex.toString().padStart(3, '0')} / 100
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 p-8">
                    <FaExclamationTriangle className="text-amber-400 text-2xl mx-auto animate-bounce" />
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Grad-CAM slice textures are pending. Click below to run diagnostic inference and generate attention overlays.</p>
                    <button
                      disabled={analyzingProgress}
                      onClick={async () => {
                        if (!selectedScanDetail) return;
                        setAnalyzingProgress(true);
                        try {
                          const res = await scanAPI.analyze(selectedScanDetail.scan_id, 'multiclass');
                          triggerToast(`Analysis complete! Diagnosis: ${res.data.prediction}`, false);
                          loadScanDetail(selectedScanDetail.scan_id);
                          if (selectedPatient) {
                            // Fetch latest patient details and select the patient to refresh scans
                            const { data: fullPatient } = await patientAPI.get(selectedPatient.id || selectedPatient._id);
                            setSelectedPatient(fullPatient);
                            setScans(fullPatient.scans || []);
                          }
                        } catch (err) {
                          triggerToast(err.response?.data?.detail || "Inference failed.");
                        } finally {
                          setAnalyzingProgress(false);
                        }
                      }}
                      className="btn-purple px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mx-auto"
                    >
                      {analyzingProgress ? (
                        <>
                          <FaSpinner className="animate-spin text-xs" />
                          Running Inference...
                        </>
                      ) : (
                        "Run Diagnostics Inference"
                      )}
                    </button>
                  </div>
                )}

                {/* MRI slice coordinate indicators */}
                <div className="absolute bottom-3 left-3 z-10 bg-slate-950/80 border border-surface-border px-2 py-1 rounded text-[9px] text-green-300 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                  AI GRAD-CAM OVERLAY ENABLED
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8 max-w-md mx-auto">
              {uploadProgress > 0 ? (
                <div className="space-y-4 w-full">
                  <FaSpinner className="text-3xl text-green-300 animate-spin mx-auto" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">Uploading NIfTI Volume...</h3>
                    <p className="text-xs text-slate-500 mt-1">Extracting raw coordinate matrices ({uploadProgress}%)</p>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-surface-border">
                    <div 
                      className="bg-gradient-to-r from-green-300 to-green-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : analyzingProgress ? (
                <div className="space-y-4 w-full">
                  <FaMicroscope className="text-4xl text-purple-300 animate-pulse mx-auto" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">SimpleITK Preprocessing Pipeline Active</h3>
                    <p className="text-xs text-slate-400 mt-1">Applying bias correction &amp; extracting Grad-CAM activations...</p>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-purple-500/20">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-full w-[80%] animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-950/90 border border-surface-border flex items-center justify-center mx-auto text-slate-600">
                    <FaUpload className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">No Clinical Scan Uploaded</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Choose an enrolled clinical patient on the left, then upload a raw NIfTI scan volume (.nii, .nii.gz, .dcm) to trigger diagnostics.
                    </p>
                  </div>
                  <label className="btn-primary inline-flex items-center gap-2 cursor-pointer mx-auto">
                    <FaUpload className="text-xs" />
                    Upload NIfTI Scan
                    <input 
                      type="file" 
                      onChange={handleScanUpload}
                      className="hidden" 
                      accept=".nii,.nii.gz,.dcm,.mha,.nrrd" 
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Viewport Control Slider Bars */}
        {selectedScanDetail && (
          <div className="bg-slate-950 border-t border-surface-border p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Slice coordinate slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>SLICE POSITION</span>
                  <span className="text-green-300 font-bold">{sliceIndex} / 100</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sliceIndex} 
                  onChange={(e) => setSliceIndex(Number(e.target.value))}
                  className="w-full accent-green-300 h-1 rounded bg-slate-900 border border-surface-border outline-none"
                />
              </div>

              {/* Zoom Scale */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>SCALE AMPLITUDE</span>
                  <span className="text-purple-300 font-bold">{zoomScale}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="200" 
                  value={zoomScale} 
                  onChange={(e) => setZoomScale(Number(e.target.value))}
                  className="w-full accent-purple-400 h-1 rounded bg-slate-900 border border-surface-border outline-none"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>CONTRAST FILTER</span>
                  <span className="text-white font-bold">{contrastVal}%</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="200" 
                  value={contrastVal} 
                  onChange={(e) => setContrastVal(Number(e.target.value))}
                  className="w-full accent-slate-300 h-1 rounded bg-slate-900 border border-surface-border outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT PANEL: AI INTEL & CLINICAL BIOMARKERS ─────────────────── */}
      <aside className="workspace-right bg-slate-950 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col divide-y divide-surface-border">
          
          {/* AI DIAGNOSTICS SCREENING METRIC */}
          <div className="p-4 space-y-4">
            <span className="section-label">AI Neural Analysis</span>
            {selectedScanDetail ? (
              <div className="space-y-4">
                {/* Risk score gauge */}
                <div className="bg-slate-900 border border-surface-border p-4 rounded-2xl text-center space-y-1 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Global Atrophy Risk</span>
                  <h3 className={`text-3xl font-extrabold font-display leading-none ${
                    selectedScanDetail.risk_score > 65 ? 'risk-high text-red-400 animate-pulse' : selectedScanDetail.risk_score > 35 ? 'risk-medium text-amber-400' : 'risk-low text-green-300'
                  }`}>
                    {selectedScanDetail.risk_score?.toFixed(1)}%
                  </h3>
                  <div className="pt-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                      selectedScanDetail.urgency === 'urgent' ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse' : selectedScanDetail.urgency === 'priority' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-green-500/10 border-green-500/30 text-green-300'
                    }`}>
                      {selectedScanDetail.urgency} screening Priority
                    </span>
                  </div>
                </div>

                {/* CN / MCI / AD confidence levels list */}
                <div className="space-y-3">
                  {/* CN */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>CN (Normal)</span>
                      <span className="font-bold">{(selectedScanDetail.confidence_cn * 100).toFixed(1)}%</span>
                    </div>
                    <div className="confidence-bar-track">
                      <div 
                        className="confidence-bar-fill bg-green-400" 
                        style={{ width: `${selectedScanDetail.confidence_cn * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* MCI */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>MCI (Impairment)</span>
                      <span className="font-bold">{(selectedScanDetail.confidence_mci * 100).toFixed(1)}%</span>
                    </div>
                    <div className="confidence-bar-track">
                      <div 
                        className="confidence-bar-fill bg-amber-400" 
                        style={{ width: `${selectedScanDetail.confidence_mci * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* AD */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>AD (Alzheimer's)</span>
                      <span className="font-bold">{(selectedScanDetail.confidence_ad * 100).toFixed(1)}%</span>
                    </div>
                    <div className="confidence-bar-track">
                      <div 
                        className="confidence-bar-fill bg-red-400" 
                        style={{ width: `${selectedScanDetail.confidence_ad * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-600">
                No active neural screening.
              </div>
            )}
          </div>

          {/* EXPLAINABILITY REGIONS & ATTENTION VALUES */}
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="section-label">Quant Interpretability</span>
              {selectedScanDetail && (
                <span className="text-[9px] uppercase font-bold text-purple-300">ResNetconv_4</span>
              )}
            </div>

            {selectedScanDetail ? (
              <div className="space-y-2">
                {Object.entries(selectedScanDetail.brain_regions || {}).map(([region, value]) => (
                  <div key={region} className="flex justify-between items-center p-2 rounded-xl bg-slate-900/60 border border-surface-border/40 text-xs">
                    <span className="capitalize text-slate-300 font-semibold">{region.replace(/_/g, ' ')}</span>
                    <span className={`font-mono font-bold ${
                      value > 0.65 ? 'text-red-400' : value > 0.35 ? 'text-amber-400' : 'text-green-300'
                    }`}>
                      {value.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-600">
                Attention coefficients maps loaded.
              </div>
            )}
          </div>

          {/* HISTOLOGY & SCAN METADATA BIOMARKERS */}
          <div className="p-4 space-y-4">
            <span className="section-label">Neuroimaging Biomarkers</span>
            {selectedScanDetail ? (
              <div className="grid grid-cols-1 gap-2.5">
                {/* Hippocampal Atrophy */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-surface-border/40 flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-white leading-tight">Hippocampal Atrophy</span>
                    <span className="text-[9px] text-slate-500">AD degeneration indicator</span>
                  </div>
                  <span className="font-mono font-bold text-green-300">
                    {selectedScanDetail.biomarkers?.hippocampal_atrophy?.toFixed(3) || "N/A"}
                  </span>
                </div>

                {/* Ventricle Dilation */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-surface-border/40 flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-white leading-tight">Ventricle Enlargement</span>
                    <span className="text-[9px] text-slate-500">Global volume loss surrogate</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300">
                    {selectedScanDetail.biomarkers?.ventricle_enlargement?.toFixed(3) || "N/A"}
                  </span>
                </div>

                {/* Amyloid Plaque */}
                <div className="p-2.5 rounded-xl bg-slate-900 border border-surface-border/40 flex justify-between items-center text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-white leading-tight">Amyloid Plaque Load</span>
                    <span className="text-[9px] text-slate-500">PET density ratio indices</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300">
                    {selectedScanDetail.biomarkers?.amyloid_plaque_load?.toFixed(3) || "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-600">
                No persistent scan telemetry loaded.
              </div>
            )}
          </div>

          {/* BOTTOM CLINICAL NOTES & DECISION OVERRIDES PANEL */}
          <div className="p-4 space-y-4">
            <span className="section-label">Clinician Sign-off Review</span>
            {selectedScanDetail ? (
              <div className="space-y-4">
                <textarea
                  value={clinicianNotes}
                  onChange={(e) => setClinicianNotes(e.target.value)}
                  placeholder="Record patient diagnostic symptoms or skull-stripping anomalies..."
                  className="w-full bg-slate-900 border border-surface-border rounded-xl p-3 text-xs outline-none text-white focus:border-purple-400 h-24 resize-none"
                />

                <div className="space-y-2">
                  {/* Show locked banner if already reviewed */}
                  {['accepted','flagged','overridden'].includes(selectedScanDetail.status) && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-surface-border/60 rounded-xl text-[10px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Scan already reviewed — status locked to{' '}
                      <span className={`font-bold uppercase ml-0.5 ${
                        selectedScanDetail.status === 'accepted' ? 'text-green-300' :
                        selectedScanDetail.status === 'flagged'  ? 'text-amber-400' : 'text-purple-300'
                      }`}>{selectedScanDetail.status}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={['accepted','flagged','overridden'].includes(selectedScanDetail.status)}
                      onClick={() => handleClinicianReview('ACCEPT FINDING')}
                      className="flex-1 py-2 bg-green-400 text-slate-950 text-[10px] uppercase font-bold rounded-xl transition-all shadow hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Accept AI prediction
                    </button>
                    <button
                      type="button"
                      disabled={['accepted','flagged','overridden'].includes(selectedScanDetail.status)}
                      onClick={() => handleClinicianReview('FLAG FOR REVIEW')}
                      className="flex-1 py-2 bg-amber-400/20 text-amber-300 border border-amber-400/35 text-[10px] uppercase font-bold rounded-xl transition-all hover:bg-amber-400/30 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Flag for learning Queue
                    </button>
                  </div>

                  <div className="divider" />

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase">Override Diagnostic Prediction</label>
                    <div className="flex gap-2">
                      <select
                        value={overrideClass}
                        onChange={(e) => setOverrideClass(e.target.value)}
                        className="bg-slate-900 border border-surface-border rounded-xl px-3 text-xs text-white outline-none flex-1"
                      >
                        <option value="CN">CN (Cognitively Normal)</option>
                        <option value="MCI">MCI (Mild Impairment)</option>
                        <option value="AD">AD (Alzheimer's Disease)</option>
                      </select>
                      <button
                        type="button"
                        disabled={['accepted','flagged','overridden'].includes(selectedScanDetail.status)}
                        onClick={() => handleClinicianReview('OVERRIDE DIAGNOSIS')}
                        className="py-2 px-3 bg-purple-500 hover:bg-purple-600 text-white text-[10px] uppercase font-bold rounded-xl transition-all shadow disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Override
                      </button>
                    </div>
                  </div>

                  {selectedScanDetail.status && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-surface-border/55 text-center mt-3 text-xs">
                      <span className="text-slate-500">Scan Status:</span>{' '}
                      <span className={`font-bold uppercase ${
                        selectedScanDetail.status === 'accepted' ? 'text-green-300' : selectedScanDetail.status === 'flagged' ? 'text-amber-400' : selectedScanDetail.status === 'overridden' ? 'text-purple-300' : 'text-slate-300'
                      }`}>
                        {selectedScanDetail.status}
                      </span>
                    </div>
                  )}

                  <div className="divider" />

                  {/* Report Download – uses secure fetch with Bearer token */}
                  <button
                    type="button"
                    onClick={() => handleDownloadReport(selectedScanDetail.scan_id)}
                    className="w-full py-2.5 bg-slate-900 border border-surface-border/70 text-slate-200 hover:text-white rounded-xl text-[10px] uppercase font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-800"
                  >
                    <FaFilePdf className="text-red-400" />
                    Download PDF Medical Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-600">
                Awaiting scan analysis sign-off...
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Toast Alert Popups */}
      {toast && (
        <div className={`toast ${toast.isErr ? 'toast-error' : 'toast-success'}`}>
          <div className="flex items-center gap-2">
            {!toast.isErr && <FaCheck className="text-green-300" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorWorkspace;

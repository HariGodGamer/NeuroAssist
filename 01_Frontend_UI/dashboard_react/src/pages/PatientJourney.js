import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { scanAPI, patientAPI, BASE_URL } from '../services/api';
import ThreeBrain from '../components/ThreeBrain';
import { 
  FaBrain, FaFilePdf, FaChevronRight, FaSignOutAlt, 
  FaHistory, FaChartLine, FaCheckCircle, FaUserAlt, 
  FaCalendarAlt, FaShieldAlt, FaUpload, FaSpinner, 
  FaMicroscope, FaExclamationTriangle 
} from 'react-icons/fa';

const PatientJourney = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [selectedScanDetail, setSelectedScanDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [activeSliceView, setActiveSliceView] = useState('axial'); // axial, coronal, sagittal
  const [sliceIndex, setSliceIndex] = useState(50); // 0 to 100
  const [zoomScale, setZoomScale] = useState(100); // 50% to 200%
  const [contrastVal, setContrastVal] = useState(100); // 50% to 200%
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzingProgress, setAnalyzingProgress] = useState(false);

  const triggerToast = (msg, isErr = true) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const naUser = localStorage.getItem('na_user');
    if (!naUser) {
      navigate('/auth');
      return;
    }
    const userObj = JSON.parse(naUser);
    if (userObj.role !== 'patient') {
      navigate('/auth');
      return;
    }
    setCurrentUser(userObj);
    fetchPatientScans();
    fetchPatientProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPatientProfile = async () => {
    try {
      const { data } = await patientAPI.list();
      if (data && data.length > 0) {
        setPatientProfile(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch patient clinical profile:", err);
    }
  };

  const fetchPatientScans = async () => {
    try {
      const { data } = await scanAPI.history(10);
      setScanHistory(data.items);
      if (data.items.length > 0) {
        loadScanDetail(data.items[0].id);
      }
      setLoading(false);
    } catch (err) {
      triggerToast("Error downloading patient neurological scans.");
      setLoading(false);
    }
  };

  const loadScanDetail = async (scanId) => {
    try {
      const { data } = await scanAPI.detail(scanId);
      setSelectedScanDetail(data);
      setSliceIndex(50);

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
      triggerToast("Could not retrieve detailed scan report.");
    }
  };

  // Handle scan upload from patient portal
  const handleScanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress(1);

    try {
      const patientId = patientProfile.id || patientProfile._id;
      const { data } = await scanAPI.upload(file, patientId, (progress) => {
        setUploadProgress(progress);
      });

      triggerToast("NIfTI raw volume uploaded! Launching SimpleITK Preprocessing...", false);
      
      // Automatic trigger analysis pipeline
      setAnalyzingProgress(true);
      const anaRes = await scanAPI.analyze(data.scan_id, 'multiclass');
      triggerToast(`Analysis complete! Diagnosis: ${anaRes.data.prediction}`, false);
      
      // Reset progress
      setUploadProgress(0);
      setAnalyzingProgress(false);

      // Refresh patient scans list
      await fetchPatientScans();
    } catch (err) {
      triggerToast(err.response?.data?.detail || "MRI processing aborted due to NIfTI scale errors.");
      setUploadProgress(0);
      setAnalyzingProgress(false);
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

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Navbar header */}
      <header className="sticky top-0 z-50 w-full glass-raised px-6 py-4 flex items-center justify-between border-b border-surface-border">
        <div className="flex items-center gap-3">
          <FaBrain className="text-green-300 text-lg" />
          <div>
            <h1 className="text-base font-bold text-white font-display">NeuroAssist Patient Portal</h1>
            <p className="text-[9px] text-purple-300 font-bold uppercase tracking-widest leading-none">Diagnostic Timeline</p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <FaUserAlt className="text-purple-300 text-xs" />
              <span className="text-xs text-slate-300 font-bold">{currentUser.full_name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="btn-secondary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-purple-500/20 text-purple-300"
            >
              Sign Out
              <FaSignOutAlt className="text-[10px]" />
            </button>
          </div>
        )}
      </header>

      {/* Roster Main Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Personal Context Card & Scan History timeline */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
          
          {/* Welcome Patient Card */}
          <div className="glass p-6 border-purple-500/10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Neurological Account</span>
            {currentUser && (
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white font-display">{currentUser.full_name}</h2>
                <p className="text-xs text-slate-400">Clinical ID: PAT-{currentUser.id?.slice(-6).toUpperCase()}</p>
              </div>
            )}
            
            <div className="divider" />
            
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <FaShieldAlt className="text-green-300 shrink-0" />
              <p className="leading-normal">
                Your medical records are highly protected by HIPAA-compliant Atlas database clusters. Your clinician manages diagnostic overrides securely.
              </p>
            </div>
          </div>

          {/* Clinical Profile details card */}
          {patientProfile && (
            <div className="glass p-6 border-surface-border space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-green-300">Clinical Profile</span>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 font-mono">
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase font-bold">Gender</span>
                  <span className="text-white">{patientProfile.gender}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-500 uppercase font-bold">DOB</span>
                  <span className="text-white">{patientProfile.date_of_birth}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[9px] text-slate-500 uppercase font-bold">Contact</span>
                  <span className="text-white">{patientProfile.contact}</span>
                </div>
              </div>
              <div className="divider" />
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Clinical History</span>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-surface-border/30 text-xs text-slate-300 leading-normal max-h-24 overflow-y-auto font-sans">
                  {patientProfile.medical_history || "No prior history recorded."}
                </div>
              </div>
            </div>
          )}

          {/* Timeline lists */}
          <div className="glass p-6 border-surface-border space-y-4">
            <div className="flex justify-between items-center">
              <span className="section-label flex items-center gap-2">
                <FaHistory /> Scan Diagnostic Records ({scanHistory.length})
              </span>
              {patientProfile && (
                <label className="text-[10px] font-bold text-green-300 hover:text-green-200 cursor-pointer flex items-center gap-1">
                  <FaUpload className="text-[9px]" />
                  Upload MRI
                  <input 
                    type="file" 
                    onChange={handleScanUpload}
                    className="hidden" 
                    accept=".nii,.nii.gz,.dcm,.mha,.nrrd" 
                  />
                </label>
              )}
            </div>

            {loading ? (
              <div className="text-center py-6">
                <FaBrain className="text-2xl text-green-300 animate-spin mx-auto" />
              </div>
            ) : scanHistory.length > 0 ? (
              <div className="space-y-3">
                {scanHistory.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => loadScanDetail(s.id)}
                    className={`p-4 rounded-xl cursor-pointer border flex items-center justify-between transition-all ${
                      selectedScanDetail?.scan_id === s.id
                        ? 'bg-green-300/10 border-green-300/35 text-white'
                        : 'bg-transparent border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-display">Scan Record {idx + 1}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 text-slate-500 font-mono">
                          {s.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <FaCalendarAlt />
                        <span>{s.date?.slice(0, 10)}</span>
                      </div>
                    </div>
                    <FaChevronRight className="text-[10px]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No radiological scan records persistent. Contact your doctor to schedule an MRI.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Diagnostics, Clinical Override & Report Downloader */}
        <div className="lg:col-span-7">
          {selectedScanDetail ? (
            <div className="glass p-6 border-surface-border space-y-6">
              
              {/* Scan Detail header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">radiology screening summary</span>
                  <h3 className="text-lg font-bold text-white font-display mt-0.5">MRI Scan - {selectedScanDetail.scan_id}</h3>
                </div>
                
                {/* Download report */}
                <button
                  onClick={() => handleDownloadReport(selectedScanDetail.scan_id)}
                  className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-2"
                >
                  <FaFilePdf className="text-xs" />
                  Download Clinical Report PDF
                </button>
              </div>

              {/* 3D Brain + MRI Slice Viewer side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: '280px' }}>
                
                {/* 3D Interactive Brain */}
                <div className="relative rounded-2xl border border-surface-border/60 overflow-hidden bg-slate-950/40 shadow-xl flex flex-col items-center justify-center min-h-[260px]">
                  <div className="absolute top-2 left-3 z-10 font-mono text-[8px] text-slate-500 uppercase tracking-wider">
                    3D Anatomical Reference
                  </div>
                  <div className="w-full h-full min-h-0">
                    <ThreeBrain
                      activeHotspot={activeHotspot}
                      onClickHotspot={(id) => setActiveHotspot(activeHotspot === id ? null : id)}
                      brainRegions={selectedScanDetail?.brain_regions}
                      prediction={selectedScanDetail?.prediction}
                    />
                  </div>
                </div>

                {/* MRI Slice Viewer */}
                <div className="relative rounded-2xl border border-surface-border/60 overflow-hidden bg-black shadow-xl flex items-center justify-center min-h-[260px]">
                  {/* View selector */}
                  <div className="absolute top-2 left-2 z-10 flex gap-1">
                    {['axial','coronal','sagittal'].map(v => (
                      <button key={v} onClick={() => setActiveSliceView(v)}
                        className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                          activeSliceView === v ? 'bg-purple-500 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}>{v}</button>
                    ))}
                  </div>
                  <div className="absolute top-2 right-2 z-10 font-mono text-[8px] text-slate-600">
                    {sliceIndex}/{sliceIndex}/{sliceIndex}
                  </div>

                  {selectedScanDetail.prediction ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={`${BASE_URL}/api/scan/${selectedScanDetail.scan_id}/slice/${activeSliceView}/${sliceIndex}?token=${localStorage.getItem('na_token')}`}
                        alt={`${activeSliceView} slice`}
                        className="w-full h-full object-contain"
                        style={{ transform: `scale(${zoomScale/100})`, filter: `contrast(${contrastVal}%) brightness(100%)` }}
                      />
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
                        <line x1="0" y1={`${sliceIndex}%`} x2="100%" y2={`${sliceIndex}%`} stroke="#4ade80" strokeWidth="1" strokeDasharray="4 6"/>
                        <line x1={`${sliceIndex}%`} y1="0" x2={`${sliceIndex}%`} y2="100%" stroke="#4ade80" strokeWidth="1" strokeDasharray="4 6"/>
                        <circle cx={`${sliceIndex}%`} cy={`${sliceIndex}%`} r="4" fill="none" stroke="#4ade80" strokeWidth="1.5"/>
                      </svg>
                      <div className="absolute bottom-2 right-2 bg-black/70 border border-green-500/30 px-2 py-0.5 rounded text-[8px] font-mono text-green-300">
                        SLICE {sliceIndex.toString().padStart(3,'0')} / 100
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 p-6">
                      <FaExclamationTriangle className="text-amber-400 text-xl mx-auto animate-bounce" />
                      <p className="text-[10px] text-slate-500">Run diagnostics to view Grad-CAM slices</p>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 z-10 bg-slate-950/80 border border-surface-border px-1.5 py-0.5 rounded text-[7px] text-green-300 font-mono flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-400 animate-ping" />AI GRAD-CAM
                  </div>
                </div>
              </div>

              {/* Slice Controls */}
              {selectedScanDetail.prediction && (
                <div className="grid grid-cols-3 gap-4 bg-slate-900/60 border border-surface-border/40 rounded-2xl p-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>SLICE POSITION</span><span className="text-green-300 font-bold">{sliceIndex}/100</span>
                    </div>
                    <input type="range" min="0" max="100" value={sliceIndex} onChange={e => setSliceIndex(Number(e.target.value))}
                      className="w-full accent-green-300 h-1 rounded bg-slate-900 border border-surface-border outline-none"/>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>SCALE</span><span className="text-purple-300 font-bold">{zoomScale}%</span>
                    </div>
                    <input type="range" min="50" max="200" value={zoomScale} onChange={e => setZoomScale(Number(e.target.value))}
                      className="w-full accent-purple-400 h-1 rounded bg-slate-900 border border-surface-border outline-none"/>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>CONTRAST</span><span className="text-white font-bold">{contrastVal}%</span>
                    </div>
                    <input type="range" min="50" max="200" value={contrastVal} onChange={e => setContrastVal(Number(e.target.value))}
                      className="w-full accent-slate-300 h-1 rounded bg-slate-900 border border-surface-border outline-none"/>
                  </div>
                </div>
              )}

              {/* Risk Gauge + Verdict */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-surface-border p-4 rounded-2xl text-center space-y-2 shadow-inner">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Diagnostic Atrophy Risk</span>
                  <h4 className={`text-4xl font-extrabold font-display leading-none ${
                    selectedScanDetail.risk_score > 65 ? 'text-red-400 animate-pulse' :
                    selectedScanDetail.risk_score > 35 ? 'text-amber-400' : 'text-green-300'
                  }`}>{selectedScanDetail.risk_score?.toFixed(1)}%</h4>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${
                    selectedScanDetail.urgency === 'urgent' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    selectedScanDetail.urgency === 'priority' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-green-500/10 border-green-500/30 text-green-300'
                  }`}>{selectedScanDetail.urgency} priority</span>
                </div>

                <div className="bg-slate-900 border border-surface-border p-4 rounded-2xl text-center shadow-inner flex flex-col justify-center items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Clinical Verdict</span>
                  {selectedScanDetail.status === 'accepted' || selectedScanDetail.status === 'overridden' ? (
                    <>
                      <FaCheckCircle className="text-green-300 text-2xl" />
                      <span className="text-xs font-bold text-green-300 uppercase">Doctor Verified</span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        selectedScanDetail.prediction === 'AD' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                        selectedScanDetail.prediction === 'MCI' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                        'bg-green-500/10 text-green-300 border-green-500/25'
                      }`}>{selectedScanDetail.prediction}</span>
                    </>
                  ) : (
                    <>
                      <FaExclamationTriangle className="text-amber-400 text-xl" />
                      <span className="text-xs font-bold text-amber-400 uppercase">Awaiting Doctor Review</span>
                      <p className="text-[9px] text-slate-600">AI scan complete — pending final clinical verification.</p>
                    </>
                  )}
                </div>
              </div>

              {/* CN / MCI / AD Confidence Bars */}
              <div className="space-y-3 bg-slate-900/50 border border-surface-border/40 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold text-purple-300 tracking-widest">AI Classification Confidence</span>
                {[
                  { label: 'CN (Cognitively Normal)', value: selectedScanDetail.confidence_cn, color: 'bg-green-400' },
                  { label: 'MCI (Mild Impairment)',  value: selectedScanDetail.confidence_mci, color: 'bg-amber-400' },
                  { label: "AD (Alzheimer's)",       value: selectedScanDetail.confidence_ad,  color: 'bg-red-400'   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>{label}</span><span className="font-bold">{((value||0)*100).toFixed(1)}%</span>
                    </div>
                    <div className="confidence-bar-track">
                      <div className={`confidence-bar-fill ${color}`} style={{ width: `${(value||0)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Brain Region Attention Map */}
              {selectedScanDetail.brain_regions && Object.keys(selectedScanDetail.brain_regions).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">AI Attention Map — Brain Regions</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedScanDetail.brain_regions).map(([region, value]) => (
                      <div key={region}
                        onClick={() => setActiveHotspot(activeHotspot === region ? null : region)}
                        className={`flex justify-between items-center p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          activeHotspot === region
                            ? 'bg-purple-500/10 border-purple-500/40'
                            : 'bg-slate-900/60 border-surface-border/40 hover:border-slate-600'
                        }`}>
                        <span className="capitalize text-slate-300 font-semibold text-[10px]">{region.replace(/_/g,' ')}</span>
                        <span className={`font-mono font-bold text-[10px] ${
                          value > 0.65 ? 'text-red-400' : value > 0.35 ? 'text-amber-400' : 'text-green-300'
                        }`}>{value.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="divider" />

              {/* Biomarkers */}
              <div className="space-y-3">
                <span className="section-label flex items-center gap-2"><FaChartLine /> Clinical Brain Indicators</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Hippocampal volume', value: selectedScanDetail.biomarkers?.hippocampal_atrophy, note: 'Early AD progression ratio' },
                    { label: 'Ventricle enlargement', value: selectedScanDetail.biomarkers?.ventricle_enlargement, note: 'Cerebrospinal dilation ratio' },
                    { label: 'Amyloid deposit load', value: selectedScanDetail.biomarkers?.amyloid_plaque_load, note: 'Protein plaque density quotient' },
                  ].map(({ label, value, note }) => (
                    <div key={label} className="p-3 bg-slate-900 border border-surface-border/40 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">{label}</span>
                      <h5 className="text-base font-bold text-white font-display mt-1">{value ? value.toFixed(3) : 'N/A'}</h5>
                      <p className="text-[8px] text-slate-600 mt-1">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider" />

              {/* Clinician notes */}
              <div className="space-y-2">
                <span className="section-label">Practitioner Notes &amp; Guidance</span>
                <div className="bg-slate-900 border border-surface-border/50 p-4 rounded-xl text-xs leading-relaxed text-slate-300">
                  {selectedScanDetail.doctor_notes
                    ? <p>{selectedScanDetail.doctor_notes}</p>
                    : <p className="text-slate-600 italic">No diagnostic notes filed by clinician yet.</p>
                  }
                </div>
              </div>

            </div>
          ) : (
            <div className="glass border-surface-border min-h-[400px] flex flex-col items-center justify-center">
              {uploadProgress > 0 || analyzingProgress ? (
                <div className="flex flex-col items-center gap-6 p-12 text-center">
                  {analyzingProgress ? (
                    <>
                      <FaMicroscope className="text-5xl text-purple-300 animate-pulse" />
                      <div>
                        <h3 className="text-sm font-bold text-white font-display">SimpleITK Preprocessing Active</h3>
                        <p className="text-xs text-slate-400 mt-1">Applying bias correction &amp; extracting Grad-CAM activations...</p>
                      </div>
                      <div className="w-48 bg-slate-900 h-2 rounded-full overflow-hidden border border-purple-500/20">
                        <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-full w-[80%] animate-pulse" />
                      </div>
                    </>
                  ) : (
                    <>
                      <FaSpinner className="text-4xl text-green-300 animate-spin" />
                      <div>
                        <h3 className="text-sm font-bold text-white font-display">Uploading NIfTI Volume...</h3>
                        <p className="text-xs text-slate-500 mt-1">Extracting raw coordinate matrices ({uploadProgress}%)</p>
                      </div>
                      <div className="w-48 bg-slate-900 h-2 rounded-full overflow-hidden border border-surface-border">
                        <div className="bg-gradient-to-r from-green-300 to-green-500 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-12 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-950/90 border border-surface-border flex items-center justify-center text-slate-600">
                    <FaBrain className="text-xl animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">Select a Scan to View</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Click any MRI record on the left, or use <strong className="text-green-300">Upload MRI</strong> to begin AI diagnostics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Toast Alert Popups */}
      {toast && (
        <div className={`toast ${toast.isErr ? 'toast-error' : 'toast-success'}`}>
          <div className="flex items-center gap-2">
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientJourney;

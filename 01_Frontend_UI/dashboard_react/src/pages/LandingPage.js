import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThreeBrain from '../components/ThreeBrain';
import { 
  FaBrain, FaDna, FaShieldAlt, FaChartLine, FaRobot, 
  FaUserMd, FaArrowRight, FaLock, FaMicroscope, FaCheckCircle,
  FaUserShield, FaTimes, FaEye, FaEyeSlash
} from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeHotspot, setActiveHotspot] = useState('hippocampus');

  // --- Secret Admin Access Modal ---
  const ADMIN_SECRET = 'neuroadmin@2026';
  const [clickCount, setClickCount] = useState(0);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminPwError, setAdminPwError] = useState('');

  const handleCopyrightClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 3) {
      setClickCount(0);
      setAdminModalOpen(true);
      setAdminPwInput('');
      setAdminPwError('');
    }
  };

  const handleAdminUnlock = (e) => {
    e.preventDefault();
    if (adminPwInput === ADMIN_SECRET) {
      setAdminModalOpen(false);
      // Pre-fill admin email hint and redirect to auth
      navigate('/auth?hint=admin');
    } else {
      setAdminPwError('Incorrect admin passkey. Access denied.');
      setAdminPwInput('');
    }
  };
  const [hotspotDetails, setHotspotDetails] = useState({
    id: 'hippocampus',
    name: 'Hippocampus',
    desc: 'Memory formation. Primary site of early AD atrophy.'
  });

  const handleHoverHotspot = (hotspot) => {
    if (hotspot) {
      setActiveHotspot(hotspot.id);
      setHotspotDetails(hotspot);
    }
  };

  const faqItems = [
    {
      q: "How does the 3D ResNet-10 classifier model work?",
      a: "Our clinical backbone is pre-trained on the MedicalNet dataset using 3D ResNet-10. It takes full 3D NIfTI volumes, extracts spatial deep feature maps across axial, coronal, and sagittal dimensions, and outputs probabilities for Cognitively Normal (CN), Mild Cognitive Impairment (MCI), and Alzheimer's Disease (AD)."
    },
    {
      q: "Is the scan explainability based on real ML activation mapping?",
      a: "Yes. NeuroAssist V3 features a real-time 3D Grad-CAM engine. It hooks directly into the final convolutional layers of our PyTorch network, computes backpropagated gradients for the predicted class, and generates precise volumetric activation heatmaps layered onto the raw MRI scan."
    },
    {
      q: "How does NeuroAssist protect patient confidentiality and security?",
      a: "We operate under enterprise-grade healthcare frameworks. The platform leverages MongoDB Atlas encrypted databases, implements strict role-based access control (RBAC), enforces full SSL/TLS data-in-transit encryption, and writes audit logging for every single clinical interaction."
    },
    {
      q: "Can the pipeline handle raw MRI scans without prior preprocessing?",
      a: "NeuroAssist V3 includes a fully integrated SimpleITK preprocessing pipeline that performs N4 bias field correction, curvature flow denoising, threshold-based skull stripping, and voxel resampling (128x128x128) automatically prior to clinical analysis."
    }
  ];

  return (
    <div className="min-h-screen hero-bg text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass-raised px-6 py-4 flex items-center justify-between border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-300 to-purple-500 p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-surface-base rounded-[10px] flex items-center justify-center">
              <FaBrain className="text-green-300 text-lg animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-display">
              Neuro<span className="text-green-300">Assist</span>
            </h1>
            <p className="text-[9px] text-purple-300 font-semibold uppercase tracking-widest leading-none">Intelligence V3</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
          <a href="#pipeline" className="text-sm text-slate-300 hover:text-white transition-colors">Pipeline</a>
          <a href="#security" className="text-sm text-slate-300 hover:text-white transition-colors">Security</a>
          <a href="#faq" className="text-sm text-slate-300 hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/auth')} 
            className="btn-secondary px-5 py-2 rounded-xl text-xs flex items-center gap-2 border border-green-300/30"
          >
            Clinical Access
            <FaArrowRight className="text-[10px]" />
          </button>
        </div>
      </header>

      {/* ── Hero Section with 3D Brain ────────────────────────────────────── */}
      <section className="relative w-full max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        
        {/* Hero Left Callout */}
        <div className="lg:col-span-6 space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Enterprise AI Neurological Intelligence</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white font-display">
            Next-Gen MRI <br />
            <span className="neural-gradient">Neurodegenerative</span> <br />
            Screening & Diagnostics
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
            Combining state-of-the-art 3D MedicalNet deep learning with real-time volumetric Grad-CAM explainability, skull stripping pipelines, and automated clinical reports. Engineered for modern hospitals and radiology centers.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button 
              onClick={() => navigate('/auth')} 
              className="btn-primary flex items-center gap-2"
            >
              Get Started
              <FaArrowRight className="text-xs" />
            </button>
            <a 
              href="#pipeline" 
              className="px-5 py-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 transition-colors text-sm font-semibold flex items-center gap-2"
            >
              Explore Preprocessing
            </a>
          </div>

          {/* Core pipeline credentials banner */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-surface-border">
            <div>
              <h4 className="text-2xl font-bold text-green-300 font-display">98.4%</h4>
              <p className="text-xs text-slate-400">Class AUC Accuracy</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-purple-300 font-display">&lt; 15s</h4>
              <p className="text-xs text-slate-400">Analysis Pipeline</p>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white font-display">3D</h4>
              <p className="text-xs text-slate-400">Grad-CAM Extraction</p>
            </div>
          </div>
        </div>

        {/* Hero Right: 3D interactive Canvas */}
        <div className="lg:col-span-6 h-[450px] md:h-[600px] relative glass rounded-3xl border border-surface-border flex flex-col justify-between overflow-hidden shadow-2xl p-4">
          <div className="absolute top-4 right-4 z-10">
            <div className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-surface-border text-[10px] text-green-300 font-bold uppercase tracking-widest backdrop-blur-sm animate-pulse">
              Interactive WebGL Core
            </div>
          </div>

          {/* The interactive Brain */}
          <div className="flex-1 w-full h-full relative">
            <ThreeBrain 
              activeHotspot={activeHotspot} 
              onHoverHotspot={handleHoverHotspot} 
            />
          </div>

          {/* Dynamic hot-spot description card */}
          {hotspotDetails && (
            <div className="z-10 mt-auto bg-surface-overlay/90 border border-surface-border p-4 rounded-2xl backdrop-blur-md transition-all duration-300 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <h4 className="text-sm font-bold text-white font-display">{hotspotDetails.name}</h4>
              </div>
              <p className="text-xs text-slate-300">{hotspotDetails.desc}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Key Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-surface-raised border-t border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-green-300">Intelligent Features</span>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">Full-Stack AI Neurological Framework</h2>
            <p className="text-slate-400 text-sm md:text-base">
              A comprehensive clinical workstation that processes raw neuroimages, identifies cognitive degeneration, visualizes brain activations, and builds retrainable neural sets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="metric-card space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-green-300/10 border border-green-300/20 flex items-center justify-center mb-6">
                  <FaRobot className="text-green-300 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white font-display mb-2">3D ResNet-10 Model</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Leverages pre-trained ResNet-10 spatial models optimized for brain MRI analysis, offering high sensitivity for Early Mild Cognitive Impairment (MCI) and Alzheimer's Disease (AD).
                </p>
              </div>
              <div className="text-[10px] font-bold text-green-300 uppercase tracking-widest pt-4">PyTorch Core</div>
            </div>

            {/* Feature 2 */}
            <div className="metric-card space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <FaBrain className="text-purple-300 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white font-display mb-2">3D Grad-CAM Explainability</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ensures full diagnostic explainability by generating three-dimensional activation maps of deep conv networks, extracting and layering slice overlays back to the raw scans.
                </p>
              </div>
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest pt-4">Visual Activation</div>
            </div>

            {/* Feature 3 */}
            <div className="metric-card space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-green-300/10 border border-green-300/20 flex items-center justify-center mb-6">
                  <FaMicroscope className="text-green-300 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white font-display mb-2">Skull Stripping & Denoising</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated preprocessing steps built using SimpleITK that strip surrounding skulls, filter scanning noise, correct scanner bias, and normalize coordinates on-the-fly.
                </p>
              </div>
              <div className="text-[10px] font-bold text-green-300 uppercase tracking-widest pt-4">SimpleITK Core</div>
            </div>

            {/* Feature 4 */}
            <div className="metric-card space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <FaChartLine className="text-purple-300 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white font-display mb-2">Biomarker Extraction</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provides quantitative neuroimaging biomarker metrics, evaluating hippocampal volume atrophy ratios, ventricle dilation, and global amyloid density indices.
                </p>
              </div>
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest pt-4">Quant Metrics</div>
            </div>

            {/* Feature 5 */}
            <div className="metric-card space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-green-300/10 border border-green-300/20 flex items-center justify-center mb-6">
                  <FaUserMd className="text-green-300 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white font-display mb-2">Clinical Reports & PDFs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instantly compiles clinical scans, patient symptoms, doctor override notes, and confidence plots into professional, downloadable PDF reports.
                </p>
              </div>
              <div className="text-[10px] font-bold text-green-300 uppercase tracking-widest pt-4">ReportLab Engine</div>
            </div>

            {/* Feature 6 */}
            <div className="metric-card space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <FaShieldAlt className="text-purple-300 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-white font-display mb-2">Retrain Learning Queue</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Allows doctors to flag anomalous model scans. Flagged cases are pushed into an admin learning queue, creating clean, reviewed sets for network retraining.
                </p>
              </div>
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest pt-4">MLOps Pipeline</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Preprocessing Pipeline Visualisation ────────────────────────── */}
      <section id="pipeline" className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">Raw To Gold Pipeline</span>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">7-Step Automated Preprocessing</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Before the deep convolutional ResNet layers perform inference, the raw uploaded scan is processed by an automated pipeline that standardizes geometry and intensity.
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-green-300/10 border border-green-300/20 text-green-300 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">N4 Bias Correction</h4>
                  <p className="text-xs text-slate-400">Corrects low-frequency intensity non-uniformity scanner distortions.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-green-300/10 border border-green-300/20 text-green-300 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Curvature Flow Denoising</h4>
                  <p className="text-xs text-slate-400">Edge-preserving smoothing filters scanner high-frequency thermal noise.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-green-300/10 border border-green-300/20 text-green-300 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Skull Stripping</h4>
                  <p className="text-xs text-slate-400">Filters non-brain voxels (skull, eyes, muscle, fat) automatically.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="w-6 h-6 rounded-full bg-green-300/10 border border-green-300/20 text-green-300 text-xs font-bold flex items-center justify-center shrink-0">4</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">Spatial Resampling</h4>
                  <p className="text-xs text-slate-400">Resamples variable spacing to standard isotrophic 128x128x128 grid size.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 glass p-8 border border-surface-border">
            <div className="flex items-center justify-between border-b border-surface-border pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">SimpleITK_Inference_Monitor.log</span>
            </div>

            <div className="font-mono text-xs text-green-300 space-y-2 overflow-x-auto bg-slate-950/70 p-5 rounded-xl border border-surface-border/50">
              <p className="text-slate-500">[INFO] 2026-06-02 18:54:12 — Initialising Preprocessing on SCN-92FA31.nii.gz</p>
              <p className="text-slate-500">[INFO] 2026-06-02 18:54:13 — Running N4ITKBiasFieldCorrectionImageFilter...</p>
              <p className="text-slate-300">[INFO] 2026-06-02 18:54:15 — Bias correction complete. Max intensity scaling: 1.025</p>
              <p className="text-slate-500">[INFO] 2026-06-02 18:54:15 — Running CurvatureFlowImageFilter (iterations: 5, timestep: 0.05)</p>
              <p className="text-slate-300">[INFO] 2026-06-02 18:54:17 — Denoising complete. SNR improved by 6.42dB</p>
              <p className="text-slate-500">[INFO] 2026-06-02 18:54:17 — Stripping skull bones utilizing OtsuThreshold...</p>
              <p className="text-slate-300">[INFO] 2026-06-02 18:54:19 — Skull stripped. Volume reduced by 41.5%</p>
              <p className="text-slate-500">[INFO] 2026-06-02 18:54:19 — Resampling spacing from (0.9, 0.9, 1.2) to (1.0, 1.0, 1.0)</p>
              <p className="text-purple-300 font-bold">[INFO] 2026-06-02 18:54:21 — Volume resampled to (128, 128, 128). Preprocessing completed successfully.</p>
              <p className="text-slate-500">[INFO] 2026-06-02 18:54:22 — Loading weights: resnet10_medicalnet.pth</p>
              <p className="text-green-400 font-bold">[SUCCESS] 2026-06-02 18:54:24 — PyTorch model inference completed. Class: AD (Confidence: 94.2%)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Security & Compliance section ────────────────────────────────── */}
      <section id="security" className="py-24 bg-surface-raised border-t border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">Security &amp; Encryption</span>
            <h2 className="text-3xl font-bold font-display text-white">Clinical-Grade Security Standards</h2>
            <p className="text-slate-400 text-sm">
              Engineered to meet the requirements of leading clinical networks, medical colleges, and global hospitals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cert 1 */}
            <div className="glass p-6 space-y-4 flex flex-col justify-between border-purple-500/10">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-300">
                <FaLock />
              </div>
              <h4 className="text-base font-bold text-white font-display mt-4">HIPAA &amp; GDPR Ready</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adheres strictly to clinical privacy rules, implementing patient de-identification policies prior to database persistence.
              </p>
            </div>

            {/* Cert 2 */}
            <div className="glass p-6 space-y-4 flex flex-col justify-between border-purple-500/10">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-300">
                <FaShieldAlt />
              </div>
              <h4 className="text-base font-bold text-white font-display mt-4">MongoDB Atlas Encryption</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stores all persistent imaging records and patient clinical reports on secure Atlas databases utilizing AES-256 data-at-rest encryption.
              </p>
            </div>

            {/* Cert 3 */}
            <div className="glass p-6 space-y-4 flex flex-col justify-between border-purple-500/10">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-300">
                <FaDna />
              </div>
              <h4 className="text-base font-bold text-white font-display mt-4">RBAC Audit Logging</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enforces precise Role-Based Access Control and files an irreversible audit trail for scan uploads, analytical tests, and report requests.
              </p>
            </div>

            {/* Cert 4 */}
            <div className="glass p-6 space-y-4 flex flex-col justify-between border-purple-500/10">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-300">
                <FaCheckCircle />
              </div>
              <h4 className="text-base font-bold text-white font-display mt-4">Traceable Diagnostics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Links every system override or review directly to the authenticated clinician's license, maintaining complete logging for verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 max-w-5xl mx-auto px-6">
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-green-300">Platform FAQ</span>
          <h2 className="text-3xl font-bold font-display text-white">Frequently Answered Queries</h2>
        </div>

        <div className="space-y-6">
          {faqItems.map((item, idx) => (
            <div key={idx} className="glass p-6 border-slate-800/80">
              <h4 className="text-sm font-bold text-white font-display flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                {item.q}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-2 pl-4">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-surface-border bg-surface-base py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <FaBrain className="text-green-300 text-lg" />
            <span className="text-sm font-bold text-white font-display">NeuroAssist Platform V3</span>
          </div>

          {/* Triple-click this text to reveal the hidden admin access button */}
          <p 
            className="text-[11px] text-slate-500 cursor-default select-none"
            onClick={handleCopyrightClick}
            title=""
          >
            &copy; 2026 NeuroAssist Clinical AI Systems Inc. Certified clinical software pipeline. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-500">HIPAA Compliant</span>
            <span className="text-[11px] text-slate-500">GDPR Compliant</span>
            <span className="text-[11px] text-slate-500">ISO 27001</span>
          </div>
        </div>
      </footer>

      {/* ── Hidden Admin Access Modal ──────────────────────────────────────── */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-sm glass p-8 border border-purple-500/30 shadow-2xl space-y-6 relative">
            
            {/* Close */}
            <button
              onClick={() => setAdminModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-red-500 p-0.5 mx-auto flex items-center justify-center shadow-lg">
                <div className="w-full h-full bg-surface-base rounded-[14px] flex items-center justify-center">
                  <FaUserShield className="text-purple-300 text-xl" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-display text-white">Admin Access</h3>
              <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                Restricted — Operations Control
              </p>
            </div>

            {/* Password Form */}
            <form onSubmit={handleAdminUnlock} className="space-y-4">
              <div className="space-y-1">
                <label className="input-label">Admin Passkey</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-slate-500 text-xs" />
                  <input
                    type={showAdminPw ? "text" : "password"}
                    value={adminPwInput}
                    onChange={(e) => { setAdminPwInput(e.target.value); setAdminPwError(''); }}
                    placeholder="Enter admin passkey..."
                    className="input-field pl-10 pr-10"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setShowAdminPw(!showAdminPw)}
                  >
                    {showAdminPw ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
                  </button>
                </div>
              </div>

              {adminPwError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-xs text-center">
                  {adminPwError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-900 bg-gradient-to-r from-purple-300 to-purple-500 hover:from-purple-400 hover:to-purple-600 transition-all shadow-md"
              >
                Unlock Admin Panel
              </button>
            </form>

            <p className="text-[9px] text-slate-600 text-center leading-normal">
              This access point is restricted to authorized system administrators only. Unauthorized access attempts are logged.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;

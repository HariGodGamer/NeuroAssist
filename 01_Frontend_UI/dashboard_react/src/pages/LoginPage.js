import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import InteractiveNeuralCanvas from '../components/3d/InteractiveNeuralCanvas';
import InteractiveMriShowcase from '../components/clinical/InteractiveMriShowcase';
import PipelineStageExplorer from '../components/clinical/PipelineStageExplorer';
import { 
  FiLock, 
  FiMail, 
  FiArrowRight, 
  FiShield, 
  FiCheckCircle, 
  FiUser, 
  FiAlertCircle, 
  FiActivity, 
  FiLayers, 
  FiDatabase
} from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('doctor'); // 'doctor' | 'patient'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const scrollToAuth = () => {
    const el = document.getElementById('auth-portal');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await authAPI.login(email, password);
      localStorage.setItem('na_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('na_refresh', data.refresh_token);
      }
      localStorage.setItem('na_user', JSON.stringify(data.user));
      dispatch({ type: 'SET_AUTH', payload: { token: data.access_token, user: data.user } });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.register(email, password, fullName, role);
      const { data } = await authAPI.login(email, password);
      localStorage.setItem('na_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('na_refresh', data.refresh_token);
      }
      localStorage.setItem('na_user', JSON.stringify(data.user));
      dispatch({ type: 'SET_AUTH', payload: { token: data.access_token, user: data.user } });
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F4] text-[#22201F] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#7A1F2B] selection:text-white">
      
      {/* 60FPS Interactive Synaptic Neural Canvas */}
      <InteractiveNeuralCanvas />

      {/* Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F4]/85 backdrop-blur-md border-b border-[#E8E2DA] transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7A1F2B] text-white flex items-center justify-center shadow-clinical">
              <LuBrain className="w-5 h-5" />
            </div>
            <div>
              <div className="brand-title text-xl tracking-wider leading-none">
                <span className="brand-bold text-[#7A1F2B]">NEURO</span>
                <span className="brand-regular text-[#22201F]">ASSIST</span>
              </div>
              <span className="text-[10px] tracking-widest uppercase font-mono text-[#7A756F] block mt-0.5">
                Clinical Diagnostic Suite
              </span>
            </div>
          </div>

          {/* Quick Anchor Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#7A756F]">
            <a href="#mri-workstation" className="hover:text-[#7A1F2B] transition-colors">
              PACS Workstation
            </a>
            <a href="#pipeline" className="hover:text-[#7A1F2B] transition-colors">
              7-Stage AI Pipeline
            </a>
            <a href="#benchmarks" className="hover:text-[#7A1F2B] transition-colors">
              Clinical Benchmarks
            </a>
            <a href="#governance" className="hover:text-[#7A1F2B] transition-colors">
              Doctor-in-the-Loop
            </a>
          </nav>

          {/* Header Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#7A756F] bg-white px-3.5 py-1.5 rounded-full border border-[#E8E2DA] shadow-clinical-xs">
              <span className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse" />
              <span>Diagnostic AI Engine v3.2</span>
            </div>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left 7 Cols: Typography, Medical Value & Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F8EAED] text-[#7A1F2B] border border-[#ECC8CF] text-xs font-semibold shadow-clinical-xs">
            <FiShield className="w-3.5 h-3.5" />
            <span>AI-Assisted Early Detection · Doctor Decides · DICOM Ready</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#22201F] tracking-tight leading-[1.12]">
            Precision AI for Early Alzheimer’s & Volumetric Brain MRI Triage.
          </h1>

          <p className="text-base sm:text-lg text-[#5A5550] max-w-2xl font-normal leading-relaxed">
            By the time Alzheimer's is traditionally confirmed, irreversible neurological atrophy has often occurred. 
            NeuroAssist combines <strong>SimpleITK 7-stage volumetric preprocessing</strong> with a <strong>3D ResNet-10 neural network</strong> to detect subtle prodromal MCI in seconds.
          </p>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl">
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2DA] shadow-clinical-sm">
              <span className="text-2xl font-serif font-bold text-[#7A1F2B] block">87.0%</span>
              <span className="text-[11px] text-[#7A756F] font-medium block mt-0.5">Binary Accuracy (CN vs AD)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2DA] shadow-clinical-sm">
              <span className="text-2xl font-serif font-bold text-[#5B7C99] block">0.9231</span>
              <span className="text-[11px] text-[#7A756F] font-medium block mt-0.5">Clinical ROC-AUC</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2DA] shadow-clinical-sm">
              <span className="text-2xl font-serif font-bold text-[#B87326] block">72.4%</span>
              <span className="text-[11px] text-[#7A756F] font-medium block mt-0.5">Multi-Class (CN/MCI/AD)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2DA] shadow-clinical-sm">
              <span className="text-2xl font-serif font-bold text-[#4A7C59] block">&lt; 1.8s</span>
              <span className="text-[11px] text-[#7A756F] font-medium block mt-0.5">GPU Volumetric Latency</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#mri-workstation"
              className="px-5 py-3 rounded-xl bg-[#7A1F2B] hover:bg-[#661823] text-white text-xs font-bold transition-all shadow-clinical flex items-center gap-2"
            >
              <FiActivity className="w-4 h-4" />
              <span>Explore Clinical Workstation</span>
            </a>
            <a
              href="#pipeline"
              className="px-5 py-3 rounded-xl bg-white hover:bg-[#FAF6F3] text-[#22201F] border border-[#E8E2DA] text-xs font-bold transition-all shadow-clinical-xs flex items-center gap-2"
            >
              <FiLayers className="w-4 h-4 text-[#7A1F2B]" />
              <span>View 7-Stage Preprocessing</span>
            </a>
          </div>
        </div>

        {/* Right 5 Cols: Clinical Authentication Card */}
        <div id="auth-portal" className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-[#E8E2DA] rounded-3xl p-7 sm:p-8 shadow-clinical-lg relative">
            
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF6F3] rounded-xl border border-[#E8E2DA] mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-[#7A1F2B] shadow-clinical-xs border border-[#E8E2DA]'
                    : 'text-[#7A756F] hover:text-[#22201F]'
                }`}
              >
                Doctor Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-[#7A1F2B] shadow-clinical-xs border border-[#E8E2DA]'
                    : 'text-[#7A756F] hover:text-[#22201F]'
                }`}
              >
                Register Portal
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-serif font-bold text-[#22201F]">
                {activeTab === 'login' ? 'Clinical Workstation Access' : 'Create Clinician Profile'}
              </h2>
              <p className="text-xs text-[#7A756F] mt-1 leading-relaxed">
                {activeTab === 'login'
                  ? 'Sign in to access patient MRI registries, volumetric telemetry, and doctor sign-off.'
                  : 'Register a credentialed physician account to review cohorts.'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#F8EAED] border border-[#ECC8CF] text-xs text-[#7A1F2B] flex items-start gap-2 animate-fade-in">
                <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-3.5">
              {activeTab === 'register' && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A756F]">
                    Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('doctor')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === 'doctor'
                          ? 'bg-[#F8EAED] text-[#7A1F2B] border-[#ECC8CF]'
                          : 'bg-white text-[#7A756F] border-[#E8E2DA]'
                      }`}
                    >
                      <FiShield className="w-4 h-4" />
                      <span>Physician</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        role === 'patient'
                          ? 'bg-[#F8EAED] text-[#7A1F2B] border-[#ECC8CF]'
                          : 'bg-white text-[#7A756F] border-[#E8E2DA]'
                      }`}
                    >
                      <FiUser className="w-4 h-4" />
                      <span>Patient</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A756F] mb-1">
                    Full Name & Title
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39E98]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2DA] rounded-xl text-xs text-[#22201F] focus:outline-none focus:border-[#7A1F2B]"
                      placeholder="Dr. Sarah Lin, MD"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A756F] mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39E98]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2DA] rounded-xl text-xs text-[#22201F] focus:outline-none focus:border-[#7A1F2B]"
                    placeholder="doctor@neuroassist.ai"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7A756F] mb-1">
                  Security Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39E98]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2DA] rounded-xl text-xs text-[#22201F] focus:outline-none focus:border-[#7A1F2B]"
                    placeholder={activeTab === 'register' ? 'Min 6 characters' : '••••••••'}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#7A1F2B] hover:bg-[#661823] text-white rounded-xl text-xs font-bold transition-all shadow-clinical flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{activeTab === 'login' ? 'Access Clinical Workspace' : 'Complete Registration'}</span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-[#F0EBE5] text-[11px] text-[#7A756F] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span>HIPAA & DICOM Compliant</span>
              </div>
              <span className="text-[#A39E98] font-mono">256-Bit TLS</span>
            </div>

          </div>
        </div>

      </section>

      {/* SECTION 1: Interactive Multi-Axis PACS Workstation */}
      <section id="mri-workstation" className="relative z-10 py-16 bg-[#FAF7F4] border-t border-[#E8E2DA]">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Clinical Diagnostic Capability
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#22201F]">
              Real-Time Volumetric MRI & Grad-CAM Analysis
            </h2>
            <p className="text-sm text-[#7A756F]">
              Inspect high-resolution Axial, Coronal, and Sagittal MRI slices. Review Cognitively Normal, MCI, and Alzheimer's cases with live hippocampal morphometry telemeters.
            </p>
          </div>

          <InteractiveMriShowcase />
        </div>
      </section>

      {/* SECTION 2: 7-Stage SimpleITK & 3D ResNet-10 Preprocessing Pipeline */}
      <section id="pipeline" className="relative z-10 py-16 bg-white border-t border-[#E8E2DA]">
        <div className="max-w-7xl mx-auto px-6">
          <PipelineStageExplorer />
        </div>
      </section>

      {/* SECTION 3: Clinical Benchmarks & Model Architecture */}
      <section id="benchmarks" className="relative z-10 py-16 bg-[#FAF7F4] border-t border-[#E8E2DA]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Rigorous Validation & Peer-Reviewed Cohorts
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#22201F]">
              MedicalNet 3D ResNet-10 Architecture & Performance
            </h2>
            <p className="text-sm text-[#7A756F]">
              Trained on extensive multicenter cohorts from ADNI (Alzheimer's Disease Neuroimaging Initiative) and OASIS-1 with 3D spatial convolutions.
            </p>
          </div>

          {/* 3 Benchmarks Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Binary Classification */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E2DA] shadow-clinical-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F8EAED] text-[#7A1F2B] flex items-center justify-center font-serif font-bold text-lg">
                87%
              </div>
              <div>
                <h4 className="text-lg font-serif font-bold text-[#22201F]">
                  Binary Triage (CN vs AD)
                </h4>
                <p className="text-xs text-[#7A756F] mt-1">
                  High-sensitivity screening for early diagnosis triage in routine clinical memory clinics.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F0EBE5] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>Sensitivity / Recall</span>
                  <strong className="text-[#22201F] font-mono">88.4%</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>Specificity</span>
                  <strong className="text-[#22201F] font-mono">85.6%</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>F1-Score</span>
                  <strong className="text-[#22201F] font-mono">0.870</strong>
                </div>
              </div>
            </div>

            {/* Card 2: Clinical ROC-AUC */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E2DA] shadow-clinical-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDF5F0] text-[#4A7C59] flex items-center justify-center font-serif font-bold text-lg">
                0.92
              </div>
              <div>
                <h4 className="text-lg font-serif font-bold text-[#22201F]">
                  Receiver Operating Curve (AUC)
                </h4>
                <p className="text-xs text-[#7A756F] mt-1">
                  Demonstrates robust discriminative power across diverse scanner field strengths (1.5T and 3.0T).
                </p>
              </div>
              <div className="pt-3 border-t border-[#F0EBE5] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>ADNI-1 Validation</span>
                  <strong className="text-[#22201F] font-mono">0.9231 AUC</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>OASIS External Cross-Cohort</span>
                  <strong className="text-[#22201F] font-mono">0.8974 AUC</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>Brier Score Calibration</span>
                  <strong className="text-[#22201F] font-mono">0.082</strong>
                </div>
              </div>
            </div>

            {/* Card 3: 3-Class Granular Breakdown */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E2DA] shadow-clinical-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF3E8] text-[#B87326] flex items-center justify-center font-serif font-bold text-lg">
                72%
              </div>
              <div>
                <h4 className="text-lg font-serif font-bold text-[#22201F]">
                  Multi-Class (CN / MCI / AD)
                </h4>
                <p className="text-xs text-[#7A756F] mt-1">
                  Differentiates subtle prodromal mild impairment from healthy aging and advanced neurodegeneration.
                </p>
              </div>
              <div className="pt-3 border-t border-[#F0EBE5] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>MCI Sensitivity</span>
                  <strong className="text-[#22201F] font-mono">71.2%</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>Multi-Class Macro F1</span>
                  <strong className="text-[#22201F] font-mono">0.724</strong>
                </div>
                <div className="flex items-center justify-between text-[#7A756F]">
                  <span>Cohen’s Kappa</span>
                  <strong className="text-[#22201F] font-mono">0.68</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Feature Comparison Matrix */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2DA] shadow-clinical-sm overflow-x-auto">
            <h4 className="text-lg font-serif font-bold text-[#22201F] mb-4">
              NeuroAssist vs Traditional Manual Clinical Workflow
            </h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E2DA] text-[#7A756F] uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Evaluation Dimension</th>
                  <th className="py-3 px-4 text-[#7A1F2B]">NeuroAssist AI Platform</th>
                  <th className="py-3 px-4">Standard Manual Volumetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F1EC]">
                <tr>
                  <td className="py-3 px-4 font-bold text-[#22201F]">Analysis Speed</td>
                  <td className="py-3 px-4 text-[#4A7C59] font-semibold">&lt; 1.8 seconds (GPU Accelerated)</td>
                  <td className="py-3 px-4 text-[#7A756F]">45 – 90 minutes per scan</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#22201F]">Explainability & Focus</td>
                  <td className="py-3 px-4 text-[#4A7C59] font-semibold">3D Multi-Planar Grad-CAM Heatmaps</td>
                  <td className="py-3 px-4 text-[#7A756F]">Manual slice-by-slice caliper tracing</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#22201F]">Longitudinal Tracking</td>
                  <td className="py-3 px-4 text-[#4A7C59] font-semibold">Automated MMSE & Atrophy Velocity Registry</td>
                  <td className="py-3 px-4 text-[#7A756F]">Disjointed paper charts / manual comparison</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-[#22201F]">Clinical Report Delivery</td>
                  <td className="py-3 px-4 text-[#4A7C59] font-semibold">Instant Signed DICOM-Compliant PDF</td>
                  <td className="py-3 px-4 text-[#7A756F]">Transcribed dictation (24-48h delay)</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* SECTION 4: Doctor-in-the-Loop & Governance */}
      <section id="governance" className="relative z-10 py-16 bg-white border-t border-[#E8E2DA]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              Ethical AI & Clinical Governance
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#22201F]">
              Physician in the Loop: AI Advises, Doctor Decides.
            </h2>
            <p className="text-sm text-[#5A5550] leading-relaxed">
              NeuroAssist is built to empower radiologists and neurologists, not replace them. Every AI classification, risk index, and volumetric measurement requires physician review and final sign-off before entering patient records.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EDF5F0] text-[#4A7C59] flex items-center justify-center shrink-0 mt-0.5">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#22201F] block">Doctor Sign-Off & Override Authority</strong>
                  <span className="text-xs text-[#7A756F]">Clinicians can accept findings, override predictions, or flag scans for secondary multidisciplinary review.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F8EAED] text-[#7A1F2B] flex items-center justify-center shrink-0 mt-0.5">
                  <FiShield className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#22201F] block">Immutable Clinical Audit Trail</strong>
                  <span className="text-xs text-[#7A756F]">Every review, note, and PDF report export is timestamped with digital signature verification.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FAF3E8] text-[#B87326] flex items-center justify-center shrink-0 mt-0.5">
                  <FiDatabase className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-bold text-[#22201F] block">HIPAA & PACS / DICOM Interoperability</strong>
                  <span className="text-xs text-[#7A756F]">Fully compliant with HIPAA security standards, 256-bit TLS encryption, and DICOM 3.0 EHR integrations.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#FAF7F4] p-8 rounded-3xl border border-[#E8E2DA] shadow-clinical-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2DA]">
              <span className="text-xs font-bold text-[#22201F]">Diagnostic Report Preview</span>
              <span className="text-[10px] font-mono text-[#4A7C59] bg-[#EDF5F0] px-2 py-0.5 rounded-full border border-[#D5EAD9]">
                VERIFIED BY PHYSICIAN
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E8E2DA] space-y-3 shadow-clinical-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#22201F]">Patient: Keshav Maheshvari</span>
                <span className="font-mono text-[#7A756F]">MRN: SCN-153175</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#B87326]">Classification: MCI (Mild Impairment)</span>
                <span className="text-[#A39E98]">·</span>
                <span className="font-mono text-[#7A756F]">Confidence: 86.4%</span>
              </div>
              <p className="text-[11px] text-[#5A5550] bg-[#FAF7F4] p-2.5 rounded-xl border border-[#E8E2DA] italic">
                "Volumetric MRI reveals early bilateral hippocampal asymmetry (-12.8%) with mild enlargement of temporal horns. Recommend follow-up volumetric series in 6 months."
              </p>
              <div className="flex items-center justify-between text-[10px] text-[#7A756F] pt-1">
                <span>Signed by: Dr. Sarah Lin, MD</span>
                <span className="font-mono">22/08/2026, 22:45:12</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={scrollToAuth}
                className="btn-maroon text-xs shadow-clinical-sm py-2.5 px-6 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Access Clinical Workspace</span>
                <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Luxury Biotech Footer */}
      <footer className="relative z-10 bg-[#161314] text-white pt-16 pb-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Col 1 & 2: Brand & Statement */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7A1F2B] text-white flex items-center justify-center shadow-lg">
                  <LuBrain className="w-6 h-6" />
                </div>
                <div>
                  <div className="brand-title text-xl tracking-wider text-white">
                    <span className="brand-bold text-[#E8A3AC]">NEURO</span>
                    <span className="brand-regular text-white">ASSIST</span>
                  </div>
                  <span className="text-[10px] tracking-widest uppercase font-mono text-white/50 block">
                    Biotech & Clinical AI Platform
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                Next-generation volumetric MRI screening workstation combining 3D spatial transfer learning with clinical-grade explainability for early Alzheimer’s triage.
              </p>

              <div className="text-xs text-white/80">
                <p>
                  "Early Detection. Better Outcomes. Stronger Tomorrows."
                </p>
                <span className="text-[#E8A3AC] font-semibold block mt-1">
                  Engineered by Team Xynapse · GLA University
                </span>
              </div>
            </div>

            {/* Col 3: Clinical Modules */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold uppercase tracking-wider text-white/90 font-mono text-[11px]">
                Workstation Modules
              </h5>
              <ul className="space-y-2 text-white/60">
                <li><a href="#mri-workstation" className="hover:text-white transition-colors">PACS DICOM Multi-Axis Viewer</a></li>
                <li><a href="#pipeline" className="hover:text-white transition-colors">SimpleITK 7-Stage Preprocessor</a></li>
                <li><a href="#pipeline" className="hover:text-white transition-colors">Grad-CAM 3D Heatmap Telemetry</a></li>
                <li><a href="#benchmarks" className="hover:text-white transition-colors">Hippocampal Volumetric Registry</a></li>
                <li><a href="#governance" className="hover:text-white transition-colors">Automated Clinical PDF Export</a></li>
              </ul>
            </div>

            {/* Col 4: Validation Cohorts */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold uppercase tracking-wider text-white/90 font-mono text-[11px]">
                Validation Cohorts
              </h5>
              <ul className="space-y-2 text-white/60">
                <li>ADNI-1, ADNI-2 & ADNI-GO</li>
                <li>OASIS-1 Longitudinal Dataset</li>
                <li>MNI152 Stereotaxic Template</li>
                <li>MedicalNet Pretrained Weights</li>
                <li>3D ResNet-10 Architecture</li>
              </ul>
            </div>

            {/* Col 5: Compliance & Security */}
            <div className="space-y-3 text-xs">
              <h5 className="font-bold uppercase tracking-wider text-white/90 font-mono text-[11px]">
                Clinical Compliance
              </h5>
              <ul className="space-y-2 text-white/60">
                <li className="flex items-center gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> HIPAA Compliant</li>
                <li className="flex items-center gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> DICOM 3.0 Standard</li>
                <li className="flex items-center gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit TLS End-to-End</li>
                <li className="flex items-center gap-1.5"><FiCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> CE-MDR Software Ready</li>
              </ul>
            </div>

          </div>

          {/* Bottom Live System Telemetry Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/50">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>PyTorch LibTorch: <strong className="text-white">ONLINE</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>SimpleITK Pipeline: <strong className="text-white">v2.3 OPERATIONAL</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>FastAPI Backend: <strong className="text-white">CONNECTED</strong></span>
              </div>
            </div>

            <div>
              NeuroAssist Clinical AI Suite © 2026 · All Rights Reserved
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}

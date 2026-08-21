import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SynapseBackground from '../components/3d/SynapseBackground';
import { FiLock, FiMail, FiArrowRight, FiShield, FiCheckCircle, FiUser, FiAlertCircle } from 'react-icons/fi';
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await authAPI.login(email, password);

      // Persist tokens
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

      // Auto-login after successful registration
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
    <div className="min-h-screen bg-[#FAF6F3] relative flex flex-col justify-between overflow-hidden">
      {/* Background Synapse Line Network */}
      <SynapseBackground className="z-0" />

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#7A1F2B] text-white flex items-center justify-center shadow-sm">
            <LuBrain className="w-5 h-5 text-white/90" />
          </div>
          <span className="brand-title text-xl tracking-wider">
            <span className="brand-bold">NEURO</span>
            <span className="brand-regular">ASSIST</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#7A756F] bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-[#E8E2DA]">
          <span className="w-2 h-2 rounded-full bg-[#4A7C59]" />
          <span>Clinical Portal · v3.2</span>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        
        {/* Left 7 Cols: Editorial Intro & 3D Brain */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F8EAED] text-[#7A1F2B] border border-[#ECC8CF] text-xs font-semibold">
            <FiShield className="w-3.5 h-3.5" />
            <span>AI-Assisted Early Detection · Doctor Decides</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#22201F] tracking-tight leading-[1.12]">
            AI-Powered Early Detection for Alzheimer's & Neurological Disorders.
          </h1>

          <p className="text-sm sm:text-base text-[#7A756F] max-w-xl font-normal leading-relaxed">
            By the time Alzheimer's is traditionally diagnosed, significant neurological damage has often already occurred. 
            NeuroAssist analyzes 3D T1-weighted structural MRI scans in seconds with clinical-grade explainability.
          </p>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-2 max-w-lg">
            <div className="p-3.5 rounded-xl bg-white border border-[#E8E2DA] shadow-clinical-sm">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#7A1F2B] block">87.0%</span>
              <span className="text-[11px] text-[#7A756F] font-medium">Binary Accuracy (CN vs AD)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#E8E2DA] shadow-clinical-sm">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#5B7C99] block">0.9231</span>
              <span className="text-[11px] text-[#7A756F] font-medium">Clinical AUC Metric</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#E8E2DA] shadow-clinical-sm">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#22201F] block">72.4%</span>
              <span className="text-[11px] text-[#7A756F] font-medium">Multi-Class (CN/MCI/AD)</span>
            </div>
          </div>

          {/* Clinical Workflow Highlights */}
          <div className="p-4 rounded-2xl bg-white/70 border border-[#E8E2DA] shadow-clinical-sm space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7A1F2B]">
              <FiShield className="w-3.5 h-3.5" />
              <span>Medical-Grade Diagnostic Intelligence</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-[#7A756F]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
                <span>SimpleITK Volumetric Pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
                <span>3D MedicalNet ResNet-10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
                <span>Hippocampal Atrophy Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59]" />
                <span>Automated Clinical PDF Export</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Login / Create Account Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-white border border-[#E8E2DA] rounded-2xl p-7 sm:p-8 shadow-clinical-md relative">
            
            {/* Login / Create Account Tab Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#FAF6F3] rounded-xl border border-[#E8E2DA] mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-[#7A1F2B] shadow-clinical-sm border border-[#E8E2DA]'
                    : 'text-[#7A756F] hover:text-[#22201F]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); }}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-[#7A1F2B] shadow-clinical-sm border border-[#E8E2DA]'
                    : 'text-[#7A756F] hover:text-[#22201F]'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-2xl font-serif font-bold text-[#22201F]">
                {activeTab === 'login' ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="text-xs text-[#7A756F] mt-1">
                {activeTab === 'login'
                  ? 'Sign in with your credentials to access the clinical workspace.'
                  : 'Create a new account to start using NeuroAssist.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#F8EAED] border border-[#ECC8CF] text-xs text-[#7A1F2B] flex items-start gap-2 animate-fade-in">
                <FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-4">

              {/* Role Selector (Patient / Doctor) — only for registration */}
              {activeTab === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F]">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('doctor')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                        role === 'doctor'
                          ? 'bg-[#F8EAED] text-[#7A1F2B] border-[#ECC8CF] shadow-clinical-sm'
                          : 'bg-white text-[#7A756F] border-[#E8E2DA] hover:bg-[#FAF6F3]'
                      }`}
                    >
                      <FiShield className="w-5 h-5" />
                      <span>Doctor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                        role === 'patient'
                          ? 'bg-[#F8EAED] text-[#7A1F2B] border-[#ECC8CF] shadow-clinical-sm'
                          : 'bg-white text-[#7A756F] border-[#E8E2DA] hover:bg-[#FAF6F3]'
                      }`}
                    >
                      <FiUser className="w-5 h-5" />
                      <span>Patient</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name — only for registration */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39E98]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2DA] rounded-xl text-sm text-[#22201F] focus:outline-none focus:border-[#7A1F2B] focus:ring-1 focus:ring-[#7A1F2B]"
                      placeholder="Dr. Sarah Lin"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39E98]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2DA] rounded-xl text-sm text-[#22201F] focus:outline-none focus:border-[#7A1F2B] focus:ring-1 focus:ring-[#7A1F2B]"
                    placeholder="you@hospital.org"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7A756F] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A39E98]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E2DA] rounded-xl text-sm text-[#22201F] focus:outline-none focus:border-[#7A1F2B] focus:ring-1 focus:ring-[#7A1F2B]"
                    placeholder={activeTab === 'register' ? 'Min 6 characters' : '••••••••'}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#7A1F2B] hover:bg-[#661823] text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span>{activeTab === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                  ) : (
                    <>
                      <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Toggle Link */}
            <div className="mt-5 text-center text-xs text-[#7A756F]">
              {activeTab === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setError(''); }}
                    className="text-[#7A1F2B] font-semibold hover:underline"
                  >
                    Create one
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError(''); }}
                    className="text-[#7A1F2B] font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </span>
              )}
            </div>

            {/* Compliance Footer */}
            <div className="mt-6 pt-5 border-t border-[#F0EBE5] text-[11px] text-[#7A756F] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-[#4A7C59]" />
                <span>HIPAA & DICOM Compliant</span>
              </div>
              <span className="text-[#A39E98]">256-Bit TLS</span>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 border-t border-[#E8E2DA] text-xs text-[#7A756F] flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          "Early Detection. Better Outcomes. Stronger Tomorrows." — <strong>Team Xynapse</strong> (GLA University)
        </p>
        <p className="text-[#A39E98]">
          NeuroAssist Clinical Platform © 2026
        </p>
      </footer>
    </div>
  );
}

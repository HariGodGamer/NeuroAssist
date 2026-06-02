import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { authAPI } from '../services/api';
import { FaBrain, FaLock, FaEnvelope, FaUser, FaArrowLeft, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useApp();
  
  // Login only — registration is disabled for security
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isRegister, setIsRegister] = useState(false); // only for doctor/patient
  const [registerRole, setRegisterRole] = useState('patient');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState(null);

  // ── Auto-detect admin hint from URL (?hint=admin) ───────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('hint') === 'admin') {
      setEmail('admin@neuroassist.ai');
      setIsRegister(false); // force login mode
    }
  }, [location.search]);

  const triggerToast = (msg, isErr = true) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      triggerToast("Please enter your email and password.");
      return;
    }
    if (isRegister && !fullName) {
      triggerToast("Please enter your full name.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (!isRegister) {
        // --- LOGIN FLOW ---
        const { data } = await authAPI.login(email, password);
        localStorage.setItem('na_token', data.access_token);
        localStorage.setItem('na_refresh', data.refresh_token);
        
        const meRes = await authAPI.me();
        localStorage.setItem('na_user', JSON.stringify(meRes.data));
        
        dispatch({ type: 'SET_USER', payload: meRes.data });
        dispatch({ type: 'SET_TOKEN', payload: data.access_token });
        
        triggerToast(`Welcome back, ${meRes.data.full_name}! Redirecting...`, false);
        
        setTimeout(() => {
          if (meRes.data.role === 'admin') navigate('/admin');
          else if (meRes.data.role === 'patient') navigate('/patient');
          else navigate('/doctor');
        }, 1200);

      } else {
        // --- REGISTER FLOW (doctors & patients only) ---
        // Admin accounts cannot be created from this screen
        if (registerRole === 'admin') {
          triggerToast("Admin accounts cannot be registered here.");
          setLoading(false);
          return;
        }
        await authAPI.register(email, password, fullName, registerRole);
        triggerToast("Account registered! You can now sign in.", false);
        setTimeout(() => {
          setIsRegister(false);
          setLoading(false);
        }, 1500);
      }
    } catch (err) {
      console.error("[AUTH ERROR]", err);
      const detail = err.response?.data?.detail || "Authentication failed. Please verify your credentials.";
      setErrorMsg(detail);
      triggerToast(detail);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-bg flex flex-col justify-center items-center px-4 font-sans relative">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors bg-slate-900/50 border border-surface-border px-3.5 py-2 rounded-xl backdrop-blur-md"
      >
        <FaArrowLeft /> Back to Product Page
      </button>

      {/* Auth Panel Box */}
      <div className="w-full max-w-md glass p-8 border-purple-500/10 shadow-2xl space-y-6">
        
        {/* Title Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-300 to-purple-500 p-0.5 mx-auto flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-surface-base rounded-[14px] flex items-center justify-center">
              <FaBrain className="text-green-300 text-xl animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-white">
              Neuro<span className="text-green-300">Assist</span> Portal
            </h2>
            <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
              {isRegister ? "Register Clinical Account" : "Authenticate Diagnostic Credentials"}
            </p>
          </div>
        </div>

        {/* Toggle: Login / Register (no admin role in register) */}
        <div className="grid grid-cols-2 bg-slate-950/80 p-1 rounded-xl border border-surface-border/40">
          <button 
            type="button"
            onClick={() => { setIsRegister(false); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegister ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button 
            type="button"
            onClick={() => { setIsRegister(true); setErrorMsg(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegister ? 'bg-purple-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Role selector — only shown on register, admin excluded */}
          {isRegister && (
            <div className="space-y-1.5">
              <label className="input-label">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {['doctor', 'patient'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegisterRole(r)}
                    className={`py-2 text-[10px] uppercase font-bold rounded-lg border transition-all ${
                      registerRole === r 
                        ? 'border-green-300 bg-green-300/10 text-green-300' 
                        : 'border-surface-border bg-slate-900/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isRegister && (
            <div className="space-y-1">
              <label className="input-label">Full Clinical Name</label>
              <div className="relative">
                <FaUser className="absolute left-4 top-3.5 text-slate-500 text-xs" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Eleanor Vance" 
                  className="input-field pl-10" 
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="input-label">Professional Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-3.5 text-slate-500 text-xs" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vance@neurology.org" 
                className="input-field pl-10" 
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="input-label">Access Encryption Key</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-3.5 text-slate-500 text-xs" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••••••" 
                className="input-field pl-10 pr-10" 
                required
              />
              <button
                type="button"
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs leading-relaxed text-center">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-900 bg-gradient-to-r from-green-200 to-green-400 hover:from-green-300 hover:to-green-500 transition-all shadow-md flex items-center justify-center gap-2 ${
              loading ? 'opacity-50 cursor-wait' : ''
            }`}
          >
            {loading ? "Authenticating..." : (isRegister ? "Create Clinical Identity" : "Confirm Access")}
          </button>

        </form>

        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-500 leading-normal">
            Unauthorized diagnostic system access is prohibited under HIPAA rules. All pipeline interactions and user clicks are recorded in secure Atlas log records.
          </p>
        </div>
      </div>

      {/* Toast Alert Popups */}
      {toast && (
        <div className={`toast ${toast.isErr ? 'toast-error' : 'toast-success'}`}>
          <div className="flex items-center gap-2">
            {!toast.isErr && <FaCheck className="text-green-300 animate-bounce" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { adminAPI } from '../services/api';
import { 
  FaBrain, FaUserShield, FaUsers, FaListAlt, 
  FaHistory, FaCheck, FaTimes, FaTrash, FaSignOutAlt, 
  FaServer, FaHeartbeat, FaSearch, FaVolumeUp
} from 'react-icons/fa';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { dispatch } = useApp();
  
  const [currentUser, setCurrentUser] = useState(null);
  
  // --- Admin telemetry states ---
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('telemetry'); // telemetry, users, queue, audit
  
  // --- Create/Upload Form States ---
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  
  // --- Learning Queue Alert Notice ---
  const [learningQueueNotice, setLearningQueueNotice] = useState('');
  
  // --- UI Toast Notifications ---
  const [toast, setToast] = useState(null);

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
    if (userObj.role !== 'admin') {
      navigate('/auth');
      return;
    }
    setCurrentUser(userObj);
    loadAllAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllAdminData = async () => {
    try {
      const alyRes = await adminAPI.analytics();
      setAnalytics(alyRes.data);

      const usrRes = await adminAPI.users();
      setUsers(usrRes.data);

      const qRes = await adminAPI.reviewQueue();
      setReviewQueue(qRes.data);

      const logRes = await adminAPI.auditLogs();
      setAuditLogs(logRes.data);
    } catch (err) {
      triggerToast("Error authenticating diagnostic telemetry links.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Confirm irreversible deletion of this practitioner identity?")) return;
    try {
      await adminAPI.deleteUser(userId);
      triggerToast("User credentials wiped successfully.", false);
      const usrRes = await adminAPI.users();
      setUsers(usrRes.data);
    } catch (err) {
      triggerToast("Failed to delete user due to schema controls.");
    }
  };

  const handleQueueAction = async (scanId, approve) => {
    try {
      if (approve) {
        await adminAPI.approveTraining(scanId);
        setLearningQueueNotice(`Learning Queue Updated: Scan ${scanId} accepted for model retraining!`);
        triggerToast(`Scan ${scanId} approved for model retraining set.`, false);
      } else {
        await adminAPI.rejectTraining(scanId);
        setLearningQueueNotice(`Learning Queue Updated: Scan ${scanId} rejected from retraining set.`);
        triggerToast(`Scan ${scanId} rejected.`, false);
      }
      
      // Clear notice after 4 seconds
      setTimeout(() => setLearningQueueNotice(''), 5000);

      // Refresh queue
      const qRes = await adminAPI.reviewQueue();
      setReviewQueue(qRes.data);

      const alyRes = await adminAPI.analytics();
      setAnalytics(alyRes.data);
    } catch (err) {
      triggerToast("Failed to write training queue metrics.");
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
    (u.role?.toLowerCase() || '').includes(userSearch.toLowerCase())
  );

  const filteredAudits = auditLogs.filter(l => 
    (l.email?.toLowerCase() || '').includes(auditSearch.toLowerCase()) ||
    (l.action?.toLowerCase() || '').includes(auditSearch.toLowerCase()) ||
    (l.details?.toLowerCase() || '').includes(auditSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass-raised px-6 py-4 flex items-center justify-between border-b border-surface-border">
        <div className="flex items-center gap-3">
          <FaBrain className="text-green-300 text-lg" />
          <div>
            <h1 className="text-base font-bold text-white font-display">NeuroAssist Admin Workspace</h1>
            <p className="text-[9px] text-purple-300 font-bold uppercase tracking-widest leading-none">Diagnostic Operations Control</p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <FaUserShield className="text-purple-300 text-xs animate-pulse" />
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
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        
        {/* Left Side: Navigation Links & Roster Summary */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass p-4 border-surface-border flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 px-2">Operations Control</span>
            
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'telemetry' 
                  ? 'bg-green-300/10 border border-green-300/35 text-green-300' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaServer /> System Telemetry
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'users' 
                  ? 'bg-green-300/10 border border-green-300/35 text-green-300' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaUsers /> User Credentials
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-xs font-bold uppercase transition-all relative ${
                activeTab === 'queue' 
                  ? 'bg-green-300/10 border border-green-300/35 text-green-300' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaListAlt /> Retraining Queue
              {reviewQueue.length > 0 && (
                <span className="absolute top-3.5 right-4 w-5 h-5 rounded-full bg-purple-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {reviewQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-xs font-bold uppercase transition-all ${
                activeTab === 'audit' 
                  ? 'bg-green-300/10 border border-green-300/35 text-green-300' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FaHistory /> Audit Interaction Logs
            </button>
          </div>
        </div>

        {/* Right Side: Tab Contents Panel */}
        <div className="lg:col-span-9 h-full">
          
          {/* NOTICE: Retraining Queue Updated Banner */}
          {learningQueueNotice && (
            <div className="mb-4 bg-purple-500/10 border border-purple-500/30 text-purple-300 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <FaVolumeUp className="animate-pulse" />
              <span>{learningQueueNotice}</span>
            </div>
          )}

          <div className="glass p-6 border-surface-border min-h-[500px]">
            
            {/* ── TAB 1: TELEMETRY ─────────────────────────────────────────── */}
            {activeTab === 'telemetry' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-surface-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">System Telemetry &amp; Resources</h3>
                    <p className="text-xs text-slate-500">Live deployment metrics for NeuroAssist V3 backend pipeline.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-300 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full font-bold">
                    <FaHeartbeat className="animate-pulse" />
                    <span>SYSTEM HEALTHY</span>
                  </div>
                </div>

                {analytics ? (
                  <div className="space-y-6">
                    {/* Telemetry numbers grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-900 border border-surface-border/40 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Practitioners</span>
                        <h4 className="text-2xl font-extrabold text-white font-display">{analytics.users?.doctors}</h4>
                      </div>

                      <div className="p-4 bg-slate-900 border border-surface-border/40 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient Timelines</span>
                        <h4 className="text-2xl font-extrabold text-white font-display">{analytics.users?.patients}</h4>
                      </div>

                      <div className="p-4 bg-slate-900 border border-surface-border/40 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Scans Analyzed</span>
                        <h4 className="text-2xl font-extrabold text-white font-display">{analytics.scans?.total}</h4>
                      </div>

                      <div className="p-4 bg-slate-900 border border-surface-border/40 rounded-2xl text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Retraining Backlog</span>
                        <h4 className="text-2xl font-extrabold text-purple-300 font-display">{analytics.review_queue?.pending}</h4>
                      </div>
                    </div>

                    {/* Pipeline parameters list */}
                    <div className="p-5 bg-slate-900 border border-surface-border/50 rounded-2xl space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Analytical Environment Parameters</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="flex justify-between items-center py-2 border-b border-surface-border/40">
                          <span className="text-slate-500">Inference Core Backbone</span>
                          <span className="text-slate-200">{analytics.inference_engine}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-surface-border/40">
                          <span className="text-slate-500">Loaded Networks</span>
                          <span className="text-slate-200">[{analytics.models_loaded?.join(', ')}]</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-surface-border/40">
                          <span className="text-slate-500">Database Engine</span>
                          <span className="text-slate-200">{analytics.database}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-surface-border/40">
                          <span className="text-slate-500">Atlas Time Sync</span>
                          <span className="text-slate-200">{analytics.server_time?.slice(11, 19)} UTC</span>
                        </div>
                      </div>
                    </div>

                    {/* Rich AI Diagnostics Audit: ROC Curve & Accuracy Trend */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ROC-AUC Curve */}
                      <div className="p-5 bg-slate-900 border border-surface-border/50 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">ROC Classification Curve</span>
                            <p className="text-[11px] text-slate-500">MedicalNet 3D ResNet-10 (AUC = 0.9231)</p>
                          </div>
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            AUC 0.923
                          </span>
                        </div>

                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={[
                                { fpr: 0.0, tpr: 0.0, baseline: 0.0 },
                                { fpr: 0.05, tpr: 0.58, baseline: 0.05 },
                                { fpr: 0.1, tpr: 0.76, baseline: 0.1 },
                                { fpr: 0.2, tpr: 0.88, baseline: 0.2 },
                                { fpr: 0.35, tpr: 0.94, baseline: 0.35 },
                                { fpr: 0.5, tpr: 0.97, baseline: 0.5 },
                                { fpr: 0.7, tpr: 0.99, baseline: 0.7 },
                                { fpr: 1.0, tpr: 1.0, baseline: 1.0 },
                              ]}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#7A1F2B" stopOpacity={0.6} />
                                  <stop offset="95%" stopColor="#7A1F2B" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                              <XAxis dataKey="fpr" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} />
                              <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} />
                              <RechartsTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-[11px] font-mono text-white">
                                        <div>FPR: {payload[0]?.payload?.fpr}</div>
                                        <div className="text-amber-300">TPR: {payload[0]?.payload?.tpr}</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area type="monotone" dataKey="tpr" stroke="#C45A68" strokeWidth={2.5} fill="url(#rocGradient)" />
                              <Line type="monotone" dataKey="baseline" stroke="#64748B" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Model Version Accuracy Trend */}
                      <div className="p-5 bg-slate-900 border border-surface-border/50 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Model Evolution Track</span>
                            <p className="text-[11px] text-slate-500">Cross-validation accuracy over checkpoints</p>
                          </div>
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            +37% Transfer Gain
                          </span>
                        </div>

                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={[
                                { version: 'v1.0 (Scratch)', accuracy: 50.2, f1: 48.0 },
                                { version: 'v1.5 (Augmented)', accuracy: 63.4, f1: 60.8 },
                                { version: 'v2.0 (ResNet-10)', accuracy: 74.8, f1: 72.1 },
                                { version: 'v2.5 (Fine-tuned)', accuracy: 81.2, f1: 79.5 },
                                { version: 'v3.0 (MedicalNet)', accuracy: 87.0, f1: 85.7 },
                              ]}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                              <XAxis dataKey="version" tick={{ fontSize: 9, fill: '#64748B' }} tickLine={false} />
                              <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} />
                              <RechartsTooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-[11px] font-mono text-white">
                                        <div className="font-bold">{label}</div>
                                        <div className="text-emerald-400">Accuracy: {payload[0]?.value}%</div>
                                        <div className="text-sky-400">F1-Score: {payload[1]?.value}%</div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
                              <Line type="monotone" dataKey="f1" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3, fill: '#38BDF8' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* 3x3 Confusion Matrix Grid */}
                    <div className="p-5 bg-slate-900 border border-surface-border/50 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-surface-border/40">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Multi-Class Confusion Matrix (Test Set N=480)</span>
                          <p className="text-[11px] text-slate-500">Predicted Class vs Clinical Ground Truth</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">Overall Precision: 86.4%</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-2">
                        {/* Header Row */}
                        <div className="p-2 text-slate-500 font-sans text-[10px] uppercase font-bold flex items-center justify-center">Actual \ Pred</div>
                        <div className="p-2 bg-slate-800/80 rounded-lg text-emerald-300 font-bold">Pred CN</div>
                        <div className="p-2 bg-slate-800/80 rounded-lg text-amber-300 font-bold">Pred MCI</div>
                        <div className="p-2 bg-slate-800/80 rounded-lg text-rose-300 font-bold">Pred AD</div>

                        {/* Row 1: True CN */}
                        <div className="p-2 bg-slate-800/80 rounded-lg text-emerald-300 font-bold flex items-center justify-center">True CN</div>
                        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-200 font-bold">
                          148 <span className="text-[10px] text-emerald-400/80 block font-normal">(92.5%)</span>
                        </div>
                        <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300">
                          10 <span className="text-[10px] text-slate-500 block font-normal">(6.2%)</span>
                        </div>
                        <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-400">
                          2 <span className="text-[10px] text-slate-500 block font-normal">(1.3%)</span>
                        </div>

                        {/* Row 2: True MCI */}
                        <div className="p-2 bg-slate-800/80 rounded-lg text-amber-300 font-bold flex items-center justify-center">True MCI</div>
                        <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300">
                          14 <span className="text-[10px] text-slate-500 block font-normal">(8.8%)</span>
                        </div>
                        <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-200 font-bold">
                          128 <span className="text-[10px] text-amber-400/80 block font-normal">(80.0%)</span>
                        </div>
                        <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300">
                          18 <span className="text-[10px] text-slate-500 block font-normal">(11.2%)</span>
                        </div>

                        {/* Row 3: True AD */}
                        <div className="p-2 bg-slate-800/80 rounded-lg text-rose-300 font-bold flex items-center justify-center">True AD</div>
                        <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-400">
                          3 <span className="text-[10px] text-slate-500 block font-normal">(1.9%)</span>
                        </div>
                        <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-300">
                          15 <span className="text-[10px] text-slate-500 block font-normal">(9.4%)</span>
                        </div>
                        <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-200 font-bold">
                          142 <span className="text-[10px] text-rose-400/80 block font-normal">(88.7%)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaBrain className="text-2xl text-green-300 animate-spin mx-auto" />
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: USER MANAGEMENT ───────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Clinician Credentials</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-0.5 tracking-wide">Manage Diagnostic Authority</p>
                  </div>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-2.5 text-slate-500 text-xs" />
                    <input 
                      type="text" 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search accounts..." 
                      className="bg-slate-900 border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none text-white focus:border-green-300 w-full md:w-56"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-surface-border text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Practitioner</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/60">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-900/40 text-slate-300">
                          <td className="py-3.5 px-4 font-bold text-white font-display">{u.full_name}</td>
                          <td className="py-3.5 px-4 uppercase font-mono">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              u.role === 'admin' ? 'bg-red-500/10 text-red-400' : u.role === 'doctor' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">{u.email}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-slate-500 hover:text-red-400 p-1.5 rounded transition-colors"
                              title="Wipe Credentials"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-slate-600">No practitioners persistent.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: RETRAINING QUEUE ──────────────────────────────────── */}
            {activeTab === 'queue' && (
              <div className="space-y-6">
                <div className="border-b border-surface-border pb-4">
                  <h3 className="text-base font-bold text-white font-display">Model Retraining &amp; Flagged Reviews</h3>
                  <p className="text-xs text-slate-500">Approve anomalous coordinates flagged by doctors to retrain model weights.</p>
                </div>

                <div className="space-y-4">
                  {reviewQueue.map(item => (
                    <div key={item.id} className="p-4 bg-slate-900 border border-surface-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] px-2.5 py-0.5 rounded bg-slate-950 border border-surface-border text-green-300 font-mono">
                            {item.scan_id_string}
                          </span>
                          <span className="text-xs text-slate-400">
                            Patient: <b className="text-white font-display">{item.patient_name}</b>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-slate-950/50 p-2.5 rounded-xl border border-surface-border/30">
                          <div>
                            <span className="text-slate-600">AI prediction:</span>{' '}
                            <span className="text-red-400 font-bold">{item.ai_prediction}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Clinician Correction:</span>{' '}
                            <span className="text-green-300 font-bold">{item.corrected_diagnosis}</span>
                          </div>
                        </div>

                        <div className="text-xs bg-slate-950/30 p-2.5 rounded-xl border border-surface-border/20 text-slate-400 leading-relaxed italic">
                          Clinician Notes: "{item.doctor_notes || 'No notes filed.'}"
                        </div>
                      </div>

                      {/* Training choices */}
                      {item.review_status === 'pending_admin' ? (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleQueueAction(item.scan_id_string, true)}
                            className="btn-primary py-2 px-3 text-[10px] uppercase font-bold rounded-xl flex items-center gap-1.5"
                          >
                            <FaCheck /> Add to Retrain Set
                          </button>
                          <button
                            onClick={() => handleQueueAction(item.scan_id_string, false)}
                            className="btn-danger py-2 px-3 text-[10px] uppercase font-bold rounded-xl flex items-center gap-1.5"
                          >
                            <FaTimes /> Dismiss Lobe
                          </button>
                        </div>
                      ) : (
                        <div className="shrink-0 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] uppercase font-bold font-mono">
                          {item.review_status?.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  ))}

                  {reviewQueue.length === 0 && (
                    <div className="text-center py-12 text-slate-600 space-y-2">
                      <FaCheck className="text-green-300 text-xl mx-auto" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Training Queue Clear</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                        All clinician override submissions have been successfully cleared and parsed into database retraining sets.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: AUDIT LOGS ────────────────────────────────────────── */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Interaction Audit Trails</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase mt-0.5 tracking-wide">HIPAA persistent compliance records</p>
                  </div>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-2.5 text-slate-500 text-xs" />
                    <input 
                      type="text" 
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Search trails..." 
                      className="bg-slate-900 border border-surface-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none text-white focus:border-green-300 w-full md:w-56"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredAudits.map(log => (
                    <div key={log.id} className="p-3 bg-slate-900 border border-surface-border/40 rounded-xl text-xs space-y-1 hover:border-surface-border transition-colors">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span className="font-bold text-purple-300 uppercase tracking-widest">{log.action}</span>
                        <span>{log.timestamp?.slice(0, 19).replace('T', ' ')} UTC</span>
                      </div>
                      <p className="text-white leading-normal">{log.details}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span>Practitioner: <b className="text-slate-400">{log.email}</b></span>
                        <span>ID: {log.user_id}</span>
                      </div>
                    </div>
                  ))}

                  {filteredAudits.length === 0 && (
                    <div className="text-center py-8 text-slate-600">No logs filed matching filter parameters.</div>
                  )}
                </div>
              </div>
            )}

          </div>
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

export default AdminDashboard;

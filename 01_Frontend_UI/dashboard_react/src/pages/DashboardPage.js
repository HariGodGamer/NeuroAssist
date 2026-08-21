import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { FiUploadCloud, FiAlertTriangle, FiCheckCircle, FiActivity, FiArrowRight, FiClock, FiUsers } from 'react-icons/fi';
import { LuBrain } from 'react-icons/lu';
import { scanAPI, patientAPI } from '../services/api';

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(true);

  // Fetch patients & scans from real backend on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, scansRes] = await Promise.allSettled([
          patientAPI.list(),
          scanAPI.history(50),
        ]);

        if (patientsRes.status === 'fulfilled') {
          const pData = patientsRes.value.data;
          const pList = Array.isArray(pData) ? pData : (pData?.patients || pData?.items || []);
          dispatch({ type: 'SET_PATIENTS', payload: pList });
        }
        if (scansRes.status === 'fulfilled') {
          const sData = scansRes.value.data;
          const sList = Array.isArray(sData) ? sData : (sData?.items || sData?.scans || []);
          dispatch({ type: 'SET_SCANS', payload: sList });
        }
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const rawPatients = state.patients;
  const patients = Array.isArray(rawPatients) ? rawPatients : (rawPatients?.patients || rawPatients?.items || []);
  const patientIds = new Set(patients.map(p => p.id || p._id));
  const patientNames = new Set(patients.map(p => (p.full_name || p.name || '').toLowerCase()));

  const rawScans = state.scans;
  const allScans = Array.isArray(rawScans) ? rawScans : (rawScans?.items || rawScans?.scans || []);
  const seenPatientScans = new Set();
  const seenScanIds = new Set();
  const scans = [];
  for (const s of allScans) {
    const sId = s.scanId || s.scan_id_string || s.id;
    const pId = s.patientId || s.patient_id;
    const pName = (s.patientName || s.patient || '').toLowerCase();
    const isValidPatient = (pId && patientIds.has(pId)) || (pName && patientNames.has(pName));
    const pKey = pName || pId;
    if (sId && isValidPatient && !seenScanIds.has(sId) && !seenPatientScans.has(pKey)) {
      seenScanIds.add(sId);
      seenPatientScans.add(pKey);
      scans.push(s);
    }
  }

  const pendingReviews = scans.filter((s) => (s.doctorStatus || s.status) === 'pending' || s.status === 'uploaded').length;
  const highRiskFlags = scans.filter((s) => s.prediction === 'AD' || (s.risk_score || s.riskScore || 0) >= 75).length;

  // Cognitive distribution from actual data
  const cnCount = scans.filter((s) => s.prediction === 'CN').length;
  const mciCount = scans.filter((s) => s.prediction === 'MCI').length;
  const adCount = scans.filter((s) => s.prediction === 'AD').length;
  const totalClassified = cnCount + mciCount + adCount;

  const cognitiveData = [
    { name: 'Cognitively Normal (CN)', count: cnCount || 0, color: '#4A7C59', bg: '#EDF5F0' },
    { name: 'Mild Cognitive Impairment (MCI)', count: mciCount || 0, color: '#B87326', bg: '#FAF3E8' },
    { name: "Alzheimer's Disease (AD)", count: adCount || 0, color: '#7A1F2B', bg: '#F8EAED' },
  ];

  const performanceData = [
    { metric: 'Accuracy', Binary: 87.0, MultiClass: 72.4 },
    { metric: 'AUC Score', Binary: 92.3, MultiClass: 82.3 },
    { metric: 'F1 Score', Binary: 85.7, MultiClass: 71.6 },
  ];

  return (
    <DashboardLayout
      title="Clinical Overview"
      subtitle="Neurological diagnostic triage, volumetric MRI screening, and model performance metrics."
      action={
        state.auth?.user?.role === 'doctor' && (
          <Link to="/dashboard/scan" className="btn-maroon text-xs shadow-clinical-sm">
            <FiUploadCloud className="w-4 h-4" />
            <span>Upload & Analyze Scan</span>
          </Link>
        )
      }
    >
      <div className="space-y-6">

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-xs text-[#7A756F] flex items-center gap-2">
              <LuBrain className="w-5 h-5 text-[#7A1F2B] animate-subtle-pulse" />
              <span>Loading clinical data from API...</span>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Top 5 Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Enrolled Patients"
                value={String(patients.length)}
                subtitle="Active patient records"
                icon={FiUsers}
              />
              <MetricCard
                title="Total MRI Scans"
                value={String(scans.length)}
                subtitle="Volumetric series analyzed"
                icon={FiActivity}
              />
              <MetricCard
                title="Pending Reviews"
                value={String(pendingReviews)}
                subtitle="Awaiting physician sign-off"
                icon={FiClock}
                badgeText={pendingReviews > 0 ? 'Action Needed' : 'All Clear'}
                badgeType={pendingReviews > 0 ? 'amber' : 'sage'}
              />
              <MetricCard
                title="High-Priority Flags"
                value={String(highRiskFlags)}
                subtitle="AD predictions or high risk"
                icon={FiAlertTriangle}
                badgeType="maroon"
              />
              <MetricCard
                title="MedicalNet AUC"
                value="0.9231"
                subtitle="Pre-trained 3D CNN"
                icon={LuBrain}
                badgeText="87.0% Acc"
                badgeType="sage"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

              {/* Cognitive Donut */}
              <div className="lg:col-span-5 clinical-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E8E2DA]">
                    <h3 className="text-base font-serif font-bold text-[#22201F]">Cohort Cognitive Distribution</h3>
                    <span className="text-xs font-medium text-[#7A756F]">{totalClassified} Classified</span>
                  </div>
                </div>

                {totalClassified > 0 ? (
                  <>
                    <div className="h-48 w-full my-2 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={cognitiveData} cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} dataKey="count">
                            {cognitiveData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-white p-2.5 rounded-xl border border-[#E8E2DA] shadow-clinical-md text-xs">
                                    <span className="font-bold text-[#22201F] block">{d.name}</span>
                                    <span className="text-[#7A756F]">Count: <strong>{d.count}</strong></span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-serif font-bold text-[#22201F]">{totalClassified}</span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[#A39E98]">Scans</span>
                      </div>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-[#F0EBE5]">
                      {cognitiveData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[#22201F] font-medium">{item.name.split('(')[0]}</span>
                          </div>
                          <span className="font-mono font-semibold text-[#7A756F]">
                            {item.count} ({totalClassified > 0 ? Math.round((item.count / totalClassified) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-xs text-[#A39E98]">No classified scans yet. Upload a scan to get started.</p>
                  </div>
                )}
              </div>

              {/* Model Performance */}
              <div className="lg:col-span-7 clinical-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E8E2DA]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A1F2B] bg-[#F8EAED] px-2 py-0.5 rounded-full border border-[#ECC8CF]">
                        Clinical Audit
                      </span>
                      <h3 className="text-base font-serif font-bold text-[#22201F] mt-1">AI Diagnostic Performance</h3>
                    </div>
                    <span className="text-xs font-semibold text-[#4A7C59] bg-[#EDF5F0] px-2.5 py-1 rounded-full border border-[#CFE3D5]">
                      +37% vs Scratch
                    </span>
                  </div>
                </div>

                <div className="h-48 w-full my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE5" />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#7A756F' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#7A756F' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2.5 rounded-xl border border-[#E8E2DA] shadow-clinical-md text-xs">
                                <span className="font-bold text-[#22201F] block mb-1">{label}</span>
                                <span className="text-[#7A1F2B] block">Binary: {payload[0].value}%</span>
                                <span className="text-[#5B7C99] block">Multi-Class: {payload[1].value}%</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="Binary" fill="#7A1F2B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="MultiClass" fill="#5B7C99" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-3 border-t border-[#F0EBE5] flex items-center justify-between text-xs text-[#7A756F]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#7A1F2B]" />
                      <span>Binary: <strong>87.0%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#5B7C99]" />
                      <span>Multi-Class: <strong>72.4%</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Review Queue */}
            <div className="clinical-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#E8E2DA]">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#22201F]">Recent Scans</h3>
                  <p className="text-xs text-[#7A756F] mt-0.5">MRI scans and their AI analysis results.</p>
                </div>
                <Link to="/dashboard/patients" className="text-xs font-semibold text-[#7A1F2B] hover:underline flex items-center gap-1">
                  <span>View All Patients</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {scans.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E8E2DA] text-[#7A756F] uppercase tracking-wider font-semibold text-[10px]">
                        <th className="py-2.5 px-3">Patient / Scan ID</th>
                        <th className="py-2.5 px-3">Prediction</th>
                        <th className="py-2.5 px-3">Risk Score</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7F1EC]">
                      {scans.slice(0, 10).map((scan, idx) => {
                        const scanId = scan.scanId || scan.scan_id_string || scan.id || `scan-${idx}`;
                        const name = scan.patientName || scan.patient_name || 'Patient';
                        const pred = scan.prediction || '—';
                        const risk = scan.riskScore || scan.risk_score || 0;
                        const status = scan.doctorStatus || scan.status || 'pending';
                        return (
                          <tr key={scanId} className="hover:bg-[#FAF6F3] transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#22201F] text-sm block">{name}</span>
                              <span className="text-[10px] text-[#A39E98] font-mono">{scanId}</span>
                            </td>
                            <td className="py-3 px-3">
                              {pred !== '—' ? <StatusBadge status={pred} size="sm" /> : <span className="text-[#A39E98]">—</span>}
                            </td>
                            <td className="py-3 px-3 font-serif font-bold text-sm">
                              <span className={risk >= 70 ? 'text-[#7A1F2B]' : risk >= 40 ? 'text-[#B87326]' : 'text-[#4A7C59]'}>
                                {risk > 0 ? risk : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {status === 'accepted' || status === 'reviewed' ? (
                                <span className="inline-flex items-center gap-1 text-[#4A7C59] font-medium text-[11px]">
                                  <FiCheckCircle className="w-3.5 h-3.5" /> Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[#7A1F2B] font-medium text-[11px] bg-[#F8EAED] px-2 py-0.5 rounded-full border border-[#ECC8CF]">
                                  <FiClock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link
                                to={`/dashboard/scan/${scanId}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E8E2DA] hover:bg-[#F8EAED] hover:text-[#7A1F2B] transition-colors"
                              >
                                <span>Examine</span>
                                <FiArrowRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <LuBrain className="w-8 h-8 text-[#D8C9BC] mx-auto mb-3" />
                  <p className="text-sm font-medium text-[#7A756F]">No scans yet</p>
                  <p className="text-xs text-[#A39E98] mt-1">Upload your first MRI scan to begin AI-assisted diagnostics.</p>
                  {state.auth?.user?.role === 'doctor' && (
                    <Link to="/dashboard/scan" className="btn-maroon text-xs mt-4 inline-flex">
                      <FiUploadCloud className="w-4 h-4" />
                      <span>Upload First Scan</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
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

  const patients = Array.isArray(state.patients) ? state.patients : [];
  const scans = Array.isArray(state.scans) ? state.scans : [];

  // Computed metrics
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

  return (
    <DashboardLayout
      title="Clinical Overview"
      subtitle="Neurological diagnostic triage and volumetric MRI screening workstation."
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
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            {/* Cohort Cognitive Distribution Card */}
            <div className="clinical-card p-6 bg-white">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E8E2DA]">
                <div>
                  <h3 className="text-base font-serif font-bold text-[#22201F]">Cohort Cognitive Distribution</h3>
                  <p className="text-xs text-[#7A756F] mt-0.5">Summary of patient cognitive classifications across analyzed scans.</p>
                </div>
                <span className="text-xs font-medium text-[#7A756F] bg-[#FAF6F3] px-3 py-1 rounded-full border border-[#E8E2DA]">
                  {totalClassified} Total Classified Scans
                </span>
              </div>

              {totalClassified > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left: Donut Chart */}
                  <div className="md:col-span-5 flex items-center justify-center">
                    <div className="w-[208px] h-[208px] relative flex items-center justify-center">
                      <PieChart width={208} height={208}>
                        <Pie data={cognitiveData} cx={104} cy={104} innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="count">
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-serif font-bold text-[#22201F]">{totalClassified}</span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[#A39E98]">Scans</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Cognitive Distribution Breakdown Cards */}
                  <div className="md:col-span-7 space-y-3">
                    {cognitiveData.map((item, idx) => {
                      const pct = totalClassified > 0 ? Math.round((item.count / totalClassified) * 100) : 0;
                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#FAF6F3] border border-[#E8E2DA] space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[#22201F] font-bold">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#22201F]">{item.count} scans</span>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full" style={{ color: item.color, backgroundColor: item.bg }}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#E8E2DA] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-10">
                  <p className="text-xs text-[#A39E98]">No classified scans yet. Upload a scan to view cohort distribution.</p>
                </div>
              )}
            </div>

            {/* Clinical Review Queue */}
            <div className="clinical-card p-6 bg-white">
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
                                {risk > 0 ? `${risk}/100` : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <StatusBadge status={status} size="sm" />
                            </td>
                            <td className="py-3 px-3 text-right">
                              <Link
                                to={`/dashboard/scan/${scanId}`}
                                className="btn-outline text-xs inline-flex items-center gap-1"
                              >
                                <span>Inspect</span>
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
                <div className="text-center py-10">
                  <FiCheckCircle className="w-8 h-8 text-[#4A7C59] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-[#7A756F]">No MRI scans recorded in the database.</p>
                  <Link to="/dashboard/scan" className="btn-maroon text-xs inline-flex items-center gap-1.5 mt-3">
                    <FiUploadCloud className="w-3.5 h-3.5" />
                    <span>Upload First Volumetric Scan</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}

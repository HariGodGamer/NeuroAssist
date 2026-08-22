import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LuBrain } from 'react-icons/lu';

// Page components
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScanUploadPage from './pages/ScanUploadPage';
import ScanDetailPage from './pages/ScanDetailPage';
import PatientsDirectoryPage from './pages/PatientsDirectoryPage';
import PatientProfilePage from './pages/PatientProfilePage';
import SettingsPage from './pages/SettingsPage';
import PatientMyScansPage from './pages/PatientMyScansPage';

// Calm clinical loader
const ClinicalLoader = () => (
  <div className="fixed inset-0 bg-[#FAF6F3] flex flex-col items-center justify-center gap-3 z-50">
    <div className="w-10 h-10 rounded-xl bg-[#7A1F2B] text-white flex items-center justify-center shadow-clinical animate-subtle-pulse">
      <LuBrain className="w-6 h-6" />
    </div>
    <span className="text-xs font-serif font-semibold tracking-wider text-[#7A756F]">
      NEUROASSIST CLINICAL
    </span>
  </div>
);

// Auth guard: redirects to /login if not authenticated
function RequireAuth({ children, allowedRoles }) {
  const { state } = useApp();

  if (state.auth.isLoading) {
    return <ClinicalLoader />;
  }

  if (!state.auth.token || !state.auth.user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required (e.g. doctor only)
  if (allowedRoles && !allowedRoles.includes(state.auth.user.role)) {
    if (state.auth.user.role === 'patient') {
      return <Navigate to="/dashboard/scan" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Redirect away from login if already authenticated
function RedirectIfAuth({ children }) {
  const { state } = useApp();

  if (state.auth.isLoading) {
    return <ClinicalLoader />;
  }

  if (state.auth.token && state.auth.user) {
    if (state.auth.user.role === 'patient') {
      return <Navigate to="/dashboard/scan" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RoleDefaultRedirect() {
  const { state } = useApp();
  if (state.auth.user?.role === 'patient') {
    return <Navigate to="/dashboard/scan" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login — redirect according to role if already signed in */}
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />

      {/* Doctor Dashboard (Doctor Only) */}
      <Route 
        path="/dashboard" 
        element={
          <RequireAuth allowedRoles={['doctor', 'admin']}>
            <DashboardPage />
          </RequireAuth>
        } 
      />

      {/* Upload Scan (Accessible to both Doctor and Patient) */}
      <Route 
        path="/dashboard/scan" 
        element={
          <RequireAuth>
            <ScanUploadPage />
          </RequireAuth>
        } 
      />

      {/* Patient My Scans Submissions */}
      <Route 
        path="/dashboard/my-scans" 
        element={
          <RequireAuth>
            <PatientMyScansPage />
          </RequireAuth>
        } 
      />

      {/* Detailed Diagnostic Scan View with Grad-CAM & Biomarkers (Doctor and Patient) */}
      <Route 
        path="/dashboard/scan/:scanId" 
        element={
          <RequireAuth>
            <ScanDetailPage />
          </RequireAuth>
        } 
      />

      {/* Patients Directory (Doctor Only) */}
      <Route 
        path="/dashboard/patients" 
        element={
          <RequireAuth allowedRoles={['doctor', 'admin']}>
            <PatientsDirectoryPage />
          </RequireAuth>
        } 
      />

      {/* Patient Profile (Doctor Only) */}
      <Route 
        path="/dashboard/patients/:patientId" 
        element={
          <RequireAuth allowedRoles={['doctor', 'admin']}>
            <PatientProfilePage />
          </RequireAuth>
        } 
      />

      {/* System Settings (Doctor Only) */}
      <Route 
        path="/dashboard/settings" 
        element={
          <RequireAuth allowedRoles={['doctor', 'admin']}>
            <SettingsPage />
          </RequireAuth>
        } 
      />

      {/* Default Routes */}
      <Route path="/" element={<RequireAuth><RoleDefaultRedirect /></RequireAuth>} />
      <Route path="*" element={<RequireAuth><RoleDefaultRedirect /></RequireAuth>} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;

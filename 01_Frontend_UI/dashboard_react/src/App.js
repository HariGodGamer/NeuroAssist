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
function RequireAuth({ children }) {
  const { state } = useApp();

  if (state.auth.isLoading) {
    return <ClinicalLoader />;
  }

  if (!state.auth.token || !state.auth.user) {
    return <Navigate to="/login" replace />;
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
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login — redirect to dashboard if already signed in */}
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/dashboard/scan" element={<RequireAuth><ScanUploadPage /></RequireAuth>} />
      <Route path="/dashboard/scan/:scanId" element={<RequireAuth><ScanDetailPage /></RequireAuth>} />
      <Route path="/dashboard/patients" element={<RequireAuth><PatientsDirectoryPage /></RequireAuth>} />
      <Route path="/dashboard/patients/:patientId" element={<RequireAuth><PatientProfilePage /></RequireAuth>} />
      <Route path="/dashboard/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

      {/* Default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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

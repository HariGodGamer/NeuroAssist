import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { FaSpinner } from 'react-icons/fa';

// Lazy load key premium pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DoctorWorkspace = lazy(() => import('./pages/DoctorWorkspace'));
const PatientJourney = lazy(() => import('./pages/PatientJourney'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const GlobalLoader = () => (
  <div className="fixed inset-0 bg-[#0d0f1a] flex flex-col items-center justify-center gap-3 z-[9999]">
    <FaSpinner className="animate-spin text-green-300 text-3xl" />
    <span className="text-xs uppercase font-bold tracking-widest text-slate-500">Loading NeuroAssist Core...</span>
  </div>
);

function App() {
  return (
    <AppProvider>
      <Router>
        <Suspense fallback={<GlobalLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/doctor" element={<DoctorWorkspace />} />
            <Route path="/patient" element={<PatientJourney />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Catch-all redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AppProvider>
  );
}

export default App;

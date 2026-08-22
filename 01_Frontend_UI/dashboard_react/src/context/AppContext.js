import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
const DEFAULT_PATIENTS = [];
const DEFAULT_SCANS = [];

// Demo names to clean from persistent state
const DEMO_NAMES = [
  'margaret davies',
  'eleanor vance',
  'robert chen',
  'james thorne',
  'arthur pendelton',
  'helen mirren-shaw',
];

// Helper to load or initialize persisted list (excluding any demo data)
function getInitialPatients() {
  try {
    const saved = localStorage.getItem('na_patients');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (p) => !DEMO_NAMES.includes((p.full_name || p.name || '').trim().toLowerCase())
        );
        // Deduplicate existing patients by normalized name or ID/MRN
        const dedupMap = new Map();
        cleaned.forEach((p) => {
          const nameKey = (p.full_name || p.name || '').trim().toLowerCase();
          const key = nameKey || p.id || p._id;
          if (!dedupMap.has(key)) {
            dedupMap.set(key, p);
          } else {
            const ex = dedupMap.get(key);
            dedupMap.set(key, { ...p, ...ex });
          }
        });
        const result = Array.from(dedupMap.values());
        localStorage.setItem('na_patients', JSON.stringify(result));
        return result;
      }
    }
  } catch (e) {
    console.warn('Error reading saved patients from localStorage:', e);
  }
  return DEFAULT_PATIENTS;
}

function getInitialScans() {
  try {
    const saved = localStorage.getItem('na_scans');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (s) => !DEMO_NAMES.includes((s.patientName || s.patient || '').trim().toLowerCase())
        );
        // Deduplicate by scan ID only — allow multiple scans per patient
        const seenIds = new Map();
        cleaned.forEach((s) => {
          const scanKey = s.scanId || s.scan_id_string || s.id;
          if (scanKey && !seenIds.has(scanKey)) {
            seenIds.set(scanKey, s);
          }
        });
        const result = Array.from(seenIds.values());
        localStorage.setItem('na_scans', JSON.stringify(result));
        return result;
      }
    }
  } catch (e) {
    console.warn('Error reading saved scans from localStorage:', e);
  }
  return DEFAULT_SCANS;
}

const initialState = {
  auth: {
    token: localStorage.getItem('na_token') || null,
    user: JSON.parse(localStorage.getItem('na_user') || 'null'),
    isLoading: true,
  },
  patients: getInitialPatients(),
  scans: getInitialScans(),
  notifications: [],
  settings: {
    mciThreshold: 50,
    adAlertThreshold: 75,
    gradcamSensitivity: 0.85,
    activeModel: 'medicalnet-resnet10',
    autoGeneratePdf: true,
    clinicName: '',
    physicianName: '',
    emailAlerts: true,
  },
  activeScanId: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        auth: {
          token: action.payload.token,
          user: action.payload.user,
          isLoading: false,
        },
      };
    case 'AUTH_LOADED':
      return {
        ...state,
        auth: { ...state.auth, isLoading: false },
      };
    case 'LOGOUT':
      localStorage.removeItem('na_token');
      localStorage.removeItem('na_refresh');
      localStorage.removeItem('na_user');
      return {
        ...initialState,
        auth: { token: null, user: null, isLoading: false },
      };
    case 'SET_PATIENTS': {
      const p = action.payload;
      const fetchedList = Array.isArray(p) ? p : (p?.patients || p?.items || []);
      // If backend returned empty list, preserve current existing patients so dashboard is never 0!
      if (fetchedList.length === 0) {
        return state;
      }
      // Merge fetched with existing unique local patients (deduplicate by normalized name or ID)
      const mergedMap = new Map();
      fetchedList.forEach((pat) => {
        const nameKey = (pat.full_name || pat.name || '').trim().toLowerCase();
        const key = nameKey || pat.id || pat._id;
        mergedMap.set(key, pat);
      });

      (state.patients || []).forEach((pat) => {
        const nameKey = (pat.full_name || pat.name || '').trim().toLowerCase();
        const key = nameKey || pat.id || pat._id;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, pat);
        } else {
          const backendPat = mergedMap.get(key);
          mergedMap.set(key, {
            ...pat,
            ...backendPat,
            scan_count: Math.max(backendPat.scan_count || 0, pat.scan_count || pat.scansCount || 0),
            scansCount: Math.max(backendPat.scan_count || 0, pat.scan_count || pat.scansCount || 0),
            condition: pat.condition || backendPat.condition || backendPat.diagnosis || 'CN',
            diagnosis: pat.diagnosis || backendPat.diagnosis || pat.condition || 'CN',
            riskScore: pat.riskScore ?? backendPat.riskScore,
          });
        }
      });
      const finalList = Array.from(mergedMap.values());
      try {
        localStorage.setItem('na_patients', JSON.stringify(finalList));
      } catch (e) {}
      return { ...state, patients: finalList };
    }
    case 'ADD_PATIENT': {
      const newPatient = action.payload;
      const current = Array.isArray(state.patients) ? state.patients : [];
      const newNameLower = (newPatient.full_name || newPatient.name || '').trim().toLowerCase();
      const newId = newPatient.id || newPatient._id;
      const updated = [
        newPatient,
        ...current.filter((p) => {
          const id = p.id || p._id;
          const nameLower = (p.full_name || p.name || '').trim().toLowerCase();
          return id !== newId && nameLower !== newNameLower;
        }),
      ];
      try {
        localStorage.setItem('na_patients', JSON.stringify(updated));
      } catch (e) {}
      return { ...state, patients: updated };
    }
    case 'DELETE_PATIENT': {
      const targetId = action.payload;
      const updatedPatients = (state.patients || []).filter(
        (p) => (p.id || p._id) !== targetId
      );
      const updatedScans = (state.scans || []).filter(
        (s) => (s.patientId || s.patient_id) !== targetId
      );
      try {
        localStorage.setItem('na_patients', JSON.stringify(updatedPatients));
        localStorage.setItem('na_scans', JSON.stringify(updatedScans));
      } catch (e) {}
      return {
        ...state,
        patients: updatedPatients,
        scans: updatedScans,
      };
    }
    case 'SET_SCANS': {
      const s = action.payload;
      const fetchedList = Array.isArray(s) ? s : (s?.scans || s?.items || []);
      if (fetchedList.length === 0) {
        return state;
      }
      const mergedMap = new Map();
      // First populate with existing local state (which has sign-offs)
      (state.scans || []).forEach((sc) => {
        const id = sc.scanId || sc.scan_id_string || sc.id;
        if (id) mergedMap.set(id, sc);
      });

      // Merge fetched scans while preserving local doctor sign-offs and notes
      fetchedList.forEach((sc) => {
        const id = sc.scanId || sc.scan_id_string || sc.id;
        if (id) {
          const existing = mergedMap.get(id) || {};
          mergedMap.set(id, {
            ...sc,
            doctorStatus: existing.doctorStatus || sc.doctorStatus || 'pending',
            doctorNotes: existing.doctorNotes || sc.doctorNotes || '',
            isSignedOff: existing.isSignedOff !== undefined ? existing.isSignedOff : sc.isSignedOff,
            signedOffAt: existing.signedOffAt || sc.signedOffAt,
            signedOffBy: existing.signedOffBy || sc.signedOffBy,
          });
        }
      });
      const finalList = Array.from(mergedMap.values());
      try {
        localStorage.setItem('na_scans', JSON.stringify(finalList));
      } catch (e) {}
      return { ...state, scans: finalList };
    }
    case 'DELETE_SCAN': {
      const targetScanId = action.payload;
      const updatedScans = (state.scans || []).filter(
        (s) => (s.scanId || s.scan_id_string || s.id) !== targetScanId
      );
      try {
        localStorage.setItem('na_scans', JSON.stringify(updatedScans));
      } catch (e) {}
      return {
        ...state,
        scans: updatedScans,
      };
    }
    case 'ADD_SCAN': {
      const newScan = action.payload;
      const scanId = newScan.scanId || newScan.scan_id_string || newScan.id;
      const currentScans = Array.isArray(state.scans) ? state.scans : [];
      const targetPatientId = newScan.patientId || newScan.patient_id;
      const targetPatientName = (newScan.patientName || newScan.patient || '').toLowerCase();
      
      // Deduplicate by scan ID only — allow multiple scans per patient
      const updatedScans = [
        newScan,
        ...currentScans.filter((s) => {
          const sId = s.scanId || s.scan_id_string || s.id;
          return sId !== scanId;
        }),
      ];
      const updatedPatients = (state.patients || []).map((pat) => {
        const pId = pat.id || pat._id;
        const pName = (pat.full_name || pat.name || '').toLowerCase();
        if (pId === targetPatientId || (targetPatientName && pName === targetPatientName)) {
          const currentCount = pat.scansCount || pat.scan_count || 0;
          return {
            ...pat,
            scan_count: currentCount + 1,
            scansCount: currentCount + 1,
            lastScanDate: newScan.date || newScan.uploadDate || new Date().toISOString().split('T')[0],
            condition: newScan.prediction || pat.condition,
            diagnosis: newScan.prediction || pat.diagnosis,
            riskScore: newScan.riskScore || pat.riskScore,
          };
        }
        return pat;
      });

      try {
        localStorage.setItem('na_scans', JSON.stringify(updatedScans));
        localStorage.setItem('na_patients', JSON.stringify(updatedPatients));
      } catch (e) {}

      return {
        ...state,
        scans: updatedScans,
        patients: updatedPatients,
        activeScanId: scanId,
      };
    }
    case 'UPDATE_SCAN_DECISION': {
      const updatedScans = state.scans.map((s) => {
        const id = s.scanId || s.scan_id_string || s.id;
        return id === action.payload.scanId
          ? { 
              ...s, 
              doctorStatus: action.payload.status, 
              doctorNotes: action.payload.notes || s.doctorNotes,
              isSignedOff: action.payload.isSignedOff !== undefined ? action.payload.isSignedOff : true,
              signedOffAt: action.payload.signedOffAt,
              signedOffBy: action.payload.signedOffBy
            }
          : s;
      });
      try {
        localStorage.setItem('na_scans', JSON.stringify(updatedScans));
      } catch (e) {}
      return {
        ...state,
        scans: updatedScans,
      };
    }
    case 'SET_ACTIVE_SCAN':
      return { ...state, activeScanId: action.payload };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          { id: Date.now(), time: 'Just now', ...action.payload },
          ...state.notifications,
        ],
      };
    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    default:
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // On mount: validate existing token with backend /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('na_token');
    if (!token) {
      dispatch({ type: 'AUTH_LOADED' });
      return;
    }

    authAPI
      .me()
      .then(({ data }) => {
        const user = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: data.role,
        };
        localStorage.setItem('na_user', JSON.stringify(user));
        dispatch({ type: 'SET_AUTH', payload: { token, user } });
      })
      .catch(() => {
        // Token invalid or expired — clear auth
        localStorage.removeItem('na_token');
        localStorage.removeItem('na_refresh');
        localStorage.removeItem('na_user');
        dispatch({ type: 'AUTH_LOADED' });
      });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

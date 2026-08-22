import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

// ── Auth token injection ──────────────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('na_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Refresh token on 401 ──────────────────────────────────────────────────
api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem('na_refresh');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem('na_token', data.access_token);
          orig.headers.Authorization = `Bearer ${data.access_token}`;
          return api(orig);
        } catch {
          localStorage.removeItem('na_token');
          localStorage.removeItem('na_refresh');
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    return api.post('/api/auth/login', form);
  },
  register: (email, password, full_name, role) =>
    api.post('/api/auth/register', { email, password, full_name, role }),
  me: () => api.get('/api/auth/me'),
};

// ── Patients ──────────────────────────────────────────────────────────────
export const patientAPI = {
  list: () => api.get('/api/patients/'),
  get:  id  => api.get(`/api/patients/${id}`),
  create: data => api.post('/api/patients/create', data),
  timeline: id => api.get(`/api/patients/${id}/timeline`),
  delete: id => api.delete(`/api/patients/${id}`),
};

// ── Scans ─────────────────────────────────────────────────────────────────
export const scanAPI = {
  upload: (file, patientId, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    form.append('patient_id', patientId);
    return api.post('/api/scan/upload', form, {
      onUploadProgress: e => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  analyze: (scanId, modelType = 'multiclass') => {
    const form = new FormData();
    form.append('scan_id', scanId);
    form.append('model_type', modelType);
    return api.post('/api/scan/analyze', form);
  },
  history: (limit = 50) => api.get(`/api/scan/history?limit=${limit}`),
  result:  id => api.get(`/api/scan/result/${id}`),
  detail:  id => api.get(`/api/scan/${id}`),
  review:  (id, data) => api.put(`/api/scan/${id}/review`, data),
  delete:  id => api.delete(`/api/scan/${id}`),
  reportUrl: id => `${BASE_URL}/api/scan/${id}/report`,
};

// ── Admin ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  users:          () => api.get('/api/admin/users'),
  deleteUser:     id => api.delete(`/api/admin/users/${id}`),
  reviewQueue:    () => api.get('/api/admin/review-queue'),
  approveTraining: id => api.put(`/api/admin/review-queue/${id}/approve`),
  rejectTraining:  id => api.put(`/api/admin/review-queue/${id}/reject`),
  analytics:      () => api.get('/api/admin/analytics'),
  auditLogs:      () => api.get('/api/admin/audit-logs'),
};

export default api;

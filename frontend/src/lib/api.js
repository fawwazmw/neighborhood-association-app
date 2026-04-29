import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
});

/**
 * 401 interceptor — redirect to login on session expiry.
 * Skips the redirect for the login and user endpoints themselves.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/login') &&
      !error.config?.url?.includes('/user')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch CSRF cookie from Sanctum before making state-changing requests.
 */
export const getCsrfCookie = () => {
  return axios.get('/sanctum/csrf-cookie', { withCredentials: true });
};

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (credentials) => {
    await getCsrfCookie();
    return api.post('/login', credentials);
  },
  logout: () => api.post('/logout'),
  getUser: () => api.get('/user'),
};

// ── Resident API ──────────────────────────────────────────────────────────────
export const residentApi = {
  getAll: (params) => api.get('/residents', { params }),
  getById: (id) => api.get(`/residents/${id}`),
  create: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/residents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post(`/residents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/residents/${id}`),
};

// ── House API ─────────────────────────────────────────────────────────────────
export const houseApi = {
  getAll: (params) => api.get('/houses', { params }),
  getById: (id) => api.get(`/houses/${id}`),
  create: (data) => api.post('/houses', data),
  update: (id, data) => api.put(`/houses/${id}`, data),
  assignResident: (id, data) => api.post(`/houses/${id}/assign-resident`, data),
  removeResident: (id) => api.post(`/houses/${id}/remove-resident`),
  history: (id) => api.get(`/houses/${id}/history`),
};

// ── Payment API ───────────────────────────────────────────────────────────────
export const paymentApi = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  createBulk: (data) => api.post('/payments-bulk', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  generateBills: (data) => api.post('/payments-generate', data),
};

// ── Expense API ───────────────────────────────────────────────────────────────
export const expenseApi = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// ── Report API ────────────────────────────────────────────────────────────────
export const reportApi = {
  summary: (year) => api.get('/reports/summary', { params: { year } }),
  detail: (month, year) => api.get('/reports/detail', { params: { month, year } }),
};

export default api;

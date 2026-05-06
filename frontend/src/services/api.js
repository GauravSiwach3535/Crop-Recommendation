/**
 * Axios API client
 * ─────────────────
 * Automatically attaches the JWT access token from localStorage to every
 * authenticated request, and refreshes it on 401 errors.
 */
import axios from "axios";

const BASE_URL = (process.env.REACT_APP_API_URL || "https://crop-recommendation-ca0a.onrender.com") + "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle token expiry ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem("refresh_token");
        const { data } = await axios.post(`${BASE_URL}/token/refresh/`, { refresh });
        localStorage.setItem("access_token", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        // Refresh failed — force logout
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth helpers ──────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post("/auth/register/", data),
  login: async (email, password) => {
    const res = await api.post("/auth/login/", { email, password });
    localStorage.setItem("access_token", res.data.access);
    localStorage.setItem("refresh_token", res.data.refresh);
    return res.data;
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
  getProfile: () => api.get("/auth/profile/"),
  updateProfile: (data) => api.put("/auth/profile/", data),
};

// ── Recommendation helpers ────────────────────────────────────────────────────
export const recommendationService = {
  submit: (formData) => api.post("/recommend/", formData),
  getHistory: (page = 1) => api.get(`/recommendations/?page=${page}`),
  getById: (id) => api.get(`/recommendations/${id}/`),
};

export default api;

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication Functions
export const register = (email, pass, name) =>
  api.post("/auth/register", { email, pass, name });

export const login = (email, pass) =>
  api.post("/auth/login", { email, pass });

export const getUserProfile = () => api.get("/auth/me");

export default api;
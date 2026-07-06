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
export const register = (email, password) => 
  api.post()("/auth/register", { email, password });

export const login = (email, password) => 
  api.post("/auth/login", { email, password });

export const getUserProfile = () => api.get("/auth/me");

export { api };
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://hms-backend-production-78f3.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Read token directly from localStorage — works even before zustand has rehydrated
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("auth-storage");
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (_) {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
         useAuthStore.getState().logout();
         if (window.location.pathname !== "/login") {
            window.location.href = "/login";
         }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

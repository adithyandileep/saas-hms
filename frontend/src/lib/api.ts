import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://hms-backend-production-78f3.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

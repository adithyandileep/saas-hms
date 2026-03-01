import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
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

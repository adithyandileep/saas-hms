"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated) {
        router.push("/login");
      } else {
        const role = state.user?.role || "LOGIN";
        if (role === "SUPERADMIN" || role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push(`/${role.toLowerCase()}`);
        }
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [router]);

  return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><span className="animate-pulse">Loading Workspace...</span></div>;
}

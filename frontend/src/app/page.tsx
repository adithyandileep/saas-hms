"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    router.replace(`/${user.role.toLowerCase()}`);
  }, [hasHydrated, isAuthenticated, router, user]);

  return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><span className="animate-pulse">Loading Workspace...</span></div>;
}

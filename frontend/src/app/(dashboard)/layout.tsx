"use client";

import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return;

    const isAdminRole = user.role === "SUPERADMIN" || user.role === "ADMIN";
    const targetRoute = isAdminRole ? "/admin" : `/${user.role.toLowerCase()}`;

    if (pathname.startsWith("/admin") && !isAdminRole) {
      router.replace(targetRoute);
    }
    if (pathname.startsWith("/doctor") && user.role !== "DOCTOR") {
      router.replace(targetRoute);
    }
    if (pathname.startsWith("/receptionist") && user.role !== "RECEPTIONIST" && !isAdminRole) {
      router.replace(targetRoute);
    }
    if (pathname.startsWith("/patient") && user.role !== "PATIENT") {
      router.replace(targetRoute);
    }
  }, [hasHydrated, isAuthenticated, pathname, router, user]);

  if (!hasHydrated || !isAuthenticated) {
    return <div className="min-h-screen bg-white dark:bg-zinc-950" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-zinc-50 dark:bg-zinc-950 relative">
          <div className="container mx-auto px-6 py-8">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

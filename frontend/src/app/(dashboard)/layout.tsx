"use client";

import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMounted(true);
      if (!useAuthStore.getState().isAuthenticated) {
        router.push("/login");
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [router]);

  if (!mounted || !isAuthenticated) {
     return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;
  }

  // Role-based route guards
  const isAdminRole = user?.role === "SUPERADMIN" || user?.role === "ADMIN";

  if (pathname.startsWith("/admin") && !isAdminRole) router.push(`/${user?.role.toLowerCase()}`);
  if (pathname.startsWith("/doctor") && user?.role !== "DOCTOR") router.push(`/${user?.role.toLowerCase()}`);
  // Allow admins/superadmins to access receptionist billing detail pages (admin billing links to them)
  if (pathname.startsWith("/receptionist") && user?.role !== "RECEPTIONIST" && !isAdminRole) router.push(`/${user?.role.toLowerCase()}`);
  if (pathname.startsWith("/patient") && user?.role !== "PATIENT") router.push(`/${user?.role.toLowerCase()}`);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 dark:bg-slate-950 relative">
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

"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Calendar, FileText, Home, Settings, Users, CreditCard, Building2, Pill } from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  let navItems: NavItem[] = [];

  if (user?.role === "SUPERADMIN" || user?.role === "ADMIN") {
    const isSuper = user?.role === "SUPERADMIN";
    const perms = user?.permissions || [];

    // All possible admin links — both management and operational
    const allAdminLinks = [
      { id: "dashboard", name: "Dashboard", href: "/admin", icon: Home },
      { id: "doctors", name: "Doctors", href: "/admin/doctors", icon: Activity },
      { id: "departments", name: "Departments", href: "/admin/departments", icon: Building2 },
      { id: "receptionists", name: "Receptionists", href: "/admin/receptionists", icon: Users },
      { id: "patients", name: "Patients", href: "/admin/patients", icon: Users },
      { id: "appointments", name: "Appointments", href: "/admin/appointments", icon: Calendar },
      { id: "billing", name: "Billing", href: "/admin/billing", icon: CreditCard },
      { id: "prescriptions", name: "Prescriptions", href: "/admin/prescriptions", icon: FileText },
      { id: "medicines", name: "Medicines", href: "/admin/medicines", icon: Pill },
      { id: "settings", name: "Settings", href: "/settings", icon: Settings },
    ];

    // Filter based on permissions. SUPERADMIN sees all.
    navItems = allAdminLinks.filter(item => isSuper || perms.includes(item.id));

    // Manage Admins: strictly Superadmin-only, never grantable to Admins
    if (isSuper) {
      navItems.push({ name: "Manage Admins", href: "/admin/admins", icon: Settings });
    }
  } else if (user?.role === "DOCTOR") {
    navItems = [
      { name: "Dashboard", href: "/doctor", icon: Home },
      { name: "Appointments", href: "/doctor/appointments", icon: Calendar },
      { name: "Patients", href: "/doctor/patients", icon: Users },
      { name: "Prescriptions", href: "/doctor/prescriptions", icon: FileText },
    ];
  } else if (user?.role === "RECEPTIONIST") {
    navItems = [
      { name: "Dashboard", href: "/receptionist", icon: Home },
      { name: "Appointments", href: "/receptionist/appointments", icon: Calendar },
      { name: "Billing", href: "/receptionist/billing", icon: CreditCard },
      { name: "Patients", href: "/receptionist/patients", icon: Users },
    ];
  } else if (user?.role === "PATIENT") {
    navItems = [
      { name: "Dashboard", href: "/patient", icon: Home },
      { name: "My Appointments", href: "/patient/appointments", icon: Calendar },
      { name: "Prescriptions", href: "/patient/prescriptions", icon: FileText },
      { name: "Medical Reports", href: "/patient/reports", icon: Activity },
      { name: "Billing", href: "/patient/billing", icon: CreditCard },
    ];
  }

  return (
    <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 min-h-screen flex flex-col transition-all duration-300 z-50">
      <div className="h-16 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide flex items-center gap-2">
          <Activity size={24} className="text-zinc-900 dark:text-white" />
          Enterprise HMS
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${isActive
                ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                }`}
            >
              <item.icon size={20} className={isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400"} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

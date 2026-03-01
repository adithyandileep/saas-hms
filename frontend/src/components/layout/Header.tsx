"use client";

import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "../ui/ThemeToggle";
import { LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const logoutAction = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post(`/auth/logout`);
    } catch (e) {}
    logoutAction();
    router.push("/login");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        {/* Mobile menu trigger could go here */}
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        
        <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-700 pl-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {user?.username || "Guest"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
              {user?.role?.toLowerCase() || "Role"}
            </span>
          </div>
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserIcon size={20} />
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 ml-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

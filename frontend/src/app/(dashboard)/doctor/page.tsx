"use client";

import { useAuthStore } from "@/store/authStore";

export default function DoctorDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
          Welcome, Dr. {user?.username}
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
          <h3 className="text-sm font-medium text-blue-100">Today's Patients</h3>
          <p className="text-4xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming Slots</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Earnings</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-emerald-400">$0.00</p>
        </div>
      </div>
    </div>
  );
}

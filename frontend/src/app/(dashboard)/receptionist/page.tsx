"use client";

import { useAuthStore } from "@/store/authStore";

export default function ReceptionistDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
          Receptionist Desk
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Check-ins</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Bookings Today</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Collections (Cash)</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">$0.00</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Doctors</h3>
          <p className="text-3xl font-bold mt-2 text-blue-500">0</p>
        </div>
      </div>
    </div>
  );
}

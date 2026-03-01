"use client";

import { useAuthStore } from "@/store/authStore";

export default function PatientDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
          Hello, {user?.username}
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
          <h3 className="text-sm font-medium text-indigo-100">Next Appointment</h3>
          <p className="text-2xl font-bold mt-2">None scheduled</p>
          <button className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition backdrop-blur-md">
            Book Now
          </button>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Visits</h3>
          <p className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Payments</h3>
          <p className="text-3xl font-bold mt-2 text-red-500">$0.00</p>
        </div>
      </div>
    </div>
  );
}

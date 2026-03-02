"use client";

import { useAuthStore } from "@/store/authStore";
import { Calendar, CreditCard, FileText, User } from "lucide-react";

export default function PatientDashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-3">
          <User className="text-blue-500" /> Hello, {user?.username}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start">
             <div>
                <h3 className="text-sm font-medium text-indigo-100 flex items-center gap-2"><Calendar size={16} /> Next Appointment</h3>
                <p className="text-2xl font-bold mt-2">None scheduled</p>
             </div>
          </div>
          <button className="mt-6 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition backdrop-blur-md w-full">
            Book New Appointment
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
             <FileText size={20} />
             <h3 className="text-sm font-medium">Total Visits</h3>
          </div>
          <div className="flex items-end gap-2">
             <p className="text-4xl font-black text-slate-900 dark:text-white">0</p>
             <p className="text-sm text-slate-500 mb-1">Lifetime</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-amber-500 dark:text-amber-400 mb-2">
             <CreditCard size={20} />
             <h3 className="text-sm font-medium">Pending Payments</h3>
          </div>
          <div className="flex items-end gap-2">
             <p className="text-4xl font-black text-slate-900 dark:text-white">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

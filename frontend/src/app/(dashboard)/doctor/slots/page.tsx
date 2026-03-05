"use client";

import { Calendar, Info } from "lucide-react";

export default function DoctorSlotsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-7 h-7 text-blue-500" />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">My Schedule</h1>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 flex items-start gap-4">
        <Info className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-800 dark:text-blue-300 text-lg mb-1">Slot Management</p>
          <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
            Your appointment slots are managed by the reception or admin team. Please contact the receptionist or an administrator to configure your available time slots.
          </p>
        </div>
      </div>
    </div>
  );
}

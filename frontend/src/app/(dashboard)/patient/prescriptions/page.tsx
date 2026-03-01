"use client";

import { FileText } from "lucide-react";

export default function PatientPrescriptionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
        <FileText className="text-blue-500" /> My Prescriptions
      </h1>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500 dark:text-slate-400">Your prescriptions from completed appointments will appear here.</p>
      </div>
    </div>
  );
}

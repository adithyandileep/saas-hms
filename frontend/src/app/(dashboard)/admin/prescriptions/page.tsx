"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, FileText, User, Calendar } from "lucide-react";

interface Prescription {
  id: string;
  diagnosis?: string;
  notes?: string;
  followUp?: string;
  createdAt: string;
  appointment?: {
    token: string;
    patient?: { name: string; uhid: string };
    doctor?: { name: string };
  };
}

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/prescriptions").then(r => {
      setPrescriptions(r.data.data || []);
    }).catch(() => setPrescriptions([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
        <FileText className="text-blue-500" /> Prescriptions
        <span className="ml-2 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">System-Wide</span>
      </h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={36} /></div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
          <FileText size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 dark:text-slate-400">No prescriptions found in the system yet.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Prescriptions are created by doctors during consultation visits.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map(rx => (
            <div key={rx.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-mono rounded-full">Token #{rx.appointment?.token}</span>
                    <span className="text-xs text-slate-500">{new Date(rx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <User size={14} className="text-slate-400" />
                      <span className="font-medium">{rx.appointment?.patient?.name}</span>
                      <span className="text-xs font-mono text-slate-400">{rx.appointment?.patient?.uhid}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Dr. {rx.appointment?.doctor?.name}</span>
                    </div>
                  </div>
                  {rx.diagnosis && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Diagnosis</p>
                      <p className="text-sm text-slate-900 dark:text-white">{rx.diagnosis}</p>
                    </div>
                  )}
                  {rx.notes && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Notes</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{rx.notes}</p>
                    </div>
                  )}
                  {rx.followUp && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400">
                      <Calendar size={12} /> Follow-up: {new Date(rx.followUp).toLocaleDateString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

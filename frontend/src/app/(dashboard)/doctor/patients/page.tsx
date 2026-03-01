"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Users } from "lucide-react";

interface Patient { id: string; uhid: string; name: string; age: number; gender: string | null; }

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/patients").then(r => { setPatients(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><Users className="text-blue-500" /> Patient Records</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">UHID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Age</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Gender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400">{p.uhid}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.age}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.gender || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

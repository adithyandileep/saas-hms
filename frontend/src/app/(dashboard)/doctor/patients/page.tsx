"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2, Users, Search } from "lucide-react";

interface Patient { id: string; uhid: string; name: string; age: number; gender: string | null; contactNo?: string | null; }

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/patients").then(r => { setPatients(r.data.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    patients.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.uhid.toLowerCase().includes(query.toLowerCase())
    ), [patients, query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="text-blue-500" /> Patient Records
        </h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or UHID..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>{query ? "No patients match your search." : "No patients found."}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">UHID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Age</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Gender</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map(p => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/doctor/patients/${p.id}`)}
                  className="hover:bg-blue-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-medium">{p.uhid}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    <span>{p.name}</span>
                    <span className="ml-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition">View records →</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.age}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">{p.gender || "–"}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.contactNo || "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            {filtered.length} patient{filtered.length !== 1 ? "s" : ""} {query ? "found" : "total"}
          </div>
        </div>
      )}
    </div>
  );
}

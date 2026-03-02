"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Plus, X, Loader2 } from "lucide-react";

interface Receptionist {
  id: string;
  name: string;
  phone: string;
  user: { username: string; isActive: boolean };
}

export default function AdminReceptionistsPage() {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", username: "", password: "" });

  const fetch = async () => {
    try {
      const res = await api.get("/receptionists");
      setReceptionists(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/receptionists", form);
      setShowForm(false);
      setForm({ name: "", phone: "", username: "", password: "" });
      fetch();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Receptionists</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/25">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cancel" : "Add Receptionist"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Full Name" value={form.name} onChange={e=> setForm({...form, name: e.target.value})} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
            <input placeholder="Phone" value={form.phone} onChange={e=> setForm({...form, phone: e.target.value})} maxLength={10} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
            <input placeholder="Username" value={form.username} onChange={e=> setForm({...form, username: e.target.value})} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
            <input type="password" placeholder="Password" value={form.password} onChange={e=> setForm({...form, password: e.target.value})} required minLength={6} className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2">
            {submitting && <Loader2 className="animate-spin" size={18} />} Create Receptionist
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : receptionists.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No receptionists added yet.</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Username</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {receptionists.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{r.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.phone}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.user?.username}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${r.user?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.user?.isActive ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

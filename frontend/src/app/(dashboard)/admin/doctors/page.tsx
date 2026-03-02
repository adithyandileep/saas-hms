"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Plus, X, Loader2 } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  department: { id: string; name: string };
  phone: string;
  consultationFee: number;
  incrementIntervalDays: number;
  renewalCharge: number;
  user: { username: string; isActive: boolean };
}

interface Department {
  id: string;
  name: string;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", departmentId: "", phone: "", username: "", password: "",
    consultationFee: 500, incrementIntervalDays: 5, renewalCharge: 200,
  });

  const fetchData = async () => {
    try {
      const [docsRes, depsRes] = await Promise.all([
        api.get("/doctors"),
        api.get("/departments")
      ]);
      setDoctors(docsRes.data.data || []);
      setDepartments(depsRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/doctors", {
        ...form,
        consultationFee: Number(form.consultationFee),
        incrementIntervalDays: Number(form.incrementIntervalDays),
        renewalCharge: Number(form.renewalCharge),
      });
      setShowForm(false);
      setForm({ name: "", departmentId: "", phone: "", username: "", password: "", consultationFee: 500, incrementIntervalDays: 5, renewalCharge: 200 });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create doctor");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Doctors</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/25">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cancel" : "Add Doctor"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">New Doctor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="doctor-name" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input id="doctor-name" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctor-department" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
              <select id="doctor-department" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none">
                <option value="" disabled>Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctor-phone" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
              <input id="doctor-phone" placeholder="Phone (max 10 digits)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} maxLength={10} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctor-username" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
              <input id="doctor-username" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctor-password" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
              <input id="doctor-password" type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctor-fee" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Consultation Fee</label>
              <input id="doctor-fee" type="number" placeholder="Consultation Fee" value={form.consultationFee} onChange={e => setForm({...form, consultationFee: +e.target.value})} max={10000} className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctor-interval" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Follow-up Interval (days)</label>
              <input id="doctor-interval" type="number" placeholder="Follow-up Interval (days)" value={form.incrementIntervalDays} onChange={e => setForm({...form, incrementIntervalDays: +e.target.value})} max={365} className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctor-renewal" className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Renewal Charge</label>
              <input id="doctor-renewal" type="number" placeholder="Renewal Charge" value={form.renewalCharge} onChange={e => setForm({...form, renewalCharge: +e.target.value})} max={5000} className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            {submitting ? <Loader2 className="animate-spin" size={18} /> : "Create Doctor"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">No doctors added yet. Click "Add Doctor" to get started.</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fee</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {doctors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{d.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs font-medium">
                      {d.department?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{d.phone}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">₹{d.consultationFee}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{d.user?.username}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${d.user?.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700'}`}>{d.user?.isActive ? "Active" : "Inactive"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

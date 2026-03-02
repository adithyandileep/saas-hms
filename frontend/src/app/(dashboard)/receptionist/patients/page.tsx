"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Users, Plus, X, Server } from "lucide-react";

interface Patient { id: string; uhid: string; name: string; age: number; gender: string | null; contactNo: string | null; }

export default function ReceptionistPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Comprehensive Form State
  const [form, setForm] = useState({
    name: "", firstName: "", lastName: "", age: "", gender: "Male", contactNo: "", email: "", 
    houseNumber: "", houseName: "", street: "", city: "", state: "", pincode: "",
    guardianName: "", guardianRelation: "", guardianContact: "",
    idProofType: "Aadhaar", idProofDetail: ""
  });

  const fetch = async () => {
    try {
       const res = await api.get("/patients"); 
       setPatients(res.data.data || []); 
    } catch { } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
      };
      await api.post("/patients/register", payload);
      setShowForm(false);
      fetch();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to register patient");
    } finally { setSubmitting(false); }
  };

  const inputCls = "w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="text-blue-500" /> Patient Registry
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/25">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cancel" : "Register Patient"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div><label className={labelCls}>Full Name *</label><input required value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>First Name</label><input value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>Last Name</label><input value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>Age *</label><input required type="number" min="0" value={form.age} onChange={e=>setForm({...form, age: e.target.value})} className={inputCls} /></div>
             <div>
                <label className={labelCls}>Gender</label>
                <select value={form.gender} onChange={e=>setForm({...form, gender: e.target.value})} className={inputCls}>
                    <option>Male</option><option>Female</option><option>Other</option>
                </select>
             </div>
             <div><label className={labelCls}>Contact No</label><input value={form.contactNo} onChange={e=>setForm({...form, contactNo: e.target.value})} className={inputCls} /></div>
             <div className="md:col-span-2"><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className={inputCls} /></div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mt-6">Structured Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div><label className={labelCls}>House No</label><input value={form.houseNumber} onChange={e=>setForm({...form, houseNumber: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>House Name</label><input value={form.houseName} onChange={e=>setForm({...form, houseName: e.target.value})} className={inputCls} /></div>
             <div className="md:col-span-2"><label className={labelCls}>Street</label><input value={form.street} onChange={e=>setForm({...form, street: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>City</label><input value={form.city} onChange={e=>setForm({...form, city: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>State</label><input value={form.state} onChange={e=>setForm({...form, state: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>Pincode</label><input value={form.pincode} onChange={e=>setForm({...form, pincode: e.target.value})} className={inputCls} /></div>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mt-6">Guardian & ID Proof</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div><label className={labelCls}>Guardian Name</label><input value={form.guardianName} onChange={e=>setForm({...form, guardianName: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>Relation</label><input value={form.guardianRelation} onChange={e=>setForm({...form, guardianRelation: e.target.value})} className={inputCls} /></div>
             <div><label className={labelCls}>Guardian Contact</label><input value={form.guardianContact} onChange={e=>setForm({...form, guardianContact: e.target.value})} className={inputCls} /></div>
             <div></div>
             <div>
                <label className={labelCls}>ID Proof Type</label>
                <select value={form.idProofType} onChange={e=>setForm({...form, idProofType: e.target.value})} className={inputCls}>
                    <option>Aadhaar</option><option>PAN</option><option>Passport</option><option>Driver's License</option>
                </select>
             </div>
             <div className="md:col-span-2"><label className={labelCls}>ID Proof Number</label><input value={form.idProofDetail} onChange={e=>setForm({...form, idProofDetail: e.target.value})} className={inputCls} /></div>
          </div>

          <div className="flex justify-end pt-4">
             <button type="submit" disabled={submitting} className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25">
                 {submitting && <Loader2 className="animate-spin" size={16} />} Register New Patient
             </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 text-slate-500 rounded-2xl bg-slate-50 border border-dashed border-slate-300 dark:bg-slate-900/50 dark:border-slate-800">
           <Server size={48} className="mx-auto mb-3 opacity-20" />
           <p>No patients found. Click &apos;Register Patient&apos; above to add one.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left">
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
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{p.uhid}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.age}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.gender || "-"}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.contactNo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

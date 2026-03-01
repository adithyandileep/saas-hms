"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Save } from "lucide-react";

interface Organization {
  id: string;
  organizationName: string;
  timezone: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Organization>>({
    organizationName: "",
    timezone: "UTC",
    currency: "USD",
    contactEmail: "",
    contactPhone: "",
    address: "",
    logoUrl: ""
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings/organization");
      if (res.data.data) {
         setForm(res.data.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings/organization", form);
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings");
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hospital Settings</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Branding</h3>
            <div className="flex items-center gap-6">
               <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 overflow-hidden relative group">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-xs text-slate-400 text-center px-4">No Logo<br/>Uploaded</div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <span className="text-white text-xs font-medium">Change</span>
                  </div>
                  <input 
                     type="file" 
                     accept="image/*"
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onloadend = () => setForm({...form, logoUrl: reader.result as string});
                         reader.readAsDataURL(file);
                       }
                     }}
                  />
               </div>
               <div className="space-y-1">
                 <p className="text-sm font-medium text-slate-900 dark:text-white">Hospital Logo</p>
                 <p className="text-xs text-slate-500">Recommended size: 256x256px. Max 2MB.</p>
                 <p className="text-xs text-slate-500">Formats: PNG, JPG, or SVG.</p>
               </div>
            </div>
          </div>
          <hr className="border-slate-200 dark:border-slate-800" />
          
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">General Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Organization Name *</label>
              <input 
                 value={form.organizationName || ""} 
                 onChange={e => setForm({...form, organizationName: e.target.value})} 
                 required 
                 className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Timezone *</label>
              <select 
                 value={form.timezone || "UTC"} 
                 onChange={e => setForm({...form, timezone: e.target.value})} 
                 className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none"
              >
                 <option value="UTC">UTC</option>
                 <option value="America/New_York">EST</option>
                 <option value="Asia/Kolkata">IST</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency *</label>
              <select 
                 value={form.currency || "USD"} 
                 onChange={e => setForm({...form, currency: e.target.value})} 
                 className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white appearance-none"
              >
                 <option value="USD">USD ($)</option>
                 <option value="INR">INR (₹)</option>
                 <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
              <input 
                 type="email"
                 value={form.contactEmail || ""} 
                 onChange={e => setForm({...form, contactEmail: e.target.value})} 
                 className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input 
                 value={form.contactPhone || ""} 
                 onChange={e => setForm({...form, contactPhone: e.target.value})} 
                 className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address / Location</label>
              <textarea 
                 value={form.address || ""} 
                 onChange={e => setForm({...form, address: e.target.value})} 
                 rows={3}
                 className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="submit" 
              disabled={saving} 
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium shadow-lg shadow-blue-500/25"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

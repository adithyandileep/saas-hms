"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Shield, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface AdminProfile {
  id: string;
  name: string;
  phone: string | null;
  permissions: string[];
}

interface AdminUser {
  id: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  adminProfile: AdminProfile | null;
}

const MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "doctors", label: "Doctors Management" },
  { id: "departments", label: "Departments Management" },
  { id: "receptionists", label: "Receptionists Management" },
  { id: "patients", label: "Patients Management" },
  { id: "settings", label: "Settings" },
];

export default function ManageAdminsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    permissions: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    if (user?.role !== "SUPERADMIN") {
      router.push("/admin");
      return;
    }
    loadAdmins();
  }, [user, router]);

  async function loadAdmins() {
    setLoading(true);
    try {
      const res = await api.get("/admins");
      setAdmins(res.data.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(admin?: AdminUser) {
    if (admin) {
      setEditingId(admin.id);
      setFormData({
        username: admin.username,
        password: "", // Leave blank on edit
        name: admin.adminProfile?.name || "",
        phone: admin.adminProfile?.phone || "",
        permissions: admin.adminProfile?.permissions || [],
        isActive: admin.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        username: "",
        password: "",
        name: "",
        phone: "",
        permissions: [],
        isActive: true,
      });
    }
    setIsModalOpen(true);
  }

  function togglePermission(id: string) {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id]
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        // Update
        const payload: any = {
          name: formData.name,
          phone: formData.phone || undefined,
          permissions: formData.permissions,
          isActive: formData.isActive
        };
        await api.put(`/admins/${editingId}`, payload);
      } else {
        // Create
        await api.post("/admins", formData);
      }
      setIsModalOpen(false);
      loadAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save admin");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this admin?")) return;
    try {
      await api.delete(`/admins/${id}`);
      loadAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  }

  if (user?.role !== "SUPERADMIN") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="text-blue-500" /> Manage Admins
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={16} /> Add Admin
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : admins.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No admins found. Click 'Add Admin' to create one.</div>
        ) : (
          <table className="w-full text-sm text-left relative">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500">Name / Contact</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Credentials</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Permissions</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{adm.adminProfile?.name}</p>
                    <p className="text-xs text-slate-500">{adm.adminProfile?.phone || "No phone"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono text-blue-600 dark:text-blue-400">{adm.username}</p>
                    <p className="text-xs text-slate-500">ID: {adm.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {adm.adminProfile?.permissions?.length ? (
                        adm.adminProfile.permissions.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] uppercase font-bold tracking-wider">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No access</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${adm.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {adm.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(adm)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(adm.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit Admin" : "Create New Admin"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                  <input required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username {editingId ? "(Read Only)" : <span className="text-red-500">*</span>}</label>
                  <input required={!editingId}
                    disabled={!!editingId}
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password {!editingId && <span className="text-red-500">*</span>}</label>
                  <input required={!editingId}
                    disabled={!!editingId}
                    type="password"
                    value={formData.password}
                    placeholder={editingId ? "Cannot change password here" : "Min 6 chars"}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Module Permissions</h3>
                <p className="text-xs text-slate-500 mb-4">Select which modules this admin has access to. Superadmin always has access to everything.</p>
                <div className="grid grid-cols-2 gap-3">
                  {MODULES.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <input 
                        type="checkbox"
                        checked={formData.permissions.includes(m.id)}
                        onChange={() => togglePermission(m.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {editingId && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Account is Active
                  </label>
                </div>
              )}

              <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-2">
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? "Save Changes" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

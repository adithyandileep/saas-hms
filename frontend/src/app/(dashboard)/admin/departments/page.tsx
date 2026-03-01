"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, Building2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface Department {
  id: string;
  name: string;
  description: string | null;
  _count?: { doctors: number };
}

export default function ManageDepartmentsPage() {
  const user = useAuthStore((state) => state.user);
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoading(true);
    try {
      const res = await api.get("/departments");
      setDepartments(res.data.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(dep?: Department) {
    if (dep) {
      setEditingId(dep.id);
      setFormData({
        name: dep.name,
        description: dep.description || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
      };
      
      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
      } else {
        await api.post("/departments", payload);
      }
      setIsModalOpen(false);
      loadDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save department");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await api.delete(`/departments/${id}`);
      loadDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  }

  // Only Admin or Superadmin can manage (or depending on middleware). The view assumes they have access.
  if (user?.role !== "SUPERADMIN" && user?.role !== "ADMIN") return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Building2 className="text-blue-500" /> Departments
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : departments.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No departments found. Click 'Add Department' to create one.</div>
        ) : (
          <table className="w-full text-sm text-left relative">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500">Department Name</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Description</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Doctors Count</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {departments.map((dep) => (
                <tr key={dep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{dep.name}</p>
                    <p className="text-xs text-slate-500">ID: {dep.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {dep.description || <span className="italic text-slate-400">No description</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium text-xs">
                      {dep._count?.doctors || 0} Doctors
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(dep)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(dep.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit Department" : "Create Department"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></label>
                <input required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cardiology"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl resize-none"
                  placeholder="Optional details about this department"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-2">
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

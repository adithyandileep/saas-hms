"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Pill, Plus, Edit2, Trash2 } from "lucide-react";

type Medicine = {
  id: string;
  medicineName: string;
  brand: string;
  isActive: boolean;
  createdAt: string;
};

type MedicineForm = {
  medicineName: string;
  brand: string;
  isActive: boolean;
};

const initialForm: MedicineForm = {
  medicineName: "",
  brand: "",
  isActive: true,
};

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicineForm>(initialForm);

  async function loadMedicines(includeInactive = showInactive) {
    setLoading(true);
    try {
      const res = await api.get(`/admins/medicines?includeInactive=${includeInactive}`);
      setMedicines(res.data.data || []);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to load medicines");
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines(showInactive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  function openCreate() {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEdit(medicine: Medicine) {
    setEditingId(medicine.id);
    setForm({
      medicineName: medicine.medicineName,
      brand: medicine.brand,
      isActive: medicine.isActive,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admins/medicines/${editingId}`, form);
      } else {
        await api.post("/admins/medicines", form);
      }
      setIsModalOpen(false);
      await loadMedicines();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save medicine");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateMedicine(id: string) {
    if (!confirm("Deactivate this medicine?")) return;
    try {
      await api.patch(`/admins/medicines/${id}/deactivate`);
      await loadMedicines();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to deactivate medicine");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Pill className="text-blue-500" /> Medicines
        </h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4"
            />
            Show inactive
          </label>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={16} /> Add Medicine
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No medicines found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-500">Medicine</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Brand</th>
                <th className="px-6 py-4 font-semibold text-slate-500">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {medicines.map((medicine) => (
                <tr key={medicine.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{medicine.medicineName}</td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{medicine.brand}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${medicine.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {medicine.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(medicine)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                        <Edit2 size={16} />
                      </button>
                      {medicine.isActive && (
                        <button onClick={() => deactivateMedicine(medicine.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      )}
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit Medicine" : "Create Medicine"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                x
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input required type="text" value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} placeholder="Medicine Name" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl" />
              <input required type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl" />

              {editingId && (
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                  Medicine is active
                </label>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-2">
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? "Save Changes" : "Create Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Loader2, CreditCard, ExternalLink } from "lucide-react";

interface Appointment {
  id: string; token: string; startTime: string;
  totalAmount: number; paidAmount: number; pendingAmount: number; paymentStatus: string; status: string;
  patient: { name: string; uhid: string };
  doctor: { name: string; department: string };
}

export default function ReceptionistBillingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("pending");

  useEffect(() => {
    api.get("/bookings/appointments").then(r => {
      setAppointments(r.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = appointments.filter(a => {
    if (filter === "pending") return a.paymentStatus !== "PAID";
    if (filter === "paid") return a.paymentStatus === "PAID";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <CreditCard className="text-blue-500" /> Billing Console
        </h1>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "paid"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${filter === f ? "bg-blue-600 text-white" : "border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={36} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No billing records found.</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {["Token", "Patient", "Doctor", "Total", "Paid", "Pending", "Status", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{a.token}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{a.patient?.name}</p>
                    <p className="text-xs font-mono text-slate-500">{a.patient?.uhid}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700 dark:text-slate-300">Dr. {a.doctor?.name}</p>
                    <p className="text-xs text-slate-500">{a.doctor?.department}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">₹{a.totalAmount}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">₹{a.paidAmount}</td>
                  <td className="px-4 py-3 font-semibold text-red-500">₹{a.pendingAmount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      a.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : a.paymentStatus === "PARTIAL" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                      {a.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/receptionist/billing/${a.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
                      <ExternalLink size={12} /> {a.paymentStatus === "PAID" ? "View" : "Bill"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

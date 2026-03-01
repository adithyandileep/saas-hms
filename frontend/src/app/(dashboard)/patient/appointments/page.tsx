"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Loader2, Calendar } from "lucide-react";

interface Appointment {
  id: string;
  token: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  doctor: { name: string; department: string };
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bookings/my-appointments").then(r => { setAppointments(r.data.data || []); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
        <Calendar className="text-blue-500" /> My Appointments
      </h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">You have no appointments yet. Contact the receptionist to book one.</div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => (
            <div key={a.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Dr. {a.doctor?.name} <span className="text-xs text-slate-500">({a.doctor?.department})</span></p>
                <p className="text-sm text-slate-500 mt-1">{new Date(a.startTime).toLocaleDateString()} | {new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="text-xs text-slate-400 mt-1">Token: {a.token}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${a.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{a.status.replace("_", " ")}</span>
                <p className="text-sm mt-2 font-medium text-slate-900 dark:text-white">₹{a.totalAmount}</p>
                <span className={`text-xs ${a.paymentStatus === "PAID" ? "text-emerald-500" : "text-amber-500"}`}>{a.paymentStatus}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

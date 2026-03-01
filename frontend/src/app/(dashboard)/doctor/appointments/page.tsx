"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Loader2, Stethoscope, Clock, CheckCircle, PlayCircle } from "lucide-react";

interface Appointment {
  id: string; token: string; startTime: string; endTime: string;
  status: string; paymentStatus: string; totalAmount: number;
  patient: { id: string; name: string; uhid: string; age: number; gender?: string };
  visit?: { id: string; status: string } | null;
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    try {
      const res = await api.get("/bookings/appointments");
      setAppointments(res.data.data || []);
    } catch { } finally { setLoading(false); }
  }

  async function handleAcknowledge(appt: Appointment) {
    setAcknowledging(appt.id);
    try {
      // Create (or get existing) visit → redirects to visit page
      const res = await api.post("/visits", {
        appointmentId: appt.id,
        patientId: appt.patient.id,
        doctorId: "", // server derives from appointment
      });
      const visitId = res.data.data.id;
      router.push(`/doctor/appointments/${appt.patient.id}/visit/${visitId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to acknowledge");
    } finally { setAcknowledging(null); }
  }

  const today = appointments.filter(a => {
    const d = new Date(a.startTime);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });
  const upcoming = appointments.filter(a => new Date(a.startTime) > new Date() && !today.find(t => t.id === a.id));

  function AppointmentCard({ a }: { a: Appointment }) {
    const isNew = !a.visit;
    const isInProgress = a.visit && a.visit.status === "in_progress";
    const isCompleted = a.visit && a.visit.status === "completed";

    return (
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
            ${isCompleted ? "bg-emerald-100 dark:bg-emerald-900/30" : isInProgress ? "bg-amber-100 dark:bg-amber-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
            {isCompleted
              ? <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
              : isInProgress
                ? <PlayCircle className="text-amber-600 dark:text-amber-400" size={20} />
                : <Clock className="text-blue-600 dark:text-blue-400" size={20} />}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{a.patient.name}</p>
            <p className="text-sm font-mono text-blue-600 dark:text-blue-400">{a.patient.uhid}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Token: <span className="font-bold text-slate-700 dark:text-slate-300">#{a.token}</span></span>
              <span>{new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(a.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${a.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : a.status === "CHECKED_IN" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{a.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {isNew && (
            <button
              onClick={() => handleAcknowledge(a)}
              disabled={acknowledging === a.id}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {acknowledging === a.id ? <Loader2 className="animate-spin" size={15} /> : null}
              Acknowledge
            </button>
          )}
          {isInProgress && (
            <button
              onClick={() => router.push(`/doctor/appointments/${a.patient.id}/visit/${a.visit!.id}`)}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition"
            >
              Continue Visit
            </button>
          )}
          {isCompleted && (
            <button
              onClick={() => router.push(`/doctor/appointments/${a.patient.id}/visit/${a.visit!.id}`)}
              className="px-4 py-2 bg-slate-600 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition"
            >
              View Notes
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Stethoscope className="text-blue-500" /> My Appointments
        </h1>
        <button onClick={loadAppointments} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          Refresh
        </button>
      </div>

      <div className="flex gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-slate-500"><span className="w-2 h-2 rounded-full bg-blue-500"></span> New</div>
        <div className="flex items-center gap-1.5 text-slate-500 ml-3"><span className="w-2 h-2 rounded-full bg-amber-500"></span> In Progress</div>
        <div className="flex items-center gap-1.5 text-slate-500 ml-3"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-500" size={36} /></div>
      ) : (
        <>
          {today.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">Today</h2>
              {today.map(a => <AppointmentCard key={a.id} a={a} />)}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">Upcoming</h2>
              {upcoming.map(a => <AppointmentCard key={a.id} a={a} />)}
            </div>
          )}

          {appointments.length === 0 && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Stethoscope size={48} className="mx-auto mb-3 opacity-30" />
              <p>No appointments assigned to you yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

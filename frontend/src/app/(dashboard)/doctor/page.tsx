"use client";

import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Calendar, CheckCircle, Clock, Users, Activity, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format, isToday } from "date-fns";

interface Appointment {
  id: string;
  token: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  patient: { name: string; uhid: string };
}

export default function DoctorDashboard() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/bookings/appointments");
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayAppts = appointments.filter(a => isToday(new Date(a.startTime)));
  const pendingCount = todayAppts.filter(a => a.status === 'BOOKED' || a.status === 'CHECKED_IN').length;
  const completedCount = todayAppts.filter(a => a.status === 'COMPLETED').length;

  const handleOpenConsult = async (appt: Appointment) => {
    try {
      setActingId(appt.id);
      if (appt.status === "BOOKED") {
        await api.patch(`/bookings/appointments/${appt.id}/acknowledge`);
      }
      router.push(`/doctor/consultation/${appt.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to open consultation");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
          Welcome, Dr. {user?.username}
        </h1>
        <div className="text-sm font-medium text-slate-500 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          {format(new Date(), "EEEE, MMMM do yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white flex flex-col justify-center">
          <div className="flex items-center gap-3 text-blue-100 mb-2">
            <Users size={20} />
            <h3 className="text-sm font-medium">Today&apos;s Queue</h3>
          </div>
          <p className="text-4xl font-bold mt-2">{todayAppts.length}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <Clock size={20} />
            <h3 className="text-sm font-medium">Waiting / Pending</h3>
          </div>
          <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">{pendingCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <CheckCircle size={20} />
            <h3 className="text-sm font-medium">Completed</h3>
          </div>
          <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">{completedCount}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <Activity className="text-blue-500" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Today&apos;s Appointments</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : todayAppts.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {todayAppts.map(appt => (
              <div key={appt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Token badge — flexible width, no overflow */}
                  <div className="shrink-0 flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl px-3 py-2 min-w-[56px]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-60 leading-none mb-1">Token</span>
                    <span className="text-sm font-bold font-mono leading-none break-all text-center">{appt.token}</span>
                  </div>
                  {/* Patient info */}
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{appt.patient.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mb-1.5 truncate">{appt.patient.uhid}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock size={11} />
                        {format(new Date(appt.startTime), "hh:mm a")} – {format(new Date(appt.endTime), "hh:mm a")}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : appt.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => handleOpenConsult(appt)}
                    disabled={actingId === appt.id}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                      appt.status === 'COMPLETED'
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                    }`}
                  >
                    {actingId === appt.id ? "Opening..." : appt.status === 'COMPLETED' ? 'View Details' : appt.status === 'BOOKED' ? 'Acknowledge & Start' : 'Start Consult'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="mx-auto mb-3 opacity-20" size={48} />
            <p>No appointments booked for today.</p>
          </div>
        )}
      </div>
    </div>
  );
}

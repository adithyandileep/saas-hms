"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Users, Calendar, CheckCircle2, Clock, Loader2 } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

interface DashStats {
  todayAppointments: number;
  pendingCheckIn: number;
  completedToday: number;
  totalPatients: number;
}

interface TodayAppt {
  id: string;
  token: string;
  startTime: string;
  status: string;
  paymentStatus?: string;
  pendingAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  patient: { name: string; uhid: string };
  doctor: { name: string };
}

export default function ReceptionistDashboard() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [stats, setStats] = useState<DashStats>({ todayAppointments: 0, pendingCheckIn: 0, completedToday: 0, totalPatients: 0 });
  const [todayAppts, setTodayAppts] = useState<TodayAppt[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingAppt, setPayingAppt] = useState<TodayAppt | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [apptRes, patientRes] = await Promise.all([
          api.get("/bookings/appointments"),
          api.get("/patients").catch(() => ({ data: { data: [] } }))
        ]);
        const allAppts: TodayAppt[] = apptRes.data.data || [];
        const today = new Date().toDateString();
        const todayList = allAppts.filter(a => new Date(a.startTime).toDateString() === today);
        setTodayAppts(todayList.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)));
        setStats({
          todayAppointments: todayList.length,
          pendingCheckIn: todayList.filter(a => a.status === "BOOKED").length,
          completedToday: todayList.filter(a => a.status === "COMPLETED").length,
          totalPatients: (patientRes.data.data || []).length,
        });
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const statusColor: Record<string, string> = {
    BOOKED: "bg-blue-100 text-blue-700",
    CHECKED_IN: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Receptionist Desk</h1>
          {(user as { name?: string })?.name && <p className="text-sm text-slate-500 mt-0.5">Welcome back, {(user as { name?: string }).name}</p>}
        </div>
        <button onClick={() => router.push("/receptionist/appointments")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
          <Calendar size={16} /> New Appointment
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: stats.todayAppointments, icon: <Calendar size={20} />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Pending Check-in", value: stats.pendingCheckIn, icon: <Clock size={20} />, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Completed Today", value: stats.completedToday, icon: <CheckCircle2 size={20} />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Total Patients", value: stats.totalPatients, icon: <Users size={20} />, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
              <span className={s.color}>{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{loading ? <Loader2 size={20} className="animate-spin text-slate-400" /> : s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's appointment list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">Today&apos;s Appointments</h2>
          <button onClick={() => router.push("/receptionist/appointments")} className="text-xs text-blue-600 hover:underline">View all</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={28} /></div>
        ) : todayAppts.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <Calendar size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No appointments scheduled for today.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                {["Token", "Patient", "Doctor", "Time", "Status", "Payment", "Action"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {todayAppts.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3 font-mono font-medium text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => router.push(`/receptionist/patients/${a.patient?.uhid}`)}>#{a.token}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white cursor-pointer" onClick={() => router.push(`/receptionist/patients/${a.patient?.uhid}`)}>{a.patient?.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">Dr. {a.doctor?.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="px-5 py-3 cursor-pointer" onClick={() => router.push(`/receptionist/patients/${a.patient?.uhid}`)}>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[a.status] || "bg-slate-100 text-slate-600"}`}>{a.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      a.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      a.paymentStatus === "PARTIAL" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}>{a.paymentStatus || "PENDING"}</span>
                  </td>
                  <td className="px-5 py-3">
                    {(a.paymentStatus !== "PAID" && (a.pendingAmount || 0) > 0) ? (
                      <button onClick={(e) => { e.stopPropagation(); setPayingAppt(a); }} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-700 transition">
                        Pay ₹{a.pendingAmount}
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/receptionist/billing/${a.id}`); }} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {payingAppt && (
        <PaymentModal 
          appointment={{ ...payingAppt, totalAmount: payingAppt.totalAmount || 0 } as unknown as Appointment} 
          onClose={() => setPayingAppt(null)} 
          onSuccess={() => {
            setPayingAppt(null);
            // Quick refresh of the stats
            api.get("/bookings/appointments").then(res => {
              const allAppts: TodayAppt[] = res.data.data || [];
              const today = new Date().toDateString();
              const todayList = allAppts.filter(a => new Date(a.startTime).toDateString() === today);
              setTodayAppts(todayList.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime)));
            });
          }} 
        />
      )}
    </div>
  );
}

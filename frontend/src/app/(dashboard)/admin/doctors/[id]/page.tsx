"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Loader2, ArrowLeft, Activity, Calendar, Clock, Settings, User } from "lucide-react";

interface Doctor {
  id: string; name: string; phone: string; consultationFee: number;
  incrementIntervalDays: number; renewalCharge: number;
  department?: { id: string; name: string };
  user?: { username: string; isActive: boolean };
}

const tabs = [
  { id: "overview",       label: "Overview",      icon: User },
  { id: "appointments",   label: "Appointments",   icon: Calendar },
  { id: "consultations",  label: "Consultations",  icon: Activity },
  { id: "slots",          label: "Slots",          icon: Clock },
];

export default function AdminDoctorDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then(r => setDoctor(r.data.data))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!doctor) return <div className="text-center py-20 text-slate-500">Doctor not found.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dr. {doctor.name}</h1>
          <p className="text-sm text-blue-600 dark:text-blue-400">{doctor.department?.name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${doctor.user?.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700"}`}>
          {doctor.user?.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <DoctorOverview doctor={doctor} />}
      {activeTab === "appointments" && <DoctorAppointments doctorId={id} doctorName={doctor.name} />}
      {activeTab === "consultations" && <DoctorConsultations doctorId={id} />}
      {activeTab === "slots" && <DoctorSlots doctorId={id} doctorName={doctor.name} />}
    </div>
  );
}

function DoctorOverview({ doctor }: { doctor: Doctor }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Doctor Information</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[
          ["Department", doctor.department?.name],
          ["Phone", doctor.phone],
          ["Username", doctor.user?.username],
          ["Consultation Fee", `₹${doctor.consultationFee}`],
          ["Follow-up Interval", `${doctor.incrementIntervalDays} days`],
          ["Renewal Charge", `₹${doctor.renewalCharge}`],
        ].map(([label, value]) => value ? (
          <div key={label}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm text-slate-900 dark:text-white mt-0.5 font-medium">{value}</p>
          </div>
        ) : null)}
      </div>
    </div>
  );
}

function DoctorAppointments({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/appointments?doctorId=${doctorId}`)
      .then(r => setAppointments(r.data.data || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  const today = appointments.filter(a => new Date(a.startTime).toDateString() === new Date().toDateString());
  const upcoming = appointments.filter(a => new Date(a.startTime) > new Date() && !today.find(t => t.id === a.id));
  const past = appointments.filter(a => new Date(a.startTime) < new Date() && !today.find(t => t.id === a.id));

  return (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">No appointments found for Dr. {doctorName}.</div>
      ) : (
        <>
          {today.length > 0 && <AppointmentSection title="Today" items={today} />}
          {upcoming.length > 0 && <AppointmentSection title="Upcoming" items={upcoming} />}
          {past.length > 0 && <AppointmentSection title="Past" items={past} />}
        </>
      )}
    </div>
  );
}

function AppointmentSection({ title, items }: { title: string; items: any[] }) {
  const statusColors: Record<string, string> = {
    BOOKED: "bg-blue-100 text-blue-700", CHECKED_IN: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-700",
  };
  return (
    <div>
      <h3 className="font-semibold text-slate-600 dark:text-slate-400 text-sm uppercase tracking-wider mb-2">{title}</h3>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {["Token", "Patient", "Time", "Status", "Payment"].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 text-left uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">#{a.token}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{a.patient?.name}</p>
                  <p className="text-xs font-mono text-slate-500">{a.patient?.uhid}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {new Date(a.startTime).toLocaleDateString("en-IN")} · {new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[a.status] || "bg-slate-100 text-slate-600"}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${a.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{a.paymentStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DoctorConsultations({ doctorId }: { doctorId: string }) {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/visits?doctorId=${doctorId}`)
      .then(r => setVisits(r.data.data || []))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="space-y-3">
      {visits.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">No consultation records found.</div>
      ) : visits.map(v => (
        <div key={v.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{v.patient?.name || v.appointment?.patient?.name}</p>
              <p className="text-xs text-slate-500 font-mono">{v.patient?.uhid || v.appointment?.patient?.uhid}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${v.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{v.status}</span>
              <p className="text-xs text-slate-500 mt-1">{new Date(v.createdAt || v.startedAt).toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          {v.chiefComplaint && <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-medium">Chief Complaint:</span> {v.chiefComplaint}</p>}
          {v.diagnosis && <p className="text-sm text-slate-700 dark:text-slate-300 mt-1"><span className="font-medium">Diagnosis:</span> {v.diagnosis}</p>}
        </div>
      ))}
    </div>
  );
}

function DoctorSlots({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const getLocalDate = () => { const offset = new Date().getTimezoneOffset() * 60000; return new Date(Date.now() - offset).toISOString().split("T")[0]; };
  const [date, setDate] = useState(getLocalDate());

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/slots/${doctorId}?date=${date}`)
      .then(r => setSlots(r.data.data || []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">View Slots for Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Dr. {doctorName}'s schedule on {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
      ) : slots.length === 0 ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">No slots configured for this date.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map(s => {
            const isPast = new Date(s.endTime) < new Date();
            const isFull = !s.isAvailable;
            return (
              <div key={s.id} className={`p-3 rounded-xl text-sm font-medium border-2 ${isPast ? "border-slate-200 bg-slate-100 dark:bg-slate-800 opacity-50" : isFull ? "border-red-200 bg-red-50 dark:bg-red-900/10" : "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10"}`}>
                <div className="font-semibold text-slate-800 dark:text-white">{new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                <div className="text-xs text-slate-500 mt-0.5">{new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                <div className={`text-xs mt-1 font-medium ${isFull ? "text-red-500" : isPast ? "text-slate-400" : "text-emerald-600"}`}>
                  {isFull ? "Full" : isPast ? "Past" : `${s.bookedCount}/${s.maxCapacity} booked`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Loader2, ArrowLeft, User, Calendar, Activity,
  CheckCircle2, Clock, ChevronDown, ChevronUp, Pill
} from "lucide-react";

interface Medication {
  name?: string;
  dosage?: string;
  drug?: string;
  dose?: string;
  unit?: string;
  frequency?: string;
  duration?: string;
  durationUnit?: string;
}
interface Visit {
  chiefComplaint?: string; diagnosis?: string;
  medications?: Medication[]; notes?: string;
}
interface Appointment {
  id: string; token: string; startTime: string; endTime: string;
  status: string; paymentStatus: string; totalAmount: number;
  doctor: { id: string; name: string; department: string | { name: string } };
  visit?: Visit | null;
}
interface Patient {
  id: string; uhid: string; name: string; age: number; dob?: string;
  gender?: string; contactNo?: string; email?: string; address?: string;
  createdAt: string;
}

function deptStr(dept: unknown): string {
  if (!dept) return "";
  return typeof dept === "object" ? (dept as { name?: string }).name || "" : String(dept);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    BOOKED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CHECKED_IN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}>{status.replace("_", " ")}</span>;
}

// A single past visit card, collapsible
function VisitCard({ a }: { a: Appointment }) {
  const [open, setOpen] = useState(true);
  const hasNotes = a.visit?.chiefComplaint || a.visit?.diagnosis || a.visit?.notes || (a.visit?.medications && a.visit.medications.length > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
      >
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">Dr. {a.doctor?.name}
            {deptStr(a.doctor?.department) && <span className="ml-2 text-xs font-normal text-slate-500">({deptStr(a.doctor?.department)})</span>}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date(a.startTime).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} · Token #{a.token}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={a.status} />
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Clinical notes */}
      {open && (
        <div className="p-6 space-y-4">
          {!hasNotes ? (
            <p className="text-sm text-slate-400 text-center py-2">No clinical notes recorded for this visit.</p>
          ) : (
            <>
              {a.visit?.chiefComplaint && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Chief Complaint</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-2.5 border-l-4 border-blue-400">{a.visit.chiefComplaint}</p>
                </div>
              )}
              {a.visit?.diagnosis && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Diagnosis</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg px-4 py-2.5 border-l-4 border-emerald-400">{a.visit.diagnosis}</p>
                </div>
              )}
              {a.visit?.notes && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Doctor&apos;s Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{a.visit.notes}</p>
                </div>
              )}
              {a.visit?.medications && a.visit.medications.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Pill size={12} /> Medications Prescribed
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          {["Medicine", "Dosage", "Frequency", "Duration"].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {a.visit.medications.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{m.name || m.drug}</td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.dosage || `${m.dose || ""} ${m.unit || ""}`.trim()}</td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.frequency}</td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{`${m.duration || ""} ${m.durationUnit || ""}`.trim()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorPatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/bookings/appointments?patientId=${id}`).catch(() => ({ data: { data: [] } }))
    ]).then(([pRes, aRes]) => {
      setPatient(pRes.data.data);
      setAppointments(aRes.data.data || []);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!patient) return <div className="text-center py-20 text-slate-500">Patient not found</div>;

  const historyVisits = appointments
    .filter(a => !!a.visit)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const upcoming = appointments.filter(a => a.status === "BOOKED" || a.status === "CHECKED_IN");
  const isSameDay = (dateStr: string) => new Date(dateStr).toDateString() === new Date().toDateString();

  async function openConsult(a: Appointment) {
    setActingId(a.id);
    try {
      if (a.status === "BOOKED") {
        await api.patch(`/bookings/appointments/${a.id}/acknowledge`);
      }
      router.push(`/doctor/consultation/${a.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Unable to open consultation");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{patient.uhid}</p>
            {patient.gender && <span className="text-xs text-slate-400">· {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>}
            {patient.age > 0 && <span className="text-xs text-slate-400">· {patient.age} yrs</span>}
            {patient.contactNo && <span className="text-xs text-slate-400">· {patient.contactNo}</span>}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{appointments.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Visits</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{historyVisits.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Completed</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Upcoming</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl">
        {[
          { key: "overview" as const, label: "Patient Info", icon: <User size={15} /> },
          { key: "history" as const, label: `Medical History (${historyVisits.length})`, icon: <Activity size={15} /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition ${activeTab === tab.key ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Patient Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {patient.age > 0 && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Age</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient.age} years</p></div>}
              {patient.dob && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Date of Birth</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{new Date(patient.dob).toLocaleDateString("en-IN")}</p></div>}
              {patient.gender && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Gender</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{patient.gender}</p></div>}
              {patient.contactNo && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Contact</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient.contactNo}</p></div>}
              {patient.email && <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Email</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient.email}</p></div>}
              {patient.address && <div className="col-span-2"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Address</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient.address}</p></div>}
              <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Registered</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{new Date(patient.createdAt).toLocaleDateString("en-IN")}</p></div>
            </div>
          </div>

          {/* Upcoming appointments */}
          {upcoming.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={16} className="text-blue-500" /> Upcoming Appointments
              </h3>
              {upcoming.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl mb-2 last:mb-0 border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Dr. {a.doctor?.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{new Date(a.startTime).toLocaleDateString("en-IN")} · {new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    {isSameDay(a.startTime) && (
                      <button
                        onClick={() => openConsult(a)}
                        disabled={actingId === a.id}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                      >
                        {actingId === a.id ? "Opening..." : a.status === "BOOKED" ? "Acknowledge & Open" : "Open Consult"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {historyVisits.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-10 text-center">
              <CheckCircle2 size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Past Visits</h3>
              <p className="text-sm text-slate-500">Completed consultation records will appear here.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">{historyVisits.length} visit record{historyVisits.length !== 1 ? "s" : ""} — most recent first</p>
              {historyVisits.map(a => <VisitCard key={a.id} a={a} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Loader2, Edit2, Save, X, ArrowLeft, Printer, CreditCard,
  User, Calendar, Receipt, Activity,
  CheckCircle2, Clock
} from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface Appointment {
  id: string; token: string; startTime: string; endTime: string;
  status: string; paymentStatus: string; totalAmount: number;
  paidAmount: number; pendingAmount: number;
  doctor: { id: string; name: string; department: string | { name: string } };
}
interface Patient {
  id: string; uhid: string; name: string; firstName?: string; lastName?: string;
  age: number; dob?: string; gender?: string;
  address?: string; contactNo?: string; alternateContact?: string; email?: string;
  guardianName?: string; guardianRelation?: string; guardianContact?: string;
  guardianComment?: string; guardianAddress?: string;
  referredDoctor?: string; referredHospital?: string;
  idProofType?: string; idProofDetail?: string;
  registrationAmount?: number; registrationPaymentStatus: string;
  createdAt: string;
}

type Tab = "overview" | "appointments" | "billing" | "medical";

function deptStr(dept: any): string {
  if (!dept) return "";
  return typeof dept === "object" ? dept.name || "" : String(dept);
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

function PayBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    PENDING: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    UNPAID: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  };
  return <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────


// ─── Billing Tab ───────────────────────────────────────────────────────────────
function BillingTab({ patient, appointments, onRefresh }: { patient: Patient; appointments: Appointment[]; onRefresh: () => void }) {
  const [payingAppointment, setPayingAppointment] = useState<Appointment | null>(null);
  const [regPaying, setRegPaying] = useState(false);
  const [regMode, setRegMode] = useState("CASH");
  const [regModal, setRegModal] = useState(false);
  const [regErr, setRegErr] = useState("");

  const totalFee = appointments.reduce((s, a) => s + a.totalAmount, 0);
  const totalPaid = appointments.reduce((s, a) => s + (a.paidAmount ?? 0), 0) + (patient.registrationPaymentStatus === "PAID" ? (patient.registrationAmount ?? 0) : 0);
  const regPending = patient.registrationPaymentStatus !== "PAID" ? (patient.registrationAmount ?? 0) : 0;
  const apptPending = appointments.reduce((s, a) => s + (a.pendingAmount ?? Math.max(0, a.totalAmount - (a.paidAmount ?? 0))), 0);
  const grandTotal = (patient.registrationAmount ?? 0) + totalFee;
  const grandPending = regPending + apptPending;

  async function payReg() {
    setRegPaying(true); setRegErr("");
    try {
      await api.put(`/patients/${patient.id}/pay`, { paymentMode: regMode });
      setRegModal(false); onRefresh();
    } catch (e: any) { setRegErr(e.response?.data?.message || "Failed"); }
    finally { setRegPaying(false); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Grand Total", value: `₹${grandTotal}`, color: "text-slate-900 dark:text-white" },
          { label: "Total Paid", value: `₹${totalPaid}`, color: "text-emerald-600" },
          { label: "Pending", value: `₹${grandPending}`, color: grandPending > 0 ? "text-red-500" : "text-emerald-600" },
          { label: "Appointments", value: String(appointments.length), color: "text-blue-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@media print { body * { visibility: hidden; } #bill-print, #bill-print * { visibility: visible; } #bill-print { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }` }} />

      <div id="bill-print" className="space-y-4">
        {(patient.registrationAmount ?? 0) > 0 && (
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${patient.registrationPaymentStatus === "PAID" ? "border-emerald-200 dark:border-emerald-800" : "border-orange-200 dark:border-orange-800"} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Registration</span>
                  {patient.registrationPaymentStatus === "PAID"
                    ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold"><CheckCircle2 size={12} /> Paid</span>
                    : <span className="flex items-center gap-1 text-xs text-orange-600 font-semibold"><Clock size={12} /> Pending</span>
                  }
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">Registration Fee</p>
                <p className="text-sm text-slate-500 mt-0.5">UHID: {patient.uhid}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-900 dark:text-white">₹{patient.registrationAmount}</p>
                {patient.registrationPaymentStatus !== "PAID" && (
                  <button onClick={() => setRegModal(true)}
                    className="no-print mt-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-semibold hover:bg-orange-700 transition">
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {appointments.length === 0 && (
          <div className="text-center py-10 text-slate-500">No appointments found for this patient.</div>
        )}
        {appointments.map(apt => {
          const isPaid = apt.paymentStatus === "PAID";
          const pending = apt.pendingAmount ?? Math.max(0, apt.totalAmount - (apt.paidAmount ?? 0));
          return (
            <div key={apt.id} className={`bg-white dark:bg-slate-900 rounded-2xl border-2 ${isPaid ? "border-emerald-200 dark:border-emerald-800" : "border-orange-200 dark:border-orange-800"} p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Consultation</span>
                    <StatusBadge status={apt.status} />
                    <PayBadge status={apt.paymentStatus} />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-base">Dr. {apt.doctor?.name}</p>
                  <p className="text-sm text-slate-500">{deptStr(apt.doctor?.department)}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={13} />{new Date(apt.startTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span className="flex items-center gap-1 font-mono">Token: {apt.token}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400 mb-1">Consult Fee</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">₹{apt.totalAmount}</p>
                  {(apt.paidAmount ?? 0) > 0 && (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5">Paid: ₹{apt.paidAmount}</p>
                  )}
                  {!isPaid && pending > 0 && (
                    <>
                      <p className="text-xs text-red-500 font-medium mt-0.5">Due: ₹{pending}</p>
                      <button onClick={() => setPayingAppointment(apt)}
                        className="no-print mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5 justify-end">
                        <CreditCard size={12} /> Pay Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {appointments.length > 0 && (
        <button onClick={() => window.print()} className="no-print flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <Printer size={15} /> Print Bill
        </button>
      )}

      {payingAppointment && (
        <PaymentModal appointment={payingAppointment}
          onClose={() => setPayingAppointment(null)}
          onSuccess={() => { setPayingAppointment(null); onRefresh(); }} />
      )}

      {regModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white">Pay Registration Fee</h3>
              <button onClick={() => setRegModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <span className="text-slate-600 dark:text-slate-400">Registration Fee</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">₹{patient.registrationAmount}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["CASH", "Cash"], ["UPI", "UPI"], ["CREDIT", "Card"]].map(([val, label]) => (
                    <button key={val} onClick={() => setRegMode(val)}
                      className={`py-2 rounded-xl text-sm font-medium border-2 transition ${regMode === val ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {regErr && <p className="text-sm text-red-600">{regErr}</p>}
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button onClick={() => setRegModal(false)} className="flex-1 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
              <button onClick={payReg} disabled={regPaying} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                {regPaying ? <Loader2 className="animate-spin" size={15} /> : null} Pay ₹{patient.registrationAmount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


interface AppointmentWithVisit extends Appointment {
  visit?: {
    chiefComplaint?: string;
    diagnosis?: string;
    medications?: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
    notes?: string;
  } | null;
}

// ─── Medical Tab ───────────────────────────────────────────────────────────────
function MedicalTab({ patientId }: { patientId: string }) {
  const [visits, setVisits] = useState<AppointmentWithVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/appointments?patientId=${patientId}`)
      .then(res => {
        const all: AppointmentWithVisit[] = res.data.data || [];
        // Only completed appointments that have visit data
        setVisits(all.filter(a => a.status === "COMPLETED" && a.visit));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={30} /></div>;

  if (visits.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-10 text-center">
        <Activity size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Medical Records Yet</h3>
        <p className="text-sm text-slate-500">Clinical notes and prescriptions from completed visits will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visits.map(a => (
        <div key={a.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Visit header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Dr. {a.doctor?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{deptStr(a.doctor?.department)} · {new Date(a.startTime).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">Token: {a.token}</span>
          </div>

          <div className="p-6 space-y-4">
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
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{a.visit.notes}</p>
              </div>
            )}
            {a.visit?.medications && Array.isArray(a.visit.medications) && a.visit.medications.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Medications Prescribed</p>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        {["Medicine", "Dosage", "Frequency", "Duration"].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {a.visit.medications!.map((m, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{m.name}</td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.dosage}</td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.frequency}</td>
                          <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!a.visit?.chiefComplaint && !a.visit?.diagnosis && !a.visit?.medications && (
              <p className="text-sm text-slate-400 text-center py-2">No clinical notes recorded for this visit.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReceptionistPatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [alternateContact, setAlternateContact] = useState("");
  const [email, setEmail] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [guardianComment, setGuardianComment] = useState("");
  const [referredDoctor, setReferredDoctor] = useState("");
  const [referredHospital, setReferredHospital] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofDetail, setIdProofDetail] = useState("");
  const [saving, setSaving] = useState(false);

  function hydrate(p: Patient) {
    const idx = p.name.indexOf(" ");
    setFirstName(p.firstName || (idx === -1 ? p.name : p.name.slice(0, idx)));
    setLastName(p.lastName || (idx === -1 ? "" : p.name.slice(idx + 1)));
    setDob(p.dob ? p.dob.slice(0, 10) : "");
    setGender(p.gender || ""); setContactNo(p.contactNo || "");
    setAlternateContact(p.alternateContact || ""); setEmail(p.email || "");
    setGuardianName(p.guardianName || ""); setGuardianRelation(p.guardianRelation || "");
    setGuardianContact(p.guardianContact || ""); setGuardianComment(p.guardianComment || "");
    setReferredDoctor(p.referredDoctor || ""); setReferredHospital(p.referredHospital || "");
    setIdProofType(p.idProofType || ""); setIdProofDetail(p.idProofDetail || "");
  }

  async function load() {
    try {
      const [pRes, aRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/bookings/appointments?patientId=${id}`).catch(() => ({ data: { data: [] } }))
      ]);
      const p = pRes.data.data;
      setPatient(p); hydrate(p);
      setAppointments(aRes.data.data || []);
    } finally { setLoading(false); }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  async function save() {
    if (!patient) return;
    setSaving(true);
    try {
      const res = await api.put(`/patients/${patient.id}`, {
        name: `${firstName} ${lastName}`.trim(),
        firstName, lastName, dob: dob || null, gender: gender || null,
        contactNo: contactNo || null, alternateContact: alternateContact || null, email: email || null,
        guardianName, guardianRelation, guardianContact, guardianComment,
        referredDoctor, referredHospital, idProofType, idProofDetail,
      });
      const updated = res.data.data;
      setPatient(updated); hydrate(updated); setEditing(false);
    } catch (err: any) { alert(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!patient) return <div className="text-center py-20 text-slate-500">Patient not found</div>;

  const upcoming = appointments.filter(a => a.status === "BOOKED" || a.status === "CHECKED_IN");
  const history = appointments.filter(a => a.status === "COMPLETED" || a.status === "CANCELLED");

  const inputCls = "w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1";

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <User size={16} /> },
    { key: "appointments", label: "Appointments", icon: <Calendar size={16} />, badge: appointments.length },
    { key: "billing", label: "Billing", icon: <Receipt size={16} /> },
    { key: "medical", label: "Medical", icon: <Activity size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{patient.uhid}</p>
            {patient.gender && <span className="text-xs text-slate-400">· {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>}
            {patient.age > 0 && <span className="text-xs text-slate-400">· {patient.age}y</span>}
          </div>
        </div>
        <button
          onClick={() => router.push(`/receptionist/appointments?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
          <Calendar size={15} /> Book Appointment
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition ${activeTab === tab.key ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`}>
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.key ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Patient Information</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"><Edit2 size={14} /> Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50 transition"><Save size={14} />{saving ? "Saving..." : "Save"}</button>
                  <button onClick={() => { setEditing(false); hydrate(patient); }} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"><X size={14} />Cancel</button>
                </div>
              )}
            </div>

            {!editing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Field label="Age" value={String(patient.age)} />
                <Field label="DOB" value={patient.dob ? new Date(patient.dob).toLocaleDateString("en-IN") : undefined} />
                <Field label="Gender" value={patient.gender} />
                <Field label="Contact" value={patient.contactNo} />
                <Field label="Alternate Contact" value={patient.alternateContact} />
                <Field label="Email" value={patient.email} />
                <Field label="Address" value={patient.address} />
                <Field label="Referred By" value={patient.referredDoctor} />
                <Field label="Referred Hospital" value={patient.referredHospital} />
                <Field label="ID Proof" value={patient.idProofType} />
                <Field label="ID Detail" value={patient.idProofDetail} />
                <Field label="Registered" value={new Date(patient.createdAt).toLocaleDateString("en-IN")} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className={labelCls}>First Name</label><input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Date of Birth</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div><label className={labelCls}>Contact No.</label><input value={contactNo} onChange={e => setContactNo(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Alternate Contact</label><input value={alternateContact} onChange={e => setAlternateContact(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Referred Doctor</label><input value={referredDoctor} onChange={e => setReferredDoctor(e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Referred Hospital</label><input value={referredHospital} onChange={e => setReferredHospital(e.target.value)} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>ID Proof Type</label>
                    <select value={idProofType} onChange={e => setIdProofType(e.target.value)} className={inputCls}>
                      <option value="">Select</option>
                      <option value="aadhar">Aadhar Card</option>
                      <option value="passport">Passport</option>
                      <option value="voter">Voter ID</option>
                      <option value="driving">Driving Licence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div><label className={labelCls}>ID Number / Detail</label><input value={idProofDetail} onChange={e => setIdProofDetail(e.target.value)} className={inputCls} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Guardian */}
          {(patient.guardianName || patient.guardianRelation) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Guardian Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Field label="Name" value={patient.guardianName} />
                <Field label="Relation" value={patient.guardianRelation} />
                <Field label="Contact" value={patient.guardianContact} />
                <Field label="Address" value={patient.guardianAddress} />
                {patient.guardianComment && (
                  <div className="col-span-2 md:col-span-3 lg:col-span-4">
                    <Field label="Notes" value={patient.guardianComment} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Appointments Tab ── */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> Upcoming
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">{upcoming.length}</span>
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming appointments.</p>
            ) : upcoming.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl mb-3 border border-slate-200 dark:border-slate-700 last:mb-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Dr. {a.doctor?.name} <span className="text-slate-500 text-sm">({deptStr(a.doctor?.department)})</span></p>
                  <p className="text-sm text-slate-500 mt-0.5">{new Date(a.startTime).toLocaleDateString("en-IN")} · {new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Token: {a.token}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={a.status} />
                  <PayBadge status={a.paymentStatus} />
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">₹{a.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> History
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-semibold">{history.length}</span>
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No completed appointments.</p>
            ) : history.map(a => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl mb-2 border border-slate-200 dark:border-slate-700 last:mb-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Dr. {a.doctor?.name}</p>
                  <p className="text-sm text-slate-500">{new Date(a.startTime).toLocaleDateString("en-IN")}</p>
                  <p className="text-xs font-mono text-slate-400">Token: {a.token}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={a.status} />
                  <PayBadge status={a.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Billing Tab ── */}
      {activeTab === "billing" && (
        <BillingTab patient={patient} appointments={appointments} onRefresh={load} />
      )}

      {/* ── Medical Tab ── */}
      {activeTab === "medical" && (
        <MedicalTab patientId={patient.id} />
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Loader2, Edit2, Save, X, ArrowLeft, Printer, CreditCard,
  User, Calendar, Receipt, Activity, CheckCircle2, Clock
} from "lucide-react";

interface Appointment {
  id: string; token: string; startTime: string; endTime: string;
  status: string; paymentStatus: string; totalAmount: number;
  paidAmount: number; pendingAmount: number;
  doctor: { id: string; name: string; department: string | { name: string } };
  visit?: {
    chiefComplaint?: string; diagnosis?: string;
    medications?: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
    notes?: string;
  } | null;
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

function PayBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    PARTIAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{value}</p>
    </div>
  );
}

function BillingTab({ patient, appointments, onRefresh }: { patient: Patient; appointments: Appointment[]; onRefresh: () => void }) {
  const [payModal, setPayModal] = useState<Appointment | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const billable = appointments.filter(a => a.status !== "CANCELLED");

  async function handlePay() {
    if (!payModal) return;
    setPaying(true);
    try {
      await api.patch(`/bookings/appointments/${payModal.id}/payment`, { amount: Number(payAmount), paymentMethod: "CASH" });
      setPayModal(null); onRefresh();
    } catch (err: unknown) { alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Payment failed"); }
    finally { setPaying(false); }
  }

  function printReceipt(a: Appointment) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Receipt - ${a.token}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;max-width:400px;margin:auto}h2{margin:0 0 4px}hr{margin:12px 0}table{width:100%;border-collapse:collapse}td{padding:4px 0}@media print{button{display:none}}</style></head>
    <body><h2>${patient.name}</h2><p style="color:#666;font-size:13px">${patient.uhid}</p><hr/>
    <table><tr><td>Token</td><td style="text-align:right"><b>${a.token}</b></td></tr>
    <tr><td>Date</td><td style="text-align:right">${new Date(a.startTime).toLocaleDateString("en-IN")}</td></tr>
    <tr><td>Doctor</td><td style="text-align:right">Dr. ${a.doctor?.name}</td></tr>
    <tr><td>Total</td><td style="text-align:right">₹${a.totalAmount}</td></tr>
    <tr><td>Paid</td><td style="text-align:right">₹${a.paidAmount}</td></tr>
    <tr><td>Pending</td><td style="text-align:right">₹${a.pendingAmount}</td></tr></table>
    <hr/><button onclick="window.print()">Print</button></body></html>`);
    win.document.close();
  }

  if (billable.length === 0) return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-10 text-center">
      <Receipt size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="font-semibold text-slate-700 dark:text-slate-300">No bills yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {billable.map(a => (
        <div key={a.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Dr. {a.doctor?.name}</p>
              <p className="text-sm text-slate-500">{new Date(a.startTime).toLocaleDateString("en-IN")} · Token #{a.token}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => printReceipt(a)} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <Printer size={13} /> Receipt
              </button>
              {a.paymentStatus !== "PAID" && (
                <button onClick={() => { setPayModal(a); setPayAmount(String(a.pendingAmount)); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs hover:bg-emerald-700 transition">
                  <CreditCard size={13} /> Collect
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
            <div className="text-center"><p className="text-xs text-slate-500 mb-0.5">Total</p><p className="font-bold text-slate-900 dark:text-white">₹{a.totalAmount}</p></div>
            <div className="text-center"><p className="text-xs text-slate-500 mb-0.5">Paid</p><p className="font-bold text-emerald-600">₹{a.paidAmount}</p></div>
            <div className="text-center"><p className="text-xs text-slate-500 mb-0.5">Pending</p><p className={`font-bold ${a.pendingAmount > 0 ? "text-amber-600" : "text-emerald-600"}`}>₹{a.pendingAmount}</p></div>
          </div>
          <div className="flex items-center gap-2 mt-3"><StatusBadge status={a.status} /><PayBadge status={a.paymentStatus} /></div>
        </div>
      ))}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Collect Payment</h3>
            <p className="text-sm text-slate-500 mb-4">Token #{payModal.token} · Pending ₹{payModal.pendingAmount}</p>
            <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Amount to collect" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-800 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPayModal(null)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm">Cancel</button>
              <button onClick={handlePay} disabled={paying || !payAmount} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">{paying ? "Processing..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MedicalTab({ patientId }: { patientId: string }) {
  const [visits, setVisits] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/bookings/appointments?patientId=${patientId}`)
      .then(res => {
        const all: Appointment[] = res.data.data || [];
        setVisits(all.filter(a => a.status === "COMPLETED" && a.visit));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={30} /></div>;
  if (visits.length === 0) return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-10 text-center">
      <Activity size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Medical Records Yet</h3>
      <p className="text-sm text-slate-500">Clinical notes from completed visits will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {visits.map(a => (
        <div key={a.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Dr. {a.doctor?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{deptStr(a.doctor?.department)} · {new Date(a.startTime).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">Token: {a.token}</span>
          </div>
          <div className="p-6 space-y-4">
            {a.visit?.chiefComplaint && <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Chief Complaint</p><p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-4 py-2.5 border-l-4 border-blue-400">{a.visit.chiefComplaint}</p></div>}
            {a.visit?.diagnosis && <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Diagnosis</p><p className="text-sm text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg px-4 py-2.5 border-l-4 border-emerald-400">{a.visit.diagnosis}</p></div>}
            {a.visit?.notes && <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</p><p className="text-sm text-slate-700 dark:text-slate-300">{a.visit.notes}</p></div>}
            {a.visit?.medications && a.visit.medications.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Medications</p>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800"><tr>{["Medicine","Dosage","Frequency","Duration"].map(h=><th key={h} className="text-left px-4 py-2 text-xs font-bold text-slate-500 uppercase">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {a.visit.medications.map((m, i) => <tr key={i}><td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{m.name}</td><td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.dosage}</td><td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.frequency}</td><td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.duration}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!a.visit?.chiefComplaint && !a.visit?.diagnosis && !a.visit?.medications && <p className="text-sm text-slate-400 text-center py-2">No clinical notes recorded.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);

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
    } catch (err: unknown) { alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Save failed"); }
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
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{patient.uhid}</p>
            {patient.gender && <span className="text-xs text-slate-400">· {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</span>}
            {patient.age > 0 && <span className="text-xs text-slate-400">· {patient.age}y</span>}
          </div>
        </div>
        <button
          onClick={() => router.push(`/admin/appointments?patientId=${patient.id}&patientName=${encodeURIComponent(patient.name)}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
          <Calendar size={15} /> Book Appointment
        </button>
      </div>

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelCls}>First Name</label><input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Date of Birth</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Gender</label>
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
                <div><label className={labelCls}>ID Proof Type</label>
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
            )}
          </div>
          {(patient.guardianName || patient.guardianRelation) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Guardian Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Field label="Name" value={patient.guardianName} />
                <Field label="Relation" value={patient.guardianRelation} />
                <Field label="Contact" value={patient.guardianContact} />
                <Field label="Address" value={patient.guardianAddress} />
                {patient.guardianComment && <div className="col-span-2 md:col-span-3 lg:col-span-4"><Field label="Notes" value={patient.guardianComment} /></div>}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" /> Upcoming
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">{upcoming.length}</span>
            </h3>
            {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming appointments.</p> : upcoming.map(a => (
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
            {history.length === 0 ? <p className="text-sm text-slate-500">No completed appointments.</p> : history.map(a => (
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

      {activeTab === "billing" && <BillingTab patient={patient} appointments={appointments} onRefresh={load} />}
      {activeTab === "medical" && <MedicalTab patientId={patient.id} />}
    </div>
  );
}

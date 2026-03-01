"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2, Edit2, Save, X, ArrowLeft } from "lucide-react";

interface Appointment {
  id: string; token: string; startTime: string; endTime: string;
  status: string; paymentStatus: string; totalAmount: number;
  doctor: { name: string; department: string };
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    BOOKED: "bg-blue-100 text-blue-700", CHECKED_IN: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
function PayBadge({ status }: { status: string }) {
  const map: Record<string, string> = { PAID: "bg-emerald-100 text-emerald-700", PENDING: "bg-orange-100 text-orange-700", UNPAID: "bg-slate-100 text-slate-600" };
  return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/bookings/appointments?patientId=${id}`).catch(() => ({ data: { data: [] } }))
    ]).then(([pRes, aRes]) => {
      const p = pRes.data.data;
      setPatient(p); hydrate(p);
      setAppointments(aRes.data.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

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
  const labelCls = "block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{patient.name}</h1>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{patient.uhid}</p>
        </div>
      </div>

      {/* Patient info card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Patient Information</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"><Edit2 size={15} /> Edit Details</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition disabled:opacity-50"><Save size={15} />{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => { setEditing(false); hydrate(patient); }} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"><X size={15} />Cancel</button>
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
            <Field label="Guardian" value={patient.guardianName} />
            <Field label="Guardian Relation" value={patient.guardianRelation} />
            <Field label="Guardian Contact" value={patient.guardianContact} />
            <Field label="Referred By" value={patient.referredDoctor} />
            <Field label="Referred Hospital" value={patient.referredHospital} />
            <Field label="ID Proof" value={patient.idProofType} />
            <Field label="ID Detail" value={patient.idProofDetail} />
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
              <div><label className={labelCls}>Guardian Name</label><input value={guardianName} onChange={e => setGuardianName(e.target.value)} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Guardian Relation</label>
                <select value={guardianRelation} onChange={e => setGuardianRelation(e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="father">Father</option><option value="mother">Mother</option>
                  <option value="spouse">Spouse</option><option value="guardian">Guardian</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className={labelCls}>Guardian Contact</label><input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Referred Doctor</label><input value={referredDoctor} onChange={e => setReferredDoctor(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Referred Hospital</label><input value={referredHospital} onChange={e => setReferredHospital(e.target.value)} className={inputCls} /></div>
              <div>
                <label className={labelCls}>ID Proof Type</label>
                <select value={idProofType} onChange={e => setIdProofType(e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  <option value="aadhar">Aadhar Card</option><option value="passport">Passport</option>
                  <option value="voter">Voter ID</option><option value="driving">Driving Licence</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className={labelCls}>ID Number / Detail</label><input value={idProofDetail} onChange={e => setIdProofDetail(e.target.value)} className={inputCls} /></div>
              <div className="md:col-span-3"><label className={labelCls}>Guardian Comment</label><textarea value={guardianComment} onChange={e => setGuardianComment(e.target.value)} rows={2} className={inputCls} /></div>
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Upcoming Appointments</h3>
        {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming appointments</p> :
          upcoming.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl mb-3 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Dr. {a.doctor?.name} <span className="text-slate-500 text-sm">({a.doctor?.department})</span></p>
                <p className="text-sm text-slate-500 mt-0.5">{new Date(a.startTime).toLocaleDateString("en-IN")} · {new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">Token: {a.token}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={a.status} />
                <PayBadge status={a.paymentStatus} />
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">₹{a.totalAmount}</p>
              </div>
            </div>
          ))}
      </div>

      {/* Appointment History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Appointment History</h3>
        {history.length === 0 ? <p className="text-sm text-slate-500">No completed appointments</p> :
          history.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl mb-2 border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Dr. {a.doctor?.name}</p>
                <p className="text-sm text-slate-500">{new Date(a.startTime).toLocaleDateString("en-IN")}</p>
                <p className="text-xs font-mono text-slate-400">Token: {a.token}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={a.status} />
                <PayBadge status={a.paymentStatus} />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

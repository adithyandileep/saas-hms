"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2, ArrowLeft, Stethoscope, Save, CheckCircle } from "lucide-react";

interface VisitData {
  id: string;
  appointment: {
    id: string; token: string; startTime: string;
    patient: { name: string; uhid: string; age: number; gender?: string };
    doctor: { name: string; department: string };
  };
  chiefComplaint: string | null;
  diagnosis: string | null;
  medications: { name: string; dosage: string; frequency: string; days: string }[] | null;
  notes: string | null;
  status: string;
}

export default function DoctorVisitPage() {
  const { patientId, visitId } = useParams() as { patientId: string; visitId: string };
  const router = useRouter();
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saved, setSaved] = useState(false);

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState([{ name: "", dosage: "", frequency: "", days: "" }]);

  useEffect(() => {
    api.get(`/visits/${visitId}`).then(r => {
      const v = r.data.data;
      setVisit(v);
      setChiefComplaint(v.chiefComplaint || "");
      setDiagnosis(v.diagnosis || "");
      setNotes(v.notes || "");
      if (v.medications?.length) setMedications(v.medications);
    }).finally(() => setLoading(false));
  }, [visitId]);

  function addMed() { setMedications(m => [...m, { name: "", dosage: "", frequency: "", days: "" }]); }
  function removeMed(i: number) { setMedications(m => m.filter((_, idx) => idx !== i)); }
  function updateMed(i: number, key: string, value: string) {
    setMedications(m => m.map((med, idx) => idx === i ? { ...med, [key]: value } : med));
  }

  async function handleSave(complete = false) {
    complete ? setCompleting(true) : setSaving(true); setSaved(false);
    try {
      await api.put(`/visits/${visitId}`, {
        chiefComplaint, diagnosis, notes,
        medications: medications.filter(m => m.name.trim()),
        status: complete ? "completed" : "in_progress",
      });
      if (complete) { router.push("/doctor/appointments"); }
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch (err: any) { alert(err.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); setCompleting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!visit) return <div className="text-center py-20 text-slate-500">Visit not found</div>;

  const { patient, doctor, startTime, token } = visit.appointment;
  const inputCls = "w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const isCompleted = visit.status === "completed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Stethoscope className="text-blue-500" /> Clinical Visit
          </h1>
          <p className="text-sm text-slate-500">Dr. {doctor.name} · {new Date(startTime).toLocaleDateString("en-IN")} · Token {token}</p>
        </div>
        {isCompleted && (<span className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"><CheckCircle size={15} /> Completed</span>)}
      </div>

      {/* Patient card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-xs font-medium text-blue-500 uppercase">Patient</p><p className="font-semibold text-blue-900 dark:text-blue-200">{patient.name}</p></div>
          <div><p className="text-xs font-medium text-blue-500 uppercase">UHID</p><p className="font-mono text-sm text-blue-700 dark:text-blue-400">{patient.uhid}</p></div>
          <div><p className="text-xs font-medium text-blue-500 uppercase">Age</p><p className="text-sm text-blue-800 dark:text-blue-300">{patient.age} yrs</p></div>
          <div><p className="text-xs font-medium text-blue-500 uppercase">Gender</p><p className="text-sm text-blue-800 dark:text-blue-300">{patient.gender || "—"}</p></div>
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <label className="block font-semibold text-slate-900 dark:text-white mb-2">Chief Complaint</label>
        <textarea value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)} disabled={isCompleted}
          placeholder="Patient's chief complaint and presenting symptoms..." rows={3} className={inputCls} />
      </div>

      {/* Diagnosis */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <label className="block font-semibold text-slate-900 dark:text-white mb-2">Diagnosis</label>
        <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} disabled={isCompleted}
          placeholder="Diagnosis, ICD codes, findings..." rows={3} className={inputCls} />
      </div>

      {/* Medications / Prescription */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Prescription / Medications</h3>
          {!isCompleted && <button type="button" onClick={addMed} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">+ Add Medicine</button>}
        </div>
        <div className="space-y-3">
          {medications.map((med, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <input value={med.name} onChange={e => updateMed(i, "name", e.target.value)} disabled={isCompleted} placeholder="Medicine name" className={inputCls} />
              <input value={med.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} disabled={isCompleted} placeholder="Dosage (e.g., 500mg)" className={inputCls} />
              <input value={med.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} disabled={isCompleted} placeholder="Frequency (e.g., 2x/day)" className={inputCls} />
              <input value={med.days} onChange={e => updateMed(i, "days", e.target.value)} disabled={isCompleted} placeholder="Duration (e.g., 5 days)" className={inputCls} />
              {!isCompleted && <button onClick={() => removeMed(i)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition text-sm">Remove</button>}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <label className="block font-semibold text-slate-900 dark:text-white mb-2">Doctor Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isCompleted}
          placeholder="Additional notes, follow-up instructions, lab tests..." rows={3} className={inputCls} />
      </div>

      {/* Actions */}
      {!isCompleted && (
        <div className="flex gap-3 sticky bottom-4">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50 shadow-sm">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {saving ? "Saving..." : saved ? "✅ Saved!" : "Save Draft"}
          </button>
          <button onClick={() => handleSave(true)} disabled={completing}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50 shadow-lg shadow-emerald-500/25">
            {completing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            {completing ? "Completing..." : "Mark as Complete & Close Visit"}
          </button>
        </div>
      )}
    </div>
  );
}

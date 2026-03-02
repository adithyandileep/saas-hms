"use client";

import { useState, useEffect, use } from "react";
import api from "@/lib/api";
import { Loader2, ArrowLeft, CheckCircle, Clipboard, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface VisitData {
  id?: string;
  chiefComplaint: string;
  diagnosis: string;
  medications: Medication[];
}

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const [appointment, setAppointment] = useState<any>(null);
  const [visit, setVisit] = useState<VisitData>({ chiefComplaint: "", diagnosis: "", medications: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [unwrappedParams.id]);

  const fetchData = async () => {
    try {
      const apptRes = await api.get(`/bookings/appointments/${unwrappedParams.id}`);
      setAppointment(apptRes.data.data);

      const visitRes = await api.get(`/bookings/appointments/${unwrappedParams.id}/visit`);
      if (visitRes.data.data) {
        setVisit({
          ...visitRes.data.data,
          medications: visitRes.data.data.medications || []
        });
      }
    } catch {
      alert("Error loading consultation data");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    setSaving(true);
    try {
      await api.patch(`/bookings/appointments/${unwrappedParams.id}/acknowledge`);
      fetchData();
    } catch {
      alert("Error acknowledging patient");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVisit = async () => {
    setSaving(true);
    try {
      await api.put(`/bookings/appointments/${unwrappedParams.id}/visit`, visit);
      alert("Consultation notes saved!");
      fetchData();
    } catch {
      alert("Error saving notes");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Are you sure you want to complete this consultation?")) return;
    setSaving(true);
    try {
      await api.patch(`/bookings/appointments/${unwrappedParams.id}/complete`);
      router.push("/doctor");
    } catch {
      alert("Error completing appointment");
    } finally {
      setSaving(false);
    }
  };

  const addMedication = () => {
    setVisit({
      ...visit,
      medications: [...visit.medications, { name: "", dosage: "", frequency: "", duration: "" }]
    });
  };

  const updateMed = (index: number, field: keyof Medication, value: string) => {
    const meds = [...visit.medications];
    meds[index][field] = value;
    setVisit({ ...visit, medications: meds });
  };

  const removeMed = (index: number) => {
    const meds = [...visit.medications];
    meds.splice(index, 1);
    setVisit({ ...visit, medications: meds });
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!appointment) return <div className="text-center p-20 text-slate-500">Appointment not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/doctor" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
          <ArrowLeft className="text-slate-600 dark:text-slate-400" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          Consultation Room
        </h1>
        <div className={`ml-auto px-4 py-1.5 rounded-full text-sm font-bold ${
          appointment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
          : appointment.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          {appointment.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Patient Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Patient Profile</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-2xl">
                {appointment.patient?.name?.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">{appointment.patient?.name}</h4>
                <p className="text-slate-500 font-mono text-sm">{appointment.patient?.uhid}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Token</span>
                <span className="font-bold text-slate-900 dark:text-white">{appointment.token}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Appointment Date</span>
                <span className="font-medium text-slate-900 dark:text-white">{appointment.startTime ? format(new Date(appointment.startTime), "PP") : "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500">Payment Status</span>
                <span className={`font-semibold ${appointment.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>{appointment.paymentStatus}</span>
              </div>
            </div>

            {appointment.status === 'BOOKED' && (
              <button 
                onClick={handleAcknowledge}
                disabled={saving}
                className="w-full mt-6 py-2.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition flex justify-center items-center gap-2"
              >
                <CheckCircle size={18} /> Acknowledge Arrival
              </button>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link href={`/doctor/patients/${appointment.patientId}/reports`} className="w-full py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex justify-center items-center gap-2">
                <Activity size={18} /> View Past Reports
              </Link>
            </div>
          </div>
        </div>

        {/* Clinical Notes & Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border ${appointment.status === 'BOOKED' ? 'border-amber-200 dark:border-amber-900/30 opacity-60 pointer-events-none' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clipboard className="text-blue-500" size={20} /> Clinical Notes
              </h2>
              {appointment.status === 'BOOKED' && <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">Please acknowledge patient arrival before writing clinical notes.</p>}
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Chief Complaint (Symptoms)</label>
                <textarea 
                  value={visit.chiefComplaint || ""}
                  onChange={(e) => setVisit({...visit, chiefComplaint: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 min-h-24"
                  placeholder="Patient reports fever, headache..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Diagnosis / Impression</label>
                <textarea 
                  value={visit.diagnosis || ""}
                  onChange={(e) => setVisit({...visit, diagnosis: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-transparent rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 min-h-24"
                  placeholder="Primary diagnosis..."
                />
              </div>
            </div>
          </div>

          <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border ${appointment.status === 'BOOKED' ? 'border-amber-200 dark:border-amber-900/30 opacity-60 pointer-events-none' : 'border-slate-200 dark:border-slate-800'}`}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="text-blue-500" size={20} /> Prescriptions
              </h2>
              <button 
                onClick={addMedication}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                + Add Medication
              </button>
            </div>

            <div className="p-6 space-y-4">
              {visit.medications.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">No medications added yet.</p>
              ) : (
                visit.medications.map((med, idx) => (
                  <div key={idx} className="flex flex-wrap gap-2 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Medicine Name</label>
                      <input type="text" value={med.name} onChange={e => updateMed(idx, 'name', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Paracetamol 500mg" />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dosage</label>
                      <input type="text" value={med.dosage} onChange={e => updateMed(idx, 'dosage', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm" placeholder="1 Tab" />
                    </div>
                    <div className="w-32">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Frequency</label>
                      <input type="text" value={med.frequency} onChange={e => updateMed(idx, 'frequency', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm" placeholder="1-0-1 (BID)" />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Duration</label>
                      <input type="text" value={med.duration} onChange={e => updateMed(idx, 'duration', e.target.value)} className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-sm" placeholder="5 Days" />
                    </div>
                    <button onClick={() => removeMed(idx)} className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg text-sm font-bold min-w-10">
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={handleSaveVisit} disabled={saving} className="px-6 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2">
                 {saving ? <Loader2 className="animate-spin" size={16} /> : null } Save Draft
              </button>
              <button 
                onClick={handleComplete} 
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
                disabled={appointment.status === 'COMPLETED'}
              >
                {appointment.status === 'COMPLETED' ? 'Consultation Finished' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

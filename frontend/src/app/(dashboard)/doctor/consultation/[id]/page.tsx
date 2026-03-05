"use client";

import { useState, useEffect, use } from "react";
import api from "@/lib/api";
import { Loader2, ArrowLeft, CheckCircle, Clipboard, Activity, Printer, Clock } from "lucide-react";
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

interface PastAppointment {
  id: string;
  startTime: string;
  visit: {
    chiefComplaint?: string;
    diagnosis?: string;
    medications?: Medication[];
  } | null;
  doctor: { name: string };
}

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const [appointment, setAppointment] = useState<any>(null);
  const [visit, setVisit] = useState<VisitData>({ chiefComplaint: "", diagnosis: "", medications: [] });
  const [pastVisits, setPastVisits] = useState<PastAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.id]);

  const fetchData = async () => {
    try {
      const apptRes = await api.get(`/bookings/appointments/${unwrappedParams.id}`);
      const appt = apptRes.data.data;
      setAppointment(appt);

      const visitRes = await api.get(`/bookings/appointments/${unwrappedParams.id}/visit`);
      if (visitRes.data.data) {
        setVisit({
          ...visitRes.data.data,
          medications: visitRes.data.data.medications || []
        });
      }

      // Fetch past appointments for this patient (excluding current)
      if (appt?.patientId) {
        try {
          const pastRes = await api.get(`/bookings/appointments?patientId=${appt.patientId}`);
          const all: PastAppointment[] = pastRes.data.data || [];
          setPastVisits(all.filter(a => a.id !== unwrappedParams.id && a.visit));
        } catch { /* non-fatal */ }
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
    setVisit({ ...visit, medications: [...visit.medications, { name: "", dosage: "", frequency: "", duration: "" }] });
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

  const printPrescription = () => {
    const medsHtml = visit.medications.length > 0
      ? visit.medications.map((m, i) => `
          <tr style="border-bottom:1px solid #e2e8f0">
            <td style="padding:8px 12px;font-weight:600">${i + 1}. ${m.name}</td>
            <td style="padding:8px 12px">${m.dosage}</td>
            <td style="padding:8px 12px">${m.frequency}</td>
            <td style="padding:8px 12px">${m.duration}</td>
          </tr>`).join("")
      : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8">No medications prescribed</td></tr>`;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Prescription — ${appointment.patient?.name}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #3b82f6; }
    .clinic { font-size: 22px; font-weight: 800; color: #1e40af; }
    .clinic-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .rx { font-size: 48px; font-weight: 900; color: #dbeafe; line-height: 1; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
    .info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 2px; }
    .info-value { font-size: 14px; font-weight: 600; }
    .complaint, .diagnosis { background: #f8fafc; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 8px 8px 0; font-size: 13px; margin: 8px 0 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead { background: #eff6ff; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #3b82f6; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    .sig-line { margin-top: 40px; text-align: right; }
    .sig-line hr { width: 180px; margin-left: auto; border: 0; border-top: 1px solid #0f172a; }
    .sig-label { font-size: 11px; color: #64748b; margin-top: 4px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic">HMS — Medical Clinic</div>
      <div class="clinic-sub">Prescription / Clinical Notes</div>
    </div>
    <div class="rx">℞</div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">Patient</div>
      <div class="info-value">${appointment.patient?.name || "—"}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">UHID: ${appointment.patient?.uhid || "—"}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Consulting Doctor</div>
      <div class="info-value">Dr. ${appointment.doctor?.name || "—"}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">Token: ${appointment.token}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Date</div>
      <div class="info-value">${appointment.startTime ? format(new Date(appointment.startTime), "PPP") : new Date().toLocaleDateString()}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Visit Status</div>
      <div class="info-value">${appointment.status}</div>
    </div>
  </div>

  <div class="section-title">Chief Complaint / Symptoms</div>
  <div class="complaint">${visit.chiefComplaint || "<em style='color:#94a3b8'>Not recorded</em>"}</div>

  <div class="section-title">Diagnosis / Clinical Impression</div>
  <div class="diagnosis">${visit.diagnosis || "<em style='color:#94a3b8'>Not recorded</em>"}</div>

  <div class="section-title" style="margin-top:20px">Medications Prescribed</div>
  <table>
    <thead>
      <tr>
        <th>Medicine</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>${medsHtml}</tbody>
  </table>

  <div class="sig-line">
    <hr />
    <div class="sig-label">Dr. ${appointment.doctor?.name || "—"} — Signature & Stamp</div>
  </div>

  <div class="footer">
    <div>Printed on ${new Date().toLocaleString()}</div>
    <div>This prescription is computer-generated.</div>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
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
        <div className="lg:col-span-1 space-y-4">
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

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link href={`/doctor/patients/${appointment.patientId}/reports`} className="w-full py-2.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition flex justify-center items-center gap-2">
                <Activity size={18} /> View Lab Reports
              </Link>
            </div>
          </div>

          {/* Past Visits Panel */}
          {pastVisits.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                onClick={() => setShowPast(v => !v)}
                className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                <span className="flex items-center gap-2"><Clock size={16} className="text-violet-500" /> Past Visit History <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-xs">{pastVisits.length}</span></span>
                <span className="text-slate-400 text-xs">{showPast ? "▲ hide" : "▼ show"}</span>
              </button>
              {showPast && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {pastVisits.map(pa => (
                    <div key={pa.id} className="p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Clock size={10} />{format(new Date(pa.startTime), "PP")}</p>
                      {pa.visit?.chiefComplaint && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Complaint</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{pa.visit.chiefComplaint}</p>
                        </div>
                      )}
                      {pa.visit?.diagnosis && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Diagnosis</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{pa.visit.diagnosis}</p>
                        </div>
                      )}
                      {pa.visit?.medications && Array.isArray(pa.visit.medications) && pa.visit.medications.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Medications</p>
                          <div className="space-y-0.5">
                            {(pa.visit.medications as Medication[]).map((m, i) => (
                              <p key={i} className="text-xs text-slate-600 dark:text-slate-400">• {m.name} {m.dosage} — {m.frequency} × {m.duration}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-3">
              <button
                onClick={printPrescription}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Printer size={15} /> Print Prescription
              </button>
              <div className="flex gap-3">
                <button onClick={handleSaveVisit} disabled={saving} className="px-6 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : null} Save Draft
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
    </div>
  );
}

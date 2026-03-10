"use client";

import { useState, useEffect, use } from "react";
import api from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clipboard,
  Activity,
  Printer,
  Clock,
  TestTube,
  Scan,
  HeartPulse,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type MedicineMaster = {
  id: string;
  medicineName: string;
  brand: string;
};

type PrescriptionItem = {
  medicineId: string;
  brand: string;
  drug: string;
  strength: string;
  dosageForm: string;
  dose: string;
  unit: string;
  frequency: string;
  duration: string;
  durationUnit: string;
  instructions: string;
  notes: string;
};

type LabCatalogItem = { id: string; testName: string; testCode: string };
type RadiologyCatalogItem = { id: string; testName: string; modality: "X_RAY" | "MRI" | "CT_SCAN" | "ULTRASOUND" };
type LabRequest = { id?: string; labTestId?: string; testName: string; clinicalNotes: string; status: string };
type RadiologyRequest = { id?: string; radiologyTestId?: string; modality: "X_RAY" | "MRI" | "CT_SCAN" | "ULTRASOUND"; testName: string; clinicalNotes: string; status: string };
type Vitals = { temperature: string; pulse: string; spo2: string; bpSystolic: string; bpDiastolic: string; respiratoryRate: string; nurseNotes: string };
type MedicalHistory = { id?: string; pastMedicalHistory: string; pastSurgicalHistory: string; allergies: string; familyHistory: string; socialHistory: string; medications: string; vaccinationHistory: string };
type Organization = { organizationName?: string; address?: string; contactPhone?: string; contactEmail?: string };

type VisitData = {
  id?: string;
  chiefComplaint: string;
  examination: string;
  diagnosis: string;
  diagnosisIcd10: string;
  treatmentPlan: string;
  consultationNotes: string;
  medications: PrescriptionItem[];
  labRequests: LabRequest[];
  radiologyRequests: RadiologyRequest[];
  vitals: Vitals;
};

type PastAppointment = {
  id: string;
  startTime: string;
  visit: { chiefComplaint?: string; diagnosis?: string } | null;
  doctor: { name: string };
};

const defaultVisit: VisitData = {
  chiefComplaint: "",
  examination: "",
  diagnosis: "",
  diagnosisIcd10: "",
  treatmentPlan: "",
  consultationNotes: "",
  medications: [],
  labRequests: [],
  radiologyRequests: [],
  vitals: { temperature: "", pulse: "", spo2: "", bpSystolic: "", bpDiastolic: "", respiratoryRate: "", nurseNotes: "" },
};

const defaultHistory: MedicalHistory = {
  id: undefined,
  pastMedicalHistory: "",
  pastSurgicalHistory: "",
  allergies: "",
  familyHistory: "",
  socialHistory: "",
  medications: "",
  vaccinationHistory: "",
};

const newPrescription = (): PrescriptionItem => ({
  medicineId: "",
  brand: "",
  drug: "",
  strength: "",
  dosageForm: "",
  dose: "",
  unit: "",
  frequency: "",
  duration: "",
  durationUnit: "Days",
  instructions: "",
  notes: "",
});

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();

  const [appointment, setAppointment] = useState<any>(null);
  const [visit, setVisit] = useState<VisitData>(defaultVisit);
  const [history, setHistory] = useState<MedicalHistory>(defaultHistory);
  const [pastVisits, setPastVisits] = useState<PastAppointment[]>([]);
  const [medicines, setMedicines] = useState<MedicineMaster[]>([]);
  const [labCatalog, setLabCatalog] = useState<LabCatalogItem[]>([]);
  const [radiologyCatalog, setRadiologyCatalog] = useState<RadiologyCatalogItem[]>([]);
  const [organization, setOrganization] = useState<Organization>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [openPanel, setOpenPanel] = useState<{ prescriptions: boolean; laboratory: boolean; radiology: boolean; vitals: boolean }>({
    prescriptions: true,
    laboratory: false,
    radiology: false,
    vitals: false,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.id]);

  const normalizeMedications = (list: any[]): PrescriptionItem[] => {
    if (!Array.isArray(list)) return [];
    return list.map((item) => ({
      medicineId: String(item?.medicineId || ""),
      brand: String(item?.brand || ""),
      drug: String(item?.drug || item?.name || ""),
      strength: String(item?.strength || ""),
      dosageForm: String(item?.dosageForm || ""),
      dose: String(item?.dose || item?.dosage || ""),
      unit: String(item?.unit || ""),
      frequency: String(item?.frequency || ""),
      duration: String(item?.duration || ""),
      durationUnit: String(item?.durationUnit || "Days"),
      instructions: String(item?.instructions || ""),
      notes: String(item?.notes || ""),
    }));
  };

  const fetchData = async () => {
    try {
      const [apptRes, visitRes, medsRes, labRes, radiologyRes, orgRes] = await Promise.all([
        api.get(`/bookings/appointments/${unwrappedParams.id}`),
        api.get(`/bookings/appointments/${unwrappedParams.id}/visit`),
        api.get(`/bookings/medicines`),
        api.get(`/lab/catalog`),
        api.get(`/radiology/catalog`),
        api.get(`/settings/organization`).catch(() => ({ data: { data: null } })),
      ]);
      const appt = apptRes.data.data;
      setAppointment(appt);
      setMedicines(medsRes.data.data || []);
      setLabCatalog(labRes.data.data || []);
      setRadiologyCatalog(radiologyRes.data.data || []);
      setOrganization(orgRes?.data?.data || {});

      if (visitRes.data.data) {
        const current = visitRes.data.data;
        setVisit({
          id: current.id,
          chiefComplaint: current.chiefComplaint || "",
          examination: current.examination || "",
          diagnosis: current.diagnosis || "",
          diagnosisIcd10: current.diagnosisIcd10 || "",
          treatmentPlan: current.treatmentPlan || "",
          consultationNotes: current.consultationNotes || current.notes || "",
          medications: normalizeMedications(current.medications || []),
          labRequests: Array.isArray(current.labRequests) ? current.labRequests.map((request: any) => ({
            id: request.id,
            labTestId: request.labTestId,
            testName: request.testName || "",
            clinicalNotes: request.clinicalNotes || "",
            status: request.status || "REQUESTED",
          })) : [],
          radiologyRequests: Array.isArray(current.radiologyRequests) ? current.radiologyRequests.map((request: any) => ({
            id: request.id,
            radiologyTestId: request.radiologyTestId,
            modality: request.modality || "X_RAY",
            testName: request.testName || "",
            clinicalNotes: request.clinicalNotes || "",
            status: request.status || "REQUESTED",
          })) : [],
          vitals: {
            temperature: String(current?.vitals?.temperature || ""),
            pulse: String(current?.vitals?.pulse || ""),
            spo2: String(current?.vitals?.spo2 || ""),
            bpSystolic: String(current?.vitals?.bpSystolic || ""),
            bpDiastolic: String(current?.vitals?.bpDiastolic || ""),
            respiratoryRate: String(current?.vitals?.respiratoryRate || ""),
            nurseNotes: String(current?.vitals?.nurseNotes || ""),
          },
        });
      }

      if (appt?.patientId) {
        const [historyRes, pastRes] = await Promise.all([
          api.get(`/patients/${appt.patientId}/medical-history`),
          api.get(`/bookings/appointments?patientId=${appt.patientId}`),
        ]);
        setHistory({ ...defaultHistory, ...(historyRes.data.data || {}) });
        const all: PastAppointment[] = pastRes.data.data || [];
        setPastVisits(all.filter((a) => a.id !== unwrappedParams.id && a.visit));
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
    if (!visit.chiefComplaint.trim()) {
      alert("Chief Complaint is required");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/bookings/appointments/${unwrappedParams.id}/visit`, visit);
      if (!res?.data?.data?.id) {
        throw new Error("Visit persistence failed");
      }
      alert("Consultation saved to database");
      fetchData();
    } catch {
      alert("Error saving consultation to database");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHistory = async () => {
    if (!appointment?.patientId) return;
    setSavingHistory(true);
    try {
      const res = await api.put(`/patients/${appointment.patientId}/medical-history`, history);
      if (!res?.data?.data?.id) {
        throw new Error("History persistence failed");
      }
      alert("Past history saved to database");
    } catch {
      alert("Error saving past history to database");
    } finally {
      setSavingHistory(false);
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

  const selectMedicine = (index: number, medicineId: string) => {
    const selected = medicines.find((m) => m.id === medicineId);
    if (!selected) return;
    const next = [...visit.medications];
    next[index] = {
      ...next[index],
      medicineId,
      drug: selected.medicineName,
      brand: selected.brand,
    };
    setVisit({ ...visit, medications: next });
  };

  const updatePrescription = (index: number, field: keyof PrescriptionItem, value: string) => {
    const next = [...visit.medications];
    next[index] = { ...next[index], [field]: value };
    setVisit({ ...visit, medications: next });
  };

  const selectLabTest = (index: number, labTestId: string) => {
    const selected = labCatalog.find((item) => item.id === labTestId);
    const next = [...visit.labRequests];
    next[index] = {
      ...next[index],
      labTestId,
      testName: selected?.testName || "",
    };
    setVisit({ ...visit, labRequests: next });
  };

  const selectRadiologyTest = (index: number, radiologyTestId: string) => {
    const selected = radiologyCatalog.find((item) => item.id === radiologyTestId);
    const next = [...visit.radiologyRequests];
    next[index] = {
      ...next[index],
      radiologyTestId,
      testName: selected?.testName || "",
      modality: selected?.modality || "X_RAY",
    };
    setVisit({ ...visit, radiologyRequests: next });
  };

  const printPrescription = () => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const renderOrDash = (value?: string) => value && value.trim() ? escapeHtml(value) : "<span style='color:#94a3b8'>-</span>";

    const medsHtml = visit.medications.length > 0
      ? visit.medications.map((m, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${renderOrDash(m.drug)}</td>
            <td>${renderOrDash(m.brand)}</td>
            <td>${renderOrDash(m.strength)}</td>
            <td>${renderOrDash(m.dosageForm)}</td>
            <td>${renderOrDash(`${m.dose} ${m.unit}`)}</td>
            <td>${renderOrDash(m.frequency)}</td>
            <td>${renderOrDash(`${m.duration} ${m.durationUnit}`)}</td>
            <td>${renderOrDash(m.instructions)}</td>
            <td>${renderOrDash(m.notes)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="10" style="text-align:center;color:#94a3b8">No prescriptions added</td></tr>`;

    const labsHtml = visit.labRequests.length > 0
      ? visit.labRequests.map((l, i) => `<tr><td>${i + 1}</td><td>${renderOrDash(l.testName)}</td><td>${renderOrDash(l.clinicalNotes)}</td><td>${renderOrDash(l.status)}</td></tr>`).join("")
      : `<tr><td colspan="4" style="text-align:center;color:#94a3b8">No lab requests added</td></tr>`;

    const radiologyHtml = visit.radiologyRequests.length > 0
      ? visit.radiologyRequests.map((r, i) => `<tr><td>${i + 1}</td><td>${renderOrDash(r.modality.replaceAll("_", " "))}</td><td>${renderOrDash(r.testName)}</td><td>${renderOrDash(r.clinicalNotes)}</td><td>${renderOrDash(r.status)}</td></tr>`).join("")
      : `<tr><td colspan="5" style="text-align:center;color:#94a3b8">No radiology requests added</td></tr>`;

    const orgName = organization.organizationName || "Hospital Management System";
    const win = window.open("", "_blank", "width=1100,height=900");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Clinical Note - ${escapeHtml(appointment.patient?.name || "Patient")}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
    .org-name { font-size: 22px; font-weight: 800; }
    .org-sub { font-size: 12px; color: #475569; margin-top: 3px; }
    .title { margin-top: 10px; font-size: 16px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 14px 0; }
    .cell { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; }
    .cell-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.08em; }
    .cell-value { margin-top: 4px; font-size: 13px; font-weight: 600; }
    .section { margin-top: 16px; }
    .section h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; }
    .block { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 13px; line-height: 1.5; min-height: 38px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .footer { margin-top: 16px; font-size: 11px; color: #64748b; display:flex; justify-content:space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div class="org-name">${escapeHtml(orgName)}</div>
    <div class="org-sub">${renderOrDash(organization.address || "")} | ${renderOrDash(organization.contactPhone || "")} | ${renderOrDash(organization.contactEmail || "")}</div>
    <div class="title">Clinical Consultation Note</div>
  </div>

  <div class="grid">
    <div class="cell"><div class="cell-label">Patient</div><div class="cell-value">${renderOrDash(appointment.patient?.name || "")}</div></div>
    <div class="cell"><div class="cell-label">UHID</div><div class="cell-value">${renderOrDash(appointment.patient?.uhid || "")}</div></div>
    <div class="cell"><div class="cell-label">Token</div><div class="cell-value">${renderOrDash(appointment.token || "")}</div></div>
    <div class="cell"><div class="cell-label">Consult Date</div><div class="cell-value">${appointment.startTime ? escapeHtml(format(new Date(appointment.startTime), "PPP")) : "-"}</div></div>
    <div class="cell"><div class="cell-label">Doctor</div><div class="cell-value">${renderOrDash(appointment.doctor?.name || "")}</div></div>
    <div class="cell"><div class="cell-label">Status</div><div class="cell-value">${renderOrDash(appointment.status || "")}</div></div>
    <div class="cell"><div class="cell-label">Printed At</div><div class="cell-value">${escapeHtml(new Date().toLocaleString())}</div></div>
    <div class="cell"><div class="cell-label">Visit ID</div><div class="cell-value">${renderOrDash(visit.id || "")}</div></div>
  </div>

  <div class="two-col">
    <div class="section">
      <h3>Past History</h3>
      <table>
        <tr><th>Past Medical History</th><td>${renderOrDash(history.pastMedicalHistory)}</td></tr>
        <tr><th>Past Surgical History</th><td>${renderOrDash(history.pastSurgicalHistory)}</td></tr>
        <tr><th>Allergies</th><td>${renderOrDash(history.allergies)}</td></tr>
        <tr><th>Family History</th><td>${renderOrDash(history.familyHistory)}</td></tr>
        <tr><th>Social History</th><td>${renderOrDash(history.socialHistory)}</td></tr>
        <tr><th>Medications</th><td>${renderOrDash(history.medications)}</td></tr>
        <tr><th>Vaccination History</th><td>${renderOrDash(history.vaccinationHistory)}</td></tr>
      </table>
    </div>
    <div class="section">
      <h3>Consultation</h3>
      <table>
        <tr><th>Chief Complaint</th><td>${renderOrDash(visit.chiefComplaint)}</td></tr>
        <tr><th>Examination</th><td>${renderOrDash(visit.examination)}</td></tr>
        <tr><th>Diagnosis</th><td>${renderOrDash(visit.diagnosis)}</td></tr>
        <tr><th>Diagnosis / ICD-10</th><td>${renderOrDash(visit.diagnosisIcd10)}</td></tr>
        <tr><th>Treatment Plan</th><td>${renderOrDash(visit.treatmentPlan)}</td></tr>
        <tr><th>Notes</th><td>${renderOrDash(visit.consultationNotes)}</td></tr>
      </table>
    </div>
  </div>

  <div class="section">
    <h3>Vitals</h3>
    <table>
      <tr><th>Temperature</th><th>Pulse</th><th>SpO2</th><th>BP Systolic</th><th>BP Diastolic</th><th>Respiratory Rate</th><th>Nurse Notes</th></tr>
      <tr>
        <td>${renderOrDash(visit.vitals.temperature)}</td>
        <td>${renderOrDash(visit.vitals.pulse)}</td>
        <td>${renderOrDash(visit.vitals.spo2)}</td>
        <td>${renderOrDash(visit.vitals.bpSystolic)}</td>
        <td>${renderOrDash(visit.vitals.bpDiastolic)}</td>
        <td>${renderOrDash(visit.vitals.respiratoryRate)}</td>
        <td>${renderOrDash(visit.vitals.nurseNotes)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h3>Prescriptions</h3>
    <table>
      <tr><th>#</th><th>Drug</th><th>Brand</th><th>Strength</th><th>Dosage Form</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th><th>Notes</th></tr>
      ${medsHtml}
    </table>
  </div>

  <div class="section">
    <h3>Laboratory Requests</h3>
    <table>
      <tr><th>#</th><th>Test Name</th><th>Clinical Notes</th><th>Status</th></tr>
      ${labsHtml}
    </table>
  </div>

  <div class="section">
    <h3>Radiology Requests</h3>
    <table>
      <tr><th>#</th><th>Modality</th><th>Test Name</th><th>Clinical Notes</th><th>Status</th></tr>
      ${radiologyHtml}
    </table>
  </div>

  <div class="footer">
    <div>Generated from HMS consultation module</div>
    <div>Doctor Signature: __________________</div>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!appointment) return <div className="text-center p-20 text-slate-500">Appointment not found</div>;

  const isToday = appointment.startTime ? new Date(appointment.startTime).toDateString() === new Date().toDateString() : true;
  const isPast = appointment.startTime ? new Date(appointment.startTime) < new Date() && !isToday : false;
  const isReadOnly = isPast;
  const isExistingVisit = !!visit.id;
  const isExistingHistory = !!history.id;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/doctor" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
          <ArrowLeft className="text-slate-600 dark:text-slate-400" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Consultation Room</h1>
        <div className={`ml-auto px-4 py-1.5 rounded-full text-sm font-bold ${appointment.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : appointment.status === "CHECKED_IN" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{appointment.status}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Patient Profile</h3>
            <p className="font-bold text-lg text-slate-900 dark:text-white">{appointment.patient?.name}</p>
            <p className="text-slate-500 font-mono text-sm">{appointment.patient?.uhid}</p>
            <p className="text-sm text-slate-500 mt-3">Token: <span className="font-semibold text-slate-900 dark:text-white">{appointment.token}</span></p>
            <p className="text-sm text-slate-500">Date: {appointment.startTime ? format(new Date(appointment.startTime), "PP") : "N/A"}</p>

            {appointment.status === "BOOKED" && (
              <button onClick={handleAcknowledge} disabled={saving || !isToday} className="w-full mt-4 py-2.5 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 disabled:opacity-50 transition flex justify-center items-center gap-2">
                <CheckCircle size={18} /> {isToday ? "Acknowledge Arrival" : "Acknowledge (Only Today)"}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Past History</h3>
            <textarea value={history.pastMedicalHistory} onChange={(e) => setHistory({ ...history, pastMedicalHistory: e.target.value })} placeholder="Past Medical History" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
            <textarea value={history.pastSurgicalHistory} onChange={(e) => setHistory({ ...history, pastSurgicalHistory: e.target.value })} placeholder="Past Surgical History" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
            <textarea value={history.allergies} onChange={(e) => setHistory({ ...history, allergies: e.target.value })} placeholder="Allergies" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
            <textarea value={history.familyHistory} onChange={(e) => setHistory({ ...history, familyHistory: e.target.value })} placeholder="Family History" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
            <textarea value={history.socialHistory} onChange={(e) => setHistory({ ...history, socialHistory: e.target.value })} placeholder="Social History" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
            <textarea value={history.medications} onChange={(e) => setHistory({ ...history, medications: e.target.value })} placeholder="Medications" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
            <textarea value={history.vaccinationHistory} onChange={(e) => setHistory({ ...history, vaccinationHistory: e.target.value })} placeholder="Vaccination History" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
            {!isReadOnly && <button onClick={handleSaveHistory} disabled={savingHistory} className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100">{savingHistory ? "Saving..." : isExistingHistory ? "Save Edited History" : "Save History"}</button>}
          </div>

          {pastVisits.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button onClick={() => setShowPast((v) => !v)} className="w-full flex items-center justify-between p-4 text-sm font-bold text-slate-700">
                <span className="flex items-center gap-2"><Clock size={16} /> Past Visits ({pastVisits.length})</span>
                {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showPast && (
                <div className="divide-y max-h-60 overflow-y-auto">
                  {pastVisits.map((pa) => (
                    <div key={pa.id} className="p-3 text-sm">
                      <p className="text-xs text-slate-500">{format(new Date(pa.startTime), "PP")} - Dr. {pa.doctor?.name}</p>
                      <p>{pa.visit?.chiefComplaint || "No complaint"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`space-y-4 ${appointment.status === "BOOKED" ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Clipboard size={18} /> Consultation</h2>
            <textarea value={visit.chiefComplaint} onChange={(e) => setVisit({ ...visit, chiefComplaint: e.target.value })} placeholder="Chief Complaint" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={3} disabled={isReadOnly} />
            <textarea value={visit.examination} onChange={(e) => setVisit({ ...visit, examination: e.target.value })} placeholder="Examination" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={3} disabled={isReadOnly} />
            <textarea value={visit.diagnosis} onChange={(e) => setVisit({ ...visit, diagnosis: e.target.value })} placeholder="Diagnosis" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={3} disabled={isReadOnly} />
            <input value={visit.diagnosisIcd10} onChange={(e) => setVisit({ ...visit, diagnosisIcd10: e.target.value })} placeholder="Diagnosis / ICD-10" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly} />
            <textarea value={visit.treatmentPlan} onChange={(e) => setVisit({ ...visit, treatmentPlan: e.target.value })} placeholder="Treatment Plan" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={3} disabled={isReadOnly} />
            <textarea value={visit.consultationNotes} onChange={(e) => setVisit({ ...visit, consultationNotes: e.target.value })} placeholder="Notes" className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={3} disabled={isReadOnly} />
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={printPrescription} className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-semibold"><Printer size={14} /> Print</button>
            {!isReadOnly && (
              <>
                <button onClick={handleSaveVisit} disabled={saving} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100">{saving ? "Saving..." : isExistingVisit ? "Save Edited Consultation" : "Save Consultation"}</button>
                <button onClick={handleComplete} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">Mark as Complete</button>
              </>
            )}
          </div>
        </div>
        <div className={`space-y-4 ${appointment.status === "BOOKED" ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setOpenPanel({ ...openPanel, prescriptions: !openPanel.prescriptions })} className="w-full p-4 flex items-center justify-between font-semibold">
              <span className="flex items-center gap-2"><Activity size={16} /> Prescriptions</span>
              {openPanel.prescriptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {openPanel.prescriptions && (
              <div className="p-4 space-y-3">
                {!isReadOnly && <button onClick={() => setVisit({ ...visit, medications: [...visit.medications, newPrescription()] })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">+ Add Prescription</button>}
                {visit.medications.map((med, idx) => (
                  <div key={idx} className="space-y-2 p-3 border rounded-xl">
                    <select value={med.medicineId} onChange={(e) => selectMedicine(idx, e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly}>
                      <option value="">Select Medicine</option>
                      {medicines.map((m) => <option key={m.id} value={m.id}>{m.medicineName} ({m.brand})</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={med.brand} readOnly className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Brand" />
                      <input value={med.drug} readOnly className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white" placeholder="Drug" />
                      <input value={med.strength} onChange={(e) => updatePrescription(idx, "strength", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Strength" disabled={isReadOnly} />
                      <input value={med.dosageForm} onChange={(e) => updatePrescription(idx, "dosageForm", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Dosage Form" disabled={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={med.dose} onChange={(e) => updatePrescription(idx, "dose", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Dose" disabled={isReadOnly} />
                      <input value={med.unit} onChange={(e) => updatePrescription(idx, "unit", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Unit" disabled={isReadOnly} />
                      <input value={med.frequency} onChange={(e) => updatePrescription(idx, "frequency", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Frequency" disabled={isReadOnly} />
                      <input value={med.duration} onChange={(e) => updatePrescription(idx, "duration", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Duration" disabled={isReadOnly} />
                      <select value={med.durationUnit} onChange={(e) => updatePrescription(idx, "durationUnit", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly}><option>Days</option><option>Weeks</option><option>Months</option></select>
                      <input value={med.instructions} onChange={(e) => updatePrescription(idx, "instructions", e.target.value)} className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Instructions" disabled={isReadOnly} />
                    </div>
                    <textarea value={med.notes} onChange={(e) => updatePrescription(idx, "notes", e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} placeholder="Notes" disabled={isReadOnly} />
                    {!isReadOnly && <button onClick={() => setVisit({ ...visit, medications: visit.medications.filter((_, i) => i !== idx) })} className="text-red-600 text-sm font-semibold">Remove</button>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setOpenPanel({ ...openPanel, laboratory: !openPanel.laboratory })} className="w-full p-4 flex items-center justify-between font-semibold"><span className="flex items-center gap-2"><TestTube size={16} /> Laboratory</span>{openPanel.laboratory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            {openPanel.laboratory && (
              <div className="p-4 space-y-3">
                {!isReadOnly && (
                  <button onClick={() => setVisit({ ...visit, labRequests: [...visit.labRequests, { labTestId: "", testName: "", clinicalNotes: "", status: "REQUESTED" }] })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
                    + Add Request
                  </button>
                )}
                {visit.labRequests.length === 0 ? (
                  <p className="text-sm text-slate-500">No lab requests added.</p>
                ) : (
                  visit.labRequests.map((req, idx) => (
                    <div key={idx} className="p-3 border rounded-xl space-y-2">
                      <select
                        value={req.labTestId || ""}
                        onChange={(e) => selectLabTest(idx, e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        disabled={isReadOnly}
                      >
                        <option value="">Select Lab Test</option>
                        {labCatalog.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.testName} ({item.testCode})
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={req.clinicalNotes}
                        onChange={(e) => {
                          const next = [...visit.labRequests];
                          next[idx] = { ...next[idx], clinicalNotes: e.target.value };
                          setVisit({ ...visit, labRequests: next });
                        }}
                        placeholder="Clinical Notes"
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        rows={2}
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && <button onClick={() => setVisit({ ...visit, labRequests: visit.labRequests.filter((_, i) => i !== idx) })} className="text-red-600 text-sm font-semibold">Remove</button>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setOpenPanel({ ...openPanel, radiology: !openPanel.radiology })} className="w-full p-4 flex items-center justify-between font-semibold"><span className="flex items-center gap-2"><Scan size={16} /> Radiology</span>{openPanel.radiology ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            {openPanel.radiology && (
              <div className="p-4 space-y-3">
                {!isReadOnly && (
                  <button onClick={() => setVisit({ ...visit, radiologyRequests: [...visit.radiologyRequests, { radiologyTestId: "", modality: "X_RAY", testName: "", clinicalNotes: "", status: "REQUESTED" }] })} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
                    + Add Request
                  </button>
                )}
                {visit.radiologyRequests.length === 0 ? (
                  <p className="text-sm text-slate-500">No radiology requests added.</p>
                ) : (
                  visit.radiologyRequests.map((req, idx) => (
                    <div key={idx} className="p-3 border rounded-xl space-y-2">
                      <select
                        value={req.radiologyTestId || ""}
                        onChange={(e) => selectRadiologyTest(idx, e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        disabled={isReadOnly}
                      >
                        <option value="">Select Radiology Test</option>
                        {radiologyCatalog.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.testName} ({item.modality.replaceAll("_", " ")})
                          </option>
                        ))}
                      </select>
                      <input
                        value={req.modality.replaceAll("_", " ")}
                        readOnly
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <textarea
                        value={req.clinicalNotes}
                        onChange={(e) => {
                          const next = [...visit.radiologyRequests];
                          next[idx] = { ...next[idx], clinicalNotes: e.target.value };
                          setVisit({ ...visit, radiologyRequests: next });
                        }}
                        placeholder="Clinical Notes"
                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        rows={2}
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && <button onClick={() => setVisit({ ...visit, radiologyRequests: visit.radiologyRequests.filter((_, i) => i !== idx) })} className="text-red-600 text-sm font-semibold">Remove</button>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button onClick={() => setOpenPanel({ ...openPanel, vitals: !openPanel.vitals })} className="w-full p-4 flex items-center justify-between font-semibold"><span className="flex items-center gap-2"><HeartPulse size={16} /> Vitals</span>{openPanel.vitals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            {openPanel.vitals && (
              <div className="p-4 grid grid-cols-2 gap-2">
                <input value={visit.vitals.temperature} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, temperature: e.target.value } })} placeholder="Temperature" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly} />
                <input value={visit.vitals.pulse} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, pulse: e.target.value } })} placeholder="Pulse" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly} />
                <input value={visit.vitals.spo2} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, spo2: e.target.value } })} placeholder="SpO2" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly} />
                <input value={visit.vitals.respiratoryRate} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, respiratoryRate: e.target.value } })} placeholder="Respiratory Rate" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly} />
                <input value={visit.vitals.bpSystolic} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, bpSystolic: e.target.value } })} placeholder="BP Systolic" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly} />
                <input value={visit.vitals.bpDiastolic} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, bpDiastolic: e.target.value } })} placeholder="BP Diastolic" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" disabled={isReadOnly} />
                <textarea value={visit.vitals.nurseNotes} onChange={(e) => setVisit({ ...visit, vitals: { ...visit.vitals, nurseNotes: e.target.value } })} placeholder="Nurse Notes" className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm col-span-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" rows={2} disabled={isReadOnly} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

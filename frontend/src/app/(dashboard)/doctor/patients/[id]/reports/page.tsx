"use client";

import { useEffect, useState, useRef, use } from "react";
import api from "@/lib/api";
import { FileText, Download, Loader2, Plus, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Report {
  id: string;
  reportType: string;
  description: string;
  fileUrl: string;
  uploadedDate: string;
}

export default function DoctorPatientReports({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const patientId = unwrappedParams.id;
  
  const [reports, setReports] = useState<Report[]>([]);
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [formData, setFormData] = useState({ reportType: 'Lab Result', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReports();
    fetchPatientName();
  }, [patientId]);

  const fetchPatientName = async () => {
    try {
      const res = await api.get(`/patients/${patientId}`);
      setPatientName(res.data.data.name);
    } catch {
      console.log("Failed to fetch patient name");
    }
  };

  const fetchReports = async () => {
    try {
      const repRes = await api.get(`/medical-reports/patient/${patientId}`);
      setReports(repRes.data.data || []);
    } catch {
      alert("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) {
      alert("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const file = fileInputRef.current.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const uploadRes = await api.post("/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const fileUrl = uploadRes.data.url;

      await api.post("/medical-reports", {
        patientId,
        reportType: formData.reportType,
        description: formData.description,
        fileUrl
      });

      alert("Report uploaded successfully!");
      setShowUpload(false);
      setFormData({ reportType: 'Lab Result', description: '' });
      fetchReports();
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/doctor`} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">
          <ArrowLeft className="text-slate-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Medical Reports
          </h1>
          {patientName && <p className="text-slate-500 font-medium">Patient: {patientName}</p>}
        </div>
        
        <button 
          onClick={() => setShowUpload(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition font-medium"
        >
          <Plus size={18} /> Upload Report
        </button>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-slate-900 dark:text-white">Upload New Report</h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Document Type</label>
                <select 
                  value={formData.reportType}
                  onChange={(e) => setFormData({...formData, reportType: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="Lab Result">Lab Result</option>
                  <option value="X-Ray Scan">X-Ray / Scan</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Description / Notes</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="e.g. Detailed blood panel results"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">File</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : null} Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
           <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : reports.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {reports.map((report) => (
              <div key={report.id} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {report.reportType} 
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5">{report.description || "No description provided"}</p>
                    <p className="text-xs text-slate-400 mt-1">{format(new Date(report.uploadedDate), "PPP")}</p>
                  </div>
                </div>
                <a 
                  href={report.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition flex items-center gap-2 text-sm font-medium"
                >
                  <Download size={16} /> Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <FileText className="mx-auto mb-3 opacity-20" size={48} />
            <p>No medical reports uploaded for this patient yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

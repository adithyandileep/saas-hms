"use client";

import { useState } from "react";
import api from "@/lib/api";
import { CreditCard, X, CheckCircle2, Loader2 } from "lucide-react";

interface Appointment {
  id: string;
  token: string;
  pendingAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  doctor?: { name: string };
}

export default function PaymentModal({
  appointment, onClose, onSuccess
}: {
  appointment: Appointment; onClose: () => void; onSuccess: () => void;
}) {
  const [mode, setMode] = useState("CASH");
  const [processing, setProcessing] = useState(false);
  const [err, setErr] = useState("");

  const pending = appointment.pendingAmount ?? Math.max(0, appointment.totalAmount - (appointment.paidAmount ?? 0));

  async function pay() {
    setProcessing(true); setErr("");
    try {
      await api.post(`/bookings/appointments/${appointment.id}/pay`, { amount: pending, paymentMode: mode });
      onSuccess();
    } catch (e: unknown) {
      const errObj = e as { response?: { data?: { message?: string } } };
      setErr(errObj.response?.data?.message || "Payment failed");
    } finally { setProcessing(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-200 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard size={18} className="text-blue-500" /> Process Payment</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Consultation · Dr. {appointment.doctor?.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono mb-2">Token: {appointment.token}</p>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400 text-sm">Amount Due</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">₹{pending}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[["CASH", "Cash"], ["UPI", "UPI"], ["CREDIT", "Card"]].map(([val, label]) => (
                <button key={val} onClick={() => setMode(val)}
                  className={`py-2 rounded-xl text-sm font-medium border-2 transition ${mode === val ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
        </div>
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          <button onClick={pay} disabled={processing}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {processing ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />}
            {processing ? "Processing..." : `Pay ₹${pending}`}
          </button>
        </div>
      </div>
    </div>
  );
}

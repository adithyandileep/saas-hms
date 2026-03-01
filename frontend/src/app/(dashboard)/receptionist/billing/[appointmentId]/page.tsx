"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Loader2, ArrowLeft, CreditCard, CheckCircle } from "lucide-react";

interface BillingData {
  id: string; token: string; startTime: string;
  totalAmount: number; paidAmount: number; pendingAmount: number;
  paymentStatus: string; status: string;
  patient: { name: string; uhid: string; contactNo?: string };
  doctor: { name: string; department: string };
}

export default function BillingPage() {
  const { appointmentId } = useParams() as { appointmentId: string };
  const router = useRouter();
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("CASH");
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get(`/bookings/appointments/${appointmentId}`)
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  async function handlePay() {
    if (!payAmount || isNaN(+payAmount) || +payAmount <= 0) { setMessage("Enter a valid amount"); return; }
    setPaying(true); setMessage("");
    try {
      await api.post(`/bookings/appointments/${appointmentId}/pay`, {
        amount: +payAmount, paymentMode: payMode
      });
      const res = await api.get(`/bookings/appointments/${appointmentId}`);
      setData(res.data.data);
      setPayAmount(""); setMessage("✅ Payment recorded successfully");
    } catch (err: any) { setMessage(`❌ ${err.response?.data?.message || "Payment failed"}`); }
    finally { setPaying(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!data) return <div className="text-center py-20 text-slate-500">Appointment not found</div>;

  const isPaid = data.paymentStatus === "PAID";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"><ArrowLeft size={18} /></button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <CreditCard className="text-blue-500" /> Billing
        </h1>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith("✅") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>{message}</div>
      )}

      {/* Patient & Doctor Info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Patient</p>
            <p className="font-semibold text-slate-900 dark:text-white">{data.patient?.name}</p>
            <p className="text-sm font-mono text-blue-600 dark:text-blue-400">{data.patient?.uhid}</p>
            <p className="text-sm text-slate-500">{data.patient?.contactNo}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Doctor</p>
            <p className="font-semibold text-slate-900 dark:text-white">Dr. {data.doctor?.name}</p>
            <p className="text-sm text-slate-500">{data.doctor?.department}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Appointment</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{new Date(data.startTime).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "2-digit" })}</p>
            <p className="text-sm font-mono text-slate-500">Token: {data.token}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${data.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{data.status}</span>
          </div>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400">Total Amount</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">₹{data.totalAmount}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400">Paid Amount</span>
            <span className="text-xl font-bold text-emerald-600">₹{data.paidAmount}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-600 dark:text-slate-400">Pending Amount</span>
            <span className={`text-xl font-bold ${data.pendingAmount > 0 ? "text-red-500" : "text-emerald-600"}`}>₹{data.pendingAmount}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Payment Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : data.paymentStatus === "PARTIAL" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>{data.paymentStatus}</span>
          </div>
        </div>
      </div>

      {/* Payment action */}
      {isPaid ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800 flex items-center gap-4">
          <CheckCircle className="text-emerald-500" size={32} />
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Payment Complete</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500">All dues have been cleared.</p>
          </div>
        </div>
      ) : data.pendingAmount > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Collect Payment</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder={`Max ₹${data.pendingAmount}`}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
              <select value={payMode} onChange={e => setPayMode(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CREDIT">Card</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPayAmount(String(data.pendingAmount))} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">Pay Full ₹{data.pendingAmount}</button>
            <button onClick={handlePay} disabled={paying} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2">
              {paying && <Loader2 className="animate-spin" size={16} />} Record Payment
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

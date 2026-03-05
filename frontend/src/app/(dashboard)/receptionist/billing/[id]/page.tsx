"use client";

import { useState, useEffect, use } from "react";
import api from "@/lib/api";
import { Loader2, Download, CreditCard, CheckCircle, Clock } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// jspdf-autotable extends jsPDF's prototype, adding lastAutoTable.
// We declare it here to avoid TS 'any' type errors.
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}


function deptStr(dept: string | { id?: string; name?: string; description?: string } | undefined | null): string {
  if (!dept) return "";
  return typeof dept === "object" ? dept.name || "" : dept;
}

interface VisitInfo {
  id: string;
  chiefComplaint: string | null;
  diagnosis: string | null;
  medications: unknown;
}

interface PaymentInfo {
  id: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  status: string;
  transactionId: string | null;
}

interface AppointmentDetails {
  id: string;
  token: string;
  startTime: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: string;
  status: string;
  patient: { name: string; uhid: string; contactNo: string; address: string };
  doctor: { name: string; department: string | { id?: string; name?: string; description?: string }; consultationFee?: number };
  visit: VisitInfo | null;
  payments: PaymentInfo[];
}

export default function ReceptionistBillingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [data, setData] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "STRIPE">("CASH");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [unwrappedParams.id]);

  const fetchDetails = async () => {
    try {
      // Re-using the get appointment by ID endpoint, hopefully it includes payments
      const res = await api.get(`/bookings/appointments/${unwrappedParams.id}`);
      setData(res.data.data);
      if (res.data.data) {
          setPayAmount(res.data.data.pendingAmount);
      }
    } catch {
      alert("Failed to load billing info");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (payAmount <= 0 || payAmount > (data?.pendingAmount || 0)) {
        alert("Invalid amount"); return;
    }
    setProcessing(true);
    try {
      await api.post(`/bookings/appointments/${unwrappedParams.id}/pay`, {
        amount: payAmount,
        paymentMode
      });
      fetchDetails();
      alert("Payment processed");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const generatePDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Enterprise HMS", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("123 Healthcare Ave, Medical District", 14, 28);
    doc.text("Phone: +1 234 567 8900", 14, 33);

    // INVOICE text right aligned
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("INVOICE", pageWidth - 14, 25, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: INV-${data.token}`, pageWidth - 14, 32, { align: "right" });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 37, { align: "right" });

    doc.setLineWidth(0.5);
    doc.line(14, 45, pageWidth - 14, 45);

    // Patient & Doctor Info
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient: ${data.patient.name}`, 14, 62);
    doc.text(`UHID: ${data.patient.uhid}`, 14, 67);
    if(data.patient.contactNo) doc.text(`Contact: ${data.patient.contactNo}`, 14, 72);

    doc.setFont("helvetica", "bold");
    doc.text("Service By:", pageWidth / 2, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Dr. ${data.doctor.name}`, pageWidth / 2, 62);
    doc.text(`Department: ${deptStr(data.doctor.department)}`, pageWidth / 2, 67);
    doc.text(`Doc Token: ${data.token}`, pageWidth / 2, 72);

    // Items table
    autoTable(doc, {
        startY: 85,
        headStyles: { fillColor: [59, 130, 246] },
        head: [["Description", "Amount"]],
        body: [
            ["Doctor Consultation Fee", `Rs. ${(data.doctor.consultationFee ?? data.totalAmount).toFixed(2)}`],
            ["Registration & Other Charges", `Rs. ${(data.totalAmount - (data.doctor.consultationFee ?? data.totalAmount)).toFixed(2)}`],
        ],
        foot: [
            ["Sub Total", `Rs. ${data.totalAmount.toFixed(2)}`],
            ["Tax (0%)", "Rs. 0.00"],
            ["Total Payable", `Rs. ${data.totalAmount.toFixed(2)}`]
        ],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
        theme: "striped"
    });

    const finalY = doc.lastAutoTable?.finalY ?? 120;

    // Payment History Table
    if (data.payments && data.payments.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Payment History:", 14, finalY);
        autoTable(doc, {
            startY: finalY + 5,
            head: [["Date", "Mode", "Txn ID", "Amount"]],
            body: data.payments.map(p => [
                new Date(p.paymentDate).toLocaleDateString(),
                p.paymentMode,
                p.transactionId || "N/A",
                `Rs. ${p.amount.toFixed(2)}`
            ]),
            theme: "plain",
            headStyles: { lineWidth: { bottom: 0.1 }, lineColor: [200, 200, 200] },
            bodyStyles: { lineWidth: { bottom: 0.1 }, lineColor: [240, 240, 240] }
        });
    }

    const payY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 15 : finalY + 15;

    // Summary block
    doc.setFont("helvetica", "normal");
    doc.text("Total Paid:", pageWidth - 60, payY);
    doc.text(`Rs. ${data.paidAmount.toFixed(2)}`, pageWidth - 14, payY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Balance Due:", pageWidth - 60, payY + 8);
    doc.text(`Rs. ${data.pendingAmount.toFixed(2)}`, pageWidth - 14, payY + 8, { align: "right" });

    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    const textStr = "Thank you for choosing Enterprise HMS. For billing queries contact billing@enterprisehms.com";
    doc.text(textStr, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    doc.save(`Invoice_${data.token}_${data.patient.uhid}.pdf`);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
  if (!data) return <div className="text-center p-20 text-slate-500">Record not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          Invoice #{data.token}
        </h1>
        <button onClick={generatePDF} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition">
          <Download size={16} /> Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Invoice Summary Left */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Patient Details</p>
                        <p className="font-bold text-slate-900 dark:text-white text-lg">{data.patient.name}</p>
                        <p className="text-sm font-mono text-slate-500">{data.patient.uhid}</p>
                        {data.patient.contactNo && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{data.patient.contactNo}</p>}
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Service Details</p>
                        <p className="font-bold text-slate-900 dark:text-white text-lg">Dr. {data.doctor.name}</p>
                        <p className="text-sm text-slate-500">{deptStr(data.doctor.department)}</p>
                        <p className="text-sm mt-1">Date: <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(data.startTime).toLocaleDateString()}</span></p>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="pb-3 text-sm font-semibold text-slate-500">Description</th>
                            <th className="pb-3 text-sm font-semibold text-slate-500 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        <tr>
                            <td className="py-4 text-sm font-medium text-slate-900 dark:text-white">Doctor Consultation</td>
                            <td className="py-4 text-sm font-medium text-slate-900 dark:text-white text-right">₹{(data.doctor.consultationFee ?? data.totalAmount).toFixed(2)}</td>
                        </tr>
                        {data.totalAmount > (data.doctor.consultationFee ?? data.totalAmount) && (
                        <tr>
                            <td className="py-4 text-sm font-medium text-slate-900 dark:text-white">Registration & Overheads</td>
                            <td className="py-4 text-sm font-medium text-slate-900 dark:text-white text-right">₹{(data.totalAmount - (data.doctor.consultationFee ?? data.totalAmount)).toFixed(2)}</td>
                        </tr>
                        )}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 dark:border-slate-700">
                        <tr>
                            <td className="py-4 text-sm font-bold text-slate-900 dark:text-white text-right">Total:</td>
                            <td className="py-4 text-lg font-bold text-blue-600 dark:text-blue-400 text-right">₹{data.totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {data.payments && data.payments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Payment History</h3>
                <div className="space-y-4">
                    {data.payments.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                                    <CheckCircle size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.paymentMode}</p>
                                    <p className="text-xs font-mono text-slate-500">{new Date(p.paymentDate).toLocaleString()}</p>
                                    {p.transactionId && <p className="text-[10px] font-mono text-slate-400">Txn: {p.transactionId}</p>}
                                </div>
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-white">₹{p.amount.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>
            )}
        </div>

        {/* Payment Processing Sidebar */}
        <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${data.paymentStatus === 'PAID' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'}`}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Payment Status</h3>
                <div className="flex items-end justify-between">
                    <div>
                        <p className={`text-2xl font-black ${data.paymentStatus === 'PAID' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {data.paymentStatus}
                        </p>
                    </div>
                    {(data.paymentStatus === 'PENDING' || data.paymentStatus === 'PARTIAL') && (
                        <Clock className="text-red-400 opacity-50 mb-1" size={24} />
                    )}
                    {data.paymentStatus === 'PAID' && (
                        <CheckCircle className="text-emerald-400 opacity-50 mb-1" size={24} />
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Total Billed:</span>
                        <span className="font-medium">₹{data.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Total Paid:</span>
                        <span className="font-medium text-emerald-600">₹{data.paidAmount}</span>
                    </div>
                    {(data.paymentStatus === 'PENDING' || data.paymentStatus === 'PARTIAL') && (
                    <div className="flex justify-between text-sm pt-2">
                        <span className="font-semibold text-slate-900 dark:text-white">Balance Due:</span>
                        <span className="font-bold text-red-600">₹{data.pendingAmount}</span>
                    </div>
                    )}
                </div>
            </div>

            {(data.paymentStatus === 'PENDING' || data.paymentStatus === 'PARTIAL') && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-blue-500" /> Process Payment
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Payment Mode</label>
                        <select 
                            value={paymentMode} 
                            onChange={(e) => setPaymentMode(e.target.value as "CASH" | "UPI" | "STRIPE")}
                            className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="STRIPE">Stripe / Credit Card</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">Amount to Pay (₹)</label>
                        <input 
                            type="number" 
                            min="1"
                            max={data.pendingAmount}
                            value={payAmount}
                            onChange={(e) => setPayAmount(Number(e.target.value))}
                            className="w-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button 
                        onClick={handlePayment}
                        disabled={processing || payAmount <= 0}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2 mt-2"
                    >
                        {processing && <Loader2 className="animate-spin" size={16} />} 
                        Pay ₹{payAmount}
                    </button>
                </div>
            </div>
            )}
        </div>

      </div>
    </div>
  );
}

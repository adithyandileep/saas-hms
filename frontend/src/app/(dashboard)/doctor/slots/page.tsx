"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const EnvAPI = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const bulkSlotSchema = z.object({
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  startTimeStr: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format HH:mm"),
  endTimeStr: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Format HH:mm"),
  slotDurationMinutes: z.number().min(5).max(120),
  breakDurationMinutes: z.number().min(0).max(60),
  // capacity removed; will default to 1 on server
});

export default function DoctorSlotsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const form = useForm<z.infer<typeof bulkSlotSchema>>({
    resolver: zodResolver(bulkSlotSchema),
    defaultValues: {
      startDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
      endDate: new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      startTimeStr: "09:00",
      endTimeStr: "17:00",
      slotDurationMinutes: 15,
      breakDurationMinutes: 0,
      // maxCapacity omitted
    },
  });
  async function onSubmit(values: z.infer<typeof bulkSlotSchema>) {
    if (!user?.id) return;

    try {
      setLoading(true);
      setMessage(null);

      const payload = {
        ...values,
        doctorId: user.id,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      };

      const res = await axios.post(`${EnvAPI}/bookings/slots/bulk`, payload, {
        withCredentials: true,
      });

      setMessage({ type: "success", text: res.data.message });
    } catch (error: any) {
      console.error(error);
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to generate slots." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Schedule</h1>
          <p className="text-slate-500 mt-2">Generate available slots for your patients</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm flex items-center gap-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
          }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Bulk Slot Generation</h2>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Date Range */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Date Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}
                    {...form.register("startDate")}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                  />
                  {form.formState.errors.startDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">End Date</label>
                  <input
                    type="date"
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]}
                    {...form.register("endDate")}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                  />
                  {form.formState.errors.endDate && <p className="text-red-500 text-xs mt-1">{form.formState.errors.endDate.message}</p>}
                </div>
              </div>
            </div>

            {/* Time Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Daily Time Configuration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Shift Start (HH:mm)</label>
                  <input
                    type="time"
                    {...form.register("startTimeStr")}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Shift End (HH:mm)</label>
                  <input
                    type="time"
                    {...form.register("endTimeStr")}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                  />
                </div>
              </div>
            </div>

            {/* Slot Details */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Slot Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    {...form.register("slotDurationMinutes", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Break Between (Minutes)</label>
                  <input
                    type="number"
                    {...form.register("breakDurationMinutes", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                  />
                </div>
                {/* capacity field removed */}
              </div>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {loading ? "Generating..." : "Generate Slots"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

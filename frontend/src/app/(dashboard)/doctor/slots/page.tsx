"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const EnvAPI = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DoctorSlotsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getLocalDate = () => {
    const offset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().split("T")[0];
  };

  const [generationMode, setGenerationMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [configStartDate, setConfigStartDate] = useState(getLocalDate());
  const [selectedMonth, setSelectedMonth] = useState(getLocalDate().slice(0, 7));
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);

  const [slotStartTime, setSlotStartTime] = useState("09:00");
  const [slotEndTime, setSlotEndTime] = useState("17:00");
  const [slotInterval, setSlotInterval] = useState(15);
  const [breakDuration, setBreakDuration] = useState(0);

  async function generateSlots(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    if (!slotStartTime || !slotEndTime || !slotInterval) {
      setMessage({ type: "error", text: "Set time and interval" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      let payload: any = {
        doctorId: user.id,
        startTimeStr: slotStartTime,
        endTimeStr: slotEndTime,
        slotDurationMinutes: slotInterval,
        breakDurationMinutes: breakDuration,
        maxCapacity: 1
      };

      if (generationMode === "daily") {
        if (!configStartDate) {
          setMessage({ type: "error", text: "Select a date" });
          setLoading(false);
          return;
        }
        payload.startDate = new Date(`${configStartDate}T00:00:00`).toISOString();
        payload.endDate = new Date(`${configStartDate}T00:00:00`).toISOString();
      } else if (generationMode === "weekly") {
        if (!selectedMonth || selectedDaysOfWeek.length === 0) {
          setMessage({ type: "error", text: "Select month and days of week" });
          setLoading(false);
          return;
        }
        const [year, month] = selectedMonth.split('-');
        payload.startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
        payload.endDate = new Date(Number(year), Number(month), 0).toISOString();
        payload.daysOfWeek = selectedDaysOfWeek;
      } else if (generationMode === "monthly") {
        if (!selectedMonth || selectedDates.length === 0) {
          setMessage({ type: "error", text: "Select month and specific dates" });
          setLoading(false);
          return;
        }
        const [year, month] = selectedMonth.split('-');
        payload.specificDates = selectedDates.map(d => new Date(Number(year), Number(month) - 1, d, 12, 0, 0).toISOString());
      }

      const res = await axios.post(`${EnvAPI}/bookings/slots/bulk`, payload, {
        withCredentials: true,
      });

      setMessage({ type: "success", text: res.data.message || "Slots generated successfully." });
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
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Slot Generation</h2>
          </div>
        </div>

        <form onSubmit={generateSlots} className="p-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
            <button type="button" onClick={() => setGenerationMode("daily")} className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition ${generationMode === "daily" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Daily</button>
            <button type="button" onClick={() => setGenerationMode("weekly")} className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition ${generationMode === "weekly" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Weekly</button>
            <button type="button" onClick={() => setGenerationMode("monthly")} className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition ${generationMode === "monthly" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Monthly</button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              {/* Daily Mode */}
              {generationMode === "daily" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input type="date" value={configStartDate} onChange={e => setConfigStartDate(e.target.value)} min={getLocalDate()} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" />
                  </div>
                </div>
              )}

              {/* Weekly Mode */}
              {generationMode === "weekly" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Month</label>
                      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} min={getLocalDate().slice(0, 7)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Days of Week</label>
                    <div className="flex flex-wrap gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                        <label key={day} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-sm font-medium transition ${selectedDaysOfWeek.includes(idx) ? "bg-blue-50 border-blue-500 text-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                          <input type="checkbox" className="hidden" checked={selectedDaysOfWeek.includes(idx)}
                            onChange={e => {
                              if (e.target.checked) setSelectedDaysOfWeek([...selectedDaysOfWeek, idx]);
                              else setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== idx));
                            }}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Mode */}
              {generationMode === "monthly" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Month</label>
                      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} min={getLocalDate().slice(0, 7)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Dates</label>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]), 0).getDate() }, (_, i) => i + 1).map(date => (
                        <button key={date} type="button" onClick={() => {
                          if (selectedDates.includes(date)) setSelectedDates(selectedDates.filter(d => d !== date));
                          else setSelectedDates([...selectedDates, date]);
                        }} className={`py-1.5 text-sm rounded-lg border transition ${selectedDates.includes(date) ? "bg-blue-50 border-blue-500 text-blue-700 font-bold" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                          {date}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Configuration */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Time Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift Start</label>
                  <input type="time" value={slotStartTime} onChange={e => setSlotStartTime(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift End</label>
                  <input type="time" value={slotEndTime} onChange={e => setSlotEndTime(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Min)</label>
                  <input type="number" min={5} value={slotInterval} onChange={e => setSlotInterval(+e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Break (Min)</label>
                  <input type="number" min={0} value={breakDuration} onChange={e => setBreakDuration(+e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" />
                </div>
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

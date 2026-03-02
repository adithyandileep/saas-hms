"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { Loader2, Calendar, Search, Settings } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  // backend sometimes returns a department object; we'll accept either string or object
  department: string | { id: string; name: string; description?: string };
  consultationFee: number;
}
interface Patient { id: string; uhid: string; name: string; contactNo?: string | null; }
interface Slot { id: string; startTime: string; endTime: string; maxCapacity: number; bookedCount: number; isAvailable: boolean; }

export default function ReceptionistAppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [slotModal, setSlotModal] = useState(false);
  const [message, setMessage] = useState("");

  // Live patient search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slot creation form
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotInterval, setSlotInterval] = useState(15);
  const [slotSubmitting, setSlotSubmitting] = useState(false);
  const [bookSubmitting, setBookSubmitting] = useState(false);

  useEffect(() => {
    api.get("/doctors").then(r => {
      const docs = r.data.data || [];
      setDoctors(docs);
      if (docs.length) setSelectedDoctorId(docs[0].id);
    }).catch(console.error);
  }, []);

  useEffect(() => { if (selectedDoctorId && selectedDate) loadSlots(); }, [selectedDoctorId, selectedDate]);

  async function loadSlots() {
    setSlotsLoading(true);
    try {
      const res = await api.get(`/bookings/slots/${selectedDoctorId}?date=${selectedDate}`);
      setSlots(res.data.data || []);
    } catch { } finally { setSlotsLoading(false); }
  }

  // Debounced patient search
  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/patients?search=${encodeURIComponent(query)}`);
        setSearchResults(res.data.data || []);
        setShowDropdown(true);
      } catch { } finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function openBooking(slot: Slot) {
    if (new Date(slot.endTime) < new Date()) { alert("Cannot book a past slot"); return; }
    setSelectedSlot(slot); setBookingModal(true);
    setQuery(""); setSelectedPatient(null); setShowDropdown(false);
  }

  async function confirmBooking() {
    if (!selectedSlot || !selectedPatient || !selectedDoctorId) { alert("Select patient and slot"); return; }
    setBookSubmitting(true); setMessage("");
    try {
      const res = await api.post("/bookings/book", { patientId: selectedPatient.id, doctorId: selectedDoctorId, slotId: selectedSlot.id, paymentMode: "CASH" });
      setMessage(`✅ Booked! Token: ${res.data.data.token}`);
      setBookingModal(false); setSelectedSlot(null); setSelectedPatient(null);
      loadSlots();
    } catch (err: any) { setMessage(`❌ ${err.response?.data?.message || "Booking failed"}`); }
    finally { setBookSubmitting(false); }
  }

  async function createSlot() {
    if (!slotStart || !slotEnd || !slotInterval) { alert("Set start, end and interval"); return; }
    setSlotSubmitting(true);
    try {
      // convert to bulk slot payload for a single-day range
      const start = new Date(slotStart);
      const end = new Date(slotEnd);
      const payload = {
        doctorId: selectedDoctorId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        startTimeStr: slotStart.slice(11,16),
        endTimeStr: slotEnd.slice(11,16),
        slotDurationMinutes: slotInterval,
        breakDurationMinutes: 0,
        maxCapacity: 1
      };
      await api.post("/bookings/slots/bulk", payload);
      setSlotModal(false); setSlotStart(""); setSlotEnd(""); setSlotInterval(15);
      loadSlots();
    } catch (err: any) { alert(err.response?.data?.message || "Failed to create slot"); }
    finally { setSlotSubmitting(false); }
  }

  function highlightMatch(text: string, q: string) {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q})`, "gi"));
    return parts.map((p, i) => p.toLowerCase() === q.toLowerCase() ? <mark key={i} className="bg-yellow-200 font-semibold">{p}</mark> : p);
  }

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
        <Calendar className="text-blue-500" /> Appointments
      </h1>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.startsWith("✅") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>{message}</div>
      )}

      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Doctor</label>
            <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              {doctors.map(d => {
                const deptName = typeof d.department === 'string' ? d.department : d.department?.name || 'Unknown';
                return (
                  <option key={d.id} value={d.id}>{d.name} ({deptName}) – ₹{d.consultationFee}</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
          </div>
          <div className="ml-auto">
            <button onClick={() => setSlotModal(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <Settings size={16} /> Configure Slots
            </button>
          </div>
        </div>

        {slotsLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : slots.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            No slots for this date. Click "Configure Slots" to create them.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map(s => {
              const isPast = new Date(s.endTime) < new Date();
              const isFull = !s.isAvailable;
              return (
                <button key={s.id} onClick={() => !isPast && !isFull && openBooking(s)}
                  disabled={isPast || isFull}
                  className={`p-3 rounded-xl text-sm font-medium border-2 transition text-left
                    ${isPast ? "border-slate-200 bg-slate-100 dark:bg-slate-800 opacity-40 cursor-not-allowed"
                      : isFull ? "border-red-200 bg-red-50 dark:bg-red-900/10 opacity-60 cursor-not-allowed"
                        : "border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"}`}>
                  <div className="font-semibold text-slate-800 dark:text-white">{new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  <div className={`text-xs mt-1 font-medium ${isFull ? "text-red-500" : isPast ? "text-slate-400" : "text-emerald-600"}`}>
                    {isFull ? "Full" : isPast ? "Past" : `${s.bookedCount}/${s.maxCapacity}`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Book Appointment</h3>
            <p className="text-sm text-slate-500 mb-4">
              Dr. {selectedDoctor?.name} · {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(selectedSlot.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={query} onChange={e => { setQuery(e.target.value); setSelectedPatient(null); }}
                placeholder="Search patient by name or UHID..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />}
            </div>

            {selectedPatient && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-800 dark:text-blue-300">{selectedPatient.name}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">{selectedPatient.uhid}</p>
              </div>
            )}

            {showDropdown && searchResults.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto mb-4">
                {searchResults.map(p => (
                  <button key={p.id} onMouseDown={e => { e.preventDefault(); setSelectedPatient(p); setQuery(p.name); setShowDropdown(false); }}
                    className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-slate-100 dark:border-slate-800 last:border-0 transition">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{highlightMatch(p.name, query)}</div>
                    <div className="text-xs text-slate-500 font-mono">{highlightMatch(p.uhid, query)} {p.contactNo && `· ${p.contactNo}`}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => { setBookingModal(false); setSelectedSlot(null); setSelectedPatient(null); setQuery(""); }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
              <button onClick={confirmBooking} disabled={!selectedPatient || bookSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                {bookSubmitting && <Loader2 className="animate-spin" size={16} />} Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Config Modal */}
      {slotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Configure Slot – {selectedDoctor?.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0,16)}
                  value={slotStart}
                  onChange={e => setSlotStart(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0,16)}
                  value={slotEnd}
                  onChange={e => setSlotEnd(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interval (mins)</label>
                <input type="number" min={1} value={slotInterval} onChange={e => setSlotInterval(+e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setSlotModal(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
              <button onClick={createSlot} disabled={slotSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                {slotSubmitting && <Loader2 className="animate-spin" size={16} />} Create Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { Plus, X, Loader2, Search, Trash2, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface Patient {
  id: string; uhid: string; name: string; age: number;
  gender: string | null; contactNo: string | null;
  registrationPaymentStatus: string; createdAt: string;
}

const PER_PAGE = 10;

export default function ReceptionistPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("recent");
  const [page, setPage] = useState(1);

  // Form state - Basic
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [registrationDate, setRegistrationDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));

  // Address
  const [houseNumber, setHouseNumber] = useState("");
  const [houseName, setHouseName] = useState("");
  const [houseAddress, setHouseAddress] = useState("");
  const [localArea, setLocalArea] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [pincode, setPincode] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [alternateContact, setAlternateContact] = useState("");
  const [email, setEmail] = useState("");

  // Guardian
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [guardianComment, setGuardianComment] = useState("");
  const [guardianSameAsPatient, setGuardianSameAsPatient] = useState(false);
  const [g_houseNumber, setG_HouseNumber] = useState("");
  const [g_houseName, setG_HouseName] = useState("");
  const [g_houseAddress, setG_HouseAddress] = useState("");
  const [g_localArea, setG_LocalArea] = useState("");
  const [g_street, setG_Street] = useState("");
  const [g_city, setG_City] = useState("");
  const [g_stateVal, setG_StateVal] = useState("");
  const [g_pincode, setG_Pincode] = useState("");

  // Referral & ID Proof
  const [referredDoctor, setReferredDoctor] = useState("");
  const [referredHospital, setReferredHospital] = useState("");
  const [idProofType, setIdProofType] = useState("");
  const [idProofDetail, setIdProofDetail] = useState("");
  const [idProofFile, setIdProofFile] = useState<string | null>(null);
  const [idProofFileName, setIdProofFileName] = useState<string | null>(null);
  const [registrationAmount, setRegistrationAmount] = useState(200);
  const [error, setError] = useState<string | null>(null);

  // Sync guardian address from patient if checked
  useEffect(() => {
    if (guardianSameAsPatient) {
      setG_HouseNumber(houseNumber); setG_HouseName(houseName);
      setG_HouseAddress(houseAddress); setG_LocalArea(localArea);
      setG_Street(street); setG_City(city);
      setG_StateVal(stateVal); setG_Pincode(pincode);
    }
  }, [guardianSameAsPatient, houseNumber, houseName, houseAddress, localArea, street, city, stateVal, pincode]);

  function calculateAgeFromDOB(dobString: string): number {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 0 ? age : 0;
  }

  function calculateFullAge(dobString: string): string {
    if (!dobString) return "";
    const dob = new Date(dobString);
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();
    if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { months += 12; years--; }
    return `${years} Years ${months} Months ${days} Days`;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setIdProofFile(String(reader.result)); setIdProofFileName(file.name); };
    reader.readAsDataURL(file);
  }

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data.data || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchPatients(); }, []);

  const sorted = useMemo(() => {
    const list = [...patients];
    if (sortKey === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortKey === "za") list.sort((a, b) => b.name.localeCompare(a.name));
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [patients, sortKey]);

  const filtered = sorted.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.uhid.toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!firstName.trim()) { setError("First name is required"); return; }
    if (!dob) { setError("Date of Birth is required"); return; }
    const age = calculateAgeFromDOB(dob);
    const addrParts = [houseNumber && `House No: ${houseNumber}`, houseName, houseAddress, street, localArea, city, stateVal, pincode && `PIN: ${pincode}`].filter(Boolean);
    const guardAddrParts = [g_houseNumber && `House No: ${g_houseNumber}`, g_houseName, g_houseAddress, g_street, g_localArea, g_city, g_stateVal, g_pincode && `PIN: ${g_pincode}`].filter(Boolean);

    setSubmitting(true);
    try {
      await api.post("/patients/register", {
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        firstName: firstName.trim(), lastName: lastName.trim(),
        age, dob,
        gender: gender || null,
        registrationDate,
        houseNumber, houseName, houseAddress, localArea, street, city, state: stateVal, pincode,
        address: addrParts.join(", ") || null,
        contactNo: contactNo || null, alternateContact: alternateContact || null, email: email || null,
        guardianName, guardianRelation, guardianContact, guardianComment,
        guardianAddress: guardAddrParts.join(", ") || null,
        referredDoctor, referredHospital,
        idProofType, idProofDetail, idProofData: idProofFile,
        registrationAmount: Number(registrationAmount),
      });
      setShowForm(false);

      const newPatientId = res.data?.data?.id;
      if (newPatientId) {
        router.push(`/receptionist/appointments?patientId=${newPatientId}`);
        return;
      }

      fetchPatients();
      // Reset form
      setFirstName(""); setLastName(""); setDob(""); setGender(""); setContactNo(""); setAlternateContact(""); setEmail("");
      setHouseNumber(""); setHouseName(""); setHouseAddress(""); setLocalArea(""); setStreet(""); setCity(""); setStateVal(""); setPincode("");
      setGuardianName(""); setGuardianRelation(""); setGuardianContact(""); setGuardianComment(""); setGuardianSameAsPatient(false);
      setReferredDoctor(""); setReferredHospital(""); setIdProofType(""); setIdProofDetail(""); setIdProofFile(null); setIdProofFileName(null);
    } catch (err: any) { setError(err.response?.data?.message || "Failed to register patient"); }
    finally { setSubmitting(false); }
  }

  const inputCls = "w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";
  const sectionCls = "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Users className="text-blue-500" /> Patient Registry
        </h1>
        <button onClick={() => { setShowForm(!showForm); setError(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-500/25">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cancel" : "Register Patient"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">{error}</div>}

          {/* UHID Preview */}
          <div className={sectionCls}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>UHID (Auto-generated)</label>
                <input readOnly value="IP-XXXXXX (auto)" className={`${inputCls} bg-slate-50 dark:bg-slate-900 cursor-not-allowed`} />
              </div>
              <div>
                <label className={labelCls}>Registration Date</label>
                <input type="date" value={registrationDate} onChange={e => setRegistrationDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Registration Amount (₹)</label>
                <input type="number" value={registrationAmount} onChange={e => setRegistrationAmount(+e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className={sectionCls}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>First Name *</label><input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className={inputCls} /></div>
              <div><label className={labelCls}>Last Name</label><input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name (optional)" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input type="date" value={dob} onChange={e => { const d = new Date(e.target.value); if (d > new Date()) { alert("DOB cannot be future"); return; } setDob(e.target.value); }} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Age (from DOB)</label>
                <div className={`${inputCls} bg-slate-50 dark:bg-slate-900 text-slate-500`}>{dob ? calculateFullAge(dob) : "Enter DOB to calculate"}</div>
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className={sectionCls}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Address & Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>House Number</label><input value={houseNumber} onChange={e => setHouseNumber(e.target.value)} placeholder="House / Flat No." className={inputCls} /></div>
              <div><label className={labelCls}>House Name</label><input value={houseName} onChange={e => setHouseName(e.target.value)} placeholder="House / Building name" className={inputCls} /></div>
              <div><label className={labelCls}>Building / Complex</label><input value={houseAddress} onChange={e => setHouseAddress(e.target.value)} placeholder="Building / Complex" className={inputCls} /></div>
              <div><label className={labelCls}>Local Area</label><input value={localArea} onChange={e => setLocalArea(e.target.value)} placeholder="Locality / Area" className={inputCls} /></div>
              <div><label className={labelCls}>Street</label><input value={street} onChange={e => setStreet(e.target.value)} placeholder="Street name / lane" className={inputCls} /></div>
              <div><label className={labelCls}>City</label><input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className={inputCls} /></div>
              <div><label className={labelCls}>State</label><input value={stateVal} onChange={e => setStateVal(e.target.value)} placeholder="State" className={inputCls} /></div>
              <div><label className={labelCls}>Pincode</label><input value={pincode} onChange={e => setPincode(e.target.value)} placeholder="PIN / ZIP" className={inputCls} /></div>
              <div><label className={labelCls}>Contact No.</label><input value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="Mobile or phone" className={inputCls} /></div>
              <div><label className={labelCls}>Alternate Contact No.</label><input value={alternateContact} onChange={e => setAlternateContact(e.target.value)} placeholder="Alternate contact" className={inputCls} /></div>
              <div><label className={labelCls}>Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" className={inputCls} /></div>
            </div>
          </div>

          {/* Guardian */}
          <div className={sectionCls}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Guardian Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>Guardian Name</label><input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Guardian full name" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Relation</label>
                <select value={guardianRelation} onChange={e => setGuardianRelation(e.target.value)} className={inputCls}>
                  <option value="">Select relation</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="spouse">Spouse</option>
                  <option value="guardian">Guardian</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><label className={labelCls}>Guardian Contact No.</label><input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} placeholder="Contact number" className={inputCls} /></div>
              <div className="md:col-span-3"><label className={labelCls}>Comment / Notes</label><textarea value={guardianComment} onChange={e => setGuardianComment(e.target.value)} placeholder="Any notes about guardian" rows={2} className={inputCls} /></div>
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">Guardian Address</h4>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={guardianSameAsPatient} onChange={e => setGuardianSameAsPatient(e.target.checked)} className="rounded" />
                  <span className="text-slate-600 dark:text-slate-400">Same as patient address</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className={labelCls}>House Number</label><input value={g_houseNumber} onChange={e => setG_HouseNumber(e.target.value)} disabled={guardianSameAsPatient} placeholder="House / Flat No." className={`${inputCls} disabled:opacity-50`} /></div>
                <div><label className={labelCls}>House Name</label><input value={g_houseName} onChange={e => setG_HouseName(e.target.value)} disabled={guardianSameAsPatient} placeholder="House / Building name" className={`${inputCls} disabled:opacity-50`} /></div>
                <div><label className={labelCls}>Building / Complex</label><input value={g_houseAddress} onChange={e => setG_HouseAddress(e.target.value)} disabled={guardianSameAsPatient} placeholder="Building / Complex" className={`${inputCls} disabled:opacity-50`} /></div>
                <div><label className={labelCls}>Local Area</label><input value={g_localArea} onChange={e => setG_LocalArea(e.target.value)} disabled={guardianSameAsPatient} placeholder="Locality" className={`${inputCls} disabled:opacity-50`} /></div>
                <div><label className={labelCls}>Street</label><input value={g_street} onChange={e => setG_Street(e.target.value)} disabled={guardianSameAsPatient} placeholder="Street" className={`${inputCls} disabled:opacity-50`} /></div>
                <div><label className={labelCls}>City</label><input value={g_city} onChange={e => setG_City(e.target.value)} disabled={guardianSameAsPatient} placeholder="City" className={`${inputCls} disabled:opacity-50`} /></div>
                <div><label className={labelCls}>State</label><input value={g_stateVal} onChange={e => setG_StateVal(e.target.value)} disabled={guardianSameAsPatient} placeholder="State" className={`${inputCls} disabled:opacity-50`} /></div>
                <div><label className={labelCls}>Pincode</label><input value={g_pincode} onChange={e => setG_Pincode(e.target.value)} disabled={guardianSameAsPatient} placeholder="PIN / ZIP" className={`${inputCls} disabled:opacity-50`} /></div>
              </div>
            </div>
          </div>

          {/* Referral & ID Proof */}
          <div className={sectionCls}>
            <h3 className="font-semibold text-slate-900 dark:text-white">Referral & ID Proof</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelCls}>Referred Doctor</label><input value={referredDoctor} onChange={e => setReferredDoctor(e.target.value)} placeholder="Referring doctor name" className={inputCls} /></div>
              <div><label className={labelCls}>Referred Hospital</label><input value={referredHospital} onChange={e => setReferredHospital(e.target.value)} placeholder="Referring hospital" className={inputCls} /></div>
              <div>
                <label className={labelCls}>ID Proof Type</label>
                <select value={idProofType} onChange={e => setIdProofType(e.target.value)} className={inputCls}>
                  <option value="">Select ID type</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="passport">Passport</option>
                  <option value="voter">Voter ID</option>
                  <option value="driving">Driving Licence</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div><label className={labelCls}>ID Number / Detail</label><input value={idProofDetail} onChange={e => setIdProofDetail(e.target.value)} placeholder="ID number or detail" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Upload ID Proof</label>
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                {idProofFileName && <p className="text-xs text-emerald-600 mt-1">✓ {idProofFileName}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition font-medium flex items-center gap-2">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : null} Register Patient
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          </div>
        </form>
      )}

      {/* List section */}
      {!showForm && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name or UHID..." className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="recent">Recently Added</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No patients found.</div>
          ) : (
            <>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">UHID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Registered</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {paginated.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-medium">{p.uhid}</td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.contactNo || "-"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{new Date(p.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.registrationPaymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{p.registrationPaymentStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
                  <div className="flex items-center gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><ChevronLeft size={16} /></button>
                    <span className="text-sm font-medium">{page} / {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


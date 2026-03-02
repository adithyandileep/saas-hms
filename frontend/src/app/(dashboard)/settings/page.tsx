"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

const EnvAPI = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const settingsSchema = z.object({
  organizationName: z.string().min(1, "Organization Name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
});

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      organizationName: "",
      timezone: "UTC",
      currency: "USD",
      contactEmail: "",
      contactPhone: "",
      address: "",
      logoUrl: "",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await axios.get(`${EnvAPI}/settings/organization`, {
          withCredentials: true,
        });
        const data = res.data.data;
        form.reset({
          organizationName: data.organizationName || "",
          timezone: data.timezone || "UTC",
          currency: data.currency || "USD",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          address: data.address || "",
          logoUrl: data.logoUrl || "",
        });
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [form]);

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    try {
      setSaving(true);
      setMessage("");
      await axios.put(`${EnvAPI}/settings/organization`, values, {
        withCredentials: true,
      });
      setMessage("Settings updated successfully!");
    } catch (error) {
      console.error(error);
      setMessage("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Global Settings</h1>
        <p className="text-gray-500 mt-2">Manage your organization details and system preferences.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm ${message.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              {message}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Organization Profile Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Organization Profile</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                      <input 
                        {...form.register("organizationName")} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" 
                      />
                      {form.formState.errors.organizationName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.organizationName.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                      <input 
                        {...form.register("contactEmail")} 
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                      <input 
                        {...form.register("contactPhone")} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Physical Address</label>
                      <textarea 
                        {...form.register("address")} 
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional & Branding */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Regional & Branding</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Timezone</label>
                        <select {...form.register("timezone")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white">
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">EST</option>
                          <option value="Asia/Kolkata">IST</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <select {...form.register("currency")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border bg-white">
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Logo</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-slate-50 relative group transition-colors hover:bg-slate-100 overflow-hidden h-40">
                         {form.watch("logoUrl") ? (
                           <img src={form.watch("logoUrl")!} alt="Logo preview" className="h-full object-contain z-10" />
                         ) : (
                           <div className="space-y-2 text-center flex flex-col items-center justify-center">
                             <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                               <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                             </svg>
                             <div className="text-sm text-gray-600">
                               <span className="font-semibold text-blue-600 group-hover:text-blue-500">Upload a file</span>
                             </div>
                             <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                           </div>
                         )}
                         <input 
                           type="file" 
                           accept="image/*"
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 form.setValue("logoUrl", reader.result as string, { shouldDirty: true });
                               };
                               reader.readAsDataURL(file);
                             }
                           }}
                         />
                      </div>
                      {form.watch("logoUrl") && (
                        <button 
                          type="button" 
                          onClick={() => form.setValue("logoUrl", "")}
                          className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button 
                type="submit" 
                disabled={saving || !form.formState.isDirty}
                className="inline-flex items-center justify-center py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

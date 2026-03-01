"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";

const EnvAPI = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const setupSchema = z.object({
  organizationName: z.string().min(1, "Organization Name is required"),
  superAdminUsername: z.string().min(3, "Username must be at least 3 characters"),
  superAdminPassword: z.string().min(6, "Password must be at least 6 characters"),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
  logoUrl: z.string().optional(),
});

export default function InstallPage() {
  const [showAnimation, setShowAnimation] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      organizationName: "",
      superAdminUsername: "superadmin",
      superAdminPassword: "",
      timezone: "UTC",
      currency: "USD",
    },
  });

  useEffect(() => {
    // Check if setup is actually required
    axios.get(`${EnvAPI}/auth/setup-status`).then((res) => {
      if (!res.data.setupRequired) {
        router.push("/login");
      } else {
        setTimeout(() => setShowAnimation(false), 3000);
      }
    }).catch(() => {
      // API might be down, still wait for animation
      setTimeout(() => setShowAnimation(false), 3000);
    });
  }, [router]);

  async function onSubmit(values: z.infer<typeof setupSchema>) {
    try {
      setLoading(true);
      await axios.post(`${EnvAPI}/auth/setup`, values);
      router.push("/login");
    } catch (error) {
       console.error(error);
       alert("Setup failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  }

  if (showAnimation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-in fade-in zoom-in duration-1000 scale-150 transform transition-all">
          <h1 className="text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Enterprise HMS
          </h1>
          <p className="mt-4 text-center text-lg text-slate-400 animate-pulse">Initializing Setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Welcome to Enterprise HMS</h2>
          <p className="text-blue-100 text-sm mt-1">Configure your hospital workspace</p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
            <input 
              {...form.register("organizationName")} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
              placeholder="e.g. City General Hospital"
            />
            {form.formState.errors.organizationName && <p className="text-red-500 text-xs mt-1">{form.formState.errors.organizationName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <select {...form.register("timezone")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                <option value="UTC">UTC</option>
                <option value="America/New_York">EST</option>
                <option value="Asia/Kolkata">IST</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select {...form.register("currency")} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <hr className="my-4 border-gray-200" />
          <h3 className="text-sm font-semibold text-gray-900">Hospital Branding</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Logo (Optional)</label>
            <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-slate-50 relative group hover:bg-slate-100 transition cursor-pointer overflow-hidden h-32">
               {form.watch("logoUrl") ? (
                 <img src={form.watch("logoUrl")!} alt="Logo preview" className="h-full object-contain z-10" />
               ) : (
                 <div className="space-y-1 text-center">
                   <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                     <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                   </svg>
                   <div className="text-sm text-gray-600">
                     <span className="font-medium text-blue-600 group-hover:text-blue-500">Upload a file</span>
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
                       form.setValue("logoUrl", reader.result as string);
                     };
                     reader.readAsDataURL(file);
                   }
                 }}
               />
            </div>
          </div>

          <hr className="my-4 border-gray-200" />
          <h3 className="text-sm font-semibold text-gray-900">Admin Account</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">SuperAdmin Username</label>
            <input 
              {...form.register("superAdminUsername")} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SuperAdmin Password</label>
            <input 
              type="password"
              {...form.register("superAdminPassword")} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" 
            />
            {form.formState.errors.superAdminPassword && <p className="text-red-500 text-xs mt-1">{form.formState.errors.superAdminPassword.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 mt-6"
          >
            {loading ? "Completing Setup..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    api.get(`/auth/setup-status`).then((res) => {
      if (res.data.setupRequired) {
        router.push("/install");
      }
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return;

    if (user.role === "SUPERADMIN" || user.role === "ADMIN") {
      router.replace("/admin");
      return;
    }

    router.replace(`/${user.role.toLowerCase()}`);
  }, [hasHydrated, isAuthenticated, router, user]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setLoading(true);
      const res = await api.post(`/auth/login`, values);
      const user = res.data.user;
      login(user);

      switch(user.role) {
        case "SUPERADMIN": router.push("/admin"); break;
        case "ADMIN": router.push("/admin"); break;
        case "DOCTOR": router.push("/doctor"); break;
        case "RECEPTIONIST": router.push("/receptionist"); break;
        case "PATIENT": router.push("/patient"); break;
        default: router.push("/");
      }
    } catch (error: any) {
       console.error("Login Error:", error);
       alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-2">Sign in to your account</p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 pb-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input 
              {...form.register("username")} 
              autoComplete="username"
              className="w-full rounded-lg bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 p-3 border transition-colors" 
              placeholder="Enter your username"
            />
            {form.formState.errors.username && <p className="text-red-400 text-xs mt-1">{form.formState.errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password"
              autoComplete="current-password"
              {...form.register("password")} 
              className="w-full rounded-lg bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500 p-3 border transition-colors" 
              placeholder="********"
            />
            {form.formState.errors.password && <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">Remember me</label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

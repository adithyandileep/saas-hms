"use client";

import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Loader2, Users, Activity, Calendar, DollarSign, Stethoscope } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface DashboardStats {
  counts: {
    doctors: number;
    patients: number;
    appointmentsToday: number;
  };
  recentDoctors: any[];
  recentPatients: any[];
  revenueChart: { name: string; revenue: number }[];
}

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get("/admins/dashboard");
        setStats(res.data.data);
      } catch (err: any) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Admin Overview
        </h1>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Welcome back, {user?.username}
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Doctors</p>
            <Stethoscope size={18} className="text-zinc-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.counts.doctors}</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Active platform accounts</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Patients</p>
            <Users size={18} className="text-zinc-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.counts.patients}</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Verified registrations</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Today's Activity</p>
            <Calendar size={18} className="text-zinc-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{stats.counts.appointmentsToday}</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Scheduled appointments</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">System Status</p>
            <Activity size={18} className="text-zinc-400" />
          </div>
          <div className="mt-4">
            <p className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-white animate-pulse"></span>
              Operational
            </p>
            <p className="text-xs text-zinc-500 mt-1 font-medium">All services normal</p>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Recent Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Revenue Overview</h2>
              <p className="text-sm text-zinc-500 mt-1">Last 7 days of completed bookings</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  tickFormatter={(value: number) => `$${value}`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: 'none' }}
                  itemStyle={{ color: '#18181b', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3f3f46" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Widgets column */}
        <div className="space-y-6">
          {/* Recent Doctors */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight uppercase tracking-wider mb-5">
              Recent Providers
            </h2>
            <div className="space-y-4">
              {stats.recentDoctors.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 flex items-center justify-center font-bold text-xs ring-1 ring-zinc-200 dark:ring-zinc-800">
                    {doc.doctorProfile?.firstName?.[0] || 'D'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Dr. {doc.doctorProfile?.firstName} {doc.doctorProfile?.lastName}
                    </p>
                    <p className="text-xs text-zinc-500">{doc.doctorProfile?.specialization || 'General Practice'}</p>
                  </div>
                </div>
              ))}
              {stats.recentDoctors.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-2">No doctors acquired recently.</p>
              )}
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight uppercase tracking-wider mb-5">
              Recent Patients
            </h2>
            <div className="space-y-4">
              {stats.recentPatients.map((pat: any) => (
                <div key={pat.id} className="flex items-center gap-3 justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-1">
                      {pat.patientProfile?.firstName} {pat.patientProfile?.lastName}
                    </p>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{pat.patientProfile?.uhid}</p>
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {new Date(pat.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {stats.recentPatients.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-2">No new patients.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

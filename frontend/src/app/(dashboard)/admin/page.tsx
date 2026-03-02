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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Welcome back, {user?.username}
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Stethoscope size={64} className="text-blue-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Doctors</p>
          <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">{stats.counts.doctors}</p>
          <p className="text-xs text-emerald-500 mt-2 font-medium">+ Active platform accounts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Users size={64} className="text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Patients</p>
          <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">{stats.counts.patients}</p>
          <p className="text-xs text-emerald-500 mt-2 font-medium">+ Registrations</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Calendar size={64} className="text-orange-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Today's Appointments</p>
          <p className="text-4xl font-bold mt-2 text-slate-900 dark:text-white">{stats.counts.appointmentsToday}</p>
          <p className="text-xs text-emerald-500 mt-2 font-medium">Scheduled for today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Activity size={64} className="text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">System Status</p>
          <p className="text-2xl font-bold mt-2 text-emerald-500 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </p>
          <p className="text-xs text-slate-400 mt-3 font-medium">All services running normal</p>
        </div>
      </div>

      {/* Analytics Chart & Recent Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Overview</h2>
              <p className="text-sm text-slate-500">Last 7 days of completed bookings</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(value: number) => `$${value}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Small Widgets column */}
        <div className="space-y-6">
          {/* Recent Doctors */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Stethoscope size={18} className="text-blue-500" /> Recent Doctors
            </h2>
            <div className="space-y-4">
              {stats.recentDoctors.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {doc.doctorProfile?.firstName?.[0] || 'D'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Dr. {doc.doctorProfile?.firstName} {doc.doctorProfile?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{doc.doctorProfile?.specialization || 'General'}</p>
                  </div>
                </div>
              ))}
              {stats.recentDoctors.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">No doctors acquired recently.</p>
              )}
            </div>
          </div>

          {/* Recent Patients */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Users size={18} className="text-indigo-500" /> Recent Patients
            </h2>
            <div className="space-y-4">
              {stats.recentPatients.map((pat: any) => (
                <div key={pat.id} className="flex items-center gap-3 justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {pat.patientProfile?.firstName} {pat.patientProfile?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{pat.patientProfile?.uhid}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                    {new Date(pat.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {stats.recentPatients.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-2">No new patients.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

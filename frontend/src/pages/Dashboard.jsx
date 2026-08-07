import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  PieChart,
  BarChart3,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const endpoint = user?.role === 'employee' ? '/dashboard/my-tasks' : '/dashboard';
      const res = await API.get(endpoint);
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Executive Intelligence
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Analytics & Insights
              </h1>
              <p className="text-sm text-slate-300 dark:text-slate-400 mt-2 max-w-xl">
                Real-time aggregated task metrics, active workloads, priority breakdown, and overdue task alerts.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-36 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              {/* Total / Assigned */}
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-sky-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {user?.role === 'employee' ? 'My Assigned Tasks' : 'Total System Tasks'}
                    </p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-2">
                      {user?.role === 'employee' ? stats?.totalAssigned : stats?.totalTasks}
                    </h3>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Active Tasks */}
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Workload</p>
                    <h3 className="text-4xl font-black text-amber-500 dark:text-amber-400 mt-2">
                      {user?.role === 'employee'
                        ? stats?.activeTasks
                        : (stats?.byStatus?.todo + stats?.byStatus?.in_progress + stats?.byStatus?.review)}
                    </h3>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed Tasks</p>
                    <h3 className="text-4xl font-black text-emerald-500 dark:text-emerald-400 mt-2">
                      {user?.role === 'employee' ? stats?.completedTasks : stats?.byStatus?.done}
                    </h3>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Overdue Tasks */}
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-rose-500/40 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Alerts</p>
                    <h3 className="text-4xl font-black text-rose-500 dark:text-rose-400 mt-2">
                      {stats?.overdueTasks}
                    </h3>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

            </div>

            {/* Breakdown Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              
              {/* Status Breakdown */}
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-sky-500" /> Status Distribution
                </h3>

                <div className="space-y-5">
                  {[
                    { label: 'To Do', count: stats?.byStatus?.todo || 0, color: 'bg-slate-400 dark:bg-slate-500' },
                    { label: 'In Progress', count: stats?.byStatus?.in_progress || 0, color: 'bg-sky-500' },
                    { label: 'Under Review', count: stats?.byStatus?.review || 0, color: 'bg-amber-500' },
                    { label: 'Done', count: stats?.byStatus?.done || 0, color: 'bg-emerald-500' }
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-extrabold">{item.count} tasks</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 ${item.color} rounded-full transition-all duration-700`}
                          style={{
                            width: `${
                              (stats?.totalTasks || stats?.totalAssigned || 1) > 0
                                ? (item.count / (stats?.totalTasks || stats?.totalAssigned || 1)) * 100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Breakdown (Admin/Manager) */}
              {user?.role !== 'employee' && stats?.byPriority && (
                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Priority Allocation
                  </h3>

                  <div className="space-y-5">
                    {[
                      { label: 'High Priority', count: stats?.byPriority?.high || 0, color: 'bg-rose-500' },
                      { label: 'Medium Priority', count: stats?.byPriority?.medium || 0, color: 'bg-amber-500' },
                      { label: 'Low Priority', count: stats?.byPriority?.low || 0, color: 'bg-slate-400' }
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-extrabold">{item.count} tasks</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 ${item.color} rounded-full transition-all duration-700`}
                            style={{
                              width: `${
                                (stats?.totalTasks || 1) > 0
                                  ? (item.count / (stats?.totalTasks || 1)) * 100
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Employee Workload Table (Admin & Manager) */}
            {user?.role !== 'employee' && stats?.employeeWorkload && (
              <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-500" /> Team Workload Distribution
                </h3>

                <div className="space-y-3">
                  {stats.employeeWorkload.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No assigned employee workloads found.</p>
                  ) : (
                    stats.employeeWorkload.map((emp) => (
                      <div key={emp._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{emp.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            {emp.taskCount} Active Tasks
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </>
        )}

      </main>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Navbar } from '../components/Navbar';
import {
  History,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles
} from 'lucide-react';

export const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const fetchLogs = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await API.get(`/activity-logs?page=${currentPage}&limit=15`);
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.totalPages || 1);
        setPage(res.data.currentPage || 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const getEntityBadge = (type) => {
    switch (type) {
      case 'task':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-sm">Task</span>;
      case 'sprint':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">Sprint</span>;
      case 'workspace':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">Workspace</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm">User</span>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (log.performedByName && log.performedByName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Hero Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Immutable Audit Trail
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Activity Logs
              </h1>
              <p className="text-sm text-slate-300 dark:text-slate-400 mt-2 max-w-xl">
                Real-time chronological timeline tracking workspace mutations, sprint activation, task status moves, and user updates.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Entity Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto overflow-x-auto shadow-sm">
            {[
              { key: 'all', label: 'All Activities' },
              { key: 'task', label: 'Tasks' },
              { key: 'sprint', label: 'Sprints' },
              { key: 'workspace', label: 'Workspaces' },
              { key: 'user', label: 'Users' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setEntityFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  entityFilter === tab.key
                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Audit Log Timeline Cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="h-20 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <History className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Activity Logs Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              No matching activity events fit your filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="mt-0.5 sm:mt-0">{getEntityBadge(log.entityType)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{log.message}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-sky-500" /> {log.performedByName}
                      </span>
                      <span>•</span>
                      <span>Workspace: <strong className="text-slate-800 dark:text-slate-300">{log.workspaceId?.name || 'System Level'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-8">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page <span className="font-extrabold text-slate-900 dark:text-white">{page}</span> of <span className="font-extrabold text-slate-900 dark:text-white">{totalPages}</span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 transition-colors shadow-sm"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

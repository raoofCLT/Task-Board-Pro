import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Navbar } from '../components/Navbar';
import {
  History,
  FolderKanban,
  Kanban,
  CheckSquare,
  User,
  Clock,
  Sparkles,
  Search,
  Layers
} from 'lucide-react';

export const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const fetchActivityLogs = async () => {
    try {
      const res = await API.get('/activity-logs?limit=50');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const getEntityIcon = (type) => {
    switch (type) {
      case 'workspace':
        return <FolderKanban className="w-4 h-4 text-sky-400" />;
      case 'sprint':
        return <Kanban className="w-4 h-4 text-indigo-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'user':
        return <User className="w-4 h-4 text-amber-400" />;
      default:
        return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatTimestamp = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.performedByName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Dark Hero Banner Header Box */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Immutable Audit Trail
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                System Activity Log
              </h1>
              <p className="text-sm text-slate-300 mt-2 max-w-xl">
                Real-time audit records capturing workspace creations, sprint updates, task status changes, and user deactivations.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Entity Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto overflow-x-auto shadow-sm">
            {[
              { key: 'all', label: 'All Activities' },
              { key: 'workspace', label: 'Workspaces' },
              { key: 'sprint', label: 'Sprints' },
              { key: 'task', label: 'Tasks' },
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
              placeholder="Search audit message or actor..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="h-16 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <Layers className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Activity Logs Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No activity records match your search filter.</p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
            {filteredLogs.map((log) => (
              <div
                key={log._id}
                className="relative group bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-sky-500/40 transition-all duration-200"
              >
                {/* Timeline Bullet Node */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-4 h-4 rounded-full bg-slate-900 dark:bg-slate-950 border-2 border-sky-500 shadow-md group-hover:scale-125 transition-transform" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50">
                      {getEntityIcon(log.entityType)}
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      {log.entityType} • {log.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTimestamp(log.createdAt)}</span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  {log.message}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                    {log.performedByName ? log.performedByName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span>Performed by <strong className="text-slate-700 dark:text-slate-300 font-bold">{log.performedByName}</strong></span>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

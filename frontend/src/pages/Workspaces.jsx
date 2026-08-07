import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';
import { CustomSelect } from '../components/ui/CustomSelect';
import {
  FolderKanban,
  Plus,
  Users,
  Archive,
  ArrowRight,
  X,
  UserPlus,
  UserMinus,
  Search,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';

export const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedWs, setSelectedWs] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [modifyingMember, setModifyingMember] = useState(false);

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      const res = await API.get('/workspaces');
      if (res.data.success) {
        setWorkspaces(res.data.workspaces);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (user?.role === 'admin') {
      try {
        const res = await API.get('/users');
        if (res.data.success) {
          setAllUsers(res.data.users);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    fetchAllUsers();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post('/workspaces', {
        name: newWsName,
        description: newWsDesc
      });
      if (res.data.success) {
        showSuccess(`Workspace '${newWsName}' created successfully!`);
        setShowCreateModal(false);
        setNewWsName('');
        setNewWsDesc('');
        fetchWorkspaces();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (e, wsId) => {
    e.stopPropagation();
    try {
      const res = await API.patch(`/workspaces/${wsId}/archive`);
      if (res.data.success) {
        showSuccess(res.data.message);
        fetchWorkspaces();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to toggle archive state');
    }
  };

  const handleOpenMembersModal = (e, ws) => {
    e.stopPropagation();
    setSelectedWs(ws);
    setShowMembersModal(true);
  };

  const handleMemberAction = async (userId, action) => {
    setModifyingMember(true);
    try {
      const res = await API.patch(`/workspaces/${selectedWs._id}/members`, {
        userId,
        action
      });
      if (res.data.success) {
        showSuccess(res.data.message);
        setSelectedWs(prev => ({ ...prev, members: res.data.members }));
        fetchWorkspaces();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to modify workspace member');
    } finally {
      setModifyingMember(false);
    }
  };

  const filteredWorkspaces = workspaces.filter(ws => {
    const matchesSearch = ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (ws.description && ws.description.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterTab === 'active') return matchesSearch && !ws.isArchived;
    if (filterTab === 'archived') return matchesSearch && ws.isArchived;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Hero Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 mb-8 shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Workspace Hub
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Team Workspaces
              </h1>
              <p className="text-sm text-slate-300 dark:text-slate-400 mt-2 max-w-xl">
                Collaborate across active project spaces, manage sprint workflows, and monitor team performance.
              </p>
            </div>

            {user?.role === 'admin' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Create Workspace
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full sm:w-auto shadow-sm">
            {[
              { key: 'all', label: 'All Workspaces' },
              { key: 'active', label: 'Active' },
              { key: 'archived', label: 'Archived' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterTab === tab.key
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
              placeholder="Search workspaces..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
            />
          </div>
        </div>

        {/* Loading Skeleton Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-52 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <Layers className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Workspaces Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No matching workspaces fit your search or filter options.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((ws) => (
              <div
                key={ws._id}
                onClick={() => navigate(`/workspaces/${ws._id}/board`)}
                className={`group relative bg-white dark:bg-slate-900/80 backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                  ws.isArchived
                    ? 'border-amber-500/30 bg-slate-50 dark:bg-slate-900/40 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/50'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 font-bold group-hover:scale-105 transition-transform">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                          {ws.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">Created by {ws.createdBy?.name || 'Admin'}</p>
                      </div>
                    </div>

                    {ws.isArchived && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 shrink-0">
                        <Archive className="w-3 h-3" /> Archived
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 min-h-[32px]">
                    {ws.description || 'No detailed description provided for this team workspace.'}
                  </p>
                </div>

                {/* Footer Info & Member Avatars */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  {/* Member Avatars Stack */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {ws.members?.slice(0, 4).map((m) => (
                        <div
                          key={m._id}
                          className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                          title={m.name}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {ws.members?.length || 0} Member{ws.members?.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Actions */}
                  {user?.role === 'admin' ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleOpenMembersModal(e, ws)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Manage Members"
                      >
                        Members
                      </button>
                      <button
                        onClick={(e) => handleToggleArchive(e, ws._id)}
                        className={`p-1.5 rounded-xl transition-colors ${
                          ws.isArchived
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-600'
                        }`}
                        title={ws.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-sky-500 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                      View Board <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-sky-500" /> Create Workspace
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Core Product Engineering"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="Workspace scope and team objectives..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
      {showMembersModal && selectedWs && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-500" /> Manage Workspace Members
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedWs.name}</p>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Current Members List */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Current Workspace Members ({selectedWs.members?.length || 0})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedWs.members?.map((m) => (
                  <div key={m._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{m.name}</p>
                        <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 capitalize">{m.role}</p>
                      </div>
                    </div>

                    {m._id !== user._id && (
                      <button
                        onClick={() => handleMemberAction(m._id, 'remove')}
                        disabled={modifyingMember}
                        className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 disabled:opacity-50 transition-colors"
                        title="Remove Member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add Member Dropdown */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Add Team Member to Workspace
              </h4>
              <div className="flex gap-2">
                <CustomSelect
                  options={allUsers
                    .filter((u) => !selectedWs.members?.some((m) => m._id === u._id))
                    .map((u) => ({ value: u._id, label: `${u.name} (${u.role})` }))}
                  value={selectedUserId}
                  onChange={(val) => setSelectedUserId(val)}
                  placeholder="Select a team member..."
                  className="flex-1"
                />

                <button
                  disabled={!selectedUserId || modifyingMember}
                  onClick={() => {
                    handleMemberAction(selectedUserId, 'add');
                    setSelectedUserId('');
                  }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {modifyingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Add
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navbar } from '../components/Navbar';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { DateTimePicker } from '../components/ui/DateTimePicker';
import { io } from 'socket.io-client';
import {
  Kanban,
  Plus,
  Play,
  Pause,
  Clock,
  User,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  X,
  Search,
  Send,
  Calendar,
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SprintBoard = () => {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [taskSearch, setTaskSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [mobileTab, setMobileTab] = useState('todo');

  // Modals
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintStart, setNewSprintStart] = useState('');
  const [newSprintEnd, setNewSprintEnd] = useState('');

  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskLabels, setTaskLabels] = useState('');

  const [selectedTask, setSelectedTask] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Submit for Review & Revision Feedback Modals
  const [reviewModalTask, setReviewModalTask] = useState(null);
  const [reviewNote, setReviewNote] = useState('');

  const [revisionModalTask, setRevisionModalTask] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');

  const isAssignedToUser = (assignedTo, u) => {
    if (!assignedTo || !u) return false;
    const assigneeId = (assignedTo._id || assignedTo).toString();
    const userId = (u._id || u.id).toString();
    return assigneeId === userId;
  };

  const fetchWorkspaceAndSprints = async () => {
    try {
      const wsRes = await API.get(`/workspaces/${workspaceId}`);
      if (wsRes.data.success) {
        setWorkspace(wsRes.data.workspace);
      }

      const sprintRes = await API.get(`/workspaces/${workspaceId}/sprints`);
      if (sprintRes.data.success) {
        setSprints(sprintRes.data.sprints);
        if (sprintRes.data.sprints.length > 0 && !selectedSprintId) {
          const active = sprintRes.data.sprints.find(s => s.isActive);
          setSelectedSprintId(active ? active._id : sprintRes.data.sprints[0]._id);
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!workspaceId) return;
    try {
      const query = `workspaceId=${workspaceId}${selectedSprintId ? `&sprintId=${selectedSprintId}` : ''}&limit=100`;
      const res = await API.get(`/tasks?${query}`);
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaceAndSprints();
  }, [workspaceId]);

  useEffect(() => {
    fetchTasks();
  }, [selectedSprintId, workspaceId]);

  // Real-time Socket.io Subscriptions
  useEffect(() => {
    if (!workspaceId) return;

    const socket = io(SOCKET_SERVER_URL);

    socket.on('connect', () => {
      socket.emit('joinWorkspace', workspaceId);
    });

    socket.on('task:created', () => fetchTasks());
    socket.on('task:assigned', () => fetchTasks());
    socket.on('task:statusChanged', () => fetchTasks());
    socket.on('task:commentAdded', () => {
      fetchTasks();
    });

    return () => {
      socket.emit('leaveWorkspace', workspaceId);
      socket.disconnect();
    };
  }, [workspaceId, selectedSprintId]);

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post(`/workspaces/${workspaceId}/sprints`, {
        name: newSprintName,
        startDate: newSprintStart,
        endDate: newSprintEnd
      });
      if (res.data.success) {
        showSuccess(`Sprint '${newSprintName}' created!`);
        setShowCreateSprintModal(false);
        setNewSprintName('');
        fetchWorkspaceAndSprints();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSprintActive = async (sprintId) => {
    try {
      const res = await API.patch(`/sprints/${sprintId}/toggle-active`);
      if (res.data.success) {
        showSuccess(res.data.message);
        fetchWorkspaceAndSprints();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to toggle sprint status');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const labelsArray = taskLabels ? taskLabels.split(',').map(l => l.trim()) : [];
      const res = await API.post(`/sprints/${selectedSprintId}/tasks`, {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate,
        assignedTo: taskAssignee || null,
        workspaceId,
        labels: labelsArray
      });

      if (res.data.success) {
        showSuccess(`Task '${taskTitle}' created successfully!`);
        setShowCreateTaskModal(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskAssignee('');
        setTaskDueDate('');
        setTaskLabels('');
        fetchTasks();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusTransition = async (taskId, newStatus) => {
    try {
      const res = await API.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        showSuccess(res.data.message);
        fetchTasks();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Status transition failed');
    }
  };

  // Submit for Review with Handover Note
  const handleSubmitForReviewWithNote = async (e) => {
    e.preventDefault();
    if (!reviewModalTask) return;
    setSubmitting(true);
    try {
      const res = await API.patch(`/tasks/${reviewModalTask._id}/status`, { status: 'review' });
      if (res.data.success) {
        if (reviewNote.trim()) {
          await API.post(`/tasks/${reviewModalTask._id}/comments`, {
            text: `📝 [Submitted for Review]: ${reviewNote.trim()}`
          });
        }
        showSuccess(`Task submitted for review!`);
        setReviewModalTask(null);
        setReviewNote('');
        if (selectedTask) setSelectedTask(null);
        fetchTasks();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit task for review');
    } finally {
      setSubmitting(false);
    }
  };

  // Request Revision with Issue Feedback Note
  const handleRequestRevisionWithNote = async (e) => {
    e.preventDefault();
    if (!revisionModalTask) return;
    setSubmitting(true);
    try {
      const res = await API.patch(`/tasks/${revisionModalTask._id}/status`, { status: 'in_progress' });
      if (res.data.success) {
        const noteText = revisionNote.trim() ? revisionNote.trim() : 'Revision requested by Manager.';
        await API.post(`/tasks/${revisionModalTask._id}/comments`, {
          text: `⚠️ [Revision Requested]: ${noteText}`
        });
        showSuccess(`Revision requested.`);
        setRevisionModalTask(null);
        setRevisionNote('');
        if (selectedTask) setSelectedTask(null);
        fetchTasks();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTask = async (taskId, newAssigneeId) => {
    try {
      const res = await API.patch(`/tasks/${taskId}/assign`, { assignedTo: newAssigneeId || null });
      if (res.data.success) {
        showSuccess(res.data.message);
        fetchTasks();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Task assignment failed');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res = await API.post(`/tasks/${selectedTask._id}/comments`, { text: newCommentText });
      if (res.data.success) {
        showSuccess('Comment added successfully!');
        setSelectedTask(prev => ({ ...prev, comments: res.data.comments }));
        setNewCommentText('');
        fetchTasks();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">High</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">Med</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">Low</span>;
    }
  };

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'done';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || (assigneeFilter === 'unassigned' ? !t.assignedTo : (t.assignedTo?._id || t.assignedTo) === assigneeFilter);
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const activeSprint = sprints.find(s => s._id === selectedSprintId);

  const columns = [
    { key: 'todo', title: 'To Do', color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20' },
    { key: 'in_progress', title: 'In Progress', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
    { key: 'review', title: 'Under Review', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    { key: 'done', title: 'Done', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Dark Hero Banner Header Box */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 mb-6 shadow-2xl text-white">
          
          {/* Background Glow Layer */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Workspace Board
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {workspace?.name || 'Workspace Board'}
                  </h1>
                  {workspace?.isArchived && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Archived (Edits Frozen)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">{workspace?.description}</p>
              </div>

              {/* Sprint Controls & Floating Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <CustomSelect
                  variant="dark"
                  options={sprints.map(s => ({ value: s._id, label: `${s.name} ${s.isActive ? '⚡ (Active)' : ''}` }))}
                  value={selectedSprintId}
                  onChange={(val) => setSelectedSprintId(val)}
                  placeholder="Select Sprint..."
                  className="w-56"
                />

                {user?.role === 'manager' && !workspace?.isArchived && (
                  <>
                    <button
                      onClick={() => setShowCreateSprintModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700/90 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Sprint
                    </button>

                    {activeSprint && (
                      <button
                        onClick={() => handleToggleSprintActive(activeSprint._id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border shadow-md ${
                          activeSprint.isActive
                            ? 'bg-white text-amber-600 dark:bg-slate-800 dark:text-amber-400 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700'
                            : 'bg-white text-emerald-600 dark:bg-slate-800 dark:text-emerald-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {activeSprint.isActive ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                        {activeSprint.isActive ? 'Deactivate Sprint' : 'Activate Sprint'}
                      </button>
                    )}

                    <button
                      disabled={!selectedSprintId}
                      onClick={() => setShowCreateTaskModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/30 border border-sky-400/30 transition-all disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> Create Task
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Task Search & Filter Toolbar with Floating White Controls */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Filter tasks by title..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-md transition-all"
                />
              </div>

              {/* Priority Filter Custom Select */}
              <CustomSelect
                variant="dark"
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'high', label: 'High Priority' },
                  { value: 'medium', label: 'Medium Priority' },
                  { value: 'low', label: 'Low Priority' }
                ]}
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
              />

              {/* Assignee Filter Custom Select */}
              <CustomSelect
                variant="dark"
                options={[
                  { value: 'all', label: 'All Team Assignees' },
                  { value: 'unassigned', label: 'Unassigned Tasks Only' },
                  ...(workspace?.members?.map((m) => ({ value: m._id, label: m.name })) || [])
                ]}
                value={assigneeFilter}
                onChange={(val) => setAssigneeFilter(val)}
              />
            </div>
          </div>
        </div>

        {/* MOBILE SWIMLANE TAB SWITCHER */}
        <div className="flex lg:hidden items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-6 overflow-x-auto shadow-sm">
          {columns.map(col => (
            <button
              key={col.key}
              onClick={() => setMobileTab(col.key)}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                mobileTab === col.key
                  ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {col.title} ({filteredTasks.filter(t => t.status === col.key).length})
            </button>
          ))}
        </div>

        {/* KANBAN BOARD COLUMNS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
            const isHiddenMobile = mobileTab !== col.key;

            return (
              <div
                key={col.key}
                className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 flex flex-col h-[75vh] shadow-sm ${
                  isHiddenMobile ? 'hidden lg:flex' : 'flex'
                }`}
              >
                
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black border shadow-sm ${col.color}`}>
                      {col.title}
                    </span>
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.map((task) => (
                    <div
                      key={task._id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 hover:border-sky-500/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group hover:-translate-y-1"
                    >
                      {/* Priority & Overdue Indicators */}
                      <div className="flex items-center justify-between mb-2.5">
                        {getPriorityBadge(task.priority)}
                        {isOverdue(task.dueDate, task.status) && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors line-clamp-2 mb-2">
                        {task.title}
                      </h4>

                      {/* Due Date & Time Display */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Due: {formatDateTime(task.dueDate)}</span>
                      </div>

                      {/* Labels */}
                      {task.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.labels.map((lbl, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              #{lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta Footer */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        {/* Assignee Avatar */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
                            {task.assignedTo ? (task.assignedTo.name || 'U').charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="truncate max-w-[100px] text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {task.assignedTo ? (task.assignedTo.name || 'Assigned') : 'Unassigned'}
                          </span>
                        </div>

                        {/* Comments count */}
                        <div className="flex items-center gap-1 text-slate-500 font-semibold">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.comments?.length || 0}</span>
                        </div>
                      </div>

                      {/* ROLE-GATED STATUS TRANSITION & ASSIGNMENT BUTTONS */}
                      {!workspace?.isArchived && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/40 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Employee Assignee status transition buttons */}
                          {user?.role === 'employee' && isAssignedToUser(task.assignedTo, user) && (
                            <>
                              {task.status === 'todo' && (
                                <button
                                  onClick={() => handleStatusTransition(task._id, 'in_progress')}
                                  className="w-full py-1.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs border border-sky-500/20 flex items-center justify-center gap-1 transition-all"
                                >
                                  Start Working <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {task.status === 'in_progress' && (
                                <button
                                  onClick={() => {
                                    setReviewModalTask(task);
                                    setReviewNote('');
                                  }}
                                  className="w-full py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 flex items-center justify-center gap-1 transition-all"
                                >
                                  Submit for Review <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </>
                          )}

                          {/* Manager Review Approval & Revision Loop buttons */}
                          {user?.role === 'manager' && task.status === 'review' && (
                            <div className="grid grid-cols-2 gap-1.5 w-full">
                              <button
                                onClick={() => {
                                  setRevisionModalTask(task);
                                  setRevisionNote('');
                                }}
                                className="py-1 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] border border-rose-500/20 flex items-center justify-center gap-1 transition-all"
                                title="Reject & request changes"
                              >
                                <RotateCcw className="w-3 h-3" /> Revision
                              </button>

                              <button
                                onClick={() => handleStatusTransition(task._id, 'done')}
                                className="py-1 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20 flex items-center justify-center gap-1 transition-all"
                                title="Approve task to done"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Approve
                              </button>
                            </div>
                          )}

                          {/* Manager Assignee Selector */}
                          {user?.role === 'manager' && (
                            <CustomSelect
                              options={[
                                { value: '', label: '-- Unassigned --' },
                                ...(workspace?.members?.map((m) => ({ value: m._id, label: `Assign: ${m.name}` })) || [])
                              ]}
                              value={task.assignedTo?._id || task.assignedTo || ''}
                              onChange={(val) => handleAssignTask(task._id, val)}
                              className="w-full mt-1"
                            />
                          )}

                        </div>
                      )}

                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </main>

      {/* Create Sprint Modal with Custom Date Pickers */}
      {showCreateSprintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Sprint</h3>
              <button onClick={() => setShowCreateSprintModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">Sprint Name</label>
                <input
                  type="text"
                  required
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="e.g. Sprint 1 - Core Foundation"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">Start Date</label>
                  <CustomDatePicker
                    value={newSprintStart}
                    onChange={(dateStr) => setNewSprintStart(dateStr)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">End Date</label>
                  <CustomDatePicker
                    value={newSprintEnd}
                    onChange={(dateStr) => setNewSprintEnd(dateStr)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateSprintModal(false)} className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal with Custom Separate Date & Time Pickers */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Task</h3>
              <button onClick={() => setShowCreateTaskModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement JWT verification"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows="2"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Details and acceptance criteria..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">Priority</label>
                <CustomSelect
                  options={[
                    { value: 'low', label: 'Low Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'high', label: 'High Priority' }
                  ]}
                  value={taskPriority}
                  onChange={(val) => setTaskPriority(val)}
                />
              </div>

              {/* SEPARATE CUSTOM DATE & TIME PICKER */}
              <DateTimePicker
                value={taskDueDate}
                onChange={(dateTimeStr) => setTaskDueDate(dateTimeStr)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">Assignee</label>
                <CustomSelect
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...(workspace?.members?.map((m) => ({ value: m._id, label: m.name })) || [])
                  ]}
                  value={taskAssignee}
                  onChange={(val) => setTaskAssignee(val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">Labels (comma-separated)</label>
                <input
                  type="text"
                  value={taskLabels}
                  onChange={(e) => setTaskLabels(e.target.value)}
                  placeholder="backend, api, high-priority"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-400 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & Comments Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityBadge(selectedTask.priority)}
                  <span className="text-xs text-slate-500 capitalize">{selectedTask.status.replace('_', ' ')}</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedTask.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Due: {formatDateTime(selectedTask.dueDate)}
                </p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedTask.description && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">{selectedTask.description}</p>
                </div>
              )}

              {/* Task Snapshot info if assignee deleted */}
              {selectedTask.lastAssignedUserSnapshot && !selectedTask.assignedTo && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                  Previously worked on by: {selectedTask.lastAssignedUserSnapshot.name} ({selectedTask.lastAssignedUserSnapshot.email})
                </div>
              )}

              {/* ACTION BUTTONS INSIDE TASK DETAILS MODAL (Only shown when user has valid actions) */}
              {!workspace?.isArchived && (
                <>
                  {/* Employee Status Buttons */}
                  {user?.role === 'employee' && isAssignedToUser(selectedTask.assignedTo, user) && (
                    <div className="pt-2">
                      {selectedTask.status === 'todo' && (
                        <button
                          onClick={() => {
                            handleStatusTransition(selectedTask._id, 'in_progress');
                            setSelectedTask(null);
                          }}
                          className="w-full py-2.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/25 transition-all"
                        >
                          Start Working <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {selectedTask.status === 'in_progress' && (
                        <button
                          onClick={() => {
                            setReviewModalTask(selectedTask);
                            setReviewNote('');
                          }}
                          className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/25 transition-all"
                        >
                          Submit for Review <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Manager Approval / Revision / Reassign */}
                  {user?.role === 'manager' && (
                    <div className="pt-2 space-y-3">
                      {selectedTask.status === 'review' && (
                        <div className="grid grid-cols-2 gap-2.5 w-full">
                          <button
                            onClick={() => {
                              setRevisionModalTask(selectedTask);
                              setRevisionNote('');
                            }}
                            className="py-2.5 px-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-md shadow-rose-500/25 transition-all"
                          >
                            <RotateCcw className="w-4 h-4" /> Revision
                          </button>

                          <button
                            onClick={() => {
                              handleStatusTransition(selectedTask._id, 'done');
                              setSelectedTask(null);
                            }}
                            className="py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/25 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Reassign Task</label>
                        <CustomSelect
                          options={[
                            { value: '', label: '-- Unassigned --' },
                            ...(workspace?.members?.map((m) => ({ value: m._id, label: `Assign: ${m.name}` })) || [])
                          ]}
                          value={selectedTask.assignedTo?._id || selectedTask.assignedTo || ''}
                          onChange={(val) => {
                            handleAssignTask(selectedTask._id, val);
                            setSelectedTask(null);
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Comments Section */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-500" /> Discussion Comments ({selectedTask.comments?.length || 0})
                </h4>

                <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
                  {selectedTask.comments?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No comments yet. Be the first to post!</p>
                  ) : (
                    selectedTask.comments?.map((c, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">{c.authorName || c.author?.name}</span>
                          <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form with Loading Spinner */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    disabled={postingComment}
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={postingComment || !newCommentText.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20"
                  >
                    {postingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post
                  </button>
                </form>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* Submit for Review Handover Note Modal */}
      {reviewModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" /> Submit for Review
              </h3>
              <button onClick={() => setReviewModalTask(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add an optional completion summary or handover note for the manager to review.
            </p>

            <form onSubmit={handleSubmitForReviewWithNote} className="space-y-4">
              <textarea
                rows="3"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Implemented Mongoose validation and verification tests. Ready for review!"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalTask(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Revision Feedback Request Modal */}
      {revisionModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-500" /> Request Task Revision
              </h3>
              <button onClick={() => setRevisionModalTask(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Explain the issue or describe what changes the employee needs to fix before approval.
            </p>

            <form onSubmit={handleRequestRevisionWithNote} className="space-y-4">
              <textarea
                rows="3"
                required
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="e.g. Please handle edge case validation when workspace is archived."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRevisionModalTask(null)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-2xl text-xs font-extrabold text-white bg-rose-500 hover:bg-rose-400 disabled:opacity-50 shadow-lg shadow-rose-500/25 transition-all flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Request Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

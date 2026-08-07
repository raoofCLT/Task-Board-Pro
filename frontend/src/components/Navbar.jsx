import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Kanban,
  FolderKanban,
  History,
  Users,
  LogOut,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = (role, className = 'w-4 h-4 text-white') => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className={className} />;
      case 'manager':
        return <Briefcase className={className} />;
      default:
        return <UserCheck className={className} />;
    }
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path !== '/dashboard' && path !== '/workspaces' && location.pathname.startsWith(path));

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/workspaces', label: 'Workspaces', icon: FolderKanban },
    { path: '/activity-logs', label: 'Activity Log', icon: History }
  ];

  if (user?.role === 'admin') {
    navLinks.push({ path: '/users', label: 'User Management', icon: Users });
  }

  return (
    <>
      <nav className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo - Links to Dashboard */}
            <div className="flex items-center gap-8">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform duration-300">
                  <Kanban className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                    TaskBoard<span className="text-sky-500 dark:text-sky-400">Pro</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                    Team Workflow
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/30 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop User Profile, Theme Switcher & Logout */}
            <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-800 pr-4">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md border ${
                    user?.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border-rose-500/30'
                      : user?.role === 'manager'
                      ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-500 dark:text-sky-400 border-sky-500/30'
                  }`}
                  title={`${user?.name} (${user?.role})`}
                >
                  {getRoleIcon(user?.role, 'w-4 h-4')}
                </div>

                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">
                    {user?.name}
                  </p>
                  <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400 capitalize leading-none">
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Actions Header */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Overlay Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-md z-40 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-x-0 top-16 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800/80 px-4 pt-3 pb-6 space-y-3 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* User Header in Mobile Menu */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md border ${
                    user?.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border-rose-500/30'
                      : user?.role === 'manager'
                      ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-500 dark:text-sky-400 border-sky-500/30'
                  }`}
                >
                  {getRoleIcon(user?.role, 'w-4 h-4')}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                    {user?.name}
                  </p>
                  <p className="text-xs font-semibold text-sky-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Logout Mobile */}
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

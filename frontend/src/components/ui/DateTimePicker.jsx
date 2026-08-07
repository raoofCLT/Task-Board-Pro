import React from 'react';
import { Calendar, Clock, Zap } from 'lucide-react';

export const DateTimePicker = ({ value, onChange, required = false, className = '' }) => {
  // Format preset dates helper
  const setPreset = (hoursFromNow) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursFromNow);
    d.setMinutes(0);
    d.setSeconds(0);

    // Format YYYY-MM-DDTHH:mm for datetime-local input
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    onChange(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          type="datetime-local"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm transition-all"
        />
      </div>

      {/* Quick Time Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" /> Presets:
        </span>
        
        <button
          type="button"
          onClick={() => setPreset(3)}
          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
        >
          In 3 Hours
        </button>

        <button
          type="button"
          onClick={() => setPreset(24)}
          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
        >
          Tomorrow
        </button>

        <button
          type="button"
          onClick={() => setPreset(72)}
          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
        >
          In 3 Days
        </button>
      </div>
    </div>
  );
};

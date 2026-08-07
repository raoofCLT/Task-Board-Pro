import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

export const CustomTimePicker = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial value format "HH:MM" (24h or 12h)
  const parseInitialTime = (timeStr) => {
    if (!timeStr) return { hour: '08', minute: '30', period: 'AM' };
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parts[1].slice(0, 2) : '00';
    let p = 'AM';

    if (h >= 12) {
      p = 'PM';
      if (h > 12) h -= 12;
    }
    if (h === 0) h = 12;

    return {
      hour: String(h).padStart(2, '0'),
      minute: String(m).padStart(2, '0'),
      period: p
    };
  };

  const initial = parseInitialTime(value);
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initial.period);

  useEffect(() => {
    if (value) {
      const updated = parseInitialTime(value);
      setSelectedHour(updated.hour);
      setSelectedMinute(updated.minute);
      setSelectedPeriod(updated.period);
    }
  }, [value]);

  const handleConfirmTime = () => {
    let h = parseInt(selectedHour, 10);
    if (selectedPeriod === 'PM' && h < 12) h += 12;
    if (selectedPeriod === 'AM' && h === 12) h = 0;
    const formatted24h = `${String(h).padStart(2, '0')}:${selectedMinute}`;
    onChange(formatted24h);
    setIsOpen(false);
  };

  const displayString = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

  const hourOptions = Array.from({ length: 12 }, (_, i) => {
    const val = String(i + 1).padStart(2, '0');
    return { value: val, label: val };
  });

  const minuteOptions = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => ({
    value: m,
    label: m
  }));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-left"
      >
        <span className="flex items-center gap-2 truncate font-medium">
          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          {displayString}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Centered Modal Backdrop & Dialog Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xs w-full text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 text-center">
              Select Time
            </h4>

            {/* Time Picker Controls using CustomSelect */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {/* Hour CustomSelect */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 text-center">Hour</label>
                <CustomSelect
                  options={hourOptions}
                  value={selectedHour}
                  onChange={(val) => setSelectedHour(val)}
                />
              </div>

              {/* Minute CustomSelect */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 text-center">Minute</label>
                <CustomSelect
                  options={minuteOptions}
                  value={selectedMinute}
                  onChange={(val) => setSelectedMinute(val)}
                />
              </div>

              {/* AM / PM Toggle */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 text-center">Period</label>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod(selectedPeriod === 'AM' ? 'PM' : 'AM')}
                  className="w-full h-9 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-black rounded-2xl flex items-center justify-center hover:bg-indigo-600/20 transition-all shadow-sm"
                >
                  {selectedPeriod}
                </button>
              </div>
            </div>

            {/* Action Footer Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmTime}
                className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all"
              >
                Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

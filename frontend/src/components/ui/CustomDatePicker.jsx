import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

export const CustomDatePicker = ({ value, onChange, label = 'Select Date', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Initial date parsing (YYYY-MM-DD)
  const parsedDate = value ? new Date(value) : new Date();
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const [currentYear, setCurrentYear] = useState(validDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(validDate.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(validDate.getDate());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
        setSelectedDay(d.getDate());
      }
    }
  }, [value]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthOptions = months.map((m, idx) => ({ value: idx, label: m }));
  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => ({ value: y, label: String(y) }));

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Days in month calculation
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year, month) => {
    const day = new Date(year, month, 1).getDay(); // 0 is Sunday
    return day === 0 ? 6 : day - 1; // Convert to Monday-indexed (0=Mo, 6=Su)
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const startOffset = getFirstDayOfWeek(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const handleConfirmDate = () => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(selectedDay).padStart(2, '0');
    const isoDateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
    onChange(isoDateString);
    setIsOpen(false);
  };

  // Format displayed value
  const displayString = value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set Date';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white text-slate-900 dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all text-left"
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
          {displayString}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Centered Modal Backdrop & Dialog Popup matching Image 2 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xs w-full text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Controls: Custom Selects for Month & Year */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <CustomSelect
                options={monthOptions}
                value={currentMonth}
                onChange={(val) => setCurrentMonth(Number(val))}
              />

              <CustomSelect
                options={yearOptions}
                value={currentYear}
                onChange={(val) => setCurrentYear(Number(val))}
              />
            </div>

            {/* Week Days Label Row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
              {weekDays.map((wd) => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-5">
              {/* Previous Month Offset Days */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`prev-${i}`} className="py-1.5 text-slate-300 dark:text-slate-700 font-medium">
                  {prevMonthDays - startOffset + i + 1}
                </div>
              ))}

              {/* Current Month Days */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum;
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/30'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Action Footer Buttons matching Image 2 */}
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
                onClick={handleConfirmDate}
                className="py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all"
              >
                Set Date
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

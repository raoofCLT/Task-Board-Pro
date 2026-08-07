import React from 'react';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';

export const DateTimePicker = ({ value, onChange, className = '' }) => {
  // ISO datetime string e.g. "2026-08-12T08:30" or ""
  let datePart = '';
  let timePart = '08:30';

  if (value) {
    const parts = value.split('T');
    datePart = parts[0] || '';
    timePart = parts[1] ? parts[1].slice(0, 5) : '08:30';
  }

  const handleDateChange = (newDate) => {
    datePart = newDate;
    if (datePart) {
      onChange(`${datePart}T${timePart}`);
    }
  };

  const handleTimeChange = (newTime) => {
    timePart = newTime;
    if (datePart) {
      onChange(`${datePart}T${timePart}`);
    } else {
      const todayIso = new Date().toISOString().split('T')[0];
      onChange(`${todayIso}T${timePart}`);
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1">Due Date</label>
        <CustomDatePicker
          value={datePart}
          onChange={handleDateChange}
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-400 mb-1">Due Time</label>
        <CustomTimePicker
          value={timePart}
          onChange={handleTimeChange}
        />
      </div>
    </div>
  );
};

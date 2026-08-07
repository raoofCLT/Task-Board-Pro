import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({ options, value, onChange, placeholder = 'Select option...', className = '', variant = 'default' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDarkVariant = variant === 'dark';

  const buttonClasses = isDarkVariant
    ? 'bg-slate-800/90 border-slate-700 text-white hover:bg-slate-800'
    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80';

  const dropdownClasses = isDarkVariant
    ? 'bg-slate-900/95 border-slate-700 text-white shadow-slate-950/80'
    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white';

  const optionHoverClasses = isDarkVariant
    ? 'text-slate-200 hover:bg-slate-800'
    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm transition-all text-left ${buttonClasses}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1.5 w-full border rounded-2xl shadow-2xl max-h-56 overflow-y-auto py-1 animate-fadeIn backdrop-blur-xl ${dropdownClasses}`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                opt.value === value
                  ? 'bg-sky-500/20 text-sky-400 font-bold'
                  : optionHoverClasses
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check className="w-3.5 h-3.5 text-sky-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

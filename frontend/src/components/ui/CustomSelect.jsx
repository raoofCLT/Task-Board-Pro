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

  const isBannerVariant = variant === 'dark';

  // Floating High-Contrast White in Light Mode, Slate in Dark Mode
  const buttonClasses = isBannerVariant
    ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/90 shadow-md'
    : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm';

  const dropdownClasses = isBannerVariant
    ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-2xl'
    : 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700 shadow-2xl';

  const optionHoverClasses = isBannerVariant
    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-left ${buttonClasses}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1.5 w-full border rounded-2xl shadow-2xl max-h-56 overflow-y-auto py-1.5 animate-fadeIn backdrop-blur-2xl ${dropdownClasses}`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors ${
                opt.value === value
                  ? 'bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 font-bold'
                  : optionHoverClasses
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

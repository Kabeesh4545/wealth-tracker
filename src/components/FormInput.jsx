import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  prefix,
  suffix,
  options,
  required = false,
  min,
  max,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = `input-${name}`;
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseInputClasses = `w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
    error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200'
  }`;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-xs">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <span className="text-slate-400 text-sm font-medium">{prefix}</span>
          </div>
        )}

        {options ? (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            className={`${baseInputClasses} ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat`}
          >
            <option value="">Select {label || 'option'}</option>
            {options.map((opt) => {
              const val = typeof opt === 'object' ? opt.value : opt;
              const lbl = typeof opt === 'object' ? opt.label : opt;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            id={inputId}
            type={effectiveType}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            max={max}
            autoCapitalize={type === 'email' || isPassword ? 'none' : undefined}
            autoCorrect={type === 'email' || isPassword ? 'off' : undefined}
            spellCheck={type === 'email' || isPassword ? false : undefined}
            inputMode={type === 'email' ? 'email' : undefined}
            className={`${baseInputClasses} ${prefix ? 'pl-9' : ''} ${isPassword ? 'pr-11' : suffix ? 'pr-9' : ''}`}
          />
        )}

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : suffix ? (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <span className="text-slate-400 text-sm font-medium">{suffix}</span>
          </div>
        ) : null}
      </div>

      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export const SearchableDropdown = ({
  label,
  name,
  value,
  onChange,
  error,
  options,
  placeholder = 'Search...',
  required = false,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="mb-4 relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-xl border bg-white text-slate-800 cursor-pointer flex justify-between items-center transition-all duration-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
          error ? 'border-red-400' : 'border-slate-200'
        }`}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value || `Select ${label || 'city'}`}
        </span>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto premium-glow">
          <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
            <input
              type="text"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-teal-500"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-teal-50 transition-colors ${
                    value === opt ? 'bg-teal-50/50 text-teal-700 font-medium' : 'text-slate-700'
                  }`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-4 py-2.5 text-sm text-slate-400 text-center">No results found</div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

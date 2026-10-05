import React from 'react';

const Select = React.forwardRef(({ label, icon, options, className = '', ...props }, ref) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <select 
          ref={ref}
          className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white ${icon ? 'pl-10' : ''}`}
          {...props}
        >
          {options.map((opt, i) => (
            <option key={i} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
});

Select.displayName = 'Select';
export default Select;

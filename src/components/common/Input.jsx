import React from 'react';

const Input = React.forwardRef(({ label, icon, className = '', ...props }, ref) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input 
          ref={ref}
          className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${icon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

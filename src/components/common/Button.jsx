import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm focus:ring-primary-500',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-500',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

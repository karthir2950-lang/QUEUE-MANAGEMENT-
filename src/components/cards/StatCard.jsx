import React from 'react';

const StatCard = ({ title, value, icon, bgClass, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-center gap-4 ${className}`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${bgClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;

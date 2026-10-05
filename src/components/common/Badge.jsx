import React from 'react';

const Badge = ({ status }) => {
  const getBadgeStyle = (statusName) => {
    switch (statusName.toLowerCase()) {
      case 'waiting':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'called':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'serving':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'completed':
      case 'confirmed': // Adding confirmed to match green
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'no show':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${getBadgeStyle(status)}`}>
      {status}
    </span>
  );
};

export default Badge;

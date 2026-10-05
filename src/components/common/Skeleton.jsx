import React from 'react';

const Skeleton = ({ className = '', type = 'text' }) => {
  const baseClass = 'animate-pulse bg-slate-200 rounded';
  
  if (type === 'card') {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6"></div>
        </div>
      </div>
    );
  }
  
  if (type === 'circle') {
    return <div className={`${baseClass} rounded-full ${className}`}></div>;
  }

  return <div className={`${baseClass} h-4 ${className}`}></div>;
};

export default Skeleton;

import React from 'react';

const Card = ({ title, children, actions, className = '', headerClassName = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col ${className}`}>
      {(title || actions) && (
        <div className={`px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 ${headerClassName}`}>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default Card;

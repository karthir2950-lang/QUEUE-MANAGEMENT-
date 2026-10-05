import React from 'react';
import { FileText } from 'lucide-react';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
        {icon || <FileText className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;

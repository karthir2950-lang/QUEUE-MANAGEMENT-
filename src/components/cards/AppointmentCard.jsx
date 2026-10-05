import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';

const AppointmentCard = ({ appointment }) => {
  return (
    <Card className="hover:border-primary-200 transition-colors">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-bold text-slate-900">{appointment.organizationName}</h4>
            <p className="text-sm text-slate-500">{appointment.serviceName}</p>
          </div>
          <Badge status={appointment.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-slate-500 mb-1">Date</p>
            <p className="font-medium text-slate-900">{appointment.date}</p>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Time</p>
            <p className="font-medium text-slate-900">{appointment.time}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your Token</p>
          <p className="text-2xl font-black text-primary-600">{appointment.token}</p>
        </div>
      </div>
    </Card>
  );
};

export default AppointmentCard;

import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';

const ServiceCard = ({ service, onBook }) => {
  return (
    <Card className="h-full flex flex-col justify-between hover:border-primary-300 transition-all hover:shadow-md">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-slate-900">{service.name}</h3>
          <Badge status={service.status} />
        </div>
        <p className="text-slate-600 text-sm mb-4">{service.organizationName}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Category</span>
            <span className="font-medium text-slate-700">{service.category || 'General'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Avg. Time</span>
            <span className="font-medium text-slate-700">{service.averageServiceTime} mins</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Currently Waiting</span>
            <span className="font-medium text-orange-600">{service.activeQueue}</span>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0 mt-auto">
        <Button variant="primary" className="w-full" onClick={() => onBook(service)}>
          Book Appointment
        </Button>
      </div>
    </Card>
  );
};

export default ServiceCard;

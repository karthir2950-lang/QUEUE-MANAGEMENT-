import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { serviceService } from '../../services/serviceService';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await serviceService.getAllServices();
        setServices(data || []);
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Our Services</h1>
          <p className="mt-4 text-xl text-slate-500">Discover organizations using SmartQueue</p>
        </div>
        
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading services...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <div key={service.id} className="card p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{service.name}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{service.description}</p>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Avg. Time</span>
                    <span className="font-medium text-slate-700">{service.average_service_time} min</span>
                  </div>
                </div>
                
                <Link to="/login" className="btn-primary w-full block text-center">Login to Book</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;

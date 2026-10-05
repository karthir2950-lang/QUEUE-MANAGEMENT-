import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Clock } from 'lucide-react';
import { adminService } from '../../services/adminService';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const servData = await adminService.getServices();
        setServices(servData);
      } catch (err) {
        setError("Failed to load services. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Services Directory</h2>
          <p className="text-slate-500 text-sm">Manage all services across organizations</p>
        </div>
        <button className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed" title="Backend API pending">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-white">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium">Service Name</th>
                <th className="p-4 font-medium">Organization</th>
                <th className="p-4 font-medium">Avg. Time</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                 <tr>
                    <td colSpan="4" className="p-6">
                      <Skeleton className="h-8 mb-2" />
                      <Skeleton className="h-8 mb-2" />
                      <Skeleton className="h-8" />
                    </td>
                 </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-red-500">{error}</td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8"><EmptyState message="No services found." /></td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{service.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        {service.organization || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {service.average_service_time} min
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors" title="Backend API pending">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Backend API pending">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminServicesPage;

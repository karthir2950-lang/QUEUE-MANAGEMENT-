import React, { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';

const StaffAppointments = () => {
  const [filter, setFilter] = useState('Today');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppts = async () => {
      try {
        setLoading(true);
        // We'll just fetch all for now, assuming staff wants to see their relevant data.
        // A real app might have GET /appointments/branch/...
        const data = await appointmentService.getAllAppointments();
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppts();
  }, []);

  const getFilteredAppointments = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    return appointments.filter(app => {
      let matchesFilter = true;
      if (filter === 'Today') {
        matchesFilter = app.appointment_date === todayStr;
      } else if (filter === 'Upcoming') {
        matchesFilter = ['PENDING', 'CONFIRMED'].includes(app.status) && app.appointment_date >= todayStr;
      } else if (filter === 'Completed') {
        matchesFilter = app.status === 'COMPLETED';
      } else if (filter === 'Cancelled') {
        matchesFilter = app.status === 'CANCELLED' || app.status === 'NO_SHOW';
      }

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        app.booking_id.toLowerCase().includes(searchLower) || 
        (app.token_number && app.token_number.toLowerCase().includes(searchLower)) ||
        String(app.user_id).includes(searchLower);

      return matchesFilter && matchesSearch;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Appointments</h2>
          <p className="text-slate-500 text-sm">Manage scheduled appointments</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['Today', 'Upcoming', 'Completed', 'Cancelled', 'All'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="relative min-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search user ID or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Booking ID</th>
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Token</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-500">Loading appointments...</td></tr>
              ) : filteredAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{app.booking_id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{app.user_id}</td>
                  <td className="px-6 py-4 text-slate-600">{app.service_name}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{app.appointment_date}</p>
                    <p className="text-sm text-slate-500">{app.appointment_time}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary-600">{app.token_number}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      app.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700' :
                      app.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                      app.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center justify-center p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No appointments found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAppointments;

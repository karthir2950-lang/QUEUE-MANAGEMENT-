import React, { useState, useEffect } from 'react';
import { Eye, Search, Download } from 'lucide-react';
import { adminService } from '../../services/adminService';
import DateFilter from '../../components/common/DateFilter';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({});

  useEffect(() => {
    const fetchAppts = async () => {
      try {
        setLoading(true);
        // Note: Admin endpoint doesn't currently filter by date in the backend for the list, 
        // but we can pass it if we add it later. For now it returns latest 100.
        const data = await adminService.getAppointments();
        setAppointments(data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppts();
  }, []);

  const handleExport = async () => {
    try {
      const blob = await adminService.exportAppointmentsCSV(dateRange);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'appointments_report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export appointments", err);
    }
  };

  const filteredAppts = appointments.filter(app => 
    (app.booking_id && app.booking_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.token && app.token.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.user && app.user.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Appointments</h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <DateFilter onChange={setDateRange} />
          <button 
            onClick={handleExport} 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-slate-700 font-medium"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search ID, Token, or User..." 
              className="input-field pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Booking ID</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Service Info</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Token</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Queue</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                 <tr>
                    <td colSpan="8" className="p-6">
                      <Skeleton className="h-8 mb-2" />
                      <Skeleton className="h-8 mb-2" />
                      <Skeleton className="h-8" />
                    </td>
                 </tr>
              ) : filteredAppts.length === 0 ? (
                 <tr><td colSpan="8" className="p-6"><EmptyState message="No appointments found." /></td></tr>
              ) : filteredAppts.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{app.booking_id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{app.user || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{app.service}</p>
                    <p className="text-xs text-slate-500">{app.organization} - {app.branch}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900">{app.date}</p>
                    <p className="text-xs text-slate-500">{app.time}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-primary-600">{app.token || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                      app.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700' :
                      app.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                      app.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {app.queue_status ? (
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        app.queue_status === 'WAITING' ? 'bg-orange-50 text-orange-700' :
                        app.queue_status === 'SERVING' ? 'bg-purple-50 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.queue_status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAppointments;

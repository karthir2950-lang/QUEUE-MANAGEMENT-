import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { queueService } from '../../services/queueService';
import { wsService } from '../../services/websocketService';

const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const data = await queueService.getQueueList();
      setQueueList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    wsService.connect('staff');

    const unsubUpdate = wsService.on('QUEUE_UPDATED', fetchQueue);
    
    return () => {
      unsubUpdate();
      wsService.disconnect();
    };
  }, []);

  const waitingCount = queueList.filter(q => q.queue_status === 'WAITING').length;
  const activeEntry = queueList.find(q => q.queue_status === 'CALLED' || q.queue_status === 'SERVING');
  const completedCount = queueList.filter(q => q.queue_status === 'COMPLETED').length;
  const todaysAppointments = queueList.slice(0, 10); // just show a few

  const handleCallNext = async () => {
    navigate('/staff/queue');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{user?.name || 'Staff'}'s Dashboard</h2>
          <p className="text-slate-500">Overview</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 font-medium text-sm border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Live
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Appointments" value={queueList.length} icon={<Clock className="w-6 h-6 text-blue-600" />} bg="bg-blue-50" />
        <StatCard title="Waiting Customers" value={waitingCount} icon={<Users className="w-6 h-6 text-orange-600" />} bg="bg-orange-50" />
        <StatCard title="Currently Serving" value={activeEntry ? 1 : 0} icon={<UserCheck className="w-6 h-6 text-primary-600" />} bg="bg-primary-50" />
        <StatCard title="Completed Today" value={completedCount} icon={<CheckCircle className="w-6 h-6 text-green-600" />} bg="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Quick Queue Control */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 text-center border-t-4 border-t-primary-500">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Currently Serving</p>
            <h2 className="text-5xl font-black text-slate-900 mb-2">{activeEntry ? activeEntry.token_number : '---'}</h2>
            <p className="text-slate-600 font-medium mb-6">{activeEntry ? activeEntry.service_name : 'No active service'}</p>
            
            <div className="space-y-3">
              <button onClick={handleCallNext} className="btn-primary w-full text-lg py-3">Open Queue Control</button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to="/staff/queue" className="text-primary-600 hover:text-primary-800 font-medium flex items-center justify-center gap-1">
                Open Full Queue Control <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Queue / Appointments */}
        <div className="lg:col-span-2 card flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Queue List</h3>
            <Link to="/staff/appointments" className="text-sm text-primary-600 font-medium">View All</Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Token</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                   <tr><td colSpan="4" className="text-center py-8">Loading queue...</td></tr>
                ) : todaysAppointments.length === 0 ? (
                   <tr><td colSpan="4" className="text-center py-8">No queue entries today.</td></tr>
                ) : (
                  todaysAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{app.token_number}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{app.customer_name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          app.queue_status === 'CALLED' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          app.queue_status === 'SERVING' ? 'bg-green-50 text-green-700 border border-green-200' :
                          app.queue_status === 'WAITING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {app.queue_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <Link to="/staff/queue" className="text-primary-600 hover:text-primary-800 font-medium text-sm">Control</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg }) => (
  <div className="card p-6 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

export default StaffDashboard;

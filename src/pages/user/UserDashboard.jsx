import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Activity, Bell } from 'lucide-react';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { queueService } from '../../services/queueService';
import { wsService } from '../../services/websocketService';

const UserDashboard = () => {
  const { user } = useAuth();
  
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [activeQueue, setActiveQueue] = useState(null);
  const [wsStatus, setWsStatus] = useState('Connecting...');

  const fetchAppts = async () => {
    try {
      const appts = await appointmentService.getMyBookings();
      setRecentAppointments(appts.slice(0, 5));
      
      const upcoming = appts.find(a => ['PENDING', 'CONFIRMED'].includes(a.status));
      setUpcomingAppointment(upcoming || null);
      
      const activeAppt = appts.find(a => ['WAITING', 'CALLED', 'SERVING'].includes(a.queue_status));
      if (activeAppt && activeAppt.queue_id) {
        const qData = await queueService.getQueueDetails(activeAppt.queue_id);
        setActiveQueue(qData);
        wsService.connect(qData.queue_id);
      }
    } catch (err) {
      console.error("Failed to load dashboard bookings", err);
    }
  };

  useEffect(() => {
    fetchAppts();

    const unsubStatus = wsService.on('status', (status) => setWsStatus(status));
    const unsubUpdate = wsService.on('QUEUE_UPDATED', fetchAppts);
    
    return () => {
      unsubStatus();
      unsubUpdate();
      wsService.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, {user?.name || 'User'} 👋</h2>
        <p className="text-slate-500">Here's what's happening with your appointments today.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointment Card */}
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" />
              Upcoming Appointment
            </h3>
          </div>
          
          {upcomingAppointment ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Service</p>
                <p className="font-medium text-slate-900">{upcomingAppointment.service_name}</p>
                <p className="text-xs text-slate-400">{upcomingAppointment.organization_name} - {upcomingAppointment.branch_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Date & Time</p>
                  <p className="font-semibold text-slate-900 text-sm">{upcomingAppointment.appointment_date}</p>
                  <p className="font-semibold text-slate-900 text-sm">{upcomingAppointment.appointment_time}</p>
                </div>
                <div className="bg-primary-50 p-3 rounded-lg text-center flex flex-col justify-center">
                  <p className="text-xs text-primary-600 mb-1">Token</p>
                  <p className="font-bold text-xl text-primary-700">{upcomingAppointment.token_number}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 py-4 text-center">No upcoming appointments.</p>
          )}
        </div>

        {/* Live Queue Status */}
        <div className="card p-6 border-l-4 border-l-orange-500 relative">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Live Queue Status
            </h3>
            {activeQueue && (
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${wsStatus === 'Live' ? 'text-orange-600 bg-orange-50' : 'text-slate-600 bg-slate-100'}`}>
                {wsStatus === 'Live' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
                {wsStatus}
              </span>
            )}
          </div>
          
          {activeQueue ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-slate-900">{activeQueue.organization}</p>
                <p className="text-sm text-slate-500">{activeQueue.service}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-slate-500 mb-1">Serving</p>
                  <p className="font-bold text-lg text-slate-900">{activeQueue.current_token || '---'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-center border-2 border-primary-100">
                  <p className="text-xs text-slate-500 mb-1">Your Token</p>
                  <p className="font-bold text-lg text-slate-900">{activeQueue.your_token}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-orange-600 mb-1">Ahead</p>
                  <p className="font-bold text-lg text-orange-700">{activeQueue.people_ahead}</p>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Est. Wait Time:</span>
                  <span className="font-semibold text-slate-900">{activeQueue.estimated_wait_time} mins {activeQueue.prediction_source === 'AI' && <span className="text-xs text-purple-600 ml-1">✨ AI</span>}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
               <p className="text-slate-500 mb-4">You are not currently waiting in any queue.</p>
               <Link to="/user/book" className="btn-secondary text-sm">Join a Queue</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/user/book" className="card p-4 hover:border-primary-300 hover:shadow-md transition-all text-center group cursor-pointer">
            <div className="w-10 h-10 mx-auto bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">Book Appointment</p>
          </Link>
          <Link to="/user/services" className="card p-4 hover:border-primary-300 hover:shadow-md transition-all text-center group cursor-pointer">
            <div className="w-10 h-10 mx-auto bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">Join Queue</p>
          </Link>
          <Link to="/user/bookings" className="card p-4 hover:border-primary-300 hover:shadow-md transition-all text-center group cursor-pointer">
            <div className="w-10 h-10 mx-auto bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">My Bookings</p>
          </Link>
          <Link to="/user/queue" className="card p-4 hover:border-primary-300 hover:shadow-md transition-all text-center group cursor-pointer">
            <div className="w-10 h-10 mx-auto bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700">Track Queue</p>
          </Link>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Recent Appointments</h3>
          <Link to="/user/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Booking ID</th>
                <th className="px-6 py-3 font-medium">Service</th>
                <th className="px-6 py-3 font-medium">Date & Time</th>
                <th className="px-6 py-3 font-medium">Token</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentAppointments.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-slate-500">No recent appointments.</td></tr>
              ) : recentAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{app.booking_id}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{app.service_name}</p>
                    <p className="text-xs text-slate-500">{app.organization_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900">{app.appointment_date}</p>
                    <p className="text-xs text-slate-500">{app.appointment_time}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{app.token_number}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                      app.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      app.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-100' :
                      app.queue_status === 'SERVING' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link to="/user/queue" className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                      View
                    </Link>
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

export default UserDashboard;

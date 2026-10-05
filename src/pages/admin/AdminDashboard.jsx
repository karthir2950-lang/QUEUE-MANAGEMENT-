import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, Clock, CheckCircle, BarChart3, AlertCircle } from 'lucide-react';
import { adminAnalyticsService } from '../../services/adminAnalyticsService';
import StatCard from '../../components/cards/StatCard';
import DateFilter from '../../components/common/DateFilter';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const AdminDashboard = () => {
  const [dateRange, setDateRange] = useState({});
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [services, setServices] = useState([]);
  const [queuePerf, setQueuePerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async (range) => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, trendsData, servicesData, queueData] = await Promise.all([
        adminAnalyticsService.getOverview(range),
        adminAnalyticsService.getAppointmentTrends({ ...range, period: 'daily' }),
        adminAnalyticsService.getServicePerformance(range),
        adminAnalyticsService.getQueuePerformance(range)
      ]);
      setOverview(overviewData);
      setTrends(trendsData);
      setServices(servicesData);
      setQueuePerf(queueData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(dateRange).length > 0) {
      fetchDashboardData(dateRange);
    }
  }, [dateRange]);

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-700 mb-2">{error}</h3>
        <button 
          onClick={() => fetchDashboardData(dateRange)} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxTrends = trends.length > 0 ? Math.max(...trends.map(t => t.total)) || 1 : 1;
  const maxService = services.length > 0 ? Math.max(...services.map(s => s.total_appointments)) || 1 : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Overview</h2>
        </div>
        <DateFilter onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : overview && queuePerf ? (
          <>
            <StatCard title="Total Users" value={overview.total_users.toLocaleString()} icon={<Users className="w-6 h-6 text-blue-600" />} bg="bg-blue-50" />
            <StatCard title="Total Appointments" value={overview.total_appointments} icon={<Calendar className="w-6 h-6 text-indigo-600" />} bg="bg-indigo-50" />
            <StatCard title="Active Services" value={overview.total_services} icon={<Activity className="w-6 h-6 text-green-600" />} bg="bg-green-50" />
            <StatCard title="No Shows" value={overview.no_show_appointments} icon={<Users className="w-6 h-6 text-orange-600" />} bg="bg-orange-50" />
            <StatCard title="Completed" value={overview.completed_appointments} icon={<CheckCircle className="w-6 h-6 text-teal-600" />} bg="bg-teal-50" />
            <StatCard title="Avg Wait Time" value={`${queuePerf.average_waiting_time} min`} icon={<Clock className="w-6 h-6 text-purple-600" />} bg="bg-purple-50" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" /> Platform Activity (Appointments)
          </h3>
          <div className="h-64 flex items-end justify-between px-2 pb-2 border-b border-slate-100">
            {loading ? (
               <Skeleton className="w-full h-full rounded-md" />
            ) : trends.length === 0 ? (
              <EmptyState message="No analytics data available for the selected period." />
            ) : (
              trends.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-2 w-full">
                  <div 
                    className="w-4/5 bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600" 
                    style={{ height: `${(day.total / maxTrends) * 100}%`, minHeight: day.total > 0 ? '4px' : '0' }}
                    title={`${day.total} appointments`}
                  ></div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap overflow-hidden overflow-ellipsis w-full text-center">
                    {day.date.split('-').slice(1).join('/')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" /> Service Demand
          </h3>
          <div className="space-y-4 mt-8 max-h-64 overflow-y-auto pr-2">
            {loading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-8 rounded-md mb-2" />)
            ) : services.length === 0 ? (
              <EmptyState message="No analytics data available for the selected period." />
            ) : (
              services.map((service, i) => (
                <div key={service.service_name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{service.service_name}</span>
                    <span className="text-slate-500">{service.total_appointments} requests</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'][i%4]}`} 
                      style={{ width: `${(service.total_appointments / maxService) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

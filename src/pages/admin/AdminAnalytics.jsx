import React, { useState, useEffect } from 'react';
import { adminAnalyticsService } from '../../services/adminAnalyticsService';
import DateFilter from '../../components/common/DateFilter';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminAnalytics = () => {
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
  const [dateRange, setDateRange] = useState({});
  const [trends, setTrends] = useState([]);
  const [overview, setOverview] = useState(null);
  const [peakHours, setPeakHours] = useState([]);
  const [services, setServices] = useState([]);
  const [orgs, setOrgs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (range) => {
    try {
      setLoading(true);
      setError(null);
      const [trendsData, overviewData, peakData, servicesData, orgsData] = await Promise.all([
        adminAnalyticsService.getAppointmentTrends({ ...range, period: 'daily' }),
        adminAnalyticsService.getOverview(range),
        adminAnalyticsService.getPeakHours(range),
        adminAnalyticsService.getServicePerformance(range),
        adminAnalyticsService.getOrganizationPerformance(range)
      ]);
      setTrends(trendsData);
      setOverview(overviewData);
      setPeakHours(peakData);
      setServices(servicesData);
      setOrgs(orgsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(dateRange).length > 0) {
      fetchAnalytics(dateRange);
    }
  }, [dateRange]);

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-700 mb-2">{error}</h3>
        <button 
          onClick={() => fetchAnalytics(dateRange)} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const appointmentStatusData = overview ? [
    { name: 'Completed', value: overview.completed_appointments },
    { name: 'Cancelled', value: overview.cancelled_appointments },
    { name: 'No Show', value: overview.no_show_appointments },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics & Reports</h2>
          <p className="text-slate-500 text-sm">System performance and usage statistics</p>
        </div>
        <DateFilter onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Appointment Trend Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Appointment Trends</h3>
          <div className="h-80 w-full">
            {loading ? <Skeleton className="w-full h-full rounded-md" /> : trends.length === 0 ? <EmptyState message="No analytics data available for the selected period." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Line type="monotone" name="Total" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Completed" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Appointment Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Appointment Status</h3>
          <div className="h-80 w-full">
            {loading ? <Skeleton className="w-full h-full rounded-md" /> : appointmentStatusData.length === 0 ? <EmptyState message="No analytics data available for the selected period." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Peak Hours Activity</h3>
          <div className="h-80 w-full">
            {loading ? <Skeleton className="w-full h-full rounded-md" /> : peakHours.length === 0 ? <EmptyState message="No analytics data available for the selected period." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" name="Appointments" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Organization Performance Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Organization Appointments</h3>
          <div className="h-80 w-full">
            {loading ? <Skeleton className="w-full h-full rounded-md" /> : orgs.length === 0 ? <EmptyState message="No analytics data available for the selected period." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgs} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="organization_name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="appointments" name="Total Appointments" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Service Performance Chart (Avg Wait Time) */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Average Wait Time by Service (mins)</h3>
          <div className="h-80 w-full">
            {loading ? <Skeleton className="w-full h-full rounded-md" /> : services.length === 0 ? <EmptyState message="No analytics data available for the selected period." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={services} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="service_name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="average_waiting_time" name="Avg Wait (min)" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;

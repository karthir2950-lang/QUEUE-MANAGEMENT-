import React, { useState, useEffect } from 'react';
import { Eye, X, Activity, Clock, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import { useToast } from '../../components/common/Toast';
import QRCode from 'react-qr-code';

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  
  const { addToast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getMyBookings();
      setAppointments(data);
    } catch (err) {
      addToast("Failed to load your bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await appointmentService.cancelAppointment(id);
        addToast("Appointment cancelled successfully.", "success");
        fetchBookings();
      } catch (err) {
        addToast(err.response?.data?.detail || "Failed to cancel appointment", "error");
      }
    }
  };

  const filteredAppointments = appointments.filter(app => {
    if (activeTab === 'Upcoming') return ['PENDING', 'CONFIRMED'].includes(app.status);
    if (activeTab === 'Completed') return app.status === 'COMPLETED';
    if (activeTab === 'Cancelled') return app.status === 'CANCELLED' || app.status === 'NO_SHOW';
    return true;
  });

  const handleViewQR = async (id) => {
    setQrLoading(true);
    setShowQRModal(true);
    try {
      const resp = await appointmentService.getAppointmentQR(id);
      setQrData(resp.token);
    } catch (err) {
      addToast(err.response?.data?.detail || "Failed to load QR code", "error");
      setShowQRModal(false);
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Bookings</h2>
          <p className="text-slate-500 text-sm">Manage your past and upcoming appointments</p>
        </div>
        <Link to="/user/book" className="btn-primary text-sm">Book New</Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {['Upcoming', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Booking ID & Token</th>
                <th className="px-6 py-4 font-medium">Service Info</th>
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr>
                   <td colSpan="5" className="p-8 text-center text-slate-500">Loading your bookings...</td>
                 </tr>
              ) : filteredAppointments.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{app.booking_id}</p>
                    <p className="text-sm font-bold text-primary-600">Token: {app.token_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{app.service_name}</p>
                    <p className="text-sm text-slate-500">{app.organization_name} - {app.branch_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-900 font-medium">{app.appointment_date}</p>
                    <p className="text-sm text-slate-500">{app.appointment_time}</p>
                  </td>
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
                  <td className="px-6 py-4 text-right space-x-2">
                    {(app.status === 'CONFIRMED' || app.queue_status === 'SERVING') ? (
                      <Link to="/user/queue" className="inline-flex items-center justify-center p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors" title="Track Queue">
                        <Activity className="w-4 h-4" />
                      </Link>
                    ) : null}
                    
                    <button className="inline-flex items-center justify-center p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>

                    {(app.status === 'CONFIRMED' || app.status === 'PENDING') && (
                      <button onClick={() => handleViewQR(app.id)} className="inline-flex items-center justify-center p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors" title="View QR">
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    
                    {(activeTab === 'Upcoming') && (
                      <button onClick={() => handleCancel(app.id)} className="inline-flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Cancel Booking">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No bookings found</h3>
            <p className="text-slate-500">You don't have any {activeTab.toLowerCase()} appointments.</p>
          </div>
        )}
      </div>
      
      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Check-in QR Code</h3>
              <button onClick={() => setShowQRModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center bg-white min-h-[250px]">
              {qrLoading ? (
                <div className="text-slate-500 animate-pulse text-sm">Loading QR Code...</div>
              ) : qrData ? (
                <>
                  <div className="bg-white p-4 inline-block rounded-xl shadow-sm border border-slate-100 mb-4">
                    <QRCode value={qrData} size={180} />
                  </div>
                  <p className="text-sm text-slate-500 text-center">Present this QR code to staff upon arrival for instant check-in.</p>
                </>
              ) : (
                <div className="text-red-500 text-sm">QR Code not available.</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <button onClick={() => setShowQRModal(false)} className="btn-primary w-full py-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

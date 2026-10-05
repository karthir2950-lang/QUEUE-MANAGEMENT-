import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import StaffLayout from './layouts/StaffLayout';
import AdminLayout from './layouts/AdminLayout';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Contact from './pages/public/Contact';
import NotFound from './pages/public/NotFound';
import AIAssistant from './components/common/AIAssistant';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserServices from './pages/user/UserServices';
import BookAppointment from './pages/user/BookAppointment';
import MyBookings from './pages/user/MyBookings';
import LiveQueue from './pages/user/LiveQueue';
import UserProfile from './pages/user/UserProfile';
import UserNotifications from './pages/user/UserNotifications';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffQueueControl from './pages/staff/StaffQueueControl';
import StaffAppointments from './pages/staff/StaffAppointments';
import StaffProfile from './pages/staff/StaffProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStaff from './pages/admin/AdminStaff';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminQueues from './pages/admin/AdminQueues';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminDatasets from './pages/admin/AdminDatasets';
import AdminSettings from './pages/admin/AdminSettings';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* User Routes */}
            <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
              <Route path="/user" element={<UserLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<UserDashboard />} />
                <Route path="services" element={<UserServices />} />
                <Route path="book" element={<BookAppointment />} />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="queue" element={<LiveQueue />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="notifications" element={<UserNotifications />} />
              </Route>
            </Route>

            {/* Staff Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']} />}>
              <Route path="/staff" element={<StaffLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="queue" element={<StaffQueueControl />} />
                <Route path="appointments" element={<StaffAppointments />} />
                <Route path="profile" element={<StaffProfile />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="organizations" element={<AdminOrganizations />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="queues" element={<AdminQueues />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="datasets" element={<AdminDatasets />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIAssistant />
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

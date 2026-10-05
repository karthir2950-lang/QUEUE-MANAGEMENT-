import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { LayoutDashboard, Calendar, Clock, BookOpen, User, Bell, Search, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { name: 'Find Services', path: 'services', icon: Search },
    { name: 'Book Appointment', path: 'book', icon: Calendar },
    { name: 'My Bookings', path: 'bookings', icon: BookOpen },
    { name: 'Live Queue', path: 'queue', icon: Activity },
    { name: 'Notifications', path: 'notifications', icon: Bell },
    { name: 'Profile', path: 'profile', icon: User },
  ];

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    const item = menuItems.find(m => m.path === path);
    return item ? item.name : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <Sidebar menuItems={menuItems} basePath="/user" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <DashboardHeader 
          title={getPageTitle()} 
          userName={user?.name || "User"} 
          role={user?.role || "CUSTOMER"}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;

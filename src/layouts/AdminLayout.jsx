import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { LayoutDashboard, Users, UserCog, Building2, Briefcase, Calendar, Activity, BarChart3, Settings, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { name: 'Users', path: 'users', icon: Users },
    { name: 'Staff', path: 'staff', icon: UserCog },
    { name: 'Organizations', path: 'organizations', icon: Building2 },
    { name: 'Services', path: 'services', icon: Briefcase },
    { name: 'Appointments', path: 'appointments', icon: Calendar },
    { name: 'Queue Monitoring', path: 'queues', icon: Activity },
    { name: 'Analytics', path: 'analytics', icon: BarChart3 },
    { name: 'Datasets & AI', path: 'datasets', icon: Database },
    { name: 'Settings', path: 'settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    const item = menuItems.find(m => m.path === path);
    return item ? item.name : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar menuItems={menuItems} basePath="/admin" />
      
      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <DashboardHeader 
          title={getPageTitle()} 
          userName={user?.name || "Admin User"} 
          role={user?.role || "SYSTEM ADMINISTRATOR"}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

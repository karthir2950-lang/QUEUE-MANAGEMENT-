import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const DashboardHeader = ({ title, userName, role, onMenuClick }) => {
  const { unreadCount } = useNotifications();
  
  return (
    <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="md:hidden mr-4 text-slate-500 hover:text-slate-700 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900 hidden sm:block">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Search..."
          />
        </div>
        
        <Link to={`/${role.toLowerCase()}/notifications`} className="relative p-2 text-slate-400 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
            {userName.charAt(0)}
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-slate-700">{userName}</p>
            <p className="text-xs text-slate-500">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

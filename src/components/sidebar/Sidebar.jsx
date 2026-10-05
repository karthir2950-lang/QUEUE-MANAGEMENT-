import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LogOut, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ menuItems, basePath }) => {
  const { logout } = useAuth();
  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-screen fixed top-0 left-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary-600" />
          <span className="font-bold text-xl text-slate-900">SmartQueue</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={`${basePath}/${item.path}`}
              end={item.path === ''}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

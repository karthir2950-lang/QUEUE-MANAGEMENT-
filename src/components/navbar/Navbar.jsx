import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X, Clock } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <Clock className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-xl text-slate-900">SmartQueue</span>
            </Link>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-8">
            <Link to="/" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">Home</Link>
            <Link to="/services" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">Services</Link>
            <Link to="/about" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">About</Link>
            <Link to="/contact" className="text-slate-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors">Contact</Link>
            
            <div className="flex items-center gap-4 ml-4 border-l border-slate-200 pl-4">
              <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium text-sm transition-colors">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </div>
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link to="/" className="block pl-3 pr-4 py-2 border-l-4 border-primary-500 text-primary-700 bg-primary-50 text-base font-medium">Home</Link>
            <Link to="/services" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 text-base font-medium">Services</Link>
            <Link to="/about" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 text-base font-medium">About</Link>
            <Link to="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 text-base font-medium">Contact</Link>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <Link to="/login" className="block pl-3 pr-4 py-2 text-base font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50">Login</Link>
              <Link to="/register" className="block pl-3 pr-4 py-2 text-base font-medium text-primary-600 hover:text-primary-800 hover:bg-slate-50">Get Started</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

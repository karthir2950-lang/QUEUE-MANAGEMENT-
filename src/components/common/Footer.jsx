import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Globe, MessageSquare, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Clock className="h-8 w-8 text-primary-500" />
              <span className="font-bold text-xl text-white">SmartQueue</span>
            </Link>
            <p className="text-sm text-slate-400 mt-4">
              Revolutionizing waiting experiences with AI-powered queue and appointment management.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-sm hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link to="/services" className="text-sm hover:text-white transition-colors">Hospitals</Link></li>
              <li><Link to="/services" className="text-sm hover:text-white transition-colors">Banks</Link></li>
              <li><Link to="/services" className="text-sm hover:text-white transition-colors">Government</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Globe className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><MessageSquare className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Mail className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors"><Phone className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-800 text-sm text-center text-slate-400">
          <p>&copy; {new Date().getFullYear()} SmartQueue. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

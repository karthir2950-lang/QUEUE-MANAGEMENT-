import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Clock } from 'lucide-react';
import Button from '../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';

const PublicLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar with scroll effect */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring" }}>
                  <Clock className="h-8 w-8 text-primary-600" />
                </motion.div>
                <span className="font-black text-2xl tracking-tight text-slate-900 group-hover:text-primary-600 transition-colors">SmartQueue</span>
              </Link>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/services">Services</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
              
              <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Login</Link>
                <Link to="/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="primary">Get Started</Button>
                  </motion.div>
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-slate-600 hover:text-slate-900 p-2"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (Animated) */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl z-50 md:hidden flex flex-col"
              >
                <div className="p-4 border-b flex justify-between items-center">
                  <span className="font-bold text-xl text-slate-900">Menu</span>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2"><X className="w-6 h-6"/></button>
                </div>
                <div className="px-4 py-6 space-y-4 flex flex-col">
                  <MobileNavLink to="/">Home</MobileNavLink>
                  <MobileNavLink to="/services">Services</MobileNavLink>
                  <MobileNavLink to="/about">About</MobileNavLink>
                  <MobileNavLink to="/contact">Contact</MobileNavLink>
                  
                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-4">
                    <Link to="/login" className="w-full text-center py-3 font-medium text-slate-900 bg-slate-50 rounded-xl">Login</Link>
                    <Link to="/register" className="w-full text-center py-3 font-medium text-white bg-primary-600 rounded-xl">Get Started</Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-primary-400" />
              <span className="font-bold text-xl">SmartQueue</span>
            </div>
            <p className="text-slate-400 text-sm">Revolutionizing waiting experiences across healthcare, finance, and public services with AI and real-time tracking.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <div className="space-y-2 flex flex-col text-sm">
              <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
              <Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link>
              <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Services</h4>
            <div className="space-y-2 flex flex-col text-sm">
              <Link to="/services" className="text-slate-400 hover:text-white transition-colors">Healthcare</Link>
              <Link to="/services" className="text-slate-400 hover:text-white transition-colors">Banking</Link>
              <Link to="/services" className="text-slate-400 hover:text-white transition-colors">Government</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavLink = ({ to, children }) => (
  <Link to={to} className="text-slate-600 hover:text-primary-600 font-medium transition-colors relative group">
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-300 group-hover:w-full"></span>
  </Link>
);

const MobileNavLink = ({ to, children }) => (
  <Link to={to} className="text-slate-600 hover:text-primary-600 font-medium text-lg px-2 py-2 hover:bg-slate-50 rounded-lg transition-colors">
    {children}
  </Link>
);

export default PublicLayout;

import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Activity, Zap, Bell, BarChart3, Smartphone, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50, damping: 15 } }
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 50, damping: 15 } }
};

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Premium Animated Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-slate-50 min-h-[90vh] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50 animate-gradient-xy z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content staggered reveal */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                </span>
                SmartQueue v2.0 is Live
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Wait Less. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                  Experience More.
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
                Book appointments, join queues remotely, and get real-time AI-powered wait estimates. Join the queue before you even leave home.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Link to="/user/book" className="w-full sm:w-auto">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="primary" size="lg" className="w-full shadow-lg shadow-primary-500/30">Book Appointment</Button>
                  </motion.div>
                </Link>
                <Link to="/user/services" className="w-full sm:w-auto">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="secondary" size="lg" className="w-full">Join Live Queue</Button>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Right Side - Interactive Queue Visual */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, type: 'spring' }}
              className="relative lg:ml-auto w-full max-w-md"
            >
              {/* Decorative floating elements */}
              <motion.div 
                animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-12 -right-8 w-24 h-24 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70"
              />
              <motion.div 
                animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70"
              />

              {/* Glassmorphic Dashboard */}
              <div className="glassmorphism rounded-3xl p-8 relative z-10 border border-white/40 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-purple-500"></div>
                
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">General Consultation</h3>
                    <p className="text-sm text-slate-500 font-medium">City Care Hospital</p>
                  </div>
                  <Badge status="Waiting" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <motion.div whileHover={{ y: -2 }} className="bg-white/60 p-4 rounded-2xl border border-white/50 text-center shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1 tracking-wider">Serving</p>
                    <p className="text-4xl font-black text-slate-900">A019</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -2 }} className="bg-primary-500 p-4 rounded-2xl border border-primary-400 text-center shadow-lg shadow-primary-500/30">
                    <p className="text-xs text-primary-100 font-bold uppercase mb-1 tracking-wider">Your Token</p>
                    <p className="text-4xl font-black text-white">A025</p>
                  </motion.div>
                </div>

                <div className="bg-white/60 rounded-2xl p-6 border border-white/50 shadow-sm">
                  <div className="flex justify-between mb-4">
                    <div className="text-center w-1/2 border-r border-slate-200/50">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">People Ahead</p>
                      <p className="text-2xl font-bold text-slate-900">5</p>
                    </div>
                    <div className="text-center w-1/2">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Wait Time</p>
                      <p className="text-2xl font-bold text-slate-900">22 <span className="text-sm font-normal text-slate-500">min</span></p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                      className="bg-primary-600 h-full rounded-full relative"
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/30 animate-pulse"></div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Features Section - Scroll Reveal */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Powerful Features</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Everything you need to manage lines, save time, and streamline the customer experience with intelligent automation.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <FeatureCard icon={<Calendar />} title="Smart Booking" desc="Easily schedule appointments from anywhere at your convenience, seamlessly integrated into your calendar." />
            <FeatureCard icon={<Activity />} title="Live Queue Tracking" desc="Track your exact position in line live from your smartphone, without waiting in a crowded lobby." />
            <FeatureCard icon={<Clock />} title="AI Wait Prediction" desc="Get highly accurate algorithmic estimates on exactly when your turn will be called." />
            <FeatureCard icon={<Smartphone />} title="QR Check-In" desc="Scan and instantly join the queue upon arrival at the venue for contactless entry." />
            <FeatureCard icon={<Bell />} title="Smart Notifications" desc="Receive automated SMS or Email alerts right before your token is about to be called." />
            <FeatureCard icon={<BarChart3 />} title="Analytics Dashboard" desc="Comprehensive insights and reports for administrators to optimize service flow." />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">How It Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Five simple steps to get served without the painful wait.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center relative max-w-5xl mx-auto"
          >
            <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
            <Step number="1" title="Choose a Service" />
            <Step number="2" title="Select Appointment" />
            <Step number="3" title="Get Your Token" />
            <Step number="4" title="Track Your Queue" />
            <Step number="5" title="Get Served" />
          </motion.div>
        </div>
      </section>
      
      {/* Categories */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Service Categories</h2>
          </motion.div>
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
          >
             <CategoryCard icon={<Building />} title="Healthcare" />
             <CategoryCard icon={<Building />} title="Banks" />
             <CategoryCard icon={<Building />} title="Government" />
             <CategoryCard icon={<Building />} title="Salons" />
             <CategoryCard icon={<Building />} title="Services" />
             <CategoryCard icon={<Building />} title="Clinics" />
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <motion.div 
    variants={fadeUp}
    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
    className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all duration-300 group"
  >
    <div className="w-14 h-14 bg-primary-50 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 rounded-2xl flex items-center justify-center text-primary-600 mb-6 shadow-sm">
      <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring' }}>{icon}</motion.div>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </motion.div>
);

const Step = ({ number, title }) => (
  <motion.div variants={scaleUp} className="flex flex-col items-center py-4 z-10 w-full md:w-auto relative group">
    <motion.div 
      whileHover={{ scale: 1.15 }}
      className="w-16 h-16 rounded-full bg-white text-slate-900 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 font-black flex items-center justify-center text-2xl mb-4 border-4 border-slate-100 shadow-md"
    >
      {number}
    </motion.div>
    <h4 className="font-bold text-slate-900 text-center max-w-[120px]">{title}</h4>
  </motion.div>
);

const CategoryCard = ({ icon, title }) => (
  <Link to="/user/services">
    <motion.div 
      variants={scaleUp}
      whileHover={{ y: -5, scale: 1.02, backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}
      className="flex flex-col items-center p-8 bg-slate-50 rounded-3xl transition-colors border border-slate-100 cursor-pointer text-slate-500 hover:text-primary-600"
    >
      <div className="w-10 h-10 mb-4">
        {icon}
      </div>
      <span className="font-bold text-slate-900">{title}</span>
    </motion.div>
  </Link>
);

export default Home;

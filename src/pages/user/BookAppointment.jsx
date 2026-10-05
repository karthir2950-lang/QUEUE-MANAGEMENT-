import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';

import { organizationService } from '../../services/organizationService';
import { serviceService } from '../../services/serviceService';
import { appointmentService } from '../../services/appointmentService';

// Framer Motion variants
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    filter: 'blur(4px)',
  })
};

const BookAppointment = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [[step, direction], setStep] = useState([1, 0]);
  
  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  
  // Selection states
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // API loading states
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);

  // Get today's date formatted for input min property
  const today = new Date().toISOString().split('T')[0];
  
  // Max date (e.g., 30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  useEffect(() => {
    // Fetch orgs initially
    const fetchOrgs = async () => {
      setLoadingOrgs(true);
      try {
        const orgs = await organizationService.getAllOrganizations();
        setOrganizations(orgs);
      } catch (err) {
        addToast("Failed to load organizations", "error");
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrgs();
  }, []);

  const nextStep = async () => {
    if (step === 1) {
      if (!selectedOrg) return addToast('Please select an organization', 'error');
      // Fetch services and branches for step 2 & 3
      setLoadingServices(true);
      try {
        const [servs, brnchs] = await Promise.all([
          serviceService.getAllServices(),
          organizationService.getOrganizationBranches(selectedOrg.id)
        ]);
        setServices(servs.filter(s => s.organization_id === selectedOrg.id));
        setBranches(brnchs);
        setStep([step + 1, 1]);
      } catch (e) {
        addToast("Failed to load services", "error");
      } finally {
        setLoadingServices(false);
      }
      return;
    }
    
    if (step === 2) {
      if (!selectedService) return addToast('Please select a service', 'error');
      if (branches.length === 0) return addToast('No active branches for this organization', 'error');
      setStep([step + 1, 1]);
      return;
    }
    
    if (step === 3) {
      if (!selectedBranch) return addToast('Please select a branch', 'error');
      setStep([step + 1, 1]);
      return;
    }
    
    if (step === 4) {
      if (!selectedDate) return addToast('Please select a date', 'error');
      // Load slots for selected date
      setLoadingSlots(true);
      try {
        const resp = await appointmentService.getAvailability(selectedService.id, selectedBranch.id, selectedDate);
        setAvailableSlots(resp.slots || []);
        setSelectedTime(''); // reset time
        setStep([step + 1, 1]);
      } catch (err) {
        addToast(err.response?.data?.detail || "Failed to fetch availability", "error");
      } finally {
        setLoadingSlots(false);
      }
      return;
    }
    
    if (step === 5) {
      if (!selectedTime) return addToast('Please select a time', 'error');
      setStep([step + 1, 1]); // Go to review
      return;
    }
  };
  
  const prevStep = () => {
    setStep([step - 1, -1]);
  };

  const confirmBooking = async () => {
    setSubmitting(true);
    try {
      const payload = {
        service_id: selectedService.id,
        branch_id: selectedBranch.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime
      };
      
      const response = await appointmentService.createAppointment(payload);
      setConfirmedBooking(response);
      addToast('Appointment booked successfully!', 'success');
      
      // Fetch QR Code
      try {
        const qrResp = await appointmentService.getAppointmentQR(response.id);
        setQrCodeData(qrResp.token);
      } catch (err) {
        console.error("Failed to fetch QR", err);
      }
      
      setStep([7, 1]);
    } catch (err) {
      if (err.response?.status === 409) {
        addToast('This slot was just booked by another user. Please select another slot.', 'error');
      } else {
        addToast(err.response?.data?.detail || 'Failed to book appointment', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-12">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Book Appointment</h2>
        <p className="text-slate-500">Follow the steps to schedule your visit</p>
      </div>

      {/* Progress Indicator */}
      {step < 7 && (
        <div className="flex items-center justify-between mb-12 relative px-2">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
          <motion.div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 -z-10 rounded-full" 
            initial={{ width: 0 }}
            animate={{ width: `${((step - 1) / 5) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          ></motion.div>
          
          {[1, 2, 3, 4, 5, 6].map(i => {
            const isCompleted = step > i;
            const isCurrent = step === i;
            
            return (
              <motion.div 
                key={i} 
                initial={false}
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  backgroundColor: isCompleted || isCurrent ? '#3b82f6' : '#f1f5f9',
                  color: isCompleted || isCurrent ? '#ffffff' : '#94a3b8',
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border-2 ${isCurrent ? 'border-primary-200' : 'border-transparent'}`}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5 text-white" /> : i}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative min-h-[400px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="p-8 w-full"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Select Organization</h3>
              
              {loadingOrgs ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl"></div>)}
                </div>
              ) : organizations.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No organizations available.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {organizations.map(org => {
                    const isSelected = selectedOrg?.id === org.id;
                    return (
                      <motion.div 
                        key={org.id} 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedOrg(org)}
                        className={`p-5 rounded-2xl cursor-pointer transition-all border-2 flex items-center gap-4 ${
                          isSelected ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <span className={`font-bold text-lg block ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>{org.name}</span>
                          <span className="text-xs text-slate-500">{org.category}</span>
                        </div>
                        
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                            <CheckCircle className="w-6 h-6 text-primary-600" />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="p-8 w-full"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Select Service</h3>
              
              {services.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No services available for this organization.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map(srv => {
                    const isSelected = selectedService?.id === srv.id;
                    return (
                      <motion.div 
                        key={srv.id} 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedService(srv)}
                        className={`p-6 rounded-2xl cursor-pointer transition-all border-2 flex flex-col items-center justify-center text-center gap-3 ${
                          isSelected ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10' : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span className={`font-bold text-lg ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>{srv.name}</span>
                        <span className="text-xs text-slate-500">{srv.average_service_time} min avg wait</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle className="w-6 h-6 text-primary-600" />
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="p-8 w-full"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Select Branch</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {branches.map(br => {
                  const isSelected = selectedBranch?.id === br.id;
                  return (
                    <motion.div 
                      key={br.id} 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedBranch(br)}
                      className={`p-6 rounded-2xl cursor-pointer transition-all border-2 flex flex-col items-center justify-center text-center gap-2 ${
                        isSelected ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className={`font-bold text-lg ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>{br.name}</span>
                      <span className="text-sm text-slate-500">{br.city}</span>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2">
                          <CheckCircle className="w-6 h-6 text-primary-600" />
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="p-8 w-full"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Select Date</h3>
              <div className="max-w-md mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-purple-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <input 
                  type="date" 
                  min={today}
                  max={maxDateStr}
                  className="relative w-full p-6 text-xl border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none bg-white text-slate-900 font-bold"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="p-8 w-full"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Select Time</h3>
              
              {loadingSlots ? (
                <div className="text-center py-12"><p className="text-slate-500 animate-pulse">Loading availability...</p></div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">No slots available for this date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto max-h-80 overflow-y-auto pr-2">
                  {availableSlots.map((slot, idx) => {
                    const isSelected = selectedTime === slot.time;
                    if (!slot.available) {
                       return (
                         <div key={idx} className="p-4 border-2 rounded-2xl text-center bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed">
                           <span className="font-bold text-lg">{slot.time}</span>
                           <span className="block text-xs mt-1">Booked</span>
                         </div>
                       )
                    }
                    return (
                      <motion.div 
                        key={idx} 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-4 border-2 rounded-2xl cursor-pointer text-center transition-all ${
                          isSelected ? 'border-primary-500 bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'border-slate-200 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        <span className="font-bold text-lg">{slot.time}</span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="p-8 w-full"
            >
              <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Review & Confirm</h3>
              <div className="bg-slate-50 p-8 rounded-3xl space-y-6 border border-slate-200 max-w-lg mx-auto">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-slate-500 font-medium">Organization</span>
                  <span className="font-bold text-slate-900 text-right">{selectedOrg?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-slate-500 font-medium">Branch</span>
                  <span className="font-bold text-slate-900 text-right">{selectedBranch?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-slate-500 font-medium">Service</span>
                  <span className="font-bold text-slate-900 text-right">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <span className="text-slate-500 font-medium">Date</span>
                  <span className="font-bold text-slate-900 text-right">{selectedDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Time</span>
                  <span className="font-bold text-primary-600 text-right">{selectedTime}</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 7 && confirmedBooking && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="p-12 text-center w-full"
            >
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="inline-block relative"
              >
                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20"></div>
                <CheckCircle className="w-24 h-24 text-green-500 relative z-10" />
              </motion.div>
              
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                <h2 className="text-4xl font-black text-slate-900 mt-6 mb-2">Appointment Confirmed!</h2>
                <p className="text-slate-600 mb-10 text-lg">Your booking ID is {confirmedBooking.booking_id}. Details are in your dashboard.</p>
              </motion.div>
              
              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
                className="bg-primary-50 max-w-sm mx-auto p-8 rounded-3xl border border-primary-100 mb-10 text-left shadow-lg shadow-primary-500/10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                
                <p className="text-xs text-primary-600 font-bold uppercase tracking-widest mb-2 relative z-10">Your Token</p>
                <p className="text-6xl font-black text-primary-700 mb-6 relative z-10">{confirmedBooking.token_number}</p>
                
                <div className="space-y-3 text-sm relative z-10 border-t border-primary-100 pt-4">
                  <p className="flex justify-between"><span className="text-slate-500 font-medium">Organization:</span> <span className="font-bold text-slate-900">{confirmedBooking.organization_name}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 font-medium">Service:</span> <span className="font-bold text-slate-900">{confirmedBooking.service_name}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500 font-medium">Date & Time:</span> <span className="font-bold text-slate-900">{confirmedBooking.appointment_date} at {confirmedBooking.appointment_time}</span></p>
                </div>
                
                {qrCodeData && (
                  <div className="mt-8 pt-6 border-t border-primary-100 text-center relative z-10">
                    <p className="text-sm text-slate-600 mb-4">Present this QR code to staff upon arrival</p>
                    <div className="bg-white p-4 inline-block rounded-xl shadow-sm border border-slate-100">
                      <QRCode value={qrCodeData} size={150} />
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <Button variant="outline" className="py-3 px-6" onClick={() => navigate('/user/bookings')}>View My Bookings</Button>
                <Button variant="primary" className="py-3 px-6 shadow-md shadow-primary-500/20" onClick={() => navigate('/user/queue')}>Track Live Queue</Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 7 && (
          <div className="bg-slate-50 p-6 flex justify-between border-t border-slate-100">
            <Button variant="ghost" onClick={prevStep} disabled={step === 1 || submitting} className={step === 1 ? 'opacity-0' : ''}>
              Back
            </Button>
            {step < 6 ? (
              <Button variant="primary" onClick={nextStep} className="px-8 shadow-md shadow-primary-500/20" disabled={loadingServices || loadingSlots}>
                {loadingServices || loadingSlots ? 'Loading...' : 'Next Step'}
              </Button>
            ) : (
              <Button variant="success" onClick={confirmBooking} disabled={submitting} className="px-8 bg-green-600 hover:bg-green-700 shadow-md shadow-green-500/20 text-white">
                {submitting ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;

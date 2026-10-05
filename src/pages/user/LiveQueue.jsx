import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Play, XCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { queueService } from '../../services/queueService';
import { wsService } from '../../services/websocketService';

const LiveQueue = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState('Connecting...');
  
  // Track fallback interval
  const fallbackInterval = useRef(null);

  const fetchQueueData = async (showToast = false) => {
    try {
      const list = await queueService.getQueueList();
      const activeQueues = list.filter(q => ['WAITING', 'CALLED', 'SERVING'].includes(q.queue_status));
      
      if (activeQueues.length > 0) {
        const details = await queueService.getQueue(activeQueues[0].id);
        setQueueData(details);
        if (showToast) addToast('Queue refreshed', 'success');
        return details.queue_id;
      } else {
        setQueueData(null);
        return null;
      }
    } catch (error) {
      console.error(error);
      if (showToast) addToast('Failed to fetch queue status', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let activeQueueId = null;

    const setup = async () => {
      const qId = await fetchQueueData();
      if (qId) {
        activeQueueId = qId;
        wsService.connect(qId);
      }
    };
    setup();

    const unsubStatus = wsService.on('status', (status) => {
      setWsStatus(status);
      if (status === 'Offline' || status === 'Reconnecting...') {
        if (!fallbackInterval.current) {
          fallbackInterval.current = setInterval(() => {
            fetchQueueData();
          }, 15000);
        }
      } else if (status === 'Live') {
        if (fallbackInterval.current) {
          clearInterval(fallbackInterval.current);
          fallbackInterval.current = null;
        }
      }
    });

    const unsubState = wsService.on('queue_state', (data) => {
      setQueueData(prev => ({
        ...prev,
        current_token: data.current_token,
        people_ahead: data.people_ahead,
        estimated_wait_time: data.estimated_wait_time,
        queue_status: data.queue_status,
        prediction_source: data.prediction_source
      }));
    });

    const unsubUpdated = wsService.on('QUEUE_UPDATED', (data) => {
      // Re-fetch to get accurate time calculations or just merge what we got
      // Best to fetch to ensure accuracy for the user's specific wait time
      fetchQueueData();
    });

    const unsubTurn = wsService.on('YOUR_TURN', (data) => {
      // Small toast or sound could be added here
      fetchQueueData(); // Refreshes to show the exact state
    });

    return () => {
      wsService.disconnect();
      unsubStatus();
      unsubState();
      unsubUpdated();
      unsubTurn();
      if (fallbackInterval.current) clearInterval(fallbackInterval.current);
    };
  }, []);

  const handleCancelQueue = async () => {
    try {
      if (queueData) {
        await queueService.cancelQueue(queueData.queue_id);
        addToast('You have successfully left the queue.', 'success');
        setIsCancelModalOpen(false);
        setQueueData(null);
        setTimeout(() => navigate('/user/dashboard'), 2000);
      }
    } catch (error) {
      addToast('Failed to cancel queue', 'error');
    }
  };

  if (loading) {
    return <div className="py-20 text-center">Loading queue status...</div>;
  }

  if (!queueData) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Active Queue</h2>
        <p className="text-slate-500 mb-6">You are not currently in any queue.</p>
        <Button variant="primary" onClick={() => navigate('/user/dashboard')}>Back to Dashboard</Button>
      </motion.div>
    );
  }

  const { queue_status, current_token, your_token, people_ahead, estimated_wait_time, prediction_source, service, branch } = queueData;
  const isMyTurn = queue_status === 'CALLED';
  const isServing = queue_status === 'SERVING';
  
  const getNum = (token) => token ? parseInt(token.replace(/\D/g, ''), 10) || 0 : 0;
  const currentTokenNum = getNum(current_token);
  const myTokenNum = getNum(your_token);
  
  const visibleTokens = [];
  if (currentTokenNum > 0 && myTokenNum > 0) {
    for (let i = currentTokenNum - 1; i <= currentTokenNum + 6; i++) {
      if (i > 0) visibleTokens.push(i);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Live Queue Tracking
            <span className={`text-xs px-2 py-1 rounded-full border ${
              wsStatus === 'Live' ? 'bg-green-50 text-green-700 border-green-200' : 
              wsStatus === 'Connecting...' || wsStatus === 'Reconnecting...' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {wsStatus === 'Live' && <span className="inline-block w-2 h-2 mr-1 rounded-full bg-green-500"></span>}
              {wsStatus}
            </span>
          </h2>
          <p className="text-slate-500 text-sm">{service} • {branch}</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => fetchQueueData(true)}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-3xl shadow-lg border-t-8 overflow-hidden transition-colors duration-500 ${isMyTurn || isServing ? 'border-t-green-500 shadow-green-500/20' : 'border-t-primary-500 shadow-primary-500/10'}`}
      >
        <div className="p-8">
          <AnimatePresence mode="wait">
            {isMyTurn ? (
              <motion.div 
                key="myTurn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center relative overflow-hidden"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-green-100 rounded-full blur-3xl -z-10"
                ></motion.div>
                
                <h1 className="text-6xl font-black text-green-600 mb-4 tracking-tight drop-shadow-md flex items-center justify-center gap-4">
                  <CheckCircle2 className="w-16 h-16" /> YOUR TURN
                </h1>
                <p className="text-2xl text-slate-700 font-medium">Please proceed to the service counter</p>
                
                <motion.div 
                  initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="mt-8 inline-block bg-white p-6 rounded-2xl shadow-xl border border-green-200"
                >
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Token</p>
                  <p className="text-5xl font-black text-slate-900">{your_token}</p>
                </motion.div>
              </motion.div>
            ) : isServing ? (
              <motion.div key="serving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center relative overflow-hidden">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-blue-100 rounded-full blur-3xl -z-10"
                ></motion.div>
                
                <h1 className="text-5xl font-black text-blue-600 mb-4 tracking-tight drop-shadow-md">SERVICE IN PROGRESS</h1>
                <p className="text-xl text-slate-700 font-medium">Your service has started.</p>
                
                <motion.div 
                  initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="mt-8 inline-block bg-white p-6 rounded-2xl shadow-xl border border-blue-200"
                >
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Token</p>
                  <p className="text-5xl font-black text-slate-900">{your_token}</p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  <AnimatedStat title="Your Token" value={your_token} color="primary" />
                  <AnimatedStat title="Serving" value={current_token || '---'} color="slate" />
                  <AnimatedStat title="Ahead" value={people_ahead} color="orange" />
                  <AnimatedStat 
                    title="Wait Time" 
                    value={estimated_wait_time} 
                    unit="min" 
                    color="purple" 
                    sublabel={prediction_source === 'ML' ? 'AI Prediction' : null} 
                  />
                </div>

                {/* Queue Visualization */}
                {visibleTokens.length > 0 && (
                  <div className="text-left mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Live Queue Progress
                    </h4>
                    
                    <div className="relative overflow-hidden h-[70px]">
                      <div className="flex gap-4 absolute left-0 items-center">
                        <AnimatePresence mode="popLayout">
                          {visibleTokens.map((tokenNum) => {
                            const isCurrent = tokenNum === currentTokenNum;
                            const isMe = tokenNum === myTokenNum;
                            const isDone = tokenNum < currentTokenNum;
                            
                            const prefix = your_token.replace(/\d/g, '');
                            const tokenStr = `${prefix}${tokenNum.toString().padStart(3, '0')}`;

                            return (
                              <motion.div 
                                layout
                                key={tokenNum} 
                                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                                animate={{ opacity: 1, scale: isCurrent ? 1.1 : 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5, x: -50 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className={`px-6 py-3 rounded-xl font-bold flex flex-col items-center justify-center min-w-[80px] border shadow-sm ${
                                  isCurrent ? 'bg-slate-900 text-white border-slate-900 z-10 scale-110' :
                                  isMe ? 'bg-primary-100 text-primary-700 border-primary-200' :
                                  isDone ? 'bg-white text-slate-400 border-slate-200 opacity-50' :
                                  'bg-white text-slate-600 border-slate-200'
                                }`}
                              >
                                <span className="text-lg">{tokenStr}</span>
                                {isMe && !isCurrent && <span className="text-[10px] uppercase tracking-widest text-primary-600 mt-0.5">You</span>}
                                {isCurrent && <span className="text-[10px] uppercase tracking-widest text-white mt-0.5 animate-pulse">Serving</span>}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-center font-semibold text-lg text-slate-600">You're in the queue</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4 pt-8 border-t border-slate-100">
            {queue_status === 'WAITING' && (
              <Button variant="danger" className="flex items-center justify-center gap-2" onClick={() => setIsCancelModalOpen(true)}>
                <XCircle className="w-4 h-4" /> Cancel Queue
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <ConfirmDialog 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelQueue}
        title="Leave Queue"
        message="Are you sure you want to leave this queue? You will lose your spot."
        confirmText="Leave Queue"
        confirmVariant="danger"
      />
    </div>
  );
};

const AnimatedStat = ({ title, value, unit, color, sublabel }) => {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-100 text-primary-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-900',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };

  const textColors = {
    primary: 'text-primary-600',
    slate: 'text-slate-500',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  };

  return (
    <motion.div 
      layout
      className={`p-6 rounded-2xl text-center border ${colorClasses[color]} flex flex-col justify-center shadow-sm relative overflow-hidden group`}
    >
      <motion.div 
        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${colorClasses[color]}`}
        style={{ mixBlendMode: 'multiply' }}
      ></motion.div>
      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${textColors[color]}`}>{title}</p>
      <motion.div 
        key={value}
        initial={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="text-4xl font-black relative z-10"
      >
        {value}
        {unit && <span className="text-lg font-medium ml-1 text-slate-500">{unit}</span>}
      </motion.div>
      {sublabel && (
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-[10px] font-bold tracking-widest mt-1 text-purple-500 bg-purple-100 rounded-full px-2 py-0.5 inline-block mx-auto"
        >
          ✨ {sublabel}
        </motion.p>
      )}
    </motion.div>
  );
};

export default LiveQueue;

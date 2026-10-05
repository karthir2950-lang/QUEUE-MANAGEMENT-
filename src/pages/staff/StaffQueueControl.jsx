import React, { useState, useEffect, useRef } from 'react';
import { Check, X, AlertTriangle, Play, ChevronRight, User, Clock, RefreshCw, QrCode } from 'lucide-react';
import { queueService } from '../../services/queueService';
import { wsService } from '../../services/websocketService';
import { useToast } from '../../components/common/Toast';
import { Scanner } from '@yudiel/react-qr-scanner';

const StaffQueueControl = () => {
  const { addToast } = useToast();
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState('Connecting...');
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fallbackInterval = useRef(null);

  const fetchQueue = async () => {
    try {
      const data = await queueService.getQueueList();
      setQueueList(data || []);
    } catch (error) {
      addToast('Failed to fetch queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    wsService.connect('staff');

    const unsubStatus = wsService.on('status', (status) => {
      setWsStatus(status);
      if (status === 'Offline' || status === 'Reconnecting...') {
        if (!fallbackInterval.current) {
          fallbackInterval.current = setInterval(fetchQueue, 15000);
        }
      } else if (status === 'Live') {
        if (fallbackInterval.current) {
          clearInterval(fallbackInterval.current);
          fallbackInterval.current = null;
        }
      }
    });

    const unsubUpdate = wsService.on('QUEUE_UPDATED', fetchQueue);
    const unsubCalled = wsService.on('TOKEN_CALLED', fetchQueue);
    const unsubStarted = wsService.on('SERVICE_STARTED', fetchQueue);
    const unsubCompleted = wsService.on('SERVICE_COMPLETED', fetchQueue);
    
    return () => {
      wsService.disconnect();
      unsubStatus();
      unsubUpdate();
      unsubCalled();
      unsubStarted();
      unsubCompleted();
      if (fallbackInterval.current) clearInterval(fallbackInterval.current);
    };
  }, []);

  const activeEntry = queueList.find(q => q.queue_status === 'CALLED' || q.queue_status === 'SERVING');
  const waitingEntries = queueList.filter(q => q.queue_status === 'WAITING');
  const completedCount = queueList.filter(q => q.queue_status === 'COMPLETED').length;

  const currentStatus = activeEntry ? activeEntry.queue_status.toLowerCase() : 'waiting';
  const currentToken = activeEntry ? activeEntry.token_number : '---';
  const customerName = activeEntry ? activeEntry.customer_name : '---';

  const handleCallNext = async () => {
    if (waitingEntries.length > 0) {
      try {
        const anyQueueId = waitingEntries[0].id;
        const res = await queueService.callNext(anyQueueId);
        addToast(`Token ${res.token_number} called.`, 'success');
        fetchQueue();
      } catch (error) {
        addToast(error.response?.data?.detail || 'Failed to call next', 'error');
      }
    }
  };

  const handleStartService = async () => {
    if (activeEntry) {
      try {
        await queueService.startService(activeEntry.id);
        addToast('Service started', 'success');
        fetchQueue();
      } catch (error) {
        addToast('Failed to start service', 'error');
      }
    }
  };

  const handleComplete = async () => {
    if (activeEntry) {
      try {
        await queueService.completeService(activeEntry.id);
        addToast('Service completed', 'success');
        fetchQueue();
      } catch (error) {
        addToast('Failed to complete service', 'error');
      }
    }
  };

  const handleNoShow = async () => {
    if (activeEntry) {
      try {
        await queueService.markNoShow(activeEntry.id);
        addToast('Marked as no-show', 'success');
        fetchQueue();
      } catch (error) {
        addToast('Failed to mark no-show', 'error');
      }
    }
  };

  const handleScan = async (result) => {
    if (!result || !result[0] || !result[0].rawValue || scanning) return;
    setScanning(true);
    
    try {
      const qrData = result[0].rawValue;
      const res = await queueService.processCheckIn(qrData);
      addToast(`Check-in successful! Token ${res.token_number} added to queue.`, 'success');
      setShowScanner(false);
      fetchQueue();
    } catch (error) {
      addToast(error.response?.data?.detail || 'Invalid or expired QR code', 'error');
    } finally {
      setTimeout(() => setScanning(false), 2000); // Prevent spamming
    }
  };

  if (loading) {
    return <div className="py-20 text-center">Loading queue data...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Queue Control Station
            <span className={`text-xs px-2 py-1 rounded-full border font-normal ${
              wsStatus === 'Live' ? 'bg-green-50 text-green-700 border-green-200' : 
              wsStatus === 'Connecting...' || wsStatus === 'Reconnecting...' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {wsStatus === 'Live' && <span className="inline-block w-2 h-2 mr-1 rounded-full bg-green-500"></span>}
              {wsStatus}
            </span>
          </h2>
          <p className="text-slate-500">Manage your branch queue</p>
        </div>
        <div className="flex gap-4 text-center items-center">
          <button onClick={() => setShowScanner(true)} className="btn-primary py-2 px-4 flex items-center gap-2 shadow-sm text-sm whitespace-nowrap">
            <QrCode className="w-4 h-4" /> Scan QR Check-In
          </button>
          <button onClick={fetchQueue} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 ml-2" title="Refresh">
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Waiting</p>
            <p className="text-lg font-bold text-slate-900">{waitingEntries.length}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Completed</p>
            <p className="text-lg font-bold text-slate-900">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8 border-t-4 border-t-primary-500 shadow-md flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            
            {/* Status Badge */}
            <div className="absolute top-6 left-6">
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider border ${
                currentStatus === 'serving' ? 'bg-green-50 text-green-700 border-green-200' :
                currentStatus === 'called' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' :
                'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {currentStatus === 'serving' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                {currentStatus === 'called' && <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                {currentStatus === 'waiting' && <span className="w-2 h-2 rounded-full bg-slate-400"></span>}
                {currentStatus}
              </span>
            </div>

            {currentStatus !== 'waiting' ? (
              <>
                <p className="text-slate-500 font-semibold uppercase tracking-widest mb-4">Current Token</p>
                <h1 className="text-8xl font-black text-slate-900 mb-6 tracking-tighter">{currentToken}</h1>
                
                <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 mb-10">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{customerName}</p>
                    <p className="text-sm text-slate-500">Service: {activeEntry?.service_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  {currentStatus === 'called' ? (
                    <>
                      <button onClick={handleStartService} className="btn-primary py-3 flex items-center justify-center gap-2 text-lg col-span-2 bg-green-600 hover:bg-green-700">
                        <Play className="w-5 h-5" /> Start Service
                      </button>
                      <button onClick={handleNoShow} className="btn-secondary py-3 text-red-600 hover:bg-red-50 hover:border-red-200 col-span-2">
                        Mark No Show
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleComplete} className="btn-primary py-4 flex items-center justify-center gap-2 text-lg col-span-2">
                        <Check className="w-5 h-5" /> Complete Service
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready for Next Customer</h2>
                <p className="text-slate-500 mb-8">Counter is currently available.</p>
                <button 
                  onClick={handleCallNext} 
                  disabled={waitingEntries.length === 0}
                  className="btn-primary text-xl px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none"
                >
                  Call Next {waitingEntries.length > 0 ? `(${waitingEntries[0].token_number})` : ''}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Up Next List */}
        <div className="lg:col-span-1">
          <div className="card h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Up Next</h3>
              <p className="text-sm text-slate-500">{waitingEntries.length} waiting</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {waitingEntries.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-900">{entry.token_number}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[120px]">{entry.customer_name}</p>
                    </div>
                  </div>
                  {index === 0 && currentStatus === 'waiting' && (
                     <button onClick={handleCallNext} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                       <ChevronRight className="w-6 h-6" />
                     </button>
                  )}
                </div>
              ))}
              
              {waitingEntries.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-500 font-medium">Queue is empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><QrCode className="w-5 h-5" /> Scan Check-In QR</h3>
              <button onClick={() => setShowScanner(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-900 relative">
              <Scanner 
                onScan={handleScan}
                onError={(err) => console.log('Scanner error:', err)}
                components={{
                  audio: false,
                  torch: true,
                }}
              />
              <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
                <p className="text-white/80 text-sm font-medium">Position QR code within frame</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <p className="text-xs text-slate-500">Scanning will automatically trigger check-in</p>
              <button onClick={() => setShowScanner(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffQueueControl;

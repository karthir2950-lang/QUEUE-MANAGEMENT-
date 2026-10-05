import React, { useState, useEffect, useRef } from 'react';
import { queueService } from '../../services/queueService';
import { wsService } from '../../services/websocketService';
import { RefreshCw } from 'lucide-react';

import api from '../../services/api';
import { Sparkles } from 'lucide-react';

const AdminQueues = () => {
  const [queueEntries, setQueueEntries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState('Connecting...');
  const fallbackInterval = useRef(null);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const [queueData, aiData] = await Promise.all([
        queueService.getQueueList(),
        api.get('/ai/analytics').catch(() => null)
      ]);
      setQueueEntries(queueData || []);
      if (aiData && aiData.data && aiData.data.data.status === 'available') {
        setAnalytics(aiData.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
    wsService.connect('admin');

    const unsubStatus = wsService.on('status', (status) => {
      setWsStatus(status);
      if (status === 'Offline' || status === 'Reconnecting...') {
        if (!fallbackInterval.current) {
          fallbackInterval.current = setInterval(fetchQueues, 15000);
        }
      } else if (status === 'Live') {
        if (fallbackInterval.current) {
          clearInterval(fallbackInterval.current);
          fallbackInterval.current = null;
        }
      }
    });

    const unsubUpdate = wsService.on('QUEUE_UPDATED', fetchQueues);

    return () => {
      wsService.disconnect();
      unsubStatus();
      unsubUpdate();
      if (fallbackInterval.current) clearInterval(fallbackInterval.current);
    };
  }, []);

  // Group by service_name (or branch_id/service_id if we had them in list response)
  const groupedQueues = queueEntries.reduce((acc, entry) => {
    const key = entry.service_name;
    if (!acc[key]) {
      acc[key] = {
        serviceName: entry.service_name,
        waiting: 0,
        serving: 0,
        completed: 0,
        currentToken: '---',
      };
    }
    
    if (entry.queue_status === 'WAITING') acc[key].waiting += 1;
    if (entry.queue_status === 'SERVING') {
      acc[key].serving += 1;
      acc[key].currentToken = entry.token_number;
    }
    if (entry.queue_status === 'CALLED') {
      if (acc[key].currentToken === '---') {
        acc[key].currentToken = entry.token_number;
      }
    }
    if (entry.queue_status === 'COMPLETED') acc[key].completed += 1;
    
    return acc;
  }, {});

  const queueSummary = Object.values(groupedQueues);

  if (loading) {
    return <div className="py-20 text-center">Loading queues...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          Live Queue Monitoring
          <span className={`text-xs px-2 py-1 rounded-full border font-normal ${
            wsStatus === 'Live' ? 'bg-green-50 text-green-700 border-green-200' : 
            wsStatus === 'Connecting...' || wsStatus === 'Reconnecting...' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' :
            'bg-red-50 text-red-700 border-red-200'
          }`}>
            {wsStatus === 'Live' && <span className="inline-block w-2 h-2 mr-1 rounded-full bg-green-500"></span>}
            {wsStatus}
          </span>
        </h2>
        <button onClick={fetchQueues} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50">
          <RefreshCw className="w-4 h-4 text-slate-600" /> Refresh
        </button>
      </div>

      {analytics && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/20 mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" /> AI Prediction Analytics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Total Predictions</p>
              <p className="text-2xl font-black">{analytics.total_predictions}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Avg Actual Wait</p>
              <p className="text-2xl font-black">{analytics.avg_actual_wait.toFixed(1)} <span className="text-sm font-normal">min</span></p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Avg Predicted</p>
              <p className="text-2xl font-black">{analytics.avg_predicted_wait.toFixed(1)} <span className="text-sm font-normal">min</span></p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-1">Mean Absolute Error</p>
              <p className="text-2xl font-black">{analytics.mae.toFixed(2)} <span className="text-sm font-normal">min</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {queueSummary.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500">No queues active for today.</p>
          </div>
        )}
        
        {queueSummary.map((queue, index) => (
          <div key={index} className="card p-6 border-l-4 border-l-primary-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  {queue.serviceName} <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200">Active</span>
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Current Token</p>
                <p className="text-2xl font-black text-slate-900">{queue.currentToken}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-100">
                <p className="text-xs text-orange-600 font-medium uppercase mb-1">Waiting</p>
                <p className="text-2xl font-black text-orange-700">{queue.waiting}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                <p className="text-xs text-blue-600 font-medium uppercase mb-1">Serving</p>
                <p className="text-2xl font-black text-blue-700">{queue.serving}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                <p className="text-xs text-green-600 font-medium uppercase mb-1">Completed</p>
                <p className="text-2xl font-black text-green-700">{queue.completed}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQueues;

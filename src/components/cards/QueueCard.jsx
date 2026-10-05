import React from 'react';
import Card from '../common/Card';

const QueueCard = ({ queue }) => {
  return (
    <Card className="border-l-4 border-l-primary-500">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{queue.queueId}</h3>
            <p className="text-sm text-slate-500">Active Queue</p>
          </div>
          <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200">Active</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
            <p className="text-xs text-slate-500 font-medium uppercase mb-1">Current Token</p>
            <p className="text-2xl font-black text-slate-900">{queue.currentToken}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-100">
            <p className="text-xs text-orange-600 font-medium uppercase mb-1">Waiting</p>
            <p className="text-2xl font-black text-orange-700">{queue.waitingCount}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
            <p className="text-xs text-blue-600 font-medium uppercase mb-1">Serving</p>
            <p className="text-2xl font-black text-blue-700">{queue.servingCount}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
            <p className="text-xs text-purple-600 font-medium uppercase mb-1">Avg Wait</p>
            <p className="text-2xl font-black text-purple-700">{queue.averageWait}m</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default QueueCard;

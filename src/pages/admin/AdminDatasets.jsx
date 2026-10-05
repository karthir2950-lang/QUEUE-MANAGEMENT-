import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const AdminDatasets = () => {
  const [datasets, setDatasets] = useState([
    {
      id: 1,
      name: 'Healthcare',
      source: 'Kaggle',
      type: 'Real-world Appointment Data',
      rows: '110,527',
      columns: 14,
      status: 'Manual Download Required',
      lastProcessed: 'N/A'
    },
    {
      id: 2,
      name: 'Retail POS',
      source: 'MDPI / DOI',
      type: 'Real-world Supermarket Operational Data',
      rows: 'Unknown',
      columns: 'Unknown',
      status: 'Manual Download Required (403 Forbidden)',
      lastProcessed: 'N/A'
    },
    {
      id: 3,
      name: 'Restaurant',
      source: 'databasesample.com',
      type: 'Synthetic Dataset',
      rows: 'Unknown',
      columns: 'Unknown',
      status: 'Manual Download Required',
      lastProcessed: 'N/A'
    },
    {
      id: 4,
      name: 'Apollo',
      source: 'GitHub',
      type: 'Public Analytics Dataset',
      rows: '75,000',
      columns: 52,
      status: 'Available',
      lastProcessed: new Date().toLocaleDateString()
    },
    {
      id: 5,
      name: 'SmartQueue Live',
      source: 'Internal DB',
      type: 'First-party Operational Data',
      rows: 'Growing continuously',
      columns: 'N/A',
      status: 'Available',
      lastProcessed: 'Real-time'
    }
  ]);

  const [aiMetrics, setAiMetrics] = useState({
    version: 'v1',
    trainingDate: new Date().toLocaleString(),
    datasetSize: 55275,
    mae: '9.67 mins',
    rmse: '12.83 mins',
    r2: '-0.10',
    baselineMae: '74.29 mins',
    predictionCount: 154,
    fallbackCount: 12
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datasets & AI Models</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public datasets and monitor AI prediction performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 text-indigo-600 mb-2">
            <TrendingUp size={24} />
            <h3 className="font-semibold">Model MAE</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{aiMetrics.mae}</p>
          <p className="text-sm text-green-600 mt-1">vs Baseline {aiMetrics.baselineMae}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
            <Database size={24} />
            <h3 className="font-semibold">Training Size</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{aiMetrics.datasetSize.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Valid records</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 text-emerald-600 mb-2">
            <CheckCircle size={24} />
            <h3 className="font-semibold">Predictions</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{aiMetrics.predictionCount}</p>
          <p className="text-sm text-gray-500 mt-1">Model used</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 text-amber-600 mb-2">
            <AlertCircle size={24} />
            <h3 className="font-semibold">Fallbacks</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{aiMetrics.fallbackCount}</p>
          <p className="text-sm text-gray-500 mt-1">Formula used</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Registered Datasets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Dataset Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Source</th>
                <th className="px-6 py-3 font-medium">Rows</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datasets.map(ds => (
                <tr key={ds.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{ds.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {ds.type.includes('Synthetic') ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {ds.type}
                      </span>
                    ) : ds.type.includes('Real') || ds.type.includes('Operational') ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        {ds.type}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {ds.type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{ds.source}</td>
                  <td className="px-6 py-4 text-gray-600">{ds.rows}</td>
                  <td className="px-6 py-4">
                    {ds.status === 'Available' ? (
                      <span className="inline-flex items-center space-x-1 text-green-600">
                        <CheckCircle size={16} />
                        <span>{ds.status}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-amber-600">
                        <AlertCircle size={16} />
                        <span>{ds.status}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">AI Model Information</h2>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Algorithm</p>
            <p className="font-medium text-gray-900 mt-1">RandomForestRegressor</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Version</p>
            <p className="font-medium text-gray-900 mt-1">{aiMetrics.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Trained</p>
            <p className="font-medium text-gray-900 mt-1">{aiMetrics.trainingDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">R² Score</p>
            <p className="font-medium text-gray-900 mt-1">{aiMetrics.r2}</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default AdminDatasets;

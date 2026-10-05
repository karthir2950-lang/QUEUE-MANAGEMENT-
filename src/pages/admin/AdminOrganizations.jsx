import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Edit, Trash2, Building2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const data = await adminService.getOrganizations();
        setOrganizations(data);
      } catch (err) {
        setError("Failed to load organizations. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Organizations</h2>
          <p className="text-slate-500 text-sm">Manage registered organizations and branches</p>
        </div>
        <button className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed" title="Backend API pending">
          <Plus className="w-4 h-4" /> Add Organization
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-medium">Organization Info</th>
                <th className="p-4 font-medium">Sector</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">Loading organizations...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-red-500">{error}</td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No organizations found.</td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{org.name}</p>
                          <p className="text-sm text-slate-500">{org.address || 'No address'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        {org.sector || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <p>{org.email || 'No email'}</p>
                      <p>{org.phone || 'No phone'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors" title="Backend API pending">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Backend API pending">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrganizations;

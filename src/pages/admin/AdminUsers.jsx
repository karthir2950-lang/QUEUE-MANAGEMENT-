import React, { useState, useEffect } from 'react';
import { Edit, Eye, Ban, Search, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search users..." 
            className="input-field pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6">
                    <Skeleton className="h-8 mb-2" />
                    <Skeleton className="h-8 mb-2" />
                    <Skeleton className="h-8" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6">
                    <EmptyState message="No users found." />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">#{user.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : user.role === 'STAFF' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 transition-colors" title={user.status === 'ACTIVE' ? "Deactivate" : "Activate"}>
                        {user.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
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

export default AdminUsers;

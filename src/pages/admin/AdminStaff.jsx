import React, { useState, useEffect } from 'react';
import { Edit, Ban, Plus, Search } from 'lucide-react';
import Modal from '../../components/common/Modal';
import { adminService } from '../../services/adminService';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

const AdminStaff = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStaff();
        setStaffList(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = staffList.filter(staff => 
    (staff.user && staff.user.toLowerCase().includes(search.toLowerCase())) ||
    (staff.employee_code && staff.employee_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Staff Management</h2>
        <div className="flex items-center gap-4 w-full sm:w-auto">
           <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search staff..." 
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 flex-shrink-0 opacity-50 cursor-not-allowed" title="Backend API pending"><Plus className="w-4 h-4"/> Add Staff</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Employee Code</th>
                <th className="px-6 py-4 font-medium">Staff Name</th>
                <th className="px-6 py-4 font-medium">Branch</th>
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6">
                    <Skeleton className="h-8 mb-2" />
                    <Skeleton className="h-8 mb-2" />
                    <Skeleton className="h-8" />
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6">
                    <EmptyState message="No staff found." />
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{staff.employee_code}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{staff.user || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{staff.branch || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-600">{staff.service || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${staff.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Backend API pending"><Edit className="w-4 h-4" /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Backend API pending"><Ban className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Staff"
        footer={
          <>
            <button onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => setIsAddModalOpen(false)} className="btn-primary opacity-50 cursor-not-allowed">Add Staff</button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code</label>
            <input type="text" className="input-field" placeholder="EMP-001" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">User ID</label>
            <input type="text" className="input-field" placeholder="User ID" disabled />
          </div>
          <p className="text-sm text-slate-500">Creating staff requires backend implementation for Admin.</p>
        </form>
      </Modal>
    </div>
  );
};

export default AdminStaff;

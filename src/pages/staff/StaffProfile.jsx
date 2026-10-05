import React, { useState } from 'react';
import { User as UserIcon, Mail, Phone, Lock, Camera, Shield, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { useToast } from '../../components/common/Toast';

const StaffProfile = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await authService.updateProfile(profileData);
      await refreshUser();
      addToast("Profile updated successfully", "success");
    } catch (error) {
      addToast("Failed to update profile", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password.length < 8) {
      addToast("New password must be at least 8 characters", "error");
      return;
    }
    
    setIsChangingPwd(true);
    try {
      await authService.changePassword(passwordData);
      addToast("Password changed successfully", "success");
      setPasswordData({ current_password: '', new_password: '' });
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to change password";
      addToast(msg, "error");
    } finally {
      setIsChangingPwd(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Profile</h2>
          <p className="text-slate-500 text-sm">Manage your professional information</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium border border-primary-100">
          <BadgeCheck className="w-4 h-4" />
          Verified Staff
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Cover & Avatar */}
        <div className="h-32 bg-slate-800 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg relative group">
              <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-700 overflow-hidden uppercase">
                {user.name.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-full shadow-md hover:bg-slate-800 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="pt-16 p-8">
          <form className="space-y-6" onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    className="input-field pl-10 bg-slate-50" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Privilege</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" className="input-field pl-10 bg-slate-50 text-slate-500" defaultValue={user.role} disabled />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="tel" 
                    className="input-field pl-10 bg-slate-50" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    className="input-field pl-10 bg-slate-50 text-slate-500" 
                    value={user.email} 
                    disabled 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button type="submit" className="btn-primary" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card p-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-500" /> Security
        </h3>
        
        <form className="space-y-4 max-w-md" onSubmit={handlePasswordChange}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
              required
            />
          </div>
          <div className="pt-2">
            <button type="submit" className="btn-secondary" disabled={isChangingPwd}>
              {isChangingPwd ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffProfile;

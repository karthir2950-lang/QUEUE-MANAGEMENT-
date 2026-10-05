import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { register, googleLogin } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSuccessRedirect = (role) => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'STAFF') navigate('/staff/dashboard');
    else navigate('/user/dashboard');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      addToast("Password must be at least 8 characters", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password
      });
      
      addToast("Registration successful! Please login.", "success");
      navigate('/login');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Registration failed";
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      addToast(`Welcome, ${data.user.name}!`, 'success');
      handleSuccessRedirect(data.user.role);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Unable to sign in with Google";
      addToast(errorMsg, 'error');
    }
  };

  const handleGoogleError = () => {
    addToast("Google sign-in was cancelled or failed.", 'error');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <Clock className="h-8 w-8 text-primary-600" />
            <span className="font-bold text-2xl text-slate-900">SmartQueue</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Create an account</h2>
          <p className="mt-2 text-sm text-slate-600">Join us to manage your queues effortlessly</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <Input 
              label="Full Name"
              type="text" 
              name="name"
              required 
              icon={<UserIcon className="w-5 h-5" />}
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
            <Input 
              label="Email address"
              type="email" 
              name="email"
              required 
              icon={<Mail className="w-5 h-5" />}
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            <Input 
              label="Phone Number (Optional)"
              type="tel" 
              name="phone"
              icon={<Phone className="w-5 h-5" />}
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleChange}
            />
            <Input 
              label="Password"
              type="password" 
              name="password"
              required 
              icon={<Lock className="w-5 h-5" />}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
            />
            <Input 
              label="Confirm Password"
              type="password" 
              name="confirmPassword"
              required 
              icon={<Lock className="w-5 h-5" />}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full py-3" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">OR</span>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="continue_with"
            shape="rectangular"
            width="340"
          />
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

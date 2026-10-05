import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Mail, Lock, LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { login, googleLogin } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSuccessRedirect = (role) => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'STAFF') navigate('/staff/dashboard');
    else navigate('/user/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await login({ email, password });
      addToast(`Welcome back, ${data.user.name}!`, 'success');
      handleSuccessRedirect(data.user.role);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Invalid email or password";
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin(credentialResponse.credential);
      addToast(`Welcome back, ${data.user.name}!`, 'success');
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
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">Please sign in to your account</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <Input 
              label="Email address"
              type="email" 
              autoComplete="email" 
              required 
              icon={<Mail className="w-5 h-5" />}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input 
              label="Password"
              type="password" 
              autoComplete="current-password" 
              required 
              icon={<Lock className="w-5 h-5" />}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">Remember me</label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">Forgot your password?</Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-3 flex justify-center gap-2" disabled={loading}>
            <LogIn className="w-5 h-5" /> {loading ? "Signing in..." : "Sign in"}
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
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

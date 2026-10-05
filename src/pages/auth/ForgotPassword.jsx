import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input type="email" required className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <button type="submit" className="btn-primary w-full flex justify-center py-2.5">
                Send Reset Link
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="flex justify-center items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

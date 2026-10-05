import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md animate-fade-in-up">
        <h1 className="text-9xl font-black text-primary-600 tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
        <p className="text-slate-500">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <Link to="/">
            <Button variant="primary" className="flex items-center gap-2 mx-auto">
              <Home className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

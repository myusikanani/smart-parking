import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';

interface ProtectedRouteProps {
  allowedRoles?: ('user' | 'admin' | 'security')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'security') return <Navigate to="/security" replace />;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 font-inter">
        <div className="glass-card max-w-md w-full p-8 text-center space-y-6 border border-red-500/30 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
            <HiOutlineShieldExclamation className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
            <p className="text-sm text-gray-400 mt-2">
              You don't have permission to view this page.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Signed in as <span className="text-cyan-400">{user.email}</span> ({user.role})
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-neon w-full py-3 px-4 rounded-xl font-semibold text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;

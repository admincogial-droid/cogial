import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

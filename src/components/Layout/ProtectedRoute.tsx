import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Navigation from './Navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, token } = useAuthStore();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto">{children}</main>
      <Navigation />
    </div>
  );
}

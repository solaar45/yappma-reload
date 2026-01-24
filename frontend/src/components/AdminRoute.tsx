import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/permissions';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin(user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Zugriff verweigert</h1>
          <p className="text-muted-foreground">Du benötigst Administrator-Rechte, um diese Seite zu sehen.</p>
          <a href="/" className="text-primary hover:underline">Zurück zum Dashboard</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

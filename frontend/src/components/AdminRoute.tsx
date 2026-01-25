import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/permissions';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-destructive">
            {t('admin.accessDenied.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.accessDenied.description')}
          </p>
          <a href="/" className="text-primary hover:underline">
            {t('admin.accessDenied.backToDashboard')}
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

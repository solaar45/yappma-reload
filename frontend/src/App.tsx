import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { AppSidebar } from '@/components/app-sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import AccountsPage from '@/pages/AccountsPage';
import AssetsPage from '@/pages/AssetsPage';
import InstitutionsPage from '@/pages/InstitutionsPage';
import SnapshotsPage from '@/pages/SnapshotsPage';
import BankConnectionsPage from '@/pages/BankConnectionsPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

function getBreadcrumb(pathname: string): string {
  const breadcrumbs: Record<string, string> = {
    '/': 'Dashboard',
    '/accounts': 'Accounts',
    '/assets': 'Assets',
    '/snapshots': 'Snapshots',
    '/institutions': 'Institutions',
    '/bank-connections': 'Bank Connections',
  };

  return breadcrumbs[pathname] || 'Dashboard';
}

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const breadcrumb = getBreadcrumb(location.pathname);

  // Public routes (login/register)
  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Protected routes
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumb}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <ErrorBoundary
            onError={(error, errorInfo) => {
              logger.error('Route Error Caught', { error, errorInfo });
            }}
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/snapshots" element={<SnapshotsPage />} />
              <Route path="/institutions" element={<InstitutionsPage />} />
              <Route path="/bank-connections" element={<BankConnectionsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('App Error Caught', { error, errorInfo });
      }}
    >
      <AuthProvider>
        <UserProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UserProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

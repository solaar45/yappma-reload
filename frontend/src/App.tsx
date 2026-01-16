import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppSidebar } from '@/components/app-sidebar';
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
import TaxesPage from '@/pages/TaxesPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

function AppContent() {
  const { t } = useTranslation();
  const location = useLocation();

  const getBreadcrumb = (pathname: string): string => {
    const breadcrumbs: Record<string, string> = {
      '/': t('navigation.dashboard'),
      '/accounts': t('navigation.accounts'),
      '/assets': t('navigation.assets'),
      '/snapshots': t('navigation.snapshots'),
      '/institutions': t('navigation.institutions'),
      '/taxes': t('taxes.title'),
    };

    return breadcrumbs[pathname] || t('navigation.dashboard');
  };

  const breadcrumb = getBreadcrumb(location.pathname);

  return (
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

        {/* Wrap Routes with ErrorBoundary */}
        <ErrorBoundary
          onError={(error, errorInfo) => {
            logger.error('Route Error Caught', { error, errorInfo });
          }}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <AccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <AssetsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/snapshots"
              element={
                <ProtectedRoute>
                  <SnapshotsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/institutions"
              element={
                <ProtectedRoute>
                  <InstitutionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/taxes"
              element={
                <ProtectedRoute>
                  <TaxesPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </ErrorBoundary>
      </SidebarInset>
    </SidebarProvider>
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

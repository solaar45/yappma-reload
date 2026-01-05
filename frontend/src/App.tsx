import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from '@/contexts/UserContext';
import { AppSidebar } from '@/components/app-sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { logger } from '@/lib/logger';
import { Toaster } from '@/components/ui/sonner';
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

// Main Pages - Mixed imports (standardizing to default)
import DashboardPage from '@/pages/DashboardPage';
import { AccountsPage } from '@/pages/AccountsPage';
import AssetsPage from '@/pages/AssetsPage';
import InstitutionsPage from '@/pages/InstitutionsPage';
import SnapshotsPage from '@/pages/SnapshotsPage';
import TransactionsPage from '@/pages/TransactionsPage';

// Bank Connections (PSD2)
import { BankConnectionsPage } from '@/pages/BankConnectionsPage';
import { BankCallback } from '@/pages/BankCallback';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function getBreadcrumb(pathname: string): string {
  const breadcrumbs: Record<string, string> = {
    '/': 'Dashboard',
    '/accounts': 'Accounts',
    '/assets': 'Assets',
    '/snapshots': 'Snapshots',
    '/transactions': 'Transactions',
    '/institutions': 'Institutions',
    '/bank-connections': 'Bank Connections',
  };
  
  return breadcrumbs[pathname] || 'Dashboard';
}

function AppContent() {
  const location = useLocation();
  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <>
      <Routes>
        {/* Bank Callback - No Layout (standalone page) */}
        <Route path="/bank-callback" element={<BankCallback />} />
        
        {/* Main App - With Sidebar Layout */}
        <Route
          path="*"
          element={
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
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/institutions" element={<InstitutionsPage />} />
                    <Route path="/bank-connections" element={<BankConnectionsPage />} />
                  </Routes>
                </ErrorBoundary>
              </SidebarInset>
            </SidebarProvider>
          }
        />
      </Routes>
      
      {/* Toast Notifications */}
      <Toaster richColors position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          logger.error('App Error Caught', { error, errorInfo });
        }}
      >
        <UserProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UserProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

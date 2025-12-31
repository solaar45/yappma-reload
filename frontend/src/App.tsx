import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from '@/contexts/UserContext';
import { AppSidebar } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLocation, Link } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import AccountsPage from '@/pages/AccountsPage';
import AssetsPage from '@/pages/AssetsPage';
import InstitutionsPage from '@/pages/InstitutionsPage';
import SnapshotsPage from '@/pages/SnapshotsPage';
import './App.css';

function getBreadcrumbs(pathname: string) {
  if (pathname === '/') {
    return { main: 'Dashboard', sub: 'Overview' };
  }
  if (pathname === '/accounts') {
    return { main: 'Portfolio', sub: 'Accounts' };
  }
  if (pathname === '/assets') {
    return { main: 'Portfolio', sub: 'Assets' };
  }
  if (pathname === '/snapshots') {
    return { main: 'Portfolio', sub: 'Snapshots' };
  }
  if (pathname === '/institutions') {
    return { main: 'Settings', sub: 'Institutions' };
  }
  return { main: 'Dashboard', sub: 'Overview' };
}

function AppContent() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

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
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link to={location.pathname === '/' ? '#' : '/'}>{breadcrumbs.main}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbs.sub}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/snapshots" element={<SnapshotsPage />} />
          <Route path="/institutions" element={<InstitutionsPage />} />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}

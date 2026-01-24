import { Home, Database, TrendingUp, Building2, Receipt, ChevronUp, User2, Shield, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { isAdmin } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getRoleDisplayName } from '@/lib/permissions';

const mainItems = [
  {
    title: 'navigation.dashboard',
    url: '/',
    icon: Home,
  },
  {
    title: 'navigation.accounts',
    url: '/accounts',
    icon: Database,
  },
  {
    title: 'navigation.assets',
    url: '/assets',
    icon: TrendingUp,
  },
  {
    title: 'navigation.snapshots',
    url: '/snapshots',
    icon: Database,
  },
  {
    title: 'navigation.institutions',
    url: '/institutions',
    icon: Building2,
  },
  {
    title: 'navigation.taxes',
    url: '/taxes',
    icon: Receipt,
  },
];

const adminItems = [
  {
    title: 'admin.dashboard.title',
    defaultTitle: 'Admin Dashboard',
    url: '/admin',
    icon: Shield,
  },
  {
    title: 'admin.users.title',
    defaultTitle: 'Benutzerverwaltung',
    url: '/admin/users',
    icon: Users,
  },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation.menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.title)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {user && isAdmin(user) && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('navigation.admin', { defaultValue: 'Administration' })}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.title, { defaultValue: item.defaultTitle })}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <User2 className="h-4 w-4" />
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-sm font-medium">{user?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                      {user && isAdmin(user) && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <User2 className="mr-2 h-4 w-4" />
                  <span>{t('navigation.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <span>{t('navigation.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

import {
  Wallet,
  Landmark,
  PiggyBank,
  Camera,
  Receipt,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useUser } from '@/contexts/UserContext';
import { NavUser } from '@/components/nav-user';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; // Assuming we want language switching somewhere accessible or in settings page, but for sidebar footer we can keep it simple or remove if handled in settings page. Let's keep specific actions as items.

export function AppSidebar() {
  const { t } = useTranslation();
  const { user } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const mainItems = [
    {
      title: t('navigation.dashboard'),
      url: '/',
      icon: Landmark,
    },
    {
      title: t('navigation.accounts'),
      url: '/accounts',
      icon: Wallet,
    },
    {
      title: t('navigation.assets'),
      url: '/assets',
      icon: PiggyBank,
    },
    {
      title: t('navigation.snapshots'),
      url: '/snapshots',
      icon: Camera,
    },
    {
      title: t('taxes.title'),
      url: '/taxes',
      icon: Receipt,
    },
  ];

  // User data for the static header display
  const userData = {
    name: user?.name || 'User',
    email: user?.email || '',
    avatar: '',
  };

  return (
    <Sidebar collapsible="icon">
      {/* 1. Static User Info in Header (No dropdown, just visual context or link to profile) */}
      <SidebarHeader>
        <NavUser user={userData} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3',
                          isActive &&
                            'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        )
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 2. Footer with explicit Actions (Settings, Logout) */}
      <SidebarFooter>
        <SidebarMenu>
          {/* Settings Link */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t('settings.title')}>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3',
                    isActive &&
                      'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  )
                }
              >
                <Settings />
                <span>{t('settings.title')}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Logout Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip={t('common.logout')}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut />
              <span>{t('common.logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

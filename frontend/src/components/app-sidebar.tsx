import { Wallet, Landmark, PiggyBank, Camera, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
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
} from '@/components/ui/sidebar';
import { useUser } from '@/contexts/UserContext';
import { NavUser } from '@/components/nav-user';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { t } = useTranslation();
  const { user } = useUser();

  const items = [
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

  // Prepare user object for NavUser component
  const userData = {
    name: user?.name || 'User',
    email: user?.email || '',
    avatar: '', // NavUser handles fallback
  };

  return (
    <Sidebar collapsible="icon">
      {/* 1. User Menu prominent in Header */}
      <SidebarHeader>
        <NavUser user={userData} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3',
                          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
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
      
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}

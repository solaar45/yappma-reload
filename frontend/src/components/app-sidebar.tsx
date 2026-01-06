import { ChevronUp, User2, Settings, LogOut, Wallet, Landmark, PiggyBank, Camera, Building2, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useUser } from '@/contexts/UserContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useUser();

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
      title: t('navigation.institutions'),
      url: '/institutions',
      icon: Building2,
    },
    {
      title: t('taxes.title'),
      url: '/taxes',
      icon: Receipt,
    },
  ];

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>YAPPMA</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3',
                          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || 'User'}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <User2 className="mr-2 h-4 w-4" />
                  <span>{t('user.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('user.settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <LanguageSwitcher />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('user.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

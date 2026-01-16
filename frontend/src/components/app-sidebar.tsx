import {
  Wallet,
  Landmark,
  PiggyBank,
  Camera,
  Receipt,
  Settings,
  LogOut,
  Languages,
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
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/UserContext';
import { NavUser } from '@/components/nav-user';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  ];

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

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
      {/* 1. Static User Info in Header */}
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

      {/* 2. Footer with explicit Actions (Settings, Language, Logout) */}
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

          {/* Language Switcher */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip={t('settings.language')}>
                  <Languages />
                  <span>{currentLanguage.name}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-48">
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{language.flag}</span>
                      <span>{language.name}</span>
                    </span>
                    {i18n.language === language.code && (
                      <span className="text-xs">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

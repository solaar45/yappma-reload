import * as React from 'react';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  PiggyBank,
  Camera,
  ArrowLeftRight,
  Link2,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: 'Accounts',
      url: '/accounts',
      icon: Wallet,
    },
    {
      title: 'Assets',
      url: '/assets',
      icon: PiggyBank,
    },
    {
      title: 'Snapshots',
      url: '/snapshots',
      icon: Camera,
    },
    {
      title: 'Transactions',
      url: '/transactions',
      icon: ArrowLeftRight,
    },
    {
      title: 'Institutions',
      url: '/institutions',
      icon: Building2,
    },
    {
      title: 'Bank Connections',
      url: '/bank-connections',
      icon: Link2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <PiggyBank className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">YAPPMA</span>
                  <span className="truncate text-xs">Wealth Tracker</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

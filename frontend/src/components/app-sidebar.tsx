"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  Building2,
  Calendar,
  Link2,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Wallet,
  },
  {
    title: "Assets",
    url: "/assets",
    icon: PiggyBank,
  },
  {
    title: "Snapshots",
    url: "/snapshots",
    icon: Calendar,
  },
  {
    title: "Institutions",
    url: "/institutions",
    icon: Building2,
  },
  {
    title: "Bank Connections",
    url: "/bank-connections",
    icon: Link2,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: `/avatars/user.jpg`,
      }
    : {
        name: "Guest",
        email: "guest@yappma.local",
        avatar: "/avatars/user.jpg",
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={[{ name: "YAPPMA", logo: LayoutDashboard, plan: "Personal" }]} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

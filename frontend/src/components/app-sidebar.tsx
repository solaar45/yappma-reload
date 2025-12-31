"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  TrendingUp,
  Settings,
  Building2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Demo User",
    email: "demo@yappma.local",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Portfolio",
      url: "#",
      icon: TrendingUp,
      items: [
        {
          title: "Accounts",
          url: "/accounts",
        },
        {
          title: "Assets",
          url: "/assets",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Institutions",
          url: "/institutions",
        },
      ],
    },
  ],
  quickAccess: [
    {
      name: "Accounts",
      url: "/accounts",
      icon: Wallet,
    },
    {
      name: "Assets",
      url: "/assets",
      icon: PiggyBank,
    },
    {
      name: "Institutions",
      url: "/institutions",
      icon: Building2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={[{ name: "YAPPMA", logo: LayoutDashboard, plan: "Personal" }]} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.quickAccess} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

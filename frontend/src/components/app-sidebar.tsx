"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Wallet,
  PiggyBank,
  TrendingUp,
  Settings2,
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

// YAPPMA data
const data = {
  user: {
    name: "Demo User",
    email: "demo@yappma.local",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "YAPPMA",
      logo: GalleryVerticalEnd,
      plan: "Personal",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/",
        },
      ],
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
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Profile",
          url: "#",
        },
      ],
    },
  ],
  projects: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Settings,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "#", icon: LayoutDashboard, current: true },
  { name: "Accounts", href: "#", icon: Wallet, current: false },
  { name: "Assets", href: "#", icon: TrendingUp, current: false },
  { name: "Institutions", href: "#", icon: Building2, current: false },
  { name: "Settings", href: "#", icon: Settings, current: false },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <h1 className="text-lg font-semibold">YAPPMA</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              item.current
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {!collapsed ? (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">YAPPMA v1.0</p>
            <p>© 2025 All rights reserved</p>
          </div>
        ) : (
          <div className="h-8" />
        )}
      </div>
    </div>
  );
}
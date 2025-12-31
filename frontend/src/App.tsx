import { useDashboard } from "@/lib/api/hooks";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, PiggyBank } from "lucide-react";

export default function Page() {
  // Fetch real dashboard data from backend
  // TODO: Make userId dynamic (from auth/context)
  const { netWorth, accountSnapshots, assetSnapshots, loading, error } = useDashboard({
    userId: 1,
  });

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 items-center justify-center">
            <div className="text-destructive">
              Error loading dashboard: {error}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Metric Cards Grid */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {/* Net Worth Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Net Worth
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-32 animate-pulse bg-muted rounded" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {netWorth ? formatCurrency(netWorth.total) : "€0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      as of {netWorth ? formatDate(netWorth.date) : "today"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Accounts Total Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total in Accounts
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-32 animate-pulse bg-muted rounded" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {netWorth ? formatCurrency(netWorth.accounts) : "€0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {accountSnapshots?.snapshots.length || 0} account(s)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Assets Total Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total in Assets
                </CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-32 animate-pulse bg-muted rounded" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {netWorth ? formatCurrency(netWorth.assets) : "€0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {assetSnapshots?.snapshots.length || 0} asset(s)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse bg-muted rounded" />
                    ))}
                  </div>
                ) : accountSnapshots?.snapshots.length ? (
                  <div className="space-y-4">
                    {accountSnapshots.snapshots.slice(0, 5).map((snapshot) => (
                      <div key={snapshot.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {snapshot.account?.name || "Unknown Account"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {snapshot.account?.institution?.name || "No institution"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(snapshot.balance, snapshot.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(snapshot.snapshot_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No account snapshots yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Assets */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Assets</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse bg-muted rounded" />
                    ))}
                  </div>
                ) : assetSnapshots?.snapshots.length ? (
                  <div className="space-y-4">
                    {assetSnapshots.snapshots.slice(0, 5).map((snapshot) => (
                      <div key={snapshot.id} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {snapshot.asset?.name || "Unknown Asset"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {snapshot.asset?.asset_type?.description || "No type"}
                            {snapshot.quantity && (
                              <> · {parseFloat(snapshot.quantity).toFixed(2)} units</>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(snapshot.value, snapshot.asset?.currency || "EUR")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(snapshot.snapshot_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No asset snapshots yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AreaChart } from "@/components/charts/AreaChart";
import { LineChart } from "@/components/charts/LineChart";
import { BarList } from "@/components/charts/BarList";
import { KpiCard } from "@/components/charts/KpiCard";
import { formatCurrency } from "@/lib/utils";
import { Plus, TrendingUp, Wallet, PiggyBank } from "lucide-react";

const portfolioData = [
  { month: "Jan", stocks: 45000, bonds: 20000, cash: 10000 },
  { month: "Feb", stocks: 48000, bonds: 21000, cash: 9500 },
  { month: "Mar", stocks: 52000, bonds: 22000, cash: 9000 },
  { month: "Apr", stocks: 49000, bonds: 23000, cash: 8500 },
  { month: "May", stocks: 55000, bonds: 24000, cash: 8000 },
  { month: "Jun", stocks: 58000, bonds: 25000, cash: 7500 },
  { month: "Jul", stocks: 62000, bonds: 26000, cash: 7000 },
  { month: "Aug", stocks: 65000, bonds: 27000, cash: 6500 },
  { month: "Sep", stocks: 68000, bonds: 28000, cash: 6000 },
  { month: "Oct", stocks: 72000, bonds: 29000, cash: 5500 },
  { month: "Nov", stocks: 78000, bonds: 30000, cash: 5000 },
  { month: "Dec", stocks: 86420, bonds: 31000, cash: 4964 },
];

const assetAllocation = [
  { name: "Stocks", value: 86420, color: "blue" as const },
  { name: "Bonds", value: 31000, color: "emerald" as const },
  { name: "Cash", value: 4964, color: "amber" as const },
  { name: "Real Estate", value: 20000, color: "violet" as const },
];

const recentAccounts = [
  { id: 1, account: "Girokonto", date: "2025-12-30", amount: 5420.5 },
  { id: 2, account: "Depot", date: "2025-12-29", amount: 86420.0 },
  { id: 3, account: "Tagesgeld", date: "2025-12-28", amount: 12500.0 },
];

function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">YAPPMA Dashboard</h1>
            <p className="text-muted-foreground">
              Your personal wealth tracking application
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Create a new account to track your finances.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input id="name" placeholder="e.g. Girokonto" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Input id="type" placeholder="e.g. checking" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="balance">Initial Balance</Label>
                  <Input id="balance" type="number" placeholder="0.00" />
                </div>
              </div>
              <Button className="w-full">Create Account</Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards with Tremor-style */}
        <div className="grid gap-6 md:grid-cols-3">
          <KpiCard
            title="Total Net Worth"
            value={formatCurrency(142384)}
            change={20.1}
            changeLabel="from last month"
            icon={<Wallet className="h-4 w-4" />}
          />
          <KpiCard
            title="Investments"
            value={formatCurrency(86420)}
            change={12.5}
            changeLabel="this month"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            title="Savings"
            value={formatCurrency(12500)}
            change={-5.2}
            changeLabel="from last month"
            icon={<PiggyBank className="h-4 w-4" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Portfolio Trend - AreaChart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaChart
                data={portfolioData}
                index="month"
                categories={["stocks", "bonds", "cash"]}
                colors={["blue", "emerald", "amber"]}
                valueFormatter={(value) => formatCurrency(value)}
              />
            </CardContent>
          </Card>

          {/* Asset Allocation - BarList */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <BarList
                data={assetAllocation}
                valueFormatter={(value) => formatCurrency(value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Net Worth Trend - LineChart */}
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={portfolioData.map((d) => ({
                month: d.month,
                total: d.stocks + d.bonds + d.cash,
              }))}
              index="month"
              categories={["total"]}
              colors={["violet"]}
              valueFormatter={(value) => formatCurrency(value)}
              showLegend={false}
            />
          </CardContent>
        </Card>

        {/* Recent Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.account}
                    </TableCell>
                    <TableCell>{account.date}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(account.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
import { MetricCard } from "@/components/charts/MetricCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { AreaChart } from "@/components/charts/AreaChart";
import { LineChart } from "@/components/charts/LineChart";
import { BarList } from "@/components/charts/BarList";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, PiggyBank, Activity } from "lucide-react";

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
  { name: "Stocks", value: 86420, color: "chart-1" as const },
  { name: "Bonds", value: 31000, color: "chart-2" as const },
  { name: "Cash", value: 4964, color: "chart-3" as const },
  { name: "Real Estate", value: 20000, color: "chart-4" as const },
];

const recentTransactions = [
  {
    id: 1,
    account: "Girokonto",
    type: "Deposit",
    amount: 2500.0,
    date: "2025-12-30",
  },
  {
    id: 2,
    account: "Depot",
    type: "Investment",
    amount: 5000.0,
    date: "2025-12-29",
  },
  {
    id: 3,
    account: "Tagesgeld",
    type: "Interest",
    amount: 125.5,
    date: "2025-12-28",
  },
  {
    id: 4,
    account: "Depot",
    type: "Dividend",
    amount: 420.0,
    date: "2025-12-27",
  },
];

export function Dashboard() {
  const loading = false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your financial portfolio
        </p>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Net Worth"
          value={formatCurrency(142384)}
          change={{ value: 20.1, label: "from last month" }}
          icon={Wallet}
          loading={loading}
        />
        <MetricCard
          title="Investments"
          value={formatCurrency(86420)}
          change={{ value: 12.5, label: "this month" }}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Savings"
          value={formatCurrency(12500)}
          change={{ value: -5.2, label: "from last month" }}
          icon={PiggyBank}
          loading={loading}
        />
        <MetricCard
          title="Activity"
          value="24"
          change={{ value: 8.3, label: "transactions this week" }}
          icon={Activity}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <ChartCard
            title="Portfolio Performance"
            description="Monthly breakdown of your assets"
            loading={loading}
          >
            <AreaChart
              data={portfolioData}
              index="month"
              categories={["stocks", "bonds", "cash"]}
              colors={["chart-1", "chart-2", "chart-3"]}
              valueFormatter={(value) => formatCurrency(value)}
            />
          </ChartCard>
        </div>
        <div className="lg:col-span-3">
          <ChartCard
            title="Asset Allocation"
            description="Distribution across asset classes"
            loading={loading}
          >
            <div className="pt-6">
              <BarList
                data={assetAllocation}
                valueFormatter={(value) => formatCurrency(value)}
              />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Net Worth Trend */}
      <ChartCard
        title="Net Worth Trend"
        description="Total portfolio value over time"
        loading={loading}
      >
        <LineChart
          data={portfolioData.map((d) => ({
            month: d.month,
            total: d.stocks + d.bonds + d.cash,
          }))}
          index="month"
          categories={["total"]}
          colors={["chart-1"]}
          valueFormatter={(value) => formatCurrency(value)}
          showLegend={false}
        />
      </ChartCard>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.account}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {transaction.date}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
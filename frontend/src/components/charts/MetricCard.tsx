import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: LucideIcon;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-24 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = change && change.value >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            <span
              className={cn(
                "font-medium",
                isPositive ? "text-foreground" : "text-foreground"
              )}
            >
              {isPositive ? "+" : ""}
              {change.value}%
            </span>{" "}
            {change.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
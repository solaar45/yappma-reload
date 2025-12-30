import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const KpiCard = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}: KpiCardProps) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                isPositive ? "text-green-600" : "text-red-600",
                "font-medium"
              )}
            >
              {isPositive ? "+" : ""}
              {change}%
            </span>
            {changeLabel && <span>{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
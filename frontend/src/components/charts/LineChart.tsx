import React from "react";
import {
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  AvailableChartColors,
  AvailableChartColorsKeys,
  constructCategoryColors,
} from "@/lib/chartUtils";

interface LineChartProps {
  data: Record<string, any>[];
  index: string;
  categories: string[];
  colors?: AvailableChartColorsKeys[];
  valueFormatter?: (value: number) => string;
  className?: string;
  showLegend?: boolean;
}

export const LineChart = ({
  data,
  index,
  categories,
  colors = AvailableChartColors,
  valueFormatter = (value: number) => value.toString(),
  className,
}: LineChartProps) => {
  const categoryColors = constructCategoryColors(categories, colors);

  return (
    <div className={cn("h-80 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div className="rounded-lg border bg-card p-3 shadow-md">
                  <div className="grid gap-2">
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: `hsl(var(--${categoryColors.get(entry.name) || "chart-1"}))`
                          }}
                        />
                        <span className="font-medium text-card-foreground">
                          {entry.name}:
                        </span>
                        <span className="text-muted-foreground">
                          {valueFormatter(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
          {categories.map((category) => {
            const color = categoryColors.get(category) || "chart-1";
            return (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={`hsl(var(--${color}))`}
                strokeWidth={2}
                dot={false}
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
import React from "react";
import {
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  AvailableChartColors,
  AvailableChartColorsKeys,
  constructCategoryColors,
  getColorClassName,
} from "@/lib/chartUtils";

interface AreaChartProps {
  data: Record<string, any>[];
  index: string;
  categories: string[];
  colors?: AvailableChartColorsKeys[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export const AreaChart = ({
  data,
  index,
  categories,
  colors = AvailableChartColors,
  valueFormatter = (value: number) => value.toString(),
  className,
}: AreaChartProps) => {
  const categoryColors = constructCategoryColors(categories, colors);

  return (
    <div className={cn("h-80 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-gray-200 dark:stroke-gray-800"
          />
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-gray-500"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-gray-500"
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    {payload.map((entry: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            getColorClassName(
                              categoryColors.get(entry.name) || "blue",
                              "bg"
                            )
                          )}
                        />
                        <span className="text-sm font-medium">
                          {entry.name}:
                        </span>
                        <span className="text-sm">
                          {valueFormatter(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
          {categories.map((category) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={`var(--color-${categoryColors.get(category) || "blue"}-500)`}
              fill={`var(--color-${categoryColors.get(category) || "blue"}-500)`}
              fillOpacity={0.1}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
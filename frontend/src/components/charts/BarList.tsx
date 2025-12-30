import React from "react";
import { cn } from "@/lib/utils";
import { AvailableChartColorsKeys } from "@/lib/chartUtils";

interface BarListItem {
  name: string;
  value: number;
  color?: AvailableChartColorsKeys;
}

interface BarListProps {
  data: BarListItem[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export const BarList = ({
  data,
  valueFormatter = (value: number) => value.toString(),
  className,
}: BarListProps) => {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const color = item.color || "chart-1";

        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {item.name}
              </span>
              <span className="text-muted-foreground">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: `hsl(var(--${color}))`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
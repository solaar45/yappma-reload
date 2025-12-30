import React from "react";
import { cn } from "@/lib/utils";
import {
  AvailableChartColorsKeys,
  getColorClassName,
} from "@/lib/chartUtils";

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
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const color = item.color || "blue";

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.name}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {valueFormatter(item.value)}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  getColorClassName(color, "bg")
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
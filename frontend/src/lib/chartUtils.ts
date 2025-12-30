// Chart color mapping to shadcn/ui CSS variables
export const AvailableChartColors = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
] as const;

export type AvailableChartColorsKeys = (typeof AvailableChartColors)[number];

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[]
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>();
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length]);
  });
  return categoryColors;
};

export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: "bg" | "stroke" | "fill" | "text"
): string => {
  // Return CSS variable reference instead of Tailwind class
  return `hsl(var(--${color}))`;
};
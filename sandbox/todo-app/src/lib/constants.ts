import type { Priority, TodoColor } from "./schema";

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const TODO_COLORS: { value: TodoColor; label: string; borderClass: string }[] = [
  { value: "zinc", label: "Default", borderClass: "border-l-zinc-500" },
  { value: "blue", label: "Blue", borderClass: "border-l-blue-500" },
  { value: "emerald", label: "Emerald", borderClass: "border-l-emerald-500" },
  { value: "amber", label: "Amber", borderClass: "border-l-amber-500" },
  { value: "rose", label: "Rose", borderClass: "border-l-rose-500" },
  { value: "violet", label: "Violet", borderClass: "border-l-violet-500" },
];

export const COLOR_BORDER_MAP: Record<TodoColor, string> = {
  zinc: "border-l-zinc-500",
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  rose: "border-l-rose-500",
  violet: "border-l-violet-500",
};

export const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];

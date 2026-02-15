"use client";

import { useTodoStore } from "@/store/todo-store";
import type { FilterKind } from "@/store/todo-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const filters: { value: FilterKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export function TodoFilters() {
  const filter = useTodoStore((s) => s.filter);
  const setFilter = useTodoStore((s) => s.setFilter);

  return (
    <Tabs
      value={filter}
      onValueChange={(v) => setFilter(v as FilterKind)}
      className="w-full"
      aria-label="Filter todos"
    >
      <TabsList className="w-fit">
        {filters.map((f) => (
          <TabsTrigger key={f.value} value={f.value}>
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

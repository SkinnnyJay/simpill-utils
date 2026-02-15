"use client";

import { useTodoStore } from "@/store/todo-store";
import { Button } from "@/components/ui/button";

export function ClearCompleted() {
  const todos = useTodoStore((s) => s.todos);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);
  const hasCompleted = todos.some((t) => t.completed);

  if (!hasCompleted) return null;

  return (
    <Button type="button" variant="ghost" size="sm" onClick={clearCompleted}>
      Clear completed
    </Button>
  );
}

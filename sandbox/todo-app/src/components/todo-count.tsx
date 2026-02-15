"use client";

import { useTodoStore } from "@/store/todo-store";

export function TodoCount() {
  const todos = useTodoStore((s) => s.todos);
  const active = todos.filter((t) => !t.completed).length;
  const completed = todos.filter((t) => t.completed).length;

  if (todos.length === 0) return null;

  return (
    <span className="text-sm text-zinc-500" aria-live="polite">
      {completed === 0
        ? `${active} ${active === 1 ? "item" : "items"}`
        : `${active} active, ${completed} completed`}
    </span>
  );
}

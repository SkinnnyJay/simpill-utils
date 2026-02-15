"use client";

import { ClearCompleted } from "@/components/clear-completed";
import { TodoFilters } from "@/components/todo-filters";
import { TodoForm } from "@/components/todo-form";
import { TodoList } from "@/components/todo-list";
import { TodoCount } from "@/components/todo-count";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-light tracking-tight">Todos</h1>
          <ThemeToggle />
        </div>
        <div className="mb-6">
          <TodoForm />
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <TodoFilters />
          <div className="flex items-center gap-3">
            <TodoCount />
            <ClearCompleted />
          </div>
        </div>
        <TodoList />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Click a todo to edit. Drag to reorder. Press Enter to save, Escape to cancel.
        </p>
      </main>
    </div>
  );
}

"use client";

import { ClearCompleted } from "@/components/clear-completed";
import { TodoFilters } from "@/components/todo-filters";
import { TodoForm } from "@/components/todo-form";
import { TodoList } from "@/components/todo-list";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <h1 className="mb-8 text-center text-3xl font-light tracking-tight text-zinc-100">
          Todos
        </h1>
        <div className="mb-6">
          <TodoForm />
        </div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <TodoFilters />
          <ClearCompleted />
        </div>
        <TodoList />
      </main>
    </div>
  );
}

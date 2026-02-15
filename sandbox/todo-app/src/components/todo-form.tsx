"use client";

import { useStableCallback } from "@simpill/react.utils";
import { safeParseResult } from "@simpill/zod.utils";
import { useState } from "react";
import { useTodoStore } from "@/store/todo-store";
import { addTodoSchema } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TodoForm() {
  const addTodo = useTodoStore((s) => s.addTodo);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useStableCallback(((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = safeParseResult(addTodoSchema, { title });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid");
      return;
    }
    addTodo(parsed.data.title);
    setTitle("");
  }) as (...args: unknown[]) => unknown);

  return (
    <div className="w-full max-w-xl space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          aria-label="New todo title"
          className="flex-1"
        />
        <Button type="submit">Add</Button>
      </form>
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

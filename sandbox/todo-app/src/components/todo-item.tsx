"use client";

import { useStableCallback } from "@simpill/react.utils";
import { useState, forwardRef } from "react";
import { useTodoStore } from "@/store/todo-store";
import type { Todo, Priority, TodoColor } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLOR_BORDER_MAP, PRIORITY_LABELS, TODO_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export type DragHandleProps = {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown>;
};

export const TodoItem = forwardRef<
  HTMLLIElement,
  { todo: Todo; dragHandleProps?: DragHandleProps; style?: React.CSSProperties }
>(function TodoItem({ todo, dragHandleProps, style }, ref) {
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const updateTodo = useTodoStore((s) => s.updateTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const setPriority = useTodoStore((s) => s.setPriority);
  const setColor = useTodoStore((s) => s.setColor);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleToggle = useStableCallback(
    (() => toggleTodo(todo.id)) as (...args: unknown[]) => unknown
  );
  const handleDelete = useStableCallback(
    (() => deleteTodo(todo.id)) as (...args: unknown[]) => unknown
  );
  const handleSaveEdit = useStableCallback(
    (() => {
      const t = editTitle.trim();
      if (t) updateTodo(todo.id, t);
      setEditing(false);
    }) as (...args: unknown[]) => unknown
  );

  const priority = todo.priority ?? "medium";
  const color = todo.color ?? "zinc";
  const borderClass = COLOR_BORDER_MAP[color];

  return (
    <li
      ref={ref}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-l-4 bg-card px-3 py-2.5 transition-all duration-300 hover:border-border",
        borderClass,
        todo.completed && "opacity-75"
      )}
      data-testid={`todo-item-${todo.id}`}
      data-completed={todo.completed}
      data-priority={priority}
      data-color={color}
    >
      {dragHandleProps && (
        <button
          type="button"
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing [&:focus]:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <Checkbox
        checked={todo.completed}
        onCheckedChange={handleToggle}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
      />
      {editing ? (
        <Input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit();
            if (e.key === "Escape") {
              setEditTitle(todo.title);
              setEditing(false);
            }
          }}
          autoFocus
          className="flex-1 min-w-0"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={cn(
            "flex-1 cursor-pointer select-none transition-all duration-300",
            todo.completed
              ? "text-muted-foreground line-through opacity-80"
              : "text-foreground"
          )}
        >
          {todo.title}
        </span>
      )}
      {!editing && (
        <>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(todo.id, v as Priority)}
          >
            <SelectTrigger
              className="h-7 w-[90px] shrink-0 text-xs"
              aria-label={`Priority for ${todo.title}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["low", "medium", "high"] as const).map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={color}
            onValueChange={(v) => setColor(todo.id, v as TodoColor)}
          >
            <SelectTrigger
              className="h-7 w-[100px] shrink-0 text-xs"
              aria-label={`Color for ${todo.title}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TODO_COLORS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100 shrink-0"
        aria-label={`Delete "${todo.title}"`}
      >
        <span aria-hidden>×</span>
      </Button>
    </li>
  );
});

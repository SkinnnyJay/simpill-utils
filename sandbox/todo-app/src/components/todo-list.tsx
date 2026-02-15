"use client";

import { partition } from "@simpill/array.utils";
import { useTodoStore } from "@/store/todo-store";
import { TodoItem } from "./todo-item";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Todo } from "@/lib/schema";

function SortableTodoItem({ todo, canDrag }: { todo: Todo; canDrag: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({ id: todo.id, disabled: !canDrag });

  const style: React.CSSProperties = {
    ...(transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          transition,
        }
      : {}),
    ...(isDragging ? { opacity: 0.5 } : {}),
  };

  return (
    <TodoItem
      ref={setNodeRef}
      style={style}
      todo={todo}
      dragHandleProps={
        canDrag
          ? {
              attributes: attributes as unknown as Record<string, unknown>,
              listeners: listeners as unknown as Record<string, unknown>,
            }
          : undefined
      }
    />
  );
}

export function TodoList() {
  const todos = useTodoStore((s) => s.todos);
  const filter = useTodoStore((s) => s.filter);
  const reorderTodos = useTodoStore((s) => s.reorderTodos);

  const [completed, active] = partition(todos, (t) => t.completed);
  const visible =
    filter === "all" ? todos : filter === "active" ? active : completed;
  const canDrag = filter === "all" && visible.length > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || filter !== "all") return;
    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderTodos(oldIndex, newIndex);
  }

  if (todos.length === 0) {
    return (
      <p
        className="text-center py-8 text-muted-foreground"
        data-testid="todo-empty"
      >
        No todos yet. Add one above.
      </p>
    );
  }

  if (filter !== "all") {
    return (
      <ul className="flex flex-col gap-2" data-testid="todo-list">
        {visible.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visible.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2" data-testid="todo-list">
          {visible.map((todo) => (
            <SortableTodoItem key={todo.id} todo={todo} canDrag={canDrag} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

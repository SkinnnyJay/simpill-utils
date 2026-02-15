"use client";

import { addCreatedAt, touchUpdatedAt } from "@simpill/data.utils";
import {
  createAppStore,
  getClientOnlyStorage,
  type PersistOptions,
} from "@simpill/zustand.utils/client";
import { generateUUID } from "@simpill/uuid.utils";
import type { Todo, Priority, TodoColor } from "@/lib/schema";

export type FilterKind = "all" | "active" | "completed";

interface TodoState {
  todos: Todo[];
  filter: FilterKind;
  addTodo: (title: string) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, title: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
  setFilter: (filter: FilterKind) => void;
  reorderTodos: (fromIndex: number, toIndex: number) => void;
  setPriority: (id: string, priority: Priority) => void;
  setColor: (id: string, color: TodoColor) => void;
}

export const useTodoStore = createAppStore<TodoState>(
  (set) => ({
    todos: [],
    filter: "all",
    addTodo: (title) =>
      set((state) => ({
        todos: [
          ...state.todos,
          addCreatedAt({
            id: generateUUID(),
            title: title.trim(),
            completed: false,
            priority: "medium",
            color: "zinc",
          }) as Todo,
        ],
      })),
    toggleTodo: (id) =>
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? touchUpdatedAt({ ...t, completed: !t.completed }) : t
        ),
      })),
    updateTodo: (id, title) =>
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? touchUpdatedAt({ ...t, title: title.trim() }) : t
        ),
      })),
    deleteTodo: (id) =>
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id),
      })),
    clearCompleted: () =>
      set((state) => ({
        todos: state.todos.filter((t) => !t.completed),
      })),
    setFilter: (filter) => set({ filter }),
    reorderTodos: (fromIndex, toIndex) =>
      set((state) => {
        const list = [...state.todos];
        const [removed] = list.splice(fromIndex, 1);
        if (!removed) return state;
        list.splice(toIndex, 0, removed);
        return { todos: list };
      }),
    setPriority: (id, priority) =>
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? touchUpdatedAt({ ...t, priority }) : t
        ),
      })),
    setColor: (id, color) =>
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? touchUpdatedAt({ ...t, color }) : t
        ),
      })),
  }),
  {
    persist: {
      name: "todo-app-store",
      version: 2,
      storage: getClientOnlyStorage<TodoState>(() => localStorage),
      partialize: (s) => ({ todos: s.todos, filter: s.filter }),
    } as PersistOptions<TodoState>,
  }
);

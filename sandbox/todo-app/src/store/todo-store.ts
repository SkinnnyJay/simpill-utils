"use client";

import { addCreatedAt, touchUpdatedAt } from "@simpill/data.utils";
import {
  createAppStore,
  getClientOnlyStorage,
  type PersistOptions,
} from "@simpill/zustand.utils/client";
import { generateUUID } from "@simpill/uuid.utils";
import type { Todo } from "@/lib/schema";

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
  }),
  {
    persist: {
      ...withPersistClientOnly<TodoState>("todo-app-store", { version: 1 }),
      partialize: (s) => ({ todos: s.todos, filter: s.filter }),
    },
  }
);

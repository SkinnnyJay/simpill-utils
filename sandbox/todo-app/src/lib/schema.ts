import { z } from "zod";

export const prioritySchema = z.enum(["low", "medium", "high"]);
export type Priority = z.infer<typeof prioritySchema>;

export const todoColorSchema = z.enum([
  "zinc",
  "blue",
  "emerald",
  "amber",
  "rose",
  "violet",
]);
export type TodoColor = z.infer<typeof todoColorSchema>;

export const todoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  completed: z.boolean(),
  priority: prioritySchema.optional().default("medium"),
  color: todoColorSchema.optional().default("zinc"),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

export const addTodoSchema = z.object({
  title: z.string().min(1, "Title required").max(500),
});

export type Todo = z.infer<typeof todoSchema>;
export type AddTodoInput = z.infer<typeof addTodoSchema>;

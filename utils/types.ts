/**
 * Shared Type Definitions
 * Runtime-agnostic types with Zod validation schemas
 *
 * Note: For API types, use @/lib/core/types/api.types
 * Note: For entity types, use @/lib/core/types/entity.types
 */

import { z } from "zod";
import {
  CHAT_MODE,
  CHAT_MODES,
  type ChatMode,
  ENVIRONMENTS,
  type Environment,
  LOG_LEVELS,
  type LogLevel,
} from "@/lib/shared/constants";

// ============================================================================
// Chat Mode Types
// ============================================================================

/**
 * Chat mode determines the conversation behavior in a channel.
 *
 * - `focus`: Agents primarily respond to the user; agent-to-agent continuation is disabled
 * - `convo`: Agents can freely respond to each other and continue conversations
 * - `deliberation`: Structured decision-making with anonymous peer review and judicial oversight
 *
 * This enum can be extended for future chat types (e.g., debate, interview, brainstorm)
 */
export const ChatModeSchema = z.enum(CHAT_MODES);

// Re-export types from constants
export type { ChatMode };

/** All valid chat modes as a readonly array */
export { CHAT_MODES };

/** Default chat mode for new channels */
export const DEFAULT_CHAT_MODE: ChatMode = CHAT_MODE.CONVERSATION;

/** Human-readable labels for chat modes */
export const CHAT_MODE_LABELS: Record<ChatMode, string> = {
  focus: "Focus Mode",
  convo: "Conversation Mode",
  deliberation: "Deliberation Mode",
};

/** Descriptions for chat modes */
export const CHAT_MODE_DESCRIPTIONS: Record<ChatMode, string> = {
  focus: "Agents primarily respond to you and will not automatically respond to each other.",
  convo: "Agents can freely respond to each other and continue conversations amongst themselves.",
  deliberation: "Structured decision-making with anonymous peer review and judicial oversight.",
};

/**
 * Check if a string is a valid chat mode
 */
export function isValidChatMode(value: string): value is ChatMode {
  return ChatModeSchema.safeParse(value).success;
}

/**
 * Get chat mode with fallback to default
 */
export function getChatMode(value: string | undefined | null): ChatMode {
  if (!value) return DEFAULT_CHAT_MODE;
  return isValidChatMode(value) ? value : DEFAULT_CHAT_MODE;
}

// ============================================================================
// Environment Types
// ============================================================================

export const EnvironmentSchema = z.enum(ENVIRONMENTS);
export type { Environment };

// ============================================================================
// Logger Types
// ============================================================================

export const LogLevelSchema = z.enum(LOG_LEVELS);
export type { LogLevel };

export const LogContextSchema = z.record(z.string(), z.unknown());
export type LogContext = z.infer<typeof LogContextSchema>;

// ============================================================================
// File Types
// ============================================================================

export const FileMetadataSchema = z.object({
  size: z.number().nonnegative(),
  extension: z.string(),
  name: z.string().min(1),
  directory: z.string(),
  baseName: z.string(),
  mimeType: z.string(),
  hash: z.string(),
  lastModified: z.number(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

// ============================================================================
// Function Types
// ============================================================================

/**
 * Generic async function type
 * @template TArgs - Argument types tuple
 * @template TReturn - Return type
 */
export type AsyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => Promise<TReturn>;

/**
 * Generic sync function type
 * @template TArgs - Argument types tuple
 * @template TReturn - Return type
 */
export type SyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => TReturn;

/**
 * Event handler function type
 * @template TEvent - Event type
 */
export type EventHandler<TEvent = unknown> = (event: TEvent) => void | Promise<void>;

// ============================================================================
// JSON Value Types (for Prisma JSON fields and API responses)
// ============================================================================

/**
 * Represents any valid JSON-serializable value
 * Used for Prisma JSON fields and API responses
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * JSON object type - a record of string keys to JSON values
 * Standard replacement for Record<string, any> in JSON contexts
 */
export type JsonRecord = Record<string, JsonValue>;

/**
 * Zod schema for JSON values (recursive)
 */
export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ])
) as z.ZodType<JsonValue>;

/**
 * Zod schema for JSON records
 */
export const JsonRecordSchema: z.ZodType<JsonRecord> = z.record(z.string(), JsonValueSchema);

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make selected properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make selected properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract non-nullable properties
 */
export type NonNullableProperties<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// ============================================================================
// Result Types (for error handling without exceptions)
// ============================================================================

export const ResultSchema = <T extends z.ZodType, E extends z.ZodType>(
  dataSchema: T,
  errorSchema: E
) =>
  z.discriminatedUnion("success", [
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({ success: z.literal(false), error: errorSchema }),
  ]);

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Create a success result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Check if result is success
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Check if result is error
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

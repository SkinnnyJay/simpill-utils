/**
 * Typed file I/O utilities using Node.js fs (sync) and fs.promises (async).
 * Server/Node only. Async functions use UTF-8 by default.
 *
 * For untrusted path input (e.g. user-provided paths), use `resolvePathUnderRoot(rootDir, path)`
 * from `./path.utils` before calling read/write to prevent path traversal.
 */

import * as fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { VALUE_1 } from "../shared/constants";

export type FileEncoding =
  | "ascii"
  | "base64"
  | "binary"
  | "hex"
  | "latin1"
  | "ucs2"
  | "utf8"
  | "utf-8";

/** One arg => UTF-8 string; with encoding => string; encoding undefined => Buffer. */
export async function readFileAsync(path: string): Promise<string>;
export async function readFileAsync(path: string, encoding: undefined): Promise<Buffer>;
export async function readFileAsync(path: string, encoding: FileEncoding): Promise<string>;
export async function readFileAsync(
  path: string,
  encoding?: FileEncoding | undefined,
): Promise<string | Buffer> {
  if (arguments.length === VALUE_1) return readFile(path, "utf8");
  if (encoding === undefined) return readFile(path);
  return readFile(path, encoding);
}

/** Read file as UTF-8 string. */
export async function readFileUtf8(path: string): Promise<string> {
  return readFile(path, "utf8");
}

export interface ReadFileJsonOptions<T = unknown> {
  /** Optional validator; e.g. (data) => myZodSchema.parse(data). Enables runtime validation without this package depending on Zod. */
  validate?: (data: unknown) => T;
}

/**
 * Read file and parse as JSON. T is not runtime-validated unless options.validate is provided.
 * Example with Zod: readFileJson(path, { validate: (d) => configSchema.parse(d) }).
 */
export async function readFileJson<T = unknown>(
  path: string,
  options?: ReadFileJsonOptions<T>,
): Promise<T> {
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return options?.validate ? options.validate(parsed) : (parsed as T);
}

/** Write data to file; creates parent dirs. Encoding default utf8. */
export async function writeFileAsync(
  path: string,
  data: string | Buffer,
  encoding?: FileEncoding,
): Promise<void> {
  await ensureDir(dirname(path));
  if (Buffer.isBuffer(data)) {
    await writeFile(path, data);
  } else {
    await writeFile(path, data, encoding ?? "utf8");
  }
}

/** Write string as UTF-8; ensures parent dir exists. */
export async function writeFileUtf8(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, "utf8");
}

export interface WriteFileJsonOptions {
  /** JSON.stringify space (e.g. 2 for pretty-print). */
  space?: number | string;
}

/** Write object as JSON; ensures parent dir. options.space for pretty-print. */
export async function writeFileJson<T>(
  path: string,
  data: T,
  options: WriteFileJsonOptions = {},
): Promise<void> {
  const { space } = options;
  const content = JSON.stringify(data, null, space);
  await writeFileUtf8(path, content);
}

/** Ensure directory and parents exist; no-op if already exists. */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

// --- Sync variants ---

/** Sync: one arg => UTF-8 string; with encoding => string; undefined => Buffer. */
export function readFileSync(path: string): string;
export function readFileSync(path: string, encoding: undefined): Buffer;
export function readFileSync(path: string, encoding: FileEncoding): string;
export function readFileSync(path: string, encoding?: FileEncoding | undefined): string | Buffer {
  if (arguments.length === VALUE_1) return fs.readFileSync(path, "utf8");
  if (encoding === undefined) return fs.readFileSync(path);
  return fs.readFileSync(path, encoding);
}

/** Sync read as UTF-8. */
export function readFileUtf8Sync(path: string): string {
  return fs.readFileSync(path, "utf8");
}

/** Sync read and parse JSON; T not validated at runtime unless options.validate is provided. */
export function readFileJsonSync<T = unknown>(path: string, options?: ReadFileJsonOptions<T>): T {
  const raw = fs.readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return options?.validate ? options.validate(parsed) : (parsed as T);
}

/** Sync write; creates parent dirs. Encoding default utf8. */
export function writeFileSync(path: string, data: string | Buffer, encoding?: FileEncoding): void {
  ensureDirSync(dirname(path));
  if (Buffer.isBuffer(data)) {
    fs.writeFileSync(path, data);
  } else {
    fs.writeFileSync(path, data, encoding ?? "utf8");
  }
}

/** Sync write UTF-8; ensures parent dir. */
export function writeFileUtf8Sync(path: string, content: string): void {
  ensureDirSync(dirname(path));
  fs.writeFileSync(path, content, "utf8");
}

/** Sync write JSON; options.space for pretty-print. */
export function writeFileJsonSync<T>(
  path: string,
  data: T,
  options: WriteFileJsonOptions = {},
): void {
  const { space } = options;
  const content = JSON.stringify(data, null, space);
  writeFileUtf8Sync(path, content);
}

/** Sync ensure directory and parents; no-op if exists. */
export function ensureDirSync(path: string): void {
  fs.mkdirSync(path, { recursive: true });
}

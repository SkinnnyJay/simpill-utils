/**
 * Typed file I/O utilities using Node.js fs (sync) and fs.promises (async).
 * Server/Node only. Async functions use UTF-8 by default.
 *
 * For untrusted path input (e.g. user-provided paths), resolve it under a root
 * before calling read/write, using `./path.utils`:
 *
 * - `resolvePathUnderRootReal` (or the *Sync variant) when the directory could
 *   contain symlinks, which is the normal assumption for untrusted input. It
 *   resolves symlinks, so a link inside rootDir pointing outside it is rejected.
 * - `resolvePathUnderRoot` only when the tree is known to be symlink-free. It is
 *   a purely lexical check and a symlink escape passes it.
 */

import { randomBytes } from "node:crypto";
import * as fs from "node:fs";
import { access, mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { VALUE_1 } from "../shared/constants";

export type FileEncoding =
  | "ascii"
  | "base64"
  | "base64url"
  | "binary"
  | "hex"
  | "latin1"
  | "ucs2"
  | "ucs-2"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "utf-16le";

/** Thrown by readFileJson/readFileJsonSync when JSON.parse fails; carries the file path. Extends SyntaxError, so existing `instanceof SyntaxError` handling keeps working. */
export class JsonParseError extends SyntaxError {
  /** Path of the file that failed to parse. */
  readonly path: string;
  constructor(message: string, path: string, cause: unknown) {
    super(`${message} while parsing ${path}`);
    this.name = "JsonParseError";
    this.path = path;
    Object.defineProperty(this, "cause", {
      value: cause,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
}

function isErrnoWithCode(error: unknown, code: string): boolean {
  // Duck-typed (not instanceof Error): fs errors can cross vm/realm boundaries (e.g. under Jest).
  return (
    typeof error === "object" && error !== null && (error as NodeJS.ErrnoException).code === code
  );
}

/** Strip a leading UTF-8 BOM (\uFEFF). JSON.parse throws on BOM-prefixed input (common in files produced by PowerShell/Windows editors). */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseJsonWithContext<T>(raw: string, path: string, options?: ReadFileJsonOptions<T>): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripBom(raw), options?.reviver);
  } catch (error) {
    throw new JsonParseError(error instanceof Error ? error.message : String(error), path, error);
  }
  return options?.validate ? options.validate(parsed) : (parsed as T);
}

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
  /** JSON.parse reviver, applied during parsing. */
  reviver?: (this: unknown, key: string, value: unknown) => unknown;
  /** Returned (as-is, without validate) when the file does not exist (ENOENT). Parse and validation errors still throw. */
  defaultValue?: T;
}

/**
 * Read file and parse as JSON. T is not runtime-validated unless options.validate is provided.
 * Example with Zod: readFileJson(path, { validate: (d) => configSchema.parse(d) }).
 * Strips a UTF-8 BOM before parsing. Parse failures throw JsonParseError (includes the file path).
 */
export async function readFileJson<T = unknown>(
  path: string,
  options?: ReadFileJsonOptions<T>,
): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (options && "defaultValue" in options && isErrnoWithCode(error, "ENOENT")) {
      return options.defaultValue as T;
    }
    throw error;
  }
  return parseJsonWithContext(raw, path, options);
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
  /** Recursively sort object keys for deterministic (diff-friendly) output. Default false. */
  sortKeys?: boolean;
  /** Append a trailing newline (POSIX text-file convention). Default false. */
  finalNewline?: boolean;
  /** Write via temp-file + fsync + rename so a crash never leaves a truncated file. Default false. */
  atomic?: boolean;
}

function sortKeysReplacer(_key: string, value: unknown): unknown {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      out[key] = record[key];
    }
    return out;
  }
  return value;
}

function stringifyForFile<T>(data: T, options: WriteFileJsonOptions): string {
  const content = options.sortKeys
    ? JSON.stringify(data, sortKeysReplacer, options.space)
    : JSON.stringify(data, null, options.space);
  return options.finalNewline ? `${content}\n` : content;
}

/** Write object as JSON; ensures parent dir. options.space for pretty-print; sortKeys/finalNewline/atomic opt-in. */
export async function writeFileJson<T>(
  path: string,
  data: T,
  options: WriteFileJsonOptions = {},
): Promise<void> {
  const content = stringifyForFile(data, options);
  if (options.atomic) {
    await writeFileAtomic(path, content);
  } else {
    await writeFileUtf8(path, content);
  }
}

export interface WriteFileAtomicOptions {
  /** Encoding for string data. Default utf8. Ignored for Buffers. */
  encoding?: FileEncoding;
  /** fsync file contents to disk before the rename (durability across power loss). Default true. */
  fsync?: boolean;
  /** File mode. Defaults to the existing target file's mode when present (preserved across the rename, bypassing umask). */
  mode?: number;
}

function tmpPathFor(path: string): string {
  return `${path}.${process.pid.toString(36)}${randomBytes(6).toString("hex")}.tmp`;
}

async function writeFileAtomicUnqueued(
  path: string,
  data: string | Buffer,
  options?: WriteFileAtomicOptions,
): Promise<void> {
  await ensureDir(dirname(path));
  let mode = options?.mode;
  if (mode === undefined) {
    try {
      mode = (await stat(path)).mode & 0o7777;
    } catch (error) {
      if (!isErrnoWithCode(error, "ENOENT")) throw error;
    }
  }
  const tmp = tmpPathFor(path);
  let handle: fs.promises.FileHandle | undefined;
  try {
    handle = await open(tmp, "w");
    if (mode !== undefined) await handle.chmod(mode);
    if (Buffer.isBuffer(data)) {
      await handle.writeFile(data);
    } else {
      await handle.writeFile(data, (options?.encoding ?? "utf8") as BufferEncoding);
    }
    if (options?.fsync !== false) await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(tmp, path);
  } catch (error) {
    if (handle) await handle.close().catch(() => undefined);
    await unlink(tmp).catch(() => undefined);
    throw error;
  }
}

const atomicWriteQueues = new Map<string, Promise<void>>();

/**
 * Atomically write data to a file: write to a unique temp file in the same directory,
 * fsync (default), then rename over the target. Readers never observe a partial file and
 * a crash mid-write never corrupts the previous version. Concurrent writes to the same
 * path are serialized in call order; writes to different paths run in parallel.
 * Creates parent dirs. Preserves the existing file's mode.
 */
export async function writeFileAtomic(
  path: string,
  data: string | Buffer,
  options?: WriteFileAtomicOptions,
): Promise<void> {
  const key = resolve(path);
  const prev = atomicWriteQueues.get(key) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(() => writeFileAtomicUnqueued(path, data, options));
  atomicWriteQueues.set(key, run);
  try {
    return await run;
  } finally {
    if (atomicWriteQueues.get(key) === run) atomicWriteQueues.delete(key);
  }
}

/** Sync variant of writeFileAtomic (temp file + fsync + rename). */
export function writeFileAtomicSync(
  path: string,
  data: string | Buffer,
  options?: WriteFileAtomicOptions,
): void {
  ensureDirSync(dirname(path));
  let mode = options?.mode;
  if (mode === undefined) {
    try {
      mode = fs.statSync(path).mode & 0o7777;
    } catch (error) {
      if (!isErrnoWithCode(error, "ENOENT")) throw error;
    }
  }
  const tmp = tmpPathFor(path);
  let fd: number | undefined;
  try {
    fd = fs.openSync(tmp, "w");
    if (mode !== undefined) fs.fchmodSync(fd, mode);
    const buf = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data, (options?.encoding ?? "utf8") as BufferEncoding);
    let offset = 0;
    while (offset < buf.length) {
      offset += fs.writeSync(fd, buf, offset, buf.length - offset);
    }
    if (options?.fsync !== false) fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(tmp, path);
  } catch (error) {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // already closing on error path
      }
    }
    try {
      fs.unlinkSync(tmp);
    } catch {
      // tmp may not exist
    }
    throw error;
  }
}

/** True if the path exists (file, directory, or other). Never throws. */
export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Sync: true if the path exists. Never throws. */
export function pathExistsSync(path: string): boolean {
  return fs.existsSync(path);
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

/** Sync read and parse JSON; T not validated at runtime unless options.validate is provided. Strips UTF-8 BOM; parse failures throw JsonParseError with the file path. */
export function readFileJsonSync<T = unknown>(path: string, options?: ReadFileJsonOptions<T>): T {
  let raw: string;
  try {
    raw = fs.readFileSync(path, "utf8");
  } catch (error) {
    if (options && "defaultValue" in options && isErrnoWithCode(error, "ENOENT")) {
      return options.defaultValue as T;
    }
    throw error;
  }
  return parseJsonWithContext(raw, path, options);
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

/** Sync write JSON; options.space for pretty-print; sortKeys/finalNewline/atomic opt-in. */
export function writeFileJsonSync<T>(
  path: string,
  data: T,
  options: WriteFileJsonOptions = {},
): void {
  const content = stringifyForFile(data, options);
  if (options.atomic) {
    writeFileAtomicSync(path, content);
  } else {
    writeFileUtf8Sync(path, content);
  }
}

/** Sync ensure directory and parents; no-op if exists. */
export function ensureDirSync(path: string): void {
  fs.mkdirSync(path, { recursive: true });
}

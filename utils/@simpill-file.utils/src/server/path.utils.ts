/** Path utilities (Node.js path). Server/Node only. */
import { realpathSync } from "node:fs";
import { realpath } from "node:fs/promises";
import {
  basename as nodeBasename,
  dirname as nodeDirname,
  extname as nodeExtname,
  isAbsolute as nodeIsAbsolute,
  join as nodeJoin,
  normalize as nodeNormalize,
  resolve as nodeResolve,
  sep as pathSep,
} from "node:path";
import { ERROR_PATH_RESOLVES_OUTSIDE_ROOT_PREFIX } from "../shared/constants";

function isEnoent(error: unknown): boolean {
  // Duck-typed (not instanceof Error): fs errors can cross vm/realm boundaries (e.g. under Jest).
  return (
    typeof error === "object" &&
    error !== null &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function isUnderResolvedRoot(root: string, resolved: string): boolean {
  return resolved === root || resolved.startsWith(root + pathSep);
}

/** realpath the deepest existing ancestor of an already-resolved path, then re-append the non-existent suffix (which cannot contain symlinks or ".." — it is normalized and does not exist). */
async function realpathDeepestExisting(resolvedPath: string): Promise<string> {
  let current = resolvedPath;
  const suffix: string[] = [];
  for (;;) {
    try {
      const real = await realpath(current);
      return suffix.length ? nodeJoin(real, ...suffix) : real;
    } catch (error) {
      if (!isEnoent(error)) throw error;
      const parent = nodeDirname(current);
      if (parent === current) throw error;
      suffix.unshift(nodeBasename(current));
      current = parent;
    }
  }
}

function realpathDeepestExistingSync(resolvedPath: string): string {
  let current = resolvedPath;
  const suffix: string[] = [];
  for (;;) {
    try {
      const real = realpathSync(current);
      return suffix.length ? nodeJoin(real, ...suffix) : real;
    } catch (error) {
      if (!isEnoent(error)) throw error;
      const parent = nodeDirname(current);
      if (parent === current) throw error;
      suffix.unshift(nodeBasename(current));
      current = parent;
    }
  }
}

/** Join path segments. */
export function joinPath(...segments: string[]): string {
  return nodeJoin(...segments);
}

/** Resolve segments to absolute path. */
export function resolvePath(...segments: string[]): string {
  return nodeResolve(...segments);
}

/** Normalize path (. and .., slashes). */
export function normalizePath(path: string): string {
  return nodeNormalize(path);
}

/** Last portion of path. */
export function basename(path: string, ext?: string): string {
  return nodeBasename(path, ext);
}

/** Directory of path. */
export function dirname(path: string): string {
  return nodeDirname(path);
}

/** Extension of path (e.g. ".json"). */
export function extname(path: string): string {
  return nodeExtname(path);
}

/** True if path is absolute. */
export function isAbsolutePath(path: string): boolean {
  return nodeIsAbsolute(path);
}

/**
 * True if filePath resolved against rootDir stays under rootDir (LEXICAL path traversal guard).
 * WARNING: purely lexical — a symlink inside rootDir pointing outside it passes this check.
 * For untrusted input against a directory that may contain symlinks, use isPathUnderRootReal.
 */
export function isPathUnderRoot(rootDir: string, filePath: string): boolean {
  const root = nodeResolve(rootDir);
  const resolved = nodeResolve(root, filePath);
  return isUnderResolvedRoot(root, resolved);
}

/**
 * Resolve filePath under rootDir; throws if outside rootDir (LEXICAL path traversal guard).
 * WARNING: purely lexical — a symlink inside rootDir pointing outside it passes this check.
 * For untrusted input against a directory that may contain symlinks, use resolvePathUnderRootReal.
 */
export function resolvePathUnderRoot(rootDir: string, filePath: string): string {
  const root = nodeResolve(rootDir);
  const resolved = nodeResolve(root, filePath);
  if (!isUnderResolvedRoot(root, resolved)) {
    throw new Error(ERROR_PATH_RESOLVES_OUTSIDE_ROOT_PREFIX + filePath);
  }
  return resolved;
}

/**
 * Symlink-aware traversal guard: lexical check first, then resolves symlinks (realpath) and
 * verifies the REAL target stays under the REAL rootDir. Non-existent trailing segments are
 * allowed (checked against their deepest existing ancestor), so it works for files about to be
 * created. rootDir must exist. Returns the resolved (lexical) path on success; throws if the
 * path escapes rootDir either lexically or through a symlink.
 */
export async function resolvePathUnderRootReal(rootDir: string, filePath: string): Promise<string> {
  const resolved = resolvePathUnderRoot(rootDir, filePath);
  const realRoot = await realpath(nodeResolve(rootDir));
  const real = await realpathDeepestExisting(resolved);
  if (!isUnderResolvedRoot(realRoot, real)) {
    throw new Error(ERROR_PATH_RESOLVES_OUTSIDE_ROOT_PREFIX + filePath);
  }
  return resolved;
}

/** Sync variant of resolvePathUnderRootReal. */
export function resolvePathUnderRootRealSync(rootDir: string, filePath: string): string {
  const resolved = resolvePathUnderRoot(rootDir, filePath);
  const realRoot = realpathSync(nodeResolve(rootDir));
  const real = realpathDeepestExistingSync(resolved);
  if (!isUnderResolvedRoot(realRoot, real)) {
    throw new Error(ERROR_PATH_RESOLVES_OUTSIDE_ROOT_PREFIX + filePath);
  }
  return resolved;
}

/** Symlink-aware isPathUnderRoot: true only if the real (symlink-resolved) target stays under the real rootDir. rootDir must exist; non-fs errors propagate. */
export async function isPathUnderRootReal(rootDir: string, filePath: string): Promise<boolean> {
  if (!isPathUnderRoot(rootDir, filePath)) return false;
  const realRoot = await realpath(nodeResolve(rootDir));
  const real = await realpathDeepestExisting(nodeResolve(nodeResolve(rootDir), filePath));
  return isUnderResolvedRoot(realRoot, real);
}

/** Sync variant of isPathUnderRootReal. */
export function isPathUnderRootRealSync(rootDir: string, filePath: string): boolean {
  if (!isPathUnderRoot(rootDir, filePath)) return false;
  const realRoot = realpathSync(nodeResolve(rootDir));
  const real = realpathDeepestExistingSync(nodeResolve(nodeResolve(rootDir), filePath));
  return isUnderResolvedRoot(realRoot, real);
}

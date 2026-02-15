/** Path utilities (Node.js path). Server/Node only. */
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

/** True if filePath resolved against rootDir stays under rootDir (path traversal guard). */
export function isPathUnderRoot(rootDir: string, filePath: string): boolean {
  const root = nodeResolve(rootDir);
  const resolved = nodeResolve(root, filePath);
  return resolved === root || resolved.startsWith(root + pathSep);
}

/** Resolve filePath under rootDir; throws if outside rootDir (path traversal). */
export function resolvePathUnderRoot(rootDir: string, filePath: string): string {
  const root = nodeResolve(rootDir);
  const resolved = nodeResolve(root, filePath);
  if (resolved !== root && !resolved.startsWith(root + pathSep)) {
    throw new Error(ERROR_PATH_RESOLVES_OUTSIDE_ROOT_PREFIX + filePath);
  }
  return resolved;
}

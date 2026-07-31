/**
 * @file Redaction
 * @description Zero-dependency, path-based redaction for log metadata.
 *
 * Path syntax follows pino / fast-redact conventions:
 *   - "password"            top-level key
 *   - "user.token"          nested dot path
 *   - "headers['set-cookie']" bracket notation for keys with dots/spaces
 *   - "users[*].password"   wildcard over every array element / object value
 *   - "*.secret"            wildcard over one level (any top-level key)
 *   - "config.*"            terminal wildcard: every key inside config
 *
 * Wildcards match ONE level (pino semantics), not arbitrary depth.
 *
 * Paths are parsed once at creation into a segment plan; per-call work is a
 * plain walk with selective copy-on-write: only object branches that lie on a
 * redacted path are cloned, everything else keeps the original reference, and
 * the caller's object is never mutated.
 */

import { DEFAULT_REDACT_PATHS, REDACT_DEFAULTS } from "./constants";

/** Censor function: computes the replacement from the original value + path. */
export type RedactCensorFn = (value: unknown, path: readonly string[]) => unknown;

/** Static replacement value (kept narrower than `unknown` so censor functions still infer their parameter types). */
export type RedactCensorValue = string | number | boolean | null | Record<string, unknown>;

/** Replacement value or a function computing it from the original. */
export type RedactCensor = RedactCensorValue | RedactCensorFn;

export interface RedactOptions {
  /** Paths to redact (pino / fast-redact syntax). */
  paths: readonly string[];
  /** Replacement value or function (default: "[REDACTED]"). */
  censor?: RedactCensor;
}

/** Compiled redactor: returns a redacted copy; never mutates the input. */
export type Redactor = <T>(value: T) => T;

const WILDCARD = "*";

/** Parse one path string into segments. Supports dot + bracket notation. */
export function parseRedactPath(path: string): string[] {
  const segments: string[] = [];
  let i = 0;
  const len = path.length;
  let current = "";

  while (i < len) {
    const ch = path[i];
    if (ch === ".") {
      if (current.length > 0) {
        segments.push(current);
        current = "";
      }
      i++;
    } else if (ch === "[") {
      if (current.length > 0) {
        segments.push(current);
        current = "";
      }
      const closeIdx = path.indexOf("]", i);
      if (closeIdx === -1) {
        throw new Error(`Invalid redact path (unclosed bracket): ${path}`);
      }
      let inner = path.slice(i + 1, closeIdx).trim();
      // Strip quotes: ['key'] / ["key"] / [`key`]
      if (
        inner.length >= 2 &&
        (inner[0] === "'" || inner[0] === '"' || inner[0] === "`") &&
        inner[inner.length - 1] === inner[0]
      ) {
        inner = inner.slice(1, -1);
      }
      if (inner.length === 0) {
        throw new Error(`Invalid redact path (empty bracket segment): ${path}`);
      }
      segments.push(inner);
      i = closeIdx + 1;
    } else {
      current += ch;
      i++;
    }
  }
  if (current.length > 0) {
    segments.push(current);
  }
  if (segments.length === 0) {
    throw new Error(`Invalid redact path (empty): ${path}`);
  }
  return segments;
}

interface PlanNode {
  /** Exact-key children. */
  children: Map<string, PlanNode>;
  /** Wildcard child ("*" segment / "[*]"), applies to every key / element. */
  wildcard: PlanNode | null;
  /** This node is the END of a redact path — censor the value here. */
  terminal: boolean;
}

function newNode(): PlanNode {
  return { children: new Map(), wildcard: null, terminal: false };
}

function buildPlan(paths: readonly string[]): PlanNode {
  const root = newNode();
  for (const path of paths) {
    const segments = parseRedactPath(path);
    let node = root;
    for (const seg of segments) {
      if (seg === WILDCARD) {
        if (!node.wildcard) {
          node.wildcard = newNode();
        }
        node = node.wildcard;
      } else {
        let child = node.children.get(seg);
        if (!child) {
          child = newNode();
          node.children.set(seg, child);
        }
        node = child;
      }
    }
    node.terminal = true;
  }
  return root;
}

function isPlainContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === "object" && value !== null;
}

function isRedactOptions(value: RedactOptions | readonly string[]): value is RedactOptions {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "paths" in value;
}

/**
 * Merge default sensitive paths with optional extra paths (deduped, order preserved).
 */
export function mergeRedactPaths(extraPaths?: readonly string[]): readonly string[] {
  if (!extraPaths || extraPaths.length === 0) {
    return DEFAULT_REDACT_PATHS;
  }
  const seen = new Set<string>(DEFAULT_REDACT_PATHS);
  const merged: string[] = [...DEFAULT_REDACT_PATHS];
  for (const path of extraPaths) {
    if (!seen.has(path)) {
      seen.add(path);
      merged.push(path);
    }
  }
  return merged;
}

/**
 * Redactor that always includes {@link DEFAULT_REDACT_PATHS}, plus optional extras.
 */
export function createDefaultRedactor(extraPaths?: readonly string[]): Redactor {
  return createRedactor(mergeRedactPaths(extraPaths));
}

/**
 * Create a compiled redactor. Parsing/validation happens ONCE here (throws on
 * malformed paths); the returned function never throws and never mutates.
 *
 * Following fast-redact's guidance: paths are configuration, not user input.
 */
export function createRedactor(options: RedactOptions | readonly string[]): Redactor {
  const opts: RedactOptions = Array.isArray(options)
    ? { paths: options }
    : isRedactOptions(options)
      ? options
      : { paths: [] };
  const censor = opts.censor ?? REDACT_DEFAULTS.CENSOR;
  const plan = buildPlan(opts.paths);

  const applyCensor = (value: unknown, pathSegments: string[]): unknown => {
    if (typeof censor === "function") {
      try {
        return censor(value, pathSegments);
      } catch {
        return REDACT_DEFAULTS.CENSOR;
      }
    }
    return censor;
  };

  const walk = (value: unknown, node: PlanNode, pathSoFar: string[]): unknown => {
    if (!isPlainContainer(value)) {
      return value;
    }
    if (node.children.size === 0 && node.wildcard === null) {
      return value;
    }

    if (Array.isArray(value)) {
      // Only wildcard descends into arrays ("users[*].password"); numeric
      // exact segments are also honored ("items[0].secret").
      let copy: unknown[] | null = null;
      for (let i = 0; i < value.length; i++) {
        const key = String(i);
        const exact = node.children.get(key);
        const branches = collectBranches(exact, node.wildcard);
        if (branches === null) {
          continue;
        }
        const replaced = applyBranches(value[i], branches, pathSoFar, key);
        if (replaced !== value[i]) {
          if (copy === null) {
            copy = value.slice();
          }
          copy[i] = replaced;
        }
      }
      return copy ?? value;
    }

    let objCopy: Record<string, unknown> | null = null;
    const record = value as Record<string, unknown>;
    // Iterate the smaller side when there is no wildcard and few plan keys
    if (node.wildcard === null && node.children.size < 4) {
      for (const [key, child] of node.children) {
        if (!Object.hasOwn(record, key)) {
          continue;
        }
        const replaced = applyBranches(record[key], [child], pathSoFar, key);
        if (replaced !== record[key]) {
          if (objCopy === null) {
            objCopy = { ...record };
          }
          objCopy[key] = replaced;
        }
      }
      return objCopy ?? value;
    }

    for (const key of Object.keys(record)) {
      const branches = collectBranches(node.children.get(key), node.wildcard);
      if (branches === null) {
        continue;
      }
      const replaced = applyBranches(record[key], branches, pathSoFar, key);
      if (replaced !== record[key]) {
        if (objCopy === null) {
          objCopy = { ...record };
        }
        objCopy[key] = replaced;
      }
    }
    return objCopy ?? value;
  };

  const collectBranches = (
    exact: PlanNode | undefined,
    wildcard: PlanNode | null
  ): PlanNode[] | null => {
    if (exact && wildcard) {
      return [exact, wildcard];
    }
    if (exact) {
      return [exact];
    }
    if (wildcard) {
      return [wildcard];
    }
    return null;
  };

  const applyBranches = (
    value: unknown,
    branches: PlanNode[],
    pathSoFar: string[],
    key: string
  ): unknown => {
    pathSoFar.push(key);
    let result = value;
    for (const branch of branches) {
      if (branch.terminal) {
        result = applyCensor(result, pathSoFar.slice());
        break; // censored — deeper matches are moot
      }
    }
    if (result === value) {
      for (const branch of branches) {
        if (!branch.terminal) {
          result = walk(result, branch, pathSoFar);
        }
      }
    }
    pathSoFar.pop();
    return result;
  };

  return (<T>(value: T): T => {
    try {
      return walk(value, plan, []) as T;
    } catch {
      // Never throw from the logging path; on unexpected failure return input
      return value;
    }
  }) as Redactor;
}

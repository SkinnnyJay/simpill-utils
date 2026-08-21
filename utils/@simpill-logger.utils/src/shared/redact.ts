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
 * Separately from paths, `sensitiveKeys` censors a set of KEY NAMES wherever
 * they occur, at any depth, ignoring case and `_`/`-` separators. The built-in
 * defaults use this: "password" as a path only ever matched a top-level key, so
 * the common shapes real code logs - { user: { password } },
 * { req: { headers: { cookie } } }, a capitalised { Authorization } - were all
 * written out in the clear despite being on the always-redacted list.
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
  /**
   * Key names censored wherever they appear, at any depth. Matching ignores
   * case and `_`/`-`, so "apiKey", "api_key" and "API-KEY" are one key.
   */
  sensitiveKeys?: readonly string[];
}

/** Compiled redactor: returns a redacted copy; never mutates the input. */
export type Redactor = <T>(value: T) => T;

const WILDCARD = "*";

/**
 * Depth ceiling for the key-name sweep. Unlike a path plan, key matching has to
 * visit every key of every object, so this bounds the per-call cost of one
 * pathologically deep metadata object on the logging hot path. Cycles are cut
 * separately; this only has to sit above any plausible real nesting.
 */
const MAX_KEY_SCAN_DEPTH = 20;

/** "API_Key" / "api-key" / "apiKey" all collapse to "apikey". */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, "");
}

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
  return createRedactor({
    paths: extraPaths ?? [],
    sensitiveKeys: DEFAULT_REDACT_PATHS,
  });
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
  const sensitiveKeys = new Set((opts.sensitiveKeys ?? []).map(normalizeKey));
  const hasSensitiveKeys = sensitiveKeys.size > 0;
  const emptyNode = newNode();

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

  const walk = (
    value: unknown,
    node: PlanNode,
    pathSoFar: string[],
    depth: number,
    seen: Set<object>
  ): unknown => {
    if (!isPlainContainer(value)) {
      return value;
    }
    // The key sweep has to look at branches no path mentions, so it - and only
    // it - keeps descending once the plan is exhausted.
    const scanKeys = hasSensitiveKeys && depth < MAX_KEY_SCAN_DEPTH;
    if (!scanKeys && node.children.size === 0 && node.wildcard === null) {
      return value;
    }
    // Ancestor set, not a visited set: a value legitimately reachable twice is
    // still redacted twice; only a true cycle is cut.
    if (scanKeys) {
      if (seen.has(value)) {
        return value;
      }
      seen.add(value);
    }
    try {
      return walkContainer(value, node, pathSoFar, depth, seen, scanKeys);
    } finally {
      if (scanKeys) {
        seen.delete(value);
      }
    }
  };

  const walkContainer = (
    value: Record<string, unknown> | unknown[],
    node: PlanNode,
    pathSoFar: string[],
    depth: number,
    seen: Set<object>,
    scanKeys: boolean
  ): unknown => {
    if (Array.isArray(value)) {
      // Only wildcard descends into arrays ("users[*].password"); numeric
      // exact segments are also honored ("items[0].secret").
      let copy: unknown[] | null = null;
      for (let i = 0; i < value.length; i++) {
        const key = String(i);
        const exact = node.children.get(key);
        const branches = collectBranches(exact, node.wildcard);
        if (branches === null && !scanKeys) {
          continue;
        }
        const replaced =
          branches === null
            ? descend(value[i], emptyNode, pathSoFar, key, depth, seen)
            : applyBranches(value[i], branches, pathSoFar, key, depth, seen);
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
    if (!scanKeys && node.wildcard === null && node.children.size < 4) {
      for (const [key, child] of node.children) {
        if (!Object.hasOwn(record, key)) {
          continue;
        }
        const replaced = applyBranches(record[key], [child], pathSoFar, key, depth, seen);
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
      if (scanKeys && sensitiveKeys.has(normalizeKey(key))) {
        const censored = censorAt(record[key], pathSoFar, key);
        if (censored !== record[key]) {
          if (objCopy === null) {
            objCopy = { ...record };
          }
          objCopy[key] = censored;
        }
        continue;
      }
      const branches = collectBranches(node.children.get(key), node.wildcard);
      if (branches === null && !scanKeys) {
        continue;
      }
      const replaced =
        branches === null
          ? descend(record[key], emptyNode, pathSoFar, key, depth, seen)
          : applyBranches(record[key], branches, pathSoFar, key, depth, seen);
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

  const censorAt = (value: unknown, pathSoFar: string[], key: string): unknown => {
    pathSoFar.push(key);
    const censored = applyCensor(value, pathSoFar.slice());
    pathSoFar.pop();
    return censored;
  };

  /** Descend one level with no matching branch — used by the key sweep alone. */
  const descend = (
    value: unknown,
    node: PlanNode,
    pathSoFar: string[],
    key: string,
    depth: number,
    seen: Set<object>
  ): unknown => {
    pathSoFar.push(key);
    const result = walk(value, node, pathSoFar, depth + 1, seen);
    pathSoFar.pop();
    return result;
  };

  const applyBranches = (
    value: unknown,
    branches: PlanNode[],
    pathSoFar: string[],
    key: string,
    depth: number,
    seen: Set<object>
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
          result = walk(result, branch, pathSoFar, depth + 1, seen);
        }
      }
    }
    pathSoFar.pop();
    return result;
  };

  return (<T>(value: T): T => {
    try {
      return walk(value, plan, [], 0, new Set<object>()) as T;
    } catch {
      // Never throw from the logging path; on unexpected failure return input
      return value;
    }
  }) as Redactor;
}

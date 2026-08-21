/** Topological sort (Kahn's algorithm) with cycle detection. */

/** Error name used when a cycle prevents a topological order. */
export const ERROR_NAME_CYCLE = "CycleError" as const;

/** Thrown by topologicalSort when the graph contains a cycle; `.nodes` holds the nodes involved. */
export class CycleError<T> extends Error {
  readonly nodes: T[];

  constructor(nodes: T[]) {
    super(`Graph contains a cycle involving ${nodes.length} node(s).`);
    this.name = ERROR_NAME_CYCLE;
    this.nodes = nodes;
  }
}

/**
 * Topological sort via Kahn's algorithm. O(V + E).
 * @param nodes - All nodes (isolated nodes are included in the output)
 * @param edges - Directed edges [from, to]: `from` comes before `to`
 * @returns Nodes in a valid dependency order; deterministic — ties resolve in
 *          input order of `nodes`
 * @throws CycleError when a cycle makes ordering impossible (nodes on/after
 *         the cycle are reported on `error.nodes`)
 */
export function topologicalSort<T>(nodes: Iterable<T>, edges: Iterable<[T, T]>): T[] {
  const inDegree = new Map<T, number>();
  const adjacency = new Map<T, T[]>();
  for (const node of nodes) {
    if (!inDegree.has(node)) inDegree.set(node, 0);
  }
  for (const [from, to] of edges) {
    if (!inDegree.has(from) || !inDegree.has(to)) {
      throw new Error(
        `Edge references a node not present in nodes: ${String(from)} -> ${String(to)}`,
      );
    }
    const neighbors = adjacency.get(from);
    if (neighbors) {
      neighbors.push(to);
    } else {
      adjacency.set(from, [to]);
    }
    inDegree.set(to, (inDegree.get(to) as number) + 1);
  }

  // FIFO over insertion order keeps the output deterministic.
  const queue: T[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const order: T[] = [];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++] as T;
    order.push(node);
    const neighbors = adjacency.get(node);
    if (!neighbors) continue;
    for (const next of neighbors) {
      const degree = (inDegree.get(next) as number) - 1;
      inDegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
  }

  if (order.length < inDegree.size) {
    const remaining: T[] = [];
    for (const [node, degree] of inDegree) {
      if (degree > 0) remaining.push(node);
    }
    throw new CycleError(remaining);
  }
  return order;
}

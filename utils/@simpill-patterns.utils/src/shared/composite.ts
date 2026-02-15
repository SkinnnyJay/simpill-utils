import { VALUE_0 } from "./constants";

/** Node in a composite tree: value and list of child nodes. */
export type CompositeNode<T> = {
  value: T;
  children: Array<CompositeNode<T>>;
};

/** Create a composite node with value and optional children. */
export function createComposite<T>(
  value: T,
  children: Array<CompositeNode<T>> = []
): CompositeNode<T> {
  return { value, children };
}

/** Append a child to a composite node. */
export function addChild<T>(parent: CompositeNode<T>, child: CompositeNode<T>): void {
  parent.children.push(child);
}

/** Remove a child from a composite node; returns true if found and removed. */
export function removeChild<T>(parent: CompositeNode<T>, child: CompositeNode<T>): boolean {
  const index = parent.children.indexOf(child);
  if (index < VALUE_0) return false;
  parent.children.splice(index, 1);
  return true;
}

/** Visit each node in the tree in depth-first order. */
export function traverseComposite<T>(
  node: CompositeNode<T>,
  visitor: (node: CompositeNode<T>) => void
): void {
  visitor(node);
  for (const child of node.children) {
    traverseComposite(child, visitor);
  }
}

/** Map each node's value to a new type, preserving tree structure. */
export function mapComposite<T, R>(
  node: CompositeNode<T>,
  mapper: (node: CompositeNode<T>) => R
): CompositeNode<R> {
  return {
    value: mapper(node),
    children: node.children.map((child) => mapComposite(child, mapper)),
  };
}

/** Reduce the tree to a single value (depth-first). */
export function reduceComposite<T, R>(
  node: CompositeNode<T>,
  reducer: (acc: R, node: CompositeNode<T>) => R,
  initial: R
): R {
  let acc = reducer(initial, node);
  for (const child of node.children) {
    acc = reduceComposite(child, reducer, acc);
  }
  return acc;
}

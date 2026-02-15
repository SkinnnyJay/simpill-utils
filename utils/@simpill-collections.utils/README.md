# @simpill/collections.utils

**Type-safe LinkedList, Queue, Stack, LRU/TTL, MultiMap, BiMap.**

Type-safe LinkedList, Queue, Stack, LRU/TTL, MultiMap, BiMap—no full collections lib.

**Features:** Type-safe · Node & Edge · Tree-shakeable · Lightweight

## Installation

```bash
npm install @simpill/collections.utils
```

## Usage

### Subpath exports

```ts
import {
  LinkedList,
  Vector,
  Queue,
  Stack,
  Deque,
  CircularBuffer,
  LRUCache,
  TTLCache,
  MultiMap,
  BiMap,
  OrderedMap,
  TypedSet,
} from "@simpill/collections.utils";

// or shared only
import { Queue, Stack } from "@simpill/collections.utils/shared";
```

### Contracts

Shared interfaces for consistent APIs:

- **ICollection&lt;T&gt;** – `size`, `isEmpty()`, `clear()`, `toArray()`, `[Symbol.iterator]`
- **IIndexable&lt;T&gt;** – `get(index)`, `set(index, value)`, `at(index)`
- **Equatable&lt;T&gt;** / **Hasher&lt;T&gt;** – optional custom equality/hash for maps and sets

### LinkedList

Doubly linked list. O(1) insert/remove at head/tail.

```ts
import { LinkedList } from "@simpill/collections.utils";

const list = LinkedList.fromArray([1, 2, 3]);
list.push(4);
list.unshift(0);
list.insertAt(2, 99);
list.removeAt(1);
console.log(list.toArray());
```

### Vector

Dynamic array with explicit capacity and index access.

```ts
import { Vector } from "@simpill/collections.utils";

const v = new Vector<number>(8);
v.push(1);
v.push(2);
v.reserve(16);
v.shrinkToFit();
console.log(v.get(0), v.at(-1));
```

### Queue (FIFO) and Stack (LIFO)

```ts
import { Queue, Stack } from "@simpill/collections.utils";

const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
queue.dequeue(); // 1

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
stack.pop(); // 2
```

### Deque

Double-ended queue. Push/pop at both ends.

```ts
import { Deque } from "@simpill/collections.utils";

const d = new Deque<number>();
d.pushBack(1);
d.pushFront(0);
d.popBack(); // 1
d.popFront(); // 0
```

### CircularBuffer

Fixed-capacity ring buffer. Oldest entries dropped when full.

```ts
import { CircularBuffer } from "@simpill/collections.utils";

const b = new CircularBuffer<number>(3);
b.push(1);
b.push(2);
b.push(3);
b.push(4); // 1 is dropped
b.shift(); // 2
```

### LRUCache

Size-bounded cache with least-recently-used eviction.

```ts
import { LRUCache } from "@simpill/collections.utils";

const cache = new LRUCache<string, number>(100);
cache.set("a", 1);
cache.get("a"); // 1; touch
cache.set("b", 2);
// when over maxSize, oldest is evicted
```

### TTLCache

Entries expire after a TTL (ms). Optional `maxSize` with LRU eviction. Expired entries are pruned on `set()`, `get()`, and when reading `size`; **prune is O(n)** in the number of entries, so when many entries are expired, these operations may be slow.

```ts
import { TTLCache } from "@simpill/collections.utils";

const cache = new TTLCache<string, number>({ ttlMs: 60_000, maxSize: 500 });
cache.set("a", 1);
cache.get("a"); // 1 within TTL
```

### MultiMap

One key maps to multiple values.

```ts
import { MultiMap } from "@simpill/collections.utils";

const m = new MultiMap<string, number>();
m.add("tags", 1);
m.add("tags", 2);
m.get("tags"); // [1, 2]
```

### BiMap

Bidirectional map. Key and value are both unique.

```ts
import { BiMap } from "@simpill/collections.utils";

const b = new BiMap<string, number>();
b.set("id", 100);
b.getByKey("id"); // 100
b.getByValue(100); // "id"
```

### OrderedMap

Map with insertion order; access by key or by index.

```ts
import { OrderedMap } from "@simpill/collections.utils";

const m = new OrderedMap<string, number>();
m.set("a", 1);
m.set("b", 2);
m.getAt(0); // ["a", 1]
m.keyAt(1); // "b"
```

### TypedSet

Set with optional custom equality and validator.

```ts
import { TypedSet } from "@simpill/collections.utils";

const s = new TypedSet<{ id: number }>({
  equals: (a, b) => a.id === b.id,
  validate: (x) => x.id > 0,
});
s.add({ id: 1 });
s.add({ id: 1 }); // no duplicate
```

## Examples

```bash
npx ts-node examples/01-basic-usage.ts
```

| Example | Description |
|---------|-------------|
| [01-basic-usage.ts](./examples/01-basic-usage.ts) | Queue, Stack, LinkedList, Vector, Deque, CircularBuffer, LRUCache, TTLCache, MultiMap, BiMap, OrderedMap, TypedSet |

## API summary

| Structure       | Description                    |
|----------------|--------------------------------|
| LinkedList     | Doubly linked list             |
| Vector         | Dynamic array, capacity        |
| Queue          | FIFO (backed by Deque)         |
| Stack          | LIFO (backed by Deque)         |
| Deque          | Double-ended queue             |
| CircularBuffer | Fixed-capacity ring buffer     |
| LRUCache       | Max-size LRU cache              |
| TTLCache       | TTL expiry, optional maxSize   |
| MultiMap       | Key → multiple values          |
| BiMap          | Bidirectional K ↔ V            |
| OrderedMap     | Insertion order + index access  |
| TypedSet       | Set with equals/validate       |

### Complexity (typical)

| Structure       | get/set/access | insert/remove (head/tail) | iteration |
|----------------|----------------|---------------------------|-----------|
| LinkedList     | O(n) by index  | O(1) head/tail            | O(n)      |
| Vector         | O(1)           | O(1) amortized push/pop    | O(n)      |
| Queue / Stack  | —              | O(1) enqueue/dequeue etc.  | O(n)      |
| Deque          | —              | O(1) both ends             | O(n)      |
| CircularBuffer | O(1) by index  | O(1) push/shift           | O(n)      |
| LRUCache       | O(1) get/set   | O(1) eviction             | O(n)      |
| TTLCache       | O(1) get/set   | Expiry prune on get/size  | O(n)      |
| OrderedMap     | O(1) get       | O(1) set                  | O(n)      |
| TypedSet       | O(n) has       | O(n) add (no hash)        | O(n)      |

### Iteration and serialize

Structures implementing **ICollection** provide **toArray()** and **Symbol.iterator**; use them for iteration or serialization (e.g. JSON.stringify(cache.toArray()) only if values are serializable). Map-like types (LRUCache, TTLCache, OrderedMap, BiMap, MultiMap) expose entries/keys/values where applicable; see type definitions.

### Thread-safety

All structures are **not** thread-safe; they assume single-threaded JS. For shared state across workers use message passing or a concurrency primitive.

### Priority queue / sorted map / immutable

This package does **not** provide a priority queue (heap), sorted map/set, or persistent/immutable structures. Use a dedicated library (e.g. heap-based PQ, or immutable.js) if needed.

### Hasher and Equatable

**Equatable&lt;T&gt;** = (a, b) => boolean — used by **TypedSet** (options.equals). **Hasher&lt;T&gt;** = (value) => string | number — for key hashing in hash-based structures; not all structures accept it (TypedSet uses equality only). Use **equals** for set membership when reference equality is not enough; use **Hasher** where a structure supports it for O(1) key lookups with custom keys.

### LRU / TTL and overlap with cache.utils

**LRUCache** and **TTLCache** here are in-memory, sync structures. **@simpill/cache.utils** provides **InMemoryCache**, **TTLCache**, **memoizeAsync**, and Redis-style adapters with a different API (get/set/delete). Use **collections.utils** when you want these data structures as building blocks; use **cache.utils** when you want a cache abstraction with optional async backends and memoization.

### LRU/TTL performance notes

**LRUCache**: get/set and eviction are O(1). **TTLCache**: expired entries are pruned on **get()**, **set()**, and when reading **size**, so growth is bounded by reads or writes. Prefer **maxSize** with TTLCache when you want a cap in addition to TTL.

### What we don't provide

- **Priority queue / heap** — No PQ or heap; use a dedicated library.
- **Sorted map / sorted set** — No order-by-key structures; use **OrderedMap** for insertion order or an external sorted collection.
- **Immutable / persistent structures** — All structures are mutable; for immutability use a library (e.g. immutable.js).
- **Thread-safety** — Single-threaded JS only; use message passing or primitives for cross-worker state.

## Development

```bash
npm run build
npm test
npm run test:coverage
npm run check:fix
npm run verify
```

## Documentation

- **Examples:** [examples/](./examples/) — run with `npx ts-node examples/01-basic-usage.ts`.
- **Monorepo:** [CONTRIBUTING](https://github.com/SkinnnyJay/simpill/blob/main/CONTRIBUTING.md) for creating and maintaining packages.
- **README standard:** [Package README standard](https://github.com/SkinnnyJay/simpill/blob/main/docs/PACKAGE_README_STANDARD.md).

## License

ISC

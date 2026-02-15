# @simpill/collections.utils

## Structure

- `src/shared/contracts.ts` – ICollection, IIndexable, Equatable, Hasher
- `src/shared/collections/` – LinkedList, Vector, Deque, Queue, Stack, CircularBuffer, LRUCache, TTLCache, MultiMap, BiMap, OrderedMap, TypedSet
- All code is runtime-agnostic and lives in `shared/`; `client/` and `server/` re-export from shared

## Conventions

- 400 line max per file
- 80%+ test coverage
- Use shared contracts (ICollection, IIndexable) where applicable

/**
 * @simpill/annotations.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import {
  createMetadataStore,
  getMetadata,
  globalMetadataStore,
  setMetadata,
} from "@simpill/annotations.utils";

// Use the global store or create your own
const store = createMetadataStore();

const VERSION_KEY = Symbol("version");
const TAGS_KEY = "tags";

setMetadata(VERSION_KEY, "1.0.0", store);
setMetadata(TAGS_KEY, ["util", "metadata"], store);

console.log(getMetadata<string>(VERSION_KEY, store)); // "1.0.0"
console.log(getMetadata<string[]>(TAGS_KEY, store)); // ["util", "metadata"]
console.log(store.has(VERSION_KEY)); // true
store.delete(TAGS_KEY);
console.log(store.has(TAGS_KEY)); // false

// Global store (no store argument)
setMetadata("app:name", "my-app");
console.log(getMetadata<string>("app:name")); // "my-app"
console.log(globalMetadataStore.has("app:name")); // true

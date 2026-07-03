/**
 * @simpill/factories.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { createFactory, errorFactory, singletonFactory } from "@simpill/factories.utils";

// createFactory: typed factory with defaults
const createUser = createFactory({ id: 0, name: "Anonymous", active: true });
const u1 = createUser();
const u2 = createUser({ name: "Alice", id: 1 });
console.log("createUser():", u1);
console.log("createUser({ name: 'Alice', id: 1 }):", u2);

// singletonFactory: lazy single instance
const getConfig = singletonFactory(() => ({ env: "dev", port: 3000 }));
const config1 = getConfig();
const config2 = getConfig();
console.log("getConfig() === getConfig():", config1 === config2);

// errorFactory: consistent error creation
const createNotFound = errorFactory(Error, "Not found", "NOT_FOUND");
const err = createNotFound("User 123");
console.log("errorFactory:", err.message, (err as Error & { code?: string }).code);

// function defaults: fresh nested state per build + auto sequence
const createPost = createFactory(({ sequence }) => ({ id: sequence, tags: [] as string[] }));
const posts = createPost.buildList(3, (i) => ({ tags: [`tag-${i}`] }));
console.log(
  "buildList ids:",
  posts.map((p) => p.id)
); // [1, 2, 3]

// derived factories
const createAdmin = createUser.extend({ name: "Admin" });
console.log("extend:", createAdmin());

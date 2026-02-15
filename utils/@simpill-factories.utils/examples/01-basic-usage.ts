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

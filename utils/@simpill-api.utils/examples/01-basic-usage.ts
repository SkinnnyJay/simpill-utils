/**
 * @simpill/api.utils - Basic usage
 *
 * Run: npx ts-node examples/01-basic-usage.ts
 */

import { createApiFactory, TIMEOUT_MS_5000 } from "@simpill/api.utils";
import { z } from "zod";

// Define API with Zod schemas
const api = createApiFactory({ baseUrl: "https://jsonplaceholder.typicode.com" })
  .route("/users/:id", "getUser")
  .get({
    params: z.object({ id: z.string() }),
    response: z.object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    }),
  })
  .route("/users", "listUsers")
  .get({
    response: z.array(z.object({ id: z.number(), name: z.string(), email: z.string() })),
  });

// Typed fetch client
const client = api.client({
  baseUrl: "https://jsonplaceholder.typicode.com",
  timeoutMs: TIMEOUT_MS_5000,
  retry: { maxRetries: 2, delayMs: 100 },
});

async function main() {
  const user = await client.getUser({ params: { id: "1" } });
  console.log("getUser(1):", user?.name);

  const users = await client.listUsers({});
  console.log("listUsers count:", Array.isArray(users) ? users.length : 0);
}

main().catch(console.error);

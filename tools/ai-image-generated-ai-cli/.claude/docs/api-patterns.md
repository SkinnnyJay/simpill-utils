# API Route Patterns (reference)

API route patterns using createHandler/createGetHandler with admin auth and rate limiting. For use in applications that have `app/api/` and the referenced handler layer; not applicable to the @simpill utils monorepo.

## Preferred: Handler Factories

Use `createHandler` / `createGetHandler` from `app/api/_lib/api-handler.ts`:

```typescript
import { createGetHandler, createHandler } from "@/app/api/_lib/api-handler";
import { z } from "zod";

const BodySchema = z.object({ name: z.string() });

export const GET = createGetHandler(
  async (req, { userId }) => {
    return { data: [] };
  },
  { requireAdmin: true }
);

export const POST = createHandler<z.infer<typeof BodySchema>>(
  async (req, body, { userId }) => {
    return { success: true };
  },
  { requireAdmin: true, schema: BodySchema }
);
```

## Handler Options

| Option | Type | Description |
|--------|------|-------------|
| `requireAdmin` | `boolean` | Admin role required (implies `requireAuth`) |
| `requireAuth` | `boolean` | Authenticated user required |
| `rateLimit` | `"general" \| "polling" \| "expensive" \| RateLimitConfig` | Rate limiting |
| `schema` | `ZodSchema` | Body validation schema |

## Manual Auth (SSE/Streaming Only)

Use manual pattern only when you need a custom `Response` object:

```typescript
import { getCurrentUserId } from "@/lib/features/auth/get-session";
import { isAdmin } from "@/lib/features/auth/is-admin";
import { checkRateLimit } from "@/app/api/_lib/api-handler";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResult = checkRateLimit(request, "polling", userId);
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}
```

## Service Layer Integration

Prefer calling services over direct Prisma access:

```typescript
import { getChatService } from "@/lib/services";

const chatService = getChatService();
const chat = await chatService.createForUser(userId, body);
```

## Post-Operation Hooks

For routes not yet on services, fire hooks manually:

```typescript
import { postOperationHooks } from "@/lib/features/hooks";

postOperationHooks.run("chat.create", {
  userId, resourceType: "chat", resourceId: chat.id,
  data: { title: chat.title },
});
```

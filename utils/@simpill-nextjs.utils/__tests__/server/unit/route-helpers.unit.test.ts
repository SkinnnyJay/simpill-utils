/**
 * @file route-helpers unit tests
 */

import { z } from "zod";
import {
  errorResponse,
  getSearchParamsFromRequest,
  jsonResponse,
  parseSearchParams,
} from "../../../src/server/route-helpers";

describe("getSearchParamsFromRequest", () => {
  it("uses nextUrl.searchParams when present", () => {
    const params = new URLSearchParams({ a: "1", b: "2" });
    const req = { nextUrl: { searchParams: params } };
    expect(getSearchParamsFromRequest(req).get("a")).toBe("1");
  });

  it("parses url when nextUrl absent", () => {
    const req = { url: "https://example.com?x=3" };
    expect(getSearchParamsFromRequest(req).get("x")).toBe("3");
  });

  it("returns empty URLSearchParams when neither present", () => {
    const req = {};
    expect(getSearchParamsFromRequest(req).get("any")).toBeNull();
  });
});

describe("parseSearchParams", () => {
  const Schema = z.object({ page: z.coerce.number().default(1), q: z.string().optional() });

  it("returns data when valid", () => {
    const req = { url: "https://e.com?page=2&q=hi" };
    const out = parseSearchParams(req, Schema);
    expect(out.success).toBe(true);
    if (out.success) {
      expect(out.data).toEqual({ page: 2, q: "hi" });
    }
  });

  it("returns error when invalid", () => {
    const req = { url: "https://e.com?page=not-a-number" };
    const out = parseSearchParams(req, Schema);
    expect(out.success).toBe(false);
    if (!out.success) expect(out.error).toBeDefined();
  });
});

describe("jsonResponse", () => {
  it("returns Response with JSON body and status", async () => {
    const res = jsonResponse({ ok: true }, 200);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("merges custom init and headers", () => {
    const res = jsonResponse({ x: 1 }, 201, {
      headers: { "X-Custom": "y" },
    });
    expect(res.status).toBe(201);
    expect(res.headers.get("X-Custom")).toBe("y");
  });
});

describe("errorResponse", () => {
  it("returns Response with error payload for 5xx", async () => {
    const res = errorResponse(new Error("bad"), 500);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error).toBeDefined();
    expect(body.error.message).toBe("bad");
  });

  it("returns simple error message for 4xx", async () => {
    const res = errorResponse(new Error("forbidden"), 403);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("forbidden");
  });
});

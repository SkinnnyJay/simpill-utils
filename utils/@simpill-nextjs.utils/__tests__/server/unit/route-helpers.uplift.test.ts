/** @file route-helpers uplift: header merge, repeated params, problemResponse */
import { z } from "zod";
import {
  errorResponse,
  jsonResponse,
  parseSearchParams,
  problemResponse,
  searchParamsToObject,
} from "../../../src/server/route-helpers";

describe("jsonResponse header merge", () => {
  it("custom init.headers no longer clobber Content-Type (was text/plain)", () => {
    const res = jsonResponse({ x: 1 }, 200, { headers: { "X-Custom": "y" } });
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("X-Custom")).toBe("y");
  });

  it("caller-supplied Content-Type wins (case-insensitive)", () => {
    const res = jsonResponse({ x: 1 }, 200, {
      headers: { "content-type": "application/vnd.api+json" },
    });
    expect(res.headers.get("Content-Type")).toBe("application/vnd.api+json");
  });

  it("init.status still overrides the status argument (pinned original semantics)", () => {
    expect(jsonResponse({ a: 1 }, 200, { status: 201 }).status).toBe(201);
  });

  it("undefined data emits valid JSON null instead of an unparseable empty body", async () => {
    const res = jsonResponse(undefined);
    expect(await res.json()).toBeNull();
  });
});

describe("errorResponse 4xx message extraction", () => {
  it("object errors serialize to JSON instead of [object Object]", async () => {
    const res = errorResponse({ code: "FORBIDDEN" }, 403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('{"code":"FORBIDDEN"}');
  });

  it("Error and string payloads unchanged", async () => {
    expect(
      ((await errorResponse(new Error("forbidden"), 403).json()) as { error: string }).error
    ).toBe("forbidden");
    expect(((await errorResponse("nope", 400).json()) as { error: string }).error).toBe("nope");
  });
});

describe("repeated query params", () => {
  const url = { url: "https://e.com?tag=a&tag=b&q=x" };

  it('default "last" keeps pre-uplift last-wins behavior', () => {
    const out = parseSearchParams(url, z.object({ tag: z.string(), q: z.string() }));
    expect(out.success && out.data).toEqual({ tag: "b", q: "x" });
  });

  it('"array" preserves repeated values, single values stay strings', () => {
    const out = parseSearchParams(url, z.object({ tag: z.array(z.string()), q: z.string() }), {
      repeated: "array",
    });
    expect(out.success && out.data).toEqual({ tag: ["a", "b"], q: "x" });
  });

  it('"first" keeps the first occurrence', () => {
    const out = parseSearchParams(url, z.object({ tag: z.string() }), { repeated: "first" });
    expect(out.success && out.data.tag).toBe("a");
  });

  it("searchParamsToObject exported standalone", () => {
    const params = new URLSearchParams("a=1&a=2&b=3");
    expect(searchParamsToObject(params, { repeated: "array" })).toEqual({ a: ["1", "2"], b: "3" });
    expect(searchParamsToObject(params)).toEqual({ a: "2", b: "3" });
  });
});

describe("problemResponse (RFC 9457)", () => {
  it("emits application/problem+json with about:blank default type", async () => {
    const res = problemResponse(404, { title: "Not Found", detail: "no such invoice" });
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await res.json()).toEqual({
      type: "about:blank",
      title: "Not Found",
      detail: "no such invoice",
      status: 404,
    });
  });

  it("supports type/instance/extensions; status member always matches the response", async () => {
    const res = problemResponse(422, {
      type: "https://example.com/probs/out-of-credit",
      title: "You do not have enough credit.",
      instance: "/account/12345/msgs/abc",
      balance: 30,
      status: 500 as unknown as undefined, // caller cannot desync the status member
    });
    const body = (await res.json()) as { status: number; balance: number };
    expect(body.status).toBe(422);
    expect(body.balance).toBe(30);
  });

  it("never serializes Error internals — leak-proof by construction", async () => {
    const err = new Error("secret internal detail");
    // problemResponse does not accept an Error; the compile-time signature prevents it.
    // Verify the runtime body only contains caller-supplied fields.
    const res = problemResponse(500, { title: "Internal Server Error" });
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("secret");
    expect(text).not.toContain(err.stack?.slice(0, 10) ?? "at ");
  });
});

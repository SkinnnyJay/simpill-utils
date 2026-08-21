import { getRequestContext } from "@simpill/request-context.utils";
import {
  createCorrelationMiddleware,
  sanitizeCorrelationId,
} from "../../../src/server/correlation-middleware";

describe("createCorrelationMiddleware", () => {
  it("sets requestId and traceId in context and calls next", async () => {
    const middleware = createCorrelationMiddleware();
    const req = { headers: {} };
    const res = { setHeader: jest.fn() };
    const next = jest.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith("x-trace-id", expect.any(String));
  });

  it("uses requestId from header when provided", async () => {
    const middleware = createCorrelationMiddleware();
    const req = { headers: { "x-request-id": "existing-id" } };
    const res = { setHeader: jest.fn() };
    let capturedContext: unknown;
    const next = jest.fn().mockImplementation(() => {
      capturedContext = getRequestContext();
      return Promise.resolve();
    });

    await middleware(req, res, next);

    expect(capturedContext).toEqual(
      expect.objectContaining({ requestId: "existing-id", traceId: "existing-id" }),
    );
  });

  it("uses custom generateRequestId when provided", async () => {
    const generateRequestId = jest.fn().mockReturnValue("custom-id");
    const middleware = createCorrelationMiddleware({ generateRequestId });
    const req = { headers: {} };
    const res = { setHeader: jest.fn() };
    const next = jest.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(generateRequestId).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith(expect.any(String), "custom-id");
  });

  it("rejects a correlation ID containing CRLF (header injection attempt) and generates a new one", async () => {
    const generateRequestId = jest.fn().mockReturnValue("safe-generated-id");
    const middleware = createCorrelationMiddleware({ generateRequestId });
    const req = { headers: { "x-request-id": "id\r\nX-Injected: evil" } };
    const res = { setHeader: jest.fn() };
    const next = jest.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(generateRequestId).toHaveBeenCalledTimes(1);
    const calls = res.setHeader.mock.calls as [string, string][];
    const requestIdCall = calls.find(([name]) => name === "x-request-id");
    expect(requestIdCall).toBeDefined();
    expect(requestIdCall?.[1]).toBe("safe-generated-id");
  });

  it("rejects a correlation ID containing special characters", async () => {
    const middleware = createCorrelationMiddleware();
    const req = { headers: { "x-request-id": "<script>alert(1)</script>" } };
    const res = { setHeader: jest.fn() };
    let capturedContext: unknown;
    const next = jest.fn().mockImplementation(() => {
      capturedContext = getRequestContext();
      return Promise.resolve();
    });

    await middleware(req, res, next);

    const ctx = capturedContext as { requestId: string };
    expect(ctx.requestId).not.toContain("<script>");
    expect(ctx.requestId).toMatch(/^[a-zA-Z0-9\-_]+$/);
  });

  it("accepts a valid UUID-format correlation ID", async () => {
    const middleware = createCorrelationMiddleware();
    const validUuid = "550e8400-e29b-41d4-a716-446655440000";
    const req = { headers: { "x-request-id": validUuid } };
    const res = { setHeader: jest.fn() };
    let capturedContext: unknown;
    const next = jest.fn().mockImplementation(() => {
      capturedContext = getRequestContext();
      return Promise.resolve();
    });

    await middleware(req, res, next);

    expect((capturedContext as { requestId: string }).requestId).toBe(validUuid);
  });
});

describe("sanitizeCorrelationId", () => {
  it("returns the value when it matches the safe pattern", () => {
    expect(sanitizeCorrelationId("abc-123_XYZ")).toBe("abc-123_XYZ");
  });

  it("returns undefined for null input", () => {
    expect(sanitizeCorrelationId(null)).toBeUndefined();
  });

  it("returns undefined for undefined input", () => {
    expect(sanitizeCorrelationId(undefined)).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(sanitizeCorrelationId("")).toBeUndefined();
  });

  it("returns undefined for CRLF injection attempt", () => {
    expect(sanitizeCorrelationId("id\r\nX-Evil: yes")).toBeUndefined();
  });

  it("returns undefined for values with spaces", () => {
    expect(sanitizeCorrelationId("id with spaces")).toBeUndefined();
  });

  it("returns undefined for values exceeding 128 characters", () => {
    expect(sanitizeCorrelationId("a".repeat(129))).toBeUndefined();
  });

  it("accepts exactly 128 characters", () => {
    const value = "a".repeat(128);
    expect(sanitizeCorrelationId(value)).toBe(value);
  });

  it("returns undefined for values containing angle brackets", () => {
    expect(sanitizeCorrelationId("<script>")).toBeUndefined();
  });
});

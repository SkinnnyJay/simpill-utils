import { AppError } from "../../../src/shared/app-error";
import {
  createErrorFromCode,
  ERROR_CODES,
  errorCodeFromStatus,
  HTTP_STATUS_BY_CODE,
  httpStatusFromCode,
} from "../../../src/shared/error-codes";
import { PROBLEM_JSON_CONTENT_TYPE, toProblemDetails } from "../../../src/shared/problem-details";

describe("HTTP mapping uplift", () => {
  describe("createErrorFromCode (previously referenced in docs but nonexistent)", () => {
    it("creates AppError with default message", () => {
      const err = createErrorFromCode("NOT_FOUND");
      expect(err).toBeInstanceOf(AppError);
      expect(err.code).toBe("NOT_FOUND");
      expect(err.message).toBe("Not found");
    });

    it("honors message override, custom map, meta and cause", () => {
      const cause = new Error("db");
      const withMap = createErrorFromCode("NOT_FOUND", {
        messages: { ...HTTP_STATUS_BY_CODE, NOT_FOUND: "Resource not found" } as never,
      });
      expect(withMap.message).toBe("Resource not found");
      const err = createErrorFromCode("CONFLICT", { message: "dupe", meta: { id: 1 }, cause });
      expect(err.message).toBe("dupe");
      expect(err.meta).toEqual({ id: 1 });
      expect(err.cause).toBe(cause);
    });
  });

  describe("httpStatusFromCode / errorCodeFromStatus", () => {
    it("maps every ERROR_CODES member to a status", () => {
      for (const code of Object.values(ERROR_CODES)) {
        const status = httpStatusFromCode(code);
        expect(status).toBeGreaterThanOrEqual(400);
        expect(status).toBeLessThan(600);
      }
    });

    it("VALIDATION is 422 (semantic) and BAD_REQUEST is 400 (syntactic)", () => {
      expect(httpStatusFromCode("VALIDATION")).toBe(422);
      expect(httpStatusFromCode("BAD_REQUEST")).toBe(400);
    });

    it("unknown code falls back", () => {
      expect(httpStatusFromCode("NOPE")).toBe(500);
      expect(httpStatusFromCode("NOPE", 503)).toBe(503);
    });

    it("status -> code is consistent with code -> status where unambiguous", () => {
      expect(errorCodeFromStatus(404)).toBe("NOT_FOUND");
      expect(errorCodeFromStatus(408)).toBe("TIMEOUT");
      expect(errorCodeFromStatus(504)).toBe("TIMEOUT");
      expect(errorCodeFromStatus(418)).toBe("BAD_REQUEST"); // unmapped 4xx
      expect(errorCodeFromStatus(502)).toBe("INTERNAL"); // unmapped 5xx
    });
  });

  describe("toProblemDetails (RFC 9457)", () => {
    it("derives status/title from the error code and never includes stack or cause", () => {
      const err = new AppError("User 7 does not exist", {
        code: "NOT_FOUND",
        cause: new Error("SELECT returned 0 rows"),
      });
      const problem = toProblemDetails(err, { instance: "/users/7" });
      expect(problem).toEqual({
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "User 7 does not exist",
        instance: "/users/7",
        code: "NOT_FOUND",
      });
      const json = JSON.stringify(problem);
      expect(json).not.toContain("SELECT"); // cause never leaks
      expect(json).not.toContain("at "); // stack never leaks
    });

    it("meta is opt-in and sanitized (circular meta stays JSON-safe)", () => {
      const meta: Record<string, unknown> = { requestId: "r1" };
      meta.self = meta;
      const err = new AppError("bad", { code: "VALIDATION", meta });
      expect(toProblemDetails(err).meta).toBeUndefined();
      const withMeta = toProblemDetails(err, { includeMeta: true });
      expect(withMeta.status).toBe(422);
      expect((withMeta.meta as Record<string, unknown>).requestId).toBe("r1");
      expect(() => JSON.stringify(withMeta)).not.toThrow();
    });

    it("non-AppError values get a sane 500 problem", () => {
      const problem = toProblemDetails("kaput");
      expect(problem.status).toBe(500);
      expect(problem.title).toBe("Internal Server Error");
      expect(problem.detail).toBe("kaput");
      expect(problem.code).toBe("INTERNAL");
    });

    it("status override wins and content type constant is correct", () => {
      const problem = toProblemDetails(new AppError("x", { code: "NOT_FOUND" }), { status: 410 });
      expect(problem.status).toBe(410);
      expect(PROBLEM_JSON_CONTENT_TYPE).toBe("application/problem+json");
    });
  });
});

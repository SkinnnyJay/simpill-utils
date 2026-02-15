import {
  CORRELATION_HEADERS,
  ENV_BOOLEAN_PARSING,
  HTTP_METHOD,
  LOG_ENV_KEYS,
  LOG_FORMAT_VALUES,
} from "../../../src/shared";

describe("protocols.utils", () => {
  describe("HTTP_METHOD", () => {
    it("exports standard methods", () => {
      expect(HTTP_METHOD.GET).toBe("GET");
      expect(HTTP_METHOD.POST).toBe("POST");
      expect(HTTP_METHOD.PUT).toBe("PUT");
      expect(HTTP_METHOD.PATCH).toBe("PATCH");
      expect(HTTP_METHOD.DELETE).toBe("DELETE");
    });
  });

  describe("CORRELATION_HEADERS", () => {
    it("exports request-id and trace-id header names", () => {
      expect(CORRELATION_HEADERS.REQUEST_ID).toBe("x-request-id");
      expect(CORRELATION_HEADERS.TRACE_ID).toBe("x-trace-id");
    });
  });

  describe("ENV_BOOLEAN_PARSING", () => {
    it("has strict truthy and falsy sets", () => {
      expect(ENV_BOOLEAN_PARSING.TRUTHY).toEqual(["true", "1"]);
      expect(ENV_BOOLEAN_PARSING.FALSY).toEqual(["false", "0"]);
    });
  });

  describe("LOG_ENV_KEYS", () => {
    it("exports logger env key names", () => {
      expect(LOG_ENV_KEYS.LOG_LEVEL).toBe("LOG_LEVEL");
      expect(LOG_ENV_KEYS.LOG_FORMAT).toBe("LOG_FORMAT");
    });
  });

  describe("LOG_FORMAT_VALUES", () => {
    it("exports json and pretty", () => {
      expect(LOG_FORMAT_VALUES.JSON).toBe("json");
      expect(LOG_FORMAT_VALUES.PRETTY).toBe("pretty");
    });
  });
});

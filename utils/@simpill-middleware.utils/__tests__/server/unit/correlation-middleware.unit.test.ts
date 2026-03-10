import { getRequestContext } from "@simpill/request-context.utils";
import { createCorrelationMiddleware } from "../../../src/server/correlation-middleware";

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
});

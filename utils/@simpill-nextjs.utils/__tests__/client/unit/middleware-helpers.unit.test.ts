/**
 * @file middleware-helpers (withCorrelation) unit tests
 */

import { withCorrelation } from "../../../src/client/middleware-helpers";

describe("withCorrelation", () => {
  it("reads request-id and trace-id from headers", () => {
    const request = {
      headers: new Headers({
        "x-request-id": "r1",
        "x-trace-id": "t1",
      }),
    };
    const out = withCorrelation(request);
    expect(out["x-request-id"]).toBe("r1");
    expect(out["x-trace-id"]).toBe("t1");
  });

  it("generates ids when headers missing", () => {
    const request = { headers: new Headers() };
    const out = withCorrelation(request);
    expect(out["x-request-id"]).toBeDefined();
    expect(out["x-trace-id"]).toBeDefined();
  });
});

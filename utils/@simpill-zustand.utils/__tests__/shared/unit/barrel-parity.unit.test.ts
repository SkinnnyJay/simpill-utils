import * as client from "../../../src/client";
import * as root from "../../../src/index";
import * as server from "../../../src/server";
import * as shared from "../../../src/shared";

/**
 * Barrel parity: everything the client entry exports must be reachable from
 * the root entry, and the server entry must expose the full shared surface
 * plus the in-memory storage its doc comment always promised.
 * (Same guard class as misc PR #21 / adapters PR #26 barrel omissions.)
 */
describe("barrel parity", () => {
  it("root re-exports every client value export", () => {
    const clientKeys = Object.keys(client);
    const rootKeys = new Set(Object.keys(root));
    const missing = clientKeys.filter((k) => !rootKeys.has(k));
    expect(missing).toEqual([]);
  });

  it("server exposes the shared surface", () => {
    const sharedKeys = Object.keys(shared);
    const serverKeys = new Set(Object.keys(server));
    const missing = sharedKeys.filter((k) => !serverKeys.has(k));
    expect(missing).toEqual([]);
  });

  it("server exposes createInMemoryStorage (doc promise de-punted)", () => {
    expect(typeof server.createInMemoryStorage).toBe("function");
  });
});

import * as client from "../../../src/client";
import * as server from "../../../src/server";

describe("client entry mirrors the server API surface", () => {
  it("every server function export exists on the client entry", () => {
    const serverFns = Object.keys(server).filter(
      (k) => typeof (server as Record<string, unknown>)[k] === "function",
    );
    for (const name of serverFns) {
      if (name === "createRequestContextStore") continue; // server-only by design (needs ALS)
      expect(typeof (client as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("runWithRequestContext executes fn and resolves; sync throw rejects", async () => {
    await expect(client.runWithRequestContext({ requestId: "c" }, () => 7)).resolves.toBe(7);
    await expect(
      client.runWithRequestContext({ requestId: "c" }, () => {
        throw new Error("client-boom");
      }),
    ).rejects.toThrow("client-boom");
  });

  it("sync/child runs execute fn; getters undefined; mutators false; bind identity", () => {
    expect(client.runWithRequestContextSync({ requestId: "c" }, () => 1)).toBe(1);
    expect(client.runWithChildRequestContext({ userId: "u" }, () => 2)).toBe(2);
    expect(client.getRequestContext()).toBeUndefined();
    expect(client.getRequestContextValue("x")).toBeUndefined();
    expect(client.updateRequestContext({ userId: "u" })).toBe(false);
    expect(client.setRequestContextValue("x", 1)).toBe(false);
    const fn = () => 3;
    expect(client.bindRequestContext(fn)).toBe(fn);
  });

  it("requireRequestContext throws the shared typed error", () => {
    expect(() => client.requireRequestContext()).toThrow(client.RequestContextUnavailableError);
    expect(client.RequestContextUnavailableError).toBe(server.RequestContextUnavailableError);
  });
});

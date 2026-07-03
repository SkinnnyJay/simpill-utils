/**
 * Root, client, server, and shared entry points must expose the same
 * runtime surface — guards against the omitted-export drift class.
 */
import * as clientBarrel from "../../../src/client";
import * as rootBarrel from "../../../src/index";
import * as serverBarrel from "../../../src/server";
import * as sharedBarrel from "../../../src/shared";

const names = (mod: object): string[] => Object.keys(mod).sort();

describe("barrel parity", () => {
  it("root === shared", () => {
    expect(names(rootBarrel)).toEqual(names(sharedBarrel));
  });

  it("client === shared", () => {
    expect(names(clientBarrel)).toEqual(names(sharedBarrel));
  });

  it("server === shared", () => {
    expect(names(serverBarrel)).toEqual(names(sharedBarrel));
  });

  it("new surface is present", () => {
    const surface = names(sharedBarrel);
    for (const name of [
      "waitUntil",
      "WaitUntilTimeoutError",
      "DEFAULT_ALPHABET",
      "createSeededRandom",
      "deferred",
    ]) {
      expect(surface).toContain(name);
    }
  });
});

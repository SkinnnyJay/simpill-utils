import * as clientBarrel from "../../../src/client/index";
import * as rootBarrel from "../../../src/index";
import * as serverBarrel from "../../../src/server/index";
import * as sharedBarrel from "../../../src/shared/index";

describe("barrel parity", () => {
  const sharedKeys = Object.keys(sharedBarrel).sort();

  it("root barrel re-exports the full shared runtime surface", () => {
    expect(Object.keys(rootBarrel).sort()).toEqual(sharedKeys);
  });

  it("client barrel re-exports the full shared runtime surface", () => {
    expect(Object.keys(clientBarrel).sort()).toEqual(sharedKeys);
  });

  it("server barrel re-exports the full shared runtime surface", () => {
    expect(Object.keys(serverBarrel).sort()).toEqual(sharedKeys);
  });
});

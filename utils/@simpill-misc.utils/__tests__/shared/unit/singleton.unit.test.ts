describe("createSingleton", () => {
  beforeEach(() => {
    const { resetAllSingletons } = require("../../../src/shared");
    resetAllSingletons();
  });

  it("returns same instance on multiple calls", () => {
    const { createSingleton } = require("../../../src/shared");
    let n = 0;
    const getInstance = createSingleton(() => ({ id: ++n }), "test");
    expect(getInstance().id).toBe(1);
    expect(getInstance().id).toBe(1);
  });

  it("resetSingleton allows new instance", () => {
    const { createSingleton, resetSingleton } = require("../../../src/shared");
    let n = 0;
    const getInstance = createSingleton(() => ({ id: ++n }), "test");
    expect(getInstance().id).toBe(1);
    resetSingleton("test");
    expect(getInstance().id).toBe(2);
  });
});

import { withDevtools } from "../../../src/client";

describe("devtools client", () => {
  describe("withDevtools", () => {
    it("returns options with name when string passed", () => {
      const opts = withDevtools("MyStore");
      expect(opts.name).toBe("MyStore");
    });
    it("returns empty object when no arg", () => {
      const opts = withDevtools();
      expect(opts).toEqual({});
    });
    it("returns options when object passed", () => {
      const opts = withDevtools({ name: "App", enabled: false });
      expect(opts.name).toBe("App");
      expect(opts.enabled).toBe(false);
    });
  });
});

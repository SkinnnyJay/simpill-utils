import { getClientOnlyStorage, withPersist, withPersistClientOnly } from "../../../src/client";

describe("persist client", () => {
  describe("withPersist", () => {
    it("returns options with name and version", () => {
      const opts = withPersist("test-store", { version: 2 });
      expect(opts.name).toBe("test-store");
      expect(opts.version).toBe(2);
      expect(opts.storage).toBeDefined();
    });
    it("defaults version to 1", () => {
      const opts = withPersist<{ x: number }>("other");
      expect(opts.version).toBe(1);
    });
    it("uses session storage when storage option is session", () => {
      const opts = withPersist<{ x: number }>("session-store", { storage: "session" });
      expect(opts.storage).toBeDefined();
    });
  });

  describe("getClientOnlyStorage", () => {
    it("returns storage with getItem, setItem, removeItem", () => {
      const storage = getClientOnlyStorage(() => ({}) as Storage);
      expect(storage.getItem).toBeDefined();
      expect(storage.setItem).toBeDefined();
      expect(storage.removeItem).toBeDefined();
      expect(storage.getItem("x")).toBeNull();
    });
  });

  describe("withPersistClientOnly", () => {
    it("returns options with storage defined", () => {
      const opts = withPersistClientOnly<{ x: number }>("client-store");
      expect(opts.name).toBe("client-store");
      expect(opts.storage).toBeDefined();
    });

    it("returns options with session storage when requested", () => {
      const opts = withPersistClientOnly<{ x: number }>("s", {
        storage: "session",
      });
      expect(opts.storage).toBeDefined();
    });
  });
});

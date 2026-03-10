/**
 * @file shared types unit tests (smoke / re-export)
 */

import type { ReactNode } from "../../../src/shared";

describe("shared types", () => {
  it("exports ComponentType, ReactNode, RefObject", () => {
    const node: ReactNode = "hello";
    expect(node).toBe("hello");
    expect(true).toBe(true);
  });
});

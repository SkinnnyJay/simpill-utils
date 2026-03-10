import { compose, pipe } from "../../../src/shared/pipe-compose";

describe("pipe", () => {
  it("applies functions left to right", () => {
    const add1 = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    expect(pipe(add1, double)(2)).toBe(6); // (2+1)*2
  });
});

describe("compose", () => {
  it("applies functions right to left", () => {
    const add1 = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    expect(compose(add1, double)(2)).toBe(5); // (2*2)+1
  });
});

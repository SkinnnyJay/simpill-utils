import {
  addChild,
  createComposite,
  mapComposite,
  reduceComposite,
  removeChild,
  traverseComposite,
} from "../../../src/shared/composite";

describe("composite", () => {
  it("traverses and maps composite nodes", () => {
    const root = createComposite("root");
    const childA = createComposite("a");
    const childB = createComposite("b");
    addChild(root, childA);
    addChild(root, childB);

    const seen: string[] = [];
    traverseComposite(root, (node) => seen.push(node.value));
    expect(seen).toEqual(["root", "a", "b"]);

    const upper = mapComposite(root, (node) => node.value.toUpperCase());
    const values: string[] = [];
    traverseComposite(upper, (node) => values.push(node.value));
    expect(values).toEqual(["ROOT", "A", "B"]);
  });

  it("reduces and removes children", () => {
    const root = createComposite(1);
    const child = createComposite(2);
    addChild(root, child);

    const sum = reduceComposite(root, (acc, node) => acc + node.value, 0);
    expect(sum).toBe(3);

    expect(removeChild(root, child)).toBe(true);
    expect(removeChild(root, child)).toBe(false);
  });
});

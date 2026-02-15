import { composeGates, Semaphore } from "../../../src/shared/concurrency.utils";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("composeGates", () => {
  it("runs through all gates in order", async () => {
    const first = new Semaphore(1);
    const second = new Semaphore(1);
    const gate = composeGates([first, second]);
    let ran = false;

    await gate.run(async () => {
      await wait(5);
      ran = true;
    });

    expect(ran).toBe(true);
  });

  it("honors abort signal before run", async () => {
    const controller = new AbortController();
    controller.abort();
    const gate = composeGates([new Semaphore(1)]);

    await expect(
      gate.run(
        async () => {
          await wait(5);
        },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

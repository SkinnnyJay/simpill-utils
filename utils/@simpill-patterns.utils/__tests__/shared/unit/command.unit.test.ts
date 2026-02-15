import { createCommand, runCommand, runCommandWithUndo } from "../../../src/shared/command";

describe("command", () => {
  it("runs command execute", () => {
    const cmd = createCommand({
      execute: (input: number) => input * 2,
    });

    expect(runCommand(cmd, 4)).toBe(8);
  });

  it("provides undo when defined", () => {
    const undoSpy = jest.fn<void, [number, number]>();
    const cmd = createCommand({
      execute: (input: number) => input + 1,
      undo: undoSpy,
    });

    const execution = runCommandWithUndo(cmd, 9);
    expect(execution.result).toBe(10);
    expect(execution.undo).toBeDefined();
    execution.undo?.();
    expect(undoSpy).toHaveBeenCalledWith(9, 10);
  });
});

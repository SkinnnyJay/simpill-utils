import { createCommand, runCommand, runCommandWithUndo } from "../../../src/shared/command";

describe("command", () => {
  it("runs command execute", () => {
    const cmd = createCommand({
      execute: (input: number) => input * 2,
    });

    expect(runCommand(cmd, 4)).toBe(8);
  });

  it("returns only result when undo is not defined", () => {
    const cmd = createCommand({
      execute: (input: number) => input * 2,
    });
    const execution = runCommandWithUndo(cmd, 3);
    expect(execution.result).toBe(6);
    expect(execution.undo).toBeUndefined();
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

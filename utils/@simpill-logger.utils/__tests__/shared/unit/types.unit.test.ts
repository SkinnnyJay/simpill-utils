/**
 * @file Types Unit Tests
 * @description Tests for shared logger types and utility functions
 */

import { LOG_LEVEL } from "../../../src/shared/constants";
import { LOG_LEVEL_PRIORITY, shouldLog } from "../../../src/shared/types";

describe("LOG_LEVEL_PRIORITY", () => {
  it("should have DEBUG as lowest priority (0)", () => {
    expect(LOG_LEVEL_PRIORITY.DEBUG).toBe(0);
  });

  it("should have INFO as second priority (1)", () => {
    expect(LOG_LEVEL_PRIORITY.INFO).toBe(1);
  });

  it("should have WARN as third priority (2)", () => {
    expect(LOG_LEVEL_PRIORITY.WARN).toBe(2);
  });

  it("should have ERROR as highest priority (3)", () => {
    expect(LOG_LEVEL_PRIORITY.ERROR).toBe(3);
  });

  it("should have priorities in ascending order", () => {
    expect(LOG_LEVEL_PRIORITY.DEBUG).toBeLessThan(LOG_LEVEL_PRIORITY.INFO);
    expect(LOG_LEVEL_PRIORITY.INFO).toBeLessThan(LOG_LEVEL_PRIORITY.WARN);
    expect(LOG_LEVEL_PRIORITY.WARN).toBeLessThan(LOG_LEVEL_PRIORITY.ERROR);
  });
});

describe("shouldLog", () => {
  describe("when minLevel is DEBUG", () => {
    it("should log DEBUG messages", () => {
      expect(shouldLog(LOG_LEVEL.DEBUG, LOG_LEVEL.DEBUG)).toBe(true);
    });

    it("should log INFO messages", () => {
      expect(shouldLog(LOG_LEVEL.INFO, LOG_LEVEL.DEBUG)).toBe(true);
    });

    it("should log WARN messages", () => {
      expect(shouldLog(LOG_LEVEL.WARN, LOG_LEVEL.DEBUG)).toBe(true);
    });

    it("should log ERROR messages", () => {
      expect(shouldLog(LOG_LEVEL.ERROR, LOG_LEVEL.DEBUG)).toBe(true);
    });
  });

  describe("when minLevel is INFO", () => {
    it("should not log DEBUG messages", () => {
      expect(shouldLog(LOG_LEVEL.DEBUG, LOG_LEVEL.INFO)).toBe(false);
    });

    it("should log INFO messages", () => {
      expect(shouldLog(LOG_LEVEL.INFO, LOG_LEVEL.INFO)).toBe(true);
    });

    it("should log WARN messages", () => {
      expect(shouldLog(LOG_LEVEL.WARN, LOG_LEVEL.INFO)).toBe(true);
    });

    it("should log ERROR messages", () => {
      expect(shouldLog(LOG_LEVEL.ERROR, LOG_LEVEL.INFO)).toBe(true);
    });
  });

  describe("when minLevel is WARN", () => {
    it("should not log DEBUG messages", () => {
      expect(shouldLog(LOG_LEVEL.DEBUG, LOG_LEVEL.WARN)).toBe(false);
    });

    it("should not log INFO messages", () => {
      expect(shouldLog(LOG_LEVEL.INFO, LOG_LEVEL.WARN)).toBe(false);
    });

    it("should log WARN messages", () => {
      expect(shouldLog(LOG_LEVEL.WARN, LOG_LEVEL.WARN)).toBe(true);
    });

    it("should log ERROR messages", () => {
      expect(shouldLog(LOG_LEVEL.ERROR, LOG_LEVEL.WARN)).toBe(true);
    });
  });

  describe("when minLevel is ERROR", () => {
    it("should not log DEBUG messages", () => {
      expect(shouldLog(LOG_LEVEL.DEBUG, LOG_LEVEL.ERROR)).toBe(false);
    });

    it("should not log INFO messages", () => {
      expect(shouldLog(LOG_LEVEL.INFO, LOG_LEVEL.ERROR)).toBe(false);
    });

    it("should not log WARN messages", () => {
      expect(shouldLog(LOG_LEVEL.WARN, LOG_LEVEL.ERROR)).toBe(false);
    });

    it("should log ERROR messages", () => {
      expect(shouldLog(LOG_LEVEL.ERROR, LOG_LEVEL.ERROR)).toBe(true);
    });
  });
});
